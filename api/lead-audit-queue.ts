/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                         
                                                                                                             
                                                                                                            
                                                                                                         
  
                                                                                                                  
                                                                                                                   
                                                                                                           
                                                                             
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";
                                                                                                                     
                                                                             
import { precisaLpProfunda } from "../src/lib/leadSegments.js";

export const config = { runtime: "nodejs", maxDuration: 300 };
const QUEUE_PREFIX = "leadaudit/queue/";
const LOCK_PREFIX = "leadaudit/lock/";
const BUDGET_PREFIX = "leadaudit/budget/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const META_ADMIN = process.env.META_ADMIN_KEY || "";
const ABIL_ADMIN = process.env.ABIL_ADMIN_AUTH_SECRET || "";
const CRON_SECRET = process.env.CRON_SECRET || "";
                                                                                                            
                                                                                                           
                                                                                                       
const BASE = (process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app").replace(/\/$/, "");
const LOCK_TTL_MS = Number(process.env.QUEUE_LOCK_TTL_MS || 5 * 60 * 1000);
const INFLIGHT_TTL_MS = Number(process.env.QUEUE_INFLIGHT_TTL_MS || 30 * 60 * 1000);
const MAX_ITEMS_PER_DRAIN = Number(process.env.LEADAUDIT_MAX_PER_DRAIN || 6);                                                   
const MAX_CONCURRENT = Number(process.env.LEADAUDIT_MAX_CONCURRENT || 2);                                      
const MAX_ATTEMPTS = Number(process.env.LEADAUDIT_MAX_ATTEMPTS || 3);                                             
const DAILY_CAP = Number(process.env.DAILY_LEAD_AUDIT_CAP || 500);                                                                         
const CIRCUIT_BREAK = Number(process.env.LEADAUDIT_CIRCUIT_BREAK || 3);                                                     

type Status = "scheduled" | "running" | "done" | "partial" | "failed";
                                                                                                                  
                                                                                                                        
                                                                                                                        
                                                                                               
interface LItem { id: string; tenantId: string; leadId: string; url?: string; placeId?: string; company?: string; status: Status; attempts?: number; error?: string; reason?: string; mode?: string; preenchidos?: number; total?: number; result?: any; layers?: string[]; scheduledAt: string; createdAt: string; processingAt?: string; lastAttemptAt?: string; doneAt?: string; origem?: string; lp?: boolean; lpAt?: string; lpNivel?: string; lpMotivo?: string; lpTentativas?: number }

function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
function hdrVal(req: VercelRequest, n: string): string { const v = req.headers[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function qVal(req: VercelRequest, n: string): string { const v = req.query[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function internalAuthHeaders(): Record<string, string> {
  if (ABIL_ADMIN) {
    const exp = Date.now() + 5 * 60 * 1000;
    const sig = crypto.createHmac("sha256", ABIL_ADMIN).update(String(exp)).digest("hex");
    return { "x-abil-admin": `${exp}.${sig}` };
  }
  return META_ADMIN ? { "x-meta-admin": META_ADMIN } : {};
}

function authed(req: VercelRequest): boolean {
  const mkv = hdrVal(req, "x-meta-admin");
  if (META_ADMIN && mkv && mkv === META_ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const tok = hdrVal(req, "x-abil-admin");
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}
function hasCronBearer(req: VercelRequest): boolean { if (!CRON_SECRET) return false; const a = hdrVal(req, "authorization"); return !!a && a === `Bearer ${CRON_SECRET}`; }
function cronAuthed(req: VercelRequest): boolean { return authed(req) || hasCronBearer(req); }

async function readText(key: string): Promise<string | null> {
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  } }
  try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.text() : null; } catch { return null; }
}
async function readJson<T>(key: string): Promise<T | null> { const txt = await readText(key); if (!txt) return null; try { return JSON.parse(txt) as T; } catch { return null; } }
async function readQueue(key: string): Promise<LItem[]> { const j = await readJson<LItem[]>(key); return Array.isArray(j) ? j : []; }
function _qMtime(it: any): number { for (const k of ["processingAt", "scheduledAt", "createdAt"]) { const t = Date.parse(String(it?.[k] || "")); if (Number.isFinite(t) && t > 0) return t; } return 0; }
                                                                                                           
                                                                                                          
                                                                                                            
                                                                                              
async function writeQueue(key: string, items: LItem[], opts?: { union?: boolean }): Promise<void> {
  let final = items;
  if (opts?.union !== false) {
    try {
      const cur = await readQueue(key);
      if (Array.isArray(cur) && cur.length) {
        const m = new Map<string, LItem>();
        for (const it of cur) if (it && it.id) m.set(it.id, it);
        for (const it of items) { if (!it || !it.id) continue; const old = m.get(it.id); if (!old || _qMtime(it) >= _qMtime(old)) m.set(it.id, it); }
        final = Array.from(m.values());
      }
    } catch {  }
  }
  await put(key, JSON.stringify(final.slice(-400)), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
}

function lockKeyFor(queueKey: string): string { return `${LOCK_PREFIX}${crypto.createHash("sha1").update(queueKey).digest("hex")}.json`; }
async function acquireQueueLock(queueKey: string): Promise<{ release: () => Promise<void> } | null> {
  const lockKey = lockKeyFor(queueKey); const now = Date.now();
  const owner = `${now}-${crypto.randomUUID()}`;
  const body = JSON.stringify({ owner, queueKey, createdAt: new Date(now).toISOString() });
  const release = async () => { const latest = await readJson<{ owner?: string }>(lockKey); if (latest?.owner === owner) await del(lockKey).catch(() => undefined); };
                                                                                                                                                    
  try { await put(lockKey, body, { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: false }); return { release }; }
  catch {
    const current = await readJson<{ createdAt?: string }>(lockKey);
    const age = current?.createdAt ? now - Date.parse(current.createdAt) : Infinity;
    if (!(Number.isFinite(age) && age > LOCK_TTL_MS)) return null;                                 
    try { await put(lockKey, body, { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); return { release }; } catch { return null; }                       
  }
}
function isStaleInflight(item: LItem, now: number): boolean { if (item.status !== "running") return false; const t = Date.parse(String(item.processingAt || item.lastAttemptAt || "")); return !Number.isFinite(t) || now - t > INFLIGHT_TTL_MS; }

                                                                        
function todayKey(): string { return `${BUDGET_PREFIX}${new Date().toISOString().slice(0, 10)}.json`; }
async function readBudget(): Promise<number> { const j = await readJson<{ count?: number }>(todayKey()); return Number(j?.count || 0); }
async function bumpBudget(n: number): Promise<void> { const c = await readBudget(); await put(todayKey(), JSON.stringify({ count: c + n, updatedAt: new Date().toISOString() }), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }

                                                    
                                                                                                             
                                                                                                            
                                                                                                               
                                                
const STOP_PREFIX = "leadaudit/stop/";
function stopKeyFor(tenantId: string): string { return `${STOP_PREFIX}${tenantId}.json`; }
function tenantFromQueueKey(key: string): string { return key.slice(QUEUE_PREFIX.length).replace(/\.json$/, ""); }
async function raiseStop(tenantId: string): Promise<void> { await put(stopKeyFor(tenantId), JSON.stringify({ at: new Date().toISOString() }), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
async function stopRequested(tenantId: string): Promise<boolean> { return !!(await readJson<{ at?: string }>(stopKeyFor(tenantId))); }
async function clearStop(tenantId: string): Promise<void> { try { await del(stopKeyFor(tenantId)); } catch {  } }

                                             
                                                                                                         
                                                                                                             
                                                                                             
const SMARTCFG_KEY = "prospecting/smartreply-config.json";
                                                                                                                   
                                                                                                             
                                                                                                              
const REPLY_SMARTCFG_KEY = "prospecting/abil/smartreply-config.json";
const CRM_LEADS_KEY = "crm/leads.json";
const SUPPRESS_KEY = "prospecting/abil/suppress.json";                                                                                                                      
const AUTODIAG_TENANT = "abil-autodiag";
                                                                                       
function normDomainSrv(u: string): string {
  let s = String(u || "").trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/^@/, "").replace(/^https?:\/\//, "").replace(/^\/\//, "").replace(/^www\./, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  return s.replace(/\.$/, "");
}
                                                                                                                 
function isSuppressedLeadSrv(email: string, website: string, supEmails: Set<string>, supDomains: string[]): boolean {
  const e = String(email || "").trim().toLowerCase();
  if (e && e.indexOf("@") > 0) {
    if (supEmails.has(e)) return true;
    const ed = e.split("@")[1] || "";
    if (ed && supDomains.some((d) => ed === d || ed.endsWith("." + d))) return true;
  }
  const wd = normDomainSrv(website);
  if (wd && supDomains.some((d) => wd === d || wd.endsWith("." + d))) return true;
  return false;
}
function selfAdminTok(): string { const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; if (!PW) return ""; const exp = Date.now() + 5 * 60 * 1000; const sig = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); return `${exp}.${sig}`; }
function autodiagCountKey(): string { return `leadaudit/autodiag-count/${new Date().toISOString().slice(0, 10)}.json`; }
async function readAutodiagCount(): Promise<number> { const j = await readJson<{ count?: number }>(autodiagCountKey()); return Number(j?.count || 0); }
async function bumpAutodiagCount(n: number): Promise<void> { const c = await readAutodiagCount(); await put(autodiagCountKey(), JSON.stringify({ count: c + n, updatedAt: new Date().toISOString() }), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
async function autoEnqueueDiag(): Promise<{ enqueued: number; skipped?: string; suprimidos?: number }> {
  const smart: any = (await readJson<any>(SMARTCFG_KEY)) || {};
  if (!smart.autoDiagEnabled) return { enqueued: 0, skipped: "autodiag_disabled" };
                                                                                                                 
  const cap = Math.max(1, Math.min(1000, Number(smart.autoDiagDailyCap) || 40));
  const already = await readAutodiagCount();
  if (already >= cap) return { enqueued: 0, skipped: "teto_diario" };
  const cloud: any = await readJson<any>(CRM_LEADS_KEY);
  const leads: any[] = Array.isArray(cloud) ? cloud : (cloud?.leads || []);
                                                                                                                
                                                                                                                   
  const sup: any = (await readJson<any>(SUPPRESS_KEY)) || {};
  const supEmails = new Set((Array.isArray(sup?.emails) ? sup.emails : []).map((x: string) => String(x).trim().toLowerCase()).filter(Boolean));
  const supDomains = (Array.isArray(sup?.domains) ? sup.domains : []).map((d: string) => normDomainSrv(String(d))).filter(Boolean);
  let suprimidos = 0;
  const freshMs = 30 * 24 * 3600 * 1000; const now = Date.now();
  const needs = leads.filter((l) => {
    if (!l) return false;
    const hasTarget = String(l.website || "").trim() || String(l.placeId || "").trim();
    if (!hasTarget) return false;
    const at = l.audit?.at ? Date.parse(l.audit.at) : 0;
    if (at && (now - at) <= freshMs) return false;
    if (isSuppressedLeadSrv(l.email, l.website, supEmails as Set<string>, supDomains)) { suprimidos++; return false; }                     
    return true;
  }).slice(0, cap - already);
  if (!needs.length) return { enqueued: 0, skipped: "nada_elegivel", suprimidos };
  const key = `${QUEUE_PREFIX}${AUTODIAG_TENANT}.json`;
  const lock = await acquireQueueLock(key);
  if (!lock) return { enqueued: 0, skipped: "fila_ocupada" };
  try {
    const items = await readQueue(key); const nowIso = new Date().toISOString(); let added = 0;
    for (const l of needs) {
      const leadId = String(l.id || "").slice(0, 64); if (!leadId) continue;
      const url = String(l.website || "").slice(0, 400); const placeId = String(l.placeId || "").slice(0, 300);
      if (!url && !placeId) continue;
      const id = `la-${leadId}`; const ix = items.findIndex((x) => x.id === id);
      if (ix >= 0 && (items[ix].status === "done" || items[ix].status === "running" || items[ix].status === "partial")) continue;                                                                                     
                                                                                                             
                                                                                                                
                                                                                                             
                                                                                                             
                                                                                                               
      if (ix >= 0 && items[ix].lp) continue;
                                                                                                                     
                                                                                                               
                                                                                                             
                                                        
      const it: LItem = { id, tenantId: AUTODIAG_TENANT, leadId, url: url || undefined, placeId: placeId || undefined, company: String(l.entreprise || "").slice(0, 120), status: "scheduled", attempts: 0, scheduledAt: nowIso, createdAt: nowIso, origem: "frio" };
      if (ix >= 0) items[ix] = { ...items[ix], ...it, attempts: 0 }; else items.push(it);
      added++;
    }
    if (added) { await writeQueue(key, items.slice(-400)); await bumpAutodiagCount(added); }
    return { enqueued: added, suprimidos };
  } finally { await lock.release(); }
}
                                                                                               
                                                                                                               
                                                                                                               
                                                                                                            
                                                                                                                
                                                                                                           
                              
async function writeBackAudit(leadId: string, result: any, auto = true): Promise<void> {
  try {
    const d = result || {}; const ps = d.pagespeed || {}; const geo = d.geo || {}; const pl = d.place || {}; const noSite = d.mode === "nosite";
    const audit = {
      at: new Date().toISOString(), mode: d.mode || "site", semSite: noSite,
      perf: ps.ok ? ps.performance : null, seo: ps.ok ? ps.seo : null, a11y: ps.ok ? ps.accessibility : null, bestPractices: ps.ok ? ps.bestPractices : null, lcp: ps.lcp || null, cls: ps.cls || null,
      https: !!geo.https, aiBlocked: Array.isArray(geo.blocksAI) && geo.blocksAI.length > 0, hasSchema: !!geo.hasSchema, hasLlmsTxt: !!geo.hasLlmsTxt, hasSitemap: !!geo.hasSitemap, hasMetaDesc: !!geo.hasMetaDesc, hasOg: !!geo.hasOg,
      socials: Array.isArray(geo.socials) ? geo.socials : [], socialLinks: Array.isArray(geo.socialLinks) ? geo.socialLinks : [], hasBlog: !!geo.hasBlog, colorCount: geo.colorCount || 0, fontCount: geo.fontCount || 0, siteTitle: String(geo.title || ""), metaDescText: String(geo.metaDesc || ""),
      colors: Array.isArray(geo.colors) ? geo.colors : [], fonts: Array.isArray(geo.fonts) ? geo.fonts : [],
      logoUrl: geo.logoUrl || "", logoKind: geo.logoKind || "", hasLogo: !!geo.hasLogo, hasInlineSvgLogo: !!geo.hasInlineSvgLogo,
      googleRating: (pl.rating ?? null), googleReviews: (pl.reviewsCount ?? null), googleCategoria: String(pl.categoria || ""), reviewsUsed: pl.reviewsUsed || 0, reviewsSample: Array.isArray(pl.reviewsSample) ? pl.reviewsSample : [],
      visual: d.visual || undefined, brand: d.brand || undefined, briefing: d.briefing || undefined,
      ...(d.mobileShot ? { mobileShot: String(d.mobileShot).slice(0, 500) } : {}),
      ...(d.desktopShot ? { desktopShot: String(d.desktopShot).slice(0, 500) } : {}),
      ...(d.socialStats ? { socialStats: d.socialStats } : {}),
      headline: String(d.summary?.headline || ""), findings: Array.isArray(d.summary?.findings) ? d.summary.findings.slice(0, 8) : [],
      autoDiagnosed: auto,
      partial: !!d.partial, layersSkipped: Array.isArray(d.layersSkipped) ? d.layersSkipped : [],
    };
    const tok = selfAdminTok(); if (!tok) return;
    await fetch(`${BASE}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, audit }] }) }).catch(() => undefined);
                                                                                                                  
    try { const lay = await autodiagLayers(); if (lay.studyOn) { await fetch(`${BASE}/api/lead-audit?action=lead-study`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leadId, audit }) }).catch(() => undefined); } } catch {  }






  } catch {  }
}

                                                                                                             
function trimResult(d: any): any {
  if (!d) return null;
  const ps = d.pagespeed || {}; const geo = d.geo || {}; const pl = d.place || {};
  return {
    mode: d.mode || "site", url: d.url || "",
    pagespeed: { ok: !!ps.ok, performance: ps.performance ?? null, seo: ps.seo ?? null, accessibility: ps.accessibility ?? null, bestPractices: ps.bestPractices ?? null, lcp: ps.lcp || null, cls: ps.cls || null },
    geo: { https: !!geo.https, blocksAI: Array.isArray(geo.blocksAI) ? geo.blocksAI : [], hasSchema: !!geo.hasSchema, hasLlmsTxt: !!geo.hasLlmsTxt, hasSitemap: !!geo.hasSitemap, hasMetaDesc: !!geo.hasMetaDesc, hasOg: !!geo.hasOg, socials: Array.isArray(geo.socials) ? geo.socials : [], socialLinks: Array.isArray(geo.socialLinks) ? geo.socialLinks : [], hasBlog: !!geo.hasBlog, colorCount: geo.colorCount || 0, fontCount: geo.fontCount || 0, title: geo.title || "", metaDesc: geo.metaDesc || "", colors: Array.isArray(geo.colors) ? geo.colors : [], fonts: Array.isArray(geo.fonts) ? geo.fonts : [], logoUrl: geo.logoUrl || "", logoKind: geo.logoKind || "", hasLogo: !!geo.hasLogo, hasInlineSvgLogo: !!geo.hasInlineSvgLogo },
    place: pl ? { rating: pl.rating ?? null, reviewsCount: pl.reviewsCount ?? null, categoria: pl.categoria || "", reviewsUsed: pl.reviewsUsed || 0, reviewsSample: Array.isArray(pl.reviewsSample) ? pl.reviewsSample : [] } : null,
    visual: d.visual || null, brand: d.brand || null, briefing: d.briefing || null, summary: d.summary || null,
    mobileShot: d.mobileShot || null, desktopShot: d.desktopShot || null,
    socialStats: d.socialStats || null,
    partial: !!d.partial, layersSkipped: Array.isArray(d.layersSkipped) ? d.layersSkipped : [],
  };
}

                                                 
                                                                                                            
const ALL_DIAG_LAYERS = ["speed", "visual", "brand", "briefing", "google", "interior"];
function geoHasSignal(g: any): boolean { return !!g && (String(g.title || "").length > 0 || Number(g.colorCount || 0) > 0 || !!g.https || (Array.isArray(g.socials) && g.socials.length > 0) || (Array.isArray(g.socialLinks) && g.socialLinks.length > 0)); }
function placeHasSignal(p: any): boolean { return !!p && (p.rating != null || p.reviewsCount != null || (p.categoria && String(p.categoria).length > 0)); }
                                                                                                                     
function neededLayersOf(r: any, hasPlaceId: boolean): string[] {
  if (!r) return ALL_DIAG_LAYERS.slice();
  const need: string[] = [];
  if (!(r.pagespeed && r.pagespeed.ok)) need.push("speed");
  if (!r.visual) need.push("visual");
  if (!r.brand) need.push("brand");
  const br = r.briefing; if (!br || Number(br.preenchidos || 0) < 3) need.push("briefing");
  if (hasPlaceId && !placeHasSignal(r.place)) { need.push("google"); need.push("interior"); }
  return need.length ? need : ALL_DIAG_LAYERS.slice();
}
                                                                                                           
                                                                                                                  
function mergeTrimmed(prior: any, fresh: any): any {
  if (!prior) return fresh; if (!fresh) return prior;
  const out: any = { ...prior };
  out.mode = fresh.mode || prior.mode || "site";
  out.url = fresh.url || prior.url || "";
  out.pagespeed = (fresh.pagespeed && fresh.pagespeed.ok) ? fresh.pagespeed : (prior.pagespeed || fresh.pagespeed);                                              
  out.geo = geoHasSignal(fresh.geo) ? fresh.geo : (prior.geo || fresh.geo);                                                                                    
  out.place = placeHasSignal(fresh.place) ? fresh.place : (prior.place || fresh.place || null);
  out.visual = fresh.visual || prior.visual || null;
  out.brand = fresh.brand || prior.brand || null;
  const fb = fresh.briefing, pb = prior.briefing;                                                                                                                              
  out.briefing = !fb ? (pb || null) : (!pb ? fb : (Number(fb.preenchidos || 0) >= Number(pb.preenchidos || 0) ? fb : pb));
  out.summary = fresh.summary || prior.summary || null;
  out.socialStats = fresh.socialStats || prior.socialStats || null;                                                            
  out.partial = (fresh.partial === undefined ? prior.partial : fresh.partial) || false;
  out.layersSkipped = (Array.isArray(fresh.layersSkipped) && fresh.layersSkipped.length) ? fresh.layersSkipped : (Array.isArray(prior.layersSkipped) ? prior.layersSkipped : []);
  return out;
}

                                                                              
                                                                                                         
let _diagLayersMemo: { param: string; briefingOn: boolean; studyOn: boolean; skipped: string[] } | undefined;
async function autodiagLayers(): Promise<{ param: string; briefingOn: boolean; studyOn: boolean; skipped: string[] }> {
  if (_diagLayersMemo) return _diagLayersMemo;
  const TOG = ["speed", "visual", "brand", "briefing", "google", "interior"];
  const smart: any = (await readJson<any>(SMARTCFG_KEY)) || {};
  const dl = (smart.diagLayers && typeof smart.diagLayers === "object") ? smart.diagLayers : {};
  const on = (k: string) => dl[k] !== false;                   
  _diagLayersMemo = { param: TOG.filter(on).join(","), briefingOn: on("briefing"), studyOn: dl.study !== false, skipped: [...TOG.filter((k) => !on(k)), ...(dl.study === false ? ["study"] : [])] };
  return _diagLayersMemo;
}
                                                                                                        
async function runDiagnose(item: LItem): Promise<{ status: Status; reason?: string; result?: any; preenchidos?: number; total?: number; mode?: string; infraFail?: boolean }> {
  if (!BASE) return { status: "failed", reason: "no_base_url", infraFail: true };
  if (!item.url && !item.placeId) return { status: "failed", reason: "sem_url_e_sem_placeid" };
  const isAuto = item.tenantId === AUTODIAG_TENANT;
  const auto = isAuto ? await autodiagLayers() : null;                                                                
                                                                                                                 
                                                                                                        
                                                                                                           
                                                                                
  const prior = item.result || null;
  let gap: string[] | null = (Array.isArray(item.layers) && item.layers.length) ? item.layers.slice() : null;
  if (gap && auto && auto.param) { const allowed = new Set(auto.param.split(",")); gap = gap.filter((l) => allowed.has(l)); if (!gap.length) gap = null; }                                               
  const effectiveParam = gap ? gap.join(",") : (auto ? auto.param : "");
  const layersFiltered = !!(gap || (auto && auto.param));
  const briefingOn = layersFiltered ? effectiveParam.split(",").includes("briefing") : true;                                                  
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 150000);                                                           
  try {
    const qs = (item.url ? "url=" + encodeURIComponent(item.url) : "") + (item.placeId ? (item.url ? "&" : "") + "placeId=" + encodeURIComponent(item.placeId) : "") + "&company=" + encodeURIComponent(item.company || "") + (effectiveParam ? "&layers=" + encodeURIComponent(effectiveParam) : "") + "&cb=" + Date.now();
    const r = await fetch(`${BASE}/api/lead-audit?${qs}`, { headers: internalAuthHeaders(), cache: "no-store", signal: ctrl.signal });
    if (r.status === 429 || r.status >= 500) return { status: "failed", reason: `infra_${r.status}`, infraFail: true };
    if (r.status === 401) return { status: "failed", reason: "infra_auth", infraFail: true };
    const d = await r.json().catch(() => null);
    if (!d || !d.ok) return { status: "failed", reason: "no_data", infraFail: true };
    if (d.aiError) return { status: "failed", reason: "infra_ia", infraFail: true };                                                                         
    const fresh = trimResult(d);
    const merged = prior ? mergeTrimmed(prior, fresh) : fresh;                                                                                   
    const freshBriefing = fresh && fresh.briefing ? fresh.briefing : null;
    if (briefingOn && !freshBriefing && !(prior && prior.briefing)) return { status: "failed", reason: "briefing_nulo", infraFail: true };                                                                      
    const mb = merged && merged.briefing ? merged.briefing : null;                                                                                                  
    const preenchidos = mb ? Number(mb.preenchidos || 0) : 0; const total = mb ? Number(mb.total || 14) : 0;
    const status: Status = briefingOn ? (preenchidos >= 3 ? "done" : "partial") : "done";                                                                            
    return { status, result: merged, preenchidos, total, mode: d.mode || "site" };
  } catch (e: any) {
    const msg = String(e?.message || e);
    const infra = /abort|timeout|network|fetch failed|ECONN/i.test(msg);
    return { status: "failed", reason: infra ? "infra_timeout" : "exception", infraFail: infra };
  } finally { clearTimeout(to); }
}

                                                                                                                               
  
                                                                                                            
                                                                                                            
                                                                                                          
                                                                                    
  
                                                                                                    
                                                                                                             
                                                                                                          
                                                                                                       
                                                                                                        
  
                                                                                                                 
                                                                                                                
                                                                                                                   
                                                                                   
  
                                                                                                                 
                                                                                                                
                                                                                                                  
  
                                                        
                                                                                                                
                                                                                                          
                                                                                                                
                                                                        
const LP_POR_DRAIN = Number(process.env.LEADAUDIT_LP_PER_DRAIN || 2);                                             
const LP_CONCORRENTES = Number(process.env.LEADAUDIT_LP_CONCURRENT || 2);                                               
                                                                                
                                                                                                                   
                                                                                                                       
                                                                
                                                                                                                  
                                                                         
                                                                                                                    
                                                                                           
const LP_ARRANQUE_MAX_MS = 40000;                                                                                 
const LP_ESPERA_AUDIT_MS = 60000;                                                                                 
const LP_MAX_TENTATIVAS = 3;                                                                                                
const LP_CHAIN_TIMEOUT_MS = 125000;                                                                                  
                                                                                                                     

                                                                                                             
async function readReplyCfg(): Promise<{ autoPublishEnabled: boolean; deepAuto: boolean }> {
  const c: any = (await readJson<any>(REPLY_SMARTCFG_KEY)) || {};
  return { autoPublishEnabled: !!c.autoPublishEnabled, deepAuto: !!c.deepAuto };
}
async function postReplyScan(action: string, body: any, tok: string): Promise<any | null> {
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), LP_CHAIN_TIMEOUT_MS);
  try {
    const r = await fetch(`${BASE}/api/reply-scan?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify(body), signal: ctrl.signal });
    return await r.json().catch(() => null);
  } catch { return null; } finally { clearTimeout(to); }
}
                                                                                                            
                                                                 
async function lpChain(item: LItem, cfg: { deepAuto: boolean }): Promise<{ carimbar: boolean; nivel: string; motivo: string; url: string }> {
  const tok = selfAdminTok(); if (!tok) return { carimbar: false, nivel: "", motivo: "sem_admin", url: "" };
  const leadId = String(item.leadId);
                                                                                                                    
                                                                                                
  let deepStudy: any = null; let motivoDeep = "";
  if (!cfg.deepAuto) motivoDeep = "deep_auto_desligado";                                                          
  else {
    const d = await postReplyScan("deep-research", { leadId, viaFila: true }, tok);
    if (d && d.ok && d.deepStudy) deepStudy = d.deepStudy;
    else motivoDeep = String(d?.error || "raio_x_sem_resposta");
  }
                                                                                                                 
                                                                                                            
  const g = await postReplyScan("gen-audit-copy", { leadId, deepStudy }, tok);
  if (!g) return { carimbar: false, nivel: "", motivo: "gen_sem_resposta", url: "" };
  if (g.ok && g.url) return { carimbar: true, nivel: String(g.nivel || "raso"), motivo: motivoDeep, url: String(g.url) };
                                                                                                                    
                                                                                                             
  if (g.ok && g.held) return { carimbar: String(g.reason || "") !== "budget", nivel: "", motivo: String(g.reason || "held"), url: "" };
  return { carimbar: false, nivel: "", motivo: String(g.error || "publish_falhou"), url: "" };
}
                                                                                                                    
                                                                                                                   
                                                                                                                
                                                                                                                     
                                                                                                           
                                                                                                                
                                                                                                       
                                                                                                               
                                                   
function reconciliarLpDasRespostas(items: LItem[], leads: any[], supEmails: Set<string>, supDomains: string[]): number {
  const nowIso = new Date().toISOString(); let marcados = 0;
  for (const l of leads) {
    if (!l || !l.id) continue;
                                                                                                              
    if (l.replied !== true || String(l.replyClass || "") !== "positiva") continue;
    if (String(l.lifecycle || "active") !== "active") continue;
    if (!precisaLpProfunda(l)) continue;                                                                        
    const url = String(l.website || "").slice(0, 400); const placeId = String(l.placeId || "").slice(0, 300);
    if (!url && !placeId) continue;                                                                              
    if (isSuppressedLeadSrv(l.email, l.website, supEmails, supDomains)) continue;                                 
    const id = `la-${String(l.id).slice(0, 64)}`;
    const ix = items.findIndex((x) => x.id === id);
    if (ix >= 0) {
      const cur = items[ix];
      if (cur.lpAt || cur.lp) continue;                                                                    
      items[ix] = { ...cur, lp: true, origem: cur.origem || "resposta-positiva" };
    } else {
      items.push({ id, tenantId: AUTODIAG_TENANT, leadId: String(l.id).slice(0, 64), url: url || undefined, placeId: placeId || undefined, company: String(l.entreprise || l.nom || "").slice(0, 120), status: "scheduled", attempts: 0, scheduledAt: nowIso, createdAt: nowIso, lp: true, origem: "resposta-positiva" });
    }
    marcados++;
  }
  return marcados;
}
                                                                                                                
                                                                                                                  
                                                       
                                                                                                                   
                                                                                                            
                                                                                                               
                                                                                                                  
async function lpPass(t0: number): Promise<{ vistos: number; publicados: number; profundos: number; rasos: number; adiados: number; reconciliados: number; motivo: string }> {
  const out = { vistos: 0, publicados: 0, profundos: 0, rasos: 0, adiados: 0, reconciliados: 0, motivo: "" };
  const cfg = await readReplyCfg();
                                                                                                                      
                                                                                  
  if (!cfg.autoPublishEnabled) { out.motivo = "autopublish_desligado"; return out; }
  if (Date.now() - t0 > LP_ARRANQUE_MAX_MS) { out.motivo = "sem_tempo_nesta_corrida"; return out; }
                                                                                                                     
  const key = `${QUEUE_PREFIX}${AUTODIAG_TENANT}.json`;
  const lock = await acquireQueueLock(key);
  if (!lock) { out.motivo = "fila_ocupada"; return out; }
  try {
    const items = await readQueue(key);
                                                                                                                    
                                                                                                               
    const byLead = new Map<string, any>();
    try {
      const cloud: any = await readJson<any>(CRM_LEADS_KEY);
      const leads: any[] = Array.isArray(cloud) ? cloud : (cloud?.leads || []);
      if (leads.length) {
        for (const l of leads) if (l && l.id) byLead.set(String(l.id), l);
        const sup: any = (await readJson<any>(SUPPRESS_KEY)) || {};
        const supEmails = new Set((Array.isArray(sup?.emails) ? sup.emails : []).map((x: string) => String(x).trim().toLowerCase()).filter(Boolean));
        const supDomains = (Array.isArray(sup?.domains) ? sup.domains : []).map((d: string) => normDomainSrv(String(d))).filter(Boolean);
        out.reconciliados = reconciliarLpDasRespostas(items, leads, supEmails as Set<string>, supDomains);
        if (out.reconciliados) await writeQueue(key, items.slice(-400));
      }
    } catch {  }
    const agora = Date.now();
    const cands = items.filter((it) => it && it.lp === true && !it.lpAt && Number(it.lpTentativas || 0) < LP_MAX_TENTATIVAS
      && (it.status === "done" || it.status === "partial")
                                                                                                                    
                                                                                                                   
      && (!it.doneAt || agora - (Date.parse(it.doneAt) || 0) > LP_ESPERA_AUDIT_MS));
    if (!cands.length) { out.motivo = "nada_por_publicar"; return out; }
                                                                                                                     
                                                                                                                      
                                                                                                                 
                                                                                            
    for (const it of cands) {
      const l = byLead.get(String(it.leadId));
      if (l && !precisaLpProfunda(l)) { it.lpAt = new Date().toISOString(); it.lpNivel = "profundo"; it.lpMotivo = "ja_publicada_na_ficha"; }
    }
    const porFazer = cands.filter((it) => !it.lpAt);
    if (porFazer.length !== cands.length) await writeQueue(key, items);
    if (!porFazer.length) { out.motivo = "nada_por_publicar"; return out; }
                                                                                                   
    porFazer.sort((a, b) => (Date.parse(String(a.doneAt || a.createdAt || "")) || 0) - (Date.parse(String(b.doneAt || b.createdAt || "")) || 0));
    const vaga = porFazer.slice(0, LP_POR_DRAIN);
    out.adiados = Math.max(0, porFazer.length - vaga.length);
    for (let i = 0; i < vaga.length; i += LP_CONCORRENTES) {
      if (Date.now() - t0 > LP_ARRANQUE_MAX_MS) { out.adiados += vaga.length - i; break; }
      const chunk = vaga.slice(i, i + LP_CONCORRENTES);
      for (const it of chunk) { const live = items.find((x) => x.id === it.id); if (live) live.lpTentativas = Number(live.lpTentativas || 0) + 1; }
      await writeQueue(key, items);                                                                                      
      const rs = await Promise.all(chunk.map((it) => lpChain(it, cfg)));
      for (let j = 0; j < chunk.length; j++) {
        const live = items.find((x) => x.id === chunk[j].id); if (!live) continue;
        const r = rs[j]; out.vistos++;
        if (!r.carimbar) { live.lpMotivo = r.motivo; continue; }                                       
        live.lpAt = new Date().toISOString(); live.lpMotivo = r.motivo || "";
        if (r.url) { live.lpNivel = r.nivel; out.publicados++; if (r.nivel === "profundo") out.profundos++; else out.rasos++; }
      }
      await writeQueue(key, items);
    }
    return out;
  } finally { await lock.release(); }
}

function summarize(items: LItem[]): any {
  const by = (s: Status) => items.filter((x) => x.status === s).length;
  const infra = items.filter((x) => x.status === "failed" && String(x.reason || "").startsWith("infra")).length;
  return { total: items.length, scheduled: by("scheduled"), running: by("running"), done: by("done"), partial: by("partial"), failed: by("failed"), infraFailed: infra, retryable: items.filter((x) => x.status === "failed" && String(x.reason || "").startsWith("infra") && Number(x.attempts || 0) < MAX_ATTEMPTS).length };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  const action = qVal(req, "action");
  const tenantParam = qVal(req, "tenantId");
  const shouldDrain = action === "drain" || (!action && req.method === "GET" && !tenantParam && hasCronBearer(req));

  if (shouldDrain) {
    if (!cronAuthed(req)) return res.status(401).json({ error: "unauthorized" });
    const drainLock = await acquireQueueLock("leadaudit/__drain__");                                                                                                  
    if (!drainLock) return res.status(200).json({ ok: true, busy: true, note: "outro_drain_em_curso" });
    const drainT0 = Date.now();                                                                                                     
    try {
    let autoDiag: any = null; try { autoDiag = await autoEnqueueDiag(); } catch { autoDiag = { enqueued: 0, skipped: "erro" }; }                                                                          
    let spent = await readBudget();
                                                                                                                     
                                                                                                                
    if (spent >= DAILY_CAP) { const lpB = await lpPass(drainT0).catch(() => null); return res.status(200).json({ ok: true, budget_reached: true, spent, cap: DAILY_CAP, processed: 0, lp: lpB }); }
    const now = Date.now(); let processed = 0, done = 0, partial = 0, failed = 0, locked = 0, stale = 0, infraStreak = 0; let aborted = ""; const details: any[] = []; const stoppedTenants: string[] = [];
    let keys: string[] = []; try { const { blobs } = await list({ prefix: QUEUE_PREFIX, limit: 1000 }); keys = blobs.map((b) => b.pathname).filter((p) => p.endsWith(".json")); } catch {  }
    for (const key of keys) {
      if (aborted) break;
      const lock = await acquireQueueLock(key);
      if (!lock) { locked++; continue; }
      try {
                                                                                             
        const tId = tenantFromQueueKey(key);
        let stopped = await stopRequested(tId);
        const items = await readQueue(key); if (!items.length) { if (stopped) await clearStop(tId); continue; } let changed = false;
        const claimIso = new Date().toISOString();
                                                                       
        for (const it of items) { if (isStaleInflight(it, now)) { it.status = "failed"; it.reason = "infra_stale"; stale++; changed = true; } }
                                                                                                             
        const eligible = items.filter((it) => (it.status === "scheduled" || (((it.status === "failed" && String(it.reason || "").startsWith("infra")) || it.status === "partial") && Number(it.attempts || 0) < MAX_ATTEMPTS)) && (!it.scheduledAt || Date.parse(it.scheduledAt) <= now));
        const claimed: LItem[] = [];
        for (const it of eligible) {
          if (stopped) break;                                                                               
          if (claimed.length >= MAX_ITEMS_PER_DRAIN) break;
          if (spent + claimed.length >= DAILY_CAP) { aborted = "budget_reached"; break; }
                                                                                                                     
          if (it.status === "partial") it.layers = neededLayersOf(it.result, !!it.placeId); else if (it.layers) delete it.layers;
          it.status = "running"; it.processingAt = claimIso; it.lastAttemptAt = claimIso; it.attempts = Number(it.attempts || 0) + 1; changed = true; claimed.push(it);
        }
        if (changed) await writeQueue(key, items);
                                                                                         
        for (let i = 0; i < claimed.length; i += MAX_CONCURRENT) {
          if (aborted) break;
          if (await stopRequested(tId)) { stopped = true; break; }                                                        
          const chunk = claimed.slice(i, i + MAX_CONCURRENT);
          const outs = await Promise.all(chunk.map((it) => runDiagnose(it)));
          for (let j = 0; j < chunk.length; j++) {
            const it = chunk[j]; const out = outs[j];
            const live = items.find((x) => x.id === it.id) || it;
            processed++;
            if (out.status === "done" || out.status === "partial") {
              live.status = out.status; live.result = out.result; live.preenchidos = out.preenchidos; live.total = out.total; live.mode = out.mode; live.doneAt = new Date().toISOString(); delete live.error; live.reason = out.status === "partial" ? "pouco_material_real" : undefined; if (out.status === "done" && live.layers) delete live.layers;                                        
              if (out.status === "done") done++; else partial++; infraStreak = 0; await bumpBudget(1); spent++;
              if (out.result) { await writeBackAudit(String(live.leadId), out.result, live.tenantId === AUTODIAG_TENANT); }                                                                                                              
            } else {
              live.status = "failed"; live.reason = out.reason || "failed"; failed++;
              if (out.infraFail) { infraStreak++; } else { infraStreak = 0; await bumpBudget(1); spent++; }
            }
            details.push({ leadId: live.leadId, status: live.status, reason: live.reason || null, preenchidos: live.preenchidos ?? null });
          }
          await writeQueue(key, items);
          if (infraStreak >= CIRCUIT_BREAK) { aborted = "circuit_break_infra"; break; }                                                 
          if (spent >= DAILY_CAP) { aborted = "budget_reached"; break; }
        }
                                                                                                                       
                                                                                                         
        if (stopped) {
          const porCorrer = new Set(claimed.filter((c) => { const live = items.find((x) => x.id === c.id); return !!live && live.status === "running"; }).map((c) => c.id));
          await writeQueue(key, items.filter((x) => !porCorrer.has(x.id) && x.status !== "scheduled"), { union: false });                               
          await clearStop(tId);
          stoppedTenants.push(tId);
        }

        else if (aborted) { for (const c of claimed) { const live = items.find((x) => x.id === c.id); if (live && live.status === "running") { live.status = "scheduled"; live.attempts = Math.max(0, Number(live.attempts || 1) - 1); delete live.processingAt; } } await writeQueue(key, items); }
      } finally { await lock.release(); }
    }
                                                                                                                    
                                                                                                                     
                                                                                            
    let lp: any = null; try { lp = await lpPass(drainT0); } catch { lp = { motivo: "erro" }; }
    return res.status(200).json({ ok: true, processed, done, partial, failed, locked, stale, aborted: aborted || null, parados: stoppedTenants, spent, cap: DAILY_CAP, autoDiag, lp, details });
    } finally { await drainLock.release(); }
  }

  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

                                                                    
                                                                                                            
                                                                                                    
                                                                                                       
                                                                                                           
  if (action === "stop") {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const tenantId = safeTenant(tenantParam);
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
                                                                                                             
    try { await raiseStop(tenantId); } catch {  }
    const key = `${QUEUE_PREFIX}${tenantId}.json`;
                                                                                                  
    const lock = await acquireQueueLock(key);                                                                     
    if (!lock) return res.status(200).json({ ok: true, removidos: 0, pendente: true, note: "drenador_a_correr_bandeira_gravada_ele_para_no_proximo_lead" });
    try {
      const items = await readQueue(key);
      const kept = items.filter((x) => x.status !== "scheduled");                                                             
      const removidos = items.length - kept.length;
      if (removidos) await writeQueue(key, kept, { union: false });                                                                                                              
      await clearStop(tenantId);                                                                                         
      return res.status(200).json({ ok: true, removidos, pendente: false });
    } finally { await lock.release(); }
  }

  if (action === "status") {
    const tenantId = safeTenant(tenantParam);
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const items = await readQueue(`${QUEUE_PREFIX}${tenantId}.json`);                                                  
    const by = (s: Status) => items.filter((x) => x.status === s).length;
    const usado = await readBudget(); const teto = DAILY_CAP;
    const restante = Math.max(0, teto - usado); const budgetReached = usado >= teto;
    return res.status(200).json({ ok: true, total: items.length, scheduled: by("scheduled"), running: by("running"), done: by("done"), partial: by("partial"), failed: by("failed"), budget: { usado, teto, restante, budgetReached } });
  }

  if (action === "bump-ai") {
    if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
    const b = (req.body || {}) as any; const n = Number(b?.n);
    if (!Number.isInteger(n) || n < 1 || n > 200) return res.status(400).json({ error: "n_invalido", note: "n tem de ser inteiro entre 1 e 200" });
                                                                                                            
                                                                                                          
    const lock = await acquireQueueLock("leadaudit/__drain__");
    if (!lock) return res.status(200).json({ ok: false, busy: true, note: "drain_em_curso_tenta_de_novo" });
    try {
      const usado = (await readBudget()) + n;                                                              
      await put(todayKey(), JSON.stringify({ count: usado, updatedAt: new Date().toISOString() }), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
      const teto = DAILY_CAP; const budgetReached = usado >= teto;
      return res.status(200).json({ ok: true, usado, teto, budgetReached });
    } finally { await lock.release(); }
  }

  if (req.method === "GET") {
    const tenantId = safeTenant(tenantParam);
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const items = await readQueue(`${QUEUE_PREFIX}${tenantId}.json`);
    return res.status(200).json({ ok: true, items, summary: summarize(items), spentToday: await readBudget(), cap: DAILY_CAP });
  }
  if (req.method === "POST") {
    const b = (req.body || {}) as any; const tenantId = safeTenant(String(b.tenantId || "abil"));
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const key = `${QUEUE_PREFIX}${tenantId}.json`;
    const lock = await acquireQueueLock(key);                                                                       
    if (!lock) return res.status(200).json({ ok: false, busy: true, note: "drain_em_curso_tenta_de_novo" });
    try {
      const incoming: any[] = Array.isArray(b.items) ? b.items : [];
      const items = b.reset ? [] : await readQueue(key); const nowIso = new Date().toISOString(); const added: LItem[] = [];
                                                                                                                  
                                                                                                                      
                                                                                                                  
      let lpPendente = false;
      for (const raw of incoming) {
        const leadId = String(raw.leadId || "").slice(0, 64); if (!leadId) continue;
        const url = String(raw.url || "").slice(0, 400); const placeId = String(raw.placeId || "").slice(0, 300);
        if (!url && !placeId) continue;
        const id = `la-${leadId}`;
                                                                                                                     
                                                                                              
        const pedeLp = !!raw.lp;
        const item: LItem = { id, tenantId, leadId, url: url || undefined, placeId: placeId || undefined, company: String(raw.company || "").slice(0, 120), status: "scheduled", attempts: 0, scheduledAt: String(raw.scheduledAt || nowIso), createdAt: nowIso, ...(pedeLp ? { lp: true } : {}), ...(raw.origem ? { origem: String(raw.origem).slice(0, 32) } : {}) };
        const ix = items.findIndex((x) => x.id === id);
                                                                                                  
        if (ix >= 0) {
          const cur = items[ix];
          if (!raw.force && (cur.status === "done" || cur.status === "running")) {
                                                                                                                
                                                                                                              
                                                                                                      
            if (pedeLp && !cur.lpAt) {
              if (!cur.lp) { items[ix] = { ...cur, lp: true, origem: item.origem || cur.origem }; added.push(items[ix]); }
              lpPendente = true;
            }
            continue;
          }
          items[ix] = { ...cur, ...item, attempts: 0 };
        }
        else items.push(item);
        if (pedeLp) lpPendente = true;
        added.push(item);
      }
      await writeQueue(key, items.slice(-400), b.reset ? { union: false } : undefined);
      return res.status(200).json({ ok: true, added: added.length, lpPendente, total: Math.min(items.length, 400), reset: !!b.reset, summary: summarize(items) });
    } finally { await lock.release(); }
  }
  if (req.method === "DELETE") {
    const tenantId = safeTenant(qVal(req, "tenantId")); const id = qVal(req, "id");
    if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
    const key = `${QUEUE_PREFIX}${tenantId}.json`;
    const lock = await acquireQueueLock(key);
    if (!lock) return res.status(200).json({ ok: false, busy: true, note: "drain_em_curso_tenta_de_novo" });
    try {
      const items = await readQueue(key);
      if (!id) { await writeQueue(key, []); return res.status(200).json({ ok: true, cleared: true }); }
      const next = items.filter((x) => x.id !== id); await writeQueue(key, next);
      return res.status(200).json({ ok: true, removed: items.length - next.length });
    } finally { await lock.release(); }
  }
  return res.status(405).json({ error: "method_not_allowed" });
}
