// Cloudflare Pages Function
// Handles: POST /api/projects/reorder  body: { order: [id1, id2, ...] }
// Rewrites stored project order to match the given id sequence.

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

export async function onRequestPost(context) {
  if (!authOk(context)) return json({ error: "unauthorized" }, 401);

  const body = await context.request.json();
  const order = body.order;
  if (!Array.isArray(order)) return json({ error: "order must be an array of ids" }, 400);

  const projects = (await context.env.PROJECTS_KV.get("projects", "json")) || [];
  const byId = new Map(projects.map((p) => [p.id, p]));

  const reordered = order.map((id) => byId.get(id)).filter(Boolean);
  // Any project not mentioned in the order (shouldn't normally happen) stays,
  // appended at the end, so nothing is silently dropped.
  const seen = new Set(reordered.map((p) => p.id));
  const remaining = projects.filter((p) => !seen.has(p.id));

  await context.env.PROJECTS_KV.put("projects", JSON.stringify([...reordered, ...remaining]));
  return json({ ok: true });
}
