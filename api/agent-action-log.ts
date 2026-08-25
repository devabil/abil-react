import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const SITE = "abil";
const LOG_KEY = "store/agent-action-log.jsonl";
const ADMIN = process.env.META_ADMIN_KEY || "";
const BLOB_PUBLIC_BASE = process.env.BLOB_PUBLIC_BASE_URL || "";
const MAX_LOGS = 2000;

type LogEntry = {
  id: string;
  ts: string;
  site: string;
  actor: string;
  source: string;
  card?: string;
  decisionId?: string;
  action: string;
  status: "executed" | "failed" | "queued" | "blocked";
  auto: boolean;
  currentModule?: string;
  params?: unknown;
  before?: unknown;
  after?: unknown;
  rollback?: unknown;
  result?: string;
};

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"];
  const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;

  const gh = req.headers["x-abil-admin"];
  const token = Array.isArray(gh) ? gh[0] : gh;
  const pw = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  if (!pw || !token || token.indexOf(".") <= 0) return false;
  const split = token.indexOf(".");
  const exp = Number(token.slice(0, split));
  const sig = token.slice(split + 1);
  if (!exp || exp <= Date.now()) return false;
  const want = crypto.createHmac("sha256", pw).update(String(exp)).digest("hex");
  try {
    return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
  } catch {
    return false;
  }
}

function readBody(req: VercelRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") {
        try { resolve(JSON.parse(req.body)); } catch (err) { reject(err); }
      } else {
        resolve(req.body);
      }
      return;
    }
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => { body += chunk; });
    req.on("end", () => {
      if (!body.trim()) { resolve({}); return; }
      try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
    });
    req.on("error", reject);
  });
}

function safeText(value: unknown, max = 320): string {
  const raw = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return raw
    .replace(/data:[^;\s]+;base64,[A-Za-z0-9+/=]+/g, "[data-url-redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      if (/(token|secret|password|authorization|apikey|api_key|cookie|credential|refresh|access)/i.test(key)) {
        out[key] = "[redacted]";
      } else {
        out[key] = redact(item, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string") return safeText(value, 240);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  return String(value ?? "").slice(0, 120);
}

async function readLogs(): Promise<LogEntry[]> {
  let raw = "";
  if (BLOB_PUBLIC_BASE) {
    try {
      const res = await fetch(`${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${LOG_KEY}?cb=${Date.now()}`, { cache: "no-store" });
      if (res.status === 404) return [];
      if (res.ok) raw = await res.text();
    } catch {
      raw = "";
    }
  }
  if (!raw) {
    const found = await list({ prefix: LOG_KEY, limit: 1 });
    if (found.blobs.length === 0) return [];
    const res = await fetch(found.blobs[0].url, { cache: "no-store" });
    if (!res.ok) return [];
    raw = await res.text();
  }
  const rows: LogEntry[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed?.id && parsed?.action && parsed?.ts) rows.push(parsed);
    } catch {

    }
  }
  return rows;
}

async function appendLog(entry: LogEntry): Promise<void> {
  const logs = await readLogs();
  logs.push(entry);
  const recent = logs
    .filter((item) => Number.isFinite(new Date(item.ts).getTime()))
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .slice(-MAX_LOGS);
  const jsonl = recent.map((item) => JSON.stringify(item)).join("\n") + "\n";
  await put(LOG_KEY, jsonl, {
    access: "public",
    contentType: "text/plain",
    cacheControlMaxAge: 0,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  try {
    if (req.method === "GET") {
      const limit = Math.max(1, Math.min(100, Number(req.query.limit || 25)));
      const logs = (await readLogs()).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, limit);
      return res.status(200).json({ ok: true, site: SITE, logs });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const body = (await readBody(req)) as Record<string, unknown>;
    const action = safeText(body.action || body.actionType || "", 80);
    if (!action) return res.status(400).json({ error: "missing_action" });
    const statusRaw = String(body.status || "executed");
    const status: LogEntry["status"] = statusRaw === "failed" || statusRaw === "queued" || statusRaw === "blocked" ? statusRaw : "executed";
    const entry: LogEntry = {
      id: `act_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      ts: new Date().toISOString(),
      site: SITE,
      actor: safeText(body.actor || "superadmin", 80),
      source: safeText(body.source || "copilot", 80),
      card: body.card ? safeText(body.card, 60) : undefined,
      decisionId: body.decisionId ? safeText(body.decisionId, 80) : undefined,
      action,
      status,
      auto: Boolean(body.auto),
      currentModule: body.currentModule ? safeText(body.currentModule, 80) : undefined,
      params: redact(body.params),
      before: redact(body.before),
      after: redact(body.after),
      rollback: redact(body.rollback),
      result: safeText(body.result, 500),
    };
    await appendLog(entry);
    return res.status(200).json({ ok: true, site: SITE, entry });
  } catch (err: any) {
    return res.status(503).json({ ok: false, error: "agent_action_log_unavailable", detail: String(err?.message || err).slice(0, 160) });
  }
}
