                                                   
                                                              

                                                                                   
                                                                                       
                                            

                                  
                                                                                       
                                                                    
                                                                                       
                                                                                         
                                                      
                                                                                      
                                                                                
                                        
                                                                                    
  

import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { type AbilLang } from '../../AbilSite';

                                                                                      
                                                                                    
                                                                                       
type L5 = Record<AbilLang, string>;
const t5 = (o: L5, l: AbilLang) => o[l] || o.fr;

                                                                               
                    
                                                                                  

                                                                              
export type AdAccao = {
  rotulo: string;
  onAccao: () => void;
                                                                         
  tom?: 'principal' | 'discreta';
                                                         
  desativada?: boolean;
};

                                                                              
export type AdTomAviso = 'informacao' | 'atencao' | 'confirmacao';

                                                            
export type AdTomNota = AdTomAviso | 'erro';

                                                                               
                                                                           
                                                                                  

                                                                                     
function BotaoFb(props: {
  accao: AdAccao;
  perigo?: boolean;
  ocupado?: boolean;
  autoFoco?: boolean;
}) {
  const { accao, perigo, ocupado, autoFoco } = props;
  const tom = perigo ? 'perigo' : accao.tom === 'discreta' ? 'discreta' : 'principal';
  return (
    <button
      type="button"
      className={'ad-fb-btn ad-fb-btn--' + tom}
      onClick={accao.onAccao}
      disabled={accao.desativada || ocupado}
      data-ocupado={ocupado ? 'sim' : undefined}
                                                                                  
                                                                                      
                                                                                        
      data-ad-auto-foco={autoFoco ? 'sim' : undefined}
    >
      {perigo ? <span className="ad-fb-glifo" aria-hidden="true" /> : null}
      {accao.rotulo}
    </button>
  );
}

                                                                             
function BotaoFechar(props: { rotulo: string; onFechar: () => void; desativado?: boolean }) {
  return (
    <button
      type="button"
      className="ad-fb-fechar"
      aria-label={props.rotulo}
      onClick={props.onFechar}
      disabled={props.desativado}
    >
      <i aria-hidden="true">+</i>
    </button>
  );
}

                                                                               
           
                                                                           
                                                                                    
                                                                                  

type VazioBase = {
                                                    
  eyebrow?: string;
  titulo: string;
                                                                               
  descricao: string;
                              
  accao?: AdAccao;
  accaoSecundaria?: AdAccao;
};

export type AdVazioProps =
  | (VazioBase & { variante: 'ainda-nada' })
  | (VazioBase & {
      variante: 'filtro-sem-resultados';
                                                                           
      filtros?: string[];
                                                                
      rotuloFiltros?: string;
    })
  | (VazioBase & {
      variante: 'nao-configurado';
                                                                           
      chave: string;
                                                                  
      rotuloChave: string;
                                                                                 
      onde?: string;
    });

export function AdVazio(props: AdVazioProps) {
  const { eyebrow, titulo, descricao, accao, accaoSecundaria, variante } = props;
  return (
    <div className={'ad-fb-vazio ad-fb-vazio--' + variante} role="status">
      {eyebrow ? <p className="ad-fb-eyebrow">{eyebrow}</p> : null}
      <h3 className="ad-fb-vazio-titulo">{titulo}</h3>
      <p className="ad-fb-vazio-texto">{descricao}</p>

      {props.variante === 'filtro-sem-resultados' && props.filtros && props.filtros.length > 0 ? (
        <div className="ad-fb-vazio-bloco">
          {props.rotuloFiltros ? <p className="ad-fb-eyebrow">{props.rotuloFiltros}</p> : null}
          <ul className="ad-fb-tags">
            {props.filtros.map((f) => (
              <li key={f} className="ad-fb-tag">
                {f}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {props.variante === 'nao-configurado' ? (
        <div className="ad-fb-vazio-bloco">
          <p className="ad-fb-eyebrow">{props.rotuloChave}</p>
          {                                                                           
                                                                               }
          <p className="ad-fb-chave">{props.chave}</p>
          {props.onde ? <p className="ad-fb-vazio-onde">{props.onde}</p> : null}
        </div>
      ) : null}

      {accao || accaoSecundaria ? (
        <div className="ad-fb-accoes">
          {accao ? <BotaoFb accao={accao} /> : null}
          {accaoSecundaria ? (
            <BotaoFb accao={{ tom: 'discreta', ...accaoSecundaria }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

                                                                               
                
                                                                                  
                                                                                  

export type AdCarregandoProps = {
                                                                         
  forma: 'texto' | 'tabela' | 'cartoes' | 'linha';
                                                                    
  linhas?: number;
                                                                 
  colunas?: number;
                                                                                     
  rotulo: string;
};

export function AdCarregando({ forma, linhas = 3, colunas = 4, rotulo }: AdCarregandoProps) {
  const nLinhas = Math.max(1, linhas);
  const nColunas = Math.max(1, colunas);
  const filas = Array.from({ length: nLinhas }, (_, i) => i);
  const celulas = Array.from({ length: nColunas }, (_, i) => i);

  return (
    <div className={'ad-fb-esq ad-fb-esq--' + forma} role="status" aria-busy="true">
      <span className="ad-fb-sr">{rotulo}</span>

      {forma === 'linha' ? <span className="ad-fb-bloco ad-fb-bloco--linha" aria-hidden="true" /> : null}

      {forma === 'texto'
        ? filas.map((i) => (
            <span
              key={i}
              className="ad-fb-bloco"
              aria-hidden="true"
                                                                     
              style={{ width: i === nLinhas - 1 ? '58%' : '100%' } as CSSProperties}
            />
          ))
        : null}

      {forma === 'tabela' ? (
        <div className="ad-fb-esq-tab" aria-hidden="true">
          {filas.map((i) => (
            <div key={i} className="ad-fb-esq-fila">
              {celulas.map((c) => (
                <span
                  key={c}
                  className="ad-fb-bloco"
                                                                              
                  style={{ width: c === 0 ? '80%' : '55%' } as CSSProperties}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {forma === 'cartoes' ? (
        <div className="ad-fb-esq-grelha" aria-hidden="true">
          {filas.map((i) => (
            <div key={i} className="ad-fb-esq-cartao">
              <span className="ad-fb-bloco ad-fb-bloco--visual" />
              <span className="ad-fb-bloco" style={{ width: '70%' } as CSSProperties} />
              <span className="ad-fb-bloco ad-fb-bloco--micro" style={{ width: '40%' } as CSSProperties} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

                                                                               
          
                                                                                    
                                                                                      
                                                                                  

type ErroBase = {
  titulo: string;
  mensagem: string;
                                                                            
  accao?: AdAccao;
                                                                        
  compacto?: boolean;
};

type ErroCausa =
  | { causa?: undefined; rotuloCausa?: undefined }
  | { causa: string; rotuloCausa: string };

type ErroDetalhe =
  | { detalhe?: undefined; rotuloDetalhe?: undefined }
  | { detalhe: string; rotuloDetalhe: string };

export type AdErroProps = ErroBase & ErroCausa & ErroDetalhe;

export function AdErro(props: AdErroProps) {
  const { titulo, mensagem, accao, compacto, causa, rotuloCausa, detalhe, rotuloDetalhe } = props;
  const [aberto, setAberto] = useState(false);
  const idDetalhe = useId();

  return (
    <div className={'ad-fb-erro' + (compacto ? ' ad-fb-erro--compacto' : '')} role="alert">
      <div className="ad-fb-erro-cabeca">
        <span className="ad-fb-ponto ad-fb-ponto--sinal" aria-hidden="true" />
        <h3 className="ad-fb-erro-titulo">{titulo}</h3>
      </div>
      <p className="ad-fb-erro-msg">{mensagem}</p>

      {causa ? (
        <p className="ad-fb-erro-causa">
          <span className="ad-fb-eyebrow">{rotuloCausa}</span>
          {                                                                      
                                                                               }
          <span className="ad-fb-erro-causa-txt">{causa}</span>
        </p>
      ) : null}

      {detalhe ? (
        <div className="ad-fb-dobra">
          <button
            type="button"
            className="ad-fb-dobra-btn"
            aria-expanded={aberto}
            aria-controls={idDetalhe}
            onClick={() => setAberto((v) => !v)}
          >
            <i aria-hidden="true">{aberto ? '−' : '+'}</i>
            {rotuloDetalhe}
          </button>
          <div id={idDetalhe} className={'ad-fb-acc' + (aberto ? ' ad-fb-acc--on' : '')}>
            <div>
              <pre className="ad-fb-detalhe">{detalhe}</pre>
            </div>
          </div>
        </div>
      ) : null}

      {accao ? (
        <div className="ad-fb-accoes">
          <BotaoFb accao={accao} />
        </div>
      ) : null}
    </div>
  );
}

                                                                               
           
                                                                          
                                                                                  

export type AdAvisoProps = {
  tom: AdTomAviso;
                                                                             
  etiqueta: string;
  mensagem: string;
  accao?: AdAccao;
                                                                                   
  onFechar?: () => void;
  rotuloFechar?: string;
};

export function AdAviso({ tom, etiqueta, mensagem, accao, onFechar, rotuloFechar }: AdAvisoProps) {
  return (
    <div
      className={'ad-fb-aviso ad-fb-aviso--' + tom}
      role={tom === 'atencao' ? 'alert' : 'status'}
    >
      <span className={'ad-fb-ponto ad-fb-ponto--' + tom} aria-hidden="true" />
      <div className="ad-fb-aviso-corpo">
        <p className="ad-fb-eyebrow">{etiqueta}</p>
        <p className="ad-fb-aviso-msg">{mensagem}</p>
      </div>
      {accao ? <BotaoFb accao={{ tom: 'discreta', ...accao }} /> : null}
      {onFechar && rotuloFechar ? <BotaoFechar rotulo={rotuloFechar} onFechar={onFechar} /> : null}
    </div>
  );
}

                                                                               
           
                                                                                  
                            
                                                                                  

const FOCAVEIS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type AdModalProps = {
  aberto: boolean;
  titulo: string;
                                                                          
  descricao?: string;
  rotuloFechar: string;
  onFechar: () => void;
                                                                           
  bloqueado?: boolean;
  largura?: 'estreito' | 'normal' | 'largo';
  children?: ReactNode;
                                                              
  rodape?: ReactNode;
};

                                                                                   
export function AdModal(props: AdModalProps) {
  if (!props.aberto) return null;
  return <ModalInterno {...props} />;
}

function ModalInterno({
  titulo,
  descricao,
  rotuloFechar,
  onFechar,
  bloqueado,
  largura = 'normal',
  children,
  rodape,
}: AdModalProps) {
  const painel = useRef<HTMLDivElement | null>(null);
  const abridor = useRef<Element | null>(null);
  const [dentro, setDentro] = useState(false);
  const idTitulo = useId();
  const idDesc = useId();

                                                                                    
                                                                      
  const [alvo] = useState(() => {
    if (typeof document === 'undefined') return null;
    const d = document.createElement('div');
    d.className = 'ad-root ad-fb-portal';
    return d;
  });

  useEffect(() => {
    if (!alvo) return;
    document.body.appendChild(alvo);
    return () => {
      alvo.remove();
    };
  }, [alvo]);

                                                      
  useEffect(() => {
    abridor.current = document.activeElement;

                                                                                    
                                                                                     
                                                                                        
                                                                                
                                                         
    const marcado = painel.current?.querySelector<HTMLElement>('[data-ad-auto-foco="sim"]');
    const primeiro = marcado ?? painel.current?.querySelector<HTMLElement>(FOCAVEIS);
    (primeiro ?? painel.current)?.focus();

                                                                                       
                                                                                     
    const r = requestAnimationFrame(() => setDentro(true));
    const t = window.setTimeout(() => setDentro(true), 32);
    return () => {
      cancelAnimationFrame(r);
      window.clearTimeout(t);
      const anterior = abridor.current;
      if (anterior instanceof HTMLElement) anterior.focus();
    };
  }, []);

                                                               
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

                                             
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape' && !bloqueado) {
        e.stopPropagation();
        onFechar();
        return;
      }
      if (e.key !== 'Tab' || !painel.current) return;
      const lista = Array.from(painel.current.querySelectorAll<HTMLElement>(FOCAVEIS)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (lista.length === 0) {
        e.preventDefault();
        painel.current.focus();
        return;
      }
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey && (activo === primeiro || activo === painel.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', aoTeclar, true);
    return () => document.removeEventListener('keydown', aoTeclar, true);
  }, [bloqueado, onFechar]);

  if (!alvo) return null;

  return createPortal(
    <div className={'ad-fb-modalwrap' + (dentro ? ' ad-fb-modalwrap--in' : '')}>
      <div
        className="ad-fb-veu"
        onClick={bloqueado ? undefined : onFechar}
        aria-hidden="true"
      />
      <div
        ref={painel}
        className={'ad-fb-modal ad-fb-modal--' + largura}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descricao ? idDesc : undefined}
        tabIndex={-1}
      >
        <header className="ad-fb-modal-bar">
          <div>
            <h2 id={idTitulo} className="ad-fb-modal-titulo">
              {titulo}
            </h2>
            {descricao ? (
              <p id={idDesc} className="ad-fb-modal-desc">
                {descricao}
              </p>
            ) : null}
          </div>
          <BotaoFechar rotulo={rotuloFechar} onFechar={onFechar} desativado={bloqueado} />
        </header>
        {children ? <div className="ad-fb-modal-corpo">{children}</div> : null}
        {rodape ? <footer className="ad-fb-modal-rodape">{rodape}</footer> : null}
      </div>
    </div>,
    alvo,
  );
}

                                                                              
                                                  
                                                                                
                                                                        
                                                                                 

export type AdModalConfirmacaoProps = {
  aberto: boolean;
  titulo: string;
                                                                                
  descricao: string;
                                                                             
  objecto?: string;
                                                                               
  rotuloConfirmar: string;
  rotuloCancelar: string;
  rotuloFechar: string;
                                                                  
  ocupado?: boolean;
  rotuloOcupado?: string;
                                               
  erro?: string;
  rotuloErro?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function AdModalConfirmacao(props: AdModalConfirmacaoProps) {
  const {
    aberto,
    titulo,
    descricao,
    objecto,
    rotuloConfirmar,
    rotuloCancelar,
    rotuloFechar,
    ocupado,
    rotuloOcupado,
    erro,
    rotuloErro,
    onConfirmar,
    onCancelar,
  } = props;

                                                                                 
                                                                            
  useEffect(() => {
                                                                                        
                                                                                          
                                                            
    if (!aberto || import.meta.env?.DEV !== true) return;
    if (rotuloConfirmar.trim().split(/\s+/).length < 2) {
      console.warn(
        '[ad-fb] rotuloConfirmar deve dizer a accao e o objecto (ex.: "Supprimer le projet"), nao uma palavra generica. Recebido:',
        rotuloConfirmar,
      );
    }
  }, [aberto, rotuloConfirmar]);

  return (
    <AdModal
      aberto={aberto}
      titulo={titulo}
      descricao={descricao}
      rotuloFechar={rotuloFechar}
      onFechar={onCancelar}
      bloqueado={ocupado}
      largura="estreito"
      rodape={
        <>
          {                                                                           
                                                                                   }
          <BotaoFb
            accao={{ rotulo: rotuloCancelar, onAccao: onCancelar, tom: 'discreta', desativada: ocupado }}
            autoFoco
          />
          <BotaoFb
            accao={{ rotulo: ocupado && rotuloOcupado ? rotuloOcupado : rotuloConfirmar, onAccao: onConfirmar }}
            perigo
            ocupado={ocupado}
          />
        </>
      }
    >
      {objecto ? <p className="ad-fb-objecto">{objecto}</p> : null}
      {erro ? (
        <div className="ad-fb-conf-erro" role="alert">
          <span className="ad-fb-ponto ad-fb-ponto--sinal" aria-hidden="true" />
          <p>
            {rotuloErro ? <span className="ad-fb-eyebrow">{rotuloErro}</span> : null}
            <span className="ad-fb-erro-causa-txt">{erro}</span>
          </p>
        </div>
      ) : null}
    </AdModal>
  );
}

                                                                               
                 
                                                                
                                                                                  

export type AdNotificacaoProps = {
  tom: AdTomNota;
  etiqueta: string;
  mensagem: string;
  accao?: AdAccao;
  rotuloFechar: string;
                                                                                    
  duracaoMs?: number | null;
                                                                                   
  onFim: () => void;
};

export function AdNotificacao({
  tom,
  etiqueta,
  mensagem,
  accao,
  rotuloFechar,
  duracaoMs = 6000,
  onFim,
}: AdNotificacaoProps) {
  const [dentro, setDentro] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const restante = useRef(duracaoMs ?? 0);
  const caixa = useRef<HTMLDivElement | null>(null);
  const fim = useRef(onFim);

  useEffect(() => {
    fim.current = onFim;
  }, [onFim]);

                                                                                        
                                                                     
  useEffect(() => {
    const r = requestAnimationFrame(() => setDentro(true));
    const t = window.setTimeout(() => setDentro(true), 32);
    return () => {
      cancelAnimationFrame(r);
      window.clearTimeout(t);
    };
  }, []);

                                                                                   
                                      
  useEffect(() => {
    if (duracaoMs == null || pausado || saindo) return;
    const t0 = Date.now();
    const t = window.setTimeout(() => setSaindo(true), restante.current);
    return () => {
      window.clearTimeout(t);
      restante.current = Math.max(0, restante.current - (Date.now() - t0));
    };
  }, [duracaoMs, pausado, saindo]);

                                                                                
  useEffect(() => {
    if (!saindo) return;
    const el = caixa.current;
    let feito = false;
    const acabar = () => {
      if (feito) return;
      feito = true;
      fim.current();
    };
    el?.addEventListener('transitionend', acabar);
    const t = window.setTimeout(acabar, 600);
    return () => {
      el?.removeEventListener('transitionend', acabar);
      window.clearTimeout(t);
    };
  }, [saindo]);

  return (
    <div
      ref={caixa}
      className={
        'ad-fb-nota ad-fb-nota--' +
        tom +
        (dentro && !saindo ? ' ad-fb-nota--in' : '') +
        (saindo ? ' ad-fb-nota--out' : '')
      }
      role={tom === 'erro' || tom === 'atencao' ? 'alert' : 'status'}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <span className={'ad-fb-ponto ad-fb-ponto--' + tom} aria-hidden="true" />
      <div className="ad-fb-nota-corpo">
        <p className="ad-fb-eyebrow">{etiqueta}</p>
        <p className="ad-fb-nota-msg">{mensagem}</p>
        {accao ? (
          <div className="ad-fb-accoes ad-fb-accoes--nota">
            <BotaoFb accao={{ tom: 'discreta', ...accao }} />
          </div>
        ) : null}
      </div>
      <BotaoFechar rotulo={rotuloFechar} onFechar={() => setSaindo(true)} />
    </div>
  );
}

export type AdNotificacoesProps = {
                                                                       
  rotulo: string;
                                                                                 
  ancorada?: boolean;
  children?: ReactNode;
};

                                                              
export function AdNotificacoes({ rotulo, ancorada = true, children }: AdNotificacoesProps) {
  return (
    <div
      className={'ad-fb-notes' + (ancorada ? '' : ' ad-fb-notes--inline')}
      role="region"
      aria-label={rotulo}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

                                                                               
                                                          
                                                                                  

export const CSS_FEEDBACK = `
/* Shared family base. */
.ad-fb-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}

.ad-fb-eyebrow{margin:0;font-family:var(--ad-fonte);font-size:var(--ad-t-micro);
  font-weight:var(--ad-peso-normal);letter-spacing:var(--ad-track-eyebrow);
  text-transform:uppercase;color:var(--ad-tinta-fraca);line-height:1.2}

/* The dot is the only tone marker. It never appears alone and always has a word beside it. */
.ad-fb-ponto{display:block;flex:none;width:8px;height:8px;margin-top:2px;
  background:var(--ad-tinta-fraca);border-radius:var(--ad-raio)}
.ad-fb-ponto--informacao{background:var(--ad-tinta)}
.ad-fb-ponto--atencao,.ad-fb-ponto--erro,.ad-fb-ponto--sinal{background:var(--ad-sinal)}
.ad-fb-ponto--confirmacao{background:var(--ad-acao)}

/* Family button. */
.ad-fb-btn{display:inline-flex;align-items:center;gap:var(--ad-e2);
  font-family:var(--ad-fonte);font-size:var(--ad-t-apoio);font-weight:var(--ad-peso-normal);
  line-height:1;letter-spacing:-.01em;text-transform:uppercase;
  padding:9px 18px;border:var(--ad-linha-px) solid var(--ad-noir);
  border-radius:var(--ad-raio-pill);background:var(--ad-noir);color:var(--ad-alpin);
  cursor:pointer;transition:background-color var(--ad-d-normal) var(--ad-curva),
  color var(--ad-d-normal) var(--ad-curva),border-color var(--ad-d-normal) var(--ad-curva)}
.ad-fb-btn--principal:hover{background:var(--ad-acao);border-color:var(--ad-acao);color:var(--ad-tinta)}
.ad-fb-btn--discreta{background:transparent;border-color:var(--ad-linha);color:var(--ad-tinta)}
.ad-fb-btn--discreta:hover{background:var(--ad-noir);border-color:var(--ad-noir);color:var(--ad-alpin)}
/* Irreversible action: Violette signals it while the text remains Noir at 8.0:1. */
.ad-fb-btn--perigo{background:transparent;border-color:var(--ad-sinal);color:var(--ad-tinta)}
.ad-fb-btn--perigo:hover{background:var(--ad-sinal);border-color:var(--ad-sinal);color:var(--ad-tinta)}
.ad-fb-btn:disabled{cursor:not-allowed;opacity:.5}
.ad-fb-btn[data-ocupado="sim"]{cursor:progress;opacity:.7}

/* Irreversible-action glyph: a 1px square with a diagonal, using only shapes from the logo.
   It is not a library icon and never carries information by itself. */
.ad-fb-glifo{position:relative;display:block;flex:none;width:9px;height:9px;
  border:var(--ad-linha-px) solid currentColor}
.ad-fb-glifo:after{content:"";position:absolute;left:0;top:50%;width:100%;
  height:var(--ad-linha-px);background:currentColor;transform:rotate(-45deg)}

/* Close control: the plus character rotated 45 degrees. */
.ad-fb-fechar{flex:none;display:flex;align-items:center;justify-content:center;
  width:22px;height:22px;padding:0;background:transparent;cursor:pointer;
  border:var(--ad-linha-px) solid var(--ad-linha);border-radius:var(--ad-raio-pill);
  color:var(--ad-tinta);
  transition:background-color var(--ad-d-normal) var(--ad-curva),
  color var(--ad-d-normal) var(--ad-curva),border-color var(--ad-d-normal) var(--ad-curva)}
.ad-fb-fechar i{font-style:normal;font-size:14px;line-height:1;display:block;
  transform:rotate(45deg) translateY(-.02em)}
.ad-fb-fechar:hover{background:var(--ad-noir);border-color:var(--ad-noir);color:var(--ad-alpin)}
.ad-fb-fechar:disabled{cursor:not-allowed;opacity:.5}

/* Row of actions. */
.ad-fb-accoes{display:flex;flex-wrap:wrap;align-items:center;gap:var(--ad-e2);
  margin-top:var(--ad-e4)}
.ad-fb-accoes--nota{margin-top:var(--ad-e3)}

/* 1. Empty state. */
.ad-fb-vazio{display:flex;flex-direction:column;align-items:flex-start;
  padding:var(--ad-e6);background:var(--ad-superficie-alta);
  border:var(--ad-linha-px) solid var(--ad-linha);border-radius:var(--ad-raio);
  font-family:var(--ad-fonte);color:var(--ad-tinta);max-width:560px}
.ad-fb-vazio-titulo{margin:var(--ad-e2) 0 0;font-size:var(--ad-t-seccao);
  font-weight:var(--ad-peso-leve);line-height:var(--ad-lh-titulo);
  letter-spacing:var(--ad-track-titulo);text-transform:uppercase}
.ad-fb-vazio-texto{margin:var(--ad-e3) 0 0;font-size:var(--ad-t-corpo);
  font-weight:var(--ad-peso-normal);line-height:var(--ad-lh-corpo);letter-spacing:-.01em;
  max-width:52ch}
.ad-fb-vazio-bloco{margin-top:var(--ad-e4);padding-top:var(--ad-e3);width:100%;
  border-top:var(--ad-linha-px) solid var(--ad-linha)}
.ad-fb-vazio-onde{margin:var(--ad-e2) 0 0;font-size:var(--ad-t-apoio);
  color:var(--ad-tinta-fraca);letter-spacing:-.01em}
/* The key is never transformed because the text must show its actual name. */
.ad-fb-chave{display:inline-block;margin:var(--ad-e2) 0 0;padding:3px 8px;
  font-size:var(--ad-t-apoio);letter-spacing:.02em;text-transform:none;
  color:var(--ad-tinta);background:var(--ad-superficie);
  border:var(--ad-linha-px) solid var(--ad-linha);border-radius:var(--ad-raio)}
.ad-fb-tags{display:flex;flex-wrap:wrap;gap:var(--ad-e1);margin:var(--ad-e2) 0 0;
  padding:0;list-style:none}
.ad-fb-tag{font-size:var(--ad-t-micro);text-transform:uppercase;
  letter-spacing:var(--ad-track-eyebrow);padding:4px 9px;color:var(--ad-tinta);
  border:var(--ad-linha-px) solid var(--ad-linha);border-radius:var(--ad-raio-pill)}

/* 2. Loading state. */
.ad-fb-esq{display:flex;flex-direction:column;gap:var(--ad-e2);width:100%;
  font-family:var(--ad-fonte)}
.ad-fb-bloco{display:block;height:10px;background:var(--ad-linha);
  border-radius:var(--ad-raio);animation:ad-fb-pulso 1.1s var(--ad-curva) infinite alternate}
.ad-fb-bloco--linha{height:12px;width:100%}
.ad-fb-bloco--micro{height:8px}
.ad-fb-bloco--visual{height:96px;margin-bottom:var(--ad-e3)}
.ad-fb-esq-tab{display:flex;flex-direction:column}
.ad-fb-esq-fila{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:var(--ad-e4);
  align-items:center;padding:var(--ad-e3) 0;
  border-bottom:var(--ad-linha-px) solid var(--ad-linha)}
.ad-fb-esq-grelha{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
  gap:var(--ad-e4)}
.ad-fb-esq-cartao{display:flex;flex-direction:column;gap:var(--ad-e2);padding:var(--ad-e4);
  background:var(--ad-superficie-alta);border:var(--ad-linha-px) solid var(--ad-linha)}
/* Only opacity pulses. No sheen passes over the skeleton because a moving reflection would imply
   progress that is not actually being measured. */
@keyframes ad-fb-pulso{from{opacity:1}to{opacity:.5}}
@media (prefers-reduced-motion: reduce){.ad-fb-bloco{animation:none}}

/* 3. Error state. */
.ad-fb-erro{padding:var(--ad-e4);background:var(--ad-superficie-alta);
  border:var(--ad-linha-px) solid var(--ad-sinal);border-radius:var(--ad-raio);
  font-family:var(--ad-fonte);color:var(--ad-tinta);max-width:560px}
.ad-fb-erro-cabeca{display:flex;align-items:flex-start;gap:var(--ad-e2)}
.ad-fb-erro-titulo{margin:0;font-size:var(--ad-t-sub);font-weight:var(--ad-peso-normal);
  line-height:var(--ad-lh-titulo);letter-spacing:var(--ad-track-titulo);
  text-transform:uppercase}
.ad-fb-erro-msg{margin:var(--ad-e2) 0 0;font-size:var(--ad-t-corpo);
  line-height:var(--ad-lh-corpo);letter-spacing:-.01em;max-width:52ch}
.ad-fb-erro-causa{margin:var(--ad-e3) 0 0;padding-top:var(--ad-e3);
  border-top:var(--ad-linha-px) solid var(--ad-linha);
  display:flex;flex-direction:column;gap:var(--ad-e1)}
.ad-fb-erro-causa-txt{font-size:var(--ad-t-corpo);line-height:var(--ad-lh-corpo);
  letter-spacing:-.01em;color:var(--ad-tinta)}
.ad-fb-erro--compacto{padding:var(--ad-e3);display:flex;flex-wrap:wrap;
  align-items:baseline;gap:var(--ad-e2)}
.ad-fb-erro--compacto .ad-fb-erro-msg,.ad-fb-erro--compacto .ad-fb-erro-causa{margin:0;
  padding:0;border:0}
.ad-fb-erro--compacto .ad-fb-accoes{margin:0}

/* Technical-detail disclosure animates grid-template-rows, never height. */
.ad-fb-dobra{margin-top:var(--ad-e3)}
.ad-fb-dobra-btn{display:inline-flex;align-items:center;gap:var(--ad-e2);padding:0;
  background:none;border:0;cursor:pointer;font-family:var(--ad-fonte);
  font-size:var(--ad-t-apoio);text-transform:uppercase;letter-spacing:-.01em;
  color:var(--ad-tinta)}
.ad-fb-dobra-btn i{font-style:normal;width:9px;text-align:center}
.ad-fb-acc{display:grid;grid-template-rows:0fr;opacity:0;
  transition:grid-template-rows var(--ad-d-lento) var(--ad-curva),
  opacity var(--ad-d-lento) var(--ad-curva)}
.ad-fb-acc>*{overflow:hidden;min-height:0}
.ad-fb-acc--on{grid-template-rows:1fr;opacity:1}
.ad-fb-detalhe{margin:var(--ad-e2) 0 0;padding:var(--ad-e3);white-space:pre-wrap;
  word-break:break-word;font-family:var(--ad-fonte);font-size:var(--ad-t-apoio);
  line-height:var(--ad-lh-corpo);color:var(--ad-tinta);background:var(--ad-superficie);
  border:var(--ad-linha-px) solid var(--ad-linha)}

/* 4. Notice. */
.ad-fb-aviso{display:flex;align-items:flex-start;gap:var(--ad-e3);padding:var(--ad-e3);
  background:var(--ad-superficie-alta);border:var(--ad-linha-px) solid var(--ad-linha);
  border-left:var(--ad-linha-px) solid var(--ad-linha);border-radius:var(--ad-raio);
  font-family:var(--ad-fonte);color:var(--ad-tinta)}
.ad-fb-aviso--atencao{border-color:var(--ad-sinal)}
.ad-fb-aviso--confirmacao{border-color:var(--ad-tinta)}
.ad-fb-aviso-corpo{flex:1;min-width:0;display:flex;flex-direction:column;gap:var(--ad-e1)}
.ad-fb-aviso-msg{margin:0;font-size:var(--ad-t-corpo);line-height:var(--ad-lh-corpo);
  letter-spacing:-.01em}

/* 5. Modal. */
.ad-fb-modalwrap{position:fixed;inset:0;z-index:120;display:flex;align-items:center;
  justify-content:center;padding:var(--ad-e6);font-family:var(--ad-fonte)}
/* The background only darkens. Blur is avoided because it hides the underlying context. */
.ad-fb-veu{position:absolute;inset:0;background:color-mix(in srgb,var(--ad-noir) 50%,transparent);
  opacity:0;transition:opacity var(--ad-d-normal) linear}
.ad-fb-modalwrap--in .ad-fb-veu{opacity:1}
.ad-fb-modal{position:relative;display:flex;flex-direction:column;width:100%;
  max-height:calc(100vh - var(--ad-e6) * 2);background:var(--ad-superficie-alta);
  border:var(--ad-linha-px) solid var(--ad-noir);border-radius:var(--ad-raio);
  color:var(--ad-tinta);opacity:0;transform:translateY(10px);
  transition:transform var(--ad-d-lento) var(--ad-curva),opacity var(--ad-d-lento) var(--ad-curva)}
.ad-fb-modalwrap--in .ad-fb-modal{opacity:1;transform:none}
.ad-fb-modal--estreito{max-width:420px}
.ad-fb-modal--normal{max-width:620px}
.ad-fb-modal--largo{max-width:900px}
.ad-fb-modal-bar{display:flex;align-items:flex-start;gap:var(--ad-e4);padding:var(--ad-e4);
  border-bottom:var(--ad-linha-px) solid var(--ad-linha)}
.ad-fb-modal-bar>div{flex:1;min-width:0}
.ad-fb-modal-titulo{margin:0;font-size:var(--ad-t-seccao);font-weight:var(--ad-peso-leve);
  line-height:var(--ad-lh-titulo);letter-spacing:var(--ad-track-titulo);
  text-transform:uppercase}
.ad-fb-modal-desc{margin:var(--ad-e2) 0 0;font-size:var(--ad-t-corpo);
  line-height:var(--ad-lh-corpo);letter-spacing:-.01em;max-width:52ch}
.ad-fb-modal-corpo{padding:var(--ad-e4);overflow-y:auto}
.ad-fb-modal-rodape{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:var(--ad-e2);
  padding:var(--ad-e4);border-top:var(--ad-linha-px) solid var(--ad-linha)}
.ad-fb-objecto{margin:0;font-size:var(--ad-t-sub);font-weight:var(--ad-peso-normal);
  line-height:var(--ad-lh-titulo);letter-spacing:var(--ad-track-titulo);
  text-transform:uppercase}
.ad-fb-conf-erro{display:flex;align-items:flex-start;gap:var(--ad-e2);
  margin-top:var(--ad-e3);padding-top:var(--ad-e3);
  border-top:var(--ad-linha-px) solid var(--ad-sinal)}
.ad-fb-conf-erro p{margin:0;display:flex;flex-direction:column;gap:var(--ad-e1)}

/* 6. Notification. */
.ad-fb-notes{position:fixed;right:var(--ad-e6);bottom:var(--ad-e6);z-index:130;
  display:flex;flex-direction:column;gap:var(--ad-e2);width:340px;
  max-width:calc(100vw - var(--ad-e6) * 2);font-family:var(--ad-fonte)}
.ad-fb-notes--inline{position:relative;right:auto;bottom:auto;z-index:auto;width:100%;
  max-width:380px}
.ad-fb-nota{display:flex;align-items:flex-start;gap:var(--ad-e3);padding:var(--ad-e3);
  background:var(--ad-superficie-alta);border:var(--ad-linha-px) solid var(--ad-linha);
  border-radius:var(--ad-raio);color:var(--ad-tinta);
  opacity:0;transform:translateY(10px);
  transition:transform var(--ad-d-lento) var(--ad-curva),opacity var(--ad-d-lento) var(--ad-curva)}
.ad-fb-nota--in{opacity:1;transform:none}
.ad-fb-nota--out{opacity:0;transform:translateY(10px)}
.ad-fb-nota--erro,.ad-fb-nota--atencao{border-color:var(--ad-sinal)}
.ad-fb-nota--confirmacao{border-color:var(--ad-tinta)}
.ad-fb-nota-corpo{flex:1;min-width:0;display:flex;flex-direction:column;gap:var(--ad-e1)}
.ad-fb-nota-msg{margin:0;font-size:var(--ad-t-corpo);line-height:var(--ad-lh-corpo);
  letter-spacing:-.01em}
`;

                                                                        
export function EstilosFeedback() {
  return <style>{CSS_FEEDBACK}</style>;
}

                                                                               
           
                                                                                  
                                                                                
                                                                                 
                                                                       
                                                                                  

export type Amostra = { nome: L5; nota: L5; exemplo: (lang: AbilLang) => ReactNode };

                                                                                  
export type AdAmostra = Amostra;

function nada() {
                                                                        
}

                                                                                  
                                                                   
const R_REPETIR: L5 = {
  fr: 'Réessayer',
  en: 'Try again',
  pt: 'Tentar de novo',
  de: 'Erneut versuchen',
  it: 'Riprova',
};
const R_CAUSA: L5 = { fr: 'Cause', en: 'Cause', pt: 'Causa', de: 'Ursache', it: 'Causa' };
const R_FECHAR_DIALOGO: L5 = {
  fr: 'Fermer le dialogue',
  en: 'Close the dialog',
  pt: 'Fechar o diálogo',
  de: 'Dialog schließen',
  it: 'Chiudi la finestra',
};
const R_CANCELAR: L5 = {
  fr: 'Annuler',
  en: 'Cancel',
  pt: 'Cancelar',
  de: 'Abbrechen',
  it: 'Annulla',
};
const R_ERRO_LISTA: L5 = {
  fr: "La liste des projets n'a pas pu être chargée.",
  en: 'The list of projects could not be loaded.',
  pt: 'Não foi possível carregar a lista de projetos.',
  de: 'Die Projektliste konnte nicht geladen werden.',
  it: "Non è stato possibile caricare l'elenco dei progetti.",
};
const R_ERRO_TITULO: L5 = {
  fr: 'Chargement impossible',
  en: 'Loading failed',
  pt: 'Não foi possível carregar',
  de: 'Laden nicht möglich',
  it: 'Caricamento impossibile',
};

function AmostraModal({ lang }: { lang: AbilLang }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <BotaoFb
        accao={{
          rotulo: t5(
            {
              fr: 'Ouvrir le dialogue',
              en: 'Open the dialog',
              pt: 'Abrir o diálogo',
              de: 'Dialog öffnen',
              it: 'Apri la finestra',
            },
            lang,
          ),
          onAccao: () => setAberto(true),
        }}
      />
      <AdModal
        aberto={aberto}
        titulo={t5(
          {
            fr: 'Nouvelle entrée',
            en: 'New entry',
            pt: 'Nova entrada',
            de: 'Neuer Eintrag',
            it: 'Nuova voce',
          },
          lang,
        )}
        descricao={t5(
          {
            fr: "Le dialogue rend le focus au bouton qui l'a ouvert.",
            en: 'The dialog gives focus back to the button that opened it.',
            pt: 'O diálogo devolve o foco ao botão que o abriu.',
            de: 'Der Dialog gibt den Fokus an die Schaltfläche zurück, die ihn geöffnet hat.',
            it: "La finestra restituisce il focus al pulsante che l'ha aperta.",
          },
          lang,
        )}
        rotuloFechar={t5(R_FECHAR_DIALOGO, lang)}
        onFechar={() => setAberto(false)}
        rodape={
          <>
            <BotaoFb
              accao={{
                rotulo: t5(R_CANCELAR, lang),
                onAccao: () => setAberto(false),
                tom: 'discreta',
              }}
            />
            <BotaoFb
              accao={{
                rotulo: t5(
                  {
                    fr: 'Enregistrer',
                    en: 'Save',
                    pt: 'Guardar',
                    de: 'Speichern',
                    it: 'Salva',
                  },
                  lang,
                ),
                onAccao: () => setAberto(false),
              }}
            />
          </>
        }
      >
        <p className="ad-fb-modal-desc">
          {t5(
            {
              fr: "Échap ferme, Tab reste dedans, le fond s'assombrit sans flou.",
              en: 'Escape closes, Tab stays inside, the background darkens without blur.',
              pt: 'Escape fecha, Tab fica cá dentro, o fundo escurece sem desfoque.',
              de: 'Escape schließt, Tab bleibt drinnen, der Hintergrund dunkelt ohne Weichzeichner ab.',
              it: 'Esc chiude, Tab resta dentro, lo sfondo si scurisce senza sfocatura.',
            },
            lang,
          )}
        </p>
      </AdModal>
    </>
  );
}

function AmostraConfirmacao(props: { lang: AbilLang; comErro?: boolean; lento?: boolean }) {
  const { lang } = props;
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
                                                                                     
                                                                      
  const rConfirmar: L5 = {
    fr: 'Supprimer le projet',
    en: 'Delete the project',
    pt: 'Apagar o projeto',
    de: 'Projekt löschen',
    it: 'Elimina il progetto',
  };
  return (
    <>
      <BotaoFb
        accao={{
          rotulo: t5(
            {
              fr: 'Supprimer un projet',
              en: 'Delete a project',
              pt: 'Apagar um projeto',
              de: 'Ein Projekt löschen',
              it: 'Elimina un progetto',
            },
            lang,
          ),
          onAccao: () => setAberto(true),
          tom: 'discreta',
        }}
      />
      <AdModalConfirmacao
        aberto={aberto}
        titulo={t5(rConfirmar, lang)}
        descricao={t5(
          {
            fr: 'Le projet et ses 24 fichiers seront retirés du panneau. Cette action est définitive.',
            en: 'The project and its 24 files will be removed from the panel. This action is final.',
            pt: 'O projeto e os seus 24 ficheiros vão ser retirados do painel. Esta ação é definitiva.',
            de: 'Das Projekt und seine 24 Dateien werden aus dem Panel entfernt. Diese Aktion ist endgültig.',
            it: 'Il progetto e i suoi 24 file verranno rimossi dal pannello. Questa azione è definitiva.',
          },
          lang,
        )}
                                                                                
                                                                    
        objecto="Chalet Verbier, 2026"
        rotuloConfirmar={t5(rConfirmar, lang)}
        rotuloCancelar={t5(R_CANCELAR, lang)}
        rotuloFechar={t5(R_FECHAR_DIALOGO, lang)}
        ocupado={ocupado}
        rotuloOcupado={t5(
          {
            fr: 'Suppression en cours',
            en: 'Deleting',
            pt: 'A apagar',
            de: 'Wird gelöscht',
            it: 'Eliminazione in corso',
          },
          lang,
        )}
        erro={
          props.comErro
            ? t5(
                {
                  fr: 'Le serveur a refusé la suppression (403).',
                  en: 'The server refused the deletion (403).',
                  pt: 'O servidor recusou a eliminação (403).',
                  de: 'Der Server hat die Löschung abgelehnt (403).',
                  it: "Il server ha rifiutato l'eliminazione (403).",
                },
                lang,
              )
            : undefined
        }
        rotuloErro={
          props.comErro
            ? t5(
                {
                  fr: 'Échec',
                  en: 'Failed',
                  pt: 'Falha',
                  de: 'Fehlgeschlagen',
                  it: 'Errore',
                },
                lang,
              )
            : undefined
        }
        onConfirmar={() => {
          if (!props.lento) {
            setAberto(false);
            return;
          }
          setOcupado(true);
          window.setTimeout(() => {
            setOcupado(false);
            setAberto(false);
          }, 2200);
        }}
        onCancelar={() => setAberto(false)}
      />
    </>
  );
}

function AmostraNotificacao(props: {
  lang: AbilLang;
  tom: AdTomNota;
  duracaoMs?: number | null;
  comAccao?: boolean;
}) {
  const { lang } = props;
  const [visivel, setVisivel] = useState(true);
  const rotulos: Record<AdTomNota, [L5, L5]> = {
    informacao: [
      { fr: 'Information', en: 'Information', pt: 'Informação', de: 'Information', it: 'Informazione' },
      {
        fr: 'La synchronisation tourne en arrière-plan.',
        en: 'The sync is running in the background.',
        pt: 'A sincronização está a correr em segundo plano.',
        de: 'Die Synchronisierung läuft im Hintergrund.',
        it: 'La sincronizzazione gira in secondo piano.',
      },
    ],
    confirmacao: [
      { fr: 'Enregistré', en: 'Saved', pt: 'Guardado', de: 'Gespeichert', it: 'Salvato' },
      {
        fr: 'Le projet a été publié sur le site.',
        en: 'The project has been published on the site.',
        pt: 'O projeto foi publicado no site.',
        de: 'Das Projekt wurde auf der Website veröffentlicht.',
        it: 'Il progetto è stato pubblicato sul sito.',
      },
    ],
    atencao: [
      { fr: 'Attention', en: 'Warning', pt: 'Atenção', de: 'Achtung', it: 'Attenzione' },
      {
        fr: 'Deux images dépassent 4 Mo et ralentissent la page.',
        en: 'Two images are over 4 MB and are slowing the page down.',
        pt: 'Duas imagens passam dos 4 MB e estão a abrandar a página.',
        de: 'Zwei Bilder überschreiten 4 MB und bremsen die Seite aus.',
        it: 'Due immagini superano i 4 MB e rallentano la pagina.',
      },
    ],
    erro: [
      { fr: 'Échec', en: 'Failed', pt: 'Falha', de: 'Fehlgeschlagen', it: 'Errore' },
      {
        fr: "L'envoi du courriel a échoué après trois tentatives.",
        en: 'Sending the email failed after three attempts.',
        pt: 'O envio do e-mail falhou ao fim de três tentativas.',
        de: 'Der Versand der E-Mail ist nach drei Versuchen fehlgeschlagen.',
        it: "L'invio dell'e-mail è fallito dopo tre tentativi.",
      },
    ],
  };
  const [etiqueta, mensagem] = rotulos[props.tom];
  return (
    <AdNotificacoes
      rotulo={t5(
        {
          fr: 'Notifications',
          en: 'Notifications',
          pt: 'Notificações',
          de: 'Benachrichtigungen',
          it: 'Notifiche',
        },
        lang,
      )}
      ancorada={false}
    >
      {visivel ? (
        <AdNotificacao
          tom={props.tom}
          etiqueta={t5(etiqueta, lang)}
          mensagem={t5(mensagem, lang)}
          duracaoMs={props.duracaoMs === undefined ? null : props.duracaoMs}
          accao={props.comAccao ? { rotulo: t5(R_REPETIR, lang), onAccao: nada } : undefined}
          rotuloFechar={t5(
            {
              fr: 'Fermer la notification',
              en: 'Close the notification',
              pt: 'Fechar a notificação',
              de: 'Benachrichtigung schließen',
              it: 'Chiudi la notifica',
            },
            lang,
          )}
          onFim={() => setVisivel(false)}
        />
      ) : (
        <BotaoFb
          accao={{
            rotulo: t5(
              {
                fr: 'Rejouer',
                en: 'Play again',
                pt: 'Repetir',
                de: 'Nochmal abspielen',
                it: 'Riproduci di nuovo',
              },
              lang,
            ),
            onAccao: () => setVisivel(true),
            tom: 'discreta',
          }}
        />
      )}
    </AdNotificacoes>
  );
}

                                                                                      
                                                                             
// eslint-disable-next-line react-refresh/only-export-components
export const AMOSTRAS: Amostra[] = [
  {
    nome: {
      fr: 'Vide, rien encore',
      en: 'Empty, nothing yet',
      pt: 'Vazio, ainda nada',
      de: 'Leer, noch nichts',
      it: 'Vuoto, ancora niente',
    },
    nota: {
      fr: "Première fois. Dit que la liste est vide parce que rien n'a encore été créé, et donne le chemin.",
      en: 'First time. Says the list is empty because nothing has been created yet, and points the way.',
      pt: 'Primeira vez. Diz que a lista está vazia porque ainda não se criou nada, e dá o caminho.',
      de: 'Erstes Mal. Sagt, dass die Liste leer ist, weil noch nichts angelegt wurde, und zeigt den Weg.',
      it: "Prima volta. Dice che l'elenco è vuoto perché non è ancora stato creato nulla, e indica la strada.",
    },
    exemplo: (lang) => (
      <AdVazio
        variante="ainda-nada"
        eyebrow={t5(
          { fr: 'Projets', en: 'Projects', pt: 'Projetos', de: 'Projekte', it: 'Progetti' },
          lang,
        )}
        titulo={t5(
          {
            fr: "Aucun projet pour l'instant",
            en: 'No projects yet',
            pt: 'Ainda não há projetos',
            de: 'Noch keine Projekte',
            it: 'Nessun progetto per ora',
          },
          lang,
        )}
        descricao={t5(
          {
            fr: "Rien n'a encore été créé dans cet espace. Le premier projet apparaîtra ici dès qu'il sera enregistré.",
            en: 'Nothing has been created in this space yet. The first project will appear here as soon as it is saved.',
            pt: 'Ainda não foi criado nada neste espaço. O primeiro projeto aparece aqui assim que for guardado.',
            de: 'In diesem Bereich wurde noch nichts angelegt. Das erste Projekt erscheint hier, sobald es gespeichert ist.',
            it: 'In questo spazio non è ancora stato creato nulla. Il primo progetto comparirà qui appena verrà salvato.',
          },
          lang,
        )}
        accao={{
          rotulo: t5(
            {
              fr: 'Créer un projet',
              en: 'Create a project',
              pt: 'Criar um projeto',
              de: 'Projekt anlegen',
              it: 'Crea un progetto',
            },
            lang,
          ),
          onAccao: nada,
        }}
      />
    ),
  },
  {
    nome: {
      fr: 'Vide, filtre sans résultats',
      en: 'Empty, filter with no results',
      pt: 'Vazio, filtro sem resultados',
      de: 'Leer, Filter ohne Treffer',
      it: 'Vuoto, filtro senza risultati',
    },
    nota: {
      fr: "Les données existent, c'est le filtre qui ne rend rien. Montre les filtres actifs et propose de les effacer.",
      en: 'The data is still there, it is the filter that returns nothing. Shows the active filters and offers to clear them.',
      pt: 'Há dados, o filtro é que não devolve nada. Mostra os filtros ativos e oferece limpá-los.',
      de: 'Die Daten sind da, nur der Filter liefert nichts. Zeigt die aktiven Filter und bietet an, sie zu löschen.',
      it: 'I dati ci sono, è il filtro che non restituisce niente. Mostra i filtri attivi e propone di cancellarli.',
    },
    exemplo: (lang) => (
      <AdVazio
        variante="filtro-sem-resultados"
        titulo={t5(
          {
            fr: 'Aucun résultat',
            en: 'No results',
            pt: 'Sem resultados',
            de: 'Keine Ergebnisse',
            it: 'Nessun risultato',
          },
          lang,
        )}
        descricao={t5(
          {
            fr: "Les 42 projets existent toujours: la combinaison de filtres actuelle n'en retient aucun.",
            en: 'The 42 projects are all still there: the current combination of filters keeps none of them.',
            pt: 'Os 42 projetos continuam lá: a combinação de filtros atual não retém nenhum.',
            de: 'Die 42 Projekte sind weiterhin da: die aktuelle Filterkombination behält keines davon.',
            it: 'I 42 progetti ci sono ancora tutti: la combinazione di filtri attuale non ne trattiene nessuno.',
          },
          lang,
        )}
        rotuloFiltros={t5(
          {
            fr: 'Filtres actifs',
            en: 'Active filters',
            pt: 'Filtros ativos',
            de: 'Aktive Filter',
            it: 'Filtri attivi',
          },
          lang,
        )}
        filtros={[
          t5({ fr: 'Année 2019', en: 'Year 2019', pt: 'Ano 2019', de: 'Jahr 2019', it: 'Anno 2019' }, lang),
          t5(
            {
              fr: 'Client Nestlé',
              en: 'Client Nestlé',
              pt: 'Cliente Nestlé',
              de: 'Kunde Nestlé',
              it: 'Cliente Nestlé',
            },
            lang,
          ),
          t5(
            {
              fr: 'Statut archivé',
              en: 'Status archived',
              pt: 'Estado arquivado',
              de: 'Status archiviert',
              it: 'Stato archiviato',
            },
            lang,
          ),
        ]}
        accao={{
          rotulo: t5(
            {
              fr: 'Effacer les filtres',
              en: 'Clear the filters',
              pt: 'Limpar os filtros',
              de: 'Filter zurücksetzen',
              it: 'Cancella i filtri',
            },
            lang,
          ),
          onAccao: nada,
        }}
        accaoSecundaria={{
          rotulo: t5(
            {
              fr: 'Retirer le dernier',
              en: 'Remove the last one',
              pt: 'Remover o último',
              de: 'Letzten entfernen',
              it: "Rimuovi l'ultimo",
            },
            lang,
          ),
          onAccao: nada,
        }}
      />
    ),
  },
  {
    nome: {
      fr: 'Vide, non configuré',
      en: 'Empty, not configured',
      pt: 'Vazio, não configurado',
      de: 'Leer, nicht konfiguriert',
      it: 'Vuoto, non configurato',
    },
    nota: {
      fr: "La règle de la maison: dit le nom EXACT de la clé qui manque et où elle se définit. Sans capitales forcées.",
      en: 'The house rule: it says the EXACT name of the key that is missing and where it is set. No forced uppercase.',
      pt: 'A regra da casa: diz o nome EXATO da chave que falta e onde se define. Sem caixa alta forçada.',
      de: 'Die Hausregel: nennt den EXAKTEN Namen des fehlenden Schlüssels und wo er gesetzt wird. Ohne erzwungene Großschreibung.',
      it: 'La regola della casa: dice il nome ESATTO della chiave che manca e dove si definisce. Senza maiuscole forzate.',
    },
    exemplo: (lang) => (
      <AdVazio
        variante="nao-configurado"
        eyebrow={t5(
          { fr: 'Courriel', en: 'Email', pt: 'E-mail', de: 'E-Mail', it: 'E-mail' },
          lang,
        )}
        titulo={t5(
          {
            fr: 'Service non configuré',
            en: 'Service not configured',
            pt: 'Serviço não configurado',
            de: 'Dienst nicht konfiguriert',
            it: 'Servizio non configurato',
          },
          lang,
        )}
        descricao={t5(
          {
            fr: "Le panneau ne peut pas envoyer de courriel tant que la clé du service n'est pas définie. Rien n'est en panne: il manque une variable.",
            en: 'The panel cannot send email until the key for the service is set. Nothing is broken: a variable is missing.',
            pt: 'O painel não consegue enviar e-mail enquanto a chave do serviço não estiver definida. Não há nada avariado: falta uma variável.',
            de: 'Das Panel kann keine E-Mail versenden, solange der Schlüssel des Dienstes nicht gesetzt ist. Nichts ist kaputt: es fehlt eine Variable.',
            it: 'Il pannello non può inviare e-mail finché la chiave del servizio non è definita. Non è rotto niente: manca una variabile.',
          },
          lang,
        )}
        rotuloChave={t5(
          {
            fr: 'Variable manquante',
            en: 'Missing variable',
            pt: 'Variável em falta',
            de: 'Fehlende Variable',
            it: 'Variabile mancante',
          },
          lang,
        )}
                                                                                        
                                                                                          
        chave="RESEND_API_KEY"
                                                                                      
                                                                      
        onde="Vercel, Settings, Environment Variables"
        accao={{
          rotulo: t5(
            {
              fr: 'Voir la procédure',
              en: 'See the procedure',
              pt: 'Ver o procedimento',
              de: 'Anleitung ansehen',
              it: 'Vedi la procedura',
            },
            lang,
          ),
          onAccao: nada,
        }}
      />
    ),
  },
  {
    nome: {
      fr: 'Chargement, texte',
      en: 'Loading, text',
      pt: 'A carregar, texto',
      de: 'Laden, Text',
      it: 'Caricamento, testo',
    },
    nota: {
      fr: "Trois lignes, la dernière courte. Blocs à la couleur du filet, pulsation d'opacité, sans reflet qui passe.",
      en: 'Three lines, the last one short. Blocks in the hairline colour, opacity pulse, with no shimmer sweeping across.',
      pt: 'Três linhas, a última curta. Blocos na cor da linha, pulso de opacidade, sem brilho a passar.',
      de: 'Drei Zeilen, die letzte kurz. Blöcke in der Linienfarbe, Puls über die Deckkraft, ohne durchlaufenden Glanz.',
      it: "Tre righe, l'ultima corta. Blocchi nel colore del filetto, pulsazione di opacità, senza riflesso che scorre.",
    },
    exemplo: (lang) => (
      <AdCarregando
        forma="texto"
        linhas={3}
        rotulo={t5(
          {
            fr: 'Chargement du texte',
            en: 'Loading the text',
            pt: 'A carregar o texto',
            de: 'Text wird geladen',
            it: 'Caricamento del testo',
          },
          lang,
        )}
      />
    ),
  },
  {
    nome: {
      fr: 'Chargement, tableau',
      en: 'Loading, table',
      pt: 'A carregar, tabela',
      de: 'Laden, Tabelle',
      it: 'Caricamento, tabella',
    },
    nota: {
      fr: "Quatre rangées séparées par un filet, première colonne plus large parce que c'est le nom.",
      en: 'Four rows separated by a hairline, first column wider because that is where the name goes.',
      pt: 'Quatro filas separadas por hairline, primeira coluna mais larga porque é o nome.',
      de: 'Vier Reihen durch eine Haarlinie getrennt, erste Spalte breiter, weil dort der Name steht.',
      it: 'Quattro righe separate da un filetto, prima colonna più larga perché è il nome.',
    },
    exemplo: (lang) => (
      <AdCarregando
        forma="tabela"
        linhas={4}
        colunas={4}
        rotulo={t5(
          {
            fr: 'Chargement des projets',
            en: 'Loading the projects',
            pt: 'A carregar os projetos',
            de: 'Projekte werden geladen',
            it: 'Caricamento dei progetti',
          },
          lang,
        )}
      />
    ),
  },
  {
    nome: {
      fr: 'Chargement, cartes',
      en: 'Loading, cards',
      pt: 'A carregar, cartões',
      de: 'Laden, Karten',
      it: 'Caricamento, schede',
    },
    nota: {
      fr: 'Grille qui suit la grille réelle: visuel, titre et métadonnée.',
      en: 'A grid that follows the real grid: visual, title and metadata.',
      pt: 'Grelha que acompanha a grelha real: visual, título e metadado.',
      de: 'Ein Raster, das dem echten Raster folgt: Bild, Titel und Metadatum.',
      it: 'Griglia che segue la griglia reale: visual, titolo e metadato.',
    },
    exemplo: (lang) => (
      <AdCarregando
        forma="cartoes"
        linhas={3}
        rotulo={t5(
          {
            fr: 'Chargement de la grille',
            en: 'Loading the grid',
            pt: 'A carregar a grelha',
            de: 'Raster wird geladen',
            it: 'Caricamento della griglia',
          },
          lang,
        )}
      />
    ),
  },
  {
    nome: {
      fr: 'Chargement, ligne',
      en: 'Loading, line',
      pt: 'A carregar, linha',
      de: 'Laden, Zeile',
      it: 'Caricamento, riga',
    },
    nota: {
      fr: "Une seule barre, pour l'intérieur d'une cellule ou d'une carte qui existe déjà.",
      en: 'A single bar, for inside a cell or a card that already exists.',
      pt: 'Uma só barra, para dentro de uma célula ou de um cartão que já existe.',
      de: 'Nur ein Balken, für eine Zelle oder eine Karte, die es schon gibt.',
      it: "Una sola barra, per l'interno di una cella o di una scheda che esiste già.",
    },
    exemplo: (lang) => (
      <AdCarregando
        forma="linha"
        rotulo={t5(
          {
            fr: 'Chargement de la valeur',
            en: 'Loading the value',
            pt: 'A carregar o valor',
            de: 'Wert wird geladen',
            it: 'Caricamento del valore',
          },
          lang,
        )}
      />
    ),
  },
  {
    nome: {
      fr: 'Erreur simple',
      en: 'Simple error',
      pt: 'Erro simples',
      de: 'Einfacher Fehler',
      it: 'Errore semplice',
    },
    nota: {
      fr: "Seulement ce qu'on sait: titre et message. Sans cause inventée et sans bouton réessayer quand réessayer ne résout rien.",
      en: 'Only what is known: title and message. No invented cause and no retry button when retrying cannot fix anything.',
      pt: 'Só o que se sabe: título e mensagem. Sem causa inventada e sem botão de repetir quando repetir não resolve.',
      de: 'Nur was bekannt ist: Titel und Meldung. Keine erfundene Ursache und keine Schaltfläche zum Wiederholen, wenn Wiederholen nichts löst.',
      it: 'Solo quello che si sa: titolo e messaggio. Senza causa inventata e senza pulsante riprova quando riprovare non risolve niente.',
    },
    exemplo: (lang) => (
      <AdErro titulo={t5(R_ERRO_TITULO, lang)} mensagem={t5(R_ERRO_LISTA, lang)} />
    ),
  },
  {
    nome: {
      fr: 'Erreur avec cause et nouvel essai',
      en: 'Error with cause and retry',
      pt: 'Erro com causa e nova tentativa',
      de: 'Fehler mit Ursache und neuem Versuch',
      it: 'Errore con causa e nuovo tentativo',
    },
    nota: {
      fr: "La cause passe en encre pleine parce qu'elle n'est dite nulle part ailleurs.",
      en: 'The cause goes in full ink because it is not said anywhere else.',
      pt: 'A causa vai em tinta cheia porque não está dita em mais lado nenhum.',
      de: 'Die Ursache steht in voller Tinte, weil sie nirgendwo sonst genannt wird.',
      it: "La causa va in inchiostro pieno perché non è detta da nessun'altra parte.",
    },
    exemplo: (lang) => (
      <AdErro
        titulo={t5(R_ERRO_TITULO, lang)}
        mensagem={t5(R_ERRO_LISTA, lang)}
        rotuloCausa={t5(R_CAUSA, lang)}
        causa={t5(
          {
            fr: 'Le serveur a répondu 504 après 30 secondes.',
            en: 'The server answered 504 after 30 seconds.',
            pt: 'O servidor respondeu 504 ao fim de 30 segundos.',
            de: 'Der Server hat nach 30 Sekunden mit 504 geantwortet.',
            it: 'Il server ha risposto 504 dopo 30 secondi.',
          },
          lang,
        )}
        accao={{ rotulo: t5(R_REPETIR, lang), onAccao: nada }}
      />
    ),
  },
  {
    nome: {
      fr: 'Erreur avec détail technique',
      en: 'Error with technical detail',
      pt: 'Erro com detalhe técnico',
      de: 'Fehler mit technischem Detail',
      it: 'Errore con dettaglio tecnico',
    },
    nota: {
      fr: "Le détail vit dans un pli qui anime grid-template-rows, il s'ouvre avec le + et se ferme avec le trait.",
      en: 'The detail lives in a fold that animates grid-template-rows, opening with the + and closing with the dash.',
      pt: 'O detalhe vive numa dobra que anima grid-template-rows, e abre com + e fecha com o traço.',
      de: 'Das Detail liegt in einer Falte, die grid-template-rows animiert, sie öffnet mit dem + und schließt mit dem Strich.',
      it: 'Il dettaglio vive in una piega che anima grid-template-rows, si apre con il + e si chiude con il trattino.',
    },
    exemplo: (lang) => (
      <AdErro
        titulo={t5(
          {
            fr: 'Envoi refusé',
            en: 'Send refused',
            pt: 'Envio recusado',
            de: 'Versand abgelehnt',
            it: 'Invio rifiutato',
          },
          lang,
        )}
        mensagem={t5(
          {
            fr: "Le courriel n'est pas parti.",
            en: 'The email did not go out.',
            pt: 'O e-mail não chegou a sair.',
            de: 'Die E-Mail ist nicht rausgegangen.',
            it: "L'e-mail non è partita.",
          },
          lang,
        )}
        rotuloCausa={t5(R_CAUSA, lang)}
        causa={t5(
          {
            fr: 'La clé du service a été révoquée.',
            en: 'The key for the service has been revoked.',
            pt: 'A chave do serviço foi revogada.',
            de: 'Der Schlüssel des Dienstes wurde widerrufen.',
            it: 'La chiave del servizio è stata revocata.',
          },
          lang,
        )}
        rotuloDetalhe={t5(
          {
            fr: 'Détail technique',
            en: 'Technical detail',
            pt: 'Detalhe técnico',
            de: 'Technisches Detail',
            it: 'Dettaglio tecnico',
          },
          lang,
        )}
                                                                                           
                                                                            
        detalhe={'POST /api/send\n401 Unauthorized\n{"error":"api_key_revoked"}'}
        accao={{ rotulo: t5(R_REPETIR, lang), onAccao: nada }}
      />
    ),
  },
  {
    nome: {
      fr: 'Erreur compacte',
      en: 'Compact error',
      pt: 'Erro compacto',
      de: 'Kompakter Fehler',
      it: 'Errore compatto',
    },
    nota: {
      fr: "Une ligne, pour l'intérieur d'une carte ou d'une cellule de tableau.",
      en: 'One line, for inside a card or a table cell.',
      pt: 'Uma linha, para dentro de um cartão ou de uma célula de tabela.',
      de: 'Eine Zeile, für eine Karte oder eine Tabellenzelle.',
      it: "Una riga, per l'interno di una scheda o di una cella di tabella.",
    },
    exemplo: (lang) => (
      <AdErro
        compacto
        titulo={t5(
          {
            fr: 'Miniature absente',
            en: 'Thumbnail missing',
            pt: 'Miniatura em falta',
            de: 'Vorschaubild fehlt',
            it: 'Miniatura assente',
          },
          lang,
        )}
        mensagem={t5(
          {
            fr: 'Le fichier source a été déplacé.',
            en: 'The source file has been moved.',
            pt: 'O ficheiro de origem foi movido.',
            de: 'Die Quelldatei wurde verschoben.',
            it: 'Il file di origine è stato spostato.',
          },
          lang,
        )}
        accao={{ rotulo: t5(R_REPETIR, lang), onAccao: nada, tom: 'discreta' }}
      />
    ),
  },
  {
    nome: {
      fr: 'Avis, information',
      en: 'Notice, information',
      pt: 'Aviso, informação',
      de: 'Hinweis, Information',
      it: 'Avviso, informazione',
    },
    nota: {
      fr: 'Point Noir et le mot à côté. La couleur ne porte jamais le sens toute seule.',
      en: 'Noir dot with the word beside it. Colour never carries the meaning on its own.',
      pt: 'Ponto Noir e a palavra ao lado. A cor nunca carrega o sentido sozinha.',
      de: 'Noir-Punkt und das Wort daneben. Die Farbe trägt die Bedeutung nie allein.',
      it: 'Punto Noir e la parola accanto. Il colore non porta mai il senso da solo.',
    },
    exemplo: (lang) => (
      <AdAviso
        tom="informacao"
        etiqueta={t5(
          {
            fr: 'Information',
            en: 'Information',
            pt: 'Informação',
            de: 'Information',
            it: 'Informazione',
          },
          lang,
        )}
        mensagem={t5(
          {
            fr: 'Les modifications sont enregistrées automatiquement toutes les deux minutes.',
            en: 'Changes are saved automatically every two minutes.',
            pt: 'As alterações são guardadas automaticamente de dois em dois minutos.',
            de: 'Änderungen werden alle zwei Minuten automatisch gespeichert.',
            it: 'Le modifiche vengono salvate automaticamente ogni due minuti.',
          },
          lang,
        )}
      />
    ),
  },
  {
    nome: {
      fr: 'Avis, attention',
      en: 'Notice, warning',
      pt: 'Aviso, atenção',
      de: 'Hinweis, Achtung',
      it: 'Avviso, attenzione',
    },
    nota: {
      fr: 'Violette signale. role alert, parce que ceci apparaît quand quelque chose change.',
      en: 'Violette flags it. role alert, because this shows up when something changes.',
      pt: 'Violette assinala. role alert, porque isto aparece quando algo muda.',
      de: 'Violette markiert. role alert, weil das erscheint, wenn sich etwas ändert.',
      it: 'Violette segnala. role alert, perché questo compare quando qualcosa cambia.',
    },
    exemplo: (lang) => (
      <AdAviso
        tom="atencao"
        etiqueta={t5(
          { fr: 'Attention', en: 'Warning', pt: 'Atenção', de: 'Achtung', it: 'Attenzione' },
          lang,
        )}
        mensagem={t5(
          {
            fr: "Trois projets n'ont pas de traduction allemande et resteront cachés sur le site.",
            en: 'Three projects have no German translation and will stay hidden on the site.',
            pt: 'Três projetos não têm tradução alemã e vão continuar escondidos no site.',
            de: 'Drei Projekte haben keine deutsche Übersetzung und bleiben auf der Website verborgen.',
            it: 'Tre progetti non hanno la traduzione tedesca e resteranno nascosti sul sito.',
          },
          lang,
        )}
        accao={{
          rotulo: t5(
            {
              fr: 'Voir les trois',
              en: 'See the three',
              pt: 'Ver os três',
              de: 'Die drei ansehen',
              it: 'Vedi i tre',
            },
            lang,
          ),
          onAccao: nada,
        }}
      />
    ),
  },
  {
    nome: {
      fr: 'Avis, confirmation',
      en: 'Notice, confirmation',
      pt: 'Aviso, confirmação',
      de: 'Hinweis, Bestätigung',
      it: 'Avviso, conferma',
    },
    nota: {
      fr: "Citron sur le point, décision du briefing. Il reste sur le point et ne devient jamais une surface de lecture.",
      en: 'Citron on the dot, a briefing decision. It stays on the dot and never becomes a reading surface.',
      pt: 'Citron no ponto, decisão do briefing. Fica no ponto e nunca vira superfície de leitura.',
      de: 'Citron auf dem Punkt, eine Entscheidung aus dem Briefing. Es bleibt auf dem Punkt und wird nie zur Lesefläche.',
      it: 'Citron sul punto, decisione del briefing. Resta sul punto e non diventa mai una superficie di lettura.',
    },
    exemplo: (lang) => (
      <AdAviso
        tom="confirmacao"
        etiqueta={t5(
          { fr: 'Enregistré', en: 'Saved', pt: 'Guardado', de: 'Gespeichert', it: 'Salvato' },
          lang,
        )}
        mensagem={t5(
          {
            fr: 'La fiche a été publiée dans les cinq langues.',
            en: 'The entry has been published in all five languages.',
            pt: 'A ficha foi publicada nas cinco línguas.',
            de: 'Der Eintrag wurde in allen fünf Sprachen veröffentlicht.',
            it: 'La scheda è stata pubblicata in tutte e cinque le lingue.',
          },
          lang,
        )}
        onFechar={nada}
        rotuloFechar={t5(
          {
            fr: "Fermer l'avis",
            en: 'Close the notice',
            pt: 'Fechar o aviso',
            de: 'Hinweis schließen',
            it: "Chiudi l'avviso",
          },
          lang,
        )}
      />
    ),
  },
  {
    nome: {
      fr: 'Dialogue',
      en: 'Dialog',
      pt: 'Modal',
      de: 'Dialog',
      it: 'Finestra di dialogo',
    },
    nota: {
      fr: 'Focus piégé, Échap ferme, focus rendu au bouton qui a ouvert, aria-modal, voile sans flou.',
      en: 'Focus trapped, Escape closes, focus given back to the button that opened it, aria-modal, veil without blur.',
      pt: 'Foco preso, Escape a fechar, foco devolvido ao botão que abriu, aria-modal, véu sem desfoque.',
      de: 'Fokus gefangen, Escape schließt, Fokus zurück an die öffnende Schaltfläche, aria-modal, Schleier ohne Weichzeichner.',
      it: 'Focus intrappolato, Esc chiude, focus restituito al pulsante che ha aperto, aria-modal, velo senza sfocatura.',
    },
    exemplo: (lang) => <AmostraModal lang={lang} />,
  },
  {
    nome: {
      fr: 'Dialogue de confirmation, irréversible',
      en: 'Confirmation dialog, irreversible',
      pt: 'Modal de confirmação, irreversível',
      de: 'Bestätigungsdialog, unwiderruflich',
      it: 'Finestra di conferma, irreversibile',
    },
    nota: {
      fr: 'Le bouton dit "Supprimer le projet" et non "Confirmer". Annuler vient en premier et prend le focus initial.',
      en: 'The button says "Delete the project", not "Confirm". Cancel comes first and takes the initial focus.',
      pt: 'O botão diz "Apagar o projeto" e não "Confirmar". Cancelar vem primeiro e leva o foco inicial.',
      de: 'Die Schaltfläche sagt "Projekt löschen" und nicht "Bestätigen". Abbrechen steht zuerst und bekommt den ersten Fokus.',
      it: 'Il pulsante dice "Elimina il progetto" e non "Conferma". Annulla viene prima e prende il focus iniziale.',
    },
    exemplo: (lang) => <AmostraConfirmacao lang={lang} />,
  },
  {
    nome: {
      fr: 'Dialogue de confirmation, en cours',
      en: 'Confirmation dialog, running',
      pt: 'Modal de confirmação, a executar',
      de: 'Bestätigungsdialog, läuft gerade',
      it: 'Finestra di conferma, in esecuzione',
    },
    nota: {
      fr: 'Occupé: étiquette changée, curseur progress, et ni Échap ni le voile ne ferment pendant que ça tourne.',
      en: 'Busy: label swapped, progress cursor, and neither Escape nor the veil closes while it runs.',
      pt: 'Ocupado: rótulo trocado, cursor progress, e nem Escape nem o véu fecham enquanto corre.',
      de: 'Beschäftigt: Beschriftung getauscht, Cursor progress, und weder Escape noch der Schleier schließen, solange es läuft.',
      it: 'Occupato: etichetta sostituita, cursore progress, e né Esc né il velo chiudono mentre gira.',
    },
    exemplo: (lang) => <AmostraConfirmacao lang={lang} lento />,
  },
  {
    nome: {
      fr: "Dialogue de confirmation, l'action a échoué",
      en: 'Confirmation dialog, the action failed',
      pt: 'Modal de confirmação, a ação falhou',
      de: 'Bestätigungsdialog, die Aktion ist fehlgeschlagen',
      it: "Finestra di conferma, l'azione è fallita",
    },
    nota: {
      fr: "L'échec reste dans le dialogue, avec le vrai code. Le dialogue ne se ferme pas en faisant semblant que tout s'est bien passé.",
      en: 'The failure stays inside the dialog, with the real code. The dialog does not close pretending it went well.',
      pt: 'A falha fica dentro do diálogo, com o código real. O diálogo não se fecha a fingir que correu bem.',
      de: 'Der Fehler bleibt im Dialog, mit dem echten Code. Der Dialog schließt sich nicht und tut so, als wäre alles gut gegangen.',
      it: "L'errore resta dentro la finestra, con il codice vero. La finestra non si chiude fingendo che sia andata bene.",
    },
    exemplo: (lang) => <AmostraConfirmacao lang={lang} comErro />,
  },
  {
    nome: {
      fr: 'Notification, information',
      en: 'Notification, information',
      pt: 'Notificação, informação',
      de: 'Benachrichtigung, Information',
      it: 'Notifica, informazione',
    },
    nota: {
      fr: "Entre et sort par transform. Passer la souris dessus arrête l'horloge.",
      en: 'Comes in and goes out by transform. Hovering with the mouse stops the clock.',
      pt: 'Entra e sai por transform. Passar o rato por cima para o relógio.',
      de: 'Kommt und geht per transform. Die Maus darüber hält die Uhr an.',
      it: "Entra ed esce con transform. Passare il mouse sopra ferma l'orologio.",
    },
    exemplo: (lang) => <AmostraNotificacao lang={lang} tom="informacao" duracaoMs={6000} />,
  },
  {
    nome: {
      fr: 'Notification, confirmation',
      en: 'Notification, confirmation',
      pt: 'Notificação, confirmação',
      de: 'Benachrichtigung, Bestätigung',
      it: 'Notifica, conferma',
    },
    nota: {
      fr: 'Point Citron. Elle sort toute seule au bout de six secondes.',
      en: 'Citron dot. It leaves on its own after six seconds.',
      pt: 'Ponto Citron. Sai sozinha ao fim de seis segundos.',
      de: 'Citron-Punkt. Sie verschwindet nach sechs Sekunden von selbst.',
      it: 'Punto Citron. Esce da sola dopo sei secondi.',
    },
    exemplo: (lang) => <AmostraNotificacao lang={lang} tom="confirmacao" duracaoMs={6000} />,
  },
  {
    nome: {
      fr: 'Notification, attention',
      en: 'Notification, warning',
      pt: 'Notificação, atenção',
      de: 'Benachrichtigung, Achtung',
      it: 'Notifica, attenzione',
    },
    nota: {
      fr: 'Violette et role alert.',
      en: 'Violette and role alert.',
      pt: 'Violette e role alert.',
      de: 'Violette und role alert.',
      it: 'Violette e role alert.',
    },
    exemplo: (lang) => <AmostraNotificacao lang={lang} tom="atencao" duracaoMs={6000} />,
  },
  {
    nome: {
      fr: 'Notification, erreur persistante',
      en: 'Notification, persistent error',
      pt: 'Notificação, erro persistente',
      de: 'Benachrichtigung, dauerhafter Fehler',
      it: 'Notifica, errore persistente',
    },
    nota: {
      fr: "Un échec ne disparaît pas tout seul: il reste jusqu'à ce qu'on le ferme et apporte l'action de réessayer.",
      en: 'A failure does not vanish on its own: it stays until it is closed and brings the retry action with it.',
      pt: 'Uma falha não desaparece sozinha: fica até ser fechada e traz a ação de repetir.',
      de: 'Ein Fehler verschwindet nicht von selbst: er bleibt, bis er geschlossen wird, und bringt die Aktion zum Wiederholen mit.',
      it: "Un errore non sparisce da solo: resta finché non viene chiuso e porta con sé l'azione di riprovare.",
    },
    exemplo: (lang) => <AmostraNotificacao lang={lang} tom="erro" comAccao />,
  },
];
