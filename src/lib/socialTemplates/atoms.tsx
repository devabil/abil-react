/* eslint-disable react-refresh/only-export-components -- Atom module used by dashboard renderers, not a Fast Refresh boundary. */
   
                                                                                    
  
                                                                             
                                                                      
                                                                                
                                                                                 
                                  
                                                                                   
                                                                                      
                                                                                 
                                                                                 
                                          
                                                                                   
  
                                                                                
                                                                               
                                                                             
                                                                                  
   

import * as React from "react";
import { BRAND_COLORS, COLOR_PAIRS, TYPOGRAPHY, FOOTER_TOKENS, IMAGE_RULES, normalizeHashtag, type BrandColor } from "./tokens";

                                                                                                                                                                                                      
                                                                          
                                                                                
                                                                        
                                                                            
                                                                                  
                                            
                                                                                                                                                                                                         
export type ElOffset = { dx: number; dy: number };
                                                                                              
                                                                                                 
                                                                                           
                                                                                                     
                                                                                           
                                                                                               
                                                                           
export type ElStyle = {
  fontScale?: number; color?: string; scale?: number;
  bold?: boolean; italic?: boolean; align?: "left" | "center" | "right";
  tracking?: number; lineHeight?: number; textCase?: "upper" | "lower";
                                                                                                    
                                                                                                 
                                                                                                         
  rotate?: number; hidden?: boolean;
};
                                                                                                        
                                                                                               
                                                                                                  
export const ElementOffsetsContext = React.createContext<{ offsets: Record<string, ElOffset>; editMode: boolean; styles?: Record<string, ElStyle>; rich?: Record<string, string>; text?: Record<string, string> }>({ offsets: {}, editMode: false, styles: {} });
                                                                                                       
                                                                                                           
export function useElText(elName: string | undefined, children: React.ReactNode): React.ReactNode {
  const ctx = React.useContext(ElementOffsetsContext);
  if (elName && ctx.text) { const v = ctx.text[elName]; if (typeof v === "string" && v !== "") return v; }
  return children;
}
                                                                                                 
                                                                                               
function shouldMark(elName: string, editMode: boolean, styles?: Record<string, ElStyle>): boolean {
  return editMode || !!(styles && styles[elName]);
}
export function useElOffset(elName?: string): { style: React.CSSProperties; dataAttr: Record<string, string> } {
  const ctx = React.useContext(ElementOffsetsContext);
  if (!elName) return { style: {}, dataAttr: {} };
  const o = ctx.offsets[elName];
  const style: React.CSSProperties = o && (o.dx || o.dy) ? { transform: `translate(${o.dx}cqw, ${o.dy}cqw)` } : {};
  const dataAttr: Record<string, string> = shouldMark(elName, ctx.editMode, ctx.styles) ? { "data-abil-el": elName } : {};
  return { style, dataAttr };
}
                                                                                       
export function composeOffsetStyle(base: React.CSSProperties | undefined, elName: string | undefined, offsets: Record<string, ElOffset>, editMode: boolean, styles?: Record<string, ElStyle>): { style: React.CSSProperties; dataAttr: Record<string, string> } {
  if (!elName) return { style: base || {}, dataAttr: {} };
  const o = offsets[elName];
  const off = o && (o.dx || o.dy) ? `translate(${o.dx}cqw, ${o.dy}cqw)` : "";
  const baseT = (base?.transform as string) || "";
  const transform = [baseT, off].filter(Boolean).join(" ") || undefined;
  const dataAttr: Record<string, string> = shouldMark(elName, editMode, styles) ? { "data-abil-el": elName } : {};
  return { style: { ...(base || {}), ...(transform ? { transform } : {}) }, dataAttr };
}

                                                                                                                                                                                                      
                                                               
                                                         
                                                              
                                                                  
                                                              
                                                                                                                                                                                                         
const ABIL_FONT = "'mundial', 'Figtree', 'Inter', system-ui, sans-serif";

                                                                                  
const ABIL_WORDMARK_VIEWBOX = "1311.18 714.84 350.93 83.30";
const ABIL_WORDMARK_PATHS = [
  "M1558.69,715.34H1579.60V797.63H1558.69Z",
  "M1620.64,715.34 L1599.72,715.34 L1599.72,777.51 C1599.72,788.62 1608.73,797.63 1619.84,797.63 L1641.04,797.63 L1661.27,777.40 L1620.64,777.23 L1620.64,715.34 Z",
  "M1644.34,723.33 L1646.17,723.33 L1646.17,716.91 L1649.66,716.91 L1649.66,715.34 L1640.87,715.34 L1640.87,716.91 L1644.34,716.91 L1644.34,723.33 Z",
  "M1659.66,715.34 L1656.28,719.56 L1652.90,715.34 L1650.91,715.34 L1650.91,723.33 L1652.68,723.33 L1652.68,717.77 L1656.19,722.05 L1656.28,722.05 L1659.79,717.77 L1659.79,723.33 L1661.61,723.33 L1661.61,715.34 L1659.66,715.34 Z",
  "M1517.48,736.32 L1517.48,777.23 L1455.76,777.23 L1496.50,736.32 L1517.48,736.32 M1456.10,746.37 L1456.10,715.34 L1435.18,715.34 L1435.18,777.51 C1435.18,788.62 1444.19,797.63 1455.31,797.63 L1517.48,797.63 L1538.05,777.23 L1538.05,735.46 C1538.05,724.35 1529.05,715.34 1517.93,715.34 L1486.62,715.34 L1456.10,746.37 Z",
  "M1353.24,776.65 L1332.26,776.65 L1332.26,735.74 L1393.98,735.74 L1353.24,776.65 M1311.68,735.74 L1311.68,777.51 C1311.68,788.62 1320.69,797.63 1331.80,797.63 L1363.12,797.63 L1393.64,766.60 L1393.64,797.63 L1414.55,797.63 L1414.55,735.46 C1414.55,724.35 1405.54,715.34 1394.43,715.34 L1332.26,715.34 L1311.68,735.74 Z",
];

                                                       
const ABIL_MONOGRAM_VIEWBOX = "1311.18 714.84 103.87 83.30";
const ABIL_MONOGRAM_PATH = "M1353.24,776.65 L1332.26,776.65 L1332.26,735.74 L1393.98,735.74 L1353.24,776.65 M1311.68,735.74 L1311.68,777.51 C1311.68,788.62 1320.69,797.63 1331.80,797.63 L1363.12,797.63 L1393.64,766.60 L1393.64,797.63 L1414.55,797.63 L1414.55,735.46 C1414.55,724.35 1405.54,715.34 1394.43,715.34 L1332.26,715.34 L1311.68,735.74 Z";

                                                                             
                                                                         
                                                                         
function InlineAsterisk({ color, em = 0.85, className = "" }: { color?: string; em?: number; className?: string }) {
  const side = `${(em * 0.42).toFixed(3)}em`;
  return (
    <span aria-hidden="true" className={className}
      style={{ display: "inline-block", width: side, height: side, background: color || "currentColor", flexShrink: 0 }} />
  );
}

                                                                                                                                                                                                      
                                                                  
                                                                                                                                                                                                         
function AbilWordmarkInline({ color = "#ffffff", className = "", style }: { color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox={ABIL_WORDMARK_VIEWBOX} xmlns="http://www.w3.org/2000/svg" aria-label="ABiL MEDiAS">
      {ABIL_WORDMARK_PATHS.map((d, i) => (
        <path key={i} fill={color} fillRule="nonzero" d={d} />
      ))}
    </svg>
  );
}

                                                                                                                                                                                                      
                 
                                                                                                                                                                                                         
export function TemplateLogo({ color, className = "" }: { color?: string; className?: string }) {
  return (
    <AbilWordmarkInline
      color={color || BRAND_COLORS.blanc}
      className={`w-auto ${className}`}
      style={{ height: FOOTER_TOKENS.logoHeight }}
    />
  );
}

                                                                                                                                                                                                      
                    
                                                                                                                                                                                                         
export function TemplateHashtag({ value, color, className = "" }: { value: string; color?: string; className?: string }) {
  const safe = normalizeHashtag(value);
                                                                                  
  return (
    <span
      className={`uppercase whitespace-nowrap ${className}`}
      style={{
        fontFamily: ABIL_FONT,
        fontWeight: 400,
        fontSize: TYPOGRAPHY.sizes.hashtag,
        letterSpacing: "-0.03em",
        color: color || "rgba(255,255,255,0.65)",
      }}
    >
      {safe}
    </span>
  );
}

                                                                                                                                                                                                      
                                           
                                                                                                                                                                                                         
export function TemplateFooter({
  hashtag,
  bgColor,
  overImage = false,
  textColor,
}: {
  hashtag: string;
  bgColor?: BrandColor;
  overImage?: boolean;
  textColor?: string;
}) {
  const pair = bgColor ? COLOR_PAIRS[bgColor] : null;
  const containerBg = overImage ? FOOTER_TOKENS.blurOverImage : "";
                                                                               
  const onCitron = bgColor === "rouge";
  const logoColor = overImage ? BRAND_COLORS.blanc : onCitron ? BRAND_COLORS.noir : pair?.text || BRAND_COLORS.blanc;
  const hashColor = textColor || (overImage ? "rgba(255,255,255,0.75)" : onCitron ? "rgba(10,10,11,0.72)" : pair?.subText || "rgba(255,255,255,0.65)");
  return (
    <div className={`absolute inset-x-0 bottom-0 flex items-center justify-between ${FOOTER_TOKENS.paddingX} ${FOOTER_TOKENS.paddingY} ${containerBg}`}>
      <TemplateLogo color={logoColor} />
      <TemplateHashtag value={hashtag} color={hashColor} />
    </div>
  );
}

                                                                                                                                                                                                      
                                                                 
                                                                
                                                                     
                                           
                                                                                                                                                                                                         
export function TemplateEyebrow({
  children,
  color,
  withAsterisque = false,
  asteriskColor,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  withAsterisque?: boolean;
  asteriskColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`uppercase inline-flex items-center gap-[2cqw] ${className}`}
      style={{
        fontFamily: ABIL_FONT,
        fontWeight: 400,
        fontSize: TYPOGRAPHY.sizes.subtitle,
        letterSpacing: "-0.03em",
        color: color || "rgba(255,255,255,0.85)",
      }}
    >
      {withAsterisque && (
        <span
          aria-hidden="true"
          style={{ display: "inline-block", width: "3em", height: "1px", background: asteriskColor || "currentColor", flexShrink: 0 }}
        />
      )}
      <span>{children}</span>
    </div>
  );
}

                                                                                                                                                                                                      
                                                                   
                                                                  
                                                                   
                              
                                                                                                                                                                                                         
export function TemplateRougeLine({
  width = "16%",
  color,
  className = "",
}: {
  width?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        height: "1px",
        width,
        background: color || "currentColor",
      }}
    />
  );
}

                                                                                                                                                                                                      
                                                                 
                                                                   
                                                                   
                                                                                                                                                                                                         
export function TemplateTitle({
  children,
  size = "title",
  color,
  asteriskColor,
  className = "",
  showAsterisk = true,
  maxWidth,
}: {
  children: React.ReactNode;
  size?: "title" | "titleHero" | "quote" | "titleStat";
  color?: string;
  asteriskColor?: string;
  className?: string;
  showAsterisk?: boolean;
  maxWidth?: string;
}) {
  const isStat = size === "titleStat";
  const fontSize = TYPOGRAPHY.sizes[size];
  const tracking = isStat ? TYPOGRAPHY.tracking.statTight : "-0.03em";
  const leading = isStat ? TYPOGRAPHY.leading.stat : "0.9";
  return (
    <h2
      className={className}
      style={{
        fontSize,
        fontWeight: 300,
        textTransform: "uppercase",
        letterSpacing: tracking,
        lineHeight: leading,
        color: color || BRAND_COLORS.blanc,
        fontFamily: ABIL_FONT,
        maxWidth,
      }}
    >
      {children}
      {showAsterisk && (
        <InlineAsterisk color={asteriskColor} em={0.5} className="ml-[0.04em]" />
      )}
    </h2>
  );
}

                                                                                                                                                                                                      
                        
                                                                                                                                                                                                         
export function TemplateSupportText({
  children,
  color,
  variant = "support",
  className = "",
  maxWidth,
  clampLines,
}: {
  children: React.ReactNode;
  color?: string;
  variant?: "support" | "subtitle";
  className?: string;
  maxWidth?: string;
                                                                                
                                                                                  
                                                                           
  clampLines?: number;
}) {
  const isSubtitle = variant === "subtitle";
  const fontSize = isSubtitle ? TYPOGRAPHY.sizes.subtitle : TYPOGRAPHY.sizes.support;
                                                                                
  const tracking = isSubtitle ? "-0.03em" : "-0.01em";
  const fontFamily = ABIL_FONT;
  const fontWeight = isSubtitle ? 400 : 300;
  const clampStyle: React.CSSProperties = clampLines
    ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: clampLines, overflow: "hidden" }
    : {};
  return (
    <p
      className={`${isSubtitle ? "uppercase" : ""} ${className}`}
      style={{
        fontSize,
        fontWeight,
        letterSpacing: tracking,
        lineHeight: TYPOGRAPHY.leading.body,
        color: color || "rgba(255,255,255,0.78)",
        fontFamily,
        maxWidth,
        ...clampStyle,
      }}
    >
      {children}
    </p>
  );
}

                                                                                                                                                                                                      
                                                                       
                                                                                                                                                                                                         
export function TemplateImage({
  src,
  alt = "",
  overlayDark = 0.35,
  className = "",
  showLoading = true,
  fit = "cover",
  gradient = "none",
  objectPosition,
}: {
  src: string;
  alt?: string;
  overlayDark?: number;
  className?: string;
  showLoading?: boolean;
  fit?: "cover" | "contain";
                                                                                     
                                                                                                 
                                                                                                 
  gradient?: "none" | "bottom" | "full";
                                                                                             
                                                                                                    
  objectPosition?: string;
}) {
  if (process.env.NODE_ENV !== "production" && className) {
    for (const forbidden of IMAGE_RULES.forbiddenFilters) {
      if (className.includes(forbidden)) {
        console.warn(`[TemplateImage] FORBIDDEN filter "${forbidden}" detected.`);
      }
    }
  }
  const safeClassName = className.replace(/\bgrayscale\b/g, "").trim();
  return (
    <>
      <img
        src={src}
        alt={alt}
        loading={showLoading ? "lazy" : undefined}
        className={`absolute inset-0 w-full h-full object-${fit} ${safeClassName}`}
        style={objectPosition ? { objectPosition } : undefined}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      {overlayDark > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: `rgba(0,0,0,${overlayDark})` }} />
      )}
      {gradient === "bottom" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 32%, rgba(0,0,0,0.08) 60%, rgba(0,0,0,0) 78%)" }}
        />
      )}
      {gradient === "full" && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.10) 66%, rgba(0,0,0,0.40) 100%)" }}
        />
      )}
    </>
  );
}

                                                                                                                                                                                                      
                                                                 
                                                                                                                                                                                                         
export function TemplateQuoteBox({
  children,
  label,
  bg = "rouge",
  className = "",
  style,
}: {
  children: React.ReactNode;
  label?: React.ReactNode;
  bg?: BrandColor;
  className?: string;
  style?: React.CSSProperties;
}) {
  const pair = COLOR_PAIRS[bg];
                                                                               
  const onCitron = bg === "rouge";
  const ink = onCitron ? BRAND_COLORS.noir : pair.text;
  const subInk = onCitron ? "rgba(10,10,11,0.72)" : pair.subText;
  return (
    <div
      className={`px-[3cqw] py-[2cqw] ${className}`}
      style={{
        background: pair.bg,
        color: ink,
        maxWidth: "55%",
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: ABIL_FONT,
          fontWeight: 400,
          fontSize: TYPOGRAPHY.sizes.support,
          letterSpacing: "-0.01em",
          lineHeight: "1.2",
          color: ink,
        }}
      >
        {children}
      </div>
      {label && (
        <div
          className="uppercase mt-[1cqw]"
          style={{
            fontFamily: ABIL_FONT,
            fontWeight: 400,
            fontSize: TYPOGRAPHY.sizes.hashtag,
            letterSpacing: "-0.03em",
            color: subInk,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

                                                                                                                                                                                                      
                                                               
                                                                                                                                                                                                         
export function TemplateMetricLarge({
  value,
  label,
  sublabel,
  color,
  accentColor,
}: {
  value: React.ReactNode;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  color?: string;
  accentColor?: string;
}) {
                                                                             
                                                                           
  return (
    <div className="text-right">
      <div
        style={{
          fontFamily: ABIL_FONT,
          fontWeight: 300,
          fontSize: "clamp(2rem, 14cqw, 4rem)",
          lineHeight: "0.9",
          letterSpacing: "-0.04em",
          color: color || BRAND_COLORS.blanc,
        }}
      >
        {value}
      </div>
      {label && (
        <div
          className="uppercase mt-[1.5cqw]"
          style={{
            fontFamily: ABIL_FONT,
            fontWeight: 400,
            fontSize: TYPOGRAPHY.sizes.hashtag,
            letterSpacing: "-0.03em",
            color: accentColor || "rgba(255,255,255,0.72)",
          }}
        >
          {label}
        </div>
      )}
      {sublabel && (
        <div
          className="uppercase mt-[1cqw]"
          style={{
            fontFamily: ABIL_FONT,
            fontWeight: 400,
            fontSize: TYPOGRAPHY.sizes.footer,
            letterSpacing: "-0.03em",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

                                                                                                                                                                                                      
                                                                      
                                                     
                                                                                                                                                                                                         
export function CarouselSlideNumber({ current, total, color }: { current: number; total: number; color?: string }) {
  return (
    <div
      className="absolute top-[5%] right-[5%] uppercase"
      style={{
        fontFamily: ABIL_FONT,
        fontWeight: 400,
        fontSize: TYPOGRAPHY.sizes.hashtag,
        letterSpacing: "-0.03em",
        color: color || "rgba(255,255,255,0.9)",
      }}
    >
      {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
  );
}

                                                                                                                                                                                                      
                                                                   
                                                                   
                                                                     
                                                                    
                                                                   
                                                                                                                                                                                                         
export function TemplateAsterisque({
  size = "lg",
  color,
  rotate = false,
  opacity = 1,
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  color?: string;
  rotate?: boolean;
  opacity?: number;
  className?: string;
}) {
  void rotate;                                                               
  const sizeMap: Record<string, string> = {
    sm: "clamp(1.5rem, 8cqw, 3rem)",
    md: "clamp(2rem, 14cqw, 5rem)",
    lg: "clamp(3rem, 22cqw, 8rem)",
    xl: "clamp(4rem, 32cqw, 12rem)",
    xxl: "clamp(6rem, 50cqw, 18rem)",
  };
  return (
    <svg
      viewBox={ABIL_MONOGRAM_VIEWBOX}
      className={className}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        color: color || BRAND_COLORS.rouge,
        opacity,
      }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {                                                     }
      <path fill="currentColor" fillRule="nonzero" d={ABIL_MONOGRAM_PATH} />
    </svg>
  );
}

                                                                                                                                                                                                      
                                                                 
                                                                     
                                                                
                                                             
                                                                                                                                                                                                               

                                                                                 
export function MonoLabel({
  children, color, className = "", size, elName,
}: { children: React.ReactNode; color?: string; className?: string; size?: string; elName?: string }) {
                                                                                                      
  const off = useElOffset(elName);
  const content = useElText(elName, children);
  return (
    <span
      className={`uppercase ${className}`}
      {...off.dataAttr}
      style={{
        fontFamily: ABIL_FONT,
        fontWeight: 400,
        fontSize: size || "clamp(0.5rem, 2.1cqw, 0.8rem)",
        letterSpacing: "-0.03em",
        color: color || "rgba(255,255,255,0.62)",
        lineHeight: 1.2,
        display: "inline-block",
        ...off.style,
      }}
    >
      {content}
    </span>
  );
}

                                                                                    
                                                                       
                                                                                        
                                                                                                 
                                                        
                                                                                               
const NBSP = String.fromCharCode(160);
function glueWords(s: string): string {
  const words = s.replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= 1) return s;
  let out = words[0];
  for (let i = 1; i < words.length; i++) {
    const lettersPrev = words[i - 1].replace(/[^\p{L}]/gu, "").length;
    const glue = lettersPrev <= 3 || i === words.length - 1;
    out += (glue ? NBSP : " ") + words[i];
  }
  return out;
}
                                                                                         
export function typesetTitle(node: React.ReactNode): React.ReactNode {
  if (typeof node !== "string") return node;
                                                                                              
                                                                                         
  if (node.includes("\n")) {
    const lines = node.split("\n");
    return lines.map((ln, i) => (
      <React.Fragment key={i}>{i > 0 ? <br /> : null}{glueWords(ln)}</React.Fragment>
    ));
  }
  const sentences = node.trim().split(/(?<=[.?!])\s+/).filter(Boolean);
  if (sentences.length <= 1) return glueWords(node);
  return sentences.map((s, i) => (
    <React.Fragment key={i}>{i > 0 ? <br /> : null}{glueWords(s)}</React.Fragment>
  ));
}
                                                               
export function typesetBody(node: React.ReactNode): React.ReactNode {
  if (typeof node !== "string") return node;
  return glueWords(node);
}
              
export const noWidow = typesetBody;

                                                                             
                                                                            
                                          
export function HeroText({
  children, color, asteriskColor, size, showAsterisk = true, className = "", maxWidth, weight = 300, asterEm = 0.42, leading = 0.9, elName,
}: {
  children: React.ReactNode; color?: string; asteriskColor?: string; size: string;
  showAsterisk?: boolean; className?: string; maxWidth?: string; weight?: number; asterEm?: number; leading?: number; elName?: string;
}) {
  const off = useElOffset(elName);                                                        
                                                                                                 
                                                                                                   
                                                                                                
                                                                                                    
                                                                                                 
                                                                                                 
                  
  const ctx = React.useContext(ElementOffsetsContext);
  const rich = elName && ctx.rich ? ctx.rich[elName] : undefined;
  const content = useElText(elName, children);                                                      
  return (
    <h2
      className={className}
      {...off.dataAttr}
      style={{
        fontFamily: ABIL_FONT,
        fontWeight: weight,
        fontSize: size,
        textTransform: "uppercase",
        letterSpacing: "-0.03em",
        lineHeight: leading,
        color: color || BRAND_COLORS.blanc,
        maxWidth,
        margin: 0,
                                                                                    
                                                     
        textWrap: "balance",
        ...off.style,
      } as React.CSSProperties}
    >
      {rich ? <span dangerouslySetInnerHTML={{ __html: rich }} /> : typesetTitle(content)}
      {showAsterisk && (
        <InlineAsterisk color={asteriskColor} em={asterEm} className="ml-[0.08em]" />
      )}
    </h2>
  );
}

                                                                        
                                                                            
                                                                
export function BodyText({
  children, color, className = "", maxWidth = "34ch", gap, elName,
}: { children: React.ReactNode; color?: string; className?: string; maxWidth?: string; gap?: string; elName?: string }) {
  const off = useElOffset(elName);                      
                                                                                             
                                                                                          
  const ctx = React.useContext(ElementOffsetsContext);
  const rich = elName && ctx.rich ? ctx.rich[elName] : undefined;
  const content = useElText(elName, children);                                                      
  return (
    <p
      className={className}
      {...off.dataAttr}
      style={{
        fontFamily: ABIL_FONT,
        fontWeight: 400,
        fontSize: "clamp(0.55rem, 2.6cqw, 0.92rem)",
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
        color: color || "rgba(255,255,255,0.72)",
        maxWidth,
        margin: 0,
        marginTop: gap,
        textWrap: "pretty",
        ...off.style,
      } as React.CSSProperties}
    >
      {rich ? <span dangerouslySetInnerHTML={{ __html: rich }} /> : typesetBody(content)}
    </p>
  );
}

                                                                                          
                                                                                           
                                                                                              
                                                                                            
                                                                                       
export function Plate({
  src, className = "", border = true, style, slotIndex, objectPosition,
}: { src: string; className?: string; border?: boolean; style?: React.CSSProperties; slotIndex?: number; objectPosition?: string }) {
                                                                                           
                                                                                               
                                                                                            
                                                                                            
                                                                                         
                                                                                                      
  const ctx = React.useContext(ElementOffsetsContext);
  const fotoKey = slotIndex !== undefined ? `foto-${slotIndex}` : undefined;
  const o = fotoKey ? ctx.offsets[fotoKey] : undefined;
  const off = o && (o.dx || o.dy) ? `translate(${o.dx}cqw, ${o.dy}cqw)` : "";
  const baseT = (style?.transform as string) || "";
  const transform = [baseT, off].filter(Boolean).join(" ") || undefined;
  const elSt = fotoKey && ctx.styles ? ctx.styles[fotoKey] : undefined;
  const sc = elSt?.scale;
                                                                                                  
                                                                                                         
  const rot = elSt?.rotate;
  const hidden = !!elSt?.hidden;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        ...(border ? { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" } : {}),
        ...style,
        ...(transform ? { transform } : {}),
        ...(typeof sc === "number" && sc !== 1 ? { scale: String(sc) } : {}),
        ...(typeof rot === "number" && rot !== 0 ? { rotate: rot + "deg" } : {}),
      }}
      data-abil-photo={ctx.editMode ? slotIndex : undefined}
    >
      {!hidden && <TemplateImage src={src} overlayDark={0} objectPosition={objectPosition} />}
    </div>
  );
}

                                                                           
                                                                         
                                                           
export function BrandLogo({
  onDark = false, height = "clamp(0.72rem, 3.4cqw, 1.35rem)", className = "",
}: { onDark?: boolean; height?: string; className?: string }) {
  return (
    <img
      src={onDark ? "/brand/abil-wordmark-citron.svg" : "/brand/abil-wordmark.svg"}
      alt="ABiL MEDiAS"
      className={className}
      style={{ height, width: "auto", display: "block" }}
    />
  );
}

                                                                              
                                                                             
                                                                                
export function AsterMark({
  size, color, opacity = 1, className = "", style, imageSrc, elName,
}: { size: string; color?: string; opacity?: number; className?: string; style?: React.CSSProperties; imageSrc?: string; elName?: string }) {
                                                                                                
  const ctx = React.useContext(ElementOffsetsContext);
  const composed = composeOffsetStyle(style, elName, ctx.offsets, ctx.editMode, ctx.styles);
                                                                                           
                                                                                                        
  if (imageSrc) {
    return (
      <img src={imageSrc} alt="" aria-hidden="true" className={className} {...composed.dataAttr}
        style={{ width: size, height: size, objectFit: "contain", opacity, ...composed.style }} />
    );
  }
  return (
    <svg viewBox={ABIL_MONOGRAM_VIEWBOX} className={className} {...composed.dataAttr} style={{ width: size, height: size, opacity, ...composed.style }} aria-hidden="true">
      <path fill={color || BRAND_COLORS.rouge} fillRule="nonzero" d={ABIL_MONOGRAM_PATH} />
    </svg>
  );
}

                                                                                 
export function SeriesSignature({
  right, dark = true, className = "", style, hashtagElName,
}: { right?: React.ReactNode; dark?: boolean; className?: string; style?: React.CSSProperties; hashtagElName?: string }) {
  const soft = dark ? "rgba(255,255,255,0.6)" : "rgba(10,10,11,0.64)";
  return (
    <div className={`flex items-center justify-between gap-[4cqw] ${className}`} style={style}>
      <BrandLogo onDark={dark} />
      {right && <MonoLabel color={soft} elName={hashtagElName}>{right}</MonoLabel>}
    </div>
  );
}

                                                                              
                                                                             
export function HairLine({
  vertical = false, color, className = "", style,
}: { vertical?: boolean; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: color || "rgba(255,255,255,0.14)",
        ...(vertical ? { width: "1px", height: "100%" } : { height: "1px", width: "100%" }),
        ...style,
      }}
    />
  );
}
