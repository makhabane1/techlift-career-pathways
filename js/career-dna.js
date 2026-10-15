// Career DNA: scores career profiles against the learner's answers and explains each match.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const account = TechLiftStore.getAccount();
  const current = TechLiftStore.getUser()?.careerChoice || null;

  const form = document.getElementById("dnaForm");
  const results = document.getElementById("dnaResults");
  const errorBox = document.getElementById("dnaError");
  const compareSection = document.getElementById("compareSection");
  const compareTable = document.getElementById("dnaCompare");

  const hourOptions = [2, 5, 10, 15];
  let lastMatches = [];

  const hoursFrom = (text) => {
    const match = /(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/.exec(text || "");
    return match ? (Number(match[1]) + Number(match[2])) / 2 : 0;
  };

  const checkbox = (name, value, label) => `
    <label class="check-skill">
      <input type="checkbox" name="${name}" value="${escapeHtml(value)}" />
      <span>${escapeHtml(label)}</span>
    </label>`;

  const radio = (name, value, label, checked = false) => `
    <label class="choice">
      <input type="radio" name="${name}" value="${escapeHtml(value)}" ${checked ? "checked" : ""} />
      <span>${escapeHtml(label)}</span>
    </label>`;

  document.getElementById("interestChoices").innerHTML = Object.entries(TechLiftCareers.interests)
    .map(([value, label]) => checkbox("interests", value, label)).join("");
  document.getElementById("existingChoices").innerHTML = Object.entries(TechLiftCareers.existing)
    .map(([value, label]) => checkbox("existing", value, label)).join("");
  document.getElementById("styleChoices").innerHTML = Object.entries(TechLiftCareers.styles)
    .map(([value, label], index) => radio("style", value, label, index === 0)).join("");
  document.getElementById("hourChoices").innerHTML = hourOptions
    .map((hours) => radio("hours", String(hours), `${hours} hours`, hours === 5)).join("");
  document.getElementById("budgetChoices").innerHTML = [
    radio("budget", "free", "Free resources only", true),
    radio("budget", "some", "Paid options are fine"),
  ].join("");

  // Scoring: interests count most, then working style, then existing skills.
  // The score only ranks the careers; it does not predict success.
  const score = (career, answers) => {
    const interestMatches = career.interests.filter((item) => answers.interests.includes(item));
    const styleMatches = career.styles.filter((item) => answers.style === item);
    const existingMatches = career.existing.filter((item) => answers.existing.includes(item));
    const points = interestMatches.length * 3 + styleMatches.length * 2 + existingMatches.length * 2;
    return {
      career,
      points,
      interestMatches,
      styleMatches,
      existingMatches,
    };
  };

  const readAnswers = () => {
    const data = new FormData(form);
    return {
      interests: data.getAll("interests"),
      style: data.get("style"),
      existing: data.getAll("existing"),
      hours: Number(data.get("hours")) || 5,
      budget: data.get("budget") || "free",
    };
  };

  const trackSummary = (career, answers) => {
    if (!career.track) {
      return `<p class="muted">TechLift does not have challenges for this career yet. Look at the skills listed here, and check the Opportunity hub for learnerships and entry-level roles in this area.</p>`;
    }
    const challenges = TechLiftChallenges.forTrack(career.track);
    const hours = challenges.reduce((total, challenge) => total + hoursFrom(challenge.time), 0);
    const weeks = Math.ceil(hours / answers.hours);
    const free = TechLiftResources.forTrack(career.track).filter((resource) => resource.cost.startsWith("Free")).length;
    const budgetNote = answers.budget === "free"
      ? `${free} free ${free === 1 ? "resource" : "resources"} listed for this track.`
      : "Paid options are included when you open the route.";
    return `<p>TechLift track: <strong>${escapeHtml(TechLiftChallenges.label(career.track))}</strong>, with ${challenges.length} challenges. About ${Math.round(hours)} hours of practice, which is about ${weeks} ${weeks === 1 ? "week" : "weeks"} at ${answers.hours} hours a week. ${escapeHtml(budgetNote)}</p>`;
  };

  const render = (answers) => {
    const ranked = TechLiftCareers.careers
      .map((career) => score(career, answers))
      .filter((item) => item.points > 0)
      .sort((first, second) => second.points - first.points)
      .slice(0, 4);
    lastMatches = ranked;

    if (!ranked.length) {
      results.innerHTML = `
        <div class="panel empty-state">
          <p class="eyebrow">Your matches</p>
          <h2>Choose at least one interest or working style.</h2>
          <p class="muted">The matches are based on what you choose, so the more you tell us, the better they fit.</p>
        </div>`;
      compareSection.hidden = true;
      return;
    }

    const label = (key, dictionary) => dictionary[key] || key;
    results.innerHTML = `
      <p class="muted small">Showing ${ranked.length} of ${TechLiftCareers.careers.length} career profiles, ranked by how many of your answers they match.</p>
      ${ranked.map((item) => {
        const reasons = [
          ...item.interestMatches.map((interest) => `You are interested in ${label(interest, TechLiftCareers.interests).toLowerCase()}.`),
          ...item.styleMatches.map((style) => `You prefer to work by ${label(style, TechLiftCareers.styles).toLowerCase()}.`),
          ...item.existingMatches.map((skill) => `You told us: ${label(skill, TechLiftCareers.existing)}.`),
        ];
        const isCurrent = current && current.id === item.career.id;
        return `
          <article class="panel dna-result" data-career="${escapeHtml(item.career.id)}">
            <label class="compare-pick">
              <input type="checkbox" value="${escapeHtml(item.career.id)}" data-compare />
              <span>Compare</span>
            </label>
            <p class="eyebrow">${escapeHtml(item.career.track ? "Has TechLift challenges" : "Not yet on TechLift")}</p>
            <h2>${escapeHtml(item.career.title)}</h2>
            <p>${escapeHtml(item.career.summary)}</p>
            <div>
              <p class="field-label">Why it came up</p>
              <ul class="plain-list">${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
            </div>
            <div>
              <p class="field-label">Typical skills</p>
              <ul class="skill-chips">${item.career.skills.map((skill) => `<li class="skill-chip">${escapeHtml(skill)}</li>`).join("")}</ul>
            </div>
            ${trackSummary(item.career, answers)}
            ${account
              ? (isCurrent
                ? `<p class="muted">This is on your roadmap. <a class="text-link" href="bridge.html">Open my roadmap</a></p>`
                : `<button class="btn btn-primary" type="button" data-choose="${escapeHtml(item.career.id)}">Add to my roadmap</button>`)
              : `<p class="muted">Sign in to add this career to your roadmap.</p>`}
          </article>`;
      }).join("")}`;
    compareSection.hidden = true;
  };

  const renderCompare = () => {
    const picked = [...results.querySelectorAll("[data-compare]:checked")].map((box) => box.value);
    if (picked.length < 2) {
      compareSection.hidden = true;
      return;
    }
    const careers = picked.slice(0, 3).map((id) => lastMatches.find((item) => item.career.id === id)).filter(Boolean);
    const rows = [
      ["What it involves", (item) => escapeHtml(item.career.summary)],
      ["Typical skills", (item) => escapeHtml(item.career.skills.join(", "))],
      ["TechLift track", (item) => item.career.track ? escapeHtml(TechLiftChallenges.label(item.career.track)) : "Not yet on TechLift"],
      ["Your matches", (item) => `${item.points} points`],
    ];
    compareTable.innerHTML = `
      <caption class="visually-hidden">Comparison of the careers you picked</caption>
      <thead><tr><td></td>${careers.map((item) => `<th scope="col">${escapeHtml(item.career.title)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(([label, cell]) => `<tr><th scope="row">${escapeHtml(label)}</th>${careers.map((item) => `<td>${cell(item)}</td>`).join("")}</tr>`).join("")}</tbody>`;
    compareSection.hidden = false;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorBox.textContent = "";
    const answers = readAnswers();
    if (!answers.interests.length && !answers.existing.length) {
      errorBox.textContent = "Choose at least one interest or skill you already have.";
      return;
    }
    render(answers);
  });

  results.addEventListener("change", (event) => {
    if (event.target.matches("[data-compare]")) renderCompare();
  });

  results.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-choose]");
    if (!button) return;
    button.disabled = true;
    button.textContent = "Saving…";
    await TechLiftStore.saveUser({ careerChoice: { id: button.dataset.choose } });
    window.location.href = "bridge.html";
  });
});
