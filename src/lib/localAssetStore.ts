   
                                                                                     
  
                                                                                  
                                                                                     
                                                                        
  
                                                                                        
                                                                                   
                                                                                   
                                                                                      
                                                                     
  
                                                                                   
                                                              
  
                                                                                      
                                                                               
   

const DB_NAME = "abil-assets-db";
const STORE = "assets";
const SCHEME = "idb-asset://";

function openAssetsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

                                                                                              
export function isAssetRef(v: unknown): v is string {
  return typeof v === "string" && v.startsWith(SCHEME);
}
export function makeAssetRef(id: string): string {
  return SCHEME + id;
}
export function assetRefId(ref: string): string {
  return ref.startsWith(SCHEME) ? ref.slice(SCHEME.length) : ref;
}

                                       
export function newAssetId(prefix = "a"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function putAssetBlob(id: string, blob: Blob): Promise<void> {
  const db = await openAssetsDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getAssetBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openAssetsDB();
    try {
      return await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => resolve((req.result as Blob) || null);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

                                                                               
                                                        
const urlCache = new Map<string, string>();

                                                                       
export async function getAssetObjectUrl(idOrRef: string): Promise<string | null> {
  const id = assetRefId(idOrRef);
  const cached = urlCache.get(id);
  if (cached) return cached;
  const blob = await getAssetBlob(id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

                                                                                            
export function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!m) return null;
  try {
    const mime = m[1];
    const bin = atob(m[2]);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

                                                                                     
const ASSET_FIELDS = ["src", "posterSrc", "previewSrc", "compressedFullSrc"] as const;

                                                                           
                                                                            
                                                             
const urlToRef = new Map<string, string>();

   
                                                                                    
                                                                                 
                                                                                 
                                                                 
   
export async function hydrateProjectRefs<T = any>(projects: T[]): Promise<T[]> {
  if (!Array.isArray(projects)) return projects;
  for (const p of projects as any[]) {
    if (!p) continue;
    const objs = [p.cover, ...(Array.isArray(p.assets) ? p.assets : [])];
    for (const obj of objs) {
      if (!obj) continue;
      for (const f of ASSET_FIELDS) {
        const v = obj[f];
        if (isAssetRef(v)) {
          const url = await getAssetObjectUrl(v);
          if (url) { obj[f] = url; urlToRef.set(url, v); }
        }
      }
    }
  }
  return projects;
}

   
                                                                                 
                                                                                    
                                                                              
   
export function dehydrateProjectRefs<T = any>(projects: T[]): T[] {
  if (!Array.isArray(projects)) return projects;
  const mapObj = (obj: any) => {
    if (!obj) return obj;
    let copy = obj;
    for (const f of ASSET_FIELDS) {
      const v = obj[f];
      if (typeof v === "string" && urlToRef.has(v)) {
        if (copy === obj) copy = { ...obj };
        copy[f] = urlToRef.get(v);
      }
    }
    return copy;
  };
  return (projects as any[]).map((p) => {
    if (!p) return p;
    const cover = mapObj(p.cover);
    const assets = Array.isArray(p.assets) ? p.assets.map(mapObj) : p.assets;
    if (cover === p.cover && assets === p.assets) return p;
    return { ...p, cover, assets };
  }) as T[];
}

                                                            
export async function countAssets(): Promise<number> {
  try {
    const db = await openAssetsDB();
    try {
      return await new Promise<number>((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => reject(req.error);
      });
    } finally {
      db.close();
    }
  } catch {
    return 0;
  }
}
