document.addEventListener("DOMContentLoaded", () => {
  const submissionList = document.getElementById("submissionList");
  const emptyQueue = document.getElementById("emptyQueue");
  const reviewCount = document.getElementById("reviewCount");
  const submissionFilter = document.getElementById("submissionFilter");
  const storagePrefix = "techliftChallenge:";

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

  const getSubmissions = () => {
    const submissions = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(storagePrefix)) continue;

      try {
        const submission = JSON.parse(localStorage.getItem(key));
        if (submission && submission.description) {
          submissions.push({
            ...submission,
            email: key.slice(storagePrefix.length),
            storageKey: key,
          });
        }
      } catch {
        continue;
      }
    }
    return submissions.sort(
      (first, second) =>
        new Date(second.submittedAt || 0) - new Date(first.submittedAt || 0),
    );
  };

  const getState = (submission) => submission.review?.status || "pending";

  const render = () => {
    const submissions = getSubmissions();
    const filter = submissionFilter.value;
    const filtered = submissions.filter((submission) => {
      const state = getState(submission);
      return filter === "all" || state === filter;
    });
    const pendingCount = submissions.filter(
      (submission) => getState(submission) === "pending",
    ).length;

    reviewCount.textContent = pendingCount;
    emptyQueue.classList.toggle("hidden", filtered.length > 0);
    submissionList.innerHTML = filtered
      .map((submission) => {
        const state = getState(submission);
        const stateLabel = {
          pending: "Needs review",
          approved: "Approved",
          changes: "Changes requested",
        }[state];
        const studentName =
          submission.fullName || submission.email || "Learner";
        const date = submission.submittedAt
          ? new Date(submission.submittedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Date not available";
        const safeUrl =
          submission.url && /^https?:\/\//i.test(submission.url)
            ? `<a class="project-link" href="${escapeHtml(submission.url)}" target="_blank" rel="noreferrer">Open project <span aria-hidden="true">↗</span></a>`
            : "";
        const feedback = submission.review?.feedback || "";
        const disabled = state === "approved" ? "disabled" : "";

        return `
          <article class="submission-card" data-state="${state}">
            <div class="submission-main">
              <div class="submission-topline">
                <span class="track-label">${escapeHtml(submission.path || "Learner")} track</span>
                <span class="review-state ${state}">${stateLabel}</span>
              </div>
              <p class="submission-student">${escapeHtml(studentName)} · Submitted ${escapeHtml(date)}</p>
              <h3>${escapeHtml(submission.challenge || "Weekly challenge")}</h3>
              <p class="submission-description">${escapeHtml(submission.description)}</p>
              ${safeUrl}
            </div>
            <form class="submission-review" data-key="${escapeHtml(submission.storageKey)}">
              <label for="feedback-${escapeHtml(submission.email)}">Mentor feedback</label>
              <textarea id="feedback-${escapeHtml(submission.email)}" name="feedback" placeholder="Be specific: call out what works and what to improve." required ${disabled}>${escapeHtml(feedback)}</textarea>
              <div class="review-actions">
                <button class="btn btn-primary" type="submit" data-review="approved" ${disabled}>Approve work</button>
                <button class="btn btn-secondary" type="submit" data-review="changes" ${disabled}>Request changes</button>
              </div>
            </form>
          </article>
        `;
      })
      .join("");
  };

  submissionList.addEventListener("submit", (event) => {
    const form = event.target.closest(".submission-review");
    if (!form) return;
    event.preventDefault();

    const feedback = form.elements.feedback.value.trim();
    if (!feedback) {
      form.elements.feedback.reportValidity();
      return;
    }

    const action = event.submitter?.dataset.review;
    if (!action) return;

    const submission = JSON.parse(
      localStorage.getItem(form.dataset.key) || "null",
    );
    if (!submission) return;

    submission.review = {
      status: action,
      feedback,
      reviewedAt: new Date().toISOString(),
    };
    localStorage.setItem(form.dataset.key, JSON.stringify(submission));
    render();
  });

  submissionFilter.addEventListener("change", render);
  render();
});
