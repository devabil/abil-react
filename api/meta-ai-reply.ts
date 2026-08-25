/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                            
                                                                                                            
                                                               
                                                                                             
                                                
                                                                                                      
                                                                                                     
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };
const INBOX_PREFIX = "meta/inbox/";
const RULES_PREFIX = "meta/rules/";
const CFG_PREFIX = "config/";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
const ADMIN = process.env.META_ADMIN_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
let _key: Buffer | null = null;
function aesKey(): Buffer { if (!ENC_PW) throw new Error("enc_locked"); if (!_key) _key = crypto.scryptSync(ENC_PW, "abil_meta_salt_v1", 32); return _key; }
function decrypt(b: string): string { const [v, ivb, tagb, encb] = b.split("."); if (v !== "v1") throw new Error("bad_cipher"); const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), Buffer.from(ivb, "base64")); d.setAuthTag(Buffer.from(tagb, "base64")); return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8"); }
async function readText(key: string): Promise<string | null> { if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  } } try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.text() : null; } catch { return null; } }
function safeTenant(id: string): string { return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64); }
interface InboxMsg { id: string; from: string; name?: string; body: string; direction: "in" | "out"; ts: string }
async function getInbox(t: string): Promise<InboxMsg[]> { const id = safeTenant(t); if (!id) return []; const e = await readText(`${INBOX_PREFIX}${id}.enc`); if (!e) return []; try { return JSON.parse(decrypt(e)); } catch { return []; } }
async function getRules(t: string): Promise<any | null> { const id = safeTenant(t); if (!id) return null; const e = await readText(`${RULES_PREFIX}${id}.enc`); if (!e) return null; try { return JSON.parse(decrypt(e)); } catch { return null; } }
async function getClientConfig(t: string): Promise<any | null> { const id = safeTenant(t); if (!id) return null; const e = await readText(`${CFG_PREFIX}${id}.enc`); if (!e) return null; try { return JSON.parse(decrypt(e)); } catch { return null; } }
                                                                                                            
function personaBlock(cfg: any): string {
  if (!cfg || typeof cfg !== "object") return "";
  const parts: string[] = [];
  const bp = cfg.brandPersona;
  if (bp) {
    if (bp.title) parts.push(`MARCA: ${bp.title}`);
    if (bp.tonality) parts.push(`Tom: ${String(bp.tonality).slice(0, 400)}`);
    if (bp.avoid) parts.push(`Evitar: ${String(bp.avoid).slice(0, 250)}`);
    if (bp.keywords) parts.push(`Palavras-chave: ${String(bp.keywords).slice(0, 250)}`);
    if (Array.isArray(bp.doList) && bp.doList.length) parts.push(`Fazer: ${bp.doList.join("; ").slice(0, 250)}`);
    if (Array.isArray(bp.dontList) && bp.dontList.length) parts.push(`Nao fazer: ${bp.dontList.join("; ").slice(0, 250)}`);
    if (bp.prompt) parts.push(`Essencia: ${String(bp.prompt).slice(0, 600)}`);
  }
  const by = cfg.buyerPersona || (Array.isArray(cfg.buyerPersonas) ? cfg.buyerPersonas[0] : null);
  if (by) { parts.push(`\nCLIENTE-ALVO (buyer persona): ${by.title || by.name || ""}`); if (by.prompt) parts.push(String(by.prompt).slice(0, 700)); }
  if (Array.isArray(cfg.knowledge) && cfg.knowledge.length) parts.push(`\nCONHECIMENTO: ${cfg.knowledge.join(" · ").slice(0, 500)}`);
  return parts.join("\n").slice(0, 2800);
}
                                                                                  
function brandContext(cfg: any, brandVoiceOverride: string): string {
  const persona = personaBlock(cfg);
  const ov = String(brandVoiceOverride || "").trim();
  if (persona && ov) return `${persona}\n\nNOTA EXTRA (canal WhatsApp): ${ov}`;
  if (persona) return persona;
  if (ov) return ov;
  return "A helpful, warm, professional small business.";
}
function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

function systemPrompt(brandVoice: string): string {
  const bv = (brandVoice && brandVoice.trim()) ? brandVoice.trim() : "A helpful, warm, professional small business.";
  return `You are the customer-care assistant answering on WhatsApp ON BEHALF OF the brand described below. You write the brand's next reply to a customer.

BRAND VOICE & FACTS (use ONLY what is here; never invent prices, dates, availability, stock or promises that are not stated):
${bv}

RULES:
- Reply in the SAME language as the customer's last message.
- Keep it short and natural for WhatsApp: 1 to 4 short sentences. Warm, human, helpful, never robotic.
- Never use an em dash; use commas, parentheses or periods.
- If you do not have a fact, do NOT invent it: say you will confirm and come back, or ask a short clarifying question.
- Do NOT invent what the brand does, sells, offers or specialises in beyond what the brand voice above states. If unsure whether they offer something, say you will confirm and come back.
- No corporate clichés, no empty superlatives.
- Output ONLY the reply text (no quotes, no labels, no signature).`;
}

async function callOpenAI(model: string, system: string, user: string): Promise<string | null> {
  const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` }, body: JSON.stringify({ model, temperature: 0.6, max_tokens: 400, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
    clearTimeout(tid); if (!r.ok) return null; const d: any = await r.json(); return d?.choices?.[0]?.message?.content?.trim() || null;
  } catch { clearTimeout(tid); return null; }
}
async function callAnthropic(model: string, system: string, user: string): Promise<string | null> {
  const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 500, temperature: 0.6, system, messages: [{ role: "user", content: user }] }) });
    clearTimeout(tid); if (!r.ok) return null; const d: any = await r.json(); return d?.content?.[0]?.text?.trim() || null;
  } catch { clearTimeout(tid); return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ENC_PW) return res.status(503).json({ error: "server not configured (ABIL_ADMIN_AUTH_SECRET missing)" });
  if (!ADMIN) return res.status(503).json({ error: "admin key not configured" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  if (!OPENAI_KEY && !ANTHROPIC_KEY) return res.status(503).json({ error: "no_ai_key (OPENAI_API_KEY / ANTHROPIC_API_KEY missing)" });

  const b = (req.body || {}) as { tenantId?: string; to?: string; previewText?: string; brandVoice?: string; model?: string };
  const tenantId = safeTenant(String(b.tenantId || ""));
  if (!tenantId) return res.status(400).json({ error: "missing_tenant" });
  const rules = await getRules(tenantId);
                                                                                              
  const brandVoice = (typeof b.brandVoice === "string" && b.brandVoice.trim()) ? String(b.brandVoice).slice(0, 2000) : String(rules?.ai?.brandVoice || "");
                                                                                      
  const cfg = await getClientConfig(tenantId);
  const ctx = brandContext(cfg, brandVoice);

                         
  let convo: { who: string; text: string }[];
  const previewText = String(b.previewText || "").trim();
  if (previewText) {
    convo = [{ who: "customer", text: previewText.slice(0, 1000) }];
  } else {
    const to = String(b.to || "").replace(/[^\d]/g, "");
    if (!to) return res.status(400).json({ error: "missing_to_or_previewText" });
    const inbox = await getInbox(tenantId);
    const msgs = inbox.filter((m) => m.from === to).slice(-12);
    if (!msgs.length) return res.status(409).json({ error: "no_conversation_for_contact" });
    convo = msgs.map((m) => ({ who: m.direction === "out" ? "us (the brand)" : "customer", text: m.body }));
  }
  const user = `Conversation so far (most recent last):\n${convo.map((c) => `[${c.who}] ${c.text}`).join("\n")}\n\nWrite the brand's next reply to the customer.`;

  const model = String(b.model || "gpt-4o");                                                          
  const useAnthropic = model.startsWith("claude") && !!ANTHROPIC_KEY;
  let raw: string | null = null;
  if (useAnthropic) raw = await callAnthropic(model, systemPrompt(ctx), user);
  else if (OPENAI_KEY) raw = await callOpenAI(model.startsWith("claude") ? "gpt-4o" : model, systemPrompt(ctx), user);
  else if (ANTHROPIC_KEY) raw = await callAnthropic("claude-haiku-4-5-20251001", systemPrompt(ctx), user);
  if (!raw) return res.status(502).json({ error: "ai_failed" });
  const reply = raw.replace(/\u2014/g, ",").replace(/^["'“”]+|["'“”]+$/g, "").trim().slice(0, 1200);
  return res.status(200).json({ ok: true, reply, hasBrandVoice: !!brandVoice.trim(), usedPersona: !!personaBlock(cfg) });
}
