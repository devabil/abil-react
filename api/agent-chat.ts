                                                                                       
                                                                                        
                                                                                          
                                                                                             
                                                                                        
                                                                                   
  
                                                                                             
                                                                                           
                                              

export const config = { runtime: "edge" };

                                                                                                                 
                                                                                                       
import { servicesCatalogBlock } from "../src/lib/servicesCatalog.js";

                                                                                                 
const ACTION_REGISTRY = `AÇÕES (define "action" como UMA destas, ou null):

null
  → Só conversar. Usa para cumprimentos ("oi", "olá", "e aí"), agradecimentos, conversa fiada,
    ou perguntas que respondes com o contexto. NUNCA dispares uma acção num cumprimento.

{ "type": "read_dashboard", "params": {} }
  → Responder a uma pergunta sobre o estado (orçamentos, briefings, clientes recentes) usando
    o SNAPSHOT. Põe a resposta em "reply"; podes deixar action null se já tens o dado.

{ "type": "open_module", "params": { "module": "<id>" }, "confirm": "" }
  → Abrir um módulo do dashboard. ids: ai, briefings, quotes, pricing, crm, email, social,
    blog, helpdesk, projects, presentations, brand, buyer, textes, pages, traffic, seo, settings.

{ "type": "edit_site_text", "params": { "key": "<key EXACTA da lista TEXTOS EDITÁVEIS>", "instruction": "<o que mudar, na voz da marca>" }, "confirm": "<confirmação curta>" }
  → Mudar um texto do site público. A "key" DEVE ser uma das chaves EXACTAS da lista TEXTOS
    EDITÁVEIS abaixo (ex: "hero.title", "cta.title"). NÃO inventes chaves novas. Se a lista
    estiver vazia ou nenhuma chave bater, devolve action null e pergunta qual a secção exacta.
    Se o utilizador deu o texto EXACTO, mete-o em "newText" em vez de "instruction".

{ "type": "create_blog_post", "params": { "topic": "<tema>", "tone": "<opcional>", "keywords": ["..."] }, "confirm": "<confirmação>" }
  → Gerar um artigo de blog completo sobre o tema, na voz da marca, guardado como rascunho.

{ "type": "create_social_post", "params": { "topic": "<tema>", "platform": "instagram|linkedin", "format": "carousel|single" }, "confirm": "<confirmação>" }
  → Gerar um post/carrossel de rede social sobre o tema, guardado no calendário social.

{ "type": "draft_email", "params": { "to": "<email>", "subject": "<assunto>", "body": "<corpo>" }, "confirm": "<confirmação>" }
  → Criar um RASCUNHO de e-mail no Gmail (NÃO envia). O humano revê e envia.

{ "type": "send_email", "params": { "to": "<email>", "subject": "<assunto>", "body": "<corpo>" }, "confirm": "<confirmação, frisa que ENVIA já>" }
  → ENVIAR um e-mail directamente (sem rascunho). Triggers EXPLÍCITOS: "envia já", "envia agora",
    "manda agora", "send now", "envoie maintenant", "schicke jetzt", "invia ora", "this minute",
    "manda direto". Se vires qualquer um destes (ou equivalente claro), USA send_email, NÃO draft_email.
    Para qualquer pedido ambíguo ("manda um email", "envia para o João") usa draft_email.

{ "type": "generate_quote", "params": { "text": "<descrição do pedido do cliente>" }, "confirm": "<confirmação>" }
  → Gerar um orçamento/proposta completo a partir de um pedido descrito.

{ "type": "list_pending_drafts", "params": { "filter": "<nome opcional>" }, "confirm": "" }
  → Listar rascunhos de e-mail pendentes na caixa.

{ "type": "remember", "params": { "text": "<o facto/preferência a guardar, reescrito limpo>", "type": "user_preference|client_fact|decision|correction|general" }, "confirm": "" }
  → Gravar uma memória LONG-TERM (persiste entre sessões). É OBRIGATÓRIO emitir esta acção
    (não basta responder "ok, vou lembrar") sempre que:
    • o utilizador usa um GATILHO: "lembra-te", "lembre-se", "não esqueças", "anota", "anote",
      "guarda", "regista", "toma nota", "for the record", "remember", "note that", "retiens",
      "merke dir", "ricorda", em QUALQUER língua;
    • OU o utilizador comunica um FACTO durável sobre si, um cliente, uma preferência ou uma
      decisão de negócio para o futuro (ex: "o cliente X prefere Y", "nunca faço Z", "o prazo
      do projecto W é …"). Nestes casos emite remember MESMO sem palavra-gatilho.
    Põe em "text" o facto reescrito limpo (3ª pessoa, conciso). Escolhe o "type" certo.
    A "reply" confirma curta ("Anotado."), mas a acção remember TEM de vir junto, senão NADA
    é guardado. NÃO uses para perguntas, conversa fiada ou pedidos de execução.

{ "type": "generate_image", "params": { "prompt": "<descrição visual da imagem>", "context": "<blog cover|social|hero|geral>" }, "confirm": "<confirmação>" }
  → Gerar uma IMAGEM com IA (gpt-image-1, estética da marca aplicada automaticamente). Usa quando
    o utilizador pede "cria/gera uma imagem", "faz um visual", "uma foto para o blog/post/hero".

{ "type": "analyze_image", "params": { "instruction": "<o que analisar/fazer com a imagem>" }, "confirm": "" }
  → Analisar uma IMAGEM que o utilizador anexou (vê o conteúdo e responde). Usa quando há uma imagem
    anexada e o utilizador pede "olha isto", "o que achas desta imagem", "descreve", "está alinhado?".
    O cliente trata do upload; tu só emites a acção com a instrução.

{ "type": "schedule_meeting", "params": { "summary": "<título>", "startISO": "<hora LOCAL do utilizador YYYY-MM-DDTHH:MM:SS, SEM Z nem offset>", "durationMin": 60, "attendeeEmail": "<opcional>", "description": "<opcional>" }, "confirm": "<confirmação com data/hora legível>" }
  → Criar um evento no Google Calendar. Usa quando pedem "marca/agenda uma reunião", "põe no calendário",
    "marca call com X". RESOLVE datas relativas ("sexta às 14h", "amanhã", "próxima terça") para "startISO"
    como HORA LOCAL DO UTILIZADOR no formato YYYY-MM-DDTHH:MM:SS (ex "2026-06-12T14:00:00"), SEM "Z" nem
    offset de fuso. NÃO faças contas de UTC: escreve a hora tal como o utilizador a diria; o servidor aplica
    o FUSO DO UTILIZADOR dado no contexto. Se faltar hora, assume 10:00. "confirm" mostra a data/hora por extenso.

REGRAS DE INTENÇÃO (cruciais):
- Cumprimento / conversa fiada / agradecimento → action: null, resposta curta e calorosa. NUNCA agir.
- Só emite uma acção com efeito (editar/criar/enviar) quando o utilizador PEDE claramente.
- Entre draft_email e send_email: usa draft_email por defeito; **send_email APENAS** quando vires um
  trigger explícito ("envia já", "envia agora", "manda agora", "send now", "envoie maintenant",
  "schicke jetzt", "invia ora", "manda direto"). Em caso de dúvida → draft_email (mais seguro).
- edit_site_text: SEMPRE escolhe "key" da lista TEXTOS EDITÁVEIS. Nunca inventes uma key. Se nenhuma
  da lista bater no pedido, devolve action null e pergunta qual a secção exacta.
- read_dashboard: se o snapshot já tem a resposta directa ("quantos orçamentos?"), respondes em
  "reply" e action pode ficar null. Só emite read_dashboard quando precisares de mostrar resumo
  completo + clientes recentes (ex: "lê o dashboard e dá-me um overview").
- Responde SEMPRE na língua do utilizador. Mantém a VOZ DA MARCA (persona abaixo).
- "reply" curto (1-3 frases). "confirm" é a frase que o cliente mostra antes de executar.`;

function buildSystemPrompt(brand: "abil", personaBlock: string, memoryBlock?: string, mode: "superadmin" | "client" = "superadmin"): string {
                                                                                                             
                                                                                                               
  if (mode === "client") {
    const brandName = "ABiL";
    return `És o assistente virtual PÚBLICO do site de ${brandName}. Falas com VISITANTES e potenciais clientes, NÃO és um painel de administração.
MISSÃO: explicar serviços, método, diferenciais e valores da marca; responder a dúvidas com clareza; qualificar o interesse; convidar o visitante a descrever o projecto ou deixar contacto. Caloroso, humano, útil; respostas CURTAS (2-4 frases).
LIMITES (críticos): NUNCA executas acções administrativas (não editas o site, não envias emails em nome da marca, não crias orçamentos no sistema, não acedes a dados internos nem a preços exactos). Se pedirem algo assim, diz que encaminhas para a equipa.
${memoryBlock ? "" : ""}CONTEXTO DA MARCA (usa para tom/voz/valores):
${personaBlock || "(tom profissional e humano)"}

FORMATO DE SAÍDA (JSON estrito, sem markdown, sem cercas):
{ "reply": "<resposta na língua do visitante, curta>", "action": null }`;
  }
                                                                                 
                                                                                     
  const identity = `És o copiloto superadmin do atelier suíço ABiL. Falas com o operador do atelier. Atelier criativo de gama alta (preços em CHF). Voz precisa e elegante.`;
  const memorySection = memoryBlock
    ? `\nMEMÓRIA LONG-TERM (factos guardados em sessões anteriores, usa quando relevante; ignora se off-topic):\n${memoryBlock}\n`
    : "";
  return `${identity}

És um ASSISTENTE EXECUTOR, não decorativo: além de conversar, executas acções reais no dashboard
escolhendo a acção certa do registry. Tens memória da conversa (o histórico vem nas mensagens).
${memorySection}
CONTEXTO DA MARCA (usa-o para tudo o que escreveres, tom, voz, valores):
${personaBlock || "(sem persona configurada, usa um tom profissional e humano)"}

${ACTION_REGISTRY}

FORMATO DE SAÍDA (JSON estrito, sem markdown, sem cercas de código):
{
  "reply": "<resposta conversacional curta, na língua do utilizador>",
  "action": null | { "type": "...", "params": { ... }, "confirm": "<frase de confirmação>" }
}`;
}

type Provider = "openai" | "anthropic" | "google";
function modelToProvider(model: string): { provider: Provider; modelId: string } {
  if (model.startsWith("claude")) {
    const map: Record<string, string> = {
      "claude-haiku-3.5": "claude-haiku-4-5-20251001",
      "claude-sonnet-4.5": "claude-sonnet-4-5",
      "claude-opus-4.5": "claude-opus-4-5",
    };
    return { provider: "anthropic", modelId: map[model] || model };
  }
  if (model.startsWith("gemini")) {
    const map: Record<string, string> = {
      "gemini-2.5-flash": "gemini-2.5-flash",
      "gemini-2.5-pro": "gemini-2.5-pro",
      "gemini-3-flash": "gemini-3-flash",
    };
    return { provider: "google", modelId: map[model] || model };
  }
  return { provider: "openai", modelId: model };
}

type ChatMsg = { role: "user" | "assistant"; content: string };

async function callOpenAI(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 22000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: args.model,
        messages: [{ role: "system", content: args.system }, ...args.messages],
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: "json_object" },
      }),
    });
    clearTimeout(tid);
    if (!res.ok) { const err = await res.text().catch(() => ""); throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`); }
    const data: any = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) { clearTimeout(tid); throw err; }
}

async function callAnthropic(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 22000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-api-key": args.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: args.model, max_tokens: 700, temperature: 0.4, system: args.system, messages: args.messages.map((m) => ({ role: m.role, content: m.content })) }),
    });
    clearTimeout(tid);
    if (!res.ok) { const err = await res.text().catch(() => ""); throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`); }
    const data: any = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch (err) { clearTimeout(tid); throw err; }
}

async function callGoogle(args: { apiKey: string; model: string; system: string; messages: ChatMsg[] }): Promise<string | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 22000);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(args.model)}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: args.system }] },
        contents: args.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 700, responseMimeType: "application/json" },
      }),
    });
    clearTimeout(tid);
    if (!res.ok) { const err = await res.text().catch(() => ""); throw new Error(`Google ${res.status}: ${err.slice(0, 200)}`); }
    const data: any = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) { clearTimeout(tid); throw err; }
}

const ALLOWED_ORIGINS = new Set([
  "https://abil.ch", "https://www.abil.ch", "https://abil-site.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:5180",
  "http://localhost:5182",
]);
const VERCEL_AUTO_DEPLOY_RE = /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/;
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && (ALLOWED_ORIGINS.has(origin) || VERCEL_AUTO_DEPLOY_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-anthropic-key, x-google-key, x-abil-admin",
    "Vary": "Origin",
  };
}

const ALLOWED_LANGS = new Set(["pt", "fr", "en", "it", "de"]);

                                                                                             
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
                                                                                                              
                                                                                                              
                                                                                                 
    let portfolio = "";
    try {
      const rp = await fetch(`${baseUrl}/api/projects?cb=${Date.now()}`, { cache: "no-store" });
      if (rp.ok) {
        const arr: any[] = await rp.json().catch(() => null);
        if (Array.isArray(arr) && arr.length) {
          const linhas: string[] = []; let used = 0; let truncado = false;
          for (const p of arr) {
            if (!p || !p.title || p.hidden === true) continue;
            const ano = String(p.year || "").trim() || String(p.publishedAt || "").slice(0, 4);
            const linha = `- ${String(p.title).slice(0, 90)}${p.client ? ` (cliente: ${String(p.client).slice(0, 60)})` : ""}${ano ? `, ${ano.slice(0, 8)}` : ""}`;
            if (used + linha.length > 2000) { truncado = true; break; }
            used += linha.length + 1; linhas.push(linha);
          }
          if (linhas.length) portfolio = `PORTFOLIO PUBLICADO no site (a lista REAL de projetos). REGRA DURA: so podes citar projetos DESTA lista; fora dela, di-lo honestamente e oferece verificar.\n${linhas.join("\n")}${truncado ? "\n(lista truncada)" : ""}`;
        }
      }
    } catch {  }
    blocks.push(portfolio || "PORTFOLIO PUBLICADO: indisponivel agora (falha de leitura). NAO cites nenhum projeto especifico.");
    blocks.push(servicesCatalogBlock().trim());
    if (!blocks.length) return "";
    const text = `\n\nCULTURA INTERNA (a identidade partilhada por chatbot, email e conteudo, a mesma fonte do cofre):\n${blocks.join("\n\n")}\n`;
    _cultCache = { at: Date.now(), text };
    return text;
  } catch { return ""; }
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
  if (!message) return new Response(JSON.stringify({ error: "message is required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });

  const lang = ALLOWED_LANGS.has(String(body?.lang || "").toLowerCase().slice(0, 2)) ? String(body.lang).toLowerCase().slice(0, 2) : "pt";
                                     
  const brand = "abil" as const;
  const mode: "superadmin" | "client" = body?.mode === "client" ? "client" : "superadmin";           

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const hasGemini = !!env.GEMINI_API_KEY, hasOpenAI = !!env.OPENAI_API_KEY, hasAnthropic = !!env.ANTHROPIC_API_KEY;
                                                                                                     
                                                                                                    
                                                                                                  
                                                      
  const defaultModel = hasOpenAI ? "gpt-4o-mini" : hasGemini ? "gemini-2.5-flash" : hasAnthropic ? "claude-haiku-3.5" : "gpt-4o-mini";
  const modelRaw = String(body?.model || defaultModel);
  const { provider, modelId } = modelToProvider(modelRaw);

  let apiKey: string | undefined;
  if (provider === "openai") apiKey = env.OPENAI_API_KEY || undefined;
  else if (provider === "anthropic") apiKey = env.ANTHROPIC_API_KEY || undefined;
  else if (provider === "google") apiKey = env.GEMINI_API_KEY || undefined;
  if (!apiKey) return new Response(JSON.stringify({ error: `API key not configured for ${provider}.` }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });

                                                                                                  
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

                                                                     
                                                                                                              
  const langVariant = String(body?.langVariant || "").trim() || (lang === "pt" ? "pt-PT" : "");
  const ptName = langVariant === "pt-BR" ? "Portuguese (Brazilian, pt-BR)" : "Portuguese (European, pt-PT)";
  const langName = ({ fr: "French", de: "German", en: "English", pt: ptName, it: "Italian" } as any)[lang] || lang;
  const personaBlock = personaToBlock(body?.persona);
                                                                                                                      
                                                                                                                        
  const cultureBlock = await readCultureCtx(new URL(req.url).origin, req.headers.get("x-abil-admin") || "");
  const snapshot = JSON.stringify(body?.snapshot || {}).slice(0, 1800);
  const currentModule = String(body?.currentModule || "").slice(0, 40);
  const priceTable = String(body?.priceTable || "").slice(0, 1600);                                                            
  const extraInstructions = String(body?.extraInstructions || "").slice(0, 2000);                                                                           
  const editablePaths = Array.isArray(body?.editablePaths)
    ? body.editablePaths.slice(0, 40).map((p: any) => `- ${p.key}: "${String(p.label || "").slice(0, 60)}" (actual: "${String(p.current || "").slice(0, 80)}")`).join("\n").slice(0, 2500)
    : "";

                                                
  const history: ChatMsg[] = Array.isArray(body?.history)
    ? body.history.slice(-8).map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content || "").slice(0, 1500) })).filter((m: ChatMsg) => m.content)
    : [];

                                                                                     
  const memories: Array<{ type?: string; text?: string }> = Array.isArray(body?.memories) ? body.memories.slice(0, 6) : [];
  const memoryBlock = memories.length
    ? memories.map((m, i) => `[${i + 1}] (${m.type || "general"}) ${String(m.text || "").slice(0, 220)}`).join("\n")
    : "";

                                                                                                             
  const userTz = (() => { const t = String(body?.userTimezone || "").trim(); try { new Date().toLocaleString("en-US", { timeZone: t }); return t || "Europe/Lisbon"; } catch { return "Europe/Lisbon"; } })();
  const nowISO = new Date().toISOString();
  const nowLocal = new Date().toLocaleString("pt-PT", { timeZone: userTz, weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

                                                                                 
  const contextBlock = [
    `Língua da resposta: ${langName}.`,
    `DATA/HORA ACTUAL: ${nowLocal}, fuso do utilizador: ${userTz} (ISO UTC ${nowISO}). Resolve datas/horas relativas NESTE fuso do utilizador.`,
    currentModule ? `Módulo aberto agora: ${currentModule}.` : "",
    `ESTADO (snapshot do cofre): ${snapshot}`,
    editablePaths ? `TEXTOS EDITÁVEIS do site (key: label):\n${editablePaths}` : "",
    priceTable ? `TABELA DE PREÇOS (catálogo base, €), usa para responder sobre serviços/pacotes/valores/regras comerciais; para um orçamento detalhado emite a acção generate_quote:\n${priceTable}` : "",
  ].filter(Boolean).join("\n");

  const systemBase = buildSystemPrompt(brand, `${personaBlock}${cultureBlock}`, memoryBlock, mode);
  const system = extraInstructions
    ? `${systemBase}\n\n═══════ REGRAS DO ADMINISTRADOR · PRIORIDADE MÁXIMA ═══════\nO administrador definiu, na página «Agente de IA», estas regras permanentes. APLICA-AS SEMPRE ao conteúdo da tua resposta ao utilizador, ACIMA de qualquer instrução anterior de estilo, comprimento ou persona (mantém o formato de saída válido):\n${extraInstructions}`
    : systemBase;
                                                                                                          
  const adminTurn = extraInstructions ? `\n\n⚠️ REGRAS OBRIGATÓRIAS DO ADMINISTRADOR (governam a tua resposta, acima de qualquer regra de estilo/persona/comprimento, cumpre-as à risca):\n${extraInstructions}` : "";
  const messages: ChatMsg[] = [...history, { role: "user", content: `${contextBlock}${adminTurn}\n\n, o operador disse:\n"""${message}"""` }];

                                                                                               
                                                                                                        
  let raw: string | null;
  let effectiveProvider: string = provider;
  try {
    raw = provider === "openai" ? await callOpenAI({ apiKey, model: modelId, system, messages })
      : provider === "google" ? await callGoogle({ apiKey, model: modelId, system, messages })
      : await callAnthropic({ apiKey, model: modelId, system, messages });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    try {
      if (provider === "google" && hasOpenAI) {
        raw = await callOpenAI({ apiKey: env.OPENAI_API_KEY!, model: "gpt-4o-mini", system, messages });
        effectiveProvider = "openai_fallback";
      } else if (provider === "openai" && hasAnthropic) {
        raw = await callAnthropic({ apiKey: env.ANTHROPIC_API_KEY!, model: "claude-haiku-4-5-20251001", system, messages });
        effectiveProvider = "anthropic_fallback";
      } else if (provider === "anthropic" && hasOpenAI) {
        raw = await callOpenAI({ apiKey: env.OPENAI_API_KEY!, model: "gpt-4o-mini", system, messages });
        effectiveProvider = "openai_fallback";
      } else {
        return new Response(JSON.stringify({ error: errMsg.slice(0, 300) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
      }
    } catch (err2: any) {
      return new Response(JSON.stringify({ error: `providers falharam: ${String(err2?.message || err2).slice(0, 200)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
    }
  }
  if (!raw) return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });

                                                                        
  let parsed: any = null;
  const cleanRaw = raw.trim().replace(/^```(?:json|JSON)?\s*/, "").replace(/\s*```\s*$/, "").trim();
  try { parsed = JSON.parse(cleanRaw); } catch {  }
  if (!parsed) { const m = cleanRaw.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch {  } } }
  if (parsed && typeof parsed.reply === "string" && /^\s*\{[\s\S]*\}\s*$/.test(parsed.reply)) {
    try { const inner = JSON.parse(parsed.reply); if (inner && typeof inner.reply === "string") parsed = { reply: inner.reply, action: inner.action ?? parsed.action ?? null }; } catch {  }
  }
  if (!parsed) parsed = { reply: cleanRaw.slice(0, 600), action: null };
  if (typeof parsed.reply !== "string") parsed.reply = String(parsed.reply || "");
  parsed.reply = parsed.reply.slice(0, 1500);
  if (parsed.action && typeof parsed.action !== "object") parsed.action = null;

                                                                     
  try {
    const promptLen = (system?.length || 0) + messages.reduce((s, m) => s + (m.content?.length || 0), 0);
    const compLen = raw.length;
    const url = new URL(req.url);
    const costEndpoint = `${url.protocol}//${url.host}/api/agent-cost?action=log`;
    fetch(costEndpoint, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": req.headers.get("x-abil-admin") || "" },
      body: JSON.stringify({ provider: effectiveProvider, model: modelId, prompt_tokens: Math.ceil(promptLen / 4), completion_tokens: Math.ceil(compLen / 4), endpoint: "agent-chat", brand }),
    }).catch(() => {              });
  } catch {              }

  return new Response(JSON.stringify({ ok: true, provider: effectiveProvider, reply: parsed.reply, action: parsed.action ?? null }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
}
