/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                       
                                                                                                        
                                                                                                       
                                                                                                             
  
                                                                                                 
                                                                        
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const GRAPH = "https://graph.facebook.com/v21.0";
const APP_ID = process.env.META_APP_ID || "";
const APP_SECRET = process.env.META_APP_SECRET || "";
const CONN_PREFIX = "meta/connections/";
const INDEX_KEY = "meta/index.json";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
const ADMIN = process.env.META_ADMIN_KEY || "";
let _key: Buffer | null = null;
function aesKey(): Buffer { if (!ENC_PW) throw new Error("enc_locked"); if (!_key) _key = crypto.scryptSync(ENC_PW, "abil_meta_salt_v1", 32); return _key; }
function encrypt(p: string): string { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv("aes-256-gcm", aesKey(), iv); const e = Buffer.concat([c.update(p, "utf8"), c.final()]); return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), e.toString("base64")].join("."); }
function decrypt(b: string): string { const [v, ivb, tagb, encb] = b.split("."); if (v !== "v1") throw new Error("bad_cipher"); const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivb, "base64")); d.setAuthTag(Buffer.from(tagb, "base64")); return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8"); }
async function readText(key: string): Promise<string | null> { if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  } } try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.text() : null; } catch { return null; } }
async function writeText(key: string, body: string): Promise<void> { await put(key, body, { access: "public", contentType: "text/plain", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
async function getConnection(t: string): Promise<any | null> { const id = safeTenant(t); if (!id) return null; const e = await readText(`${CONN_PREFIX}${id}.enc`); if (!e) return null; try { return JSON.parse(decrypt(e)); } catch { return null; } }
async function getIndex(): Promise<{ phones: Record<string, string>; wabas: Record<string, string> }> { const t = await readText(INDEX_KEY); if (!t) return { phones: {}, wabas: {} }; try { const j = JSON.parse(t); return { phones: j.phones || {}, wabas: j.wabas || {} }; } catch { return { phones: {}, wabas: {} }; } }
async function saveConnection(t: string, patch: any): Promise<any> { const id = safeTenant(t); if (!id) throw new Error("bad_tenant"); const ex = (await getConnection(id)) || { tenantId: id }; const rec = { ...ex, ...patch, tenantId: id, updatedAt: new Date().toISOString() }; await writeText(`${CONN_PREFIX}${id}.enc`, encrypt(JSON.stringify(rec))); return rec; }
async function indexWhatsApp(tenantId: string, phoneNumberId: string, wabaId?: string): Promise<void> { const ix = await getIndex(); ix.phones[phoneNumberId] = safeTenant(tenantId); if (wabaId) ix.wabas[wabaId] = safeTenant(tenantId); await writeText(INDEX_KEY, JSON.stringify(ix)); }

async function exchangeCode(code: string, redirectUri: string): Promise<{ token?: string; error?: any }> {
                                                                                                         
                                                                                                         
                                                                                                      
  let u = `${GRAPH}/oauth/access_token?client_id=${encodeURIComponent(APP_ID)}&client_secret=${encodeURIComponent(APP_SECRET)}&code=${encodeURIComponent(code)}`;
  if (redirectUri) u += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
  const r = await fetch(u); const j: any = await r.json();
  if (!r.ok || !j.access_token) return { error: j };
                                                     
  try {
    const lr = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(APP_ID)}&client_secret=${encodeURIComponent(APP_SECRET)}&fb_exchange_token=${encodeURIComponent(j.access_token)}`);
    const lj: any = await lr.json(); if (lr.ok && lj.access_token) return { token: lj.access_token };
  } catch {  }
  return { token: j.access_token };
}

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) {
    const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1);
    if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } }
  }
  return false;
}
                                                                                                   
                                                                                                   
function tenantFromBearer(req: VercelRequest): string | null {
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  const a = req.headers["authorization"]; const av = Array.isArray(a) ? a[0] : a;
  const t = av && av.startsWith("Bearer ") ? av.slice(7) : "";
  if (!t || !PW) return null;
  const p = t.split("."); if (p.length !== 4 || p[0] !== "t") return null;
  const tid = p[1]; const exp = Number(p[2]); const sig = p[3];
  if (!tid || !exp || exp <= Date.now()) return null;
  const want = crypto.createHmac("sha256", PW).update(`${tid}.${exp}`).digest("hex");
  try { return (sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) ? tid : null; } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ENC_PW) return res.status(503).json({ error: "server not configured (ABIL_ADMIN_AUTH_SECRET missing)" });
  if (!APP_ID || !APP_SECRET) return res.status(503).json({ error: "META_APP_ID/SECRET not configured on the server" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  const b = (req.body || {}) as { tenantId?: string; channel?: string; code?: string; redirectUri?: string; wabaId?: string; phoneNumberId?: string };
  const tenantId = String(b.tenantId || "");
                                                                                                         
  if (!authed(req) && tenantFromBearer(req) !== safeTenant(tenantId)) return res.status(401).json({ error: "unauthorized" });
  const channel = String(b.channel || "");
  const code = String(b.code || "");
  const directToken = String((b as { userToken?: string }).userToken || "");
  if (!tenantId || !channel || (!code && !directToken)) return res.status(400).json({ error: "missing_fields", need: ["tenantId", "channel", "code|userToken"] });

                                                                                                       
                                                                                                         
  let userToken: string;
  if (directToken) {
    userToken = directToken;
    try {
      const lr = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(APP_ID)}&client_secret=${encodeURIComponent(APP_SECRET)}&fb_exchange_token=${encodeURIComponent(directToken)}`);
      const lj: any = await lr.json(); if (lr.ok && lj.access_token) userToken = lj.access_token;
    } catch {  }
  } else {
    const ex = await exchangeCode(code, String(b.redirectUri || ""));
    if (!ex.token) return res.status(502).json({ error: "code_exchange_failed", detail: ex.error });
    userToken = ex.token;
  }

  try {
    if (channel === "facebook") {
                                                      
      const pr = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token=${encodeURIComponent(userToken)}`);
      const pj: any = await pr.json();
      if (!pr.ok) return res.status(502).json({ error: "pages_fetch_failed", detail: pj });
      const pages = (pj.data || []).map((p: any) => ({ pageId: p.id, name: p.name, pageToken: p.access_token, igUserId: p.instagram_business_account?.id || null, igUsername: p.instagram_business_account?.username || null }));
                                                                                                               
      if (!pages.length) return res.status(400).json({ error: "no_pages_selected", detail: "Nenhuma Página foi autorizada. No popup do Facebook, marca as Páginas antes de continuar." });
      await saveConnection(tenantId, { facebook: { pages, connectedAt: new Date().toISOString() } });
                            
      return res.status(200).json({ ok: true, channel, pages: pages.map((p: any) => ({ pageId: p.pageId, name: p.name, igUserId: p.igUserId, igUsername: p.igUsername })) });
    }
    if (channel === "whatsapp") {
      const phoneNumberId = String(b.phoneNumberId || "");
      const wabaId = b.wabaId ? String(b.wabaId) : undefined;
      if (!phoneNumberId) return res.status(400).json({ error: "missing_phoneNumberId" });
      await saveConnection(tenantId, { whatsapp: { phoneNumberId, wabaId, token: userToken } });
      await indexWhatsApp(tenantId, phoneNumberId, wabaId);
      return res.status(200).json({ ok: true, channel, whatsapp: { phoneNumberId, wabaId } });
    }
    return res.status(400).json({ error: "unknown_channel", channel });
  } catch (e) {
    return res.status(500).json({ error: "connect_failed", detail: String(e) });
  }
}
