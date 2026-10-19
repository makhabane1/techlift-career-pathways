// Client-side data layer. The server decides what each signed-in person can
// see and change. This file loads that view once per page, keeps it in a
// cache so the page code can read synchronously, and sends each change back.
const TechLiftStore = (() => {
  const KEYS = {
    user: "techliftUser",
    mentorProfile: "techliftMentorProfile",
    mentorDirectory: "techliftMentorDirectory",
    peerReviews: "techliftPeerReviews",
  };
  const SUBMISSION_PREFIX = "techliftChallenge:";
  const LEGACY_SEPARATOR = "::";

  // Keys are the same names the page code has always used.
  const cache = {};

  const saveRemote = (key, raw) =>
    fetch(`/api/kv/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: raw,
    }).then(async (response) => {
      if (response.ok) return;
      const detail = await response.json().catch(() => ({}));
      throw new Error(
        detail.error || `Save failed with status ${response.status}`,
      );
    });

  const read = (key, fallback) => {
    try {
      const raw = cache[key];
      return raw === undefined ? fallback : (JSON.parse(raw) ?? fallback);
    } catch {
      return fallback;
    }
  };

  // Updates the cache at once, then saves. A failure is reported to the user.
  const write = (key, value) => {
    const raw = JSON.stringify(value);
    cache[key] = raw;
    return saveRemote(key, raw).catch((error) => {
      console.error(error);
      alert(`Could not save your change: ${error.message}`);
    });
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

  const wordCount = (text) =>
    String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

  const hoursBetween = (start, end) => (new Date(end) - new Date(start)) / 36e5;

  const average = (list) =>
    list.length
      ? list.reduce((total, value) => total + value, 0) / list.length
      : null;

  // ---- Session -----------------------------------------------------------

  const getAccount = () => read("techliftAccount", null);

  const loadState = async () => {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok)
      throw new Error(`Server responded with ${response.status}`);
    const state = await response.json();
    Object.keys(cache).forEach((key) => delete cache[key]);
    Object.entries(state).forEach(([key, value]) => {
      cache[key] = JSON.stringify(value);
    });
  };

  // Pages that need an account redirect to login when no session is loaded.
  const ready = loadState().catch((error) => {
    console.error(
      "Could not load TechLift data. Is the server running?",
      error,
    );
  });

  const postJson = async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const detail = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        detail.error || `Request failed with status ${response.status}`,
      );
    return detail;
  };

  const login = async (email, password) => {
    await postJson("/api/auth/login", { email, password });
    await loadState();
    return getAccount();
  };

  const signup = async (details) => {
    await postJson("/api/auth/signup", details);
    await loadState();
    return getAccount();
  };

  const logout = async () => {
    await postJson("/api/auth/logout", {});
    window.location.replace("login.html");
  };

  // Redirects to the right place when the signed-in role is not allowed.
  const ensureRole = (role) => {
    const account = getAccount();
    if (!account) {
      window.location.replace("login.html");
      return false;
    }
    if (account.role !== role) {
      window.location.replace(
        account.role === "mentor" ? "mentor-dashboard.html" : "dashboard.html",
      );
      return false;
    }
    return true;
  };

  // ---- Learner -----------------------------------------------------------

  const getUser = () => read(KEYS.user, null);

  const saveUser = (patch) =>
    write(KEYS.user, { ...(getUser() || {}), ...patch });

  const saveUserConfirmed = async (patch) => {
    const value = { ...(getUser() || {}), ...patch };
    const raw = JSON.stringify(value);
    await saveRemote(KEYS.user, raw);
    cache[KEYS.user] = raw;
    await loadState();
    return getUser();
  };

  // ---- Submissions -------------------------------------------------------
  // One record per learner per challenge. Keys use the learner's account id,
  // so no email addresses appear in keys.

  const ownerId = (email) => {
    const account = getAccount();
    return account && email === account.email ? account.id : email || "unknown";
  };

  const submissionKey = (email, challengeId) =>
    `${SUBMISSION_PREFIX}${ownerId(email)}${LEGACY_SEPARATOR}${challengeId}`;

  const normalize = (record, storageKey) => {
    const core = TechLiftChallenges.core(record.path || "frontend");
    return {
      ...record,
      challengeId: record.challengeId || core.id,
      challenge: record.challenge || core.title,
      round: record.round || 1,
      history: record.history || [],
      storageKey,
    };
  };

  const getAllSubmissions = () => {
    const submissions = [];
    Object.keys(cache)
      .filter((key) => key.startsWith(SUBMISSION_PREFIX))
      .forEach((key) => {
        const record = read(key, null);
        if (record && record.description)
          submissions.push(normalize(record, key));
      });
    return submissions.sort(
      (first, second) =>
        new Date(second.submittedAt || 0) - new Date(first.submittedAt || 0),
    );
  };

  const getSubmission = (email, challengeId) => {
    const key = submissionKey(email, challengeId);
    const record = read(key, null);
    return record?.description ? normalize(record, key) : null;
  };

  const saveSubmission = (record) => {
    const { storageKey, ...data } = record;
    return write(
      storageKey || submissionKey(data.email, data.challengeId),
      data,
    );
  };

  // ---- Rubrics -----------------------------------------------------------
  // review.rubric: [{ skill, score (1-4), note }]

  const SCORE_LABELS = {
    1: "Not yet",
    2: "Developing",
    3: "Proficient",
    4: "Exemplary",
  };

  const rubricAverage = (rubric = []) =>
    average(rubric.map((item) => Number(item.score)).filter(Boolean));

  const verifiedSkills = (review) =>
    (review?.rubric || []).filter((item) => Number(item.score) >= 3);

  const weakestSkill = (review) => {
    const scored = (review?.rubric || []).filter((item) => Number(item.score));
    if (!scored.length) return null;
    return scored.reduce((lowest, item) =>
      Number(item.score) < Number(lowest.score) ? item : lowest,
    );
  };

  // ---- Mentors -----------------------------------------------------------

  const getCurrentMentor = () => read(KEYS.mentorProfile, null);

  const getMentorDirectory = () => read(KEYS.mentorDirectory, []);

  const getMentor = (id) =>
    getMentorDirectory().find((mentor) => mentor.id === id) || null;

  // The server assigns the id and updates the directory.
  const saveMentorProfile = (profile) => {
    const current = getCurrentMentor();
    return write(KEYS.mentorProfile, { ...profile, id: current?.id })
      .then(() => loadState())
      .then(() => getCurrentMentor());
  };

  const calibrationReport = () => {
    const byChallenge = {};
    getAllSubmissions().forEach((submission) => {
      const review = submission.review;
      if (!review?.reviewerId) return;
      const score = rubricAverage(review.rubric);
      if (score === null) return;
      const challenge = (byChallenge[submission.challengeId] ||= {
        title: submission.challenge,
        reviewers: {},
      });
      const reviewer = (challenge.reviewers[review.reviewerId] ||= {
        id: review.reviewerId,
        name: review.reviewerName || "Mentor",
        scores: [],
      });
      reviewer.scores.push(score);
    });

    return Object.entries(byChallenge)
      .map(([challengeId, challenge]) => {
        const reviewers = Object.values(challenge.reviewers).map(
          (reviewer) => ({
            ...reviewer,
            average: average(reviewer.scores),
          }),
        );
        if (reviewers.length < 2) return null;
        const groupMean = average(
          reviewers.map((reviewer) => reviewer.average),
        );
        return {
          challengeId,
          title: challenge.title,
          groupMean,
          reviewers: reviewers.map((reviewer) => {
            const deviation = reviewer.average - groupMean;
            // With two mentors each is always the same distance from the mean,
            // so the honest signal is the gap itself, not an outlier.
            let flag = "aligned";
            if (Math.abs(deviation) >= 0.75)
              flag = reviewers.length >= 3 ? "outlier" : "gap";
            return { ...reviewer, deviation, flag };
          }),
        };
      })
      .filter(Boolean);
  };

  const calibrationFlags = () => {
    const flags = {};
    calibrationReport().forEach((row) =>
      row.reviewers.forEach((reviewer) => {
        if (flags[reviewer.id] !== "outlier")
          flags[reviewer.id] = reviewer.flag;
      }),
    );
    return flags;
  };

  const mentorStats = (mentorId) => {
    const reviews = getAllSubmissions().filter(
      (submission) =>
        submission.review?.reviewerId === mentorId &&
        submission.review.reviewedAt,
    );
    return {
      count: reviews.length,
      avgHours: average(
        reviews.map((submission) =>
          hoursBetween(submission.submittedAt, submission.review.reviewedAt),
        ),
      ),
      avgWords: average(
        reviews.map((submission) => wordCount(submission.review.feedback)),
      ),
      calibration: calibrationFlags()[mentorId] || null,
    };
  };

  const mentorBadges = (stats) => {
    const badges = [];
    if (stats.avgHours !== null && stats.avgHours <= 48)
      badges.push("Fast turnaround");
    if (stats.avgWords !== null && stats.avgWords >= 30)
      badges.push("Detailed feedback");
    if (stats.calibration === "aligned") badges.push("Calibrated");
    return badges;
  };

  // Scores directory mentors against a track using their expertise tags.
  const matchMentors = (track) =>
    getMentorDirectory()
      .map((mentor) => {
        const matched = (mentor.expertise || []).filter(
          (item) => TechLiftChallenges.matchesTrack(track, item).length > 0,
        );
        return { mentor, matched, score: matched.length };
      })
      .sort((first, second) => second.score - first.score);

  // ---- Peer reviews ------------------------------------------------------

  const getPeerReviews = () => read(KEYS.peerReviews, []);

  const savePeerReviews = (list) => write(KEYS.peerReviews, list);

  // ---- Passport ----------------------------------------------------------
  // Verified skills come from every approved round, including rounds that
  // were later superseded by a revision.

  const passportEntries = (email) => {
    const entries = [];
    getAllSubmissions()
      .filter((submission) => (submission.email || "") === (email || ""))
      .forEach((submission) => {
        [...submission.history, submission].forEach((round) => {
          if (round.review?.status !== "approved") return;
          verifiedSkills(round.review).forEach((item) =>
            entries.push({
              skill: item.skill,
              score: Number(item.score),
              challenge:
                TechLiftChallenges.find(submission.challengeId)?.title ||
                submission.challenge,
              challengeId: submission.challengeId,
              mentor: round.review.reviewerName || "Mentor",
              reviewedAt: round.review.reviewedAt,
              url: round.url || "",
            }),
          );
        });
      });
    return entries.sort(
      (first, second) =>
        new Date(second.reviewedAt) - new Date(first.reviewedAt),
    );
  };

  // Every element with data-logout signs the person out.
  ready.then(() => {
    document.querySelectorAll("[data-logout]").forEach((element) => {
      element.addEventListener("click", (event) => {
        event.preventDefault();
        logout();
      });
    });
  });

  // Header links marked data-account-link show the dashboard when someone is signed in.
  ready.then(() => {
    const account = getAccount();
    document.querySelectorAll("[data-account-link]").forEach((link) => {
      if (!account) return;
      link.textContent = "Dashboard";
      link.setAttribute(
        "href",
        account.role === "mentor" ? "mentor-dashboard.html" : "dashboard.html",
      );
    });
  });

  const fetchNotifications = async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    return response.ok ? response.json() : [];
  };

  const markNotificationsRead = () =>
    fetch("/api/notifications/read", { method: "POST" });

  return {
    KEYS,
    ready,
    fetchNotifications,
    markNotificationsRead,
    read,
    write,
    getAccount,
    ensureRole,
    login,
    signup,
    logout,
    escapeHtml,
    wordCount,
    getUser,
    saveUser,
    saveUserConfirmed,
    submissionKey,
    getAllSubmissions,
    getSubmission,
    saveSubmission,
    SCORE_LABELS,
    rubricAverage,
    verifiedSkills,
    weakestSkill,
    getCurrentMentor,
    getMentorDirectory,
    getMentor,
    saveMentorProfile,
    calibrationReport,
    calibrationFlags,
    mentorStats,
    mentorBadges,
    matchMentors,
    getPeerReviews,
    savePeerReviews,
    passportEntries,
  };
})();
