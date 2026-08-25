   
                                                                                        
  
                                                                            
                                              
                                                     
                                                                          
                                                     
                                                                
                                                                                      
  
                                                                                
                                                                               
                                                                          
                                                                             
                             
   

                                                                                                                                                                                                                   
                                                                                 
                                                                               
                                                                      
export const NOIR = "#0a0a0b";                    
export const CITRON = "#d2ff01";                         
export const ALPIN = "#ffffff";                   
export const LEMAN = "#c7c7c7";                   
export const RHONE = "#7e7e7e";                   
export const VIOLETTE = "#be8efc";                    
export const TELA = "#efefef";                                                        

                                                                          
                                                                                   
                  
export type AbilEmailGround = "citron" | "violette" | "noir" | "alpin";

export type GroundSpec = {
                                        
  bg: string;
                                         
  ink: string;
                                               
  inkSoft: string;
                                      
  pill: { bg: string; ink: string };
                                                 
  footer: {
                                                 
    stops: Array<{ color: string; at: string }>;
                                                                                 
                                                                      
    fallback: string;
                                                                         
    padTop: number;
    padBottom: number;
  };
                                                                       
  markTop: "wordmark" | "citron";
};

   
                                                                  
                                                       
                                                                 
                                                      
                                                           
  
                                                                                 
                                                                                   
                               
   
export const GROUNDS: Record<AbilEmailGround, GroundSpec> = {
  citron: {
    bg: CITRON, ink: NOIR, inkSoft: NOIR,
    pill: { bg: NOIR, ink: ALPIN },
    footer: {
      stops: [{ color: CITRON, at: "0%" }, { color: CITRON, at: "12%" }, { color: ALPIN, at: "92%" }, { color: ALPIN, at: "100%" }],
      fallback: CITRON, padTop: 74, padBottom: 54,
    },
    markTop: "wordmark",
  },
  violette: {
    bg: VIOLETTE, ink: NOIR, inkSoft: NOIR,
    pill: { bg: NOIR, ink: ALPIN },
    footer: {
      stops: [{ color: VIOLETTE, at: "0%" }, { color: VIOLETTE, at: "12%" }, { color: ALPIN, at: "92%" }, { color: ALPIN, at: "100%" }],
      fallback: VIOLETTE, padTop: 74, padBottom: 54,
    },
    markTop: "wordmark",
  },
  noir: {
    bg: NOIR, ink: ALPIN, inkSoft: LEMAN,
    pill: { bg: CITRON, ink: NOIR },
    footer: {
      stops: [{ color: NOIR, at: "0%" }, { color: NOIR, at: "8%" }, { color: CITRON, at: "88%" }, { color: CITRON, at: "100%" }],
      fallback: CITRON, padTop: 150, padBottom: 36,
    },
    markTop: "citron",
  },
  alpin: {
    bg: ALPIN, ink: NOIR, inkSoft: RHONE,
    pill: { bg: NOIR, ink: ALPIN },
                                                                               
    footer: {
      stops: [{ color: ALPIN, at: "0%" }, { color: ALPIN, at: "12%" }, { color: "ACCENT", at: "92%" }, { color: "ACCENT", at: "100%" }],
      fallback: ALPIN, padTop: 74, padBottom: 54,
    },
    markTop: "wordmark",
  },
};

                                                                                  
                                                                
export const FOOTER_INK = NOIR;

                                                                                                                                                                                                      
                                                                            
                                                                            
                                                                              
                                                                                
export const TYPE = {
                                
  width: 640,
                        
  gutter: 29,
                                           
  column: 640 - 29 * 2,
                                                                              
                                                                               
                                           
  statement: 62,
  statementLeading: 0.79,
  statementTracking: "-0.035em",
                                                                     
  label: 12,
  labelLeading: 1.35,
  labelTracking: "0.02em",
                         
  read: 15,
  readLeading: 1.45,
                                                                            
                                                                                 
                                                                               
  markHeight: 20,
                    
  banner: { w: 640, h: 360 },
} as const;

                                                                                   
                                                                                 
                                                                                   
                                                       
                                                                              
                                                                               
                                                                              
                                                                                
                                                        
export const FONT_STACK = "'Mundial','Archivo','Helvetica Neue',Arial,sans-serif";

                                                                                                                                                                                                                               
                                                                        
export type AbilEmailPhase =
  | "atracao" | "boasvindas" | "dor" | "repost_blog" | "solucao"
  | "interesse" | "prova" | "qualificacao" | "convite" | "projeto_publicado";

                                                   
export const PHASE_GROUND: Record<AbilEmailPhase, AbilEmailGround> = {
  atracao: "citron",
  boasvindas: "violette",
  dor: "noir",
  repost_blog: "alpin",
  solucao: "citron",
  interesse: "noir",
  prova: "violette",
  qualificacao: "alpin",
  convite: "citron",
  projeto_publicado: "noir",
};

                                                                                 
export const PHASE_ACCENT: Partial<Record<AbilEmailPhase, string>> = {
  repost_blog: VIOLETTE,
  qualificacao: CITRON,
};

   
                                                                                 
                                                                              
                                                       
  
                                                                                   
                                                  
                                                       
                                                                                 
   
export const PHASE_BANNER: Record<AbilEmailPhase, string> = {
  atracao: "/brand/kv-logo-yellow-1.jpg",
  boasvindas: "/brand/kv-woman-1.jpg",
  dor: "/brand/kv-men-2.jpg",
  repost_blog: "/brand/mock-billboard-2.jpg",
  solucao: "/brand/kv-logo-black-2.jpg",
  interesse: "/brand/kv-woman-2.jpg",
  prova: "/brand/kv-icon-yellow-1.jpg",
  qualificacao: "/brand/kv-men-3.jpg",
  convite: "/brand/kv-woman-3.jpg",
  projeto_publicado: "/brand/mock-website-2.jpg",
};

                                                   
export const PHASE_NUMBER: Record<AbilEmailPhase, string> = {
  atracao: "01", boasvindas: "02", dor: "03", repost_blog: "04", solucao: "05",
  interesse: "06", prova: "07", qualificacao: "08", convite: "09", projeto_publicado: "10",
};

                                                                             
                                                       
export const RAIL = {
  disciplines: ["Digital", "Publicité", "Branding"],
  signature: ["Vraiment", "habiles."],
};

                            
export const CONTACT = {
  site: "abil.ch",
  phone: "+41 22 548 00 40",
  address: ["59 Rue de Berne", "1201 Genève"],
};

                                                              
export function accentFor(phase: AbilEmailPhase | undefined, fallback = VIOLETTE): string {
  return (phase && PHASE_ACCENT[phase]) || fallback;
}

                                                                       
export function footerStops(ground: AbilEmailGround, accent: string): string {
  return GROUNDS[ground].footer.stops
    .map((s) => `${s.color === "ACCENT" ? accent : s.color} ${s.at}`)
    .join(", ");
}

                                                                 
export function footerFallback(ground: AbilEmailGround, accent: string): string {
  const f = GROUNDS[ground].footer.fallback;
  return f === "ACCENT" ? accent : f;
}
