   
                                                                       
  
                                                    
  
                                                  
                                                         
                                                                               
                                                         
                                                                                
                                                                                
              
   

import { uploadAsset } from "./assetStore";

export type DashboardProjectLike = {
  id: string;
  title: string;
  description?: string;
  cover?: { type: string; src: string };
  assets?: Array<{ type: string; src: string }>;
  categories?: string[];
  teamIds?: string[];
  externalCollaborators?: Array<{ name?: string; role?: string }>;
  publishedAt?: string;
  featured?: boolean;
  featuredOrder?: number;
  updatedAt?: string;
  [k: string]: unknown;
};

const API_PROJECTS = "/api/projects";

function vaultHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...(extra || {}) };
  try {
    const vt = typeof localStorage !== "undefined" ? localStorage.getItem("abil_vault_token") : null;
    if (vt) h["x-abil-admin"] = vt;
  } catch {            }
  return h;
}

                                                                                   
                                                                                           
                                                                            
export type CloudCollection = "projects" | "presentations";
function apiUrl(collection: CloudCollection, extraQuery = ""): string {
  const parts: string[] = [];
  if (collection === "presentations") parts.push("collection=presentations");
  if (extraQuery) parts.push(extraQuery.replace(/^[?&]/, ""));
  return parts.length ? `${API_PROJECTS}?${parts.join("&")}` : API_PROJECTS;
}

const VERSION_HEADER = "x-projects-version";
function etagKey(collection: CloudCollection): string {
  return collection === "presentations" ? "abil_presentations_etag" : "abil_projects_etag";
}

function getStoredEtag(collection: CloudCollection): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(etagKey(collection)); } catch { return null; }
}
function setStoredEtag(collection: CloudCollection, etag: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (etag) window.localStorage.setItem(etagKey(collection), etag);
    else window.localStorage.removeItem(etagKey(collection));
  } catch {  }
}

   
                                                           
  
                                                                                   
                                                                                        
                                                                                           
                                                                                      
  
                              
                                                                                      
                                                                          
                                                                                        
                                                                           
   
const RECENTLY_DELETED_KEY = "abil_recently_deleted_v1";
const RECENTLY_DELETED_TTL_MS = 2 * 60 * 1000;                                                                          

function loadRecentlyDeleted(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(RECENTLY_DELETED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch { return {}; }
}

                                                                                 
export function markRecentlyDeleted(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const map = loadRecentlyDeleted();
    map[id] = Date.now() + RECENTLY_DELETED_TTL_MS;
    window.sessionStorage.setItem(RECENTLY_DELETED_KEY, JSON.stringify(map));
  } catch {  }
}

                                                                                   
export function clearRecentlyDeleted(ids?: string[]): void {
  if (typeof window === "undefined") return;
  try {
    if (!ids) { window.sessionStorage.removeItem(RECENTLY_DELETED_KEY); return; }
    const map = loadRecentlyDeleted();
    for (const id of ids) delete map[id];
    window.sessionStorage.setItem(RECENTLY_DELETED_KEY, JSON.stringify(map));
  } catch {  }
}

                                                                                
export function getRecentlyDeletedIds(): Set<string> {
  const map = loadRecentlyDeleted();
  const now = Date.now();
  const live = new Set<string>();
  let changed = false;
  for (const [id, exp] of Object.entries(map)) {
    if (exp > now) live.add(id);
    else { delete map[id]; changed = true; }
  }
  if (changed && typeof window !== "undefined") {
    try { window.sessionStorage.setItem(RECENTLY_DELETED_KEY, JSON.stringify(map)); } catch {  }
  }
  return live;
}

                                                                                        
export async function cloudFetchTombstones(collection: CloudCollection = "projects"): Promise<Set<string>> {
  try {
    const resp = await fetch(apiUrl(collection, "tombstones=1"), { headers: vaultHeaders() });
    if (!resp.ok) return new Set();
    const data = await resp.json();
    const arr: Array<{ id: string }> = Array.isArray(data?.tombstones) ? data.tombstones : [];
    return new Set(arr.map((t) => t.id).filter(Boolean));
  } catch { return new Set(); }
}

export type CloudFetchResult = {
  changed: boolean;
  projects?: DashboardProjectLike[];
  version?: number;
  etag?: string;
  error?: string;
};

   
                                                                      
                                                                         
                                                                         
  
                                                                            
                                                                                     
                                                                             
   
export const APP_VERSION = "2026-05-21.24";

                                                                      
type VersionMismatchHandler = (serverVersion: string, localVersion: string) => void;
let versionMismatchHandler: VersionMismatchHandler | null = null;
export function onAppVersionMismatch(h: VersionMismatchHandler) {
  versionMismatchHandler = h;
}

                                                     
export async function cloudFetchProjects(opts: { force?: boolean; collection?: CloudCollection } = {}): Promise<CloudFetchResult> {
  if (typeof fetch === "undefined") return { changed: false, error: "fetch unavailable" };
  const collection = opts.collection ?? "projects";
  const headers: Record<string, string> = vaultHeaders();
  if (!opts.force) {
    const etag = getStoredEtag(collection);
    if (etag) headers["If-None-Match"] = etag;
  }
  try {
    const resp = await fetch(apiUrl(collection), { headers, cache: "no-store" });
                                                  
    const serverVersion = resp.headers.get("x-app-version");
    if (serverVersion && serverVersion !== APP_VERSION && versionMismatchHandler) {
      versionMismatchHandler(serverVersion, APP_VERSION);
    }
    if (resp.status === 304) return { changed: false };
                                                                                        
                                                                      
    if (resp.status === 503) {
      const storeError = resp.headers.get("x-store-error") || "storage unavailable";
      return { changed: false, error: `STORE_DOWN: ${storeError}` };
    }
    if (!resp.ok) return { changed: false, error: `HTTP ${resp.status}` };
    const projects = (await resp.json()) as DashboardProjectLike[];
    const etag = resp.headers.get("ETag") || undefined;
    const version = Number(resp.headers.get(VERSION_HEADER) || 0);
    if (etag) setStoredEtag(collection, etag);
    return { changed: true, projects, version, etag };
  } catch (e) {
    return { changed: false, error: String((e as Error).message || e) };
  }
}

   
                                                                    
                                                                            
                                                                            
   
async function parseJsonOrTextError(resp: Response): Promise<{ ok: boolean; data?: { version?: number; snapshotKey?: string }; error?: string }> {
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const data = await resp.json();
      if (!resp.ok) return { ok: false, error: data.error || `HTTP ${resp.status}` };
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: `HTTP ${resp.status} · JSON parse failed: ${String((e as Error).message).slice(0, 60)}` };
    }
  }
                                                     
  try {
    const text = await resp.text();
    const snippet = text.slice(0, 120).replace(/\s+/g, " ").trim();
    if (resp.status === 413) return { ok: false, error: `HTTP 413 · Body demasiado grande (cover/asset >500KB precisa upload Blob primeiro)` };
    if (resp.status === 504) return { ok: false, error: `HTTP 504 · Timeout serverless function` };
    return { ok: false, error: `HTTP ${resp.status} · ${snippet}` };
  } catch {
    return { ok: false, error: `HTTP ${resp.status} · response unreadable` };
  }
}

   
                                                                          
                      
   
export async function cloudUpsertOne(project: DashboardProjectLike, collection: CloudCollection = "projects"): Promise<{ ok: boolean; version?: number; snapshotKey?: string; error?: string }> {
  try {
    const promoted = await promoteHeavyAssetsToBlob([project]);
    const safe = stripHeavyAssets(promoted)[0];
    const resp = await fetch(apiUrl(collection), {
      method: "POST",
      headers: vaultHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(safe),
    });
    const parsed = await parseJsonOrTextError(resp);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    if (parsed.data?.version) setStoredEtag(collection, `"v${parsed.data.version}-private"`);
    return { ok: true, version: parsed.data?.version, snapshotKey: parsed.data?.snapshotKey };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

   
                                                                               
                               
   
export async function cloudUpsertMany(projects: DashboardProjectLike[], collection: CloudCollection = "projects"): Promise<{ ok: boolean; version?: number; snapshotKey?: string; error?: string }> {
  try {
    const promoted = await promoteHeavyAssetsToBlob(projects);
    const safe = stripHeavyAssets(promoted);
                                                                                            
    const bodySize = JSON.stringify(safe).length;
    if (bodySize > 3 * 1024 * 1024) {
      console.warn(`[cloudUpsertMany] body ${(bodySize/1024/1024).toFixed(1)}MB, risco 413. Considere reduzir batch ou usar Blob upload primeiro.`);
    }
    const resp = await fetch(apiUrl(collection), {
      method: "POST",
      headers: vaultHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(safe),
    });
    const parsed = await parseJsonOrTextError(resp);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    if (parsed.data?.version) setStoredEtag(collection, `"v${parsed.data.version}-private"`);
    return { ok: true, version: parsed.data?.version, snapshotKey: parsed.data?.snapshotKey };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

   
                                                                
   
export async function cloudDeleteProject(id: string, collection: CloudCollection = "projects"): Promise<{ ok: boolean; version?: number; snapshotKey?: string; error?: string }> {
  try {
    const resp = await fetch(apiUrl(collection, `id=${encodeURIComponent(id)}`), { method: "DELETE", headers: vaultHeaders() });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error || `HTTP ${resp.status}` };
    setStoredEtag(collection, `"v${data.version}-private"`);
    markRecentlyDeleted(id);                                                                        
    return { ok: true, version: data.version, snapshotKey: data.snapshotKey };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

   
                                                                               
                                                 
   
export async function cloudResetProjects(projects: DashboardProjectLike[], collection: CloudCollection = "projects"): Promise<{ ok: boolean; version?: number; snapshotKey?: string; error?: string }> {
  try {
    const promoted = await promoteHeavyAssetsToBlob(projects);
    const safe = stripHeavyAssets(promoted);
    const resp = await fetch(apiUrl(collection, "reset=1"), {
      method: "PUT",
      headers: vaultHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(safe),
    });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error || `HTTP ${resp.status}` };
    setStoredEtag(collection, `"v${data.version}-private"`);
    return { ok: true, version: data.version, snapshotKey: data.snapshotKey };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

   
                                                   
   
export async function cloudListSnapshots(collection: CloudCollection = "projects"): Promise<{ ok: boolean; snapshots?: Array<{ key: string; url: string; uploadedAt: string; size: number }>; error?: string }> {
  try {
    const resp = await fetch(apiUrl(collection, "snapshots=1"), { headers: vaultHeaders() });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error };
    return { ok: true, snapshots: data.snapshots };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

   
                                                          
   
export async function cloudRestoreSnapshot(snapTs: string, collection: CloudCollection = "projects"): Promise<{ ok: boolean; restoredCount?: number; error?: string }> {
  try {
    const resp = await fetch(apiUrl(collection, `restore=${encodeURIComponent(snapTs)}`), { method: "POST", headers: vaultHeaders() });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error };
    setStoredEtag(collection, `"v${data.version}-private"`);
    return { ok: true, restoredCount: data.restoredCount };
  } catch (e) {
    return { ok: false, error: String((e as Error).message || e) };
  }
}

   
                                                                                         
                                                                                          
   
function normTitle(s: string | undefined): string {
  if (!s) return "";
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

   
                                                                            
                                                                  
                                                                          
   
function dedupeCustomVsDemos<T extends DashboardProjectLike>(arr: T[]): { result: T[]; droppedDemos: number } {
  const customs = arr.filter((p) => p.id && !p.id.startsWith("demo-"));
  const demos = arr.filter((p) => p.id && p.id.startsWith("demo-"));
  if (customs.length === 0 || demos.length === 0) {
    return { result: arr, droppedDemos: 0 };
  }
  const customTitles = new Set(customs.map((p) => normTitle(p.title)));
  const keepDemos = demos.filter((d) => !customTitles.has(normTitle(d.title)));
  const dropped = demos.length - keepDemos.length;
  if (dropped === 0) return { result: arr, droppedDemos: 0 };
  return { result: [...customs, ...keepDemos], droppedDemos: dropped };
}

   
                                               
                                                                       
                                                                          
                                            
                                                                                         
  
                                                                          
   
   
                                                                              
  
                                                                       
                                                                                       
                                                                   
  
                                                                
                                                         
                                                                    
   
export function mergeWithLocal<T extends DashboardProjectLike>(
  cloudArr: T[],
  localArr: T[],
  opts: { cloudIsTruth?: boolean } = {}
): { merged: T[]; addedFromCloud: number; preservedLocal: number; conflicts: number; droppedDuplicates: number; droppedOrphans: number } {
  const cloudMap = new Map(cloudArr.map((p) => [p.id, p] as const));
  const localMap = new Map(localArr.map((p) => [p.id, p] as const));
  const allIds = new Set([...cloudMap.keys(), ...localMap.keys()]);
  let addedFromCloud = 0;
  let preservedLocal = 0;
  let conflicts = 0;
  let droppedOrphans = 0;
  const mergedRaw: T[] = [];
  for (const id of allIds) {
    const c = cloudMap.get(id);
    const l = localMap.get(id);
    if (c && l) {
      const cTime = c.updatedAt ? Date.parse(c.updatedAt) : 0;
      const lTime = l.updatedAt ? Date.parse(l.updatedAt) : 0;
      if (cTime > lTime) mergedRaw.push(c);
      else if (lTime > cTime) { mergedRaw.push(l); conflicts++; }
      else mergedRaw.push(c);
    } else if (c) {
      mergedRaw.push(c);
      addedFromCloud++;
    } else if (l) {
      if (opts.cloudIsTruth) {
                                                
        droppedOrphans++;
      } else {
        mergedRaw.push(l);
        preservedLocal++;
      }
    }
  }
                                                        
  const { result: merged, droppedDemos } = dedupeCustomVsDemos(mergedRaw);
  return { merged, addedFromCloud, preservedLocal, conflicts, droppedDuplicates: droppedDemos, droppedOrphans };
}

   
                                                                  
                                                                   
  
                                                                                 
                                                                                      
                                                                  
                                                                                          
                                                                
   
   
                                                                                        
                                                                                          
                                                                                          
                                                                                                
  
                                                                                    
                                                                               
                                                                                  
                                                                                   
                                                                                
                                                                                 
                                                                   
                                                                                
                                                                      
   
                                                                                          
async function pareceAnimado(file: File | Blob): Promise<boolean> {
  const type = (file as File).type || "";
  if (type === "image/gif") return true;                                        
  if (type === "image/apng") return true;
  if (type !== "image/webp" && type !== "image/png") return false;
  try {
                                                                                  
                                                                              
    const cabeca = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
    const marca = type === "image/webp" ? [0x41, 0x4e, 0x49, 0x4d] : [0x61, 0x63, 0x54, 0x4c];               
    for (let i = 0; i < cabeca.length - 4; i += 1) {
      if (cabeca[i] === marca[0] && cabeca[i + 1] === marca[1] && cabeca[i + 2] === marca[2] && cabeca[i + 3] === marca[3]) return true;
    }
    return false;
  } catch { return false; }
}
async function compressImageForUpload(file: File | Blob): Promise<File | Blob> {
  try {
    const type = (file as File).type || "";
    if (!type.startsWith("image/")) return file;
    if (type === "image/svg+xml") return file;
    if (await pareceAnimado(file)) return file;
    if (file.size <= 350 * 1024) return file;
    if (typeof document === "undefined") return file;
    const url = URL.createObjectURL(file);
    let cleaned = false;
    const cleanup = () => { if (!cleaned) { cleaned = true; try { URL.revokeObjectURL(url); } catch {  } } };
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const MAX = 1920;
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth || MAX, img.naturalHeight || MAX));
    const w = Math.max(1, Math.round((img.naturalWidth || MAX) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || MAX) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { cleanup(); return file; }
    ctx.drawImage(img, 0, 0, w, h);
    cleanup();
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.size >= file.size) return file;
    const baseName = ((file as File).name || "image").replace(/\.[a-z0-9]+$/i, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch { return file; }
}

export async function cloudUploadFile(
  file: File | Blob,
  opts: {
                                                                                               
                                                                                              
                                                                       
    prefix: "covers" | "assets" | "social" | "email" | "airefs" | "catalog" | "autovideo" | "equipa";
    filename?: string;
    onProgress?: (p: { loaded: number; total: number; percentage: number }) => void;
  }
): Promise<{ ok: boolean; url?: string; pathname?: string; error?: string }> {
                                                                                        
  const toUpload = await compressImageForUpload(file);
  const opts2 = (toUpload !== file && (toUpload as File).type === "image/webp")
    ? { ...opts, filename: ((opts.filename || (file as File).name || `upload-${Date.now()}`).replace(/\.[a-z0-9]+$/i, "")) + ".webp" }
    : opts;
  return uploadAsset(toUpload, opts2);
}

   
                                                              
                                                                              
                                                                               
   
const MAX_INLINE_BYTES = 500 * 1024;
const CLOUD_PLACEHOLDER = "/brand/mock-billboard-2.jpg";

   
                                                                                      
                                                                                     
                                                                                          
                                                                                          
                                                                    
   
export async function promoteHeavyAssetsToBlob<T extends DashboardProjectLike>(projects: T[]): Promise<T[]> {
  const LIMIT = 500 * 1024;
  const out: T[] = [];
  for (const p of projects) {
    let cover = p.cover;
    if (cover && cover.src && cover.src.startsWith("data:") && cover.src.length > LIMIT) {
      const f = dataUrlToFile(cover.src, `cover-${p.id}`);
      if (f) {
        const r = await cloudUploadFile(f, { prefix: "covers" });
        if (r.ok && r.url) cover = { ...cover, src: r.url };
        else console.warn(`[promoteHeavyAssetsToBlob] cover upload falhou (${r.error || "?"}) projeto ${p.id}; cairá em stripHeavyAssets`);
      }
    }
    const srcAssets = (p.assets || []) as Array<{ type: string; src: string }>;
    const assets: Array<{ type: string; src: string }> = [];
    for (let i = 0; i < srcAssets.length; i++) {
      let a = srcAssets[i];
      if (a && a.src && a.src.startsWith("data:") && a.src.length > LIMIT) {
        const f = dataUrlToFile(a.src, `asset-${p.id}-${i}`);
        if (f) {
          const r = await cloudUploadFile(f, { prefix: "assets" });
          if (r.ok && r.url) a = { ...a, src: r.url };
          else console.warn(`[promoteHeavyAssetsToBlob] asset[${i}] upload falhou (${r.error || "?"}) projeto ${p.id}; cairá em stripHeavyAssets`);
        }
      }
      assets.push(a);
    }
    out.push({ ...p, cover, assets } as T);
  }
  return out;
}

export function stripHeavyAssets<T extends DashboardProjectLike>(projects: T[]): T[] {
  return projects.map((p) => {
    const cover = p.cover;
    const newCover = cover && cover.src && cover.src.startsWith("data:") && cover.src.length > MAX_INLINE_BYTES
      ? { type: "image", src: CLOUD_PLACEHOLDER }
      : cover;
                                                                                         
                                                                                           
                                                                            
                                                                                          
                                                                                             
                                                                                                
                                                                                                  
    const beforeN = (p.assets || []).length;
    const newAssets = (p.assets || []).filter((a) => {
      const heavyB64 = a && a.src && a.src.startsWith("data:") && a.src.length > MAX_INLINE_BYTES;
      return !heavyB64;
    });
    if (newAssets.length !== beforeN) {
      console.warn(`[stripHeavyAssets] ${beforeN - newAssets.length} asset(s) base64 pesados descartados do payload cloud (preservados no IDB local; migrar→Blob). Projeto ${p.id}`);
    }
    return { ...p, cover: newCover, assets: newAssets };
  });
}

                                         
export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  if (!dataUrl.startsWith("data:")) return null;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2];
  try {
    const bin = atob(b64);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], filename, { type: mime });
  } catch {
    return null;
  }
}
