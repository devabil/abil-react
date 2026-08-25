   
                                                                                       
  
                                                                                  
                                                                                    
                                                                                
                                                       
  
                                                                                
                                                                                
                                                                              
                                                            
  
                                                                           
                                                                                           
  
                                                                                   
                                                                  
                                                                              
                                                       
   

export type AssetUploadProgress = { loaded: number; total: number; percentage: number };
export type AssetUploadResult = { ok: boolean; url?: string; pathname?: string; error?: string };
export type AssetUploadOpts = {
                                                                                                  
                                                                                                         
                                                                              
                                                                                    
  prefix: "covers" | "assets" | "social" | "email" | "airefs" | "catalog" | "autovideo" | "equipa";
  filename?: string;
  onProgress?: (p: AssetUploadProgress) => void;
};

export interface AssetStore {
                                          
  readonly name: string;
                                                                                          
  uploadAsset(file: File | Blob, opts: AssetUploadOpts): Promise<AssetUploadResult>;
}

const API_UPLOAD_TOKEN = "/api/upload-token";

                                                                                        
function readEnv(key: string): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return (env && env[key]) || "";
  } catch {
    return "";
  }
}

function vaultHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  try { const vt = typeof localStorage !== "undefined" ? localStorage.getItem("abil_vault_token") : null; if (vt) h["x-abil-admin"] = vt; } catch {            }
  return h;
}

function assetFilename(opts: AssetUploadOpts, file: File | Blob): string {
  return opts.filename || (file as File).name || `upload-${Date.now()}`;
}

                                                                                               
const vercelBlobStore: AssetStore = {
  name: "vercel",
  async uploadAsset(file, opts) {
    try {
      const pathname = `${opts.prefix}/${assetFilename(opts, file)}`;
      const { upload } = await import("@vercel/blob/client");
                                                                                                  
                                                                                                
                                                                                                 
                                                                                              
      const MULTIPART_ACIMA_DE = 50 * 1024 * 1024;
      const usarMultipart = (file as File).size > MULTIPART_ACIMA_DE;
                                                                                                     
                                                                                                    
                                                                                                  
                                                                                                   
      console.info(`[upload-blob] ${pathname} ${(((file as File).size || 0) / 1048576).toFixed(1)}MB multipart=${usarMultipart} build=2026-08-11-mpu-abil`);
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: API_UPLOAD_TOKEN,
        headers: vaultHeaders(),
        multipart: usarMultipart,
        contentType: (file as File).type || undefined,
        onUploadProgress: opts.onProgress
          ? (ev) => { try { opts.onProgress!(ev); } catch {  } }
          : undefined,
      });
      return { ok: true, url: blob.url, pathname: blob.pathname };
    } catch (e) {
      return { ok: false, error: String((e as Error).message || e) };
    }
  },
};

   
                                                          
  
                                                                       
                                                                 
                                                         
                                                                             
                                                                                               
  
                                                                                                 
   
const infomaniakStore: AssetStore = {
  name: "infomaniak",
  uploadAsset(file, opts) {
    const url = readEnv("VITE_ASSET_UPLOAD_URL") || "/api/asset-upload";
    return new Promise<AssetUploadResult>((resolve) => {
      try {
        const fname = assetFilename(opts, file);
        const form = new FormData();
        form.append("prefix", opts.prefix);
        form.append("filename", fname);
        form.append("file", file, fname);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        for (const [key, value] of Object.entries(vaultHeaders())) xhr.setRequestHeader(key, value);
        if (opts.onProgress) {
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              try {
                opts.onProgress!({
                  loaded: ev.loaded,
                  total: ev.total,
                  percentage: ev.total > 0 ? Math.round((ev.loaded / ev.total) * 100) : 0,
                });
              } catch {  }
            }
          };
        }
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && data.url) {
              resolve({ ok: true, url: data.url, pathname: data.pathname });
            } else {
              resolve({ ok: false, error: data.error || `HTTP ${xhr.status}` });
            }
          } catch (e) {
            resolve({ ok: false, error: String((e as Error).message || e) });
          }
        };
        xhr.onerror = () => resolve({ ok: false, error: "network error" });
        xhr.send(form);
      } catch (e) {
        resolve({ ok: false, error: String((e as Error).message || e) });
      }
    });
  },
};

   
                                                                                   
                                                                                   
                                                                                 
                                                                                 
                                     
   
const localStore: AssetStore = {
  name: "local",
  async uploadAsset(file, opts) {
    try {
      const { putAssetBlob, makeAssetRef, newAssetId } = await import("./localAssetStore");
      const id = newAssetId(opts.prefix);
      const blob = file instanceof Blob ? file : new Blob([file as BlobPart]);
      await putAssetBlob(id, blob);
      try { opts.onProgress?.({ loaded: blob.size, total: blob.size, percentage: 100 }); } catch {  }
      return { ok: true, url: makeAssetRef(id), pathname: id };
    } catch (e) {
      return { ok: false, error: String((e as Error).message || e) };
    }
  },
};

const STORES: Record<string, AssetStore> = {
  vercel: vercelBlobStore,
  infomaniak: infomaniakStore,
  local: localStore,
};

   
                                                                                   
                                                                                   
                                                                      
   
function activeStoreName(): string {
  try {
    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem("abil_asset_store");
      if (ls && STORES[ls]) return ls;
    }
  } catch {  }
  const env = readEnv("VITE_ASSET_STORE");
  if (env && STORES[env]) return env;
  return "vercel";
}

export function getActiveAssetStore(): AssetStore {
  return STORES[activeStoreName()] || vercelBlobStore;
}

                                                                                           
export function uploadAsset(file: File | Blob, opts: AssetUploadOpts): Promise<AssetUploadResult> {
  return getActiveAssetStore().uploadAsset(file, opts);
}
