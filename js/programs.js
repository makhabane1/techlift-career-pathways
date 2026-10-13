document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const courseCards = document.querySelectorAll(".course-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((btn) =>
        btn.classList.toggle("active", btn === button),
      );

      courseCards.forEach((card) => {
        const matches = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("hidden", !matches);
      });
    });
  });

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
});
