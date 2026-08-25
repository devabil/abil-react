import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";
import { decryptVaultText as decrypt, encryptVaultText as encrypt } from "./_vault-crypto.js";

export const config = { runtime: "nodejs" };

const PREFIX = "store/private/";
const SNAP_PREFIX = "store/private-snap/";
const LOCK_KEY = "store/private-lock/pending_decisions.lock";
const BLOB_PUBLIC_BASE = process.env.BLOB_PUBLIC_BASE_URL || "";
const ADMIN_PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
const COL = "pending_decisions";

type PendingDecision = {
  id: string;
  ts?: string;
  updatedAt?: string;
  card?: string;
  sourceId?: string;
  action?: unknown;
  title?: string;
  body?: string;
  status?: string;
  result?: string;
  claimId?: string;
  claimedAt?: string;
};

function sign(exp: number): string {
  return crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
}
function validToken(tok: string | undefined): boolean {
  if (!tok || !ADMIN_PW) return false;
  const [expS, sig] = tok.split(".");
  const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = sign(exp);
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}
function tokenFromReq(req: VercelRequest): string | undefined {
  const h = req.headers["x-abil-admin"];
  return Array.isArray(h) ? h[0] : h as string | undefined;
}
function qs(req: VercelRequest, k: string): string | null {
  const v = req.query[k];
  return typeof v === "string" ? v : Array.isArray(v) && v.length ? v[0] : null;
}
function readBody(req: VercelRequest): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") { try { resolve(JSON.parse(req.body)); } catch (e) { reject(e); } }
      else resolve(req.body as Record<string, unknown>);
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (c: string) => { buf += c; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function setCors(req: VercelRequest, res: VercelResponse) {
                                                                                       
                                                                                            
  {
    const _o = req.headers.origin; const _org = Array.isArray(_o) ? _o[0] : _o;
    const _ok = !!_org && (
      /^https:\/\/abil-site\.vercel\.app$/.test(_org) ||
      /^https:\/\/([a-z0-9-]+\.)?abil\.ch$/.test(_org) ||
      /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/.test(_org) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(_org)
    );
    if (_ok) { res.setHeader("Access-Control-Allow-Origin", _org as string); res.setHeader("Vary", "Origin"); }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}

async function readCol(): Promise<PendingDecision[]> {
  let raw: string | null = null;
  if (BLOB_PUBLIC_BASE) {
    try {
      const r = await fetch(`${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${PREFIX}${COL}.json?cb=${Date.now()}`, { cache: "no-store" });
      if (r.status === 404) return [];
      if (r.ok) raw = await r.text();
    } catch {
      raw = null;
    }
  }
  if (raw === null) {
    const found = await list({ prefix: `${PREFIX}${COL}.json`, limit: 1 });
    if (found.blobs.length === 0) return [];
    const r = await fetch(found.blobs[0].url, { cache: "no-store" });
    if (!r.ok) return [];
    raw = await r.text();
  }
  const dec = decrypt(raw);
  if (dec === null) return [];
  try {
    const parsed = JSON.parse(dec);
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}
async function snapshot(current: unknown) {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    await put(`${SNAP_PREFIX}${COL}-${ts}.json`, encrypt(JSON.stringify(current)), {
      access: "public",
      contentType: "text/plain",
      cacheControlMaxAge: 0,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch {

  }
}
async function writeCol(data: PendingDecision[]) {
  const current = await readCol();
  if (current.length) await snapshot(current);
  await put(`${PREFIX}${COL}.json`, encrypt(JSON.stringify(data.slice(0, 200))), {
    access: "public",
    contentType: "text/plain",
    cacheControlMaxAge: 0,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
async function readLock(): Promise<{ id?: string; ts?: number } | null> {
  try {
    const found = await list({ prefix: LOCK_KEY, limit: 1 });
    if (found.blobs.length === 0) return null;
    const r = await fetch(found.blobs[0].url, { cache: "no-store" });
    if (!r.ok) return null;
    return JSON.parse(await r.text());
  } catch {
    return null;
  }
}
async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
async function acquireLock(): Promise<string | null> {
  const id = crypto.randomBytes(8).toString("hex");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const lock = await readLock();
    if (lock?.ts && Date.now() - lock.ts > 15000) {
      try { await del(LOCK_KEY); } catch {  }
    }
    try {
      await put(LOCK_KEY, JSON.stringify({ id, ts: Date.now() }), {
        access: "public",
        contentType: "application/json",
        cacheControlMaxAge: 0,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
      return id;
    } catch {
      await sleep(80 + attempt * 60);
    }
  }
  return null;
}
async function releaseLock(id: string) {
  try {
    const lock = await readLock();
    if (!lock?.id || lock.id === id) await del(LOCK_KEY);
  } catch {

  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") return res.status(204).end();
  if (!ADMIN_PW) return res.status(503).json({ error: "admin_not_configured" });
  if (!validToken(tokenFromReq(req))) return res.status(401).json({ error: "unauthorized" });

  try {
    if (method === "GET") {
      return res.status(200).json({ ok: true, value: await readCol() });
    }
    if (method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

    const action = qs(req, "action") || "claim";
    if (action !== "claim") return res.status(400).json({ error: "unknown_action" });
    const body = await readBody(req);
    const id = String(body.id || "");
    const from = String(body.from || "");
    const to = String(body.to || "");
    if (!id || !from || !to) return res.status(400).json({ error: "id_from_to_required" });

    const lockId = await acquireLock();
    if (!lockId) return res.status(423).json({ ok: false, error: "pending_decisions_locked" });
    try {
      const listItems = await readCol();
      const idx = listItems.findIndex((item) => item.id === id);
      if (idx < 0) return res.status(404).json({ ok: false, error: "not_found", value: listItems });
      const current = listItems[idx];
      if (current.status !== from) {
        return res.status(409).json({ ok: false, error: "status_conflict", decision: current, value: listItems });
      }
      const now = new Date().toISOString();
      const nextItem: PendingDecision = {
        ...current,
        status: to,
        updatedAt: now,
        claimId: crypto.randomBytes(6).toString("hex"),
        claimedAt: now,
      };
      if ("action" in body) nextItem.action = body.action;
      if ("result" in body) nextItem.result = String(body.result || "").slice(0, 500);
      const next = [...listItems];
      next[idx] = nextItem;
      await writeCol(next);
      return res.status(200).json({ ok: true, decision: nextItem, value: next });
    } finally {
      await releaseLock(lockId);
    }
  } catch (err: any) {
    return res.status(503).json({ ok: false, error: "pending_decisions_unavailable", detail: String(err?.message || err).slice(0, 160) });
  }
}
