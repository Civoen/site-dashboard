# Project dashboard — sync setup

`index.html` works standalone (saves to that browser's local storage only).
To make it sync across every browser/device, deploy `worker.js` to Cloudflare
Workers and point the dashboard at it. Takes about 5 minutes.

## 1. Install wrangler (Cloudflare's CLI)

```
npm install -g wrangler
wrangler login
```

## 2. Create the KV namespace

```
wrangler kv namespace create PROJECTS_KV
```

This prints an `id`. Copy it into `wrangler.toml`, replacing
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.

## 3. Set your dashboard key

Pick any password-like string — this is what protects add/edit/delete.

```
wrangler secret put DASHBOARD_KEY
```

It will prompt you to paste the value.

## 4. Deploy the Worker

```
wrangler deploy
```

This prints your Worker's URL, something like:
`https://project-dashboard-api.YOURSUBDOMAIN.workers.dev`

## 5. Connect the dashboard

Open `index.html` (wherever you're hosting it — Cloudflare Pages, GitHub
Pages, etc.), click **Settings** in the top right, and enter:

- **Worker URL**: the URL from step 4
- **Dashboard key**: the value you set in step 3

Do this once per browser/device you use. From then on, all of them read and
write the same list of projects, stored in KV.

## Notes

- Reading the project list doesn't require the key — only adding, editing,
  or deleting does. That's deliberate, so you don't have to type it in just
  to view the dashboard.
- If you ever want to reset everything, delete the `projects` key in the KV
  namespace from the Cloudflare dashboard.
