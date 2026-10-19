// Build With Me: study groups, project partner listings, and feedback requests.
// The server decides who sees what; this file only renders what it returns and
// reports success only after the server has saved the change.
TechLiftStore.ready.then(() => {
  const { escapeHtml, getAccount } = TechLiftStore;
  const gate = document.getElementById("communityGate");
  const workspace = document.getElementById("communityWorkspace");
  const message = document.getElementById("communityMessage");
  const lists = {
    groups: document.getElementById("groupList"),
    listings: document.getElementById("listingList"),
    requests: document.getElementById("requestList"),
  };
  const blockedList = document.getElementById("blockedList");
  const moderationSection = document.getElementById("moderationSection");
  const moderationList = document.getElementById("moderationList");
  const forms = {
    groups: document.getElementById("groupForm"),
    listings: document.getElementById("listingForm"),
    requests: document.getElementById("requestForm"),
  };
  const trackLabels = Object.fromEntries(
    Object.entries(TechLiftChallenges.tracks).map(([key, track]) => [
      key,
      track.label || key,
    ]),
  );

  let view = null;

  const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
    message.hidden = !text;
  };

  const request = async (method, url, body) => {
    const options = { method, cache: "no-store", headers: {} };
    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (response.status === 204) return null;
    const detail = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(detail.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return detail;
  };

  const trackOptions = () =>
    Object.entries(trackLabels)
      .map(([key, label]) => `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`)
      .join("");

  const reportForm = (kind, item) => `
    <details class="community-report">
      <summary>Report this post</summary>
      <form data-report-kind="${kind}" data-report-id="${escapeHtml(item.id)}">
        <label>
          Why are you reporting it?
          <textarea name="reason" rows="2" maxlength="300" required></textarea>
        </label>
        <button class="btn btn-secondary" type="submit">Send report</button>
      </form>
    </details>`;

  const cardActions = (kind, item) => {
    const actions = [];
    if (kind === "groups" && item.mine === false) {
      actions.push(
        item.joined
          ? `<button class="btn btn-secondary" type="button" data-action="leave" data-id="${escapeHtml(item.id)}">Leave group</button>`
          : `<button class="btn btn-primary" type="button" data-action="join" data-id="${escapeHtml(item.id)}">Join group</button>`,
      );
    }
    if (item.mine) {
      actions.push(
        `<button class="btn btn-secondary" type="button" data-action="remove" data-kind="${kind}" data-id="${escapeHtml(item.id)}">Remove</button>`,
      );
    } else {
      actions.push(
        `<button class="btn btn-secondary" type="button" data-action="block" data-owner="${escapeHtml(item.ownerId)}" data-name="${escapeHtml(item.ownerName)}">Block ${escapeHtml(item.ownerName)}</button>`,
      );
    }
    return actions.join(" ");
  };

  const card = (kind, item) => {
    const details = [];
    if (kind === "groups") {
      details.push(`${item.memberCount} ${item.memberCount === 1 ? "member" : "members"}`);
    }
    if (kind === "listings") {
      if (item.skills) details.push(`Skills: ${escapeHtml(item.skills)}`);
      if (item.availability) details.push(`Free: ${escapeHtml(item.availability)}`);
    }
    const link =
      kind === "requests" && item.link
        ? `<p><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Open the work</a></p>`
        : "";
    return `
      <article class="community-card">
        <header>
          <p class="community-meta">${escapeHtml(trackLabels[item.track] || item.track)} · posted by ${escapeHtml(item.ownerName)}${item.mine ? " (you)" : ""}</p>
          <h3>${escapeHtml(item.title)}</h3>
        </header>
        ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
        ${details.length ? `<p class="community-meta">${details.join(" · ")}</p>` : ""}
        ${link}
        <div class="community-actions">${cardActions(kind, item)}</div>
        ${item.mine ? "" : reportForm(kind, item)}
      </article>`;
  };

  const renderList = (kind) => {
    const items = view[kind];
    lists[kind].innerHTML = items.length
      ? items.map((item) => card(kind, item)).join("")
      : `<p class="community-empty">Nothing here yet. Be the first to post.</p>`;
  };

  const render = () => {
    ["groups", "listings", "requests"].forEach(renderList);
    blockedList.innerHTML = view.blocked.length
      ? view.blocked
          .map(
            (person) =>
              `<li>${escapeHtml(person.name)} <button class="btn btn-secondary" type="button" data-action="unblock" data-owner="${escapeHtml(person.id)}">Unblock</button></li>`,
          )
          .join("")
      : `<li class="community-empty">No blocked accounts.</li>`;
  };

  const moderationCard = (entry) => `
    <article class="community-card">
      <header>
        <p class="community-meta">${escapeHtml(entry.targetKind)} · by ${escapeHtml(entry.ownerName || "unknown")} · ${entry.reportCount} ${entry.reportCount === 1 ? "report" : "reports"}${entry.hiddenFromMembers ? " · hidden from members" : ""}</p>
        <h3>${escapeHtml(entry.title)}</h3>
      </header>
      <ul>${entry.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
      <label class="community-note-field">
        Note for the author (optional, shown only if you remove the post)
        <textarea rows="2" maxlength="300" data-moderation-note="${escapeHtml(entry.targetId)}"></textarea>
      </label>
      <div class="community-actions">
        <button class="btn btn-secondary" type="button" data-moderate="dismiss" data-id="${escapeHtml(entry.targetId)}">Keep post</button>
        <button class="btn btn-secondary" type="button" data-moderate="remove" data-id="${escapeHtml(entry.targetId)}">Remove post</button>
      </div>
    </article>`;

  // Only moderators get a queue; for everyone else the server answers 403 and the section stays hidden.
  const loadModeration = async () => {
    try {
      const queue = await request("GET", "/api/community/moderation");
      moderationSection.hidden = false;
      moderationList.innerHTML = queue.length
        ? queue.map(moderationCard).join("")
        : `<p class="community-empty">No reports are waiting.</p>`;
    } catch (error) {
      if (error.status === 403) moderationSection.hidden = true;
      else throw error;
    }
  };

  const load = async () => {
    view = await request("GET", "/api/community");
    render();
    await loadModeration();
  };

  // Resolves true only when the server saved the change.
  const runAction = async (task, success) => {
    try {
      await task();
      await load();
      showMessage(success);
      return true;
    } catch (error) {
      showMessage(error.message, true);
      return false;
    }
  };

  const formBody = (form) => {
    const data = new FormData(form);
    return Object.fromEntries(
      [...data.entries()].map(([key, value]) => [key, String(value).trim()]),
    );
  };

  Object.entries(forms).forEach(([kind, form]) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const body = formBody(form);
      if (!body.title) {
        showMessage("Add a title before posting.", true);
        return;
      }
      runAction(
        () => request("POST", `/api/community/${kind}`, body),
        "Posted. Your post is now visible to other members.",
      ).then((saved) => {
        if (saved) form.reset();
      });
    });
  });

  document.querySelectorAll("[data-track-select]").forEach((select) => {
    select.innerHTML = trackOptions();
  });

  document.querySelector(".community-workspace").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id, kind, owner, name } = button.dataset;
    if (action === "join" || action === "leave") {
      runAction(
        () =>
          request("POST", `/api/community/groups/${id}/membership`, {
            joined: action === "join",
          }),
        action === "join" ? "You joined the group." : "You left the group.",
      );
    }
    if (action === "remove") {
      if (!window.confirm("Remove this post? Reports on it are removed too.")) return;
      runAction(
        () => request("DELETE", `/api/community/${kind}/${id}`),
        "Post removed.",
      );
    }
    if (action === "block") {
      if (!window.confirm(`Block ${name}? Their posts will be hidden from you, and yours from them.`)) return;
      runAction(
        () => request("PUT", `/api/community/blocks/${owner}`),
        `${name} is blocked.`,
      );
    }
    if (action === "unblock") {
      runAction(
        () => request("DELETE", `/api/community/blocks/${owner}`),
        "Account unblocked.",
      );
    }
  });

  moderationList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-moderate]");
    if (!button) return;
    const { moderate, id } = button.dataset;
    if (moderate === "remove" && !window.confirm("Remove this post for everyone? This cannot be undone.")) return;
    const noteField = moderationList.querySelector(`[data-moderation-note="${CSS.escape(id)}"]`);
    const note = noteField ? noteField.value.trim() : "";
    runAction(
      () =>
        moderate === "remove"
          ? request("POST", `/api/community/moderation/${id}/remove`, { note })
          : request("POST", `/api/community/moderation/${id}/dismiss`),
      moderate === "remove" ? "Post removed for everyone." : "Post kept. Its reports are cleared.",
    );
  });

  document.querySelector(".community-workspace").addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-report-kind]");
    if (!form) return;
    event.preventDefault();
    const reason = formBody(form).reason || "";
    if (!reason) {
      showMessage("Tell us why you are reporting this post.", true);
      return;
    }
    runAction(
      () =>
        request(
          "POST",
          `/api/community/${form.dataset.reportKind}/${form.dataset.reportId}/report`,
          { reason },
        ),
      "Thanks. The report has been saved for review.",
    );
  });

  if (!getAccount()) {
    gate.hidden = false;
    return;
  }
  workspace.hidden = false;
  load().catch((error) => showMessage(error.message, true));
});
