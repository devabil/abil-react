/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                      
                                                                                                  
                                                                                         
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
const CONN_PREFIX = "meta/connections/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
const ADMIN = process.env.META_ADMIN_KEY || "";
let _key: Buffer | null = null;
function aesKey(): Buffer { if (!ENC_PW) throw new Error("enc_locked"); if (!_key) _key = crypto.scryptSync(ENC_PW, "abil_meta_salt_v1", 32); return _key; }
function decrypt(b: string): string { const [v, ivb, tagb, encb] = b.split("."); if (v !== "v1") throw new Error("bad_cipher"); const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivb, "base64")); d.setAuthTag(Buffer.from(tagb, "base64")); return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8"); }
async function readText(key: string): Promise<string | null> { if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  } } try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.text() : null; } catch { return null; } }
function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
async function getConnection(t: string): Promise<any | null> { const id = safeTenant(t); if (!id) return null; const e = await readText(`${CONN_PREFIX}${id}.enc`); if (!e) return null; try { return JSON.parse(decrypt(e)); } catch { return null; } }
function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ENC_PW) return res.status(503).json({ error: "server not configured (ABIL_ADMIN_AUTH_SECRET missing)" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  const b = (req.body || {}) as { tenantId?: string; text?: string; orgUrn?: string };
  const tenantId = String(b.tenantId || ""); const text = String(b.text || "");
  if (!tenantId || !text) return res.status(400).json({ error: "missing_tenant_or_text" });
  const conn = await getConnection(tenantId);
  if (!conn?.linkedin?.token) return res.status(409).json({ error: "tenant_not_connected_linkedin", tenantId });
                                                                                                              
                                                                                     
  let orgUrn = b.orgUrn;
  if (!orgUrn) { try { const ar = await fetch("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED", { headers: { Authorization: `Bearer ${conn.linkedin.token}`, "X-Restli-Protocol-Version": "2.0.0" } }); const aj: any = await ar.json().catch(() => ({})); const el = (aj.elements || [])[0]; if (el && el.organization) orgUrn = String(el.organization).replace(/^urn:li:organization:/, ""); } catch {  } }
  const author = orgUrn ? `urn:li:organization:${String(orgUrn).replace(/[^0-9]/g, "")}` : (conn.linkedin.sub ? `urn:li:person:${conn.linkedin.sub}` : null);
  if (!author) return res.status(400).json({ error: "missing_author_urn" });
  const payload = { author, lifecycleState: "PUBLISHED", specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text }, shareMediaCategory: "NONE" } }, visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" } };
  try {
    const r = await fetch(UGC_URL, { method: "POST", headers: { Authorization: `Bearer ${conn.linkedin.token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" }, body: JSON.stringify(payload) });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ ok: false, error: "linkedin_publish_failed", detail: j });
    return res.status(200).json({ ok: true, id: j.id || r.headers.get("x-restli-id") || null });
  } catch (e) { return res.status(500).json({ ok: false, error: "network", detail: String(e) }); }
}
