   
                                                                                  
  
                                                                              
                                                                              
                                                                       
                                                                          
  
                                                                           
                                                              
  
             
                                                                                 
                                                                                
  
                                                                              
                                                                                
  
                                                            
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const KEY = "site/config.json";
const ADMIN_PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
                                                                     
const ALL_LANGS = ["fr", "de", "en", "pt", "it"] as const;
                                                                              
const DEFAULT_LANGS: string[] = ["fr", "de", "en", "pt", "it"];

                                                                           
const BLOB_PUBLIC_BASE =
  (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";

type SiteConfig = { enabledLangs: string[]; updatedAt: string; version: number };

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

                                                                                          
function normalizeLangs(input: any): string[] {
  let langs = Array.isArray(input) ? input.filter((l: any) => ALL_LANGS.includes(l)) : [];
  if (!langs.includes("fr")) langs = ["fr", ...langs];                        
  langs = ALL_LANGS.filter((l) => langs.includes(l));                            
  return langs.length ? langs : DEFAULT_LANGS;
}

async function readConfig(): Promise<SiteConfig> {
                                                        
  if (BLOB_PUBLIC_BASE) {
    try {
      const url = `${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${KEY}?cb=${Date.now()}`;
      const resp = await fetch(url, { cache: "no-store" });
      if (resp.ok) {
        const d = await resp.json();
        return { enabledLangs: normalizeLangs(d?.enabledLangs), updatedAt: String(d?.updatedAt || ""), version: Number(d?.version || 0) };
      }

    } catch {

    }
  }
                                                                                
  try {
    const { blobs } = await list({ prefix: KEY, limit: 1 });
    if (blobs.length) {
      const resp = await fetch(blobs[0].url, { cache: "no-store" });
      if (resp.ok) {
        const d = await resp.json();
        return { enabledLangs: normalizeLangs(d?.enabledLangs), updatedAt: String(d?.updatedAt || ""), version: Number(d?.version || 0) };
      }
    }
  } catch {

  }
  return { enabledLangs: DEFAULT_LANGS, updatedAt: "", version: 0 };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");

  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }

  if (method === "GET") {
    const cfg = await readConfig();
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).json(cfg);
    return;
  }

  if (method === "POST") {
    if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }
    let body: any;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch {
      res.status(400).json({ error: "invalid JSON body" });
      return;
    }
    if (!Array.isArray(body?.enabledLangs)) {
      res.status(400).json({ error: "enabledLangs (array) required" });
      return;
    }
    const langs = normalizeLangs(body.enabledLangs);
    const cfg: SiteConfig = { enabledLangs: langs, updatedAt: new Date().toISOString(), version: Date.now() };
    try {
      await put(KEY, JSON.stringify(cfg), {
        access: "public",
        contentType: "application/json",
        cacheControlMaxAge: 0,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    } catch (e) {
      res.status(503).json({ error: "storage unavailable", detail: String((e as Error).message || e) });
      return;
    }
    res.status(200).json(cfg);
    return;
  }

  res.status(405).json({ error: "method not allowed" });
}
