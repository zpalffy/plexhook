require("dotenv").config();
const os = require("os");
const path = require("path");
const express = require("express");
const multer = require("multer");
const notifier = require("node-notifier");

const app = express();
const PORT = process.env.PORT || 8001;
const COVER_DIR = process.env.COVER_PATH || os.tmpdir();
const PLEX_TOKEN = process.env.PLEX_TOKEN;

const coverFile = path.join(COVER_DIR, "plex-cover.jpg");

const upload = multer({
  storage: multer.diskStorage({
    destination: COVER_DIR,
    filename: (req, file, cb) => cb(null, "plex-cover.jpg"),
  }),
});

const events = [];

app.get("/", (req, res) => {
  res.json(events);
});

app.post("/data", (req, res, next) => {
  if (PLEX_TOKEN && req.query.token !== PLEX_TOKEN) {
    return res.status(401).send("Unauthorized");
  }
  next();
}, upload.single("thumb"), (req, res) => {
  const payload = JSON.parse(req.body.payload);
  payload.timestamp = new Date();
  console.log(JSON.stringify(payload, null, 2));
  console.log("------------------------------------");
  if (events.unshift(payload) > 10) {
    events.pop();
  }

  if (payload.event === "media.play") {
    let t = payload.Metadata.year
      ? `${payload.Metadata.title} (${payload.Metadata.year})`
      : payload.Metadata.title;
    let icon = coverFile;

    if (payload.Metadata.grandparentTitle) {
      const { title, index, grandparentThumb, grandparentTitle, parentIndex } =
        payload.Metadata;

      t =
        parentIndex && index
          ? `${grandparentTitle} S${parentIndex}E${index} ${title}`
          : `${grandparentTitle}: ${title}`;

      if (grandparentThumb && grandparentThumb.startsWith("http")) {
        icon = grandparentThumb;
      }
    }

    notifier.notify({
      title: t,
      message: `${payload.Account.title} · ${payload.Player.title} (${payload.Player.publicAddress})`,
      icon,
    });
  }

  res.send("Data received");
});

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
