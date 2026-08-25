/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                           
                                                                                                 
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                  
                                                                                      
                                                                                               
  
                                                                                                                
                                                                                                                               
                                                             
                                                                                                     
                                                                                                                    
                                                                                                                         
                                                                                                                    
                                                                                                                    
                                                                                                                  
                                                                                                                   
                                                                                                                           
                                                                                                    
  
                                                                                                                 
                                                                                       
                                                                                                     
                                                                                                              
                                                                                                                 
                                                                                                           
                                                                                                                 
                                                                                                              
                                                                                                                 
                                                                                                             
                                                                             
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";
                                                                                                               
                                                                                                                      
                                                                                                                      
                                                                                                             
                                                                                                          
import { computeBriefingScore, siteIlegivelDeAudit, scrubClaims, pickSegmentForLead, precisaLpProfunda } from "../src/lib/leadSegments.js";
                                                                                                                    
                                                                                                              
import { servicesCatalogBlock } from "../src/lib/servicesCatalog.js";

                                                                                                           
                                                                                                              
                                                                                                       
export const config = { runtime: "nodejs", maxDuration: 120 };
const TENANT = "abil";                                                                                                                                
const EVENTS_KEY = "replies/events.json";
const SEEN_KEY = "replies/seen.json";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const CRON_SECRET = process.env.CRON_SECRET || "";
const MAX_EVENTS = 200;
const MAX_SEEN = 2000;
const THREADS_PREFIX = "crm/threads/";                                                                                        
const RESEND_KEY = process.env.RESEND_API_KEY || "";
                                                                                                                     
                                                                                                                      
const NOTIFY_TO = process.env.REPLY_NOTIFY_TO || "";
const NOTIFY_FROM = process.env.REPLY_NOTIFY_FROM || process.env.RESEND_FROM || "ABiL <onboarding@resend.dev>";
                                                                                                  
const OWN_DOMAINS = ["abil.ch", "abil.ch"];
                                                                                                                 
                                                                                                       
                                                                                                                       
                                                                                                                           
const ZOHO_IMAP_HOST = process.env.ZOHO_IMAP_HOST || "imap.zoho.eu";
const ZOHO_IMAP_USER = process.env.ZOHO_SMTP_USER || "";
const ZOHO_IMAP_PASS = process.env.ZOHO_SMTP_PASS || "";
                                                                                                                      
const SUPPRESS_KEY = "prospecting/abil/suppress.json";

                                                                                                                       
                                                                                                                         
const SEND_HARD_OFF = process.env.ABIL_SEND_HARD_OFF !== "0";

                                                                                                                   
                                                                                                           
                                                                                                       
function selfBase(): string { return (process.env.PUBLIC_BASE_URL || process.env.ABIL_PUBLIC_BASE || "https://abil-site.vercel.app").replace(/\/$/, ""); }

function esc(s: any): string { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function dedupByMsgId(arr: any[]): any[] { const seen = new Set<string>(); return (arr || []).filter((e) => { const k = String(e?.msgId || ""); if (!k) return true; if (seen.has(k)) return false; seen.add(k); return true; }); }
function b64urlDecode(s: string): string { try { return Buffer.from(String(s || "").replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"); } catch { return ""; } }
function extractBody(payload: any): string {
  const walk = (p: any): string => {
    if (!p) return "";
    if (p.mimeType === "text/plain" && p.body?.data) return b64urlDecode(p.body.data);
    if (Array.isArray(p.parts)) { for (const c of p.parts) { const t = walk(c); if (t) return t; } }
                                                                                                            
                                                                                                   
                                                                                                    
                                                                                  
                                                                                                  
                                                                                     
    if (p.mimeType === "text/html" && p.body?.data) return b64urlDecode(p.body.data)
      .replace(/<blockquote[\s\S]*$/i, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(?:br|\/p|\/div|\/li|\/tr)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return "";
  };
  return walk(payload).slice(0, 8000);
}
function isOwnEmail(em: string): boolean { const e = String(em || "").trim().toLowerCase(); return OWN_DOMAINS.some((d) => e.endsWith(`@${d}`) || e.endsWith(`.${d}`)); }

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    if (BLOB_PUBLIC_BASE) { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.json(); if (r.status === 404) return fallback; }
    const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return fallback; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.json() : fallback;
  } catch { return fallback; }
}
async function writeJson(key: string, data: any): Promise<void> { await put(key, JSON.stringify(data), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }

                                                                                                         
                                                                                                          
                                                            
async function readThreadMerged(key: string): Promise<any[]> {
  const sources: any[][] = [];
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) sources.push(await r.json()); } catch {  } }
  try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (bl) { const r = await fetch(`${bl.url}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) sources.push(await r.json()); } } catch {  }
  const seen = new Set<string>(); const out: any[] = [];
  const idOf = (m: any) => String(m?.msgId || `${m?.dir}|${m?.at}|${String(m?.body || "").slice(0, 48)}`);
  for (const arr of sources) { if (!Array.isArray(arr)) continue; for (const m of arr) { if (!m) continue; const id = idOf(m); if (seen.has(id)) continue; seen.add(id); out.push(m); } }
  out.sort((a, b) => String(a?.at || "").localeCompare(String(b?.at || "")));
  return out;
}
                                                                                                          
                                                                                                             
                                                                                                              
                                                                                                                
                                                                                                                
                                                                                                          
async function respostaJaEnviada(leadId: string, sinceMs?: number): Promise<boolean> {
  if (!leadId) return false;
  try {
    const thread = await readThreadMerged(`${THREADS_PREFIX}${leadId}.json`);
    if (!thread.length) return false;
    const parse = (m: any) => Date.parse(String(m?.at || m?.date || "")) || 0;
    const ancora = (typeof sinceMs === "number" && sinceMs > 0)
      ? sinceMs
      : thread.filter((m) => m && m.dir === "in").reduce((mx, m) => Math.max(mx, parse(m)), 0);
    if (!ancora) return false;
    return thread.some((m) => m && m.dir === "out" && parse(m) >= ancora);
  } catch { return false; }
}
async function appendThread(leadId: string, msg: any): Promise<void> {
  if (!leadId) return;
  const key = `${THREADS_PREFIX}${leadId}.json`;
  try {
    const cur = await readThreadMerged(key);
    if (msg.msgId && cur.some((m) => m && m.msgId === msg.msgId)) return;                   
    cur.push(msg);
    await writeJson(key, cur.slice(-120));
  } catch {
                                                                                                              
                                                                                                     
    try {
      const cur2 = await readThreadMerged(key);
      if (!(msg.msgId && cur2.some((m) => m && m.msgId === msg.msgId))) { cur2.push(msg); await writeJson(key, cur2.slice(-120)); }
    } catch { console.error("appendThread: falhou 2x", leadId, msg?.msgId || ""); }
  }
}
                                                                                                                     
                                                                                                                   
                                                       
async function notifyReply(matched: any[]): Promise<void> {
  if (!RESEND_KEY || !NOTIFY_TO || !matched.length) return;
  const base = selfBase();
  const rows = matched.map((m) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee"><b>${esc(m.nome || m.email)}</b> &lt;${esc(m.email)}&gt;<br><span style="color:#555">${esc(m.subject || "")}</span><br><span style="color:#999;font-size:13px">${esc((m.snippet || "").slice(0, 200))}</span></td></tr>`).join("");
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px"><p style="font-size:16px">${matched.length} nova(s) resposta(s) de lead prospetado:</p><table style="width:100%">${rows}</table><p style="margin-top:16px"><a href="${base}/dashboard" style="background:#111;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px">Abrir no dashboard</a></p></div>`;
  try {
    await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: NOTIFY_FROM, to: [NOTIFY_TO], subject: `Resposta de lead: ${matched[0].nome || matched[0].email}${matched.length > 1 ? ` (+${matched.length - 1})` : ""}`, html }) });
  } catch {       }
}

                                                                     
                                                                                                           
                                                                                                            
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const SMARTCFG_KEY = "prospecting/abil/smartreply-config.json";
const DEFAULT_SMART_PROMPT = "És a voz do ABiL, atelier criativo em Genève, especializado em branding, design, web, vídeo e social, com o humano no comando e a IA como ferramenta. Um LEAD respondeu a uma abordagem do atelier. Escreve uma resposta CURTA, humana e consultiva, na VOZ do ABiL e na LÍNGUA do lead. O papel é de atendimento investigativo: perceber a necessidade do lead e preparar o terreno, NÃO vender de forma agressiva. Se faltar informação para responder bem, faz UMA pergunta inteligente. NUNCA inventes factos, prazos nem preços. Se o lead mostrar intenção de avançar ou pedir orçamento, propõe um próximo passo simples (por exemplo, preencher um briefing curto) sem prometer valores.";
                                                                                                                    
                                                                                                                  
                                                                                                                
                                                                                                                                
const AUTOSEND_CFG_KEY = "prospecting/abil/autosend-config.json";
async function readSig(): Promise<string> { try { const c: any = (await readJson<any>(AUTOSEND_CFG_KEY, {})) || {}; return typeof c.signatureHtml === "string" ? c.signatureHtml : ""; } catch { return ""; } }
function selfAdmin(): string { const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; if (!PW) return ""; const exp = Date.now() + 5 * 60 * 1000; const sig = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); return `${exp}.${sig}`; }
                                                                                                       
                                                                                                                   
                                                                                                             
                                                                                                                            
function slimPersona(p: any): any {
  if (!p || typeof p !== "object") return p;
  const o: any = {};
  for (const k of ["title", "name", "tonality", "avoid", "keywords", "visualRef", "prompt", "doList", "dontList", "estiloEscrita"]) {
    if (p[k] !== undefined && p[k] !== null && p[k] !== "") o[k] = p[k];
  }
  return o;
}
async function readPersonaCtx(): Promise<string> {
  const tok = selfAdmin(); if (!tok) return "";
  const base = selfBase();
  const get = async (col: string) => { try { const r = await fetch(`${base}/api/private-store?col=${col}&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" }); if (!r.ok) return null; const d: any = await r.json(); return d?.value ?? d?.data ?? d?.content ?? null; } catch { return null; } };
  let bp: any = await get("brand_persona"); let buy: any = await get("buyer_personas"); let refNotes = "";
                                                                                                             
                                                                                                             
                                                                                                       
                                                                                                         
                                                                                                              
                                                                                                           
                                                          
  if (!bp || !buy) {
    const snap: any = await get("agent_persona_snapshot");
    if (snap && typeof snap === "object") {
      if (!bp && snap.brandPersona) bp = snap.brandPersona;
      if (!buy && snap.buyerPersona) buy = snap.buyerPersona;
      if (typeof snap.referenceNotes === "string") refNotes = snap.referenceNotes;
    }
  }
                                                                                                                   
                                                                                                                     
                                                                                                                            
  const brandStyle = (bp && typeof bp === "object" && typeof (bp as any).estiloEscrita === "string") ? String((bp as any).estiloEscrita).trim() : "";
  const parts: string[] = [];
  if (bp) parts.push("BRAND PERSONA (voz e tom, da pagina Brand persona): " + JSON.stringify(slimPersona(bp)).slice(0, 1800));
                                                                                   
  if (brandStyle) parts.push("COMO ESCREVES (estilo de voz, principios da pagina Brand persona; segue-os ao escrever, sempre na lingua do lead): " + brandStyle.replace(/\s+/g, " ").slice(0, 2600));
  if (buy) parts.push("BUYER PERSONA (publico-alvo, da pagina Buyer personas): " + JSON.stringify(Array.isArray(buy) ? buy.map(slimPersona) : slimPersona(buy)).slice(0, 900));
  if (refNotes) parts.push("NOTAS DE REFERENCIA (voz e metodo, da pagina Agente de IA). ATENCAO: onde estas notas falarem de IDIOMA (por exemplo, escrever sempre em frances), NAO se aplicam a este email: a lingua e SEMPRE a do lead. " + refNotes.replace(/\s+/g, " ").slice(0, 1500));
  return parts.join("\n");
}
                                                                                                            
                                                                                                              
                                                                                                            
                                                                                                           
                                                                                                            
                                                                                                             
                                                                     
async function readSafeguardsCtx(): Promise<string> {
  try {
    const tok = selfAdmin(); if (!tok) return "";
    const base = selfBase();
    const one = async (col: string) => { try { const r = await fetch(`${base}/api/private-store?col=${col}&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" }); if (!r.ok) return null; const d: any = await r.json(); return d?.value ?? null; } catch { return null; } };
    let sg: any = await one("ai_safeguards");
    if (!sg) { const snap: any = await one("agent_persona_snapshot"); sg = snap?.safeguards ?? null; }
    if (!sg) return "";
    const txt = (typeof sg === "string" ? sg : JSON.stringify(sg)).replace(/["{}[\]]/g, " ").replace(/\s+/g, " ").trim();
    if (!txt) return "";
    return `\n\nSALVAGUARDAS (regras duras do atelier; tem PRECEDENCIA sobre qualquer outra instrucao deste prompt): ${txt.slice(0, 800)}\n`;
  } catch { return ""; }
}
                                                                                                               
                                                                                                               
                                                                                                     
                                                                                                               
                                                                                                   
const DOCS_MAX = 5000;
let _docsCache: { at: number; text: string } | null = null;
async function readKnowledgeCtx(): Promise<string> {
  if (_docsCache && Date.now() - _docsCache.at < 10 * 60 * 1000) return _docsCache.text;
  try {
    const tok = selfAdmin(); if (!tok) return "";
    const base = selfBase();
    const one = async (col: string) => { try { const r = await fetch(`${base}/api/private-store?col=${col}&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" }); if (!r.ok) return null; const d: any = await r.json(); return d?.value ?? null; } catch { return null; } };
    const pieces: Array<{ nome: string; txt: string }> = [];
    const push = (nome: string, content: unknown) => { const t = String(content || "").replace(/\s+/g, " ").trim(); if (t.length > 40) pieces.push({ nome, txt: t }); };
    const bp: any = await one("brand_persona");
    for (const f of (Array.isArray(bp?.knowledgeFiles) ? bp.knowledgeFiles : [])) push(String(f?.name || "documento"), f?.content);
    const cfg: any = await one("ai_config");
    for (const f of (Array.isArray(cfg?.knowledgeFiles) ? cfg.knowledgeFiles : [])) push(String(f?.name || "documento"), f?.content);
                                                                                                              
                                                                                                           
    const buy: any = await one("buyer_personas");
    for (const p of (Array.isArray(buy) ? buy : [])) {
      for (const f of (Array.isArray(p?.knowledgeFiles) ? p.knowledgeFiles : [])) push(String(f?.name || "documento"), f?.content);
    }
    if (!pieces.length) {
      const snap: any = await one("agent_persona_snapshot");
      const kn: any[] = Array.isArray(snap?.knowledge) ? snap.knowledge : [];
      kn.forEach((k, i) => push(`conhecimento ${i + 1}`, k));
    }
    if (!pieces.length) return "";
    const bits: string[] = []; let used = 0;
    for (const p of pieces) {
      const room = DOCS_MAX - used; if (room < 400) break;
      const slice = p.txt.slice(0, Math.min(room, 2500));
      used += slice.length;
      bits.push(`--- ${p.nome} ---\n${slice}`);
    }
    const text = `\n\nDOCUMENTOS ANEXADOS PELO OPERADOR (Knowledge base do dashboard: a filosofia, o metodo e os factos do atelier, na fonte. Trata isto como verdade e nunca o contradigas; se algo nao estiver aqui nem no dossier, nao existe):\n${bits.join("\n\n")}\n`;
    _docsCache = { at: Date.now(), text };
    return text;
  } catch { return ""; }
}
                                                                                                                 
                                                                                                                
                                                                                                                  
                                                                                                       
function noDash(s: string): string {
  return String(s || "")
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1-$2")
    .replace(/\s*[\u2013\u2014]\s*/g, ", ");
}
                                                                                         
                                                                                                                 
                                                                                                                      
                                                                                                                       
                                                                                                        
                                                                                                                   
                                                                                                   
                                                                                                            
const DEFAULT_PHILOSOPHY = [
  "Somos a ABiL, agência de criação, gestão e promoção de marcas.",
  "Não vendemos performance de site: entregamos marca, ideia e campanha, em 360, da personalidade da marca à activação que a torna memorável.",
  "O que nos distingue é a criatividade e a disrupção: a qualidade é o mínimo que um cliente espera.",
  "Postura comercial: nunca começamos por dizer que já sabemos do que o cliente precisa. Para vender a marca de alguém é preciso mergulhar no negócio dele primeiro. A análise automática mostra a PRIMEIRA IMPRESSÃO; uma análise profunda exige tempo, conversa e proximidade.",
  "Limites: nunca inventar factos, números, clientes ou preços; nunca fingir uma análise que não foi feita; nunca prometer resultados; falar sempre na língua do lead.",
].join("\n");
const PHILO_MAX = 24000;
let _philoCache: { at: number; text: string } | null = null;
function wrapPhilo(txt: string): string {
  return `\n\nQUEM TU ÉS (dossier real: quem somos, filosofia de trabalho e postura comercial. É a tua identidade: nunca a contradigas, nunca acrescentes factos que não estejam aqui):\n${String(txt || "").slice(0, PHILO_MAX)}\n`;
}
async function readPhilosophyCtx(): Promise<string> {
  if (_philoCache && Date.now() - _philoCache.at < 10 * 60 * 1000) return _philoCache.text;
  let txt = "";
  try {
    const tok = selfAdmin();
    if (tok) {
      const r = await fetch(`${selfBase()}/api/private-store?col=work_philosophy&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" });
      if (r.ok) {
        const d: any = await r.json().catch(() => null);
        const v: any = d?.value ?? null;
        const raw = typeof v === "string" ? v : (typeof v?.texto === "string" ? v.texto : "");
        txt = String(raw || "").trim();
      }
    }
  } catch { txt = ""; }                                                                        
  const text = wrapPhilo(txt || DEFAULT_PHILOSOPHY);
  _philoCache = { at: Date.now(), text };
  return text;
}
                                                                                                            
                                                                                                         
                                                                                                                   
                                                                                                              
                                                                                                                    
const BIO_MAX = 6500;
let _bioCache: { at: number; text: string } | null = null;
async function readBioCtx(): Promise<string> {
  if (_bioCache && Date.now() - _bioCache.at < 10 * 60 * 1000) return _bioCache.text;
  try {
    const tok = selfAdmin(); if (!tok) return "";
    const r = await fetch(`${selfBase()}/api/private-store?col=biography&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" });
    if (!r.ok) return "";
    const d: any = await r.json().catch(() => null);
    const v: any = d?.value ?? null;
    const raw = typeof v === "string" ? v : (typeof v?.texto === "string" ? v.texto : "");
    const txt = String(raw || "").trim();
    if (!txt) return "";
    const text = `\n\nCULTURE / MANIFESTE DA MARCA (a historia e os valores do atelier ABiL, a sua forma de ser e de trabalhar. E FONTE de factos, tratada como o dossier: usa-a com naturalidade para soar autentico e ancorar autoridade, NUNCA acrescentes factos que nao estejam aqui):\n${txt.slice(0, BIO_MAX)}\n`;
    _bioCache = { at: Date.now(), text };
    return text;
  } catch { return ""; }
}
                                                                                                                                                                                             
                                                                                                          
                                                                                                            
                                                                                                                    
const SITE_CTX_MAX = 3500;
let _siteCtxCache: { at: number; text: string } | null = null;
async function readSiteCtx(): Promise<string> {
  if (_siteCtxCache && Date.now() - _siteCtxCache.at < 10 * 60 * 1000) return _siteCtxCache.text;
  const indisponivel = `\n\nPORTFOLIO PUBLICADO: indisponivel agora (falha de leitura). NAO citem nenhum projeto especifico; se o lead pedir exemplos, digam-no honestamente e ofereçam enviar o portfolio a seguir.\n`;
  try {
    const r = await fetch(`${selfBase()}/api/projects?cb=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return indisponivel;
    const arr: any[] = await r.json().catch(() => null);
    if (!Array.isArray(arr) || !arr.length) return indisponivel;
    const linhas: string[] = []; let used = 0; let truncado = false;
    for (const p of arr) {
      if (!p || !p.title || p.hidden === true) continue;
      const ano = String(p.year || "").trim() || String(p.publishedAt || "").slice(0, 4);
      const cat = Array.isArray(p.categories) && p.categories.length ? String(p.categories.slice(0, 3).join(", ")) : "";
      const desc = String(p.description || "").replace(/\s+/g, " ").trim().slice(0, 140);
      const linha = `- ${String(p.title).slice(0, 90)}${p.client ? ` (cliente: ${String(p.client).slice(0, 60)})` : ""}${ano ? `, ${ano.slice(0, 8)}` : ""}${cat ? ` [${cat}]` : ""}${desc ? `: ${desc}` : ""}`;
      if (used + linha.length > SITE_CTX_MAX) { truncado = true; break; }
      used += linha.length + 1;
      linhas.push(linha);
    }
    if (!linhas.length) return indisponivel;
    const text = `\n\nPORTFOLIO PUBLICADO no site do ABiL (a lista REAL de projetos; lida agora do servidor). REGRA DURA: so podem citar projetos DESTA lista. Se o lead perguntar por um trabalho ou segmento fora dela, digam-no honestamente e ofereçam verificar.\n${linhas.join("\n")}${truncado ? "\n(lista truncada)" : ""}\n`;
    _siteCtxCache = { at: Date.now(), text };
    return text;
  } catch { return indisponivel; }
}
                                                                                                    
                                                                                                 
                                                                                                
                                                                                                             
const PRES_GEN_API_BASE = (process.env.PRES_GEN_API_BASE || "").replace(/\/$/, "");
async function readProposalCtx(lead: any): Promise<string> {
  try {
    const slug = String(lead?.proposalSlug || "").trim();
    if (!slug) return "";
    const r = await fetch(`${PRES_GEN_API_BASE}/api/proposal-store?site=abil&slug=${encodeURIComponent(slug)}&cb=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return "";
    const d: any = await r.json().catch(() => null);
    if (!d || (!d.quote && !d.vp)) return "";
                                                                                                           
    const raw = JSON.stringify({ quote: d.quote ?? null, vp: d.vp ?? null }).replace(/\s+/g, " ");
    return `\nPROPOSTA REAL enviada a este lead (lida AGORA do servidor; e a unica fonte de ambito, valores e condicoes de pagamento; citem SO o que esta aqui, nunca acrescentem numeros, percentagens nem prazos):\n${raw.slice(0, 2200)}\n`;
  } catch { return ""; }
}
                                                                                                         
                                                                                                                    
                                                                                                                    
                                                                           
let _journeyCache: { at: number; map: any } | null = null;
async function getJourneyMap(): Promise<any | null> {
  if (_journeyCache && Date.now() - _journeyCache.at < 10 * 60 * 1000) return _journeyCache.map;
  try {
    const tok = selfAdmin(); if (!tok) return null;
    const r = await fetch(`${selfBase()}/api/private-store?col=journey_map&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" });
    if (!r.ok) return null;
    const d: any = await r.json().catch(() => null);
    const map: any = (d?.value && typeof d.value === "object") ? d.value : null;
    _journeyCache = { at: Date.now(), map };
    return map;
  } catch { return null; }
}
                                                                                                                     
                                                                                                                      
                                    
function journeyMapBlock(map: any): string {
  if (!map || typeof map !== "object") return "";
  const fases = Array.isArray(map.fases) ? map.fases : [];
  const metodo = noDash(String(map.metodo || "").trim());
  const fld = (label: string, v: any): string => { const t = noDash(String(v || "").trim()); return t ? `\n  ${label}: ${t}` : ""; };
  const blocos = fases.map((f: any) => {
    const head = `- ${String(f?.id || "")} (${String(f?.nome || "")})`;
    const corpo =
      fld("momento", f?.momento) +
      fld("objetivo", f?.objetivo) +
      fld("estado mental do lead", f?.estadoMental) +
      fld("sinais", f?.sinais) +
      fld("acao", f?.acao) +
      fld("como falar", f?.comoFalar) +
      fld("entrega", f?.entrega) +
      fld("exemplo", f?.exemplo) +
      fld("evitar", f?.evitar) +
      fld("proxima fase", f?.proximaFase);
    return head + corpo;
  }).filter((s: string) => s.length > 12).join("\n\n");
  if (!metodo && !blocos) return "";
  return `\n\nMAPA DA JORNADA (o método de venda do atelier). Interpreta em que fase está ESTE lead pelos sinais REAIS (respondeu? quantas mensagens? há análise publicada? já recebeu o link? preencheu briefing?) e EXECUTA a ação dessa fase, no estado mental certo, no tom de "como falar", entregando o que a fase pede e EVITANDO os erros listados. O exemplo é só uma referência de tom, nunca para copiar tal e qual.${metodo ? `\nMETODO: ${metodo}` : ""}${blocos ? `\nFASES:\n${blocos}` : ""}\n`.slice(0, 30000);
}
                                                                                                       
function journeyPhaseAcao(map: any, phaseId: string): string {
  try { const f = (Array.isArray(map?.fases) ? map.fases : []).find((x: any) => String(x?.id || "") === phaseId); return f ? noDash(String(f.acao || "").trim()) : ""; }
  catch { return ""; }
}
async function callLLM(system: string, user: string): Promise<string | null> {
  if (ANTHROPIC_KEY) {
    try { const r = await fetch("https://api.anthropic.com/v1/messages", { signal: AbortSignal.timeout(45000), method: "POST", headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 700, system, messages: [{ role: "user", content: user }] }) }); if (r.ok) { const d: any = await r.json(); const t = (d?.content || []).map((c: any) => c?.text || "").join("").trim(); if (t) return t; } } catch {       }
  }
  if (OPENAI_KEY) {
    try { const r = await fetch("https://api.openai.com/v1/chat/completions", { signal: AbortSignal.timeout(45000), method: "POST", headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o", max_tokens: 700, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) }); if (r.ok) { const d: any = await r.json(); const t = d?.choices?.[0]?.message?.content?.trim(); if (t) return t; } } catch {  }
  }
  return null;
}
                                                                                                             
                                                                                                           
                                                                                  
async function callLLMJson(system: string, user: string): Promise<any> {
  if (OPENAI_KEY) {
    try { const r = await fetch("https://api.openai.com/v1/chat/completions", { signal: AbortSignal.timeout(45000), method: "POST", headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o", max_tokens: 1400, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) }); if (r.ok) { const d: any = await r.json(); const t = d?.choices?.[0]?.message?.content?.trim(); if (t) { try { return JSON.parse(t); } catch {  } } } } catch {  }
  }
  if (ANTHROPIC_KEY) {
    try { const r = await fetch("https://api.anthropic.com/v1/messages", { signal: AbortSignal.timeout(45000), method: "POST", headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1400, system, messages: [{ role: "user", content: user }, { role: "assistant", content: "{" }] }) }); if (r.ok) { const d: any = await r.json(); let t = (d?.content || []).map((c: any) => c?.text || "").join("").trim(); if (t) { t = "{" + t; try { return JSON.parse(t); } catch { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch {  } } } } } catch {  }
  }
  return null;
}
async function readSmartCfg(): Promise<{ enabled: boolean; autonomous: boolean; prompt: string; smartPromptCliente: string; autoDiagEnabled: boolean; autoDiagDailyCap: number; diagLayers?: Record<string, boolean>; declineText: string; declinePrompt: string; declinePromptCliente: string; deepAuto: boolean; deepDailyCap: number; autoPublishEnabled: boolean }> {
  const c: any = (await readJson<any>(SMARTCFG_KEY, {})) || {};
                                                                                                                  
                                                                                                          
                                                                                                                
                                                                                                                      
                                                                                                                    
                                                                                                                   
                                                                                                                     
                                                                                                                     
                                                                                        
                                                                                                                  
                                                                                                                    
                 
                                                                                                                  
                                                                                                                          
  return { enabled: !!c.enabled, autonomous: !!c.autonomous, prompt: (typeof c.prompt === "string" && c.prompt.trim()) ? c.prompt : DEFAULT_SMART_PROMPT, smartPromptCliente: (typeof c.smartPromptCliente === "string" ? c.smartPromptCliente : ""), autoDiagEnabled: !!c.autoDiagEnabled, autoDiagDailyCap: Math.max(1, Math.min(1000, Number(c.autoDiagDailyCap) || 40)), diagLayers: (c.diagLayers && typeof c.diagLayers === "object") ? c.diagLayers : undefined, declineText: typeof c.declineText === "string" ? c.declineText : "", declinePrompt: typeof c.declinePrompt === "string" ? c.declinePrompt : "", declinePromptCliente: typeof c.declinePromptCliente === "string" ? c.declinePromptCliente : "", deepAuto: !!c.deepAuto, deepDailyCap: Math.max(1, Math.min(100, Number(c.deepDailyCap) || 10)), autoPublishEnabled: !!c.autoPublishEnabled };
}
                                                                                                             
                                                                                                                 
function buildDiagCtx(lead: any): string {
  const a = lead?.audit; if (!a || typeof a !== "object") return "";
  const b = a.briefing || {}; const br = a.brand || {}; const bits: string[] = [];
  if (b.produto_central) bits.push(`produto ou servico central: ${b.produto_central}`);
  if (b.dor_resolvida) bits.push(`dor que resolve: ${b.dor_resolvida}`);
  if (b.diferencial_real) bits.push(`diferencial: ${b.diferencial_real}`);
  if (b.subnicho) bits.push(`subnicho: ${b.subnicho}`);
  if (b.gap_principal) bits.push(`gap principal de marca: ${b.gap_principal}`);
  if (b.prova_social) bits.push(`prova social: ${b.prova_social}`);
  if (br.what && !b.produto_central) bits.push(`o que faz: ${br.what}`);
  if (Array.isArray(br.opportunities) && br.opportunities.length) bits.push(`oportunidades vistas: ${br.opportunities.slice(0, 3).join(", ")}`);
  if (a.headline) bits.push(`headline do site: ${a.headline}`);
  if (a.googleRating != null) bits.push(`Google: ${a.googleRating} estrelas (${a.googleReviews || 0} avaliacoes)`);
  if (typeof a.perf === "number") bits.push(`performance do site: ${a.perf} de 100`);
  if (typeof a.seo === "number") bits.push(`SEO do site: ${a.seo} de 100`);
  if (Array.isArray(a.findings) && a.findings.length) bits.push(`observacoes: ${a.findings.slice(0, 3).join("; ")}`);
                                                                                                   
                                                                                                  
                                             
  const st = lead?.study;
  if (st && typeof st === "object") {
    if (st.estudo) bits.push(`estudo interno do lead: ${String(st.estudo).slice(0, 600)}`);
    const fq = st?.swot?.fraquezas; if (Array.isArray(fq) && fq.length) bits.push(`fraquezas observadas: ${fq.slice(0, 3).map((x: any) => x?.ponto || "").filter(Boolean).join("; ")}`);
    const vd = st?.vender; if (Array.isArray(vd) && vd.length) bits.push(`o que faz sentido vender: ${vd.slice(0, 3).map((x: any) => x?.servico ? `${x.servico} (${String(x.motivo || "").slice(0, 90)})` : "").filter(Boolean).join("; ")}`);
    if (st.proximoPasso) bits.push(`proximo passo sugerido: ${String(st.proximoPasso).slice(0, 200)}`);
  }
  if (!bits.length) return "";
  return `\nDIAGNÓSTICO REAL DA MARCA (análise objetiva do site e do Google, já feita pelo sistema; usa como contexto para responderes com mais precisão, mas NUNCA inventes números novos nem despejes estes dados crus dentro do email): ${bits.join("; ")}.\n`;
}
async function loadLead(leadId: string): Promise<any> {
  const cloud = await readJson<any>("crm/leads.json", { leads: [] });
  const leads: any[] = Array.isArray(cloud) ? cloud : (cloud?.leads || []);
  return leads.find((l) => String(l.id) === String(leadId)) || null;
}
                                                                                                                                                                                                                    
                                                                                                                  
                                                                                                                    
                                                                                                                      
                                                                                                             
function buildAgentMemoryCtx(lead: any): string {
  const m = lead?.agentMemory; if (!m) return "";
  const resumo = typeof m === "string" ? m : (typeof m?.resumo === "string" ? m.resumo : "");
  const txt = noDash(String(resumo || "").trim()); if (!txt) return "";
  const quando = (m && typeof m === "object" && m.at) ? String(m.at).slice(0, 10) : "";
  return `\n\nMEMÓRIA DA RELAÇÃO (o vosso resumo do que já sabem deste lead${quando ? `, atualizado em ${quando}` : ""}: usem-no para dar continuidade sem repetir, mas NUNCA o citem cru nem inventem nada que não esteja aqui nem no histórico):\n${txt.slice(0, 900)}\n`;
}
                                                                                                    
async function distillAgentMemory(lead: any, convo: string, draft: string, phaseId: string): Promise<string> {
  try {
    const sys = "És o memorizador do agente comercial do atelier ABiL (Genève). Lê a conversa com um lead e o rascunho de resposta que se vai enviar, e escreve um resumo TELEGRÁFICO da relação, para o próprio agente reler no futuro e poupar tokens. Inclui: quem é o lead e o que quer, a fase atual, o que já foi dito e enviado, objeções levantadas, e o próximo passo. Só factos observados na conversa, nunca inventes. Escreve em francês, no máximo 6 linhas curtas, sem saudações nem travessão. Devolve SÓ o resumo.";
    const usr = `LEAD: ${lead?.nom || lead?.entreprise || ""} (${lead?.email || ""}), empresa ${lead?.entreprise || "?"}, setor ${lead?.setor || "?"}, pais ${lead?.pais || "?"}. Fase atual: ${phaseId}.\n\nCONVERSA ATÉ AGORA:\n${(convo || "(sem historico)").slice(0, 3000)}\n\nRASCUNHO QUE O AGENTE VAI ENVIAR AGORA:\n${String(draft || "").slice(0, 1200)}\n\nEscreve o resumo da relação.`;
    const out = await callLLM(sys, usr);
    return out ? noDash(out.trim()).slice(0, 900) : "";
  } catch { return ""; }
}
async function patchLeadAgentMemory(leadId: string, resumo: string, phaseId: string, lead?: any): Promise<void> {
  try {
                                                                                                              
                                                                                                                   
    const txt = String(resumo || "").trim();
    const prevMem: any = lead?.agentMemory;
    const prev = typeof prevMem === "string" ? prevMem : (prevMem && typeof prevMem.resumo === "string" ? prevMem.resumo : "");
    const finalResumo = txt || String(prev || "").trim();
    const tok = selfAdmin(); if (!tok) return;
    await fetch(`${selfBase()}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, agentMemory: { resumo: finalResumo, fase: phaseId, at: new Date().toISOString() } }] }) }).catch(() => undefined);
  } catch {  }
}
                                                                                                                     
                                                                                                                      
                                                                                                                      
                                                                                              
                                                                                                                     
async function ensureDiagnosisFired(lead: any): Promise<boolean> {
  try {
    const tok = selfAdmin(); if (!tok) return false;
    const rq = await fetch(`${selfBase()}/api/lead-audit-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ tenantId: "abil-autodiag", items: [{ leadId: String(lead.id), url: String(lead.website || ""), placeId: String(lead.placeId || ""), company: String(lead.entreprise || lead.nom || ""), origem: "resposta" }] }) }).catch(() => null);
    const rd: any = rq ? await rq.json().catch(() => null) : null;
    return !!(rd && rd.ok);
  } catch { return false; }
}
                                                                                                                     
                                                                                                                
                                                                                                            
                                                                                                            
                                                                                      
                                                                                                                  
                                                                                                                       
                                                                                                                    
                                                                                                                  
async function generateSmartReply(leadId: string, promptOverride?: string, deepOverride?: any, opts?: { autoDiag?: boolean; atraso?: boolean; deepSkip?: string; lastInFallback?: { subject?: string; body?: string; at?: string } }): Promise<{ ok: boolean; draft?: string; subject?: string; error?: string; diagFired?: boolean }> {
  const lead = await loadLead(leadId); if (!lead) return { ok: false, error: "lead_nao_encontrado" };
                                                                                                            
                                                                                                        
                                                                                                       
                                                                                                         
                                                                                        
  let arr: any[] = [];
  try {
    const tok = selfAdmin();
    const r = await fetch(`${selfBase()}/api/crm-leads?action=thread&leadId=${encodeURIComponent(leadId)}`, { headers: { "x-abil-admin": tok } });
    if (r.ok) { const d: any = await r.json().catch(() => ({})); if (Array.isArray(d?.thread)) arr = d.thread; else if (Array.isArray(d?.messages)) arr = d.messages; }
  } catch {  }
  if (!arr.length) { const thread = await readJson<any[]>(`${THREADS_PREFIX}${leadId}.json`, []); arr = Array.isArray(thread) ? thread : []; }
                                                                                                          
                                                                                                           
                                                                                                             
                                                                 
  const fbIn = opts?.lastInFallback;
  if (fbIn && String(fbIn.body || "").trim()) {
    const temInComCorpo = arr.some((m) => m && m.dir === "in" && String(m.body || "").trim());
    if (!temInComCorpo) arr = [...arr, { dir: "in", at: fbIn.at || new Date().toISOString(), subject: String(fbIn.subject || ""), body: String(fbIn.body || "") }];
  }
  const cfg = await readSmartCfg();
                                                                                                          
                                                                                                                  
                            
                                                                                                                   
                                                                                  
  const scopedBasePrompt = cfg.smartPromptCliente || cfg.prompt || DEFAULT_SMART_PROMPT;
  const persona = await readPersonaCtx();
  const convo = arr.slice(-16).map((m) => `${m.dir === "in" ? "LEAD" : "ABiL"}: ${String(m.body || "").slice(0, 1600)}`).join("\n\n");
  const lastIn = [...arr].reverse().find((m) => m.dir === "in");
                                                                                                                         
  const LANGN: Record<string, string> = { pt: "portugues", en: "ingles", fr: "frances", de: "alemao", it: "italiano", es: "espanhol" };
  const leadLang = String(lead.idioma || "").toLowerCase();
  const pais = String(lead.pais || "").toLowerCase();
  const fichaLang = LANGN[leadLang] ? leadLang : (/(portugal|brasil|brazil)/.test(pais) ? "pt" : /(france|franca|suisse|suica|switzerland|belg)/.test(pais) ? "fr" : /(germany|deutschland|alemanha|austria)/.test(pais) ? "de" : /(italy|italia)/.test(pais) ? "it" : /(spain|espana|espanha)/.test(pais) ? "es" : "fr");
                                                                                                         
                                                                                                        
                                                                                                         
  const convoLang = detectLangFromText(lastIn ? `${String(lastIn.subject || "")} ${String(lastIn.body || "")}` : "");
                                                                                                       
                                                                                           
                                                                                                          
                                                                               
  const firstOutMsg = arr.find((m) => m && m.dir === "out" && String(`${m.subject || ""} ${m.body || ""}`).trim());
  const outLang = firstOutMsg ? detectLangFromText(`${String(firstOutMsg.subject || "")} ${String(firstOutMsg.body || "")}`) : "";
  const langKey = convoLang || outLang || fichaLang;
  const langName = langKey === "pt" ? (/(brasil|brazil)/.test(pais) ? "portugues do Brasil" : "portugues europeu (de Portugal, nunca a variante brasileira)") : (LANGN[langKey] || "frances");
                                                                                                                    
                                                                                                       
  const philoCtx = await readPhilosophyCtx();
  const bioCtx = await readBioCtx();                                                                                                         
  const docsCtx = await readKnowledgeCtx();                                                              
                                                                                                            
                                                                                                 
  const siteCtx = await readSiteCtx();
  const servicosCtx = servicesCatalogBlock();
  const journeyMap = await getJourneyMap();                                                                         
  const journeyCtx = journeyMapBlock(journeyMap);
  const safeCtx = await readSafeguardsCtx();                                             
                                                                                                               
                                                                                                                
                                                                                       
  const hierarquia = `\n\nHIERARQUIA DE COMANDOS (se duas instruções se contradisserem, ganha a que estiver mais acima):\n1. SALVAGUARDAS (regras duras do atelier): o que nunca podes fazer.\n2. FACTOS: o dossier "Quem somos", a cultura/manifesto da marca e os documentos anexados. Nunca inventes nada fora deles.\n3. IDIOMA: escreves sempre na língua do lead, aconteça o que acontecer.\n4. INSTRUÇÃO COMERCIAL (o texto no topo deste prompt, editado na caixa "Como o sistema deve responder"): o que fazer neste email.\n5. VOZ E PÚBLICO (Brand persona e Buyer personas): como soar e para quem falas.\nO prompt global de CONTEÚDO (social, blog, site) NÃO se aplica aqui: isto é um email de conversa comercial, não é um post.\n`;
                                                                                                       
  const atrasoNota = opts?.atraso ? `\n\nTIMING REAL: a mensagem do lead chegou há vários dias e só agora está a ser respondida. A resposta chega com atraso: reconhece-o com elegância e sem desculpas compridas.` : "";
                                                                                                                        
  const semDossierNota = opts?.deepSkip === "raio_x_falhou"
    ? `\n\nINVESTIGAÇÃO: não foi possível investigar o site dele a fundo desta vez. NÃO inventes nada sobre o negócio dele: ancora-te só no que ele escreveu e no diagnóstico existente.`
    : (opts?.deepSkip === "sem_site"
      ? `\n\nINVESTIGAÇÃO: este lead não tem site, por isso não há investigação profunda a fazer. NÃO inventes nada sobre o negócio dele: ancora-te só no que ele escreveu e no diagnóstico existente.`
      : (opts?.deepSkip === "sem_resposta_positiva"
                                                                                                                    
                                                                                                                   
        ? `\n\nINVESTIGAÇÃO: a resposta dele ainda não é um sim claro, por isso a investigação profunda não corre nesta fase. NÃO inventes nada sobre o negócio dele: ancora-te só no que ele escreveu e no diagnóstico existente, e não mandes links nem páginas.`
        : ""));
  const system = (promptOverride || scopedBasePrompt) + philoCtx + bioCtx + docsCtx + siteCtx + servicosCtx + journeyCtx + safeCtx + hierarquia + atrasoNota + semDossierNota + `\n\nIMPORTANTE: escreve a resposta OBRIGATORIAMENTE em ${langName}: e a lingua da ultima mensagem do lead (com a ficha como reserva). NUNCA mistures linguas na mesma resposta. Trata o lead pelo primeiro nome EXATAMENTE como esta na ficha, completo, nunca cortado nem alterado. NUNCA menciones valores, faixas ou exemplos hipoteticos de preco (nada de "pode ser X mil ou Y mil"): numeros so existem na proposta emitida da tabela de valores. NUNCA confirmes ter recebido algo (briefing, ficheiros, pagamento) que nao esteja registado nos dados deste prompt; se o lead afirmar algo que nao consta da ficha nem do historico, nao o valides como facto. Nao repitas perguntas que o lead ja respondeu no historico; no maximo UMA pergunta por email, e responde SEMPRE primeiro ao que ele perguntou. Reve a ortografia antes de terminar: zero gralhas. NUNCA prometas prazos nem datas de entrega (nem "hoje", nem "amanha", nem "antes do jantar"): a emissao da proposta e do operador, di-lo como "segue em breve" e nada mais. NUNCA digas que algo segue em anexo (ou "piece jointe", "attachment"): tu nao anexas ficheiros; so podes referir links reais que estejam neste prompt. NUNCA anuncies acoes futuras que tu nao executas sozinho (contactar terceiros, ligar, voltar noutra data): so podes prometer o que este sistema faz mesmo, responder aqui e entregar a analise quando publicar. Responde APENAS com JSON valido, sem mais nada: {"corpo":"<o corpo do email, 2 a 6 frases, linguagem natural, sem Assunto nem assinatura>"}. Se NAO conseguires escrever o email (contexto contraditorio, duvida sobre o que o lead disse, falta de dados), devolve {"corpo":"","duvida":"<explica a duvida aqui>"}. A duvida NUNCA vai no campo corpo: o corpo e enviado tal e qual ao lead, e um lead nunca pode ler o teu raciocinio.`;
  const briefLink = `${selfBase()}/briefing?lead=${encodeURIComponent(leadId)}`;
  const diagCtx = buildDiagCtx(lead);
                                                                                                                  
                                                                                                                      
  const deepCtx = buildDeepCtx(deepOverride ? { ...lead, deepStudy: deepOverride } : lead);
                                                                                                                
                                                                                                                     
                                                                                       
  const lastCls = lastIn ? classifyReply(String(lastIn.subject || ""), stripQuotedTail(String(lastIn.body || ""))) : String(lead.replyClass || "neutra");                                                                                                
  const inbound = arr.filter((x) => x && x.dir === "in").length;
  const fuCount = Number(lead.followupCount || 0);
  const momento = inbound <= 1
    ? `primeira resposta ${lastCls === "positiva" ? "positiva " : ""}deste lead${fuCount > 0 ? ` (chegou depois de ${fuCount} follow-up${fuCount > 1 ? "s" : ""})` : ""}; a vossa resposta e a primeira conversa a serio, abram o fio com calma e ganhem o direito de avancar`
    : `conversa ja em curso (${inbound} mensagens do lead ate agora${lead.fase2SentAt ? "; a leitura da marca ja foi entregue na Fase 2" : ""}); continuem o fio de onde parou, sem se reapresentarem`;
  const publishedUrl = String(lead.audit?.publishedUrl || "").trim();
                                                                                                                     
                                                                                                      
  const engajou = inbound >= 1;                                                               
  const linkAlreadySent = !!publishedUrl && arr.some((m) => m && m.dir === "out" && String(m.body || "").includes(publishedUrl));                                  
  const filledBriefing = !!(lead.briefingRecebidoAt || lead.briefingId);
  const lastInText = lastIn ? String(lastIn.body || lastIn.subject || "") : "";
  const askedProposal = /(or[cç]ament|proposta|proposal|proposition|quote|budget|quanto\s+custa|how\s+much|devis|angebot|preventivo|presupuesto|combien|wie\s*viel|quanto\s+costa|cu[aá]nto\s+cuesta)/i.test(lastInText);
                                                                                                           
                                                                                                             
                                                                                                             
  const claimsBriefing = /brief/i.test(lastInText) && /(preench|rempli|fill|ausgef[uü]ll|compilat|rellen|complet)/i.test(lastInText);
                                                                                                   
                                                                                                               
                                                                                                           
                                                                           
  let phaseId = "engajou";
  if (lead.proposalApprovedAt) phaseId = "aprovacao";
  else if (!engajou) phaseId = "frio";
  else if (lead.proposalSentAt || lead.proposalUrl) phaseId = "negociacao";
  else if (askedProposal) phaseId = "negociacao";
  else if (filledBriefing) phaseId = "qualificado";
  else if (inbound >= 2) phaseId = "em_conversa";
  else phaseId = "engajou";
  const faseNome = (() => { try { const f = (Array.isArray(journeyMap?.fases) ? journeyMap.fases : []).find((x: any) => String(x?.id || "") === phaseId); return f ? String(f.nome || "") : ""; } catch { return ""; } })();
  const acaoDaFase = journeyPhaseAcao(journeyMap, phaseId);
                                                                                                                   
                                                                                                              
                                                                                                                       
                                                                                                                    
                                                                                             
  const diagMissing = !lead.audit || !lead.audit.at;
  let diagFired = false;
                                                                                                                      
                                                                                                                     
                                                                                                           
  if ((opts?.autoDiag !== false) && engajou && String(lead.abordagem || "") !== "agencia" && !publishedUrl && diagMissing && (String(lead.website || "").trim() || String(lead.placeId || "").trim())) {
    diagFired = await ensureDiagnosisFired(lead);
  }
                                                                                                                   
                                                                                     
  let journeyDirective = `\nFASE DA JORNADA deste lead agora (interpretada dos sinais reais): ${phaseId}${faseNome ? ` (${faseNome})` : ""}.${acaoDaFase ? ` AÇÃO A EXECUTAR: ${acaoDaFase}` : ""}`;
  if (engajou) {
    if (publishedUrl && !linkAlreadySent) {
                                                                                                                      
                                                                         
      journeyDirective += `\nJá existe uma análise publicada desta marca e este lead AINDA NÃO a recebeu: ${publishedUrl}. ENTREGUEM o link AGORA como prova de valor concreta (a leitura honesta que ofereceram), e NÃO como uma opção: integrem-no na resposta ao que ele perguntou de verdade. Conciliem a leitura da marca com o pedido específico dele.`;
    } else if (publishedUrl && linkAlreadySent) {
      journeyDirective += `\nA análise (${publishedUrl}) JÁ foi enviada a este lead antes: não a re-enviem como novidade; refiram-se a ela se ajudar e avancem a conversa (qualificar, próximo passo).`;
    } else if (diagFired) {
      journeyDirective += `\nAINDA não há análise publicada desta marca, mas o diagnóstico automático foi disparado agora e será entregue quando publicar. NÃO prometam nem inventem um link; respondam JÁ ao pedido específico do lead com o que sabem da marca, e mostrem que estão a olhar para o negócio dele a sério.`;
    } else {
      journeyDirective += `\nAINDA não há análise publicada desta marca. Respondam ao pedido específico do lead com o que já sabem (diagnóstico e Raio-X, se existirem); nunca inventem nem prometam um link que ainda não existe.`;
    }
  }
                                                                                                  
                                                                                                        
                                                                  
  let proposalCtx = "";
  if (phaseId === "aprovacao") {
                                                                                                             
                                                                                                  
    proposalCtx = await readProposalCtx(lead);
    journeyDirective += `\nPROPOSTA APROVADA por este lead em ${String(lead.proposalApprovedAt).slice(0, 10)}${lead.proposalApprovedVia ? ` (via ${String(lead.proposalApprovedVia)})` : ""}. Agradeçam com entusiasmo genuíno e SEGURANÇA, na voz do atelier. Se o lead tiver dúvidas de processo ou de serviço, respondam com dados REAIS (a proposta gravada, o portfolio publicado, o catálogo de serviços), nunca inventem. ${proposalCtx ? "As condições de pagamento REAIS estão no bloco PROPOSTA REAL abaixo: citem SÓ essas, nunca acrescentem percentagens nem prazos." : "NÃO foi possível ler a proposta gravada agora: refiram que o pagamento segue \"as condições que estão na proposta\", SEM citar números, percentagens nem prazos."} Se não houver dúvidas: relembrem com gentileza que o pagamento segue as condições DA PROPOSTA e comuniquem que segue o contrato com todos os termos para assinatura (a emissão do contrato é tratada pela equipa: anunciem-na, nunca prometam datas).`;
  } else if (lead.proposalUrl) {
                                                                                                               
    journeyDirective += `\nPROPOSTA JÁ ENVIADA a este lead: ${String(lead.proposalUrl)}${lead.proposalSentAt ? ` (em ${String(lead.proposalSentAt).slice(0, 10)})` : ""}. Podem referenciá-la e reenviar este link se o lead o pedir. NUNCA proponham novos valores, descontos nem reajustes: qualquer ajuste de preço é decidido pela equipa.`;
  } else {
                                                                                                          
    journeyDirective += `\nAINDA NÃO existe proposta enviada a este lead: NUNCA prometam nem inventem um link de proposta, nem citem valores ou condições.`;
  }
                                                                                                                 
                                                                                                             
                                                                                                                    
                                                 
  if (engajou && !filledBriefing && !claimsBriefing && !lead.proposalSentAt && !lead.proposalUrl && phaseId !== "aprovacao") {
    journeyDirective += `\nBRIEFING: este lead ainda não preencheu o briefing. Se a conversa já aqueceu e o lead partilha contexto, convidem-no a preencher o briefing no link ${briefLink} e sugiram a secção/serviço do CATÁLOGO (lista SERVICOS DO CATALOGO acima) que melhor casa com a dor OBSERVADA (só dores lidas do Raio-X, do diagnóstico ou da própria conversa, nunca presumidas), explicando numa frase porquê essa secção. Se a conversa ainda está no início ou o lead não partilhou contexto nenhum, NÃO enviem o link ainda. Se o historico mostrar que o link JA foi enviado, NAO o reapresentem como novidade: reconhecam onde a conversa esta e avancem.`;
  }
                                                                                                            
                                                                                                          
                                                                       
  if (claimsBriefing && !filledBriefing) {
    journeyDirective += `\nBRIEFING EM DUVIDA: o lead DIZ que preencheu o briefing, mas o sistema NAO tem nenhum briefing registado deste lead. NAO confirmem a rececao (seria falso) e NAO lhe voltem a pedir para preencher como se ele nada tivesse dito. Reconhecam o que ele disse, expliquem com honestidade que do nosso lado ainda nao apareceu, pecam-lhe que confirme se concluiu o envio (podem reenviar o link ${briefLink} UMA unica vez, como ajuda, nao como novo pedido), e garantam que mal entre, a proposta com o numero exato segue.`;
  }
  if (filledBriefing && !lead.proposalSentAt && !lead.proposalApprovedAt) {
    journeyDirective += `\nBRIEFING JA RECEBIDO${lead.briefingRecebidoAt ? ` em ${String(lead.briefingRecebidoAt).slice(0, 10)}` : ""}: NAO voltem a pedir o briefing. Agradecam (se ainda nao o fizeram no historico) e digam o passo seguinte real: a proposta com o numero exato, feita da tabela de valores, esta a ser preparada e segue em breve. Nao prometam datas exatas que nao controlam.`;
  }
                                                                                                             
                                                                                                              
  if (askedProposal && !lead.proposalUrl && !lead.proposalApprovedAt) {
    journeyDirective += `\nPRECO PEDIDO AGORA: o lead esta a pedir valores nesta mensagem. Respondam-lhe A ISSO em primeiro lugar, JA neste email, com o processo verdadeiro: o numero exato sai da tabela de valores real depois do briefing preenchido, e expliquem porque (para dar um numero a serio, nao uma faixa inventada que depois muda). NUNCA escrevam valores, faixas nem exemplos hipoteticos. NAO respondam ao pedido de preco com outra pergunta: se precisarem de perguntar algo, facam-no DEPOIS de terem respondido, e no maximo UMA pergunta. Fechem com o que ele recebe a seguir (proposta com numero exato e ambito) e o unico passo para la chegar.`;
  }
  const memCtx = buildAgentMemoryCtx(lead);
  const user = `${persona}${memCtx}\n\nLEAD: ${lead.nom || lead.entreprise || ""} (${lead.email || ""}), empresa ${lead.entreprise || "?"}, setor ${lead.setor || "?"}, pais ${lead.pais || "?"}.\n${diagCtx}${deepCtx}${proposalCtx}\nMOMENTO DA JORNADA: ${momento}.${journeyDirective}\nCONVERSA:\n${convo || "(sem historico ainda)"}\n\nULTIMA MENSAGEM DO LEAD:\n${lastIn ? String(lastIn.body || lastIn.subject || "").slice(0, 1500) : "(sem mensagem; escreve um primeiro contacto de seguimento consultivo)"}\n\nLINK DE BRIEFING deste lead (usa-o SO se fizer sentido convidar a pessoa a partilhar mais detalhes do projeto; nunca inventes outro link nem prometas precos): ${briefLink}\n\nEscreve a resposta do ABiL.`;
                                                                                                             
                                                                                                         
                                                                                                          
                                                                                                          
                                             
  const _j = await callLLMJson(system, user);
  const draft = (_j && typeof _j.corpo === "string") ? _j.corpo.trim() : "";
  if (_j && String((_j as any).duvida || "").trim()) return { ok: false, error: `modelo_em_duvida: ${String((_j as any).duvida).slice(0, 300)}`, diagFired };
  if (!draft) return { ok: false, error: "ia_indisponivel_ou_formato_invalido", diagFired };
  const baseSubj = lastIn?.subject || arr.find((m) => m.subject)?.subject || "";
  const subject = baseSubj ? (/^\s*re\s*:/i.test(baseSubj) ? baseSubj : `Re: ${baseSubj}`) : "Re: a sua mensagem";
                                                                                                              
                                                                      
                                                                                                             
                                                                                        
  try { const mem = await distillAgentMemory(lead, convo, draft, phaseId); await patchLeadAgentMemory(leadId, mem, phaseId, lead); } catch {  }
                                                                                                              
  return { ok: true, draft: noDash(draft.trim()), subject: noDash(subject), diagFired };
}

                                                                                                                    
                                                                                                                 
                                                                                                                  
                                                                                                                  
                                                                                                                      
                                                                                                                     
                                    
                                                                                                                     
                                                                                          
async function generateFollowupBody(opts: { leadId: string; step: number; prompt: string; langName?: string; coldText?: string; daysElapsed?: number; marca?: string }): Promise<{ ok: boolean; body?: string[]; error?: string }> {
  const lead = await loadLead(opts.leadId);
  if (!lead) return { ok: false, error: "lead_nao_encontrado" };
  const LANGN: Record<string, string> = { pt: "portugues", en: "ingles", fr: "frances", de: "alemao", it: "italiano", es: "espanhol" };
  const leadLang = String(lead.idioma || "").toLowerCase();
  const pais = String(lead.pais || "").toLowerCase();
  const langKey = LANGN[leadLang] ? leadLang : (/(portugal|brasil|brazil)/.test(pais) ? "pt" : /(france|franca|suisse|suica|switzerland|belg)/.test(pais) ? "fr" : /(germany|deutschland|alemanha|austria)/.test(pais) ? "de" : /(italy|italia)/.test(pais) ? "it" : /(spain|espana|espanha)/.test(pais) ? "es" : "fr");
                                                                                                             
                                                                                                                          
  const langName = (typeof opts.langName === "string" && opts.langName.trim()) ? opts.langName.trim() : (LANGN[langKey] || "frances");
  const persona = await readPersonaCtx();
  const philoCtx = await readPhilosophyCtx();
  const bioCtx = await readBioCtx();                                                                                         
  const docsCtx = await readKnowledgeCtx();
  const safeCtx = await readSafeguardsCtx();
  const diagCtx = buildDiagCtx(lead);
  const deepCtx = buildDeepCtx(lead);
  const hierarquia = `\n\nHIERARQUIA DE COMANDOS (se duas instruções se contradisserem, ganha a que estiver mais acima):\n1. SALVAGUARDAS (regras duras do atelier): o que nunca podes fazer.\n2. FACTOS: o dossier "Quem somos", a cultura/manifesto da marca e os documentos anexados. Nunca inventes nada fora deles.\n3. IDIOMA: escreves sempre na língua do lead.\n4. INSTRUÇÃO DE FOLLOW-UP (o texto no topo deste prompt): como fazer este toque.\n5. VOZ E PÚBLICO (Brand persona e Buyer persona): como soar e para quem falas.\nO prompt global de CONTEÚDO (social, blog, site) NÃO se aplica aqui: isto é um email de prospeção, não é um post.\n`;
  const touchN = Math.max(1, Math.min(3, Number(opts.step || 0) + 1));
  const dias = Math.max(0, Number(opts.daysElapsed || 0));
                                                                                                                   
                                                                                                                   
                                                                                                                     
                                                                                                      
  const langHard = `RESPONDES EXCLUSIVAMENTE EM ${langName.toUpperCase()}. Este email vai para um lead que fala ${langName}; escrever noutra língua é um erro grave. Ignora a língua deste enunciado: o email é só em ${langName}.`;
  const system = `${langHard}\n\n` + opts.prompt + philoCtx + bioCtx + docsCtx + safeCtx + hierarquia + `\n\nISTO É UM FOLLOW-UP: o lead ainda NÃO respondeu ao email de prospeção do atelier. É o toque número ${touchN} de 3${dias ? `, cerca de ${dias} dias depois do último email` : ""}. NÃO finjas que houve conversa, NÃO sejas insistente, NÃO prometas preços nem prazos. Devolve SÓ o corpo do email (sem 'Assunto:', sem assinatura, sem linha de opt-out). 2 a 5 frases, natural e humano, na voz do ABiL (nós).\n\n${langHard}`;
  const user = `${persona}\n\nLEAD: ${lead.nom || lead.entreprise || ""} (${lead.email || ""}), empresa ${opts.marca || lead.entreprise || "?"}, setor ${lead.setor || "?"}, pais ${lead.pais || "?"}.\n${diagCtx}${deepCtx}\nEMAIL DE PROSPEÇÃO QUE O ATELIER JÁ ENVIOU (não houve resposta):\n${String(opts.coldText || "").slice(0, 1400) || "(um primeiro email a oferecer uma leitura honesta e gratuita da marca, sem compromisso)"}\n\nEscreve o toque ${touchN} do follow-up do ABiL, na voz do atelier, EM ${langName.toUpperCase()}.`;
  const draft = await callLLM(system, user);
  if (!draft) return { ok: false, error: "ia_indisponivel (falta ANTHROPIC_API_KEY/OPENAI_API_KEY?)" };
  const body = noDash(draft.trim()).split(/\n{2,}/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
  if (!body.length) return { ok: false, error: "vazio" };
  return { ok: true, body };
}

                                                                                                                                                                    
                                                                                                             
                                                                                                             
                                                                                                               
                                                                                                             
                                                                                                                  
                                                                                                                    
const NEG_FU_SUBJECT: Record<string, string> = {
  fr: "Votre avis sur notre proposition",
  pt: "A vossa opinião sobre a proposta",
  en: "Your thoughts on our proposal",
  de: "Ihre Meinung zu unserem Angebot",
  it: "La vostra opinione sulla proposta",
  es: "Su opinión sobre la propuesta",
};
async function generateNegFollowupBody(leadId: string): Promise<{ ok: boolean; body?: string[]; subject?: string; error?: string }> {
  const lead = await loadLead(leadId);
  if (!lead) return { ok: false, error: "lead_nao_encontrado" };
  if (!lead.proposalSentAt) return { ok: false, error: "sem_proposta" };
  const LANGN: Record<string, string> = { pt: "portugues", en: "ingles", fr: "frances", de: "alemao", it: "italiano", es: "espanhol" };
  const langKey = resolveLangKey(lead.idioma, lead.pais, "");
  const langName = LANGN[langKey] || "frances";
  const persona = await readPersonaCtx();
  const philoCtx = await readPhilosophyCtx();
  const bioCtx = await readBioCtx();
  const docsCtx = await readKnowledgeCtx();
  const safeCtx = await readSafeguardsCtx();
  const diagCtx = buildDiagCtx(lead);
  const deepCtx = buildDeepCtx(lead);
  const dias = Math.max(0, Math.round((Date.now() - Date.parse(lead.proposalSentAt)) / 86400000));
  const langHard = `RESPONDES EXCLUSIVAMENTE EM ${langName.toUpperCase()}. Este email vai para um lead que fala ${langName}; escrever noutra língua é um erro grave. Ignora a língua deste enunciado: o email é só em ${langName}.`;
  const system = `${langHard}\n\nÉs a voz do ABiL (atelier criativo em Genève, "nós"). Este lead recebeu a PROPOSTA do atelier${dias ? ` há cerca de ${dias} dias` : ""} e ainda não respondeu. Escreve UM email curto de follow-up de negociação: pergunta com interesse GENUÍNO o que ele achou da proposta, se o valor faz sentido para ele e se mudaria algo no âmbito; oferece apresentar a proposta a quem decide, se ajudar. Tom de vendedor interessado, pró-ativo e sensível, nunca pressionante. REGRA DURA: PROIBIDO propor novos valores, descontos, percentagens ou reajustes de preço (qualquer ajuste é decidido pela equipa; o teu papel é preparar o terreno). NÃO inventes factos, condições nem prazos.` + philoCtx + bioCtx + docsCtx + safeCtx + `\n\nDevolve SÓ o corpo do email (sem 'Assunto:', sem assinatura). 3 a 6 frases, natural e humano, na voz do ABiL (nós).\n\n${langHard}`;
  const user = `${persona}\n\nLEAD: ${lead.nom || lead.entreprise || ""} (${lead.email || ""}), empresa ${lead.entreprise || "?"}, setor ${lead.setor || "?"}, pais ${lead.pais || "?"}.\n${diagCtx}${deepCtx}\nPROPOSTA ENVIADA: ${String(lead.proposalUrl || "(link na ficha)")} em ${String(lead.proposalSentAt).slice(0, 10)}. O lead nao respondeu desde entao.\n\nEscreve o follow-up de negociação do ABiL, EM ${langName.toUpperCase()}.`;
  const draft = await callLLM(system, user);
  if (!draft) return { ok: false, error: "ia_indisponivel (falta ANTHROPIC_API_KEY/OPENAI_API_KEY?)" };
  const body = noDash(draft.trim()).split(/\n{2,}/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
  if (!body.length) return { ok: false, error: "vazio" };
  return { ok: true, body, subject: noDash(NEG_FU_SUBJECT[langKey] || NEG_FU_SUBJECT.fr) };
}

                                                                   
                                                                                                                
                                                                                                        
                                                                                                                  

                                                                                                       
                                                                                                             
function stripQuotedTail(text: string): string {
  let t = String(text || "");
  if (/=(?:[0-9A-F]{2})/.test(t) && /=(?:C3|E2|20|E9|0A|0D)/.test(t)) {
    try { t = qpToBytes(t.replace(/=\r?\n/g, "")).toString("utf8"); } catch {  }
  }
                                                                                                        
                                                                                                             
                                                                                               
                                                                                               
                                                                                                
                                                       
  const CABECALHO = /(>|Von:|From:|De :|De:|Da:|Gesendet|Sent:|Envoy\u00e9|Enviado|Datum:|On .{0,200}wrote|Le .{0,140}a [\u00e9e]crit|Am .{0,140}schrieb\b|Il giorno .{0,180}ha scritto|El .{0,140}escribi[\u00f3o]|a [\u00e9e]crit\s*:|schrieb\s*:|ha scritto\s*:|escribi[\u00f3o]\s*:|escreveu\s*:|_{4,}|-{4,}\s*(Original|Urspr))/i;
  const m = t.search(new RegExp("\\n\\s*" + CABECALHO.source, "i"));
  if (m > 0) t = t.slice(0, m);
  else {
                                                                                                    
                                                                                                    
    const solto = t.slice(40).search(CABECALHO);
    if (solto >= 0) t = t.slice(0, 40 + solto);
  }
  t = t.replace(/Gesendet von Outlook.*$/is, "").replace(/Sent from my.*$/is, "");
  return t.trim();
}
                                                                                                                 
                                                                                                    
                                                                                                         
                                                                                                        
const NEG_DURA_RE = /(no need|don'?t (have|see) (any )?need|not required|no thank(s| you)|stop (mail|e-?mail|send|contact|writ)ing|please stop|stop it|unsubscribe|(we( wi|')ll| will) report|report (this|you) as spam|mark(ing)? (this|you) as spam|arr[\u00eae]tez (de|d')|ne nous (contactez|[\u00e9e]crivez) plus|cessez de|plus de mails?|kein(en)? bedarf( mehr)?|keine weiteren e-?mails?|h[\u00f6o]ren sie auf|nicht mehr (kontaktieren|anschreiben)|non (ci )?scrivete( pi[\u00f9u])?|smettete di|basta (e-?)?mail|deje[n]? de enviar(nos)?|no nos escriba[n]?|pare[m]? de (nos )?enviar|n[\u00e3a]o nos contacte[m]?( mais)?|deixe[m]? de (nos )?escrever)/i;
                                                                                                     
                                                                                                       
const NEG_HOSTIL_RE = /(stop (mail|e-?mail|send|contact|writ)ing|please stop|unsubscribe|(we( wi|')ll| will) report|report (this|you) as spam|mark(ing)? (this|you) as spam|\bspam\b|\blawyer\b|\bavocat\b|\badvogado\b|legal action|\bsignaler\b|\bdenunciar\b|ne nous (contactez|[\u00e9e]crivez) plus|cessez de|h[\u00f6o]ren sie auf|nicht mehr (kontaktieren|anschreiben)|non (ci )?scrivete|smettete di|deje[n]? de enviar|no nos escriba[n]?|pare[m]? de (nos )?enviar|n[\u00e3a]o nos contacte[m]?|deixe[m]? de (nos )?escrever)/i;
                                                                                                  
                                                                            
function zonaDaResposta(bruto: string): string {
  const limpo = stripQuotedTail(bruto);
  if (limpo.length < String(bruto || "").length * 0.9) return limpo;
  return String(limpo || "").slice(0, 400);
}
const OPTOUT_SECO_RE = /^(remove|remover|unsubscribe|stop|abmelden|austragen|d\u00e9sinscrire|desinscrever|cancelar|no more emails?|keine (weiteren )?e?-?mails?)[.! ]*$/i;
const AUTO_RE = /(out[ -]?of[ -]?office|automatic(al)? reply|auto[- ]?reply|automatische antwort|abwesenh|ferienabwesenheit|nicht im b[üu]ro|risposta autom|sono in ferie|auto[- ]?resposta|resposta autom[áa]tica|r[ée]ponse automatique|absence (du bureau|automatique)|absent(e)? du bureau|en (cong[ée]|vacances)|on (vacation|leave|holiday|annual leave)|away from (my|the) (office|desk)|fora do escrit[óo]rio|de f[ée]rias|estarei ausente|estou ausente|wir haben ihre (anfrage|nachricht|e-?mail) erhalten|ihre nachricht an |deine nachricht an |thank you for (contacting|emailing|reaching out)|we (have )?received your (message|inquiry|enquiry|request|email)|nous avons (bien )?re[çc]u votre|hemos recibido su|abbiamo ricevuto la|autosvar|automatisk svar|\bauto:\s|pappaperm|foreldrepermisjon|elternzeit|cong[ée] (de )?(maternit|paternit)|licen[çc]a (de )?(maternidade|paternidade)|your request from google|ihre anfrage bei google)/i;
const NEG_RE = /\b(no,? thanks?|not interested|no longer interested|kein(en)? interesse|keinen bedarf|brauchen (wir )?keine|wir sind nicht interessiert|nicht interessiert|pas int[ée]ress[ée]s?|non interessat[oi]|non siamo interessat|no,? gracias|no estamos interesad|sem interesse|n[ãa]o (tenho|temos|há) interesse|n[ãa]o estamos interessad|n[ãa]o,? obrigad|we'?ll pass|we will pass|we'?re all set|n[ãa]o precisamos|non abbiamo bisogno|no necesitamos|nous ne sommes pas int[ée]ress|d[ée]clin|declin(e|amos)|please remove|stop contacting|n'avons pas de travail|pas de (besoin|projet)s?\b|garder vos coordonn|keep your (details|contact|cv)|we'?ll (keep|save) your|not (at the moment|right now)|derzeit kein(en)? bedarf|melden uns bei bedarf|behalten ihre daten)\b/i;
const NEG_SOFT_RE = /\b(unfortunately|leider|malheureusement|infelizmente|purtroppo|lamentablemente|desafortunadamente)\b/i;
const NEG_DECLINE_HINT = /\b(no|not|kein|pas|non|n[ãa]o|declin|pass|interess)/i;
                                                                                                                    
const POS_RE = /\b(yes\b|yeah|sure,? (yes|please|send|go)|please (do|send|share)|go ahead|sounds (good|great)|i'?d love|i would love|keen to|tell me more|let'?s (talk|chat|schedule)|schedule a (call|meeting)|(i'?m|i am) (curious|interested)|(yes|sure|please|ok(?:ay)?|great)[^.!?]{0,40}send (it|them) (over|through)|sim,? (por favor|claro|manda|envia|quero|pode)|com certeza|claro,? (que sim|manda|envia|sim|pode)|por favor,? (manda|envia)|pode (enviar|mandar|preparar)|podes (enviar|mandar|preparar)|gostaria de (ver|saber|receber)|quero (ver|saber|receber)|tenho (interesse|curiosidade)|fico (curioso|a aguardar)|vamos (falar|conversar)|agende|marque uma|avec plaisir|volontiers|oui\b|c'?est d'?accord|d'?accord,?\s|tu peux (pr[ée]parer|envoyer|m'?envoyer)|vous pouvez (pr[ée]parer|envoyer|m'?envoyer)|envoie[sz]?[- ](le|la|moi|nous)?|je suis (curieux|curieuse|int[ée]ress[ée]+)|(ç|c)a m'?int[ée]resse|ja,? (bitte|gerne|her|das)|gerne,? (ja|her)|klingt (gut|interessant|spannend)|schicken sie (es )?(mir|uns)|bin (interessiert|gespannt|neugierig)|s[íi],?\s|claro,? env[íi]|env[íi][ae]melo|me interesa|estoy interesad|s[ìi],?\s|certo,? mandami|mandami (pure|la)|mi piacerebbe|mi interessa|sono (curioso|curiosa|interessat))\b/i;
                                                                                                           
                                                                                                            
                                                                                                       
const APPROVAL_RE = /\b(proposta aprovada|aprovamos a proposta|aprovado,? pode|aprovei a proposta|est[aá] aprovad[oa]|vamos avan[cç]ar|podem avan[cç]ar|pode avan[cç]ar|pode come[cç]ar|podem come[cç]ar|neg[oó]cio fechado|aceitamos a proposta|proposta aceite|we approve|proposal (is )?approved|approved,? (please )?(go|proceed|start)|go ahead with the proposal|let'?s move forward|we'?d like to proceed|proposal accepted|nous approuvons|proposition approuv[ée]e|c'?est approuv[ée]|on y va pour la proposition|d'?accord pour avancer|nous validons la proposition|angebot angenommen|wir nehmen das angebot an|bitte loslegen|approviamo la proposta|proposta approvata|procediamo pure|aprobamos la propuesta|propuesta aprobada|adelante con la propuesta)\b/i;
                                                                                                                
                                                                                                             
                                                                                                            
                                                                                                                 
const TESTIMONIAL_AUTH_RE = /(pode(m)?\s+publicar|pode(m)?\s+usar\s+(o\s+)?(meu|nosso)\s+(coment[aá]rio|depoimento|testemunho)|autorizo\s+(a\s+)?publica[cç][aã]o|autorizo\s+que\s+publiquem|fique(m)?\s+[aà]\s+vontade\s+para\s+(usar|publicar)|vous\s+pouvez\s+(le\s+)?publier|je\s+vous\s+autorise\s+[aà]\s+(le\s+)?publier|n'h[ée]sitez\s+pas\s+[aà]\s+(le\s+)?publier|feel\s+free\s+to\s+(publish|use)\s+(it|this|my\s+(comment|review|testimonial))|you\s+(can|may)\s+publish|you\s+have\s+my\s+permission\s+to\s+publish|d[üu]rfen\s+(sie\s+)?(das\s+|es\s+)?ver[öo]ffentlichen|ich\s+erlaube\s+die\s+ver[öo]ffentlichung|potete\s+pubblicar\w*|autorizzo\s+la\s+pubblicazione|pueden\s+publicar|autorizo\s+la\s+publicaci[oó]n)/i;
const OPT_OUT_RE = /\b(remover|remove( |-)?me|unsubscribe|desinscrever|descadastr\w*|d[ée]sabonn\w*|ne (plus )?me contact\w*|abbestellen|entfernen|nicht mehr kontaktieren|rimuovimi|cancellami|n[aã]o (me )?contact\w*|stop email|do not contact|don'?t contact)\b/i;
                                                                                                                 
async function classifyReplySmart(subject: string, body: string): Promise<"auto" | "negativa" | "positiva" | "neutra"> {
                                                                                                             
                                                                                                             
  const zona = zonaDaResposta(body);
  if (NEG_DURA_RE.test(`${String(subject || "")}\n${zona}`)) return "negativa";
  const base = classifyReply(subject, body);
  if (base !== "neutra") return base;
                                                                                            
                                                                                                    
  const txt = `${String(subject || "")}\n${zona}`.trim().slice(0, 900);
  if (txt.length < 8) return base;
  const sys = 'Classificas a resposta de um lead a um email de prospecao que perguntava "queres que eu prepare uma analise da tua marca e ta envie?". ATENCAO: o texto pode ainda conter, por baixo da resposta nova, restos da citacao do NOSSO email original; classifica APENAS o texto novo do lead, o que vem antes de qualquer citacao. Frases como "no need", "stop mailing", "not interested" ou ameacas de report/spam sao SEMPRE negativa. Na duvida responde neutra, nunca positiva. Responde com UMA SO palavra: positiva (aceita receber a analise, mostra interesse claro em avancar ou pede para enviar), neutra (pergunta ou curiosidade sem aceitar), negativa (recusa ou pede para parar), auto (resposta automatica de robot, out-of-office ou redirecionamento generico de caixa).';
  try {
    if (OPENAI_KEY) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", { signal: AbortSignal.timeout(12000), method: "POST", headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 4, temperature: 0, messages: [{ role: "system", content: sys }, { role: "user", content: txt }] }) });
      if (r.ok) { const d: any = await r.json(); const w = String(d?.choices?.[0]?.message?.content || "").toLowerCase(); if (/positiva|negativa|neutra|auto/.test(w)) return (w.match(/positiva|negativa|neutra|auto/) as any)[0]; }
    }
    if (ANTHROPIC_KEY) {
      const r = await fetch("https://api.anthropic.com/v1/messages", { signal: AbortSignal.timeout(12000), method: "POST", headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 8, system: sys, messages: [{ role: "user", content: txt }] }) });
      if (r.ok) { const d: any = await r.json(); const w = ((d?.content || []).map((c: any) => c?.text || "").join("")).toLowerCase(); if (/positiva|negativa|neutra|auto/.test(w)) return (w.match(/positiva|negativa|neutra|auto/) as any)[0]; }
    }
  } catch {  }
  return base;
}
function classifyReply(subject: string, body: string): "auto" | "negativa" | "positiva" | "neutra" {
  const t = `${String(subject || "")} \n ${String(body || "")}`.slice(0, 4000);
  if (AUTO_RE.test(t)) return "auto";
  if (NEG_RE.test(t)) return "negativa";
  if (NEG_SOFT_RE.test(t) && NEG_DECLINE_HINT.test(t) && !POS_RE.test(t)) return "negativa";
  if (POS_RE.test(t)) return "positiva";
  return "neutra";
}
                                                                                                        
function langFromCountry(pais: string): string { const p = String(pais || "").toLowerCase(); if (/(portugal|brasil|brazil)/.test(p)) return "pt"; if (/(france|frança|franca|belg)/.test(p)) return "fr"; if (/(germany|deutschland|alemanha|austria|áustria)/.test(p)) return "de"; if (/(italy|italia|itália)/.test(p)) return "it"; if (/(spain|españa|espanha)/.test(p)) return "es"; if (/(suíça|suica|switzerland|suisse|schweiz)/.test(p)) return "fr"; return ""; }
function detectLangFromText(text: string): string {
  const t = ` ${String(text || "").toLowerCase()} `;
  if (/\b(obrigad|não|nao|olá|ola|gostaria|não temos|nao temos|por favor|cumprimentos|você|voce)\b/.test(t)) return "pt";
  if (/\b(merci|bonjour|cordialement|nous|intéress|au revoir|malheureusement)\b/.test(t)) return "fr";
  if (/\b(danke|hallo|freundlichen|kein|leider|grüße|gruss|interessiert)\b/.test(t)) return "de";
  if (/\b(grazie|salve|cordiali|interessat|purtroppo|saluti)\b/.test(t)) return "it";
  if (/\b(gracias|hola|saludos|interesad|lamentablemente|atentamente)\b/.test(t)) return "es";
  if (/\b(thanks|thank you|hello|regards|not interested|unfortunately)\b/.test(t)) return "en";
  return "";
}
function resolveLangKey(idioma?: string, pais?: string, body?: string): string {
  const li = String(idioma || "").toLowerCase();
  if (["pt", "en", "fr", "de", "it", "es"].includes(li)) return li;
  return detectLangFromText(body || "") || langFromCountry(pais || "") || "fr";
}
                                                                                                          
                                                                                                                    
function courtesyDeclineReply(langKey: string, nome?: string): string {
  const first = String(nome || "").trim().split(/\s+/)[0] || "";
  const T: Record<string, (n: string) => string> = {
    fr: (n) => `Bonjour${n ? " " + n : ""},\n\nmerci pour votre réponse franche et pour le temps accordé. Nous comprenons tout à fait, nous en restons là et nous n'insisterons pas. Si un jour cela a du sens d'en reparler, notre porte reste ouverte.\n\nBien à vous,\nABiL MEDiAS, atelier créatif, Genève`,
    pt: (n) => `Olá${n ? " " + n : ""},\n\nobrigado pela resposta franca e pelo tempo dispensado. Percebemos perfeitamente, ficamos por aqui e não voltamos a insistir. Se um dia fizer sentido falarmos, a nossa porta fica aberta.\n\nCom os melhores cumprimentos,\nABiL MEDiAS, atelier criativo, Genève`,
    en: (n) => `Hello${n ? " " + n : ""},\n\nthank you for the honest reply and for your time. We completely understand, we will leave it here and won't keep insisting. If it ever makes sense to talk down the road, our door stays open.\n\nAll the best,\nABiL MEDiAS, creative atelier, Genève`,
    de: (n) => `Hallo${n ? " " + n : ""},\n\nvielen Dank für die offene Rückmeldung und Ihre Zeit. Wir verstehen das vollkommen, wir belassen es dabei und haken nicht weiter nach. Sollte es irgendwann doch passen, steht unsere Tür offen.\n\nBeste Grüße,\nABiL MEDiAS, Kreativatelier, Genève`,
    it: (n) => `Salve${n ? " " + n : ""},\n\ngrazie per la risposta sincera e per il tempo dedicato. Capiamo perfettamente, ci fermiamo qui e non insisteremo. Se un giorno avrà senso parlarne, la nostra porta resta aperta.\n\nUn cordiale saluto,\nABiL MEDiAS, atelier creativo, Genève`,
    es: (n) => `Hola${n ? " " + n : ""},\n\ngracias por la respuesta sincera y por su tiempo. Lo entendemos perfectamente, lo dejamos aquí y no insistiremos. Si algún día tiene sentido hablar, nuestra puerta queda abierta.\n\nUn cordial saludo,\nABiL MEDiAS, atelier creativo, Genève`,
  };
  return (T[langKey] || T.fr)(first);
}
                                                                                                            
                                                                                                                  
                                                                                                                     
                                                                                                                    
                                                                                                                   
                                                                                                               
                                                                                                                
                                                                                                                    
const DECLINE_COPY_CACHE_KEY = "replies/decline-copy.json";
                                                                                                                     
                                                                                                              
                                                                                                                      
async function generateDeclineBody(o: { langKey: string; nome?: string; prompt: string; leadId?: string; incomingText?: string }): Promise<string | null> {
  const LANGN: Record<string, string> = { pt: "portugues", en: "ingles", fr: "frances", de: "alemao", it: "italiano", es: "espanhol" };
  const langName = LANGN[o.langKey] || "frances";
  const first = String(o.nome || "").trim().split(/\s+/)[0] || "";
  const persona = await readPersonaCtx();
  const philoCtx = await readPhilosophyCtx();
  const docsCtx = await readKnowledgeCtx();
  const safeCtx = await readSafeguardsCtx();
  const lead = o.leadId ? await loadLead(o.leadId) : null;
  const diagCtx = lead ? buildDiagCtx(lead) : "";
  const system = o.prompt + philoCtx + docsCtx + safeCtx + `\n\nCONTEXTO: o lead RESPONDEU a dizer que NÃO tem interesse (uma negativa). Isto NÃO é uma venda nem um follow-up: NÃO insistas, NÃO vendas, NÃO faças perguntas comerciais nem proponhas próximos passos. Agradece a franqueza, respeita a decisão, deixa a porta aberta sem pressão e despede-te. Escreve OBRIGATORIAMENTE em ${langName}, na voz do ABiL (nos, atelier). Devolve SÓ o corpo do email (sem 'Assunto:', sem assinatura). 2 a 5 frases, humano e curto.`;
  const user = `${persona}\n\nLEAD: ${lead?.nom || o.nome || ""}${lead?.entreprise ? `, empresa ${lead.entreprise}` : ""}${lead?.setor ? `, setor ${lead.setor}` : ""}${lead?.pais ? `, pais ${lead.pais}` : ""}.${diagCtx}\nPRIMEIRO NOME para tratar o lead: ${first || "(sem nome; nao inventes um)"}\n\nMENSAGEM DE NEGATIVA do lead:\n${String(o.incomingText || "").slice(0, 1200) || "(sem texto; escreve uma cortesia de negativa generica, na voz do atelier)"}\n\nEscreve a cortesia de negativa do ABiL.`;
  const _dj = await callLLMJson(system + '\n\nResponde APENAS com JSON valido: {"corpo":"<o corpo, curto>"}. Se tiveres duvida, {"corpo":"","duvida":"..."}; a duvida nunca vai no corpo.', user); return (_dj && typeof _dj.corpo === "string" && _dj.corpo.trim() && !String((_dj as any).duvida || "").trim()) ? _dj.corpo.trim() : null;                                                                
}
async function declineCopyFor(langKey: string, nome?: string, cfgIn?: { declineText: string; declinePrompt?: string; declinePromptCliente?: string }, ground?: { leadId?: string; incomingText?: string }): Promise<string> {
  const cfg = cfgIn || (await readSmartCfg());
                                                                                                                       
                                                                                                                 
                                                                                                         
                                                                                                                    
                                    
                                                                                                                              
  const dpromptScoped = String((cfg as any).declinePromptCliente || "").trim();
  const dprompt = dpromptScoped || String((cfg as any).declinePrompt || "").trim();
  if (dprompt) {
    try { const gen = await generateDeclineBody({ langKey, nome, prompt: dprompt, leadId: ground?.leadId, incomingText: ground?.incomingText }); if (gen && gen.trim()) return noDash(gen.trim()); } catch {  }
  }
  const base = String(cfg.declineText || "").trim();
  if (!base) return courtesyDeclineReply(langKey, nome);
  const first = String(nome || "").trim().split(/\s+/)[0] || "";
  const fill = (t: string) => {
                                                                                                             
    let out = String(t);
    if (first) out = out.replace(/\{\{name\}\}/gi, first).replace(/\[NOME\]/gi, first);
    else out = out.replace(/[ \t]*\{\{name\}\}/gi, "").replace(/[ \t]*\[NOME\]/gi, "").replace(/ ,/g, ",");
    return out;
  };
  try {
    const h = crypto.createHash("sha256").update(base).digest("hex").slice(0, 16);
    const cacheKey = `${h}:${langKey}`;
    const cache = (await readJson<Record<string, string>>(DECLINE_COPY_CACHE_KEY, {})) || {};
    const hit = cache[cacheKey];
    if (typeof hit === "string" && hit.trim()) return fill(hit);
    const tok = selfAdmin();
    if (!tok) return courtesyDeclineReply(langKey, nome);
                                                                                                  
    const src = base.replace(/\[NOME\]/gi, "{{name}}");
    const r = await fetch(`${selfBase()}/api/translate`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ text: src, from: "auto", to: langKey }), signal: AbortSignal.timeout(25000) });
    if (!r.ok) return courtesyDeclineReply(langKey, nome);
    const d: any = await r.json().catch(() => null);
    const tr = typeof d?.translated === "string" ? d.translated.trim() : "";
    if (!tr) return courtesyDeclineReply(langKey, nome);
                                                                                                         
    const fresh = (await readJson<Record<string, string>>(DECLINE_COPY_CACHE_KEY, {})) || {};
    fresh[cacheKey] = tr;
    const keys = Object.keys(fresh);
    if (keys.length > 120) for (const k of keys.slice(0, keys.length - 120)) delete fresh[k];
    await writeJson(DECLINE_COPY_CACHE_KEY, fresh);
    return fill(tr);
  } catch { return courtesyDeclineReply(langKey, nome); }
}
                                                                                                  
async function suppressEmail(em: string): Promise<void> {
  try {
    const e = String(em || "").trim().toLowerCase(); if (!e || !e.includes("@")) return;
    const sup: any = (await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] })) || { emails: [], domains: [] };
    const set = new Set((sup.emails || []).map((x: string) => String(x).toLowerCase()));
    if (set.has(e)) return;
    set.add(e); sup.emails = Array.from(set);
    await writeJson(SUPPRESS_KEY, sup);
  } catch {  }
}
                                                                                                                     
                                                                                                                    
                                                                                                                        
                                                                                                                     
                                                                               
                                                                                                                 
async function suppressDomain(em: string): Promise<void> {
  try {
    const e = String(em || "").trim().toLowerCase(); if (!e || !e.includes("@")) return;
    const d = domainOf(e); if (!d || FREEMAIL.has(d)) return;
    const sup: any = (await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] })) || { emails: [], domains: [] };
    const doms = new Set((Array.isArray(sup.domains) ? sup.domains : []).map((x: string) => String(x).toLowerCase().replace(/^@/, "").trim()).filter(Boolean));
    const ems = new Set((Array.isArray(sup.emails) ? sup.emails : []).map((x: string) => String(x).toLowerCase()));
    if (doms.has(d) && ems.has(e)) return;
    doms.add(d); ems.add(e);
    sup.domains = Array.from(doms); sup.emails = Array.from(ems);
    await writeJson(SUPPRESS_KEY, sup);
  } catch {  }
}
                                                                                                                                                                                                                                          
                                                                                  
  
                                                                                                                
                                                                                                               
                                                                                                                
            
  
                                                                                                                 
                                                                                                                   
                                                                                                                  
                                                                                                                   
                                                                                                               
                                                                                                                   
                                                                                                              
                                                                                                                  
                                           
  
                                                                                                                  
                                                                                                                   
                                                                                                      
  
                                                                                                              
                                                                              
const DEEP_BUDGET_PREFIX = "deepresearch/budget/";
const DEEP_MAX_PAGES = 6;                                       
const DEEP_PAGE_CHARS = 3000;                                                                          
const DEEP_TTL_MS = 7 * 24 * 3600 * 1000;                                                                              
                                                                                                                      
                                                                                                                    
                                                                                                                       
                                                                                                                       
const DEEP_CRAWL_DEADLINE_MS = 50000;                                                                                                      
                                                                                                                     
                                                                                                                        
                                                                                                                   
                                                                                                             
                                                                                                                    
                                                                                                              
                                                       
const DEEP_WORKER_MS = 28000;                                                                                               
const DEEP_HOME_MS = 22000;                                                                                        
const DEEP_LLM_MS = 40000;                                                                              
const DEEP_FAIL_RETRY_MS = 24 * 3600 * 1000;                                                                     
                                                                                                                  
                                                                                                                  
                                                                                                                  
                                                                                                                     
const DEEP_RUNS_POR_SCAN = 1;
                                                                                              
function deepRestante(t0: number): number { return Math.max(0, DEEP_CRAWL_DEADLINE_MS - (Date.now() - t0)); }
const DEEP_UA = "Mozilla/5.0 (compatible; AbilBot/1.0; +https://abil.ch)";
const DEEP_WORKER_URL = (process.env.RAIOX_WORKER_URL || "").replace(/\/$/, "");
const DEEP_WORKER_TOKEN = process.env.RAIOX_WORKER_TOKEN || "";
const DEEP_THIN_CHARS = 200;                                                                           

async function deepFetch(url: string, ms: number, opts: any = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal, headers: { "user-agent": DEEP_UA, ...(opts.headers || {}) } }); }
  finally { clearTimeout(t); }
}
function deepHtmlToText(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}
function deepMetaOf(html: string, prop: string): string {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
  const m = html.match(re) || html.match(re2);
  return m ? String(m[1]).trim().slice(0, 400) : "";
}
function deepTitleOf(html: string): string { const m = String(html || "").match(/<title[^>]*>([\s\S]*?)<\/title>/i); return m ? deepHtmlToText(m[1]).slice(0, 160) : ""; }
                                                                                                                
function deepNormUrl(u: string): string {
  try { const x = new URL(String(u || "").trim()); x.hash = ""; const s = x.toString(); return s.replace(/\/$/, "").toLowerCase(); }
  catch { return String(u || "").trim().replace(/\/$/, "").toLowerCase(); }
}
                                                                                                             
const DEEP_HINTS: Array<{ tipo: string; re: RegExp }> = [
  { tipo: "sobre", re: /(qui[-_]?sommes|a[-_]?propos|apropos|sobre|about|quem[-_]?somos|ueber|uber|über|chi[-_]?siamo|nosotros|entreprise|empresa|company|equipe|equipa|team|histoire|story|historia|história|philosophie|filosofia|values|valeurs|valores)/i },
  { tipo: "servicos", re: /(prestations|servic|service|servizi|servicios|leistungen|solutions|solucoes|soluções|soluciones|produit|produt|product|prodotti|angebot|offer|savoir-faire|o-que-fazemos|what-we-do)/i },
  { tipo: "casos", re: /(realisation|réalisation|projet|project|projeto|progetti|portfolio|portfólio|case|caso|work|referenz|referenc|client|cliente|kunden)/i },
  { tipo: "blog", re: /(blog|actualite|actualité|actus|news|noticia|notícia|novidades|aktuelles|artigo|article|insights|journal|magazine)/i },
  { tipo: "contactos", re: /(contact|contato|contacto|kontakt|contatti|contacte)/i },
];
function deepTipoOf(url: string): string { const low = String(url || "").toLowerCase(); for (const h of DEEP_HINTS) if (h.re.test(low)) return h.tipo; return "outra"; }
                                                                                                               
                                                                                       
const DEEP_NOT_OBSERVED = new Set(["non observé", "non observe", "nao observado", "não observado", "not observed"]);
function deepIsNotObserved(v: string): boolean { return DEEP_NOT_OBSERVED.has(String(v || "").trim().toLowerCase()); }

                                                                                                                        
function deepBudgetKey(): string { return `${DEEP_BUDGET_PREFIX}${new Date().toISOString().slice(0, 10)}.json`; }
async function readDeepBudget(): Promise<number> { const b: any = await readJson<any>(deepBudgetKey(), { n: 0 }); return Math.max(0, Number(b?.n || 0)); }
async function bumpDeepBudget(): Promise<void> { try { const k = deepBudgetKey(); const b: any = await readJson<any>(k, { n: 0 }); await writeJson(k, { n: Math.max(0, Number(b?.n || 0)) + 1, at: new Date().toISOString() }); } catch {  } }
                                                                                                                       
                                                                                                                       
                                                                                          
async function deepCostGate(estimated: number): Promise<{ allowed: boolean; reason: string; checked: boolean }> {
  try {
    const tok = selfAdmin(); if (!tok) return { allowed: true, reason: "sem_token", checked: false };
    const r = await deepFetch(`${selfBase()}/api/agent-cost?action=check`, 8000, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ estimated_cost: estimated }) });
    if (!r.ok) return { allowed: true, reason: "check_indisponivel", checked: false };
    const d: any = await r.json().catch(() => null);
    return { allowed: d?.allowed !== false, reason: String(d?.reason || "ok"), checked: true };
  } catch { return { allowed: true, reason: "check_erro", checked: false }; }
}
async function logDeepCost(provider: string, model: string, inChars: number, outChars: number): Promise<{ usd: number | null }> {
  try {
    const tok = selfAdmin(); if (!tok) return { usd: null };
    const r = await deepFetch(`${selfBase()}/api/agent-cost?action=log`, 6000, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ provider, model, prompt_tokens: Math.ceil(Math.max(0, inChars) / 4), completion_tokens: Math.ceil(Math.max(0, outChars) / 4), endpoint: "reply-scan:deep-research" }) });
    if (!r.ok) return { usd: null };
    const d: any = await r.json().catch(() => null);
    return { usd: typeof d?.cost_usd === "number" ? d.cost_usd : null };
  } catch { return { usd: null }; }
}
                                                                                                                   
                                                                          
async function deepLLMJson(system: string, user: string, erros?: string[]): Promise<{ data: any; provider: string; model: string; inChars: number; outChars: number } | null> {
  const inChars = system.length + user.length;
                                                                                                             
                                                                                                          
                                                                                                         
                                                                                
  const reg = (m: string) => { console.error(`[deepLLMJson] ${m}`); if (erros) erros.push(m.slice(0, 200)); };
  reg(`chaves: openai=${OPENAI_KEY ? "sim" : "NAO"} anthropic=${ANTHROPIC_KEY ? "sim" : "NAO"}`);
  if (OPENAI_KEY) {
    try {
      const r = await deepFetch("https://api.openai.com/v1/chat/completions", DEEP_LLM_MS, { method: "POST", headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o", max_tokens: 2200, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
      if (r.ok) { const d: any = await r.json(); const t = d?.choices?.[0]?.message?.content?.trim(); if (t) { try { return { data: JSON.parse(t), provider: "openai", model: "gpt-4o", inChars, outChars: t.length }; } catch {  } } }
      else reg(`openai falhou: ${r.status} ${String(await r.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 300)}`);
    } catch (e) { reg(`openai excecao: ${String(e).slice(0, 120)}`); }
  }
  if (ANTHROPIC_KEY) {
    try {
      const r = await deepFetch("https://api.anthropic.com/v1/messages", DEEP_LLM_MS, { method: "POST", headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3800, system, messages: [{ role: "user", content: user }, { role: "assistant", content: "{" }] }) });
      if (r.ok) { const d: any = await r.json(); let t = (d?.content || []).map((c: any) => c?.text || "").join("").trim(); reg(`haiku 200: stop=${d?.stop_reason || "?"} chars=${t.length}`); if (t) { const out = t.length; t = "{" + t; try { return { data: JSON.parse(t), provider: "anthropic", model: "claude-haiku-4-5", inChars, outChars: out }; } catch { try { const mm = t.match(/\{[\s\S]*\}/); if (mm) return { data: JSON.parse(mm[0]), provider: "anthropic", model: "claude-haiku-4-5", inChars, outChars: out }; } catch (e2) { reg(`haiku JSON invalido: ${String(e2).slice(0, 100)}`); } } } }
      else reg(`anthropic haiku falhou: ${r.status} ${String(await r.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 300)}`);
    } catch (e) { reg(`anthropic haiku excecao: ${String(e).slice(0, 120)}`); }
  }
  return null;
}
type DeepSource = { url: string; titulo: string; tipo: string; chars: number; lidoPor: string; nota?: string };
                                                                                                            
                                                                                                              
                                                                                                                   
                                                                                                         
async function deepWorkerRead(url: string, ms: number): Promise<any | null> {
  if (!DEEP_WORKER_URL || !DEEP_WORKER_TOKEN || ms < 3000) return null;
  try {
    const r = await deepFetch(`${DEEP_WORKER_URL}/read`, ms, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEP_WORKER_TOKEN}` }, body: JSON.stringify({ url }) });
    if (!r.ok) return null;
    const d: any = await r.json().catch(() => null);
    return d && d.ok ? d : null;
  } catch { return null; }
}
                                                                                                             
                                                                                                                   
function deepStructuredSummary(d: any): string {
  const bits: string[] = [];
  if (Array.isArray(d?.tech) && d.tech.length) bits.push(`Plataforma do site: ${d.tech.join(", ")}.`);
  const soc = d?.socials && typeof d.socials === "object" ? Object.entries(d.socials).map(([k, v]) => `${k}: ${v}`) : [];
  if (soc.length) bits.push(`Redes ligadas no site: ${soc.join(" · ")}.`);
  const cont = [...(Array.isArray(d?.emails) ? d.emails : []), ...(Array.isArray(d?.phones) ? d.phones : [])];
  if (cont.length) bits.push(`Contactos no site: ${cont.join(" · ")}.`);
  if (d?.lang) bits.push(`Idioma declarado: ${d.lang}${Array.isArray(d?.hreflang) && d.hreflang.length ? ` (alternativas: ${d.hreflang.join(", ")})` : ""}.`);
  for (const raw of (Array.isArray(d?.jsonld) ? d.jsonld : []).slice(0, 4)) {
    try {
      const j = JSON.parse(raw); const arr = Array.isArray(j) ? j : (Array.isArray(j?.["@graph"]) ? j["@graph"] : [j]);
      for (const o of arr.slice(0, 3)) {
        if (!o || typeof o !== "object") continue;
        const t = o["@type"]; const tipo = Array.isArray(t) ? t.join("/") : String(t || "");
        const seg: string[] = [];
        if (o.name) seg.push(`nome ${String(o.name).slice(0, 80)}`);
        if (o.foundingDate) seg.push(`fundada em ${String(o.foundingDate).slice(0, 10)}`);
        if (o.address) { const a = o.address; const m = typeof a === "string" ? a : [a.streetAddress, a.postalCode, a.addressLocality, a.addressCountry].filter(Boolean).join(", "); if (m) seg.push(`morada ${String(m).slice(0, 120)}`); }
        if (o.telephone) seg.push(`telefone ${String(o.telephone).slice(0, 30)}`);
        if (o.email) seg.push(`email ${String(o.email).slice(0, 60)}`);
        if (Array.isArray(o.sameAs) && o.sameAs.length) seg.push(`perfis ${o.sameAs.slice(0, 4).join(", ")}`);
        if (tipo && seg.length) bits.push(`Dados schema.org (${tipo}): ${seg.join(", ")}.`);
        else if (tipo) bits.push(`Dados schema.org: tipo ${tipo}.`);
      }
    } catch {  }
  }
  return bits.length ? `DADOS ESTRUTURADOS (o proprio site declara isto):\n${bits.join("\n")}` : "";
}
                                                                                                                
                                                                                                                    
                                                                                               
async function deepCrawlSite(website: string, t0: number): Promise<{ paginas: Array<DeepSource & { texto: string }>; workerOk: boolean; finalUrl: string; jsRendered: boolean; erro: string }> {
  const out: Array<DeepSource & { texto: string }> = [];
  let workerOk = false, finalUrl = "", jsRendered = false, erro = "";
  let home = String(website || "").trim();
  if (!home) return { paginas: out, workerOk, finalUrl, jsRendered, erro: "sem_site" };
  if (!/^https?:\/\//i.test(home)) home = `https://${home}`;

                                                                                                          
  let realLinks: string[] = [];
  const homeRead = await deepWorkerRead(home, Math.min(DEEP_WORKER_MS, deepRestante(t0) - DEEP_HOME_MS));
  if (homeRead) {
    workerOk = true;
    finalUrl = String(homeRead.finalUrl || home);
    realLinks = Array.isArray(homeRead.internalLinks) ? homeRead.internalLinks : [];
    const estrut = deepStructuredSummary(homeRead);
    const txt = String(homeRead.text || "");
    if (txt.length >= DEEP_THIN_CHARS) {
      const corpo = estrut ? `${estrut}\n\n${txt}` : txt;
      out.push({ url: finalUrl, titulo: String(homeRead.title || "") || "(sem titulo)", tipo: "home", chars: corpo.length, lidoPor: "navegador", texto: corpo.slice(0, DEEP_PAGE_CHARS + estrut.length) });
    }
  }
  const baseUrl = finalUrl || home;

                                                                                             
  let html = "";
  if (!out.length) {
    try {
      const r = await deepFetch(baseUrl, Math.max(4000, Math.min(DEEP_HOME_MS, deepRestante(t0))));
      if (!r.ok) { erro = `home http ${r.status}`; return { paginas: out, workerOk, finalUrl: baseUrl, jsRendered, erro }; }
      html = (await r.text()).slice(0, 400_000);
    } catch (e: any) { erro = `home inacessivel: ${String(e?.message || e).slice(0, 60)}`; return { paginas: out, workerOk, finalUrl: baseUrl, jsRendered, erro }; }
    let homeText = deepHtmlToText(html).slice(0, DEEP_PAGE_CHARS);
    if (homeText.length < DEEP_THIN_CHARS) {
      jsRendered = true;
      const md = deepMetaOf(html, "og:description") || deepMetaOf(html, "description");
      const tit = deepTitleOf(html) || "(sem titulo)";
      homeText = md ? `${tit}. ${md}` : tit;
      out.push({ url: baseUrl, titulo: tit, tipo: "home", chars: homeText.length, lidoPor: "http", texto: homeText, nota: "HTML sem texto util (site renderizado por JS): so foi possivel ler o titulo e a meta descricao" });
    } else {
      out.push({ url: baseUrl, titulo: deepTitleOf(html) || "(sem titulo)", tipo: "home", chars: homeText.length, lidoPor: "http", texto: homeText });
    }
  } else {
                                                                                                                        
    if (!realLinks.length) { try { const r = await deepFetch(baseUrl, Math.min(DEEP_HOME_MS, deepRestante(t0))); if (r.ok) html = (await r.text()).slice(0, 400_000); } catch {  } }
  }

  if (!out.length) return { paginas: out, workerOk, finalUrl: baseUrl, jsRendered, erro };

                                                                                      
  let base: URL; try { base = new URL(baseUrl); } catch { return { paginas: out, workerOk, finalUrl: baseUrl, jsRendered, erro }; }
  const sameHost = (u: URL) => u.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "");
  const hrefs = new Set<string>();
  for (const rl of realLinks) { try { const u = new URL(rl); if (sameHost(u)) { u.hash = ""; u.search = ""; if (deepNormUrl(u.toString()) !== deepNormUrl(baseUrl)) hrefs.add(u.toString()); } } catch {  } }
  for (const mm of html.matchAll(/href=["']([^"'#\s]+)["']/gi)) {
    const h = mm[1].trim();
    if (!h || /^(mailto:|tel:|javascript:|data:)/i.test(h)) continue;
    if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|mp4|mp3|docx?|xlsx?)$/i.test(h)) continue;
    try { const u = new URL(h, base); if (!sameHost(u)) continue; u.hash = ""; u.search = ""; if (deepNormUrl(u.toString()) === deepNormUrl(baseUrl)) continue; hrefs.add(u.toString()); } catch {  }
  }
  const todos = [...hrefs];
  const alvos: string[] = [];
  for (const h of DEEP_HINTS) { const hit = todos.find((u) => h.re.test(u.toLowerCase()) && !alvos.includes(u)); if (hit) alvos.push(hit); }
  for (const u of todos) { if (alvos.length >= DEEP_MAX_PAGES - 1) break; if (!alvos.includes(u)) alvos.push(u); }

  for (const u of alvos.slice(0, DEEP_MAX_PAGES - 1)) {
    if (Date.now() - t0 > DEEP_CRAWL_DEADLINE_MS) break;                                   
    const ms = Math.min(8000, deepRestante(t0)); if (ms < 2000) break;
    let txt = "", tit = "", lidoPor = "http";
    try {
      const r = await deepFetch(u, ms); if (r.ok) { const h2 = (await r.text()).slice(0, 250_000); txt = deepHtmlToText(h2).slice(0, DEEP_PAGE_CHARS); tit = deepTitleOf(h2) || ""; }
    } catch {  }
                                                                                  
    if (txt.length < DEEP_THIN_CHARS && deepRestante(t0) > 6000) {
      const rd = await deepWorkerRead(u, Math.min(DEEP_WORKER_MS, deepRestante(t0) - 3000));
      if (rd && String(rd.text || "").length >= DEEP_THIN_CHARS) { txt = String(rd.text).slice(0, DEEP_PAGE_CHARS); tit = String(rd.title || tit); lidoPor = "navegador"; }
    }
    if (txt.length < DEEP_THIN_CHARS) continue;                                                   
    out.push({ url: u, titulo: tit || "(sem titulo)", tipo: deepTipoOf(u), chars: txt.length, lidoPor, texto: txt });
  }
  return { paginas: out, workerOk, finalUrl: baseUrl, jsRendered, erro };
}
                                                                                                              
                                                                                                                
                                                                                                                  
                                       
                                                                                                                    
                                                                                                                
                                                                                                                     
                                                                                                  
function deepExtractFollowers(text: string): string {
  const s = String(text || ""); if (!s) return "";
  const num = "\\d[\\d.,]*";
  const suf = "\\s?(?:k|m|mil|mio|mila)?";
  const unit = "(?:followers?|seguidores?|seguidor|abonn[ée]s?|abonnenten|follower)";
  const m = s.match(new RegExp(`(${num})${suf}\\s+${unit}`, "i")) || s.match(new RegExp(`${unit}\\s*[:\\-]?\\s*(${num})${suf}`, "i"));
  if (!m) return "";
  return m[0].replace(/\s+/g, " ").trim().slice(0, 60);
}
async function deepCrawlSocials(lead: any, t0: number): Promise<{ lidas: Array<DeepSource & { texto: string }>; inacessiveis: string[]; seguidores: Array<{ platform: string; valor: string; fonte: string }> }> {
  const lidas: Array<DeepSource & { texto: string }> = [];
  const inacessiveis: string[] = [];
  const seguidores: Array<{ platform: string; valor: string; fonte: string }> = [];
  const perfis: Array<{ platform: string; url: string }> = Array.isArray(lead?.socialDeep?.profiles) ? lead.socialDeep.profiles
    : Array.isArray(lead?.audit?.socialLinks) ? lead.audit.socialLinks : [];
  for (const p of perfis.slice(0, 4)) {
    if (Date.now() - t0 > DEEP_CRAWL_DEADLINE_MS) break;
    const url = String(p?.url || ""); if (!url) continue;
    try {
                                                                                                                   
      const ms = Math.min(7000, deepRestante(t0)); if (ms < 2000) break;
      const r = await deepFetch(url, ms); if (!r.ok) { inacessiveis.push(`${p.platform} (http ${r.status})`); continue; }
      const h = (await r.text()).slice(0, 150_000);
      const bio = deepMetaOf(h, "og:description") || deepMetaOf(h, "description");
      const tit = deepMetaOf(h, "og:title") || deepTitleOf(h);
      if (!bio && !tit) { inacessiveis.push(`${p.platform} (sem bio publica)`); continue; }
                                                                                                                     
                                                                             
      const fol = deepExtractFollowers([tit, bio].filter(Boolean).join(". "));
      if (fol) seguidores.push({ platform: p.platform, valor: fol, fonte: url });
      const texto = [tit, bio, fol ? `Seguidores visiveis na pagina do perfil: ${fol}` : ""].filter(Boolean).join(". ").slice(0, 700);
      lidas.push({ url, titulo: `${p.platform}: ${tit || "(perfil)"}`.slice(0, 160), tipo: "rede", chars: texto.length, lidoPor: "http (bio publica)", texto });
    } catch { inacessiveis.push(`${p.platform} (bloqueado ou fora do ar)`); }
  }
  return { lidas, inacessiveis, seguidores };
}
                                                                                                     
                                                                                             
const DEEP_NEWS_GEO: Record<string, { gl: string; hl: string }> = {
  portugal: { gl: "PT", hl: "pt" }, brasil: { gl: "BR", hl: "pt" }, brazil: { gl: "BR", hl: "pt" },
  franca: { gl: "FR", hl: "fr" }, "frança": { gl: "FR", hl: "fr" }, france: { gl: "FR", hl: "fr" },
  suica: { gl: "CH", hl: "de" }, "suíça": { gl: "CH", hl: "de" }, switzerland: { gl: "CH", hl: "de" }, suisse: { gl: "CH", hl: "fr" },
  alemanha: { gl: "DE", hl: "de" }, germany: { gl: "DE", hl: "de" }, italia: { gl: "IT", hl: "it" }, "itália": { gl: "IT", hl: "it" }, italy: { gl: "IT", hl: "it" },
  espanha: { gl: "ES", hl: "es" }, spain: { gl: "ES", hl: "es" }, malta: { gl: "MT", hl: "en" },
  "reino unido": { gl: "GB", hl: "en" }, uk: { gl: "GB", hl: "en" },
};
function brandCurta(brand: string): string {
                                                                                                      
  let b = String(brand || "").trim();
  const SUF = /\s+(AG|GmbH|SA|S\.A\.|SARL|S\u00e0rl|Sarl|Ltd|Ltda|LLC|Inc|BV|B\.V\.|AB|Oy|Kft|SRL|S\.L\.|SL|Lda|PLC|Co|KG|Software|Technology|Technologies|Solutions|Group|Holding|Studio|Agency|and|&)\.?$/i;
  for (let i = 0; i < 6; i++) { const n = b.replace(SUF, "").trim(); if (n === b || !n) break; b = n; }
  return b;
}
function rssUnescape(t: string): string { return String(t || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(); }
function parseNewsRss(xml: string): Array<{ title: string; link: string; date: string; source: string }> {
  const out: Array<{ title: string; link: string; date: string; source: string }> = [];
  const items = String(xml || "").split(/<item[\s>]/).slice(1);
  for (const it of items.slice(0, 12)) {
    const f = (tag: string) => { const m = it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")); return m ? rssUnescape(m[1]) : ""; };
    const title = f("title"); const link = f("link"); const date = f("pubDate"); const source = f("source");
    if (title && link) out.push({ title, link, date, source });
  }
  return out;
}
async function deepNews(brand: string, pais: string, t0: number): Promise<{ estado: string; itens: Array<DeepSource & { texto: string }>; nota: string }> {
  if (!brand) return { estado: "sem_marca", itens: [], nota: "Lead sem nome de marca para procurar." };
  const orcamento = Math.min(15000, deepRestante(t0));
  if (orcamento < 4000) return { estado: "sem_tempo", itens: [], nota: "A leitura do site consumiu o tempo da recolha: não houve pesquisa de notícias nesta corrida." };
  const g = DEEP_NEWS_GEO[String(pais || "").trim().toLowerCase()] || { gl: "", hl: "en" };
  try {
    const ceid = g.gl ? `&gl=${g.gl}&ceid=${g.gl}:${g.hl}` : "";
    const u = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${brand}"`)}&hl=${g.hl}${ceid}`;
    const r = await deepFetch(u, orcamento);
    if (!r.ok) return { estado: "erro", itens: [], nota: `Google News RSS respondeu ${r.status}.` };
    let rs = parseNewsRss(await r.text());
                                                                                                              
    const curta = brandCurta(brand);
    if (!rs.length && curta && curta.toLowerCase() !== brand.toLowerCase() && deepRestante(t0) >= 3000) {
      const u2 = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${curta}"`)}&hl=${g.hl}${ceid}`;
      try { const r2 = await deepFetch(u2, Math.min(8000, deepRestante(t0))); if (r2.ok) rs = parseNewsRss(await r2.text()); } catch {                            }
    }
    if (!rs.length) return { estado: "sem_resultados", itens: [], nota: "A pesquisa correu e não encontrou notícias desta marca." };
    const itens: Array<DeepSource & { texto: string }> = [];
    let abertos = 0;
    const MAX_ART = 3;
    for (const n of rs.slice(0, 5)) {
      const link = n.link; const tit = n.title;
      const fonte = n.source; const data = n.date;
      const cab = [tit, fonte ? `(${fonte}${data ? `, ${data}` : ""})` : ""].filter(Boolean).join(" ").slice(0, 500);
      let corpo = "", aberto = false;
      if (abertos < MAX_ART && deepRestante(t0) >= 3500) {
        const ms = Math.min(6000, deepRestante(t0) - 1000);
        if (ms >= 2000) {
          try {
            const ar = await deepFetch(link, ms);
            if (ar.ok) { const ah = (await ar.text()).slice(0, 250_000); const at = deepHtmlToText(ah).slice(0, DEEP_PAGE_CHARS); if (at.length >= DEEP_THIN_CHARS) { corpo = at; aberto = true; abertos++; } }
          } catch {                                }
        }
      }
      const texto = aberto ? `${tit}${fonte ? ` (${fonte}${data ? `, ${data}` : ""})` : ""}. ${corpo}`.slice(0, DEEP_PAGE_CHARS + 200) : cab;
      itens.push(aberto
        ? { url: link, titulo: tit.slice(0, 160), tipo: "noticia", chars: texto.length, lidoPor: "artigo aberto (HTTP)", texto }
        : { url: link, titulo: tit.slice(0, 160), tipo: "noticia", chars: texto.length, lidoPor: "google news rss", texto, nota: "só o título do resultado, o artigo não foi aberto" });
    }
    const notaLidos = abertos ? `Artigos abertos e lidos na íntegra: ${abertos} de ${itens.length}.` : "";
    return { estado: itens.length ? "ok" : "sem_resultados", itens, nota: itens.length ? notaLidos : "A pesquisa correu e não encontrou notícias desta marca." };
  } catch (e: any) { return { estado: "erro", itens: [], nota: `Pesquisa falhou: ${String(e?.message || e).slice(0, 80)}` }; }
}
const DEEP_SYSTEM = `És um investigador de marcas, frio e rigoroso, a preparar o atelier ABiL (Genève) para responder a este lead. NÃO escreves o email: escreves o DOSSIER que o atelier vai ler antes de escrever.

REGRA DE FERRO, ACIMA DE TUDO O RESTO: as FONTES abaixo são o teu ÚNICO mundo. Não sabes absolutamente nada sobre esta empresa além do que está escrito nelas. NUNCA uses conhecimento teu sobre a marca, o setor, o país ou concorrentes. NUNCA inventes números, datas, nomes, clientes, prémios nem história. Se uma coisa não está nas fontes, ela NÃO EXISTE para ti: não a escrevas, nem como suposição, nem como "provavelmente".

Cada FACTO que devolveres TEM de trazer:
- "facto": a afirmação, curta e concreta;
- "fonte": o URL EXATO de uma das FONTES listadas (copia-o tal e qual; um facto sem fonte válida é DEITADO FORA pelo servidor);
- "citacao": um excerto CURTO e LITERAL dessa fonte que prova o facto (copiado tal e qual, na língua original, NUNCA traduzido nem parafraseado).
Se não consegues provar um facto com uma citação literal de uma fonte, NÃO o incluas.

O dossier (a prosa) tem de sair SÓ desses factos. Onde a informação não existir, escreve exatamente "non observé". É honesto e útil; inventar é inútil e perigoso.

LÍNGUA: escreve o dossier e os factos em FRANCÊS (a língua de trabalho do atelier), direto e sem jargão. As citações ficam na língua original da fonte. NUNCA uses travessão (usa vírgula, dois pontos, parênteses ou ponto).

Devolve SO um JSON valido, sem texto antes nem depois:
{"dossier":{"quemSao":"","oQueVendem":"","paraQuem":"","tomDeVoz":"","oQueDizemDeSi":"","provaSocial":"","sinaisDeDor":"","oportunidade":"","anguloDeAbordagem":""},"factos":[{"facto":"","fonte":"","citacao":""}]}

Notas dos campos: "oQueDizemDeSi" = como a propria marca se descreve (o que o atelier pode citar de volta com naturalidade). "provaSocial" = clientes, numeros, premios ou testemunhos que a marca EXIBE. "sinaisDeDor" = o que as fontes mostram estar em falta ou fraco. "oportunidade" = o que o atelier pode vender (marca, ideia, campanha, em 360), ancorado no que foi observado. "anguloDeAbordagem" = por onde entrar na conversa.`;

                                                                                                            
                                                                                                                   
                                                                                
function deepValidarFactos(brutos: any[], permitidas: Map<string, DeepSource & { texto: string }>): { factos: any[]; descartados: number; semCitacao: number } {
  const factos: any[] = []; let descartados = 0, semCitacao = 0;
  for (const f of Array.isArray(brutos) ? brutos : []) {
    const facto = noDash(String(f?.facto || "").trim());
    const fonte = String(f?.fonte || "").trim();
    const hit = permitidas.get(deepNormUrl(fonte));
    if (!facto || !hit) { descartados++; continue; }
    const citacao = noDash(String(f?.citacao || "").trim()).slice(0, 300);
                                                                                                               
                                                                                                            
                                                                                                                     
                                                                                                                    
                                                                                                                 
    const ok = citacao ? deepCitacaoNaFonte(citacao, hit.texto) : false;
    if (!ok) semCitacao++;
    factos.push({ facto, fonte: hit.url, citacao: ok ? citacao : "", citacaoOk: ok, tipo: hit.tipo });
  }
  return { factos, descartados, semCitacao };
}
                                                                                                                 
                                                                                                                     
                                                                                         
function deepNormTexto(s: string): string {
                                                                                                             
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function deepCitacaoNaFonte(citacao: string, textoFonte: string): boolean {
  const alvo = deepNormTexto(textoFonte);
  if (!alvo) return false;
  const pedacos = String(citacao).split(/\.{2,}|…|\[\.\.\.\]/).map((p) => deepNormTexto(p)).filter((p) => p.length >= 20);
  if (!pedacos.length) { const inteiro = deepNormTexto(citacao); return inteiro.length >= 20 && alvo.includes(inteiro); }
  return pedacos.every((p) => alvo.includes(p));
}
                                                                                                        
                                                                                                                   
                                                                                                                    
                                                                                                                     
                                                                                                                      
                                                                                                                   
                                                                                                             
async function deepResearch(leadId: string, opts: { force?: boolean; origem: string; semTetoDiario?: boolean }): Promise<any> {
  const t0 = Date.now();
  const lead = await loadLead(leadId); if (!lead) return { ok: false, error: "lead_nao_encontrado" };
                                                                                                            
  const prev = lead.deepStudy;
  if (!opts.force && prev && typeof prev === "object" && prev.ok && prev.at && (Date.now() - new Date(prev.at).getTime()) < DEEP_TTL_MS) {
    return { ok: true, deepStudy: prev, cached: true };
  }
  const cfg = await readSmartCfg();
                                                                                                                     
                                                                                                                    
                                                                                   
  const usado = await readDeepBudget();
  if (!opts.semTetoDiario && usado >= cfg.deepDailyCap) return { ok: false, error: "teto_diario", message: `Teto diario do Raio-X profundo atingido (${usado}/${cfg.deepDailyCap}).`, usado, teto: cfg.deepDailyCap };
                                                                                      
  const gate = await deepCostGate(0.05);
  if (!gate.allowed) return { ok: false, error: "orcamento", message: `Orcamento de IA travado: ${gate.reason}.` };
  const website = String(lead.website || "").trim();
  const limitacoes: string[] = [];
  if (!gate.checked) limitacoes.push("Nao foi possivel confirmar os tetos em dolares do agent-cost (o teto diario de corridas travou na mesma).");
  if (!website) return { ok: false, error: "sem_site", message: "Este lead nao tem site: nao ha o que investigar a fundo." };

  const site = await deepCrawlSite(website, t0);
                                                                                                                 
                                                                                                                    
                                                                                                                   
  if (!site.paginas.length) {
    const falhou = { at: new Date().toISOString(), ok: false, erro: "site_inacessivel", mensagem: `Nao consegui abrir o site do lead (${site.erro || "sem resposta"}). Nao invento o que nao li.`, fontes: [], factos: [], limitacoes, navegador: { workerOk: site.workerOk, jsRendered: site.jsRendered }, origem: opts.origem, duracaoMs: Date.now() - t0 };
    await deepPersist(leadId, falhou);
    return { ok: false, error: "site_inacessivel", message: falhou.mensagem, deepStudy: falhou };
  }
  const soc = await deepCrawlSocials(lead, t0);
  const brand = String(lead.entreprise || lead.nom || "").trim();
  const news = await deepNews(brand, String(lead.pais || ""), t0);

                                                             
  if (!site.workerOk) limitacoes.push(DEEP_WORKER_URL ? "O navegador do worker nao respondeu: o site foi lido so por HTTP (sem confirmacao de que abre num navegador real)." : "Worker de navegador nao configurado neste site: o site do lead foi lido so por HTTP.");
  if (site.jsRendered) limitacoes.push("O site e renderizado por JavaScript: o HTML nao traz o texto, so foi possivel ler o titulo e a meta descricao da home.");
  if (soc.inacessiveis.length) limitacoes.push(`Redes que nao foi possivel ler: ${soc.inacessiveis.join(", ")}.`);
  if (news.estado !== "ok") limitacoes.push(news.nota || "Sem pesquisa de noticias.");
                                                                                                                    
                                                                                                                  
  limitacoes.push(soc.seguidores.length
    ? `Seguidores: lidos so quando visiveis na pagina do perfil (${soc.seguidores.map((s) => `${s.platform}: ${s.valor}`).join(", ")}). Engagement exato continua a exigir fornecedor pago: nao foi lido nem estimado.`
    : "Seguidores e engagement exatos das redes exigem fornecedor pago: nao foram lidos nem estimados.");

  const lidas = [...site.paginas, ...soc.lidas, ...news.itens];
  const corpus = lidas.map((p) => `FONTE: ${p.url}\nTIPO: ${p.tipo}\nTITULO: ${p.titulo}${p.nota ? `\nAVISO: ${p.nota}` : ""}\nTEXTO:\n${p.texto}`).join("\n\n---\n\n").slice(0, 26000);
  const user = `EMPRESA (segundo o nosso CRM, nao e fonte citavel): ${brand || "?"} · setor ${lead.setor || "?"} · pais ${lead.pais || "?"}\n\nFONTES (o teu unico mundo; cita SO estes URLs):\n\n${corpus}\n\nDevolve o JSON.`;
  const errosIA: string[] = [];
  const llm = await deepLLMJson(DEEP_SYSTEM, user, errosIA);
                                                                                                                
                                                                                                 
  if (!llm || !llm.data || typeof llm.data !== "object") {
                                                                                                                 
                                                                                                                  
                                                                                        
    const falhou = { at: new Date().toISOString(), ok: false, erro: "ia_indisponivel", detalheIA: errosIA.slice(0, 6), mensagem: "A IA nao respondeu a tempo nesta corrida (site lento de ler ou motor ocupado). Volta a tentar; se persistir, verifica as chaves de IA.", fontes: [], factos: [], limitacoes, paginasLidas: site.paginas.length, origem: opts.origem, duracaoMs: Date.now() - t0 };
    await deepPersist(leadId, falhou);
    return { ok: false, error: "ia_indisponivel", message: falhou.mensagem, deepStudy: falhou };
  }
  const custo = await logDeepCost(llm.provider, llm.model, llm.inChars, llm.outChars);
  await bumpDeepBudget();

                                                                                                                  
                                                                                                             
  const permitidas = new Map<string, DeepSource & { texto: string }>();
  for (const p of lidas) permitidas.set(deepNormUrl(p.url), { url: p.url, titulo: p.titulo, tipo: p.tipo, chars: p.chars, lidoPor: p.lidoPor, texto: p.texto, ...(p.nota ? { nota: p.nota } : {}) });
  const { factos, descartados, semCitacao } = deepValidarFactos(Array.isArray(llm.data?.factos) ? llm.data.factos : [], permitidas);
                                                                                                                    
                                                                                                             
  const fontes: DeepSource[] = [...permitidas.values()].map((p) => ({ url: p.url, titulo: p.titulo, tipo: p.tipo, chars: p.chars, lidoPor: p.lidoPor, ...(p.nota ? { nota: p.nota } : {}) }));
                                                                                                                    
  if (!factos.length) {
    const vazio = { at: new Date().toISOString(), ok: false, erro: "sem_factos_com_fonte", mensagem: "A IA nao devolveu nenhum facto ancorado numa fonte que tenhamos lido de verdade. Nao ha dossier: prefiro nao entregar nada a entregar coisa inventada.", fontes, factos: [], factosDescartados: descartados, limitacoes, paginasLidas: site.paginas.length, custoEstimado: { usd: custo.usd, provider: llm.provider, model: llm.model }, pesquisaWeb: { estado: news.estado, n: news.itens.length }, navegador: { workerOk: site.workerOk, fonteTexto: site.paginas[0]?.lidoPor === "navegador" ? "navegador" : "http", jsRendered: site.jsRendered }, origem: opts.origem, duracaoMs: Date.now() - t0 };
    await deepPersist(leadId, vazio);
    return { ok: false, error: "sem_factos_com_fonte", deepStudy: vazio };
  }
  const D = llm.data?.dossier || {};
  const campos = ["quemSao", "oQueVendem", "paraQuem", "tomDeVoz", "oQueDizemDeSi", "provaSocial", "sinaisDeDor", "oportunidade", "anguloDeAbordagem"];
  const dossier: any = {};
  for (const c of campos) dossier[c] = noDash(String(D?.[c] || "").trim()).slice(0, 900);
                                                                                                                     
                                                                           
  if (semCitacao) limitacoes.push(`${semCitacao} facto(s) ficaram sem citacao literal: a frase que a IA propos entre aspas nao foi encontrada no texto da fonte, por isso as aspas foram retiradas (o facto continua ancorado no URL).`);
  const deepStudy = {
    at: new Date().toISOString(), ok: true,
    dossier,
    factos,
    fontes,
    factosDescartados: descartados,
    factosSemCitacao: semCitacao,
    paginasLidas: site.paginas.length,
    redesLidas: soc.lidas.length,
    redesSeguidores: soc.seguidores,
    limitacoes,
    pesquisaWeb: { estado: news.estado, n: news.itens.length, nota: news.nota, artigosAbertos: news.itens.filter((i) => i.lidoPor === "artigo aberto (HTTP)").length },
    navegador: { workerOk: site.workerOk, fonteTexto: site.paginas[0]?.lidoPor === "navegador" ? "navegador" : "http", jsRendered: site.jsRendered, finalUrl: site.finalUrl },
    custoEstimado: { usd: custo.usd, provider: llm.provider, model: llm.model },
    origem: opts.origem,
    duracaoMs: Date.now() - t0,
  };
  await deepPersist(leadId, deepStudy);
  return { ok: true, deepStudy };
}
                                                                                                                    
async function deepPersist(leadId: string, deepStudy: any): Promise<void> {
  try {
    const tok = selfAdmin(); if (!tok) return;
                                                                                                                     
                                                                                                 
    await deepFetch(`${selfBase()}/api/crm-leads`, 8000, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, deepStudy }] }) });
  } catch {  }
}
                                                                                                               
function buildDeepCtx(lead: any): string {
  const D = lead?.deepStudy;
  if (!D || typeof D !== "object" || D.ok !== true) return "";
  const d = D.dossier || {};
  const rot: Array<[string, string]> = [["quemSao", "quem sao"], ["oQueVendem", "o que vendem"], ["paraQuem", "para quem"], ["tomDeVoz", "tom de voz da marca"], ["oQueDizemDeSi", "o que dizem de si"], ["provaSocial", "prova social que exibem"], ["sinaisDeDor", "sinais de dor"], ["oportunidade", "oportunidade concreta"], ["anguloDeAbordagem", "angulo de abordagem"]];
  const bits = rot.map(([k, r]) => { const v = String(d[k] || "").trim(); return (v && !deepIsNotObserved(v)) ? `- ${r}: ${v}` : ""; }).filter(Boolean);
  const factos = (Array.isArray(D.factos) ? D.factos : []).slice(0, 12).map((f: any) => `- ${String(f?.facto || "")} (fonte: ${String(f?.fonte || "")})`).filter((s: string) => s.length > 12);
  if (!bits.length && !factos.length) return "";
  const quando = D.at ? String(D.at).slice(0, 10) : "";
  return `\nRAIO-X PROFUNDO desta marca (investigacao REAL feita pelo sistema${quando ? ` em ${quando}` : ""}: lemos ${D.paginasLidas || 0} pagina(s) do site${D.redesLidas ? ` e ${D.redesLidas} rede(s)` : ""}${D.pesquisaWeb?.n ? ` e ${D.pesquisaWeb.n} noticia(s)` : ""}).\nFACTOS VERIFICADOS (cada um saiu de uma fonte que lemos mesmo; podem usa-los com naturalidade, ate citar o que a marca diz de si, mas NUNCA acrescentem nada que nao esteja aqui, e NUNCA despejem esta lista crua dentro do email):\n${factos.join("\n")}\n${bits.length ? `LEITURA DA MARCA:\n${bits.join("\n")}\n` : ""}`;
}
                                                                                                                                                                                                                                          
                                                                                                              
                                                                                                             
const REUNIAO_RE = /(meeting|reuni[ãa]o|rendez[- ]?vous|\btermin\b|videochamada|video ?call|\bcall\b|zoom|google meet|teams|calendly|agendar|marcar (uma )?(conversa|chamada)|disponibilidade para (falar|conversar)|disponibilit[ée]s?|\bappel\b|[ée]changer|en discuter|planifier|schedule (a )?(call|meeting|chat)|available (to|for) (talk|speak|a call)|wann (k[öo]nnen|passt)|gespr[äa]ch)/i;
function needsHuman(text: string): boolean { return /(pre[cç]o|price|or[cç]ament|budget|contrat|contract|fatur|invoic|\bpaga|payment|proposta|proposal|reclama|complain|urgent|advogad|legal|jur[ií]d|meeting|reuni[ãa]o|rendez[- ]?vous|\btermin\b|videochamada|video ?call|\bcall\b|zoom|google meet|teams|calendly|agendar|marcar (uma )?(conversa|chamada)|disponibilidade para (falar|conversar)|disponibilit[ée]s?|\bappel\b|[ée]changer|en discuter|planifier|schedule (a )?(call|meeting|chat)|available (to|for) (talk|speak|a call)|wann (k[öo]nnen|passt)|gespr[äa]ch)/i.test(String(text || "")); }                                                                   
                                                                                                                     
                                                                                                                       
                                                                                                                     
                                                                                                                  
                                                                                                   
                                                                                                         
const _sentGuard = new Map<string, number>();
const SENT_GUARD_MS = 3 * 60 * 1000;
async function enqueueReply(to: string, subject: string, corpo: string, leadId: string): Promise<void> {
                                                                                                                         
  if (SEND_HARD_OFF) { console.log("[abil] HARD-OFF: resposta nao enviada (teaser)"); return; }
  const lid = String(leadId || "");
  const now = Date.now();
  if (lid) {
    const prev = _sentGuard.get(lid) || 0;
    if (now - prev < SENT_GUARD_MS) return;
    try {
      const th = await readThreadMerged(`${THREADS_PREFIX}${lid}.json`);
      const lastOut = [...th].reverse().find((m: any) => m && m.dir === "out");
      if (lastOut && (now - (Date.parse(String(lastOut.at || "")) || 0)) < SENT_GUARD_MS) { _sentGuard.set(lid, now); return; }
    } catch {  }
    _sentGuard.set(lid, now);
  }
                                                                                                             
                                                                                                    
                                                                                                    
                                                                                    
  const _meta = /(o lead|do lead|the lead\b|le lead\b|a jornada|la journ[ée]e du lead|fase:\s|phase:\s|contexto que (me )?foi|context(e|o) (fourni|dado)|classific(ad[oa]|ation)|Entendido\. A mensagem|Attention\s*:\s*il y a une confusion|segundo a jornada|meta-?discurso|minha (instru|tarefa)|my (instruction|task)s?\b|system prompt|persona d[oe])/i;
  if (_meta.test(String(corpo || ""))) {
    try { await patchLeadEmailPrep(lid, subject, corpo, "BLOQUEADO pela barreira anti-vazamento: o texto contem meta-discurso do agente e NAO foi enviado. Rever e reescrever a mao."); } catch {  }
    console.error("[enqueueReply] BLOQUEADO anti-vazamento", { leadId: lid, amostra: String(corpo || "").slice(0, 120) });
    return;
  }
  try { const sig = await readSig(); const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#111">${esc(noDash(corpo)).replace(/\n/g, "<br>")}</div>` + (sig ? `<div style="margin-top:24px">${sig}</div>` : ""); const tok = selfAdmin(); await fetch(`${selfBase()}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ tenantId: TENANT, items: [{ to, subject: noDash(subject), html, leadId, scheduledAt: new Date().toISOString() }] }) }).catch(() => undefined); } catch {  }
}
                                                                                                                     
async function patchLeadEmailPrep(leadId: string, subject: string, corpo: string, nota?: string): Promise<void> {
  try { const tok = selfAdmin(); await fetch(`${selfBase()}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, emailPrep: { assunto: noDash(subject), corpo: noDash(corpo), at: new Date().toISOString(), kind: "smart-suggest", ...(nota ? { nota } : {}) } }] }) }).catch(() => undefined); } catch {  }
}
                                                                                                         
type ReplyCounters = { sugeridos: number; enviados: number; escalados: number; bloqueados: number; negativas: number; autosIgnorados: number; deepRuns: number; deepCorridos: number; deepAdiados: number };

                                                                                                                                                                                                    
                                                                                                            
                                                                                                                  
                                                                                                    
                                                                                                                    
                                                                                                                  
                                                                    
                                                                           
                                                                                                                   
                                                                                                                   
                                                                                                                   
                                                                                                                         
                                                                                                               
                                                                                                                 
                                                                                                               
type DeepGate = { acao: "responder"; deep: any | null; skipReason?: string } | { acao: "adiar"; motivo: string };
async function ensureDeepBeforeReply(leadId: string, ctr: ReplyCounters, cls?: string): Promise<DeepGate> {
  const lead = await loadLead(leadId);
                                                                                                                
  if (!lead) return { acao: "responder", deep: null };
                                                                                                              
                                                                                                              
                                                                                                         
  const cfgPortao = await readSmartCfg();
  if (!cfgPortao.deepAuto) {
    if (String(lead.deepSkipReason || "") !== "auto_desligado") await patchLeadDeepSkip(leadId, "auto_desligado");
    return { acao: "responder", deep: null, skipReason: "auto_desligado" };
  }
  const reg = lead.deepStudy;
  const idade = reg?.at ? (Date.now() - new Date(reg.at).getTime()) : Infinity;
                                                                                                            
                                                                                          
  if (reg && typeof reg === "object" && reg.ok === true && reg.at && idade < DEEP_TTL_MS) return { acao: "responder", deep: reg };
                                                                                                                                                                                         
                                                                                                     
                                                                                                           
                                                                                                         
                                                                                                          
                                                                                                           
                                                                                   
  if (String(cls || lead.replyClass || "") !== "positiva") return { acao: "responder", deep: null, skipReason: "sem_resposta_positiva" };
                                                                                                           
                                                                                                    
  if (!String(lead.website || "").trim()) return { acao: "responder", deep: null, skipReason: "sem_site" };
                                                                                                                
                                                                                                                 
  if (reg && typeof reg === "object" && reg.at && reg.ok !== true && idade < DEEP_FAIL_RETRY_MS) return { acao: "responder", deep: null, skipReason: "raio_x_falhou" };
                                                                                                     
  if (ctr.deepRuns >= DEEP_RUNS_POR_SCAN) { ctr.deepAdiados++; return { acao: "adiar", motivo: "orcamento_do_scan" }; }
                                                                                                                       
  let dr: any = null;
  try { dr = await deepResearch(leadId, { origem: "auto-resposta" }); } catch { dr = null; }
                                                                                                                   
                                                                                                                
  if (dr && dr.ok !== true && (dr.error === "teto_diario" || dr.error === "orcamento")) { ctr.deepAdiados++; return { acao: "adiar", motivo: String(dr.error) }; }
                                                                                                                     
  ctr.deepRuns++; ctr.deepCorridos++;
  if (dr && dr.ok === true && dr.deepStudy) return { acao: "responder", deep: dr.deepStudy };
                                                                                                                 
  if (dr && dr.error === "sem_site") return { acao: "responder", deep: null, skipReason: "sem_site" };
                                                                                                           
                                                                                                         
  return { acao: "responder", deep: null, skipReason: "raio_x_falhou" };
}
                                                                                                       
                                                                                                               
                                                                             
async function patchLeadDeepSkip(leadId: string, motivo: string): Promise<void> {
  try { const tok = selfAdmin(); if (!tok) return; await deepFetch(`${selfBase()}/api/crm-leads`, 8000, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, deepSkipReason: motivo, deepSkipAt: motivo ? new Date().toISOString() : "" }] }) }); } catch {  }
}
                                                                                                                    
                                                                                                                 
                                                                                                                    
                                                 
                                                                                                                      
async function handleOneReply(m: any, cfg: Awaited<ReturnType<typeof readSmartCfg>>, ctr: ReplyCounters, opts?: { atraso?: boolean }): Promise<{ adiado: boolean; iaFalhou?: boolean }> {
                                                                                                               
  if ((m as any).humanHandoff) return { adiado: false };
  const cls = String(m.replyClass || "neutra");
  if (cls === "auto") return { adiado: false };                                                                            
                                                                                                            
                                                                                                        
  if (await respostaJaEnviada(String(m.leadId), Date.parse(String(m.at || "")) || undefined)) return { adiado: false };
  try {
    if (cls === "negativa") {
                                                                                                                   
                                                                                                                      
                                                                                                                     
                                                                                                                   
      ctr.negativas++;
                                                                                                                                 
      if (OPT_OUT_RE.test(`${m.subject || ""} ${m.snippet || ""}`)) return { adiado: false };
      const corpo = await declineCopyFor(resolveLangKey(m.idioma, m.pais, m.snippet), m.nome, cfg, { leadId: String(m.leadId || ""), incomingText: String(m.snippet || "") });
      const baseSubj = String(m.subject || "");
      const subject = baseSubj ? (/^\s*re\s*:/i.test(baseSubj) ? baseSubj : `Re: ${baseSubj}`) : "Re: votre message";
      const risky = needsHuman(String(m.snippet || ""));
      const wouldSend = cfg.autonomous && !risky && String(m.lifecycle || "active") === "active";
      if (wouldSend && SEND_HARD_OFF) {
                                                                                                           
        console.log("[abil] HARD-OFF: cortesia de negativa nao enviada (teaser)");
        await patchLeadEmailPrep(String(m.leadId), subject, corpo); ctr.sugeridos++; ctr.bloqueados++;
        return { adiado: false };
      }
      if (wouldSend) { await enqueueReply(String(m.email), subject, corpo, String(m.leadId)); await appendThread(String(m.leadId), { dir: "out", at: new Date().toISOString(), to: m.email, subject, body: corpo, via: "auto-cortesia" }); ctr.enviados++; }
      else { await patchLeadEmailPrep(String(m.leadId), subject, corpo); ctr.sugeridos++; if (cfg.autonomous && risky) ctr.escalados++; }
      return { adiado: false };
    }
                                                                                                         
                                                                                                                     
                                                                                                                      
                                                                           
    const portao = await ensureDeepBeforeReply(String(m.leadId), ctr, cls);
    if (portao.acao === "adiar") {
                                                                                                                  
                                                                                                                     
                                                                                          
      console.log(`[abil] Raio-X em falta (${portao.motivo}): resposta ADIADA para o proximo ciclo, lead ${String(m.leadId)}`);
      return { adiado: true };
    }
    const deepFresco = portao.deep;
                                                                                                                   
    await patchLeadDeepSkip(String(m.leadId), portao.skipReason || "");
                                                                                                                      
                                                                                                            
                                                                                                                     
                                                                                       
                                                                                                                      
                                                                                                                    
                                                                                                                   
                                                                        
    let holdForDiag = false;
    if (cls === "positiva" && String(m.abordagem || "") !== "agencia") {
      try {
        const full = await loadLead(String(m.leadId));
                                                                                                                      
                                                                                                                    
                                                                                                                      
                                                                                                                     
                                                                                                                      
                                                                                    
        if (full && precisaLpProfunda(full) && (String(full.website || "").trim() || String(full.placeId || "").trim())) {
          const tok = selfAdmin();
          if (tok) {
                                                                                                                       
                                                                                                             
            const rq = await fetch(`${selfBase()}/api/lead-audit-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ tenantId: "abil-autodiag", items: [{ leadId: String(full.id), url: String(full.website || ""), placeId: String(full.placeId || ""), company: String(full.entreprise || full.nom || ""), lp: true, origem: "resposta-positiva" }] }) }).catch(() => null);
            const rd: any = rq ? await rq.json().catch(() => null) : null;
                                                                                                                      
                                                                                                                      
                                                                                                          
            holdForDiag = !!(rd && rd.ok && (Number(rd.added || 0) > 0 || rd.lpPendente === true));
          }
        }
      } catch {  }
    }
                                                                                                                       
                                                                                                                     
                                                                                                                   
                                                                                                                     
    const gen = await generateSmartReply(String(m.leadId), undefined, deepFresco, { autoDiag: false, atraso: !!opts?.atraso, deepSkip: portao.skipReason, lastInFallback: { subject: String(m.subject || ""), body: String((m as any)._body || m.snippet || ""), at: String(m.at || "") } }); if (!gen.ok || !gen.draft) return { adiado: false, iaFalhou: true };                                                                                                   
    const risky = needsHuman(String(m.snippet || "") + " " + gen.draft);
    const notaDiag = holdForDiag ? "Resposta positiva de cliente sem analise publicada: diagnostico automatico disparado; envio retido para a resposta ir com o link (a Fase 2 do cron entrega quando a analise publicar)." : undefined;
                                                                                                                     
                                                 
    const wouldSend = !holdForDiag && cfg.autonomous && !risky && String(m.lifecycle || "active") === "active";
    if (wouldSend && SEND_HARD_OFF) {
                                                                                                                         
                                                                                                                   
      console.log("[abil] HARD-OFF: resposta nao enviada (teaser)");
      await patchLeadEmailPrep(String(m.leadId), gen.subject || "Re:", gen.draft); ctr.sugeridos++; ctr.bloqueados++;
      return { adiado: false };
    }
    if (wouldSend) { await enqueueReply(String(m.email), gen.subject || "Re:", gen.draft, String(m.leadId)); await appendThread(String(m.leadId), { dir: "out", at: new Date().toISOString(), to: m.email, subject: gen.subject, body: gen.draft, via: "auto" }); ctr.enviados++; }
    else { await patchLeadEmailPrep(String(m.leadId), gen.subject || "Re:", gen.draft, notaDiag); ctr.sugeridos++; if (cfg.autonomous && risky) ctr.escalados++; }
  } catch {  }
                                                                                                    
  return { adiado: false };
}
                                                                                                                 
async function autoHandleReplies(matched: any[]): Promise<{ sugeridos: number; enviados: number; escalados: number; bloqueados: number; negativas: number; autosIgnorados: number; deepCorridos: number; deepAdiados: number }> {
  const cfg = await readSmartCfg();
  const ctr: ReplyCounters = { sugeridos: 0, enviados: 0, escalados: 0, bloqueados: 0, negativas: 0, autosIgnorados: 0, deepRuns: 0, deepCorridos: 0, deepAdiados: 0 };
  const done = () => ({ sugeridos: ctr.sugeridos, enviados: ctr.enviados, escalados: ctr.escalados, bloqueados: ctr.bloqueados, negativas: ctr.negativas, autosIgnorados: ctr.autosIgnorados, deepCorridos: ctr.deepCorridos, deepAdiados: ctr.deepAdiados });
  if (!matched.length) return done();
                                                                                                              
  for (const m of matched) if (String(m.replyClass || "") === "auto") ctr.autosIgnorados++;
  if (!(cfg.enabled || cfg.autonomous)) return done();
                                                                                                                   
                                                                                                                 
                                                                                                                     
                                               
  for (const m of matched) await handleOneReply(m, cfg, ctr);
  return done();
}

                                                                                                                                                                                                                                        
                                                                                                              
                                                                                                                
                                                                                                                     
                                                                                                                
const BACKLOG_POR_CORRIDA = 2;                                                                                      
const BACKLOG_EXAME_MAX = 10;                                                                                                      
const BACKLOG_NEG_MAX_MS = 7 * 24 * 3600 * 1000;                                                                                    
const BACKLOG_ATRASO_MS = 5 * 24 * 3600 * 1000;                                                                                
                                                                                                                    
                                                                                                                   
                                                                                                                  
                                                                                               
const BACKLOG_DONE_KEY = "replies/backlog-handled.json";
const BACKLOG_DONE_MAX = 1000;                                                                      
                                                                                                                      
                                                                                                                    
                                                                             
async function backlogSweep(opts?: { deepJaCorridos?: number }): Promise<{ vistos: number; sugeridos: number; enviados: number; deepCorridos: number; deepAdiados: number }> {
  const out = { vistos: 0, sugeridos: 0, enviados: 0, deepCorridos: 0, deepAdiados: 0 };
  try {
    const cfg = await readSmartCfg();
                                                                                                             
    if (!(cfg.enabled || cfg.autonomous)) return out;
    const events: any[] = await readJson<any[]>(EVENTS_KEY, []);
    if (!Array.isArray(events) || !events.length) return out;
                                                                                               
    const done: Record<string, { at: string; outcome: string }> = (await readJson<Record<string, { at: string; outcome: string }>>(BACKLOG_DONE_KEY, {})) || {};
                                                                                                                
                                                                                                                   
                                                                                     
    const cands = events.filter((e) => e && e.leadId && e.msgId && String(e.replyClass || "") !== "auto" && !done[String(e.msgId)]);
    if (!cands.length) return out;
                                                                   
    const ts = (e: any) => Date.parse(String(e?.date || e?.seenAt || "")) || 0;
    cands.sort((a, b) => ts(a) - ts(b));
    const cloud = await readJson<any>("crm/leads.json", { leads: [] });
    const leads: any[] = Array.isArray(cloud) ? cloud : (cloud?.leads || []);
    const byId = new Map<string, any>(leads.filter((l) => l && l.id).map((l) => [String(l.id), l]));
    const sup: any = (await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] })) || {};
    const supE = new Set((Array.isArray(sup.emails) ? sup.emails : []).map((x: any) => String(x).toLowerCase()));
    const supD = new Set((Array.isArray(sup.domains) ? sup.domains : []).map((x: any) => String(x).toLowerCase().replace(/^@/, "")));
                                                                                                                    
                                                                                                                     
                                                                                                                   
                                                                                         
    const ctr: ReplyCounters = { sugeridos: 0, enviados: 0, escalados: 0, bloqueados: 0, negativas: 0, autosIgnorados: 0, deepRuns: Math.max(0, Number(opts?.deepJaCorridos || 0)), deepCorridos: 0, deepAdiados: 0 };
    let processados = 0, examinados = 0, mudou = false;
                                                                                                                  
                                                                                                                    
    const stamp = (ev: any, outcome: string) => { done[String(ev.msgId)] = { at: new Date().toISOString(), outcome }; mudou = true; };
    for (const ev of cands) {
      if (processados >= BACKLOG_POR_CORRIDA || examinados >= BACKLOG_EXAME_MAX) break;
      out.vistos++;
      const lead = byId.get(String(ev.leadId));
      if (!lead) { stamp(ev, "lead_inexistente"); continue; }                                               
                                                                                                   
      if (String(lead.lifecycle || "active") !== "active") continue;
      const em = String(ev.fromEmail || lead.email || "").toLowerCase();
      const dom = domainOf(em);
      if ((em && supE.has(em)) || (dom && !FREEMAIL.has(dom) && supD.has(dom))) continue;
      const evAt = ts(ev);
      const idadeMs = evAt ? Math.max(0, Date.now() - evAt) : 0;
      const cls = (String(ev.replyClass || "") || (NEG_DURA_RE.test(zonaDaResposta(String(ev.snippet || ""))) ? "negativa" : classifyReply(String(ev.subject || ""), stripQuotedTail(String(ev.snippet || ""))))) as string;                                                               
                                                                                                                
      if (cls === "negativa" && idadeMs > BACKLOG_NEG_MAX_MS) { stamp(ev, "negativa_arquivada"); continue; }
                                                                                                         
      const prepAt = Date.parse(String(lead.emailPrep?.at || "")) || 0;
      if (lead.emailPrep && String(lead.emailPrep.corpo || "").trim() && prepAt >= evAt) { stamp(ev, "rascunho_pendente"); continue; }
                                                                                                                 
      examinados++;
      const th = await readThreadMerged(`${THREADS_PREFIX}${ev.leadId}.json`);
                                                                                                             
                                                                                                               
      if (ev.msgId && String(ev._body || ev.snippet || "").trim() && !th.some((mm) => mm && mm.msgId === ev.msgId)) {
        await appendThread(String(ev.leadId), { dir: "in", at: ev.date || ev.seenAt || new Date().toISOString(), from: String(ev.fromEmail || ""), subject: ev.subject || "", body: String(ev._body || ev.snippet || ""), msgId: ev.msgId });
      }
      const jaRespondido = th.some((mm) => mm && mm.dir === "out" && (Date.parse(String(mm.at || "")) || 0) > evAt);
      if (jaRespondido) { stamp(ev, "ja_respondido"); continue; }
                                                                                                                       
                                                                                                                                   
      const m = { leadId: lead.id, nome: lead.nom || lead.nome || lead.entreprise || "", email: String(lead.email || ev.fromEmail || ""), subject: ev.subject || "", snippet: ev.snippet || "", lifecycle: lead.lifecycle, idioma: lead.idioma, pais: lead.pais, abordagem: String(lead.abordagem || "cliente"), humanHandoff: !!(lead as any).humanHandoff, replyClass: cls, at: ev.date || ev.seenAt || "", msgId: ev.msgId || "", _body: ev._body || "" };
      const antes = { s: ctr.sugeridos, e: ctr.enviados };
      const r = await handleOneReply(m, cfg, ctr, { atraso: idadeMs > BACKLOG_ATRASO_MS });
      out.sugeridos += ctr.sugeridos - antes.s;
      out.enviados += ctr.enviados - antes.e;
                                                                                                                      
                                                                                                                    
                                                   
                                                                                                                   
                                                                                                                   
                                                                                                                   
                                                                                  
      if (r.adiado) continue;
      processados++;
                                                                                                                
                                                                                                                 
      if ((r as any).iaFalhou) continue;
      stamp(ev, ctr.enviados > antes.e ? "enviado" : (ctr.sugeridos > antes.s ? "sugerido" : "processado"));
    }
                                                                                                                 
    if (mudou) {
      const keys = Object.keys(done);
      if (keys.length > BACKLOG_DONE_MAX) {
        keys.sort((a, b) => String(done[a]?.at || "").localeCompare(String(done[b]?.at || "")));
        for (const k of keys.slice(0, keys.length - BACKLOG_DONE_MAX)) delete done[k];
      }
      await writeJson(BACKLOG_DONE_KEY, done);
    }
    out.deepCorridos = ctr.deepCorridos; out.deepAdiados = ctr.deepAdiados;
    return out;
  } catch { return out; }
}

function hdr(req: VercelRequest, n: string): string { const v = req.headers[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function qv(req: VercelRequest, n: string): string { const v = req.query[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function adminAuthed(req: VercelRequest): boolean {
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const tok = hdr(req, "x-abil-admin");
  if (PW && tok && tok.indexOf(".") > 0) {
    const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1);
    if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } }
  }
  return false;
}
function cronAuthed(req: VercelRequest): boolean { const a = hdr(req, "authorization"); return (!!CRON_SECRET && a === `Bearer ${CRON_SECRET}`) || adminAuthed(req); }

function header(headers: any[], name: string): string { const h = (headers || []).find((x: any) => String(x.name || "").toLowerCase() === name.toLowerCase()); return h ? String(h.value || "") : ""; }
function parseFromEmail(from: string): string { const m = String(from || "").match(/<([^>]+)>/); return (m ? m[1] : String(from || "")).trim().toLowerCase(); }
function parseFromName(from: string): string { const m = String(from || "").match(/^\s*"?([^"<]*?)"?\s*</); return m ? m[1].trim() : ""; }

                               
                                                                                                     
                                                                                                                   
                                                                                                                   
                                                                                                            
const CONN_KEY = `meta/connections/${TENANT}.enc`;
const ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
function aesKey(): Buffer { return crypto.scryptSync(ENC_PW, "abil_meta_salt_v1", 32); }
function decEnc(b: string): string { const [v, ivb, tagb, encb] = b.split("."); if (v !== "v1") throw new Error("bad_cipher"); const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivb, "base64")); d.setAuthTag(Buffer.from(tagb, "base64")); return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8"); }
async function readConnRefreshToken(): Promise<string | null> {
  if (!ENC_PW) return null;
  try {
    let txt: string | null = null;
    if (BLOB_PUBLIC_BASE) { const r = await fetch(`${BLOB_PUBLIC_BASE}/${CONN_KEY}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); }
    if (!txt) { const { blobs } = await list({ prefix: CONN_KEY, limit: 1 }); const bl = blobs.find((x) => x.pathname === CONN_KEY); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } }
    if (!txt) return null;
    const rec: any = JSON.parse(decEnc(txt));
    return (rec?.google?.refreshToken as string) || null;
  } catch { return null; }
}
async function refreshWith(cid: string | undefined, csec: string | undefined, rt: string): Promise<string | null> {
  if (!cid || !csec || !rt) return null;
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: cid, client_secret: csec, refresh_token: rt, grant_type: "refresh_token" }).toString() });
    if (r.ok) { const j: any = await r.json(); return j?.access_token || null; }
  } catch {  }
  return null;
}
async function gmailToken(): Promise<{ token: string | null; via?: string; err?: string }> {
                                                                                        
  const rtBlob = await readConnRefreshToken();
  if (rtBlob) {
    const at = await refreshWith(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET, rtBlob)
      || await refreshWith(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, rtBlob);
    if (at) return { token: at, via: `blob:${TENANT}` };
  }
                                                                                                            
  const rt = process.env.GMAIL_REFRESH_TOKEN || process.env.ABIL_GMAIL_REFRESH_TOKEN;
  if (rt) {
    const at1 = await refreshWith(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET, rt);
    if (at1) return { token: at1, via: "env:oauth" };
    const at2 = await refreshWith(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, rt);
    if (at2) return { token: at2, via: "env:client" };
  }
  return { token: null, err: "gmail nao ligado (religa o Google no dashboard ou define GMAIL_REFRESH_TOKEN)" };
}

                                                                                                        
                                                                                                          
                       
const FREEMAIL = new Set(["gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.it", "outlook.com", "outlook.pt", "live.com", "live.co.uk", "msn.com", "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.it", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "gmx.com", "gmx.net", "protonmail.com", "proton.me", "mail.com", "yandex.com", "sapo.pt", "orange.fr", "free.fr", "laposte.net", "bluewin.ch", "sunrise.ch", "libero.it", "virgilio.it"]);
const domainOf = (em: any): string => { const e = String(em || "").trim().toLowerCase(); const i = e.indexOf("@"); return i > 0 ? e.slice(i + 1) : ""; };
                                                                                               
function buildDomainIndex(leads: any[]): Map<string, any[]> {
  const idx = new Map<string, any[]>();
  for (const l of leads) { if (!l) continue; const d = domainOf(l.email); if (!d || FREEMAIL.has(d)) continue; const arr = idx.get(d); if (arr) arr.push(l); else idx.set(d, [l]); }
  return idx;
}
                                                                                                      
                                                                                              
function pickByDomain(cands?: any[]): any {
  if (!cands || !cands.length) return undefined;
  const sent = cands.filter((l) => l && l.lastEmailSentAt);
  if (sent.length) return sent.slice().sort((a, b) => (Date.parse(b.lastEmailSentAt) || 0) - (Date.parse(a.lastEmailSentAt) || 0))[0];
  const ts = (l: any) => { const v = Date.parse(String(l?.dataMapeamento || l?.createdAt || "")); return Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER; };
  return cands.slice().sort((a, b) => ts(a) - ts(b))[0];
}

                                                                                                                                                                                          
                                                                                                            
                                                                                                             
                                                                                                              
                                                                                                            
async function captureTestimonial(lead: any, ev: any): Promise<void> {
  try {
    const tok = selfAdmin(); if (!tok) return;
    const base = selfBase();
                                                                                                               
                                                                         
    const texto = String(ev._body || ev.snippet || "").split(/\r?\n/).filter((ln: string) => !/^\s*>/.test(ln)).join(" ").replace(/\s+/g, " ").trim().slice(0, 800);
    if (texto.length < 20) return;
    const r = await fetch(`${base}/api/private-store?col=testimonials&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" });
    const d: any = r.ok ? await r.json().catch(() => null) : null;
    const cur: any[] = Array.isArray(d?.value) ? d.value : [];
    const msgKey = String(ev.msgId || "");
    if (cur.some((t) => t && ((msgKey && t.msgId === msgKey) || (String(t.leadId || "") === String(lead.id) && String(t.texto || "") === texto)))) return;
    const item = {
      id: `tm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      cliente: noDash(String(lead.nom || ev.fromName || "").trim()).slice(0, 120),
      empresa: noDash(String(lead.entreprise || "").trim()).slice(0, 120),
      texto: noDash(texto),
      idioma: resolveLangKey(lead.idioma, lead.pais, texto),
      autorizadoEm: new Date().toISOString(),
      fonte: "email",
      aprovado: false,
      criadoEm: new Date().toISOString(),
      leadId: String(lead.id),
      msgId: msgKey,
    };
    await fetch(`${base}/api/private-store?col=testimonials`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ value: [item, ...cur].slice(0, 200) }) });
  } catch {  }
}

                                                                                                         
                                                                                                    
                                                                                                    
                                                                         

                                                                                                    
const OOO_MONTHS: Record<string, number> = { jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, abr: 4, avr: 4, may: 5, mai: 5, mag: 5, jun: 6, giu: 6, jul: 7, lug: 7, aug: 8, ago: 8, aou: 8, sep: 9, set: 9, oct: 10, out: 10, okt: 10, ott: 10, nov: 11, dec: 12, dez: 12, dic: 12 };
function parseOooReturn(text: string): string {
  const t = ` ${String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")} `.slice(0, 4000);
  const now = new Date();
  const mk = (d: number, m: number, y?: number) => {
    let yy = y || now.getFullYear();
    if (yy < 100) yy += 2000;
    let dt = new Date(Date.UTC(yy, m - 1, d, 8, 0, 0));
    if (!y && dt.getTime() < now.getTime() - 86400000) dt = new Date(Date.UTC(yy + 1, m - 1, d, 8, 0, 0));
    const dias = (dt.getTime() - now.getTime()) / 86400000;
    return (dias > -1 && dias < 120) ? dt.toISOString() : "";
  };
  const zona = (() => { const m = t.match(/(zuruck|zurueck|back (on|in the office)|return(ing)? (on)?|de volta|regresso|retour le|de retour|rientro|di ritorno|de regreso|wieder (erreichbar|im buro)|ab dem|from|a partir de|as of|erst (am|wieder))/); if (!m) return t; const i = m.index || 0; return t.slice(i, i + 160); })();
  let m = zona.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (m) { const d = Number(m[1]), mo = Number(m[2]); if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) { const r = mk(d, mo, m[3] ? Number(m[3]) : undefined); if (r) return r; } }
  m = zona.match(/(\d{1,2})\.?\s*(?:of\s+|de\s+|di\s+)?([a-z]{3,12})/);
  if (m) { const mo = OOO_MONTHS[m[2].slice(0, 3)]; if (mo) { const r = mk(Number(m[1]), mo); if (r) return r; } }
  m = zona.match(/([a-z]{3,12})\s+(\d{1,2})/);
  if (m) { const mo = OOO_MONTHS[m[1].slice(0, 3)]; if (mo) { const r = mk(Number(m[2]), mo); if (r) return r; } }
  return "";
}

                                                                                                          
                                                                     
async function mailAudit(days: number): Promise<any> {
  if (!ZOHO_IMAP_USER || !ZOHO_IMAP_PASS) return { ok: false, error: "zoho_imap_not_configured" };
  let client: any = null;
  try {
    const mod: any = await import("imapflow");
    client = new mod.ImapFlow({ host: ZOHO_IMAP_HOST, port: 993, secure: true, auth: { user: ZOHO_IMAP_USER, pass: ZOHO_IMAP_PASS }, logger: false });
    await client.connect();
    const since = new Date(Date.now() - Math.max(1, days) * 86400000);
    const cloud = await readJson<any>("crm/leads.json", { leads: [] });
    const leads: any[] = Array.isArray(cloud) ? cloud : (Array.isArray(cloud?.leads) ? cloud.leads : []);
    const byEmail = new Map<string, any>();
    for (const l of leads) { const e = String(l?.email || "").trim().toLowerCase(); if (e && !byEmail.has(e)) byEmail.set(e, l); }
    const contacted = await readJson<Record<string, any>>(`email/contacted/${TENANT}.json`, {});
    const byId = new Map<string, any>(leads.filter((l) => l && l.id).map((l) => [String(l.id), l]));
    const domIdx = buildDomainIndex(leads);
    const boxes = await client.list();
    const junk = (boxes || []).find((b: any) => b.specialUse === "\\Junk" || /junk|spam/i.test(String(b.path || "")));
    const folders: string[] = ["INBOX", ...(junk ? [String(junk.path)] : [])];
    const rows: any[] = [];
    for (const folder of folders) {
      const lock = await client.getMailboxLock(folder);
      try {
        for await (const msg of client.fetch({ since }, { envelope: true, uid: true, internalDate: true }) as any) {
          const from = String(msg.envelope?.from?.[0]?.address || "").trim().toLowerCase();
          if (!from || from === String(ZOHO_IMAP_USER).toLowerCase()) continue;
          if (/mailer-daemon|postmaster@|delivery|noreply@zoho|no-reply@zoho|dmarc/i.test(from)) continue;
          const subject = String(msg.envelope?.subject || "");
          if (/report domain:|dmarc/i.test(subject)) continue;
          const at = msg.internalDate ? new Date(msg.internalDate).toISOString() : "";
          let l = byEmail.get(from);
          if (!l) { const c = (contacted as any)[from]; if (c && c.leadId) l = byId.get(String(c.leadId)); }
          if (!l) { const d = domainOf(from); if (d && !FREEMAIL.has(d)) l = pickByDomain(domIdx.get(d)); }
          if (!l) {
            const subjL = subject.toLowerCase();
            if (subjL.length > 8) l = leads.find((x) => { const n = String(x?.entreprise || x?.nome || x?.nom || "").trim().toLowerCase(); return n.length >= 5 && subjL.includes(n); });
          }
          if (!l) {
            const isRe = /^\s*(re|aw|sv|rif)\s*:/i.test(subject);
            rows.push({ folder, from, subject: subject.slice(0, 120), at, lead: null, verdict: isRe ? "ORFA_parece_resposta_sem_lead" : "nao_relacionado" });
            continue;
          }
          const th = await readThreadMerged(`${THREADS_PREFIX}${l.id}.json`);
          const evAt = Date.parse(at) || 0;
          const inGravado = th.some((m) => m && m.dir === "in" && Math.abs((Date.parse(String(m.at || "")) || 0) - evAt) < 26 * 36e5);
          const outDepois = th.some((m) => m && m.dir === "out" && (Date.parse(String(m.at || "")) || 0) > evAt + 30000);
          const oooLike = AUTO_RE.test(`${subject} `);
          let verdict = "";
          if ((l as any).humanHandoff) verdict = "com_o_operador";
          else if (oooLike) verdict = "auto_ooo";
          else if (outDepois && inGravado) verdict = "respondido";
          else if (outDepois) verdict = "respondido_mas_IN_nao_gravado";
          else if (inGravado) verdict = "SEM_RESPOSTA";
          else verdict = "SEM_RESPOSTA_e_IN_nao_gravado";
          rows.push({ folder, from, subject: subject.slice(0, 120), at, lead: String(l.entreprise || l.nome || l.nom || l.id), leadId: String(l.id), replied: !!l.replied, verdict });
        }
      } finally { lock.release(); }
    }
    try { await client.logout(); } catch {  }
    const resumo: Record<string, number> = {};
    for (const r of rows) resumo[r.verdict] = (resumo[r.verdict] || 0) + 1;
    const problemas = rows.filter((r) => /^(SEM_RESPOSTA|respondido_mas|ORFA)/.test(String(r.verdict)));
    return { ok: true, days, folders, total: rows.length, resumo, problemas, rows, nota: "leituras de thread podem atrasar alguns minutos (cache do Blob): reparos recentes aparecem na corrida seguinte" };
  } catch (e: any) {
    try { if (client) await client.logout(); } catch {  }
    return { ok: false, error: String(e?.message || e).slice(0, 200) };
  }
}
async function markLeadsReplied(newEvents: any[]): Promise<{ count: number; matched: any[] }> {
  if (!newEvents.length) return { count: 0, matched: [] };
  try {
    const cloud = await readJson<any>("crm/leads.json", { leads: [] });
    const leads: any[] = Array.isArray(cloud) ? cloud : (Array.isArray(cloud?.leads) ? cloud.leads : []);
    const byEmail = new Map<string, any>();
    for (const l of leads) { const e = String(l?.email || "").trim().toLowerCase(); if (e && !byEmail.has(e)) byEmail.set(e, l); }
    const contacted = await readJson<Record<string, any>>(`email/contacted/${TENANT}.json`, {});
    const byId = new Map<string, any>(leads.filter((l) => l && l.id).map((l) => [String(l.id), l]));
    const domIdx = buildDomainIndex(leads);
    const patches: any[] = []; const matched: any[] = [];
    for (const ev of newEvents) {
      const em = String(ev.fromEmail || "").trim().toLowerCase(); if (!em) continue;
      let l = byEmail.get(em);
      if (!l) { const c = contacted[em]; if (c && c.leadId) l = byId.get(String(c.leadId)); }
                                                                                                      
                                                                                                       
      if (!l) {
        const subj = String(ev.subject || "").toLowerCase();
        if (subj.length > 8 && /^\s*(re|aw|sv|rif|r:)\b/i.test(subj)) {
          l = leads.find((x) => { const n = String(x?.entreprise || x?.nome || x?.nom || "").trim().toLowerCase(); return n.length >= 5 && subj.includes(n); });
        }
      }
                                                                                                      
                                                                                            
      if (!l) { const d = domainOf(em); if (d && !FREEMAIL.has(d)) l = pickByDomain(domIdx.get(d)); }
      if (!l) continue;
                                                                                                               
                                                                                                          
      const _limpo = stripQuotedTail(ev._body || ev.snippet || "");
      let cls = OPTOUT_SECO_RE.test(_limpo) ? "negativa" : await classifyReplySmart(ev.subject || "", _limpo || ev.snippet || "");
      if (cls === "neutra" && REUNIAO_RE.test(zonaDaResposta(ev._body || ev.snippet || "")) && !NEG_DURA_RE.test(zonaDaResposta(ev._body || ev.snippet || ""))) cls = "positiva";                                                                                                                                                                              
                                                                                                                    
      ev.leadId = String(l.id); ev.abordagem = String(l.abordagem || "cliente"); ev.replyClass = cls;
                                                                                                             
                                                                                                        
                                                                                       
      if (cls === "auto") {
                                                                                                            
                                                                                            
        await appendThread(String(l.id), { dir: "in", at: ev.date || ev.seenAt || new Date().toISOString(), from: em, subject: ev.subject || "", body: (ev._body || ev.snippet || "").slice(0, 2000), msgId: ev.msgId, auto: true });
        const volta = parseOooReturn(`${ev.subject || ""} ${ev._body || ev.snippet || ""}`);
        if (volta) patches.push({ id: l.id, oooUntil: volta });
        matched.push({ leadId: l.id, nome: l.nom || l.nome || l.entreprise || "", email: em, subject: ev.subject || "", snippet: ev.snippet || "", lifecycle: l.lifecycle, idioma: l.idioma, pais: l.pais, abordagem: String(l.abordagem || "cliente"), replyClass: cls }); continue; }
                                                                                                               
                                                                                                             
                                                                                                                 
                                                                                                                
                                                                                                                 
                                                                                                          
                                                         
      if (cls === "negativa") {
        const zonaNeg = zonaDaResposta(String(ev._body || ev.snippet || ""));
        const hostil = NEG_HOSTIL_RE.test(zonaNeg) || OPTOUT_SECO_RE.test(zonaNeg);
        if (hostil) {
          await suppressEmail(em); await suppressDomain(em);
          patches.push({ id: l.id, outcome: "declinou", negativeKind: "hostil", optOutAt: new Date().toISOString(), marketingOptIn: false });
        } else {
                                                                                              
                                                                                              
                                                                                                 
                                                                                               
          patches.push({ id: l.id, outcome: "declinou", negativeKind: "suave", nurtureKind: "pos_negativa", nurtureStartedAt: new Date().toISOString(), nurtureStep: 3 });
        }
      }
      else if (OPT_OUT_RE.test(`${ev.subject || ""} ${ev._body || ev.snippet || ""}`)) await suppressEmail(em);
      await appendThread(String(l.id), { dir: "in", at: ev.date || ev.seenAt || new Date().toISOString(), from: em, subject: ev.subject || "", body: ev._body || ev.snippet || "", msgId: ev.msgId, threadId: ev.threadId || "" });
                                                                                                                     
                                                                                                                      
      matched.push({ leadId: l.id, nome: l.nom || l.nome || l.entreprise || "", email: em, subject: ev.subject || "", snippet: ev.snippet || "", lifecycle: l.lifecycle, idioma: l.idioma, pais: l.pais, abordagem: String(l.abordagem || "cliente"), replyClass: cls, humanHandoff: !!(l as any).humanHandoff, at: ev.date || ev.seenAt || "", msgId: ev.msgId || "", _body: ev._body || "" });
                                                                                                        
                                                                                                                
      const leadPatch: any = { id: l.id }; let need = false;
      if (!l.replied) { leadPatch.replied = true; leadPatch.repliedAt = new Date().toISOString(); l.replied = true; need = true; }
                                                                                                             
                                                                                                                 
                                                                                                                    
      const FASE_ADIANTE = new Set(["em_conversa", "qualificado", "negociacao", "followup_neg", "aprovacao", "ganho"]);
      const faseRich = String(l.agentMemory?.fase || "");
      if (cls !== "negativa" && !FASE_ADIANTE.has(faseRich)) { leadPatch.agentMemory = { ...(l.agentMemory || {}), fase: "em_conversa" }; l.agentMemory = leadPatch.agentMemory; need = true; }
      if ((cls === "negativa" || cls === "positiva" || !l.replyClass) && l.replyClass !== cls) { leadPatch.replyClass = cls; need = true; }
      if (cls === "negativa" && l.outcome !== "declinou") { leadPatch.outcome = "declinou"; need = true; }
                                                                                                              
                                                                                                          
      if (l.proposalSentAt && !l.proposalApprovedAt && cls !== "negativa" && APPROVAL_RE.test(`${ev.subject || ""} ${ev._body || ev.snippet || ""}`.slice(0, 4000))) {
        leadPatch.proposalApprovedAt = new Date().toISOString();
        leadPatch.proposalApprovedVia = "email";
        l.proposalApprovedAt = leadPatch.proposalApprovedAt;                                      
        need = true;
      }
                                                                                                                
                                                                                                             
                                                                           
      if (cls !== "negativa" && (String(l.fase || "") === "delivered" || String(l.fase || "") === "production") && TESTIMONIAL_AUTH_RE.test(`${ev.subject || ""} ${ev._body || ev.snippet || ""}`.slice(0, 4000))) {
        await captureTestimonial(l, ev);
      }
      if (need) patches.push(leadPatch);
    }
    if (patches.length) {
      const tok = selfAdmin();
      if (tok) { await fetch(`${selfBase()}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: patches }) }).catch(() => undefined); }
    }
    return { count: patches.length, matched };
  } catch { return { count: 0, matched: [] }; }
}

                                                                                                       
                                                                                                     
                                                                                                          
                                                             
async function loadProspected(): Promise<{ emails: Set<string>; domains: Set<string> }> {
  const emails = new Set<string>(); const domains = new Set<string>();
                                                                                 
  const addFull = (em: any) => { const e = String(em || "").trim().toLowerCase(); if (e && e.indexOf("@") > 0) { emails.add(e); const d = e.split("@")[1]; if (d && !FREEMAIL.has(d)) domains.add(d); } };
  const addEmailOnly = (em: any) => { const e = String(em || "").trim().toLowerCase(); if (e && e.indexOf("@") > 0) emails.add(e); };
  try { const contacted = await readJson<Record<string, any>>(`email/contacted/${TENANT}.json`, {}); for (const k of Object.keys(contacted || {})) addFull(k); } catch {  }
  try { const cloud = await readJson<any>("crm/leads.json", { leads: [] }); const leads: any[] = Array.isArray(cloud) ? cloud : (Array.isArray(cloud?.leads) ? cloud.leads : []); for (const l of leads) { if (l && l.email) addEmailOnly(l.email); } } catch {  }
  return { emails, domains };
}

                                                                   
                                                                                                         
                                                                                                               
                                                                                                                       
                                                                                                             
                                                                                                         
function extractFailedRecipients(src: string): string[] {
  const out = new Set<string>();
  const pats = [/Final-Recipient:\s*rfc822;\s*([^\s]+)/gi, /Original-Recipient:\s*rfc822;\s*([^\s]+)/gi, /X-Failed-Recipients:\s*([^\s,]+)/gi];
  for (const re of pats) { let m: RegExpExecArray | null; while ((m = re.exec(src))) { const e = m[1].replace(/[<>;,]/g, "").trim().toLowerCase(); if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) out.add(e); } }
  return Array.from(out).filter((e) => !e.includes("abil-medias"));
}
async function suppressBounced(emails: string[]): Promise<number> {
  try {
    const sup: any = (await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] })) || { emails: [], domains: [] };
    const set = new Set((sup.emails || []).map((x: string) => String(x).toLowerCase()));
    let added = 0; for (const e of emails) if (!set.has(e)) { set.add(e); added++; }
    sup.emails = Array.from(set);
    if (added) await writeJson(SUPPRESS_KEY, sup);
    const cloud = await readJson<any>("crm/leads.json", { leads: [] });
    const leads: any[] = Array.isArray(cloud) ? cloud : (cloud?.leads || []);
    const byEmail = new Map<string, any>(leads.map((l) => [String(l?.email || "").toLowerCase(), l]));
    const patches = emails.map((e) => byEmail.get(e)).filter((l) => l && !l.emailBounced).map((l) => ({ id: l.id, emailBounced: true, bouncedAt: new Date().toISOString() }));
    if (patches.length) {
                                                                                                                                   
      const tok = selfAdmin();
      if (tok) { await fetch(`${selfBase()}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: patches }) }).catch(() => undefined); }
    }
    return added;
  } catch { return 0; }
}
                                                                                   
                                                                                                            
                                                                                                        
                                                                                                              
                                                                                                       
function charsetOf(headers: string): string {
  const m = String(headers || "").match(/charset\s*=\s*"?([\w-]+)"?/i);
  return m ? m[1].toLowerCase() : "utf-8";
}
function decodeCharset(buf: Buffer, charset: string): string {
  const cs = (charset || "utf-8").toLowerCase();
  try { if (/^utf-?8$/.test(cs) || !cs) return buf.toString("utf8"); return new TextDecoder(cs).decode(buf); }
  catch { try { return buf.toString("latin1"); } catch { return buf.toString("utf8"); } }
}
function qpToBytes(s: string): Buffer {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) { bytes.push(parseInt(s.slice(i + 1, i + 3), 16)); i += 2; }
    else bytes.push(s.charCodeAt(i) & 0xff);
  }
  return Buffer.from(bytes);
}
function extractPlainFromRaw(src: string): string {
  let body = src.split(/\r?\n\r?\n/).slice(1).join("\n\n");
  const tp = body.match(/Content-Type:\s*text\/plain([\s\S]*?)\r?\n\r?\n([\s\S]*?)(?:\r?\n--)/i);
  let partHeaders = "";
  if (tp) { partHeaders = tp[1] || ""; body = tp[2]; }
  const headScope = partHeaders || src.slice(0, 3000);
  const charset = charsetOf(headScope);
  const transferEnc = (headScope.match(/Content-Transfer-Encoding:\s*([\w-]+)/i) || [])[1] || "";
  let buf: Buffer;
  try {
    if (/base64/i.test(transferEnc) || /base64/i.test(partHeaders)) buf = Buffer.from(body.replace(/\s+/g, ""), "base64");
    else if (/quoted-printable/i.test(transferEnc) || /quoted-printable/i.test(partHeaders)) buf = qpToBytes(body.replace(/=\r?\n/g, ""));
    else buf = Buffer.from(body, "latin1");
  } catch { buf = Buffer.from(body, "latin1"); }
  body = decodeCharset(buf, charset);
  body = body.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").trim();
  return body.slice(0, 8000);
}
async function bounceScan(): Promise<{ bounced: number; suppressed: number; respostas?: number; negativas?: number; autosIgnorados?: number; deepCorridos?: number; deepAdiados?: number; error?: string }> {
  if (!ZOHO_IMAP_USER || !ZOHO_IMAP_PASS) return { bounced: 0, suppressed: 0, error: "zoho_imap_not_configured" };
  let client: any = null;
  try {
    const prospected = await loadProspected();
    const gate = (prospected.emails.size + prospected.domains.size) > 0;
    const isProspected = (em: string) => { const e = String(em || "").trim().toLowerCase(); if (!e) return false; if (prospected.emails.has(e)) return true; const d = e.split("@")[1] || ""; return d ? prospected.domains.has(d) : false; };
    const seen: string[] = await readJson<string[]>(SEEN_KEY, []); const seenSet = new Set(seen);
    const mod: any = await import("imapflow");
    client = new mod.ImapFlow({ host: ZOHO_IMAP_HOST, port: 993, secure: true, auth: { user: ZOHO_IMAP_USER, pass: ZOHO_IMAP_PASS }, logger: false });
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const failed = new Set<string>(); const uids: number[] = []; const novosEvs: any[] = [];
    try {
                                                                                                            
                                                                                                             
                                                                                              
      for await (const msg of client.fetch({ since: new Date(Date.now() - 36 * 3600 * 1000) }, { envelope: true, source: true, uid: true, internalDate: true }) as any) {
        const from = String(msg.envelope?.from?.[0]?.address || "").toLowerCase();
        const subjRaw = String(msg.envelope?.subject || ""); const subj = subjRaw.toLowerCase();
                                                                                                              
        const src = msg.source ? msg.source.toString("latin1") : "";
        const isBounce = from.includes("mailer-daemon") || from.includes("postmaster") || /undeliver|delivery status|failure notice|returned mail|mail delivery (failed|subsystem)|delivery has failed/i.test(subj);
        if (isBounce) { for (const e of extractFailedRecipients(src)) failed.add(e); uids.push(msg.uid); continue; }
                                                                                                             
                                                                                                          
                                                                                                      
                                                                                                     
                                                                                                   
        const isReply = /^\s*(re|aw|sv|rif|r)\s*:/i.test(subjRaw) || /in-reply-to:|^references:/im.test(src) || /^\s*(fwd?|tr|wg|enc)\s*:/i.test(subjRaw) || /message transf[ée]r[ée]|forwarded message|weitergeleitete nachricht/i.test(src.slice(0, 6000)) || isProspected(from);
        const mine = from.endsWith("abil.ch") || from.endsWith("abil.ch");
        const msgKey = `eu-${msg.envelope?.messageId || msg.uid}`;
        if (isReply && !mine && !seenSet.has(msgKey)) {
          seenSet.add(msgKey);
          novosEvs.push({ msgId: msgKey, threadId: "", fromEmail: from, fromName: String(msg.envelope?.from?.[0]?.name || ""), subject: subjRaw, snippet: extractPlainFromRaw(src).slice(0, 600), date: (msg.internalDate ? new Date(msg.internalDate).toISOString() : new Date().toISOString()), seenAt: new Date().toISOString(), _body: extractPlainFromRaw(src) });
          uids.push(msg.uid);
        }
      }
      if (uids.length) await client.messageFlagsAdd(uids, ["\\Seen"], { uid: true }).catch(() => undefined);
    } finally { lock.release(); }
    await client.logout();
    const suppressed = failed.size ? await suppressBounced(Array.from(failed)) : 0;
    let respostas = 0, negativas = 0, autosIgnorados = 0, deepCorridos = 0, deepAdiados = 0;
    if (novosEvs.length) {
                                                                                                             
                                                                                                                
                                                                                                              
                                                                                                   
      const mk = await markLeadsReplied(novosEvs);
      const events: any[] = await readJson<any[]>(EVENTS_KEY, []);
      for (const ev of novosEvs) events.unshift(ev);
      await writeJson(EVENTS_KEY, events.slice(0, MAX_EVENTS).map((e: any) => { const { _body, ...rest } = e || {}; return rest; }));
      await writeJson(SEEN_KEY, Array.from(seenSet).slice(-MAX_SEEN));
      const humanas = mk.matched.filter((x: any) => x.replyClass !== "auto");                                       
      await notifyReply(humanas);
      const ah = await autoHandleReplies(mk.matched);
      respostas = humanas.length; negativas = ah.negativas; autosIgnorados = ah.autosIgnorados; deepCorridos = ah.deepCorridos; deepAdiados = ah.deepAdiados;
    }
    return { bounced: failed.size, suppressed, respostas, negativas, autosIgnorados, deepCorridos, deepAdiados };
  } catch (e: any) { try { await client?.logout(); } catch {  } return { bounced: 0, suppressed: 0, error: String(e?.message || e).slice(0, 120), code: e?.code || null, authFail: !!e?.authenticationFailed, resp: String(e?.responseText || e?.response || "").slice(0, 160), user: ZOHO_IMAP_USER || null, host: ZOHO_IMAP_HOST } as any; }
}

async function doScan(): Promise<{ new: number; total: number; error?: string; via?: string; leadsMarcados?: number; removidos?: number; notificados?: number; negativas?: number; autosIgnorados?: number; deepCorridos?: number; deepAdiados?: number }> {
  const tk = await gmailToken(); if (!tk.token) return { new: 0, total: 0, error: tk.err || "gmail nao ligado" };
  const gh = { Authorization: `Bearer ${tk.token}` };
  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=${encodeURIComponent("in:inbox newer_than:14d")}`, { headers: gh });
  if (!listRes.ok) return { new: 0, total: 0, error: `gmail list ${listRes.status}` };
  const ids: { id: string }[] = (await listRes.json())?.messages || [];
  const seen: string[] = await readJson<string[]>(SEEN_KEY, []);
  const seenSet = new Set(seen);
  const events: any[] = await readJson<any[]>(EVENTS_KEY, []);
  const prospected = await loadProspected();
  const gate = (prospected.emails.size + prospected.domains.size) > 0;                                                                                                                
  const isProspected = (em: string) => { const e = String(em || "").trim().toLowerCase(); if (!e) return false; if (prospected.emails.has(e)) return true; const d = e.split("@")[1] || ""; return d ? prospected.domains.has(d) : false; };
  let added = 0; const novosEvs: any[] = [];
  for (const m of ids) {
    if (seenSet.has(m.id)) continue;
    try {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`, { headers: gh });
      if (!r.ok) continue;
      const msg: any = await r.json();
      const hs = msg.payload?.headers || [];
      const fromEmail = parseFromEmail(header(hs, "From"));
      seenSet.add(m.id);                                                           
      if (!fromEmail || isOwnEmail(fromEmail)) continue;                             
      const subject = header(hs, "Subject"); const inReplyTo = header(hs, "In-Reply-To");
      if (!(/^\s*re\s*:/i.test(subject) || !!inReplyTo)) continue;                
      if (gate && !isProspected(fromEmail)) continue;                                                                           
      const evNew: any = { msgId: m.id, threadId: msg.threadId || "", fromEmail, fromName: parseFromName(header(hs, "From")), subject, snippet: (msg.snippet || "").slice(0, 600), date: header(hs, "Date"), seenAt: new Date().toISOString(), _body: extractBody(msg.payload) };
      events.unshift(evNew); novosEvs.push(evNew);
      added++;
    } catch {       }
  }
                                                                                                             
                                                                                                                     
  const mk = await markLeadsReplied(novosEvs);
  const cleaned = gate ? events.filter((e) => isProspected(String(e.fromEmail || ""))) : events;
  const removidos = events.length - cleaned.length;
  if (added || removidos) await writeJson(EVENTS_KEY, dedupByMsgId(cleaned).slice(0, MAX_EVENTS).map((e: any) => { const { _body, ...rest } = e || {}; return rest; }));
  await writeJson(SEEN_KEY, Array.from(seenSet).slice(-MAX_SEEN));
  const humanas = mk.matched.filter((x: any) => x.replyClass !== "auto");                                                            
  await notifyReply(humanas);
  const ah = await autoHandleReplies(mk.matched);                                                                                     
  return { new: added, total: Math.min(cleaned.length, MAX_EVENTS), removidos, via: tk.via, leadsMarcados: mk.count, notificados: humanas.length, negativas: ah.negativas, autosIgnorados: ah.autosIgnorados, deepCorridos: ah.deepCorridos, deepAdiados: ah.deepAdiados };
}

                                                                                                                
                                                                                                                    
                                                                                                                
                                                                                                                 
                                                                                                                     
                                                                                                                   
                                                                                                                   
async function generateAuditCopyAndPublish(leadId: string, auditOverride?: any, opts?: { deepOverride?: any }): Promise<{ ok: boolean; url?: string; nivel?: string; held?: boolean; reason?: string; error?: string }> {
  const lead = await loadLead(leadId); if (!lead) return { ok: false, error: "lead_nao_encontrado" };
  const A: any = (auditOverride && typeof auditOverride === "object") ? auditOverride : lead.audit;
  if (!A || typeof A !== "object") return { ok: false, error: "sem_audit" };
  const base = selfBase();
  const tok = selfAdmin(); if (!tok) return { ok: false, error: "sem_admin" };
  const persistHeld = async (motivo: string, extra?: any) => {
    try { await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, audit: { ...A, autoPublishHeld: motivo, ...(extra || {}) } }] }) }).catch(() => undefined); } catch {  }
  };
                                                                                                                       
                                                                               
                                                                                                                  
                                                                                                                       
                                                                                                                   
                                                           
                                                                                                               
                                                                                                            
                                                                                                             
                                                                                                                
                                                                                                             
                                                                                          
  const respondeuPositivo = !!lead.replied && String(lead.replyClass || "") === "positiva" && String(lead.abordagem || "") !== "agencia";
  if (!respondeuPositivo) { await persistHeld("frio_sem_resposta_positiva"); return { ok: true, held: true, reason: "frio_sem_resposta_positiva" }; }
                                                                                                                      
  try {
    const sup: any = (await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] })) || {};
    const siteHost = (() => { try { const w = String(lead.website || "").trim(); if (!w) return ""; return new URL(/^https?:/i.test(w) ? w : `https://${w}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } })();
    const email = String(lead.email || "").trim().toLowerCase();
    const doms = (Array.isArray(sup.domains) ? sup.domains : []).map((x: any) => String(x).toLowerCase().replace(/^@/, ""));
    const emails = (Array.isArray(sup.emails) ? sup.emails : []).map((x: any) => String(x).toLowerCase());
    if ((siteHost && doms.includes(siteHost)) || (email && emails.includes(email))) { await persistHeld("suprimido"); return { ok: true, held: true, reason: "suprimido" }; }
  } catch {       }
                                                                                                                     
  const bScore = computeBriefingScore(A.briefing);
  if (!bScore.publishable) { const falt = (bScore.ancoras_faltando || []).join(",") || "ancoras"; await persistHeld(`briefing_fraco:${falt}`); return { ok: true, held: true, reason: `briefing_fraco:${falt}` }; }
                                                                                                                
  try {
    const sres = await fetch(`${base}/api/lead-audit-queue?action=status&tenantId=abil-autodiag`, { headers: { "x-abil-admin": tok }, cache: "no-store" });
    const sj: any = await sres.json().catch(() => null);
    if (sj && sj.budget && sj.budget.budgetReached) { await persistHeld("budget"); return { ok: true, held: true, reason: "budget" }; }
  } catch {  }
                                                                                                                     
                                                                                                       
  const leadLang = (["fr", "pt", "en"].includes(String(lead.idioma || "").slice(0, 2)) ? String(lead.idioma).slice(0, 2) : "fr");
  const isEuroPt = leadLang === "pt" && !/bras/i.test(String(lead.pais || ""));
  const siteNaoLegivel = siteIlegivelDeAudit({ website: lead.website, audit: A });
  const spaIlegivel = !A.semSite && !String(A.siteTitle || "").trim() && !String(A.metaDescText || "").trim() && (!A.colorCount || A.colorCount < 2);
  const { seg, segmentoPorConfirmar } = pickSegmentForLead({ ...lead, setor: lead.setor || A.brand?.sector, googleCategoria: (lead as any).googleCategoria || A.googleCategoria });
  const socialsTxt = (Array.isArray(A.socials) && A.socials.length) ? A.socials.join(", ") : "nenhuma rede social ligada no site";
  const C = lead.entreprise || (lead as any).empresa || lead.nom || "";
                                                                                                          
  const persona = await readPersonaCtx();
  const philo = await readPhilosophyCtx();
  const bio = await readBioCtx();
  const voiceCtx = `PERSONA E VOZ (do cofre):\n${persona}${philo ? "\n" + philo.slice(0, 3500) : ""}${bio ? "\n" + bio.slice(0, 1500) : ""}`;
  const langName = ({ fr: "francês", pt: "português", en: "inglês" } as Record<string, string>)[leadLang] || "francês";
  const langHard = `ESCREVES EXCLUSIVAMENTE EM ${langName.toUpperCase()}. Ignora a língua deste enunciado: o texto final é só em ${langName}.`;
  const ptVarNote = isEuroPt ? " Escreve em português de PORTUGAL (pt-PT), não do Brasil." : "";
  const segCtx = ` [SEGMENTO: ${seg.label}] A marca e do nicho "${seg.label}". Dores tipicas do nicho (usa SO as que baterem com os dados reais do lead, nao inventes): ${seg.dores.join(" | ")}. Oportunidades que a ABiL resolve neste nicho: ${seg.oportunidades.join(" | ")}. Tom/angulo: "${seg.angulo}". Fala a linguagem deste segmento, mas SEMPRE ancorado nos dados reais.`;
                                                                                                                                                                               
                                                                                                                    
                                                                                                                       
                                                                                                                   
  const DS: any = (opts?.deepOverride && typeof opts.deepOverride === "object") ? opts.deepOverride : lead.deepStudy;
  const deepOk = !!(DS && typeof DS === "object" && DS.ok === true && Array.isArray(DS.factos) && DS.factos.length);
  const lpNivel: "profundo" | "raso" = deepOk ? "profundo" : "raso";
  const deepCampos = ["quemSao", "oQueVendem", "paraQuem", "tomDeVoz", "oQueDizemDeSi", "provaSocial", "sinaisDeDor", "oportunidade", "anguloDeAbordagem"];
                                                                                                                      
                                                                                                                       
                                                                     
  const fDeep = deepOk
    ? `[RAIO-X PROFUNDO, factos investigados com FONTE REAL lida (podes usa-los, ate citar o que a marca diz de si; NUNCA acrescentes nada que nao esteja aqui)] ${(DS.factos || []).slice(0, 12).map((f: any) => `${String(f?.facto || "")}${f?.citacao ? ` (a marca escreve: "${String(f.citacao)}")` : ""} [fonte: ${String(f?.fonte || "")}]`).filter((s: string) => s.length > 12).join(" ")} [LEITURA DA MARCA] ${deepCampos.map((k) => { const v = String((DS.dossier || {})[k] || "").trim(); return (v && !deepIsNotObserved(v)) ? `${k}: ${v}.` : ""; }).filter(Boolean).join(" ")}`.trim()
    : "";
  const shared = `Empresa: ${C}${A.brand?.sector ? " (setor: " + A.brand.sector + ")" : ""}. Escreve na lingua de codigo "${leadLang}".${ptVarNote} Usa SO os factos abaixo, cita os numeros concretos, NUNCA inventes nada alem.${segCtx}${spaIlegivel ? " [AVISO HONESTO] mal conseguimos ler o conteudo do site (parece SPA/JavaScript): assume isso e NAO inventes leitura de marca sobre o que nao deu para ler." : ""}${fDeep ? `\n\n${fDeep}` : ""}`;
  const fQuem = `[QUEM SAO] "${A.brand?.what || ""}". Titulo real do site: "${A.siteTitle || ""}". Meta-descricao real: "${A.metaDescText || ""}".`;
  const fMarca = `[MARCA, fala SO disto, e SO a partir do que se le no SITE] ${A.brand?.hasBranding ? "Pelo site, le-se ja uma intencao de marca" : "Pelo site, ainda nao se le uma marca construida (espaco para criar)"}. Personalidade que o site projeta: "${A.brand?.personality || "n/d"}" (palavras simples, sem "arquetipo"). ${A.brand?.distinct ? "Pelo site, ja se distingue" : "Pelo site, ainda nao se diferencia claramente (oportunidade)"}. Coerencia da mensagem: "${A.brand?.coherence || ""}". Impressao visual DO SITE: "${A.visual?.impression || "n/d"}". Oportunidades: ${(A.brand?.opportunities || []).join("; ") || "n/d"}. Tudo isto e leitura do SITE: NAO afirmes nada sobre a fachada/loja/logotipo, e enquadra como oportunidade.`;
  const _semSite = !!A.semSite; const _gr = A.googleRating; const _grTxt = _gr != null ? `${_gr}★ no Google${A.googleReviews ? " (" + A.googleReviews + " avaliacoes reais)" : ""}` : "presenca no Google";
  const fDigital = _semSite
    ? `[ENCONTRABILIDADE] A marca NAO tem site proprio, logo sem meta-description, sem Open Graph, sem schema, sem blog. Unica presenca: o Google (${_grTxt}). Redes ligadas: ${socialsTxt}.`
    : `[ENCONTRABILIDADE] meta-description ${A.hasMetaDesc ? "sim" : "NAO"}; Open Graph ${A.hasOg ? "sim" : "NAO"}; schema.org ${A.hasSchema ? "sim" : "NAO"}; sitemap ${A.hasSitemap ? "sim" : "nao"}; encontravel por IA ${A.aiBlocked ? "NAO, bloqueia crawlers" : "sim"}; blog proprio ${A.hasBlog ? "sim" : "NAO"}. Redes ligadas: ${socialsTxt}.`;
  const fWeb = _semSite
    ? `[A AUSENCIA DE SITE] A marca NAO tem site proprio. Tem ${_grTxt}, mas toda a reputacao vive numa plataforma alugada (Google): invisivel para SEO, IA e para quem quer partilhar um link. O maior gap e nao ter casa digital propria.`
    : `[SITE/TECNICO] performance ${A.perf != null ? A.perf + "/100" : "n/d"}${A.lcp ? ", carrega em " + A.lcp : ""}; SEO ${A.seo != null ? A.seo + "/100" : "n/d"}; acessibilidade ${A.a11y != null ? A.a11y + "/100" : "n/d"}; HTTPS ${A.https ? "sim" : "NAO"}.`;
  const fCriativa = `[CRIATIVIDADE, tom de OPORTUNIDADE] leitura criativa do SITE: "${A.brand?.creative || "n/d"}"; impressao visual DO SITE: "${A.visual?.impression || "n/d"}". NAO julgues a criatividade atual como "generica"; fala da ousadia que DARIA para construir, ancorada no nicho.`;
  const fTudo = `${fMarca} ${fDigital} ${fWeb}`;
  const Bf: any = A.briefing || {};
  const bfL = (lbl: string, v: any) => v ? `${lbl}: ${String(v)}. ` : "";
  const fBriefing = `[BRIEFING REAL INVESTIGADO DO SITE, usa SO isto] ${bfL("Produto/servico central", Bf.produto_central)}${bfL("Dor real que resolve", Bf.dor_resolvida)}${bfL("Diferencial", Bf.diferencial_real)}${bfL("Promessa comunicada", Bf.promessa_comunicada || Bf.marca_promessa)}${bfL("Prova social", Bf.prova_social)}${bfL("Sub-nicho", Bf.subnicho)}${bfL("Maior gap criativo", Bf.gap_principal)}${bfL("Porta de entrada", Bf.porta_entrada)}${(Array.isArray(Bf.lacunas) && Bf.lacunas.length) ? "LACUNAS (NAO inventes estas): " + Bf.lacunas.join(", ") + "." : ""}`.trim();
                                                                                                                
  const role = `És a ABiL, um atelier criativo em Genève (Suíça), a falar em PRIMEIRA PESSOA DO PLURAL ("nos", o atelier) com a ${C}, que ainda não vos conhece. Tom humano e com autoridade de quem faz o trabalho. CONCISÃO É REGRA: cada frase tem peso, zero enchimento. Sem travessão, sem títulos nem listas: devolve só o texto pedido, em prosa apertada, na voz do atelier (nunca na voz de uma pessoa singular, nunca cites um nome próprio).
O QUE REALMENTE VIMOS, é SÓ isto: o SITE (o texto e uma imagem do site) e os dados PÚBLICOS do Google (avaliação, nº de avaliações, categoria, comentários). NÃO vimos a loja física, a fachada, a montra, o logotipo, os materiais nem o atendimento. É PROIBIDO afirmar seja o que for sobre a fachada/loja/montra/logotipo, ou dizer que estão "genéricos", "sem personalidade", "iguais aos outros", ou que a marca é "invisível".
Em vez de apontar o que está MAL sobre o que não medimos, dizemos a OPORTUNIDADE e O QUE FARÍAMOS, em tom de PROPOSTA ("a oportunidade é...", "o que faríamos..."). Só podemos afirmar como FACTO o que medimos (site lento, sem schema; 4.9★ com N avaliações reais). Se um dado não existe, assumimos ("não chegamos a ver isso"). Travessão É PROIBIDO, usa vírgula ou ponto.`;
  const deep = `Em poucas frases densas e em tom de PROPOSTA (nunca de diagnóstico-acusação): (1) a OPORTUNIDADE concreta; (2) ancorada num facto/número REAL medido, nunca inventado; (3) o que a ABiL FARIA. NÃO inventes percentagens/métricas nem afirmes falhas em coisas que não medimos (fachada, loja, montra, logotipo).`;
                                                                                                      
                                                                                                 
  const FORMATO_HARD = `⛔ REGRAS DE FORMATO INVIOLÁVEIS: isto NÃO é um email nem uma mensagem. PROIBIDO: saudações ("Olá", "Bonjour", "Hi", "Salut", "Hallo", "Ciao", "Hola"), despedidas, assinaturas, títulos, cardinal (#), asteriscos, listas. Devolve SÓ o texto corrido pedido, a começar DIRETAMENTE no assunto.`;
  const limpaFormato = (t: string): string => {
    let x = String(t || "").trim();
    x = x.replace(/^#+[^\n]*\n+/gm, "");
    x = x.replace(/^(olá|ola|bonjour|salut|hi|hello|hallo|ciao|hola)[^\n.!]{0,60}[.!,]?\s*/i, "");
    return x.trim();
  };
  const genAudit = async (instr: string, facts: string, maxChars?: number): Promise<string> => {
    try {
      const sys = `${langHard}\n${FORMATO_HARD}\n\n[CONTEXTO DE VOZ, usa APENAS para o TOM (não imites o formato destes textos, muitos são emails):]\n${voiceCtx}`;
      const usr = `${instr}\n\n${shared} ${facts}\n\nLEMBRETE FINAL (obrigatório): responde na língua "${leadLang}" (${langName}), sem saudação, sem título, texto corrido${maxChars ? `, no máximo ${Math.round(maxChars / 6)} palavras` : ""}.`;
      let out = await callLLM(sys, usr);
      if (!out) return "";
      out = limpaFormato(noDash(String(out)));
      const det = detectLangFromText(out);
      if (det && det !== leadLang) {
        const tr = await callLLM(`Traduz o texto para ${langName} mantendo o tom e o sentido. Devolve SÓ a tradução, sem saudação, sem títulos, sem comentários.`, out);
        if (tr) out = limpaFormato(noDash(String(tr)));
      }
      if (maxChars && out.length > maxChars) {
        const corte = out.slice(0, maxChars);
        const fim = Math.max(corte.lastIndexOf("."), corte.lastIndexOf("!"), corte.lastIndexOf("?"));
        out = fim > 40 ? corte.slice(0, fim + 1) : corte;
      }
      return out.trim();
    } catch { return ""; }
  };
  const [intro, verdict, priority, who, brandingT, digitalT, webT, creativeT, help, cta, quemG, analiseG] = await Promise.all([
    genAudit(`${role} Escreve as BOAS-VINDAS, 2 frases curtas e calorosas: somos a ABiL, olhamos para a ${C} sem compromisso porque vimos potencial, e encontramos forcas e uma oportunidade clara. SEM numeros nem dados tecnicos.`, fQuem),
    genAudit(`${role} Escreve o VEREDICTO: UMA so frase curta e marcante (no maximo 14 palavras), como titulo de revista, sobre o potencial da marca. SEM numeros.`, fMarca),
    genAudit(`${role} ${deep} Escreve A MAIOR OPORTUNIDADE para a ${C}: 2 frases, com o porque AGORA e o impacto no negocio.`, fTudo),
    genAudit(`${role} Escreve QUEM E a ${C}, em tom "olhamos para a ${C} e percebemos que...": 3 frases sobre o que faz, como e para quem, usando os dados de "Quem sao".`, fQuem),
    siteNaoLegivel ? Promise.resolve("") : genAudit(`${role} ${deep} Seccao A MARCA E A PERSONALIDADE: 4 a 5 frases. Em 1 frase explica o que e uma brandpersona e tom de voz e porque importa para vender (sem a palavra "arquetipo"). Depois, em tom de OPORTUNIDADE: o que uma brandpersona forte e humanizada faria pela ${C}, ancorado no que o NEGOCIO faz (briefing real) e no que os clientes valorizam. NAO afirmes que a marca atual e generica ou sem personalidade.`, fMarca),
    genAudit(`${role} ${deep} Seccao PRESENCA EM MARKETING DIGITAL: 3 a 4 frases COM PROVA. Cita as redes ligadas (ou a falta), se ha blog, e se esta preparada para ser encontrada (meta, Open Graph, schema, IA); e o que cada lacuna custa em alcance.`, fDigital),
    genAudit(`${role} ${deep} Seccao O SITE: 3 a 4 frases COM PROVA. Cita os numeros reais (performance, tempo de carregamento, SEO, HTTPS) e o que significam para quem visita e para o negocio.`, fWeb),
    siteNaoLegivel ? Promise.resolve("") : genAudit(`${role} ${deep} Seccao OPORTUNIDADE CRIATIVA: 3 a 4 frases sobre onde estaria a ousadia criativa para a ${C}: porque as marcas que ousam sao lembradas, e 1 a 2 ideias concretas ligadas ao nicho. Em tom de proposta. NAO julgues a criatividade ATUAL como "obvia".`, fCriativa),
    genAudit(`${role} Escreve COMO A ABiL AJUDA: 2 a 3 frases, ligando as lacunas encontradas (identidade, brandpersona, direcao de arte, presenca digital, do conceito ao pixel).`, fTudo),
    genAudit(`${role} Escreve 1 frase de CONVITE a uma conversa de 30 minutos, sem compromisso.`, ""),
    genAudit(`${role} Escreve o bloco "QUEM SOMOS NOS PARA A ${C}" (na 1a pessoa do plural, o atelier): cumprimenta a ${C} pelo nome, situa em 1 frase o que ela faz e para quem (briefing REAL), e diz que vemos um potencial grande. 3 a 4 frases, caloroso e direto, sem numeros. Se citares um detalhe, SO do briefing real; NUNCA inventes nada sobre a fachada/loja/logotipo.`, fQuem + " " + fBriefing),
    genAudit(`${role} ${deep} Escreve o bloco "ANALISE" (teaser curto): 2 a 3 frases dizendo que olhamos para a ${C} (o site e a presenca no Google) e que vemos uma OPORTUNIDADE clara, apontando-a a partir de um facto REAL do briefing, e a conviccao de que da para tornar a marca memoravel. Especifico, zero generico. NAO digas que "desenterramos problemas" nem afirmes falhas em coisas que nao medimos.`, fBriefing + " " + fMarca),
  ]);
                                                                                                                  
  try { const n = siteNaoLegivel ? 10 : 12; await fetch(`${base}/api/lead-audit-queue?action=bump-ai&tenantId=abil-autodiag`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ n }) }).catch(() => undefined); } catch {  }
                                                                                                               
                                                                                                                 
                                                   
  const secCriticas: Array<[string, string]> = [
    ["bienvenue", intro], ["opportunite", priority], ["qui est", who], ["qui sommes-nous", quemG], ["analyse", analiseG],
    ["digital", digitalT], ["site", webT], ["comment on aide", help],
    ...(siteNaoLegivel ? [] : ([["marque", brandingT], ["creative", creativeT]] as Array<[string, string]>)),
  ];
  const secOk = secCriticas.filter(([, t]) => String(t || "").trim().length >= 80).length;
  if (secOk / secCriticas.length < 0.7) { await persistHeld("geracao_incompleta", { genIncomplete: true }); return { ok: true, held: true, reason: "geracao_incompleta" }; }
  const LEAD_AUDIT_Q: Record<string, { brand: (c: string) => string; digital: (c: string) => string; web: (c: string) => string; creative: (c: string) => string }> = {
    fr: { brand: (c) => `${c} a-t-elle une vraie marque, ou juste un logo ?`, digital: (c) => `Trouve-t-on ${c} la ou ses clients cherchent ?`, web: (c) => `Le site de ${c} est-il a la hauteur de la marque ?`, creative: (c) => `${c} ose-t-elle, ou joue-t-elle la securite ?` },
    pt: { brand: (c) => `A ${c} tem uma marca forte, ou ainda e so um logo?`, digital: (c) => `A ${c} e encontrada onde os clientes a procuram?`, web: (c) => `O site da ${c} esta a altura da marca?`, creative: (c) => `A ${c} ousa, ou joga pelo seguro?` },
    en: { brand: (c) => `Does ${c} have a real brand, or just a logo?`, digital: (c) => `Is ${c} found where its customers are looking?`, web: (c) => `Is ${c}'s website worthy of the brand?`, creative: (c) => `Does ${c} dare, or play it safe?` },
  };
  const ql = LEAD_AUDIT_Q[leadLang] || LEAD_AUDIT_Q.fr;
  const copy: any = {
    intro, verdict: verdict || String(A.headline || ""), priority, who,
    quem: quemG || "", analise: analiseG || "",
    sections: { branding: { q: ql.brand(C), t: brandingT }, digital: { q: ql.digital(C), t: digitalT }, web: { q: ql.web(C), t: webT }, creative: { q: ql.creative(C), t: creativeT } },
    segment: { key: seg.key, label: seg.label, projetos: seg.projetos },
    help, cta,
  };
                                                                                                              
                                                                                                           
                                                                                                                      
                                                                                                                  
                                                                                                                  
                                                                                                             
                                                                                                                  
                                                                                                                    
                                                                                      
  const deepFactsLc = deepOk
    ? `${(DS.factos || []).map((f: any) => `${String(f?.facto || "")} ${String(f?.citacao || "")}`).join(" ")} ${deepCampos.map((k) => String((DS.dossier || {})[k] || "")).join(" ")}`
    : "";
  const factsLc = `${fTudo} ${fBriefing} ${deepFactsLc} ${JSON.stringify(A || {})} ${C}`.toLowerCase();
  const _scrub = (t: string) => noDash(scrubClaims(String(t || ""), factsLc).clean);
  copy.intro = _scrub(copy.intro); copy.verdict = _scrub(copy.verdict) || String(A.headline || ""); copy.priority = _scrub(copy.priority); copy.who = _scrub(copy.who); copy.quem = _scrub(copy.quem); copy.analise = _scrub(copy.analise); copy.help = _scrub(copy.help);
  copy.sections.branding.t = _scrub(copy.sections.branding.t); copy.sections.digital.t = _scrub(copy.sections.digital.t); copy.sections.web.t = _scrub(copy.sections.web.t); copy.sections.creative.t = _scrub(copy.sections.creative.t);
                                                                                                             
                                                                                      
  try {
                                                                                                                     
                                                                                                                    
                                                                                                                   
    const factsReal = `${fQuem} ${fBriefing} ${fTudo} ${fCriativa}${fDeep ? " " + fDeep : ""} Avaliacao Google: ${A.googleRating != null ? A.googleRating + "★ (" + (A.googleReviews || 0) + " avaliacoes)" : "n/d"}.`;
    const cvBlocks: Record<string, string> = { intro: copy.intro, verdict: copy.verdict, priority: copy.priority, who: copy.who, quem: copy.quem, analise: copy.analise, branding: copy.sections.branding.t, digital: copy.sections.digital.t, web: copy.sections.web.t, creative: copy.sections.creative.t, help: copy.help };
    const cvr = await fetch(`${base}/api/claim-verify`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ blocks: cvBlocks, facts: factsReal, lang: leadLang }) });
    const cv: any = await cvr.json().catch(() => null);
    if (cv && cv.ok && cv.blocks) {
      const g = (k: string, fb: string) => (typeof cv.blocks[k] === "string" && String(cv.blocks[k]).trim()) ? noDash(String(cv.blocks[k])) : fb;
      copy.intro = g("intro", copy.intro); copy.verdict = g("verdict", copy.verdict) || String(A.headline || ""); copy.priority = g("priority", copy.priority); copy.who = g("who", copy.who); copy.quem = g("quem", copy.quem); copy.analise = g("analise", copy.analise); copy.help = g("help", copy.help);
      copy.sections.branding.t = g("branding", copy.sections.branding.t); copy.sections.digital.t = g("digital", copy.sections.digital.t); copy.sections.web.t = g("web", copy.sections.web.t); copy.sections.creative.t = g("creative", copy.sections.creative.t);
    }
  } catch {  }
                                                                                         
                                                                                                                   
                                                                                                                    
                                                                                                          
                                                     
  const slugAtual = slugDaLp(String(lead.audit?.publishedUrl || A.publishedUrl || ""));
                                                                                                                     
  const lpGeradaEm = new Date().toISOString();
  try {
    const r = await fetch(`${base}/api/audit`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ company: C, website: lead.website || "", audit: A, copy, lang: leadLang, siteNaoLegivel, segmentoPorConfirmar, email: lead.email || "", lpNivel, lpGeradaEm, deepStudy: (lead.deepStudy && lead.deepStudy.ok) ? lead.deepStudy : undefined, study: (lead.study && typeof lead.study === "object") ? lead.study : undefined, ...(slugAtual ? { slug: slugAtual } : {}) }) });
    const d: any = await r.json().catch(() => ({}));
    if (!d || !d.ok || !d.url) { await persistHeld("publish_falhou"); return { ok: false, error: "publish_falhou" }; }
                                                                                                                 
                                                                                                                
    try { await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, audit: { ...A, publishedUrl: String(d.url), lpNivel, lpGeradaEm, genIncomplete: false, autoPublishHeld: "" } }] }) }).catch(() => undefined); } catch {  }
    return { ok: true, url: String(d.url), nivel: lpNivel };
  } catch (e: any) { await persistHeld("publish_erro"); return { ok: false, error: String(e?.message || e).slice(0, 120) }; }
}
                                                                                                                    
                                                         
function slugDaLp(url: string): string { const m = String(url || "").match(/\/audit\/([A-Za-z0-9-]+)/); return m ? m[1] : ""; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

                                                                                                                 
                                                                                                                     
  if (qv(req, "action") === "bounce-scan") {
    if (!cronAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
    const r = await bounceScan();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: !r.error, ...r });
  }

                                                                                                             
                                                                                                                   
                                                                                                                   
                                                                                                                      
  if (qv(req, "action") === "repair-encoding") {
    if (!cronAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
    const fixB64 = (raw: string): string => {
      const s = raw.replace(/\s+/g, "");
      if (s.length < 60 || s.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return raw;
      try {
        const dec = Buffer.from(s, "base64").toString("utf8");
        if (/�/.test(dec)) return raw;
        const ctrl = (dec.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
        if (ctrl > dec.length * 0.02) return raw;
        return dec
          .replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, String.fromCharCode(34)).replace(/&#39;/g, String.fromCharCode(39))
          .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() || raw;
      } catch { return raw; }
    };
    const fixMoji = (v: any): string => {
      const t = fixB64(String(v || ""));
      if (!/[ÃÂ][ -ÿ]/.test(t)) return t;
      try { const r = Buffer.from(t, "latin1").toString("utf8"); return /�/.test(r) ? t : r; } catch { return t; }
    };
    if (req.method === "POST" && qv(req, "leadId")) {
      let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
      const th = Array.isArray(body.thread) ? body.thread : null;
      if (!th || !th.length || !th.every((m: any) => m && typeof m === "object" && (m.dir === "in" || m.dir === "out"))) return res.status(400).json({ ok: false, error: "thread inválido" });
      const fixed = th.slice(-120).map((m: any) => ({ ...m, body: fixMoji(m.body), subject: fixMoji(m.subject) }));
      await writeJson(`${THREADS_PREFIX}${qv(req, "leadId")}.json`, fixed);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, reescrito: true, mensagens: fixed.length });
    }
    let evFixed = 0, thFixed = 0;
    const evs = (await readJson<any[]>(EVENTS_KEY, [])) || [];
    for (const e of evs) {
      const a = fixMoji(e.snippet), b = fixMoji(e.subject), c = fixMoji(e.fromName);
      if (a !== e.snippet || b !== e.subject || c !== e.fromName) { e.snippet = a; e.subject = b; e.fromName = c; evFixed++; }
    }
    if (evFixed) await writeJson(EVENTS_KEY, evs);
    const lid = qv(req, "leadId");
    const ids: string[] = [];
    if (lid) ids.push(lid);
    else {
      const cloud = await readJson<any>("crm/leads.json", { leads: [] });
      const leads: any[] = Array.isArray(cloud) ? cloud : (cloud?.leads || []);
      for (const l of leads) if (l?.replied && l?.id) ids.push(String(l.id));
    }
    const dbg: any[] = [];
    for (const id of ids) {
      const key = `${THREADS_PREFIX}${id}.json`;
      const th = (await readJson<any[]>(key, [])) || [];
      let ch = false;
      for (const m of th) { const nb = fixMoji(m.body), ns = fixMoji(m.subject); if (nb !== m.body || ns !== m.subject) { m.body = nb; m.subject = ns; ch = true; } }
      if (lid) {
        let vias = "(sem base publica → list)";
        let directLen = -1;
        if (BLOB_PUBLIC_BASE) {
          vias = (() => { try { return new URL(BLOB_PUBLIC_BASE).host; } catch { return BLOB_PUBLIC_BASE; } })();
          try { const rr = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); directLen = rr.ok ? ((await rr.json()) as any[]).length : rr.status * -1; } catch { directLen = -999; }
        }
        let origem: any = null;
        try { const { blobs } = await list({ prefix: key, limit: 3 }); origem = blobs.map((b: any) => ({ pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt, url: String(b.url || "").slice(0, 90) })); } catch (e: any) { origem = String(e?.message || e).slice(0, 80); }
        let viaListLen = -1;
        try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x: any) => x.pathname === key); if (bl) { const r2 = await fetch(`${bl.url}?nocache=${Date.now()}`, { cache: "no-store", headers: { "cache-control": "no-cache" } }); if (r2.ok) viaListLen = ((await r2.json()) as any[]).length; } } catch {  }
        dbg.push({ key, base: vias, fetchDiretoLen: directLen, viaListLen, origem, threadLen: th.length, msgs: th.map((m: any) => ({ dir: m.dir, bodyLen: String(m.body || "").length, temMoji: /[ÃÂ][ -ÿ]/.test(String(m.body || "")), amostra: String(m.body || "").slice(0, 60) })) });
      }
      if (ch) { await writeJson(key, th); thFixed++; }
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, eventosCorrigidos: evFixed, threadsCorrigidos: thFixed, leadsVerificados: ids.length, ...(lid ? { dbg } : {}) });
  }

                                                                  
  if (qv(req, "action") === "scan" || hdr(req, "authorization").startsWith("Bearer ")) {
    if (!cronAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
    const r = await doScan();
                                                                                                 
                                                                                                         
                                                                                                              
                                                                                                                       
    const bs = await backlogSweep({ deepJaCorridos: Number(r.deepCorridos || 0) });
                                                                                                                     
                                                                                                           
    return res.status(200).json({ ok: !r.error, ...r, backlogVistos: bs.vistos, backlogSugeridos: bs.sugeridos, backlogEnviados: bs.enviados, deepCorridos: Number(r.deepCorridos || 0) + bs.deepCorridos, deepAdiados: Number(r.deepAdiados || 0) + bs.deepAdiados });
  }

  if (!adminAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });

                                                                          
                                                                                                 
  if (req.method === "GET" && qv(req, "action") === "mail-audit") {
    const days = Math.min(90, Math.max(1, Number(qv(req, "days")) || 30));
    const r = await mailAudit(days);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(r);
  }
                                                                                                                
                                                                                                     
  if (req.method === "POST" && qv(req, "action") === "thread-append") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body?.leadId || ""); const texto = String(body?.body || "");
    if (!leadId || !texto.trim()) return res.status(400).json({ ok: false, error: "leadId/body em falta" });
    await appendThread(leadId, { dir: body?.dir === "out" ? "out" : "in", at: String(body?.at || new Date().toISOString()), from: String(body?.from || ""), subject: String(body?.subject || ""), body: texto.slice(0, 8000), msgId: String(body?.msgId || `repair-${leadId}-${Date.parse(String(body?.at || "")) || 0}`) });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true });
  }
  if (req.method === "POST" && qv(req, "action") === "mark-read") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const ids = (Array.isArray(body.msgIds) ? body.msgIds : []).map((x: any) => String(x)).filter(Boolean);
    if (!ids.length) return res.status(400).json({ ok: false, error: "msgIds em falta" });
    const cur = await readJson<any[]>(EVENTS_KEY, []);
    const next = cur.filter((e) => e && !ids.includes(String(e.msgId || "")));
    await writeJson(EVENTS_KEY, next);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, removidos: cur.length - next.length, total: next.length });
  }

                                                                                                                        
                                                                                                         
                              
                                                                                               
                                                                                                       
                                                      
                                                                                                         
                                                                                                           
                                                                                         
  if (req.method === "POST" && qv(req, "action") === "suppress-lead") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body.leadId || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    if (!leadId && !email) return res.status(400).json({ ok: false, error: "leadId ou email em falta" });
                                                                                               
    let emailFinal = email;
    if (leadId) {
      try {
        const base = selfBase();
        const lr = await fetch(`${base}/api/crm-leads?cb=${Date.now()}`, { headers: { "x-abil-admin": String(req.headers["x-abil-admin"] || "") } });
        const ld: any = await lr.json().catch(() => ({}));
        const lead = (Array.isArray(ld?.leads) ? ld.leads : []).find((x: any) => String(x.id) === leadId);
        if (lead) {
          emailFinal = emailFinal || String(lead.email || "").trim().toLowerCase();
          await fetch(`${base}/api/crm-leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-abil-admin": String(req.headers["x-abil-admin"] || "") },
            body: JSON.stringify({ leads: [{ id: leadId, replyClass: "negativa", outcome: "declinou", journeyPhase: "negativa", emailPrep: null }] }),
          });
        }
      } catch {  }
    }
                                                                                 
    if (emailFinal) await suppressEmail(emailFinal);
                                                 
    const cur2 = await readJson<any[]>(EVENTS_KEY, []);
    const next2 = cur2.filter((e) => {
      if (!e) return false;
      if (leadId && String(e.leadId || "") === leadId) return false;
      if (emailFinal && String(e.fromEmail || "").trim().toLowerCase() === emailFinal) return false;
      return true;
    });
    if (next2.length !== cur2.length) await writeJson(EVENTS_KEY, next2);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, suprimido: emailFinal || null, eventosRemovidos: cur2.length - next2.length });
  }

                                                                                                               
                                                                                                                 
  if (qv(req, "action") === "smart-config") {
    if (req.method === "POST") {
      let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
      const cur = await readSmartCfg();
                                                                                                                   
                                                                                                                     
                                                                                                               
                                                                                                                     
      const next: any = { enabled: "enabled" in body ? !!body.enabled : cur.enabled, autonomous: "autonomous" in body ? !!body.autonomous : cur.autonomous, prompt: (typeof body.prompt === "string" && body.prompt.trim()) ? body.prompt.slice(0, 4000) : cur.prompt, smartPromptCliente: (typeof body.smartPromptCliente === "string") ? body.smartPromptCliente.slice(0, 4000) : cur.smartPromptCliente, autoDiagEnabled: "autoDiagEnabled" in body ? !!body.autoDiagEnabled : cur.autoDiagEnabled, autoDiagDailyCap: "autoDiagDailyCap" in body ? Math.max(1, Math.min(1000, Number(body.autoDiagDailyCap) || 40)) : cur.autoDiagDailyCap, declineText: (typeof body.declineText === "string") ? body.declineText.slice(0, 4000) : cur.declineText, declinePrompt: (typeof body.declinePrompt === "string") ? body.declinePrompt.slice(0, 4000) : cur.declinePrompt, declinePromptCliente: (typeof body.declinePromptCliente === "string") ? body.declinePromptCliente.slice(0, 4000) : cur.declinePromptCliente, deepAuto: "deepAuto" in body ? !!body.deepAuto : cur.deepAuto, deepDailyCap: "deepDailyCap" in body ? Math.max(1, Math.min(100, Number(body.deepDailyCap) || 10)) : cur.deepDailyCap, autoPublishEnabled: "autoPublishEnabled" in body ? !!body.autoPublishEnabled : cur.autoPublishEnabled };
      if ("diagLayers" in body && body.diagLayers && typeof body.diagLayers === "object") next.diagLayers = body.diagLayers; else if (cur.diagLayers) next.diagLayers = cur.diagLayers;
      await writeJson(SMARTCFG_KEY, next);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, config: next, hardOff: SEND_HARD_OFF });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, config: await readSmartCfg(), hardOff: SEND_HARD_OFF });
  }

                                                                                                            
  if (req.method === "POST" && qv(req, "action") === "smart-reply") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
    const r = await generateSmartReply(leadId, typeof body?.prompt === "string" ? body.prompt : undefined);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(r);
  }

                                                                                                                         
                                                                                                                   
                                                                                                                    
  if (req.method === "POST" && qv(req, "action") === "followup-copy") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
    const prompt = String(body?.prompt || "").trim(); if (!prompt) return res.status(400).json({ ok: false, error: "prompt em falta" });
    const r = await generateFollowupBody({ leadId, step: Math.max(0, Math.min(2, Number(body?.step) || 0)), prompt: prompt.slice(0, 4000), langName: typeof body?.langName === "string" ? body.langName : undefined, coldText: typeof body?.coldText === "string" ? body.coldText : "", daysElapsed: Number(body?.daysElapsed) || 0, marca: typeof body?.marca === "string" ? body.marca : "" });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(r);
  }

                                                                                                             
                                                                                                               
                                                                                       
  if (req.method === "POST" && qv(req, "action") === "followup-neg-copy") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
    const r = await generateNegFollowupBody(leadId);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(r);
  }

                                                                                                                      
                                                                                                                       
                                                                                                                      
                                                                                                                    
                                                                                                                             
  if (req.method === "POST" && qv(req, "action") === "gen-audit-copy") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
                                                                                                                    
                                                                                                                     
    const r = await generateAuditCopyAndPublish(leadId, (body && typeof body.audit === "object") ? body.audit : undefined, { deepOverride: (body && typeof body.deepStudy === "object") ? body.deepStudy : undefined });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(r);
  }

                                                                                                          
                                                                                                    
                                                                                                        
  if (req.method === "POST" && qv(req, "action") === "deep-research") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
                                                                                                                  
                                                                                                                    
                                                                                                        
    const viaFila = !!body?.viaFila;
    const r = await deepResearch(leadId, { force: !!body?.force, origem: viaFila ? "lp-fila" : "botao", semTetoDiario: viaFila });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(r);                                                                            
  }
                                                                                                      
  if (req.method === "POST" && qv(req, "action") === "deep-research-delete") {
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
    const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
    await deepPersist(leadId, null);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, apagado: true });
  }

  const events = await readJson<any[]>(EVENTS_KEY, []);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true, events, count: events.length });
}
