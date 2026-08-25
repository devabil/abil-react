   
                                                                                              
  
                                                                                                
                                                                                                
                                                                                                      
                                                                                                      
                                                                                                                
  
                                                                     
                                                                                              
                                                                                       
  
                                                                                
                                              
   
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 30 };

const SITE_RE = /^[a-z0-9-]{1,40}$/;
const ADMIN_PW = (typeof process !== "undefined" ? process.env : ({} as any))?.ABIL_ADMIN_AUTH_SECRET || "";
const BLOB_PUBLIC_BASE = (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";

function vaultOk(req: VercelRequest): boolean {
  if (!ADMIN_PW) return false;
  const h = req.headers["x-abil-admin"]; const tok = Array.isArray(h) ? h[0] : (h as string | undefined);
  if (!tok) return false;
  const [expS, sig] = tok.split("."); const exp = Number(expS);
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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}
function qs(req: VercelRequest, key: string): string {
  const v = req.query?.[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length) return v[0];
  return "";
}
function readBody(req: VercelRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") { try { resolve(JSON.parse(req.body || "{}")); } catch (e) { reject(e); } }
      else resolve(req.body);
      return;
    }
    let buf = ""; req.setEncoding("utf-8");
    req.on("data", (c: string) => { buf += c; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

const keyFor = (site: string) => `video-proposals/${site}/all.json`;
const snapPrefix = (site: string) => `video-proposals/${site}/snap/`;

async function readList(site: string): Promise<any[]> {
  const key = keyFor(site);
  if (BLOB_PUBLIC_BASE) {
    try {
      const r = await fetch(`${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${key}?cb=${Date.now()}`, { cache: "no-store" });
      if (r.status === 404) return [];
      if (r.ok) { const d: any = await r.json(); return Array.isArray(d?.vps) ? d.vps : (Array.isArray(d) ? d : []); }
    } catch {  }
  }
  try {
    const { blobs } = await list({ prefix: key, limit: 1 });
    if (!blobs.length) return [];
    const r = await fetch(blobs[0].url, { cache: "no-store" });
    if (r.ok) { const d: any = await r.json(); return Array.isArray(d?.vps) ? d.vps : (Array.isArray(d) ? d : []); }
  } catch {  }
  return [];
}

async function snapshot(site: string, vps: any[], reason: string): Promise<void> {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    await put(`${snapPrefix(site)}all-${ts}.json`, JSON.stringify({ ts: new Date().toISOString(), reason, count: vps.length, vps }), {
      access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true,
    });
  } catch {  }
}

async function writeList(site: string, vps: any[], reason: string): Promise<void> {
  const current = await readList(site);
  if (current.length > 0) await snapshot(site, current, reason);
  await put(keyFor(site), JSON.stringify({ vps, version: Date.now(), reason }), {
    access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true,
  });
}

                                                                                                            
function mergeUpserts(existing: any[], upserts: any[]): any[] {
  const map = new Map<string, any>();
  for (const v of existing) if (v && typeof v.id === "string") map.set(v.id, v);
  for (const u of upserts) if (u && typeof u.id === "string") map.set(u.id, u);
  return Array.from(map.values());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }
  if (!vaultOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }

  const site = (qs(req, "site") || "abil").trim().toLowerCase();
  if (!SITE_RE.test(site)) { res.status(400).json({ error: "invalid site" }); return; }

  try {
    if (method === "GET") {
      const vps = await readList(site);
      res.status(200).json({ vps });
      return;
    }
    if (method === "POST") {
      const body = await readBody(req);
      const upserts: any[] = Array.isArray(body) ? body : (Array.isArray(body?.vps) ? body.vps : []);
      const valid = upserts.filter((v) => v && typeof v.id === "string" && v.id.length > 0);
      if (!valid.length) { res.status(400).json({ error: "body must be { vps: [...] } with ids" }); return; }
      const merged = mergeUpserts(await readList(site), valid);
      await writeList(site, merged, `upsert-${valid.length}`);
      res.status(200).json({ ok: true, upserted: valid.length, count: merged.length });
      return;
    }
    if (method === "DELETE") {
      const id = qs(req, "id").trim();
      if (!id) { res.status(400).json({ error: "id required" }); return; }
      const existing = await readList(site);
      const next = existing.filter((v) => v?.id !== id);
      if (next.length !== existing.length) await writeList(site, next, `delete-${id}`);
      res.status(200).json({ ok: true, count: next.length });
      return;
    }
    res.status(405).json({ error: "method not allowed" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e).slice(0, 200) });
  }
}
