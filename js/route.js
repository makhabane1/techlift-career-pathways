// Route builder: turns a track, known skills, weekly hours, and budget into an
// ordered list of challenges, time estimate, skill gaps, and resources.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const account = TechLiftStore.getAccount();
  const saved = TechLiftStore.getUser()?.route || null;
  const params = new URLSearchParams(window.location.search);

  const trackIds = Object.keys(TechLiftChallenges.tracks);
  const hourOptions = [2, 5, 10, 15];
  const budgetOptions = {
    free: "Free resources only",
    some: "Paid options are fine",
  };

  const requested = params.get("track");
  const state = {
    track: trackIds.includes(requested) ? requested : saved?.track || TechLiftStore.getUser()?.path || "frontend",
    hours: hourOptions.includes(Number(saved?.hours)) ? Number(saved.hours) : 5,
    budget: budgetOptions[saved?.budget] ? saved.budget : "free",
    knownSkills: new Set(saved?.knownSkills || []),
    completedSteps: new Set(saved?.completedSteps || []),
  };

  const form = document.getElementById("routeForm");
  const results = document.getElementById("routeResults");
  const savePanel = document.getElementById("savePanel");

  // Reads "2-3 hours" as 2.5.
  const hoursFrom = (text) => {
    const match = /(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/.exec(text || "");
    return match ? (Number(match[1]) + Number(match[2])) / 2 : 0;
  };

  const radio = (name, value, label, checked) => `
    <label class="choice">
      <input type="radio" name="${name}" value="${escapeHtml(value)}" ${checked ? "checked" : ""} />
      <span>${escapeHtml(label)}</span>
    </label>`;

  const renderChoices = () => {
    document.getElementById("trackChoices").innerHTML = trackIds
      .map((id) => radio("track", id, TechLiftChallenges.label(id), id === state.track))
      .join("");
    document.getElementById("hourChoices").innerHTML = hourOptions
      .map((hours) => radio("hours", String(hours), `${hours} hours`, hours === state.hours))
      .join("");
    document.getElementById("budgetChoices").innerHTML = Object.entries(budgetOptions)
      .map(([value, label]) => radio("budget", value, label, value === state.budget))
      .join("");

    const skills = [];
    trackIds.forEach((id) => {
      TechLiftChallenges.forTrack(id).forEach((challenge) => {
        challenge.skills.forEach((skill) => {
          if (!skills.includes(skill)) skills.push(skill);
        });
      });
    });
    document.getElementById("skillChoices").innerHTML = skills
      .map((skill, index) => `
        <label class="check-skill">
          <input type="checkbox" name="known" value="${escapeHtml(skill)}" id="skill-${index}" ${state.knownSkills.has(skill) ? "checked" : ""} />
          <span>${escapeHtml(skill)}</span>
        </label>`)
      .join("");
  };

  const readForm = () => {
    const data = new FormData(form);
    state.track = data.get("track") || state.track;
    state.hours = Number(data.get("hours")) || state.hours;
    state.budget = data.get("budget") || state.budget;
    state.knownSkills = new Set(data.getAll("known"));
  };

  const persist = async () => {
    if (!account) return;
    await TechLiftStore.saveUser({
      route: {
        track: state.track,
        hours: state.hours,
        budget: state.budget,
        knownSkills: [...state.knownSkills],
        completedSteps: [...state.completedSteps],
      },
    });
  };

  const buildRoute = () => {
    const steps = TechLiftChallenges.forTrack(state.track).map((challenge) => ({
      ...challenge,
      skipped: challenge.skills.every((skill) => state.knownSkills.has(skill)),
    }));
    const included = steps.filter((step) => !step.skipped);
    const hours = included.reduce((total, step) => total + hoursFrom(step.time), 0);
    const weeks = hours ? Math.ceil(hours / state.hours) : 0;

    const gaps = [];
    included.forEach((step) => {
      step.skills.forEach((skill) => {
        if (!state.knownSkills.has(skill) && !gaps.some((gap) => gap.skill === skill)) {
          gaps.push({ skill, step: step.title });
        }
      });
    });

    const resources = TechLiftResources.forTrack(state.track).filter((resource) =>
      state.budget === "some" ? true : resource.cost.startsWith("Free"),
    );

    return { steps, included, hours, weeks, gaps, resources };
  };

  const renderResults = () => {
    const route = buildRoute();
    const label = TechLiftChallenges.label(state.track);

    if (!route.included.length) {
      results.innerHTML = `
        <div class="panel route-summary">
          <p class="eyebrow">${escapeHtml(label)}</p>
          <h2>You already show every skill in this track.</h2>
          <p class="muted">Try the next track, or open the challenges to show your work.</p>
        </div>`;
      return;
    }

    const canTick = Boolean(account);
    results.innerHTML = `
      <div class="panel route-summary">
        <p class="eyebrow">${escapeHtml(label)}</p>
        <h2>${route.included.length} ${route.included.length === 1 ? "challenge" : "challenges"} to take</h2>
        <p>About <strong>${route.hours} hours</strong> of practice. At ${state.hours} hours a week, that is about <strong>${route.weeks} ${route.weeks === 1 ? "week" : "weeks"}</strong>.</p>
        <p class="muted">${state.budget === "free" ? "Showing free resources only." : "Paid options are included. Check their prices before you pay."}</p>
      </div>

      <ol class="route-steps">
        ${route.steps
          .map((step, index) => `
            <li class="route-step ${step.skipped ? "is-skipped" : ""} ${state.completedSteps.has(step.id) ? "is-done" : ""}">
              <div class="route-step-head">
                <span class="step-number">${String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p class="eyebrow">${escapeHtml(step.level)} level · ${escapeHtml(step.time)}</p>
                  <h3>${escapeHtml(step.title)}</h3>
                </div>
              </div>
              <p class="muted">${step.skipped
                ? "Skipped: you already show these skills."
                : `Builds: ${escapeHtml(step.skills.join(", "))}`}</p>
              ${step.skipped
                ? ""
                : `<label class="done-toggle">
                     <input type="checkbox" data-step-id="${escapeHtml(step.id)}" ${state.completedSteps.has(step.id) ? "checked" : ""} ${canTick ? "" : "disabled"} />
                     <span>${canTick ? "Done" : "Sign in to track progress"}</span>
                   </label>`}
            </li>`)
          .join("")}
      </ol>

      <div class="panel route-gaps">
        <p class="eyebrow">Skill gaps</p>
        ${route.gaps.length
          ? `<ul class="plain-list">${route.gaps.map((gap) => `<li><strong>${escapeHtml(gap.skill)}</strong> <span class="muted">· practised in “${escapeHtml(gap.step)}”</span></li>`).join("")}</ul>`
          : `<p class="muted">No gaps: your skills cover every step you need.</p>`}
      </div>

      <div class="panel route-resources">
        <p class="eyebrow">Where to learn</p>
        ${route.resources.length
          ? `<ul class="resource-list">${route.resources.map((resource) => `
              <li>
                <a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.name)} <span aria-hidden="true">↗</span></a>
                <small>${escapeHtml(resource.cost)} · ${escapeHtml(resource.use)}</small>
              </li>`).join("")}</ul>
             <p class="muted small">${escapeHtml(route.resources[0].note)}</p>`
          : `<p class="muted">No free resources are listed for this track. Choose “Paid options are fine” to see more.</p>`}
      </div>`;
  };

  const renderSave = () => {
    savePanel.innerHTML = account
      ? `
        <div>
          <p class="eyebrow">Your progress</p>
          <h2>Save this route to your account</h2>
          <p class="muted">Ticking a step saves automatically. Your route will be here next time you sign in.</p>
        </div>
        <button class="btn btn-primary" type="button" id="saveRoute">Save my route</button>
        <p id="saveStatus" role="status" class="muted"></p>`
      : `
        <div>
          <p class="eyebrow">Save your progress</p>
          <h2>Sign in to keep your route</h2>
          <p class="muted">Routes and progress are saved to your account, so they follow you between sessions.</p>
        </div>
        <div class="cta-row">
          <a class="btn btn-primary" href="signup.html">Create an account</a>
          <a class="btn btn-secondary" href="login.html">Sign in</a>
        </div>`;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    readForm();
    renderResults();
  });

  results.addEventListener("change", async (event) => {
    const stepId = event.target.dataset.stepId;
    if (!stepId || !account) return;
    if (event.target.checked) state.completedSteps.add(stepId);
    else state.completedSteps.delete(stepId);
    event.target.closest(".route-step").classList.toggle("is-done", event.target.checked);
    await persist();
  });

  savePanel.addEventListener("click", async (event) => {
    if (event.target.id !== "saveRoute") return;
    readForm();
    await persist();
    document.getElementById("saveStatus").textContent = "Saved. Your route will be here next time you sign in.";
  });

  renderChoices();
  renderSave();
  renderResults();
});
