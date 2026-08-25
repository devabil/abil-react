   
                                                                      
                                                           
  
             
                                                                                
                                                                     
                         
                                
                                    
                                              
  
                                                                        
   

                                                                                                                                                                                                      
                                                           
                                                                     
                            
                                                            
                                                                    
                                                    
                                                       
                                                    
                                                                                                                                                                                                         
export const BRAND_COLORS = {
  noir: "#0a0a0b",
  rouge: "#d2ff01",
  violet: "#be8efc",
  beige: "#efefef",
  blanc: "#ffffff",
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;

   
                                                               
                                                                       
                                                                    
                                                        
                                                                      
                                                               
                                                                        
                                                              
   
export const COLOR_PAIRS: Record<BrandColor, { bg: string; text: string; aster: string; subText: string; line: string }> = {
  noir:   { bg: BRAND_COLORS.noir,   text: BRAND_COLORS.blanc, aster: BRAND_COLORS.rouge, subText: "rgba(255,255,255,0.72)", line: "rgba(255,255,255,0.14)" },
  rouge:  { bg: BRAND_COLORS.rouge,  text: BRAND_COLORS.noir,  aster: BRAND_COLORS.noir,  subText: "rgba(10,10,11,0.72)",    line: BRAND_COLORS.noir },
  violet: { bg: BRAND_COLORS.violet, text: BRAND_COLORS.noir,  aster: BRAND_COLORS.noir,  subText: "rgba(10,10,11,0.72)",    line: BRAND_COLORS.noir },
  beige:  { bg: BRAND_COLORS.beige,  text: BRAND_COLORS.noir,  aster: BRAND_COLORS.noir,  subText: "rgba(10,10,11,0.72)",    line: BRAND_COLORS.noir },
  blanc:  { bg: BRAND_COLORS.blanc,  text: BRAND_COLORS.noir,  aster: BRAND_COLORS.noir,  subText: "rgba(10,10,11,0.72)",    line: BRAND_COLORS.noir },
};

                                                                                                                                                                                                      
                                                    
                                                                                                                                                                                                         
export type SocialFormat = "square" | "portrait" | "story" | "feed" | "twitter";

export const FORMAT_SPECS: Record<SocialFormat, { aspect: string; tailwindAspect: string; width: number; height: number; label: string }> = {
  square:   { aspect: "1:1",  tailwindAspect: "aspect-square",      width: 1080, height: 1080, label: "Quadrado 1:1" },
  portrait: { aspect: "4:5",  tailwindAspect: "aspect-[4/5]",        width: 1080, height: 1350, label: "Retrato 4:5" },
  story:    { aspect: "9:16", tailwindAspect: "aspect-[9/16]",       width: 1080, height: 1920, label: "Story/Reel 9:16" },
  feed:     { aspect: "1.91:1", tailwindAspect: "aspect-[1.91/1]",   width: 1200, height: 628,  label: "Feed FB/LI 1.91:1" },
  twitter:  { aspect: "16:9", tailwindAspect: "aspect-video",        width: 1600, height: 900,  label: "X/Twitter 16:9" },
};

                                                                                                                                                                                                      
                                                            
                                                                                                                                                                                                         
export const TYPOGRAPHY = {
  fontFamily: {
    display: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  weights: { regular: 400, semibold: 600, bold: 700 },

                                                                        
                                                                              
  sizes: {
    titleHero:    "clamp(0.85rem, 7cqw, 2.4rem)",                              
    title:        "clamp(0.7rem, 6cqw, 2rem)",                        
    titleStat:    "clamp(1.5rem, 18cqw, 5rem)",                    
    quote:        "clamp(0.75rem, 6.5cqw, 2.1rem)",                        
    support:      "clamp(0.45rem, 3.1cqw, 1.05rem)",                                                          
    subtitle:     "clamp(0.44rem, 2.6cqw, 0.78rem)",                                      
    hashtag:      "clamp(0.4rem, 2.4cqw, 0.65rem)",                    
    footer:       "clamp(0.3rem, 1.8cqw, 0.55rem)",                
  },

                                 
  tracking: {
    headlineTight: "-0.025em",
    statTight: "-0.04em",
    mono: "0.22em",
    hashtag: "0.18em",
  },

                                 
  leading: {
    headline: "1.05",
    body: "1.45",
    stat: "0.9",
  },
} as const;

                                                                                                                                                                                                      
                                                               
                                                                                                                                                                                                         
export const SAFE_AREAS = {
  x: "px-[8%]",
                                                               
  bottomVertical: "pb-[28%]",
  bottomFeed:     "pb-[18%]",
  topVertical:    "pt-[10%]",
  topFeed:        "pt-[8%]",
} as const;

                                                                                                                                                                                                      
                                               
                                                                                                                                                                                                         
export const FOOTER_TOKENS = {
                                      
  height: "clamp(1.1rem, 7cqw, 2.4rem)",
                        
  paddingX: "px-[5%]",
  paddingY: "py-[2%]",
                                                    
  blurOverImage: "bg-black/55 backdrop-blur-sm",
                                    
  logoHeight: "clamp(0.5rem, 3.5cqw, 1.05rem)",
} as const;

                                                                                                                                                                                                      
                                                              
                                                                                                                                                                                                         
export type PubLang = "fr" | "pt" | "en" | "de" | "it";

export const HASHTAGS_BY_LANG: Record<string, Record<PubLang, string>> = {
                                                                              
  frasesCriativas: {
    fr: "#VraimentHabiles",  pt: "#VraimentHabiles", en: "#VraimentHabiles",
    de: "#VraimentHabiles",  it: "#VraimentHabiles",
  },
  dicasMarketing: {
    fr: "#ConseilsAbil", pt: "#DicasAbil", en: "#AbilTips",
    de: "#AbilTipps", it: "#ConsigliAbil",
  },
  servicos: {
    fr: "#AbilMedias",  pt: "#AbilMedias",  en: "#AbilMedias",
    de: "#AbilMedias",  it: "#AbilMedias",
  },
                                          
  repostBlog: {
    fr: "#JournalAbil",   pt: "#JornalAbil",  en: "#AbilJournal",
    de: "#AbilJournal",   it: "#GiornaleAbil",
  },
  repostProjeto: {
    fr: "#ProjetsAbil",   pt: "#ProjetosAbil",  en: "#AbilProjects",
    de: "#AbilProjekte",  it: "#ProgettiAbil",
  },
  curiosidades: {
    fr: "#CuriositésAbil",  pt: "#CuriosidadesAbil", en: "#AbilFacts",
    de: "#AbilWissen",      it: "#CuriositàAbil",
  },
                                                                    
  diferenciais: {
    fr: "#AgenceGenevoise", pt: "#AgênciaGenebrina", en: "#GenevaAgency",
    de: "#GenferAgentur",   it: "#AgenziaGinevrina",
  },
  bastidores: {
    fr: "#CoulissesAbil",   pt: "#BastidoresAbil",  en: "#InsideAbil",
    de: "#AbilBackstage",   it: "#AbilBackstage",
  },
};

                                                                   
export function getHashtag(tag: TemplateTag, pubLang: PubLang): string {
  const keyMap: Record<TemplateTag, keyof typeof HASHTAGS_BY_LANG> = {
    "frases-criativas": "frasesCriativas",
    "dicas-marketing": "dicasMarketing",
    "servicos": "servicos",
    "repost-blog": "repostBlog",
    "repost-projeto": "repostProjeto",
    "curiosidades": "curiosidades",
    "diferenciais": "diferenciais",
    "bastidores": "bastidores",
  };
  const k = keyMap[tag];
  return HASHTAGS_BY_LANG[k]?.[pubLang] || HASHTAGS_BY_LANG[k]?.fr || "#AbilMedias";
}

                                                        
export const DEFAULT_HASHTAGS = {
  frasesCriativas:    HASHTAGS_BY_LANG.frasesCriativas.fr,
  dicasMarketing:     HASHTAGS_BY_LANG.dicasMarketing.fr,
  servicos:           HASHTAGS_BY_LANG.servicos.fr,
  repostBlog:         HASHTAGS_BY_LANG.repostBlog.fr,
  repostProjeto:      HASHTAGS_BY_LANG.repostProjeto.fr,
  curiosidades:       HASHTAGS_BY_LANG.curiosidades.fr,
  diferenciais:       HASHTAGS_BY_LANG.diferenciais.fr,
  bastidores:         HASHTAGS_BY_LANG.bastidores.fr,
} as const;

                                                                                                                                                                                                      
                                                                   
                                                                                                                                                                                                         
export const IMAGE_RULES = {
                                                                                 
  preserveColor: true,
                                                                     
                                                  
  overlayDark: "rgba(0,0,0,0.35)",
  overlayLight: "rgba(0,0,0,0.20)",
                                                  
  forbiddenFilters: ["grayscale", "saturate(0)", "filter: gray"] as const,
} as const;

                                                                                                                                                                                                      
                                                             
                                                                                                                                                                                                         
export type TemplateTag =
  | "frases-criativas"                     
  | "dicas-marketing"                                   
  | "servicos"                                       
  | "repost-blog"                                    
  | "repost-projeto"                                         
  | "curiosidades"                                
  | "diferenciais"                               
  | "bastidores";                               

export const TEMPLATE_META: Record<TemplateTag, {
  label: string;
  description: string;
  imageMode: "none" | "ai-required" | "blog-real" | "project-real" | "upload-required";
  hashtag: string;
  hasSupportText: boolean;
  hasDisruptivePhrase: boolean;
  bgPreferred: BrandColor;
}> = {
  "frases-criativas": {
    label: "Frases criativas",
    description: "All type, frase grande + cor da marca",
    imageMode: "none",
    hashtag: DEFAULT_HASHTAGS.frasesCriativas,
    hasSupportText: false,
    hasDisruptivePhrase: false,
    bgPreferred: "noir",
  },
  "dicas-marketing": {
    label: "Dicas de marketing",
    description: "Título + texto apoio + frase disruptiva + imagem IA colorida",
    imageMode: "ai-required",
    hashtag: DEFAULT_HASHTAGS.dicasMarketing,
    hasSupportText: true,
    hasDisruptivePhrase: true,
    bgPreferred: "beige",
  },
  "servicos": {
    label: "Serviços da agência",
    description: "Nome serviço + apoio + frase disruptiva + imagem IA",
    imageMode: "ai-required",
    hashtag: DEFAULT_HASHTAGS.servicos,
    hasSupportText: true,
    hasDisruptivePhrase: true,
                                                                       
    bgPreferred: "beige",
  },
  "repost-blog": {
    label: "Repost artigo blog",
    description: "Título e resumo idênticos ao blog + cover real",
    imageMode: "blog-real",
    hashtag: DEFAULT_HASHTAGS.repostBlog,
    hasSupportText: true,
    hasDisruptivePhrase: false,
    bgPreferred: "noir",
  },
  "repost-projeto": {
    label: "Carrossel projeto",
    description: "N slides com imagens reais do projeto (5/10/15/20 dinâmico)",
    imageMode: "project-real",
    hashtag: DEFAULT_HASHTAGS.repostProjeto,
    hasSupportText: true,
    hasDisruptivePhrase: false,
    bgPreferred: "noir",
  },
  "curiosidades": {
    label: "Curiosidades",
    description: "Título + apoio leve + imagem IA colorida",
    imageMode: "ai-required",
    hashtag: DEFAULT_HASHTAGS.curiosidades,
    hasSupportText: true,
    hasDisruptivePhrase: false,
    bgPreferred: "violet",
  },
  "diferenciais": {
    label: "Template 01 · fundo branco",
    description: "O template 01, sem foto, com o degradé branco a fechar em citron",
    imageMode: "none",
    hashtag: DEFAULT_HASHTAGS.diferenciais,
    hasSupportText: true,
    hasDisruptivePhrase: false,
    bgPreferred: "blanc",
  },
  "bastidores": {
    label: "Template 01 · fundo roxo",
    description: "O template 01, sem foto, com o degradé violette a abrir para branco",
    imageMode: "none",
    hashtag: DEFAULT_HASHTAGS.bastidores,
    hasSupportText: true,
    hasDisruptivePhrase: false,
    bgPreferred: "violet",
  },
};

                                                                                                                                                                                                      
                                          
                                                                                                                                                                                                         
export const TEMPLATE_LABELS_BY_LANG: Record<TemplateTag, Record<PubLang, string>> = {
  "frases-criativas": {
    fr: "Phrases créatives",       pt: "Frases criativas",
    en: "Creative phrases",         de: "Kreative Sätze",
    it: "Frasi creative",
  },
  "dicas-marketing": {
    fr: "Conseils marketing",       pt: "Dicas de marketing",
    en: "Marketing tips",           de: "Marketing-Tipps",
    it: "Consigli marketing",
  },
  "servicos": {
    fr: "Services agence",          pt: "Serviços da agência",
    en: "Agency services",          de: "Agentur-Leistungen",
    it: "Servizi agenzia",
  },
  "repost-blog": {
    fr: "Repost article blog",      pt: "Repost artigo blog",
    en: "Blog article repost",      de: "Blog-Artikel Repost",
    it: "Repost articolo blog",
  },
  "repost-projeto": {
    fr: "Carrousel projet",         pt: "Carrossel projeto",
    en: "Project carousel",         de: "Projekt-Karussell",
    it: "Carosello progetto",
  },
  "curiosidades": {
    fr: "Curiosités",               pt: "Curiosidades",
    en: "Curiosities",              de: "Wissenswertes",
    it: "Curiosità",
  },
  "diferenciais": {
    fr: "Différences agence",       pt: "Diferenciais da agência",
    en: "Agency differentiators",   de: "Agentur-Unterschiede",
    it: "Differenze agenzia",
  },
  "bastidores": {
    fr: "Coulisses",                pt: "Bastidores",
    en: "Behind the scenes",        de: "Hinter den Kulissen",
    it: "Dietro le quinte",
  },
};

   
                                                                                                 
                                                                                                       
                                                                                                     
                                                                                                    
                                                                                                       
                                                                                        
   
export type TplFieldDef = { key: string; label: string; sel: string; lineMax: number[] };
                                                                                                  
                                                                                                         
                                                                                                     
export function templateFieldCap(tag: string, key: string): number {
  const defs = TEMPLATE_FIELDS[tag as TemplateTag];
  const def = defs ? defs.find((d) => d.key === key) : undefined;
  if (!def || !def.lineMax.length) return 0;
  return def.lineMax.reduce((a, b) => a + b, 0) + Math.max(0, def.lineMax.length - 1);
}
                                                                                                
                                                                                                   
                                                                                                    
                                                                                             
                                                                                               
                                              
                                                                                              
                                                                                               
export function templateFieldLines(tag: string, key: string): number[] {
  const defs = TEMPLATE_FIELDS[tag as TemplateTag];
  const def = defs ? defs.find((d) => d.key === key) : undefined;
  return def ? def.lineMax.slice() : [];
}
function greedyFitWords(words: string[], lineMax: number[]): string[] | null {
  const maxLines = Math.max(1, lineMax.length);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const li = Math.min(out.length, maxLines - 1);
    const max = lineMax[li] ?? lineMax[lineMax.length - 1];
    const cand = cur ? cur + " " + w : w;
    if (cand.length <= max) { cur = cand; continue; }
    if (!cur) return null;                                                                        
    if (out.length >= maxLines - 1) return null;                                          
    out.push(cur);
    cur = w;
    const li2 = Math.min(out.length, maxLines - 1);
    if (w.length > (lineMax[li2] ?? lineMax[lineMax.length - 1])) return null;
  }
  if (cur) out.push(cur);
  return out.length <= maxLines ? out : null;
}
export function fitFieldText(tag: string, key: string, text: string): string {
  const lm = templateFieldLines(tag, key);
  const flat = String(text || "").replace(/\s+/g, " ").trim();
  if (!lm.length || !flat) return flat;
  let words = flat.split(" ").filter(Boolean);
  while (words.length) {
    const fit = greedyFitWords(words, lm);
    if (fit) return fit.join("\n");
    words = words.slice(0, -1);                                                                
  }
  return flat.split(" ")[0].slice(0, lm[0]);                                                          
}
export function fieldLineSpecHint(tag: string, key: string): string {
  const lm = templateFieldLines(tag, key);
  if (!lm.length) return "";
  if (lm.length === 1) return `1 linha com até ${lm[0]} caracteres, nenhuma palavra maior que isso`;
  return `${lm.length} linhas curtas (${lm.map((n, i) => `linha ${i + 1} até ${n}`).join(", ")} caracteres), palavras curtas, nenhuma com mais de ${Math.min(...lm)} caracteres`;
}
   
                                                                         
                                                                        
                                                  
                                                                       
                                                                     
                                             
                                                                         
                                                                  
   
export const TEMPLATE_FIELDS: Partial<Record<TemplateTag, TplFieldDef[]>> = {
  "frases-criativas": [
    { key: "titulo", label: "Título", sel: '[data-abil-el="title"]', lineMax: [30] },
    { key: "apoio", label: "Texto de apoio", sel: '[data-abil-el="support"]', lineMax: [37] },
  ],
  "dicas-marketing": [
    { key: "titulo", label: "Título", sel: '[data-abil-el="title"]', lineMax: [33] },
    { key: "apoio", label: "Texto de apoio", sel: '[data-abil-el="support"]', lineMax: [90] },
  ],
  "servicos": [
    { key: "titulo", label: "Título", sel: '[data-abil-el="title"]', lineMax: [37] },
    { key: "apoio", label: "Texto de apoio", sel: '[data-abil-el="support"]', lineMax: [113] },
  ],
  "repost-blog": [
    { key: "titulo", label: "Título", sel: '[data-abil-el="title"]', lineMax: [27] },
    { key: "apoio", label: "Texto de apoio", sel: '[data-abil-el="support"]', lineMax: [139] },
  ],
  "repost-projeto": [
    { key: "titulo", label: "Título", sel: '[data-abil-el="title"]', lineMax: [32] },
    { key: "apoio", label: "Texto de apoio", sel: '[data-abil-el="support"]', lineMax: [87] },
  ],
  "curiosidades": [
    { key: "titulo", label: "Título (pergunta)", sel: '[data-abil-el="title"]', lineMax: [25] },
    { key: "apoio", label: "Resposta", sel: '[data-abil-el="support"]', lineMax: [95] },
  ],
  "diferenciais": [
    { key: "titulo", label: "Título", sel: '[data-abil-el="title"]', lineMax: [27] },
    { key: "apoio", label: "Texto de apoio", sel: '[data-abil-el="support"]', lineMax: [100] },
  ],
  "bastidores": [
    { key: "titulo", label: "Título", sel: '[data-abil-el="title"]', lineMax: [33] },
    { key: "apoio", label: "Legenda", sel: '[data-abil-el="support"]', lineMax: [108] },
  ],
};

                                                         
export const TEMPLATE_TAGS_ORDER: TemplateTag[] = [
  "frases-criativas",
  "dicas-marketing",
  "servicos",
  "repost-blog",
  "repost-projeto",
  "curiosidades",
  "diferenciais",
  "bastidores",
];

   
                                                                        
                                                     
  
                                                                   
                                                                           
                                                    
   
   
                                                            
  
                                                                                
                                                                              
                                                                                
                                                                                  
                                                                              
                                                                              
                                                         
  
                                                                                
                                                                                 
   
export const TEMPLATE_SAMPLE_IMG: Record<TemplateTag, string | undefined> = {
  "frases-criativas":  "/brand/kv-icon-yellow-2.jpg",
  "dicas-marketing":   "/brand/kv-men-3.jpg",
  "curiosidades":      undefined,
  "repost-projeto":    "/brand/kv-icon-black-1.jpg",
  "servicos":          "/brand/kv-woman-4.jpg",
  "repost-blog":       "/brand/kv-men-2.jpg",
  "diferenciais":      undefined,
  "bastidores":        undefined,
};

                                                                                     
                                                                                
                                                                                  
                                                                                   
export const TEMPLATE_SAMPLE_CAROUSEL: string[] = [
  "/brand/kv-icon-black-1.jpg",
  "/brand/kv-men-1.jpg",
  "/brand/kv-woman-2.jpg",
  "/brand/kv-icon-yellow-1.jpg",
  "/brand/kv-logo-black-3.jpg",
];

   
                                                                     
                                                               
                                                                             
   
export const TEMPLATE_DEFAULT_DISRUPTIVE: Record<TemplateTag, Record<PubLang, string> | null> = {
  "frases-criativas": null,
  "dicas-marketing": {
    fr: "Sur un marché saturé, le correct ne suffit plus.",
    pt: "Num mercado saturado, o correto já não chega.",
    en: "In a saturated market, correct is no longer enough.",
    de: "In einem gesättigten Markt reicht korrekt nicht mehr.",
    it: "In un mercato saturo, il corretto non basta più.",
  },
  "servicos": {
    fr: "Stratégie et exécution sous le même toit.",
    pt: "Estratégia e execução sob o mesmo teto.",
    en: "Strategy and delivery under one roof.",
    de: "Strategie und Umsetzung unter einem Dach.",
    it: "Strategia ed esecuzione sotto lo stesso tetto.",
  },
  "repost-blog": null,
  "repost-projeto": null,
  "curiosidades": null,
  "diferenciais": {
    fr: "La personne qui vous répond est celle qui fait le travail.",
    pt: "Quem lhe responde é quem faz o trabalho.",
    en: "The person who answers you is the one doing the work.",
    de: "Wer antwortet, macht auch die Arbeit.",
    it: "Chi vi risponde è chi fa il lavoro.",
  },
  "bastidores": null,
};

                                                             
export function getTemplateLabel(tag: TemplateTag, lang: PubLang): string {
  return TEMPLATE_LABELS_BY_LANG[tag]?.[lang] || TEMPLATE_LABELS_BY_LANG[tag].fr;
}

   
                                                                               
                                          
   
export function normalizeHashtag(input: string): string {
  if (!input) return "";
  let s = input.trim();
                         
  s = s.replace(/^rashtag/i, "hashtag");
  s = s.replace(/^hastag/i, "hashtag");
                         
  if (!s.startsWith("#")) s = "#" + s;
                                                         
  s = s.replace(/\s+/g, "");
  return s;
}
