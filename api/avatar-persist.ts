                                                                                
                                                                                        
                                                                                          
                                                                                               
                                                                                            
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 60 };
const ADMIN_PW = (typeof process !== "undefined" ? process.env?.ABIL_ADMIN_AUTH_SECRET : "") || "";

function adminOk(req: VercelRequest): boolean {
  if (!ADMIN_PW) return false;
  const h = req.headers["x-abil-admin"];
  const tok = Array.isArray(h) ? h[0] : (h as string | undefined);
  if (!tok) return false;
  const [expS, sig] = tok.split(".");
  const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }

  let body: any;
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch { res.status(400).json({ error: "invalid JSON" }); return; }
  const url = String(body?.url || "").trim();
  const slug = String(body?.slug || "").trim().replace(/[^\w.-]+/g, "-").slice(0, 80);
  if (!url || !slug) { res.status(400).json({ error: "url + slug required" }); return; }

  let host: string;
  try { host = new URL(url).hostname; } catch { res.status(400).json({ error: "bad url" }); return; }
                                                                     
  if (!(/heygen/i.test(host) || /amazonaws\.com$/i.test(host) || /blob\.vercel-storage\.com$/i.test(host) || /storage\.googleapis\.com$/i.test(host))) { res.status(400).json({ error: "host not allowed: " + host }); return; }

  try {
    const r = await fetch(url);
    if (!r.ok) { res.status(502).json({ error: `download failed ${r.status}` }); return; }
    const ct = r.headers.get("content-type") || "video/mp4";
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length) { res.status(502).json({ error: "empty video" }); return; }
    const blob = await put(`proposal-avatars/${slug}.mp4`, buf, { access: "public", contentType: ct, addRandomSuffix: true });
    res.status(200).json({ ok: true, blobUrl: blob.url, bytes: buf.length });
  } catch (e: any) {
    res.status(503).json({ error: String(e?.message || e).slice(0, 200) });
  }
}
