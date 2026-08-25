   
                                                                   
  
                                                                                
                                                                                  
                                                                              
                                                                                
                                  
  
                                                          
  
                                                                          
                                                                              
                                                                            
                                                                       
                                                                            
  
                                                                            
                                         
                                         
                                           
                                          
  
                                                                                  
                                                                              
                                 
   

export type EmailField = "subject" | "preheader" | "body" | "blockKey" | "blockText" | "cta";

export type FieldSpec = {
                                                
  max: number;
                                                                  
  alvo: [number, number];
                                        
  porLinha: number;
                                       
  linhas: number;
                                                                           
  palavraMax: number;
};

export const EMAIL_CAPS: Record<EmailField, FieldSpec> = {
                                               
                                                                                        
                                                                             
  subject:   { max: 68,  alvo: [20, 42],  porLinha: 17, linhas: 4, palavraMax: 14 },
                                                                                 
                                                        
  preheader: { max: 110, alvo: [50, 90],  porLinha: 74, linhas: 1, palavraMax: 24 },
                                                      
  body:      { max: 270, alvo: [60, 200], porLinha: 45, linhas: 6, palavraMax: 40 },
                                                                                
                                                                                
                                                        
  blockKey:  { max: 20,  alvo: [4, 14],   porLinha: 10, linhas: 2, palavraMax: 10 },
                                                           
                                                                            
                                                                             
                                                                             
                                                                 
  blockText: { max: 156, alvo: [55, 100], porLinha: 39, linhas: 4, palavraMax: 30 },
                                                    
  cta:       { max: 48,  alvo: [15, 28],  porLinha: 48, linhas: 1, palavraMax: 20 },
};

export const capOf = (f: EmailField): number => EMAIL_CAPS[f].max;

   
                                                                             
                                              
   
export function fitEmailField(f: EmailField, texto: string): string {
  const spec = EMAIL_CAPS[f];
  const t = String(texto || "").trim().replace(/\s+/g, " ");
  if (t.length <= spec.max) return t;
  const corte = t.slice(0, spec.max + 1);
  const ultimo = corte.lastIndexOf(" ");
  const base = (ultimo > spec.max * 0.55 ? corte.slice(0, ultimo) : t.slice(0, spec.max)).trim();
  return base.replace(/[\s,;:.\-\u2013]+$/, "");
}

                                                                       
export function palavraLongaDemais(f: EmailField, texto: string): string | null {
  const spec = EMAIL_CAPS[f];
  const m = String(texto || "").split(/\s+/).find((w) => w.replace(/[.,;:!?()"]/g, "").length > spec.palavraMax);
  return m || null;
}

const NOMES: Record<EmailField, Record<string, string>> = {
  subject:   { pt: "o assunto (a frase grande do e-mail)", fr: "l'objet (la grande phrase de l'e-mail)", en: "the subject (the big statement)", de: "der Betreff (der große Satz)", it: "l'oggetto (la frase grande)" },
  preheader: { pt: "o pré-cabeçalho", fr: "le pré-en-tête", en: "the preheader", de: "der Preheader", it: "il preheader" },
  body:      { pt: "cada parágrafo do corpo", fr: "chaque paragraphe du corps", en: "each body paragraph", de: "jeder Absatz des Textes", it: "ogni paragrafo del corpo" },
  blockKey:  { pt: "a etiqueta de cada linha de leitura", fr: "l'étiquette de chaque ligne", en: "each reading row's label", de: "die Beschriftung jeder Zeile", it: "l'etichetta di ogni riga" },
  blockText: { pt: "o texto de cada linha de leitura", fr: "le texte de chaque ligne", en: "each reading row's text", de: "der Text jeder Zeile", it: "il testo di ogni riga" },
  cta:       { pt: "o botão", fr: "le bouton", en: "the button", de: "die Schaltfläche", it: "il pulsante" },
};

   
                                                                              
                                                                        
   
export function emailFieldHint(f: EmailField, lang = "pt"): string {
  const s = EMAIL_CAPS[f];
  const nome = NOMES[f][lang] || NOMES[f].pt;
  const frases: Record<string, string> = {
    pt: `${nome}: entre ${s.alvo[0]} e ${s.alvo[1]} caracteres (nunca mais de ${s.max}); nenhuma palavra com mais de ${s.palavraMax} letras`,
    fr: `${nome} : entre ${s.alvo[0]} et ${s.alvo[1]} caractères (jamais plus de ${s.max}) ; aucun mot de plus de ${s.palavraMax} lettres`,
    en: `${nome}: between ${s.alvo[0]} and ${s.alvo[1]} characters (never above ${s.max}); no word longer than ${s.palavraMax} letters`,
    de: `${nome}: zwischen ${s.alvo[0]} und ${s.alvo[1]} Zeichen (nie mehr als ${s.max}); kein Wort mit mehr als ${s.palavraMax} Buchstaben`,
    it: `${nome}: tra ${s.alvo[0]} e ${s.alvo[1]} caratteri (mai oltre ${s.max}); nessuna parola di più di ${s.palavraMax} lettere`,
  };
  return frases[lang] || frases.pt;
}

                                                              
export function emailCapsPrompt(lang = "pt", campos: EmailField[] = ["subject", "preheader", "body", "blockKey", "blockText", "cta"]): string {
  const cab: Record<string, string> = {
    pt: "LIMITES DO DESENHO (medidos no template, não são sugestões: passar deles parte o layout):",
    fr: "LIMITES DE LA MAQUETTE (mesurées sur le modèle, les dépasser casse la mise en page) :",
    en: "LAYOUT LIMITS (measured on the template; going past them breaks the layout):",
    de: "LAYOUT-GRENZEN (am Template gemessen; sie zu überschreiten zerstört das Layout):",
    it: "LIMITI DELLA GRAFICA (misurati sul modello; superarli rompe il layout):",
  };
  return [cab[lang] || cab.pt, ...campos.map((f) => `- ${emailFieldHint(f, lang)}`)].join("\n");
}
