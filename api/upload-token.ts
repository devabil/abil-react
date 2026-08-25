   
                                                                                
  
                                                                              
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}

function readBody(req: VercelRequest): Promise<HandleUploadBody> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") {
        try { resolve(JSON.parse(req.body)); } catch (e) { reject(e); }
      } else {
        resolve(req.body as HandleUploadBody);
      }
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (chunk: string) => { buf += chunk; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : ({} as HandleUploadBody)); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function adminOk(req: VercelRequest): boolean {
                                                                                                      
                                                                                               
  const cron = process.env.CRON_SECRET || "";
  const auth = String(req.headers.authorization || "");
  if (cron && auth === `Bearer ${cron}`) return true;
  const password = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  const raw = req.headers["x-abil-admin"];
  const token = Array.isArray(raw) ? raw[0] : String(raw || "");
  const dot = token.indexOf(".");
  if (!password || dot <= 0 || !/^\d+$/.test(token.slice(0, dot))) return false;
  if (Date.now() > Number(token.slice(0, dot))) return false;
  const expected = crypto.createHmac("sha256", password).update(token.slice(0, dot)).digest("hex");
  const actual = token.slice(dot + 1);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(actual);
  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }
  try {
    const body = await readBody(req);
                                                                   
    const url = `https://${req.headers.host || "localhost"}${req.url || "/api/upload-token"}`;
    const shim = new Request(url, {
      method: "POST",
      headers: Object.fromEntries(Object.entries(req.headers).filter(([, v]) => typeof v === "string")) as Record<string, string>,
      body: JSON.stringify(body),
    });
    const jsonResponse = await handleUpload({
      body,
      request: shim,
      onBeforeGenerateToken: async (pathname) => {
                                                                                                          
                                                                                                     
                                                                                 
                                                                                                                
                                                                                       
                                                                                    
                                                                                   
        const safe = ["assets/", "covers/", "social/", "email/", "airefs/", "catalog/", "autovideo/", "equipa/"].some((p) => pathname.startsWith(p));
        if (!safe) throw new Error("invalid pathname; must start with assets/, covers/, social/, email/, airefs/, catalog/, autovideo/ or equipa/");
        return {
                                                                                     
                                                                                       
                                                                                       
                                                                                      
                                                                           
          allowedContentTypes: [
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif",
            "video/mp4", "video/quicktime", "video/webm", "video/x-m4v",
            "application/pdf",
          ],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024,                                                                                                                                   
          addRandomSuffix: true,
                                                                                                        
                                                                                                  
                                                                                               
                                                                                              
                                                                                              
                                                                                             
                                                                                            
          validUntil: Date.now() + 6 * 60 * 60 * 1000,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[upload-token] uploaded:", blob.pathname, blob.url);
      },
    });
    res.status(200).json(jsonResponse);
  } catch (e) {
    console.error("[upload-token] error:", e);
    res.status(400).json({ error: String((e as Error).message || e) });
  }
}
