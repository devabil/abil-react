/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                        
                                                                                                               
                                                                                               
  
                                                                                           
                                                                                                            
                                                                                           
                                                     
                                                                                         
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

                                                                                        
                                                                                        
                                                                        
export const config = { runtime: "nodejs", api: { bodyParser: false } };
const EVENTS_PREFIX = "email/events/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ADMIN = process.env.META_ADMIN_KEY || "";
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || "";
const TENANT = "abil";
const MAX_EVENTS = 4000;

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

async function rawBody(req: VercelRequest): Promise<string> {
  try { const chunks: Buffer[] = []; for await (const c of req as any) chunks.push(typeof c === "string" ? Buffer.from(c) : c); const s = Buffer.concat(chunks).toString("utf8"); if (s) return s; } catch {       }
  try { return typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}); } catch { return ""; }
}

                                                                                                                  
function svixVerify(headers: VercelRequest["headers"], body: string): boolean {
                                                                                          
                                                                                      
                                                                                          
  if (!WEBHOOK_SECRET) return false;
  const h = (n: string) => { const v = headers[n]; return String((Array.isArray(v) ? v[0] : v) || ""); };
  const id = h("svix-id"); const ts = h("svix-timestamp"); const sigHeader = h("svix-signature");
  if (!id || !ts || !sigHeader) return false;
  try {
    const secretB64 = WEBHOOK_SECRET.startsWith("whsec_") ? WEBHOOK_SECRET.slice(6) : WEBHOOK_SECRET;
    const key = Buffer.from(secretB64, "base64");
    const signed = `${id}.${ts}.${body}`;
    const want = crypto.createHmac("sha256", key).update(signed).digest("base64");
                                                                                      
    return sigHeader.split(" ").some((part) => { const c = part.split(","); const s = c.length > 1 ? c[1] : c[0]; try { return s.length === want.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(want)); } catch { return false; } });
  } catch { return false; }
}

                                                                                                                                                            
                                                                                      
                                                                                       
                                                                          
const EVT_ENC_KEY = (process.env.CRM_ENC_KEY || "").trim();
function evtKey(): Buffer | null {
  if (!EVT_ENC_KEY) return null;
  return crypto.createHash("sha256").update(EVT_ENC_KEY).digest();
}
function evtCifrar(texto: string): string {
  const k = evtKey();
  if (!k) return texto;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return JSON.stringify({ __enc: "a256gcm", iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: enc.toString("base64") });
}
function evtDecifrar(texto: string | null): string | null {
  if (!texto) return texto;
  if (!texto.includes('"__enc"')) return texto;                             
  const k = evtKey();
  if (!k) return null;
  try {
    const d = JSON.parse(texto) as { iv: string; tag: string; data: string };
    const dc = crypto.createDecipheriv("aes-256-gcm", k, Buffer.from(d.iv, "base64"));
    dc.setAuthTag(Buffer.from(d.tag, "base64"));
    return Buffer.concat([dc.update(Buffer.from(d.data, "base64")), dc.final()]).toString("utf8");
  } catch { return null; }
}

async function readEvents(key: string): Promise<any[]> {
  let txt: string | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); else if (r.status === 404) txt = null; } catch {  } }
  if (txt === null) { try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } } catch {  } }
  txt = evtDecifrar(txt);
  if (!txt) return [];
  try { const j = JSON.parse(txt); return Array.isArray(j) ? j : []; } catch { return []; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, svix-id, svix-timestamp, svix-signature");
  if (req.method === "OPTIONS") return res.status(204).end();
  const key = `${EVENTS_PREFIX}${TENANT}.json`;

  if (req.method === "GET") {
    if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
    const ev = await readEvents(key);
    return res.status(200).json({ ok: true, events: ev.slice(-1500), webhookConfigured: !!WEBHOOK_SECRET });
  }

  if (req.method === "POST") {
    const body = await rawBody(req);
                                                                                                                 
                                                                                                                  
                                                                       
    const verified = svixVerify(req.headers, body);
    let payload: any = {}; try { payload = JSON.parse(body || "{}"); } catch {  }
    const type = String(payload.type || "");
    const data = payload.data || {};
    const to = Array.isArray(data.to) ? String(data.to[0] || "") : String(data.to || data.email || "");
    if (!type || !to) return res.status(200).json({ ok: true, ignored: true });
                                                                                        
                                                                                     
    if (!verified) return res.status(401).json({ ok: false, error: "invalid signature" });
    const ev = await readEvents(key);
    ev.push({ type: type.replace(/^email\./, ""), to: to.toLowerCase().trim(), subject: String(data.subject || ""), at: new Date().toISOString(), emailId: String(data.email_id || data.id || ""), verified });
    try { await put(key, evtCifrar(JSON.stringify(ev.slice(-MAX_EVENTS))), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
    catch { return res.status(200).json({ ok: false, stored: false }); }
    return res.status(200).json({ ok: true, stored: true, verified });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}
