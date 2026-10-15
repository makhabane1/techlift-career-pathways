// Shows unread notifications at the top of the page and checks for new ones
// every 30 seconds.
TechLiftStore.ready.then(() => {
  const panel = document.getElementById("notifications");
  if (!panel || !TechLiftStore.getAccount()) return;

  const { escapeHtml } = TechLiftStore;

  const timeAgo = (value) => {
    const minutes = Math.round((Date.now() - new Date(value)) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const render = (items) => {
    const unread = items.filter((item) => !item.read);
    panel.classList.toggle("hidden", unread.length === 0);
    if (!unread.length) {
      panel.innerHTML = "";
      return;
    }
    panel.innerHTML = `
      <div class="notice-head">
        <strong>${unread.length} new ${unread.length === 1 ? "update" : "updates"}</strong>
        <button type="button" class="text-link" data-mark-read>Mark as read</button>
      </div>
      <ul class="notice-list">
        ${unread
          .slice()
          .reverse()
          .map((item) => `
            <li>
              <a href="${escapeHtml(item.link)}">${escapeHtml(item.message)}</a>
              <small>${escapeHtml(timeAgo(item.createdAt))}</small>
            </li>`)
          .join("")}
      </ul>`;
  };

  const refresh = async () => render(await TechLiftStore.fetchNotifications());

  panel.addEventListener("click", async (event) => {
    if (!event.target.matches("[data-mark-read]")) return;
    await TechLiftStore.markNotificationsRead();
    refresh();
  });

  refresh();
  setInterval(refresh, 30000);
});
