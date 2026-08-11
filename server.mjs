import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRegistry, RegistryUnavailableError } from "./src/registry.mjs";
import { evaluateDecision, listOptions } from "./src/decision-engine.mjs";
import { GuideUnavailableError, runDecisionGuide } from "./src/decision-guide.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
loadDotEnv();

const PORT = Number(process.env.PORT || 5173);
const ECOSYSTEM_ID = "northstar_demo";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",").map((item) => item.trim()).filter(Boolean);
const MIME_TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };

export function createAdvisorServer(overrides = {}) {
  const registryUrl = overrides.registryUrl ?? process.env.REGISTRY_CSV_URL;
  const fetchImpl = overrides.fetchImpl || fetch;
  const openAiKey = overrides.openAiKey ?? process.env.OPENAI_API_KEY;
  const readLiveRegistry = () => fetchRegistry({ url: registryUrl, fetchImpl });

  return createServer(async (req, res) => {
    try {
      if (handleCors(req, res)) return;
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname.startsWith("/api/")) setApiHeaders(res);

      if (req.method === "GET" && url.pathname === "/api/health") {
        return sendJson(res, { ok: true, registryConfigured: Boolean(registryUrl), decisionGuideConfigured: Boolean(openAiKey), model: OPENAI_MODEL });
      }
      if (req.method === "GET" && url.pathname === "/api/options") {
        const registry = await readLiveRegistry();
        return sendJson(res, listOptions(registry, ECOSYSTEM_ID));
      }
      if (req.method === "POST" && url.pathname === "/api/decision") {
        const body = await readJson(req);
        const registry = await readLiveRegistry();
        return sendJson(res, evaluateDecision(registry, { ...body, ecosystemId: ECOSYSTEM_ID }));
      }
      if (req.method === "POST" && url.pathname === "/api/guide") {
        const body = await readJson(req);
        const result = await runDecisionGuide({
          body: { ...body, ecosystemId: ECOSYSTEM_ID }, readLiveRegistry, apiKey: openAiKey,
          model: OPENAI_MODEL, fetchImpl
        });
        return sendJson(res, result);
      }
      if (req.method === "GET" && !url.pathname.startsWith("/api/")) return serveStatic(url.pathname, res);
      return sendJson(res, { error: "Not found" }, 404);
    } catch (error) {
      if (error instanceof RegistryUnavailableError) return sendJson(res, { error: "registry_unavailable", message: error.message }, 503);
      if (error instanceof GuideUnavailableError) return sendJson(res, { error: error.code, message: error.message }, error.code === "invalid_question" ? 400 : 503);
      if (error instanceof SyntaxError) return sendJson(res, { error: "invalid_request", message: "The request body is not valid JSON." }, 400);
      console.error(error);
      return sendJson(res, { error: "server_error", message: "The advisor could not complete this request." }, 500);
    }
  });
}

function handleCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cache-Control");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return true; }
  return false;
}

function setApiHeaders(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
}

async function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let target = normalize(join(publicDir, safePath));
  if (!target.startsWith(normalize(publicDir))) return sendJson(res, { error: "Forbidden" }, 403);
  try { await access(target); } catch { target = join(publicDir, "index.html"); }
  const file = await readFile(target);
  res.writeHead(200, { "Content-Type": MIME_TYPES[extname(target)] || "application/octet-stream", "Cache-Control": target.endsWith("index.html") ? "no-cache" : "public, max-age=300" });
  res.end(file);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new SyntaxError("Request too large");
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function loadDotEnv() {
  try {
    for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  } catch { /* Local .env is optional. */ }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAdvisorServer().listen(PORT, () => console.log(`Rack Upgrade Advisor listening on http://localhost:${PORT}`));
}
