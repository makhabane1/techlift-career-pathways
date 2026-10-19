// TechLift server: serves the static site, manages learner and mentor accounts,
// and stores the shared records with rules about who may change what.
//
// Run: node server/server.js   then open http://127.0.0.1:3000
//
// Dependencies: none. Data is kept in one JSON file (data/techlift-data.json).
// Sessions are kept in memory, so restarting the server signs everyone out.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const TechLiftChallenges = require("../js/challenge-library.js");
const TechLiftCareers = require("../js/careers-data.js");

const scrypt = promisify(crypto.scrypt);
const ROOT = path.resolve(__dirname, "..");
const DATA_FILE =
  process.env.TECHLIFT_DATA_FILE ||
  path.join(ROOT, "data", "techlift-data.json");
const SESSION_COOKIE = "techlift_session";
const SESSION_DAYS = 7;
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_PHOTO_CHARS = 1.5 * 1024 * 1024;
const TRACKS = Object.keys(TechLiftChallenges.tracks);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMISSION_KEY = /^techliftChallenge:([a-f0-9]{16})::([a-z]+-[a-z]+)$/;
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
// Folders that hold code or data and are never served.
const BLOCKED_PREFIXES = ["server/", "data/", "node_modules/", ".git/"];

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, message) => {
  throw new HttpError(status, message);
};

// ---- Validation helpers ------------------------------------------------

const text = (value, max, label) => {
  if (typeof value !== "string") fail(400, `${label} must be text`);
  const trimmed = value.trim();
  if (trimmed.length > max) fail(400, `${label} is too long`);
  return trimmed;
};

const validRubric = (rubric, skills) => {
  if (!Array.isArray(rubric)) fail(400, "Rubric must be a list");
  return skills.map((skill) => {
    const item = rubric.find((entry) => entry && entry.skill === skill);
    if (!item) fail(400, `Score ${skill} before saving`);
    const score = Number(item.score);
    if (!Number.isInteger(score) || score < 1 || score > 4)
      fail(400, "Scores must be 1 to 4");
    return { skill, score, note: text(item.note || "", 300, "Note") };
  });
};

const validPhoto = (photo) => {
  if (!photo) return "";
  if (typeof photo !== "string" || photo.length > MAX_PHOTO_CHARS)
    fail(400, "Photo is too large");
  if (!/^data:image\/(png|jpeg|webp);base64,/i.test(photo))
    fail(400, "Photo must be PNG, JPEG, or WebP");
  return photo;
};

// ---- Data --------------------------------------------------------------

// Notifications are short messages for one account. The newest are kept.
const NOTIFICATION_LIMIT = 50;
const notify = (data, accountId, message, link) => {
  if (!accountId) return;
  const list = data.notifications[accountId] || [];
  data.notifications[accountId] = [
    ...list,
    {
      id: crypto.randomBytes(6).toString("hex"),
      message,
      link,
      createdAt: new Date().toISOString(),
      read: false,
    },
  ].slice(-NOTIFICATION_LIMIT);
};

const emptyData = () => ({
  accounts: [],
  learnerProfiles: {},
  mentorProfiles: {},
  submissions: {},
  peerReviews: [],
  notifications: {},
});

const loadData = (file) => {
  try {
    return { ...emptyData(), ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch (error) {
    if (error.code === "ENOENT") return emptyData();
    throw error;
  }
};

const createPersister = (file) => {
  let queue = Promise.resolve();
  return (data) => {
    queue = queue.then(async () => {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      const temp = `${file}.tmp`;
      await fs.promises.writeFile(temp, JSON.stringify(data, null, 2));
      await fs.promises.rename(temp, file);
    });
    return queue;
  };
};

// ---- Accounts and sessions ---------------------------------------------

const hashPassword = async (
  password,
  salt = crypto.randomBytes(16).toString("hex"),
) => {
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return { salt, hash };
};

const passwordMatches = async (password, account) => {
  const { hash } = await hashPassword(password, account.salt);
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(account.passwordHash, "hex"),
  );
};

const publicAccount = (account) => ({
  id: account.id,
  email: account.email,
  name: account.name,
  role: account.role,
});

const cookieValue = (request, name) => {
  for (const part of (request.headers.cookie || "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
};

// ---- Records shown to each role ----------------------------------------

const publicMentor = (profile) => ({
  id: profile.id,
  name: profile.name,
  role: profile.role,
  bio: profile.bio,
  degrees: profile.degrees,
  certifications: profile.certifications,
  experience: profile.experience,
  expertise: profile.expertise,
  photo: profile.photo,
});

// Learners see peers' work without email, history, or review.
const peerView = (record) => ({
  challengeId: record.challengeId,
  challenge: record.challenge,
  path: record.path,
  fullName: record.fullName,
  description: record.description,
  url: record.url,
  submittedAt: record.submittedAt,
  round: record.round,
});

// Mentors see learners by name only.
const mentorView = (record) => {
  const { email, ...rest } = record;
  return rest;
};

const publicPortfolio = (data, shareId) => {
  const entry = Object.entries(data.learnerProfiles).find(
    ([, profile]) =>
      profile.portfolio?.published && profile.portfolio.shareId === shareId,
  );
  if (!entry) return null;

  const [accountId, profile] = entry;
  const portfolio = profile.portfolio;
  const account = data.accounts.find((item) => item.id === accountId);
  if (!account) return null;

  const reviewedProjects = Object.entries(data.submissions)
    .filter(([key]) => key.startsWith(`techliftChallenge:${accountId}::`))
    .flatMap(([, submission]) =>
      [...(submission.history || []), submission]
        .filter((round) => round.review?.status === "approved")
        .map((round) => ({
          id: `challenge-${submission.challengeId}-${round.round}`,
          title: submission.challenge,
          description: round.description,
          problem: "",
          contribution: "",
          learning: "",
          technologies: [],
          url: round.url || "",
          imageUrl: "",
          source: "mentor-reviewed",
          reviewedAt: round.review.reviewedAt,
          mentor: round.review.reviewerName || "Mentor",
          skills: (round.review.rubric || [])
            .filter((item) => Number(item.score) >= 3)
            .map((item) => ({ skill: item.skill, score: Number(item.score) })),
        })),
    );
  const career = profile.careerChoice
    ? TechLiftCareers.find(profile.careerChoice.id)
    : null;
  const projects = [
    ...portfolio.projects.map((project) => ({
      ...project,
      source: "self-described",
      skills: [],
    })),
    ...reviewedProjects,
  ];

  return {
    name: portfolio.name || profile.fullName || account.name,
    headline: portfolio.headline,
    about: portfolio.about,
    location: portfolio.location,
    experience: portfolio.experience,
    credentials: portfolio.credentials,
    career: career?.title || "",
    links: portfolio.links,
    projects,
    skills: reviewedProjects.flatMap((project) =>
      project.skills.map((item) => ({
        ...item,
        challenge: project.title,
        mentor: project.mentor,
        reviewedAt: project.reviewedAt,
      })),
    ),
    updatedAt: portfolio.updatedAt,
  };
};

const buildState = (data, account) => {
  const state = {
    techliftMentorDirectory: Object.values(data.mentorProfiles)
      .filter(Boolean)
      .map(publicMentor),
  };
  if (!account) return state;

  state.techliftAccount = publicAccount(account);

  if (account.role === "learner") {
    const profile = data.learnerProfiles[account.id] || {};
    state.techliftUser = { ...profile, email: account.email };

    const approvedChallenges = new Set(
      Object.entries(data.submissions)
        .filter(
          ([key, record]) =>
            key.startsWith(`techliftChallenge:${account.id}::`) &&
            record.review?.status === "approved",
        )
        .map(([, record]) => record.challengeId),
    );

    Object.entries(data.submissions).forEach(([key, record]) => {
      const match = SUBMISSION_KEY.exec(key);
      if (!match) return;
      if (match[1] === account.id) {
        state[key] = { ...record, email: account.email };
      } else if (approvedChallenges.has(record.challengeId)) {
        state[key] = peerView(record);
      }
    });

    state.techliftPeerReviews = data.peerReviews.filter(
      (review) => review.reviewerId === account.id,
    );
  }

  if (account.role === "mentor") {
    state.techliftMentorProfile = data.mentorProfiles[account.id] || null;
    Object.entries(data.submissions).forEach(([key, record]) => {
      if (SUBMISSION_KEY.test(key)) state[key] = mentorView(record);
    });
    state.techliftPeerReviews = data.peerReviews.map(
      ({ reviewerEmail, ...review }) => review,
    );
  }

  return state;
};

// ---- Writes ------------------------------------------------------------

const KNOWN_SKILLS = new Set(
  Object.values(TechLiftChallenges.tracks).flatMap((track) =>
    track.challenges.flatMap((challenge) => challenge.skills),
  ),
);
const ROUTE_HOURS = [2, 5, 10, 15];

// The route builder's choices: track, hours per week, budget, known skills, finished steps.
// The opportunity tracker holds only what the learner adds. Nothing here is fetched or invented.
const TRACKER_STAGES = [
  "Interested",
  "Preparing",
  "Applied",
  "Interviewing",
  "Outcome",
];
const TRACKER_TYPES = [
  "Internship",
  "Learnership",
  "Graduate programme",
  "Entry-level job",
  "Junior developer",
  "Apprenticeship",
  "Scholarship",
  "Training programme",
  "Remote",
  "Other",
];
const TRACKER_LIMIT = 100;

const cleanOpportunities = (list) => {
  if (!Array.isArray(list)) return [];
  if (list.length > TRACKER_LIMIT)
    fail(400, "You can save up to 100 opportunities");
  return list.map((item) => {
    if (!item || typeof item !== "object") fail(400, "Invalid opportunity");
    const title = text(item.title ?? "", 150, "Title");
    if (!title) fail(400, "Each opportunity needs a title");
    const link = text(item.link ?? "", 300, "Link");
    if (link && !/^https?:\/\//i.test(link))
      fail(400, "Link must start with http or https");
    const closes = typeof item.closes === "string" ? item.closes : "";
    if (closes && !/^\d{4}-\d{2}-\d{2}$/.test(closes))
      fail(400, "Closing date must be a date");
    const id =
      text(String(item.id ?? ""), 40, "Id") ||
      crypto.randomBytes(6).toString("hex");
    return {
      id,
      title,
      organisation: text(item.organisation ?? "", 150, "Organisation"),
      type: TRACKER_TYPES.includes(item.type) ? item.type : "Other",
      location: text(item.location ?? "", 100, "Location"),
      link,
      closes,
      stage: TRACKER_STAGES.includes(item.stage) ? item.stage : "Interested",
      notes: text(item.notes ?? "", 500, "Notes"),
      addedAt:
        typeof item.addedAt === "string"
          ? item.addedAt
          : new Date().toISOString(),
      source: "user",
    };
  });
};

// The career chosen in Career DNA. Only a career from the catalogue is accepted.
const cleanCareerChoice = (raw) => {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "object" || typeof raw.id !== "string")
    fail(400, "Invalid career choice");
  if (!TechLiftCareers.find(raw.id)) fail(400, "Unknown career");
  return { id: raw.id, chosenAt: new Date().toISOString() };
};

const cleanWebLink = (value, label) => {
  const link = text(value ?? "", 300, label);
  if (link && !/^https?:\/\//i.test(link))
    fail(400, `${label} must start with http or https`);
  return link;
};

const cleanPortfolio = (raw, current, fullName) => {
  if (raw === undefined || raw === null) return current || null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    fail(400, "Invalid portfolio");
  const sourceProjects =
    raw.projects === undefined ? current?.projects || [] : raw.projects;
  if (!Array.isArray(sourceProjects))
    fail(400, "Portfolio projects must be a list");
  if (sourceProjects.length > 12)
    fail(400, "A portfolio can include up to 12 projects");

  const projects = sourceProjects.map((project) => {
    if (!project || typeof project !== "object")
      fail(400, "Invalid portfolio project");
    return {
      id: crypto.randomBytes(8).toString("hex"),
      title:
        text(project.title ?? "", 120, "Project title") ||
        fail(400, "Project title is required"),
      description: text(project.description ?? "", 1500, "Project description"),
      problem: text(project.problem ?? "", 500, "Project problem"),
      contribution: text(
        project.contribution ?? "",
        500,
        "Project contribution",
      ),
      learning: text(project.learning ?? "", 500, "Project learning"),
      technologies: (Array.isArray(project.technologies)
        ? project.technologies
        : []
      )
        .slice(0, 12)
        .map((item) => text(String(item), 40, "Technology"))
        .filter(Boolean),
      url: cleanWebLink(project.url, "Project link"),
      imageUrl: cleanWebLink(project.imageUrl, "Project image link"),
    };
  });
  const links = raw.links && typeof raw.links === "object" ? raw.links : {};

  return {
    shareId: current?.shareId || crypto.randomBytes(16).toString("hex"),
    name: text(raw.name ?? current?.name ?? fullName, 100, "Portfolio name"),
    headline: text(
      raw.headline ?? current?.headline ?? "",
      160,
      "Portfolio headline",
    ),
    about: text(
      raw.about ?? current?.about ?? "",
      800,
      "Portfolio introduction",
    ),
    location: text(raw.location ?? current?.location ?? "", 100, "Location"),
    experience: text(
      raw.experience ?? current?.experience ?? "",
      1000,
      "Relevant experience",
    ),
    credentials: text(
      raw.credentials ?? current?.credentials ?? "",
      1000,
      "Credentials",
    ),
    published: raw.published === true,
    links: {
      github: cleanWebLink(links.github, "GitHub link"),
      linkedin: cleanWebLink(links.linkedin, "LinkedIn link"),
      website: cleanWebLink(links.website, "Website link"),
    },
    projects,
    updatedAt: new Date().toISOString(),
  };
};

const cleanInterviewPractice = (raw, current, opportunities) => {
  if (raw === undefined) return current || [];
  if (!Array.isArray(raw)) fail(400, "Interview practice must be a list");
  if (raw.length > 50) fail(400, "Keep up to 50 interview practice sessions");

  const ids = new Set();
  return raw.map((item) => {
    if (!item || typeof item !== "object")
      fail(400, "Invalid interview session");
    const previous = (current || []).find((session) => session.id === item.id);
    const id = String(item.id ?? "");
    if (!/^[a-f0-9-]{36}$/i.test(id) || ids.has(id))
      fail(400, "Interview session IDs must be unique");
    ids.add(id);

    const career = item.careerId ? TechLiftCareers.find(item.careerId) : null;
    if (item.careerId && !career) fail(400, "Unknown interview career");
    const category = ["behavioral", "technical", "scenario"].includes(
      item.category,
    )
      ? item.category
      : fail(400, "Unknown interview question type");
    const questionId = text(item.questionId ?? "", 60, "Question ID");
    if (!/^[a-z0-9-]+$/.test(questionId))
      fail(400, "Invalid interview question ID");
    const question = text(item.question ?? "", 300, "Interview question");
    if (!question) fail(400, "Interview question is required");

    const answers = {};
    ["situation", "task", "action", "result"].forEach((part) => {
      answers[part] = text(item.answers?.[part] ?? "", 1800, `${part} answer`);
      if (!answers[part])
        fail(400, `Complete the ${part} part of your STAR answer`);
    });

    const scores = {};
    ["clarity", "relevance", "structure", "evidence"].forEach((dimension) => {
      const score = Number(item.scores?.[dimension]);
      if (!Number.isInteger(score) || score < 1 || score > 4)
        fail(400, "Self-review scores must be from 1 to 4");
      scores[dimension] = score;
    });

    const opportunityId = text(item.opportunityId ?? "", 100, "Opportunity ID");
    const linkedOpportunity = opportunities.find(
      (opportunity) => opportunity.id === opportunityId,
    );
    if (
      opportunityId &&
      !linkedOpportunity &&
      previous?.opportunityId !== opportunityId
    )
      fail(400, "Choose an opportunity from your tracker");

    return {
      id,
      careerId: career?.id || "",
      questionId,
      question,
      category,
      opportunityId,
      opportunityTitle: linkedOpportunity?.title || previous?.opportunityTitle || "",
      answers,
      scores,
      reflection: text(item.reflection ?? "", 600, "Practice reflection"),
      savedAt: new Date().toISOString(),
    };
  });
};

const cleanRoute = (raw, fallbackTrack) => {
  if (!raw || typeof raw !== "object") return null;
  const track = TRACKS.includes(raw.track) ? raw.track : fallbackTrack;
  return {
    track,
    hours: ROUTE_HOURS.includes(Number(raw.hours)) ? Number(raw.hours) : 5,
    budget: raw.budget === "some" ? "some" : "free",
    knownSkills: (Array.isArray(raw.knownSkills) ? raw.knownSkills : []).filter(
      (skill) => KNOWN_SKILLS.has(skill),
    ),
    completedSteps: (Array.isArray(raw.completedSteps)
      ? raw.completedSteps
      : []
    ).filter((id) => {
      const challenge = TechLiftChallenges.find(id);
      return challenge && challenge.track === track;
    }),
  };
};

const saveLearnerProfile = (data, account, value) => {
  const current = data.learnerProfiles[account.id] || {};
  const path =
    value.path === undefined ? current.path || "frontend" : value.path;
  if (!TRACKS.includes(path)) fail(400, "Unknown track");

  const mentorId = value.mentorId ? String(value.mentorId) : null;
  if (mentorId && !data.mentorProfiles[mentorId]) fail(400, "Unknown mentor");

  const requestedChallenge = value.challengeId
    ? TechLiftChallenges.find(value.challengeId)
    : null;
  const challengeId =
    requestedChallenge && requestedChallenge.track === path
      ? requestedChallenge.id
      : current.challengeId &&
          TechLiftChallenges.find(current.challengeId)?.track === path
        ? current.challengeId
        : TechLiftChallenges.core(path).id;
  const opportunities = cleanOpportunities(
    value.opportunities === undefined
      ? current.opportunities
      : value.opportunities,
  );

  data.learnerProfiles[account.id] = {
    fullName: text(
      value.fullName ?? current.fullName ?? account.name,
      100,
      "Name",
    ),
    path,
    goal: text(value.goal ?? current.goal ?? "", 200, "Goal"),
    availability: text(
      value.availability ?? current.availability ?? "",
      200,
      "Availability",
    ),
    challengeId,
    mentorId,
    route: cleanRoute(
      value.route === undefined ? current.route : value.route,
      path,
    ),
    opportunities,
    careerChoice: cleanCareerChoice(
      value.careerChoice === undefined
        ? current.careerChoice
        : value.careerChoice,
    ),
    interviewPractice: cleanInterviewPractice(
      value.interviewPractice,
      current.interviewPractice,
      opportunities,
    ),
    portfolio: cleanPortfolio(
      value.portfolio,
      current.portfolio,
      text(value.fullName ?? current.fullName ?? account.name, 100, "Name"),
    ),
  };
};

const saveMentorProfile = (data, account, value) => {
  const name = text(value.name ?? "", 100, "Name");
  if (!name) fail(400, "Name is required");
  data.mentorProfiles[account.id] = {
    id: account.id,
    name,
    role: text(value.role ?? "", 100, "Professional title"),
    bio: text(value.bio ?? "", 400, "Bio"),
    degrees: text(value.degrees ?? "", 200, "Degrees"),
    certifications: text(value.certifications ?? "", 200, "Certifications"),
    experience: text(String(value.experience ?? ""), 3, "Experience"),
    expertise: (Array.isArray(value.expertise) ? value.expertise : [])
      .slice(0, 20)
      .map((item) => text(String(item), 60, "Expertise"))
      .filter(Boolean),
    photo: validPhoto(value.photo),
  };
};

const SUBMISSION_KINDS = [
  "github",
  "deployed",
  "screenshot",
  "link",
  "written",
];

const saveLearnerSubmission = (data, account, key, challengeId, value) => {
  const challenge = TechLiftChallenges.find(challengeId);
  const profile = data.learnerProfiles[account.id] || {};
  if (!challenge) fail(400, "Unknown challenge");
  if (challenge.track !== profile.path)
    fail(403, "This challenge is not in your track");

  const description = text(value.description ?? "", 5000, "Description");
  if (!description) fail(400, "Describe what you built");
  const url = text(value.url ?? "", 300, "Link");
  if (url && !/^https?:\/\//i.test(url))
    fail(400, "Link must start with http or https");

  // What kind of evidence this is. A GitHub submission must point at github.com.
  const kind = SUBMISSION_KINDS.includes(value.kind)
    ? value.kind
    : url
      ? "link"
      : "written";
  if (kind === "github" && !/^https:\/\/github\.com\//i.test(url))
    fail(400, "A GitHub submission needs a github.com link");
  if ((kind === "deployed" || kind === "screenshot") && !url)
    fail(400, "Add a link to the deployed project or screenshot");

  const existing = data.submissions[key];
  const base = {
    kind,
    challengeId,
    challenge: challenge.title,
    path: challenge.track,
    fullName: profile.fullName || account.name,
    email: account.email,
    description,
    url,
    submittedAt: new Date().toISOString(),
  };

  // Not reviewed yet: update the same round.
  if (!existing)
    return { ...base, round: 1, history: [], review: null, changeNote: "" };
  if (!existing.review) {
    return {
      ...base,
      round: existing.round,
      history: existing.history,
      review: null,
      changeNote: existing.changeNote || "",
    };
  }

  // Reviewed: archive the reviewed round and start the next one.
  const changeNote = text(value.changeNote ?? "", 1000, "Change note");
  if (!changeNote) fail(400, "Explain what changed since the last feedback");
  const snapshot = {
    round: existing.round,
    description: existing.description,
    url: existing.url,
    submittedAt: existing.submittedAt,
    changeNote: existing.changeNote || "",
    review: existing.review,
  };
  return {
    ...base,
    round: existing.round + 1,
    history: [...existing.history, snapshot],
    review: null,
    changeNote,
  };
};

const saveReview = (data, mentorAccount, key, value) => {
  const existing = data.submissions[key];
  if (!existing) fail(404, "Submission not found");
  const challenge = TechLiftChallenges.find(existing.challengeId);
  const review = value.review || {};
  if (!["pending", "approved", "changes"].includes(review.status))
    fail(400, "Unknown review status");

  const mentorProfile = data.mentorProfiles[mentorAccount.id];
  existing.review = {
    status: review.status,
    feedback:
      text(review.feedback ?? "", 3000, "Feedback") ||
      fail(400, "Feedback is required"),
    rubric: validRubric(review.rubric, challenge.skills),
    reviewerId: mentorAccount.id,
    reviewerName: mentorProfile?.name || mentorAccount.name,
    reviewedAt: new Date().toISOString(),
  };
  data.submissions[key] = existing;
  const learnerId = SUBMISSION_KEY.exec(key)[1];
  const verdict = {
    approved: "approved",
    changes: "asked for changes",
    pending: "reopened",
  }[existing.review.status];
  notify(
    data,
    learnerId,
    `${existing.review.reviewerName} ${verdict} your work: ${existing.challenge}`,
    "dashboard.html",
  );
};

// Peer reviews are append-only for learners. Mentors may only add a spot-check.
const savePeerReviews = (data, account, list) => {
  if (!Array.isArray(list)) fail(400, "Peer reviews must be a list");
  const existingById = new Map(
    data.peerReviews.map((review) => [review.id, review]),
  );
  const incomingIds = new Set(list.map((review) => review && review.id));
  if ([...existingById.keys()].some((id) => !incomingIds.has(id))) {
    fail(403, "Peer reviews cannot be removed");
  }

  const next = list.map((item) => {
    if (!item || typeof item.id !== "string")
      fail(400, "Each peer review needs an id");
    const existing = existingById.get(item.id);

    if (existing) {
      if (account.role === "mentor") {
        const check = item.spotCheck;
        if (!check) return existing;
        if (!["agree", "disagree"].includes(check.verdict))
          fail(400, "Verdict must be agree or disagree");
        return {
          ...existing,
          spotCheck: {
            verdict: check.verdict,
            note: text(check.note ?? "", 500, "Spot-check note"),
            mentorId: account.id,
            checkedAt: new Date().toISOString(),
          },
        };
      }
      if (JSON.stringify(item) !== JSON.stringify(existing))
        fail(403, "Learners cannot change a peer review");
      return existing;
    }

    if (account.role !== "learner")
      fail(403, "Only learners write peer reviews");
    const match = SUBMISSION_KEY.exec(item.submissionKey || "");
    const peerSubmission = match && data.submissions[item.submissionKey];
    if (!peerSubmission) fail(400, "Unknown submission");
    if (match[1] === account.id) fail(403, "You cannot review your own work");
    if (peerSubmission.challengeId !== item.challengeId)
      fail(400, "Challenge does not match the submission");

    const ownKey = `techliftChallenge:${account.id}::${item.challengeId}`;
    if (data.submissions[ownKey]?.review?.status !== "approved") {
      fail(403, "Peer review unlocks after your own work is approved");
    }

    const profile = data.learnerProfiles[account.id] || {};
    const challenge = TechLiftChallenges.find(item.challengeId);
    return {
      id: item.id,
      reviewerId: account.id,
      reviewerName: profile.fullName || account.name,
      challengeId: item.challengeId,
      submissionKey: item.submissionKey,
      rubric: validRubric(item.rubric, challenge.skills),
      comment: text(item.comment ?? "", 1000, "Comment"),
      createdAt: new Date().toISOString(),
      spotCheck: null,
    };
  });

  data.peerReviews = next;
  next.forEach((review) => {
    const before = existingById.get(review.id);
    if (!before) {
      const ownerId = SUBMISSION_KEY.exec(review.submissionKey)[1];
      notify(
        data,
        ownerId,
        `${review.reviewerName} left peer feedback on your work`,
        "dashboard.html",
      );
    } else if (
      review.spotCheck &&
      JSON.stringify(review.spotCheck) !== JSON.stringify(before.spotCheck)
    ) {
      notify(
        data,
        review.reviewerId,
        "A mentor spot-checked your peer review",
        "dashboard.html",
      );
    }
  });
};

const routeKvWrite = (data, account, key, value) => {
  if (key === "techliftUser") {
    if (account.role !== "learner")
      fail(403, "Only learners have a learner profile");
    return saveLearnerProfile(data, account, value);
  }
  if (key === "techliftMentorProfile") {
    if (account.role !== "mentor")
      fail(403, "Only mentors have a mentor profile");
    return saveMentorProfile(data, account, value);
  }
  if (key === "techliftMentorDirectory") return; // derived from mentor profiles
  if (key === "techliftPeerReviews")
    return savePeerReviews(data, account, value);

  const match = SUBMISSION_KEY.exec(key);
  if (!match) fail(400, "Unknown record");
  if (account.role === "learner" && match[1] === account.id) {
    data.submissions[key] = saveLearnerSubmission(
      data,
      account,
      key,
      match[2],
      value,
    );
    const challenge = TechLiftChallenges.find(match[2]);
    data.accounts
      .filter((item) => item.role === "mentor")
      .forEach((mentor) =>
        notify(
          data,
          mentor.id,
          `${account.name} sent work for review: ${challenge.title}`,
          "mentor-dashboard.html",
        ),
      );
    return;
  }
  if (account.role === "mentor") return saveReview(data, account, key, value);
  fail(403, "You can only change your own work");
};

// ---- HTTP --------------------------------------------------------------

const readJson = (request) =>
  new Promise((resolve, reject) => {
    if (!(request.headers["content-type"] || "").includes("application/json")) {
      reject(new HttpError(415, "Send JSON"));
      return;
    }
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, "Request is too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "null"));
      } catch {
        reject(new HttpError(400, "Body must be JSON"));
      }
    });
    request.on("error", reject);
  });

const sendJson = (response, status, body, headers = {}) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  response.end(JSON.stringify(body));
};

const serveStatic = (request, response, pathname) => {
  const relative =
    pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
  const normalised = path.posix.normalize(relative);
  const blocked =
    normalised.startsWith("..") ||
    path.isAbsolute(normalised) ||
    BLOCKED_PREFIXES.some((prefix) => normalised.startsWith(prefix));
  const filePath = path.join(ROOT, normalised);

  if (blocked || !filePath.startsWith(ROOT + path.sep)) {
    response.writeHead(404).end("Not found");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(404).end("Not found");
      return;
    }
    const type =
      CONTENT_TYPES[path.extname(filePath).toLowerCase()] ||
      "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(request.method === "HEAD" ? undefined : contents);
  });
};

const createServer = ({ file = DATA_FILE } = {}) => {
  const data = loadData(file);
  const persist = createPersister(file);
  const sessions = new Map();

  const currentAccount = (request) => {
    const token = cookieValue(request, SESSION_COOKIE);
    const session = token && sessions.get(token);
    if (!session) return null;
    if (session.expires < Date.now()) {
      sessions.delete(token);
      return null;
    }
    return (
      data.accounts.find((account) => account.id === session.accountId) || null
    );
  };

  const startSession = (response, account) => {
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, {
      accountId: account.id,
      expires: Date.now() + SESSION_DAYS * 864e5,
    });
    response.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_DAYS * 86400}`,
    );
  };

  const endSession = (request, response) => {
    const token = cookieValue(request, SESSION_COOKIE);
    if (token) sessions.delete(token);
    response.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
    );
  };

  const requireAccount = (request) => {
    const account = currentAccount(request);
    if (!account) fail(401, "Log in to continue");
    return account;
  };

  const signup = async (response, role, body) => {
    const name = text(body?.name ?? "", 100, "Name");
    const email = text(body?.email ?? "", 200, "Email").toLowerCase();
    const password = typeof body?.password === "string" ? body.password : "";
    if (!name) fail(400, "Name is required");
    if (!EMAIL.test(email)) fail(400, "Enter a valid email address");
    if (password.length < 8)
      fail(400, "Password must be at least 8 characters");
    if (data.accounts.some((account) => account.email === email))
      fail(409, "An account with this email already exists");

    const { salt, hash } = await hashPassword(password);
    const account = {
      id: crypto.randomBytes(8).toString("hex"),
      email,
      name,
      role,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    data.accounts.push(account);

    if (role === "learner") {
      const path = TRACKS.includes(body.path) ? body.path : "frontend";
      data.learnerProfiles[account.id] = {
        fullName: name,
        path,
        goal: text(body.goal ?? "", 200, "Goal"),
        availability: text(body.availability ?? "", 200, "Availability"),
        challengeId: TechLiftChallenges.core(path).id,
        mentorId: null,
      };
    }

    await persist(data);
    startSession(response, account);
    sendJson(response, 201, publicAccount(account));
  };

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    const { pathname } = url;

    try {
      if (pathname === "/api/auth/signup" && request.method === "POST") {
        const body = await readJson(request);
        const role = body?.role === "mentor" ? "mentor" : "learner";
        return await signup(response, role, body);
      }

      if (pathname === "/api/auth/login" && request.method === "POST") {
        const body = await readJson(request);
        const email = String(body?.email ?? "")
          .trim()
          .toLowerCase();
        const account = data.accounts.find((item) => item.email === email);
        const password =
          typeof body?.password === "string" ? body.password : "";
        if (!account || !(await passwordMatches(password, account))) {
          fail(401, "Email or password is incorrect");
        }
        startSession(response, account);
        return sendJson(response, 200, publicAccount(account));
      }

      if (pathname === "/api/auth/logout" && request.method === "POST") {
        endSession(request, response);
        return sendJson(response, 200, { ok: true });
      }

      if (pathname === "/api/notifications" && request.method === "GET") {
        const account = currentAccount(request);
        return sendJson(
          response,
          200,
          account ? data.notifications[account.id] || [] : [],
        );
      }

      if (pathname === "/api/notifications/read" && request.method === "POST") {
        const account = requireAccount(request);
        (data.notifications[account.id] || []).forEach(
          (item) => (item.read = true),
        );
        await persist(data);
        return sendJson(response, 200, { ok: true });
      }

      if (pathname === "/api/state" && request.method === "GET") {
        return sendJson(
          response,
          200,
          buildState(data, currentAccount(request)),
        );
      }

      if (pathname.startsWith("/api/portfolio/") && request.method === "GET") {
        const shareId = pathname.slice("/api/portfolio/".length);
        if (!/^[a-f0-9]{32}$/.test(shareId)) fail(404, "Portfolio not found");
        const portfolio = publicPortfolio(data, shareId);
        if (!portfolio) fail(404, "Portfolio not found");
        return sendJson(response, 200, portfolio, {
          "Cache-Control": "no-store",
        });
      }

      if (pathname.startsWith("/api/kv/") && request.method === "PUT") {
        const account = requireAccount(request);
        const key = decodeURIComponent(pathname.slice("/api/kv/".length));
        const value = await readJson(request);
        if (value === null) fail(400, "Body is required");
        routeKvWrite(data, account, key, value);
        await persist(data);
        response.writeHead(204).end();
        return;
      }

      if (pathname.startsWith("/api/")) {
        return sendJson(response, 404, { error: "Unknown endpoint" });
      }

      if (request.method === "GET" || request.method === "HEAD") {
        return serveStatic(request, response, pathname);
      }

      return sendJson(response, 405, { error: "Method not allowed" });
    } catch (error) {
      const status = error.status || 500;
      if (status === 500) console.error(error);
      const message =
        status === 500 ? "Something went wrong on the server" : error.message;
      if (!response.headersSent) sendJson(response, status, { error: message });
      else response.end();
    }
  });
};

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "127.0.0.1";
  createServer().listen(port, host, () => {
    console.log(`TechLift running at http://${host}:${port}`);
    console.log(`Data file: ${DATA_FILE}`);
  });
}
