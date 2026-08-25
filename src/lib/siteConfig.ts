                                                                              
                                                                            
                                                                                  
                                                                                  

export type SiteLang = "fr" | "de" | "en" | "pt" | "it";

export const ALL_SITE_LANGS: SiteLang[] = ["fr", "de", "en", "pt", "it"];
                                                         
export const DEFAULT_SITE_LANGS: SiteLang[] = ["fr", "de", "en", "pt", "it"];

const ENDPOINT = "/api/site-config";

function vaultHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...(extra || {}) };
  try {
    const vt = typeof localStorage !== "undefined" ? localStorage.getItem("abil_vault_token") : null;
    if (vt) h["x-abil-admin"] = vt;
  } catch {            }
  return h;
}

function sanitize(input: any): SiteLang[] {
  let langs = Array.isArray(input) ? input.filter((l: any): l is SiteLang => ALL_SITE_LANGS.includes(l)) : [];
  if (!langs.includes("fr")) langs = ["fr", ...langs];              
  langs = ALL_SITE_LANGS.filter((l) => langs.includes(l));                            
  return langs.length ? langs : DEFAULT_SITE_LANGS;
}

                                                                                   
                                                    
export async function fetchSiteLangs(): Promise<SiteLang[] | null> {
  try {
    const r = await fetch(`${ENDPOINT}?cb=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data?.enabledLangs)) return null;
    return sanitize(data.enabledLangs);
  } catch {
    return null;
  }
}

                                                                                   
export async function saveSiteLangs(langs: SiteLang[]): Promise<boolean> {
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: vaultHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ enabledLangs: sanitize(langs) }),
    });
    return r.ok;
  } catch {
    return false;
  }
}
