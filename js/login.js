document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail");
    const password = document.getElementById("loginPassword");
    let valid = true;

    [email, password].forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = "rgba(239, 68, 68, 0.7)";
        valid = false;
      } else {
        field.style.borderColor = "rgba(15, 23, 42, 0.09)";
      }
    });

    if (!valid) return;

    const existingUser = JSON.parse(
      localStorage.getItem("techliftUser") || "null",
    ) || {
      fullName: "Maya Patel",
      path: "frontend",
      goal: "Switch careers",
      availability: "10 hours/week",
    };

    existingUser.email = email.value.trim();
    localStorage.setItem("techliftUser", JSON.stringify(existingUser));

    window.location.href = "dashboard.html";
  });
});
