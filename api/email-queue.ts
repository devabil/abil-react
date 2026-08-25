/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                        
                                                                                                     
                                                                                                       
                                                                                                         
  
                                                                                                                         
                                                              
                                                         
                                                               
                                                           
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";

function igualSeguro(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
}

export const config = { runtime: "nodejs", maxDuration: 60 };
                                                                                                   
                                                                                                    
                                                                                               
const MAX_PER_DRAIN = Number(process.env.EMAIL_MAX_PER_DRAIN || 8);
const PACING_MS = Number(process.env.EMAIL_PACING_MS || 4000);
const QUEUE_PREFIX = "email/queue/";
const LOCK_PREFIX = "email/queue-lock/";
                                                                                                              
                                                                                        
const DEDUPE_PREFIX = "email/dedupe/";
const DEDUPE_TTL_MS = Number(process.env.EMAIL_DEDUPE_TTL_MS || 5 * 24 * 60 * 60 * 1000);
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ADMIN = process.env.META_ADMIN_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const DEFAULT_FROM = process.env.RESEND_FROM || "ABiL <onboarding@resend.dev>";
const LOCK_TTL_MS = Number(process.env.QUEUE_LOCK_TTL_MS || 5 * 60 * 1000);
const INFLIGHT_TTL_MS = Number(process.env.QUEUE_INFLIGHT_TTL_MS || 30 * 60 * 1000);
                                                                                                            
                                                                                                                           
const THREADS_PREFIX = "crm/threads/";
                                                                                                           
                                                                                 
async function readThreadMerged(key: string): Promise<any[]> {
  const sources: any[][] = [];
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) sources.push(await r.json()); } catch {  } }
  try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (bl) { const r = await fetch(`${bl.url}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) sources.push(await r.json()); } } catch {  }
  const seen = new Set<string>(); const out: any[] = [];
  const idOf = (m: any) => String(m?.msgId || `${m?.dir}|${m?.at}|${String(m?.body || "").slice(0, 48)}`);
  for (const a of sources) { if (!Array.isArray(a)) continue; for (const m of a) { if (!m) continue; const id = idOf(m); if (seen.has(id)) continue; seen.add(id); out.push(m); } }
  out.sort((a, b) => String(a?.at || "").localeCompare(String(b?.at || "")));
  return out;
}
async function appendThreadOut(leadId: string, msg: any): Promise<void> {
  if (!leadId) return;
  const key = `${THREADS_PREFIX}${leadId}.json`;
  try {
    const arr = await readThreadMerged(key);
    if (msg.msgId && arr.some((m) => m && m.msgId === msg.msgId)) return;
    arr.push(msg);
    await put(key, JSON.stringify(arr.slice(-120)), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
  } catch {  }
}
function htmlToText(h: string): string { return String(h || "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, 4000); }

interface EItem { id: string; tenantId: string; to: string; subject: string; html: string; fromName?: string; fromEmail?: string; scheduledAt: string; status: "scheduled" | "sending" | "sent" | "failed"; error?: string; createdAt: string; sentAt?: string; processingAt?: string; lastAttemptAt?: string; attempts?: number; leadId?: string; empresa?: string; segmento?: string; auditSlug?: string; dedupeKey?: string }
                                                                                                                 
                                                                                                     
const CONTACTED_PREFIX = "email/contacted/";

function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
function emailOk(e: string): boolean { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || "")); }

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && igualSeguro(mkv, ADMIN)) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}
function cronAuthed(req: VercelRequest): boolean { if (authed(req)) return true; if (!CRON_SECRET) return false; const a = req.headers["authorization"]; const av = Array.isArray(a) ? a[0] : a; return !!av && av === `Bearer ${CRON_SECRET}`; }
function hasCronBearer(req: VercelRequest): boolean { if (!CRON_SECRET) return false; const a = req.headers["authorization"]; const av = Array.isArray(a) ? a[0] : a; return !!av && av === `Bearer ${CRON_SECRET}`; }

async function readQueue(key: string): Promise<EItem[]> {
  let txt: string | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); else if (r.status === 404) txt = null; } catch {  } }
  if (txt === null) { try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } } catch {  } }
  if (!txt) return [];
  try { const j = JSON.parse(txt); return Array.isArray(j) ? j : []; } catch { return []; }
}
async function writeQueue(key: string, items: EItem[]): Promise<void> { await put(key, JSON.stringify(items), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }

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

                                                                                                          
                                                                                                          
                                                                                                         
                                                                            
const SUPPRESS_KEY = "prospecting/abil/suppress.json";
function suppressedTo(email: string, sup: any): boolean {
  const e = String(email || "").trim().toLowerCase();
  if (!e || e.indexOf("@") < 0) return false;
  const ems = Array.isArray(sup?.emails) ? sup.emails.map((x: string) => String(x).toLowerCase().trim()) : [];
  if (ems.includes(e)) return true;
  const dom = e.split("@")[1] || "";
  const doms = Array.isArray(sup?.domains) ? sup.domains.map((d: string) => String(d).toLowerCase().replace(/^@/, "").trim()).filter(Boolean) : [];
  return doms.some((d: string) => dom === d || dom.endsWith("." + d));
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

                                                                                                                                                                                        
function dayFromIso(iso?: string): string {
  const t = iso ? Date.parse(iso) : NaN;
  return (Number.isFinite(t) ? new Date(t) : new Date()).toISOString().slice(0, 10);
}
                                                                                                           
                                                                                                  
function dedupeKeyOf(it: EItem): string {
  const explicit = it.dedupeKey ? String(it.dedupeKey).trim() : "";
  if (explicit) return explicit.slice(0, 200);
  const who = String(it.leadId || it.to || "").trim().toLowerCase();
  const subjHash = crypto.createHash("sha1").update(String(it.subject || "")).digest("hex").slice(0, 12);
  return `${who}:${subjHash}:${dayFromIso(it.scheduledAt)}`;
}
function pruneDedupe(map: Record<string, number>, now: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(map || {})) { const n = Number(v); if (Number.isFinite(n) && now - n <= DEDUPE_TTL_MS) out[k] = n; }
  return out;
}
async function readDedupe(tenantId: string): Promise<Record<string, number>> {
  return (await readJson<Record<string, number>>(`${DEDUPE_PREFIX}${safeTenant(tenantId)}.json`)) || {};
}
                                                                                                               
                                                                                                               
                                                                                      
async function acquireEnqueueLock(queueKey: string): Promise<{ release: () => Promise<void> } | null> {
  for (let i = 0; i < 12; i++) { const l = await acquireQueueLock(queueKey); if (l) return l; await new Promise((r) => setTimeout(r, 400 + i * 200)); }
  return null;
}

function isStaleInflight(item: EItem, now: number): boolean {
  if (item.status !== "sending") return false;
  const t = Date.parse(String(item.processingAt || item.lastAttemptAt || ""));
  return !Number.isFinite(t) || now - t > INFLIGHT_TTL_MS;
}

                                                                                                       
async function sendEmail(item: EItem, resendKey: string, defFrom: string): Promise<{ ok: boolean; error?: string }> {
  if (!resendKey) return { ok: false, error: "sender_not_configured" };
  const from = item.fromEmail && emailOk(item.fromEmail) ? `${item.fromName || ""} <${item.fromEmail}>`.trim() : defFrom;
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [item.to], subject: item.subject, html: item.html }) });
    const j: any = await r.json().catch(() => ({}));
    return r.ok ? { ok: true } : { ok: false, error: (j && (j.message || j.name)) || `http_${r.status}` };
  } catch (e) { return { ok: false, error: String(e) }; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization, x-resend-key, x-resend-from");
  if (req.method === "OPTIONS") return res.status(204).end();
                                                                                                     
                                                                                     
  const hdr = (n: string) => { const v = req.headers[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); };
  const resendKey = RESEND_API_KEY || hdr("x-resend-key");
  const resendFrom = hdr("x-resend-from") || DEFAULT_FROM;
  const action = String((Array.isArray(req.query.action) ? req.query.action[0] : req.query.action) || "");
  const tenantParam = String((Array.isArray(req.query.tenantId) ? req.query.tenantId[0] : req.query.tenantId) || "");
  const shouldDrain = action === "drain" || (!action && req.method === "GET" && !tenantParam && hasCronBearer(req));

  if (shouldDrain) {
    if (!cronAuthed(req)) return res.status(401).json({ error: "unauthorized" });
    const now = Date.now(); let processed = 0, sent = 0, failed = 0, locked = 0, stale = 0, suprimidos = 0; const details: any[] = []; const contactedSent: EItem[] = [];
    const sup = (await readJson<any>(SUPPRESS_KEY)) || { emails: [], domains: [] };
    let keys: string[] = []; try { const { blobs } = await list({ prefix: QUEUE_PREFIX, limit: 1000 }); keys = blobs.map((b) => b.pathname).filter((p) => p.endsWith(".json")); } catch {  }
    let remaining = MAX_PER_DRAIN;
    for (const key of keys) {
      if (remaining <= 0) break;                                                                                  
      const lock = await acquireQueueLock(key);
      if (!lock) { locked++; continue; }
      try {
        const items = await readQueue(key); if (!items.length) continue; let changed = false;
        const claimed: EItem[] = [];
        const claimIso = new Date().toISOString();
        for (const it of items) {
          if (isStaleInflight(it, now)) {
            it.status = "failed"; it.error = "stale_sending_manual_review"; stale++; failed++; changed = true;
            details.push({ tenantId: it.tenantId, to: it.to, status: it.status, error: it.error });
            continue;
          }
          if (it.status !== "scheduled") continue; if (!it.scheduledAt || Date.parse(it.scheduledAt) > now) continue;
          if (claimed.length >= remaining) continue;                                                         
          processed++; it.status = "sending"; it.processingAt = claimIso; it.lastAttemptAt = claimIso; it.attempts = Number(it.attempts || 0) + 1; changed = true; claimed.push(it);
        }
        if (changed) await writeQueue(key, items);
        for (let ci = 0; ci < claimed.length; ci++) {
          const it = claimed[ci];
                                                                                                         
          if (suppressedTo(it.to, sup)) {
            const liveB = items.find((x) => x.id === it.id) || it;
            liveB.status = "failed"; liveB.error = "bloqueado_lista_bloqueados"; suprimidos++; failed++;
            details.push({ tenantId: liveB.tenantId, to: liveB.to, status: liveB.status, error: liveB.error });
            await writeQueue(key, items);
            remaining--;
            continue;
          }
          const out = await sendEmail(it, resendKey, resendFrom);
          const live = items.find((x) => x.id === it.id) || it;
          if (out.ok) { live.status = "sent"; live.sentAt = new Date().toISOString(); delete live.error; sent++; contactedSent.push(live); if (live.leadId) await appendThreadOut(String(live.leadId), { dir: "out", at: live.sentAt, to: live.to, subject: live.subject, body: htmlToText(live.html), via: "resend" }); }
          else { live.status = "failed"; live.error = out.error; failed++; }
          details.push({ tenantId: live.tenantId, to: live.to, status: live.status, error: live.error || null });
          await writeQueue(key, items);
          remaining--;
          if (remaining > 0 && ci < claimed.length - 1) await new Promise((r) => setTimeout(r, PACING_MS));                                                 
        }
      } finally {
        await lock.release();
      }
    }
                                                                                                                 
                                                                                                                  
                                                                                                                    
    if (contactedSent.length) {
      const byT = new Map<string, EItem[]>();
      for (const it of contactedSent) { const a = byT.get(it.tenantId) || []; a.push(it); byT.set(it.tenantId, a); }
      for (const [tid, arr] of byT) {
        try {
          const ckey = `${CONTACTED_PREFIX}${safeTenant(tid)}.json`;
          let map: Record<string, any> = (await readJson<Record<string, any>>(ckey)) || {};
          for (const it of arr) { const em = String(it.to || "").trim().toLowerCase(); if (!em) continue; map[em] = { to: it.to, leadId: it.leadId || null, empresa: it.empresa || null, segmento: it.segmento || null, auditSlug: it.auditSlug || null, subject: it.subject || "", sentAt: it.sentAt || new Date().toISOString() }; }
          const ents = Object.entries(map); if (ents.length > 3000) map = Object.fromEntries(ents.slice(-3000));
          await put(ckey, JSON.stringify(map), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
        } catch {  }
                                                                                                                   
        try {
          const dkey = `${DEDUPE_PREFIX}${safeTenant(tid)}.json`;
          let dmap = pruneDedupe((await readJson<Record<string, number>>(dkey)) || {}, now);
          for (const it of arr) { if (it.dedupeKey) dmap[it.dedupeKey] = Date.now(); }
          const de = Object.entries(dmap); if (de.length > 5000) dmap = Object.fromEntries(de.slice(-5000));
          await put(dkey, JSON.stringify(dmap), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
        } catch {  }
      }
    }
    return res.status(200).json({ ok: true, processed, sent, failed, locked, stale, suprimidos, senderConfigured: !!resendKey, details });
  }

  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  if (req.method === "GET") {
    const tenantId = safeTenant(tenantParam);
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    if (action === "contacted") { const map = (await readJson<Record<string, any>>(`${CONTACTED_PREFIX}${tenantId}.json`)) || {}; res.setHeader("Cache-Control", "no-store"); return res.status(200).json({ ok: true, contacted: map, count: Object.keys(map).length }); }
    return res.status(200).json({ ok: true, items: await readQueue(`${QUEUE_PREFIX}${tenantId}.json`), senderConfigured: !!resendKey });
  }
  if (req.method === "POST") {
    const b = (req.body || {}) as any; const tenantId = safeTenant(String(b.tenantId || ""));
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const incoming: any[] = Array.isArray(b.items) ? b.items : (b.item ? [b.item] : []);
    if (!incoming.length) return res.status(400).json({ error: "no_items" });
    const key = `${QUEUE_PREFIX}${tenantId}.json`; const nowMs = Date.now();
                                                                                                              
                                                                                                     
    const lock = await acquireEnqueueLock(key);
    try {
      const items = await readQueue(key); const nowIso = new Date(nowMs).toISOString();
      const dedupe = pruneDedupe(await readDedupe(tenantId), nowMs);
      const liveKeys = new Set<string>(); for (const x of items) { if (x && x.status !== "failed" && x.dedupeKey) liveKeys.add(x.dedupeKey); }
      const added: EItem[] = []; const skipped: any[] = [];
      for (const raw of incoming) {
        if (!emailOk(raw.to) || !raw.subject || !raw.html) continue;
        const item: EItem = { id: String(raw.id || `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`), tenantId, to: String(raw.to), subject: String(raw.subject).slice(0, 300), html: String(raw.html), fromName: raw.fromName ? String(raw.fromName) : undefined, fromEmail: raw.fromEmail ? String(raw.fromEmail) : undefined, scheduledAt: String(raw.scheduledAt || nowIso), status: "scheduled", createdAt: nowIso, leadId: raw.leadId ? String(raw.leadId) : undefined, empresa: raw.empresa ? String(raw.empresa).slice(0, 140) : undefined, segmento: raw.segmento ? String(raw.segmento).slice(0, 60) : undefined, auditSlug: raw.auditSlug ? String(raw.auditSlug).slice(0, 160) : undefined, dedupeKey: raw.dedupeKey ? String(raw.dedupeKey).slice(0, 200) : undefined };
        const dk = dedupeKeyOf(item); item.dedupeKey = dk;
                                                                                                                         
        if (dk && (liveKeys.has(dk) || dedupe[dk])) { skipped.push({ to: item.to, dedupeKey: dk }); continue; }
        const ix = items.findIndex((x) => x.id === item.id); if (ix >= 0) items[ix] = { ...items[ix], ...item }; else items.push(item);
        if (dk) liveKeys.add(dk); added.push(item);
      }
      if (!added.length) {
                                                                                                                                                            
        if (skipped.length) return res.status(200).json({ ok: true, added: [], skipped, total: Math.min(items.length, 500), dedup: true, senderConfigured: !!resendKey });
        return res.status(400).json({ error: "no_valid_items", hint: "cada item exige to válido + subject + html" });
      }
      await writeQueue(key, items.slice(-500));
      return res.status(200).json({ ok: true, added, skipped, total: Math.min(items.length, 500), senderConfigured: !!resendKey });
    } finally { if (lock) await lock.release(); }
  }
  if (req.method === "DELETE") {
    const tenantId = safeTenant(String(Array.isArray(req.query.tenantId) ? req.query.tenantId[0] : req.query.tenantId || "")); const id = String(Array.isArray(req.query.id) ? req.query.id[0] : req.query.id || "");
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const key = `${QUEUE_PREFIX}${tenantId}.json`; const items = await readQueue(key);
    if (!id) { await writeQueue(key, []); return res.status(200).json({ ok: true, cleared: true }); }
    const next = items.filter((x) => x.id !== id); await writeQueue(key, next);
    return res.status(200).json({ ok: true, removed: items.length - next.length });
  }
  return res.status(405).json({ error: "method_not_allowed" });
}
