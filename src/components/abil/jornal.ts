                                                                                
  
                                                                             
                                                                               
                                                                           
                                                                         
  
                                                                               
                                                                                  
                                                                               
                                                                       
                                                                           
                                                                 
  
                                                                            
                                                                             
                                                         
  
                                                                    
                                                                       
                                                                          
                                 
                                                                               
                                                                           
                                 
                                                            
import { useEffect, useState } from "react";
import { ABIL_POSTS, AUTOR_ATELIER, type AbilPost } from "./posts";

type L5 = Record<"fr" | "en" | "pt" | "de" | "it", string>;
const LANGS = ["fr", "en", "pt", "de", "it"] as const;

type DraftLang = { title?: string; subtitle?: string; excerpt?: string; body?: string };
type Draft = {
  id?: string; title?: string; excerpt?: string; body?: string; cat?: string;
  status?: string; createdAt?: string; cover?: string;
                                                                               
  images?: string[]; authorId?: string;
  imageCredits?: { credit?: string; creditUrl?: string; source?: string }[];
  sourceLang?: string; byLang?: Partial<Record<string, DraftLang>>;
};

const slugDe = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const semAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, "_");

                                                                            
                                                                          
                                                                    
const ETIQUETAS: Record<string, L5> = {
  strategie: { fr: "Stratégie", en: "Strategy", pt: "Estratégia", de: "Strategie", it: "Strategia" },
  branding: { fr: "Branding", en: "Branding", pt: "Branding", de: "Branding", it: "Branding" },
  direction_artistique: { fr: "Direction artistique", en: "Art direction", pt: "Direção de arte", de: "Art Direction", it: "Direzione artistica" },
  production: { fr: "Production", en: "Production", pt: "Produção", de: "Produktion", it: "Produzione" },
  case_study: { fr: "Étude de cas", en: "Case study", pt: "Estudo de caso", de: "Fallstudie", it: "Caso studio" },
  etude_de_cas: { fr: "Étude de cas", en: "Case study", pt: "Estudo de caso", de: "Fallstudie", it: "Caso studio" },
};

const dataDe = (d: Draft): string | null => {
  const iso = String(d.createdAt || "").match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const ch = String(d.createdAt || "").match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ch) return `${ch[3]}-${ch[2]}-${ch[1]}`;
  return null;
};

                                                                             
const paragrafos = (s: string): string[] =>
  s.split(/\r?\n\s*\r?\n|\r?\n(?=## )/).map((p) => p.replace(/\s+/g, " ").trim()
    .replace(/^## +/, "## ")).filter(Boolean);

function converter(d: Draft, jaUsados: Set<string>): (AbilPost & { capa?: string }) | null {
  if (d.status !== "published") return null;
  const porLang = (l: string): DraftLang => (d.byLang && d.byLang[l]) || {};
  const fonte = (d.sourceLang && LANGS.includes(d.sourceLang as typeof LANGS[number]) ? d.sourceLang : "fr") as typeof LANGS[number];
  const tituloFonte = (porLang(fonte).title || d.title || "").trim();
  if (!tituloFonte) return null;
  const data = dataDe(d);
  if (!data) return null;

  const campo = (k: "title" | "excerpt" | "body", base: string): L5 => {
    const out = {} as L5;
    for (const l of LANGS) out[l] = (porLang(l)[k] || porLang(fonte)[k] || base || "").trim();
    return out;
  };
  const titulos = campo("title", d.title || "");
  const resumos = campo("excerpt", d.excerpt || "");
  const corpos = campo("body", d.body || "");

  let slug = slugDe(tituloFonte) || `article-${String(d.id || "").slice(0, 6)}`;
  while (jaUsados.has(slug)) slug = `${slug}-2`;
  jaUsados.add(slug);

  const etiqueta = ETIQUETAS[semAcentos(String(d.cat || ""))] ||
    (Object.fromEntries(LANGS.map((l) => [l, String(d.cat || "Journal").trim()])) as L5);

  const body = {} as AbilPost["body"];
  for (const l of LANGS) body[l] = paragrafos(corpos[l]);
                                                                                   
                                                                                
  const urlOk = (u: unknown) => typeof u === "string" && /^(\/|https:)/.test(u);
  const imagens = Array.isArray(d.images) ? d.images.filter(urlOk).map(String) : [];
  const creditos = Array.isArray(d.imageCredits) ? d.imageCredits : undefined;
  const capa = urlOk(d.cover) ? String(d.cover) : undefined;
  return {
    slug, date: data, tag: etiqueta, title: titulos, excerpt: resumos, body,
    capa,
    cover: capa,
    images: imagens.length ? imagens : undefined,
    imageCredits: creditos,
    author: AUTOR_ATELIER,
  };
}

let cache: (AbilPost & { capa?: string })[] | null | undefined;
let pedido: Promise<void> | undefined;
const ouvintes = new Set<() => void>();

function carregar(): void {
  if (pedido) return;
  pedido = fetch("/api/store?key=abil_blog_drafts", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((doc) => {
      const brutos: Draft[] = Array.isArray(doc?.value) ? doc.value : [];
      const usados = new Set<string>();
      const publicados = brutos.map((d) => converter(d, usados)).filter(Boolean) as (AbilPost & { capa?: string })[];
      if (!publicados.length) { cache = null; return; }
                                                                              
      const slugsPainel = new Set(publicados.map((p) => p.slug));
      const todos = [...publicados, ...ABIL_POSTS.filter((p) => !slugsPainel.has(p.slug))];
      todos.sort((a, b) => b.date.localeCompare(a.date));
      cache = todos;
    })
    .catch(() => { cache = null; })
    .finally(() => {
      if (cache === null) pedido = undefined;                                                  
      ouvintes.forEach((f) => f());
    });
}

                                                                                 
export function useJornal(): AbilPost[] | null {
  const [, redesenhar] = useState(0);
  useEffect(() => {
    if (cache && cache.length) return;
    const f = () => redesenhar((n) => n + 1);
    ouvintes.add(f);
    carregar();
    return () => { ouvintes.delete(f); };
  }, []);
  return cache ?? null;
}

                                                                                    
export function slugsJornal(): string[] {
  return (cache || []).map((p) => p.slug);
}

                                                                                  
export function postDoJornal(slug: string): AbilPost | null {
  return (cache || []).find((p) => p.slug === slug) || null;
}

                                                                             
                                                
export function capaDoJornal(slug: string): string | null {
  const p = (cache || []).find((x) => x.slug === slug);
  return (p && p.capa) || null;
}
