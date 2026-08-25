   
                                                                                        
  
                                                                                   
                                                                                               
                                                                                                     
  
                                                                                     
                                                                                                            
                                                                                      
  
                                                                                                       
   
import { useEffect, useState } from "react";

const CLOUD_ENABLED = import.meta.env.PROD;
const STORE_URL = "/api/store";
const POLL_MS = 12000;
const WRITE_DEBOUNCE_MS = 900;
                                                                                              
                                                                                        
                                                                         
const WRITE_GRACE_MS = 20000;

type Section = { value: unknown; updatedAt: string };
type Listener = () => void;

                                                               
                                                                                                      
export const PUBLIC_CLOUD_KEYS: string[] = [
  "abil_blog_posts_v1", "abil_blog_drafts", "abil_blog_author_extras_v2", "abil_blog_author_patches_v2",
  "abil_social_cards_v2", "abil_social_calendar",
  "abil_banner_data",
  "abil_atelier_team_extras", "abil_atelier_team_removed", "abil_atelier_timeline_extras", "abil_dash_team",
  "abil_email_template_extras_v2", "abil_email_template_patches_v2", "abil_email_ai_images_v1",
  "abil_seo", "abil_voice_lists",
  "abil_lang_default",
  "abil_site_edits_inline",
  "abil_pages_visibility_v2",
                                                                                 
                                                                                  
                                                                                 
                                                                                   
                                                                             
                                                                                   
                                                                                  
                                                                                                                          
  "abil_blog_autoplan_v2", "abil_social_autoplan_instagram", "abil_social_autoplan_linkedin", "abil_social_autoplan_facebook", "abil_social_autoplan_tiktok", "abil_email_autoplan", "abil_autoplan_lastrun_v1",
                                                                                                                        
                                                                                                                   
  "abil_autoplan_rotidx_v1",
                                                                                                                     
  "abil_image_catalog_v1",
                                                                                                                                
  "abil_content_pauta_v1",
                                                                                                                                 
  "abil_video_jobs_v1",
                                                                                                                  
  "abil_video_char_v1", "abil_video_trilhas_v1",
                                                                                                                                    
  "abil_ai_image_refs_v1",
                                                                                                                                 
                                                                                                                    
  "abil_social_send_lang", "abil_email_send_lang_v1",
                                                                                                                         
                                                                          
  "abil_template_defaults_v1",
                                                                                                                                                   
                                                                                    
                                                                                                
                                                                                               
                          
  "abil_agent_persona_snapshot_v1",
                                                                                                              
  "abil_settings",
                                                                                                           
  "abil_social_purged_sids_v1",
                                                                                                
                                                                                                 
                                                                                                   
                                                  
  "abil_blog_post_status_v1",
                                                                                                     
                                                                                                    
                                                             
  "abil_blog_pub_lang",
                                                                                                  
                                                                                                     
  "abil_email_cadence_override_v1",
                                                                                                   
                                                                                                     
  "abil_presentation_templates_v1",
                                                                                                      
                                                                              
  "abil_pages_last_edit_v1",
                                                                                                  
                                                                                                 
                                                              
  "abil_email_template_hidden_v1",
                                                                                                 
                                                                                             
  "abil_service_desc",
];

                                                                                                              
export const VIEW_TO_PAGEID: Record<string, string> = {
  home: "pg-home", atelier: "pg-atelier", expertises: "pg-expertises",
  projects: "pg-travaux", blog: "pg-blog", contact: "pg-contact",
  briefing: "pg-briefing", legal: "pg-mentions",
};
export const PAGE_NON_HIDEABLE = new Set<string>(["pg-home", "pg-contact", "pg-mentions"]);                                           
export function isViewHidden(view: string, vis: Record<string, boolean> | null | undefined): boolean {
  if (!vis) return false;
  const pid = VIEW_TO_PAGEID[view];
  if (!pid || PAGE_NON_HIDEABLE.has(pid)) return false;
  return vis[pid] === false;
}

                                                                                                           
function getVaultToken(): string | null { try { return localStorage.getItem("abil_vault_token"); } catch { return null; } }

const sections: Record<string, Section> = {};
let lastEtag = "";
let hydrated = false;
                                                                                                            
                                                                                                                
                                                                                                          
                                                                                                               
                                                                                                    
let hydrateOk = false;
let hydrating: Promise<void> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Map<string, Set<Listener>>();
const dirty = new Map<string, unknown>();                                                 
const recentWrites = new Map<string, number>();                                                                                      

function notify(key: string) {
  const set = listeners.get(key);
  if (set) set.forEach((cb) => { try { cb(); } catch {            } });
}

function readLocal(key: string): unknown {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    return raw == null ? undefined : JSON.parse(raw);
  } catch { return undefined; }
}
function writeLocal(key: string, value: unknown) {
  try { if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value)); } catch {                                 }
}

function applyIncoming(incoming: Record<string, Section>) {
  const now = Date.now();
  for (const [k, s] of Object.entries(incoming)) {
    if (k.startsWith("__")) continue;                                                
    if (dirty.has(k)) continue;                                      
                                                                                        
                                                                                      
    const prot = recentWrites.get(k);
    if (prot !== undefined) {
      if (now < prot) continue;                                                  
      recentWrites.delete(k);                                                         
    }
    sections[k] = s;
    writeLocal(k, s.value);                                                           
    notify(k);
  }
}

function hydrateOnce(): Promise<void> {
  if (hydrated) return Promise.resolve();
  if (hydrating) return hydrating;
  if (!CLOUD_ENABLED) { hydrated = true; return Promise.resolve(); }
  hydrating = (async () => {
    try {
      const resp = await fetch(STORE_URL, { cache: "no-store" });
      if (resp.ok) {
        hydrateOk = true;                                                                             
        lastEtag = resp.headers.get("ETag") || "";
        const data = await resp.json();
        if (data && data.sections) applyIncoming(data.sections as Record<string, Section>);
      }
    } catch {                                       }
    finally { hydrated = true; startPolling(); }
  })();
  return hydrating;
}

                                                                                                   
                                                                                                         
export function cloudReadOk(): boolean { return !CLOUD_ENABLED || hydrateOk; }
                                                                                                        
                                                                                             
export async function ensureCloudRead(): Promise<boolean> {
  await hydrateOnce();
  return cloudReadOk();
}

function startPolling() {
  if (pollTimer || !CLOUD_ENABLED || typeof window === "undefined") return;
  pollTimer = setInterval(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const resp = await fetch(STORE_URL, { cache: "no-store", headers: lastEtag ? { "If-None-Match": lastEtag } : {} });
      if (resp.status === 304) { hydrateOk = true; return; }                                              
      if (!resp.ok) return;
      hydrateOk = true;                                                                                            
      lastEtag = resp.headers.get("ETag") || lastEtag;
      const data = await resp.json();
      if (data && data.sections) applyIncoming(data.sections as Record<string, Section>);
    } catch {            }
  }, POLL_MS);
}

                                                                                                
                                                                                                  
                                      
async function flushWrites(): Promise<boolean> {
  writeTimer = null;
  if (!CLOUD_ENABLED) return true;                                                  
  if (dirty.size === 0) return true;                 
  const updates = Array.from(dirty.entries()).map(([key, value]) => ({ key, value }));
  dirty.clear();             
  try {
    const resp = await fetch(STORE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(getVaultToken() ? { "x-abil-admin": getVaultToken()! } : {}) },
      body: JSON.stringify({ updates }),
    });
    if (resp.ok) {
      lastEtag = resp.headers.get("ETag") || lastEtag;
      return true;
    }
    updates.forEach((u) => { if (!dirty.has(u.key)) dirty.set(u.key, u.value); });                             
    return false;
  } catch {
    updates.forEach((u) => { if (!dirty.has(u.key)) dirty.set(u.key, u.value); });
    return false;
  }
}

                                                                                
                                                                                               
                                                                                               
                                      
export async function cloudFlushNow(): Promise<boolean> {
  if (writeTimer) { clearTimeout(writeTimer); writeTimer = null; }
  return flushWrites();
}

function scheduleWrite() {
  if (!CLOUD_ENABLED) return;
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => { void flushWrites(); }, WRITE_DEBOUNCE_MS);
}

export function cloudGet<T>(key: string, def: T): T {
  if (dirty.has(key)) return dirty.get(key) as T;                                      
  if (sections[key] !== undefined) return sections[key].value as T;                    
  const local = readLocal(key);                                            
  return (local === undefined ? def : local) as T;
}

export function cloudSet(key: string, value: unknown) {
  writeLocal(key, value);                                                     
  dirty.set(key, value);
  sections[key] = { value, updatedAt: new Date().toISOString() };
  recentWrites.set(key, Date.now() + WRITE_GRACE_MS);                                         
  notify(key);
  scheduleWrite();
}

                                                                                           
                                                                                            
                                                                                        
export function subscribeCloud(key: string, cb: () => void): () => void {
  let set = listeners.get(key);
  if (!set) { set = new Set(); listeners.set(key, set); }
  set.add(cb);
  hydrateOnce();
  return () => { set!.delete(cb); };
}

                                                                              
export function useCloudState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((n) => n + 1);
    let set = listeners.get(key);
    if (!set) { set = new Set(); listeners.set(key, set); }
    set.add(cb);
    hydrateOnce();
    return () => { set!.delete(cb); };
     
  }, [key]);
  const value = cloudGet<T>(key, initial);
  const setValue = (v: T | ((p: T) => T)) => {
    const next = typeof v === "function" ? (v as (p: T) => T)(cloudGet<T>(key, initial)) : v;
    cloudSet(key, next);
  };
  return [value, setValue];
}

                                                                                          
let __aiServerConfigured = false;
let __aiStatusFetched = false;
export function isAiServerConfigured(): boolean { return __aiServerConfigured; }
async function fetchAiStatus(): Promise<boolean> {
  if (!CLOUD_ENABLED) return false;
  try {
    const r = await fetch("/api/ai-status", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      __aiServerConfigured = !!j.configured;
    }
  } catch {                                                }
  __aiStatusFetched = true;
  return __aiServerConfigured;
}
if (typeof window !== "undefined") {
  fetchAiStatus();
  (window as unknown as Record<string, unknown>).__abilAiStatus = () => ({ configured: __aiServerConfigured, fetched: __aiStatusFetched });
}

                                                                                                                                                                                                                           
                                                                     
                                                                                                                                                                                                                           
const VAULT_URL = "/api/private-store";
const VAULT_TOKEN_KEY = "abil_vault_token";

export const VAULT_KEYS: Record<string, string> = {
  abil_briefings: "briefings",
  abil_quotes: "quotes",
                                                                                                   
                                                                                                   
                                                                                                      
                                                                                                        
                                                                                                        
                                                                                                             
  abil_newsletter_subscribers: "subscribers",
  abil_helpdesk_v2: "helpdesk",
  abil_central_v1: "central",
  abil_brand_persona_v2: "brand_persona",
  abil_buyer_personas_v2: "buyer_personas",
                                                                                                    
                                                                                                       
  abil_ai_agent_rules_v1: "ai_agent_rules",
  abil_access_users: "access_users",
                                                                                                       
  abil_ai_config_v1: "ai_config",
                                                                                                    
                                                                                                   
                                                                            
  abil_ai_channel_prompts_v1: "ai_channel_prompts",
                                                                                                      
  abil_ai_char_limits_v1: "ai_char_limits",
  abil_ai_global_on_v1: "ai_global_on",
                                                                                                   
                                                                                                         
                                                                                                       
                                                                                      
  abil_ai_global_prompt_v1: "ai_global_prompt",
  abil_ai_image_prompt_v1: "ai_image_prompt",
  abil_ai_safeguards_v1: "ai_safeguards",
  abil_ai_reference_v1: "ai_reference",
                                                                                                    
  abil_blog_editorial_prompt_v1: "blog_editorial_prompt",
                                                                                                              
  abil_ai_template_prompts_v1: "ai_template_prompts",
                                                                                                       
                                                                                                   
  abil_quotes_config_v1: "quotes_config",
                                                                                     
                                                                                   
  abil_work_reports: "work_reports",
  abil_client_logos: "client_logos",
};

function setVaultToken(t: string | null) {
  try {
    if (t) localStorage.setItem(VAULT_TOKEN_KEY, t);
    else localStorage.removeItem(VAULT_TOKEN_KEY);
  } catch {            }
}
function notifyVault() {
  try { window.dispatchEvent(new CustomEvent("abil:vault")); } catch {            }
}
function isVaultUnlockedLocal(): boolean {
  const t = getVaultToken();
  if (!t) return false;
  const exp = Number(t.split(".")[0] || 0);
  return exp > Date.now();
}

                                                                                            
                                                                                              
                                                                                                    
export async function vaultGet<T>(col: string): Promise<T | null> {
  const tok = getVaultToken();
  if (!tok || !CLOUD_ENABLED) return null;
  try {
    const r = await fetch(VAULT_URL + "?col=" + encodeURIComponent(col), { headers: { "x-abil-admin": tok }, cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return j && "value" in j ? (j.value as T) : null;
  } catch { return null; }
}
export async function vaultSet(col: string, value: unknown): Promise<boolean> {
  const tok = getVaultToken();
  if (!tok || !CLOUD_ENABLED) return false;
  try {
    const payload = JSON.stringify({ value });
    const opts: RequestInit = { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: payload };
    if (payload.length < 60000) opts.keepalive = true;
    const r = await fetch(VAULT_URL + "?col=" + encodeURIComponent(col), opts);
    if (r.status === 401) {
      setVaultToken(null);
      notifyVault();
      if (typeof window !== "undefined") console.warn("[vault] escrita 401 - cofre trancado; faz re-login para sincronizar.");
    }
    return r.ok;
  } catch { return false; }
}
                                                                                                            
                                                                                                         
                                                                             
export async function vaultAppendPublic(col: string, item: Record<string, unknown>): Promise<{ ok: boolean; id?: string }> {
  if (!CLOUD_ENABLED) return { ok: false };
  try {
    const r = await fetch(VAULT_URL + "?append=" + encodeURIComponent(col), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item),
    });
    if (!r.ok) return { ok: false };
    const j = await r.json();
    return { ok: true, id: j && j.id };
  } catch { return { ok: false }; }
}

const VAULT_WRITE_GUARD_MS = 15000;
const vaultPending = new Map<string, number>();
const vaultListeners = new Map<string, Set<() => void>>();
function notifyVaultCol(col: string) { vaultListeners.get(col)?.forEach((cb) => { try { cb(); } catch {            } }); }
function isVaultEmpty(x: unknown): boolean {
  return x == null || (Array.isArray(x) && x.length === 0) || (typeof x === "object" && !Array.isArray(x) && Object.keys(x as Record<string, unknown>).length === 0) || x === "";
}

export function useVaultState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const col = VAULT_KEYS[key] || key;
  const [value, setValue] = useState<T>(() => {
    const local = readLocal(key);
    return (local === undefined ? initial : local) as T;
  });
  useEffect(() => {
    let alive = true;
    const recentlyWritten = () => Date.now() - (vaultPending.get(col) || 0) < VAULT_WRITE_GUARD_MS;
    const load = async () => {
      if (recentlyWritten()) return;
      if (!isVaultUnlockedLocal()) return;
      const remote = await vaultGet<T>(col);
      if (!alive || remote == null || recentlyWritten()) return;
      if (isVaultEmpty(remote) && !isVaultEmpty(readLocal(key))) {
        try { vaultSet(col, readLocal(key)); } catch {                  }
        return;
      }
      let toStore: T = remote;
      const localNow = readLocal(key);
      if (Array.isArray(remote) && Array.isArray(localNow)) {
        const keyOf = (x: any) => (x && (x.id ?? x.ref) != null) ? String(x.id ?? x.ref) : null;
        const tsOf = (o: any) => { const v = new Date(o?.updatedAt || o?.createdAt || o?.ts || 0).getTime(); return isNaN(v) ? 0 : v; };
        const remoteKeys = new Set((remote as any[]).map(keyOf).filter(Boolean));
        const remoteById = new Map(((remote as any[]).map((x) => [keyOf(x), x]).filter(([k]) => k)) as [string, any][]);
        const remoteNewest = (remote as any[]).reduce((mx: number, x: any) => Math.max(mx, tsOf(x)), 0);
        const freshLocal = (localNow as any[]).filter((x) => {
          const k = keyOf(x);
          return k && !remoteKeys.has(k) && tsOf(x) >= remoteNewest;
        });
                                                                                                                                                                            
        const newerLocal = (localNow as any[]).filter((x) => { const k = keyOf(x); if (!k || !remoteKeys.has(k)) return false; return tsOf(x) > tsOf(remoteById.get(k)) && tsOf(x) > 0; });
        if (freshLocal.length || newerLocal.length) {
          const overrides = new Map(([...freshLocal, ...newerLocal].map((x) => [keyOf(x), x])) as [string, any][]);
          toStore = ([...overrides.values(), ...(remote as any[]).filter((r) => !overrides.has(keyOf(r)))] as unknown) as T;
        }
      }
      writeLocal(key, toStore);
      setValue(toStore);
      if (toStore !== remote) { try { vaultSet(col, toStore); } catch {                                 } }
    };
    load();
    const onVault = () => load();
    const onLocalSync = () => { const lv = readLocal(key); if (lv !== undefined) setValue(lv as T); };
    let set = vaultListeners.get(col);
    if (!set) { set = new Set(); vaultListeners.set(col, set); }
    set.add(onLocalSync);
    window.addEventListener("abil:vault", onVault);
    return () => {
      alive = false;
      window.removeEventListener("abil:vault", onVault);
      set!.delete(onLocalSync);
    };
  }, [key, col]);
  const set = (v: T | ((p: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      vaultPending.set(col, Date.now());
      writeLocal(key, next);
      vaultSet(col, next).finally(() => {
        setTimeout(() => {
          vaultPending.delete(col);
          notifyVaultCol(col);
        }, VAULT_WRITE_GUARD_MS);
      });
      return next;
    });
  };
  return [value, set];
}
