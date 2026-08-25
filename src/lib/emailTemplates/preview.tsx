   
                                                                           
  
                                                                                 
                                                                                 
                                                                               
            
  
                                                                                  
                                                                                   
                           
   
import React from "react";
import { buildEmailSpec, type EmailSpec, type EmailSpecInput } from "./spec.js";
import { FONT_STACK, TYPE } from "./tokens.js";

                                                                              
                                                          
export type CampoEditavel = (args: {
  value: string;
  fieldKey: string;
  as: "h1" | "p" | "div";
  multiline: boolean;
  style: React.CSSProperties;
}) => React.ReactNode;

export type AbilEmailPreviewProps = {
  spec?: EmailSpec;
                                              
  template?: EmailSpecInput;
                                                                                
  bannerOverlay?: React.ReactNode;
                                                                       
  unsubscribeLabel?: string;
                                                                 
  galleryLabel?: string;
  campo?: CampoEditavel;
  className?: string;
};

export function AbilEmailPreview({
  spec: specIn, template, bannerOverlay, unsubscribeLabel, galleryLabel, campo, className,
}: AbilEmailPreviewProps) {
  const spec = specIn || buildEmailSpec(template || { subject: "" });
  const g = spec.g;
  const T = TYPE;
  const marca = g.markTop === "citron"
    ? "/brand/abil-mark-citron-tight.png"
    : "/brand/abil-mark-black-tight.png";

  const rot: React.CSSProperties = {
    fontSize: T.label, lineHeight: T.labelLeading, letterSpacing: T.labelTracking,
    fontWeight: 300, margin: 0,
  };
  const leit: React.CSSProperties = {
    fontSize: T.read, lineHeight: T.readLeading, letterSpacing: 0, fontWeight: 300, margin: 0,
  };
                                                                               
                                                             
  const carril: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "31.6% 43.6% 24.8%", alignItems: "start",
  };

  const texto: CampoEditavel = campo || (({ value, as, style }) => {
    const Tag = as as keyof React.JSX.IntrinsicElements;
    return <Tag style={style}>{value}</Tag>;
  });

  const emLinhas = (linhas: string[]) =>
    linhas.map((l, i) => <React.Fragment key={l}>{i > 0 && <br />}{l}</React.Fragment>);

  return (
    <div
      className={className}
      style={{
        width: T.width, maxWidth: "100%", background: g.bg, color: g.ink,
        fontFamily: FONT_STACK, fontWeight: 300,
        textTransform: "uppercase", letterSpacing: "-0.02em",
      }}
    >
      {                                                                        
                                                   }
      <div style={{ ...carril, padding: `24px ${T.gutter}px 22px` }}>
        <div>
          <img src={marca} alt="ABiL MEDiAS" style={{ height: T.markHeight, width: "auto", display: "block" }} />
        </div>
        <div style={{ ...rot, opacity: 0.72 }}>{emLinhas(spec.rail.disciplines)}</div>
        <div style={{ ...rot, opacity: 0.72 }}>{emLinhas(spec.rail.signature)}</div>
      </div>

      {                 }
      {spec.banner && (
        <div style={{ position: "relative", width: "100%", aspectRatio: `${T.banner.w}/${T.banner.h}` }}>
          <img
            src={spec.banner} alt="" loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
          />
          {bannerOverlay}
        </div>
      )}

      {                                                            
                                                                           
                                                                            
                                                              }
      <div style={{ padding: `34px ${T.gutter}px 0`, position: "relative" }}>
        {texto({
          value: spec.statementRaw, fieldKey: "subject", as: "h1", multiline: false,
          style: {
            fontSize: spec.statementSize, lineHeight: T.statementLeading,
            letterSpacing: T.statementTracking, fontWeight: 300, margin: 0,
            maxWidth: T.column, textWrap: "balance" as React.CSSProperties["textWrap"],
          },
        })}
        {spec.counter && (
          <span style={{ ...rot, opacity: 0.55, position: "absolute", top: 40, right: T.gutter }}>
            {spec.counter}
          </span>
        )}
      </div>

      {           }
      {(spec.paragraphs.length > 0) && (
        <div style={{ padding: `30px ${T.gutter}px 0` }}>
          {texto({
            value: spec.paragraphs.join("\n\n"), fieldKey: "body", as: "p", multiline: true,
            style: { ...leit, maxWidth: 380, opacity: 0.9, whiteSpace: "pre-line" },
          })}
        </div>
      )}

      {                                                  }
      {spec.gallery.length > 0 && (
        <div style={{ padding: `24px ${T.gutter}px 0` }}>
          {galleryLabel && <div style={{ ...rot, opacity: 0.55, marginBottom: 10 }}>{galleryLabel}</div>}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, spec.gallery.length)}, 1fr)`, gap: 6 }}>
            {spec.gallery.map((src, i) => (
              <img
                key={i} src={src} alt="" loading="lazy"
                style={{ width: "100%", height: 132, objectFit: "cover", display: "block" }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
              />
            ))}
          </div>
        </div>
      )}

      {                                                                        
                                                                               
                                                                                   }
      {spec.rows.length > 0 && (
        <div style={{ padding: `34px ${T.gutter}px 0` }}>
          {spec.rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 22, padding: "15px 0", borderBottom: `1px solid ${g.ink}` }}>
              {texto({
                value: r.key, fieldKey: `block-${i}-titulo`, as: "div", multiline: false,
                style: { ...rot, opacity: 0.55, width: 74, flexShrink: 0 },
              })}
              {texto({
                value: r.text, fieldKey: `block-${i}-descricao`, as: "div", multiline: true,
                style: { ...leit, flex: 1, maxWidth: 330 },
              })}
            </div>
          ))}
        </div>
      )}

      {             }
      {spec.cta && (
        <div style={{ padding: `34px ${T.gutter}px 40px` }}>
          <a
            href={spec.cta.url || "#"} target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-block", background: g.pill.bg, color: g.pill.ink,
              borderRadius: 999, padding: "13px 28px", fontSize: T.label, lineHeight: 1,
              letterSpacing: T.labelTracking, textDecoration: "none",
            }}
          >
            {spec.cta.label}
          </a>
        </div>
      )}

      {                                                                               
                                                                                  
                                                     }
      <div
        style={{
          backgroundColor: spec.footer.fallback,
          backgroundImage: `linear-gradient(180deg, ${spec.footer.gradient})`,
          color: spec.footer.ink,
        }}
      >
        <div style={{ padding: `${spec.footer.padTop}px ${T.gutter}px 0` }}>
          <img
            src="/brand/abil-mark-black-tight.png" alt="ABiL MEDiAS"
            style={{ height: T.markHeight, width: "auto", display: "block" }}
          />
        </div>
        <div style={{ ...carril, padding: `26px ${T.gutter}px ${spec.footer.padBottom}px` }}>
          <div style={rot}>{spec.contact.site}</div>
          <div style={rot}>{spec.contact.phone}</div>
          <div style={rot}>{emLinhas(spec.contact.address)}</div>
        </div>
        {unsubscribeLabel && (
          <div style={{ padding: `0 ${T.gutter}px ${Math.max(12, spec.footer.padBottom - 20)}px` }}>
            <a href="#" style={{ ...rot, opacity: 0.45, color: spec.footer.ink, textDecoration: "none" }}>
              {unsubscribeLabel}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
