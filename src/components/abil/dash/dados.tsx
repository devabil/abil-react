                                                                         
                                                            

                                                                                      
                                                                                  
                                                                                     
                                                                                       

                                                         
                                                                                       
                                                                                       
                                                                                   
                                                                                   
                                                                                     
                                                                                     
                             
                                                                                   
                                                                                
                                                                                 
                                                                                  
                                                                                     
                                                                        
  

import { useId, useState, type ReactNode } from 'react'
import { type AbilLang } from '../../AbilSite'

                                                                                      
type L5 = Record<AbilLang, string>
const t5 = (o: L5, l: AbilLang) => o[l] || o.fr

                                                                               
                               
                                                                               

export type EstadoDados = 'pronto' | 'carregando' | 'vazio'

                                                                            
                                                                                  
                                                                         
export type Feedback = {
  carregando?: ReactNode
  vazio?: ReactNode
}

export type SentidoOrdem = 'asc' | 'desc'

                                                                               
                                                                   
                                                                               

const LARGURAS_ESQUELETO = ['72%', '54%', '63%', '45%', '68%'] as const

                                                                                         
function Barra({ i, altura }: { i: number; altura?: number }) {
  return (
    <span
      className="ad-dd-bar"
      style={{ width: LARGURAS_ESQUELETO[i % LARGURAS_ESQUELETO.length], height: altura }}
    />
  )
}

                                                                                      
                                           
function Varredura() {
  return <i className="ad-dd-varre" aria-hidden="true" />
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

                                                                               
         
                                                                               

export type ColunaTabela<T> = {
                                                                               
  chave: string
                           
  cabecalho: ReactNode
  celula: (linha: T) => ReactNode
                                                                                     
                                                                        
  largura?: string
                                                                                  
  numerica?: boolean
  ordenavel?: boolean
                                                                                    
                                                                  
  rotuloOrdem?: { asc: string; desc: string }
}

export type SeleccaoTabela<T> = {
  seleccionadas: readonly string[]
  onAlternar: (id: string, seleccionada: boolean) => void
                                                             
  rotuloLinha: (linha: T) => string
  onAlternarTodas?: (todas: boolean) => void
  rotuloTodas?: string
}

export type TabelaProps<T> = {
  colunas: ReadonlyArray<ColunaTabela<T>>
  linhas: readonly T[]
  idLinha: (linha: T) => string
                                                                              
  legenda: string
  legendaVisivel?: boolean
  ordem?: { chave: string; sentido: SentidoOrdem } | null
  onOrdenar?: (chave: string, sentido: SentidoOrdem) => void
  seleccao?: SeleccaoTabela<T>
                                                                                      
  alturaMax?: number | string
  linhasEsqueleto?: number
  estado?: EstadoDados
  feedback?: Feedback
}

export function Tabela<T>({
  colunas,
  linhas,
  idLinha,
  legenda,
  legendaVisivel,
  ordem,
  onOrdenar,
  seleccao,
  alturaMax,
  linhasEsqueleto = 5,
  estado = 'pronto',
  feedback,
}: TabelaProps<T>) {
  const nColunas = colunas.length + (seleccao ? 1 : 0)
  const ids = linhas.map(idLinha)
  const nSel = seleccao ? ids.filter((id) => seleccao.seleccionadas.includes(id)).length : 0
  const todas = nSel > 0 && nSel === ids.length
  const algumas = nSel > 0 && !todas

  return (
    <div className="ad-tab-wrap" style={alturaMax ? { maxHeight: alturaMax } : undefined}>
      <table className="ad-tab" aria-busy={estado === 'carregando' || undefined}>
        <caption className={legendaVisivel ? 'ad-tab-legenda' : 'ad-dd-vh'}>{legenda}</caption>
        <colgroup>
          {seleccao ? <col className="ad-tab-col-check" /> : null}
          {colunas.map((c) => (
            <col key={c.chave} style={c.largura ? { width: c.largura } : undefined} />
          ))}
        </colgroup>

        <thead>
          <tr>
            {seleccao ? (
              <th scope="col" className="ad-tab-cel-check">
                <input
                  type="checkbox"
                  className="ad-tab-check"
                  checked={todas}
                  disabled={estado !== 'pronto' || !seleccao.onAlternarTodas || ids.length === 0}
                  aria-label={seleccao.rotuloTodas}
                                                                                      
                  ref={(el) => {
                    if (el) el.indeterminate = algumas
                  }}
                  onChange={(e) => seleccao.onAlternarTodas?.(e.currentTarget.checked)}
                />
              </th>
            ) : null}

            {colunas.map((c) => {
              const activa = ordem?.chave === c.chave
              const sentido: SentidoOrdem = activa && ordem?.sentido === 'asc' ? 'desc' : 'asc'
              const marca = activa && ordem ? ordem.sentido : 'nenhum'
              return (
                <th
                  key={c.chave}
                  scope="col"
                  className={c.numerica ? 'ad-tab-num' : undefined}
                  aria-sort={
                    !c.ordenavel
                      ? undefined
                      : activa && ordem
                        ? ordem.sentido === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                  }
                >
                  {c.ordenavel && onOrdenar ? (
                    <button
                      type="button"
                      className="ad-tab-ord"
                      onClick={() => onOrdenar(c.chave, sentido)}
                      disabled={estado !== 'pronto'}
                    >
                      <span>{c.cabecalho}</span>
                      <span className="ad-tab-seta" data-s={marca} aria-hidden="true" />
                      {c.rotuloOrdem ? (
                        <span className="ad-dd-vh">{c.rotuloOrdem[sentido]}</span>
                      ) : null}
                    </button>
                  ) : (
                    c.cabecalho
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        {estado === 'carregando' ? (
          <tbody aria-hidden="true">
            {Array.from({ length: linhasEsqueleto }, (_, r) => (
              <tr key={r}>
                {seleccao ? (
                  <td className="ad-tab-cel-check">
                    <Barra i={0} altura={12} />
                  </td>
                ) : null}
                {colunas.map((c, i) => (
                  <td key={c.chave} className={c.numerica ? 'ad-tab-num' : undefined}>
                    <Barra i={r + i} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : estado === 'vazio' ? (
          <tbody>
            <tr>
              <td colSpan={nColunas} className="ad-tab-fb">
                {feedback?.vazio}
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {linhas.map((linha) => {
              const id = idLinha(linha)
              const sel = seleccao ? seleccao.seleccionadas.includes(id) : false
              return (
                <tr key={id} data-sel={sel ? '1' : undefined}>
                  {seleccao ? (
                    <td className="ad-tab-cel-check">
                      <input
                        type="checkbox"
                        className="ad-tab-check"
                        checked={sel}
                        aria-label={seleccao.rotuloLinha(linha)}
                        onChange={(e) => seleccao.onAlternar(id, e.currentTarget.checked)}
                      />
                    </td>
                  ) : null}
                  {colunas.map((c) => (
                    <td key={c.chave} className={c.numerica ? 'ad-tab-num' : undefined}>
                      {c.celula(linha)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        )}
      </table>

      {estado === 'carregando' ? (
        <div className="ad-tab-carga" role="status">
          <Varredura />
          <span className="ad-dd-vh">{feedback?.carregando}</span>
        </div>
      ) : null}
    </div>
  )
}

                                                                               
            
                                                                               

export type PaginacaoProps = {
               
  pagina: number
  porPagina: number
  total: number
  onIr: (pagina: number) => void
                                                                                         
  rotuloIntervalo: (de: number, ate: number, total: number) => string
  rotuloAnterior: string
  rotuloSeguinte: string
                                                                                               
  rotuloNavegacao: string
                                                    
  rotuloPagina?: (n: number) => string
                                                                                 
  maxNumeros?: number
  estado?: EstadoDados
  feedback?: Feedback
}

                                                                                          
function janela(pagina: number, paginas: number, max: number): Array<number | 'corte'> {
  if (paginas <= max) return Array.from({ length: paginas }, (_, i) => i + 1)
                                                                                          
  const meio = max - 2
  let inicio = Math.max(2, pagina - Math.floor((meio - 1) / 2))
  let fim = inicio + meio - 1
  if (fim > paginas - 1) {
    fim = paginas - 1
    inicio = Math.max(2, fim - meio + 1)
  }
  const saida: Array<number | 'corte'> = [1]
  if (inicio > 2) saida.push('corte')
  for (let n = inicio; n <= fim; n++) saida.push(n)
  if (fim < paginas - 1) saida.push('corte')
  saida.push(paginas)
  return saida
}

export function Paginacao({
  pagina,
  porPagina,
  total,
  onIr,
  rotuloIntervalo,
  rotuloAnterior,
  rotuloSeguinte,
  rotuloNavegacao,
  rotuloPagina,
  maxNumeros = 7,
  estado = 'pronto',
  feedback,
}: PaginacaoProps) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const actual = Math.min(Math.max(1, pagina), paginas)
  const de = total === 0 ? 0 : (actual - 1) * porPagina + 1
  const ate = Math.min(actual * porPagina, total)

  if (estado === 'carregando') {
    return (
      <div className="ad-pag ad-pag-carga" role="status">
        <span className="ad-dd-sk ad-pag-sk">
          <Barra i={1} altura={12} />
          <Varredura />
        </span>
        <span className="ad-dd-vh">{feedback?.carregando}</span>
      </div>
    )
  }

  if (estado === 'vazio' || total === 0) {
    return <div className="ad-pag ad-pag-vazia">{feedback?.vazio}</div>
  }

  return (
    <nav className="ad-pag" aria-label={rotuloNavegacao}>
      <p className="ad-pag-conta" role="status">
        {rotuloIntervalo(de, ate, total)}
      </p>

      <div className="ad-pag-nums">
        <button
          type="button"
          className="ad-pag-btn ad-pag-passo"
          onClick={() => onIr(actual - 1)}
          disabled={actual <= 1}
        >
          <span className="ad-pag-seta ad-pag-seta-esq" aria-hidden="true" />
          {rotuloAnterior}
        </button>

        {janela(actual, paginas, Math.max(5, maxNumeros)).map((n, i) =>
          n === 'corte' ? (
            <span key={`corte-${i}`} className="ad-pag-corte" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className="ad-pag-btn ad-pag-num"
              aria-current={n === actual ? 'page' : undefined}
              aria-label={rotuloPagina ? rotuloPagina(n) : undefined}
              onClick={() => onIr(n)}
            >
              {pad2(n)}
            </button>
          ),
        )}

        <button
          type="button"
          className="ad-pag-btn ad-pag-passo"
          onClick={() => onIr(actual + 1)}
          disabled={actual >= paginas}
        >
          {rotuloSeguinte}
          <span className="ad-pag-seta ad-pag-seta-dir" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

                                                                               
          
                                                                               

export type PillFiltro = {
  id: string
  rotulo: ReactNode
                                                                                           
  contagem?: number
  activo: boolean
}

export type BuscaFiltros = {
  valor: string
  onMudar: (valor: string) => void
                                                                        
  rotulo: string
  marcador?: string
  rotuloLimpar?: string
}

export type FiltrosProps = {
  pills: readonly PillFiltro[]
  onAlternar: (id: string) => void
  busca?: BuscaFiltros
                                                                                       
  contagem: ReactNode
                                          
  rotuloGrupo: string
  accoes?: ReactNode
  estado?: EstadoDados
  feedback?: Feedback
}

export function Filtros({
  pills,
  onAlternar,
  busca,
  contagem,
  rotuloGrupo,
  accoes,
  estado = 'pronto',
  feedback,
}: FiltrosProps) {
  const id = useId()
  const carregando = estado === 'carregando'

  return (
    <div className="ad-flt">
      <div className="ad-flt-pills" role="group" aria-label={rotuloGrupo}>
        {carregando
          ? Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="ad-flt-pill-sk" aria-hidden="true">
                <Barra i={i} altura={10} />
              </span>
            ))
          : pills.map((p) => (
              <button
                key={p.id}
                type="button"
                className="ad-flt-pill"
                aria-pressed={p.activo}
                onClick={() => onAlternar(p.id)}
              >
                {p.rotulo}
                {typeof p.contagem === 'number' ? (
                  <span className="ad-flt-cont">{pad2(p.contagem)}</span>
                ) : null}
              </button>
            ))}
      </div>

      {busca ? (
        <div className="ad-flt-busca">
          <label className="ad-dd-vh" htmlFor={`${id}-busca`}>
            {busca.rotulo}
          </label>
          <input
            id={`${id}-busca`}
            type="search"
            className="ad-flt-campo"
            value={busca.valor}
            placeholder={busca.marcador}
            disabled={carregando}
            onChange={(e) => busca.onMudar(e.currentTarget.value)}
          />
          {busca.valor && busca.rotuloLimpar ? (
            <button
              type="button"
              className="ad-flt-limpar"
              aria-label={busca.rotuloLimpar}
              onClick={() => busca.onMudar('')}
            >
              {                                                                    }
              <span aria-hidden="true">+</span>
            </button>
          ) : null}
          <span className="ad-flt-trilho" aria-hidden="true">
            <i />
          </span>
        </div>
      ) : null}

      {accoes ? <div className="ad-flt-accoes">{accoes}</div> : null}

      <p className="ad-flt-conta" role="status">
        {carregando ? feedback?.carregando : estado === 'vazio' ? feedback?.vazio : contagem}
      </p>
    </div>
  )
}

                                                                               
         
                                                                               

export type CartaoProps = {
  eyebrow?: ReactNode
  titulo?: ReactNode
  accoes?: ReactNode
  nota?: ReactNode
  children?: ReactNode
                                                                            
  nu?: boolean
                                                     
  rotuloRegiao?: string
  linhasEsqueleto?: number
  estado?: EstadoDados
  feedback?: Feedback
}

export function Cartao({
  eyebrow,
  titulo,
  accoes,
  nota,
  children,
  nu,
  rotuloRegiao,
  linhasEsqueleto = 3,
  estado = 'pronto',
  feedback,
}: CartaoProps) {
  const id = useId()

  return (
    <section
      className="ad-card"
      aria-labelledby={titulo ? `${id}-t` : undefined}
      aria-label={!titulo ? rotuloRegiao : undefined}
      aria-busy={estado === 'carregando' || undefined}
    >
      {titulo || eyebrow || accoes ? (
        <header className="ad-card-topo">
          <div className="ad-card-nomes">
            {eyebrow ? <span className="ad-card-eyebrow">{eyebrow}</span> : null}
            {titulo ? (
              <h2 className="ad-card-titulo" id={`${id}-t`}>
                {titulo}
              </h2>
            ) : null}
          </div>
          {accoes ? <div className="ad-card-accoes">{accoes}</div> : null}
        </header>
      ) : null}

      {estado === 'carregando' ? (
        <div className="ad-card-corpo" role="status">
          <span className="ad-dd-sk">
            {Array.from({ length: linhasEsqueleto }, (_, i) => (
              <Barra key={i} i={i} />
            ))}
            <Varredura />
          </span>
          <span className="ad-dd-vh">{feedback?.carregando}</span>
        </div>
      ) : estado === 'vazio' ? (
        <div className="ad-card-corpo ad-card-fb">{feedback?.vazio}</div>
      ) : (
        <div className={nu ? 'ad-card-corpo nu' : 'ad-card-corpo'}>{children}</div>
      )}

      {nota && estado === 'pronto' ? <p className="ad-card-nota">{nota}</p> : null}
    </section>
  )
}

                                                                               
                              
                                                                               

export type LinhaLista = {
  id: string
  titulo: ReactNode
  meta?: ReactNode
                                                       
  fim?: ReactNode
                                                                          
  conteudo?: ReactNode
}

export type ListaLinhasProps = {
  linhas: readonly LinhaLista[]
                                                                              
  abertas?: readonly string[]
  onAlternar?: (id: string) => void
  linhasEsqueleto?: number
  estado?: EstadoDados
  feedback?: Feedback
}

export function ListaLinhas({
  linhas,
  abertas,
  onAlternar,
  linhasEsqueleto = 4,
  estado = 'pronto',
  feedback,
}: ListaLinhasProps) {
  const id = useId()
  const [internas, setInternas] = useState<readonly string[]>([])
  const controlado = abertas !== undefined
  const activas = controlado ? abertas : internas

  function alternar(chave: string) {
    if (controlado) onAlternar?.(chave)
    else setInternas((a) => (a.includes(chave) ? a.filter((x) => x !== chave) : [...a, chave]))
  }

  if (estado === 'carregando') {
    return (
      <div className="ad-lst" role="status" aria-busy="true">
        {Array.from({ length: linhasEsqueleto }, (_, i) => (
          <div className="ad-lst-linha" key={i}>
            <div className="ad-lst-cab" aria-hidden="true">
              <Barra i={i} altura={15} />
              <Barra i={i + 2} altura={10} />
              <span />
            </div>
            <div className="ad-lst-fio">
              <i />
            </div>
          </div>
        ))}
        <span className="ad-dd-vh">{feedback?.carregando}</span>
      </div>
    )
  }

  if (estado === 'vazio') {
    return <div className="ad-lst ad-lst-fb">{feedback?.vazio}</div>
  }

  return (
    <div className="ad-lst">
      {linhas.map((l) => {
        const aberta = activas.includes(l.id)
        const expansivel = l.conteudo !== undefined
        return (
          <div className={aberta ? 'ad-lst-linha aberta' : 'ad-lst-linha'} key={l.id}>
            {expansivel ? (
              <button
                type="button"
                className="ad-lst-cab"
                aria-expanded={aberta}
                aria-controls={`${id}-${l.id}`}
                onClick={() => alternar(l.id)}
              >
                <span className="ad-lst-tit">{l.titulo}</span>
                <span className="ad-lst-meta">{l.meta}</span>
                <span className="ad-lst-fim">
                  {l.fim}
                  <span className="ad-lst-caret" aria-hidden="true" />
                </span>
              </button>
            ) : (
              <div className="ad-lst-cab ad-lst-cab-fixa">
                <span className="ad-lst-tit">{l.titulo}</span>
                <span className="ad-lst-meta">{l.meta}</span>
                <span className="ad-lst-fim">{l.fim}</span>
              </div>
            )}

            {expansivel ? (
              <div
                className={aberta ? 'ad-lst-acc aberta' : 'ad-lst-acc'}
                id={`${id}-${l.id}`}
                                                                                           
                inert={!aberta}
              >
                <div>
                  <div className="ad-lst-conteudo">{l.conteudo}</div>
                </div>
              </div>
            ) : null}

            <div className={aberta ? 'ad-lst-fio on' : 'ad-lst-fio'}>
              <i />
            </div>
          </div>
        )
      })}
    </div>
  )
}

                                                                               
          
                                                                               

type MetricaBase = {
                                                           
  rotulo: ReactNode
                                                                                   
  unidade?: ReactNode
  nota?: ReactNode
                                                                     
  assinalada?: boolean
  estado?: EstadoDados
  feedback?: Feedback
}

                                                                                     
                                                                                          
export type MetricaProps = MetricaBase &
  ({ valor: string; razao?: never } | { valor: null; razao: ReactNode })

export function Metrica(props: MetricaProps) {
  const { rotulo, unidade, nota, assinalada, estado = 'pronto', feedback } = props

  if (estado === 'carregando') {
    return (
      <div className="ad-met" role="status" aria-busy="true">
        <span className="ad-met-rot">{rotulo}</span>
        <span className="ad-dd-sk ad-met-sk">
          <Barra i={0} altura={22} />
          <Varredura />
        </span>
        <span className="ad-dd-vh">{feedback?.carregando}</span>
      </div>
    )
  }

  if (estado === 'vazio') {
    return (
      <div className="ad-met">
        <span className="ad-met-rot">{rotulo}</span>
        <div className="ad-met-ausente">{feedback?.vazio}</div>
      </div>
    )
  }

  return (
    <div className={assinalada ? 'ad-met assinalada' : 'ad-met'}>
      <span className="ad-met-rot">{rotulo}</span>

      {props.valor === null ? (
        <div className="ad-met-ausente">{props.razao}</div>
      ) : (
        <>
          <p className="ad-met-valor">
            {props.valor}
            {unidade ? <span className="ad-met-unid">{unidade}</span> : null}
          </p>
          {assinalada ? <span className="ad-met-fio" aria-hidden="true" /> : null}
        </>
      )}

      {nota ? <p className="ad-met-nota">{nota}</p> : null}
    </div>
  )
}

                                                                               
                                              
                                                                         
                                                                        
                                                                               

export const CSS_DADOS = `
/* Shared data-family styles. */
.ad-dd-vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip-path:inset(50%);white-space:nowrap;border:0}
.ad-dd-sk{position:relative;display:flex;flex-direction:column;gap:var(--ad-e2);width:100%}
.ad-dd-bar{display:block;height:var(--ad-t-corpo);background:var(--ad-linha);border-radius:var(--ad-raio)}
.ad-dd-varre{position:absolute;left:0;right:0;bottom:calc(var(--ad-linha-px) * -3);height:var(--ad-linha-px);
  background:var(--ad-noir);transform:scaleX(0);transform-origin:left center;
  animation:ad-dd-varre 1.6s var(--ad-curva) infinite}
@keyframes ad-dd-varre{
  0%{transform:scaleX(0);transform-origin:left center}
  50%{transform:scaleX(1);transform-origin:left center}
  50.01%{transform:scaleX(1);transform-origin:right center}
  100%{transform:scaleX(0);transform-origin:right center}}
@media (prefers-reduced-motion: reduce){.ad-dd-varre{animation:none;transform:scaleX(1)}}

/* Table. */
.ad-tab-wrap{position:relative;width:100%;overflow:auto;background:var(--ad-superficie-alta)}
.ad-tab{width:100%;border-collapse:separate;border-spacing:0;font-family:var(--ad-fonte);
  font-size:var(--ad-t-corpo);line-height:var(--ad-lh-corpo);font-weight:var(--ad-peso-normal);
  color:var(--ad-tinta);letter-spacing:-.01em}
.ad-tab-legenda{text-align:left;padding:var(--ad-e3) var(--ad-e3) var(--ad-e2);
  font-size:var(--ad-t-micro);text-transform:uppercase;letter-spacing:var(--ad-track-eyebrow);
  color:var(--ad-tinta)}
.ad-tab th,.ad-tab td{position:relative;text-align:left;vertical-align:middle;
  padding:var(--ad-e2) var(--ad-e3);border-bottom:var(--ad-linha-px) solid var(--ad-linha)}
/* The fixed header stays at the top of the scrolling area. Its hairline is Noir rather than Leman
   because it marks where column names end, which conveys information rather than rhythm. */
.ad-tab thead th{position:sticky;top:0;z-index:2;background:var(--ad-superficie-alta);
  font-size:var(--ad-t-micro);font-weight:var(--ad-peso-normal);text-transform:uppercase;
  letter-spacing:var(--ad-track-eyebrow);white-space:nowrap;
  padding-top:var(--ad-e3);padding-bottom:var(--ad-e2);
  border-bottom:var(--ad-linha-px) solid var(--ad-noir)}
/* Required specificity: .ad-tab td outranks .ad-tab-num alone. Without this selector the numeric
   column aligned left, a defect found in the browser rather than during the build. */
.ad-tab th.ad-tab-num,.ad-tab td.ad-tab-num{text-align:right;font-variant-numeric:tabular-nums}
.ad-tab-ord{display:inline-flex;align-items:center;gap:var(--ad-e2);font:inherit;color:inherit;
  letter-spacing:inherit;text-transform:inherit;background:none;border:0;padding:0;cursor:pointer}
.ad-tab-ord:disabled{cursor:default}
.ad-tab-num .ad-tab-ord{flex-direction:row-reverse}
/* Drawn arrow: a rotated 6px box with two borders, matching the V3 chevron. */
.ad-tab-seta{width:6px;height:6px;flex:0 0 auto;
  border-right:var(--ad-linha-px) solid var(--ad-tinta);
  border-bottom:var(--ad-linha-px) solid var(--ad-tinta);
  transform:rotate(45deg) translateY(-1px);opacity:0;
  transition:transform var(--ad-d-normal) var(--ad-curva),opacity var(--ad-d-normal) var(--ad-curva)}
.ad-tab-ord:hover .ad-tab-seta[data-s="nenhum"],
.ad-tab-ord:focus-visible .ad-tab-seta[data-s="nenhum"]{opacity:1;border-color:var(--ad-tinta-fraca)}
.ad-tab-seta[data-s="desc"]{opacity:1;transform:rotate(45deg) translateY(-1px)}
.ad-tab-seta[data-s="asc"]{opacity:1;transform:rotate(225deg) translateY(-1px)}
.ad-tab-col-check{width:1%}
.ad-tab-cel-check{width:1%;white-space:nowrap}
.ad-tab-check{appearance:none;-webkit-appearance:none;display:block;width:12px;height:12px;margin:0;
  border:var(--ad-linha-px) solid var(--ad-tinta-fraca);border-radius:var(--ad-raio);
  background:var(--ad-superficie-alta);cursor:pointer;
  transition:background-color var(--ad-d-rapido) var(--ad-curva),border-color var(--ad-d-rapido) var(--ad-curva)}
.ad-tab-check:checked{background:var(--ad-noir);border-color:var(--ad-noir)}
.ad-tab-check:indeterminate{border-color:var(--ad-noir);
  background-image:linear-gradient(var(--ad-noir),var(--ad-noir));
  background-size:6px var(--ad-linha-px);background-position:center;background-repeat:no-repeat}
.ad-tab-check:disabled{cursor:default;border-color:var(--ad-linha)}
/* On hover, the lower hairline sweeps to Noir. It enters quickly and exits slowly, as in V3. */
.ad-tab tbody td::after{content:"";position:absolute;left:0;right:0;bottom:calc(var(--ad-linha-px) * -1);
  height:var(--ad-linha-px);background:var(--ad-noir);transform:scaleX(0);transform-origin:right center;
  transition:transform var(--ad-d-lento) var(--ad-curva)}
.ad-tab tbody tr:hover td::after,.ad-tab tbody tr:focus-within td::after{
  transform:scaleX(1);transform-origin:left center;transition:transform var(--ad-d-normal) var(--ad-curva)}
/* A selected row raises the canvas beneath it and adds a Noir rule on the left. Three distinct signals,
   background, rule and filled box, keep selection separate from hover. */
.ad-tab tbody tr[data-sel="1"] td{background:var(--ad-superficie)}
.ad-tab tbody tr[data-sel="1"] td:first-child{border-left:var(--ad-linha-px) solid var(--ad-noir);
  padding-left:calc(var(--ad-e3) - var(--ad-linha-px))}
.ad-tab-fb{padding:var(--ad-e5) var(--ad-e3);color:var(--ad-tinta)}
/* The empty-state cell does not sweep on hover because there is no row to indicate. */
.ad-tab tbody td.ad-tab-fb::after{display:none}
.ad-tab-carga{position:relative;height:var(--ad-e2)}

/* Pagination. */
.ad-pag{display:flex;align-items:center;justify-content:space-between;gap:var(--ad-e4);flex-wrap:wrap;
  padding:var(--ad-e3) 0;font-family:var(--ad-fonte);font-size:var(--ad-t-apoio);
  text-transform:uppercase;letter-spacing:var(--ad-track-titulo);color:var(--ad-tinta)}
.ad-pag-conta{margin:0;font-variant-numeric:tabular-nums}
.ad-pag-nums{display:flex;align-items:center;gap:var(--ad-e1)}
.ad-pag-btn{display:inline-flex;align-items:center;gap:var(--ad-e2);min-width:26px;height:24px;
  justify-content:center;padding:0 var(--ad-e2);background:none;color:var(--ad-tinta);font:inherit;
  letter-spacing:inherit;text-transform:inherit;cursor:pointer;
  border:var(--ad-linha-px) solid transparent;border-radius:var(--ad-raio-pill);
  font-variant-numeric:tabular-nums;
  transition:background-color var(--ad-d-rapido) var(--ad-curva),
             border-color var(--ad-d-rapido) var(--ad-curva),
             color var(--ad-d-rapido) var(--ad-curva)}
.ad-pag-btn:hover:not(:disabled){border-color:var(--ad-noir)}
.ad-pag-btn[aria-current="page"]{background:var(--ad-noir);border-color:var(--ad-noir);color:var(--ad-alpin)}
.ad-pag-btn:disabled{color:var(--ad-tinta-fraca);cursor:default}
.ad-pag-passo{padding:0 var(--ad-e3)}
.ad-pag-corte{padding:0 var(--ad-e1);color:var(--ad-tinta-fraca)}
.ad-pag-seta{width:6px;height:6px;flex:0 0 auto;
  border-right:var(--ad-linha-px) solid currentColor;border-bottom:var(--ad-linha-px) solid currentColor}
.ad-pag-seta-esq{transform:rotate(135deg)}
.ad-pag-seta-dir{transform:rotate(-45deg)}
.ad-pag-sk{max-width:160px}
.ad-pag-vazia{color:var(--ad-tinta)}

/* Filters. */
.ad-flt{display:flex;align-items:center;gap:var(--ad-e3);flex-wrap:wrap;padding:var(--ad-e3) 0;
  border-bottom:var(--ad-linha-px) solid var(--ad-linha);font-family:var(--ad-fonte);color:var(--ad-tinta)}
.ad-flt-pills{display:flex;align-items:center;gap:var(--ad-e2);flex-wrap:wrap}
.ad-flt-pill{display:inline-flex;align-items:center;gap:var(--ad-e2);padding:5px var(--ad-e3) 6px;
  border:var(--ad-linha-px) solid var(--ad-linha);border-radius:var(--ad-raio-pill);background:none;
  color:var(--ad-tinta);font-family:inherit;font-size:var(--ad-t-micro);font-weight:var(--ad-peso-normal);
  line-height:1;text-transform:uppercase;letter-spacing:var(--ad-track-eyebrow);cursor:pointer;
  transition:background-color var(--ad-d-rapido) var(--ad-curva),
             border-color var(--ad-d-rapido) var(--ad-curva),
             color var(--ad-d-rapido) var(--ad-curva)}
.ad-flt-pill:hover{border-color:var(--ad-noir)}
.ad-flt-pill[aria-pressed="true"]{background:var(--ad-noir);border-color:var(--ad-noir);color:var(--ad-alpin)}
.ad-flt-cont{font-variant-numeric:tabular-nums;color:var(--ad-tinta-fraca)}
.ad-flt-pill[aria-pressed="true"] .ad-flt-cont{color:var(--ad-leman)}
.ad-flt-pill-sk{display:inline-flex;align-items:center;width:88px;padding:5px var(--ad-e3) 6px;
  border:var(--ad-linha-px) solid var(--ad-linha);border-radius:var(--ad-raio-pill)}
.ad-flt-busca{position:relative;display:flex;align-items:center;gap:var(--ad-e2);flex:1 1 180px;
  min-width:160px;max-width:280px;padding-bottom:2px}
.ad-flt-campo{width:100%;border:0;background:none;padding:var(--ad-e2) 0;font-family:inherit;
  font-size:var(--ad-t-corpo);line-height:1.2;color:var(--ad-tinta);letter-spacing:-.01em}
.ad-flt-campo::placeholder{color:var(--ad-tinta-fraca)}
.ad-flt-campo::-webkit-search-cancel-button{display:none}
.ad-flt-limpar{flex:0 0 auto;width:18px;height:18px;display:flex;align-items:center;justify-content:center;
  background:none;border:0;padding:0;color:var(--ad-tinta);cursor:pointer;font-family:inherit;
  font-size:var(--ad-t-corpo);line-height:1}
.ad-flt-limpar span{display:block;transform:rotate(45deg)}
/* Field track: a Leman hairline at rest, with Noir sweeping across when the field receives focus. */
.ad-flt-trilho{position:absolute;left:0;right:0;bottom:0;height:var(--ad-linha-px);
  background:var(--ad-linha);overflow:hidden}
.ad-flt-trilho i{position:absolute;inset:0;background:var(--ad-noir);transform:scaleX(0);
  transform-origin:right center;transition:transform var(--ad-d-lento) var(--ad-curva)}
.ad-flt-busca:focus-within .ad-flt-trilho i{transform:scaleX(1);transform-origin:left center;
  transition:transform var(--ad-d-normal) var(--ad-curva)}
.ad-flt-accoes{display:flex;align-items:center;gap:var(--ad-e2)}
/* The count is short, but the empty state places a full sentence from the feedback file here.
   It therefore aligns right and wraps instead of overflowing the box. */
.ad-flt-conta{margin:0 0 0 auto;max-width:100%;text-align:right;font-size:var(--ad-t-apoio);
  text-transform:uppercase;letter-spacing:var(--ad-track-titulo);line-height:var(--ad-lh-corpo);
  font-variant-numeric:tabular-nums;color:var(--ad-tinta)}

/* Card. */
.ad-card{background:var(--ad-superficie-alta);border:var(--ad-linha-px) solid var(--ad-linha);
  border-radius:var(--ad-raio);font-family:var(--ad-fonte);color:var(--ad-tinta)}
.ad-card-topo{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--ad-e4);
  padding:var(--ad-e4);border-bottom:var(--ad-linha-px) solid var(--ad-linha)}
.ad-card-nomes{min-width:0}
.ad-card-eyebrow{display:block;margin-bottom:var(--ad-e2);font-size:var(--ad-t-micro);
  text-transform:uppercase;letter-spacing:var(--ad-track-eyebrow);color:var(--ad-tinta-fraca)}
.ad-card-titulo{margin:0;font-size:var(--ad-t-seccao);font-weight:var(--ad-peso-leve);
  line-height:var(--ad-lh-titulo);text-transform:uppercase;letter-spacing:var(--ad-track-titulo)}
.ad-card-accoes{display:flex;align-items:center;gap:var(--ad-e2);flex:0 0 auto}
.ad-card-corpo{padding:var(--ad-e4);font-size:var(--ad-t-corpo);line-height:var(--ad-lh-corpo)}
.ad-card-corpo.nu{padding:0}
/* In an edge-to-edge table, the last row removes its hairline to avoid doubling the card frame. */
.ad-card-corpo.nu .ad-tab tbody tr:last-child td{border-bottom:0}
.ad-card-fb{padding:var(--ad-e5) var(--ad-e4)}
.ad-card-nota{margin:0;padding:0 var(--ad-e4) var(--ad-e4);font-size:var(--ad-t-apoio);
  line-height:var(--ad-lh-corpo);color:var(--ad-tinta-fraca)}

/* Row list. */
.ad-lst{font-family:var(--ad-fonte);color:var(--ad-tinta)}
.ad-lst-linha{position:relative}
.ad-lst-cab{width:100%;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.7fr) auto;
  column-gap:var(--ad-e4);align-items:center;text-align:left;padding:var(--ad-e3) 0;
  background:none;border:0;color:inherit;font:inherit;cursor:pointer}
.ad-lst-cab-fixa{cursor:default}
.ad-lst-tit{min-width:0;font-size:var(--ad-t-sub);font-weight:var(--ad-peso-leve);
  line-height:var(--ad-lh-titulo);text-transform:uppercase;letter-spacing:var(--ad-track-titulo);
  overflow-wrap:anywhere}
.ad-lst-meta{min-width:0;font-size:var(--ad-t-micro);text-transform:uppercase;
  letter-spacing:var(--ad-track-eyebrow);color:var(--ad-tinta-fraca)}
.ad-lst-fim{display:flex;align-items:center;gap:var(--ad-e3);justify-self:end;
  font-size:var(--ad-t-apoio);font-variant-numeric:tabular-nums;white-space:nowrap}
/* Drawn caret, closed at 45 degrees and open at 225 degrees, matching the V3 chevron. */
.ad-lst-caret{width:7px;height:7px;flex:0 0 auto;
  border-right:var(--ad-linha-px) solid var(--ad-tinta);
  border-bottom:var(--ad-linha-px) solid var(--ad-tinta);
  transform:rotate(45deg) translateY(-1px);
  transition:transform var(--ad-d-lento) var(--ad-curva)}
.ad-lst-linha.aberta .ad-lst-caret{transform:rotate(225deg) translateY(-1px)}
/* The accordion animates grid-template-rows, never height. */
.ad-lst-acc{display:grid;grid-template-rows:0fr;opacity:0;
  transition:grid-template-rows var(--ad-d-lento) var(--ad-curva),opacity var(--ad-d-lento) var(--ad-curva)}
.ad-lst-acc.aberta{grid-template-rows:1fr;opacity:1}
.ad-lst-acc>div{overflow:hidden;min-height:0}
.ad-lst-conteudo{padding:0 0 var(--ad-e4);font-size:var(--ad-t-corpo);line-height:var(--ad-lh-corpo)}
.ad-lst-fio{position:relative;height:var(--ad-linha-px);width:100%;overflow:hidden;background:var(--ad-linha)}
.ad-lst-fio i{position:absolute;inset:0;background:var(--ad-noir);transform:scaleX(0);
  transform-origin:right center;transition:transform var(--ad-d-lento) var(--ad-curva)}
.ad-lst-linha:hover .ad-lst-fio i,.ad-lst-linha:focus-within .ad-lst-fio i{
  transform:scaleX(1);transform-origin:left center;transition:transform var(--ad-d-normal) var(--ad-curva)}
.ad-lst-fio.on i{transform:scaleX(1);transform-origin:left center}
.ad-lst-fb{padding:var(--ad-e5) 0}

/* Metric. */
.ad-met{display:flex;flex-direction:column;gap:var(--ad-e2);min-width:0;
  font-family:var(--ad-fonte);color:var(--ad-tinta)}
.ad-met-rot{font-size:var(--ad-t-micro);text-transform:uppercase;
  letter-spacing:var(--ad-track-eyebrow);color:var(--ad-tinta)}
.ad-met-valor{display:flex;align-items:baseline;gap:var(--ad-e2);margin:0;
  font-size:var(--ad-t-titulo);font-weight:var(--ad-peso-leve);line-height:var(--ad-lh-titulo);
  letter-spacing:var(--ad-track-titulo);font-variant-numeric:tabular-nums}
.ad-met-unid{font-size:var(--ad-t-apoio);font-weight:var(--ad-peso-normal);
  letter-spacing:var(--ad-track-titulo);color:var(--ad-tinta-fraca);text-transform:uppercase}
/* Violette signals rather than decorates and appears only when a metric requires attention. */
.ad-met-fio{display:block;height:var(--ad-linha-px);width:32px;background:var(--ad-sinal)}
.ad-met-nota{margin:0;font-size:var(--ad-t-apoio);line-height:var(--ad-lh-corpo);color:var(--ad-tinta-fraca)}
/* A missing value explains the reason in words, with a Violette rule signalling the absent measurement. */
.ad-met-ausente{border-left:var(--ad-linha-px) solid var(--ad-sinal);padding-left:var(--ad-e3);
  font-size:var(--ad-t-corpo);line-height:var(--ad-lh-corpo);color:var(--ad-tinta)}
.ad-met-sk{max-width:120px}
`

                                                                              
export function EstiloDados() {
  return <style>{CSS_DADOS}</style>
}

                                                                               
                                                                              
                                              

                                                                                
                                                                               
                                                                               
                          
                                                                               

const D = {
  legenda: {
    fr: 'Projets en cours',
    en: 'Projects in progress',
    pt: 'Projetos em curso',
    de: 'Laufende Projekte',
    it: 'Progetti in corso',
  } as L5,
  projet: { fr: 'Projet', en: 'Project', pt: 'Projeto', de: 'Projekt', it: 'Progetto' } as L5,
  client: { fr: 'Client', en: 'Client', pt: 'Cliente', de: 'Kunde', it: 'Cliente' } as L5,
  statut: { fr: 'Statut', en: 'Status', pt: 'Estado', de: 'Status', it: 'Stato' } as L5,
  budget: { fr: 'Budget', en: 'Budget', pt: 'Orçamento', de: 'Budget', it: 'Budget' } as L5,
  annee: { fr: 'Année', en: 'Year', pt: 'Ano', de: 'Jahr', it: 'Anno' } as L5,
  croissant: {
    fr: 'Trier par ordre croissant',
    en: 'Sort in ascending order',
    pt: 'Ordenar por ordem crescente',
    de: 'Aufsteigend sortieren',
    it: 'Ordina in ordine crescente',
  } as L5,
  decroissant: {
    fr: 'Trier par ordre décroissant',
    en: 'Sort in descending order',
    pt: 'Ordenar por ordem decrescente',
    de: 'Absteigend sortieren',
    it: 'Ordina in ordine decrescente',
  } as L5,
  tout: {
    fr: 'Tout sélectionner',
    en: 'Select all',
    pt: 'Selecionar tudo',
    de: 'Alle auswählen',
    it: 'Seleziona tutto',
  } as L5,
  precedent: {
    fr: 'Précédent',
    en: 'Previous',
    pt: 'Anterior',
    de: 'Zurück',
    it: 'Precedente',
  } as L5,
  suivant: { fr: 'Suivant', en: 'Next', pt: 'Seguinte', de: 'Weiter', it: 'Successivo' } as L5,
  nav: {
    fr: 'Pagination des projets',
    en: 'Project pagination',
    pt: 'Paginação dos projetos',
    de: 'Seitennavigation der Projekte',
    it: 'Paginazione dei progetti',
  } as L5,
  rechercher: {
    fr: 'Rechercher un projet',
    en: 'Search for a project',
    pt: 'Procurar um projeto',
    de: 'Projekt suchen',
    it: 'Cerca un progetto',
  } as L5,
  marcador: { fr: 'Rechercher', en: 'Search', pt: 'Procurar', de: 'Suchen', it: 'Cerca' } as L5,
  effacer: {
    fr: 'Effacer la recherche',
    en: 'Clear the search',
    pt: 'Limpar a pesquisa',
    de: 'Suche löschen',
    it: 'Cancella la ricerca',
  } as L5,
  grupo: {
    fr: 'Filtres de projets',
    en: 'Project filters',
    pt: 'Filtros de projetos',
    de: 'Projektfilter',
    it: 'Filtri dei progetti',
  } as L5,
  resultats: {
    fr: '214 résultats',
    en: '214 results',
    pt: '214 resultados',
    de: '214 Ergebnisse',
    it: '214 risultati',
  } as L5,
  chargement: {
    fr: 'Chargement des données',
    en: 'Loading data',
    pt: 'A carregar os dados',
    de: 'Daten werden geladen',
    it: 'Caricamento dei dati',
  } as L5,
  vide: {
    fr: 'Aucun projet ne correspond à ces filtres. Retirez un filtre pour élargir la recherche.',
    en: 'No project matches these filters. Remove a filter to widen the search.',
    pt: 'Nenhum projeto corresponde a estes filtros. Retire um filtro para alargar a pesquisa.',
    de: 'Kein Projekt entspricht diesen Filtern. Entfernen Sie einen Filter, um die Suche zu erweitern.',
    it: 'Nessun progetto corrisponde a questi filtri. Rimuovi un filtro per allargare la ricerca.',
  } as L5,
  vazioLista: {
    fr: 'Aucune archive pour cette année.',
    en: 'No archive for this year.',
    pt: 'Nenhum arquivo para este ano.',
    de: 'Kein Archiv für dieses Jahr.',
    it: 'Nessun archivio per questo anno.',
  } as L5,
  cartaoTitulo: {
    fr: 'Activité du mois',
    en: 'Activity this month',
    pt: 'Atividade do mês',
    de: 'Aktivität des Monats',
    it: 'Attività del mese',
  } as L5,
  cartaoEyebrow: {
    fr: 'Tableau de bord',
    en: 'Dashboard',
    pt: 'Painel',
    de: 'Übersicht',
    it: 'Cruscotto',
  } as L5,
  cartaoNota: {
    fr: 'Source: base interne, mise à jour toutes les heures.',
    en: 'Source: internal database, updated every hour.',
    pt: 'Fonte: base interna, atualizada de hora a hora.',
    de: 'Quelle: interne Datenbank, stündlich aktualisiert.',
    it: 'Fonte: base dati interna, aggiornata ogni ora.',
  } as L5,
  cartaoCorpo: {
    fr: 'Quatre projets livrés, deux devis en attente de signature.',
    en: 'Four projects delivered, two quotes awaiting signature.',
    pt: 'Quatro projetos entregues, duas propostas à espera de assinatura.',
    de: 'Vier Projekte geliefert, zwei Angebote warten auf Unterschrift.',
    it: 'Quattro progetti consegnati, due preventivi in attesa di firma.',
  } as L5,
  metRotulo: {
    fr: 'Projets livrés',
    en: 'Projects delivered',
    pt: 'Projetos entregues',
    de: 'Gelieferte Projekte',
    it: 'Progetti consegnati',
  } as L5,
  metNota: {
    fr: 'Douze de plus que le mois précédent.',
    en: 'Twelve more than the previous month.',
    pt: 'Mais doze do que no mês anterior.',
    de: 'Zwölf mehr als im Vormonat.',
    it: 'Dodici in più rispetto al mese precedente.',
  } as L5,
  metUnidade: {
    fr: 'ce mois',
    en: 'this month',
    pt: 'este mês',
    de: 'diesen Monat',
    it: 'questo mese',
  } as L5,
  metRazao: {
    fr: "La mesure n'est pas disponible: le compte Meta n'est pas connecté.",
    en: 'The measurement is not available: the Meta account is not connected.',
    pt: 'A medida não está disponível: a conta Meta não está ligada.',
    de: 'Der Messwert ist nicht verfügbar: das Meta-Konto ist nicht verbunden.',
    it: "La misura non è disponibile: l'account Meta non è collegato.",
  } as L5,
  metVazio: {
    fr: "Aucune donnée pour cette période: la campagne n'a pas encore démarré.",
    en: 'No data for this period: the campaign has not started yet.',
    pt: 'Sem dados para este período: a campanha ainda não arrancou.',
    de: 'Keine Daten für diesen Zeitraum: die Kampagne hat noch nicht begonnen.',
    it: 'Nessun dato per questo periodo: la campagna non è ancora partita.',
  } as L5,
  metAtraso: {
    fr: 'Devis en retard',
    en: 'Overdue quotes',
    pt: 'Propostas em atraso',
    de: 'Überfällige Angebote',
    it: 'Preventivi in ritardo',
  } as L5,
  metAtrasoNota: {
    fr: 'Trois devis dépassent 30 jours.',
    en: 'Three quotes are more than 30 days old.',
    pt: 'Três propostas passam dos 30 dias.',
    de: 'Drei Angebote sind älter als 30 Tage.',
    it: 'Tre preventivi superano i 30 giorni.',
  } as L5,
  metPortee: {
    fr: 'Portée Meta',
    en: 'Meta reach',
    pt: 'Alcance Meta',
    de: 'Meta-Reichweite',
    it: 'Copertura Meta',
  } as L5,
  metPrimavera: {
    fr: 'Campagne printemps',
    en: 'Spring campaign',
    pt: 'Campanha de primavera',
    de: 'Frühjahrskampagne',
    it: 'Campagna di primavera',
  } as L5,
  accao: { fr: 'Exporter', en: 'Export', pt: 'Exportar', de: 'Exportieren', it: 'Esporta' } as L5,
  meta1: {
    fr: 'Branding, Édition',
    en: 'Branding, Editorial',
    pt: 'Branding, Editorial',
    de: 'Branding, Editorial',
    it: 'Branding, Editoriale',
  } as L5,
  meta2: { fr: 'Film, Social', en: 'Film, Social', pt: 'Filme, Social', de: 'Film, Social', it: 'Film, Social' } as L5,
  meta3: { fr: 'Digital', en: 'Digital', pt: 'Digital', de: 'Digital', it: 'Digitale' } as L5,
  conteudo1: {
    fr: 'Trois volets: identité, signalétique et campagne saisonnière.',
    en: 'Three strands: identity, signage and seasonal campaign.',
    pt: 'Três frentes: identidade, sinalética e campanha sazonal.',
    de: 'Drei Teile: Identität, Beschilderung und Saisonkampagne.',
    it: 'Tre parti: identità, segnaletica e campagna stagionale.',
  } as L5,
  conteudo2: {
    fr: 'Quatre films courts et une déclinaison print.',
    en: 'Four short films and a print version.',
    pt: 'Quatro filmes curtos e uma declinação para impressão.',
    de: 'Vier Kurzfilme und eine Print-Adaption.',
    it: 'Quattro cortometraggi e una declinazione print.',
  } as L5,
}

                                                                               
const ST = {
  curso: { fr: 'En cours', en: 'In progress', pt: 'Em curso', de: 'Laufend', it: 'In corso' } as L5,
  entregue: { fr: 'Livré', en: 'Delivered', pt: 'Entregue', de: 'Geliefert', it: 'Consegnato' } as L5,
                                                                                             
                                                                      
  orcamento: { fr: 'Devis', en: 'Quote', pt: 'Proposta', de: 'Angebot', it: 'Preventivo' } as L5,
}

                                                                                      
const rotuloLinhaDemo = (n: string, lang: AbilLang) =>
  t5(
    {
      fr: `Sélectionner ${n}`,
      en: `Select ${n}`,
      pt: `Selecionar ${n}`,
      de: `${n} auswählen`,
      it: `Seleziona ${n}`,
    },
    lang,
  )

const rotuloPaginaDemo = (n: number, lang: AbilLang) =>
  t5(
    { fr: `Page ${n}`, en: `Page ${n}`, pt: `Página ${n}`, de: `Seite ${n}`, it: `Pagina ${n}` },
    lang,
  )

const intervaloDemo = (de: number, ate: number, total: number, lang: AbilLang) =>
  t5(
    {
      fr: `${de} à ${ate} de ${total}`,
      en: `${de} to ${ate} of ${total}`,
      pt: `${de} a ${ate} de ${total}`,
      de: `${de} bis ${ate} von ${total}`,
      it: `da ${de} a ${ate} di ${total}`,
    },
    lang,
  )

type LinhaDemo = {
  id: string
  projet: string
  client: string
  statut: L5
  budget: number
  annee: number
}

const LINHAS_DEMO: readonly LinhaDemo[] = [
  { id: 'a', projet: 'Identité ABiL', client: 'ABiL', statut: ST.curso, budget: 48000, annee: 2026 },
  { id: 'b', projet: 'Campagne Lémanique', client: 'Nautique SA', statut: ST.entregue, budget: 126500, annee: 2026 },
  { id: 'c', projet: 'Refonte Horlogerie', client: 'Maison Rhône', statut: ST.orcamento, budget: 87200, annee: 2025 },
  { id: 'd', projet: 'Film Institutionnel', client: 'Fondation Alpine', statut: ST.curso, budget: 34900, annee: 2025 },
]

const NUM_CH = new Intl.NumberFormat('fr-CH')

function colunasDemo(lang: AbilLang): ReadonlyArray<ColunaTabela<LinhaDemo>> {
  const ordem = { asc: t5(D.croissant, lang), desc: t5(D.decroissant, lang) }
  return [
    {
      chave: 'projet',
      cabecalho: t5(D.projet, lang),
      celula: (l) => l.projet,
      largura: '38%',
      ordenavel: true,
      rotuloOrdem: ordem,
    },
    { chave: 'client', cabecalho: t5(D.client, lang), celula: (l) => l.client, largura: '22%' },
    {
      chave: 'statut',
      cabecalho: t5(D.statut, lang),
      celula: (l) => t5(l.statut, lang),
      largura: '110px',
    },
    {
      chave: 'budget',
      cabecalho: t5(D.budget, lang),
      celula: (l) => NUM_CH.format(l.budget),
      largura: '110px',
      numerica: true,
      ordenavel: true,
      rotuloOrdem: ordem,
    },
    {
      chave: 'annee',
      cabecalho: t5(D.annee, lang),
      celula: (l) => String(l.annee),
      largura: '70px',
      numerica: true,
      ordenavel: true,
      rotuloOrdem: ordem,
    },
  ]
}

function feedbackDemo(lang: AbilLang): Feedback {
  return { carregando: t5(D.chargement, lang), vazio: t5(D.vide, lang) }
}

function TabelaDemo({ lang }: { lang: AbilLang }) {
  const [ordem, setOrdem] = useState<{ chave: string; sentido: SentidoOrdem } | null>({
    chave: 'budget',
    sentido: 'desc',
  })
  const [sel, setSel] = useState<readonly string[]>(['b'])

  const ordenadas = [...LINHAS_DEMO].sort((x, y) => {
    if (!ordem) return 0
    const dir = ordem.sentido === 'asc' ? 1 : -1
    if (ordem.chave === 'budget') return (x.budget - y.budget) * dir
    if (ordem.chave === 'annee') return (x.annee - y.annee) * dir
    return x.projet.localeCompare(y.projet) * dir
  })

  return (
    <Tabela<LinhaDemo>
      colunas={colunasDemo(lang)}
      linhas={ordenadas}
      idLinha={(l) => l.id}
      legenda={t5(D.legenda, lang)}
      alturaMax={220}
      ordem={ordem}
      onOrdenar={(chave, sentido) => setOrdem({ chave, sentido })}
      seleccao={{
        seleccionadas: sel,
        onAlternar: (id, on) => setSel((s) => (on ? [...s, id] : s.filter((x) => x !== id))),
        onAlternarTodas: (todas) => setSel(todas ? LINHAS_DEMO.map((l) => l.id) : []),
        rotuloLinha: (l) => rotuloLinhaDemo(l.projet, lang),
        rotuloTodas: t5(D.tout, lang),
      }}
      feedback={feedbackDemo(lang)}
    />
  )
}

function PaginacaoDemo({ inicial, lang }: { inicial: number; lang: AbilLang }) {
  const [pagina, setPagina] = useState(inicial)
  return (
    <Paginacao
      pagina={pagina}
      porPagina={20}
      total={214}
      onIr={setPagina}
      rotuloIntervalo={(de, ate, total) => intervaloDemo(de, ate, total, lang)}
      rotuloAnterior={t5(D.precedent, lang)}
      rotuloSeguinte={t5(D.suivant, lang)}
      rotuloNavegacao={t5(D.nav, lang)}
      rotuloPagina={(n) => rotuloPaginaDemo(n, lang)}
      feedback={feedbackDemo(lang)}
    />
  )
}

function FiltrosDemo({ estado, lang }: { estado: EstadoDados; lang: AbilLang }) {
  const [activos, setActivos] = useState<readonly string[]>(['cours'])
  const [busca, setBusca] = useState('')
  return (
    <Filtros
      rotuloGrupo={t5(D.grupo, lang)}
      pills={[
        { id: 'cours', rotulo: t5(ST.curso, lang), contagem: 12, activo: activos.includes('cours') },
        { id: 'livre', rotulo: t5(ST.entregue, lang), contagem: 8, activo: activos.includes('livre') },
        { id: 'devis', rotulo: t5(ST.orcamento, lang), contagem: 3, activo: activos.includes('devis') },
      ]}
      onAlternar={(id) =>
        setActivos((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))
      }
      busca={{
        valor: busca,
        onMudar: setBusca,
        rotulo: t5(D.rechercher, lang),
        marcador: t5(D.marcador, lang),
        rotuloLimpar: t5(D.effacer, lang),
      }}
      contagem={t5(D.resultats, lang)}
      estado={estado}
      feedback={feedbackDemo(lang)}
    />
  )
}

function ListaDemo({ lang }: { lang: AbilLang }) {
  return (
    <ListaLinhas
      linhas={[
        {
          id: '1',
          titulo: 'Identité ABiL',
          meta: t5(D.meta1, lang),
          fim: '2026',
          conteudo: <p>{t5(D.conteudo1, lang)}</p>,
        },
        {
          id: '2',
          titulo: 'Campagne Lémanique',
          meta: t5(D.meta2, lang),
          fim: '2026',
          conteudo: <p>{t5(D.conteudo2, lang)}</p>,
        },
        { id: '3', titulo: 'Refonte Horlogerie', meta: t5(D.meta3, lang), fim: '2025' },
      ]}
      feedback={feedbackDemo(lang)}
    />
  )
}

export type Amostra = { nome: L5; nota: L5; exemplo: (lang: AbilLang) => ReactNode }

// eslint-disable-next-line react-refresh/only-export-components
export const AMOSTRAS: Amostra[] = [
  {
    nome: {
      fr: 'Tableau, prêt',
      en: 'Table, ready',
      pt: 'Tabela, pronta',
      de: 'Tabelle, bereit',
      it: 'Tabella, pronta',
    },
    nota: {
      fr: "En-tête fixe (le contenu défile à l'intérieur, hauteur 220), tri par Budget avec flèche dessinée, colonne numérique à droite en tabular-nums, une ligne sélectionnée et la case de l'en-tête en état indéterminé. Pas de zébrures: c'est la hairline qui sépare.",
      en: 'Sticky header (the content scrolls inside, height 220), sorting by Budget with a drawn arrow, numeric column right-aligned in tabular-nums, one selected row and the header checkbox in the indeterminate state. No zebra striping: the hairline does the separating.',
      pt: 'Cabeçalho fixo (o conteúdo rola por dentro, altura 220), ordenação por Orçamento com seta desenhada, coluna numérica à direita com tabular-nums, uma linha selecionada e a caixa do cabeçalho em estado indeterminado. Sem zebra: quem separa é a hairline.',
      de: 'Fixierte Kopfzeile (der Inhalt scrollt innen, Höhe 220), Sortierung nach Budget mit gezeichnetem Pfeil, numerische Spalte rechts in tabular-nums, eine ausgewählte Zeile und das Kästchen der Kopfzeile im unbestimmten Zustand. Keine Zebrastreifen: getrennt wird mit der Haarlinie.',
      it: "Intestazione fissa (il contenuto scorre all'interno, altezza 220), ordinamento per Budget con freccia disegnata, colonna numerica a destra in tabular-nums, una riga selezionata e la casella dell'intestazione in stato indeterminato. Niente zebratura: a separare è la hairline.",
    },
    exemplo: (lang) => <TabelaDemo lang={lang} />,
  },
  {
    nome: {
      fr: 'Tableau, en chargement',
      en: 'Table, loading',
      pt: 'Tabela, a carregar',
      de: 'Tabelle, lädt',
      it: 'Tabella, in caricamento',
    },
    nota: {
      fr: 'Squelette à la forme du tableau (mêmes colonnes, mêmes largeurs) et hairline qui balaie en dessous. aria-busy sur le tableau et le mot du fichier de retour annoncé par role=status.',
      en: 'Skeleton shaped like the table (same columns, same widths) with the hairline sweeping underneath. aria-busy on the table and the wording from the feedback file announced through role=status.',
      pt: 'Esqueleto com a forma da tabela (mesmas colunas, mesmas larguras) e a hairline a varrer por baixo. aria-busy na tabela e a palavra do ficheiro de retorno anunciada por role=status.',
      de: 'Skelett in der Form der Tabelle (gleiche Spalten, gleiche Breiten) und die Haarlinie, die darunter durchläuft. aria-busy an der Tabelle und der Text aus der Rückmeldungsdatei über role=status angesagt.',
      it: 'Scheletro con la forma della tabella (stesse colonne, stesse larghezze) e la hairline che scorre sotto. aria-busy sulla tabella e la parola del file di riscontro annunciata da role=status.',
    },
    exemplo: (lang) => (
      <Tabela<LinhaDemo>
        colunas={colunasDemo(lang)}
        linhas={[]}
        idLinha={(l) => l.id}
        legenda={t5(D.legenda, lang)}
        estado="carregando"
        feedback={feedbackDemo(lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Tableau, vide',
      en: 'Table, empty',
      pt: 'Tabela, vazia',
      de: 'Tabelle, leer',
      it: 'Tabella, vuota',
    },
    nota: {
      fr: "L'en-tête reste (il dit ce que le tableau montrerait) et la raison occupe toute la largeur. Le mot vient du fichier de retour, jamais de ce fichier-ci.",
      en: 'The header stays (it says what the table would show) and the reason spans the whole width. The wording comes from the feedback file, never from this one.',
      pt: 'O cabeçalho fica (diz o que a tabela mostraria) e a razão ocupa a largura toda. A palavra vem do ficheiro de retorno, nunca deste ficheiro.',
      de: 'Die Kopfzeile bleibt (sie sagt, was die Tabelle zeigen würde) und die Begründung nimmt die volle Breite ein. Der Text kommt aus der Rückmeldungsdatei, nie aus dieser Datei.',
      it: "L'intestazione resta (dice che cosa mostrerebbe la tabella) e la ragione occupa tutta la larghezza. La parola viene dal file di riscontro, mai da questo file.",
    },
    exemplo: (lang) => (
      <Tabela<LinhaDemo>
        colunas={colunasDemo(lang)}
        linhas={[]}
        idLinha={(l) => l.id}
        legenda={t5(D.legenda, lang)}
        estado="vazio"
        feedback={feedbackDemo(lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Pagination, au milieu',
      en: 'Pagination, mid-range',
      pt: 'Paginação, a meio',
      de: 'Seitennavigation, in der Mitte',
      it: 'Paginazione, a metà',
    },
    nota: {
      fr: 'Comptage à gauche par une fonction du dictionnaire, précédent et suivant avec flèche dessinée, saut par numéro à deux chiffres et points de suspension aux coupures. La page actuelle porte aria-current.',
      en: 'Count on the left from a dictionary function, previous and next with a drawn arrow, jump by two-digit number and an ellipsis at each cut. The current page carries aria-current.',
      pt: 'Contagem à esquerda por função do dicionário, anterior e seguinte com seta desenhada, salto por número a dois dígitos e reticências nos cortes. A página atual traz aria-current.',
      de: 'Zählung links über eine Funktion des Wörterbuchs, Zurück und Weiter mit gezeichnetem Pfeil, Sprung über zweistellige Nummern und Auslassungspunkte an den Schnitten. Die aktuelle Seite trägt aria-current.',
      it: 'Conteggio a sinistra tramite una funzione del dizionario, precedente e successivo con freccia disegnata, salto per numero a due cifre e puntini di sospensione nei tagli. La pagina attuale porta aria-current.',
    },
    exemplo: (lang) => <PaginacaoDemo inicial={3} lang={lang} />,
  },
  {
    nome: {
      fr: 'Pagination, première page',
      en: 'Pagination, first page',
      pt: 'Paginação, primeira página',
      de: 'Seitennavigation, erste Seite',
      it: 'Paginazione, prima pagina',
    },
    nota: {
      fr: "Précédent réellement désactivé (attribut disabled, pas seulement grisé), pour que le clavier ne s'arrête pas sur un bouton qui ne fait rien.",
      en: 'Previous genuinely disabled (the disabled attribute, not just greyed out), so the keyboard does not stop on a button that does nothing.',
      pt: 'Anterior desativado a sério (atributo disabled, não apenas cinzento), para o teclado não parar num botão que não faz nada.',
      de: 'Zurück wirklich deaktiviert (Attribut disabled, nicht nur ausgegraut), damit die Tastatur nicht auf einer Schaltfläche stehen bleibt, die nichts tut.',
      it: 'Precedente davvero disattivato (attributo disabled, non solo grigio), perché la tastiera non si fermi su un pulsante che non fa nulla.',
    },
    exemplo: (lang) => <PaginacaoDemo inicial={1} lang={lang} />,
  },
  {
    nome: {
      fr: 'Pagination, en chargement',
      en: 'Pagination, loading',
      pt: 'Paginação, a carregar',
      de: 'Seitennavigation, lädt',
      it: 'Paginazione, in caricamento',
    },
    nota: {
      fr: 'Barre unique avec le balayage. Aucun numéro affiché: des numéros en cours de chargement seraient des numéros faux.',
      en: 'A single bar with the sweep. No numbers shown: numbers while loading would be wrong numbers.',
      pt: 'Barra única com a varredura. Não mostra números: números a carregar seriam números errados.',
      de: 'Ein einzelner Balken mit dem Durchlauf. Keine Nummern: Nummern während des Ladens wären falsche Nummern.',
      it: 'Barra unica con la scansione. Nessun numero mostrato: numeri in caricamento sarebbero numeri sbagliati.',
    },
    exemplo: (lang) => (
      <Paginacao
        pagina={1}
        porPagina={20}
        total={214}
        onIr={() => {}}
        rotuloIntervalo={(de, ate, total) => intervaloDemo(de, ate, total, lang)}
        rotuloAnterior={t5(D.precedent, lang)}
        rotuloSeguinte={t5(D.suivant, lang)}
        rotuloNavegacao={t5(D.nav, lang)}
        estado="carregando"
        feedback={feedbackDemo(lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Pagination, sans résultats',
      en: 'Pagination, no results',
      pt: 'Paginação, sem resultados',
      de: 'Seitennavigation, ohne Ergebnisse',
      it: 'Paginazione, nessun risultato',
    },
    nota: {
      fr: "Avec un total à zéro il n'y a pas de pages à parcourir: la barre dit la raison au lieu d'afficher 01 de 01.",
      en: 'With a total of zero there are no pages to walk through, so the bar states the reason instead of showing 01 of 01.',
      pt: 'Com total zero não há páginas para navegar, por isso a barra passa a dizer a razão em vez de mostrar 01 de 01.',
      de: 'Bei einer Gesamtzahl von null gibt es keine Seiten zum Blättern, also nennt die Leiste den Grund, statt 01 von 01 anzuzeigen.',
      it: 'Con totale zero non ci sono pagine da percorrere, quindi la barra dice la ragione invece di mostrare 01 di 01.',
    },
    exemplo: (lang) => (
      <Paginacao
        pagina={1}
        porPagina={20}
        total={0}
        onIr={() => {}}
        rotuloIntervalo={(de, ate, total) => intervaloDemo(de, ate, total, lang)}
        rotuloAnterior={t5(D.precedent, lang)}
        rotuloSeguinte={t5(D.suivant, lang)}
        rotuloNavegacao={t5(D.nav, lang)}
        feedback={feedbackDemo(lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Filtres, prêts',
      en: 'Filters, ready',
      pt: 'Filtros, prontos',
      de: 'Filter, bereit',
      it: 'Filtri, pronti',
    },
    nota: {
      fr: 'Pills avec aria-pressed et compteur à deux chiffres, champ de recherche dont le rail balaie au focus, effacement fait avec le + tourné, et le nombre de résultats toujours visible en role=status.',
      en: 'Pills with aria-pressed and a two-digit count, a search field whose rail sweeps on focus, clearing done with the rotated +, and the result count always visible through role=status.',
      pt: 'Pills com aria-pressed e contagem a dois dígitos, campo de pesquisa com trilho que varre no foco, limpar feito com o + rodado, e o número de resultados sempre visível em role=status.',
      de: 'Pills mit aria-pressed und zweistelliger Zählung, Suchfeld mit Schiene, die beim Fokus durchläuft, Löschen über das gedrehte +, und die Trefferzahl immer sichtbar über role=status.',
      it: 'Pill con aria-pressed e conteggio a due cifre, campo di ricerca con binario che scorre al focus, cancellazione fatta con il + ruotato, e il numero di risultati sempre visibile in role=status.',
    },
    exemplo: (lang) => <FiltrosDemo estado="pronto" lang={lang} />,
  },
  {
    nome: {
      fr: 'Filtres, en chargement',
      en: 'Filters, loading',
      pt: 'Filtros, a carregar',
      de: 'Filter, laden',
      it: 'Filtri, in caricamento',
    },
    nota: {
      fr: "Les pills deviennent des cadres vides (la forme reste, le libellé pas encore), le champ se désactive et le compteur dit qu'il charge au lieu d'afficher un vieux nombre.",
      en: 'The pills become empty frames (the shape stays, the label not yet), the field switches off and the count says it is loading instead of showing a stale number.',
      pt: 'As pills viram moldura vazia (a forma fica, o rótulo ainda não), o campo desativa e a contagem passa a dizer que está a carregar em vez de mostrar um número velho.',
      de: 'Die Pills werden zu leeren Rahmen (die Form bleibt, die Beschriftung noch nicht), das Feld wird deaktiviert und die Zählung sagt, dass geladen wird, statt eine alte Zahl zu zeigen.',
      it: "Le pill diventano cornici vuote (la forma resta, l'etichetta non ancora), il campo si disattiva e il conteggio dice che sta caricando invece di mostrare un numero vecchio.",
    },
    exemplo: (lang) => <FiltrosDemo estado="carregando" lang={lang} />,
  },
  {
    nome: {
      fr: 'Filtres, sans résultats',
      en: 'Filters, no results',
      pt: 'Filtros, sem resultados',
      de: 'Filter, ohne Ergebnisse',
      it: 'Filtri, nessun risultato',
    },
    nota: {
      fr: "Les pills restent actives (c'est par elles qu'on sort du vide) et le compteur est remplacé par la raison.",
      en: 'The pills stay active (they are the way out of the empty state) and the count is replaced by the reason.',
      pt: 'As pills continuam ativas (é por elas que se sai do vazio) e a contagem é substituída pela razão.',
      de: 'Die Pills bleiben aktiv (über sie kommt man aus dem leeren Zustand heraus) und die Zählung wird durch die Begründung ersetzt.',
      it: "Le pill restano attive (è da lì che si esce dal vuoto) e il conteggio è sostituito dalla ragione.",
    },
    exemplo: (lang) => <FiltrosDemo estado="vazio" lang={lang} />,
  },
  {
    nome: {
      fr: 'Carte, avec en-tête et actions',
      en: 'Card, with header and actions',
      pt: 'Cartão, com cabeçalho e ações',
      de: 'Karte, mit Kopfzeile und Aktionen',
      it: 'Scheda, con intestazione e azioni',
    },
    nota: {
      fr: "Hairline tout autour, zéro ombre, eyebrow en micro avec tracking positif, titre en corps section et capitales, zone d'actions à droite et note de pied en encre faible.",
      en: 'Hairline all around, zero shadow, eyebrow at micro size with positive tracking, title at section size in caps, action area on the right and a footnote in weak ink.',
      pt: 'Hairline a toda a volta, zero sombra, eyebrow em micro com tracking positivo, título em secção caixa alta, zona de ações à direita e nota de rodapé em tinta fraca.',
      de: 'Haarlinie rundherum, kein Schatten, Eyebrow in Mikrogröße mit positiver Laufweite, Titel in Sektionsgröße in Versalien, Aktionsbereich rechts und Fußnote in schwacher Tinte.',
      it: "Hairline tutt'intorno, zero ombra, eyebrow in micro con tracking positivo, titolo in corpo sezione e maiuscolo, zona delle azioni a destra e nota a piè di pagina in inchiostro debole.",
    },
    exemplo: (lang) => (
      <Cartao
        eyebrow={t5(D.cartaoEyebrow, lang)}
        titulo={t5(D.cartaoTitulo, lang)}
        nota={t5(D.cartaoNota, lang)}
        accoes={
          <button type="button" className="ad-pag-btn">
            {t5(D.accao, lang)}
          </button>
        }
      >
        <p>{t5(D.cartaoCorpo, lang)}</p>
      </Cartao>
    ),
  },
  {
    nome: {
      fr: 'Carte nue, avec tableau à ras',
      en: 'Bare card, with flush table',
      pt: 'Cartão nu, com tabela encostada',
      de: 'Karte ohne Innenrand, mit bündiger Tabelle',
      it: 'Scheda nuda, con tabella a filo',
    },
    nota: {
      fr: "Corps sans padding pour que le tableau atteigne les hairlines de la carte. C'est ainsi qu'un onglet montre une liste dans un bloc.",
      en: 'Body without padding so the table reaches the hairlines of the card. This is how a tab shows a list inside a block.',
      pt: 'Corpo sem padding para a tabela chegar às hairlines do cartão. É assim que um separador mostra uma lista dentro de um bloco.',
      de: 'Körper ohne Innenabstand, damit die Tabelle die Haarlinien der Karte erreicht. So zeigt ein Reiter eine Liste innerhalb eines Blocks.',
      it: 'Corpo senza padding perché la tabella arrivi alle hairline della scheda. È così che una sezione mostra un elenco dentro un blocco.',
    },
    exemplo: (lang) => (
      <Cartao titulo={t5(D.legenda, lang)} nu>
        <TabelaDemo lang={lang} />
      </Cartao>
    ),
  },
  {
    nome: {
      fr: 'Carte, en chargement',
      en: 'Card, loading',
      pt: 'Cartão, a carregar',
      de: 'Karte, lädt',
      it: 'Scheda, in caricamento',
    },
    nota: {
      fr: "L'en-tête reste (on sait déjà ce qui arrive) et le corps devient trois barres avec le balayage. aria-busy sur la section.",
      en: 'The header stays (we already know what is coming) and the body becomes three bars with the sweep. aria-busy on the section.',
      pt: 'O cabeçalho fica (já se sabe o que vem) e o corpo passa a três barras com a varredura. aria-busy na secção.',
      de: 'Die Kopfzeile bleibt (man weiß schon, was kommt) und der Körper wird zu drei Balken mit dem Durchlauf. aria-busy am Abschnitt.',
      it: "L'intestazione resta (si sa già che cosa arriva) e il corpo diventa tre barre con la scansione. aria-busy sulla sezione.",
    },
    exemplo: (lang) => (
      <Cartao
        eyebrow={t5(D.cartaoEyebrow, lang)}
        titulo={t5(D.cartaoTitulo, lang)}
        estado="carregando"
        feedback={feedbackDemo(lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Carte, vide',
      en: 'Card, empty',
      pt: 'Cartão, vazio',
      de: 'Karte, leer',
      it: 'Scheda, vuota',
    },
    nota: {
      fr: "La note de pied disparaît dans l'état vide: on ne cite pas une source de données quand il n'y a aucune donnée.",
      en: 'The footnote disappears in the empty state: you do not cite a data source when there is no data at all.',
      pt: 'A nota de rodapé desaparece no estado vazio: uma fonte de dados não se cita quando não há dado nenhum.',
      de: 'Die Fußnote verschwindet im leeren Zustand: eine Datenquelle zitiert man nicht, wenn es gar keine Daten gibt.',
      it: "La nota a piè di pagina sparisce nello stato vuoto: una fonte di dati non si cita quando non c'è nessun dato.",
    },
    exemplo: (lang) => (
      <Cartao
        eyebrow={t5(D.cartaoEyebrow, lang)}
        titulo={t5(D.cartaoTitulo, lang)}
        nota={t5(D.cartaoNota, lang)}
        estado="vazio"
        feedback={feedbackDemo(lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Liste de lignes, prête',
      en: 'Row list, ready',
      pt: 'Lista de linhas, pronta',
      de: 'Zeilenliste, bereit',
      it: 'Elenco di righe, pronto',
    },
    nota: {
      fr: "Accordéon en grid-template-rows (de 0fr à 1fr), caret dessiné qui tourne de 45 à 225 degrés, hairline qui balaie au survol et qui reste tenue quand la ligne est ouverte. La troisième ligne n'a pas de contenu: elle ne feint ni caret ni bouton.",
      en: 'Accordion on grid-template-rows (0fr to 1fr), a drawn caret turning from 45 to 225 degrees, a hairline that sweeps on hover and stays put while the row is open. The third row has no content, so it fakes neither caret nor button.',
      pt: 'Acordeão em grid-template-rows (de 0fr para 1fr), caret desenhado a rodar de 45 para 225 graus, hairline que varre ao passar o rato e que fica presa com a linha aberta. A terceira linha não tem conteúdo, por isso não finge caret nem botão.',
      de: 'Akkordeon über grid-template-rows (von 0fr auf 1fr), gezeichnetes Caret, das von 45 auf 225 Grad dreht, Haarlinie, die beim Überfahren durchläuft und bei offener Zeile stehen bleibt. Die dritte Zeile hat keinen Inhalt und täuscht daher weder Caret noch Schaltfläche vor.',
      it: 'Fisarmonica su grid-template-rows (da 0fr a 1fr), caret disegnato che ruota da 45 a 225 gradi, hairline che scorre al passaggio del mouse e resta ferma con la riga aperta. La terza riga non ha contenuto, quindi non finge né caret né pulsante.',
    },
    exemplo: (lang) => <ListaDemo lang={lang} />,
  },
  {
    nome: {
      fr: 'Liste de lignes, en chargement',
      en: 'Row list, loading',
      pt: 'Lista de linhas, a carregar',
      de: 'Zeilenliste, lädt',
      it: 'Elenco di righe, in caricamento',
    },
    nota: {
      fr: 'Quatre lignes en squelette au bon rythme (titre en sub, méta en micro) et la hairline de chaque ligne à sa place.',
      en: 'Four skeleton rows with the right rhythm (title at sub size, meta at micro) and the hairline of each row in place.',
      pt: 'Quatro linhas em esqueleto com o ritmo certo (título em sub, meta em micro) e a hairline de cada linha no lugar.',
      de: 'Vier Skelettzeilen im richtigen Rhythmus (Titel in Sub, Meta in Mikro) und die Haarlinie jeder Zeile an ihrem Platz.',
      it: 'Quattro righe in scheletro con il ritmo giusto (titolo in sub, meta in micro) e la hairline di ogni riga al suo posto.',
    },
    exemplo: (lang) => <ListaLinhas linhas={[]} estado="carregando" feedback={feedbackDemo(lang)} />,
  },
  {
    nome: {
      fr: 'Liste de lignes, vide',
      en: 'Row list, empty',
      pt: 'Lista de linhas, vazia',
      de: 'Zeilenliste, leer',
      it: 'Elenco di righe, vuoto',
    },
    nota: {
      fr: 'Sans lignes, pas de hairlines qui feignent une structure: il ne reste que la raison.',
      en: 'With no rows there are no hairlines faking structure: only the reason remains.',
      pt: 'Sem linhas não há hairlines a fingir estrutura: fica só a razão.',
      de: 'Ohne Zeilen gibt es keine Haarlinien, die Struktur vortäuschen: es bleibt nur die Begründung.',
      it: 'Senza righe non ci sono hairline a fingere struttura: resta solo la ragione.',
    },
    exemplo: (lang) => (
      <ListaLinhas
        linhas={[]}
        estado="vazio"
        feedback={{ ...feedbackDemo(lang), vazio: t5(D.vazioLista, lang) }}
      />
    ),
  },
  {
    nome: {
      fr: 'Métrique, avec valeur',
      en: 'Metric, with value',
      pt: 'Métrica, com valor',
      de: 'Kennzahl, mit Wert',
      it: 'Metrica, con valore',
    },
    nota: {
      fr: "Libellé en eyebrow, nombre en corps titre avec graisse 300 et tabular-nums, unité un cran plus petite (règle de la maison: la quantité s'écrit toujours plus petite que ce qu'elle compte).",
      en: 'Eyebrow label, number at title size in weight 300 with tabular-nums, unit one step smaller (house rule: the quantity is always set smaller than the thing it counts).',
      pt: 'Rótulo em eyebrow, número em título com peso 300 e tabular-nums, unidade num degrau menor (regra da casa: a quantidade escreve-se sempre menor do que aquilo que conta).',
      de: 'Beschriftung als Eyebrow, Zahl in Titelgröße mit Schriftstärke 300 und tabular-nums, Einheit eine Stufe kleiner (Hausregel: die Menge steht immer kleiner als das, was sie zählt).',
      it: 'Etichetta in eyebrow, numero in corpo titolo con peso 300 e tabular-nums, unità di un gradino più piccola (regola della casa: la quantità si scrive sempre più piccola di ciò che conta).',
    },
    exemplo: (lang) => (
      <Metrica
        rotulo={t5(D.metRotulo, lang)}
        valor="24"
        unidade={t5(D.metUnidade, lang)}
        nota={t5(D.metNota, lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Métrique, signalée',
      en: 'Metric, flagged',
      pt: 'Métrica, assinalada',
      de: 'Kennzahl, markiert',
      it: 'Metrica, segnalata',
    },
    nota: {
      fr: "La hairline Violette sous le nombre marque que la métrique demande de l'attention. Violette signale, elle ne décore jamais.",
      en: 'The Violette hairline under the number marks that the metric asks for attention. Violette signals, it never decorates.',
      pt: 'A hairline Violette por baixo do número marca que a métrica pede atenção. Violette assinala, nunca decora.',
      de: 'Die Violette-Haarlinie unter der Zahl markiert, dass die Kennzahl Aufmerksamkeit verlangt. Violette signalisiert, sie dekoriert nie.',
      it: 'La hairline Violette sotto il numero segnala che la metrica chiede attenzione. Violette segnala, non decora mai.',
    },
    exemplo: (lang) => (
      <Metrica
        rotulo={t5(D.metAtraso, lang)}
        valor="03"
        nota={t5(D.metAtrasoNota, lang)}
        assinalada
      />
    ),
  },
  {
    nome: {
      fr: 'Métrique, valeur inexistante',
      en: 'Metric, no value at all',
      pt: 'Métrica, valor inexistente',
      de: 'Kennzahl, Wert nicht vorhanden',
      it: 'Metrica, valore inesistente',
    },
    nota: {
      fr: "Le cas pour lequel ce primitif existe: quand il n'y a pas de mesure, il montre la RAISON en mots. Jamais un tiret, jamais un zéro. Le type l'impose: avec une valeur null, la prop raison devient obligatoire.",
      en: 'The case this primitive exists to solve: when there is no measurement, it shows the REASON in words. Never a dash, never a zero. The type enforces it: with a null value, the reason prop becomes required.',
      pt: 'O caso que este primitivo existe para resolver: quando não há medida, mostra a RAZÃO em palavras. Nunca um traço, nunca um zero. O tipo obriga: com valor null, a prop razão passa a obrigatória.',
      de: 'Der Fall, für den dieses Primitiv existiert: wenn es keine Messung gibt, zeigt es den GRUND in Worten. Nie einen Strich, nie eine Null. Der Typ erzwingt es: bei einem Wert null wird die Prop Grund zur Pflicht.',
      it: "Il caso per cui questo primitivo esiste: quando non c'è misura, mostra la RAGIONE a parole. Mai un trattino, mai uno zero. Il tipo lo impone: con valore null, la prop ragione diventa obbligatoria.",
    },
    exemplo: (lang) => (
      <Metrica rotulo={t5(D.metPortee, lang)} valor={null} razao={t5(D.metRazao, lang)} />
    ),
  },
  {
    nome: {
      fr: 'Métrique, en chargement',
      en: 'Metric, loading',
      pt: 'Métrica, a carregar',
      de: 'Kennzahl, lädt',
      it: 'Metrica, in caricamento',
    },
    nota: {
      fr: 'Le libellé apparaît déjà (on sait ce qui arrive), le nombre est une barre avec le balayage. aria-busy sur le bloc.',
      en: 'The label is already there (we know what is coming), the number is a bar with the sweep. aria-busy on the block.',
      pt: 'O rótulo já aparece (sabe-se o que vem), o número é uma barra com varredura. aria-busy no bloco.',
      de: 'Die Beschriftung erscheint bereits (man weiß, was kommt), die Zahl ist ein Balken mit dem Durchlauf. aria-busy am Block.',
      it: "L'etichetta appare già (si sa che cosa arriva), il numero è una barra con la scansione. aria-busy sul blocco.",
    },
    exemplo: (lang) => (
      <Metrica
        rotulo={t5(D.metRotulo, lang)}
        valor="24"
        estado="carregando"
        feedback={feedbackDemo(lang)}
      />
    ),
  },
  {
    nome: {
      fr: 'Métrique, vide',
      en: 'Metric, empty',
      pt: 'Métrica, vazia',
      de: 'Kennzahl, leer',
      it: 'Metrica, vuota',
    },
    nota: {
      fr: "État vide venu du fichier de retour, dessiné comme l'absence: filet Violette et mots.",
      en: 'Empty state coming from the feedback file, drawn as absence: a Violette rule and words.',
      pt: 'Estado vazio vindo do ficheiro de retorno, desenhado como a ausência: fio Violette e palavras.',
      de: 'Leerer Zustand aus der Rückmeldungsdatei, gezeichnet als Abwesenheit: Violette-Strich und Worte.',
      it: 'Stato vuoto proveniente dal file di riscontro, disegnato come assenza: filo Violette e parole.',
    },
    exemplo: (lang) => (
      <Metrica
        rotulo={t5(D.metPrimavera, lang)}
        valor="0"
        estado="vazio"
        feedback={{ ...feedbackDemo(lang), vazio: t5(D.metVazio, lang) }}
      />
    ),
  },
]
