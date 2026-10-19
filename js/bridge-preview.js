// Homepage preview of The Bridge: a read-only sample of the frontend route.
// It uses the same route data as My roadmap but never reads or saves a
// learner's progress, so it always shows the sample and nothing else.
(() => {
  const host = document.getElementById("bridgePreview");
  if (!host || typeof TechLiftCareerData === "undefined") return;
  const path = TechLiftCareerData.career_paths.find((item) => item.id === "frontend");
  if (!path) return;
  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
    );

  const nodes = path.milestones
    .map(
      (milestone, index) => `
      <li>
        <button type="button" class="bridge-node" data-index="${index}" aria-pressed="false">
          <span class="bridge-node-number">${String(index + 1).padStart(2, "0")}</span>
          <span>${escapeHtml(milestone.label)}</span>
        </button>
      </li>`,
    )
    .join("");

  host.innerHTML = `
    <p class="bridge-sample-note">Sample route: frontend development. Your own progress appears on My roadmap after you sign in.</p>
    <ol class="bridge-track" aria-label="Sample frontend milestones">${nodes}</ol>
    <div class="bridge-detail" aria-live="polite"></div>`;

  const detail = host.querySelector(".bridge-detail");
  const buttons = [...host.querySelectorAll(".bridge-node")];

  const show = (index) => {
    const milestone = path.milestones[index];
    const skills = milestone.needs?.skills || [];
    const challenges = milestone.needs?.challenges || [];
    buttons.forEach((button, position) =>
      button.setAttribute("aria-pressed", String(position === index)),
    );
    detail.innerHTML = `
      <h3>${escapeHtml(milestone.label)}</h3>
      <p>${skills.length ? `Skills to show: ${escapeHtml(skills.join(", "))}.` : "No skills are required at this step."}</p>
      <p>${challenges.length ? `Challenges to finish: ${escapeHtml(challenges.join(", "))}.` : "No challenge is required at this step."}</p>`;
  };

  buttons.forEach((button) =>
    button.addEventListener("click", () => show(Number(button.dataset.index))),
  );
  show(0);
})();
