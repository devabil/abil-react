                                                                                      
  
                                                                                               
                                                                                           
                                                                           
  
                                                                          
                                                                                         
                                                                                              
                                                                               
                                                                                             
                                                                                              
                                     
                                                                                          
                                                                                               
                                                                                               
                                    
  
                                                                                            
                                                                                             

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { type AbilLang } from "../../AbilSite";

type L5 = Record<AbilLang, string>;
const t5 = (o: L5, l: AbilLang) => o[l] || o.fr;

                                                                               
                                                                     
                                                                                  

export const CSS_CAMPOS = `
/* Shared base for every field. */
.ad-campo{ display:block; font-family:var(--ad-fonte); color:var(--ad-tinta); }
.ad-campo *{ box-sizing:border-box; }

/* Screen-reader-only text. Do not use display:none because that would prevent it from being read. */
/* color:inherit removes the browser's default disabled file-input colour, rgb(84,84,84), from the
   calculation. That colour is outside the palette even when the element is visually clipped. */
.ad-campo-sr{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0; color:inherit; }

/* Labels use an eyebrow above the field and never float. In a dense panel, floating labels consume
   height and force users to read twice. */
.ad-campo-rot{ display:block; margin:0 0 var(--ad-e2); font-size:var(--ad-t-micro); line-height:1;
  font-weight:var(--ad-peso-normal); text-transform:uppercase; letter-spacing:var(--ad-track-eyebrow); color:var(--ad-tinta); }
.ad-campo-obg{ margin-left:2px; }

/* Inputs, textareas and the select trigger share the same control box. */
.ad-campo-ctl{ display:block; width:100%; margin:0; padding:6px 10px; font-family:inherit;
  font-size:var(--ad-t-corpo); line-height:var(--ad-lh-corpo); font-weight:var(--ad-peso-normal);
  letter-spacing:-.01em; color:var(--ad-tinta); background:var(--ad-superficie-alta);
  border:var(--ad-linha-px) solid var(--ad-linha); border-radius:var(--ad-raio);
  appearance:none; box-shadow:none; transition:border-color var(--ad-d-rapido) var(--ad-curva); }
.ad-campo-ctl::placeholder{ color:var(--ad-tinta-fraca); opacity:1; }
.ad-campo-ctl:hover:not(:disabled):not([readonly]){ border-color:var(--ad-tinta-fraca); }
.ad-campo-ctl:focus-visible{ outline:var(--ad-foco); outline-offset:2px; }
.ad-campo-ctl[readonly]{ background:var(--ad-superficie); }
.ad-campo-ctl:disabled{ background:var(--ad-superficie); color:var(--ad-tinta-fraca); cursor:not-allowed; }
.ad-campo[data-erro="1"] .ad-campo-ctl{ border-color:var(--ad-sinal); }

/* Field footer: help or error on the left and counter on the right. */
.ad-campo-pe{ display:flex; align-items:flex-start; justify-content:space-between; gap:var(--ad-e3); margin-top:var(--ad-e1); }
.ad-campo-ajuda{ font-size:var(--ad-t-apoio); line-height:1.35; letter-spacing:-.01em; color:var(--ad-tinta-fraca); }
.ad-campo-msg{ position:relative; padding-left:12px; font-size:var(--ad-t-apoio); line-height:1.35;
  letter-spacing:-.01em; color:var(--ad-tinta); }
/* The dot is the error signal. The text remains Noir to preserve legibility. */
.ad-campo-msg::before{ content:""; position:absolute; left:0; top:.4em; width:6px; height:6px;
  border-radius:var(--ad-raio-pill); background:var(--ad-sinal); }
.ad-campo-cont{ flex:none; padding-top:1px; font-size:var(--ad-t-micro); letter-spacing:var(--ad-track-eyebrow);
  color:var(--ad-tinta-fraca); font-variant-numeric:tabular-nums; }
.ad-campo[data-excedido="1"] .ad-campo-cont{ color:var(--ad-tinta); }

/* Text area. */
.ad-campo-area{ resize:none; overflow-y:hidden; display:block; }

/* Select control. */
.ad-campo-sel{ position:relative; }
.ad-campo-sel-btn{ display:flex; align-items:center; justify-content:space-between; gap:var(--ad-e2);
  text-align:left; cursor:pointer; }
.ad-campo-sel-btn:disabled{ cursor:not-allowed; }
.ad-campo-sel-val{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ad-campo-sel-val[data-vazio="1"]{ color:var(--ad-tinta-fraca); }
/* The arrow is a rotated 6px box with two borders. It is geometry rather than an icon, as in V3. */
.ad-campo-sel-seta{ flex:none; width:6px; height:6px; margin-bottom:2px;
  border-right:var(--ad-linha-px) solid currentColor; border-bottom:var(--ad-linha-px) solid currentColor;
  transform:rotate(45deg); transition:transform var(--ad-d-normal) var(--ad-curva); }
.ad-campo-sel[data-aberto="1"] .ad-campo-sel-seta{ transform:rotate(225deg); }
/* A Noir frame raises the list instead of a shadow. */
.ad-campo-sel-lista{ position:absolute; z-index:40; top:calc(100% + 2px); left:0; right:0; margin:0;
  padding:var(--ad-e1) 0; list-style:none; max-height:224px; overflow-y:auto;
  background:var(--ad-superficie-alta); border:var(--ad-linha-px) solid var(--ad-tinta); border-radius:var(--ad-raio); }
.ad-campo-sel-op{ position:relative; display:flex; align-items:baseline; gap:var(--ad-e3);
  padding:5px 10px 5px 12px; font-size:var(--ad-t-corpo); line-height:var(--ad-lh-corpo);
  letter-spacing:-.01em; cursor:pointer; }
/* The active item under keyboard or pointer control uses a sweeping vertical rule without a fill. */
.ad-campo-sel-op::before{ content:""; position:absolute; left:0; top:0; bottom:0; width:var(--ad-linha-px);
  background:var(--ad-tinta); transform:scaleX(0); transform-origin:left center;
  transition:transform var(--ad-d-rapido) var(--ad-curva); }
.ad-campo-sel-op[data-activo="1"]::before{ transform:scaleX(1); }
/* The selected item uses a hairline under its label, keeping separate signals for separate states. */
.ad-campo-sel-op[aria-selected="true"] .ad-campo-sel-oprot{ border-bottom:var(--ad-linha-px) solid var(--ad-tinta); }
.ad-campo-sel-op[aria-disabled="true"]{ color:var(--ad-tinta-fraca); cursor:not-allowed; }
.ad-campo-sel-nota{ margin-left:auto; flex:none; font-size:var(--ad-t-micro); text-transform:uppercase;
  letter-spacing:var(--ad-track-eyebrow); color:var(--ad-tinta-fraca); }
.ad-campo-sel-vazio{ padding:5px 10px 5px 12px; font-size:var(--ad-t-corpo); color:var(--ad-tinta-fraca); }

/* Switch. */
.ad-campo-int-btn{ display:inline-flex; align-items:center; gap:var(--ad-e3); margin:0; padding:0;
  background:none; border:0; cursor:pointer; font-family:inherit; color:var(--ad-tinta); }
.ad-campo-int-btn:focus-visible{ outline:var(--ad-foco); outline-offset:2px; }
.ad-campo-int-tr{ position:relative; flex:none; width:34px; height:18px; border-radius:var(--ad-raio-pill);
  background:var(--ad-superficie-alta); border:var(--ad-linha-px) solid var(--ad-linha);
  transition:background-color var(--ad-d-normal) var(--ad-curva), border-color var(--ad-d-normal) var(--ad-curva); }
.ad-campo-int-bt{ position:absolute; top:2px; left:2px; width:12px; height:12px; border-radius:var(--ad-raio-pill);
  background:var(--ad-tinta); transition:transform var(--ad-d-normal) var(--ad-curva); }
.ad-campo-int-pal{ font-size:var(--ad-t-apoio); line-height:1; text-transform:uppercase; letter-spacing:-.03em; }
.ad-campo-int-btn[aria-checked="true"] .ad-campo-int-tr{ background:var(--ad-acao); border-color:var(--ad-tinta); }
.ad-campo-int-btn[aria-checked="true"] .ad-campo-int-bt{ transform:translateX(16px); }
.ad-campo-int-btn:disabled{ cursor:not-allowed; color:var(--ad-tinta-fraca); }
.ad-campo-int-btn:disabled .ad-campo-int-tr{ background:var(--ad-superficie); border-color:var(--ad-linha); }
.ad-campo-int-btn:disabled .ad-campo-int-bt{ background:var(--ad-tinta-fraca); }
.ad-campo[data-erro="1"] .ad-campo-int-tr{ border-color:var(--ad-sinal); }

/* Choice control. */
.ad-campo-esc-lista{ display:flex; flex-wrap:wrap; gap:var(--ad-e2); }
.ad-campo-esc-pill{ margin:0; padding:7px 14px; font-family:inherit; font-size:var(--ad-t-apoio); line-height:1;
  font-weight:var(--ad-peso-normal); text-transform:uppercase; letter-spacing:-.03em; color:var(--ad-tinta);
  background:transparent; border:var(--ad-linha-px) solid var(--ad-linha); border-radius:var(--ad-raio-pill);
  cursor:pointer; transition:background-color var(--ad-d-rapido) var(--ad-curva),
  color var(--ad-d-rapido) var(--ad-curva), border-color var(--ad-d-rapido) var(--ad-curva); }
.ad-campo-esc-pill:focus-visible{ outline:var(--ad-foco); outline-offset:2px; }
.ad-campo-esc-pill:hover:not([aria-checked="true"]):not([aria-disabled="true"]){ border-color:var(--ad-tinta); }
.ad-campo-esc-pill[aria-checked="true"]{ background:var(--ad-tinta); border-color:var(--ad-tinta); color:var(--ad-alpin); }
.ad-campo-esc-pill[aria-disabled="true"]{ color:var(--ad-tinta-fraca); cursor:not-allowed; }
.ad-campo[data-erro="1"] .ad-campo-esc-pill:not([aria-checked="true"]){ border-color:var(--ad-sinal); }

/* Upload. */
/* The zone is a well. It starts recessed into the canvas and rises to white when ready to receive a file. */
.ad-campo-up-zona{ position:relative; display:flex; flex-direction:column; align-items:flex-start;
  gap:var(--ad-e3); padding:var(--ad-e4); background:var(--ad-superficie);
  border:var(--ad-linha-px) solid var(--ad-linha); border-radius:var(--ad-raio);
  transition:background-color var(--ad-d-normal) var(--ad-curva), border-color var(--ad-d-normal) var(--ad-curva); }
.ad-campo-up[data-estado="sobre"] .ad-campo-up-zona{ background:var(--ad-superficie-alta); border-color:var(--ad-tinta); }
.ad-campo-up[data-estado="erro"] .ad-campo-up-zona{ border-color:var(--ad-sinal); }
.ad-campo-up-txt{ font-size:var(--ad-t-corpo); line-height:var(--ad-lh-corpo); letter-spacing:-.01em; }
.ad-campo-up-fich{ display:flex; align-items:baseline; gap:var(--ad-e3); width:100%; }
.ad-campo-up-nome{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:var(--ad-t-corpo);
  line-height:var(--ad-lh-corpo); letter-spacing:-.01em; }
.ad-campo-up-tam{ flex:none; font-size:var(--ad-t-micro); letter-spacing:var(--ad-track-eyebrow);
  color:var(--ad-tinta-fraca); font-variant-numeric:tabular-nums; }
/* Progress uses a 1px hairline filled by a transform, never the width of a content block. */
.ad-campo-up-barra{ position:relative; width:100%; height:var(--ad-linha-px); background:var(--ad-linha); overflow:hidden; }
.ad-campo-up-barra i{ position:absolute; inset:0; background:var(--ad-tinta); transform:scaleX(0);
  transform-origin:left center; transition:transform var(--ad-d-rapido) linear; }
.ad-campo-up-pct{ font-size:var(--ad-t-micro); letter-spacing:var(--ad-track-eyebrow);
  color:var(--ad-tinta-fraca); font-variant-numeric:tabular-nums; }
.ad-campo-up-linha{ display:flex; align-items:center; gap:var(--ad-e3); width:100%; }
.ad-campo-up-acao{ margin:0; padding:0 0 2px; font-family:inherit; font-size:var(--ad-t-apoio); line-height:1;
  text-transform:uppercase; letter-spacing:-.03em; color:var(--ad-tinta); background:none; border:0;
  border-bottom:var(--ad-linha-px) solid var(--ad-tinta); cursor:pointer; }
.ad-campo-up-acao:focus-visible{ outline:var(--ad-foco); outline-offset:2px; }
.ad-campo-up-acao:disabled{ color:var(--ad-tinta-fraca); border-bottom-color:var(--ad-linha); cursor:not-allowed; }
/* Close and remove use the plus character rotated 45 degrees, as in V3. This is a glyph, not an icon. */
.ad-campo-up-x{ flex:none; display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px;
  margin:0; padding:0; background:none; border:0; color:var(--ad-tinta); font-family:inherit;
  font-size:var(--ad-t-corpo); line-height:1; cursor:pointer; }
.ad-campo-up-x i{ display:block; font-style:normal; transform:rotate(45deg);
  transition:transform var(--ad-d-normal) var(--ad-curva); }
.ad-campo-up-x:hover i{ transform:rotate(135deg); }
.ad-campo-up-x:focus-visible{ outline:var(--ad-foco); outline-offset:2px; }
`;

                                                                   
export function EstilosCampos() {
  return <style>{CSS_CAMPOS}</style>;
}

                                                                               
             
                                                                                  

                                                                                 
// eslint-disable-next-line react-refresh/only-export-components
export function formatarBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(0)} kB`;
  return `${(bytes / (1000 * 1000)).toFixed(bytes < 10 * 1000 * 1000 ? 1 : 0)} MB`;
}

                                                            
function ficheiroAceite(f: File, aceita?: string): boolean {
  if (!aceita) return true;
  const regras = aceita.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (regras.length === 0) return true;
  const nome = f.name.toLowerCase();
  const tipo = f.type.toLowerCase();
  return regras.some((r) => {
    if (r.startsWith(".")) return nome.endsWith(r);
    if (r.endsWith("/*")) return tipo.startsWith(r.slice(0, -1));
    return tipo === r;
  });
}

function juntarIds(...ids: (string | false | null | undefined)[]): string | undefined {
  const l = ids.filter((i): i is string => typeof i === "string" && i.length > 0);
  return l.length ? l.join(" ") : undefined;
}

                                                                  
function PeCampo({
  ajuda, ajudaId, erro, erroId, contador,
}: {
  ajuda?: string; ajudaId: string; erro?: string; erroId: string; contador?: ReactNode;
}) {
  if (!ajuda && !erro && !contador) return null;
  return (
    <div className="ad-campo-pe">
      {erro ? (
        <span className="ad-campo-msg" id={erroId} role="alert">{erro}</span>
      ) : ajuda ? (
        <span className="ad-campo-ajuda" id={ajudaId}>{ajuda}</span>
      ) : (
        <span />
      )}
      {contador ?? null}
    </div>
  );
}

                                                                               
                                 
                                                                                  

export type TipoCampo = "text" | "email" | "url" | "tel" | "search" | "password";

export type CampoProps = {
                                                        
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  id?: string;
  nome?: string;
  tipo?: TipoCampo;
                                                            
  marcador?: string;
  ajuda?: string;
                                              
  erro?: string;
                                      
  maximo?: number;
  obrigatorio?: boolean;
  desativado?: boolean;
  soLeitura?: boolean;
  autoComplete?: string;
  aoFocar?: () => void;
  aoSair?: () => void;
};

export function Campo({
  rotulo, valor, aoMudar, id: idProp, nome, tipo = "text", marcador, ajuda, erro,
  maximo, obrigatorio, desativado, soLeitura, autoComplete, aoFocar, aoSair,
}: CampoProps) {
  const auto = useId();
  const id = idProp ?? `${auto}campo`;
  const ajudaId = `${id}-ajuda`;
  const erroId = `${id}-erro`;
  const excedido = maximo != null && valor.length > maximo;

                                                                          
  const limiar = maximo != null ? Math.max(10, Math.round(maximo * 0.1)) : 0;
  const anuncia = maximo != null && maximo - valor.length <= limiar;

  return (
    <div className="ad-campo" data-erro={erro || excedido ? "1" : undefined} data-excedido={excedido ? "1" : undefined}>
      <label className="ad-campo-rot" htmlFor={id}>
        {rotulo}{obrigatorio ? <span className="ad-campo-obg" aria-hidden="true">*</span> : null}
      </label>
      <input
        id={id}
        name={nome}
        className="ad-campo-ctl"
        type={tipo}
        value={valor}
        placeholder={marcador}
        autoComplete={autoComplete}
        disabled={desativado}
        readOnly={soLeitura}
        required={obrigatorio}
        aria-required={obrigatorio || undefined}
        aria-invalid={erro || excedido ? true : undefined}
        aria-describedby={juntarIds(erro && erroId, ajuda && ajudaId)}
        onChange={(e) => aoMudar(e.target.value)}
        onFocus={aoFocar}
        onBlur={aoSair}
      />
      <PeCampo
        ajuda={ajuda} ajudaId={ajudaId} erro={erro} erroId={erroId}
        contador={maximo != null ? (
          <span className="ad-campo-cont" aria-hidden="true">{valor.length}/{maximo}</span>
        ) : undefined}
      />
      {maximo != null ? (
        <span className="ad-campo-sr" role="status" aria-live="polite">
          {anuncia ? `${valor.length}/${maximo}` : ""}
        </span>
      ) : null}
    </div>
  );
}

                                                                               
                                                     
                                                                                  

export type AreaTextoProps = Omit<CampoProps, "tipo" | "marcador" | "soLeitura"> & {
  marcador?: string;
  soLeitura?: boolean;
                                
  linhas?: number;
                                                               
  linhasMax?: number;
};

export function AreaTexto({
  rotulo, valor, aoMudar, id: idProp, nome, marcador, ajuda, erro, maximo, obrigatorio,
  desativado, soLeitura, autoComplete, aoFocar, aoSair, linhas = 3, linhasMax = 10,
}: AreaTextoProps) {
  const auto = useId();
  const id = idProp ?? `${auto}area`;
  const ajudaId = `${id}-ajuda`;
  const erroId = `${id}-erro`;
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const excedido = maximo != null && valor.length > maximo;
  const limiar = maximo != null ? Math.max(10, Math.round(maximo * 0.1)) : 0;
  const anuncia = maximo != null && maximo - valor.length <= limiar;

                                                                                         
  const ajustar = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const bordas = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    const tecto = lh * linhasMax + pad;
    const conteudo = el.scrollHeight;
    el.style.height = `${Math.round(Math.min(conteudo, tecto) + bordas)}px`;
    el.style.overflowY = conteudo > tecto ? "auto" : "hidden";
  }, [linhasMax]);

  useLayoutEffect(() => { ajustar(); }, [valor, ajustar]);

  return (
    <div className="ad-campo" data-erro={erro || excedido ? "1" : undefined} data-excedido={excedido ? "1" : undefined}>
      <label className="ad-campo-rot" htmlFor={id}>
        {rotulo}{obrigatorio ? <span className="ad-campo-obg" aria-hidden="true">*</span> : null}
      </label>
      <textarea
        id={id}
        ref={ref}
        name={nome}
        className="ad-campo-ctl ad-campo-area"
        rows={linhas}
        value={valor}
        placeholder={marcador}
        autoComplete={autoComplete}
        disabled={desativado}
        readOnly={soLeitura}
        required={obrigatorio}
        aria-required={obrigatorio || undefined}
        aria-invalid={erro || excedido ? true : undefined}
        aria-describedby={juntarIds(erro && erroId, ajuda && ajudaId)}
        onChange={(e) => aoMudar(e.target.value)}
        onFocus={aoFocar}
        onBlur={aoSair}
      />
      <PeCampo
        ajuda={ajuda} ajudaId={ajudaId} erro={erro} erroId={erroId}
        contador={maximo != null ? (
          <span className="ad-campo-cont" aria-hidden="true">{valor.length}/{maximo}</span>
        ) : undefined}
      />
      {maximo != null ? (
        <span className="ad-campo-sr" role="status" aria-live="polite">
          {anuncia ? `${valor.length}/${maximo}` : ""}
        </span>
      ) : null}
    </div>
  );
}

                                                                               
                                            
                                                                                  

export type OpcaoSelecao = {
  valor: string;
  rotulo: string;
                                                                       
  nota?: string;
  desativada?: boolean;
};

export type SelecaoProps = {
  rotulo: string;
  opcoes: OpcaoSelecao[];
  valor: string | null;
  aoMudar: (valor: string) => void;
                                  
  marcador: string;
                                    
  textoVazio?: string;
  id?: string;
  ajuda?: string;
  erro?: string;
  obrigatorio?: boolean;
  desativado?: boolean;
                                                                             
  abertoInicial?: boolean;
};

export function Selecao({
  rotulo, opcoes, valor, aoMudar, marcador, textoVazio, id: idProp, ajuda, erro,
  obrigatorio, desativado, abertoInicial,
}: SelecaoProps) {
  const auto = useId();
  const id = idProp ?? `${auto}sel`;
  const rotId = `${id}-rot`;
  const listaId = `${id}-lista`;
  const ajudaId = `${id}-ajuda`;
  const erroId = `${id}-erro`;

  const [aberto, setAberto] = useState(!!abertoInicial);
  const escolhido = useMemo(() => opcoes.findIndex((o) => o.valor === valor), [opcoes, valor]);
  const [activo, setActivo] = useState(escolhido >= 0 ? escolhido : 0);
  const raizRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listaRef = useRef<HTMLUListElement | null>(null);
  const buscaRef = useRef<{ texto: string; t: number }>({ texto: "", t: 0 });

  const navegavel = useCallback(
    (inicio: number, passo: number) => {
      if (opcoes.length === 0) return -1;
      let i = inicio;
      for (let n = 0; n < opcoes.length; n++) {
        if (i < 0) i = opcoes.length - 1;
        if (i > opcoes.length - 1) i = 0;
        if (!opcoes[i].desativada) return i;
        i += passo;
      }
      return -1;
    },
    [opcoes],
  );

  const abrir = useCallback(() => {
    if (desativado) return;
    setActivo(navegavel(escolhido >= 0 ? escolhido : 0, 1));
    setAberto(true);
  }, [desativado, escolhido, navegavel]);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) btnRef.current?.focus();
  }, []);

  const comprometer = useCallback((i: number) => {
    const op = opcoes[i];
    if (!op || op.desativada) return;
    aoMudar(op.valor);
    fechar(true);
  }, [aoMudar, fechar, opcoes]);

                          
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (raizRef.current && !raizRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

                                                               
  useEffect(() => {
    if (!aberto) return;
    const el = listaRef.current?.querySelector<HTMLElement>(`[data-i="${activo}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [aberto, activo]);

  const aoTeclar = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (desativado) return;
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (!aberto) { abrir(); return; }
      const passo = k === "ArrowDown" ? 1 : -1;
      setActivo((a) => navegavel(a + passo, passo));
      return;
    }
    if (k === "Home" || k === "End") {
      if (!aberto) return;
      e.preventDefault();
      setActivo(k === "Home" ? navegavel(0, 1) : navegavel(opcoes.length - 1, -1));
      return;
    }
    if (k === "Enter" || k === " " || k === "Spacebar") {
      e.preventDefault();
      if (!aberto) { abrir(); return; }
      comprometer(activo);
      return;
    }
    if (k === "Escape") {
      if (!aberto) return;
      e.preventDefault();
      fechar(true);
      return;
    }
    if (k === "Tab") {
      if (aberto) setAberto(false);
      return;
    }
                                                          
    if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const agora = Date.now();
      const b = buscaRef.current;
      b.texto = agora - b.t > 600 ? k.toLowerCase() : b.texto + k.toLowerCase();
      b.t = agora;
      const alvo = opcoes.findIndex((o) => !o.desativada && o.rotulo.toLowerCase().startsWith(b.texto));
      if (alvo >= 0) {
        if (!aberto) setAberto(true);
        setActivo(alvo);
      }
    }
  };

  const opEscolhida = escolhido >= 0 ? opcoes[escolhido] : null;

  return (
    <div className="ad-campo ad-campo-sel" ref={raizRef} data-aberto={aberto ? "1" : undefined} data-erro={erro ? "1" : undefined}>
      <span className="ad-campo-rot" id={rotId}>
        {rotulo}{obrigatorio ? <span className="ad-campo-obg" aria-hidden="true">*</span> : null}
      </span>
      <button
        type="button"
        id={id}
        ref={btnRef}
        className="ad-campo-ctl ad-campo-sel-btn"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? listaId : undefined}
        aria-activedescendant={aberto && activo >= 0 ? `${id}-op-${activo}` : undefined}
        aria-labelledby={`${rotId} ${id}`}
        aria-required={obrigatorio || undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={juntarIds(erro && erroId, ajuda && ajudaId)}
        disabled={desativado}
        onClick={() => (aberto ? fechar(false) : abrir())}
        onKeyDown={aoTeclar}
      >
        <span className="ad-campo-sel-val" data-vazio={opEscolhida ? undefined : "1"}>
          {opEscolhida ? opEscolhida.rotulo : marcador}
        </span>
        <span className="ad-campo-sel-seta" aria-hidden="true" />
      </button>

      {aberto ? (
        <ul className="ad-campo-sel-lista" id={listaId} role="listbox" ref={listaRef} aria-labelledby={rotId}>
          {opcoes.length === 0 ? (
            <li className="ad-campo-sel-vazio" role="option" aria-selected={false} aria-disabled>
              {textoVazio ?? marcador}
            </li>
          ) : (
            opcoes.map((o, i) => (
              <li
                key={o.valor}
                id={`${id}-op-${i}`}
                data-i={i}
                className="ad-campo-sel-op"
                role="option"
                aria-selected={o.valor === valor}
                aria-disabled={o.desativada || undefined}
                data-activo={i === activo ? "1" : undefined}
                onMouseEnter={() => !o.desativada && setActivo(i)}
                onMouseDown={(e) => e.preventDefault()}                          
                onClick={() => comprometer(i)}
              >
                <span className="ad-campo-sel-oprot">{o.rotulo}</span>
                {o.nota ? <span className="ad-campo-sel-nota">{o.nota}</span> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}

      <PeCampo ajuda={ajuda} ajudaId={ajudaId} erro={erro} erroId={erroId} />
    </div>
  );
}

                                                                               
                                                                     
                                                                                  

export type InterruptorProps = {
  rotulo: string;
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
                                                                 
  palavraLigado: string;
  palavraDesligado: string;
  id?: string;
  ajuda?: string;
  erro?: string;
  desativado?: boolean;
                                                                                          
  rotuloOculto?: boolean;
};

export function Interruptor({
  rotulo, ligado, aoMudar, palavraLigado, palavraDesligado, id: idProp,
  ajuda, erro, desativado, rotuloOculto,
}: InterruptorProps) {
  const auto = useId();
  const id = idProp ?? `${auto}int`;
  const rotId = `${id}-rot`;
  const ajudaId = `${id}-ajuda`;
  const erroId = `${id}-erro`;

  return (
    <div className="ad-campo ad-campo-int" data-erro={erro ? "1" : undefined}>
      <span className={rotuloOculto ? "ad-campo-sr" : "ad-campo-rot"} id={rotId}>{rotulo}</span>
      <button
        type="button"
        id={id}
        className="ad-campo-int-btn"
        role="switch"
        aria-checked={ligado}
        aria-labelledby={rotId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={juntarIds(erro && erroId, ajuda && ajudaId)}
        disabled={desativado}
        onClick={() => aoMudar(!ligado)}
      >
        <span className="ad-campo-int-tr" aria-hidden="true"><span className="ad-campo-int-bt" /></span>
        <span className="ad-campo-int-pal">{ligado ? palavraLigado : palavraDesligado}</span>
      </button>
      <PeCampo ajuda={ajuda} ajudaId={ajudaId} erro={erro} erroId={erroId} />
    </div>
  );
}

                                                                               
                                           
                                                                                  

export type OpcaoEscolha = { valor: string; rotulo: string; desativada?: boolean };

export type EscolhaProps = {
  rotulo: string;
  opcoes: OpcaoEscolha[];
  valor: string | null;
  aoMudar: (valor: string) => void;
  id?: string;
  ajuda?: string;
  erro?: string;
  desativado?: boolean;
  rotuloOculto?: boolean;
};

export function Escolha({
  rotulo, opcoes, valor, aoMudar, id: idProp, ajuda, erro, desativado, rotuloOculto,
}: EscolhaProps) {
  const auto = useId();
  const id = idProp ?? `${auto}esc`;
  const rotId = `${id}-rot`;
  const ajudaId = `${id}-ajuda`;
  const erroId = `${id}-erro`;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const idxEscolhido = opcoes.findIndex((o) => o.valor === valor);
  const primeiroNavegavel = opcoes.findIndex((o) => !o.desativada);
  const idxFoco = idxEscolhido >= 0 ? idxEscolhido : primeiroNavegavel;

  const mover = (de: number, passo: number) => {
    if (opcoes.length === 0) return;
    let i = de;
    for (let n = 0; n < opcoes.length; n++) {
      i += passo;
      if (i < 0) i = opcoes.length - 1;
      if (i > opcoes.length - 1) i = 0;
      if (!opcoes[i].desativada) break;
    }
    const op = opcoes[i];
    if (!op || op.desativada) return;
    aoMudar(op.valor);                                                      
    refs.current[i]?.focus();
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); mover(i, 1); return; }
    if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); mover(i, -1); return; }
    if (k === "Home") { e.preventDefault(); mover(-1, 1); return; }
    if (k === "End") { e.preventDefault(); mover(opcoes.length, -1); return; }
    if (k === " " || k === "Spacebar" || k === "Enter") {
      e.preventDefault();
      const op = opcoes[i];
      if (op && !op.desativada) aoMudar(op.valor);
    }
  };

  return (
    <div className="ad-campo ad-campo-esc" data-erro={erro ? "1" : undefined}>
      <span className={rotuloOculto ? "ad-campo-sr" : "ad-campo-rot"} id={rotId}>{rotulo}</span>
      <div
        className="ad-campo-esc-lista"
        id={id}
        role="radiogroup"
        aria-labelledby={rotId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={juntarIds(erro && erroId, ajuda && ajudaId)}
      >
        {opcoes.map((o, i) => {
          const inerte = desativado || o.desativada;
          return (
            <button
              key={o.valor}
              type="button"
              ref={(el) => { refs.current[i] = el; }}
              className="ad-campo-esc-pill"
              role="radio"
              aria-checked={o.valor === valor}
              aria-disabled={inerte || undefined}
              tabIndex={i === idxFoco ? 0 : -1}
              onClick={() => { if (!inerte) aoMudar(o.valor); }}
              onKeyDown={(e) => { if (!desativado) aoTeclar(e, i); }}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>
      <PeCampo ajuda={ajuda} ajudaId={ajudaId} erro={erro} erroId={erroId} />
    </div>
  );
}

                                                                               
                                
                                                                               
                                                                       
                                                                                  

export type EstadoUpload = "vazio" | "sobre" | "enviando" | "pronto" | "erro";

export type FicheiroInfo = { nome: string; bytes: number };

export type UploadTextos = {
                           
  convite: string;
                                           
  botao: string;
                                                       
  aReceber: string;
                                                             
  aEnviar: string;
                           
  concluido: string;
                                             
  remover: string;
                                                                      
  cancelar?: string;
  erroTipo: string;
  erroTamanho: string;
  erroVarios: string;
  erroEnvio: string;
};

export type UploadProps = {
  rotulo: string;
  textos: UploadTextos;
                                                               
  aoEnviar: (ficheiro: File, aoProgresso: (fraccao: number) => void) => Promise<void>;
  id?: string;
  ajuda?: string;
                                         
  aceita?: string;
  bytesMax?: number;
  desativado?: boolean;
  aoConcluir?: (ficheiro: File) => void;
  aoFalhar?: (motivo: unknown) => void;
  aoRemover?: () => void;
                                                               
  aoCancelar?: () => void;
                                                                                      
                                                                                   
  estado?: EstadoUpload;
  progresso?: number;
  ficheiro?: FicheiroInfo;
  erro?: string;
};

export function Upload({
  rotulo, textos, aoEnviar, id: idProp, ajuda, aceita, bytesMax, desativado,
  aoConcluir, aoFalhar, aoRemover, aoCancelar,
  estado: estadoProp, progresso: progressoProp, ficheiro: ficheiroProp, erro: erroProp,
}: UploadProps) {
  const auto = useId();
  const id = idProp ?? `${auto}up`;
  const rotId = `${id}-rot`;
  const ajudaId = `${id}-ajuda`;
  const erroId = `${id}-erro`;
  const estadoId = `${id}-estado`;

  const controlado = estadoProp != null;
  const [interno, setInterno] = useState<Exclude<EstadoUpload, "sobre">>("vazio");
  const [sobre, setSobre] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [info, setInfo] = useState<FicheiroInfo | null>(null);
  const [erroInterno, setErroInterno] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const contadorArrasto = useRef(0);
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);

  const estado: EstadoUpload = controlado ? (estadoProp as EstadoUpload) : sobre ? "sobre" : interno;
  const pct = Math.round(100 * Math.min(1, Math.max(0, controlado ? (progressoProp ?? 0) : progresso)));
  const ficheiro = controlado ? ficheiroProp ?? null : info;
  const erro = controlado ? erroProp ?? undefined : erroInterno ?? undefined;

  const receber = useCallback(async (lista: FileList | null) => {
    if (!lista || lista.length === 0 || desativado || controlado) return;
    if (lista.length > 1) { setInterno("erro"); setErroInterno(textos.erroVarios); return; }
    const f = lista[0];
    if (!ficheiroAceite(f, aceita)) { setInterno("erro"); setErroInterno(textos.erroTipo); setInfo({ nome: f.name, bytes: f.size }); return; }
    if (bytesMax != null && f.size > bytesMax) { setInterno("erro"); setErroInterno(textos.erroTamanho); setInfo({ nome: f.name, bytes: f.size }); return; }
    setInfo({ nome: f.name, bytes: f.size });
    setErroInterno(null);
    setProgresso(0);
    setInterno("enviando");
    try {
      await aoEnviar(f, (fr) => { if (vivo.current) setProgresso(fr); });
      if (!vivo.current) return;
      setProgresso(1);
      setInterno("pronto");
      aoConcluir?.(f);
    } catch (motivo) {
      if (!vivo.current) return;
      setInterno("erro");
      setErroInterno(textos.erroEnvio);
      aoFalhar?.(motivo);
    }
  }, [aceita, aoConcluir, aoEnviar, aoFalhar, bytesMax, controlado, desativado, textos]);

  const limpar = () => {
    if (!controlado) { setInterno("vazio"); setInfo(null); setProgresso(0); setErroInterno(null); }
    if (inputRef.current) inputRef.current.value = "";
    aoRemover?.();
  };

  const enviando = estado === "enviando";
  const inerte = desativado || enviando;

  return (
    <div className="ad-campo ad-campo-up" data-estado={estado} data-erro={erro ? "1" : undefined}>
      <span className="ad-campo-rot" id={rotId}>{rotulo}</span>

      <div
        className="ad-campo-up-zona"
        role="group"
        aria-labelledby={rotId}
        aria-describedby={juntarIds(estadoId, erro && erroId, ajuda && ajudaId)}
        onDragEnter={(e) => {
          if (inerte || controlado) return;
          e.preventDefault();
          contadorArrasto.current += 1;
          setSobre(true);
        }}
        onDragOver={(e) => { if (!inerte && !controlado) e.preventDefault(); }}
        onDragLeave={() => {
          if (inerte || controlado) return;
          contadorArrasto.current -= 1;
          if (contadorArrasto.current <= 0) { contadorArrasto.current = 0; setSobre(false); }
        }}
        onDrop={(e) => {
          if (inerte || controlado) return;
          e.preventDefault();
          contadorArrasto.current = 0;
          setSobre(false);
          void receber(e.dataTransfer.files);
        }}
      >
        <p className="ad-campo-up-txt" id={estadoId}>
          {estado === "sobre" ? textos.aReceber
            : estado === "enviando" ? textos.aEnviar
            : estado === "pronto" ? textos.concluido
            : estado === "erro" ? (erro ?? textos.erroEnvio)
            : textos.convite}
        </p>

        {ficheiro ? (
          <div className="ad-campo-up-fich">
            <span className="ad-campo-up-nome">{ficheiro.nome}</span>
            <span className="ad-campo-up-tam">{formatarBytes(ficheiro.bytes)}</span>
            {estado === "enviando" ? null : (
              <button type="button" className="ad-campo-up-x" onClick={limpar} aria-label={textos.remover}>
                <i aria-hidden="true">+</i>
              </button>
            )}
          </div>
        ) : null}

        {estado === "enviando" ? (
          <div className="ad-campo-up-linha">
            <div
              className="ad-campo-up-barra"
              role="progressbar"
              aria-label={textos.aEnviar}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <i style={{ transform: `scaleX(${pct / 100})` } as CSSProperties} />
            </div>
            <span className="ad-campo-up-pct" aria-hidden="true">{pct}%</span>
            {aoCancelar && textos.cancelar ? (
              <button type="button" className="ad-campo-up-acao" onClick={aoCancelar}>{textos.cancelar}</button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            id={id}
            className="ad-campo-up-acao"
            disabled={inerte}
            onClick={() => inputRef.current?.click()}
          >
            {textos.botao}
          </button>
        )}

        <input
          ref={inputRef}
          className="ad-campo-sr"
          type="file"
          tabIndex={-1}
          aria-hidden="true"
          accept={aceita}
          disabled={inerte}
          onChange={(e) => void receber(e.target.files)}
        />
      </div>

      <PeCampo ajuda={ajuda} ajudaId={ajudaId} erro={erro} erroId={erroId} />
    </div>
  );
}

                                                                               
                                                    
                                                                                 
                                                                               
                                                                                 
                                                                            
                                                                                  

                                                                 

const ROT_CLIENTE: L5 = { fr: "Nom du client", en: "Client name", pt: "Nome do cliente", de: "Kundenname", it: "Nome del cliente" };
const AJUDA_CLIENTE: L5 = {
  fr: "Nom tel qu'il apparaît sur le contrat",
  en: "Name as it appears on the contract",
  pt: "Nome tal como aparece no contrato",
  de: "Name wie im Vertrag aufgeführt",
  it: "Nome come appare nel contratto",
};
const ERRO_MORADA: L5 = { fr: "Adresse incomplète", en: "Incomplete address", pt: "Morada incompleta", de: "Unvollständige Adresse", it: "Indirizzo incompleto" };

const ROT_TITULO: L5 = { fr: "Titre de la fiche", en: "Record title", pt: "Título da ficha", de: "Titel des Eintrags", it: "Titolo della scheda" };
const VAL_IDENTIDADE: L5 = { fr: "Identité visuelle", en: "Visual identity", pt: "Identidade visual", de: "Visuelle Identität", it: "Identità visiva" };
const VAL_IDENTIDADE_LONGA: L5 = {
  fr: "Identité visuelle et signalétique complète du bâtiment",
  en: "Visual identity and complete signage for the building",
  pt: "Identidade visual e sinalética completa do edifício",
  de: "Visuelle Identität und komplette Beschilderung des Gebäudes",
  it: "Identità visiva e segnaletica completa dell'edificio",
};
const ERRO_TITULO_LONGO: L5 = { fr: "Titre trop long", en: "Title too long", pt: "Título demasiado longo", de: "Titel zu lang", it: "Titolo troppo lungo" };

const ROT_PASSE: L5 = { fr: "Mot de passe", en: "Password", pt: "Palavra-passe", de: "Passwort", it: "Password" };

const ROT_NOTA: L5 = { fr: "Note interne", en: "Internal note", pt: "Nota interna", de: "Interne Notiz", it: "Nota interna" };
const MAR_NOTA: L5 = { fr: "Contexte du dossier", en: "Background on the file", pt: "Contexto do processo", de: "Kontext des Dossiers", it: "Contesto della pratica" };
const NOTA_TRES_LINHAS: L5 = {
  fr: "Premier contact par téléphone.\nBudget à confirmer avant la fin du mois.\nDeux interlocuteurs, décision collégiale.",
  en: "First contact by telephone.\nBudget to be confirmed before the end of the month.\nTwo contacts, joint decision.",
  pt: "Primeiro contacto por telefone.\nOrçamento a confirmar antes do fim do mês.\nDois interlocutores, decisão conjunta.",
  de: "Erstkontakt per Telefon.\nBudget vor Monatsende zu bestätigen.\nZwei Ansprechpartner, gemeinsame Entscheidung.",
  it: "Primo contatto telefonico.\nBudget da confermare entro fine mese.\nDue interlocutori, decisione collegiale.",
};
const PAL_LINHA: L5 = { fr: "Ligne", en: "Line", pt: "Linha", de: "Zeile", it: "Riga" };
const seisLinhas = (l: AbilLang) => [1, 2, 3, 4, 5, 6].map((n) => `${t5(PAL_LINHA, l)} ${n}`).join("\n");
const VAL_CURTO: L5 = { fr: "Trop court", en: "Too short", pt: "Demasiado curto", de: "Zu kurz", it: "Troppo corto" };
const ERRO_NOTA_CURTA: L5 = {
  fr: "Note trop courte pour le dossier",
  en: "Note too short for the file",
  pt: "Nota demasiado curta para o processo",
  de: "Notiz zu kurz für das Dossier",
  it: "Nota troppo corta per la pratica",
};
const VAL_ARQUIVADO: L5 = { fr: "Dossier archivé", en: "Archived file", pt: "Processo arquivado", de: "Archiviertes Dossier", it: "Pratica archiviata" };

const ROT_LINGUA: L5 = { fr: "Langue de la fiche", en: "Record language", pt: "Língua da ficha", de: "Sprache des Eintrags", it: "Lingua della scheda" };
const MAR_ESCOLHER: L5 = { fr: "Choisir", en: "Choose", pt: "Escolher", de: "Auswählen", it: "Scegli" };
const VAZIO_LINGUA: L5 = {
  fr: "Aucune langue disponible",
  en: "No language available",
  pt: "Nenhuma língua disponível",
  de: "Keine Sprache verfügbar",
  it: "Nessuna lingua disponibile",
};
const ERRO_LINGUA: L5 = { fr: "Choisissez une langue", en: "Choose a language", pt: "Escolha uma língua", de: "Wählen Sie eine Sprache", it: "Scegliere una lingua" };
const NOTA_EM_BREVE: L5 = { fr: "bientôt", en: "soon", pt: "em breve", de: "bald", it: "presto" };

const ROT_PUBLICADA: L5 = { fr: "Fiche publiée", en: "Record published", pt: "Ficha publicada", de: "Eintrag veröffentlicht", it: "Scheda pubblicata" };
const PAL_PUBLICADA: L5 = { fr: "Publiée", en: "Published", pt: "Publicada", de: "Veröffentlicht", it: "Pubblicata" };
const PAL_RASCUNHO: L5 = { fr: "Brouillon", en: "Draft", pt: "Rascunho", de: "Entwurf", it: "Bozza" };
const AJUDA_PUBLICAR: L5 = {
  fr: "Visible sur le site public dès l'enregistrement",
  en: "Visible on the public site as soon as it is saved",
  pt: "Visível no site público assim que for guardada",
  de: "Nach dem Speichern sofort auf der öffentlichen Website sichtbar",
  it: "Visibile sul sito pubblico non appena salvata",
};
const ERRO_PUBLICAR: L5 = {
  fr: "Impossible de publier sans image de couverture",
  en: "Cannot publish without a cover image",
  pt: "Não é possível publicar sem imagem de capa",
  de: "Ohne Titelbild kann nicht veröffentlicht werden",
  it: "Impossibile pubblicare senza immagine di copertina",
};

const ROT_TIPO: L5 = { fr: "Type de projet", en: "Project type", pt: "Tipo de projeto", de: "Projektart", it: "Tipo di progetto" };
const TIPO_WEB: L5 = { fr: "Web", en: "Web", pt: "Web", de: "Web", it: "Web" };
const TIPO_PRINT: L5 = { fr: "Print", en: "Print", pt: "Impressão", de: "Print", it: "Stampa" };
const TIPO_FILME: L5 = { fr: "Film", en: "Film", pt: "Filme", de: "Film", it: "Film" };
const TIPO_SOCIAL: L5 = { fr: "Social", en: "Social", pt: "Social", de: "Social", it: "Social" };
const ERRO_TIPO_ESCOLHA: L5 = { fr: "Choisissez un type", en: "Choose a type", pt: "Escolha um tipo", de: "Wählen Sie eine Art", it: "Scegliere un tipo" };

const ROT_ANEXO: L5 = { fr: "Pièce jointe", en: "Attachment", pt: "Anexo", de: "Anhang", it: "Allegato" };
const AJUDA_ANEXO: L5 = {
  fr: "PDF ou image, 8 MB au maximum",
  en: "PDF or image, 8 MB maximum",
  pt: "PDF ou imagem, 8 MB no máximo",
  de: "PDF oder Bild, höchstens 8 MB",
  it: "PDF o immagine, 8 MB al massimo",
};
const FICH_BRIEFING: L5 = {
  fr: "brief-abil.pdf",
  en: "brief-abil.pdf",
  pt: "briefing-abil.pdf",
  de: "briefing-abil.pdf",
  it: "brief-abil.pdf",
};
const FICH_MONTAGEM: L5 = {
  fr: "montage-final.mov",
  en: "final-edit.mov",
  pt: "montagem-final.mov",
  de: "endmontage.mov",
  it: "montaggio-finale.mov",
};

const textosUp = (l: AbilLang): UploadTextos => ({
  convite: t5({ fr: "Glissez un fichier ici", en: "Drag a file here", pt: "Arraste um ficheiro para aqui", de: "Datei hierher ziehen", it: "Trascina qui un file" }, l),
  botao: t5({ fr: "Choisir un fichier", en: "Choose a file", pt: "Escolher ficheiro", de: "Datei auswählen", it: "Scegli un file" }, l),
  aReceber: t5({ fr: "Relâchez pour déposer", en: "Release to drop", pt: "Largue para colocar", de: "Zum Ablegen loslassen", it: "Rilascia per depositare" }, l),
  aEnviar: t5({ fr: "Envoi en cours", en: "Uploading", pt: "A enviar", de: "Wird hochgeladen", it: "Invio in corso" }, l),
  concluido: t5({ fr: "Fichier envoyé", en: "File uploaded", pt: "Ficheiro enviado", de: "Datei hochgeladen", it: "File inviato" }, l),
  remover: t5({ fr: "Retirer le fichier", en: "Remove the file", pt: "Remover o ficheiro", de: "Datei entfernen", it: "Rimuovi il file" }, l),
  cancelar: t5({ fr: "Annuler", en: "Cancel", pt: "Cancelar", de: "Abbrechen", it: "Annulla" }, l),
  erroTipo: t5({ fr: "Format non accepté", en: "Format not accepted", pt: "Formato não aceite", de: "Format nicht zulässig", it: "Formato non accettato" }, l),
  erroTamanho: t5({ fr: "Fichier trop lourd", en: "File too large", pt: "Ficheiro demasiado pesado", de: "Datei zu groß", it: "File troppo pesante" }, l),
  erroVarios: t5({ fr: "Un fichier à la fois", en: "One file at a time", pt: "Um ficheiro de cada vez", de: "Nur eine Datei auf einmal", it: "Un file alla volta" }, l),
  erroEnvio: t5({ fr: "L'envoi a échoué", en: "The upload failed", pt: "O envio falhou", de: "Der Upload ist fehlgeschlagen", it: "L'invio non è riuscito" }, l),
});

                                                                                
                                                                                  
                           
const OPCOES_LINGUA: OpcaoSelecao[] = [
  { valor: "fr", rotulo: "Français", nota: "01" },
  { valor: "en", rotulo: "English", nota: "02" },
  { valor: "pt", rotulo: "Português", nota: "03" },
  { valor: "de", rotulo: "Deutsch", nota: "04" },
  { valor: "it", rotulo: "Italiano", nota: "05" },
];

                                                 

function AmCampo(p: Partial<CampoProps> & { lang: AbilLang; inicial?: string }) {
  const { lang, inicial, ...resto } = p;
  const [v, setV] = useState(inicial ?? "");
                                                                         
  return <Campo rotulo={t5(ROT_CLIENTE, lang)} valor={v} aoMudar={setV} marcador="Client exemple" {...resto} />;
}

function AmArea(p: Partial<AreaTextoProps> & { lang: AbilLang; inicial?: string }) {
  const { lang, inicial, ...resto } = p;
  const [v, setV] = useState(inicial ?? "");
  return <AreaTexto rotulo={t5(ROT_NOTA, lang)} valor={v} aoMudar={setV} marcador={t5(MAR_NOTA, lang)} {...resto} />;
}

function AmSelecao(p: Partial<SelecaoProps> & { lang: AbilLang; inicial?: string | null }) {
  const { lang, inicial, ...resto } = p;
  const [v, setV] = useState<string | null>(inicial ?? null);
  return (
    <Selecao
      rotulo={t5(ROT_LINGUA, lang)} opcoes={OPCOES_LINGUA} valor={v} aoMudar={setV}
      marcador={t5(MAR_ESCOLHER, lang)} {...resto}
    />
  );
}

function AmInterruptor(p: Partial<InterruptorProps> & { lang: AbilLang; inicial?: boolean }) {
  const { lang, inicial, ...resto } = p;
  const [v, setV] = useState(!!inicial);
  return (
    <Interruptor
      rotulo={t5(ROT_PUBLICADA, lang)} ligado={v} aoMudar={setV}
      palavraLigado={t5(PAL_PUBLICADA, lang)} palavraDesligado={t5(PAL_RASCUNHO, lang)} {...resto}
    />
  );
}

function AmEscolha(p: Partial<EscolhaProps> & { lang: AbilLang; inicial?: string | null }) {
  const { lang, inicial, ...resto } = p;
  const [v, setV] = useState<string | null>(inicial ?? "web");
  const opcoes: OpcaoEscolha[] = [
    { valor: "web", rotulo: t5(TIPO_WEB, lang) },
    { valor: "print", rotulo: t5(TIPO_PRINT, lang) },
    { valor: "film", rotulo: t5(TIPO_FILME, lang) },
    { valor: "social", rotulo: t5(TIPO_SOCIAL, lang) },
  ];
  return <Escolha rotulo={t5(ROT_TIPO, lang)} opcoes={opcoes} valor={v} aoMudar={setV} {...resto} />;
}

                                                                                       
function AmUploadReal({ lang }: { lang: AbilLang }) {
  const enviar = (_f: File, aoProgresso: (fr: number) => void) =>
    new Promise<void>((resolve) => {
      let p = 0;
      const t = window.setInterval(() => {
        p += 0.04;
        aoProgresso(Math.min(1, p));
        if (p >= 1) { window.clearInterval(t); resolve(); }
      }, 60);
    });
  return (
    <Upload
      rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={enviar}
      aceita=".pdf,image/*" bytesMax={8_000_000} ajuda={t5(AJUDA_ANEXO, lang)}
    />
  );
}

const SEM_ENVIO = () => Promise.resolve();

export type Amostra = { nome: L5; nota: L5; exemplo: (lang: AbilLang) => ReactNode };

// eslint-disable-next-line react-refresh/only-export-components
export const AMOSTRAS: Amostra[] = [
                    
  {
    nome: { fr: "Champ · repos", en: "Field · resting", pt: "Campo · repouso", de: "Feld · Ruhezustand", it: "Campo · riposo" },
    nota: {
      fr: "Étiquette en eyebrow au-dessus, filet hairline Gris Léman, fond Blanc Alpin posé sur la toile.",
      en: "Label as an eyebrow above, hairline frame in Gris Léman, Blanc Alpin fill sitting on the canvas.",
      pt: "Rótulo em eyebrow por cima, moldura hairline Gris Léman, fundo Blanc Alpin sobre a tela.",
      de: "Label als Eyebrow darüber, Hairline-Rahmen in Gris Léman, Füllung in Blanc Alpin auf der Fläche.",
      it: "Etichetta in eyebrow sopra, cornice hairline Gris Léman, fondo Blanc Alpin posato sulla tela.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} />,
  },
  {
    nome: { fr: "Champ · rempli avec aide", en: "Field · filled with help text", pt: "Campo · preenchido com ajuda", de: "Feld · ausgefüllt mit Hilfetext", it: "Campo · compilato con aiuto" },
    nota: {
      fr: "L'aide vit en dessous, en Gris Rhône, et ne porte jamais seule une valeur essentielle.",
      en: "The help text lives underneath, in Gris Rhône, and never carries an essential value on its own.",
      pt: "A ajuda vive por baixo, em Gris Rhône, e nunca carrega sozinha um valor essencial.",
      de: "Der Hilfetext steht darunter, in Gris Rhône, und trägt nie allein eine wesentliche Information.",
      it: "L'aiuto vive sotto, in Gris Rhône, e non porta mai da solo un'informazione essenziale.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} inicial="Atelier Exemple" ajuda={t5(AJUDA_CLIENTE, lang)} />,
  },
  {
    nome: { fr: "Champ · obligatoire", en: "Field · required", pt: "Campo · obrigatório", de: "Feld · Pflichtfeld", it: "Campo · obbligatorio" },
    nota: {
      fr: "Astérisque en Noir (décoratif, aria-hidden) plus aria-required. Le lecteur d'écran ne dépend pas du symbole.",
      en: "Asterisk in Noir (decorative, aria-hidden) plus aria-required. The screen reader does not depend on the symbol.",
      pt: "Asterisco em Noir (decorativo, aria-hidden) mais aria-required. O leitor de ecrã não depende do símbolo.",
      de: "Sternchen in Noir (dekorativ, aria-hidden) plus aria-required. Der Screenreader hängt nicht am Symbol.",
      it: "Asterisco in Noir (decorativo, aria-hidden) più aria-required. Lo screen reader non dipende dal simbolo.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} inicial="" obrigatorio />,
  },
  {
    nome: { fr: "Champ · erreur", en: "Field · error", pt: "Campo · erro", de: "Feld · Fehler", it: "Campo · errore" },
    nota: {
      fr: "Filet Alerte Violette, point de 6px et message en Noir. Le Violette signale, le texte se lit.",
      en: "Alerte Violette frame, a 6px dot and the message in Noir. The Violette signals, the text is what reads.",
      pt: "Moldura Alerte Violette, ponto de 6px e mensagem em Noir. O Violette assinala, o texto lê-se.",
      de: "Rahmen in Alerte Violette, Punkt von 6px und Meldung in Noir. Das Violette signalisiert, gelesen wird der Text.",
      it: "Cornice Alerte Violette, punto da 6px e messaggio in Noir. Il Violette segnala, il testo si legge.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} inicial="atelier" erro={t5(ERRO_MORADA, lang)} />,
  },
  {
    nome: { fr: "Champ · compteur", en: "Field · counter", pt: "Campo · contador", de: "Feld · Zeichenzähler", it: "Campo · contatore" },
    nota: {
      fr: "Compteur en micro, chiffres tabulaires. Il ne parle au lecteur d'écran que sur les dix derniers pour cent.",
      en: "Counter in micro type, tabular figures. It only speaks to the screen reader over the last ten per cent.",
      pt: "Contador em micro, numerais tabulares. Só fala ao leitor de ecrã nos últimos dez por cento.",
      de: "Zähler in Mikroschrift, Tabellenziffern. Er spricht den Screenreader erst auf den letzten zehn Prozent an.",
      it: "Contatore in micro, cifre tabulari. Parla allo screen reader solo negli ultimi dieci per cento.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} rotulo={t5(ROT_TITULO, lang)} inicial={t5(VAL_IDENTIDADE, lang)} maximo={60} />,
  },
  {
    nome: { fr: "Champ · compteur dépassé", en: "Field · counter over the limit", pt: "Campo · contador excedido", de: "Feld · Zähler überschritten", it: "Campo · contatore superato" },
    nota: {
      fr: "Passer le plafond est un état d'erreur entier : filet Violette et compteur en Noir.",
      en: "Going over the ceiling is a full error state: Violette frame and counter in Noir.",
      pt: "Passar do teto é um estado de erro por inteiro: moldura Violette e contador em Noir.",
      de: "Das Überschreiten der Obergrenze ist ein vollwertiger Fehlerzustand: Rahmen in Violette und Zähler in Noir.",
      it: "Superare il tetto è uno stato di errore a tutti gli effetti: cornice Violette e contatore in Noir.",
    },
    exemplo: (lang) => (
      <AmCampo key={lang} lang={lang} rotulo={t5(ROT_TITULO, lang)} inicial={t5(VAL_IDENTIDADE_LONGA, lang)} maximo={40} erro={t5(ERRO_TITULO_LONGO, lang)} />
    ),
  },
  {
    nome: { fr: "Champ · lecture seule", en: "Field · read only", pt: "Campo · só leitura", de: "Feld · schreibgeschützt", it: "Campo · sola lettura" },
    nota: {
      fr: "Le fond recule vers la toile : il reste lisible et il reste copiable.",
      en: "The fill recedes to the canvas: it stays readable and it stays copyable.",
      pt: "O fundo recua para a tela: continua legível e continua a poder ser copiado.",
      de: "Der Hintergrund tritt zur Fläche zurück: er bleibt lesbar und bleibt kopierbar.",
      it: "Il fondo arretra verso la tela: resta leggibile e resta copiabile.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} inicial="ABiL MEDiAS SA" soLeitura />,
  },
  {
    nome: { fr: "Champ · désactivé", en: "Field · disabled", pt: "Campo · desativado", de: "Feld · deaktiviert", it: "Campo · disattivato" },
    nota: {
      fr: "Fond toile et texte Gris Rhône. Le texte désactivé est dispensé de contraste, et c'est pour cela qu'ici seulement le Rhône passe en solo.",
      en: "Canvas fill and Gris Rhône text. Disabled text is exempt from contrast, which is why the Rhône is acceptable on its own only here.",
      pt: "Fundo tela e texto Gris Rhône. Texto desativado está isento de contraste, e é por isso que só aqui o Rhône é aceitável a solo.",
      de: "Fläche als Hintergrund und Text in Gris Rhône. Deaktivierter Text ist von der Kontrastpflicht befreit, deshalb ist das Rhône nur hier allein zulässig.",
      it: "Fondo tela e testo in Gris Rhône. Il testo disattivato è esente dal contrasto, ed è per questo che solo qui il Rhône è accettabile da solo.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} inicial="ABiL MEDiAS SA" desativado />,
  },
  {
    nome: { fr: "Champ · mot de passe", en: "Field · password", pt: "Campo · palavra-passe", de: "Feld · Passwort", it: "Campo · password" },
    nota: {
      fr: "Même primitive, type changé. On ne crée pas un composant pour un attribut.",
      en: "Same primitive, type swapped. There is no new component for one attribute.",
      pt: "Mesmo primitivo, tipo trocado. Não há componente novo para um atributo.",
      de: "Dasselbe Primitiv, nur ein anderer Typ. Für ein Attribut entsteht kein neues Bauteil.",
      it: "Stesso primitivo, tipo cambiato. Non nasce un componente nuovo per un attributo.",
    },
    exemplo: (lang) => <AmCampo key={lang} lang={lang} rotulo={t5(ROT_PASSE, lang)} tipo="password" inicial="" autoComplete="current-password" />,
  },

                        
  {
    nome: { fr: "Zone de texte · repos", en: "Text area · resting", pt: "Área de texto · repouso", de: "Textfeld · Ruhezustand", it: "Area di testo · riposo" },
    nota: {
      fr: "Elle naît à 3 lignes et grandit à mesure qu'on écrit. La hauteur est écrite, jamais animée.",
      en: "It starts at 3 lines and grows as you type. The height is written, never animated.",
      pt: "Nasce com 3 linhas e cresce à medida que se escreve. A altura é escrita, nunca animada.",
      de: "Es beginnt mit 3 Zeilen und wächst beim Schreiben mit. Die Höhe wird gesetzt, nie animiert.",
      it: "Nasce con 3 righe e cresce mentre si scrive. L'altezza si scrive, non si anima mai.",
    },
    exemplo: (lang) => <AmArea key={lang} lang={lang} />,
  },
  {
    nome: { fr: "Zone de texte · agrandie", en: "Text area · grown", pt: "Área de texto · crescida", de: "Textfeld · gewachsen", it: "Area di testo · cresciuta" },
    nota: {
      fr: "Elle grandit jusqu'au plafond de linhasMax et ne défile à l'intérieur qu'ensuite.",
      en: "It grows up to the linhasMax ceiling and only then starts scrolling inside.",
      pt: "Cresce até ao teto de linhasMax e só depois passa a rolar por dentro.",
      de: "Es wächst bis zur Obergrenze linhasMax und beginnt erst danach, innen zu scrollen.",
      it: "Cresce fino al tetto di linhasMax e solo dopo inizia a scorrere all'interno.",
    },
    exemplo: (lang) => <AmArea key={lang} lang={lang} inicial={t5(NOTA_TRES_LINHAS, lang)} />,
  },
  {
    nome: { fr: "Zone de texte · au plafond", en: "Text area · at the ceiling", pt: "Área de texto · no teto", de: "Textfeld · an der Obergrenze", it: "Area di testo · al tetto" },
    nota: {
      fr: "Plafond abaissé à 4 lignes pour qu'on voie le moment où elle cesse de grandir.",
      en: "Ceiling lowered to 4 lines so the moment it stops growing is visible.",
      pt: "Teto baixado a 4 linhas para se ver o momento em que deixa de crescer.",
      de: "Obergrenze auf 4 Zeilen gesenkt, damit der Moment sichtbar wird, in dem es aufhört zu wachsen.",
      it: "Tetto abbassato a 4 righe per vedere il momento in cui smette di crescere.",
    },
    exemplo: (lang) => <AmArea key={lang} lang={lang} linhasMax={4} inicial={seisLinhas(lang)} />,
  },
  {
    nome: { fr: "Zone de texte · erreur avec compteur", en: "Text area · error with counter", pt: "Área de texto · erro com contador", de: "Textfeld · Fehler mit Zähler", it: "Area di testo · errore con contatore" },
    nota: {
      fr: "Les deux signaux cohabitent : message à gauche, compteur à droite.",
      en: "The two signals coexist: message on the left, counter on the right.",
      pt: "Os dois sinais convivem: mensagem à esquerda, contador à direita.",
      de: "Die beiden Signale bestehen nebeneinander: Meldung links, Zähler rechts.",
      it: "I due segnali convivono: messaggio a sinistra, contatore a destra.",
    },
    exemplo: (lang) => <AmArea key={lang} lang={lang} inicial={t5(VAL_CURTO, lang)} maximo={200} erro={t5(ERRO_NOTA_CURTA, lang)} />,
  },
  {
    nome: { fr: "Zone de texte · désactivée", en: "Text area · disabled", pt: "Área de texto · desativada", de: "Textfeld · deaktiviert", it: "Area di testo · disattivata" },
    nota: {
      fr: "Même règle que le Champ.",
      en: "Same rule as the Field.",
      pt: "Mesma regra do Campo.",
      de: "Dieselbe Regel wie beim Feld.",
      it: "Stessa regola del Campo.",
    },
    exemplo: (lang) => <AmArea key={lang} lang={lang} inicial={t5(VAL_ARQUIVADO, lang)} desativado />,
  },

                      
  {
    nome: { fr: "Sélection · vide", en: "Select · empty", pt: "Seleção · vazia", de: "Auswahl · leer", it: "Selezione · vuota" },
    nota: {
      fr: "Déclencheur avec le marqueur en Gris Rhône et une flèche faite de deux bords de 1px, pas d'une icône.",
      en: "Trigger with the placeholder in Gris Rhône and an arrow made of two 1px borders, not of an icon.",
      pt: "Gatilho com marcador em Gris Rhône e seta feita de duas bordas de 1px, não de um ícone.",
      de: "Auslöser mit Platzhalter in Gris Rhône und einem Pfeil aus zwei 1px-Kanten, nicht aus einem Icon.",
      it: "Attivatore con segnaposto in Gris Rhône e freccia fatta di due bordi da 1px, non di un'icona.",
    },
    exemplo: (lang) => <AmSelecao key={lang} lang={lang} />,
  },
  {
    nome: { fr: "Sélection · avec valeur", en: "Select · with a value", pt: "Seleção · com valor", de: "Auswahl · mit Wert", it: "Selezione · con valore" },
    nota: {
      fr: "Le déclencheur montre l'étiquette choisie, jamais la valeur technique.",
      en: "The trigger shows the chosen label, never the technical value.",
      pt: "O gatilho mostra o rótulo escolhido, nunca o valor técnico.",
      de: "Der Auslöser zeigt das gewählte Label, nie den technischen Wert.",
      it: "L'attivatore mostra l'etichetta scelta, mai il valore tecnico.",
    },
    exemplo: (lang) => <AmSelecao key={lang} lang={lang} inicial="fr" />,
  },
  {
    nome: { fr: "Sélection · ouverte", en: "Select · open", pt: "Seleção · aberta", de: "Auswahl · geöffnet", it: "Selezione · aperta" },
    nota: {
      fr: "L'élément actif est marqué par un filet vertical qui balaie ; l'élément choisi, par un souligné hairline. Deux états, deux signaux, zéro couleur de fond.",
      en: "The active item is marked by a vertical rule that sweeps in; the chosen item by a hairline underline. Two states, two signals, zero background colour.",
      pt: "Item ativo marcado por filete vertical que varre; item escolhido marcado por sublinhado hairline. Dois estados, dois sinais, zero cor de fundo.",
      de: "Das aktive Element markiert ein vertikaler Strich, der einfährt; das gewählte Element ein Hairline-Unterstrich. Zwei Zustände, zwei Signale, keine Hintergrundfarbe.",
      it: "L'elemento attivo è segnato da un filetto verticale che entra; quello scelto da una sottolineatura hairline. Due stati, due segnali, zero colore di fondo.",
    },
    exemplo: (lang) => <AmSelecao key={lang} lang={lang} inicial="pt" abertoInicial />,
  },
  {
    nome: { fr: "Sélection · avec option désactivée", en: "Select · with a disabled option", pt: "Seleção · com opção desativada", de: "Auswahl · mit deaktivierter Option", it: "Selezione · con opzione disattivata" },
    nota: {
      fr: "Option inerte en Gris Rhône, sautée par les flèches, Home et End.",
      en: "Inert option in Gris Rhône, skipped by the arrow keys, Home and End.",
      pt: "Opção inerte em Gris Rhône e saltada pelas setas, Home e End.",
      de: "Inaktive Option in Gris Rhône, von Pfeiltasten, Home und End übersprungen.",
      it: "Opzione inerte in Gris Rhône, saltata da frecce, Home e End.",
    },
    exemplo: (lang) => (
      <AmSelecao
        key={lang} lang={lang} inicial="en" abertoInicial
        opcoes={[
          ...OPCOES_LINGUA.slice(0, 2),
          { valor: "de", rotulo: "Deutsch", nota: t5(NOTA_EM_BREVE, lang), desativada: true },
          ...OPCOES_LINGUA.slice(3),
        ]}
      />
    ),
  },
  {
    nome: { fr: "Sélection · liste vide", en: "Select · empty list", pt: "Seleção · lista vazia", de: "Auswahl · leere Liste", it: "Selezione · elenco vuoto" },
    nota: {
      fr: "Le vide est un état dessiné, pas une liste blanche.",
      en: "Emptiness is a designed state, not a blank list.",
      pt: "O vazio é um estado desenhado, não uma lista em branco.",
      de: "Die Leere ist ein gestalteter Zustand, keine weiße Liste.",
      it: "Il vuoto è uno stato disegnato, non un elenco in bianco.",
    },
    exemplo: (lang) => <AmSelecao key={lang} lang={lang} opcoes={[]} abertoInicial textoVazio={t5(VAZIO_LINGUA, lang)} />,
  },
  {
    nome: { fr: "Sélection · erreur", en: "Select · error", pt: "Seleção · erro", de: "Auswahl · Fehler", it: "Selezione · errore" },
    nota: {
      fr: "Même grammaire que le Champ : filet Violette, point et message en Noir.",
      en: "Same grammar as the Field: Violette frame, dot and message in Noir.",
      pt: "Mesma gramática do Campo: moldura Violette, ponto e mensagem em Noir.",
      de: "Dieselbe Grammatik wie beim Feld: Rahmen in Violette, Punkt und Meldung in Noir.",
      it: "Stessa grammatica del Campo: cornice Violette, punto e messaggio in Noir.",
    },
    exemplo: (lang) => <AmSelecao key={lang} lang={lang} erro={t5(ERRO_LINGUA, lang)} obrigatorio />,
  },
  {
    nome: { fr: "Sélection · désactivée", en: "Select · disabled", pt: "Seleção · desativada", de: "Auswahl · deaktiviert", it: "Selezione · disattivata" },
    nota: {
      fr: "Elle n'ouvre pas, ne prend pas le focus à la souris et continue d'annoncer son étiquette.",
      en: "It does not open, does not take focus from the mouse and still announces its label.",
      pt: "Não abre, não recebe foco de rato e continua a anunciar o rótulo.",
      de: "Sie öffnet nicht, nimmt keinen Mausfokus an und kündigt weiterhin ihr Label an.",
      it: "Non si apre, non prende il focus col mouse e continua ad annunciare la sua etichetta.",
    },
    exemplo: (lang) => <AmSelecao key={lang} lang={lang} inicial="it" desativado />,
  },

                          
  {
    nome: { fr: "Interrupteur · éteint", en: "Toggle · off", pt: "Interruptor · desligado", de: "Schalter · aus", it: "Interruttore · spento" },
    nota: {
      fr: "Le mot à côté dit l'état. La position seule ne suffit jamais.",
      en: "The word beside it states the state. Position alone is never enough.",
      pt: "A palavra ao lado diz o estado. A posição sozinha nunca chega.",
      de: "Das Wort daneben nennt den Zustand. Die Stellung allein genügt nie.",
      it: "La parola accanto dice lo stato. La posizione da sola non basta mai.",
    },
    exemplo: (lang) => <AmInterruptor key={lang} lang={lang} />,
  },
  {
    nome: { fr: "Interrupteur · allumé", en: "Toggle · on", pt: "Interruptor · ligado", de: "Schalter · ein", it: "Interruttore · acceso" },
    nota: {
      fr: "Rail en Vert Citron parce que l'interrupteur AGIT. Le bouton se déplace par transform.",
      en: "Track in Vert Citron because the toggle ACTS. The knob moves by transform.",
      pt: "Trilho em Vert Citron porque o interruptor AGE. O botão mexe-se por transform.",
      de: "Schiene in Vert Citron, weil der Schalter HANDELT. Der Knopf bewegt sich per transform.",
      it: "Binario in Vert Citron perché l'interruttore AGISCE. Il pomello si sposta con transform.",
    },
    exemplo: (lang) => <AmInterruptor key={lang} lang={lang} inicial />,
  },
  {
    nome: { fr: "Interrupteur · avec aide", en: "Toggle · with help text", pt: "Interruptor · com ajuda", de: "Schalter · mit Hilfetext", it: "Interruttore · con aiuto" },
    nota: {
      fr: "L'aide explique la conséquence, ce qui manque à un interrupteur seul.",
      en: "The help text explains the consequence, which is what a lone toggle lacks.",
      pt: "A ajuda explica a consequência, que é o que falta a um interruptor solto.",
      de: "Der Hilfetext erklärt die Folge, und genau die fehlt einem Schalter für sich allein.",
      it: "L'aiuto spiega la conseguenza, che è ciò che manca a un interruttore da solo.",
    },
    exemplo: (lang) => <AmInterruptor key={lang} lang={lang} inicial ajuda={t5(AJUDA_PUBLICAR, lang)} />,
  },
  {
    nome: { fr: "Interrupteur · erreur", en: "Toggle · error", pt: "Interruptor · erro", de: "Schalter · Fehler", it: "Interruttore · errore" },
    nota: {
      fr: "Le contour du rail passe en Violette et le message se pose en dessous.",
      en: "The track outline turns Violette and the message sits underneath.",
      pt: "Moldura do trilho em Violette e a mensagem por baixo.",
      de: "Der Rahmen der Schiene wechselt zu Violette und die Meldung steht darunter.",
      it: "La cornice del binario passa al Violette e il messaggio si posa sotto.",
    },
    exemplo: (lang) => <AmInterruptor key={lang} lang={lang} erro={t5(ERRO_PUBLICAR, lang)} />,
  },
  {
    nome: { fr: "Interrupteur · désactivé", en: "Toggle · disabled", pt: "Interruptor · desativado", de: "Schalter · deaktiviert", it: "Interruttore · disattivato" },
    nota: {
      fr: "Le désactivé l'emporte toujours sur l'allumé : rail sur la toile, bouton en Gris Rhône.",
      en: "Disabled always beats on: track on the canvas, knob in Gris Rhône.",
      pt: "O desativado ganha sempre ao ligado: trilho na tela, botão em Gris Rhône.",
      de: "Deaktiviert schlägt immer eingeschaltet: Schiene auf der Fläche, Knopf in Gris Rhône.",
      it: "Il disattivato vince sempre sull'acceso: binario sulla tela, pomello in Gris Rhône.",
    },
    exemplo: (lang) => <AmInterruptor key={lang} lang={lang} inicial desativado />,
  },
  {
    nome: { fr: "Interrupteur · étiquette masquée", en: "Toggle · hidden label", pt: "Interruptor · rótulo oculto", de: "Schalter · verstecktes Label", it: "Interruttore · etichetta nascosta" },
    nota: {
      fr: "Pour l'intérieur d'une ligne de tableau : l'étiquette continue d'exister pour le lecteur d'écran.",
      en: "For use inside a table row: the label still exists for the screen reader.",
      pt: "Para dentro de linha de tabela: o rótulo continua a existir para o leitor de ecrã.",
      de: "Für den Einsatz in einer Tabellenzeile: das Label bleibt für den Screenreader bestehen.",
      it: "Per l'interno di una riga di tabella: l'etichetta continua a esistere per lo screen reader.",
    },
    exemplo: (lang) => <AmInterruptor key={lang} lang={lang} inicial rotuloOculto />,
  },

                      
  {
    nome: { fr: "Choix · repos", en: "Choice · resting", pt: "Escolha · repouso", de: "Auswahlgruppe · Ruhezustand", it: "Scelta · riposo" },
    nota: {
      fr: "Pastilles exclusives. Celle qui est choisie se remplit de Noir, les autres restent en hairline.",
      en: "Exclusive pills. The chosen one fills with Noir, the others stay as hairlines.",
      pt: "Pills exclusivas. A escolhida enche a Noir, as outras ficam em hairline.",
      de: "Exklusive Pills. Die gewählte füllt sich mit Noir, die übrigen bleiben Hairline.",
      it: "Pill esclusive. Quella scelta si riempie di Noir, le altre restano in hairline.",
    },
    exemplo: (lang) => <AmEscolha key={lang} lang={lang} />,
  },
  {
    nome: { fr: "Choix · avec option désactivée", en: "Choice · with a disabled option", pt: "Escolha · com opção desativada", de: "Auswahlgruppe · mit deaktivierter Option", it: "Scelta · con opzione disattivata" },
    nota: {
      fr: "Les flèches, Home et End sautent l'option inerte ; la sélection suit le focus, comme dans un groupe de boutons radio.",
      en: "Arrow keys, Home and End skip the inert option; selection follows focus, as in a radio group.",
      pt: "Setas, Home e End saltam a opção inerte; a seleção segue o foco, como num grupo de rádio.",
      de: "Pfeiltasten, Home und End überspringen die inaktive Option; die Auswahl folgt dem Fokus, wie in einer Radiogruppe.",
      it: "Frecce, Home e End saltano l'opzione inerte; la selezione segue il focus, come in un gruppo di radio.",
    },
    exemplo: (lang) => (
      <AmEscolha
        key={lang} lang={lang} inicial="print"
        opcoes={[
          { valor: "web", rotulo: t5(TIPO_WEB, lang) },
          { valor: "print", rotulo: t5(TIPO_PRINT, lang) },
          { valor: "film", rotulo: t5(TIPO_FILME, lang), desativada: true },
          { valor: "social", rotulo: t5(TIPO_SOCIAL, lang) },
        ]}
      />
    ),
  },
  {
    nome: { fr: "Choix · erreur", en: "Choice · error", pt: "Escolha · erro", de: "Auswahlgruppe · Fehler", it: "Scelta · errore" },
    nota: {
      fr: "Seules les pastilles non choisies passent au Violette : cela signale le groupe sans effacer le choix.",
      en: "Only the unchosen pills turn Violette: it flags the group without erasing the choice.",
      pt: "Só as pills não escolhidas passam a Violette: assinala o grupo sem apagar a escolha.",
      de: "Nur die nicht gewählten Pills wechseln zu Violette: das markiert die Gruppe, ohne die Wahl zu löschen.",
      it: "Solo le pill non scelte passano al Violette: segnala il gruppo senza cancellare la scelta.",
    },
    exemplo: (lang) => <AmEscolha key={lang} lang={lang} inicial={null} erro={t5(ERRO_TIPO_ESCOLHA, lang)} />,
  },
  {
    nome: { fr: "Choix · désactivé", en: "Choice · disabled", pt: "Escolha · desativada", de: "Auswahlgruppe · deaktiviert", it: "Scelta · disattivata" },
    nota: {
      fr: "Groupe entier inerte, sans opacité qui joue au gris neuf.",
      en: "The whole group goes inert, with no opacity pretending to be a new grey.",
      pt: "Grupo inteiro inerte, sem opacidade a fingir de cinzento novo.",
      de: "Die ganze Gruppe wird inaktiv, ohne Deckkraft, die ein neues Grau vortäuscht.",
      it: "Gruppo intero inerte, senza opacità che finge un grigio nuovo.",
    },
    exemplo: (lang) => <AmEscolha key={lang} lang={lang} inicial="film" desativado />,
  },

                     
  {
    nome: { fr: "Téléversement · vide", en: "Upload · empty", pt: "Carregamento · vazio", de: "Datei-Upload · leer", it: "Caricamento · vuoto" },
    nota: {
      fr: "La zone est un puits : elle naît sur la toile, en retrait, et le bouton à côté de l'invitation garantit le clavier.",
      en: "The zone is a well: it starts on the canvas, set back, and the button next to the invitation guarantees keyboard access.",
      pt: "A zona é um poço: nasce na tela, recuada, e o botão ao lado do convite garante o teclado.",
      de: "Die Zone ist ein Becken: sie beginnt zurückgenommen auf der Fläche, und der Knopf neben der Einladung sichert die Tastatur.",
      it: "La zona è un pozzo: nasce sulla tela, arretrata, e il pulsante accanto all'invito garantisce la tastiera.",
    },
    exemplo: (lang) => (
      <Upload rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={SEM_ENVIO} ajuda={t5(AJUDA_ANEXO, lang)} />
    ),
  },
  {
    nome: { fr: "Téléversement · à la réception", en: "Upload · receiving", pt: "Carregamento · a receber", de: "Datei-Upload · empfängt", it: "Caricamento · in ricezione" },
    nota: {
      fr: "Avec le fichier au-dessus, la zone se lève vers le Blanc Alpin et le filet passe au Noir.",
      en: "With the file hovering over it, the zone rises to Blanc Alpin and the frame turns Noir.",
      pt: "Com o ficheiro por cima, a zona levanta-se para Blanc Alpin e a moldura passa a Noir.",
      de: "Schwebt die Datei darüber, hebt sich die Zone auf Blanc Alpin und der Rahmen wird Noir.",
      it: "Con il file sopra, la zona si solleva verso il Blanc Alpin e la cornice passa al Noir.",
    },
    exemplo: (lang) => (
      <Upload rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={SEM_ENVIO} estado="sobre" />
    ),
  },
  {
    nome: { fr: "Téléversement · en cours", en: "Upload · in progress", pt: "Carregamento · a enviar", de: "Datei-Upload · läuft", it: "Caricamento · in corso" },
    nota: {
      fr: "Progression par hairline de 1px qui se remplit en scaleX, avec le chiffre à côté et role=progressbar en dessous.",
      en: "Progress by a 1px hairline filling with scaleX, with the numeral beside it and role=progressbar underneath.",
      pt: "Progresso por hairline de 1px que enche em scaleX, com o numeral ao lado e role=progressbar por baixo.",
      de: "Fortschritt als 1px-Hairline, die sich per scaleX füllt, mit der Zahl daneben und role=progressbar darunter.",
      it: "Avanzamento con hairline da 1px che si riempie in scaleX, con il numero accanto e role=progressbar sotto.",
    },
    exemplo: (lang) => (
      <Upload
        rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={SEM_ENVIO}
        estado="enviando" progresso={0.42} ficheiro={{ nome: t5(FICH_BRIEFING, lang), bytes: 248000 }}
      />
    ),
  },
  {
    nome: { fr: "Téléversement · en cours avec annulation", en: "Upload · in progress with cancel", pt: "Carregamento · a enviar com cancelar", de: "Datei-Upload · läuft mit Abbruch", it: "Caricamento · in corso con annulla" },
    nota: {
      fr: "Le bouton d'annulation n'apparaît que quand il existe vraiment une fonction pour annuler. On ne dessine pas un bouton qui ne fait rien.",
      en: "The cancel button only appears when there really is a function to cancel with. You do not draw a button that does nothing.",
      pt: "O botão de cancelar só aparece quando há mesmo uma função para cancelar. Não se desenha um botão que não faz nada.",
      de: "Der Abbrechen-Knopf erscheint nur, wenn es wirklich eine Funktion zum Abbrechen gibt. Man zeichnet keinen Knopf, der nichts tut.",
      it: "Il pulsante di annullamento appare solo quando esiste davvero una funzione per annullare. Non si disegna un pulsante che non fa nulla.",
    },
    exemplo: (lang) => (
      <Upload
        rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={SEM_ENVIO}
        estado="enviando" progresso={0.73} ficheiro={{ nome: t5(FICH_BRIEFING, lang), bytes: 248000 }}
        aoCancelar={() => undefined}
      />
    ),
  },
  {
    nome: { fr: "Téléversement · terminé", en: "Upload · finished", pt: "Carregamento · concluído", de: "Datei-Upload · abgeschlossen", it: "Caricamento · concluso" },
    nota: {
      fr: "Restent le nom, la taille et le glyphe pour retirer, qui est le caractère + tourné de 45 degrés.",
      en: "What remains is the name, the size and the remove glyph, which is the + character rotated 45 degrees.",
      pt: "Fica o nome, o tamanho e o glifo de remover, que é o símbolo + rodado 45 graus.",
      de: "Es bleiben der Name, die Größe und die Glyphe zum Entfernen, nämlich das Zeichen + um 45 Grad gedreht.",
      it: "Restano il nome, la dimensione e il glifo per rimuovere, che è il carattere + ruotato di 45 gradi.",
    },
    exemplo: (lang) => (
      <Upload
        rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={SEM_ENVIO}
        estado="pronto" progresso={1} ficheiro={{ nome: t5(FICH_BRIEFING, lang), bytes: 248000 }}
      />
    ),
  },
  {
    nome: { fr: "Téléversement · erreur", en: "Upload · error", pt: "Carregamento · erro", de: "Datei-Upload · Fehler", it: "Caricamento · errore" },
    nota: {
      fr: "Filet Violette et la raison dite en toutes lettres. L'erreur de format, de taille et d'envoi sont trois messages différents.",
      en: "Violette frame and the reason spelled out in words. Format, size and upload errors are three different messages.",
      pt: "Moldura Violette e a razão dita por palavras. O erro de formato, de tamanho e de envio são mensagens diferentes.",
      de: "Rahmen in Violette und der Grund in Worten. Format-, Größen- und Übertragungsfehler sind drei verschiedene Meldungen.",
      it: "Cornice Violette e il motivo detto a parole. L'errore di formato, di dimensione e di invio sono messaggi diversi.",
    },
    exemplo: (lang) => (
      <Upload
        rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={SEM_ENVIO}
        estado="erro" erro={textosUp(lang).erroTamanho} ficheiro={{ nome: t5(FICH_MONTAGEM, lang), bytes: 41000000 }}
      />
    ),
  },
  {
    nome: { fr: "Téléversement · désactivé", en: "Upload · disabled", pt: "Carregamento · desativado", de: "Datei-Upload · deaktiviert", it: "Caricamento · disattivato" },
    nota: {
      fr: "N'accepte ni le glisser-déposer ni l'ouverture du sélecteur.",
      en: "It accepts neither drag and drop nor opening the file picker.",
      pt: "Não aceita arrasto nem abre o seletor.",
      de: "Nimmt weder Drag-and-drop an noch öffnet es die Dateiauswahl.",
      it: "Non accetta il trascinamento né apre il selettore.",
    },
    exemplo: (lang) => (
      <Upload rotulo={t5(ROT_ANEXO, lang)} textos={textosUp(lang)} aoEnviar={SEM_ENVIO} desativado />
    ),
  },
  {
    nome: { fr: "Téléversement · cycle réel", en: "Upload · real cycle", pt: "Carregamento · ciclo real", de: "Datei-Upload · echter Zyklus", it: "Caricamento · ciclo reale" },
    nota: {
      fr: "Ici l'envoi tourne pour de vrai : choisir un fichier parcourt vide, en cours et terminé, avec la barre qui se remplit. C'est la preuve que l'état n'est pas un dessin.",
      en: "Here the upload really runs: choosing a file goes through empty, in progress and finished, with the bar filling. That is the proof that the state is not a drawing.",
      pt: "Aqui o envio corre mesmo: escolher um ficheiro percorre vazio, a enviar e concluído com a barra a encher. É a prova de que o estado não é desenho.",
      de: "Hier läuft der Upload wirklich: eine Datei zu wählen durchläuft leer, läuft und abgeschlossen, während sich der Balken füllt. Das ist der Beweis, dass der Zustand keine Zeichnung ist.",
      it: "Qui l'invio gira davvero: scegliere un file percorre vuoto, in corso e concluso con la barra che si riempie. È la prova che lo stato non è un disegno.",
    },
    exemplo: (lang) => <AmUploadReal key={lang} lang={lang} />,
  },
];
