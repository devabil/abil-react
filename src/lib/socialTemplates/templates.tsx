/* eslint-disable react-refresh/only-export-components -- Renderer module consumed by dashboard editors, not a Fast Refresh component boundary. */

   
                                                                                               
  
                                                                                  
                                                                                            
                                                                                            
                                                                                          
                                                                                        
                                                                                 
  
                                                                         
                                                                                           
                                                                                        
                                                                                                
  
                                                                                          
                                                                                           
                                                                
   

import * as React from "react";
import {
  FORMAT_SPECS,
  getHashtag,
  TEMPLATE_META,
  TEMPLATE_SAMPLE_IMG,
  type SocialFormat,
  type BrandColor,
  type TemplateTag,
  type PubLang,
} from "./tokens";
import {
  Plate,
  ElementOffsetsContext,
  useElOffset,
  useElText,
  composeOffsetStyle,
  type ElOffset,
  type ElStyle,
} from "./atoms";

export type TemplateRenderProps = {
  title: string;
  supportText?: string;
  disruptivePhrase?: string;
  imageSrc?: string;
  carouselImages?: string[];
  bgColor?: BrandColor;
  format: SocialFormat;
  pubLang: PubLang;
  hashtagOverride?: string;
  scale?: number;
  slideIndex?: number;
                                                                             
                                                                                      
                                                                             
                                                                            
  imageTools?: boolean;
                                                                                
                                            
  slotPositions?: Record<number, string>;
                                                                                      
                                                                                       
                                         
  asteriskImageSrc?: string;
                                                                             
                                                                                
  elementOffsets?: Record<string, ElOffset>;
                                                                                
                                                      
  textElementStyles?: Record<string, ElStyle>;
                                                                                          
                                                                                     
                                                                                        
  elementRich?: Record<string, string>;
                                                                              
  textOverrides?: Record<string, string>;
};


                                                                                                                                                                                                      
                                                                   
                                                        
                                                                    
                                                                   
                                                                                                                                                                                                         
const AB = {
  noir: "#0a0a0b",
  alpin: "#ffffff",
  tela: "#efefef",
  rhone: "#7e7e7e",
  citron: "#d2ff01",
  violette: "#be8efc",
} as const;

const FONTE = "'mundial', 'Figtree', 'Helvetica Neue', Helvetica, Arial, sans-serif";

type Tone = { bg: string; text: string; soft: string; mono: string; hair: string; count: string; lightText: boolean };

function tone(bgColor: BrandColor): Tone {
                                                                      
                                                                         
  const inkNoir = {
    text: AB.noir,
    soft: "rgba(10,10,11,0.76)",
    mono: "rgba(10,10,11,0.64)",
    hair: "rgba(10,10,11,0.18)",
    count: "rgba(10,10,11,0.55)",
    lightText: false,
  };
  switch (bgColor) {
    case "noir":
      return { bg: AB.noir, text: AB.alpin, soft: "rgba(255,255,255,0.72)", mono: "rgba(255,255,255,0.6)", hair: "rgba(255,255,255,0.14)", count: "rgba(255,255,255,0.56)", lightText: true };
    case "rouge":
      return { bg: AB.citron, ...inkNoir };
    case "violet":
      return { bg: AB.violette, ...inkNoir };
    case "beige":
      return { bg: AB.tela, ...inkNoir, mono: AB.rhone, count: AB.rhone };
    default:
      return { bg: AB.alpin, ...inkNoir, mono: AB.rhone, count: AB.rhone };
  }
}

                                   

const pad2 = (n: number) => String(n).padStart(2, "0");

function Container({ children, bgColor, format, scale = 1, fundo }: { children: React.ReactNode; bgColor: BrandColor; format: SocialFormat; scale?: number; fundo?: string }) {
  const spec = FORMAT_SPECS[format];
  const t = tone(bgColor);
  return (
    <div
      className={`relative ${spec.tailwindAspect} overflow-hidden`}
      style={{ background: fundo || t.bg, color: t.text, transform: `scale(${scale})`, transformOrigin: "top left", containerType: "inline-size" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

                                                                                                                                                                                                      
                                                                      
                                                                       
                                                                                                                                                                                                         



                                                                                       
function MicroV3({
  children, color, className = "", size, elName,
}: { children: React.ReactNode; color: string; className?: string; size?: string; elName?: string }) {
  const off = useElOffset(elName);
  const content = useElText(elName, children);
  return (
    <span
      className={className}
      {...off.dataAttr}
      style={{
        fontFamily: FONTE,
        fontWeight: 400,
        textTransform: "uppercase",
        fontSize: size || "clamp(0.46rem, 2cqw, 0.75rem)",
        letterSpacing: "0.013em",
        color,
        lineHeight: 1.2,
        display: "inline-block",
        ...off.style,
      }}
    >
      {content}
    </span>
  );
}




                                                                                  
function ProgressV3({ current, total, color, elName }: { current: number; total: number; color: string; elName?: string }) {
  return <MicroV3 color={color} elName={elName}>{pad2(current)} / {pad2(total)}</MicroV3>;
}



const ABIL_HASHTAGS: Record<TemplateTag, Record<PubLang, string>> = {
  "frases-criativas": { fr: "#VraimentHabiles", pt: "#VraimentHabiles", en: "#VraimentHabiles", de: "#VraimentHabiles", it: "#VraimentHabiles" },
  "dicas-marketing":  { fr: "#AbilMedias", pt: "#AbilMedias", en: "#AbilMedias", de: "#AbilMedias", it: "#AbilMedias" },
  "servicos":         { fr: "#AbilMedias", pt: "#AbilMedias", en: "#AbilMedias", de: "#AbilMedias", it: "#AbilMedias" },
  "repost-blog":      { fr: "#AbilJournal", pt: "#AbilJournal", en: "#AbilJournal", de: "#AbilJournal", it: "#AbilJournal" },
  "repost-projeto":   { fr: "#AbilProjets", pt: "#AbilProjetos", en: "#AbilProjects", de: "#AbilProjekte", it: "#AbilProgetti" },
  "curiosidades":     { fr: "#AbilMedias", pt: "#AbilMedias", en: "#AbilMedias", de: "#AbilMedias", it: "#AbilMedias" },
  "diferenciais":     { fr: "#AbilMedias", pt: "#AbilMedias", en: "#AbilMedias", de: "#AbilMedias", it: "#AbilMedias" },
  "bastidores":       { fr: "#DansLAtelier", pt: "#NoAtelier", en: "#InTheStudio", de: "#ImAtelier", it: "#InAtelier" },
};

                                                                             
                                                                             
                                                                            
                                 
type Lang = "manifesto" | "editorial" | "carousel" | "photo" | "diferenciais" | "curiosidades";
type Variant = "statement" | "stat" | "points";
type Def = {
  lang: Lang; bg: BrandColor; title: string; support: string;
  image?: string; variant?: Variant; stat?: string; points?: string[]; number?: string;
                                                                    
  fundo?: string;
};
const DEFAULTS: Record<TemplateTag, Def> = {
  "frases-criativas": {
    lang: "manifesto", bg: "rouge", variant: "statement",
    title: "Fait à\nGenève.\nVu partout.",
    support: "Lorem ipsum dolor sit\namet, consectetuer\nadipiscing elit, sed diam\nnonummy nibh euismod\ntincidunt ut laoreet\ndolore magna aliquam\nerat volutpat.",
    image: TEMPLATE_SAMPLE_IMG["frases-criativas"],
  },
  "dicas-marketing": {
    lang: "editorial", bg: "violet",
    title: "L'habileté\nreste\nhumaine.",
    support: "Lorem ipsum\ndolor sit amet,\nconsectetuer\nadipiscing elit.",
    image: TEMPLATE_SAMPLE_IMG["dicas-marketing"],
  },
  "curiosidades": {
    lang: "curiosidades", bg: "rouge",
    title: "Vraiment\nhabiles.",
    support: "Lorem ipsum dolor sit amet,\nconsectetuer adipiscing elit, sed\ndiam nonummy nibh euismod\ntincidunt ut laoreet dolore magna\naliquam erat volutpat.",
  },
  "repost-projeto": {
    lang: "carousel", bg: "noir", number: "01",
    title: "L'habileté\nreste\nhumaine.",
    support: "Lorem ipsum dolor sit\namet, consectetuer\nadipiscing elit, sed diam\nnonummy nibh euismod\ntincidunt ut laoreet\ndolore magna aliquam\nerat volutpat.",
    image: TEMPLATE_SAMPLE_IMG["repost-projeto"],
  },
  "servicos": {
    lang: "editorial", bg: "rouge",
    title: "L'habileté\nreste\nhumaine.",
    support: "Lorem ipsum\ndolor sit amet,\nconsectetuer\nadipiscing elit,\nsed diam\nnonummy nibh\neuismod tincidunt\nut laoreet dolore\nmagna aliquam\nerat volutpat.",
    image: TEMPLATE_SAMPLE_IMG["servicos"],
  },
  "repost-blog": {
    lang: "editorial", bg: "violet",
    title: "L'habileté\nreste\nhumaine.",
    support: "Lorem ipsum dolor sit amet,\nconsectetuer adipiscing\nelit, sed diam nonummy nibh\neuismod tincidunt ut\nlaoreet dolore magna\naliquam erat volutpat.",
    image: TEMPLATE_SAMPLE_IMG["repost-blog"],
  },
                                                                                    
                                                                                 
                                                                                
                                                                               
                                                              
  "diferenciais": {
    lang: "manifesto", bg: "blanc", variant: "statement",
    title: "Vraiment\nhabiles.",
    support: "Lorem ipsum dolor sit\namet, consectetuer\nadipiscing elit, sed diam\nnonummy nibh euismod\ntincidunt ut laoreet\ndolore magna aliquam\nerat volutpat.",
    fundo: "linear-gradient(180deg, #ffffff 0%, #ffffff 46%, #fbffe4 66%, #eaff9a 82%, #dcff4f 92%, #d2ff01 100%)",
  },
  "bastidores": {
    lang: "manifesto", bg: "violet", variant: "statement",
    title: "L'habileté\nreste\nhumaine.",
    support: "Lorem ipsum dolor sit\namet, consectetuer\nadipiscing elit, sed diam\nnonummy nibh euismod\ntincidunt ut laoreet\ndolore magna aliquam\nerat volutpat.",
    fundo: "linear-gradient(180deg, #be8efc 0%, #be8efc 46%, #d3b3fd 66%, #e6d4fe 82%, #f5ecff 92%, #ffffff 100%)",
  },
};

                                                                               
                                                                              
export function templateHasPhoto(tag: TemplateTag): boolean {
  const def = DEFAULTS[tag] || DEFAULTS["frases-criativas"];
  if (def.fundo) return false;                                                                   
  return def.lang !== "curiosidades" && def.lang !== "diferenciais";
}

                                                                                                                                                                                                      
                                                                  

                                                                    
                                                                     
                                                                    
                                                                   
                                                                     
                                                               
                        

                                                                         
                                                            
                                                                          
                                                                           
                                                                
                                                                  

                      
                                                      
                                                            
                                                                   
                                                                 
                                     

                                                                
                                                                      
                                                         
                                                                  
                                                                                                                                                                                                               

                                                                                                                                                                                                      
                                

                                                                      
                                                                      
                                                                       
                                                                     

                                                                      
                                                                    
                                                                    
                                                                    
                                                                  
                                                                    
                                           
                                                                      
                                                                       
                                                                    
                                                                       
                                                                  

                                                                 
                                                                   
                                                                      
                                                                                                                                                                                                               
type Fam = "portrait" | "square" | "story" | "wide";
function fam(format: SocialFormat): Fam {
  if (format === "story") return "story";
  if (format === "feed" || format === "twitter") return "wide";
  if (format === "square") return "square";
  return "portrait";
}

type GeoFam = {
  statement: string; medium: string; label: string; corner: string;
  railTop: string; railBottom: string; ml: string;
  marcaGrande: string; marcaPequena: string;
};
const GEO: Record<Fam, GeoFam> = {
  portrait: { statement: "13.14cqw", medium: "5.66cqw", label: "1.66cqw", corner: "2.22cqw",
              railTop: "3.64%", railBottom: "4.07%",  ml: "4.7%", marcaGrande: "90.2%", marcaPequena: "45.1%" },
  square:   { statement: "13.14cqw", medium: "5.66cqw", label: "1.66cqw", corner: "2.22cqw",
              railTop: "4.6%",  railBottom: "4.3%",  ml: "4.7%", marcaGrande: "90.2%", marcaPequena: "45.1%" },
  story:    { statement: "13.14cqw", medium: "5.66cqw", label: "1.66cqw", corner: "2.22cqw",
              railTop: "5.4%",  railBottom: "14.5%", ml: "4.7%", marcaGrande: "90.2%", marcaPequena: "45.1%" },
                                                                       
                                                                      
                                                                       
  wide:     { statement: "7.4cqw",   medium: "3.5cqw",  label: "1.15cqw", corner: "1.55cqw",
              railTop: "6.4%",  railBottom: "6.4%",  ml: "3.6%", marcaGrande: "46%",   marcaPequena: "23%" },
};

                                                                    
type Caixa = { top?: string; bottom?: string; left?: string; right?: string; width: string };
type Comp = { marca?: Caixa; frase: Caixa; leitura: Caixa };

   
                                                                  
                                                                       
                                                                     
                                   
   
const COMP: Record<1 | 2 | 3 | 4 | 5 | 6, Record<Fam, Comp>> = {
                                                                             
  1: {
    portrait: { marca: { top: "15.1%", left: "4.7%", width: "90.2%" },
                leitura: { left: "68.4%", top: "39.6%", width: "27%" },
                frase:   { left: "4.7%", top: "61.4%", width: "90%" } },
    square:   { marca: { top: "11.5%", left: "4.7%", width: "90.2%" },
                leitura: { left: "68.4%", top: "35.5%", width: "27%" },
                frase:   { left: "4.7%", top: "57.5%", width: "90%" } },
    story:    { marca: { top: "13%", left: "4.7%", width: "90.2%" },
                leitura: { left: "68.4%", top: "33%", width: "27%" },
                frase:   { left: "4.7%", top: "60%", width: "90%" } },
    wide:     { marca: { top: "13%", left: "3.6%", width: "46%" },
                leitura: { right: "4%", top: "22%", width: "26%" },
                frase:   { left: "3.6%", bottom: "17%", width: "54%" } },
  },
                                                                                      
  2: {
    portrait: { marca: { top: "4.2%", left: "3.7%", width: "45.1%" },
                leitura: { left: "5.0%", top: "21.8%", width: "30%" },
                frase:   { left: "4.7%", top: "53.5%", width: "40%" } },
    square:   { marca: { top: "5.2%", left: "3.7%", width: "45.1%" },
                leitura: { left: "5.0%", top: "24%", width: "30%" },
                frase:   { left: "4.7%", top: "50%", width: "46%" } },
    story:    { marca: { top: "4.6%", left: "3.7%", width: "45.1%" },
                leitura: { left: "5.0%", top: "17.5%", width: "30%" },
                frase:   { left: "4.7%", top: "56%", width: "44%" } },
    wide:     { marca: { top: "9%", left: "3.6%", width: "23%" },
                leitura: { left: "3.6%", top: "28%", width: "24%" },
                frase:   { left: "3.6%", bottom: "16%", width: "44%" } },
  },
                                                                                     
  3: {
    portrait: { marca: { top: "69.5%", left: "5.8%", width: "90.2%" },
                leitura: { left: "37.4%", top: "42.3%", width: "45%" },
                frase:   { left: "5.75%", top: "12.3%", width: "90%" } },
    square:   { marca: { top: "64%", left: "5.8%", width: "90.2%" },
                leitura: { left: "37.4%", top: "40%", width: "45%" },
                frase:   { left: "5.75%", top: "15%", width: "90%" } },
    story:    { marca: { top: "63%", left: "5.8%", width: "90.2%" },
                leitura: { left: "37.4%", top: "40%", width: "45%" },
                frase:   { left: "5.75%", top: "13%", width: "90%" } },
                                                                        
                                                                       
    wide:     { marca: { bottom: "14%", right: "4%", width: "46%" },
                leitura: { left: "3.6%", top: "52%", width: "30%" },
                frase:   { left: "3.6%", top: "16%", width: "52%" } },
  },
                                                                                
  4: {
    portrait: { marca: { top: "69.5%", left: "5.8%", width: "90.2%" },
                leitura: { left: "5.3%", top: "23.0%", width: "28%" },
                frase:   { left: "37.6%", top: "48.3%", width: "56%" } },
    square:   { marca: { top: "63%", left: "5.8%", width: "90.2%" },
                leitura: { left: "5.3%", top: "19%", width: "28%" },
                frase:   { left: "37.6%", top: "42%", width: "56%" } },
    story:    { marca: { top: "62%", left: "5.8%", width: "90.2%" },
                leitura: { left: "5.3%", top: "22%", width: "28%" },
                frase:   { left: "37.6%", top: "44%", width: "56%" } },
    wide:     { marca: { bottom: "12%", left: "3.6%", width: "46%" },
                leitura: { left: "3.6%", top: "20%", width: "22%" },
                frase:   { left: "31%", top: "34%", width: "50%" } },
  },
                                                                  
  5: {
    portrait: { marca: { top: "4.2%", left: "3.7%", width: "45.1%" },
                leitura: { left: "19.62%", top: "55.8%", width: "18%" },
                frase:   { left: "4.7%", top: "26.6%", width: "40%" } },
    square:   { marca: { top: "5.2%", left: "3.7%", width: "45.1%" },
                leitura: { left: "19.62%", top: "56%", width: "20%" },
                frase:   { left: "4.7%", top: "24.5%", width: "42%" } },
    story:    { marca: { top: "4.6%", left: "3.7%", width: "45.1%" },
                leitura: { left: "19.62%", top: "52%", width: "20%" },
                frase:   { left: "4.7%", top: "22%", width: "42%" } },
    wide:     { marca: { top: "9%", left: "3.6%", width: "23%" },
                leitura: { left: "3.6%", top: "62%", width: "26%" },
                frase:   { left: "3.6%", top: "30%", width: "44%" } },
  },
                                                                            
  6: {
    portrait: { marca: { top: "4.2%", left: "3.7%", width: "45.1%" },
                leitura: { left: "67.25%", top: "77.3%", width: "28%" },
                frase:   { left: "3.7%", top: "18.1%", width: "46%" } },
    square:   { marca: { top: "5.2%", left: "3.7%", width: "45.1%" },
                leitura: { left: "67.25%", top: "72%", width: "28%" },
                frase:   { left: "3.7%", top: "17%", width: "46%" } },
    story:    { marca: { top: "4.6%", left: "3.7%", width: "45.1%" },
                leitura: { left: "67.25%", top: "70%", width: "28%" },
                frase:   { left: "3.7%", top: "16%", width: "46%" } },
    wide:     { marca: { top: "9%", left: "3.6%", width: "23%" },
                leitura: { right: "4%", bottom: "16%", width: "26%" },
                frase:   { left: "3.6%", top: "32%", width: "44%" } },
  },
};

                                             
   
                                                                            
  
                                                                              
                                                                               
                                                                               
                                                                                
                                                                             
                                                                    
                                                                
   
const STATEMENT_REF = 24;
function ajustaStatement(base: string, texto: string): string {
  const n = String(texto || "").replace(/\s+/g, " ").trim().length;
  if (n <= STATEMENT_REF) return base;
  const m = /^([\d.]+)cqw$/.exec(base);
  if (!m) return base;
  const fator = Math.max(0.62, Math.sqrt(STATEMENT_REF / n));
  return `${(parseFloat(m[1]) * fator).toFixed(2)}cqw`;
}

function cx(b: Caixa): React.CSSProperties {
  return {
    position: "absolute",
    ...(b.top !== undefined ? { top: b.top } : {}),
    ...(b.bottom !== undefined ? { bottom: b.bottom } : {}),
    ...(b.left !== undefined ? { left: b.left } : {}),
    ...(b.right !== undefined ? { right: b.right } : {}),
    width: b.width,
  };
}

const SM = {
  leadStatement: 0.795,
  leadLabel: 1.154,
} as const;

                                                                             
function SmText({ children, size, lead, color, elName, style, className = "" }: {
  children: React.ReactNode; size: string; lead: number; color: string;
  elName?: string; style?: React.CSSProperties; className?: string;
}) {
  const off = useElOffset(elName);
  const ctx = React.useContext(ElementOffsetsContext);
  const rich = elName && ctx.rich ? ctx.rich[elName] : undefined;
  const content = useElText(elName, children);
  return (
    <div
      className={className}
      {...off.dataAttr}
      style={{
        fontFamily: FONTE, fontWeight: 300, textTransform: "uppercase",
        fontSize: size, lineHeight: lead, letterSpacing: "-0.01em",
        color, margin: 0, whiteSpace: "pre-line", ...style, ...off.style,
      } as React.CSSProperties}
    >
      {rich ? <span dangerouslySetInnerHTML={{ __html: rich }} /> : content}
    </div>
  );
}

                                                                         
function SmTopRail({ ink, cheio, cantoDireita, elName, g }: { ink: string; cheio: boolean; cantoDireita?: boolean; elName?: string; g: GeoFam }) {
  const corner = <SmText size={g.corner} lead={1} color={ink} elName={elName}>ABIL.CH</SmText>;
  if (!cheio) {
    return <div className="absolute" style={{ top: g.railTop, ...(cantoDireita ? { right: g.ml } : { left: g.ml }) }}>{corner}</div>;
  }
  return (
    <>
      <div className="absolute" style={{ left: g.ml, top: g.railTop }}>{corner}</div>
      <div className="absolute" style={{ left: "36.6%", top: "4.1%" }}>
        <SmText size={g.label} lead={SM.leadLabel} color={ink} elName="rail-disciplines">{"Digital\nPublicité\nBranding"}</SmText>
      </div>
      <div className="absolute" style={{ left: "80.2%", top: "4.1%" }}>
        <SmText size={g.label} lead={SM.leadLabel} color={ink} elName="rail-signature">{"Vraiment\nhabiles."}</SmText>
      </div>
    </>
  );
}

                                                                  
function SmBottomRail({ ink, g }: { ink: string; g: GeoFam }) {
  return (
    <>
      <div className="absolute" style={{ left: "5.0%", bottom: g.railBottom }}>
        <SmText size={g.label} lead={1} color={ink} elName="contact-1">support@abil.ch</SmText>
      </div>
      <div className="absolute" style={{ left: "34.9%", bottom: g.railBottom }}>
        <SmText size={g.label} lead={1} color={ink} elName="contact-2">+41 22 548 00 40</SmText>
      </div>
      <div className="absolute" style={{ left: "67.2%", bottom: g.railBottom }}>
        <SmText size={g.label} lead={1} color={ink} elName="contact-3">59 Rue de Berne, 1201 Genève</SmText>
      </div>
    </>
  );
}

                                                                                 
function SmBigWordmark({ cor, style, elName, imageSrc, width = "91%" }: { cor: "preto" | "citron" | "branco"; style?: React.CSSProperties; elName?: string; imageSrc?: string; width?: string }) {
  const ctx = React.useContext(ElementOffsetsContext);
  const composed = composeOffsetStyle(style, elName, ctx.offsets, ctx.editMode, ctx.styles);
  const src = imageSrc || (cor === "citron" ? "/brand/abil-wordmark-citron.svg" : "/brand/abil-wordmark.svg");
  return (
    <img
      src={src} alt="ABiL" aria-hidden="true" {...composed.dataAttr}
      style={{ width, height: "auto", display: "block",
                                                                                
                                                                          
        ...(cor === "branco" && !imageSrc ? { filter: "invert(1)" } : {}),
        ...composed.style }}
    />
  );
}

   
                                                               
  
                                                                        
                                                                              
                                                                               
                                                                           
                                                                          
                                                                 
                                                                              
   
function SmPhoto({ src, slotIndex, objectPosition, rect }: { src: string; slotIndex?: number; objectPosition?: string; rect?: { l: string; t: string; w: string; h: string } }) {
  const caixa: React.CSSProperties = rect
    ? { position: "absolute", left: rect.l, top: rect.t, width: rect.w, height: rect.h }
    : { position: "absolute", inset: 0, width: "100%", height: "100%" };
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Plate src={src} border={false} slotIndex={slotIndex} objectPosition={objectPosition} style={caixa} />
    </div>
  );
}

   
                                                                           
  
                                                                             
                                                                               
                                                                               
                                                                               
                                                                            
                                                                          
   
const FOTO = {
  tela1: { l: -48.3, w: 274.3, cy: 38.25, a: 1.777 },
  tela2: { l: -79.5, w: 298.2, cy: 54.40, a: 1.777 },
  tela3: { l: -29.2, w: 222.1, cy: 50.00, a: 1.777 },
  tela4: { l: -29.2, w: 222.1, cy: 50.00, a: 1.777 },
  tela5: { l: -25.0, w: 170.5, cy: 50.00, a: 1.261 },
  tela6: { l: -43.8, w: 222.1, cy: 50.00, a: 1.777 },
} as const;

                                                                
function rectPara(k: keyof typeof FOTO, format: SocialFormat): { l: string; t: string; w: string; h: string } {
  const f = FOTO[k];
  const spec = FORMAT_SPECS[format];
  const F = spec.width / spec.height;
  const cxImg = (50 - f.l) / f.w;                                                          
                                                                               
                                                                                    
  const wMin = 100 * Math.max(1, f.a / F);
  const w = (format === "feed" || format === "twitter") ? wMin : Math.max(f.w, wMin);
  const h = w * F / f.a;
  const l = 50 - cxImg * w;
  return { l: `${l.toFixed(1)}%`, t: `${(f.cy - h / 2).toFixed(1)}%`, w: `${w.toFixed(1)}%`, h: `${h.toFixed(1)}%` };
}

   
                                                                       
  
                                                                              
                                                                           
                                                                             
                                                         
  
                                                                             
                                                                           
                                                 
   
   
                                                            
  
                                                                              
                                                                            
                                                                             
                                                          
  
                                                                               
                                                                           
                                                                       
                               
   
function reancorar(gradiente: string, alturaOrigem: number, alturaDestino: number): string {
  if (Math.abs(alturaOrigem - alturaDestino) < 1) return gradiente;
  return gradiente.replace(/ ([\d.]+)%/g, (_m, num: string) => {
    const p = parseFloat(num);
    const px = (p / 100) * alturaOrigem;
    const doTopo = (px / alturaDestino) * 100;
    const doFundo = 100 - ((alturaOrigem - px) / alturaDestino) * 100;
    const w = Math.min(1, Math.max(0, (p - 25) / 50));                                        
    return ` ${(doTopo * (1 - w) + doFundo * w).toFixed(2)}%`;
  });
}

function SmVeu({ gradiente, format }: { gradiente: string; format?: SocialFormat }) {
                                                                               
                                                                               
                                            
  if (typeof window !== "undefined" && (window as unknown as { __SEM_VEU?: boolean }).__SEM_VEU) return null;
                                                                   
  const g = (format && gradiente.startsWith("linear-gradient(180deg"))
    ? reancorar(gradiente, 1350, FORMAT_SPECS[format].height)
    : gradiente;
  return <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: g, pointerEvents: "none" }} />;
}

const CIT = AB.citron, NOI = AB.noir, VIO = AB.violette, ALP = AB.alpin;

   
                                           
  
                                                                           
                                                                               
                                                                             
                                                                            
                                                         
   
const VEU_LARGO = {
  tela1: `linear-gradient(90deg, ${CIT} 0%, rgba(228,255,120,0.92) 34%, rgba(245,255,200,0.55) 56%, rgba(255,255,255,0) 76%)`,
  tela2: `linear-gradient(90deg, ${VIO} 0%, rgba(190,142,252,0.92) 32%, rgba(190,142,252,0.45) 54%, rgba(190,142,252,0) 76%)`,
  tela3: `linear-gradient(90deg, ${CIT} 0%, rgba(210,255,1,0.94) 30%, rgba(210,255,1,0.40) 52%, rgba(10,10,11,0) 72%)`,
  tela4: `linear-gradient(90deg, ${NOI} 0%, rgba(10,10,11,0.90) 32%, rgba(10,10,11,0.45) 54%, rgba(10,10,11,0) 76%)`,
  tela5: `linear-gradient(90deg, rgba(210,255,1,0.86) 0%, rgba(210,255,1,0.55) 30%, rgba(210,255,1,0) 58%)`,
  tela6: `linear-gradient(90deg, ${VIO} 0%, rgba(190,142,252,0.90) 30%, rgba(190,142,252,0.42) 52%, rgba(190,142,252,0) 74%)`,
} as const;


   
                                                                              
                             
  
                                                                               
                                                                              
                                                                            
               
  
                                                                      
                                                                              
                                                                
                                                                         
                                                     
                                                                           
                                            
  
                                        
                                                                               
                                                        
                                                         
                                                       
                                                       
                                                        
   
const VEU = {
                                                                             
                                                   
  tela1: `linear-gradient(180deg, rgba(210,255,3,0.000) 0%, rgba(210,255,4,0.000) 4%, rgba(211,255,8,0.000) 8%, rgba(212,255,13,0.000) 12%, rgba(213,255,20,0.001) 16%, rgba(215,255,29,0.000) 20%, rgba(217,255,39,0.000) 24%, rgba(219,255,51,0.093) 28%, rgba(221,255,64,0.275) 32%, rgba(223,255,77,0.524) 36%, rgba(226,255,92,0.689) 40%, rgba(228,255,106,0.845) 44%, rgba(231,255,121,0.795) 48%, rgba(234,255,136,0.792) 52%, rgba(237,255,151,0.759) 56%, rgba(239,255,166,0.800) 60%, rgba(242,255,180,0.844) 64%, rgba(244,255,194,0.866) 68%, rgba(246,255,207,0.877) 72%, rgba(248,255,218,0.889) 76%, rgba(250,255,229,0.903) 80%, rgba(252,255,238,0.919) 84%, rgba(253,255,245,0.939) 88%, rgba(254,255,250,0.960) 92%, rgba(255,255,254,0.981) 96%, rgba(255,255,255,0.996) 100%)`,
                                                                                
  tela2: `linear-gradient(180deg, rgba(183,114,228,0.000) 0%, rgba(183,114,228,0.000) 4%, rgba(183,115,228,0.000) 8%, rgba(183,115,229,0.000) 12%, rgba(184,116,230,0.000) 16%, rgba(184,117,230,0.000) 20%, rgba(184,118,231,0.092) 24%, rgba(185,120,232,0.330) 28%, rgba(185,121,234,0.254) 32%, rgba(185,123,235,0.137) 36%, rgba(186,124,236,0.048) 40%, rgba(186,126,237,0.000) 44%, rgba(187,128,239,0.000) 48%, rgba(187,129,240,0.030) 52%, rgba(188,131,242,0.121) 56%, rgba(188,133,243,0.301) 60%, rgba(189,134,244,0.151) 64%, rgba(189,136,245,0.005) 68%, rgba(189,137,247,0.143) 72%, rgba(190,139,248,0.421) 76%, rgba(190,140,249,0.696) 80%, rgba(190,141,249,0.946) 84%, rgba(191,142,250,1.000) 88%, rgba(191,142,251,1.000) 92%, rgba(191,143,251,1.000) 96%, rgba(191,143,251,1.000) 100%)`,
                                                                         
                     
  tela3: `linear-gradient(180deg, rgba(210,255,1,1) 0%, rgba(210,255,1,1) 13%, rgba(170,195,55,0.90) 26%, rgba(105,115,70,0.90) 40%, rgba(45,45,42,0.92) 55%, rgba(10,10,11,1) 64%, rgba(10,10,11,1) 100%)`,
                                                                              
  tela4: `linear-gradient(180deg, rgba(6,6,8,0.000) 0%, rgba(7,7,8,0.000) 4%, rgba(10,10,8,0.000) 8%, rgba(14,16,8,0.000) 12%, rgba(19,23,8,0.000) 16%, rgba(26,31,8,0.000) 20%, rgba(35,41,8,0.000) 24%, rgba(44,53,7,0.016) 28%, rgba(54,65,7,0.161) 32%, rgba(64,78,7,0.410) 36%, rgba(76,92,7,0.578) 40%, rgba(87,106,7,0.662) 44%, rgba(99,121,7,0.720) 48%, rgba(111,136,6,0.766) 52%, rgba(123,150,6,0.803) 56%, rgba(134,165,6,0.849) 60%, rgba(145,179,6,0.869) 64%, rgba(156,192,6,0.744) 68%, rgba(166,204,6,0.804) 72%, rgba(175,215,5,0.821) 76%, rgba(183,225,5,0.822) 80%, rgba(190,234,5,0.840) 84%, rgba(196,241,5,0.820) 88%, rgba(200,247,5,0.971) 92%, rgba(203,250,5,1.000) 96%, rgba(204,251,5,1.000) 100%)`,
                                                           
  tela5: `linear-gradient(180deg, rgba(210,255,1,0) 0%, rgba(210,255,1,0) 100%)`,
                                                                       
  tela6: `linear-gradient(180deg, rgba(97,49,54,0.469) 0%, rgba(97,49,55,0.469) 4%, rgba(99,51,58,0.469) 8%, rgba(101,53,62,0.469) 12%, rgba(103,55,67,0.469) 16%, rgba(107,59,74,0.469) 20%, rgba(110,62,82,0.447) 24%, rgba(115,67,92,0.355) 28%, rgba(119,71,101,0.238) 32%, rgba(124,76,112,0.104) 36%, rgba(130,82,123,0.038) 40%, rgba(135,87,135,0.005) 44%, rgba(141,93,146,0.000) 48%, rgba(146,98,158,0.000) 52%, rgba(152,104,170,0.000) 56%, rgba(157,109,182,0.096) 60%, rgba(162,114,193,0.476) 64%, rgba(167,119,203,0.766) 68%, rgba(172,124,213,0.873) 72%, rgba(176,128,222,0.880) 76%, rgba(180,132,230,0.859) 80%, rgba(184,136,237,0.893) 84%, rgba(186,138,243,0.913) 88%, rgba(188,140,247,0.938) 92%, rgba(190,142,250,0.972) 96%, rgba(190,142,251,0.994) 100%)`,
} as const;

type TelaProps = {
  c: Def & { title: string; support: string };
  format: SocialFormat; scale: number;
  slotPositions?: Record<number, string>;
  asteriskImageSrc?: string;
  points?: string[];
};

                                                                   
function ctx(format: SocialFormat, n: 1 | 2 | 3 | 4 | 5 | 6) {
  const fa = fam(format);
  return { fa, g: GEO[fa], c: COMP[n][fa], largo: fa === "wide" };
}

                                                                                   
                                                                                         
function Tela1({ c, format, scale, slotPositions, asteriskImageSrc, points }: TelaProps) {
  const { g, c: L, largo } = ctx(format, 1);
  const t = tone(c.bg);
  const comFoto = !!c.image;
  const ink = comFoto ? NOI : t.text;                                                                  
  const soft = comFoto ? "rgba(10,10,11,0.78)" : t.soft;
  return (
    <Container bgColor={comFoto ? "rouge" : c.bg} format={format} scale={scale} fundo={!comFoto ? c.fundo : undefined}>
      {comFoto && <SmPhoto src={c.image!} slotIndex={0} objectPosition={slotPositions?.[0]} rect={rectPara("tela1", format)} />}
      {comFoto && <SmVeu gradiente={largo ? VEU_LARGO.tela1 : VEU.tela1} format={format} />}
      <SmTopRail ink={ink} cheio={!largo} g={g} elName="eyebrow" />
      <SmBigWordmark cor="preto" imageSrc={asteriskImageSrc} elName="asterisk"
        width={L.marca!.width} style={cx(L.marca!)} />
      <div style={cx(L.leitura)}>
        {points && points.length ? points.slice(0, 3).map((pt, i) => (
          <div key={i} className="flex" style={{ gap: "1.6cqw", marginBottom: "2.2cqw" }}>
            <SmText size={g.label} lead={SM.leadLabel} color={soft} style={{ flexShrink: 0 }}>{pad2(i + 1)}</SmText>
            <SmText size={g.label} lead={SM.leadLabel} color={ink} elName={`point-${i}`}>{pt}</SmText>
          </div>
        )) : (
          <SmText size={g.label} lead={SM.leadLabel} color={soft} elName="support">{c.support}</SmText>
        )}
      </div>
      <div style={cx(L.frase)}>
        <SmText size={ajustaStatement(g.statement, c.title)} lead={SM.leadStatement} color={ink} elName="title"
          style={{ letterSpacing: "0.013em", textWrap: "balance" } as React.CSSProperties}>{c.title}</SmText>
      </div>
      <SmBottomRail ink={ink} g={g} />
    </Container>
  );
}

                                                                                
                                                                                                                                    
function Tela2({ c, format, scale, slotPositions }: TelaProps) {
  const { g, c: L, largo } = ctx(format, 2);
  const ink = ALP;
  return (
    <Container bgColor={c.bg} format={format} scale={scale}>
      {c.image && <SmPhoto src={c.image} slotIndex={0} objectPosition={slotPositions?.[0]} rect={rectPara("tela2", format)} />}
      {c.image && <SmVeu gradiente={largo ? VEU_LARGO.tela2 : VEU.tela2} format={format} />}
      <div style={cx(L.marca!)}><SmBigWordmark cor="branco" width="100%" /></div>
      <SmTopRail ink={ink} cheio={false} cantoDireita g={g} elName="eyebrow" />
      <div style={cx(L.leitura)}>
        <SmText size={g.label} lead={SM.leadLabel} color={ink} elName="support">{c.support}</SmText>
      </div>
      <div style={cx(L.frase)}>
        <SmText size={ajustaStatement(g.medium, c.title)} lead={SM.leadStatement} color={ink} elName="title"
          style={{ letterSpacing: "0.013em", textWrap: "balance" } as React.CSSProperties}>{c.title}</SmText>
      </div>
      <SmBottomRail ink={ALP} g={g} />
    </Container>
  );
}

                                                                                     
                                                                                                                                                                                                 
function Tela3({ c, format, scale, slotPositions }: TelaProps) {
  const { g, c: L, largo } = ctx(format, 3);
  const foto = c.image || "/brand/kv-icon-black-1.jpg";
  return (
    <Container bgColor="noir" format={format} scale={scale}>
      <SmPhoto src={foto} slotIndex={0} objectPosition={slotPositions?.[0]} rect={rectPara("tela3", format)} />
      <SmVeu gradiente={largo ? VEU_LARGO.tela3 : VEU.tela3} format={format} />
      <SmTopRail ink={NOI} cheio={!largo} g={g} elName="eyebrow" />
      <div style={cx(L.frase)}>
        <SmText size={ajustaStatement(g.statement, c.title)} lead={SM.leadStatement} color={NOI} elName="title"
          style={{ letterSpacing: "0.013em", textWrap: "balance" } as React.CSSProperties}>{c.title}</SmText>
      </div>
      <div style={cx(L.leitura)}>
        <SmText size={g.label} lead={SM.leadLabel} color={largo ? NOI : CIT} elName="support">{c.support}</SmText>
      </div>
      <SmBigWordmark cor="citron" width={L.marca!.width} style={cx(L.marca!)} />
      <SmBottomRail ink={largo ? NOI : CIT} g={g} />
    </Container>
  );
}

                                                                                      
                                                                                                                                                       
function Tela4({ c, format, scale, slotPositions, extra }: TelaProps & { extra?: React.ReactNode }) {
  const { g, c: L, largo } = ctx(format, 4);
  const foto = c.image || "/brand/kv-icon-black-1.jpg";
  return (
    <Container bgColor="noir" format={format} scale={scale}>
      <SmPhoto src={foto} slotIndex={0} objectPosition={slotPositions?.[0]} rect={rectPara("tela4", format)} />
      <SmVeu gradiente={largo ? VEU_LARGO.tela4 : VEU.tela4} format={format} />
      <SmTopRail ink={CIT} cheio={!largo} g={g} elName="eyebrow" />
      <div style={cx(L.leitura)}>
        <SmText size={g.label} lead={SM.leadLabel} color={CIT} elName="support">{c.support}</SmText>
      </div>
      <div style={cx(L.frase)}>
        <SmText size={ajustaStatement(g.medium, c.title)} lead={SM.leadStatement} color={CIT} elName="title"
          style={{ letterSpacing: "0.013em", textWrap: "balance" } as React.CSSProperties}>{c.title}</SmText>
      </div>
      <SmBigWordmark cor={largo ? "citron" : "preto"} width={L.marca!.width} style={cx(L.marca!)} />
      {extra}
      <SmBottomRail ink={largo ? CIT : NOI} g={g} />
    </Container>
  );
}

                                                                      
                                                                                                                          
function Tela5({ c, format, scale, slotPositions }: TelaProps) {
  const { g, c: L, largo } = ctx(format, 5);
  return (
    <Container bgColor="rouge" format={format} scale={scale}>
      {c.image && <SmPhoto src={c.image} slotIndex={0} objectPosition={slotPositions?.[0]} rect={rectPara("tela5", format)} />}
      {c.image && <SmVeu gradiente={largo ? VEU_LARGO.tela5 : VEU.tela5} format={format} />}
      <div style={cx(L.marca!)}><SmBigWordmark cor="preto" width="100%" /></div>
      <SmTopRail ink={NOI} cheio={false} cantoDireita g={g} elName="eyebrow" />
      <div style={cx(L.frase)}>
        <SmText size={ajustaStatement(g.medium, c.title)} lead={SM.leadStatement} color={NOI} elName="title"
          style={{ letterSpacing: "0.013em", textWrap: "balance" } as React.CSSProperties}>{c.title}</SmText>
      </div>
      <div style={cx(L.leitura)}>
        <SmText size={g.label} lead={SM.leadLabel} color={NOI} elName="support">{c.support}</SmText>
      </div>
      <SmBottomRail ink={NOI} g={g} />
    </Container>
  );
}

                                                                                  
                                                                                                                                                
function Tela6({ c, format, scale, slotPositions }: TelaProps) {
  const { g, c: L, largo } = ctx(format, 6);
  const ink = ALP;
  return (
    <Container bgColor={c.bg} format={format} scale={scale}>
      {c.image && <SmPhoto src={c.image} slotIndex={0} objectPosition={slotPositions?.[0]} rect={rectPara("tela6", format)} />}
      {c.image && <SmVeu gradiente={largo ? VEU_LARGO.tela6 : VEU.tela6} format={format} />}
      <div style={cx(L.marca!)}><SmBigWordmark cor="branco" width="100%" /></div>
      <SmTopRail ink={ink} cheio={false} cantoDireita g={g} elName="eyebrow" />
      <div style={cx(L.frase)}>
        <SmText size={ajustaStatement(g.medium, c.title)} lead={SM.leadStatement} color={ink} elName="title"
          style={{ letterSpacing: "0.013em", textWrap: "balance" } as React.CSSProperties}>{c.title}</SmText>
      </div>
      <div style={cx(L.leitura)}>
        <SmText size={g.label} lead={SM.leadLabel} color={ink} elName="support">{c.support}</SmText>
      </div>
      <SmBottomRail ink={ink} g={g} />
    </Container>
  );
}

                                                                                               
function Manifesto(p: { tag: TemplateTag; c: Def & { title: string; support: string }; format: SocialFormat; scale: number; pubLang: PubLang; hashtag: string; imageTools?: boolean; slotPositions?: Record<number, string>; asteriskImageSrc?: string }) {
  return <Tela1 c={p.c} format={p.format} scale={p.scale} slotPositions={p.slotPositions} asteriskImageSrc={p.asteriskImageSrc} />;
}
function Editorial(p: { tag: TemplateTag; c: Def & { title: string; support: string }; format: SocialFormat; scale: number; pubLang: PubLang; hashtag: string; imageTools?: boolean; slotPositions?: Record<number, string> }) {
                                                                                 
                                                        
  if (p.tag === "servicos") return <Tela5 c={p.c} format={p.format} scale={p.scale} slotPositions={p.slotPositions} />;
  if (p.tag === "repost-blog") return <Tela6 c={p.c} format={p.format} scale={p.scale} slotPositions={p.slotPositions} />;
  return <Tela2 c={p.c} format={p.format} scale={p.scale} slotPositions={p.slotPositions} />;
}
function PhotoLed(p: { tag: TemplateTag; c: Def & { title: string; support: string }; format: SocialFormat; scale: number; pubLang: PubLang; hashtag: string; imageTools?: boolean; slotPositions?: Record<number, string> }) {
  return <Tela2 c={p.c} format={p.format} scale={p.scale} slotPositions={p.slotPositions} />;
}
function Curiosidades(p: { tag: TemplateTag; c: Def & { title: string; support: string }; format: SocialFormat; scale: number; pubLang: PubLang; hashtag: string; imageTools?: boolean; slotPositions?: Record<number, string> }) {
  return <Tela3 c={p.c} format={p.format} scale={p.scale} />;
}
function Diferenciais(p: { tag: TemplateTag; c: Def & { title: string; support: string }; format: SocialFormat; scale: number; pubLang: PubLang; hashtag: string; imageTools?: boolean; slotPositions?: Record<number, string> }) {
  return <Tela1 c={{ ...p.c, image: undefined }} format={p.format} scale={p.scale} points={p.c.points && p.c.points.length ? p.c.points : [p.c.support]} />;
}
function Carousel(p: { tag: TemplateTag; c: Def & { title: string; support: string }; format: SocialFormat; scale: number; pubLang: PubLang; hashtag: string; carouselImages?: string[]; slideIndex?: number; imageTools?: boolean; slotPositions?: Record<number, string> }) {
  const { g, largo } = ctx(p.format, 4);
  const imgs = (p.carouselImages && p.carouselImages.length ? p.carouselImages : [p.c.image || "/brand/kv-icon-black-1.jpg"]);
  const idx = Math.max(0, Math.min(p.slideIndex ?? 0, imgs.length - 1));
  const total = Math.max(imgs.length, 1);
  if (idx > 0) {
                                                                                
                                                                                 
                                                               
    return (
      <Container bgColor="noir" format={p.format} scale={p.scale}>
        <SmPhoto src={imgs[idx]} slotIndex={idx} objectPosition={p.slotPositions?.[idx]} />
        <SmVeu gradiente={largo ? VEU_LARGO.tela4 : `linear-gradient(180deg, rgba(10,10,11,0.34) 0%, rgba(10,10,11,0) 26%, rgba(10,10,11,0) 58%, rgba(10,10,11,0.82) 88%, ${NOI} 100%)`} format={p.format} />
        <SmTopRail ink={ALP} cheio={false} cantoDireita g={g} elName="eyebrow" />
        <div className="absolute" style={{ left: g.ml, bottom: largo ? "24%" : "17%", width: largo ? "50%" : "74%" }}>
          <SmText size={g.medium} lead={SM.leadStatement} color={ALP} elName={`caption-${idx}`}
            style={{ letterSpacing: "0.013em" } as React.CSSProperties}>{p.c.support}</SmText>
        </div>
        <div className="absolute flex items-center" style={{ left: g.ml, bottom: largo ? "15%" : "10.5%", gap: "3cqw" }}>
          <ProgressV3 current={idx + 1} total={total} color={CIT} />
        </div>
        <SmBottomRail ink={CIT} g={g} />
      </Container>
    );
  }
                                                                             
                                                                               
                                                                      
  return (
    <Tela4 c={{ ...p.c, image: imgs[0] }} format={p.format} scale={p.scale} slotPositions={p.slotPositions}
      />
  );
}

export function renderSocialTemplate(tag: TemplateTag, props: TemplateRenderProps): React.ReactElement {
  const def = DEFAULTS[tag] || DEFAULTS["frases-criativas"];
  const scale = props.scale ?? 1;
  const pubLang = props.pubLang;
  const c = {
    ...def,
    bg: props.bgColor || def.bg,
    title: props.title || def.title,
    support: props.supportText || def.support,
    image: def.fundo ? undefined : (props.imageSrc || def.image),
  };
                                                                                 
                                             
  const hashtag = props.hashtagOverride || ABIL_HASHTAGS[tag]?.[pubLang] || getHashtag(tag, pubLang);
  const common = { tag, c, format: props.format, scale, pubLang, hashtag, imageTools: props.imageTools, slotPositions: props.slotPositions, asteriskImageSrc: props.asteriskImageSrc };

  const inner = (() => {
    switch (def.lang) {
      case "manifesto": return <Manifesto {...common} />;
      case "editorial": return <Editorial {...common} />;
      case "carousel": return <Carousel {...common} carouselImages={props.carouselImages} slideIndex={props.slideIndex} />;
      case "photo": return <PhotoLed {...common} />;
      case "diferenciais": return <Diferenciais {...common} />;
      case "curiosidades": return <Curiosidades {...common} />;
      default: return <Manifesto {...common} />;
    }
  })();
                                                                         
                                                                               
                                                                       
                                                                                  
  return (
    <SocialTemplateFrame offsets={props.elementOffsets || {}} editMode={!!props.imageTools} styles={props.textElementStyles || {}} rich={props.elementRich} text={props.textOverrides}>
      {inner}
    </SocialTemplateFrame>
  );
}

                                                                                      
                                                                                          
                                                                                  
                                                                                    
                                                                                        
                                                                                       
                                                                           
function SocialTemplateFrame({ offsets, editMode, styles, rich, text, children }: { offsets: Record<string, ElOffset>; editMode: boolean; styles: Record<string, ElStyle>; rich?: Record<string, string>; text?: Record<string, string>; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const stylesKey = JSON.stringify(styles || {});
                                                                                     
                                                                                     
                                                                                        
                                                                                       
                                                                                
                                                                                      
                                                                                  
  React.useLayoutEffect(() => {
    const root = ref.current; if (!root) return;
    const dsKey = (prop: string) => "abilBase" + prop.replace(/-(\w)/g, (_m, c: string) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());
    const setP = (el: HTMLElement, prop: string, val: string | null, important: boolean) => {
      const key = dsKey(prop);
      const cur = el.style.getPropertyValue(prop);
      if (val == null || val === "") {
        if (key in el.dataset) {
          const base = el.dataset[key] || "";
          if (base) el.style.setProperty(prop, base); else if (cur) el.style.removeProperty(prop);
          delete el.dataset[key];
        }
        return;
      }
      if (!(key in el.dataset)) el.dataset[key] = cur;                                      
      if (cur !== val || (important && el.style.getPropertyPriority(prop) !== "important")) el.style.setProperty(prop, val, important ? "important" : "");
    };
    const applyTo = (el: HTMLElement, st?: ElStyle) => {
      setP(el, "color", st?.color || null, true);
                                                                                   
                                                                                     
      el.querySelectorAll<HTMLElement>("span, b, strong, i, em").forEach((c) => {
        if (c.hasAttribute("data-abil-richcolor")) return;
        setP(c, "color", st?.color || null, true);
      });
      if (st?.fontScale && st.fontScale !== 1) {
        if (!el.dataset.abilBaseFs) el.dataset.abilBaseFs = window.getComputedStyle(el).fontSize;
        const base = parseFloat(el.dataset.abilBaseFs || "0");
        if (base) setP(el, "font-size", (base * st.fontScale) + "px", true);
      } else { setP(el, "font-size", null, false); delete el.dataset.abilBaseFs; }
      setP(el, "font-weight", st?.bold ? "800" : null, true);
      setP(el, "font-style", st?.italic ? "italic" : null, true);
      setP(el, "text-align", st?.align || null, true);
      setP(el, "letter-spacing", (typeof st?.tracking === "number" && st.tracking !== 0) ? st.tracking + "em" : null, true);
      setP(el, "line-height", (typeof st?.lineHeight === "number" && st.lineHeight > 0) ? String(st.lineHeight) : null, true);
      setP(el, "text-transform", st?.textCase ? (st.textCase === "upper" ? "uppercase" : "lowercase") : null, true);
                                                                                       
                                                                                   
      setP(el, "scale", (typeof st?.scale === "number" && st.scale !== 1) ? String(st.scale) : null, false);
                                                                                    
                                                          
      setP(el, "rotate", (typeof st?.rotate === "number" && st.rotate !== 0) ? st.rotate + "deg" : null, false);
                                                                                 
                                                            
      setP(el, "display", st?.hidden ? "none" : null, true);
    };
    const applyAll = () => {
      root.querySelectorAll<HTMLElement>("[data-abil-el]").forEach((el) => {
        const key = el.getAttribute("data-abil-el") || "";
        applyTo(el, styles && styles[key]);
      });
    };
                                                                                      
                                                                             
                                                                                 
                                                                                     
                                                                                      
                                                                                  
                                                                          
    let mo: MutationObserver | null = null;
    const run = () => { applyAll(); if (mo) mo.takeRecords(); };
    mo = new MutationObserver((muts) => {
      const childAdd = muts.some((m) => m.type === "childList" && m.addedNodes.length > 0);
      const styleHits = muts.filter((m) => m.type === "attributes" && m.attributeName === "style").map((m) => m.target as HTMLElement);
      if (!childAdd && !styleHits.length) return;
      styleHits.forEach((el) => {
        Object.keys(el.dataset).forEach((k) => { if (k.startsWith("abilBase")) delete el.dataset[k]; });
      });
      run();
    });
    run();
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    return () => { if (mo) mo.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylesKey]);
  return (
    <div ref={ref} style={{ display: "contents" }}>
      <ElementOffsetsContext.Provider value={{ offsets, editMode, styles, rich, text }}>
        {children}
      </ElementOffsetsContext.Provider>
    </div>
  );
}

export { TEMPLATE_META };
                                                                                   
                                                      
export type { ElOffset, ElStyle } from "./atoms";
