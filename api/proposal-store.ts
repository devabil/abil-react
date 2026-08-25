                                                                                  
                                                                                      
                                                                                
                                                                                   
                                                                             
                                                                                                       
  
                                                                                         
                                                                                           
                                                                                                
                                                                                                 
                                         
  
                                        
                                                                                               
                                                                                           
                                                                                              
                                                                                                   
                                                                                           
                                                                                                       
                                                          
  
             
                                                                                                                            
                                                                               
  
                                              
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

                                                                                                    
const BLOB_PUBLIC_BASE = (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";
const ADMIN_PW = (typeof process !== "undefined" ? process.env : ({} as any))?.ABIL_ADMIN_AUTH_SECRET || "";

const SLUG_RE = /^[a-z0-9-]{3,80}$/;
const SITE_RE = /^[a-z0-9-]{1,40}$/;
const MAX_BYTES = 1024 * 1024;                                                    

const keyFor = (site: string, slug: string) => `proposals/${site}/${slug}.json`;

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

function cors(req: VercelRequest, res: VercelResponse) {
                                                                                       
                                                                                            
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}

function readBody(req: VercelRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") { try { resolve(JSON.parse(req.body || "{}")); } catch (e) { reject(e); } }
      else { resolve(req.body); }
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (c: string) => { buf += c; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function qs(req: VercelRequest, key: string): string {
  const v = req.query?.[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length) return v[0];
  return "";
}

                                                                                                          
async function readProposal(site: string, slug: string): Promise<{ vp: unknown; quote: unknown } | null> {
  const key = keyFor(site, slug);
                                                                                                   
                                                                                       
  if (BLOB_PUBLIC_BASE) {
    try {
      const url = `${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${key}?cb=${Date.now()}`;
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) {
        const d: any = await r.json();
        if (d && (d.vp || d.quote)) return { vp: d.vp ?? null, quote: d.quote ?? null };
      }

    } catch {  }
  }
                                                                                
  try {
    const { blobs } = await list({ prefix: key, limit: 1 });
    if (blobs.length) {
      const r = await fetch(blobs[0].url, { cache: "no-store" });
      if (r.ok) {
        const d: any = await r.json();
        if (d && (d.vp || d.quote)) return { vp: d.vp ?? null, quote: d.quote ?? null };
      }
    }
  } catch {  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }

                                                                             
  if (method === "GET") {
    const site = (qs(req, "site") || "abil").trim().toLowerCase();
    const slug = qs(req, "slug").trim().toLowerCase();
    if (!SITE_RE.test(site) || !SLUG_RE.test(slug)) { res.status(400).json({ error: "invalid site/slug" }); return; }
    try {
      const found = await readProposal(site, slug);
      if (!found || (!found.vp && !found.quote)) { res.status(404).json({ error: "not found" }); return; }
      res.status(200).json({ vp: found.vp, quote: found.quote });
    } catch (e: any) {
      res.status(502).json({ error: String(e?.message || e).slice(0, 200) });
    }
    return;
  }

                                                       
  if (method === "POST") {
    if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }
    let body: any;
    try { body = await readBody(req); } catch { res.status(400).json({ error: "invalid JSON" }); return; }
    const site = String(body?.site || "abil").trim().toLowerCase();
    const slug = String(body?.slug || "").trim().toLowerCase();
    const vp = body?.vp;
    const quote = body?.quote;
    if (!SITE_RE.test(site) || !SLUG_RE.test(slug)) { res.status(400).json({ error: "invalid site/slug" }); return; }
    if (!vp && !quote) { res.status(400).json({ error: "vp or quote required" }); return; }
    const payload = JSON.stringify({ vp: vp ?? null, quote: quote ?? null, at: new Date().toISOString() });
    if (Buffer.byteLength(payload, "utf8") > MAX_BYTES) { res.status(413).json({ error: "payload too large (>1MB)" }); return; }
    try {
      await put(keyFor(site, slug), payload, {
        access: "public",
        contentType: "application/json",
        cacheControlMaxAge: 0,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      res.status(200).json({ ok: true });
    } catch (e: any) {
      res.status(502).json({ error: String(e?.message || e).slice(0, 200) });
    }
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
