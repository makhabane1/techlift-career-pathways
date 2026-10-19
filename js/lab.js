// Challenge Lab: browse challenges, read their criteria, and submit work for mentor review.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const account = TechLiftStore.getAccount();
  const user = TechLiftStore.getUser() || {};
  const isLearner = account && account.role === "learner";

  const filters = document.getElementById("labFilters");
  const list = document.getElementById("labList");
  const detail = document.getElementById("labDetail");

  const trackIds = Object.keys(TechLiftChallenges.tracks);
  const kinds = {
    github: "GitHub repository",
    deployed: "Deployed project",
    screenshot: "Screenshot (link to the image)",
    link: "Other link",
    written: "Written solution",
  };
  const stateLabels = {
    approved: "Approved",
    changes: "Changes requested",
    pending: "In mentor review",
  };

  let activeTrack = user.path && trackIds.includes(user.path) ? user.path : "all";
  let selectedId = null;

  // Each challenge's latest submission by this learner, if any
  const submissionFor = (challengeId) =>
    isLearner ? TechLiftStore.getSubmission(user.email || "", challengeId) : null;

  const statusOf = (challengeId) => {
    const record = submissionFor(challengeId);
    if (!record) return null;
    return record.review?.status || "pending";
  };

  const renderFilters = () => {
    const options = [["all", "All tracks"], ...trackIds.map((id) => [id, TechLiftChallenges.label(id)])];
    filters.innerHTML = options
      .map(([value, label]) => `<button type="button" class="filter-btn ${value === activeTrack ? "active" : ""}" data-track="${escapeHtml(value)}" aria-pressed="${value === activeTrack}">${escapeHtml(label)}</button>`)
      .join("");
  };

  const renderList = () => {
    const challenges = trackIds
      .filter((id) => activeTrack === "all" || id === activeTrack)
      .flatMap((track) => TechLiftChallenges.forTrack(track).map((challenge) => ({ ...challenge, track })));
    list.innerHTML = challenges
      .map((challenge) => {
        const status = statusOf(challenge.id);
        return `
          <li class="source-card">
            <p class="eyebrow">${escapeHtml(TechLiftChallenges.label(challenge.track))} · ${escapeHtml(TechLiftChallengeLab.difficulty[challenge.level])} · ${escapeHtml(challenge.time)}</p>
            <h2><button type="button" class="button-link lab-open" data-id="${escapeHtml(challenge.id)}">${escapeHtml(challenge.title)}</button></h2>
            <p class="muted">${escapeHtml(challenge.brief)}</p>
            ${status ? `<p class="small"><strong>${escapeHtml(stateLabels[status])}</strong></p>` : ""}
          </li>`;
      })
      .join("");
  };

  const findChallenge = (id) => {
    const found = TechLiftChallenges.find(id);
    return found ? { ...found } : null;
  };

  const renderDetail = () => {
    const challenge = selectedId ? findChallenge(selectedId) : null;
    if (!challenge) {
      detail.innerHTML = "";
      return;
    }
    const content = TechLiftChallengeLab.forChallenge(challenge.id);
    const record = submissionFor(challenge.id);
    const review = record?.review;
    const sameTrack = isLearner && user.path === challenge.track;
    const needsNote = Boolean(review);

    detail.innerHTML = `
      <div class="container lab-layout">
        <article class="panel lab-brief">
          <p class="eyebrow">${escapeHtml(TechLiftChallenges.label(challenge.track))} · ${escapeHtml(TechLiftChallengeLab.difficulty[challenge.level])} · ${escapeHtml(challenge.time)}</p>
          <h2 id="labDetailTitle">${escapeHtml(challenge.title)}</h2>
          <p>${escapeHtml(challenge.brief)}</p>

          <h3 class="lab-sub">What you will practise</h3>
          <ul class="plain-list">${content.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

          <h3 class="lab-sub">What a reviewer looks for</h3>
          <ul class="plain-list">${content.acceptance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

          <h3 class="lab-sub">Skills scored (1 to 4 each)</h3>
          <ul class="skill-chips">${challenge.skills.map((skill) => `<li class="skill-chip">${escapeHtml(skill)}</li>`).join("")}</ul>

          ${review ? `
            <h3 class="lab-sub">Mentor feedback</h3>
            <p class="lab-feedback">${escapeHtml(review.feedback)}</p>
            <ul class="skill-chips">${(review.rubric || []).map((item) => `<li class="skill-chip ${Number(item.score) >= 3 ? "verified" : ""}">${escapeHtml(item.skill)} · ${escapeHtml(item.score)}/4</li>`).join("")}</ul>` : ""}
        </article>

        <div class="panel lab-submit">
          ${!isLearner ? `
            <p class="eyebrow">Submit your work</p>
            <h2>Sign in as a learner to submit</h2>
            <div class="cta-row"><a class="btn btn-primary" href="login.html">Sign in</a><a class="btn btn-secondary" href="signup.html">Create an account</a></div>` : !sameTrack ? `
            <p class="eyebrow">Submit your work</p>
            <h2>This challenge is in another track</h2>
            <p class="muted">Submissions are for challenges in your learning track (${escapeHtml(TechLiftChallenges.label(user.path || "frontend"))}). Choose this track in the Career DNA page or the route builder to work on it.</p>` : `
            <p class="eyebrow">Submit your work</p>
            <h2>${record ? "Update your submission" : "Submit your work"}</h2>
            <form id="labForm" class="lab-form" novalidate>
              <label>
                <span class="field-label">Type of evidence</span>
                <select name="kind">
                  ${Object.entries(kinds).map(([value, label]) => `<option value="${value}" ${record?.kind === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
                </select>
              </label>
              <label>
                <span class="field-label">Link (GitHub, deployed site, or image)</span>
                <input name="url" type="url" maxlength="300" placeholder="https://" value="${escapeHtml(record?.url || "")}" />
              </label>
              <label>
                <span class="field-label">What did you build, and what did you decide?</span>
                <textarea name="description" rows="5" required maxlength="5000" placeholder="Describe the work, the decisions you made, and what you would change next.">${escapeHtml(record?.description || "")}</textarea>
              </label>
              ${needsNote ? `
                <label>
                  <span class="field-label">What changed since the last feedback?</span>
                  <textarea name="changeNote" rows="3" required maxlength="1000"></textarea>
                </label>` : ""}
              <p id="labError" class="form-error" role="alert"></p>
              <div class="cta-row">
                <button class="btn btn-primary" type="submit">${record ? "Send update" : "Submit for review"}</button>
                <button class="btn btn-secondary" type="button" id="labStart">Work on this on my dashboard</button>
              </div>
            </form>`}
        </div>
      </div>`;
  };

  const checkSubmission = (form) => {
    const kind = form.elements.kind.value;
    const url = form.elements.url.value.trim();
    if (kind === "github" && !/^https:\/\/github\.com\//i.test(url)) return "A GitHub submission needs a link that starts with https://github.com/.";
    if ((kind === "deployed" || kind === "screenshot") && !url) return "Add a link to the deployed project or the screenshot.";
    if (url && !/^https?:\/\//i.test(url)) return "The link must start with http:// or https://";
    return "";
  };

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-track]");
    if (!button) return;
    activeTrack = button.dataset.track;
    renderFilters();
    renderList();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".lab-open");
    if (!button) return;
    selectedId = button.dataset.id;
    renderDetail();
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  detail.addEventListener("submit", async (event) => {
    const form = event.target.closest("#labForm");
    if (!form) return;
    event.preventDefault();
    const error = document.getElementById("labError");
    error.textContent = "";
    if (!form.reportValidity()) return;
    const problem = checkSubmission(form);
    if (problem) {
      error.textContent = problem;
      form.elements.url.focus();
      return;
    }

    const challenge = findChallenge(selectedId);
    const existing = TechLiftStore.getSubmission(user.email || "", challenge.id);
    const record = {
      challengeId: challenge.id,
      challenge: challenge.title,
      path: challenge.track,
      fullName: user.fullName || account.name,
      email: user.email || account.email,
      description: form.elements.description.value.trim(),
      url: form.elements.url.value.trim(),
      kind: form.elements.kind.value,
      changeNote: form.elements.changeNote ? form.elements.changeNote.value.trim() : "",
      submittedAt: new Date().toISOString(),
      review: existing?.review || null,
    };
    await TechLiftStore.saveSubmission(record);
    renderList();
    renderDetail();
  });

  detail.addEventListener("click", async (event) => {
    if (event.target.id !== "labStart") return;
    const challenge = findChallenge(selectedId);
    await TechLiftStore.saveUser({ challengeId: challenge.id });
    window.location.href = "dashboard.html";
  });

  renderFilters();
  renderList();
  if (isLearner && user.challengeId) {
    // Open the challenge the learner is working on, so the page starts somewhere useful
    selectedId = user.challengeId;
    renderDetail();
  }
});
