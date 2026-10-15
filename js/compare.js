// Comparison table for the four tracks. Numbers are computed from the challenge
// library and resource list; mentor counts come from the live mentor directory.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const table = document.getElementById("compareTable");

  // Our own description of each track, not sourced data.
  const about = {
    frontend: "Build the screens people use: layout, interaction, and accessibility in the browser.",
    design: "Work out what people need and shape the product around it, from research to prototypes.",
    data: "Turn messy data into clear answers, dashboards, and decisions.",
    product: "Decide what to build next and why, balancing customer needs with what the team can deliver.",
  };

  // What we suggest you already have before starting. Guidance, not a requirement.
  const entry = {
    frontend: "Basic computer use and patience with documentation. HTML and CSS are taught in the first challenge.",
    design: "Curiosity about how people use products. You will build a small portfolio of sketches and prototypes.",
    data: "Comfort with spreadsheets and basic maths. SQL is introduced in the first challenge.",
    product: "Experience of working on a project with other people, and clear written communication.",
  };

  const hoursFrom = (text) => {
    const match = /(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/.exec(text || "");
    return match ? (Number(match[1]) + Number(match[2])) / 2 : 0;
  };

  const trackIds = Object.keys(TechLiftChallenges.tracks);
  const columns = trackIds.map((id) => {
    const challenges = TechLiftChallenges.forTrack(id);
    const skills = new Set(challenges.flatMap((challenge) => challenge.skills));
    const hours = challenges.reduce((total, challenge) => total + hoursFrom(challenge.time), 0);
    const freeResources = TechLiftResources.forTrack(id).filter((resource) => resource.cost.startsWith("Free")).length;
    const mentors = TechLiftStore.matchMentors(id).filter((item) => item.matched.length > 0).length;
    return {
      id,
      label: TechLiftChallenges.label(id),
      about: about[id],
      levels: challenges.map((challenge) => `${challenge.level}: ${challenge.title}`),
      firstStep: challenges[0].time,
      hours,
      skillCount: skills.size,
      freeResources,
      entry: entry[id],
      mentors,
    };
  });

  const row = (label, cells) => `
    <tr>
      <th scope="row">${escapeHtml(label)}</th>
      ${cells.map((cell) => `<td>${cell}</td>`).join("")}
    </tr>`;

  table.innerHTML = `
    <caption class="visually-hidden">Comparison of the four TechLift tracks</caption>
    <thead>
      <tr>
        <td></td>
        ${columns.map((column) => `<th scope="col"><a href="route.html?track=${escapeHtml(column.id)}">${escapeHtml(column.label)}</a></th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${row("What you do", columns.map((column) => escapeHtml(column.about)))}
      ${row("Challenges", columns.map((column) => `<ol class="compare-list">${column.levels.map((level) => `<li>${escapeHtml(level)}</li>`).join("")}</ol>`))}
      ${row("Time for the first challenge", columns.map((column) => escapeHtml(column.firstStep)))}
      ${row("Total hands-on practice", columns.map((column) => `About ${Math.round(column.hours)} hours across all three levels`))}
      ${row("Skills you would show", columns.map((column) => `${column.skillCount} skills`))}
      ${row("Entry requirements (our guidance)", columns.map((column) => escapeHtml(column.entry)))}
      ${row("Free resources listed", columns.map((column) => `${column.freeResources} free ${column.freeResources === 1 ? "resource" : "resources"}`))}
      ${row("Mentors with matching expertise", columns.map((column) => `${column.mentors} ${column.mentors === 1 ? "mentor" : "mentors"} on TechLift`))}
    </tbody>`;

  document.getElementById("compareNote").textContent =
    "Course prices vary by provider and change over time, so this table does not show costs. Check each resource before you pay. Entry requirements are our suggestion, not a job requirement. Check real adverts with the Opportunity decoder.";
});
