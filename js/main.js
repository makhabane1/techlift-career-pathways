document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const navActions = document.querySelector(".nav-actions");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      nav.classList.toggle("is-open");
      navActions.classList.toggle("is-open");
      nav.style.display = nav.style.display === "flex" ? "none" : "flex";
      navActions.style.display =
        navActions.style.display === "flex" ? "none" : "flex";
    });
  }

  const mapTitle = document.getElementById("mapTitle");
  const mapSummary = document.getElementById("mapSummary");
  const mapMilestones = document.getElementById("mapMilestones");

  const map = new CareerMap(
    document.getElementById("careerMap"),
    TechLiftCareerData,
    {
      done: ["fe-html", "fe-css", "pd-research", "da-sql"],
      onSelect(path, milestone) {
        mapTitle.textContent = path.label;
        mapSummary.textContent = path.summary;

        mapMilestones.innerHTML = path.milestones
          .map((item) => `<li>${item.label}</li>`)
          .join("");
      },
    },
  );

  map.select("frontend", "fe-js");
});
