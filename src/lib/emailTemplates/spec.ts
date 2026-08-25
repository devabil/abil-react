   
                                                                             
                                                                      
  
                                                                          
                                                                              
                                                                               
                                                                               
   
import {
  GROUNDS, PHASE_GROUND, PHASE_BANNER, PHASE_NUMBER, TYPE, RAIL, CONTACT,
  accentFor, footerStops, footerFallback, FOOTER_INK,
  type AbilEmailGround, type AbilEmailPhase, type GroundSpec,
} from "./tokens.js";

                                                                             
                                                                                
                                                           
export type EmailSpecInput = {
  phase?: string;
  subject: string;
  preheader?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  heroImage?: string;
  aiImageUrl?: string;
  projectGallery?: string[];
  blocks?: Array<{ icone?: string; titulo: string; descricao: string }>;
                                                         
  name?: string;
};

export type EmailSpec = {
  ground: AbilEmailGround;
  g: GroundSpec;
                                                                           
                                                                             
                                 
  counter: string;
  banner: string | null;
                                                                              
                                                                         
  statement: string;
                                                                               
                                                                              
  statementRaw: string;
  statementSize: number;
                                            
  paragraphs: string[];
                                                                                   
  rows: Array<{ key: string; text: string }>;
  gallery: string[];
  cta: { label: string; url: string } | null;
  footer: {
    gradient: string;
    fallback: string;
    ink: string;
    padTop: number;
    padBottom: number;
  };
  rail: typeof RAIL;
  contact: typeof CONTACT;
  type: typeof TYPE;
};

                                                                            
                                                                               
const CHAVE_MAX = 20;

const PHASES = new Set<string>(Object.keys(PHASE_GROUND));
const isPhase = (p?: string): p is AbilEmailPhase => !!p && PHASES.has(p);

   
                                              
  
                                                                                
                                                                              
                                                                                  
                                                                                   
                                                                            
   
export function quebrarFrase(txt: string, maxCharsPorLinha = 18): string {
  const limpo = String(txt || "").trim();
  if (!limpo) return "";
  if (/<br\s*\/?>/i.test(limpo)) return limpo;                                 
  const palavras = limpo.split(/\s+/);
  if (palavras.length < 2) return limpo;
  const linhas = Math.max(1, Math.ceil(limpo.length / maxCharsPorLinha));
  if (linhas < 2) return limpo;
                                                                     
  const alvo = Math.ceil(limpo.length / linhas);
  const out: string[] = [];
  let atual = "";
  for (const p of palavras) {
    if (atual && (atual.length + 1 + p.length) > alvo && out.length < linhas - 1) {
      out.push(atual); atual = p;
    } else {
      atual = atual ? `${atual} ${p}` : p;
    }
  }
  if (atual) out.push(atual);
  return out.join("<br>");
}

   
                                                                              
                                          
  
                                                                              
                                                                            
                                                                           
                                                                              
                                                 
  
                                                                            
                                                                             
             
   
export function tamanhoFrase(statement: string): number {
  const palavras = statement.replace(/<br\s*\/?>/gi, " ").split(/\s+/).filter(Boolean);
  const maisLonga = palavras.reduce((n, p) => Math.max(n, p.length), 0);
  if (maisLonga <= 14) return TYPE.statement;
  if (maisLonga <= 17) return 52;
  return 44;
}

                                                                                
                                                                                
                                       
export function buildEmailSpec(
  t: EmailSpecInput,
  opts: { resolveImg?: (src: string) => string; mergeName?: string } = {},
): EmailSpec {
  const resolve = opts.resolveImg || ((s: string) => s);
  const phase = isPhase(t.phase) ? t.phase : undefined;
  const ground: AbilEmailGround = phase ? PHASE_GROUND[phase] : "noir";
  const g = GROUNDS[ground];
  const accent = accentFor(phase);

  const bannerRaw = t.aiImageUrl || t.heroImage || (phase ? PHASE_BANNER[phase] : null);
  const banner = bannerRaw ? (resolve(bannerRaw) || null) : null;

  const statementRaw = String(t.subject || "").replace(/^\*\s*/, "").replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
  const statement = quebrarFrase(String(t.subject || "").replace(/^\*\s*/, ""));

  const corpo = String(t.body || t.preheader || "")
    .replace(/{{\s*prenom\s*}}/gi, opts.mergeName || "");
  const paragraphs = corpo.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

                                                                                    
                                                                                
                                                                                 
    
                                                                                 
                                                                                 
                                                                              
                                                                            
                                                                         
                
  const rows = (t.blocks || []).map((b, i) => {
    const titulo = String(b.titulo || "").trim();
    const desc = String(b.descricao || "").trim();
    if (titulo.length <= CHAVE_MAX) return { key: titulo, text: desc };
    const numero = String(i + 1).padStart(2, "0");
    return { key: numero, text: desc ? `${titulo}. ${desc}` : titulo };
  });

  return {
    ground, g,
    counter: phase ? `${PHASE_NUMBER[phase]}/10` : "",
    banner,
    statement,
    statementRaw,
    statementSize: tamanhoFrase(statement),
    paragraphs,
    rows,
    gallery: (t.projectGallery || []).map(resolve).filter(Boolean).slice(0, 4),
    cta: t.ctaLabel ? { label: t.ctaLabel, url: t.ctaUrl || "" } : null,
    footer: {
      gradient: footerStops(ground, accent),
      fallback: footerFallback(ground, accent),
      ink: FOOTER_INK,
      padTop: g.footer.padTop,
      padBottom: g.footer.padBottom,
    },
    rail: RAIL,
    contact: CONTACT,
    type: TYPE,
  };
}
