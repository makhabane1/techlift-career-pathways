class CareerMap {
  constructor(element, data, options = {}) {
    this.element = element;
    this.data = data || { career_paths: [] };
    this.options = options;
    this.done = new Set(options.done || []);
    this.activePath = null;
    this.activeMilestone = null;
    this.destroyed = false;
    this.bind();
    this.render();
    this.select(
      this.data.career_paths[0]?.id,
      this.data.career_paths[0]?.milestones[2]?.id,
    );
  }

  bind() {
    this.element.innerHTML = "";
  }

  render() {
    if (!this.data.career_paths || !this.data.career_paths.length) {
      this.element.innerHTML = "<p>No career map available.</p>";
      return;
    }

    const pathButtons = document.createElement("div");
    pathButtons.className = "career-map-paths";

    this.data.career_paths.forEach((path) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "path-button";
      button.textContent = path.label;
      button.addEventListener("click", () => this.select(path.id));
      pathButtons.appendChild(button);
    });

    this.element.appendChild(pathButtons);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 620 320");
    svg.setAttribute("class", "career-map-svg");
    this.element.appendChild(svg);
    this.svg = svg;

    this.renderSvg();
  }

  renderSvg() {
    if (!this.activePath) return;

    const path =
      this.data.career_paths.find((item) => item.id === this.activePath) ||
      this.data.career_paths[0];
    const svg = this.svg;
    svg.innerHTML = "";

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const points = path.milestones
      .map((milestone) => `${milestone.x},${milestone.y}`)
      .join(" ");
    line.setAttribute("d", `M ${points.replace(/,/g, " ")}`);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", path.color);
    line.setAttribute("stroke-width", "4");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    line.setAttribute("stroke-dasharray", "10 10");
    line.setAttribute("opacity", "0.9");
    svg.appendChild(line);

    path.milestones.forEach((milestone, index) => {
      const status = this.done.has(milestone.id)
        ? "is-complete"
        : milestone.id === this.activeMilestone
          ? "is-current"
          : "is-upcoming";

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", `career-map-node ${status}`);
      group.setAttribute("data-id", milestone.id);
      group.style.cursor = "pointer";

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", milestone.x);
      circle.setAttribute("cy", milestone.y);
      circle.setAttribute("r", milestone.id === this.activeMilestone ? 18 : 15);
      circle.setAttribute("fill", "white");
      circle.setAttribute("stroke", path.color);
      circle.setAttribute(
        "stroke-width",
        milestone.id === this.activeMilestone ? 4 : 2,
      );

      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      label.setAttribute("x", milestone.x);
      label.setAttribute("y", milestone.y + 4);
      label.setAttribute("text-anchor", "middle");
      label.textContent = index + 1;

      group.addEventListener("click", () => this.select(path.id, milestone.id));
      group.appendChild(circle);
      group.appendChild(label);
      svg.appendChild(group);
    });

    const buttons = this.element.querySelectorAll(".path-button");
    buttons.forEach((button) => {
      const isActive = button.textContent === path.label;
      button.classList.toggle("active", isActive);
    });
  }

  select(pathId, milestoneId) {
    const path =
      this.data.career_paths.find((item) => item.id === pathId) ||
      this.data.career_paths[0];
    const milestone =
      path.milestones.find((item) => item.id === milestoneId) ||
      path.milestones[0];

    this.activePath = path.id;
    this.activeMilestone = milestone.id;
    this.renderSvg();

    if (typeof this.options.onSelect === "function") {
      this.options.onSelect(path, milestone);
    }
  }

  setProgress(ids = []) {
    this.done = new Set(ids);
    this.renderSvg();
  }

  clear() {
    this.done.clear();
    this.renderSvg();
  }

  destroy() {
    this.destroyed = true;
    this.element.innerHTML = "";
  }
}
