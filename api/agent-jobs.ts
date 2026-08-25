   
                                                              
  
                                                                                    
                                                                                  
                                                                                  
                                            
  
                                                                                  
                                                                                        
                                                                                
                                                                                 
                                                                                     
  
                                                      
  
             
                                                                                  
                                                                       
                                                                                                        
                                                                                    
  
                                                               
  
                                                                           
                                                                             
                                                                                     
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 60 };

const JOBS_PREFIX = "store/jobs/";
const BLOB_PUBLIC_BASE = (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";
const ADMIN_PW = (typeof process !== "undefined" ? process.env : ({} as any))?.ABIL_ADMIN_AUTH_SECRET || "";

const DEFAULT_BLOG_EDITORIAL_PROMPT = `Todo texto gerado deve ter no minimo 1000 palavras sobre o tema indicado, com foco em marketing 360, publicidade, branding, social media e producao de conteudo audiovisual, incluindo formatos verticais e horizontais.

SEO: usar palavras-chave de cauda longa de forma natural.
AEO: incluir respostas diretas para perguntas comuns do publico.
GEO: usar vocabulario rico, referencias, tendencias e contexto historico quando fizer sentido.
Estrutura: titulo com no maximo 65 caracteres, subtitulos em sentence case, palavra-chave principal no primeiro paragrafo e em pelo menos um H2, FAQ final e bloco tecnico final.
Evitar travessoes, cliches, frases genericas com cara de IA, promessas exageradas e linguagem comercial demais.

Bloco tecnico obrigatorio:
Main keyword:
5 tags:
Title tag:
AEO summary:
Meta description:
URL slug:`;

function blogImagePrompts(topic: string, imagePrompt: string): string[] {
  return [0, 1, 2, 3].map((i) => [
    `Editorial illustrative image ${i + 1} of 4 for a long-form blog article.`,
    `Article topic: ${topic}.`,
    "Premium 16:9 landscape image aligned with the site's design system and photography direction.",
    "No text, logos, UI, watermarks or generic stock-photo cliches.",
    imagePrompt ? `Site image prompt: ${imagePrompt}` : "",
  ].filter(Boolean).join(" "));
}

function buildBlogRichPrompt(args: { topic: string; tone: string; keywords: string[]; editorialPrompt: string; imagePrompt: string }): string {
  const kwLine = args.keywords.length > 0 ? `Palavras-chave a integrar: ${args.keywords.join(", ")}.` : "Sem palavras-chave manuais adicionais.";
  const imagePromptLine = args.imagePrompt ? `Prompt de imagem do site: ${args.imagePrompt}` : "Usa o prompt de imagem do site quando ele for enviado no contexto.";
  return `Escreve um artigo de blog completo e original sobre o tema: "${args.topic}".

Tom editorial: ${args.tone}.
${kwLine}

Este prompt e complementar. Usa obrigatoriamente tambem brand persona, buyer personas, tom de voz, agente de IA, design system, direcao de fotografia e prompt especifico de imagem enviados no contexto do dashboard.

Prompt editorial complementar:
${args.editorialPrompt}

O artigo precisa prever 4 imagens ilustrativas alinhadas ao design system e direcao de fotografia do site.
${imagePromptLine}

No CORPO, posiciona obrigatoriamente os marcadores [[IMG:0]], [[IMG:1]], [[IMG:2]] e [[IMG:3]] em quatro pontos naturais do texto.

Devolve exatamente neste formato:
TITULO: <titulo com no maximo 65 caracteres>
RESUMO: <2 frases de resumo>
CORPO:
<artigo completo com no minimo 1000 palavras, FAQ final e bloco tecnico final>`;
}

function adminOk(req: VercelRequest): boolean {
  if (!ADMIN_PW) return false;
  const h = req.headers["x-abil-admin"];
  const tok = Array.isArray(h) ? h[0] : (h as string | undefined);
  if (!tok) return false;
  const [expS, sig] = tok.split(".");
  const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}

function signAdminToken(): string {
  const exp = Date.now() + 5 * 60 * 1000;
  const sig = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}

function internalHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-abil-admin": signAdminToken() };
}

type JobStatus = "queued" | "running" | "done" | "error";
type Job = {
  id: string;
  type: string;
  status: JobStatus;
  params: Record<string, unknown>;
  brand?: string;
  result?: unknown;
  error?: string;
  progress?: { phase: string; pct: number };
  createdAt: string;
  updatedAt: string;
};

async function readJob(id: string): Promise<Job | null> {
  const key = `${JOBS_PREFIX}${id}.json`;
  let raw: string | null = null;
  if (BLOB_PUBLIC_BASE) {
    try {
      const r = await fetch(`${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${key}?cb=${Date.now()}`, { cache: "no-store" });
      if (r.status === 404) return null;
      if (r.ok) raw = await r.text();
    } catch {  }
  }
  if (raw === null) {
    const b = await list({ prefix: key, limit: 1 });
    if (b.blobs.length === 0) return null;
    const r = await fetch(b.blobs[0].url, { cache: "no-store" });
    if (!r.ok) return null;
    raw = await r.text();
  }
  try { return JSON.parse(raw); } catch { return null; }
}

async function writeJob(job: Job): Promise<void> {
  job.updatedAt = new Date().toISOString();
  await put(`${JOBS_PREFIX}${job.id}.json`, JSON.stringify(job), {
    access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true,
  });
}

                                                                        
async function runBlogRich(job: Job, baseUrl: string): Promise<unknown> {
  const topic = String(job.params.topic || "");
  const tone = String(job.params.tone || "editorial");
  const lang = String(job.params.lang || "pt");
  const keywords = Array.isArray(job.params.keywords) ? job.params.keywords.map((k) => String(k)).filter(Boolean) : [];
  const editorialPromptRaw = String(job.params.editorialPrompt || job.params.blogEditorialPrompt || DEFAULT_BLOG_EDITORIAL_PROMPT).trim();
  const editorialPrompt = (editorialPromptRaw || DEFAULT_BLOG_EDITORIAL_PROMPT).slice(0, 7000);
  const imagePrompt = String(job.params.imagePrompt || job.params.siteImagePrompt || "").trim().slice(0, 1500);
                                                                   
  job.progress = { phase: "writing", pct: 30 }; await writeJob(job);
  const persona = job.params.persona && typeof job.params.persona === "object" && !Array.isArray(job.params.persona) ? job.params.persona as Record<string, unknown> : {};
  const r = await fetch(`${baseUrl}/api/regenerate-text`, {
    method: "POST", headers: internalHeaders(),
    body: JSON.stringify({ currentText: "", userPrompt: buildBlogRichPrompt({ topic, tone, keywords, editorialPrompt, imagePrompt }), maxLength: 10000, path: "blog.article", lang, ...persona }),
  });
  const d = await r.json().catch(() => null);
  const body = String(d?.text || "").trim();
  if (!body) throw new Error("regenerate-text vazio");
  job.progress = { phase: "finalizing", pct: 80 }; await writeJob(job);
  const titleMatch = body.match(/T[ÍI]TULO:\s*(.+?)(?:\n|$)/i);
  const excerptMatch = body.match(/RESUMO:\s*(.+?)(?:\n|$)/i);
  const bodyMatch = body.match(/CORPO:?\s*\n?([\s\S]*)/i);
  const articleBody = bodyMatch ? bodyMatch[1].trim() : body;
  const lines = articleBody.split("\n").filter(Boolean);
  const title = (titleMatch ? titleMatch[1] : lines[0])?.replace(/^#+\s*/, "").slice(0, 65) || topic.slice(0, 65);
  const excerpt = (excerptMatch ? excerptMatch[1] : lines.slice(1).join(" ")).slice(0, 220);
  return { title, excerpt, body: articleBody, tone, keywords, lang, imagePrompts: blogImagePrompts(topic, imagePrompt) };
}

async function runQuoteFull(job: Job, baseUrl: string): Promise<unknown> {
  const text = String(job.params.text || "");
  job.progress = { phase: "parsing", pct: 40 }; await writeJob(job);
  const r = await fetch(`${baseUrl}/api/parse-request`, {
    method: "POST", headers: internalHeaders(),
    body: JSON.stringify({ text }),
  });
  const d = await r.json().catch(() => null);
  if (!d?.briefing) throw new Error("parse-request falhou");
  job.progress = { phase: "done", pct: 100 }; await writeJob(job);
                                                                                               
  return { briefing: d.briefing };
}

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}
function readBody(req: VercelRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") { try { resolve(JSON.parse(req.body)); } catch (e) { reject(e); } }
      else resolve(req.body);
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (c: string) => { buf += c; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : null); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function qs(req: VercelRequest, k: string): string | null {
  const v = req.query[k];
  return typeof v === "string" ? v : Array.isArray(v) && v.length ? v[0] : null;
}
function uid(): string { return "job-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const action = qs(req, "action");

    if (method === "POST" && action === "create") {
      const body = (await readBody(req)) as any;
      const type = String(body?.type || "");
      if (!["blog_rich", "quote_full"].includes(type)) { res.status(400).json({ error: "unknown job type" }); return; }
      const job: Job = {
        id: uid(), type, status: "running", params: body?.params || {}, brand: body?.brand ? String(body.brand) : undefined,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), progress: { phase: "queued", pct: 0 },
      };
      await writeJob(job);
                                                                                
                                                 
      const proto = (req.headers["x-forwarded-proto"] as string) || "https";
      const host = req.headers.host;
      const baseUrl = `${proto}://${host}`;
      try {
        const result = type === "blog_rich" ? await runBlogRich(job, baseUrl) : await runQuoteFull(job, baseUrl);
        job.status = "done"; job.result = result; job.progress = { phase: "done", pct: 100 };
        await writeJob(job);
      } catch (e: any) {
        job.status = "error"; job.error = String(e?.message || e).slice(0, 300);
        await writeJob(job);
      }
      res.status(200).json({ ok: true, jobId: job.id, status: job.status, result: job.result, error: job.error });
      return;
    }

    if (method === "GET" && qs(req, "id")) {
      const job = await readJob(String(qs(req, "id")));
      if (!job) { res.status(404).json({ error: "job not found" }); return; }
      res.status(200).json({ ok: true, job });
      return;
    }

    if (method === "GET" && qs(req, "list") === "1") {
      const b = await list({ prefix: JOBS_PREFIX, limit: 100 });
      const brand = qs(req, "brand");
      const jobs: Job[] = [];
      for (const blob of b.blobs.slice(0, 40)) {
        try { const r = await fetch(blob.url, { cache: "no-store" }); if (r.ok) { const j = JSON.parse(await r.text()); if (!brand || j.brand === brand) jobs.push(j); } } catch {            }
      }
      jobs.sort((a, b2) => new Date(b2.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.status(200).json({ ok: true, jobs: jobs.slice(0, 20).map((j) => ({ id: j.id, type: j.type, status: j.status, createdAt: j.createdAt, progress: j.progress })) });
      return;
    }

    res.status(400).json({ error: "unknown action; POST ?action=create | GET ?id=X | GET ?list=1" });
  } catch (e) {
    console.error("[api/agent-jobs] error:", e);
    res.status(500).json({ error: String((e as Error).message || e) });
  }
}
