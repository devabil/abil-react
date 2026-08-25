                                                                         
  
                                                                                   
                                                                              
                                                                               
                                                                            
                                                                               
  
                                                                                 
                                                                                   
                                                                               
                                                                              
                                                                               
  
                                                                                   
                                                                                  
                                                                                    
                                                      
import { useEffect, useState } from "react";

                                                                                  
                                                                                 
                                 
export type EtiquetaV3 =
  | "identite" | "dircrea" | "strategie" | "digital"
  | "devweb" | "campagne" | "affichage" | "edition";

type L5 = { fr: string; en: string; pt: string; de: string; it: string };

                                                                                    
export type CasoPublicado = {
                                                                           
  capaEhVideo?: boolean;
                                                                              
                                                                                 
  paginas?: { tipo: "image" | "video" | "pdf"; src: string; poster?: string }[];
  slug: string; title: string; titleByLang: L5; img: string; tags: EtiquetaV3[]; year: string; extra: string[];
                                                                            
                                                                             
                                                                             
                                                                               
                                                     
  gallery: string[]; lede: L5; defi: L5; reponse: L5; secB: L5;
  destacado: boolean; ordemDestaque: number; ordemLista: number;
};

                                                                                    
                                                                                 
                                                                                  
                                                                         
const MAPA_CATS: Partial<Record<string, EtiquetaV3>> = {
  branding: "identite", system: "identite",
  campagne: "campagne", brand_activation: "campagne",
  ooh: "affichage",
  editorial: "edition",
  digital: "digital", social: "digital", digital_marketing: "digital",
  ui_ux_design: "digital", ai_automation: "digital",
  website: "devweb", mobile_app: "devweb",
  marketing_consulting: "strategie", marketing_360: "strategie", inbound_marketing: "strategie",
  motion_graphics: "dircrea",
                                                                            
                                                                     
};

const slugDe = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "projet";

const l5De = (base: string, porLingua?: Partial<Record<string, string>>): L5 => ({
  fr: porLingua?.fr || base, en: porLingua?.en || base, pt: porLingua?.pt || base,
  de: porLingua?.de || base, it: porLingua?.it || base,
});

type Bruto = {
  id?: string; slug?: string; title?: string; description?: string;
  titleByLang?: Partial<Record<string, string>>; descriptionByLang?: Partial<Record<string, string>>;
  cover?: { type?: string; src?: string; posterSrc?: string } | null;
  assets?: { type?: string; src?: string; posterSrc?: string }[];
  categories?: string[]; year?: string; publishedAt?: string;
  featured?: boolean; featuredOrder?: number; order?: number; hidden?: boolean;
};

const EH_VIDEO = (s: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(s);

function converter(p: Bruto): CasoPublicado | null {
  const title = String(p.title || "").trim();
  if (!title || p.hidden) return null;
                                                                              
                                                                             
                                                                          
                                                                       
  const visuais = (p.assets || [])
    .map((a) => {
      if (!a) return "";
      if (a.type === "image" && a.src) return String(a.src);
      if (a.posterSrc) return String(a.posterSrc);                                   
      if (a.type === "video" && a.src) return String(a.src);                       
      return "";
    })
    .filter(Boolean);
                                                                               
                                                                                 
                                                                 
  const EH_GIF = (x: string) => /\.gif(\?|#|$)/i.test(x);
  const capaDoCover = p.cover
    ? (p.cover.src && EH_GIF(String(p.cover.src)) ? String(p.cover.src)
      : p.cover.type === "image" && p.cover.src ? String(p.cover.src)
      : p.cover.posterSrc ? String(p.cover.posterSrc)
      : p.cover.type === "video" && p.cover.src ? String(p.cover.src) : "")
    : "";
  const imgs = visuais;
  const capa = capaDoCover || visuais[0];
  if (!capa) return null;                                   
  const tags = Array.from(new Set((p.categories || []).map((c) => MAPA_CATS[c]).filter(Boolean))) as EtiquetaV3[];
  const ano = String(p.year || "").trim() || String(p.publishedAt || "").slice(0, 4) || "";
  const resto = imgs.filter((s) => s !== capa);
  return {
    slug: String(p.slug || "").trim() || slugDe(title),
    title, titleByLang: l5De(title, p.titleByLang), img: capa, tags,
    year: ano, extra: resto.slice(0, 2),
    gallery: resto.slice(0, 4),
    lede: l5De(String(p.description || "").trim(), p.descriptionByLang),
    defi: l5De(""), reponse: l5De(""), secB: l5De(""),
      capaEhVideo: EH_VIDEO(capa),
    paginas: (p.assets || [])
      .filter((a) => a && a.src && (a.type === "image" || a.type === "video" || a.type === "pdf"))
      .map((a) => ({ tipo: a!.type as "image" | "video" | "pdf", src: String(a!.src), poster: a!.posterSrc ? String(a!.posterSrc) : undefined })),
    destacado: !!p.featured,
    ordemDestaque: typeof p.featuredOrder === "number" ? p.featuredOrder : 99,
                                                                             
                                                                         
                                                            
    ordemLista: typeof p.order === "number" ? p.order : 9999,
  };
}

                                                                                  
                                                                               
                                                                             
let cache: CasoPublicado[] | null | undefined;
let pedido: Promise<CasoPublicado[] | null> | undefined;
const ouvintes = new Set<() => void>();

function carregar(): Promise<CasoPublicado[] | null> {
  if (pedido) return pedido;
  pedido = fetch("/api/projects", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((dados) => {
      const lista = Array.isArray(dados) ? dados.map(converter).filter(Boolean) as CasoPublicado[] : [];
                                                                              
                                                                             
                                                                                  
                                                                                   
                                                                            
                                                                              
                                                                              
                                                                            
                                                                    
      lista.sort((a, b) => (Number(b.destacado) - Number(a.destacado))
        || (a.ordemDestaque - b.ordemDestaque)
        || (a.ordemLista - b.ordemLista)
        || String(b.year || "").localeCompare(String(a.year || ""))
        || a.title.localeCompare(b.title));
      cache = lista.length ? lista : null;
      return cache;
    })
    .catch(() => { cache = null; return null; })
    .finally(() => {
                                                                                
                                                                               
                                                                                  
      if (cache === null) pedido = undefined;
      ouvintes.forEach((f) => f());
    });
  return pedido;
}

                                                                          
                                               
export function usePublicados(): CasoPublicado[] | null {
  const [, redesenhar] = useState(0);
  useEffect(() => {
    if (cache && cache.length) return;                                  
    const f = () => redesenhar((n) => n + 1);
    ouvintes.add(f);
    void carregar();
    return () => { ouvintes.delete(f); };
  }, []);
  return cache ?? null;
}

                                                         
                                                                 
                                                                             
                                                                           
                                                                            
export function usePublicadosACarregar(): boolean {
  const [, redesenhar] = useState(0);
  useEffect(() => {
    if (cache !== undefined) return;
    const f = () => redesenhar((n) => n + 1);
    ouvintes.add(f);
    void carregar();
    return () => { ouvintes.delete(f); };
  }, []);
  return cache === undefined;
}

                                                                           
                                                                            
                                                                      
export function slugsPublicados(): string[] {
  return (cache || []).map((c) => c.slug);
}

                                                             
export function casoPublicado(slug: string): CasoPublicado | null {
  return (cache || []).find((c) => c.slug === slug) || null;
}

                                                                           
                                                                                
                                                                               
                                                                                
                                                                            
                               
export const NOMES_CASO_DEMO: Record<string, Record<string, string>> = {
  "trame-urbaine": { fr: "Trame Urbaine", en: "Urban Weave", pt: "Malha Urbana", de: "Urbanes Gewebe", it: "Trama Urbana" },
  "carte-blanche": { fr: "Carte Blanche", en: "Free Hand", pt: "Carta Branca", de: "Freie Hand", it: "Carta Bianca" },
  "ligne-claire": { fr: "Ligne Claire", en: "Clear Line", pt: "Linha Clara", de: "Klare Linie", it: "Linea Chiara" },
  "voix-de-berne": { fr: "Voix de Berne", en: "Voice of Bern", pt: "Voz de Berna", de: "Stimme Berns", it: "Voce di Berna" },
  "nuit-blanche": { fr: "Nuit Blanche", en: "White Night", pt: "Noite Branca", de: "Weisse Nacht", it: "Notte Bianca" },
  "signal-leman": { fr: "Signal Léman", en: "Léman Signal", pt: "Sinal Léman", de: "Signal Léman", it: "Segnale Léman" },
};

                                                                                
                                                               
export function nomeCaso(slug: string, lang: string, original: string): string {
  const m = NOMES_CASO_DEMO[slug];
  const publicado = (cache || []).find((c) => c.slug === slug);
  return (m && (m[lang] || m.fr)) || publicado?.titleByLang[lang as keyof L5] || original;
}
