document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".theme-toggle");
  const root = document.documentElement;
  const storageKey = "techliftTheme";
  const savedTheme = localStorage.getItem(storageKey);
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    root.dataset.theme = isDark ? "dark" : "light";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} mode`,
    );
    toggle.title = `Switch to ${isDark ? "light" : "dark"} mode`;
    toggle.querySelector("span").textContent = isDark ? "☼" : "☾";
  };

  applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

  toggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });
});
