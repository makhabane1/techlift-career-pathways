TechLiftStore.ready.then(() => {
  const form = document.getElementById("mentorSignupForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fields = ["mentorName", "mentorEmail", "mentorPassword"].map((id) => document.getElementById(id));
    let valid = true;

    fields.forEach((field) => {
      if (!field.value.trim()) {
        field.style.borderColor = "rgba(239, 68, 68, 0.7)";
        valid = false;
      } else {
        field.style.borderColor = "rgba(15, 23, 42, 0.09)";
      }
    });

    if (!valid) return;

    const [name, email, password] = fields;
    if (password.value.length < 8) {
      alert("Use a password of at least 8 characters.");
      return;
    }

    try {
      await TechLiftStore.signup({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        role: "mentor",
      });
      // The mentor workspace opens with the profile form, so publish a profile there.
      window.location.href = "mentor-dashboard.html";
    } catch (error) {
      alert(error.message);
    }
  });
});
