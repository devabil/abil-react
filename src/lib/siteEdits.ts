                                                                                   
  
                                                                                
                                                             
                                                                                 
                                                                    
                                                                                 
  
                                                                                
                                                                             
                                                                       
  
                                                                                
                                                                            
                                                                                  

import { useEffect, useState } from "react";

export type EditsMap = Record<string, string>;
type Registo = { def: string; max: number; tipo: "txt" | "img" | "href" };

const CHAVE = "abil_site_edits_inline";
export const REGISTO_EDITAVEIS = new Map<string, Registo>();

let nuvem: EditsMap | null | undefined;                                  
let local: EditsMap = {};
let pedido: Promise<void> | undefined;
const ouvintes = new Set<() => void>();

function lerLocal(): void {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const j = bruto ? JSON.parse(bruto) : null;
    if (j && typeof j === "object") local = j as EditsMap;
  } catch { local = {}; }
}

function carregar(): void {
  if (pedido) return;
  lerLocal();
  pedido = fetch("/api/store?key=" + CHAVE, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((doc) => {
      const v = doc?.value;
      nuvem = v && typeof v === "object" && !Array.isArray(v) ? (v as EditsMap) : null;
    })
    .catch(() => { nuvem = null; })
    .finally(() => {
      if (nuvem === null) pedido = undefined;                                   
      aplicarEscalas();                                                 
      ouvintes.forEach((f) => f());
    });
}

   
                                                                             
  
                                                                             
                                                                               
                                                                          
                                                                         
                                                                     
   
function aplicarEscalas(): void {
  if (typeof document === "undefined") return;
  const m = mapa();
  const regras: string[] = [];
  for (const [k, v] of Object.entries(m)) {
    if (!k.endsWith(".escala")) continue;
    const path = k.slice(0, -".escala".length);
    const n = parseFloat(v);
    if (!Number.isFinite(n) || n === 1) continue;
    regras.push(`[data-ed="${path.replace(/"/g, '\\"')}"]{transform:scale(${n});transform-origin:center center}`);
  }
  let st = document.getElementById("abil-escala-img") as HTMLStyleElement | null;
  if (!regras.length) { if (st) st.textContent = ""; return; }
  if (!st) { st = document.createElement("style"); st.id = "abil-escala-img"; document.head.appendChild(st); }
  st.textContent = regras.join("\n");
}

function mapa(): EditsMap {
                                                              
  return nuvem ? { ...local, ...nuvem } : local;
}

function resolver(path: string, lang: string, def: string): string {
  const m = mapa();
  const v = m[`${path}__${lang}`] ?? m[`${path}__fr`] ?? m[path];
  return typeof v === "string" && v.length ? v : def;
}

                                                                                   
export function edTxt(lang: string, path: string, def: string, max = 400): string {
  if (!REGISTO_EDITAVEIS.has(path)) REGISTO_EDITAVEIS.set(path, { def, max, tipo: "txt" });
  return resolver(path, lang, def);
}

                                                                                       
export function edSrc(path: string, def: string): string {
  if (!REGISTO_EDITAVEIS.has(path)) REGISTO_EDITAVEIS.set(path, { def, max: 0, tipo: path.endsWith(".href") ? "href" : "img" });
  const m = mapa();
  const v = m[path];
  return typeof v === "string" && v.length ? v : def;
}

                                                                             

                                                                                    
export function edicoesBrutas(): EditsMap { return mapa(); }

                                                                               
                                                                                  
export function gravarEdicaoLocal(chaves: Record<string, string | null>): void {
  lerLocal();
  for (const [k, v] of Object.entries(chaves)) {
    if (v === null) delete local[k];
    else local[k] = v;
  }
  try { window.localStorage.setItem(CHAVE, JSON.stringify(local)); } catch {  }
  aplicarEscalas();                                            
  ouvintes.forEach((f) => f());
}

                                                                                
                                                                                 
                                                                           
export function edCfg(path: string, def = ""): string {
  const m = mapa();
  const v = m[path];
  return typeof v === "string" ? v : def;
}

                                                                               
                                              
export function edCfgTxt(lang: string, path: string, def: string): string {
  return resolver(path, lang, def);
}

                                                                                 
                                                                               
export function edUi<T extends Record<string, unknown>>(lang: string, prefixo: string, tabela: T): T {
  return new Proxy(tabela, {
    get(alvo, k) {
      const v = alvo[k as string];
      if (typeof v !== "string") return v;
      return edTxt(lang, `${prefixo}.${String(k)}`, v);
    },
  }) as T;
}

                                                                                
                                                                                
                                                                            
const CHAVE_REGISTO = "abil_v3_registo_v1";
let registoAgendado = 0;
function agendarRetratoDoRegisto(): void {
  if (registoAgendado) window.clearTimeout(registoAgendado);
  registoAgendado = window.setTimeout(() => {
    try {
      const retrato: Record<string, Registo> = {};
      REGISTO_EDITAVEIS.forEach((v, k) => { retrato[k] = v; });
      window.localStorage.setItem(CHAVE_REGISTO, JSON.stringify(retrato));
    } catch {  }
  }, 1200);
}

                                                                       

                                                                           
                                                                             
                                                                                 
export function useModoEdicao(): boolean {
  const [on, setOn] = useState(() => {
    try { return document.documentElement.dataset.abilEdicao === "1"; } catch { return false; }
  });
  useEffect(() => {
    const f = () => { try { setOn(document.documentElement.dataset.abilEdicao === "1"); } catch {  } };
    window.addEventListener("abil:edicao", f);
                                                                              
                                                                           
                                                                          
    f();
    let obs: MutationObserver | null = null;
    try {
      obs = new MutationObserver(f);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-abil-edicao"] });
    } catch {  }
    return () => { window.removeEventListener("abil:edicao", f); if (obs) obs.disconnect(); };
  }, []);
  return on;
}

                                                                             
                                                                               
                                                                               
export async function publicarEdicoesNuvem(): Promise<boolean> {
  try {
    const tok = window.localStorage.getItem("abil_vault_token");
    if (!tok) return false;
    const r = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-abil-admin": tok },
                                                                                
                                                                              
                                                                          
      body: JSON.stringify({ updates: [{ key: CHAVE, value: mapa() }] }),
    });
    return r.ok;
  } catch { return false; }
}

                                                                                
                                                                               
export function useEdicoesSite(): void {
  const [, redesenhar] = useState(0);
  useEffect(() => {
    const f = () => redesenhar((n) => n + 1);
    ouvintes.add(f);
    carregar();
    agendarRetratoDoRegisto();
    const aoGravar = (e: StorageEvent) => { if (e.key === CHAVE) { lerLocal(); f(); } };
    window.addEventListener("storage", aoGravar);
    return () => { ouvintes.delete(f); window.removeEventListener("storage", aoGravar); };
  }, []);
}
