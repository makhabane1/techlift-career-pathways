TechLiftStore.ready.then(() => {
  const escapeHtml = TechLiftStore.escapeHtml;
  const workspace = document.getElementById("plannerWorkspace");
  const messageSection = document.getElementById("plannerMessage");
  const message = messageSection.querySelector(".planner-message");
  const settings = document.getElementById("plannerSettings");
  const tasksHost = document.getElementById("plannerTasks");
  const taskForm = document.getElementById("addTaskForm");
  const status = document.getElementById("plannerStatus");
  const dayHost = document.getElementById("plannerDays");
  const taskDay = document.getElementById("addTaskDay");
  const reflection = document.getElementById("weeklyReflection");
  const days = [
    ["mon", "Mon"],
    ["tue", "Tue"],
    ["wed", "Wed"],
    ["thu", "Thu"],
    ["fri", "Fri"],
    ["sat", "Sat"],
    ["sun", "Sun"],
  ];

  const showMessage = (heading, text) => {
    workspace.classList.add("hidden");
    messageSection.classList.remove("hidden");
    message.innerHTML = `<p class="eyebrow">Learning Planner</p><h2>${escapeHtml(heading)}</h2><p class="muted">${escapeHtml(text)}</p><a class="btn btn-primary" href="login.html">Sign in</a>`;
  };

  const account = TechLiftStore.getAccount();
  if (!account) {
    showMessage(
      "Sign in to keep your plan.",
      "Your schedule and reflections are private to your learner account.",
    );
    return;
  }
  if (account.role !== "learner") {
    showMessage(
      "This planner is for learners.",
      "Sign in with a learner account to save weekly plans.",
    );
    return;
  }

  const user = TechLiftStore.getUser() || {};
  const saved = user.planner || {};
  const track = saved.track || user.route?.track || user.path || "frontend";
  let plan = {
    track,
    hoursPerWeek: Number(saved.hoursPerWeek || user.route?.hours || 5),
    availableDays: saved.availableDays || ["mon", "wed", "sat"],
    energy: saved.energy || "steady",
    confidence: Number(saved.confidence || 3),
    priority: saved.priority || "practice",
    reflection: saved.reflection || "",
    tasks: saved.tasks || [],
  };

  const renderSettings = () => {
    settings.elements.hoursPerWeek.value = String(plan.hoursPerWeek);
    settings.elements.energy.value = plan.energy;
    settings.elements.confidence.value = String(plan.confidence);
    settings.elements.priority.value = plan.priority;
    document.getElementById("confidenceOutput").value =
      `${plan.confidence} / 5`;
    dayHost.innerHTML = days
      .map(
        ([value, label]) => `
      <label class="day-choice">
        <input type="checkbox" name="availableDays" value="${value}" ${plan.availableDays.includes(value) ? "checked" : ""} />
        <span>${label}</span>
      </label>`,
      )
      .join("");
    const selectedDays = days.filter(([value]) =>
      plan.availableDays.includes(value),
    );
    taskDay.innerHTML = selectedDays
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
    if (!selectedDays.length)
      taskDay.innerHTML = `<option value="">Choose a study day</option>`;
  };

  const readSettings = () => {
    plan.hoursPerWeek = Number(settings.elements.hoursPerWeek.value);
    plan.energy = settings.elements.energy.value;
    plan.confidence = Number(settings.elements.confidence.value);
    plan.priority = settings.elements.priority.value;
    plan.availableDays = [
      ...settings.querySelectorAll('[name="availableDays"]:checked'),
    ].map((input) => input.value);
    plan.reflection = reflection.value.trim();
  };

  const dayName = (value) =>
    days.find(([day]) => day === value)?.[1] || "Unscheduled";

  const renderTasks = () => {
    tasksHost.innerHTML = plan.tasks.length
      ? plan.tasks
          .map(
            (task) => `
          <article class="planner-task ${task.completed ? "is-complete" : ""}" data-task-id="${escapeHtml(task.id)}">
            <div class="task-title-wrap">
              <strong class="task-title">${escapeHtml(task.title)}</strong>
              ${task.challengeId ? `<a class="task-source" href="lab.html">Challenge Lab task · ${escapeHtml(TechLiftChallenges.find(task.challengeId)?.level || "practice")}</a>` : `<span class="task-source">Personal task</span>`}
            </div>
            <label class="visually-hidden" for="day-${escapeHtml(task.id)}">Plan ${escapeHtml(task.title)} for</label>
            <select id="day-${escapeHtml(task.id)}" data-task-day="${escapeHtml(task.id)}" aria-label="Plan ${escapeHtml(task.title)} for">${plan.availableDays.map((day) => `<option value="${day}" ${task.day === day ? "selected" : ""}>${dayName(day)}</option>`).join("")}</select>
            <label class="task-complete"><input type="checkbox" data-task-complete="${escapeHtml(task.id)}" ${task.completed ? "checked" : ""} /><span>Done</span></label>
            <button class="remove-task" type="button" data-task-remove="${escapeHtml(task.id)}" aria-label="Remove ${escapeHtml(task.title)}">Remove</button>
          </article>`,
          )
          .join("")
      : `<p class="planner-empty">No tasks yet. Refresh the suggestions to start from your saved route, or add a personal task.</p>`;

    const estimate = plan.tasks.filter((task) => !task.completed).length;
    document.getElementById("planEstimate").textContent =
      `${plan.hoursPerWeek} hours available · ${plan.availableDays.length} selected days · ${estimate} open ${estimate === 1 ? "task" : "tasks"}. Estimates are flexible, not deadlines.`;
    renderWeeklySummary();
  };

  const renderWeeklySummary = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const verifiedThisWeek = new Set(
      TechLiftStore.passportEntries(user.email || "")
        .filter((entry) => new Date(entry.reviewedAt) >= cutoff)
        .map((entry) => entry.skill),
    );
    const applications = (user.opportunities || []).filter((item) =>
      ["Preparing", "Applied", "Interviewing", "Outcome"].includes(item.stage),
    ).length;
    const summary = [
      [
        "Planned tasks complete",
        plan.tasks.filter((task) => task.completed).length,
      ],
      ["Skills verified this week", verifiedThisWeek.size],
      ["Opportunities tracked", (user.opportunities || []).length],
      ["Applications in progress", applications],
    ];
    document.getElementById("weeklySummary").innerHTML = summary
      .map(
        ([label, value]) =>
          `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
      )
      .join("");
  };

  const createSuggestions = () => {
    readSettings();
    status.textContent = "";
    if (!plan.availableDays.length) {
      status.textContent = "Choose at least one day before creating a plan.";
      return;
    }

    const route = user.route?.track === plan.track ? user.route : null;
    const completedIds = new Set(route?.completedSteps || []);
    TechLiftStore.getAllSubmissions()
      .filter(
        (submission) =>
          submission.email === user.email &&
          submission.review?.status === "approved",
      )
      .forEach((submission) => completedIds.add(submission.challengeId));
    const challenges = TechLiftChallenges.forTrack(plan.track).filter(
      (challenge) => !completedIds.has(challenge.id),
    );
    let limit =
      plan.hoursPerWeek <= 2
        ? 1
        : plan.hoursPerWeek <= 5
          ? 2
          : plan.hoursPerWeek <= 10
            ? 3
            : 4;
    if (plan.energy === "low" || plan.priority === "rest") limit = 1;
    const completedTasks = plan.tasks.filter((task) => task.completed);
    const suggested = [];

    if (["learn", "practice"].includes(plan.priority)) {
      challenges.slice(0, limit).forEach((challenge, index) => {
        suggested.push({
          id: `challenge-${challenge.id}`,
          title: `${plan.priority === "learn" ? "Learn and explore" : "Practice"}: ${challenge.title}`,
          day: plan.availableDays[index % plan.availableDays.length],
          challengeId: challenge.id,
          completed: false,
        });
      });
    } else if (plan.priority === "portfolio") {
      suggested.push({
        id: "portfolio-proof-wall",
        title: "Add one genuine project detail to your Proof Wall",
        day: plan.availableDays[0],
        challengeId: "",
        completed: false,
      });
    } else if (plan.priority === "applications") {
      const opportunity = (user.opportunities || []).find(
        (item) => item.stage !== "Outcome",
      );
      suggested.push({
        id: "application-preparation",
        title: opportunity
          ? `Review requirements for ${opportunity.title}`
          : "Add one real role to your Opportunity Hub and review its requirements",
        day: plan.availableDays[0],
        challengeId: "",
        completed: false,
      });
      if (limit > 1)
        suggested.push({
          id: "interview-preparation",
          title: "Practise one interview answer with STAR",
          day: plan.availableDays[1 % plan.availableDays.length],
          challengeId: "",
          completed: false,
        });
    } else {
      suggested.push({
        id: "light-review",
        title: "Take a low-pressure review of what you already learned",
        day: plan.availableDays[0],
        challengeId: "",
        completed: false,
      });
    }

    plan.tasks = [...completedTasks, ...suggested].slice(0, 20);
    renderTasks();
    status.textContent =
      "Suggestions refreshed. Adjust or remove anything that does not fit, then save your plan.";
  };

  const savePlan = async (
    successMessage = "Your plan was saved to your account.",
  ) => {
    readSettings();
    if (!plan.availableDays.length) {
      status.textContent = "Choose at least one study day before saving.";
      return false;
    }
    const button = document.getElementById("savePlan");
    button.disabled = true;
    try {
      const savedUser = await TechLiftStore.saveUserConfirmed({
        planner: plan,
      });
      Object.assign(user, savedUser);
      status.textContent = successMessage;
      renderWeeklySummary();
      return true;
    } catch (error) {
      status.textContent = `Your plan was not saved: ${error.message}`;
      return false;
    } finally {
      button.disabled = false;
    }
  };

  settings.addEventListener("change", () => {
    readSettings();
    renderSettings();
    renderTasks();
  });
  settings.elements.confidence.addEventListener("input", () => {
    document.getElementById("confidenceOutput").value =
      `${settings.elements.confidence.value} / 5`;
  });
  reflection.addEventListener("input", () => {
    plan.reflection = reflection.value;
  });
  document
    .getElementById("generatePlan")
    .addEventListener("click", createSuggestions);
  document
    .getElementById("savePlan")
    .addEventListener("click", () => savePlan());

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    readSettings();
    const title = taskForm.elements.title.value.trim();
    const day = taskForm.elements.day.value;
    if (!title || !day) {
      status.textContent = "Add a task and choose one of your selected days.";
      return;
    }
    plan.tasks.push({
      id: `task-${Date.now().toString(36)}`,
      title,
      day,
      challengeId: "",
      completed: false,
    });
    taskForm.reset();
    renderTasks();
    status.textContent = "Task added to this plan. Save to keep it.";
  });

  tasksHost.addEventListener("change", async (event) => {
    const taskId =
      event.target.dataset.taskComplete || event.target.dataset.taskDay;
    if (!taskId) return;
    const task = plan.tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (event.target.dataset.taskComplete)
      task.completed = event.target.checked;
    else task.day = event.target.value;
    renderTasks();
    await savePlan(task.completed ? "Progress saved." : "Plan updated.");
  });

  tasksHost.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-task-remove]");
    if (!button) return;
    plan.tasks = plan.tasks.filter(
      (task) => task.id !== button.dataset.taskRemove,
    );
    renderTasks();
    await savePlan("Task removed and plan saved.");
  });

  reflection.value = plan.reflection;
  renderSettings();
  renderTasks();
  document.getElementById("plannerContext").textContent =
    `Your current route is ${TechLiftChallenges.label(plan.track)}. Refreshing suggestions uses its remaining challenges and your stated weekly priority.`;
  workspace.classList.remove("hidden");
});
