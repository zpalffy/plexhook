const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

const mediaTitle = (metadata = {}) => {
  const { title, year, index, parentIndex, grandparentTitle } = metadata;
  if (grandparentTitle) {
    return parentIndex && index
      ? `${grandparentTitle} S${parentIndex}E${index} ${title}`
      : `${grandparentTitle}: ${title}`;
  }
  return year ? `${title} (${year})` : title;
};

const eventStyles = {
  "media.play": ["Playing", "green"],
  "media.resume": ["Resumed", "green"],
  "media.pause": ["Paused", "amber"],
  "media.stop": ["Stopped", "gray"],
  "media.scrobble": ["Watched", "blue"],
  "media.rate": ["Rated", "amber"],
  "library.new": ["Added to library", "blue"],
  "library.on.deck": ["On deck", "blue"],
};

const version = (v) => escape(v.split("-")[0]);

const renderEvent = (payload) => {
  const [label, tone] = eventStyles[payload.event] || [payload.event || "Unknown event", "gray"];
  const metadata = payload.Metadata || {};
  const meta = [
    payload.Account?.title,
    payload.Player?.title,
    payload.Player?.publicAddress,
    metadata.librarySectionTitle,
  ].filter(Boolean);

  return `
    <li class="${tone}">
      <small><b>${escape(label)}</b><time>${new Date(payload.timestamp).toLocaleString()}</time></small>
      <h2>${escape(mediaTitle(metadata) || label)}</h2>
      ${meta.length ? `<small>${meta.map(escape).join(" · ")}</small>` : ""}
      <details><summary>Raw payload</summary><pre>${escape(JSON.stringify(payload, null, 2))}</pre></details>
    </li>`;
};

const renderUpdate = (update) => {
  if (!update) return "";
  const server = escape(update.serverName || "Plex Media Server");
  return update.updateAvailable
    ? `<a class="update" href="https://www.plex.tv/media-server-downloads/" target="_blank" rel="noopener">
        <b>Plex update available</b> ${server} is on ${version(update.installed)} · ${version(update.latest)} is out →</a>`
    : `<p class="muted">${server} ${version(update.installed)} is up to date</p>`;
};

const renderEventLog = (events, update) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>plexhook</title>
<style>
  :root { color-scheme: light dark; --green: #2e9d5b; --amber: #c98a00; --blue: #3b7ddd; --gray: GrayText; }
  body { max-width: 720px; margin: 0 auto; padding: 32px 16px; font: 15px/1.5 system-ui, sans-serif; }
  header { display: flex; justify-content: space-between; align-items: baseline; }
  h1 { margin: 0; font-size: 22px; }
  h2 { margin: 2px 0; font-size: 16px; overflow-wrap: anywhere; }
  a { color: inherit; }
  .muted, small { color: GrayText; font-size: 13px; }
  .update { display: block; margin: 16px 0; padding: 12px 16px; border-radius: 10px; text-decoration: none; background: color-mix(in srgb, var(--amber) 18%, Canvas); }
  ul { list-style: none; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
  li { padding: 14px 16px; border: 1px solid color-mix(in srgb, CanvasText 15%, transparent); border-radius: 10px; }
  li small:first-child { display: flex; justify-content: space-between; gap: 12px; }
  li b { color: var(--tone); text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; }
  .green { --tone: var(--green); } .amber { --tone: var(--amber); } .blue { --tone: var(--blue); } .gray { --tone: var(--gray); }
  summary { cursor: pointer; color: GrayText; font-size: 12px; margin-top: 6px; }
  pre { overflow: auto; max-height: 320px; font-size: 12px; }
</style>
</head>
<body>
  <header>
    <h1>plexhook</h1>
    <a href="/events.json">JSON</a>
  </header>
  ${renderUpdate(update)}
  ${events.length
    ? `<ul>${events.map(renderEvent).join("")}</ul>`
    : `<p class="muted">No events yet. Play something in Plex and it will show up here.</p>`}
  <script>setInterval(() => document.querySelector("details[open]") || location.reload(), 30000);</script>
</body>
</html>`;

module.exports = { mediaTitle, renderEventLog };
