   
                                                                           
                                 
  
                                                                              
                                                                               
                                                                             
                                                                 
  
              
                                                                                                     
                                                                      
                                                                                
                                                              
                                                                   
  
                                                                               
                                                                             
                                             
  
                                                              
   

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([  
  "https://abil.ch",
  "https://abil-site.vercel.app", "https://www.abil.ch",
  "http://localhost:5173", "http://localhost:4173", "http://localhost:5180", "http://localhost:5182",
]);
const VERCEL_AUTO_DEPLOY_RE = /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/;
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && (ALLOWED_ORIGINS.has(origin) || VERCEL_AUTO_DEPLOY_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-abil-admin, x-openai-key, x-anthropic-key",
    "Vary": "Origin",
  };
}

const COUNCIL_BLOCK = `És um CONSELHO de 5 especialistas. Antes de responder, identifica internamente qual
encaixa MELHOR no pedido do utilizador e responde a partir dessa lente (mantendo a voz
da marca). Adiciona "persona_used" ao output JSON.

PERSONAS:

[STRATEGIST], director estratégico
- Domina: propostas, briefings, posicionamento, generate_quote, edit_site_text quando estratégico.
- Voz: precisa, estruturada, citas dados/persona, raciocínio explícito.
- Quando assume: pedidos sobre PRECISAR-DE-ESCOLHA / TRADE-OFF / PROPOSTA.

[COPY], editor/copywriter
- Domina: create_blog_post, create_social_post, regenerate_text para conteúdo.
- Voz: editorial, ritmo, imagética, na voz da brand persona.
- Quando assume: pedidos sobre CRIAR / ESCREVER artigo, post, legenda, headline.

[COMMERCIAL], vendedor e comercial
- Domina: draft_email, send_email, list_pending_drafts, follow-ups, CRM.
- Voz: cordial mas pragmática, focada em RESULTADO/PRÓXIMO PASSO.
- Quando assume: pedidos sobre EMAILS, CONTATOS, RESPOSTAS A CLIENTE.

[EDITOR], editor do site / design da voz
- Domina: edit_site_text, ajustes finos, alinhamento com brand persona.
- Voz: meticulosa, vê o site como sistema coerente.
- Quando assume: pedidos sobre MUDAR TEXTO DO SITE / TÍTULO / VOZ.

[CONCIERGE], recepção/conversa
- Domina: cumprimentos, conversa fiada, open_module, leituras de snapshot.
- Voz: calorosa, breve, anti-desperdício.
- Quando assume: pedidos sobre OI/OLÁ/PERGUNTAS SIMPLES.

Regra: 1 persona por resposta. Se for ambíguo, prefere STRATEGIST.`;

const ACTION_REGISTRY = `AÇÕES (mesmo registry de /api/agent-chat):

null
  → Só conversar. Cumprimentos / agradecimentos / conversa fiada.

{ "type": "read_dashboard", "params": {} }
{ "type": "open_module", "params": { "module": "<id>" }, "confirm": "" }
{ "type": "edit_site_text", "params": { "key": "<key EXACTA>", "instruction": "<o que mudar>" }, "confirm": "" }
{ "type": "create_blog_post", "params": { "topic": "<tema>", "tone": "<opcional>", "keywords": ["..."] }, "confirm": "" }
{ "type": "create_social_post", "params": { "topic": "<tema>", "platform": "instagram|linkedin", "format": "carousel|single" }, "confirm": "" }
{ "type": "draft_email", "params": { "to": "<email>", "subject": "<assunto>", "body": "<corpo>" }, "confirm": "" }
{ "type": "send_email", "params": { "to": "<email>", "subject": "<assunto>", "body": "<corpo>" }, "confirm": "ENVIA já" }
{ "type": "generate_quote", "params": { "text": "<descrição>" }, "confirm": "" }
{ "type": "list_pending_drafts", "params": { "filter": "<opcional>" }, "confirm": "" }
{ "type": "remember", "params": { "text": "<facto reescrito limpo>", "type": "user_preference|client_fact|decision|correction|general" }, "confirm": "" }
{ "type": "generate_image", "params": { "prompt": "<descrição visual>", "context": "<blog cover|social|hero|geral>" }, "confirm": "<confirmação>" }
{ "type": "analyze_image", "params": { "instruction": "<o que fazer com a imagem anexada>" }, "confirm": "" }
{ "type": "schedule_meeting", "params": { "summary": "<título>", "startISO": "<hora LOCAL do utilizador YYYY-MM-DDTHH:MM:SS, SEM Z>", "durationMin": 60, "attendeeEmail": "<opcional>" }, "confirm": "<data/hora por extenso>" }
  → Marca reunião no Google Calendar. "marca/agenda reunião", "põe no calendário", "marca call".
    Resolve datas relativas ("sexta às 14h") para startISO como HORA LOCAL do utilizador (YYYY-MM-DDTHH:MM:SS,
    SEM "Z" nem offset), usando a DATA/HORA ACTUAL e o FUSO DO UTILIZADOR do contexto. NÃO faças contas de UTC.
    Persona COMMERCIAL.

REGRAS DE INTENÇÃO: mesmas do agent-chat. send_email só com triggers explícitos.
generate_image quando pedem "cria/gera uma imagem/visual/foto" (assume COPY ou EDITOR).
analyze_image quando há imagem anexada e pedem para a ver/avaliar.

remember (CRUCIAL, NÃO basta responder "ok vou lembrar", a acção TEM de vir junto senão nada
é guardado): emite SEMPRE remember quando (a) vês um gatilho, "lembra-te", "lembre-se", "não
esqueças", "anota", "guarda", "regista", "toma nota", "for the record", "remember", "note that",
"retiens", "merke dir", "ricorda" em qualquer língua; OU (b) o utilizador comunica um FACTO
durável sobre cliente/preferência/decisão de negócio para o futuro (ex: "o cliente X prefere Y").
Persona normalmente CONCIERGE ou COMMERCIAL. Põe o facto limpo em "text".`;

function buildCouncilPrompt(_brand: string, personaBlock: string, memoryBlock?: string, mode: "superadmin" | "client" = "superadmin"): string {
                                                                                                              
  if (mode === "client") {
    const brandName = "ABiL";
    return `És o assistente virtual PÚBLICO do site de ${brandName}. Falas com VISITANTES e potenciais clientes, NÃO és um painel de admin.
MISSÃO: explicar serviços, método, diferenciais e valores da marca; responder a dúvidas; qualificar o interesse; convidar a descrever o projecto ou deixar contacto. Caloroso, humano, CURTO (2-4 frases).
LIMITES (críticos): NUNCA executas acções administrativas nem revelas dados internos/preços exactos. Se pedirem algo assim, encaminhas para a equipa.
CONTEXTO DA MARCA (tom/voz):
${personaBlock || "(tom profissional e humano)"}

FORMATO DE SAÍDA (JSON estrito, sem markdown): { "persona_used": "CONCIERGE", "reply": "<resposta curta na língua do visitante>", "action": null }`;
  }
  const identity = `Falas com o operador do atelier suíço ABiL MEDiAS, em Genebra (preços CHF). Nunca inventes o nome de quem escreve.`;
  const memSec = memoryBlock ? `\nMEMÓRIA LONG-TERM:\n${memoryBlock}\n` : "";
  return `${identity}

${COUNCIL_BLOCK}
${memSec}
CONTEXTO DA MARCA (voz):
${personaBlock || "(sem persona configurada, usa um tom profissional e humano)"}

${ACTION_REGISTRY}

FORMATO DE SAÍDA (JSON estrito, sem markdown):
{
  "persona_used": "STRATEGIST" | "COPY" | "COMMERCIAL" | "EDITOR" | "CONCIERGE",
  "reply": "<resposta na voz dessa persona, na língua do utilizador, 1-3 frases>",
  "action": null | { "type": "...", "params": { ... }, "confirm": "<curto>" }
}`;
}

                                                                     
                                                                                     
                                                                                          
function personaToBlock(persona: any): string {
  if (!persona || typeof persona !== "object") return "";
  const parts: string[] = [];
  const bp = persona.brandPersona;
  if (bp) {
    parts.push(`MARCA: ${bp.title || ""}`);
    if (bp.tonality) parts.push(`Tom: ${String(bp.tonality).slice(0, 400)}`);
    if (bp.avoid) parts.push(`Evitar: ${String(bp.avoid).slice(0, 250)}`);
    if (bp.keywords) parts.push(`Palavras-chave: ${String(bp.keywords).slice(0, 250)}`);
    if (bp.prompt) parts.push(`Essência: ${String(bp.prompt).slice(0, 600)}`);
    if (bp.estiloEscrita) parts.push(`Como escreve: ${String(bp.estiloEscrita).slice(0, 1200)}`);
  }
                                                                                                            
                                                                                                         
  if (persona.referenceNotes) parts.push(`\nREGRAS DE VOZ E MÉTODO (segue de perto, não cites literalmente):\n${String(persona.referenceNotes).slice(0, 2500)}`);
  if (persona.globalTextPrompt) parts.push(`\nDIRETIVA GLOBAL DE TEXTO (dashboard): ${String(persona.globalTextPrompt).slice(0, 900)}`);
  const by = persona.buyerPersona;
  if (by) {
    parts.push(`\nCLIENTE-ALVO (buyer persona): ${by.title || ""}`);
    if (by.prompt) parts.push(String(by.prompt).slice(0, 700));
  }
  if (Array.isArray(persona.knowledge) && persona.knowledge.length) {
    parts.push(`\nCONHECIMENTO: ${persona.knowledge.join(" · ").slice(0, 1500)}`);
  }
  if (persona.safeguards) parts.push(`\nLIMITES: ${String(persona.safeguards).slice(0, 300)}`);
  return parts.join("\n").slice(0, 7000);
}

const ALLOWED_LANGS = new Set(["pt", "fr", "en", "de", "it"]);

type ChatMsg = { role: "user" | "assistant"; content: string };

async function callOpenAI(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 14000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: args.model, temperature: 0.5, max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: args.system }, ...args.messages],
      }),
    });
    clearTimeout(tid);
    if (!res.ok) { const e = await res.text().catch(() => ""); throw new Error(`OpenAI ${res.status}: ${e.slice(0, 200)}`); }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) { clearTimeout(tid); throw err; }
}
                                                                              
                                                                                               
async function callAnthropic(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-api-key": args.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: args.model, system: args.system + "\n\nResponde APENAS com o objecto JSON, sem texto antes ou depois.",
        max_tokens: 900, temperature: 0.5,
        messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    clearTimeout(tid);
    if (!res.ok) { const e = await res.text().catch(() => ""); throw new Error(`Anthropic ${res.status}: ${e.slice(0, 160)}`); }
    const data: any = await res.json();
    return data?.content?.[0]?.text || null;
  } catch (err) { clearTimeout(tid); throw err; }
}

                                                                                                          
                                                                                                            
                                                                                                        
                                                                                                    
                                                       
const CULT_PHILO_MAX = 6000;
const CULT_BIO_MAX = 3000;
const CULT_METODO_MAX = 1600;
let _cultCache: { at: number; text: string } | null = null;
async function readCultureCtx(baseUrl: string, adminToken: string): Promise<string> {
  if (_cultCache && Date.now() - _cultCache.at < 10 * 60 * 1000) return _cultCache.text;
  if (!adminToken) return "";
  const one = async (col: string): Promise<any> => {
    try {
      const r = await fetch(`${baseUrl}/api/private-store?col=${col}&cb=${Date.now()}`, { headers: { "x-abil-admin": adminToken }, cache: "no-store" });
      if (!r.ok) return null;
      const d: any = await r.json().catch(() => null);
      return d?.value ?? null;
    } catch { return null; }
  };
  try {
    const [philoV, bioV, journeyV] = await Promise.all([one("work_philosophy"), one("biography"), one("journey_map")]);
    const asText = (v: any): string => (typeof v === "string" ? v : (typeof v?.texto === "string" ? v.texto : ""));
    const philo = String(asText(philoV) || "").trim();
    const bio = String(asText(bioV) || "").trim();
    const metodo = journeyV && typeof journeyV === "object" && typeof journeyV.metodo === "string" ? String(journeyV.metodo).trim() : "";
    const blocks: string[] = [];
    if (philo) blocks.push(`FILOSOFIA DE TRABALHO do ABiL (a postura da marca e a forma de pensar o marketing: pensa e responde a partir dela, nunca a contradigas, nunca acrescentes factos que nao estejam aqui):\n${philo.slice(0, CULT_PHILO_MAX)}`);
    if (bio) blocks.push(`CULTURE / MANIFESTE da marca ABiL (a historia e os valores do atelier, a voz "nous": e FONTE de factos para soar autentico e ancorar autoridade, NUNCA para inventar):\n${bio.slice(0, CULT_BIO_MAX)}`);
    if (metodo) blocks.push(`METODO DA JORNADA (a regra geral de como o atelier constroi a relacao com o lead, do frio ao cliente):\n${metodo.slice(0, CULT_METODO_MAX)}`);
    if (!blocks.length) return "";
    const text = `\n\nCULTURA INTERNA (a identidade partilhada por chatbot, email e conteudo, a mesma fonte do cofre):\n${blocks.join("\n\n")}\n`;
    _cultCache = { at: Date.now(), text };
    return text;
  } catch { return ""; }
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function adminOk(req: Request): Promise<boolean> {
  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const pw = env.ABIL_ADMIN_AUTH_SECRET || "";
  const tok = req.headers.get("x-abil-admin") || "";
  if (!pw || !tok || !tok.includes(".")) return false;
  const i = tok.indexOf(".");
  const exp = Number(tok.slice(0, i));
  const sig = tok.slice(i + 1);
  if (!exp || exp <= Date.now()) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(exp))));
  const want = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return safeEqual(sig, want);
}

export default async function handler(req: Request): Promise<Response> {
  const CORS = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...CORS } });

  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS } });
  }

  let body: any = {};
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }

  const message = String(body?.message || "").slice(0, 4000).trim();
  if (!message) return new Response(JSON.stringify({ error: "message required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  const lang = ALLOWED_LANGS.has(String(body?.lang || "").toLowerCase().slice(0, 2)) ? String(body.lang).toLowerCase().slice(0, 2) : "pt";
  const brand = "abil" as const;                              
  const mode: "superadmin" | "client" = body?.mode === "client" ? "client" : "superadmin";           

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
                                                                                                            
  const apiKey = env.OPENAI_API_KEY || undefined;
  const anthropicKeyAny = env.ANTHROPIC_API_KEY || undefined;
  if (!apiKey && !anthropicKeyAny) return new Response(JSON.stringify({ error: "Sem chave de IA (OPENAI_API_KEY ou ANTHROPIC_API_KEY)" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });

                                                                                                 
                                                                                                              
  try {
    const _u = new URL(req.url);
    const _chk = await fetch(`${_u.protocol}//${_u.host}/api/agent-cost?action=check`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": req.headers.get("x-abil-admin") || "" }, body: JSON.stringify({ estimated_cost: 0.02 }),
    });
    if (_chk.ok) {
      const _cj: any = await _chk.json().catch(() => null);
      if (_cj && _cj.allowed === false) {
        return new Response(JSON.stringify({ error: `Limite de custo de IA atingido (${_cj.reason || "teto"}). Tenta mais tarde ou ajusta AGENT_COST_MAX_*.`, killed: true }), { status: 429, headers: { "Content-Type": "application/json", ...CORS } });
      }
    }
  } catch {  }

                                                                                        
  const langName = ({ fr: "French", de: "German", en: "English", pt: "Portuguese (European, pt-PT)", it: "Italian" } as any)[lang] || lang;
  const personaBlock = personaToBlock(body?.persona);
                                                                                                      
                                                                                                                       
  const cultureBlock = await readCultureCtx(`${new URL(req.url).protocol}//${new URL(req.url).host}`, req.headers.get("x-abil-admin") || "");
  const snapshot = JSON.stringify(body?.snapshot || {}).slice(0, 1500);
  const currentModule = String(body?.currentModule || "").slice(0, 40);
  const priceTable = String(body?.priceTable || "").slice(0, 1600);                                      
  const extraInstructions = String(body?.extraInstructions || "").slice(0, 2000);                                                                           
  const editablePaths = Array.isArray(body?.editablePaths)
    ? body.editablePaths.slice(0, 30).map((p: any) => `- ${p.key}: "${String(p.label || "").slice(0, 60)}"`).join("\n").slice(0, 2000)
    : "";
  const memories: Array<{ type?: string; text?: string }> = Array.isArray(body?.memories) ? body.memories.slice(0, 6) : [];
  const memoryBlock = memories.length ? memories.map((m, i) => `[${i + 1}] (${m.type || "general"}) ${String(m.text || "").slice(0, 220)}`).join("\n") : "";
  const history: ChatMsg[] = Array.isArray(body?.history)
    ? body.history.slice(-6).map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content || "").slice(0, 1200) })).filter((m: ChatMsg) => m.content)
    : [];

  const userTz = (() => { const t = String(body?.userTimezone || "").trim(); try { new Date().toLocaleString("en-US", { timeZone: t }); return t || "Europe/Lisbon"; } catch { return "Europe/Lisbon"; } })();
  const nowLocal = new Date().toLocaleString("pt-PT", { timeZone: userTz, weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const contextBlock = [
    `Língua: ${langName}.`,
    `DATA/HORA ACTUAL: ${nowLocal}, fuso do utilizador: ${userTz} (ISO UTC ${new Date().toISOString()}). Resolve datas/horas relativas NESTE fuso.`,
    currentModule ? `Módulo: ${currentModule}.` : "",
    `SNAPSHOT: ${snapshot}`,
    editablePaths ? `EDITÁVEIS:\n${editablePaths}` : "",
    priceTable ? `TABELA DE PREÇOS (catálogo base, €), responde sobre serviços/pacotes/valores; p/ orçamento detalhado emite generate_quote:\n${priceTable}` : "",
  ].filter(Boolean).join("\n");

  const systemBase = buildCouncilPrompt(brand, `${personaBlock}${cultureBlock}`, memoryBlock, mode);
  const system = extraInstructions
    ? `${systemBase}\n\n═══════ REGRAS DO ADMINISTRADOR · PRIORIDADE MÁXIMA ═══════\nO administrador definiu, na página «Agente de IA», estas regras permanentes. APLICA-AS SEMPRE ao conteúdo do campo "reply", ACIMA de qualquer instrução anterior de estilo, comprimento ou persona (mas mantém o JSON de saída válido):\n${extraInstructions}`
    : systemBase;
                                                                                               
                                                                                                
  const adminTurn = extraInstructions ? `\n\n⚠️ REGRAS OBRIGATÓRIAS DO ADMINISTRADOR (governam o teu campo "reply", acima de qualquer regra de estilo/persona/comprimento, cumpre-as à risca):\n${extraInstructions}` : "";
  const messages: ChatMsg[] = [...history, { role: "user", content: `${contextBlock}${adminTurn}\n\nMensagem recebida:\n"""${message}"""` }];

                                                                                              
                                                                                              
                                                                                                     
  const anthropicKey = anthropicKeyAny;
  const want = String(body?.model || "gpt-4o-mini").trim() || "gpt-4o-mini";
  const wantClaude = want.startsWith("claude");
  const claudeId = (({ "claude-haiku-3.5": "claude-haiku-4-5-20251001", "claude-sonnet-4.5": "claude-sonnet-4-5", "claude-opus-4.5": "claude-opus-4-5" } as Record<string, string>)[want]) || (wantClaude ? want : "claude-haiku-4-5-20251001");
  const openaiId = (want.startsWith("gpt") || want.startsWith("o")) ? want : "gpt-4o-mini";
  const callOA = () => callOpenAI({ apiKey: apiKey as string, model: openaiId, system, messages });
  const callAN = () => callAnthropic({ apiKey: anthropicKey as string, model: claudeId, system, messages });
  let raw: string | null;
  let usedProvider = wantClaude && anthropicKey ? "anthropic" : "openai";
  let usedModel: string;
  try {
                                                                                                 
    if (body?.__testForceOpenAIFail && !wantClaude) throw new Error("forced OpenAI fail (test)");
    if (wantClaude && anthropicKey) { raw = await callAN(); usedProvider = "anthropic"; }
    else if (apiKey) { raw = await callOA(); usedProvider = "openai"; }
    else if (anthropicKey) { raw = await callAN(); usedProvider = "anthropic"; }
    else throw new Error("sem chave de IA");
    usedModel = usedProvider.startsWith("anthropic") ? claudeId : openaiId;
  } catch (e: any) {
    try {
      if (usedProvider.startsWith("anthropic") && apiKey) { raw = await callOA(); usedProvider = "openai_fallback"; }
      else if (anthropicKey) { raw = await callAN(); usedProvider = "anthropic_fallback"; }
      else throw e;
      usedModel = usedProvider.startsWith("anthropic") ? claudeId : openaiId;
    } catch (e2: any) {
      return new Response(JSON.stringify({ error: `IA falhou (openai+anthropic): ${String(e2?.message || e2).slice(0, 200)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
  }
  if (!raw) return new Response(JSON.stringify({ error: "empty response" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });

  let parsed: any = null;
  try { parsed = JSON.parse(raw.trim().replace(/^```(?:json|JSON)?\s*/, "").replace(/\s*```\s*$/, "").trim()); } catch {  }
  if (!parsed) { const m = raw.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch {  } } }
  if (!parsed) parsed = { persona_used: "CONCIERGE", reply: raw.slice(0, 500), action: null };
  if (typeof parsed.reply !== "string") parsed.reply = String(parsed.reply || "");
  parsed.reply = parsed.reply.slice(0, 1500);
  if (parsed.action && typeof parsed.action !== "object") parsed.action = null;
  if (!["STRATEGIST", "COPY", "COMMERCIAL", "EDITOR", "CONCIERGE"].includes(parsed.persona_used)) parsed.persona_used = "CONCIERGE";

                                                       
  try {
    const url = new URL(req.url);
    const promptLen = system.length + messages.reduce((s, m) => s + m.content.length, 0);
    const compLen = raw.length;
    fetch(`${url.protocol}//${url.host}/api/agent-cost?action=log`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": req.headers.get("x-abil-admin") || "" },
      body: JSON.stringify({ provider: usedProvider, model: usedModel, requested_model: want, prompt_tokens: Math.ceil(promptLen / 4), completion_tokens: Math.ceil(compLen / 4), endpoint: "agent-council", brand }),
    }).catch(() => {});
  } catch {            }

  return new Response(JSON.stringify({ ok: true, provider: usedProvider, model: usedModel, requested_model: want, persona_used: parsed.persona_used, reply: parsed.reply, action: parsed.action ?? null }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
}
