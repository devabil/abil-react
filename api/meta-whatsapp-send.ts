/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                  
                                                                                                        
                                                                       
                                                                                                            
                                                                                                    
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const GRAPH = "https://graph.facebook.com/v21.0";
const CONN_PREFIX = "meta/connections/";
const INDEX_KEY = "meta/index.json";
const INBOX_PREFIX = "meta/inbox/";
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
interface WAConn { phoneNumberId: string; wabaId?: string; token: string; verifiedName?: string }
interface TConns { tenantId: string; whatsapp?: WAConn; updatedAt: string }
async function getConnection(t: string): Promise<TConns | null> { const id = safeTenant(t); if (!id) return null; const e = await readText(`${CONN_PREFIX}${id}.enc`); if (!e) return null; try { return JSON.parse(decrypt(e)); } catch { return null; } }
interface InboxMsg { id: string; from: string; name?: string; body: string; direction: "in" | "out"; ts: string }
async function appendInbox(t: string, msg: InboxMsg, cap = 300): Promise<void> { const id = safeTenant(t); if (!id) return; const e = await readText(`${INBOX_PREFIX}${id}.enc`); let arr: InboxMsg[] = []; if (e) { try { arr = JSON.parse(decrypt(e)); } catch { arr = []; } } if (arr.some((m) => m.id === msg.id)) return; arr.push(msg); if (arr.length > cap) arr = arr.slice(arr.length - cap); await writeText(`${INBOX_PREFIX}${id}.enc`, encrypt(JSON.stringify(arr))); }
void INDEX_KEY;

                                                                                                
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ENC_PW) return res.status(503).json({ error: "server not configured (ABIL_ADMIN_AUTH_SECRET missing)" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  const b = (req.body || {}) as { tenantId?: string; to?: string; text?: string; template?: string; lang?: string; params?: (string | number)[] };
  const tenantId = String(b.tenantId || "");
  const to = String(b.to || "").replace(/[^\d]/g, "");
  if (!tenantId || !to) return res.status(400).json({ error: "missing_tenant_or_to" });

  const conn = await getConnection(tenantId);
  if (!conn?.whatsapp?.phoneNumberId || !conn.whatsapp.token) return res.status(409).json({ error: "tenant_not_connected", tenantId });
  const { phoneNumberId, token } = conn.whatsapp;
  const params = Array.isArray(b.params) ? b.params : [];
  const payload = b.template
    ? { messaging_product: "whatsapp", to, type: "template", template: { name: b.template, language: { code: b.lang || "pt_PT" }, components: params.length ? [{ type: "body", parameters: params.map((t) => ({ type: "text", text: String(t) })) }] : [] } }
    : { messaging_product: "whatsapp", to, type: "text", text: { body: String(b.text || "") } };
  try {
    const r = await fetch(`${GRAPH}/${phoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j: any = await r.json();
    if (!r.ok) return res.status(502).json({ ok: false, error: "wa_failed", detail: j });
    const id = (j.messages && j.messages[0] && j.messages[0].id) || `out-${to}-${Date.now()}`;
    try { await appendInbox(tenantId, { id, from: to, body: String(b.text || (params.length ? params.join(" · ") : "")), direction: "out", ts: new Date().toISOString() }); } catch {  }
    return res.status(200).json({ ok: true, id });
  } catch (e) { return res.status(500).json({ ok: false, error: "network", detail: String(e) }); }
}
