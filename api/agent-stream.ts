   
                                                               
  
                                                                                
                                                                                
                                                                               
                                                                             
                                                                             
                                         
  
               
                                        
                                           
        
                                                
                          
  
                                                                                  
                                                                                  
   

export const config = { runtime: "edge" };

const ALLOWED_ORIGINS = new Set([  
  "https://abil.ch", "https://www.abil.ch", "https://abil-site.vercel.app",
  "http://localhost:5173", "http://localhost:4173", "http://localhost:5180", "http://localhost:5182",
]);
const VERCEL_AUTO_DEPLOY_RE = /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/;
function corsHeaders(origin: string | null): Record<string, string> {
  const ok = !!origin && (ALLOWED_ORIGINS.has(origin) || VERCEL_AUTO_DEPLOY_RE.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-abil-admin",
    "Vary": "Origin",
  };
}

const ACTION_REGISTRY = `AÇÕES disponíveis (escolhe UMA ou null):
null · read_dashboard · open_module{module} · edit_site_text{key,instruction} ·
create_blog_post{topic,tone,keywords} · create_social_post{topic,platform,format} ·
draft_email{to,subject,body} · send_email{to,subject,body} · generate_quote{text} ·
list_pending_drafts{filter} · remember{text,type}

REGRAS: cumprimento → null. send_email só com "envia já/agora". edit_site_text só com key EXACTA da lista.`;

function buildPrompt(_brand: string, personaBlock: string, memoryBlock: string): string {
  const identity = `Copiloto do atelier suíço ABiL. Falas com a equipa da agência.`;
  return `${identity}
És um EXECUTOR: conversas e executas acções reais.
${memoryBlock ? `\nMEMÓRIA:\n${memoryBlock}\n` : ""}
VOZ DA MARCA:
${personaBlock || "(tom profissional e humano)"}

${ACTION_REGISTRY}

FORMATO DE SAÍDA (IMPORTANTE, segue exactamente):
1. Primeiro escreve a tua resposta conversacional (1-3 frases, na língua do utilizador).
2. Depois, numa linha nova, escreve exactamente: ###ACTION###
3. Depois, a acção como JSON numa linha (ex: {"type":"create_blog_post","params":{"topic":"X"},"confirm":"Criar?"}) OU a palavra null.

Exemplo:
Vou criar esse artigo já.
###ACTION###
{"type":"create_blog_post","params":{"topic":"design","tone":"editorial","keywords":[]},"confirm":"Criar artigo sobre design?"}`;
}

function personaToBlock(persona: any): string {
  if (!persona || typeof persona !== "object") return "";
  const parts: string[] = [];
  const bp = persona.brandPersona;
  if (bp) { if (bp.tone) parts.push(`TOM: ${String(bp.tone).slice(0, 240)}`); }
  return parts.join("\n");
}

const ALLOWED_LANGS = new Set(["pt", "fr", "en", "de", "it"]);

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

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } }); }

  const message = String(body?.message || "").slice(0, 4000).trim();
  if (!message) return new Response(JSON.stringify({ error: "message required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS } });
  const lang = ALLOWED_LANGS.has(String(body?.lang || "").toLowerCase().slice(0, 2)) ? String(body.lang).toLowerCase().slice(0, 2) : "pt";
  const brand = String(body?.brand || "abil");

  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });

  const langName = ({ fr: "French", de: "German", en: "English", pt: "Portuguese (European, pt-PT)", it: "Italian" } as any)[lang] || lang;
  const personaBlock = personaToBlock(body?.persona);
  const snapshot = JSON.stringify(body?.snapshot || {}).slice(0, 1500);
  const currentModule = String(body?.currentModule || "").slice(0, 40);
  const editablePaths = Array.isArray(body?.editablePaths)
    ? body.editablePaths.slice(0, 30).map((p: any) => `- ${p.key}: "${String(p.label || "").slice(0, 60)}"`).join("\n").slice(0, 2000) : "";
  const memories: Array<{ type?: string; text?: string }> = Array.isArray(body?.memories) ? body.memories.slice(0, 6) : [];
  const memoryBlock = memories.length ? memories.map((m, i) => `[${i + 1}] (${m.type || "general"}) ${String(m.text || "").slice(0, 200)}`).join("\n") : "";
  const history = Array.isArray(body?.history) ? body.history.slice(-6).map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content || "").slice(0, 1200) })).filter((m: any) => m.content) : [];

  const contextBlock = [`Língua: ${langName}.`, currentModule ? `Módulo: ${currentModule}.` : "", `SNAPSHOT: ${snapshot}`, editablePaths ? `EDITÁVEIS:\n${editablePaths}` : ""].filter(Boolean).join("\n");
  const system = buildPrompt(brand, personaBlock, memoryBlock);
  const messages = [{ role: "system", content: system }, ...history, { role: "user", content: `${contextBlock}\n\n, o operador disse:\n"""${message}"""` }];

                     
  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.4, max_tokens: 800, stream: true, messages }),
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e).slice(0, 200) }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }
  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    return new Response(JSON.stringify({ error: `OpenAI ${upstream.status}: ${t.slice(0, 160)}` }), { status: 502, headers: { "Content-Type": "application/json", ...CORS } });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const DELIM = "###ACTION###";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      let acc = "";                                                           
      let emitted = 0;                                              
      let replyDone = false;                                 
      let actionBuf = "";                                          
      const reader = upstream.body!.getReader();
      let sseBuf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuf += decoder.decode(value, { stream: true });
          const lines = sseBuf.split("\n");
          sseBuf = lines.pop() || "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const payload = t.slice(5).trim();
            if (payload === "[DONE]") continue;
            let delta = "";
            try { delta = JSON.parse(payload)?.choices?.[0]?.delta?.content || ""; } catch { continue; }
            if (!delta) continue;
            if (!replyDone) {
              acc += delta;
              const idx = acc.indexOf(DELIM);
              if (idx === -1) {
                                                                                     
                                                                                          
                const safeEnd = Math.max(emitted, acc.length - (DELIM.length - 1));
                if (safeEnd > emitted) {
                  send({ type: "token", text: acc.slice(emitted, safeEnd) });
                  emitted = safeEnd;
                }
              } else {
                                                                                                  
                if (idx > emitted) { send({ type: "token", text: acc.slice(emitted, idx) }); emitted = idx; }
                replyDone = true;
                actionBuf = acc.slice(idx + DELIM.length);
              }
            } else {
              actionBuf += delta;
            }
          }
        }
                                                                     
        if (!replyDone && acc.length > emitted) { send({ type: "token", text: acc.slice(emitted) }); emitted = acc.length; }
                                          
        let action: any = null;
        const cleanAction = actionBuf.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
        if (cleanAction && cleanAction !== "null") {
          const m = cleanAction.match(/\{[\s\S]*\}/);
          if (m) { try { action = JSON.parse(m[0]); } catch { action = null; } }
        }
        send({ type: "action", action });
        send({ type: "done" });
      } catch (e: any) {
        send({ type: "error", error: String(e?.message || e).slice(0, 160) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "Connection": "keep-alive", ...CORS },
  });
}
