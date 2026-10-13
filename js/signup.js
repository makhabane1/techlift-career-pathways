document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const steps = Array.from(document.querySelectorAll(".form-step"));
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  const submitBtn = document.getElementById("submitBtn");
  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");
  const successMessage = document.getElementById("successMessage");
  const choiceCards = document.querySelectorAll(".choice-card");

  let currentStep = 0;

  const updateStepUI = () => {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStep);
    });

    const stepCount = steps.length;
    progressText.textContent = `${currentStep + 1} of ${stepCount}`;
    progressBar.style.width = `${((currentStep + 1) / stepCount) * 100}%`;

    backBtn.classList.toggle("hidden", currentStep === 0);
    nextBtn.classList.toggle("hidden", currentStep === stepCount - 1);
    submitBtn.classList.toggle("hidden", currentStep !== stepCount - 1);
  };

  nextBtn.addEventListener("click", () => {
    const activeStep = steps[currentStep];
    const requiredInputs = activeStep.querySelectorAll(
      "input[required], select, textarea",
    );
    let valid = true;

    requiredInputs.forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = "rgba(239, 68, 68, 0.7)";
      } else {
        field.style.borderColor = "rgba(15, 23, 42, 0.09)";
      }
    });

    if (!valid) return;

    if (currentStep < steps.length - 1) {
      currentStep += 1;
      updateStepUI();
    }
  });

  backBtn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep -= 1;
      updateStepUI();
    }
  });

  choiceCards.forEach((card) => {
    card.addEventListener("click", () => {
      choiceCards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      const input = card.querySelector("input");
      input.checked = true;
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const requiredInputs = form.querySelectorAll(
      "input[required], select, textarea",
    );
    let valid = true;

    requiredInputs.forEach((field) => {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = "rgba(239, 68, 68, 0.7)";
      } else {
        field.style.borderColor = "rgba(15, 23, 42, 0.09)";
      }
    });

    if (!valid) return;

    const selectedPath = form.querySelector('input[name="path"]:checked');
    const userData = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      path: selectedPath ? selectedPath.value : "frontend",
      goal: document.getElementById("goal").value,
      availability: document.getElementById("availability").value,
    };

    localStorage.setItem("techliftUser", JSON.stringify(userData));
    form.classList.add("hidden");
    successMessage.classList.remove("hidden");
  });

  updateStepUI();
});
