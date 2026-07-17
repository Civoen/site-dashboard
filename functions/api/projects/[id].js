// Cloudflare Pages Function
// Handles: PUT /api/projects/:id (update), DELETE /api/projects/:id (remove)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function authOk(context) {
  const header = context.request.headers.get("Authorization") || "";
  return header === `Bearer ${context.env.DASHBOARD_KEY}`;
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPut(context) {
  if (!authOk(context)) return json({ error: "unauthorized" }, 401);
  const id = context.params.id;
  const body = await context.request.json();

  let projects = (await context.env.PROJECTS_KV.get("projects", "json")) || [];
  let found = false;
  projects = projects.map((p) => {
    if (p.id === id) {
      found = true;
      return { ...p, ...body, id, updated: "just now" };
    }
    return p;
  });
  if (!found) return json({ error: "not found" }, 404);

  await context.env.PROJECTS_KV.put("projects", JSON.stringify(projects));
  return json({ ok: true });
}

export async function onRequestDelete(context) {
  if (!authOk(context)) return json({ error: "unauthorized" }, 401);
  const id = context.params.id;

  let projects = (await context.env.PROJECTS_KV.get("projects", "json")) || [];
  projects = projects.filter((p) => p.id !== id);
  await context.env.PROJECTS_KV.put("projects", JSON.stringify(projects));
  return json({ ok: true });
}
