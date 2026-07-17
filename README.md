# Project dashboard — Cloudflare Pages setup

This deploys as a single Cloudflare Pages project: the static site
(`index.html`) plus a small serverless API (`functions/api/...`) that reads
and writes to Workers KV, so every device you open the dashboard on sees the
same project list.

```
project-dashboard/
├── index.html                       ← the dashboard itself
├── functions/
│   └── api/
│       └── projects/
│           ├── index.js             ← GET (list) / POST (create) /api/projects
│           └── [id].js              ← PUT (update) / DELETE /api/projects/:id
├── wrangler.toml                    ← only needed for local dev (wrangler pages dev)
└── README.md
```

Files under `functions/` are picked up automatically by Pages — no separate
Worker deployment needed.

## 1. Create the KV namespace

```
wrangler kv namespace create PROJECTS_KV
```

This prints an `id` — you'll need it in step 2.

## 2. Deploy to Pages

**If you're connecting a git repo (recommended):** push this folder to a
GitHub/GitLab repo, then in the Cloudflare dashboard go to
**Workers & Pages > Create > Pages > Connect to Git**, pick the repo, and
deploy (no build command needed — output directory is `/`).

**If you'd rather deploy directly from your machine:**

```
wrangler pages deploy . --project-name=project-dashboard
```

## 3. Bind the KV namespace to your Pages project

In the Cloudflare dashboard: **Workers & Pages > project-dashboard >
Settings > Functions > KV namespace bindings > Add binding**

- Variable name: `PROJECTS_KV`
- KV namespace: the one you created in step 1

(This also updates `wrangler.toml` locally if you want `wrangler pages dev`
to work the same way — paste the `id` from step 1 in place of
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.)

## 4. Set your dashboard key

Pick any password-like string — this is what protects add/edit/delete.

```
wrangler pages secret put DASHBOARD_KEY --project-name=project-dashboard
```

Or add it in the dashboard: **Settings > Environment variables > Add
secret**.

## 5. Redeploy

Bindings and secrets only take effect on the next deployment, so trigger one
more (push a commit, or re-run `wrangler pages deploy .`).

## 6. Connect each device

Open the live site, click **Settings** (top right), and paste in the
dashboard key from step 4. Viewing the dashboard works on any device
without it — the key is only needed to add, edit, or delete.

## Notes

- If the API isn't reachable yet (e.g. straight after downloading this
  zip, before deploying), the dashboard falls back to a copy cached in that
  browser so it still works — you'll see a small banner saying so.
- To wipe all projects, delete the `projects` key from the `PROJECTS_KV`
  namespace in the Cloudflare dashboard.
