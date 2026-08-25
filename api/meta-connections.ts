/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                           
                                                                                     
                                                                              
                                                                                    
                                                                           
                                                                                  
                                                                                 
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const CONN_PREFIX = "meta/connections/";
const CFG_PREFIX = "config/";
const INDEX_KEY = "meta/index.json";
const CLIENTS_KEY = "meta/clients.json";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
const ADMIN = process.env.META_ADMIN_KEY || "";
const DEFAULT_CLIENTS = [
  { id: "abil", name: "ABiL" },
];
let _key: Buffer | null = null;
function aesKey(): Buffer { if (!ENC_PW) throw new Error("enc_locked"); if (!_key) _key = crypto.scryptSync(ENC_PW, "abil_meta_salt_v1", 32); return _key; }
function encrypt(p: string): string { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv("aes-256-gcm", aesKey(), iv); const e = Buffer.concat([c.update(p, "utf8"), c.final()]); return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), e.toString("base64")].join("."); }
function decrypt(b: string): string { const [v, ivb, tagb, encb] = b.split("."); if (v !== "v1") throw new Error("bad_cipher"); const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivb, "base64")); d.setAuthTag(Buffer.from(tagb, "base64")); return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8"); }
async function readText(key: string): Promise<string | null> { if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  } } try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.text() : null; } catch { return null; } }
async function writeText(key: string, body: string): Promise<void> { await put(key, body, { access: "public", contentType: "text/plain", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
function slugify(s: string): string { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }
interface WAConn { phoneNumberId: string; wabaId?: string; token: string; verifiedName?: string }
interface TConns { tenantId: string; whatsapp?: WAConn; facebook?: any; updatedAt: string }
async function getConnection(t: string): Promise<TConns | null> { const id = safeTenant(t); if (!id) return null; const e = await readText(`${CONN_PREFIX}${id}.enc`); if (!e) return null; try { return JSON.parse(decrypt(e)); } catch { return null; } }
async function getIndex(): Promise<{ phones: Record<string, string>; wabas: Record<string, string> }> { const t = await readText(INDEX_KEY); if (!t) return { phones: {}, wabas: {} }; try { const j = JSON.parse(t); return { phones: j.phones || {}, wabas: j.wabas || {} }; } catch { return { phones: {}, wabas: {} }; } }
async function saveConn(id: string, rec: TConns): Promise<void> { await writeText(`${CONN_PREFIX}${safeTenant(id)}.enc`, encrypt(JSON.stringify(rec))); }
async function saveWhatsAppConnection(t: string, wa: WAConn): Promise<TConns> { const id = safeTenant(t); if (!id) throw new Error("bad_tenant"); const ex = (await getConnection(id)) || { tenantId: id, updatedAt: "" }; const rec: TConns = { ...ex, tenantId: id, whatsapp: wa, updatedAt: new Date().toISOString() }; await saveConn(id, rec); const ix = await getIndex(); ix.phones[wa.phoneNumberId] = id; if (wa.wabaId) ix.wabas[wa.wabaId] = id; await writeText(INDEX_KEY, JSON.stringify(ix)); return rec; }

interface Client { id: string; name: string }
async function getClients(): Promise<Client[]> {
  const t = await readText(CLIENTS_KEY);
  if (!t) { await writeText(CLIENTS_KEY, JSON.stringify({ clients: DEFAULT_CLIENTS })); return DEFAULT_CLIENTS.slice(); }
  try { const j = JSON.parse(t); return Array.isArray(j.clients) ? j.clients : DEFAULT_CLIENTS.slice(); } catch { return DEFAULT_CLIENTS.slice(); }
}
async function addClient(name: string): Promise<{ ok: boolean; client?: Client; error?: string }> {
  const nm = String(name || "").trim(); if (!nm) return { ok: false, error: "missing_name" };
  const id = slugify(nm); if (!id) return { ok: false, error: "bad_name" };
  const clients = await getClients();
  if (!clients.some((c) => c.id === id)) { clients.push({ id, name: nm }); await writeText(CLIENTS_KEY, JSON.stringify({ clients })); }
  return { ok: true, client: { id, name: nm } };
}
function statusOf(conn: any | null) { return { whatsapp: !!conn?.whatsapp?.phoneNumberId, facebookPages: conn?.facebook?.pages?.length || 0, google: !!(conn?.google?.token || conn?.google?.refreshToken), linkedin: !!(conn?.linkedin?.token) }; }
                                                                                                    
async function personaOf(t: string): Promise<{ has: boolean; title?: string }> { const id = safeTenant(t); if (!id) return { has: false }; const e = await readText(`${CFG_PREFIX}${id}.enc`); if (!e) return { has: false }; try { const c = JSON.parse(decrypt(e)); return { has: !!(c?.brandPersona), title: c?.brandPersona?.title || undefined }; } catch { return { has: false }; } }

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
  if (!ENC_PW) return res.status(503).json({ error: "server not configured (ABIL_ADMIN_AUTH_SECRET missing)" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

  const q = (k: string) => { const v = req.query[k]; return typeof v === "string" ? v : Array.isArray(v) ? v[0] : ""; };

  if (req.method === "GET") {
    if (q("list")) {
      const clients = await getClients();
      const out = await Promise.all(clients.map(async (c) => ({ ...c, status: statusOf(await getConnection(c.id)), persona: await personaOf(c.id) })));
      return res.status(200).json({ clients: out });
    }
    const tenantId = q("tenantId");
    if (!tenantId) return res.status(400).json({ error: "missing_tenantId_or_list" });
    const conn = await getConnection(tenantId);
    return res.status(200).json({ tenantId, status: statusOf(conn), whatsapp: conn?.whatsapp ? { phoneNumberId: conn.whatsapp.phoneNumberId, wabaId: conn.whatsapp.wabaId, verifiedName: conn.whatsapp.verifiedName } : null, facebook: conn?.facebook ? { pages: (conn.facebook.pages || []).map((p: any) => ({ pageId: p.pageId, name: p.name, igUserId: p.igUserId, igUsername: p.igUsername })) } : null, updatedAt: conn?.updatedAt || null });
  }

  if (req.method === "POST") {
    if (q("addClient")) {
      const b = (req.body || {}) as { name?: string };
      const r = await addClient(b.name || "");
      return res.status(r.ok ? 200 : 400).json(r);
    }
    const b = (req.body || {}) as { tenantId?: string; phoneNumberId?: string; token?: string; wabaId?: string; verifiedName?: string };
    if (!b.tenantId || !b.phoneNumberId || !b.token) return res.status(400).json({ error: "missing_fields", need: ["tenantId", "phoneNumberId", "token"] });
    const rec = await saveWhatsAppConnection(String(b.tenantId), { phoneNumberId: String(b.phoneNumberId), token: String(b.token), wabaId: b.wabaId ? String(b.wabaId) : undefined, verifiedName: b.verifiedName ? String(b.verifiedName) : undefined });
    return res.status(200).json({ ok: true, tenantId: rec.tenantId, status: statusOf(rec) });
  }

  if (req.method === "DELETE") {
    const tenantId = safeTenant(q("tenantId")); const channel = q("channel");
    if (!tenantId || !channel) return res.status(400).json({ error: "missing_tenant_or_channel" });
    const conn = await getConnection(tenantId);
    if (!conn) return res.status(200).json({ ok: true, status: statusOf(null) });
    if (channel === "whatsapp") {
      const phoneId = conn.whatsapp?.phoneNumberId;
      delete (conn as any).whatsapp;
      if (phoneId) { const ix = await getIndex(); delete ix.phones[phoneId]; await writeText(INDEX_KEY, JSON.stringify(ix)); }
    } else if (channel === "facebook") {
      delete (conn as any).facebook;
    }
    conn.updatedAt = new Date().toISOString();
    await saveConn(tenantId, conn);
    return res.status(200).json({ ok: true, tenantId, status: statusOf(conn) });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}
