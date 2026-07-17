// Cloudflare Worker API for the project dashboard.
// Stores all projects as one JSON array under the KV key "projects".
//
// Deploy with wrangler (see README.md for full steps):
//   wrangler kv namespace create PROJECTS_KV
//   wrangler secret put DASHBOARD_KEY
//   wrangler deploy

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

function authOk(request, env) {
  const header = request.headers.get("Authorization") || "";
  return header === `Bearer ${env.DASHBOARD_KEY}`;
}

async function getProjects(env) {
  const data = await env.PROJECTS_KV.get("projects", "json");
  return data || [];
}

async function putProjects(env, projects) {
  await env.PROJECTS_KV.put("projects", JSON.stringify(projects));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // GET /api/projects -> list (read-only, no auth needed so any of your
    // devices can load the dashboard)
    if (url.pathname === "/api/projects" && request.method === "GET") {
      const projects = await getProjects(env);
      return json(projects);
    }

    // POST /api/projects -> create
    if (url.pathname === "/api/projects" && request.method === "POST") {
      if (!authOk(request, env)) return json({ error: "unauthorized" }, 401);
      const body = await request.json();
      if (!body.name) return json({ error: "name is required" }, 400);
      const projects = await getProjects(env);
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
      await putProjects(env, projects);
      return json(project, 201);
    }

    const itemMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (itemMatch) {
      const id = itemMatch[1];

      // PUT /api/projects/:id -> update
      if (request.method === "PUT") {
        if (!authOk(request, env)) return json({ error: "unauthorized" }, 401);
        const body = await request.json();
        let projects = await getProjects(env);
        let found = false;
        projects = projects.map((p) => {
          if (p.id === id) {
            found = true;
            return { ...p, ...body, id, updated: "just now" };
          }
          return p;
        });
        if (!found) return json({ error: "not found" }, 404);
        await putProjects(env, projects);
        return json({ ok: true });
      }

      // DELETE /api/projects/:id -> remove
      if (request.method === "DELETE") {
        if (!authOk(request, env)) return json({ error: "unauthorized" }, 401);
        let projects = await getProjects(env);
        projects = projects.filter((p) => p.id !== id);
        await putProjects(env, projects);
        return json({ ok: true });
      }
    }

    return json({ error: "not found" }, 404);
  },
};
