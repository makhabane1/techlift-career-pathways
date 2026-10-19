TechLiftStore.ready.then(() => {
  if (!TechLiftStore.ensureRole("learner")) return;
  const { escapeHtml, passportEntries, getUser } = TechLiftStore;
  const card = document.getElementById("passportCard");
  const user = getUser() || {};
  const entries = passportEntries(user.email || "");

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : "";

  // Group evidence by skill; keep the best score and every supporting challenge.
  const bySkill = new Map();
  entries.forEach((entry) => {
    const group = bySkill.get(entry.skill) || { skill: entry.skill, best: 0, evidence: [] };
    group.best = Math.max(group.best, entry.score);
    group.evidence.push(entry);
    bySkill.set(entry.skill, group);
  });
  const skills = [...bySkill.values()].sort((first, second) => second.evidence.length - first.evidence.length);

  const header = `
    <header class="passport-header">
      <div>
        <p class="eyebrow">${escapeHtml(TechLiftChallenges.label(user.path || "frontend"))}</p>
        <h2>${escapeHtml(user.fullName || "Learner")}</h2>
      </div>
      <dl class="stat-list">
        <div><dt>Verified skills</dt><dd>${skills.length}</dd></div>
        <div><dt>Approved challenges</dt><dd>${new Set(entries.map((entry) => entry.challengeId)).size}</dd></div>
      </dl>
    </header>`;

  const body = skills.length
    ? `<ul class="passport-skills">
        ${skills
          .map(
            (group) => `
              <li class="passport-skill">
                <div class="passport-skill-head">
                  <strong>${escapeHtml(group.skill)}</strong>
                  <span class="skill-chip verified">Best ${group.best}/4</span>
                </div>
                <ul class="passport-evidence">
                  ${group.evidence
                    .map(
                      (item) => `
                        <li>
                          <span>${escapeHtml(item.challenge)}</span>
                          <small>Scored ${item.score}/4 by ${escapeHtml(item.mentor)} · ${escapeHtml(formatDate(item.reviewedAt))}</small>
                          ${item.url && /^https?:\/\//i.test(item.url)
                            ? `<a class="project-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">View project</a>`
                            : ""}
                        </li>`,
                    )
                    .join("")}
                </ul>
              </li>`,
          )
          .join("")}
      </ul>`
    : `<div class="empty-passport">
         <p class="eyebrow">Nothing verified yet</p>
         <h3>Your first approved challenge adds skills here.</h3>
         <p class="muted">Submit your work on the dashboard. Skills appear once a mentor scores them 3 or higher.</p>
         <a class="btn btn-secondary" href="dashboard.html">Go to dashboard</a>
       </div>`;

  // Skills the learner marked as already known on the route. TechLift has not
  // checked these, so they are shown separately from mentor-verified skills.
  const verifiedNames = new Set(skills.map((group) => group.skill));
  const selfDeclared = (user.route?.knownSkills || []).filter((skill) => !verifiedNames.has(skill));
  const declaredBlock = selfDeclared.length
    ? `<section class="passport-declared" aria-labelledby="declaredHeading">
         <h3 id="declaredHeading">Self-declared skills</h3>
         <p class="muted">You marked these as skills you already have. TechLift has not checked them, so they are not verified.</p>
         <ul class="passport-declared-list">${selfDeclared.map((skill) => `<li><span class="skill-chip">${escapeHtml(skill)}</span></li>`).join("")}</ul>
       </section>`
    : "";

  const legend = `<p class="passport-legend muted"><strong>Verified</strong> means a TechLift mentor scored this skill 3 or higher on an approved challenge. It is an internal review. It is not an official industry certificate or qualification.</p>`;

  card.innerHTML = `${header}${legend}${body}${declaredBlock}`;

  document.getElementById("printPassport").addEventListener("click", () => window.print());
});
