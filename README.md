# plexhook

A lightweight Node.js server that receives [Plex webhooks](https://support.plex.tv/articles/115002267687-webhooks/) and sends a desktop notification whenever someone starts playing media.

> Requires a [Plex Pass](https://www.plex.tv/plex-pass/) subscription to use webhooks.

## Purpose

plexhook is meant to be a simple, hackable companion to your Plex server. The goal is to make Plex events visible — either as desktop notifications when media plays, as structured JSON logged to the terminal, or as a quick web view of recent activity. It's a foundation for routing Plex events wherever you want them.

## Features

- Desktop notification on `media.play` with title, player name, and user
- Keeps the last 10 events in memory, accessible via `GET /`
- Works on macOS, Windows, and Linux (headless servers receive webhooks fine; notifications just won't fire)

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

## Installation

```bash
pnpm install
```

## Configuration

Copy `.env.example` to `.env` and edit as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8001` | Port the server listens on |
| `COVER_PATH` | system temp dir | Where the Plex thumbnail is saved |
| `PLEX_TOKEN` | _(unset)_ | Optional shared secret (see below) |

## Running

```bash
pnpm start        # production
pnpm dev          # with auto-restart via nodemon
```

## Plex Setup

1. Open Plex Web and go to **Settings → Webhooks**
2. Click **Add Webhook**
3. Enter your server's URL:
   ```
   http://your-server-ip:8001/data
   ```
4. Click **Save Changes**

Plex will now POST to this server on media events.

## Optional: Securing with a Token

If your server is exposed to the internet, you can require a secret token on incoming requests.

1. Set `PLEX_TOKEN` in your `.env`:
   ```
   PLEX_TOKEN=some-secret-value
   ```
2. In Plex, append the token as a query parameter in the webhook URL:
   ```
   http://your-server-ip:8001/data?token=some-secret-value
   ```

Requests without a matching token will be rejected with a `401`. If `PLEX_TOKEN` is not set, no token is required.

## Note on Privacy

`GET /` is unauthenticated and returns recent events including usernames, player names, and IP addresses. If your server is publicly accessible, consider putting it behind a reverse proxy with auth, or restricting access to your local network.

## Viewing Recent Events

```bash
curl http://localhost:8001/
```

Returns the last 10 webhook payloads as JSON.
