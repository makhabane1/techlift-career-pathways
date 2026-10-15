// Opportunity hub: filter the directory of sources by type.
TechLiftStore.ready.then(() => {
  const { escapeHtml } = TechLiftStore;
  const filters = document.getElementById("typeFilters");
  const list = document.getElementById("sourceList");
  const tips = document.getElementById("tipList");

  let active = "all";

  const labels = { all: "All", ...TechLiftOpportunities.types };

  const renderFilters = () => {
    filters.innerHTML = Object.entries(labels)
      .map(([value, label]) => `
        <button type="button" class="filter-btn ${value === active ? "active" : ""}" data-type="${escapeHtml(value)}" aria-pressed="${value === active}">
          ${escapeHtml(label)}
        </button>`)
      .join("");
  };

  const renderList = () => {
    const shown = TechLiftOpportunities.sources.filter((source) => active === "all" || source.type === active);
    list.innerHTML = shown
      .map((source) => `
        <li class="source-card">
          <p class="eyebrow">${escapeHtml(TechLiftOpportunities.types[source.type])} · ${escapeHtml(source.region)}</p>
          <h2><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)} <span aria-hidden="true">↗</span></a></h2>
          <p class="muted">${escapeHtml(source.use)}</p>
        </li>`)
      .join("");
    if (!shown.length) list.innerHTML = `<li class="muted">No sources in this group yet.</li>`;
  };

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button) return;
    active = button.dataset.type;
    renderFilters();
    renderList();
  });

  tips.innerHTML = TechLiftOpportunities.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("");
  renderFilters();
  renderList();
});
