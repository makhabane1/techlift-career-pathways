// The Bridge: the learner's chosen career on the existing career map. A milestone
// is complete when its skills are verified (route skills or passport evidence)
// and its challenges are approved. Everything is derived from saved data.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const account = TechLiftStore.getAccount();
  const content = document.getElementById("bridgeContent");
  const title = document.getElementById("bridgeTitle");
  const lede = document.getElementById("bridgeLede");

  const signedOut = (message, action) => {
    content.innerHTML = `
      <div class="panel empty-state">
        <p class="eyebrow">My roadmap</p>
        <h2>${escapeHtml(message)}</h2>
        ${action}
      </div>`;
  };

  if (!account) {
    signedOut("Sign in to see your roadmap.", `<div class="cta-row"><a class="btn btn-primary" href="login.html">Sign in</a><a class="btn btn-secondary" href="signup.html">Create an account</a></div>`);
    return;
  }
  if (account.role !== "learner") {
    signedOut("The roadmap is for learner accounts.", "");
    return;
  }

  const user = TechLiftStore.getUser() || {};
  const choice = user.careerChoice;
  const career = choice ? TechLiftCareers.find(choice.id) : null;
  if (!career) {
    signedOut("You have not chosen a career yet.", `<p class="muted">Career DNA suggests careers from your interests, working style, and skills. Pick one to build your roadmap around.</p><div class="cta-row"><a class="btn btn-primary" href="career-dna.html">Find my career matches</a></div>`);
    return;
  }

  // Evidence: skills the learner has verified, from the route and from approved work
  const verified = new Set([
    ...(user.route?.knownSkills || []),
    ...TechLiftStore.passportEntries(user.email || "").map((entry) => entry.skill),
  ]);
  const approved = new Set(
    TechLiftStore.getAllSubmissions()
      .filter((submission) => (submission.email || "") === (user.email || "") && submission.review?.status === "approved")
      .map((submission) => submission.challengeId),
  );

  const isMet = (needs) =>
    needs.skills.every((skill) => verified.has(skill)) && needs.challenges.every((id) => approved.has(id));

  const missingFor = (needs) => ({
    skills: needs.skills.filter((skill) => !verified.has(skill)),
    challenges: needs.challenges.filter((id) => !approved.has(id)),
  });

  const coveredBy = (skill) => {
    for (const track of Object.keys(TechLiftChallenges.tracks)) {
      const challenge = TechLiftChallenges.forTrack(track).find((item) => item.skills.includes(skill));
      if (challenge) return challenge;
    }
    return null;
  };

  const mapPath = career.mapPath ? TechLiftCareerData.career_paths.find((item) => item.id === career.mapPath) : null;
  title.textContent = `Your roadmap: ${career.title}`;

  if (!mapPath) {
    // No map for this career yet: show its skills and, where it exists, its track
    const track = career.track ? TechLiftChallenges.forTrack(career.track) : [];
    content.innerHTML = `
      <div class="panel route-summary">
        <p class="eyebrow">${escapeHtml(career.title)}</p>
        <h2>TechLift does not have a map for this career yet.</h2>
        <p class="muted">${escapeHtml(career.summary)}</p>
        <p class="muted">Skills to build: ${escapeHtml(career.skills.join(", "))}.</p>
      </div>
      ${track.length ? `
        <div class="panel route-gaps">
          <p class="eyebrow">Challenges in ${escapeHtml(TechLiftChallenges.label(career.track))}</p>
          <ul class="plain-list">
            ${track.map((challenge) => `<li><strong>${escapeHtml(challenge.title)}</strong> <span class="muted">· ${escapeHtml(challenge.level)} · ${escapeHtml(challenge.time)}</span>
              <button class="text-link button-link" type="button" data-start="${escapeHtml(challenge.id)}">Start this challenge</button></li>`).join("")}
          </ul>
        </div>` : `<p class="muted">Look at the Opportunity hub for learnerships and entry-level roles in this area, and check each role's requirements with the Opportunity decoder.</p>`}
      <div class="cta-row">
        <a class="btn btn-secondary" href="career-dna.html">Choose a different career</a>
      </div>`;
  } else {
    const done = mapPath.milestones.filter((milestone) => isMet(milestone.needs)).map((milestone) => milestone.id);
    const next = mapPath.milestones.find((milestone) => !isMet(milestone.needs));
    const nextMissing = next ? missingFor(next.needs) : null;
    const nextSkill = nextMissing?.skills[0];
    const nextChallenge = nextMissing?.challenges[0]
      ? TechLiftChallenges.find(nextMissing.challenges[0])
      : nextSkill ? coveredBy(nextSkill) : null;

    lede.textContent = `${done.length} of ${mapPath.milestones.length} milestones complete. Each one is complete when you have verified its skills and finished its challenges.`;

    content.innerHTML = `
      <div class="bridge-layout">
        <div class="panel bridge-map">
          <div id="bridgeMap" class="career-map-host"></div>
        </div>
        <div class="bridge-side">
          <div class="panel route-summary" id="bridgeNext">
            <p class="eyebrow">Next action</p>
            ${next
              ? `<h2>${escapeHtml(next.label)}</h2>
                 <p class="muted">${nextSkill
                   ? `Verify <strong>${escapeHtml(nextSkill)}</strong>.`
                   : `Finish the challenge for this milestone.`}</p>
                 ${nextChallenge ? `<button class="btn btn-primary" type="button" data-start="${escapeHtml(nextChallenge.id)}">Start “${escapeHtml(nextChallenge.title)}”</button>` : ""}`
              : `<h2>Every milestone on this map is complete.</h2><p class="muted">Keep your passport up to date, and look at the Opportunity hub for roles to apply for.</p>`}
          </div>
          <div class="panel route-gaps" id="bridgeDetail" aria-live="polite"></div>
          <div class="panel route-gaps">
            <p class="eyebrow">Your sources</p>
            <ul class="plain-list">
              <li><a class="text-link" href="passport.html">Skill passport: ${verified.size} verified ${verified.size === 1 ? "skill" : "skills"}</a></li>
              <li><a class="text-link" href="opportunities.html#tracker">Opportunity tracker: ${(user.opportunities || []).length} saved</a></li>
              <li><a class="text-link" href="interview.html">Interview Gym: ${(user.interviewPractice || []).length} saved sessions</a></li>
              <li><a class="text-link" href="route.html?track=${escapeHtml(career.track || "frontend")}">Route builder for this track</a></li>
            </ul>
          </div>
          <div class="cta-row">
            <a class="btn btn-secondary" href="career-dna.html">Choose a different career</a>
            <button class="text-link button-link" type="button" id="removeChoice">Remove from my roadmap</button>
          </div>
        </div>
      </div>`;

    const showDetail = (path, milestone) => {
      const needs = milestone.needs;
      const missing = missingFor(needs);
      const detail = document.getElementById("bridgeDetail");
      const complete = isMet(needs);
      detail.innerHTML = `
        <p class="eyebrow">${complete ? "Complete" : "In progress"}</p>
        <h3>${escapeHtml(milestone.label)}</h3>
        ${needs.skills.length ? `<p class="field-label">Skills to verify</p>
          <ul class="plain-list">${needs.skills.map((skill) => `<li>${verified.has(skill) ? "✓" : "○"} ${escapeHtml(skill)}${verified.has(skill) ? "" : ` <button class="text-link button-link" type="button" data-start="${escapeHtml(coveredBy(skill)?.id || "")}" ${coveredBy(skill) ? "" : "disabled"}>Practise in a challenge</button>`}</li>`).join("")}</ul>` : ""}
        ${needs.challenges.length ? `<p class="field-label">Challenges to complete</p>
          <ul class="plain-list">${needs.challenges.map((id) => {
            const challenge = TechLiftChallenges.find(id);
            return `<li>${approved.has(id) ? "✓" : "○"} ${escapeHtml(challenge?.title || id)} <button class="text-link button-link" type="button" data-start="${escapeHtml(id)}">Start this challenge</button></li>`;
          }).join("")}</ul>` : ""}
        ${complete ? "" : `<p class="muted small">Still needed: ${escapeHtml([...missing.skills, ...missing.challenges.map((id) => TechLiftChallenges.find(id)?.title || id)].join(", "))}.</p>`}`;
    };

    const map = new CareerMap(document.getElementById("bridgeMap"), { career_paths: [mapPath] }, {
      done,
      onSelect: showDetail,
    });
    map.setProgress(done);
  }

  // Start a challenge: the dashboard shows the chosen one
  content.addEventListener("click", async (event) => {
    const starter = event.target.closest("[data-start]");
    if (starter && starter.dataset.start) {
      await TechLiftStore.saveUser({ challengeId: starter.dataset.start });
      window.location.href = "dashboard.html";
      return;
    }
    if (event.target.id === "removeChoice") {
      if (!window.confirm("Remove this career from your roadmap? Your challenge work is kept.")) return;
      await TechLiftStore.saveUser({ careerChoice: null });
      window.location.reload();
    }
  });
});
