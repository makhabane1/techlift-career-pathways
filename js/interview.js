TechLiftStore.ready.then(() => {
  if (!TechLiftStore.ensureRole("learner")) return;

  const user = TechLiftStore.getUser() || {};
  const workspace = document.getElementById("interviewWorkspace");
  const messageSection = document.getElementById("interviewMessage");
  const message = messageSection.querySelector(".interview-message");
  const form = document.getElementById("interviewForm");
  const status = document.getElementById("interviewStatus");
  const careerSelect = document.getElementById("interviewCareer");
  const categorySelect = document.getElementById("interviewCategory");
  const opportunitySelect = document.getElementById("interviewOpportunity");
  const questionSelect = document.getElementById("interviewQuestion");
  const prompt = document.getElementById("questionPrompt");
  const questionKind = document.getElementById("questionKind");
  const opportunityContext = document.getElementById("opportunityContext");
  const history = document.getElementById("interviewHistory");
  const categories = {
    behavioral: "Behavioural practice",
    technical: "Technical practice",
    scenario: "Scenario practice",
  };

  const showMessage = (heading, text, action = "") => {
    workspace.classList.add("hidden");
    messageSection.classList.remove("hidden");
    message.innerHTML = `<p class="eyebrow">Interview Gym</p><h2>${TechLiftStore.escapeHtml(heading)}</h2><p class="muted">${TechLiftStore.escapeHtml(text)}</p>${action}`;
  };

  const account = TechLiftStore.getAccount();
  if (!account) {
    showMessage(
      "Sign in to practise.",
      "Your answers and reflections are private to your learner account.",
      `<a class="btn btn-primary" href="login.html">Sign in</a>`,
    );
    return;
  }

  const roleByTrack = {
    frontend: "frontend",
    design: "uiux",
    data: "data",
    product: "businessanalysis",
  };
  const preferredCareer =
    user.careerChoice?.id || roleByTrack[user.path] || "frontend";
  careerSelect.innerHTML = TechLiftCareers.careers
    .map(
      (career) =>
        `<option value="${TechLiftStore.escapeHtml(career.id)}" ${career.id === preferredCareer ? "selected" : ""}>${TechLiftStore.escapeHtml(career.title)}</option>`,
    )
    .join("");

  const opportunities = user.opportunities || [];
  const requestedOpportunity = new URLSearchParams(window.location.search).get(
    "opportunity",
  );
  opportunitySelect.innerHTML = [
    `<option value="">No opportunity selected</option>`,
    ...opportunities.map(
      (item) =>
        `<option value="${TechLiftStore.escapeHtml(item.id)}">${TechLiftStore.escapeHtml(item.title)}${item.organisation ? ` · ${TechLiftStore.escapeHtml(item.organisation)}` : ""}</option>`,
    ),
  ].join("");
  if (opportunities.some((item) => item.id === requestedOpportunity))
    opportunitySelect.value = requestedOpportunity;

  const selectedQuestion = () =>
    TechLiftInterview.questionsFor(
      careerSelect.value,
      categorySelect.value,
    ).find((item) => item.id === questionSelect.value);

  const renderQuestion = () => {
    const questions = TechLiftInterview.questionsFor(
      careerSelect.value,
      categorySelect.value,
    );
    questionSelect.innerHTML = questions
      .map(
        (item) =>
          `<option value="${TechLiftStore.escapeHtml(item.id)}">${TechLiftStore.escapeHtml(item.prompt)}</option>`,
      )
      .join("");
    const question = selectedQuestion() || questions[0];
    prompt.textContent =
      question?.prompt || "No question is available for this career yet.";
    questionKind.textContent = categories[categorySelect.value];
    renderOpportunityContext();
  };

  const renderOpportunityContext = () => {
    const opportunity = opportunities.find(
      (item) => item.id === opportunitySelect.value,
    );
    if (!opportunity) {
      opportunityContext.textContent = opportunities.length
        ? "Choose a saved opportunity to connect this practice session to its application."
        : "Add a role in your Opportunity Hub to connect interview practice to an application.";
      return;
    }
    opportunityContext.innerHTML = `Practice linked to <a class="text-link" href="opportunities.html#tracker">${TechLiftStore.escapeHtml(opportunity.title)}</a>${opportunity.organisation ? ` at ${TechLiftStore.escapeHtml(opportunity.organisation)}` : ""}.`;
  };

  const formatDate = (value) =>
    new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const renderHistory = () => {
    const sessions = user.interviewPractice || [];
    history.innerHTML = sessions.length
      ? [...sessions]
          .reverse()
          .map((session) => {
            const career = TechLiftCareers.find(session.careerId);
            const scores = Object.entries(session.scores || {});
            const average = scores.length
              ? (
                  scores.reduce((sum, [, score]) => sum + Number(score), 0) /
                  scores.length
                ).toFixed(1)
              : "—";
            const answers = ["situation", "task", "action", "result"]
              .map(
                (part) =>
                  `<p><strong>${part[0].toUpperCase()} · ${part}:</strong> ${TechLiftStore.escapeHtml(session.answers?.[part] || "")}</p>`,
              )
              .join("");
            return `
          <article class="practice-entry">
            <p class="eyebrow">${TechLiftStore.escapeHtml(career?.title || "Career practice")} · ${TechLiftStore.escapeHtml(categories[session.category] || "Practice")}</p>
            <h3>${TechLiftStore.escapeHtml(session.question)}</h3>
            <p class="small">${TechLiftStore.escapeHtml(formatDate(session.savedAt))} · Self-review average ${average}/4</p>
            ${session.opportunityTitle ? `<p class="small">Linked opportunity: ${TechLiftStore.escapeHtml(session.opportunityTitle)}</p>` : ""}
            <div class="practice-score">${scores.map(([label, score]) => `<span>${TechLiftStore.escapeHtml(label)} ${TechLiftStore.escapeHtml(score)}/4</span>`).join("")}</div>
            <details><summary>Review STAR answer</summary><div class="practice-answer">${answers}${session.reflection ? `<p><strong>Next improvement:</strong> ${TechLiftStore.escapeHtml(session.reflection)}</p>` : ""}</div></details>
            <button class="remove-practice" type="button" data-remove="${TechLiftStore.escapeHtml(session.id)}">Delete this session</button>
          </article>`;
          })
          .join("")
      : `<p class="small muted">Saved sessions will appear here. Your practice is not shared with mentors or employers.</p>`;
  };

  careerSelect.addEventListener("change", renderQuestion);
  categorySelect.addEventListener("change", renderQuestion);
  questionSelect.addEventListener("change", () => {
    prompt.textContent = selectedQuestion()?.prompt || "";
  });
  opportunitySelect.addEventListener("change", renderOpportunityContext);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!form.reportValidity()) return;
    const question = selectedQuestion();
    if (!question) {
      status.textContent = "Choose a practice question first.";
      return;
    }

    const session = {
      id: crypto.randomUUID(),
      careerId: careerSelect.value,
      questionId: question.id,
      question: question.prompt,
      category: categorySelect.value,
      opportunityId: opportunitySelect.value,
      answers: {
        situation: form.elements.situation.value.trim(),
        task: form.elements.task.value.trim(),
        action: form.elements.action.value.trim(),
        result: form.elements.result.value.trim(),
      },
      scores: {
        clarity: Number(form.elements.clarity.value),
        relevance: Number(form.elements.relevance.value),
        structure: Number(form.elements.structure.value),
        evidence: Number(form.elements.evidence.value),
      },
      reflection: form.elements.reflection.value.trim(),
    };

    const button = document.getElementById("saveInterview");
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      const savedUser = await TechLiftStore.saveUserConfirmed({
        interviewPractice: [...(user.interviewPractice || []), session].slice(
          -50,
        ),
      });
      Object.assign(user, savedUser);
      form.reset();
      renderQuestion();
      renderHistory();
      status.textContent = "Practice saved privately to your account.";
    } catch (error) {
      status.textContent = `Practice was not saved: ${error.message}`;
    } finally {
      button.disabled = false;
      button.textContent = "Save practice session";
    }
  });

  history.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    const session = (user.interviewPractice || []).find(
      (item) => item.id === button.dataset.remove,
    );
    if (!session || !window.confirm("Delete this private practice session?"))
      return;
    try {
      const savedUser = await TechLiftStore.saveUserConfirmed({
        interviewPractice: user.interviewPractice.filter(
          (item) => item.id !== session.id,
        ),
      });
      Object.assign(user, savedUser);
      status.textContent = "Practice session deleted.";
      renderHistory();
    } catch (error) {
      status.textContent = `Session was not deleted: ${error.message}`;
    }
  });

  renderQuestion();
  renderHistory();
  workspace.classList.remove("hidden");
});
