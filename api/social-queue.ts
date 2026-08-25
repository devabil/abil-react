/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                       
                                                                                                       
                                                                                                    
                                                                                          
  
                                                                                               
                                                                          
                                                                                          
                                                                                 
                                                                    
                                                                                          
                                                                                                
                                                                                                   
                                                                                                  
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const QUEUE_PREFIX = "social/queue/";
const LOCK_PREFIX = "social/queue-lock/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const META_ADMIN = process.env.META_ADMIN_KEY || "";
const ABIL_ADMIN = process.env.ABIL_ADMIN_AUTH_SECRET || "";
const CRON_SECRET = process.env.CRON_SECRET || "";
const LOCK_TTL_MS = Number(process.env.QUEUE_LOCK_TTL_MS || 5 * 60 * 1000);
const INFLIGHT_TTL_MS = Number(process.env.QUEUE_INFLIGHT_TTL_MS || 30 * 60 * 1000);

type Platform = "facebook" | "instagram" | "linkedin";
interface QueueItem {
  id: string;
  tenantId: string;
  platform: Platform;
  target?: string;                                                                            
  caption?: string;
  message?: string;
  link?: string;
  imageUrl?: string;                                                             
  orgUrn?: string;                                              
  scheduledAt: string;                                   
  status: "scheduled" | "publishing" | "published" | "failed";
  placement?: "feed" | "reels" | "story";                                                        
  pageId?: string;                                                                                                   
  result?: any;
  error?: string;
  createdAt: string;
  publishedAt?: string;
  processingAt?: string;
  lastAttemptAt?: string;
  attempts?: number;
}

function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
function internalAuthHeaders(): Record<string, string> {
  if (ABIL_ADMIN) {
    const exp = Date.now() + 5 * 60 * 1000;
    const sig = crypto.createHmac("sha256", ABIL_ADMIN).update(String(exp)).digest("hex");
    return { "x-abil-admin": `${exp}.${sig}` };
  }
  return META_ADMIN ? { "x-meta-admin": META_ADMIN } : {};
}

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (META_ADMIN && mkv && mkv === META_ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) {
    const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1);
    if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } }
  }
  return false;
}

function cronAuthed(req: VercelRequest): boolean {
  if (authed(req)) return true;                                            
  if (!CRON_SECRET) return false;
  const a = req.headers["authorization"]; const av = Array.isArray(a) ? a[0] : a;
  return !!av && av === `Bearer ${CRON_SECRET}`;
}
function hasCronBearer(req: VercelRequest): boolean {
  if (!CRON_SECRET) return false;
  const a = req.headers["authorization"]; const av = Array.isArray(a) ? a[0] : a;
  return !!av && av === `Bearer ${CRON_SECRET}`;
}

async function readQueue(key: string): Promise<QueueItem[]> {
  let txt: string | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); else if (r.status === 404) txt = null; } catch {  } }
  if (txt === null) { try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } } catch {  } }
  if (!txt) return [];
  try { const j = JSON.parse(txt); return Array.isArray(j) ? j : []; } catch { return []; }
}
async function writeQueue(key: string, items: QueueItem[]): Promise<void> {
  await put(key, JSON.stringify(items), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
}

async function readText(key: string): Promise<string | null> {
  if (BLOB_PUBLIC_BASE) {
    try {
      const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" });
      if (r.ok) return await r.text();
      if (r.status === 404) return null;
    } catch {  }
  }
  try {
    const { blobs } = await list({ prefix: key, limit: 1 });
    const bl = blobs.find((x) => x.pathname === key);
    if (!bl) return null;
    const r = await fetch(bl.url, { cache: "no-store" });
    return r.ok ? await r.text() : null;
  } catch { return null; }
}

async function readJson<T>(key: string): Promise<T | null> {
  const txt = await readText(key);
  if (!txt) return null;
  try { return JSON.parse(txt) as T; } catch { return null; }
}

function lockKeyFor(queueKey: string): string {
  const hash = crypto.createHash("sha1").update(queueKey).digest("hex");
  return `${LOCK_PREFIX}${hash}.json`;
}

async function acquireQueueLock(queueKey: string): Promise<{ release: () => Promise<void> } | null> {
  const lockKey = lockKeyFor(queueKey);
  const now = Date.now();
  const current = await readJson<{ owner?: string; createdAt?: string }>(lockKey);
  if (current?.createdAt) {
    const age = now - Date.parse(current.createdAt);
    if (Number.isFinite(age) && age <= LOCK_TTL_MS) return null;
    await del(lockKey).catch(() => undefined);
  } else if (current) {
    return null;
  }
  const owner = `${now}-${crypto.randomUUID()}`;
  try {
    await put(lockKey, JSON.stringify({ owner, queueKey, createdAt: new Date(now).toISOString() }), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: false });
  } catch {
    return null;
  }
  return {
    release: async () => {
      const latest = await readJson<{ owner?: string }>(lockKey);
      if (latest?.owner === owner) await del(lockKey).catch(() => undefined);
    },
  };
}

function isStaleInflight(item: QueueItem, now: number): boolean {
  if (item.status !== "publishing") return false;
  const t = Date.parse(String(item.processingAt || item.lastAttemptAt || ""));
  return !Number.isFinite(t) || now - t > INFLIGHT_TTL_MS;
}

                                                                                                  
async function publishItem(host: string, item: QueueItem): Promise<{ ok: boolean; result?: any; error?: string }> {
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const base = `${proto}://${host}`;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...internalAuthHeaders() };
  try {
    if (item.platform === "linkedin") {
      const r = await fetch(`${base}/api/linkedin-publish`, { method: "POST", headers, body: JSON.stringify({ tenantId: item.tenantId, text: item.caption || item.message || "", orgUrn: item.orgUrn }) });
      const data = await r.json().catch(() => ({}));
      return r.ok ? { ok: true, result: data } : { ok: false, error: (data && (data.error || JSON.stringify(data))) || `http_${r.status}` };
    }
    const target = item.target || (item.platform === "instagram" ? "instagram" : "facebook");
    const r = await fetch(`${base}/api/meta-publish`, { method: "POST", headers, body: JSON.stringify({ tenantId: item.tenantId, target, message: item.message || item.caption, caption: item.caption || item.message, link: item.link, imageUrl: item.imageUrl, ...(item.pageId ? { pageId: item.pageId } : {}), ...(item.placement ? { placement: item.placement } : {}) }) });
    const data = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, result: data } : { ok: false, error: (data && (data.error || JSON.stringify(data))) || `http_${r.status}` };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const action = String((Array.isArray(req.query.action) ? req.query.action[0] : req.query.action) || "");
  const tenantParam = String((Array.isArray(req.query.tenantId) ? req.query.tenantId[0] : req.query.tenantId) || "");
  const shouldDrain = action === "drain" || (!action && req.method === "GET" && !tenantParam && hasCronBearer(req));

                                                                                                         
  if (shouldDrain) {
    if (!cronAuthed(req)) return res.status(401).json({ error: "unauthorized" });
    if (!ABIL_ADMIN && !META_ADMIN) return res.status(503).json({ error: "admin authentication not configured" });
    const host = String(req.headers.host || "abil-site.vercel.app");
    const now = Date.now();
    let processed = 0, published = 0, failed = 0, locked = 0, stale = 0; const details: any[] = [];
    let queueKeys: string[] = [];
    try { const { blobs } = await list({ prefix: QUEUE_PREFIX, limit: 1000 }); queueKeys = blobs.map((b) => b.pathname).filter((p) => p.endsWith(".json")); } catch {  }
    for (const key of queueKeys) {
      const lock = await acquireQueueLock(key);
      if (!lock) { locked++; continue; }
      try {
        const items = await readQueue(key);
        if (!items.length) continue;
        let changed = false;
        const claimed: QueueItem[] = [];
        const claimIso = new Date().toISOString();
        for (const it of items) {
          if (isStaleInflight(it, now)) {
            it.status = "failed"; it.error = "stale_publishing_manual_review"; stale++; failed++; changed = true;
            details.push({ tenantId: it.tenantId, platform: it.platform, status: it.status, error: it.error });
            continue;
          }
          if (it.status !== "scheduled") continue;
          if (!it.scheduledAt || Date.parse(it.scheduledAt) > now) continue;                      
          processed++;
          it.status = "publishing"; it.processingAt = claimIso; it.lastAttemptAt = claimIso; it.attempts = Number(it.attempts || 0) + 1; changed = true; claimed.push(it);
        }
        if (changed) await writeQueue(key, items);
        for (const it of claimed) {
          const out = await publishItem(host, it);
          const live = items.find((x) => x.id === it.id) || it;
          if (out.ok) { live.status = "published"; live.result = out.result; live.publishedAt = new Date().toISOString(); delete live.error; published++; }
          else { live.status = "failed"; live.error = out.error; failed++; }
          details.push({ tenantId: live.tenantId, platform: live.platform, status: live.status, error: live.error || null });
          await writeQueue(key, items);
        }
      } finally {
        await lock.release();
      }
    }
    return res.status(200).json({ ok: true, processed, published, failed, locked, stale, details });
  }

                                           
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  if (req.method === "GET") {
    const tenantId = safeTenant(tenantParam);
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const items = await readQueue(`${QUEUE_PREFIX}${tenantId}.json`);
    return res.status(200).json({ ok: true, items });
  }

  if (req.method === "POST") {
    const b = (req.body || {}) as any;
    const tenantId = safeTenant(String(b.tenantId || ""));
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const incoming: any[] = Array.isArray(b.items) ? b.items : (b.item ? [b.item] : []);
    if (!incoming.length) return res.status(400).json({ error: "no_items" });
    const key = `${QUEUE_PREFIX}${tenantId}.json`;
    const items = await readQueue(key);
    const nowIso = new Date().toISOString();
    const added: QueueItem[] = [];
    for (const raw of incoming) {
      const platform = String(raw.platform || "") as Platform;
      if (!["facebook", "instagram", "linkedin"].includes(platform)) continue;
      const item: QueueItem = {
        id: String(raw.id || `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        tenantId, platform,
        target: raw.target || (platform === "instagram" ? "instagram" : platform === "facebook" ? "facebook" : undefined),
        caption: raw.caption != null ? String(raw.caption) : undefined,
        message: raw.message != null ? String(raw.message) : undefined,
        link: raw.link != null ? String(raw.link) : undefined,
        imageUrl: raw.imageUrl != null ? String(raw.imageUrl) : undefined,
        orgUrn: raw.orgUrn != null ? String(raw.orgUrn) : undefined,
        scheduledAt: String(raw.scheduledAt || nowIso),
        status: "scheduled",
        placement: (["feed", "reels", "story"].includes(String(raw.placement)) ? raw.placement : undefined),
        createdAt: nowIso,
      };
                                                        
      const ix = items.findIndex((x) => x.id === item.id);
      if (ix >= 0) items[ix] = { ...items[ix], ...item }; else items.push(item);
      added.push(item);
    }
                                                  
    const trimmed = items.slice(-200);
    await writeQueue(key, trimmed);
    return res.status(200).json({ ok: true, added, total: trimmed.length });
  }

  if (req.method === "DELETE") {
    const tenantId = safeTenant(String(Array.isArray(req.query.tenantId) ? req.query.tenantId[0] : req.query.tenantId || ""));
    const id = String(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id || "");
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const key = `${QUEUE_PREFIX}${tenantId}.json`;
    const items = await readQueue(key);
    if (!id) { await writeQueue(key, []); return res.status(200).json({ ok: true, cleared: true }); }
    const next = items.filter((x) => x.id !== id);
    await writeQueue(key, next);
    return res.status(200).json({ ok: true, removed: items.length - next.length, total: next.length });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}
