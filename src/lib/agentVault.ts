   
                                                                                  
                                                                  
  
                                                                                    
                                                                                        
  
                                                                                         
   

const VAULT_TOKEN_KEY = "abil_vault_token";
const VAULT_URL = "/api/private-store";
const MEMORY_URL = "/api/agent-memory";

export type AgentMemoryType = "user_preference" | "client_fact" | "decision" | "correction" | "general";
export type AgentMemoryItem = { id: string; type: AgentMemoryType; text: string; createdAt: string; score?: number };

function getToken(): string | null { try { return localStorage.getItem(VAULT_TOKEN_KEY); } catch { return null; } }
function setToken(t: string | null) { try { if (t) localStorage.setItem(VAULT_TOKEN_KEY, t); else localStorage.removeItem(VAULT_TOKEN_KEY); } catch {       } }
function notifyVault() { try { window.dispatchEvent(new CustomEvent("abil:vault")); } catch {            } }

export function isVaultUnlocked(): boolean {
  const t = getToken();
  if (!t) return false;
  const exp = Number(t.split(".")[0] || 0);
  return exp > Date.now();
}

                                                          
export async function vaultLogin(password: string): Promise<{ ok: boolean; serverDown?: boolean }> {
  try {
    const r = await fetch(`${VAULT_URL}?action=login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
    });
    if (r.status === 401) return { ok: false };
    if (!r.ok) return { ok: false, serverDown: true };
    const j = await r.json();
    if (j?.token) { setToken(j.token); notifyVault(); return { ok: true }; }
    return { ok: false };
  } catch { return { ok: false, serverDown: true }; }
}

export function vaultLogout() { setToken(null); notifyVault(); }

export async function agentMemoryAdd(text: string, type: AgentMemoryType = "general"): Promise<{ ok: boolean; dedup?: boolean }> {
  const tok = getToken();
  if (!tok) return { ok: false };
  try {
    const r = await fetch(`${MEMORY_URL}?action=add`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ text, type }),
    });
    if (!r.ok) return { ok: false };
    const j = await r.json();
    return { ok: true, dedup: !!j?.dedup };
  } catch { return { ok: false }; }
}

export async function agentMemorySearch(q: string, k = 3): Promise<AgentMemoryItem[]> {
  const tok = getToken();
  if (!tok || !q || q.length < 2) return [];
  try {
    const r = await fetch(`${MEMORY_URL}?action=search`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ q, k }),
    });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j?.results) ? j.results : [];
  } catch { return []; }
}
