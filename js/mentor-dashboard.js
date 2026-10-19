TechLiftStore.ready.then(() => {
  if (!TechLiftStore.ensureRole("mentor")) return;
  const { escapeHtml, SCORE_LABELS, getAllSubmissions, saveSubmission } =
    TechLiftStore;
  const submissionList = document.getElementById("submissionList");
  const emptyQueue = document.getElementById("emptyQueue");
  const emptyQueueTitle = document.getElementById("emptyQueueTitle");
  const emptyQueueMessage = document.getElementById("emptyQueueMessage");
  const reviewCount = document.getElementById("reviewCount");
  const submissionFilter = document.getElementById("submissionFilter");
  const submissionSearch = document.getElementById("submissionSearch");
  const mentorStatsPanel = document.getElementById("mentorStatsPanel");
  const calibrationPanel = document.getElementById("calibrationPanel");
  const spotCheckPanel = document.getElementById("spotCheckPanel");

  const mentor = TechLiftStore.getCurrentMentor();
  const mentorId = mentor?.id || "mentor-unassigned";
  const mentorName = mentor?.name || "Mentor";

  const stateLabels = {
    pending: "Needs review",
    approved: "Approved",
    changes: "Changes requested",
  };

  const getState = (submission) => submission.review?.status || "pending";

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Date not available";

  const anchorText = (skill, score) =>
    score
      ? TechLiftRubric.anchor(skill, Number(score))
      : "Choose a score to see what it looks like.";

  const scoreOptions = (selected) =>
    `<option value="" disabled ${selected ? "" : "selected"}>Score</option>` +
    [1, 2, 3, 4]
      .map(
        (score) =>
          `<option value="${score}" ${Number(selected) === score ? "selected" : ""}>${score} · ${SCORE_LABELS[score]}</option>`,
      )
      .join("");

  const reviewFormFor = (submission) => {
    const state = getState(submission);
    const locked = state === "approved";
    const disabled = locked ? "disabled" : "";
    const skills =
      TechLiftChallenges.find(submission.challengeId)?.skills ||
      (submission.review?.rubric || []).map((item) => item.skill);
    const current = submission.review?.rubric || [];
    const previous = submission.history.at(-1)?.review?.rubric || [];

    const rows = skills
      .map((skill, index) => {
        const prior = current.find((item) => item.skill === skill) || {};
        const before = previous.find((item) => item.skill === skill);
        const anchorId = `anchor-${submission.storageKey}-${index}`;
        return `
          <div class="rubric-row" data-skill="${escapeHtml(skill)}">
            <label class="rubric-skill">
              <span>${escapeHtml(skill)}</span>
              ${before ? `<small class="rubric-before">Last round: ${before.score}/4</small>` : ""}
              <select name="score" required aria-describedby="${escapeHtml(anchorId)}" ${disabled}>${scoreOptions(prior.score)}</select>
            </label>
            <small class="rubric-anchor" id="${escapeHtml(anchorId)}" aria-live="polite">${escapeHtml(anchorText(skill, prior.score))}</small>
            <input name="skillNote" type="text" placeholder="One specific note (optional)" value="${escapeHtml(prior.note || "")}" ${disabled} />
          </div>`;
      })
      .join("");

    const buttons = locked
      ? `<button class="btn btn-secondary" type="submit" data-review="reopen">Reopen for revision</button>`
      : `<button class="btn btn-primary" type="submit" data-review="approved">Approve work</button>
         <button class="btn btn-secondary" type="submit" data-review="changes">Request changes</button>`;

    return `
      <form class="submission-review" data-key="${escapeHtml(submission.storageKey)}">
        <div class="rubric">${rows}</div>
        <label for="feedback-${escapeHtml(submission.storageKey)}">Overall mentor feedback</label>
        <textarea id="feedback-${escapeHtml(submission.storageKey)}" name="feedback" placeholder="Be specific: call out what works and what to improve." required ${disabled}>${escapeHtml(submission.review?.feedback || "")}</textarea>
        <div class="review-actions">${buttons}</div>
      </form>`;
  };

  const submissionCard = (submission) => {
    const state = getState(submission);
    const challengeTrack = TechLiftChallenges.label(submission.path);
    const studentName = submission.fullName || submission.email || "Learner";
    const safeUrl =
      submission.url && /^https?:\/\//i.test(submission.url)
        ? `<a class="project-link" href="${escapeHtml(submission.url)}" target="_blank" rel="noreferrer">Open project <span aria-hidden="true">↗</span></a>`
        : "";
    const previous = submission.history.at(-1);
    const previousBlock = previous
      ? `<div class="round-context">
           <p class="eyebrow">Round ${previous.round} feedback</p>
           <p>${escapeHtml(previous.review?.feedback || "No feedback was recorded for this round.")}</p>
         </div>`
      : "";
    const changeBlock = submission.changeNote
      ? `<div class="round-context">
           <p class="eyebrow">What the learner changed</p>
           <p>${escapeHtml(submission.changeNote)}</p>
         </div>`
      : "";

    return `
      <article class="submission-card" data-state="${state}">
        <div class="submission-main">
          <div class="submission-topline">
            <span class="track-label">${escapeHtml(challengeTrack)} track</span>
            ${submission.round > 1 ? `<span class="round-badge">Round ${submission.round}</span>` : ""}
            <span class="review-state ${state}">${stateLabels[state]}</span>
          </div>
          <p class="submission-student">${escapeHtml(studentName)} · Submitted ${escapeHtml(formatDate(submission.submittedAt))}</p>
          <h3>${escapeHtml(submission.challenge)}</h3>
          <p class="submission-description">${escapeHtml(submission.description)}</p>
          ${safeUrl}
          ${changeBlock}
          ${previousBlock}
        </div>
        ${reviewFormFor(submission)}
      </article>`;
  };

  const renderQueue = () => {
    const submissions = getAllSubmissions();
    const filter = submissionFilter.value;
    const query = submissionSearch.value.trim().toLocaleLowerCase();
    const filtered = submissions.filter((submission) => {
      if (filter !== "all" && getState(submission) !== filter) return false;
      const searchable = [
        submission.fullName,
        submission.email,
        submission.challenge,
        TechLiftChallenges.label(submission.path),
        submission.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return !query || searchable.includes(query);
    });
    const pendingCount = submissions.filter(
      (submission) => getState(submission) === "pending",
    ).length;

    reviewCount.textContent = pendingCount;
    emptyQueue.classList.toggle("hidden", filtered.length > 0);
    emptyQueueTitle.textContent = submissions.length
      ? "No matching submissions"
      : "All caught up";
    emptyQueueMessage.textContent = submissions.length
      ? "Try a different learner, challenge, or status filter."
      : "New learner project submissions will appear here.";
    submissionList.innerHTML = filtered.map(submissionCard).join("");
  };

  const renderStats = () => {
    if (!mentorStatsPanel) return;
    const stats = TechLiftStore.mentorStats(mentorId);
    const badges = TechLiftStore.mentorBadges(stats);
    const turnaround =
      stats.avgHours === null
        ? "—"
        : stats.avgHours < 48
          ? `${Math.max(1, Math.round(stats.avgHours))} hours`
          : `${(stats.avgHours / 24).toFixed(1)} days`;
    const words =
      stats.avgWords === null ? "—" : `${Math.round(stats.avgWords)} words`;

    mentorStatsPanel.innerHTML = `
      <p class="eyebrow">Your reviewer profile</p>
      <h2>Reviews and badges</h2>
      <dl class="stat-list">
        <div><dt>Reviews completed</dt><dd>${stats.count}</dd></div>
        <div><dt>Average turnaround</dt><dd>${turnaround}</dd></div>
        <div><dt>Average feedback length</dt><dd>${words}</dd></div>
      </dl>
      <div class="badge-row">
        ${
          badges.length
            ? badges
                .map(
                  (badge) => `<span class="badge">${escapeHtml(badge)}</span>`,
                )
                .join("")
            : `<span class="muted">Badges appear as you review submissions.</span>`
        }
      </div>`;
  };

  const calibrationLabel = (reviewer, groupSize) => {
    if (reviewer.flag === "outlier")
      return "Outlier: schedule a calibration session";
    if (reviewer.flag === "gap") {
      return `Gap of ${Math.abs(reviewer.deviation).toFixed(1)} points: compare notes on this challenge`;
    }
    return groupSize > 2 ? "Aligned with the group" : "Aligned";
  };

  const renderCalibration = () => {
    if (!calibrationPanel) return;
    const rows = TechLiftStore.calibrationReport();
    const body = rows.length
      ? rows
          .map(
            (row) => `
              <div class="calibration-row">
                <h4>${escapeHtml(row.title)} <small>Group average ${row.groupMean.toFixed(1)}/4</small></h4>
                <ul>
                  ${row.reviewers
                    .map((reviewer) => {
                      const sign = reviewer.deviation >= 0 ? "+" : "";
                      return `
                        <li class="calibration-item ${reviewer.flag}">
                          <span>${escapeHtml(reviewer.name)}</span>
                          <span>${reviewer.average.toFixed(1)}/4 · ${sign}${reviewer.deviation.toFixed(1)} vs group</span>
                          <span class="flag">${calibrationLabel(reviewer, row.reviewers.length)}</span>
                        </li>`;
                    })
                    .join("")}
                </ul>
              </div>`,
          )
          .join("")
      : `<p class="muted">Calibration compares mentors who score the same challenge. It appears once at least two mentors have reviewed one challenge.</p>`;

    calibrationPanel.innerHTML = `
      <p class="eyebrow">Calibration</p>
      <h2>Are mentors scoring alike?</h2>
      ${body}`;
  };

  const renderSpotChecks = () => {
    if (!spotCheckPanel) return;
    const submissions = getAllSubmissions();
    const reviews = TechLiftStore.getPeerReviews();
    const body = reviews.length
      ? reviews
          .map((review) => {
            const peer = submissions.find(
              (submission) => submission.storageKey === review.submissionKey,
            );
            const scores = (review.rubric || [])
              .map(
                (item) => `
                  <li>
                    <span>${escapeHtml(item.skill)}</span>
                    <strong>${escapeHtml(item.score)}/4</strong>
                    ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
                  </li>`,
              )
              .join("");
            const check = review.spotCheck
              ? `<p class="spot-check ${review.spotCheck.verdict}">
                   You ${review.spotCheck.verdict === "agree" ? "agreed with" : "disagreed with"} these scores${review.spotCheck.note ? `: ${escapeHtml(review.spotCheck.note)}` : "."}
                 </p>`
              : `<form class="spot-check-form" data-review-id="${escapeHtml(review.id)}">
                   <label>Spot-check note <input name="note" type="text" placeholder="Optional: what you would change" /></label>
                   <div class="review-actions">
                     <button class="btn btn-primary" type="submit" data-verdict="agree">Agree with scores</button>
                     <button class="btn btn-secondary" type="submit" data-verdict="disagree">Disagree</button>
                   </div>
                 </form>`;
            return `
              <article class="peer-review-card">
                <p class="submission-student">${escapeHtml(review.reviewerName)} reviewed ${escapeHtml(peer?.fullName || "a peer")}’s work · ${escapeHtml(formatDate(review.createdAt))}</p>
                <p class="submission-description">${escapeHtml(peer?.description || "This submission is no longer available.")}</p>
                <ul class="peer-scores">${scores}</ul>
                ${review.comment ? `<p class="peer-comment">“${escapeHtml(review.comment)}”</p>` : ""}
                ${check}
              </article>`;
          })
          .join("")
      : `<p class="muted">Peer reviews from learners will appear here for spot-checking.</p>`;

    spotCheckPanel.innerHTML = `
      <p class="eyebrow">Peer review spot-checks</p>
      <h2>Check learner peer reviews</h2>
      ${body}`;
  };

  const renderAll = () => {
    renderQueue();
    renderStats();
    renderCalibration();
    renderSpotChecks();
  };

  submissionList.addEventListener("submit", (event) => {
    const form = event.target.closest(".submission-review");
    if (!form) return;
    event.preventDefault();

    const action = event.submitter?.dataset.review;
    if (!action) return;

    const record = getAllSubmissions().find(
      (submission) => submission.storageKey === form.dataset.key,
    );
    if (!record) return;

    if (action === "reopen") {
      record.review = { ...record.review, status: "pending" };
    } else {
      if (!form.reportValidity()) return;
      const rubric = [...form.querySelectorAll(".rubric-row")].map((row) => ({
        skill: row.dataset.skill,
        score: Number(row.querySelector("select").value),
        note: row.querySelector('input[name="skillNote"]').value.trim(),
      }));
      record.review = {
        status: action,
        feedback: form.elements.feedback.value.trim(),
        rubric,
        reviewerId: mentorId,
        reviewerName: mentorName,
        reviewedAt: new Date().toISOString(),
      };
    }

    try {
      saveSubmission(record);
    } catch {
      alert("Could not save this review. Browser storage may be full.");
      return;
    }
    renderAll();
  });

  spotCheckPanel?.addEventListener("submit", (event) => {
    const form = event.target.closest(".spot-check-form");
    if (!form) return;
    event.preventDefault();

    const verdict = event.submitter?.dataset.verdict;
    if (!verdict) return;

    const reviews = TechLiftStore.getPeerReviews();
    const review = reviews.find((item) => item.id === form.dataset.reviewId);
    if (!review) return;

    review.spotCheck = {
      verdict,
      note: form.elements.note.value.trim(),
      mentorId,
      checkedAt: new Date().toISOString(),
    };
    TechLiftStore.savePeerReviews(reviews);
    renderSpotChecks();
  });

  submissionList.addEventListener("change", (event) => {
    if (!event.target.matches('select[name="score"]')) return;
    const row = event.target.closest(".rubric-row");
    row.querySelector(".rubric-anchor").textContent = anchorText(
      row.dataset.skill,
      event.target.value,
    );
  });

  submissionFilter.addEventListener("change", renderQueue);
  submissionSearch.addEventListener("input", renderQueue);
  renderAll();
});
