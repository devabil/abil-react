/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                    
                                                                                            
                                                                                                      
                                                                                                    
                                                                                     
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";
const CONN_PREFIX = "meta/connections/";
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
async function saveConnection(t: string, patch: any): Promise<any> { const id = safeTenant(t); if (!id) throw new Error("bad_tenant"); const ex = (await getConnection(id)) || { tenantId: id }; const rec = { ...ex, ...patch, tenantId: id, updatedAt: new Date().toISOString() }; await writeText(`${CONN_PREFIX}${id}.enc`, encrypt(JSON.stringify(rec))); return rec; }
function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
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
  if (!CLIENT_ID || !CLIENT_SECRET) return res.status(503).json({ error: "LinkedIn not configured (LINKEDIN_CLIENT_ID/SECRET missing)" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  const b = (req.body || {}) as { tenantId?: string; code?: string; redirectUri?: string };
  const tenantId = String(b.tenantId || ""); const code = String(b.code || "");
                                                                                                 
  if (!authed(req) && tenantFromBearer(req) !== safeTenant(tenantId)) return res.status(401).json({ error: "unauthorized" });
  if (!tenantId || !code) return res.status(400).json({ error: "missing_tenant_or_code" });
  try {
    const form = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: String(b.redirectUri || ""), client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
    const tr = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
    const tj: any = await tr.json();
    if (!tr.ok || !tj.access_token) return res.status(502).json({ error: "linkedin_token_failed", detail: tj });
    let profile: any = null;
    try { const pr = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${tj.access_token}` } }); if (pr.ok) profile = await pr.json(); } catch {  }
    await saveConnection(tenantId, { linkedin: { token: tj.access_token, expiresIn: tj.expires_in || null, sub: profile?.sub || null, name: profile?.name || null, connectedAt: new Date().toISOString() } });
    return res.status(200).json({ ok: true, channel: "linkedin", name: profile?.name || null });
  } catch (e) { return res.status(500).json({ error: "connect_failed", detail: String(e) }); }
}
