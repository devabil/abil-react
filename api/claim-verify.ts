/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                                  
                                                                                                       
                                                                                                               
                                                                                                          
                                                                            
  
                                                                           
                                                                               
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 60 };
const ADMIN = process.env.META_ADMIN_KEY || "";

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

                                                                                                          
                                                                                                        
                                                             
const PHYSICAL = /\b(fachada|montra|vitrine|devanture|fa[çc]ade|loja f[íi]sica|boutique physique|magasin physique|placa|sinal[ée]tica|enseigne|d[ée]cor(?:ation)?|decora[çc][ãa]o|balc[ãa]o|comptoir|interior da loja|ambiente da loja|cheiro|atendimento presencial|accueil en boutique|na rua|do lado de fora)\b/i;
const LOGO_VERDICT = /\b((o\s+(teu|seu|vosso)|votre|ton)\s+log[oó]|log[oó]\s+(gen[ée]ric|g[ée]n[ée]rique|sem personalidade|sans personnalit[ée]|de gerador|fraco|faible|datado|d[ée]pass[ée]|amador|amateur)|log[oó]\s+(carece|não tem|nao tem|manque))/i;
const NEG_VERDICT = /\b((a\s+tua|a\s+vossa|a\s+sua|votre)\s+marca\s+[ée]\s+gen[ée]ric|votre\s+marque\s+est\s+g[ée]n[ée]rique|[ée]s\s+invis[íi]vel|s[ãa]o\s+invis[íi]vel|marca\s+invis[íi]vel|marque\s+invisible|sem personalidade|sans personnalit[ée]|igual\s+[àa]s?\s+(outras|demais)|semelhante\s+a\s+tantas|comme\s+toutes\s+les\s+autres|perd[ei]s?\s+no\s+meio)/i;
const FAKE_PROOF = /\b(pr[ée]mio|prix remport\w*|award|galard|laur[ée]a\w*|prim[ée]|vencedor de|l[íi]der de mercado|leader du march[ée]|n[ºo.]\s?1\b|#1\b|num[ée]ro un|\d{2,4}\s*(clientes|clients|projetos|projectos|projets|anos de|ans de|filiais|filiales|lojas|magasins|pa[íi]ses|pays))\b/i;
const HARD_PATTERNS: { re: RegExp; tag: string }[] = [
  { re: PHYSICAL, tag: "fisico_nao_visto" }, { re: LOGO_VERDICT, tag: "veredicto_logo" },
  { re: NEG_VERDICT, tag: "veredicto_negativo" }, { re: FAKE_PROOF, tag: "prova_inventada" },
];

function splitSentences(t: string): string[] { return String(t || "").split(/(?<=[.!?…])\s+/).filter(Boolean); }

                                                                                                         
function hardScrub(text: string, factsLc: string): { clean: string; removed: string[] } {
  const removed: string[] = [];
  const kept = splitSentences(text).filter((s) => {
    for (const { re } of HARD_PATTERNS) {
      const m = s.match(re);
      if (m && !factsLc.includes(String(m[0]).toLowerCase())) { removed.push(s.trim()); return false; }
    }
    return true;
  });
  return { clean: kept.join(" ").replace(/\s*[\u2013\u2014]\s*/g, ", ").replace(/\s{2,}/g, " ").trim(), removed };
}

                                                                                                                 
async function aiVerify(blocks: Record<string, string>, facts: string, lang: string): Promise<{ blocks: Record<string, string>; removed: string[] } | null> {
  const KEY = process.env.OPENAI_API_KEY || "";
  if (!KEY) return null;
  const sys = `You are a STRICT fact-checker protecting a cold-prospecting page from fabrication. The author (a creative studio) ONLY observed the prospect's WEBSITE and PUBLIC Google data (rating, number of reviews, category, review texts). The author did NOT see the physical store, facade, window/vitrine, signage, printed logo, decor, or staff.
THE ONLY REAL FACTS (anything stated as observed MUST be supported by these):
${(facts || "(none)").slice(0, 3500)}

You receive copy blocks (JSON). Your ONLY job is to PRUNE: remove or minimally rewrite any sentence that
(a) asserts/implies anything about the physical store/facade/window/signage/printed-logo/decor/staff;
(b) states a negative verdict not in the facts (generic, invisible, lacks personality, looks like the others) as if observed;
(c) cites awards, clients, partnerships, numbers, founder names or percentages NOT present in the facts;
(d) claims to have analyzed/seen something not in the facts.
KEEP forward-looking proposal language ("the opportunity is", "what we would do", "we can build") as long as it does NOT assert a false current-state fact. NEVER add new claims. Keep the language "${lang}". Return ONLY JSON: {"blocks":{"<key>":"pruned text"},"removed":["each removed/rewritten claim", ...]}. Every input key MUST appear in blocks.`;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0, max_tokens: 2200, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: JSON.stringify({ blocks }).slice(0, 12000) }] }),
    });
    if (!r.ok) return null;
    const d: any = await r.json();
    const p = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    const outBlocks: Record<string, string> = {};
    for (const k of Object.keys(blocks)) outBlocks[k] = typeof p.blocks?.[k] === "string" ? p.blocks[k] : blocks[k];
    return { blocks: outBlocks, removed: Array.isArray(p.removed) ? p.removed.map((x: any) => String(x)).slice(0, 40) : [] };
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  const b: any = req.body || {};
  const blocksIn: Record<string, string> = (b.blocks && typeof b.blocks === "object") ? b.blocks : {};
  const facts = String(b.facts || "");
  const lang = String(b.lang || "fr").slice(0, 5);
  const factsLc = facts.toLowerCase();
  const keys = Object.keys(blocksIn);
  if (!keys.length) return res.status(400).json({ error: "no_blocks" });

                                                                              
  const afterHard: Record<string, string> = {}; const removedHard: string[] = [];
  for (const k of keys) { const r = hardScrub(String(blocksIn[k] || ""), factsLc); afterHard[k] = r.clean; removedHard.push(...r.removed); }

                                                                                                                           
  const ai = await aiVerify(afterHard, facts, lang);
  const finalBlocks = ai ? ai.blocks : afterHard;
  const removed = [...removedHard, ...((ai && ai.removed) || [])];

                                                                                               
                                                                                                                        
  if (ai) {
    try {
      const host = String(req.headers.host || "");
      const ghdr = req.headers["x-abil-admin"]; const tok = Array.isArray(ghdr) ? ghdr[0] : (ghdr || "");
      const ac = new AbortController(); const tt = setTimeout(() => ac.abort(), 3000);
      if (host) await fetch(`https://${host}/api/agent-cost?action=log`, {
        method: "POST", signal: ac.signal,
        headers: { "Content-Type": "application/json", "x-abil-admin": String(tok) },
        body: JSON.stringify({ provider: "openai", model: "gpt-4o-mini", prompt_tokens: Math.ceil((facts.length + JSON.stringify(afterHard).length) / 4), completion_tokens: Math.ceil(JSON.stringify(ai.blocks).length / 4), endpoint: "claim-verify" }),
      }).catch(() => {});
      clearTimeout(tt);
    } catch {            }
  }

                                                                                                            
                                                                                                               
  const totalIn = keys.reduce((n, k) => n + String(blocksIn[k] || "").length, 0) || 1;
  const totalOut = keys.reduce((n, k) => n + String(finalBlocks[k] || "").length, 0);
  const shrink = 1 - totalOut / totalIn;
  const emptiedAnchor = keys.some((k) => /verdict|analise|quem|who|priority/i.test(k) && String(blocksIn[k] || "").trim() && !String(finalBlocks[k] || "").trim());
  const blocked = removed.length >= 6 || shrink > 0.45 || emptiedAnchor;
  const reason = blocked ? (emptiedAnchor ? "anchor_emptied" : shrink > 0.45 ? "too_much_removed" : "many_claims_removed") : "";

  return res.status(200).json({ ok: true, blocks: finalBlocks, removed, blocked, reason, aiUsed: !!ai });
}
