                                                                                            
                                                                                                                               
                                                                                                                                                                                                                                          
                                                                                                
                                                                                               
                                                                                             
                                                        
                                                                                                             
                                                                                            
                                                                                                
                                                                    
                                                                                  
                                                                                     
                                                                                                                                                                                                                                          
import type { VercelRequest, VercelResponse } from "@vercel/node";
                                                                                                        
                                                                                                         
                                                                               
import { templateFieldCap, fitFieldText, fieldLineSpecHint, TEMPLATE_META } from "../src/lib/socialTemplates/tokens.js";
                                                                           
                                                                             
import { emailCapsPrompt, fitEmailField } from "../src/lib/emailTemplates/caps.js";
import crypto from "crypto";
import { put } from "@vercel/blob";

export const config = { runtime: "nodejs", maxDuration: 60 };

const ADMIN_PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
const CRON_SECRET = process.env.CRON_SECRET || "";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
                                                                                                    
                                                                                                          
                                                                               
                                                                             
                                                                
const SITE_BASE = "https://abil-site.vercel.app";
const SELF_BASE = (process.env.PUBLIC_BASE_URL || process.env.ABIL_PUBLIC_BASE || SITE_BASE).replace(/\/$/, "");
const OUTBOUND_TENANT_ID = "abil";                                            

const PERIOD_MS: Record<string, number> = { day: 86_400_000, week: 604_800_000, month: 2_592_000_000 };
const MAX_ITEMS_PER_RUN = 5;
const LASTRUN_KEY = "abil_autoplan_lastrun_v1";
                                                                                                    
                                                                                                 
                        
const ROTIDX_KEY = "abil_autoplan_rotidx_v1";
const SNAPSHOT_KEY = "abil_agent_persona_snapshot_v1";
const SOCIAL_PLATFORMS = ["instagram", "linkedin", "facebook"];

function adminToken(): string {
  const exp = Date.now() + 120_000;
  const sig = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}
function cronAuthed(req: VercelRequest): boolean {
  if (!CRON_SECRET) return false;
  const a = req.headers["authorization"]; const av = Array.isArray(a) ? a[0] : a;
  return !!av && av === `Bearer ${CRON_SECRET}`;
}
function adminAuthed(req: VercelRequest): boolean {
  if (!ADMIN_PW) return false;
  const h = req.headers["x-abil-admin"]; const tok = Array.isArray(h) ? h[0] : (h as string | undefined);
  if (!tok) return false;
  const [expS, sig] = tok.split("."); const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}
function sectionsToMap(d: any): Record<string, any> | null {
  if (d && d.sections) return Object.fromEntries(Object.entries(d.sections).map(([k, s]: [string, any]) => [k, s?.value]));
  return null;
}
async function readStore(): Promise<Record<string, any>> {
  try { const r = await fetch(`${SELF_BASE}/api/store`, { cache: "no-store" }); if (r.ok) { const m = sectionsToMap(await r.json()); if (m) return m; } } catch {  }
  try { if (BLOB_PUBLIC_BASE) { const r = await fetch(`${BLOB_PUBLIC_BASE}/store/public.json?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) { const m = sectionsToMap(await r.json()); if (m) return m; } } } catch {  }
  return {};
}
async function writeStore(updates: { key: string; value: any }[]): Promise<boolean> {
  try { const r = await fetch(`${SELF_BASE}/api/store`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminToken() }, body: JSON.stringify({ updates }) }); return r.ok; } catch { return false; }
}
                                                                                                  
                                                                                                
                                                                                                
                                         
async function readPrivateSnapshot(): Promise<any | null> {
  try {
    const r = await fetch(`${SELF_BASE}/api/private-store?col=agent_persona_snapshot`, { headers: { "x-abil-admin": adminToken() }, cache: "no-store" });
    if (!r.ok) return null;
    const j: any = await r.json().catch(() => null);
    return (j && j.value && typeof j.value === "object") ? j.value : null;
  } catch { return null; }
}
                                                                                                       
                                                                                             
async function appendToStoreKey(key: string, newItems: any[], cap = 200): Promise<boolean> {
  let cur: any[] = [];
  try { const r = await fetch(`${SELF_BASE}/api/store`, { cache: "no-store" }); if (r.ok) { const m = sectionsToMap(await r.json()); const v = m && m[key]; if (Array.isArray(v)) cur = v; } } catch {  }
  return writeStore([{ key, value: [...newItems, ...cur].slice(0, cap) }]);
}
                                                                                                              
async function costAllowed(): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const r = await fetch(`${SELF_BASE}/api/agent-cost?action=check`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminToken() }, body: JSON.stringify({ estimated_cost: 0.1 }) });
    if (!r.ok) return { allowed: true };
    const j: any = await r.json().catch(() => null);
    return { allowed: j?.allowed !== false, reason: j?.reason };
  } catch { return { allowed: true }; }
}
                                                                                                 
async function logCost(model: string, endpoint: string, promptTokens: number, completionTokens: number): Promise<void> {
  try { await fetch(`${SELF_BASE}/api/agent-cost?action=log`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminToken() }, body: JSON.stringify({ provider: "openai", model, endpoint, prompt_tokens: promptTokens, completion_tokens: completionTokens, brand: "abil" }) }); } catch {  }
}
async function genText(userPrompt: string, maxLength: number, path: string, lang: string, persona: any, imageUrl?: string): Promise<string> {
  try {
    const r = await fetch(`${SELF_BASE}/api/regenerate-text`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminToken() }, body: JSON.stringify({ currentText: "", userPrompt, maxLength, path, lang, ...(imageUrl ? { imageUrl } : {}), ...(persona && typeof persona === "object" ? persona : {}) }) });
    if (!r.ok) return "";
    const d: any = await r.json().catch(() => null);
    return String(d?.text || "").trim();
  } catch { return ""; }
}
                                                                                                                               
async function genCoverUrl(promptText: string, persona: any, id: string): Promise<string> {
  try {
    const r = await fetch(`${SELF_BASE}/api/generate-image`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminToken() }, body: JSON.stringify({ prompt: promptText, size: "1536x1024", quality: "medium", context: "autoplan-cover", ...(persona && typeof persona === "object" ? persona : {}) }) });
    if (!r.ok) return "";
    const d: any = await r.json().catch(() => null);
    const dataUrl = String(d?.dataUrl || "");
    const b64 = dataUrl.startsWith("data:") ? dataUrl.split(",")[1] : "";
    if (!b64) return "";
    const buf = Buffer.from(b64, "base64");
    const { url } = await put(`autoplan/${id}.png`, buf, { access: "public", contentType: "image/png", addRandomSuffix: true });
    return url || "";
  } catch { return ""; }
}
async function enqueueSocialQueue(item: { id: string; platform: string; caption: string; imageUrl?: string; scheduledAt: string }): Promise<boolean> {
  try {
    const r = await fetch(`${SELF_BASE}/api/social-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminToken() }, body: JSON.stringify({ tenantId: OUTBOUND_TENANT_ID, items: [{ id: item.id, platform: item.platform, caption: item.caption, message: item.caption, imageUrl: item.imageUrl || undefined, scheduledAt: item.scheduledAt }] }) });
    return r.ok;
  } catch { return false; }
}
function due(lastrun: Record<string, string>, key: string, period: string): boolean {
  const v = lastrun?.[key]; if (!v) return true;
  const t = Date.parse(v); if (!t) return true;
  return (Date.now() - t) >= (PERIOD_MS[period] || PERIOD_MS.month);
}
                                                                                            
function wordCut(s: string, max: number): string {
  const t = (s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "").trim() || t.slice(0, max);
}
function themeFor(persona: any, idx: number): string {
  try {
    let kws: any = persona?.brandPersona?.keywords;
    if (typeof kws === "string") kws = kws.split(/[,;\n]/);
    if (Array.isArray(kws)) {
      const clean = kws.filter((k: any) => typeof k === "string" && k.trim().length > 1).map((k: string) => k.trim());
      if (clean.length) return clean[idx % clean.length];
    }
  } catch {  }
  const fb = ["branding e estratégia", "direção de arte", "marca e humanização", "criatividade com método"];
  return fb[idx % fb.length];
}

                                                                                                      
                                                                                                        
                                                                                                          
                                                                                                         
                                                       
const PAUTA_KEY = "abil_content_pauta_v1";
type PautaItem = { id: string; tag: string; gancho: string; angulo?: string; fonte?: { titulo?: string; url?: string }; persona?: string; personaDica?: string; usado?: boolean };
type Pauta = { date: string; madeAt: string; items: PautaItem[] };
const PAUTA_TAGS = ["frases-criativas", "dicas-marketing", "servicos", "curiosidades", "diferenciais", "bastidores", "blog"];
                                                                                          
                                                                                         
                                                                                                       
const CRON_DEFAULT_BRIEFS: Record<string, string> = {
  "frases-criativas": "Manifesto tipográfico do atelier. Propósito: plantar UMA ideia forte de branding numa frase de impacto; a frase é a arte inteira. Abordagem: pegamos numa verdade do ofício e subvertemos o ângulo óbvio (anulação do óbvio). Tom: statement editorial, sereno e confiante, quase provocação. Nunca: frase motivacional genérica de LinkedIn, clichés tipo menos é mais, jargão de agência.",
  "dicas-marketing": "Dica prática de marketing com a voz do atelier (nós). Propósito: ensinar UMA coisa acionável, inspirada em notícia ou tendência REAL do dia (nunca inventada; cita a fonte na legenda quando houver). Abordagem: gancho inesperado na primeira linha, exemplo concreto do ofício, contraste entre o senso comum e o que funciona de verdade. Tom: direto, inteligente, provocador na medida. Nunca: dica de manual (publica com consistência), teoria sem exemplo concreto.",
  "servicos": "Vitrine de um serviço da casa como um drop. Propósito: apresentar um serviço do atelier como lançamento imperdível, não como item de catálogo. Abordagem: nomeamos o serviço como produto e focamos no RESULTADO para o cliente, não no processo. Tom: lançamento premium, energia contida, precisão suíça. Nunca: lista de features, preço, promessa de prazo.",
  "repost-blog": "Chamada editorial para um artigo do blog. Propósito: levar ao artigo com UMA ideia-conceito forte e contexto mínimo. Abordagem: extraímos do artigo o conceito mais provocador e deixamos o resto para o clique. Tom: capa de revista. Nunca: resumir o artigo inteiro, título clickbait vazio.",
  "repost-projeto": "Vitrine de projeto real do portfólio. Propósito: mostrar trabalho FEITO, com o nome do cliente e o que foi entregue. Abordagem: a imagem fala, o texto é mínimo e factual (só dados do projeto real). Tom: confiante, sóbrio. Nunca: inventar cliente, métrica ou resultado.",
  "curiosidades": "Curiosidade que vende visão. Propósito: um facto real e surpreendente de marca ou criatividade que prova a forma de ver do atelier. Abordagem: começa pelo facto que quebra a expectativa e fecha ligando ao ofício. Tom: leve, inteligente. Nunca: facto inventado ou improvável de verificar, trivia sem ligação com branding.",
  "diferenciais": "Posicionamento puro do atelier. Propósito: dizer o que fazemos de diferente, como statement. Abordagem: contraste (menos X, mais Y); sem subcontratação, exigência de festival, método próprio. Tom: contido, afiado, zero arrogância barata. Nunca: comparar-nos nomeando terceiros, superlativos vazios.",
  "bastidores": "Bastidores reais do atelier. Propósito: humanizar mostrando processo de verdade (brief, rascunho, decisão, até o erro). Abordagem: honestidade de estúdio, foto real, primeira pessoa do plural. Tom: cru, próximo. Nunca: bastidor encenado, glamourizar ferramenta.",
};
const CRON_DEFAULT_CH: Record<string, string> = {
  estrategista: "És um estrategista de conteúdo sénior do atelier, obcecado por relevância e viralidade honesta. Só trabalhas com sinais REAIS (notícias e tendências do dia, com fonte); nunca inventas factos nem fontes. Para cada ideia: encontra o ângulo ÓBVIO do assunto e subverte-o (anulação do óbvio), liga ao ofício de branding e direção de arte do atelier, e escolhe UMA persona-alvo concreta. Ideias específicas e executáveis, nunca temas vagos.",
  roteirista: "Escreves roteiros de uma SÉRIE de vídeos curtos (30 segundos, 2 blocos de 15s) de dicas de marketing do atelier. A série tem identidade fixa e roteiros sempre inéditos. IDENTIDADE FIXA (nunca muda): humor absurdo levado a sério, um apresentador do atelier falando para a câmara com naturalidade, um cenário surreal que ILUSTRA a dica, estética de comercial premium. VARIEDADE OBRIGATÓRIA (muda sempre): cada vídeo tem cenário, figurino e conceito totalmente NOVOS; nunca repitas nem faças variação leve de um cenário já usado na série. Eixos para variar: multiplicação absurda de objetos ou animais, criaturas e mascotes improváveis ao lado do apresentador, escalas impossíveis, lugares deslocados do contexto (exemplos apenas ilustrativos, proibido copiá-los: centenas de relógios pelo cenário; um São Bernardo gigante ao lado dele; uma sala de reuniões no meio de um vinhedo). A dica de marketing manda: o absurdo existe para provar o ponto, nunca é aleatório. Fala em FRANCÊS, concreta, cerca de 35 palavras por bloco, gancho visual e verbal nos 2 primeiros segundos. Zero clichés de guru.",
};

async function collectSignals(): Promise<{ titulo: string; url: string }[]> {
  const out: { titulo: string; url: string }[] = [];
  const push = (t?: string, u?: string) => {
    const tt = String(t || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
    const uu = String(u || "").trim();
    if (tt && /^https?:\/\//.test(uu) && !out.some((o) => o.url === uu)) out.push({ titulo: tt, url: uu });
  };
                                                                                                  
                                        
  const FEEDS = [
    "https://www.adweek.com/feed/",
    "https://www.marketingdive.com/feeds/news/",
    "https://www.socialmediatoday.com/feeds/news/",
    "https://www.strategies.fr/rss.xml",
  ];
  await Promise.all(FEEDS.map(async (f) => {
    try {
      const r = await fetch(f, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AbilPauta/1.0)" }, signal: AbortSignal.timeout(6000) });
      if (!r.ok) return;
      const xml = (await r.text()).slice(0, 200000);
      for (const it of xml.split(/<item[\s>]/).slice(1, 7)) {
        const t = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(it)?.[1];
        const l = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/.exec(it)?.[1];
        push(t, l);
      }
    } catch {  }
  }));
  try {
                                                                                                     
                                                                
    for (const geo of ["FR", "US"]) {
      const r = await fetch(`https://trends.google.com/trending/rss?geo=${geo}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AbilPauta/1.0)" }, signal: AbortSignal.timeout(6000) });
      if (!r.ok) continue;
      const xml = (await r.text()).slice(0, 200000);
      for (const it of xml.split(/<item[\s>]/).slice(1, 7)) {
        const q = (/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(it)?.[1] || "").trim();
        if (q) push(`Tendência de pesquisa (${geo}): ${q}`, `https://trends.google.com/trends/explore?q=${encodeURIComponent(q)}`);
      }
    }
  } catch {                                                  }
  return out.slice(0, 26);
}

                                                                                                     
                                                                                                   
                                                                                                         
                                                                                                   
                                                                                                     
                                                                                                     
                                                                                               
const VIDEO_JOBS_KEY = "abil_video_jobs_v1";
const ARK_BASE = process.env.ARK_BASE || "https://ark.ap-southeast.bytepluses.com/api/v3";
const ARK_KEY = process.env.ARK_API_KEY || "";
const ARK_MODEL = process.env.ARK_VIDEO_MODEL || "dreamina-seedance-2-0-260128";
const ARK_ASSET = process.env.ARK_CHARACTER_ASSET || "";
                                                                                          
                                                                                            
const VIDEO_ESTETICA = "Direção de fotografia FIXA da série: cinematográfica premium, luz suave direcional com contraste elegante, paleta contida com UM acento de cor vibrante, composição central simétrica, lente 35mm, movimento de câmara subtil (dolly lento ou push-in), grão de filme fino, look de comercial caro. Edição dinâmica multi-shot dentro do bloco: 2 a 3 planos (aberto, médio, detalhe). Sem textos nem logótipos visíveis no cenário.";
                                                                                               
                                                                                      
const VIDEO_CHAR_KEY = "abil_video_char_v1";
const VIDEO_TRILHAS_KEY = "abil_video_trilhas_v1";
type VideoTask = { taskId: string; status?: string; videoUrl?: string };
type VideoJob = { id: string; createdAt: string; state: "clipes" | "costura" | "final" | "aprovado" | "rejeitado" | "erro"; ideia: string; roteiro?: Record<string, unknown>; tasks: VideoTask[]; videoUrl?: string; erro?: string; legenda?: string; trilhaUrl?: string };
async function arkCreateTask(promptText: string, opts?: { assetId?: string; refUrls?: string[] }): Promise<string> {
  const content: any[] = [{ type: "text", text: promptText }];
  const asset = String(opts?.assetId || ARK_ASSET || "").trim();
  if (asset) content.push({ type: "image_url", image_url: { url: asset } });
  for (const u of (opts?.refUrls || []).slice(0, 3)) { if (/^https?:\/\//.test(u)) content.push({ type: "image_url", image_url: { url: u } }); }
  const r = await fetch(`${ARK_BASE}/contents/generations/tasks`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${ARK_KEY}` }, body: JSON.stringify({ model: ARK_MODEL, content, resolution: "720p", ratio: "9:16", duration: 15, generate_audio: true }) });
  const d: any = await r.json().catch(() => null);
  if (!r.ok || !d?.id) throw new Error(String(d?.error?.message || d?.message || `ark http ${r.status}`).slice(0, 200));
  return String(d.id);
}
async function arkGetTask(taskId: string): Promise<{ status: string; videoUrl?: string }> {
  const r = await fetch(`${ARK_BASE}/contents/generations/tasks/${encodeURIComponent(taskId)}`, { headers: { Authorization: `Bearer ${ARK_KEY}` } });
  const d: any = await r.json().catch(() => null);
  const status = String(d?.status || (r.ok ? "unknown" : `http ${r.status}`));
  const videoUrl = String(d?.content?.video_url || d?.video_url || "") || undefined;
  return { status, videoUrl };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  try {
  const action = String((Array.isArray(req.query.action) ? req.query.action[0] : req.query.action) || "");
  const wantsRun = ["run", "pauta", "video-new", "video-jobs", "video-final", "video-decide"].includes(action) || (req.method === "GET" && cronAuthed(req));
  if (!wantsRun) { res.status(400).json({ error: "use ?action=run" }); return; }
  if (!cronAuthed(req) && !adminAuthed(req)) { res.status(401).json({ error: "unauthorized" }); return; }
  if (!ADMIN_PW) { res.status(503).json({ error: "admin not configured" }); return; }

  const store = await readStore();
                                                                                                
                                                                                            
                                                                                  
  const nonEmptyObj = (v: unknown): Record<string, unknown> | null =>
    (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v as Record<string, unknown>).length > 0) ? (v as Record<string, unknown>) : null;
  const persona: any = nonEmptyObj(await readPrivateSnapshot()) || nonEmptyObj(store[SNAPSHOT_KEY]);
  if (!persona) { res.status(200).json({ ok: true, made: 0, skipped: "no persona snapshot yet: abre o dashboard 1x com o cofre destrancado" }); return; }
                                                                                                                                                 
  const cost = await costAllowed();
  if (!cost.allowed) { res.status(200).json({ ok: true, made: 0, skipped: `cost ceiling/kill-switch: ${cost.reason || "blocked"}` }); return; }
  const lang = String(persona.__lang || "fr");
                                                                                                         
                                                                                                           
                                                                                          
  const cleanLang = (v: unknown, fb: string): string => { const s = String(v ?? "").replace(/[^a-z]/gi, "").slice(0, 2).toLowerCase(); return s || fb; };
  const socialLang = cleanLang(store["abil_social_send_lang"], lang);
  const emailLang = cleanLang(store["abil_email_send_lang_v1"], lang);
                                                                                                       
                                                                                                         
                                                                                                         
                                                                                                        
  const blogLang = cleanLang(store["abil_blog_pub_lang"], lang);
                                                                                                   
                                                                                             
  const blogPrompt = String(persona.__blogPrompt || "").slice(0, 2400);
                                                                                                         
                                                                                                    
                                                                                                                
  const chPrompts: Record<string, string> = (persona.__channelPrompts && typeof persona.__channelPrompts === "object") ? persona.__channelPrompts : {};
  const tplPrompts: Record<string, string> = (persona.__templatePrompts && typeof persona.__templatePrompts === "object") ? persona.__templatePrompts : {};
                                                                                                
                                                                                                
                                                                                            
                                                                                  
                                                                                           
                                                                                                   
                                                                                          
                                                                                                 
  const promptMaps: Record<string, Record<string, string>> = (persona.__promptMaps && typeof persona.__promptMaps === "object") ? persona.__promptMaps : {};
  const imageRefsSuffix = String(persona.__imageRefsSuffix || "");
  const pickLang = (map: Record<string, string> | undefined, l: string): string => { const m = (map && typeof map === "object") ? map : {}; return String(m[l] || m.fr || "").trim(); };
  const personaFor = (ch: string, l?: string): any => {
    const out: any = { ...persona };
    if (l) {
      const g = pickLang(promptMaps.global, l); if (g) out.globalTextPrompt = g;
      const im = pickLang(promptMaps.image, l); if (im) out.globalImagePrompt = (im + imageRefsSuffix).slice(0, 1180);
      const sg = pickLang(promptMaps.safeguards, l); if (sg) out.safeguards = sg;
    }
    const extra = String(chPrompts[ch] || CRON_DEFAULT_CH[ch] || "").trim();
    if (extra) {
      const ref = String(persona.referenceNotes || "");
      out.referenceNotes = (ref ? ref + "\n\n" : "") + `INSTRUCOES DO CANAL "${ch}" (aplica POR CIMA da voz global, sem a contradizer): ${extra}`;
    }
    return out;
  };
                                                                                                     
                                                                                                          
  const tplLinhaDe = (tag: string): string => { const v = String(tplPrompts[tag] || CRON_DEFAULT_BRIEFS[tag] || "").trim().slice(0, 1200); return v ? ` Linha editorial deste template: ${v}` : ""; };
                                                                                                       
  const tplBg = (tag: string): string => {
    try { const d = store["abil_template_defaults_v1"]; const v = d && d[tag] && d[tag].bg; if (typeof v === "string" && v) return v; } catch {  }
    const p = (TEMPLATE_META as Record<string, { bgPreferred?: string }>)[tag]?.bgPreferred;
    return (typeof p === "string" && p) || "noir";
  };
                                                                                                                                      
                                                                                                 
                                                                                                        
  let pautaDiag = "";                                                                             
  const buildPauta = async (): Promise<Pauta | null> => {
    const sinais = await collectSignals();
    pautaDiag = `sinais=${sinais.length}`;
    if (!sinais.length) return null;                                                         
    const briefsMini = PAUTA_TAGS.filter((t) => t !== "blog").map((t) => `${t}: ${String(tplPrompts[t] || CRON_DEFAULT_BRIEFS[t] || "").slice(0, 220)}`).join("\n");
    const personasTxt = String((persona as any)?.buyerPersona?.prompt || "").slice(0, 1200);
                                                                                                       
                                                                                                       
                                                                                                
    const ask = `Cria a PAUTA DO DIA (estratégia de conteúdo).\n\nSINAIS REAIS DE HOJE (numerados; única fonte permitida):\n${sinais.map((s, i) => `${i + 1}. ${s.titulo}`).join("\n")}\n\nTEMPLATES da casa e o brief de cada um:\n${briefsMini}\nblog: artigo editorial assinado pelo atelier (nós).\n\nPERSONAS (escolhe 1 alvo por ideia):\n${personasTxt || "(sem personas configuradas)"}\n\nTAREFA: 1 ideia por template desta lista: ${PAUTA_TAGS.join(", ")}. Cada ideia ancora num sinal da lista (refere-o pelo NÚMERO) e aplica a anulação do óbvio: encontra o ângulo esperado do assunto e subverte-o.\n\nFORMATO DA RESPOSTA (obrigatório; nenhuma palavra fora disto): exatamente UMA linha por template, cada linha assim:\ntemplate=<um de: ${PAUTA_TAGS.join(" | ")}> | sinal=<número> | gancho=<ideia concreta do post, máx 220 caracteres> | angulo=<1 frase> | persona=<nome da persona-alvo> | dica=<1 frase de como falar com ela>\n\nExemplo de UMA linha válida (formato, não conteúdo):\ntemplate=blog | sinal=3 | gancho=A notícia X prova o contrário do que todos dizem sobre Y | angulo=inverter a leitura óbvia | persona=Fundador de scale-up | dica=fala de risco e reputação, não de estética`;
                                                                                                   
                                                                                                      
                                                                                                
    const chEst = String(chPrompts["estrategista"] || CRON_DEFAULT_CH["estrategista"] || "").trim();
    const personaEstrategista = { referenceNotes: (chEst ? `INSTRUCOES DO CANAL "estrategista": ${chEst}\n\n` : "") + "SAIDA OBRIGATORIA: isto NAO e copy nem texto humano; es um motor de dados. A UNICA saida valida sao linhas no formato pedido (tag=... | sinal=... | gancho=... | angulo=... | persona=... | dica=...), uma por template, sem nenhuma palavra fora delas." };
                                                                                                 
                                                                                                  
                                                                                             
    const slug = (t: string) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
    const tagMap: Record<string, string> = { dicasdemarketing: "dicas-marketing", frasescriativas: "frases-criativas", artigodoblog: "blog", artigoblog: "blog" };
    for (const tg of PAUTA_TAGS) tagMap[slug(tg)] = tg;
    const normTag = (t: string): string | null => tagMap[slug(t)] || null;
    for (let att = 0; att < 2; att++) {
      const prefixo = att === 0 ? "" : `ATENCAO: a resposta anterior foi rejeitada porque o campo template nao trazia um valor da lista (${PAUTA_TAGS.join(", ")}). Responde APENAS com as linhas no formato pedido, com template= a receber um desses valores exatos. `;
      const raw = await genText(prefixo + ask, 2900, "pauta/estrategista", lang, personaEstrategista);
      pautaDiag += ` · t${att + 1}=${raw ? raw.length + "ch" : "VAZIA"}`;
      if (!raw) continue;
      const campo = (linha: string, nome: string): string => {
        const m = new RegExp(`(?:^|\\|)\\s*${nome}\\s*=\\s*([^|]*)`, "i").exec(linha);
        return m ? m[1].trim() : "";
      };
      const items: PautaItem[] = [];
      for (const linha of raw.split("\n").map((l) => l.trim()).filter((l) => /(template|tag)\s*=/i.test(l))) {
        const tag = normTag(campo(linha, "template")) || normTag(campo(linha, "tag"));
        const gancho = campo(linha, "gancho");
        if (!tag || !gancho) continue;
        const nSinal = parseInt(campo(linha, "sinal"), 10);
        const fonte = (Number.isFinite(nSinal) && sinais[nSinal - 1]) ? { titulo: sinais[nSinal - 1].titulo, url: sinais[nSinal - 1].url } : undefined;
        items.push({ id: `pt-${Date.now()}-${items.length}`, tag, gancho: gancho.slice(0, 240), angulo: campo(linha, "angulo").slice(0, 200), fonte, persona: campo(linha, "persona").slice(0, 80), personaDica: campo(linha, "dica").slice(0, 200) });
        if (items.length >= 12) break;
      }
      pautaDiag += ` itensValidos=${items.length} comFonte=${items.filter((it) => it.fonte).length}`;
      if (!items.length) pautaDiag += ` inicio="${raw.slice(0, 60).replace(/\s+/g, " ")}"`;
      if (items.length) return { date: new Date().toISOString().slice(0, 10), madeAt: new Date().toISOString(), items };
    }
    return null;
  };
                                                                                       
  if (action === "pauta") {
    const p = await buildPauta();
    if (p) { await writeStore([{ key: PAUTA_KEY, value: p }]); res.status(200).json({ ok: true, made: p.items.length, items: p.items }); }
    else res.status(200).json({ ok: false, error: `pauta falhou (${pautaDiag || "sem diagnóstico"})` });
    return;
  }
  const hoje = new Date().toISOString().slice(0, 10);
  let pauta: Pauta | null = (store[PAUTA_KEY] && typeof store[PAUTA_KEY] === "object" && Array.isArray((store[PAUTA_KEY] as any).items)) ? (store[PAUTA_KEY] as Pauta) : null;
  let pautaDirty = false;
  if (!pauta || pauta.date !== hoje) {
    const p = await buildPauta().catch(() => null);
    if (p) { pauta = p; pautaDirty = true; }
  }
  const takePauta = (tag: string): PautaItem | null => {
    if (!pauta) return null;
    const it = pauta.items.find((x) => !x.usado && x.tag === tag) || null;
    if (it) { it.usado = true; pautaDirty = true; }
    return it;
  };
  const temaDe = (item: PautaItem | null, fallbackIdx: number): string => item
    ? `${item.gancho}${item.angulo ? ` (ângulo: ${item.angulo})` : ""}${item.fonte?.titulo ? ` [baseado na notícia real: ${item.fonte.titulo}${item.fonte.url ? " " + item.fonte.url : ""}]` : ""}`
    : themeFor(persona, fallbackIdx);
                                                                                                             
  const personaAlvo = (base: any, item: PautaItem | null): any => {
    if (!item || !item.persona) return base;
    const ref = String(base?.referenceNotes || "");
    return { ...base, referenceNotes: (ref ? ref + "\n\n" : "") + `PERSONA-ALVO desta peça: ${item.persona}${item.personaDica ? ` (${item.personaDica})` : ""}. Escreve PARA esta pessoa.` };
  };
                                                                                             
                                                                                                     
                          
  const readVideoJobs = (): VideoJob[] => (Array.isArray(store[VIDEO_JOBS_KEY]) ? (store[VIDEO_JOBS_KEY] as VideoJob[]) : []);
  const writeVideoJobs = async (jobs: VideoJob[]) => writeStore([{ key: VIDEO_JOBS_KEY, value: jobs.slice(0, 20) }]);
  if (action === "video-new") {
    if (!ARK_KEY) { res.status(200).json({ ok: false, error: "falta ARK_API_KEY (conta BytePlus ModelArk)" }); return; }
    const jobs = readVideoJobs();
    const body: any = req.body || {};
    const ideiaPauta = takePauta("dicas-marketing");
    const ideia = String(body.ideia || "").trim() || (ideiaPauta ? temaDe(ideiaPauta, 0) : themeFor(persona, jobs.length));
                                                                                                       
                                                                         
    const usados = jobs.filter((x) => x.state !== "erro").slice(0, 12).map((x) => String((x.roteiro as any)?.cenario || x.ideia || "").replace(/\s+/g, " ").slice(0, 90)).filter(Boolean);
    const antiRepeticao = usados.length ? `\n\nCENÁRIOS JÁ USADOS NA SÉRIE (PROIBIDO repetir ou fazer variação leve de qualquer um): ${usados.map((u, i) => `${i + 1}) ${u}`).join(" · ")}` : "";
    const rAsk = `Escreve o roteiro do PRÓXIMO vídeo da série do atelier (30 segundos, 2 blocos de 15s) de dicas de marketing, sobre: "${ideia}". O cenário e o conceito têm de ser totalmente INÉDITOS na série.${antiRepeticao}\n\nResponde SÓ com JSON válido, sem texto fora do JSON: {"titulo":"...","cenario":"descrição visual concreta do cenário absurdo e memorável, inédito na série","figurino":"figurino inesperado do apresentador","blocos":[{"acao":"o que acontece em cena e o movimento de câmara","fala":"fala em francês, máximo 13 segundos ditos em voz alta (cerca de 30 palavras)"},{"acao":"...","fala":"..."}],"legenda":"legenda do post em francês com 4 a 6 hashtags"}`;
    const raw = await genText(rAsk, 1800, "video/roteiro", "fr", personaAlvo(personaFor("roteirista", "fr"), ideiaPauta));
    let rot: any = null;
    try { rot = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch {       }
    if (!rot || !Array.isArray(rot.blocos) || rot.blocos.length < 2) { res.status(200).json({ ok: false, error: "roteirista não devolveu JSON válido" }); return; }
                                                                                               
    const trilhas: string[] = Array.isArray(store[VIDEO_TRILHAS_KEY]) ? (store[VIDEO_TRILHAS_KEY] as string[]).filter((u) => /^https?:\/\//.test(String(u))) : [];
    const charCfg: { assetId?: string; refUrls?: string[] } = (store[VIDEO_CHAR_KEY] && typeof store[VIDEO_CHAR_KEY] === "object") ? store[VIDEO_CHAR_KEY] : {};
    const job: VideoJob = { id: `vid-${Date.now()}`, createdAt: new Date().toISOString(), state: "clipes", ideia, roteiro: rot, tasks: [], legenda: String(rot.legenda || "").slice(0, 600), ...(trilhas.length ? { trilhaUrl: trilhas[jobs.length % trilhas.length] } : {}) };
    try {
      for (let b = 0; b < 2; b++) {
        const bl = rot.blocos[b] || {};
                                                                                                       
        const vprompt = `${String(rot.cenario || "")}. Figurino do apresentador: ${String(rot.figurino || "")}. ${String(bl.acao || "")}. O apresentador fala em francês, com áudio nítido e lábios sincronizados: "${String(bl.fala || "")}". Humor absurdo levado a sério. ${VIDEO_ESTETICA} Parte ${b + 1} de 2 de um vídeo contínuo (mesmo cenário, mesmo apresentador, mesmo figurino).`.slice(0, 2400);
        const taskId = await arkCreateTask(vprompt, { assetId: charCfg.assetId, refUrls: charCfg.refUrls });
        job.tasks.push({ taskId, status: "queued" });
      }
    } catch (e) { job.state = "erro"; job.erro = String((e as Error).message || e).slice(0, 200); }
    await writeVideoJobs([job, ...jobs]);
    if (pautaDirty && pauta) await writeStore([{ key: PAUTA_KEY, value: pauta }]);
    res.status(200).json({ ok: job.state !== "erro", job, ...(job.erro ? { error: job.erro } : {}) });
    return;
  }
  if (action === "video-jobs") { res.status(200).json({ ok: true, jobs: readVideoJobs() }); return; }
  if (action === "video-final") {
    const b: any = req.body || {};
    const jobs = readVideoJobs();
    const j = jobs.find((x) => x.id === String(b.id || ""));
    if (!j) { res.status(404).json({ error: "job não encontrado" }); return; }
    j.state = "final"; j.videoUrl = String(b.videoUrl || "");
    await writeVideoJobs(jobs);
    res.status(200).json({ ok: true });
    return;
  }
  if (action === "video-decide") {
    const b: any = req.body || {};
    const jobs = readVideoJobs();
    const j = jobs.find((x) => x.id === String(b.id || ""));
    if (!j) { res.status(404).json({ error: "job não encontrado" }); return; }
    j.state = b.decision === "aprovado" ? "aprovado" : "rejeitado";
    await writeVideoJobs(jobs);
    res.status(200).json({ ok: true });
    return;
  }
                                                                                           
                                                                                          
  if (ARK_KEY) {
    try {
      const jobs = readVideoJobs();
      let dirty = false;
      for (const j of jobs) {
        if (j.state !== "clipes" || !j.tasks.length) continue;
        for (const t of j.tasks) {
          if (t.videoUrl) continue;
          const st = await arkGetTask(t.taskId);
          if (st.status !== t.status || st.videoUrl) dirty = true;
          t.status = st.status; if (st.videoUrl) t.videoUrl = st.videoUrl;
        }
        if (j.tasks.every((t) => t.videoUrl)) { j.state = "costura"; dirty = true; }
        else if (j.tasks.some((t) => /fail|cancel|error/i.test(String(t.status || "")))) { j.state = "erro"; j.erro = "geração falhou na BytePlus (ver status das tasks)"; dirty = true; }
      }
      if (dirty) await writeVideoJobs(jobs);
    } catch {  }
  }
                                                                                                                                                                                                                                         
  const lastrun: Record<string, string> = (store[LASTRUN_KEY] && typeof store[LASTRUN_KEY] === "object") ? { ...store[LASTRUN_KEY] } : {};
  const rotidx: Record<string, number> = (store[ROTIDX_KEY] && typeof store[ROTIDX_KEY] === "object") ? { ...store[ROTIDX_KEY] } : {};
  const results: Array<{ module: string; made: number; autoApprove: boolean; queued?: number }> = [];
  let made = 0;
                                                                                                              
                                                                                                             
                                                                          
  const FUNC_DEADLINE = Date.now() + 55_000;
  const ITER_BUDGET_MS = 25_000;
  const debug = { hasSnapshot: !!persona, igEnabled: !!(store["abil_social_autoplan_instagram"] && store["abil_social_autoplan_instagram"].enabled), blogEnabled: !!(store["abil_blog_autoplan_v2"] && store["abil_blog_autoplan_v2"].enabled), emailEnabled: !!(store["abil_email_autoplan"] && store["abil_email_autoplan"].enabled), selfBase: SELF_BASE };

                       
  const blog = store["abil_blog_autoplan_v2"];
  if (blog && (blog.enabled || blog.autoApprove) && due(lastrun, "abil_blog_autoplan_v2", blog.period)) {
    const qty = Math.min(Math.max(1, Number(blog.qty) || 1), MAX_ITEMS_PER_RUN);
    const fresh: any[] = [];
    for (let i = 0; i < qty; i++) {
      if (Date.now() + ITER_BUDGET_MS > FUNC_DEADLINE) break;
                                                                                                         
      const pit = takePauta("blog");
      const th = temaDe(pit, i);
      const ask = `Escreve um artigo de blog editorial no tom da marca sobre "${th}". Primeira linha = título curto; depois o corpo.${blogPrompt ? " Regras editoriais: " + blogPrompt : " Honesto e útil, sem inventar factos."}`;
      const text = await genText(ask, 4000, "blog/article", blogLang, personaAlvo(personaFor("blog", blogLang), pit));
      if (!text) continue;
      const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
      const id = `autoplan-cron-${Date.now()}-${i}`;
      const cover = await genCoverUrl(`Capa editorial para um artigo sobre "${th}", direção de arte da marca, sem texto.`, personaFor("blog", blogLang), id);
      const now = new Date().toISOString(); const ap = !!blog.autoApprove;
      fresh.push({ id, title: (lines[0] || th).slice(0, 120), excerpt: (lines[1] || "").slice(0, 220), body: lines.slice(1).join("\n\n") || text, cat: "Atelier", tone: "Calme & éditorial", keywords: [], status: ap ? "published" : "draft", createdAt: now, source: "ai", sourceLang: blogLang, cover: cover || undefined, images: cover ? [cover] : [], ...(ap ? { approvedAt: now, publishedAt: now } : {}) });
      made++;
    }
    if (fresh.length) { await appendToStoreKey("abil_blog_drafts", fresh); lastrun["abil_blog_autoplan_v2"] = new Date().toISOString(); results.push({ module: "blog", made: fresh.length, autoApprove: !!blog.autoApprove }); }
  }

                         
                                                                                                    
                                                                                                        
                                                                                                        
                  
  const CRON_SOCIAL_TAGS = ["frases-criativas", "dicas-marketing", "servicos", "repost-blog", "repost-projeto", "curiosidades", "diferenciais", "bastidores"];
                                                                                               
                                                                                                 
                                                                                                    
                                                                                                 
                                                                                                       
  const CRON_TAG_SLOTS: Record<string, { main: string; support: string; mainMax: number; supportMax: number }> = {
    "frases-criativas": { main: "titulo", support: "apoio", mainMax: 30, supportMax: 37 },
    "dicas-marketing": { main: "titulo", support: "apoio", mainMax: 33, supportMax: 90 },
    "servicos": { main: "titulo", support: "apoio", mainMax: 37, supportMax: 113 },
    "repost-blog": { main: "titulo", support: "apoio", mainMax: 27, supportMax: 139 },
    "curiosidades": { main: "titulo", support: "apoio", mainMax: 25, supportMax: 95 },
    "diferenciais": { main: "titulo", support: "apoio", mainMax: 27, supportMax: 100 },
    "bastidores": { main: "titulo", support: "apoio", mainMax: 33, supportMax: 108 },
  };
                                                                                                          
  let cronProjects: any[] | null = null;
  const cronProjectImages = (p: any): string[] => {
    const urls: string[] = [];
    const push = (u?: unknown) => { if (typeof u === "string" && /^https?:\/\//.test(u) && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u)) urls.push(u); };
    push(p?.cover?.posterSrc); push(p?.cover?.src);
    (Array.isArray(p?.assets) ? p.assets : []).forEach((a: any) => { push(a?.posterSrc); push(a?.src); });
    return Array.from(new Set(urls)).slice(0, 5);
  };
  for (const platform of SOCIAL_PLATFORMS) {
    const key = `abil_social_autoplan_${platform}`;
    const sp = store[key];
    if (!sp || !(sp.enabled || sp.autoApprove) || !due(lastrun, key, sp.period)) continue;
    const qty = Math.min(Math.max(1, Number(sp.qty) || 1), MAX_ITEMS_PER_RUN);
    const selected = (Array.isArray(sp.templates) ? sp.templates : []).filter((t: unknown): t is string => typeof t === "string" && CRON_SOCIAL_TAGS.includes(t));
    const rotation = selected.length ? selected : CRON_SOCIAL_TAGS;
                                                                                                      
                                                                                          
    const rotBase = Number.isFinite(rotidx[key]) ? Number(rotidx[key]) : 0;
    let iters = 0;
    const fresh: any[] = []; let queued = 0; const ap = !!sp.autoApprove;
    for (let i = 0; i < qty; i++) {
      if (Date.now() + ITER_BUDGET_MS > FUNC_DEADLINE) break;
      iters = i + 1;
      const tag = rotation[(rotBase + i) % rotation.length];
                                                                                                
      const pit = tag === "repost-projeto" ? null : takePauta(tag);
      const th = temaDe(pit, i);
      if (tag === "repost-projeto") {
                                                                                                       
                                                                                                      
        try {
          if (!cronProjects) { const r = await fetch(`${SELF_BASE}/api/projects`); const d = await r.json().catch(() => null); cronProjects = Array.isArray(d) ? d : (Array.isArray((d as any)?.projects) ? (d as any).projects : []); }
          const sidFor = (pid: string) => platform === "instagram" ? `project-${pid}` : `project-${pid}-${platform === "linkedin" ? "li" : "fb"}`;
          const existing: any[] = Array.isArray(store["abil_social_cards_v2"]) ? store["abil_social_cards_v2"] : [];
          const purged = new Set<string>(Array.isArray(store["abil_social_purged_sids_v1"]) ? store["abil_social_purged_sids_v1"] : []);
          const cand = (cronProjects || []).filter((p) => p && p.id && cronProjectImages(p).length > 0);
          const target = cand.find((p) => !purged.has(sidFor(p.id)) && !existing.some((c) => String(c?.sourceId || "") === sidFor(p.id)) && !fresh.some((c) => String(c?.sourceId || "") === sidFor(p.id)));
          if (!target) continue;                                                         
          const slides = cronProjectImages(target);
                                                                                          
          const palavra = wordCut(String(target.client || target.title || "Projeto"), templateFieldCap("repost-projeto", "titulo") || 32) || "Projeto";
          const apoio = wordCut(String(target.summary || target.description || "").replace(/\s+/g, " "), templateFieldCap("repost-projeto", "apoio") || 87) || wordCut(`${target.title || "Projeto"}, novo projeto no portfólio.`, templateFieldCap("repost-projeto", "apoio") || 87);
          const now = new Date().toISOString();
          fresh.push({ id: `autoplan-cron-${Date.now()}-${platform}-${i}`, sourceId: sidFor(target.id), platform, format: platform === "instagram" ? "square" : "feed", layout: "carousel-cover", tag: "repost-projeto", title: palavra, subtitle: "Projetos", supportText: apoio, imageSrc: slides[0], carouselSlides: slides, bg: tplBg("repost-projeto"), date: now.slice(0, 10), status: ap ? "scheduled" : "draft", isAIGenerated: true, ...(ap ? { approvedAt: now } : {}) });
          made++;
          if (ap) { const ok = await enqueueSocialQueue({ id: `${sidFor(target.id)}-${platform}`, platform, caption: `${palavra}\n\n${apoio}`, imageUrl: slides[0] || "", scheduledAt: new Date().toISOString() }); if (ok) queued++; }
        } catch {  }
        continue;
      }
      const slots = CRON_TAG_SLOTS[tag] || CRON_TAG_SLOTS["frases-criativas"];
                                                                           
      const capMain = templateFieldCap(tag, slots.main) || slots.mainMax;
      const capSup = templateFieldCap(tag, slots.support) || slots.supportMax;
      const id = `autoplan-cron-${Date.now()}-${platform}-${i}`;
      const now = new Date().toISOString();
                                                                                                      
                                                                                                       
                                                                                          
                                                                                               
      const tagTemFoto = tag !== "frases-criativas" && tag !== "curiosidades";
      const imgMode = (sp.imageSource === "catalog" || sp.imageSource === "stock") ? sp.imageSource : "ai";
                                                                                                      
                                                                                                      
                                                                                              
                                                                        
      const uploadOnly = (TEMPLATE_META as Record<string, { imageMode?: string }>)[tag]?.imageMode === "upload-required";
      let imageUrl = "";
      if (tagTemFoto && (imgMode === "catalog" || (uploadOnly && imgMode === "ai"))) {
        const cat: any[] = Array.isArray(store["abil_image_catalog_v1"]) ? store["abil_image_catalog_v1"] : [];
        if (cat.length) imageUrl = String(cat[(rotBase + i) % cat.length]?.url || "");
      } else if (tagTemFoto && imgMode === "stock") {
                                                                                                       
                                                                     
        try { const r = await fetch(`${SELF_BASE}/api/stock-image?q=${encodeURIComponent(String(pit?.gancho || th).slice(0, 80))}&orientation=portrait`, { headers: { "x-abil-admin": adminToken() } }); const d: any = await r.json().catch(() => null); if (r.ok && d?.url) imageUrl = String(d.url); } catch {  }
      }
                                                                                                      
                                                                                                 
                                                                                                     
      const comCombine = imageUrl ? ` Olha a imagem em anexo: a frase tem de COMBINAR com ela.` : "";
      const mainPrompt = `Escreve um título para a ARTE de um post ${platform} sobre "${th}". Estrutura OBRIGATÓRIA da arte: ${fieldLineSpecHint(tag, slots.main)}.${comCombine}${tplLinhaDe(tag)} Só o título, sem aspas, sem hashtags, sem ponto final.`;
      const titleRaw = await genText(mainPrompt, capMain + 6, "social/title", socialLang, personaAlvo(personaFor("social", socialLang), pit), imageUrl || undefined);
      if (!titleRaw) continue;
      const title = fitFieldText(tag, slots.main, titleRaw);                                       
      const titleFlat = title.replace(/\n+/g, " ").trim();
      const supPrompt = `Escreve um apoio muito curto que acompanha "${titleFlat}" num post ${platform} sobre "${th}". Estrutura da arte: ${fieldLineSpecHint(tag, slots.support)}.${imageUrl ? " Tem de combinar com a imagem em anexo." : ""}${tplLinhaDe(tag)} Voz da marca, sem hashtags.`;
      const supportText = await genText(supPrompt, capSup + 12, "social/supportText", socialLang, personaAlvo(personaFor("social", socialLang), pit), imageUrl || undefined);
      const supCut = fitFieldText(tag, slots.support, supportText || "");
      const supFlat = supCut.replace(/\n+/g, " ").trim();
                                                                                                    
                                                                                             
      const legendaRegra = String(chPrompts["legenda"] || "").trim() || "Escreve no idioma de publicação, no tom da marca ABiL, com 2 a 4 frases com profundidade (contexto, valor, convite subtil), e termina com 4 a 6 hashtags relevantes.";
      const caption = (await genText(`Escreve a LEGENDA da publicação para um post ${platform} sobre "${th}", cuja arte diz "${titleFlat}". ${legendaRegra}${imageUrl ? " Tem de combinar com a imagem em anexo." : ""}`, 600, "social/caption", socialLang, personaAlvo(personaFor("social", socialLang), pit), imageUrl || undefined)).slice(0, 600);
                                                                                             
                                                                                  
                                                                                          
      if (!imageUrl && tagTemFoto && imgMode === "ai" && !uploadOnly) imageUrl = await genCoverUrl(`Imagem para um post ${platform} sobre "${th}", direção de arte da marca, sem texto.`, personaFor("social", socialLang), id);
      fresh.push({ id, sourceId: id, platform, format: platform === "linkedin" ? "feed" : "square", layout: "hero-quote", tag, title: titleFlat, subtitle: "", supportText: supFlat, caption, asteriskColor: "#f02b36", bg: tplBg(tag), date: now.slice(0, 10), status: ap ? "scheduled" : "draft", imageSrc: imageUrl || undefined, isAIGenerated: true, ...(ap ? { approvedAt: now } : {}) });
      made++;
                                                                                                                         
      if (ap) { const ok = await enqueueSocialQueue({ id: `${id}-${platform}`, platform, caption: caption || `${titleFlat}${supFlat ? "\n\n" + supFlat : ""}`, imageUrl, scheduledAt: new Date().toISOString() }); if (ok) queued++; }
    }
    if (fresh.length) { await appendToStoreKey("abil_social_cards_v2", fresh); lastrun[key] = new Date().toISOString(); rotidx[key] = ((Number(rotidx[key]) || 0) + iters) % 9999; results.push({ module: platform, made: fresh.length, autoApprove: ap, queued }); }
  }

                        
  const email = store["abil_email_autoplan"];
  if (email && (email.enabled || email.autoApprove) && due(lastrun, "abil_email_autoplan", email.period)) {
    const qty = Math.min(Math.max(1, Number(email.qty) || 1), MAX_ITEMS_PER_RUN);
    const fresh: any[] = [];
                                                                                                     
    const emailImgMode = (email.imageSource === "catalog" || email.imageSource === "stock") ? email.imageSource : "ai";
    const emailRotBase = Number.isFinite(rotidx["abil_email_autoplan"]) ? Number(rotidx["abil_email_autoplan"]) : 0;
    let emailIters = 0;
    for (let i = 0; i < qty; i++) {
      if (Date.now() + ITER_BUDGET_MS > FUNC_DEADLINE) break;
      emailIters = i + 1;
      const th = themeFor(persona, i);
                                                                                          
      let heroImage = "";
      if (emailImgMode === "catalog") {
        const cat: any[] = Array.isArray(store["abil_image_catalog_v1"]) ? store["abil_image_catalog_v1"] : [];
        if (cat.length) heroImage = String(cat[(emailRotBase + i) % cat.length]?.url || "");
      } else if (emailImgMode === "stock") {
        try { const r = await fetch(`${SELF_BASE}/api/stock-image?q=${encodeURIComponent(th.slice(0, 80))}&orientation=landscape`, { headers: { "x-abil-admin": adminToken() } }); const d: any = await r.json().catch(() => null); if (r.ok && d?.url) heroImage = String(d.url); } catch {  }
      }
      const txt = await genText(`Escreve uma newsletter curta da marca sobre "${th}".${heroImage ? " Olha a imagem em anexo (é o banner do email): o texto tem de combinar com ela." : ""} Linha 1 = assunto; linha 2 = pré-cabeçalho; depois 2 parágrafos curtos no tom da marca. Nunca inventes preço nem prazo.\n\n${emailCapsPrompt(emailLang, ["subject", "preheader", "body"])}`, 620, "email/newsletter", emailLang, personaFor("email", emailLang), heroImage || undefined);
      if (!txt) continue;
      const parts = txt.split("\n").map((s) => s.trim()).filter(Boolean);
      const now = new Date().toISOString(); const ap = !!email.autoApprove;
                                                                                        
      if (!heroImage && emailImgMode === "ai") heroImage = await genCoverUrl(`Banner editorial para uma newsletter sobre "${th}", direção de arte da marca, sem texto.`, personaFor("email", emailLang), `autoplan-cron-email-${Date.now()}-${i}`);
      fresh.push({ id: `autoplan-cron-${Date.now()}-${i}`, phase: "newsletter", name: (parts[0] || th).slice(0, 80), subject: fitEmailField("subject", parts[0] || th), preheader: fitEmailField("preheader", parts[1] || ""), body: (parts.slice(2).length ? parts.slice(2) : parts.slice(1)).map((par) => fitEmailField("body", par)).filter(Boolean).slice(0, 2).join("\n\n") || fitEmailField("body", txt), tag: "NEWSLETTER", status: ap ? "active" : "draft", lastEdit: new Date().toLocaleDateString("fr-CH"), colorTheme: "noir", sourceLang: emailLang, blocks: [], ...(heroImage ? { heroImage } : {}), ...(ap ? { approvedAt: now } : {}) });
      made++;
    }
    if (fresh.length) { await appendToStoreKey("abil_email_template_extras_v2", fresh); lastrun["abil_email_autoplan"] = new Date().toISOString(); if (emailImgMode === "catalog") rotidx["abil_email_autoplan"] = ((Number(rotidx["abil_email_autoplan"]) || 0) + emailIters) % 9999; results.push({ module: "email", made: fresh.length, autoApprove: !!email.autoApprove }); }
  }

  if (results.length) await writeStore([{ key: LASTRUN_KEY, value: lastrun }, { key: ROTIDX_KEY, value: rotidx }]);
                                                                                          
  if (pautaDirty && pauta) await writeStore([{ key: PAUTA_KEY, value: pauta }]);
                                                                                                                                     
  if (made > 0) await logCost("gpt-4o-mini", "auto-creator", made * 700, made * 1100);
  res.status(200).json({ ok: true, made, results, debug, note: "Criação→rascunho/pendente; Aprovação→aprovado+agendado+enfileirado na social-queue (veicula só com conta ligada). Email autoApprove fica 'active' (entrega pela infra de email quando há audiência)." });
  } catch (e: any) {
    res.status(500).json({ error: "auto-creator failed", detail: String(e?.message || e).slice(0, 400), stack: String(e?.stack || "").slice(0, 600) });
  }
}
