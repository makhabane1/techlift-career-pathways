TechLiftStore.ready.then(() => {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
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

    try {
      const account = await TechLiftStore.login(email.value.trim(), password.value);
      window.location.href = account.role === "mentor" ? "mentor-dashboard.html" : "dashboard.html";
    } catch (error) {
      alert(error.message);
    }
  });
});
