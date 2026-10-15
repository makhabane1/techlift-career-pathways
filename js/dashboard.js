TechLiftStore.ready.then(() => {
  if (!TechLiftStore.ensureRole("learner")) return;
  const { escapeHtml, SCORE_LABELS } = TechLiftStore;
  const $ = (id) => document.getElementById(id);

  const DEFAULT_USER = {
    fullName: "Maya Patel",
    path: "frontend",
    goal: "Switch careers",
    availability: "10 hours/week",
  };

  const LEVEL_LABELS = { foundation: "Foundation", core: "Core", stretch: "Stretch" };

  const pathConfig = {
    frontend: {
      label: "Frontend",
      headline: "You’re on track for a frontend career.",
      goal: "Build interfaces that people love using.",
      streak: "18 days",
      courses: "3 / 7",
      nextSession: "Wed 7:30 PM",
      mentor: "4.9 / 5",
      milestone: "Portfolio Sprint",
      milestonePercent: "72%",
      roadmap: [
        { title: "HTML foundations", status: "Complete" },
        { title: "CSS design systems", status: "Complete" },
        { title: "JavaScript interactivity", status: "In progress" },
        { title: "React fundamentals", status: "Next" },
        { title: "Portfolio review", status: "Coming up" },
      ],
      mentorNote:
        "Focus on clarity. Your strongest improvement area is simplifying your layout structure before adding animation.",
    },
    design: {
      label: "Design",
      headline: "You’re shaping thoughtful experiences for real users.",
      goal: "Turn research into product clarity and polished design systems.",
      streak: "14 days",
      courses: "2 / 6",
      nextSession: "Thu 6:00 PM",
      mentor: "5.0 / 5",
      milestone: "UX Sprint",
      milestonePercent: "68%",
      roadmap: [
        { title: "Research foundations", status: "Complete" },
        { title: "Wireframing flows", status: "Complete" },
        { title: "Design systems", status: "In progress" },
        { title: "Prototype testing", status: "Next" },
        { title: "Portfolio critique", status: "Coming up" },
      ],
      mentorNote:
        "Your strongest work is in clarity and tone. Keep simplifying the interaction flow before layering visual polish.",
    },
    data: {
      label: "Data",
      headline: "You’re building the skill to turn numbers into decisions.",
      goal: "Translate insight into dashboards and better product decisions.",
      streak: "21 days",
      courses: "4 / 8",
      nextSession: "Tue 8:00 PM",
      mentor: "4.8 / 5",
      milestone: "Insight Sprint",
      milestonePercent: "76%",
      roadmap: [
        { title: "SQL essentials", status: "Complete" },
        { title: "Dashboard building", status: "Complete" },
        { title: "Analytic storytelling", status: "In progress" },
        { title: "A/B testing", status: "Next" },
        { title: "Portfolio review", status: "Coming up" },
      ],
      mentorNote:
        "Your reporting is strong. Keep refining the narrative so stakeholders can act on the insight quickly.",
    },
    product: {
      label: "Product",
      headline: "You’re building the product lens that brings teams together.",
      goal: "Lead roadmap decisions, customer insight, and execution across teams.",
      streak: "16 days",
      courses: "2 / 5",
      nextSession: "Fri 5:30 PM",
      mentor: "4.9 / 5",
      milestone: "Roadmap Sprint",
      milestonePercent: "70%",
      roadmap: [
        { title: "Customer discovery", status: "Complete" },
        { title: "Problem framing", status: "Complete" },
        { title: "Roadmap design", status: "In progress" },
        { title: "Prioritization", status: "Next" },
        { title: "Case study", status: "Coming up" },
      ],
      mentorNote:
        "Your product thinking is structured and strategic. Next, tighten your decision criteria so priorities feel sharper.",
    },
  };

  const storedUser = TechLiftStore.getUser();
  const initialUser = storedUser || DEFAULT_USER;
  const track = pathConfig[initialUser.path] ? initialUser.path : "frontend";
  const config = pathConfig[track];
  const firstName = (initialUser.fullName || DEFAULT_USER.fullName).trim().split(" ")[0] || "Maya";

  // Header and stat cards are static per track.
  if ($("dashboardName")) $("dashboardName").textContent = `${firstName}, your next step is ready.`;
  if ($("dashboardSummary")) $("dashboardSummary").textContent = config.headline;
  if ($("dashboardTrackStat")) $("dashboardTrackStat").textContent = `${config.label} track`;
  if ($("dashboardTrackBadge")) $("dashboardTrackBadge").textContent = config.label;
  if ($("dashboardMilestone")) $("dashboardMilestone").textContent = config.milestone;
  if ($("dashboardPercent")) $("dashboardPercent").textContent = config.milestonePercent;
  if ($("dashboardGoal")) $("dashboardGoal").textContent = config.goal;
  if ($("dashboardStreak")) $("dashboardStreak").textContent = config.streak;
  if ($("dashboardCourses")) $("dashboardCourses").textContent = config.courses;
  if ($("dashboardSession")) $("dashboardSession").textContent = config.nextSession;
  if ($("dashboardMentor")) $("dashboardMentor").textContent = config.mentor;
  if ($("mentorNoteText")) $("mentorNoteText").textContent = config.mentorNote;

  if ($("roadmapList")) {
    $("roadmapList").innerHTML = config.roadmap
      .map(
        (item) => `
          <li class="${item.status === "Complete" ? "done" : item.status === "In progress" ? "active" : ""}">
            <span class="dot"></span>
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.status)}</small>
            </div>
          </li>`,
      )
      .join("");
  }

  const scoreOptions = () =>
    `<option value="" disabled selected>Score</option>` +
    [1, 2, 3, 4].map((score) => `<option value="${score}">${score} · ${SCORE_LABELS[score]}</option>`).join("");

  const rubricChips = (rubric = []) =>
    rubric
      .map(
        (item) =>
          `<span class="skill-chip ${Number(item.score) >= 3 ? "verified" : ""}">${escapeHtml(item.skill)} · ${escapeHtml(item.score)}/4</span>`,
      )
      .join("");

  const excerpt = (text, length = 140) => {
    const clean = String(text || "").trim();
    return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : "";

  // ---- Challenge ---------------------------------------------------------

  const getChallenge = (user) =>
    TechLiftChallenges.find(user.challengeId) || TechLiftChallenges.find(TechLiftChallenges.core(track).id);

  const challengeForm = $("challengeForm");
  const challengeSubmission = $("challengeSubmission");
  const challengeUrl = $("challengeUrl");
  const challengeChangeNote = $("challengeChangeNote");
  const changeNoteWrap = $("changeNoteWrap");
  const challengeStatus = $("challengeStatus");
  const challengeSubmit = $("challengeSubmit");
  const submissionFeedback = $("submissionFeedback");
  const rubricSummary = $("rubricSummary");

  const fillForm = (submission) => {
    challengeSubmission.value = submission?.description || "";
    challengeUrl.value = submission?.url || "";
    challengeChangeNote.value = "";
  };

  const renderChallenge = (user, challenge, submission) => {
    $("challengeTitle").textContent = challenge.title;
    $("challengeBrief").textContent = challenge.brief;
    $("challengeClient").innerHTML = `Employer brief <span>•</span> ${escapeHtml(challenge.time)} · ${LEVEL_LABELS[challenge.level]} level`;
    $("challengeSkills").innerHTML = challenge.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("");

    const review = submission?.review;
    const statusMap = {
      approved: ["Approved", "is-approved", "Submit an update", `Mentor feedback: ${review?.feedback || ""}`],
      changes: ["Changes requested", "is-changes-requested", "Resubmit work", `Mentor feedback: ${review?.feedback || ""}`],
      pending: [
        submission?.round > 1 ? `Round ${submission.round} in review` : "In mentor review",
        "is-submitted",
        "Update submission",
        "Submitted. Your mentor will review this work and add verified skills to your portfolio.",
      ],
    };
    const [label, className, buttonText, feedback] = !submission
      ? ["Open", "", "Submit for review", "Your work will appear in your portfolio after mentor review."]
      : statusMap[review?.status || "pending"];

    challengeStatus.textContent = label;
    challengeStatus.className = `challenge-status ${className}`.trim();
    challengeSubmit.textContent = buttonText;
    submissionFeedback.textContent = feedback;
    rubricSummary.innerHTML = review?.rubric?.length ? rubricChips(review.rubric) : "";

    // Revisions after feedback must explain what changed.
    const needsChangeNote = Boolean(review);
    changeNoteWrap.classList.toggle("hidden", !submission);
    challengeChangeNote.required = needsChangeNote;
  };

  // ---- Revisions ---------------------------------------------------------

  const renderRevisions = (submission) => {
    const panel = $("revisionPanel");
    if (!panel) return;
    const header = `<p class="eyebrow">Revision history</p><h2>Your rounds of feedback</h2>`;
    if (!submission) {
      panel.innerHTML = `${header}<p class="muted">Each round of work and its mentor feedback will appear here.</p>`;
      return;
    }

    const rounds = [
      ...submission.history,
      {
        round: submission.round,
        description: submission.description,
        submittedAt: submission.submittedAt,
        changeNote: submission.changeNote,
        review: submission.review,
      },
    ].reverse();

    panel.innerHTML = `
      ${header}
      <ol class="round-list">
        ${rounds
          .map((round) => {
            const status = round.review?.status;
            const stateLabel = { approved: "Approved", changes: "Changes requested" }[status] || "In mentor review";
            return `
              <li class="round-item">
                <div class="round-head">
                  <strong>Round ${round.round}</strong>
                  <span class="review-state ${status || "pending"}">${stateLabel}</span>
                  <small>${escapeHtml(formatDate(round.submittedAt))}</small>
                </div>
                ${round.changeNote ? `<p class="round-change"><span>Changes:</span> ${escapeHtml(round.changeNote)}</p>` : ""}
                <p class="round-excerpt">${escapeHtml(excerpt(round.description))}</p>
                ${round.review
                  ? `<div class="skill-chips">${rubricChips(round.review.rubric)}</div>
                     <p class="round-feedback">${escapeHtml(round.review.feedback)}</p>`
                  : `<p class="muted">Waiting for mentor review.</p>`}
              </li>`;
          })
          .join("")}
      </ol>`;
  };

  // ---- Next challenge ----------------------------------------------------

  const renderNext = (submission, challenge) => {
    const panel = $("nextChallengePanel");
    if (!panel) return;
    const review = submission?.review;
    const weakest = TechLiftStore.weakestSkill(review);
    const next = review?.status === "approved"
      ? TechLiftChallenges.recommendNext(track, challenge.id, weakest?.skill)
      : null;

    panel.classList.toggle("hidden", !next);
    if (!next) return;

    const targets = weakest && next.skills.includes(weakest.skill);
    panel.innerHTML = `
      <p class="eyebrow">Recommended next challenge</p>
      <h2>${escapeHtml(next.title)}</h2>
      <p class="muted">${LEVEL_LABELS[next.level]} level · ${escapeHtml(next.time)}</p>
      <p>${weakest
        ? `Your lowest rated skill is <strong>${escapeHtml(weakest.skill)}</strong> (${escapeHtml(weakest.score)}/4). ${targets ? "This challenge practises it directly." : "This challenge builds on your current level."}`
        : "This challenge builds on your current level."}</p>
      <button class="btn btn-primary" type="button" data-next-id="${escapeHtml(next.id)}">Start this challenge</button>`;
  };

  // ---- Peer review -------------------------------------------------------

  const renderPeer = (submission, challenge) => {
    const panel = $("peerPanel");
    if (!panel) return;
    const header = `<p class="eyebrow">Peer review circle</p><h2>Review two peers’ work</h2>`;
    const unlocked = submission?.review?.status === "approved";
    if (!unlocked) {
      panel.innerHTML = `${header}<p class="muted">Peer review unlocks once your own work for this challenge is approved.</p>`;
      return;
    }

    const email = (TechLiftStore.getUser()?.email) || "";
    const reviewed = TechLiftStore.getPeerReviews()
      .filter((review) => review.reviewerId === TechLiftStore.getAccount()?.id && review.challengeId === challenge.id)
      .map((review) => review.submissionKey);
    const peers = TechLiftStore.getAllSubmissions()
      .filter((item) => item.challengeId === challenge.id && (item.email || "") !== email && !reviewed.includes(item.storageKey))
      .slice(0, 2);

    if (!peers.length) {
      panel.innerHTML = `${header}<p class="muted">No peer submissions are waiting for you yet. Check back once other learners submit this challenge.</p>`;
      return;
    }

    panel.innerHTML = `
      ${header}
      <p class="muted">Score each skill from 1 to 4 and leave one specific comment. Your review is shared with a mentor for spot-checking.</p>
      ${peers
        .map(
          (peer) => `
            <article class="peer-card">
              <p class="submission-student">${escapeHtml(peer.fullName || "Learner")} · ${escapeHtml(formatDate(peer.submittedAt))}</p>
              <p class="submission-description">${escapeHtml(excerpt(peer.description, 320))}</p>
              ${peer.url && /^https?:\/\//i.test(peer.url) ? `<a class="project-link" href="${escapeHtml(peer.url)}" target="_blank" rel="noreferrer">Open project <span aria-hidden="true">↗</span></a>` : ""}
              <form class="peer-form" data-key="${escapeHtml(peer.storageKey)}">
                ${challenge.skills
                  .map(
                    (skill, index) => `
                      <div class="rubric-row" data-skill="${escapeHtml(skill)}">
                        <label class="rubric-skill">
                          <span>${escapeHtml(skill)}</span>
                          <select name="score" required aria-describedby="anchor-${escapeHtml(peer.storageKey)}-${index}">${scoreOptions()}</select>
                        </label>
                        <small class="rubric-anchor" id="anchor-${escapeHtml(peer.storageKey)}-${index}" aria-live="polite">Choose a score to see what it looks like.</small>
                      </div>`,
                  )
                  .join("")}
                <label class="peer-comment-field">
                  Comment for ${escapeHtml(peer.fullName || "this learner")}
                  <textarea name="comment" rows="2" required placeholder="One thing that works and one thing to try next."></textarea>
                </label>
                <button class="btn btn-primary" type="submit">Submit peer review</button>
              </form>
            </article>`,
        )
        .join("")}`;
  };

  // ---- Mentors -----------------------------------------------------------

  const renderMentorMatch = (user) => {
    const panel = $("matchPanel");
    const directory = TechLiftStore.getMentorDirectory();
    if (panel) {
      const header = `<p class="eyebrow">Find a mentor</p><h2>Matched to your track</h2>`;
      if (!directory.length) {
        panel.innerHTML = `${header}<p class="muted">No mentors have published profiles yet. Mentors publish from the mentor workspace.</p>`;
      } else {
        panel.innerHTML = `
          ${header}
          <div class="match-list">
            ${TechLiftStore.matchMentors(track)
              .slice(0, 3)
              .map(({ mentor, matched }) => {
                const badges = TechLiftStore.mentorBadges(TechLiftStore.mentorStats(mentor.id));
                const selected = user.mentorId === mentor.id;
                return `
                  <article class="match-card ${selected ? "is-selected" : ""}">
                    <div>
                      <strong>${escapeHtml(mentor.name)}</strong>
                      <span class="muted"> · ${escapeHtml(mentor.role)}</span>
                    </div>
                    <p class="match-reason">${matched.length
                      ? `Matches your track: ${escapeHtml(matched.join(", "))}`
                      : "No direct expertise match, but available for general review."}</p>
                    <div class="badge-row">${badges.map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</div>
                    <button class="btn ${selected ? "btn-secondary" : "btn-primary"}" type="button" data-mentor-id="${escapeHtml(mentor.id)}" ${selected ? "disabled" : ""}>
                      ${selected ? "Your mentor" : "Request this mentor"}
                    </button>
                  </article>`;
              })
              .join("")}
          </div>`;
      }
    }

    // Learner-facing mentor card: assigned mentor, otherwise the best match.
    const assigned = user.mentorId ? TechLiftStore.getMentor(user.mentorId) : null;
    const mentor = assigned || TechLiftStore.matchMentors(track)[0]?.mentor || null;
    const name = $("learnerMentorName");
    if (!name) return;
    if (!mentor) {
      name.textContent = "Profile not published";
      $("learnerMentorRole").textContent = "Your mentor’s expertise will appear here.";
      return;
    }
    name.textContent = mentor.name;
    $("learnerMentorRole").textContent = assigned ? mentor.role : `${mentor.role} · recommended for you`;

    const photo = $("learnerMentorPhoto");
    if (mentor.photo && /^data:image\/(png|jpeg|webp);base64,/i.test(mentor.photo)) {
      photo.innerHTML = `<img src="${escapeHtml(mentor.photo)}" alt="" />`;
    } else {
      photo.textContent = mentor.name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
    }

    const credentials = [];
    if (mentor.degrees) credentials.push(["Education", mentor.degrees]);
    if (mentor.certifications) credentials.push(["Certifications", mentor.certifications]);
    if (mentor.experience) credentials.push(["Experience", `${mentor.experience} years`]);
    if (mentor.expertise?.length) credentials.push(["Expertise", mentor.expertise.join(", ")]);
    $("learnerMentorCredentials").innerHTML = credentials
      .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
      .join("");

    const bio = $("learnerMentorBio");
    bio.textContent = mentor.bio || "";
    bio.classList.toggle("hidden", !mentor.bio);
  };

  // ---- Render ------------------------------------------------------------

  const render = () => {
    const user = TechLiftStore.getUser() || DEFAULT_USER;
    const challenge = getChallenge(user);
    const submission = TechLiftStore.getSubmission(user.email || "", challenge.id);

    if ($("userGoal")) $("userGoal").textContent = `Goal: ${user.goal || "Switch careers"}`;
    if ($("userAvailability")) $("userAvailability").textContent = `Availability: ${user.availability || "10 hours/week"}`;

    renderChallenge(user, challenge, submission);
    renderNext(submission, challenge);
    renderRevisions(submission);
    renderPeer(submission, challenge);
    renderMentorMatch(user);
  };

  // ---- Events ------------------------------------------------------------

  challengeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!challengeForm.reportValidity()) return;

    const user = TechLiftStore.getUser() || DEFAULT_USER;
    const challenge = getChallenge(user);
    const email = user.email || "";
    const existing = TechLiftStore.getSubmission(email, challenge.id);
    const now = new Date().toISOString();

    const details = {
      challengeId: challenge.id,
      challenge: challenge.title,
      path: track,
      fullName: user.fullName || firstName,
      email,
      description: challengeSubmission.value.trim(),
      url: challengeUrl.value.trim(),
      submittedAt: now,
    };

    let record;
    if (!existing) {
      record = { ...details, round: 1, history: [], review: null, changeNote: "" };
    } else if (!existing.review) {
      // Not reviewed yet: update the same round in place.
      record = { ...existing, ...details, round: existing.round, history: existing.history };
    } else {
      // Reviewed: archive this round and start the next one.
      const snapshot = {
        round: existing.round,
        description: existing.description,
        url: existing.url,
        submittedAt: existing.submittedAt,
        changeNote: existing.changeNote || "",
        review: existing.review,
      };
      record = {
        ...details,
        storageKey: existing.storageKey,
        round: existing.round + 1,
        history: [...existing.history, snapshot],
        review: null,
        changeNote: challengeChangeNote.value.trim(),
      };
    }

    try {
      TechLiftStore.saveSubmission(record);
    } catch {
      submissionFeedback.textContent = "Could not save your submission. Browser storage may be full.";
      return;
    }
    challengeChangeNote.value = "";
    render();
  });

  $("nextChallengePanel")?.addEventListener("click", (event) => {
    const id = event.target.closest("[data-next-id]")?.dataset.nextId;
    if (!id) return;
    TechLiftStore.saveUser({ challengeId: id });
    fillForm(null);
    render();
  });

  $("peerPanel")?.addEventListener("change", (event) => {
    if (!event.target.matches('select[name="score"]')) return;
    const row = event.target.closest(".rubric-row");
    row.querySelector(".rubric-anchor").textContent = event.target.value
      ? TechLiftRubric.anchor(row.dataset.skill, Number(event.target.value))
      : "Choose a score to see what it looks like.";
  });

  $("peerPanel")?.addEventListener("submit", (event) => {
    const form = event.target.closest(".peer-form");
    if (!form) return;
    event.preventDefault();
    if (!form.reportValidity()) return;

    const user = TechLiftStore.getUser() || DEFAULT_USER;
    const challenge = getChallenge(user);
    const peer = TechLiftStore.getAllSubmissions().find((item) => item.storageKey === form.dataset.key);
    if (!peer) return;

    const reviews = TechLiftStore.getPeerReviews();
    reviews.push({
      id: `peer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewerId: TechLiftStore.getAccount()?.id,
      reviewerName: user.fullName || firstName,
      challengeId: challenge.id,
      submissionKey: peer.storageKey,
      rubric: [...form.querySelectorAll(".rubric-row")].map((row) => ({
        skill: row.dataset.skill,
        score: Number(row.querySelector("select").value),
      })),
      comment: form.elements.comment.value.trim(),
      createdAt: new Date().toISOString(),
      spotCheck: null,
    });

    try {
      TechLiftStore.savePeerReviews(reviews);
    } catch {
      alert("Could not save your peer review. Browser storage may be full.");
      return;
    }
    render();
  });

  $("matchPanel")?.addEventListener("click", (event) => {
    const id = event.target.closest("[data-mentor-id]")?.dataset.mentorId;
    if (!id) return;
    TechLiftStore.saveUser({ mentorId: id });
    render();
  });

  // Initial load: fill the form from any saved submission, then render.
  const initialChallenge = getChallenge(initialUser);
  fillForm(TechLiftStore.getSubmission(initialUser.email || "", initialChallenge.id));
  render();
});
