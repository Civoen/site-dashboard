// Cloudflare Pages Function
// Handles: GET /api/projects (list), POST /api/projects (create)
// Requires a KV binding named PROJECTS_KV and a secret named DASHBOARD_KEY,
// both set on the Pages project (see README.md).

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

export async function onRequestGet(context) {
  const projects = (await context.env.PROJECTS_KV.get("projects", "json")) || [];
  return json(projects);
}

export async function onRequestPost(context) {
  if (!authOk(context)) return json({ error: "unauthorized" }, 401);
  const body = await context.request.json();
  if (!body.name) return json({ error: "name is required" }, 400);

  const projects = (await context.env.PROJECTS_KV.get("projects", "json")) || [];
  const project = {
    id: Date.now().toString(),
    name: body.name,
    color: body.color || "#7f77dd",
    repo: body.repo || "",
    worker: body.worker || "",
    site: body.site || "",
    updated: "just now",
  };
  projects.unshift(project);
  await context.env.PROJECTS_KV.put("projects", JSON.stringify(projects));
  return json(project, 201);
}
