   
                                                                        
  
                                                                                 
                                                                                
                                              
  
                                                                              
                                                                      
                                                                                
                                                                     
                                                                              
                                                                                    
                                                                                   
                                                                                   
                                                            
                                                                                   
  
                                                                                  
                                                             
   
import { buildEmailSpec, type EmailSpec, type EmailSpecInput } from "./spec.js";
import { FONT_STACK, TYPE } from "./tokens.js";

export function htmlEscape(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

                                                                             
function escaparComBr(s: string): string {
  return htmlEscape(s).replace(/&lt;br\s*\/?&gt;/gi, "<br>");
}

const rot = (extra = "") =>
  `font:300 ${TYPE.label}px/${TYPE.labelLeading} ${FONT_STACK};letter-spacing:${TYPE.labelTracking};` +
  `text-transform:uppercase;margin:0;${extra}`;

const leit = (extra = "") =>
  `font:300 ${TYPE.read}px/${TYPE.readLeading} ${FONT_STACK};letter-spacing:0;` +
  `text-transform:uppercase;margin:0;${extra}`;

                                                                                       
function carril(cols: [string, string, string], padding: string, ink: string): string {
  const larguras = ["31.6%", "43.6%", "24.8%"];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>${cols.map((c, i) => `<td width="${larguras[i]}" valign="top" style="padding:${i === 0 ? padding : padding};color:${ink};">${c}</td>`).join("")}</tr>
</table>`;
}

export type RenderHtmlOpts = {
                                                                            
                                             
  absolute: (src: string) => string;
                                                 
  mergeName?: string;
                                                                        
  preheader?: string;
};

export function renderAbilEmailHtml(t: EmailSpecInput, opts: RenderHtmlOpts): string {
  const spec = buildEmailSpec(t, { resolveImg: opts.absolute, mergeName: opts.mergeName });
  return renderSpecHtml(spec, opts);
}

export function renderSpecHtml(spec: EmailSpec, opts: RenderHtmlOpts): string {
  const { g, type } = spec;
                                                                                 
                                                                             
                                                                            
                                                                             
  const marca = opts.absolute(
    spec.g.markTop === "citron" ? "/brand/abil-mark-citron-tight.png" : "/brand/abil-mark-black-tight.png",
  );
  const marcaRodape = opts.absolute("/brand/abil-mark-black-tight.png");
  const ALT = type.markHeight;
  const LARG = Math.round(ALT * (429 / 103));

  const railTopo = carril([
    `<img src="${htmlEscape(marca)}" width="${LARG}" height="${ALT}" alt="ABiL MEDiAS" style="display:block;border:0;">`,
    `<div style="${rot("opacity:.72;")}">${spec.rail.disciplines.join("<br>")}</div>`,
    `<div style="${rot("opacity:.72;")}">${spec.rail.signature.join("<br>")}</div>`,
  ], `24px ${type.gutter}px 22px`, g.ink);

  const banner = spec.banner
    ? `<img src="${htmlEscape(spec.banner)}" width="${type.banner.w}" height="${type.banner.h}" alt="" style="display:block;border:0;width:${type.banner.w}px;height:${type.banner.h}px;">`
    : "";

  const frase = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td valign="top" style="padding:34px ${type.gutter}px 0;">
<h1 style="font:300 ${spec.statementSize}px/${type.statementLeading} ${FONT_STACK};letter-spacing:${type.statementTracking};text-transform:uppercase;margin:0;color:${g.ink};">${escaparComBr(spec.statement)}</h1>
</td>
${spec.counter ? `<td valign="top" align="right" width="60" style="padding:40px ${type.gutter}px 0 0;"><span style="${rot(`opacity:.55;color:${g.ink};`)}">${htmlEscape(spec.counter)}</span></td>` : ""}
</tr></table>`;

  const paragrafos = spec.paragraphs.length
    ? `<div style="padding:30px ${type.gutter}px 0;">${spec.paragraphs
        .map((p) => `<p style="${leit(`max-width:380px;opacity:.9;color:${g.ink};`)}">${htmlEscape(p).replace(/\n/g, "<br>")}</p>`)
        .join("")}</div>`
    : "";

  const linhas = spec.rows.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
${spec.rows.map((r) => `<tr>
<td valign="top" width="74" style="padding:15px 22px 15px ${type.gutter}px;border-bottom:1px solid ${g.ink};"><span style="${rot(`opacity:.55;color:${g.ink};`)}">${htmlEscape(r.key)}</span></td>
<td valign="top" style="padding:15px ${type.gutter}px 15px 0;border-bottom:1px solid ${g.ink};"><span style="${leit(`color:${g.ink};`)}">${htmlEscape(r.text)}</span></td>
</tr>`).join("")}
</table>`
    : "";

  const galeria = spec.gallery.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr>
${spec.gallery.map((src) => `<td width="${Math.floor(type.column / spec.gallery.length)}" style="padding:0 2px;"><img src="${htmlEscape(src)}" width="${Math.floor(type.column / spec.gallery.length)}" height="132" alt="" style="display:block;border:0;"></td>`).join("")}
</tr></table>`
    : "";

  const pilula = spec.cta
    ? `<div style="padding:34px ${type.gutter}px 40px;">
<a href="${htmlEscape(spec.cta.url)}" style="display:inline-block;background:${g.pill.bg};color:${g.pill.ink};border-radius:999px;padding:13px 28px;font:300 ${type.label}px/1 ${FONT_STACK};letter-spacing:${type.labelTracking};text-transform:uppercase;text-decoration:none;">${htmlEscape(spec.cta.label)}</a>
</div>`
    : "";

                                                                                            
  const rodape = `<div style="background-color:${spec.footer.fallback};background-image:linear-gradient(180deg, ${spec.footer.gradient});color:${spec.footer.ink};">
<div style="padding:${spec.footer.padTop}px ${type.gutter}px 0;"><img src="${htmlEscape(marcaRodape)}" width="${LARG}" height="${ALT}" alt="ABiL MEDiAS" style="display:block;border:0;"></div>
${carril([
    `<div style="${rot("")}"><a href="https://${spec.contact.site}" style="color:${spec.footer.ink};text-decoration:none;">${htmlEscape(spec.contact.site)}</a></div>`,
    `<div style="${rot("")}">${htmlEscape(spec.contact.phone)}</div>`,
    `<div style="${rot("")}">${spec.contact.address.map(htmlEscape).join("<br>")}</div>`,
  ], `26px ${type.gutter}px ${spec.footer.padBottom}px`, spec.footer.ink)}
</div>`;

  const pre = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${htmlEscape(opts.preheader)}</div>`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${g.bg};">
${pre}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:${g.bg};">
<tr><td align="center" style="padding:0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${type.width}" style="border-collapse:collapse;width:${type.width}px;max-width:100%;background:${g.bg};color:${g.ink};">
<tr><td style="padding:0;">
${railTopo}
${banner}
${frase}
${paragrafos}
${linhas ? `<div style="padding-top:34px;">${linhas}</div>` : ""}
${galeria ? `<div style="padding:20px ${type.gutter}px 0;">${galeria}</div>` : ""}
${pilula}
${rodape}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`.replace(/\n\s*\n/g, "\n");
}

                                                                               
                                                                 
export function pesoAproximado(html: string): number {
  return new TextEncoder().encode(html).length;
}
