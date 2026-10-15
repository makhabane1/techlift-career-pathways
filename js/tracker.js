// Opportunity tracker: the learner's own list of roles, with their application stage.
// Entries are added by the learner. TechLift does not fetch or verify them.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const account = TechLiftStore.getAccount();
  const signedOut = document.getElementById("trackerSignedOut");
  const signedIn = document.getElementById("trackerSignedIn");
  if (!signedOut || !signedIn) return;

  const stages = ["Interested", "Preparing", "Applied", "Interviewing", "Outcome"];
  const form = document.getElementById("trackerForm");
  const list = document.getElementById("trackerList");
  const empty = document.getElementById("trackerEmpty");
  const summary = document.getElementById("trackerSummary");
  const errorBox = document.getElementById("trackerError");

  const isLearner = account && account.role === "learner";
  signedOut.classList.toggle("hidden", Boolean(isLearner));
  signedIn.classList.toggle("hidden", !isLearner);
  if (!isLearner) {
    if (account) signedOut.querySelector("p").textContent = "The tracker is for learner accounts.";
    return;
  }

  const items = () => TechLiftStore.getUser()?.opportunities || [];

  const save = (next) => TechLiftStore.saveUser({ opportunities: next });

  const formatDate = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const closedLabel = (closes) => {
    if (!closes) return "No closing date given";
    const today = new Date().toISOString().slice(0, 10);
    return closes < today ? `Closed ${formatDate(closes)}` : `Closes ${formatDate(closes)}`;
  };

  const render = () => {
    const all = items();
    empty.classList.toggle("hidden", all.length > 0);

    const counts = Object.fromEntries(stages.map((stage) => [stage, 0]));
    all.forEach((item) => {
      counts[item.stage] = (counts[item.stage] || 0) + 1;
    });
    summary.textContent = all.length
      ? stages.map((stage) => `${counts[stage]} ${stage.toLowerCase()}`).join(" · ")
      : "";

    list.innerHTML = all
      .map((item) => `
        <li class="tracker-item">
          <div class="tracker-item-head">
            <div>
              <p class="eyebrow">${escapeHtml(item.type)}${item.location ? ` · ${escapeHtml(item.location)}` : ""}</p>
              <h3>${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)} <span aria-hidden="true">↗</span></a>` : escapeHtml(item.title)}</h3>
              <p class="muted">${escapeHtml(item.organisation || "Organisation not given")} · ${escapeHtml(closedLabel(item.closes))}</p>
            </div>
            <label class="stage-control">
              <span>Stage</span>
              <select data-id="${escapeHtml(item.id)}" data-action="stage" aria-label="Stage for ${escapeHtml(item.title)}">
                ${stages.map((stage) => `<option ${stage === item.stage ? "selected" : ""}>${stage}</option>`).join("")}
              </select>
            </label>
          </div>
          ${item.notes ? `<p class="tracker-notes">${escapeHtml(item.notes)}</p>` : ""}
          <button class="text-link button-link" type="button" data-id="${escapeHtml(item.id)}" data-action="remove">Remove from tracker</button>
        </li>`)
      .join("");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    const link = String(data.get("link") || "").trim();
    if (!title) {
      errorBox.textContent = "Add a title for the role.";
      form.elements.title.focus();
      return;
    }
    if (link && !/^https?:\/\//i.test(link)) {
      errorBox.textContent = "The link must start with http:// or https://";
      form.elements.link.focus();
      return;
    }

    const item = {
      id: `opp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      organisation: String(data.get("organisation") || "").trim(),
      type: String(data.get("type") || "Other"),
      location: String(data.get("location") || "").trim(),
      link,
      closes: String(data.get("closes") || ""),
      notes: String(data.get("notes") || "").trim(),
      stage: "Interested",
      addedAt: new Date().toISOString(),
    };
    await save([...items(), item]);
    form.reset();
    render();
  });

  list.addEventListener("change", async (event) => {
    if (event.target.dataset.action !== "stage") return;
    const next = items().map((item) =>
      item.id === event.target.dataset.id ? { ...item, stage: event.target.value } : item,
    );
    await save(next);
    render();
  });

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action='remove']");
    if (!button) return;
    const item = items().find((entry) => entry.id === button.dataset.id);
    if (!window.confirm(`Remove “${item?.title || "this role"}” from your tracker? This does not affect the employer’s advert.`)) return;
    await save(items().filter((entry) => entry.id !== button.dataset.id));
    render();
  });

  render();
});
