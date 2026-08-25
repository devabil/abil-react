                                                                          

                                                                                    
                                                                        

                                                                                    
                                                                                  
                                                                                    
                                                                                   
                                                                                    

                                                                                    
                                                                                
                   
  

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { type AbilLang } from "../../AbilSite";

                                                                            
type L5 = Record<AbilLang, string>;
const t5 = (o: L5, l: AbilLang) => o[l] || o.fr;

                                                                               
        
                                                                                
                                                                                   
                                                                         

                                                                             
                                                                                
                                                           
                                                                               

export type NomeGlifo = "seta" | "fechar" | "visto";
export type GiroGlifo = 0 | 90 | 180 | 270;

export interface GlifoProps {
  nome: NomeGlifo;
                                                                                  
  giro?: GiroGlifo;
                                                               
  tamanho?: number;
                                                                                    
  rotulo?: string;
}

export function Glifo({ nome, giro = 0, tamanho = 12, rotulo }: GlifoProps) {
  const nomeada = typeof rotulo === "string" && rotulo.length > 0;
  return (
    <svg
      className="ad-gl"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={giro ? { transform: `rotate(${giro}deg)` } : undefined}
      role={nomeada ? "img" : undefined}
      aria-hidden={nomeada ? undefined : true}
      focusable="false"
    >
      {nomeada ? <title>{rotulo}</title> : null}
      {nome === "seta" ? (
        <>
          <path d="M1 6H11" />
          <path d="M6.5 1.5L11 6L6.5 10.5" />
        </>
      ) : null}
      {nome === "fechar" ? (
        <>
          <path d="M2 2L10 10" />
          <path d="M10 2L2 10" />
        </>
      ) : null}
      {nome === "visto" ? <path d="M2 6.5L5 9.5L10 4.5" /> : null}
    </svg>
  );
}

                                                                               
        
                                               
                                                                               

export type TamanhoBotao = "normal" | "pequeno";
                                                                                     
export type EstadoDemo = "hover" | "foco";

export interface ConfirmacaoPerigo {
                                                                     
  rotulo: string;
                                                                      
  anuncio: string;
}

interface BotaoBase {
                                                
  rotulo: string;
  aoAccionar: () => void;
  tamanho?: TamanhoBotao;
  desactivado?: boolean;
                                                                                      
  motivoDesactivado?: string;
  aCarregar?: boolean;
                                                                    
  rotuloACarregar?: string;
  tipo?: "button" | "submit";
  larguraTotal?: boolean;
  demo?: EstadoDemo;
}

                                                                                 
                                                                                       
export type BotaoProps =
  | (BotaoBase & { variante?: "solido" | "fantasma"; confirmacao?: never; glifo?: never })
  | (BotaoBase & { variante: "perigo"; confirmacao: ConfirmacaoPerigo; glifo?: NomeGlifo });

export function Botao(props: BotaoProps) {
  const {
    rotulo,
    aoAccionar,
    variante = "solido",
    tamanho = "normal",
    desactivado = false,
    motivoDesactivado,
    aCarregar = false,
    rotuloACarregar,
    tipo = "button",
    larguraTotal = false,
    demo,
  } = props;
  const confirmacao = props.variante === "perigo" ? props.confirmacao : undefined;
  const glifo = props.variante === "perigo" ? props.glifo : undefined;

  const [armado, setArmado] = useState(false);
  const idMotivo = useId();
  const inerte = desactivado || aCarregar;

                                                                                         
  useEffect(() => {
    if (!armado) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArmado(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [armado]);

  const aoClicar = useCallback(() => {
    if (inerte) return;
    if (confirmacao && !armado) {
      setArmado(true);
      return;
    }
    setArmado(false);
    aoAccionar();
  }, [inerte, confirmacao, armado, aoAccionar]);

  const rotuloVisivel = armado && confirmacao ? confirmacao.rotulo : rotulo;
  const classes = [
    "ad-btn",
    `ad-btn-${variante}`,
    `ad-btn-${tamanho}`,
    armado ? "ad-armado" : "",
    demo === "hover" ? "ad-demo-hover" : "",
    demo === "foco" ? "ad-demo-foco" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={larguraTotal ? "ad-btn-wrap ad-btn-total" : "ad-btn-wrap"}>
      <button
        type={tipo}
        className={classes}
        onClick={aoClicar}
        onBlur={() => setArmado(false)}
        aria-disabled={inerte || undefined}
        aria-busy={aCarregar || undefined}
        aria-describedby={desactivado && motivoDesactivado ? idMotivo : undefined}
      >
        <span className="ad-btn-fundo" aria-hidden="true" />
        <span className="ad-btn-t">{rotuloVisivel}</span>
        {glifo ? <Glifo nome={glifo} tamanho={tamanho === "pequeno" ? 10 : 12} /> : null}
        {aCarregar ? (
          <span className="ad-btn-corrida" aria-hidden="true">
            <i />
          </span>
        ) : null}
      </button>
      {                                                                                      }
      <span className="ad-vh" role="status">
        {armado && confirmacao ? confirmacao.anuncio : ""}
        {aCarregar && rotuloACarregar ? rotuloACarregar : ""}
      </span>
      {desactivado && motivoDesactivado ? (
        <span className="ad-vh" id={idMotivo}>
          {motivoDesactivado}
        </span>
      ) : null}
    </span>
  );
}

                                                                               
       
                                                                                 
                                                                            
                                                         
                                                                               

interface PillBase {
  rotulo: string;
                                                                            
  contagem?: number;
  demo?: EstadoDemo;
}

export type PillProps =
  | (PillBase & {
      variante: "seleccionavel";
      seleccionada: boolean;
      aoAlternar: (proxima: boolean) => void;
      desactivada?: boolean;
      aoRemover?: never;
      rotuloRemover?: never;
    })
  | (PillBase & {
      variante: "estatica";
      seleccionada?: never;
      aoAlternar?: never;
      desactivada?: never;
      aoRemover?: () => void;
                                                                      
      rotuloRemover?: string;
    });

const doisDigitos = (n: number) => String(Math.abs(Math.trunc(n))).padStart(2, "0");

export function Pill(props: PillProps) {
  const { rotulo, contagem, demo } = props;
  const base = [
    "ad-pill",
    demo === "hover" ? "ad-demo-hover" : "",
    demo === "foco" ? "ad-demo-foco" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const miolo = (
    <>
      <span className="ad-pill-t">{rotulo}</span>
      {typeof contagem === "number" ? (
        <span className="ad-pill-n">{doisDigitos(contagem)}</span>
      ) : null}
    </>
  );

  if (props.variante === "seleccionavel") {
    const { seleccionada, aoAlternar, desactivada = false } = props;
    return (
      <button
        type="button"
        className={`${base} ad-pill-sel${seleccionada ? " ad-on" : ""}`}
        aria-pressed={seleccionada}
        aria-disabled={desactivada || undefined}
        onClick={() => {
          if (desactivada) return;
          aoAlternar(!seleccionada);
        }}
      >
        {miolo}
      </button>
    );
  }

  const { aoRemover, rotuloRemover } = props;
  return (
    <span className={`${base} ad-pill-est`}>
      {miolo}
      {aoRemover && rotuloRemover ? (
        <button type="button" className="ad-pill-x" onClick={aoRemover}>
          <Glifo nome="fechar" tamanho={8} rotulo={rotuloRemover} />
        </button>
      ) : null}
    </span>
  );
}

                                                                               
          
                                                                                  
                                          
                                                                               

export type TomLigacao = "normal" | "fraca";

interface LigacaoBase {
  rotulo: string;
  tom?: TomLigacao;
                                                                    
  activa?: boolean;
  demo?: EstadoDemo;
}

export type LigacaoProps =
  | (LigacaoBase & { como?: "botao"; aoAccionar: () => void; href?: never; externa?: never })
  | (LigacaoBase & { como: "ancora"; href: string; externa?: boolean; aoAccionar?: never });

export function Ligacao(props: LigacaoProps) {
  const { rotulo, tom = "normal", activa = false, demo } = props;
  const classes = [
    "ad-lnk",
    tom === "fraca" ? "ad-lnk-fraca" : "",
    activa ? "ad-on" : "",
    demo === "hover" ? "ad-demo-hover" : "",
    demo === "foco" ? "ad-demo-foco" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (props.como === "ancora") {
    const { href, externa = false } = props;
    return (
      <a
        className={classes}
        href={href}
        aria-current={activa ? "page" : undefined}
        target={externa ? "_blank" : undefined}
        rel={externa ? "noreferrer noopener" : undefined}
      >
        {rotulo}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={classes}
      aria-current={activa ? "page" : undefined}
      onClick={props.aoAccionar}
    >
      {rotulo}
    </button>
  );
}

                                                                               
          
                                                                             
                                                                                 
                                                                            
                                                                               

export type TomEyebrow = "fraca" | "forte";

export interface EyebrowProps {
  texto: string;
  tom?: TomEyebrow;
  marca?: boolean;
  contagem?: number;
  como?: "span" | "div" | "p";
}

export function Eyebrow({ texto, tom = "fraca", marca = false, contagem, como = "span" }: EyebrowProps) {
  const Tag = como;
  return (
    <Tag className={`ad-eb${tom === "forte" ? " ad-eb-forte" : ""}`}>
      {marca ? <i className="ad-eb-marca" aria-hidden="true" /> : null}
      {texto}
      {typeof contagem === "number" ? (
        <span className="ad-eb-n">{doisDigitos(contagem)}</span>
      ) : null}
    </Tag>
  );
}

                                                                               
         
                                                                                 
                                                                              
                                                                               

export type NivelTitulo = 1 | 2 | 3 | 4;
export type TamanhoTitulo = "titulo" | "seccao" | "sub";

export interface TituloProps {
  texto: string;
  nivel: NivelTitulo;
                                                                  
  tamanho?: TamanhoTitulo;
  id?: string;
}

export function Titulo({ texto, nivel, tamanho, id }: TituloProps) {
  const Tag = nivel === 1 ? "h1" : nivel === 2 ? "h2" : nivel === 3 ? "h3" : "h4";
  const t: TamanhoTitulo = tamanho ?? (nivel === 1 ? "titulo" : nivel === 2 ? "seccao" : "sub");
  return (
    <Tag className={`ad-tit ad-tit-${t}`} id={id}>
      {texto}
    </Tag>
  );
}

                                                                               
            
                                                                                
                                                                         
                                         
                                                                               

export interface SeparadorProps {
  direccao?: "horizontal" | "vertical";
  tom?: "linha" | "forte";
                                                                                  
  entra?: boolean;
                                                                              
  decorativo?: boolean;
}

export function Separador({
  direccao = "horizontal",
  tom = "linha",
  entra = false,
  decorativo = true,
}: SeparadorProps) {
  const classes = [
    "ad-sep",
    direccao === "vertical" ? "ad-sep-v" : "ad-sep-h",
    tom === "forte" ? "ad-sep-forte" : "",
    entra ? "ad-sep-entra" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      role={decorativo ? undefined : "separator"}
      aria-orientation={decorativo ? undefined : direccao}
      aria-hidden={decorativo ? true : undefined}
    />
  );
}

                                                                               
                                                                            
                               
                                                                               

export const CSS_BASE = `
/* Base utilities. */
.ad-vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip-path:inset(50%);white-space:nowrap;border:0}
/* Forced state used only by the system gallery. */
.ad-demo-foco{outline:var(--ad-foco);outline-offset:2px}
.ad-gl{display:block;flex:0 0 auto}

/* Button.
   Use a capsule rather than a square corner. The public site consistently uses capsules for every
   interactive control: the CTA, briefing button, filter labels, view switcher and header language
   circles. Rectilinear corners are reserved for surfaces such as list boxes, the player and panels.
   The panel previously used a square button, a shape the site uses nowhere else for an action. */
.ad-btn-wrap{position:relative;display:inline-block;vertical-align:top}
.ad-btn-wrap.ad-btn-total{display:block}
.ad-btn-total .ad-btn{width:100%}
.ad-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;
  gap:var(--ad-e2);box-sizing:border-box;overflow:hidden;cursor:pointer;
  font-family:var(--ad-fonte);font-weight:var(--ad-peso-normal);text-transform:uppercase;
  line-height:1;letter-spacing:-.01em;
  border:var(--ad-linha-px) solid transparent;border-radius:var(--ad-raio-pill);background:transparent;
  color:var(--ad-tinta);
  transition:color var(--ad-d-normal) var(--ad-curva),
             background-color var(--ad-d-normal) var(--ad-curva),
             border-color var(--ad-d-normal) var(--ad-curva),
             transform var(--ad-d-rapido) var(--ad-curva)}
.ad-btn-normal{padding:var(--ad-e2) var(--ad-e4);font-size:var(--ad-t-apoio)}
/* The small variant reduces padding, never type size, because 10px uppercase text becomes illegible. */
.ad-btn-pequeno{padding:var(--ad-e1) var(--ad-e3);font-size:var(--ad-t-apoio)}
.ad-btn-t{position:relative;z-index:1;transform:translateY(.06em)}
.ad-btn .ad-gl{position:relative;z-index:1}
.ad-btn:focus-visible{outline:var(--ad-foco);outline-offset:2px}
.ad-btn:active:not([aria-disabled="true"]){transform:translateY(1px)}

/* Sweeping layer. Its width never changes because it uses scaleX from the left, matching the
   underline and hairline gesture in V3. */
.ad-btn-fundo{position:absolute;inset:0;z-index:0;transform:scaleX(0);transform-origin:left center;
  transition:transform var(--ad-d-normal) var(--ad-curva)}

/* Solid variant: inverted surface. Ink becomes the ground and the ground becomes ink, so no raw
   colour is introduced. */
.ad-btn-solido{background:var(--ad-tinta);color:var(--ad-superficie-alta);border-color:var(--ad-tinta)}
.ad-btn-solido .ad-btn-fundo{background:var(--ad-acao)}
.ad-btn-solido:hover:not([aria-disabled="true"]) .ad-btn-fundo,
.ad-btn-solido:focus-visible:not([aria-disabled="true"]) .ad-btn-fundo,
.ad-btn-solido.ad-demo-hover .ad-btn-fundo{transform:scaleX(1)}
.ad-btn-solido:hover:not([aria-disabled="true"]),
.ad-btn-solido:focus-visible:not([aria-disabled="true"]),
.ad-btn-solido.ad-demo-hover{color:var(--ad-tinta)}

/* Ghost variant: outline only. It does not sweep citron because that would make it identical to the
   solid variant and erase the hierarchy. Only the hairline changes from rhythm to boundary. */
.ad-btn-fantasma{border-color:var(--ad-linha);color:var(--ad-tinta)}
.ad-btn-fantasma:hover:not([aria-disabled="true"]),
.ad-btn-fantasma:focus-visible:not([aria-disabled="true"]),
.ad-btn-fantasma.ad-demo-hover{border-color:var(--ad-tinta)}

/* Danger variant: colour increases with commitment. Rest shows only the Violette outline, interaction
   fills it, and the armed state remains filled until the second interaction or Escape. */
.ad-btn-perigo{border-color:var(--ad-sinal);color:var(--ad-tinta)}
.ad-btn-perigo .ad-btn-fundo{background:var(--ad-sinal)}
.ad-btn-perigo:hover:not([aria-disabled="true"]) .ad-btn-fundo,
.ad-btn-perigo:focus-visible:not([aria-disabled="true"]) .ad-btn-fundo,
.ad-btn-perigo.ad-armado .ad-btn-fundo,
.ad-btn-perigo.ad-demo-hover .ad-btn-fundo{transform:scaleX(1)}

/* Disabled controls deliberately remain focusable so users can reach them and hear the reason.
   The measured label ratio is 2.7:1, below 4.5:1 and covered by the inactive-control exception in
   WCAG 1.4.3. The reason is therefore always written out, and grey is never the only carrier of
   that information. */
.ad-btn[aria-disabled="true"]{cursor:not-allowed;background:var(--ad-linha);
  border-color:var(--ad-linha);color:var(--ad-tinta-fraca)}
.ad-btn[aria-disabled="true"] .ad-btn-fundo{transform:scaleX(0)}
/* Loading is not disabled and must not use disabled styling. Browser measurements showed that without
   these three lines the running button became Gris Leman and appeared blocked. The variant keeps its
   styling, changes the cursor and introduces the hairline. */
.ad-btn[aria-busy="true"]{cursor:progress}
.ad-btn-solido[aria-busy="true"]{background:var(--ad-tinta);border-color:var(--ad-tinta);
  color:var(--ad-superficie-alta)}
.ad-btn-fantasma[aria-busy="true"]{background:transparent;border-color:var(--ad-linha);
  color:var(--ad-tinta)}
.ad-btn-perigo[aria-busy="true"]{background:transparent;border-color:var(--ad-sinal);
  color:var(--ad-tinta)}

/* Loading indicator: a hairline running along the bottom edge. It is neither a spinner nor a library
   asset, but the house rule moving across the button. */
.ad-btn-corrida{position:absolute;left:0;right:0;bottom:0;height:var(--ad-linha-px);
  overflow:hidden;z-index:2}
.ad-btn-corrida i{position:absolute;inset:0;display:block;background:var(--ad-tinta);
  animation:ad-corre 1.1s linear infinite}
.ad-btn-solido .ad-btn-corrida i{background:var(--ad-acao)}
@keyframes ad-corre{
  from{transform:translateX(-100%) scaleX(.35)}
  to{transform:translateX(100%) scaleX(.35)}}

/* Pill. */
.ad-pill{display:inline-flex;align-items:center;gap:var(--ad-e2);box-sizing:border-box;
  padding:var(--ad-e1) var(--ad-e3);border:var(--ad-linha-px) solid var(--ad-linha);
  border-radius:var(--ad-raio-pill);background:transparent;color:var(--ad-tinta);
  font-family:var(--ad-fonte);font-size:var(--ad-t-apoio);font-weight:var(--ad-peso-normal);
  line-height:1;text-transform:uppercase;letter-spacing:var(--ad-track-titulo);
  transition:background-color var(--ad-d-normal) var(--ad-curva),
             color var(--ad-d-normal) var(--ad-curva),
             border-color var(--ad-d-normal) var(--ad-curva)}
.ad-pill-t{transform:translateY(.06em)}
/* The count always sits one typographic step below what it counts, as in V3. */
.ad-pill-n{font-size:var(--ad-t-micro);color:var(--ad-tinta-fraca)}
.ad-pill-sel{cursor:pointer}
.ad-pill-sel:focus-visible{outline:var(--ad-foco);outline-offset:2px}
.ad-pill-sel:hover:not([aria-disabled="true"]),
.ad-pill-sel.ad-demo-hover{background:var(--ad-tinta);border-color:var(--ad-tinta);
  color:var(--ad-superficie-alta)}
.ad-pill-sel:hover:not([aria-disabled="true"]) .ad-pill-n,
.ad-pill-sel.ad-demo-hover .ad-pill-n,
.ad-pill-sel.ad-on .ad-pill-n{color:var(--ad-superficie-alta)}
/* The selected pill is filled. State does not rely on colour alone because aria-pressed also conveys it. */
.ad-pill-sel.ad-on{background:var(--ad-tinta);border-color:var(--ad-tinta);
  color:var(--ad-superficie-alta)}
.ad-pill-sel[aria-disabled="true"]{cursor:not-allowed;color:var(--ad-tinta-fraca);
  background:transparent;border-color:var(--ad-linha)}
.ad-pill-sel[aria-disabled="true"] .ad-pill-n{color:var(--ad-tinta-fraca)}
.ad-pill-est{cursor:default}
.ad-pill-x{display:inline-flex;align-items:center;justify-content:center;padding:0;margin:0;
  border:0;background:transparent;color:inherit;cursor:pointer;border-radius:var(--ad-raio-pill)}
.ad-pill-x:focus-visible{outline:var(--ad-foco);outline-offset:2px}
.ad-pill-x:hover{color:var(--ad-tinta-fraca)}

/* Link. */
.ad-lnk{position:relative;display:inline-block;padding:0 0 2px;border:0;background:transparent;
  font-family:var(--ad-fonte);font-size:var(--ad-t-apoio);font-weight:var(--ad-peso-normal);
  line-height:1.2;text-transform:uppercase;letter-spacing:var(--ad-track-titulo);
  color:var(--ad-tinta);text-decoration:none;cursor:pointer}
.ad-lnk-fraca{color:var(--ad-tinta-fraca)}
.ad-lnk:after{content:"";position:absolute;left:0;bottom:0;width:100%;height:var(--ad-linha-px);
  background:currentColor;transform:scaleX(0);transform-origin:bottom right;
  transition:transform var(--ad-d-normal) var(--ad-curva)}
.ad-lnk:hover:after,.ad-lnk.ad-on:after,.ad-lnk.ad-demo-hover:after{transform:scaleX(1);
  transform-origin:bottom left}
.ad-lnk:focus-visible{outline:var(--ad-foco);outline-offset:2px}
.ad-lnk:active{opacity:1;color:var(--ad-tinta)}

/* Eyebrow. */
.ad-eb{display:inline-flex;align-items:center;gap:var(--ad-e2);
  font-family:var(--ad-fonte);font-size:var(--ad-t-micro);font-weight:var(--ad-peso-normal);
  line-height:1.2;text-transform:uppercase;letter-spacing:var(--ad-track-eyebrow);
  color:var(--ad-tinta-fraca)}
.ad-eb-forte{color:var(--ad-tinta)}
/* Use a square rather than a dot because rectilinear corners belong to the system. It never appears alone. */
.ad-eb-marca{display:block;width:6px;height:6px;background:var(--ad-sinal);
  border-radius:var(--ad-raio)}
.ad-eb-n{color:var(--ad-tinta-fraca);letter-spacing:var(--ad-track-titulo)}

/* Title. */
.ad-tit{margin:0;font-family:var(--ad-fonte);text-transform:uppercase;
  letter-spacing:var(--ad-track-titulo);line-height:var(--ad-lh-titulo);color:var(--ad-tinta)}
.ad-tit-titulo{font-size:var(--ad-t-titulo);font-weight:var(--ad-peso-leve)}
.ad-tit-seccao{font-size:var(--ad-t-seccao);font-weight:var(--ad-peso-leve)}
/* The subtitle rises to weight 400, matching how the S step is the first to leave weight 300 in V3. */
.ad-tit-sub{font-size:var(--ad-t-sub);font-weight:var(--ad-peso-normal)}

/* Separator. */
.ad-sep{flex:0 0 auto;background:var(--ad-linha)}
.ad-sep-h{width:100%;height:var(--ad-linha-px)}
.ad-sep-v{width:var(--ad-linha-px);align-self:stretch;min-height:1em}
.ad-sep-forte{background:var(--ad-tinta-fraca)}
.ad-sep-h.ad-sep-entra{transform:scaleX(0);transform-origin:left center;
  animation:ad-encher var(--ad-d-lento) var(--ad-curva) forwards}
.ad-sep-v.ad-sep-entra{transform:scaleY(0);transform-origin:center top;
  animation:ad-descer var(--ad-d-lento) var(--ad-curva) forwards}
@keyframes ad-encher{to{transform:scaleX(1)}}
@keyframes ad-descer{to{transform:scaleY(1)}}

/* With reduced motion, state freezes instead of disappearing. The loading hairline remains complete
   and stationary while continuing to indicate an active process. */
@media (prefers-reduced-motion:reduce){
  .ad-btn-corrida i{animation:none;transform:none}
  .ad-sep-entra{animation:none;transform:none}
}
`;

                                                                                  
export function EstilosBase() {
  return <style>{CSS_BASE}</style>;
}

                                                                               
           
                                                                                 
                                                                                
                                                                                 
                                                                       
                                                                               

export type Amostra = { nome: L5; nota: L5; exemplo: (lang: AbilLang) => ReactNode };

                                                                                         
const D_PUBLICAR: L5 = { fr: "Publier", en: "Publish", pt: "Publicar", de: "Veröffentlichen", it: "Pubblica" };
const D_ELIMINAR: L5 = { fr: "Supprimer", en: "Delete", pt: "Eliminar", de: "Löschen", it: "Elimina" };
const D_CONFIRMAR: L5 = { fr: "Confirmer", en: "Confirm", pt: "Confirmar", de: "Bestätigen", it: "Conferma" };
const D_GUARDAR: L5 = { fr: "Enregistrer", en: "Save", pt: "Guardar", de: "Speichern", it: "Salva" };
const D_A_GUARDAR: L5 = {
  fr: "Enregistrement en cours",
  en: "Saving in progress",
  pt: "A guardar",
  de: "Wird gespeichert",
  it: "Salvataggio in corso",
};
const D_IRREVERSIVEL_2X: L5 = {
  fr: "Action irréversible. Touchez à nouveau pour confirmer.",
  en: "Irreversible action. Tap again to confirm.",
  pt: "Ação irreversível. Toque outra vez para confirmar.",
  de: "Unumkehrbare Aktion. Zum Bestätigen erneut antippen.",
  it: "Azione irreversibile. Tocca di nuovo per confermare.",
};
const D_IRREVERSIVEL: L5 = {
  fr: "Action irréversible.",
  en: "Irreversible action.",
  pt: "Ação irreversível.",
  de: "Unumkehrbare Aktion.",
  it: "Azione irreversibile.",
};
const D_CONFIRMADO: L5 = { fr: "Confirmé", en: "Confirmed", pt: "Confirmado", de: "Bestätigt", it: "Confermato" };
const D_IDENTIDADE: L5 = { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" };
const D_VER_FICHA: L5 = {
  fr: "Voir la fiche",
  en: "View the record",
  pt: "Ver a ficha",
  de: "Datenblatt ansehen",
  it: "Vedere la scheda",
};

                                                                                  
function AmostraPillSel({ lang }: { lang: AbilLang }) {
  const [sel, setSel] = useState(false);
  return (
    <Pill
      variante="seleccionavel"
      rotulo={t5({ fr: "Publié", en: "Published", pt: "Publicado", de: "Veröffentlicht", it: "Pubblicato" }, lang)}
      contagem={12}
      seleccionada={sel}
      aoAlternar={setSel}
    />
  );
}

function AmostraPerigo({ lang }: { lang: AbilLang }) {
  const [feito, setFeito] = useState(0);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <Botao
        variante="perigo"
        rotulo={t5(D_ELIMINAR, lang)}
        glifo="fechar"
        confirmacao={{ rotulo: t5(D_CONFIRMAR, lang), anuncio: t5(D_IRREVERSIVEL_2X, lang) }}
        aoAccionar={() => setFeito((n) => n + 1)}
      />
      <Eyebrow texto={`${t5(D_CONFIRMADO, lang)} ${doisDigitos(feito)}`} />
    </span>
  );
}

function AmostraCarga({ lang }: { lang: AbilLang }) {
  const [carrega, setCarrega] = useState(false);
  const rel = useRef<number | null>(null);
  useEffect(() => () => { if (rel.current) window.clearTimeout(rel.current); }, []);
  return (
    <Botao
      rotulo={t5(D_GUARDAR, lang)}
      aCarregar={carrega}
      rotuloACarregar={t5(D_A_GUARDAR, lang)}
      aoAccionar={() => {
        setCarrega(true);
        rel.current = window.setTimeout(() => setCarrega(false), 2400);
      }}
    />
  );
}

function AmostraTagRemovivel({ lang }: { lang: AbilLang }) {
  const [visivel, setVisivel] = useState(true);
  return visivel ? (
    <Pill
      variante="estatica"
      rotulo={t5(D_IDENTIDADE, lang)}
      aoRemover={() => setVisivel(false)}
      rotuloRemover={t5(
        {
          fr: "Retirer le filtre Identité",
          en: "Remove the Identity filter",
          pt: "Remover o filtro Identidade",
          de: "Filter Identität entfernen",
          it: "Rimuovere il filtro Identità",
        },
        lang,
      )}
    />
  ) : (
    <Ligacao
      rotulo={t5({ fr: "Rétablir", en: "Restore", pt: "Repor", de: "Wiederherstellen", it: "Ripristina" }, lang)}
      aoAccionar={() => setVisivel(true)}
    />
  );
}

const linha = (filhos: ReactNode) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>{filhos}</span>
);

                                                                                     
                                                                                    
// eslint-disable-next-line react-refresh/only-export-components
export const AMOSTRAS: Amostra[] = [
  {
    nome: {
      fr: "Bouton plein",
      en: "Solid button",
      pt: "Botão sólido",
      de: "Ausgefüllte Schaltfläche",
      it: "Pulsante pieno",
    },
    nota: {
      fr: "Repos, survol figé et focus figé. Le Citron balaie depuis la gauche en scaleX et le libellé passe en Noir par-dessus. Action principale, une seule par vue.",
      en: "Rest, pinned hover and pinned focus. The Citron sweeps in from the left with scaleX and the label turns Noir on top of it. Primary action, one per view.",
      pt: "Repouso, hover fixado e foco fixado. O Citron varre da esquerda em scaleX e o rótulo passa a Noir por cima dele. Ação principal, uma por vista.",
      de: "Ruhezustand, fixierter Hover und fixierter Fokus. Das Citron wischt per scaleX von links herein und die Beschriftung wechselt darüber auf Noir. Hauptaktion, eine pro Ansicht.",
      it: "Riposo, hover fissato e focus fissato. Il Citron scorre da sinistra in scaleX e l'etichetta passa a Noir sopra di esso. Azione principale, una per vista.",
    },
    exemplo: (lang) =>
      linha(
        <>
          <Botao rotulo={t5(D_PUBLICAR, lang)} aoAccionar={() => {}} />
          <Botao rotulo={t5(D_PUBLICAR, lang)} aoAccionar={() => {}} demo="hover" />
          <Botao rotulo={t5(D_PUBLICAR, lang)} aoAccionar={() => {}} demo="foco" />
        </>,
      ),
  },
  {
    nome: {
      fr: "Bouton plein petit",
      en: "Small solid button",
      pt: "Botão sólido pequeno",
      de: "Kleine ausgefüllte Schaltfläche",
      it: "Pulsante pieno piccolo",
    },
    nota: {
      fr: "Même corps de texte que le normal, avec seulement la moitié du padding. Il sert la ligne de tableau et la barre d'outils.",
      en: "Same type size as the normal one, with only half the padding. It serves the table row and the toolbar.",
      pt: "Mesma letra do normal, só com metade do padding. Serve linha de tabela e barra de ferramentas.",
      de: "Gleiche Schriftgröße wie die normale Variante, nur mit dem halben Padding. Sie dient der Tabellenzeile und der Werkzeugleiste.",
      it: "Stesso corpo del normale, solo con metà del padding. Serve la riga di tabella e la barra degli strumenti.",
    },
    exemplo: (lang) => {
      const abrir = t5({ fr: "Ouvrir", en: "Open", pt: "Abrir", de: "Öffnen", it: "Apri" }, lang);
      return linha(
        <>
          <Botao rotulo={abrir} tamanho="pequeno" aoAccionar={() => {}} />
          <Botao rotulo={abrir} tamanho="pequeno" aoAccionar={() => {}} demo="hover" />
        </>,
      );
    },
  },
  {
    nome: {
      fr: "Bouton fantôme",
      en: "Ghost button",
      pt: "Botão fantasma",
      de: "Ghost-Schaltfläche",
      it: "Pulsante fantasma",
    },
    nota: {
      fr: "Repos avec la hairline Gris Léman, le survol et le focus assombrissent la hairline vers le Noir. Il ne balaie pas le Citron, exprès : s'il le faisait, il n'y aurait plus de hiérarchie entre l'action principale et la secondaire.",
      en: "Rest with the Gris Léman hairline; hover and focus darken the hairline to Noir. It deliberately does not sweep Citron: if it did, there would be no hierarchy left between the primary and the secondary action.",
      pt: "Repouso com hairline Gris Léman, hover e foco escurecem a hairline para Noir. Não varre Citron de propósito: se varresse, deixava de haver hierarquia entre a ação principal e a secundária.",
      de: "Ruhezustand mit der Hairline in Gris Léman, Hover und Fokus verdunkeln die Hairline zu Noir. Sie wischt bewusst kein Citron: täte sie es, gäbe es keine Hierarchie mehr zwischen der Haupt- und der Nebenaktion.",
      it: "Riposo con hairline Gris Léman, hover e focus scuriscono la hairline fino al Noir. Non scorre il Citron di proposito: se lo facesse, non ci sarebbe più gerarchia tra l'azione principale e quella secondaria.",
    },
    exemplo: (lang) => {
      const cancelar = t5({ fr: "Annuler", en: "Cancel", pt: "Cancelar", de: "Abbrechen", it: "Annulla" }, lang);
      return linha(
        <>
          <Botao variante="fantasma" rotulo={cancelar} aoAccionar={() => {}} />
          <Botao variante="fantasma" rotulo={cancelar} aoAccionar={() => {}} demo="hover" />
          <Botao variante="fantasma" rotulo={cancelar} aoAccionar={() => {}} demo="foco" />
          <Botao variante="fantasma" rotulo={cancelar} tamanho="pequeno" aoAccionar={() => {}} />
        </>,
      );
    },
  },
  {
    nome: {
      fr: "Bouton désactivé",
      en: "Disabled button",
      pt: "Botão desativado",
      de: "Deaktivierte Schaltfläche",
      it: "Pulsante disattivato",
    },
    nota: {
      fr: "Il reste focalisable exprès et porte la raison en toutes lettres dans aria-describedby. Le gris n'est jamais la seule copie de l'information.",
      en: "It stays focusable on purpose and carries the reason spelled out in aria-describedby. The grey is never the only copy of the information.",
      pt: "Fica focável de propósito e traz a razão por extenso em aria-describedby. O cinzento nunca é a única cópia da informação.",
      de: "Sie bleibt absichtlich fokussierbar und trägt den Grund ausgeschrieben in aria-describedby. Das Grau ist nie die einzige Kopie der Information.",
      it: "Resta focalizzabile di proposito e porta la ragione per esteso in aria-describedby. Il grigio non è mai l'unica copia dell'informazione.",
    },
    exemplo: (lang) =>
      linha(
        <>
          <Botao
            rotulo={t5(D_PUBLICAR, lang)}
            aoAccionar={() => {}}
            desactivado
            motivoDesactivado={t5(
              {
                fr: "Il manque la traduction allemande.",
                en: "The German translation is missing.",
                pt: "Falta a tradução alemã.",
                de: "Die deutsche Übersetzung fehlt.",
                it: "Manca la traduzione tedesca.",
              },
              lang,
            )}
          />
          <Botao
            variante="fantasma"
            rotulo={t5({ fr: "Exporter", en: "Export", pt: "Exportar", de: "Exportieren", it: "Esporta" }, lang)}
            aoAccionar={() => {}}
            desactivado
            motivoDesactivado={t5(
              {
                fr: "Aucune ligne sélectionnée.",
                en: "No row selected.",
                pt: "Nenhuma linha selecionada.",
                de: "Keine Zeile ausgewählt.",
                it: "Nessuna riga selezionata.",
              },
              lang,
            )}
          />
        </>,
      ),
  },
  {
    nome: {
      fr: "Bouton en cours",
      en: "Loading button",
      pt: "Botão a carregar",
      de: "Ladende Schaltfläche",
      it: "Pulsante in caricamento",
    },
    nota: {
      fr: "Touchez pour la voir courir. L'indicateur est une hairline de 1px qui traverse le bord bas en transform, sans aucun spinner. En mouvement réduit, elle reste entière et immobile.",
      en: "Tap to watch it run. The indicator is a 1px hairline that crosses the bottom edge with transform, with no spinner at all. Under reduced motion it stays whole and still.",
      pt: "Toque para ver correr. O indicador é uma hairline de 1px que atravessa o bordo de baixo em transform, sem spinner nenhum. Em movimento reduzido fica inteira e parada.",
      de: "Antippen, um sie laufen zu sehen. Der Indikator ist eine 1px-Hairline, die per transform die Unterkante durchquert, ganz ohne Spinner. Bei reduzierter Bewegung bleibt sie vollständig und still.",
      it: "Tocca per vederla correre. L'indicatore è una hairline da 1px che attraversa il bordo inferiore in transform, senza alcuno spinner. In movimento ridotto resta intera e ferma.",
    },
    exemplo: (lang) =>
      linha(
        <>
          <AmostraCarga lang={lang} />
          <Botao
            rotulo={t5(D_GUARDAR, lang)}
            aCarregar
            rotuloACarregar={t5(D_A_GUARDAR, lang)}
            aoAccionar={() => {}}
          />
        </>,
      ),
  },
  {
    nome: {
      fr: "Bouton de danger",
      en: "Danger button",
      pt: "Botão de perigo",
      de: "Gefahrenschaltfläche",
      it: "Pulsante di pericolo",
    },
    nota: {
      fr: "Deux touches. La première arme et change le libellé, la seconde exécute ; Échap ou la perte du focus désarme. Le type oblige celui qui l'utilise à passer le libellé de confirmation, il n'y a donc pas de danger sans confirmation.",
      en: "Two taps. The first arms it and swaps the label, the second runs it; Escape or losing focus disarms it. The type forces whoever uses it to pass the confirmation label, so there is no danger without confirmation.",
      pt: "Dois toques. O primeiro arma e troca o rótulo, o segundo executa; Escape ou perder o foco desarma. O tipo obriga quem o usa a passar o rótulo de confirmação, por isso não há perigo sem confirmação.",
      de: "Zwei Klicks. Der erste schärft sie und tauscht die Beschriftung, der zweite führt aus; Escape oder Fokusverlust entschärft sie. Der Typ zwingt jeden, der sie einsetzt, die Bestätigungsbeschriftung zu übergeben, also gibt es keine Gefahr ohne Bestätigung.",
      it: "Due tocchi. Il primo arma e scambia l'etichetta, il secondo esegue; Escape o la perdita del focus disarma. Il tipo obbliga chi lo usa a passare l'etichetta di conferma, quindi non c'è pericolo senza conferma.",
    },
    exemplo: (lang) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <AmostraPerigo lang={lang} />
        <Botao
          variante="perigo"
          rotulo={t5(D_ELIMINAR, lang)}
          confirmacao={{ rotulo: t5(D_CONFIRMAR, lang), anuncio: t5(D_IRREVERSIVEL, lang) }}
          aoAccionar={() => {}}
          demo="hover"
        />
        <Botao
          variante="perigo"
          rotulo={t5(D_ELIMINAR, lang)}
          confirmacao={{ rotulo: t5(D_CONFIRMAR, lang), anuncio: t5(D_IRREVERSIVEL, lang) }}
          aoAccionar={() => {}}
          desactivado
          motivoDesactivado={t5(
            {
              fr: "Vous n'avez pas le droit de supprimer.",
              en: "You do not have permission to delete.",
              pt: "Não tem permissão para eliminar.",
              de: "Sie haben keine Berechtigung zum Löschen.",
              it: "Non hai il permesso di eliminare.",
            },
            lang,
          )}
        />
      </span>
    ),
  },
  {
    nome: {
      fr: "Pill sélectionnable",
      en: "Selectable pill",
      pt: "Pill selecionável",
      de: "Auswählbare Pill",
      it: "Pill selezionabile",
    },
    nota: {
      fr: "La puce de filtre. Repos, survol figé, focus figé, sélectionnée et désactivée. L'état est dit par aria-pressed et pas seulement par la couleur. Le compteur va toujours à deux chiffres et un cran plus bas.",
      en: "The filter chip. Rest, pinned hover, pinned focus, selected and disabled. The state is spoken by aria-pressed and not by colour alone. The count always runs at two digits and one step down.",
      pt: "O chip de filtro. Repouso, hover fixado, foco fixado, selecionada e desativada. Estado dito por aria-pressed e não só por cor. A contagem vai sempre a dois dígitos e um degrau abaixo.",
      de: "Der Filter-Chip. Ruhezustand, fixierter Hover, fixierter Fokus, ausgewählt und deaktiviert. Der Zustand wird von aria-pressed gesagt und nicht nur von der Farbe. Die Zählung läuft immer zweistellig und eine Stufe kleiner.",
      it: "Il chip di filtro. Riposo, hover fissato, focus fissato, selezionata e disattivata. Lo stato è detto da aria-pressed e non solo dal colore. Il conteggio va sempre a due cifre e un gradino più in basso.",
    },
    exemplo: (lang) =>
      linha(
        <>
          <AmostraPillSel lang={lang} />
          <Pill
            variante="seleccionavel"
            rotulo={t5({ fr: "Brouillon", en: "Draft", pt: "Rascunho", de: "Entwurf", it: "Bozza" }, lang)}
            seleccionada={false}
            aoAlternar={() => {}}
            demo="hover"
          />
          <Pill
            variante="seleccionavel"
            rotulo={t5({ fr: "Archivé", en: "Archived", pt: "Arquivado", de: "Archiviert", it: "Archiviato" }, lang)}
            contagem={3}
            seleccionada
            aoAlternar={() => {}}
          />
          <Pill
            variante="seleccionavel"
            rotulo={t5({ fr: "Planifié", en: "Scheduled", pt: "Agendado", de: "Geplant", it: "Programmato" }, lang)}
            seleccionada={false}
            aoAlternar={() => {}}
            demo="foco"
          />
          <Pill
            variante="seleccionavel"
            rotulo={t5({ fr: "Supprimé", en: "Deleted", pt: "Eliminado", de: "Gelöscht", it: "Eliminato" }, lang)}
            seleccionada={false}
            aoAlternar={() => {}}
            desactivada
          />
        </>,
      ),
  },
  {
    nome: {
      fr: "Pill statique",
      en: "Static pill",
      pt: "Pill estática",
      de: "Statische Pill",
      it: "Pill statica",
    },
    nota: {
      fr: "L'étiquette. Elle n'est pas cliquable et n'a ni survol ni focus, parce qu'elle ne fait rien. Avec un retrait, elle gagne un bouton à elle, avec un nom accessible et le seul glyphe de fermeture du panneau.",
      en: "The tag. It is not clickable and has neither hover nor focus, because it does nothing. With a remove it gains a button of its own, with an accessible name and the panel's only close glyph.",
      pt: "A etiqueta. Não é clicável e não tem hover nem foco, porque não faz nada. Com remover ganha um botão próprio, com nome acessível e o único glifo de fechar do painel.",
      de: "Das Etikett. Es ist nicht klickbar und hat weder Hover noch Fokus, weil es nichts tut. Mit einem Entfernen bekommt es eine eigene Schaltfläche, mit zugänglichem Namen und der einzigen Schließen-Glyphe des Panels.",
      it: "L'etichetta. Non è cliccabile e non ha né hover né focus, perché non fa nulla. Con un rimuovi guadagna un pulsante proprio, con nome accessibile e l'unico glifo di chiusura del pannello.",
    },
    exemplo: (lang) =>
      linha(
        <>
          <Pill
            variante="estatica"
            rotulo={t5(
              { fr: "Branding", en: "Branding", pt: "Branding", de: "Branding", it: "Branding" },
              lang,
            )}
          />
          <Pill variante="estatica" rotulo="2026" contagem={7} />
          <AmostraTagRemovivel lang={lang} />
        </>,
      ),
  },
  {
    nome: {
      fr: "Lien",
      en: "Link",
      pt: "Ligação",
      de: "Link",
      it: "Collegamento",
    },
    nota: {
      fr: "Repos, survol figé, actif (soulignement fixé et aria-current) et focus figé. Le soulignement pousse depuis la gauche et sort par la droite, le geste de la V3 au tempo du panneau. Il existe en bouton et en ancre.",
      en: "Rest, pinned hover, active (locked underline and aria-current) and pinned focus. The underline grows from the left and leaves through the right, the V3 gesture at the panel's tempo. It exists as a button and as an anchor.",
      pt: "Repouso, hover fixado, ativa (sublinhado preso e aria-current) e foco fixado. O sublinhado cresce da esquerda e sai pela direita, o gesto da V3 no tempo do painel. Existe como botão e como âncora.",
      de: "Ruhezustand, fixierter Hover, aktiv (feste Unterstreichung und aria-current) und fixierter Fokus. Die Unterstreichung wächst von links und verlässt das Feld nach rechts, die Geste der V3 im Tempo des Panels. Es gibt ihn als Schaltfläche und als Anker.",
      it: "Riposo, hover fissato, attivo (sottolineatura fissa e aria-current) e focus fissato. La sottolineatura cresce da sinistra ed esce da destra, il gesto della V3 nel tempo del pannello. Esiste come pulsante e come ancora.",
    },
    exemplo: (lang) => (
      linha(
        <>
          <Ligacao rotulo={t5(D_VER_FICHA, lang)} aoAccionar={() => {}} />
          <Ligacao rotulo={t5(D_VER_FICHA, lang)} aoAccionar={() => {}} demo="hover" />
          <Ligacao
            rotulo={t5({ fr: "Journal", en: "Log", pt: "Registo", de: "Protokoll", it: "Registro" }, lang)}
            aoAccionar={() => {}}
            activa
          />
          <Ligacao rotulo={t5(D_VER_FICHA, lang)} aoAccionar={() => {}} demo="foco" />
          <Ligacao como="ancora" href="https://abil.ch" externa rotulo="abil.ch" tom="fraca" />
        </>,
      )
    ),
  },
  {
    nome: {
      fr: "Eyebrow",
      en: "Eyebrow",
      pt: "Eyebrow",
      de: "Eyebrow",
      it: "Eyebrow",
    },
    nota: {
      fr: "Le seul tracking positif du panneau. Ton faible par défaut, ton fort quand il ouvre un bloc, marque Violette quand il signale, et compteur à deux chiffres. La marque ne va jamais seule : le texte dit toujours la même chose.",
      en: "The panel's only positive tracking. Weak tone by default, strong tone when it opens a block, Violette mark when it flags, and a two-digit count. The mark never goes alone: the text always says the same thing.",
      pt: "O único tracking positivo do painel. Tom fraco por omissão, tom forte quando abre um bloco, marca Violette quando assinala, e contagem a dois dígitos. A marca nunca vai sozinha: o texto diz sempre o mesmo.",
      de: "Das einzige positive Tracking des Panels. Schwacher Ton als Standard, starker Ton, wenn es einen Block eröffnet, Violette Marke, wenn es kennzeichnet, und zweistellige Zählung. Die Marke geht nie allein: der Text sagt immer dasselbe.",
      it: "L'unico tracking positivo del pannello. Tono debole per impostazione predefinita, tono forte quando apre un blocco, marca Violette quando segnala, e conteggio a due cifre. La marca non va mai da sola: il testo dice sempre la stessa cosa.",
    },
    exemplo: (lang) =>
      linha(
        <>
          <Eyebrow
            texto={t5({ fr: "Section", en: "Section", pt: "Secção", de: "Abschnitt", it: "Sezione" }, lang)}
          />
          <Eyebrow
            texto={t5({ fr: "Contenu", en: "Content", pt: "Conteúdo", de: "Inhalt", it: "Contenuto" }, lang)}
            tom="forte"
          />
          <Eyebrow
            texto={t5(
              { fr: "À traduire", en: "To translate", pt: "Por traduzir", de: "Zu übersetzen", it: "Da tradurre" },
              lang,
            )}
            marca
          />
          <Eyebrow
            texto={t5({ fr: "Brouillons", en: "Drafts", pt: "Rascunhos", de: "Entwürfe", it: "Bozze" }, lang)}
            contagem={4}
          />
        </>,
      ),
  },
  {
    nome: {
      fr: "Titre",
      en: "Heading",
      pt: "Título",
      de: "Titel",
      it: "Titolo",
    },
    nota: {
      fr: "Trois crans visuels et quatre niveaux sémantiques, indépendants. Ici les quatre niveaux à la taille par défaut, puis un h2 forcé au cran sub, pour prouver la séparation.",
      en: "Three visual steps and four semantic levels, independent of each other. Here are the four levels at their default size, then an h2 forced to the sub step, to prove the separation.",
      pt: "Três degraus visuais e quatro níveis semânticos, independentes. Aqui os quatro níveis com o tamanho por omissão, e depois um h2 forçado ao degrau sub, para provar a separação.",
      de: "Drei visuelle Stufen und vier semantische Ebenen, voneinander unabhängig. Hier die vier Ebenen in der Standardgröße und danach ein h2, das auf die Stufe sub gezwungen wird, um die Trennung zu belegen.",
      it: "Tre gradini visivi e quattro livelli semantici, indipendenti. Qui i quattro livelli con la dimensione predefinita, e poi un h2 forzato al gradino sub, per provare la separazione.",
    },
    exemplo: (lang) => (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 12 }}>
        <Titulo
          nivel={1}
          texto={t5(
            { fr: "Tableau de bord", en: "Dashboard", pt: "Dashboard", de: "Dashboard", it: "Dashboard" },
            lang,
          )}
        />
        <Titulo
          nivel={2}
          texto={t5(
            {
              fr: "Contenu du site",
              en: "Site content",
              pt: "Conteúdo do site",
              de: "Inhalt der Website",
              it: "Contenuto del sito",
            },
            lang,
          )}
        />
        <Titulo
          nivel={3}
          texto={t5(
            {
              fr: "Articles récents",
              en: "Recent articles",
              pt: "Artigos recentes",
              de: "Aktuelle Artikel",
              it: "Articoli recenti",
            },
            lang,
          )}
        />
        <Titulo
          nivel={2}
          tamanho="sub"
          texto={t5(
            {
              fr: "H2 au cran sub",
              en: "H2 at the sub step",
              pt: "H2 no degrau sub",
              de: "H2 auf der Stufe sub",
              it: "H2 al gradino sub",
            },
            lang,
          )}
        />
      </span>
    ),
  },
  {
    nome: {
      fr: "Séparateur",
      en: "Divider",
      pt: "Separador",
      de: "Trennlinie",
      it: "Separatore",
    },
    nota: {
      fr: "Horizontal et vertical, ton de rythme (Gris Léman, décoratif) et ton de limite (Gris Rhône, avec un rôle déclaré). Avec entra, il pousse en scaleX ou scaleY, la seule chose de 1px autorisée à animer sa taille.",
      en: "Horizontal and vertical, rhythm tone (Gris Léman, decorative) and boundary tone (Gris Rhône, with a declared role). With entra it grows in scaleX or scaleY, the only 1px thing allowed to animate its size.",
      pt: "Horizontal e vertical, tom de ritmo (Gris Léman, decorativo) e tom de limite (Gris Rhône, com papel declarado). Com entra, cresce em scaleX ou scaleY, que é a única coisa de 1px autorizada a animar tamanho.",
      de: "Horizontal und vertikal, Rhythmuston (Gris Léman, dekorativ) und Grenzton (Gris Rhône, mit deklarierter Rolle). Mit entra wächst sie in scaleX oder scaleY, das Einzige mit 1px, das seine Größe animieren darf.",
      it: "Orizzontale e verticale, tono di ritmo (Gris Léman, decorativo) e tono di limite (Gris Rhône, con ruolo dichiarato). Con entra, cresce in scaleX o scaleY, l'unica cosa da 1px autorizzata ad animare la dimensione.",
    },
    exemplo: (lang) => (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 12, width: 240 }}>
        <Separador />
        <Separador tom="forte" decorativo={false} />
        <Separador entra />
        <span style={{ display: "inline-flex", alignItems: "stretch", gap: 12, height: 24 }}>
          <Eyebrow texto={t5({ fr: "Gauche", en: "Left", pt: "Esquerda", de: "Links", it: "Sinistra" }, lang)} />
          <Separador direccao="vertical" />
          <Eyebrow texto={t5({ fr: "Droite", en: "Right", pt: "Direita", de: "Rechts", it: "Destra" }, lang)} />
        </span>
      </span>
    ),
  },
  {
    nome: {
      fr: "Glyphe",
      en: "Glyph",
      pt: "Glifo",
      de: "Glyphe",
      it: "Glifo",
    },
    nota: {
      fr: "Les trois, et ce nombre est un plafond et non un début. Flèche dans les quatre directions par la rotation, croix de fermeture et coche de confirmation. Sans libellé ils restent aria-hidden ; avec libellé ils passent en role img avec titre.",
      en: "All three, and that number is a ceiling and not a start. Arrow in the four directions through the rotation, close cross and confirmation tick. Without a label they stay aria-hidden; with a label they become role img with a title.",
      pt: "Os três, e o número é um teto e não um começo. Seta nas quatro direções pelo giro, cruz de fechar e visto de confirmação. Sem rótulo ficam aria-hidden; com rótulo passam a role img com título.",
      de: "Alle drei, und diese Zahl ist eine Obergrenze und kein Anfang. Pfeil in die vier Richtungen über die Drehung, Schließkreuz und Bestätigungshaken. Ohne Beschriftung bleiben sie aria-hidden; mit Beschriftung werden sie zu role img mit Titel.",
      it: "Tutti e tre, e quel numero è un tetto e non un inizio. Freccia nelle quattro direzioni tramite la rotazione, croce di chiusura e segno di spunta di conferma. Senza etichetta restano aria-hidden; con etichetta diventano role img con titolo.",
    },
    exemplo: (lang) =>
      linha(
        <>
          <Glifo nome="seta" />
          <Glifo nome="seta" giro={90} />
          <Glifo nome="seta" giro={180} />
          <Glifo nome="seta" giro={270} />
          <Glifo nome="fechar" />
          <Glifo nome="visto" />
          <Glifo
            nome="visto"
            tamanho={20}
            rotulo={t5({ fr: "Validé", en: "Validated", pt: "Validado", de: "Bestätigt", it: "Validato" }, lang)}
          />
        </>,
      ),
  },
];
