   
                                                                                    
  
                                                                               
                                                                                 
                                                                                    
                                                                       
  
                                                       
                                                                                  
                                                                               
                                                                                     
                                                                                   
                                                                                     
                                                                                    
                         
  
                                                                                  
                                                                                  
                                      
  
             
                                                                                     
                                                                               
                                                                                   
                                                                                   
  
                                              
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put, del } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

                                                                                                                 
                                                                                                         
const ADMIN_PW = (typeof process !== "undefined" ? process.env : ({} as any))?.ABIL_ADMIN_AUTH_SECRET || "";
function vaultOk(req: VercelRequest): boolean {
  if (!ADMIN_PW) return false;
  const h = req.headers["x-abil-admin"]; const tok = Array.isArray(h) ? h[0] : (h as string | undefined);
  if (!tok) return false;
  const [expS, sig] = tok.split("."); const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}

const STORE_KEY = "store/public.json";
const SNAPSHOTS_PREFIX = "store/snapshots/";
const MAX_SNAPSHOTS = 30;

                                                                                 
                                                                              
const BLOB_PUBLIC_BASE = (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";

type Section = { value: unknown; updatedAt: string };
type PublicDoc = { sections: Record<string, Section>; version: number };

function emptyDoc(): PublicDoc {
  return { sections: {}, version: 0 };
}

function parseDoc(data: unknown): PublicDoc {
  if (data && typeof data === "object" && (data as PublicDoc).sections && typeof (data as PublicDoc).sections === "object") {
    const d = data as PublicDoc;
    return { sections: d.sections, version: typeof d.version === "number" ? d.version : 0 };
  }
  return emptyDoc();
}

async function readDoc(): Promise<{ doc: PublicDoc; storeError?: string }> {
                                                                      
  if (BLOB_PUBLIC_BASE) {
    try {
      const url = `${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${STORE_KEY}?cb=${Date.now()}`;
      const resp = await fetch(url, { cache: "no-store" });
      if (resp.status === 404) return { doc: emptyDoc() };                     
      if (!resp.ok) {
        const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
        return { doc: emptyDoc(), storeError: `blob fetch failed: ${errText.slice(0, 100)}` };
      }
      return { doc: parseDoc(await resp.json()) };
    } catch (e) {
      return { doc: emptyDoc(), storeError: String((e as Error).message || e).slice(0, 200) };
    }
  }
                                         
  try {
    const blobs = await list({ prefix: STORE_KEY, limit: 1 });
    if (blobs.blobs.length === 0) return { doc: emptyDoc() };
    const resp = await fetch(blobs.blobs[0].url, { cache: "no-store" });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
      return { doc: emptyDoc(), storeError: `blob fetch failed: ${errText.slice(0, 100)}` };
    }
    return { doc: parseDoc(await resp.json()) };
  } catch (e) {
    console.error("[api/store] readDoc failed:", e);
    return { doc: emptyDoc(), storeError: String((e as Error).message || e).slice(0, 200) };
  }
}

async function snapshotBeforeWrite(doc: PublicDoc, reason: string): Promise<{ snapshotKey?: string }> {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const key = `${SNAPSHOTS_PREFIX}public-${ts}.json`;
    await put(key, JSON.stringify({ ts: new Date().toISOString(), reason, doc }), {
      access: "public",
      contentType: "application/json",
      cacheControlMaxAge: 0,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return { snapshotKey: key };
  } catch (e) {
    console.error("[api/store] snapshot failed:", e);
    return {};
  }
}

async function gcSnapshots(): Promise<void> {
  try {
    const all = await list({ prefix: SNAPSHOTS_PREFIX, limit: 1000 });
    if (all.blobs.length <= MAX_SNAPSHOTS) return;
    const sorted = all.blobs.slice().sort((a, b) =>
      new Date(a.uploadedAt as unknown as string).getTime() - new Date(b.uploadedAt as unknown as string).getTime());
    for (const b of sorted.slice(0, sorted.length - MAX_SNAPSHOTS)) {
      try { await del(b.url); } catch {  }
    }
  } catch {  }
}

async function writeDoc(doc: PublicDoc, reason: string): Promise<{ version: number; snapshotKey?: string }> {
                                                               
  let snapshotKey: string | undefined;
  const cur = await readDoc();
  if (Object.keys(cur.doc.sections).length > 0) {
    snapshotKey = (await snapshotBeforeWrite(cur.doc, reason)).snapshotKey;
  }
  const version = Date.now();
                                                                                 
                                                                                   
                                                                                   
                                                                                       
                                                                             
  const PRIVADAS_NO_BLOB = new Set(["abil_work_reports", "abil_client_logos", "abil_briefings", "abil_quotes", "abil_crm_leads", "abil_proposal_events", "abil_quote_feedback_v1"]);
  const seccoesPublicaveis: Record<string, unknown> = {};
  for (const k of Object.keys(doc.sections)) if (!PRIVADAS_NO_BLOB.has(k)) seccoesPublicaveis[k] = doc.sections[k];
  const body = JSON.stringify({ sections: seccoesPublicaveis, version, reason });
  await put(STORE_KEY, body, {
    access: "public",
    contentType: "application/json",
    cacheControlMaxAge: 0,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  gcSnapshots().catch((e) => console.warn("[api/store] snapshot-gc", e));
  return { version, snapshotKey };
}

function setCors(req: VercelRequest, res: VercelResponse) {
                                                                                       
                                                                                            
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, If-None-Match, x-abil-admin");
  res.setHeader("Access-Control-Expose-Headers", "x-store-version, ETag, x-snapshot-key");
}

function readBody(req: VercelRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") { try { resolve(JSON.parse(req.body)); } catch (e) { reject(e); } }
      else { resolve(req.body); }
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (c: string) => { buf += c; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : null); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

function getQueryString(req: VercelRequest, key: string): string | null {
  const v = req.query[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return null;
}

type Update = { key: string; value: unknown };

function collectUpdates(body: unknown): Update[] {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (Array.isArray(b.updates)) {
      return (b.updates as unknown[]).filter(
        (u): u is Update => !!u && typeof u === "object" && typeof (u as Update).key === "string",
      );
    }
    if (typeof b.key === "string") return [{ key: b.key, value: b.value }];
  }
  return [];
}

                                                                                 
                                                                                  
                                                                             
                                                                         
                                                                                  
                                                                                
                                                                                   
                                                                                   
                                                                              
                                                                                
                                                         
                                                                                                  
const NUNCA_PUBLICO = new Set(["abil_work_reports", "abil_client_logos", "abil_briefings", "abil_quotes", "abil_crm_leads", "abil_proposal_events", "abil_quote_feedback_v1"]);

function semSeccoesPrivadas(sections: Record<string, unknown>): Record<string, unknown> {
  const limpo: Record<string, unknown> = {};
  for (const k of Object.keys(sections)) if (!NUNCA_PUBLICO.has(k)) limpo[k] = sections[k];
  return limpo;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }
  if ((method === "POST" || method === "DELETE") && !vaultOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    if (method === "GET") {
      const { doc, storeError } = await readDoc();
      if (storeError) {
        res.setHeader("x-store-error", storeError.replace(/[^\x20-\x7E]/g, " ").slice(0, 200));
        res.status(503).json({ error: "storage unavailable", detail: storeError });
        return;
      }
      const etag = `"sv${doc.version}"`;
      res.setHeader("ETag", etag);
      res.setHeader("x-store-version", String(doc.version));
      const ifNoneMatch = req.headers["if-none-match"];
      if (ifNoneMatch && ifNoneMatch === etag) { res.status(304).end(); return; }
      const key = getQueryString(req, "key");
      if (key) {
                                                                             
                                                        
        const s = NUNCA_PUBLICO.has(key) ? undefined : doc.sections[key];
        if (!s) { res.status(404).json({ error: "not found", key }); return; }
        res.status(200).json({ key, value: s.value, updatedAt: s.updatedAt });
        return;
      }
      res.status(200).json({ sections: semSeccoesPrivadas(doc.sections), version: doc.version });
      return;
    }

    if (method === "POST") {
      const body = await readBody(req);
      const updates = collectUpdates(body);
      if (updates.length === 0) {
        res.status(400).json({ error: "body must be {key,value} or {updates:[{key,value}...]}" });
        return;
      }
      const { doc, storeError } = await readDoc();
      if (storeError) {
                                                                                     
        res.setHeader("x-store-error", storeError.replace(/[^\x20-\x7E]/g, " ").slice(0, 200));
        res.status(503).json({ error: "storage unavailable, write aborted", detail: storeError });
        return;
      }
      const now = new Date().toISOString();
      for (const u of updates) {
        doc.sections[u.key] = { value: u.value, updatedAt: now };
      }
      const { version, snapshotKey } = await writeDoc(doc, `upsert:${updates.map((u) => u.key).slice(0, 5).join(",")}`);
      if (snapshotKey) res.setHeader("x-snapshot-key", snapshotKey);
      res.setHeader("x-store-version", String(version));
      res.status(200).json({ ok: true, updated: updates.map((u) => u.key), version, snapshotKey });
      return;
    }

    if (method === "DELETE") {
      const key = getQueryString(req, "key");
      if (!key) { res.status(400).json({ error: "key required" }); return; }
      const { doc, storeError } = await readDoc();
      if (storeError) {
        res.setHeader("x-store-error", storeError.replace(/[^\x20-\x7E]/g, " ").slice(0, 200));
        res.status(503).json({ error: "storage unavailable, delete aborted", detail: storeError });
        return;
      }
      if (doc.sections[key] === undefined) {
        res.status(200).json({ ok: true, removed: 0, note: "key already absent" });
        return;
      }
      delete doc.sections[key];
      const { version, snapshotKey } = await writeDoc(doc, `delete:${key}`);
      if (snapshotKey) res.setHeader("x-snapshot-key", snapshotKey);
      res.setHeader("x-store-version", String(version));
      res.status(200).json({ ok: true, removed: 1, key, version });
      return;
    }

    res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error("[api/store] handler error:", e);
    res.status(500).json({ error: String((e as Error).message || e) });
  }
}
