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

const icons = {
  play: '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/>',
  plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  dot: '<circle cx="12" cy="12" r="4"/>',
};

const eventStyles = {
  "media.play": { label: "Playing", icon: "play", tone: "green" },
  "media.resume": { label: "Resumed", icon: "play", tone: "green" },
  "media.pause": { label: "Paused", icon: "pause", tone: "amber" },
  "media.stop": { label: "Stopped", icon: "stop", tone: "gray" },
  "media.scrobble": { label: "Watched", icon: "check", tone: "blue" },
  "media.rate": { label: "Rated", icon: "star", tone: "amber" },
  "library.new": { label: "Added to library", icon: "plus", tone: "blue" },
  "library.on.deck": { label: "On deck", icon: "plus", tone: "blue" },
};

const styleFor = (event) =>
  eventStyles[event] || { label: event || "Unknown event", icon: "dot", tone: "gray" };

const renderEvent = (payload) => {
  const { label, icon, tone } = styleFor(payload.event);
  const metadata = payload.Metadata || {};
  const title = mediaTitle(metadata) || label;
  const poster = [metadata.grandparentThumb, metadata.thumb].find(
    (url) => url && url.startsWith("http")
  );
  const avatar = payload.Account?.thumb?.startsWith("http") ? payload.Account.thumb : null;
  const timestamp = new Date(payload.timestamp).toISOString();

  const details = [
    payload.Account?.title &&
      `<span class="chip">${avatar ? `<img src="${escape(avatar)}" alt="" loading="lazy">` : ""}${escape(payload.Account.title)}</span>`,
    payload.Player?.title && `<span>${escape(payload.Player.title)}</span>`,
    payload.Player?.publicAddress && `<span class="mono">${escape(payload.Player.publicAddress)}</span>`,
    metadata.librarySectionTitle && `<span>${escape(metadata.librarySectionTitle)}</span>`,
  ].filter(Boolean);

  return `
    <li class="event tone-${tone}">
      <div class="art">
        ${poster
          ? `<img src="${escape(poster)}" alt="" loading="lazy">`
          : `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${icons[icon]}</svg>`}
      </div>
      <div class="body">
        <div class="top">
          <span class="badge">${escape(label)}</span>
          <time datetime="${timestamp}" title="${timestamp}">${timestamp}</time>
        </div>
        <h2>${escape(title)}</h2>
        ${details.length ? `<div class="meta">${details.join("")}</div>` : ""}
        <details>
          <summary>Raw payload</summary>
          <pre>${escape(JSON.stringify(payload, null, 2))}</pre>
        </details>
      </div>
    </li>`;
};

const renderEventLog = (events) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>plexhook</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #f6f6f4;
    --surface: #ffffff;
    --border: #e6e5e1;
    --text: #1b1b1a;
    --muted: #6d6c67;
    --accent: #d99a06;
    --green: #1f9d55;
    --amber: #c27c00;
    --blue: #2f6fdb;
    --gray: #7a7975;
    --shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.04);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #111112;
      --surface: #1a1a1c;
      --border: #2a2a2d;
      --text: #ededeb;
      --muted: #9a9995;
      --accent: #f2b52b;
      --green: #3ccf7e;
      --amber: #f2b52b;
      --blue: #6ea2ff;
      --gray: #8e8d89;
      --shadow: none;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 760px; margin: 0 auto; padding: 40px 16px 64px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
  h1 { margin: 0; font-size: 22px; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
  h1 .logo { width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: #1b1b1a; display: grid; place-items: center; }
  h1 .logo svg { width: 14px; height: 14px; margin-left: 2px; }
  .subtitle { color: var(--muted); font-size: 13px; margin-top: 2px; }
  .live { display: inline-flex; align-items: center; gap: 6px; }
  .live::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 3px color-mix(in srgb, var(--green) 25%, transparent); }
  .json-link {
    color: var(--text); text-decoration: none; font-size: 13px; font-weight: 500;
    border: 1px solid var(--border); background: var(--surface); padding: 6px 12px; border-radius: 999px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .json-link:hover { border-color: var(--muted); }
  ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .event {
    display: flex; gap: 16px; padding: 16px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow);
    --tone: var(--gray);
  }
  .tone-green { --tone: var(--green); }
  .tone-amber { --tone: var(--amber); }
  .tone-blue { --tone: var(--blue); }
  .art {
    flex: none; width: 56px; height: 56px; border-radius: 10px; overflow: hidden;
    display: grid; place-items: center; color: var(--tone);
    background: color-mix(in srgb, var(--tone) 14%, transparent);
  }
  .art svg { width: 24px; height: 24px; }
  .art img { width: 100%; height: 100%; object-fit: cover; }
  .body { flex: 1; min-width: 0; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .badge { color: var(--tone); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  time { color: var(--muted); font-size: 13px; white-space: nowrap; }
  h2 { margin: 2px 0 6px; font-size: 16px; font-weight: 600; letter-spacing: -0.01em; overflow-wrap: anywhere; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; color: var(--muted); font-size: 13px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; color: var(--text); }
  .chip img { width: 18px; height: 18px; border-radius: 50%; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  details { margin-top: 10px; }
  summary { cursor: pointer; color: var(--muted); font-size: 12px; width: fit-content; }
  summary:hover { color: var(--text); }
  pre {
    margin: 8px 0 0; padding: 12px; max-height: 320px; overflow: auto;
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .empty { text-align: center; color: var(--muted); padding: 64px 16px; border: 1px dashed var(--border); border-radius: 14px; }
  .empty strong { display: block; color: var(--text); font-size: 16px; margin-bottom: 4px; }
  @media (max-width: 480px) {
    .event { gap: 12px; padding: 14px; }
    .art { width: 44px; height: 44px; }
  }
</style>
</head>
<body>
<main>
  <header>
    <div>
      <h1><span class="logo"><svg viewBox="0 0 24 24" fill="currentColor">${icons.play}</svg></span>plexhook</h1>
      <div class="subtitle"><span class="live">Last ${events.length} event${events.length === 1 ? "" : "s"} · refreshes automatically</span></div>
    </div>
    <a class="json-link" href="/events.json">{ } JSON</a>
  </header>
  ${events.length
    ? `<ul>${events.map(renderEvent).join("")}</ul>`
    : `<div class="empty"><strong>No events yet</strong>Play something in Plex and it will show up here.</div>`}
</main>
<script>
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const units = [["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  const relative = (date) => {
    const seconds = (date - Date.now()) / 1000;
    const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) || units[3];
    return rtf.format(Math.round(seconds / size), unit);
  };
  const update = () => document.querySelectorAll("time").forEach((el) => {
    const date = new Date(el.dateTime);
    el.textContent = relative(date);
    el.title = date.toLocaleString();
  });
  update();
  setInterval(update, 15000);
  setInterval(() => {
    if (document.visibilityState === "visible" && !document.querySelector("details[open]")) location.reload();
  }, 30000);
</script>
</body>
</html>`;

module.exports = { mediaTitle, renderEventLog };
