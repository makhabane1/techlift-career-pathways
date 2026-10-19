TechLiftStore.ready.then(() => {
  const escapeHtml = TechLiftStore.escapeHtml;
  const shareId = new URLSearchParams(window.location.search).get("share");
  const editor = document.getElementById("portfolioEditor");
  const publicView = document.getElementById("publicPortfolio");
  const publicContent = document.getElementById("publicPortfolioContent");
  const messageSection = document.getElementById("portfolioMessage");
  const message = messageSection.querySelector(".portfolio-message");
  const title = document.getElementById("portfolioTitle");
  const lede = document.getElementById("portfolioLede");

  const showMessage = (heading, body, action = "") => {
    editor.classList.add("hidden");
    publicView.classList.add("hidden");
    messageSection.classList.remove("hidden");
    message.innerHTML = `<p class="eyebrow">Proof Wall</p><h2>${escapeHtml(heading)}</h2><p class="muted">${escapeHtml(body)}</p>${action}`;
  };

  const linkMarkup = (href, label) =>
    href
      ? `<a class="portfolio-social-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)} <span aria-hidden="true">↗</span></a>`
      : "";

  const projectMarkup = (project) => {
    const reviewed = project.source === "mentor-reviewed";
    const skills = (project.skills || [])
      .map(
        (item) =>
          `<li>${escapeHtml(item.skill)} <strong>${escapeHtml(item.score)}/4</strong></li>`,
      )
      .join("");
    const technologies = (project.technologies || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    const image = project.imageUrl
      ? `<img class="portfolio-project-image" src="${escapeHtml(project.imageUrl)}" alt="${escapeHtml(project.title)} preview" loading="lazy" referrerpolicy="no-referrer" />`
      : "";
    return `
      <article class="portfolio-project ${reviewed ? "is-reviewed" : ""}">
        ${image}
        <div class="portfolio-project-body">
          <div class="portfolio-project-topline">
            <span class="evidence-label ${reviewed ? "reviewed" : "self-described"}">${reviewed ? "Mentor-reviewed challenge" : "Self-described project"}</span>
            ${reviewed && project.mentor ? `<span class="small muted">Reviewed by ${escapeHtml(project.mentor)}</span>` : ""}
          </div>
          <h3>${escapeHtml(project.title)}</h3>
          ${project.description ? `<p>${escapeHtml(project.description)}</p>` : ""}
          ${project.problem ? `<p><strong>Problem:</strong> ${escapeHtml(project.problem)}</p>` : ""}
          ${project.contribution ? `<p><strong>My contribution:</strong> ${escapeHtml(project.contribution)}</p>` : ""}
          ${project.learning ? `<p><strong>What I learned:</strong> ${escapeHtml(project.learning)}</p>` : ""}
          ${technologies ? `<ul class="portfolio-technologies" aria-label="Technologies used">${technologies}</ul>` : ""}
          ${skills ? `<div class="portfolio-evidence"><p class="field-label">Skills evidenced</p><ul>${skills}</ul></div>` : ""}
          ${project.url ? `<a class="portfolio-project-link" href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">Open project <span aria-hidden="true">↗</span></a>` : ""}
        </div>
      </article>`;
  };

  const renderPublicPortfolio = async () => {
    title.textContent = "A portfolio built from real work.";
    lede.textContent =
      "This learner has chosen to share their projects and evidence.";
    try {
      const response = await fetch(
        `/api/portfolio/${encodeURIComponent(shareId)}`,
        { cache: "no-store" },
      );
      const portfolio = await response.json().catch(() => ({}));
      if (!response.ok) {
        showMessage(
          "This portfolio is unavailable.",
          "The link may be incorrect, or its owner may have unpublished it.",
          `<a class="btn btn-secondary" href="index.html">Explore TechLift</a>`,
        );
        return;
      }

      document.title = `TechLift | ${portfolio.name}'s portfolio`;
      title.textContent = portfolio.name;
      lede.textContent =
        portfolio.headline || "A TechLift learner sharing their work.";
      const social = [
        linkMarkup(portfolio.links?.github, "GitHub"),
        linkMarkup(portfolio.links?.linkedin, "LinkedIn"),
        linkMarkup(portfolio.links?.website, "Website"),
      ]
        .filter(Boolean)
        .join("");
      const projects = portfolio.projects || [];
      const skills = portfolio.skills || [];
      publicContent.innerHTML = `
        <header class="public-profile-heading">
          <div>
            <p class="eyebrow">${escapeHtml([portfolio.career, portfolio.location].filter(Boolean).join(" · ") || "TechLift learner")}</p>
            ${portfolio.about ? `<p class="public-profile-about">${escapeHtml(portfolio.about)}</p>` : ""}
          </div>
          ${social ? `<nav class="portfolio-social-links" aria-label="Professional links">${social}</nav>` : ""}
        </header>
        ${portfolio.experience ? `<section class="public-profile-section"><p class="eyebrow">Relevant experience</p><p>${escapeHtml(portfolio.experience)}</p></section>` : ""}
        ${portfolio.credentials ? `<section class="public-profile-section"><p class="eyebrow">Qualifications and certificates</p><p>${escapeHtml(portfolio.credentials)}</p><small class="muted">Shared by the learner; not independently verified by TechLift.</small></section>` : ""}
        <section class="public-profile-section">
          <div class="portfolio-section-heading"><div><p class="eyebrow">Selected work</p><h2>Projects and practice</h2></div><span class="small muted">${projects.length} ${projects.length === 1 ? "project" : "projects"}</span></div>
          ${projects.length ? `<div class="portfolio-project-list">${projects.map(projectMarkup).join("")}</div>` : `<p class="portfolio-empty">No projects have been added yet.</p>`}
        </section>
        ${skills.length ? `<section class="public-profile-section"><p class="eyebrow">Assessed evidence</p><h2>Skills demonstrated</h2><ul class="portfolio-skill-list">${skills.map((item) => `<li><strong>${escapeHtml(item.skill)}</strong><span>${escapeHtml(item.score)}/4 · ${escapeHtml(item.challenge)}</span></li>`).join("")}</ul></section>` : ""}
        <p class="portfolio-disclaimer">Mentor-reviewed labels refer only to approved TechLift challenge reviews. Other work and credentials are shared as described by the learner.</p>`;
      publicView.classList.remove("hidden");
    } catch {
      showMessage(
        "We could not load this portfolio.",
        "Check your connection and try the link again.",
      );
    }
  };

  if (shareId) {
    renderPublicPortfolio();
    return;
  }

  if (!TechLiftStore.ensureRole("learner")) return;
  const account = TechLiftStore.getAccount();
  const user = TechLiftStore.getUser() || {};
  const form = document.getElementById("portfolioForm");
  const status = document.getElementById("portfolioStatus");
  const saveNote = document.getElementById("portfolioSaveNote");
  const projectEditors = document.getElementById("portfolioProjectEditors");
  const preview = document.getElementById("portfolioPreview");
  const shareLink = document.getElementById("portfolioShareLink");
  const copyButton = document.getElementById("copyPortfolioLink");
  const existing = user.portfolio || {};

  const projectEditorMarkup = (project = {}, index = 0) => `
    <fieldset class="project-editor">
      <legend>Project ${index + 1}</legend>
      <button class="remove-project" type="button" aria-label="Remove project ${index + 1}" title="Remove project">Remove</button>
      <label>Project title
        <input data-field="title" type="text" maxlength="120" required value="${escapeHtml(project.title || "")}" placeholder="e.g. Responsive community noticeboard" />
      </label>
      <label>Project description
        <textarea data-field="description" rows="3" maxlength="1500" required placeholder="What does the project do?">${escapeHtml(project.description || "")}</textarea>
      </label>
      <div class="project-detail-grid">
        <label>Problem addressed <span>(optional)</span>
          <textarea data-field="problem" rows="2" maxlength="500">${escapeHtml(project.problem || "")}</textarea>
        </label>
        <label>Your contribution <span>(optional)</span>
          <textarea data-field="contribution" rows="2" maxlength="500">${escapeHtml(project.contribution || "")}</textarea>
        </label>
        <label>What you learned <span>(optional)</span>
          <textarea data-field="learning" rows="2" maxlength="500">${escapeHtml(project.learning || "")}</textarea>
        </label>
        <label>Technologies <span>(comma-separated)</span>
          <input data-field="technologies" type="text" maxlength="400" value="${escapeHtml((project.technologies || []).join(", "))}" placeholder="HTML, CSS, JavaScript" />
        </label>
      </div>
      <label>Project or repository URL <span>(optional)</span>
        <input data-field="url" type="url" maxlength="300" value="${escapeHtml(project.url || "")}" placeholder="https://" />
      </label>
      <label>Preview image URL <span>(optional)</span>
        <input data-field="imageUrl" type="url" maxlength="300" value="${escapeHtml(project.imageUrl || "")}" placeholder="https://" />
      </label>
    </fieldset>`;

  const readProjects = () =>
    [...projectEditors.querySelectorAll(".project-editor")].map((fieldset) => {
      const value = (field) =>
        fieldset.querySelector(`[data-field="${field}"]`).value.trim();
      return {
        title: value("title"),
        description: value("description"),
        problem: value("problem"),
        contribution: value("contribution"),
        learning: value("learning"),
        technologies: value("technologies")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        url: value("url"),
        imageUrl: value("imageUrl"),
      };
    });

  const valuesFromForm = () => ({
    name: form.elements.name.value.trim(),
    headline: form.elements.headline.value.trim(),
    location: form.elements.location.value.trim(),
    about: form.elements.about.value.trim(),
    experience: form.elements.experience.value.trim(),
    credentials: form.elements.credentials.value.trim(),
    published: form.elements.published.checked,
    links: {
      github: form.elements.github.value.trim(),
      linkedin: form.elements.linkedin.value.trim(),
      website: form.elements.website.value.trim(),
    },
    projects: readProjects(),
  });

  const reviewedProjects = () => {
    const email = user.email || account.email;
    return TechLiftStore.getAllSubmissions()
      .filter((submission) => (submission.email || "") === email)
      .flatMap((submission) =>
        [...submission.history, submission]
          .filter((round) => round.review?.status === "approved")
          .map((round) => ({
            title: submission.challenge,
            description: round.description,
            url: round.url,
            source: "mentor-reviewed",
            mentor: round.review.reviewerName,
            skills: (round.review.rubric || []).filter(
              (item) => Number(item.score) >= 3,
            ),
          })),
      );
  };

  const renderPreview = () => {
    const projects = [...readProjects(), ...reviewedProjects()];
    preview.innerHTML = projects.length
      ? projects.map(projectMarkup).join("")
      : `<p class="portfolio-empty">Your selected work will appear here. Approved Challenge Lab submissions are added automatically.</p>`;
  };

  const updateShareLink = (portfolio) => {
    const enabled = Boolean(portfolio.published && portfolio.shareId);
    shareLink.value = enabled
      ? `${window.location.origin}/portfolio.html?share=${encodeURIComponent(portfolio.shareId)}`
      : "";
    copyButton.disabled = !enabled;
    saveNote.textContent = enabled
      ? "Published. Anyone with the share link can view your portfolio."
      : "Your portfolio is private until you publish it.";
  };

  const writeForm = (portfolio) => {
    form.elements.name.value = portfolio.name || user.fullName || account.name;
    form.elements.headline.value = portfolio.headline || "";
    form.elements.location.value = portfolio.location || "";
    form.elements.about.value = portfolio.about || "";
    form.elements.experience.value = portfolio.experience || "";
    form.elements.credentials.value = portfolio.credentials || "";
    form.elements.published.checked = Boolean(portfolio.published);
    form.elements.github.value = portfolio.links?.github || "";
    form.elements.linkedin.value = portfolio.links?.linkedin || "";
    form.elements.website.value = portfolio.links?.website || "";
    projectEditors.innerHTML = (portfolio.projects || [])
      .map(projectEditorMarkup)
      .join("");
    renderPreview();
    updateShareLink(portfolio);
  };

  form.addEventListener("input", renderPreview);
  projectEditors.addEventListener("click", (event) => {
    const remove = event.target.closest(".remove-project");
    if (!remove) return;
    remove.closest(".project-editor").remove();
    [...projectEditors.querySelectorAll(".project-editor legend")].forEach(
      (legend, index) => {
        legend.textContent = `Project ${index + 1}`;
      },
    );
    renderPreview();
  });
  document
    .getElementById("addPortfolioProject")
    .addEventListener("click", () => {
      if (projectEditors.querySelectorAll(".project-editor").length >= 12) {
        status.textContent = "A portfolio can include up to 12 projects.";
        return;
      }
      projectEditors.insertAdjacentHTML(
        "beforeend",
        projectEditorMarkup({}, projectEditors.children.length),
      );
      projectEditors.lastElementChild
        .querySelector('[data-field="title"]')
        .focus();
      renderPreview();
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!form.reportValidity()) return;
    try {
      const savedUser = await TechLiftStore.saveUserConfirmed({
        portfolio: valuesFromForm(),
      });
      Object.assign(user, savedUser);
      writeForm(savedUser.portfolio || {});
      status.textContent = "Portfolio saved.";
    } catch (error) {
      status.textContent = `Portfolio was not saved: ${error.message}`;
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareLink.value);
      status.textContent = "Public link copied.";
    } catch {
      shareLink.select();
      const copied = document.execCommand("copy");
      status.textContent = copied
        ? "Public link copied."
        : "Select the link and copy it.";
    }
  });

  title.textContent = "Show the work behind your next step.";
  lede.textContent =
    "Build a portfolio from your projects and mentor-reviewed TechLift work.";
  writeForm(existing);
  editor.classList.remove("hidden");
});
