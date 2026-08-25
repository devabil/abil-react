   
                                                                    
  
                                                                            
                                                                                
  
                     
                                                                
                                                                    
                                                                   
                                                
              
  
             
                                                                                           
                                                                                  
                                                                                   
                                                                            
  
                                                                      
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put, del } from "@vercel/blob";
import crypto from "node:crypto";
import { decryptVaultText as decrypt, encryptVaultText as encrypt } from "./_vault-crypto.js";

export const config = { runtime: "nodejs" };

                                                                               
                                                                           
                                                                            
                                                                                   
                                                                       
const PREFIX = "store/agent-memory/";
const ADMIN_PW = (typeof process !== "undefined" ? process.env : ({} as any))?.ABIL_ADMIN_AUTH_SECRET || "";
const OPENAI_KEY = (typeof process !== "undefined" ? process.env : ({} as any))?.OPENAI_API_KEY || "";

const VALID_TYPES = new Set(["user_preference", "client_fact", "decision", "correction", "general"]);

type Memory = {
  id: string;
  type: string;
  text: string;
  metadata?: Record<string, unknown>;
  embedding: number[];
  createdAt: string;
};

                                                                     
function sign(exp: number): string { return crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex"); }
function validToken(tok: string | undefined): boolean {
  if (!tok || !ADMIN_PW) return false;
  const [expS, sig] = tok.split(".");
  const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = sign(exp);
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}
function tokenFromReq(req: VercelRequest): string | undefined {
  const h = req.headers["x-abil-admin"];
  return Array.isArray(h) ? h[0] : (h as string | undefined);
}

                               
                                                                            
                                                             
async function readAll(): Promise<Memory[]> {
  const b = await list({ prefix: PREFIX, limit: 1000 });
  const out: Memory[] = [];
  await Promise.all(b.blobs.map(async (blob) => {
    try {
      const r = await fetch(`${blob.url}?cb=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) return;
      const dec = decrypt(await r.text());
      if (!dec) return;
      const m = JSON.parse(dec);
      if (m && m.id && Array.isArray(m.embedding)) out.push(m);
    } catch {  }
  }));
  return out;
}
                                                                               
async function writeOne(mem: Memory): Promise<void> {
  await put(`${PREFIX}${mem.id}.json`, encrypt(JSON.stringify(mem)), {
    access: "public", contentType: "text/plain", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true,
  });
}
                              
async function deleteOne(id: string): Promise<boolean> {
  const b = await list({ prefix: `${PREFIX}${id}.json`, limit: 1 });
  if (b.blobs.length === 0) return false;
  await del(b.blobs[0].url);
  return true;
}

                                      
async function embed(text: string): Promise<number[]> {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY not set");
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!r.ok) throw new Error(`embed ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j: any = await r.json();
  const v = j?.data?.[0]?.embedding;
  if (!Array.isArray(v)) throw new Error("no embedding in response");
  return v;
}

function cosine(a: number[], b: number[]): number {
                                                                                
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}
function readBody(req: VercelRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") { try { resolve(JSON.parse(req.body)); } catch (e) { reject(e); } }
      else resolve(req.body);
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (c: string) => { buf += c; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : null); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function qs(req: VercelRequest, k: string): string | null {
  const v = req.query[k];
  return typeof v === "string" ? v : Array.isArray(v) && v.length ? v[0] : null;
}
function uid(): string { return "mem-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }
  if (!ADMIN_PW) { res.status(503).json({ error: "admin not configured" }); return; }
  if (!validToken(tokenFromReq(req))) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const action = qs(req, "action");

    if (method === "POST" && action === "add") {
      const body = (await readBody(req)) as { text?: string; type?: string; metadata?: Record<string, unknown> } | null;
      const text = String(body?.text || "").trim();
      const type = String(body?.type || "general");
      if (!text || text.length < 3) { res.status(400).json({ error: "text required (>=3 chars)" }); return; }
      if (!VALID_TYPES.has(type)) { res.status(400).json({ error: "invalid type" }); return; }
                                                                              
      const arr = await readAll();
      if (arr.some((m) => m.text === text && m.type === type)) {
        res.status(200).json({ ok: true, dedup: true });
        return;
      }
      const embedding = await embed(text);
      const mem: Memory = { id: uid(), type, text, metadata: body?.metadata, embedding, createdAt: new Date().toISOString() };
      await writeOne(mem);                                       
      res.status(200).json({ ok: true, id: mem.id, type });
      return;
    }

    if (method === "POST" && action === "search") {
      const body = (await readBody(req)) as { q?: string; k?: number; type?: string } | null;
      const q = String(body?.q || "").trim();
      const k = Math.min(Math.max(1, Number(body?.k) || 3), 10);
      const filterType = body?.type ? String(body.type) : null;
      if (!q || q.length < 2) { res.status(400).json({ error: "q required" }); return; }
      const arr = await readAll();
      if (!arr.length) { res.status(200).json({ ok: true, results: [] }); return; }
      const qVec = await embed(q);
      const scored = arr
        .filter((m) => !filterType || m.type === filterType)
        .map((m) => ({ ...m, score: cosine(qVec, m.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map((m) => ({ ...m, embedding: undefined as unknown as number[] }));
      res.status(200).json({ ok: true, results: scored });
      return;
    }

    if (method === "GET" && qs(req, "list") === "1") {
      const arr = await readAll();
      const summary = arr.map((m) => ({ ...m, embedding: undefined as unknown as number[] }));
      res.status(200).json({ ok: true, count: arr.length, memories: summary });
      return;
    }

    if (method === "DELETE") {
      const id = qs(req, "id");
      if (!id) { res.status(400).json({ error: "id required" }); return; }
      const removed = await deleteOne(id);
      res.status(200).json({ ok: true, removed: removed ? 1 : 0 });
      return;
    }

    res.status(400).json({ error: "unknown action; use ?action=add|search OR ?list=1 OR DELETE ?id=X" });
  } catch (e) {
    console.error("[api/agent-memory] error:", e);
    res.status(500).json({ error: String((e as Error).message || e).slice(0, 300) });
  }
}
