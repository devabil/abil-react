   
                                                                 
  
                                                                              
  
                                                             
                                                                   
                                                                            
                                                                   
                                                                               
                                          
                                                           
  
                                                                  
  
             
                                                          
                                                             
                                                                       
                                                              
                                                                                               
                                                                        
                                                                                                   
  
                                                            
   

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

const MAX_SNAPSHOTS = 30;                                

                                                                                  
                                                                                    
                                                                                      
                                                                               
type StoreKeys = { all: string; snapshots: string; tombstones: string; isProjects: boolean };
function keysFor(collection: string | null): StoreKeys {
  if (collection === "presentations") {
    return {
      all: "presentations/all.json",
      snapshots: "presentations/snapshots/",
      tombstones: "presentations/tombstones.json",
      isProjects: false,
    };
  }
  return {
    all: "projects/all.json",
    snapshots: "projects/snapshots/",
    tombstones: "projects/tombstones.json",
    isProjects: true,
  };
}

                                                          
                                                                               
                                                                                    
                                                                                    
                                                                                 
                                                                    
const BLOB_PUBLIC_BASE = (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";

                                                                                     
                                                                           
                                                                              
                                                                         
const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;           
type Tombstone = { id: string; deletedAt: string; expiresAt: string };
type TombstoneStore = { tombstones: Tombstone[]; version: number };

type DashboardProject = {
  id: string;
  title: string;
  description?: string;
  cover?: { type: string; src: string };
  assets?: Array<{ type: string; src: string }>;
  categories?: string[];
  teamIds?: string[];
  externalCollaborators?: Array<{ name?: string; role?: string }>;
  publishedAt?: string;
  hidden?: boolean;
  featured?: boolean;
  featuredOrder?: number;
  updatedAt?: string;
  [k: string]: unknown;
};

function parseReadResult(data: unknown, fallbackVersion: number): { projects: DashboardProject[]; version: number } {
  if (Array.isArray(data)) {
    return { projects: data as DashboardProject[], version: fallbackVersion };
  }
  if (data && Array.isArray((data as { projects?: unknown }).projects)) {
    const v = (data as { version?: number }).version;
    return { projects: (data as { projects: DashboardProject[] }).projects, version: (typeof v === "number" && v) || fallbackVersion };
  }
  return { projects: [], version: 0 };
}

async function readAll(k: StoreKeys): Promise<{ projects: DashboardProject[]; version: number; sourceUrl?: string; storeError?: string }> {
                                                                                
                                                                                   
                                                                                 
  if (BLOB_PUBLIC_BASE) {
    try {
      const url = `${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${k.all}?cb=${Date.now()}`;
      const resp = await fetch(url, { cache: "no-store" });
      if (resp.status === 404) return { projects: [], version: 0 };                                
      if (!resp.ok) {
        const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
        return { projects: [], version: 0, storeError: `blob fetch failed: ${errText.slice(0, 100)}` };
      }
      const data = await resp.json();
      const parsed = parseReadResult(data, Date.now());
      return { ...parsed, sourceUrl: url };
    } catch (e) {
      return { projects: [], version: 0, storeError: String((e as Error).message || e).slice(0, 200) };
    }
  }

                                                                            
                                                                             
  try {
    const blobs = await list({ prefix: k.all, limit: 1 });
    if (blobs.blobs.length === 0) return { projects: [], version: 0 };
    const blob = blobs.blobs[0];
    const resp = await fetch(blob.url, { cache: "no-store" });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
      return { projects: [], version: 0, storeError: `blob fetch failed: ${errText.slice(0, 100)}` };
    }
    const data = await resp.json();
    const parsed = parseReadResult(data, Date.parse(blob.uploadedAt as unknown as string) || 0);
    return { ...parsed, sourceUrl: blob.url };
  } catch (e) {
    console.error("[api/projects] readAll failed:", e);
    return { projects: [], version: 0, storeError: String((e as Error).message || e).slice(0, 200) };
  }
}

   
                                                                                 
                                                               
   
async function snapshotBeforeWrite(k: StoreKeys, projects: DashboardProject[], reason: string): Promise<{ snapshotKey?: string; error?: string }> {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const key = `${k.snapshots}all-${ts}.json`;
    const body = JSON.stringify({
      ts: new Date().toISOString(),
      reason,
      count: projects.length,
      projects,
    });
    await put(key, body, {
      access: "public",
      contentType: "application/json",
      cacheControlMaxAge: 0,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return { snapshotKey: key };
  } catch (e) {
    console.error("[api/projects] snapshot failed:", e);
    return { error: String((e as Error).message || e) };
  }
}

   
                                                                                   
                                                                                
                                                                            
                                                  
   
function normTitle(s: string | undefined): string {
  if (!s) return "";
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}
function serverDedupeCustomVsDemos(arr: DashboardProject[]): { result: DashboardProject[]; dropped: number } {
  const customs = arr.filter((p) => p.id && !p.id.startsWith("demo-"));
  const demos = arr.filter((p) => p.id && p.id.startsWith("demo-"));
  if (customs.length === 0 || demos.length === 0) return { result: arr, dropped: 0 };
  const customTitles = new Set(customs.map((p) => normTitle(p.title)));
  const keepDemos = demos.filter((d) => !customTitles.has(normTitle(d.title)));
  const dropped = demos.length - keepDemos.length;
  if (dropped === 0) return { result: arr, dropped: 0 };
  return { result: [...customs, ...keepDemos], dropped };
}

   
                                                                              
                                                                       
                                                                         
  
                                                                
   
   
                                                   
   
function parseTombstones(data: any): TombstoneStore {
  if (Array.isArray(data?.tombstones)) {
                              
    const now = Date.now();
    const active = (data.tombstones as Tombstone[]).filter((t) => {
      const exp = Date.parse(t.expiresAt);
      return Number.isFinite(exp) && exp > now;
    });
    return { tombstones: active, version: data.version || 0 };
  }
  return { tombstones: [], version: 0 };
}

async function readTombstones(k: StoreKeys): Promise<TombstoneStore> {
                                                                              
                                                                                        
                                                                                     
                                                                              
                                        
  if (BLOB_PUBLIC_BASE) {
    try {
      const url = `${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${k.tombstones}?cb=${Date.now()}`;
      const resp = await fetch(url, { cache: "no-store" });
      if (resp.status === 404) return { tombstones: [], version: 0 };                                 
      if (!resp.ok) return { tombstones: [], version: 0 };
      return parseTombstones(await resp.json());
    } catch (e) {
      console.warn("[tombstones] fast read failed:", e);
      return { tombstones: [], version: 0 };
    }
  }
                                                         
  try {
    const blobs = await list({ prefix: k.tombstones, limit: 1 });
    if (blobs.blobs.length === 0) return { tombstones: [], version: 0 };
    const resp = await fetch(blobs.blobs[0].url, { cache: "no-store" });
    if (!resp.ok) return { tombstones: [], version: 0 };
    return parseTombstones(await resp.json());
  } catch (e) {
    console.warn("[tombstones] read failed:", e);
    return { tombstones: [], version: 0 };
  }
}

async function writeTombstones(k: StoreKeys, store: TombstoneStore): Promise<void> {
  try {
    const body = JSON.stringify({ tombstones: store.tombstones, version: Date.now() });
    await put(k.tombstones, body, {
      access: "public",
      contentType: "application/json",
      cacheControlMaxAge: 0,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (e) {
    console.warn("[tombstones] write failed:", e);
  }
}

async function addTombstone(k: StoreKeys, id: string): Promise<void> {
  const current = await readTombstones(k);
                                                                    
  const others = current.tombstones.filter((t) => t.id !== id);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOMBSTONE_TTL_MS);
  others.push({ id, deletedAt: now.toISOString(), expiresAt: expiresAt.toISOString() });
  await writeTombstones(k, { tombstones: others, version: Date.now() });
}

                                                                                         
                                                                                      
                                                                   
async function removeTombstones(k: StoreKeys, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const idSet = new Set(ids);
  const current = await readTombstones(k);
  const kept = current.tombstones.filter((t) => !idSet.has(t.id));
  const removed = current.tombstones.length - kept.length;
  if (removed > 0) await writeTombstones(k, { tombstones: kept, version: Date.now() });
  return removed;
}

function filterTombstoned(arr: DashboardProject[], tombstoneIds: Set<string>): { result: DashboardProject[]; dropped: string[] } {
  const dropped: string[] = [];
  const result = arr.filter((p) => {
    if (p.id && tombstoneIds.has(p.id)) {
      dropped.push(p.id);
      return false;
    }
    return true;
  });
  return { result, dropped };
}

async function writeAll(k: StoreKeys, projects: DashboardProject[], reason: string, exemptTombstoneIds?: Set<string>): Promise<{ version: number; snapshotKey?: string; dedupedDemos?: number; blacklisted?: number; tombstoned?: number }> {
                                                                           
                                                                                      
                                                                                         
  const notBlacklisted = projects;
  const blacklisted: string[] = [];
                                                                                          
                                                                                       
                                                                                       
                                                                                   
                                                                                      
                                                                                      
  const tombStore = await readTombstones(k);
  const tombIds = new Set(
    tombStore.tombstones.map((t) => t.id).filter((id) => !(exemptTombstoneIds && exemptTombstoneIds.has(id)))
  );
  const { result: notTombstoned, dropped: tombstoned } = filterTombstoned(notBlacklisted, tombIds);
  if (tombstoned.length > 0) {
    console.log(`[api/projects] TOMBSTONED ${tombstoned.length} IDs rejeitados (apagados anteriormente): ${tombstoned.join(", ")}`);
  }
                                                                                         
  const { result: dedupedProjects, dropped: dedupedDemos } = k.isProjects ? serverDedupeCustomVsDemos(notTombstoned) : { result: notTombstoned, dropped: 0 };
                                                       
  const current = await readAll(k);
  let snapshotKey: string | undefined;
  if (current.projects.length > 0) {
    const snap = await snapshotBeforeWrite(k, current.projects, reason + (dedupedDemos ? ` (dedupe:${dedupedDemos})` : ""));
    snapshotKey = snap.snapshotKey;
  }
  const version = Date.now();
  const body = JSON.stringify({ projects: dedupedProjects, version, reason });
  await put(k.all, body, {
    access: "public",
    contentType: "application/json",
    cacheControlMaxAge: 0,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  gcSnapshots(k).catch((e) => console.warn("[snapshot-gc]", e));
  return { version, snapshotKey, dedupedDemos, blacklisted: blacklisted.length, tombstoned: tombstoned.length };
}

async function gcSnapshots(k: StoreKeys): Promise<void> {
  try {
    const all = await list({ prefix: k.snapshots, limit: 1000 });
    if (all.blobs.length <= MAX_SNAPSHOTS) return;
                                                           
    const sorted = all.blobs.slice().sort((a, b) =>
      new Date(a.uploadedAt as unknown as string).getTime() -
      new Date(b.uploadedAt as unknown as string).getTime()
    );
    const toDelete = sorted.slice(0, sorted.length - MAX_SNAPSHOTS);
    for (const b of toDelete) {
      try { await del(b.url); } catch {  }
    }
  } catch {  }
}

                                                                   
                                                                        
                                                 
  
                                                                                      
                                                                              
const SERVER_APP_VERSION = "2026-05-21.24";

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, If-None-Match, x-abil-admin");
  res.setHeader("Access-Control-Expose-Headers", "x-projects-version, ETag, x-snapshot-key, x-app-version");
  res.setHeader("x-app-version", SERVER_APP_VERSION);
}

function readBody(req: VercelRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") {
        try { resolve(JSON.parse(req.body)); } catch (e) { reject(e); }
      } else { resolve(req.body); }
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (chunk: string) => { buf += chunk; });
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

   
                                                                      
          
                                                          
                                                                                      
                                                               
   
function mergeUpserts(existing: DashboardProject[], upserts: DashboardProject[]): DashboardProject[] {
  const map = new Map(existing.map((p) => [p.id, p] as const));
  for (const u of upserts) {
    if (u && typeof u.id === "string" && u.id.length > 0) {
      map.set(u.id, { ...u, updatedAt: new Date().toISOString() });
    }
  }
  return Array.from(map.values());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  const method = (req.method || "GET").toUpperCase();
  const isAuthed = vaultOk(req);
  if (method === "OPTIONS") { res.status(204).end(); return; }
  if ((method === "POST" || method === "PUT" || method === "DELETE") && !isAuthed) { res.status(401).json({ error: "unauthorized" }); return; }

                                                                                 
  const k = keysFor(getQueryString(req, "collection"));

  try {
                                                                        
    if (method === "GET" && getQueryString(req, "tombstones") === "1") {
      if (!isAuthed) { res.status(401).json({ error: "unauthorized" }); return; }
      const ts = await readTombstones(k);
      res.status(200).json({ count: ts.tombstones.length, version: ts.version, tombstones: ts.tombstones });
      return;
    }

                                                                
    if (method === "GET" && getQueryString(req, "snapshots") === "1") {
      if (!isAuthed) { res.status(401).json({ error: "unauthorized" }); return; }
      const blobs = await list({ prefix: k.snapshots, limit: 100 });
      const snaps = blobs.blobs
        .map((b) => ({
          key: b.pathname,
          url: b.url,
          uploadedAt: b.uploadedAt,
          size: b.size,
        }))
        .sort((a, b) => new Date(b.uploadedAt as unknown as string).getTime() - new Date(a.uploadedAt as unknown as string).getTime());
      res.status(200).json({ count: snaps.length, snapshots: snaps });
      return;
    }

                                                                                      
                                                                                            
                                                                                            
                                                                                      
    if (method === "POST" && getQueryString(req, "tombstoneIds")) {
      const ids = getQueryString(req, "tombstoneIds")!.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) { res.status(400).json({ error: "tombstoneIds vazio" }); return; }
      const store = await readTombstones(k);
      const existing = new Set(store.tombstones.map((t) => t.id));
      const now = new Date();
      const expiresAt = new Date(now.getTime() + TOMBSTONE_TTL_MS).toISOString();
      let added = 0;
      for (const id of ids) {
        if (!existing.has(id)) { store.tombstones.push({ id, deletedAt: now.toISOString(), expiresAt }); existing.add(id); added++; }
      }
      await writeTombstones(k, { tombstones: store.tombstones, version: Date.now() });
                                                            
      const all = await readAll(k);
      const idSet = new Set(ids);
      const remaining = all.projects.filter((p) => !idSet.has(p.id));
      let version = all.version;
      if (remaining.length !== all.projects.length) {
        const w = await writeAll(k, remaining, `bulk-tombstone-${ids.length}`);
        version = w.version;
      }
      res.status(200).json({ ok: true, requested: ids.length, added, totalTombstones: store.tombstones.length, version });
      return;
    }

                                                                               
    if (method === "POST" && getQueryString(req, "restore")) {
      const snapTs = getQueryString(req, "restore")!;
      const target = await list({ prefix: `${k.snapshots}all-${snapTs}`, limit: 1 });
      if (target.blobs.length === 0) {
        res.status(404).json({ error: `snapshot ${snapTs} not found` });
        return;
      }
      const resp = await fetch(target.blobs[0].url, { cache: "no-store" });
      const data = await resp.json();
      const restored = data?.projects;
      if (!Array.isArray(restored)) {
        res.status(500).json({ error: "snapshot malformed" });
        return;
      }
                                                                                    
                                                                                     
                                                                                     
      const restoredIds = (restored as DashboardProject[]).map((p) => p.id).filter(Boolean);
      const clearedTombstones = await removeTombstones(k, restoredIds);
                                                                                           
                                                                            
      const { version, snapshotKey } = await writeAll(k, restored as DashboardProject[], `restore-from-${snapTs}`, new Set(restoredIds));
      if (snapshotKey) res.setHeader("x-snapshot-key", snapshotKey);
      res.setHeader("x-projects-version", String(version));
      res.status(200).json({ ok: true, restoredCount: restored.length, clearedTombstones, version, fromSnapshot: snapTs, preRestoreSnapshot: snapshotKey });
      return;
    }

                                           
    if (method === "GET") {
      const id = getQueryString(req, "id");
      const ifNoneMatch = req.headers["if-none-match"];
      const { projects, version, storeError } = await readAll(k);
                                                                          
                                                                                         
      if (storeError) {
                                                                                
                                                                                      
                                                                
        const safeHeader = storeError.replace(/[^\x20-\x7E]/g, " ").slice(0, 200);
        res.setHeader("x-store-error", safeHeader);
        res.status(503).json({ error: "storage unavailable", detail: storeError });
        return;
      }
      const etag = `"v${version}-${isAuthed ? "private" : "public"}"`;
      res.setHeader("ETag", etag);
      res.setHeader("x-projects-version", String(version));
      res.setHeader("Vary", "Origin, x-abil-admin");
      if (ifNoneMatch && ifNoneMatch === etag) { res.status(304).end(); return; }
                                                                                       
                                                                                     
                                                                                       
                                                                                      
                                                                               
      const tomb = await readTombstones(k);
      const tombIds = new Set(tomb.tombstones.map((t) => t.id));
      const liveProjects = tombIds.size > 0 ? projects.filter((p) => !tombIds.has(p.id)) : projects;
      const readableProjects = (!isAuthed && k.isProjects)
        ? liveProjects.filter((p) => !p.hidden && typeof p.publishedAt === "string" && p.publishedAt.trim().length > 0)
        : liveProjects;
      if (id) {
        const p = readableProjects.find((x) => x.id === id);
        if (!p) { res.status(404).json({ error: "not found" }); return; }
        res.status(200).json(p);
        return;
      }
      res.status(200).json(readableProjects);
      return;
    }

                                                              
    if (method === "POST") {
      const body = await readBody(req);
      const upserts: DashboardProject[] = Array.isArray(body)
        ? (body as DashboardProject[])
        : (body && typeof body === "object" && typeof (body as DashboardProject).id === "string")
          ? [body as DashboardProject]
          : [];
      if (upserts.length === 0) {
        res.status(400).json({ error: "body must be project (with id) or array" });
        return;
      }
      const valid = upserts.every((p) => p && typeof p.id === "string" && typeof p.title === "string");
      if (!valid) {
        res.status(400).json({ error: "each project requires id + title strings" });
        return;
      }
      const { projects: existing } = await readAll(k);
      const merged = mergeUpserts(existing, upserts);
      const { version, snapshotKey } = await writeAll(k, merged, `upsert-${upserts.length}-ids:${upserts.map(u=>u.id).slice(0,3).join(',')}`);
      if (snapshotKey) res.setHeader("x-snapshot-key", snapshotKey);
      res.setHeader("x-projects-version", String(version));
      res.status(200).json({ ok: true, upserted: upserts.length, totalAfter: merged.length, version, snapshotKey });
      return;
    }

                                                                                  
    if (method === "PUT") {
      if (getQueryString(req, "reset") !== "1") {
        res.status(400).json({ error: "PUT requires ?reset=1 to confirm full overwrite. Use POST for non-destructive upsert." });
        return;
      }
      const body = await readBody(req);
      if (!Array.isArray(body)) {
        res.status(400).json({ error: "body must be array of projects" });
        return;
      }
      const valid = (body as DashboardProject[]).every((p) => p && typeof p.id === "string" && typeof p.title === "string");
      if (!valid) {
        res.status(400).json({ error: "each project requires id + title strings" });
        return;
      }
                                                                                        
                                                                                            
                                                                                    
      const resetIds = (body as DashboardProject[]).map((p) => p.id).filter(Boolean);
      const clearedTombstones = await removeTombstones(k, resetIds);
      const { version, snapshotKey } = await writeAll(k, body as DashboardProject[], "PUT-reset-all", new Set(resetIds));
      if (snapshotKey) res.setHeader("x-snapshot-key", snapshotKey);
      res.setHeader("x-projects-version", String(version));
      res.status(200).json({ ok: true, count: body.length, clearedTombstones, version, snapshotKey });
      return;
    }

                                       
    if (method === "DELETE") {
      const id = getQueryString(req, "id");
      if (!id) { res.status(400).json({ error: "id required" }); return; }
      const { projects } = await readAll(k);
      const next = projects.filter((p) => p.id !== id);
      const wasPresent = next.length !== projects.length;
                                                                                      
                                                                              
      await addTombstone(k, id);
      if (!wasPresent) {
        res.setHeader("x-tombstoned", "1");
        res.status(200).json({ ok: true, removed: 0, count: projects.length, tombstoned: true, note: "id already absent, tombstone added" });
        return;
      }
      const { version, snapshotKey } = await writeAll(k, next, `delete-${id}`);
      if (snapshotKey) res.setHeader("x-snapshot-key", snapshotKey);
      res.setHeader("x-projects-version", String(version));
      res.setHeader("x-tombstoned", "1");
                                                                                 
                                                                              
                                                                                
                                                                              
                                                                             
                                                                
      const apagados = await (async () => {
        try {
          const alvo = projects.find((p) => p.id === id);
          if (!alvo) return 0;
          const urlsDe = (p: unknown): string[] => {
            const out: string[] = [];
            const anda = (v: unknown) => {
              if (!v) return;
              if (typeof v === "string") { if (/^https?:\/\/[^/]*\.blob\.vercel-storage\.com\//.test(v)) out.push(v); return; }
              if (Array.isArray(v)) { v.forEach(anda); return; }
              if (typeof v === "object") { Object.values(v as Record<string, unknown>).forEach(anda); }
            };
            anda(p);
            return out;
          };
          const meus = Array.from(new Set(urlsDe(alvo)));
          if (!meus.length) return 0;
          const aindaUsados = new Set(next.flatMap((p) => urlsDe(p)));
          const paraApagar = meus.filter((u) => !aindaUsados.has(u));
          if (!paraApagar.length) return 0;
                                                          
          for (let i = 0; i < paraApagar.length; i += 50) {
            await del(paraApagar.slice(i, i + 50)).catch((e) => console.error("[projects] del falhou:", e));
          }
          return paraApagar.length;
        } catch (e) { console.error("[projects] limpeza do Blob falhou:", e); return 0; }
      })();
      res.setHeader("x-blob-removed", String(apagados));
      res.status(200).json({ ok: true, removed: 1, count: next.length, version, snapshotKey, tombstoned: true, ficheirosApagados: apagados });
      return;
    }

    res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error("[api/projects] handler error:", e);
    res.status(500).json({ error: String((e as Error).message || e) });
  }
}
