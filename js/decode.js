// Opportunity decoder: finds the skills and tools named in a job advert, then
// compares them with what the signed-in learner has already covered.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const form = document.getElementById("decodeForm");
  const results = document.getElementById("decodeResults");
  const known = new Set(TechLiftStore.getUser()?.route?.knownSkills || []);
  const signedIn = Boolean(TechLiftStore.getAccount());

  // The challenge that practises a skill, so the learner knows where to go next.
  const coveredBy = (skill) => {
    for (const track of Object.keys(TechLiftChallenges.tracks)) {
      const challenge = TechLiftChallenges.forTrack(track).find((item) => item.skills.includes(skill));
      if (challenge) return { track, challenge };
    }
    return null;
  };

  const render = (text) => {
    const { skills, tools } = TechLiftSkillKeywords.decode(text);

    if (!skills.length && !tools.length) {
      results.innerHTML = `
        <div class="panel empty-state">
          <p class="eyebrow">Results</p>
          <h2>No skills found in this text.</h2>
          <p class="muted">Paste the full advert, including the requirements or “what you will do” section.</p>
        </div>`;
      return;
    }

    const missing = skills.filter((skill) => !known.has(skill));
    const have = skills.filter((skill) => known.has(skill));

    results.innerHTML = `
      <div class="panel route-summary">
        <p class="eyebrow">What this advert asks for</p>
        <h2>${skills.length} ${skills.length === 1 ? "skill" : "skills"} and ${tools.length} ${tools.length === 1 ? "tool" : "tools"} named</h2>
        ${signedIn
          ? `<p>You have covered <strong>${have.length}</strong> of these in your route. <strong>${missing.length}</strong> still to learn.</p>`
          : `<p class="muted">Sign in to see which of these you have already covered in your route.</p>`}
      </div>

      ${missing.length ? `
        <div class="panel route-gaps">
          <p class="eyebrow">Still to learn</p>
          <ul class="plain-list">
            ${missing.map((skill) => {
              const match = coveredBy(skill);
              return `<li>
                <strong>${escapeHtml(skill)}</strong>
                ${match
                  ? ` <span class="muted">· practised in “${escapeHtml(match.challenge.title)}”</span>
                     <a class="text-link" href="route.html?track=${escapeHtml(match.track)}">Build a route</a>`
                  : ""}
              </li>`;
            }).join("")}
          </ul>
        </div>` : ""}

      ${have.length ? `
        <div class="panel route-gaps">
          <p class="eyebrow">Already covered</p>
          <ul class="skill-chips">${have.map((skill) => `<li class="skill-chip verified">${escapeHtml(skill)}</li>`).join("")}</ul>
        </div>` : ""}

      ${tools.length ? `
        <div class="panel route-gaps">
          <p class="eyebrow">Tools named</p>
          <ul class="skill-chips">${tools.map((tool) => `<li class="skill-chip">${escapeHtml(tool)}</li>`).join("")}</ul>
        </div>` : ""}`;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = document.getElementById("advertText").value;
    if (!text.trim()) {
      document.getElementById("advertText").focus();
      results.innerHTML = `<div class="panel empty-state"><p class="muted">Paste an advert first.</p></div>`;
      return;
    }
    render(text);
  });
});
