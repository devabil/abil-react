/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                       
                                                                                                
                                                                                      
                                                                                                   
  
                                                                                                          
                                                                  
                                                                                                      
                                                                                                   
                                                                                                  
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";

function igualSeguro(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
}

export const config = { runtime: "nodejs", maxDuration: 60 };
const ALL_KEY = "crm/leads.json";
const SNAP_PREFIX = "crm/snapshots/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const MAX_SNAPSHOTS = 200;
                                                                       
const TENANT = "abil";
                                                                                                      
                                                                         
const FREEMAIL = new Set(["gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.it", "outlook.com", "outlook.pt", "live.com", "live.co.uk", "msn.com", "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.it", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "gmx.com", "gmx.net", "protonmail.com", "proton.me", "mail.com", "yandex.com", "sapo.pt", "orange.fr", "free.fr", "laposte.net", "bluewin.ch", "sunrise.ch", "libero.it", "virgilio.it"]);

type Lead = { id: string;[k: string]: unknown };

function hdr(req: VercelRequest, n: string): string { const v = req.headers[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function qv(req: VercelRequest, n: string): string { const v = req.query[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }

                                                                                               
function authed(req: VercelRequest): boolean {
  const mk = process.env.META_ADMIN_KEY || "";
  if (mk && igualSeguro(hdr(req, "x-meta-admin"), mk)) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  const tok = hdr(req, "x-abil-admin");
  if (PW && tok && tok.indexOf(".") > 0) {
    const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1);
    if (exp && exp > Date.now()) {
      const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex");
      try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; }
    }
  }
  return false;
}

async function readText(key: string): Promise<string | null> {
  if (BLOB_PUBLIC_BASE) {
    try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return decifrar(await r.text()); if (r.status === 404) return null; } catch {  }
  }
  try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? decifrar(await r.text()) : null; } catch { return null; }
}
const SAFE_KEY = "crm/leads-safe.json";                                                                                                  
                                                                                                          
                                                                                                            
                                                                                                        
                                                                                                      
                                                               
                                                                                  
                                                                                 
                                                                               
                                                                               
                                                                                
                                                            
const CRM_ENC_KEY = (process.env.CRM_ENC_KEY || "").trim();
function chaveCifra(): Buffer | null {
  if (!CRM_ENC_KEY) return null;
  return crypto.createHash("sha256").update(CRM_ENC_KEY).digest();
}
function cifrar(texto: string): string {
  const k = chaveCifra();
  if (!k) return texto;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return JSON.stringify({ __enc: "a256gcm", iv: iv.toString("base64"), tag: tag.toString("base64"), data: enc.toString("base64") });
}
function decifrar(texto: string | null): string | null {
  if (!texto) return texto;
  if (texto.indexOf('"__enc"') < 0) return texto;                               
  const k = chaveCifra();
  if (!k) return null;                                                                        
  try {
    const d = JSON.parse(texto) as { iv: string; tag: string; data: string };
    const dc = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(d.iv, "base64"));
    dc.setAuthTag(Buffer.from(d.tag, "base64"));
    return Buffer.concat([dc.update(Buffer.from(d.data, "base64")), dc.final()]).toString("utf8");
  } catch { return null; }
}

const TOMB_KEY = "crm/deleted-tombstones.json";
const TOMB_TTL_MS = 30 * 24 * 3600 * 1000;
async function readTombs(): Promise<Record<string, number>> {
  const txt = await readText(TOMB_KEY); if (!txt) return {};
  try { const d = JSON.parse(txt); return (d && typeof d === "object" && !Array.isArray(d)) ? d as Record<string, number> : {}; } catch { return {}; }
}
async function writeTombs(t: Record<string, number>): Promise<void> {
  const now = Date.now();
  const vivas = Object.entries(t).filter(([, ts]) => now - Number(ts || 0) < TOMB_TTL_MS);
  const capped = Object.fromEntries(vivas.sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 800));
  await put(TOMB_KEY, cifrar(JSON.stringify(capped)), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
}
                                                                                                        
                                                                                                            
                                                                                              
async function readRaw(key: string): Promise<Lead[]> {
  const parse = (txt: string | null): { leads: Lead[]; version: number } | null => {
    if (!txt) return null;
    try { const d = JSON.parse(txt); const v = Number(d?.version) || 0; if (Array.isArray(d)) return { leads: d as Lead[], version: v }; if (d && Array.isArray(d.leads)) return { leads: d.leads as Lead[], version: v }; return null; } catch { return null; }
  };
  let a: { leads: Lead[]; version: number } | null = null;
  let b: { leads: Lead[]; version: number } | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) a = parse(decifrar(await r.text())); } catch {  } }
  try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (bl) { const r = await fetch(`${bl.url}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) b = parse(decifrar(await r.text())); } } catch {  }
  const best = (a && b) ? (b.version > a.version ? b : a) : (a || b);
  return best ? best.leads : [];
}
async function putLeadsTo(key: string, leads: Lead[], extra: Record<string, unknown> = {}): Promise<void> {
  await put(key, cifrar(JSON.stringify({ leads, version: Date.now(), savedAt: new Date().toISOString(), ...extra })), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
}
                                                                                                              
                                                                                                        
                                                                                             
async function readLeads(): Promise<Lead[]> {
  const raw = await readRaw(ALL_KEY);
  const safe = await readRaw(SAFE_KEY);
  if (safe.length >= 20 && raw.length < Math.floor(safe.length * 0.6)) {
    try { await putLeadsTo(ALL_KEY, safe, { healedFrom: "safe", rawWas: raw.length }); } catch {  }
    return safe;
  }
  if (raw.length >= 20 && raw.length > safe.length) { try { await putLeadsTo(SAFE_KEY, raw); } catch {  } }
  return raw;
}
async function updateSafe(leads: Lead[], force: boolean): Promise<void> {
  try { const safe = await readRaw(SAFE_KEY); if (force || leads.length >= safe.length) await putLeadsTo(SAFE_KEY, leads); } catch {  }
}
async function snapshot(leads: Lead[], reason: string): Promise<void> {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    await put(`${SNAP_PREFIX}leads-${ts}.json`, cifrar(JSON.stringify({ ts: new Date().toISOString(), reason, count: leads.length, leads })), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
  } catch (e) { console.error("[crm-leads] snapshot failed", e); }
}
async function gcSnapshots(): Promise<void> {
  try {
    const { blobs } = await list({ prefix: SNAP_PREFIX, limit: 1000 });
    const sorted = blobs.slice().sort((a, b) => String(b.pathname).localeCompare(String(a.pathname)));
    for (const b of sorted.slice(MAX_SNAPSHOTS)) { try { await del(b.url); } catch {  } }
  } catch {  }
}
async function writeLeads(leads: Lead[], reason: string, force = false): Promise<void> {
  const current = await readLeads();
                                                                                                                           
                                                                                                           
                                                                                                          
  if (!force && current.length >= 20 && leads.length < Math.floor(current.length * 0.6)) {
    await snapshot(current, `BLOCKED ${reason} (${current.length}->${leads.length})`);
    throw new Error(`shrink_guard: recusei escrever ${leads.length} leads (atuais ${current.length}). Se for mesmo intencional, repete com ?force=1.`);
  }
  await snapshot(current, reason);                                                     
  await putLeadsTo(ALL_KEY, leads);
  await updateSafe(leads, force);                                                                                    
  gcSnapshots().catch(() => undefined);
}
function mergeById(existing: Lead[], upserts: Lead[]): Lead[] {
  const map = new Map<string, Lead>();
  for (const l of existing) if (l && l.id) map.set(String(l.id), l);
  for (const u of upserts) if (u && u.id) {
    const cur: any = map.get(String(u.id)) || {};
    const merged: any = { ...cur, ...u };
                                                                                                                       
                                                                                                                 
    if (!String((u as any).email || "").trim() && String(cur.email || "").trim()) {
      merged.email = cur.email;
      if (cur.emailSource !== undefined) merged.emailSource = cur.emailSource;
      if (cur.emailConfidence !== undefined) merged.emailConfidence = cur.emailConfidence;
    }
                                                                                                            
    if (cur.replied === true && (u as any).replied !== true) { merged.replied = true; if (cur.repliedAt && !(u as any).repliedAt) merged.repliedAt = cur.repliedAt; }
    for (const k of ["replyClass", "outcome", "briefingRecebidoAt", "proposalSentAt", "proposalUrl", "proposalApprovedAt", "proposalApprovedVia", "followupNegSentAt", "lpChainAt", "deepSkipReason", "oooUntil", "fase2SentAt"]) {
                                                                                                            
                                                                                                               
      const curA: any = (cur as any).audit; const mgA: any = (merged as any).audit;
      if (curA && curA.publishedUrl && (!mgA || !mgA.publishedUrl)) {
        (merged as any).audit = { ...(mgA || {}), publishedUrl: curA.publishedUrl, lpNivel: curA.lpNivel, lpGeradaEm: curA.lpGeradaEm };
      }
      if (!String((u as any)[k] ?? "").trim() && String((cur as any)[k] ?? "").trim()) merged[k] = (cur as any)[k];
    }
    if (cur.agentMemory && typeof cur.agentMemory === "object") {
      const um = ((u as any).agentMemory && typeof (u as any).agentMemory === "object") ? (u as any).agentMemory : {};
      merged.agentMemory = { ...cur.agentMemory, ...um };
      if (!String(um.fase || "").trim() && String((cur.agentMemory as any).fase || "").trim()) merged.agentMemory.fase = (cur.agentMemory as any).fase;
    }
    map.set(String(u.id), merged);
  }
  return Array.from(map.values());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
                                                                                       
                                                                                            
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  const method = (req.method || "GET").toUpperCase();

  if (method === "GET") {
                                                                                               
    if (qv(req, "action") === "thread") {
      if (!authed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
      const leadId = qv(req, "leadId");
      if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
      const parseThread = (txt: string | null): any[] => { try { const d = txt ? JSON.parse(txt) : []; return Array.isArray(d) ? d : []; } catch { return []; } };
      let thread: any[] = parseThread(await readText(`crm/threads/${leadId}.json`));
                                                                                             
                                                                                                                    
                                                                                                             
                                                                                                           
                                                                                                         
                                                                 
                                                                                                                  
      try {
        const leads = await readRaw(ALL_KEY);                                                                          
        const emailOf = (l: any) => String(l?.email || "").trim().toLowerCase();
        const domainOf = (em: string) => { const i = em.indexOf("@"); return i > 0 ? em.slice(i + 1) : ""; };
        const lead: any = leads.find((l: any) => String(l.id) === String(leadId));
        const dom = domainOf(emailOf(lead));
        const domOk = !!dom && !FREEMAIL.has(dom);
        const family: any[] = domOk ? leads.filter((l: any) => domainOf(emailOf(l)) === dom) : (lead ? [lead] : []);
        if (lead && !family.some((l: any) => String(l?.id) === String(leadId))) family.push(lead);
                                                                                                         
        const sibIds = family.map((l: any) => String(l?.id || "")).filter((id) => id && id !== String(leadId));
        if (sibIds.length) {
          const sibTxts = await Promise.all(sibIds.map((id) => readText(`crm/threads/${id}.json`)));
          for (const txt of sibTxts) for (const m of parseThread(txt)) thread.push(m);
        }
                                                                                                          
                                                                                
        const famEmails = new Set(family.map(emailOf).filter(Boolean));
        if (famEmails.size) {
          try {
            const cj = await readText(`email/contacted/${TENANT}.json`); const contacted = cj ? JSON.parse(cj) : {};
            for (const fe of famEmails) { const c = contacted?.[fe]; if (c && c.sentAt) thread.push({ dir: "out", at: c.sentAt, to: fe, subject: c.subject || "Email de prospeção", body: "", via: "prospeção", reconstructed: true }); }
          } catch {  }
        }
                                                                                                          
                                                                                                   
        if (famEmails.size || domOk) {
          try {
            const ej = await readText("replies/events.json"); const events = ej ? JSON.parse(ej) : [];
            for (const ev of (Array.isArray(events) ? events : [])) {
              const fe = String(ev?.fromEmail || "").trim().toLowerCase();
              if (!fe) continue;
              if (famEmails.has(fe) || (domOk && domainOf(fe) === dom)) thread.push({ dir: "in", at: ev.date || ev.seenAt, from: fe, subject: ev.subject || "", body: ev.snippet || "", msgId: ev.msgId, reconstructed: true });
            }
          } catch {  }
        }
      } catch {  }
                                                                                           
      const seen = new Set<string>();
      thread = thread.filter((m: any) => { const k = String(m?.msgId || `${m?.dir}|${String(m?.subject || "").slice(0, 40)}|${String(m?.at || "").slice(0, 10)}`); if (seen.has(k)) return false; seen.add(k); return true; });
      thread.sort((a, b) => String(a?.at || "").localeCompare(String(b?.at || "")));
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, leadId, thread });
    }
    if (qv(req, "snapshots")) {
      if (!authed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
      try { const { blobs } = await list({ prefix: SNAP_PREFIX, limit: 1000 }); return res.status(200).json({ ok: true, snapshots: blobs.map((b) => ({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt })).sort((a, b) => String(b.pathname).localeCompare(String(a.pathname))) }); } catch (e) { return res.status(500).json({ ok: false, error: String(e) }); }
    }
                                                                                 
                                                                                
                                                                                   
                                                                                  
                                                                                    
                                                                                    
    if (!authed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
    const leads = await readLeads();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, leads, count: leads.length });
  }

  if (method === "POST") {
    if (!authed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
    const force = qv(req, "force") === "1";
    const restore = qv(req, "restore");
    if (restore) {
      const txt = await readText(`${SNAP_PREFIX}leads-${restore}.json`);
      if (!txt) return res.status(404).json({ ok: false, error: "snapshot not found" });
      let snap: any = {}; try { snap = JSON.parse(txt); } catch { return res.status(500).json({ ok: false, error: "bad snapshot" }); }
      const leads: Lead[] = Array.isArray(snap.leads) ? snap.leads : [];
      try { await writeLeads(leads, `restore from ${restore}`, force); } catch (e) { return res.status(409).json({ ok: false, error: "shrink_guard", detail: String(e).slice(0, 180) }); }
      return res.status(200).json({ ok: true, restored: leads.length });
    }
    let body: any = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    const incoming: Lead[] = Array.isArray(body) ? body : (Array.isArray(body?.leads) ? body.leads : []);
    if (!Array.isArray(incoming)) return res.status(400).json({ ok: false, error: "leads must be array" });
    if (qv(req, "reset") === "1") { try { await writeLeads(incoming, "reset (full replace)", force); } catch (e) { return res.status(409).json({ ok: false, error: "shrink_guard", detail: String(e).slice(0, 180) }); } return res.status(200).json({ ok: true, total: incoming.length, mode: "reset" }); }
    const current = await readLeads();
                                                                                                                       
                                                                                                               
                                                                                                  
    const curIds = new Set(current.map((l) => String(l.id)));
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let descartadosSemEmail = 0;
    const aceites = incoming.filter((l: any) => { if (!l || !l.id) return false; if (curIds.has(String(l.id))) return true; if (emailRe.test(String(l.email || "").trim())) return true; descartadosSemEmail++; return false; });
                                                                                                                        
                                                                                                 
    const delIds = (Array.isArray((body as any)?.deleteIds) ? (body as any).deleteIds : []).map((x: any) => String(x)).filter(Boolean);
                                                                                                                  
    let tombs: Record<string, number> = {};
    try { tombs = await readTombs(); } catch { tombs = {}; }
    if (delIds.length) { const now = Date.now(); for (const id of delIds) tombs[id] = now; try { await writeTombs(tombs); } catch {  } }
    const tombAlive = (id: string) => { const ts = Number(tombs[id] || 0); return !!ts && (Date.now() - ts) < TOMB_TTL_MS; };
    let removidos = 0; let base = current;
    if (delIds.length) { const ds = new Set(delIds); const before = base.length; base = base.filter((l) => !ds.has(String(l.id))); removidos = before - base.length; }
    if (!force) {
      const before2 = base.length; base = base.filter((l) => !tombAlive(String(l.id))); removidos += before2 - base.length;
    }
    const vivos = force ? aceites : aceites.filter((l) => !tombAlive(String(l.id)));
    const bloqueadosLapide = aceites.length - vivos.length;
    const merged = mergeById(base, vivos);
    await writeLeads(merged, `upsert ${vivos.length}${removidos ? ` · del ${removidos}` : ""}${descartadosSemEmail ? ` · semEmail ${descartadosSemEmail}` : ""}${bloqueadosLapide ? ` · lápide ${bloqueadosLapide}` : ""}`);
    return res.status(200).json({ ok: true, total: merged.length, upserted: vivos.length, removidos, descartadosSemEmail, bloqueadosLapide, mode: "merge" });
  }

  return res.status(405).json({ ok: false, error: "method not allowed" });
}
