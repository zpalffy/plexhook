const notifier = require("node-notifier");

const DOWNLOADS_URL = "https://plex.tv/api/downloads/5.json";
const CHECK_INTERVAL = 60 * 60 * 1000;

let status = null;
let lastCheck = 0;
let notifiedVersion = null;

const parseVersion = (version) => version.split("-")[0].split(".").map(Number);

const isNewer = (a, b) => {
  const [x, y] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
};

const fetchJson = async (url) => {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
};

// Plex sends webhooks from the server itself, so the request IP is the server.
const checkForUpdate = async (ip, serverName) => {
  if (!ip || Date.now() - lastCheck < CHECK_INTERVAL) return;
  lastCheck = Date.now();

  const host = ip.replace(/^::ffff:/, "");
  const hostname = host.includes(":") ? `[${host}]` : host;

  try {
    const [identity, downloads] = await Promise.all([
      fetchJson(`http://${hostname}:32400/identity`),
      fetchJson(DOWNLOADS_URL),
    ]);
    const installed = identity.MediaContainer.version;
    const latest = Object.values(downloads.computer)
      .map((platform) => platform.version)
      .reduce((a, b) => (isNewer(b, a) ? b : a));

    status = {
      serverName,
      installed,
      latest,
      updateAvailable: isNewer(latest, installed),
      checkedAt: new Date(),
    };

    if (status.updateAvailable && notifiedVersion !== latest) {
      notifiedVersion = latest;
      notifier.notify({
        title: "Plex update available",
        message: `${serverName || "Plex Media Server"}: ${installed} → ${latest}`,
      });
    }
  } catch (err) {
    console.error(`Plex update check failed: ${err.message}`);
  }
};

const getUpdateStatus = () => status;

module.exports = { checkForUpdate, getUpdateStatus, isNewer };
