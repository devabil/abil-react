   
                                                                         
                                                    
  
                                                                           
                                                                               
                                  
  
             
                                                                                                          
                                                      
                                                                                   
                                                                      
                                                        
                                                                   
  
                                                                      
  
                                       
                                             
                                              
                                               
  
                                                                             
                                                                           
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const LEDGER_KEY = "store/agent-cost-ledger.jsonl";
const BLOB_PUBLIC_BASE = (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";
const ADMIN_PW = (typeof process !== "undefined" ? process.env : ({} as any))?.ABIL_ADMIN_AUTH_SECRET || "";

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

                                                              
                                                                        
const PRICING: Record<string, { in: number; out: number }> = {
           
  "gpt-4o-mini": { in: 0.15, out: 0.60 },
  "gpt-4o": { in: 2.50, out: 10.00 },
  "gpt-4-turbo": { in: 10.00, out: 30.00 },
  "text-embedding-3-small": { in: 0.02, out: 0 },
  "text-embedding-3-large": { in: 0.13, out: 0 },
  "tts-1": { in: 15.00, out: 0 },
  "tts-1-hd": { in: 30.00, out: 0 },
              
  "claude-haiku-4-5": { in: 0.80, out: 4.00 },
  "claude-haiku-4-5-20251001": { in: 0.80, out: 4.00 },
  "claude-sonnet-4-5": { in: 3.00, out: 15.00 },
  "claude-sonnet-4-6": { in: 3.00, out: 15.00 },
  "claude-opus-4-7": { in: 15.00, out: 75.00 },
  "claude-opus-4-8": { in: 15.00, out: 75.00 },
           
  "gemini-2.5-flash": { in: 0.075, out: 0.30 },
  "gemini-2.5-pro": { in: 1.25, out: 5.00 },
  "gemini-3-flash": { in: 0.075, out: 0.30 },
};

const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
const MAX_HOUR = Number(env.AGENT_COST_MAX_HOUR_USD || 1.00);
const MAX_DAY = Number(env.AGENT_COST_MAX_DAY_USD || 10.00);
const MAX_MONTH = Number(env.AGENT_COST_MAX_MONTH_USD || 200.00);
const KILL_MULT = 1.5;
const DEFAULT_PRICING_SOURCE = "static_default_estimate_2026";

type PricingRate = { in: number; out: number; source: string; estimated: boolean };

function validRate(input: number, output: number): boolean {
  return Number.isFinite(input) && input >= 0 && Number.isFinite(output) && output >= 0;
}

function parsePricingOverrides(raw: string | undefined): Record<string, PricingRate> {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, PricingRate> = {};
    for (const [model, rate] of Object.entries(parsed)) {
      const input = Number(rate?.in ?? rate?.input ?? rate?.input_usd_per_1m);
      const output = Number(rate?.out ?? rate?.output ?? rate?.output_usd_per_1m ?? 0);
      if (model && validRate(input, output)) out[model] = { in: input, out: output, source: "env_override", estimated: false };
    }
    return out;
  } catch {
    return {};
  }
}

const PRICING_OVERRIDES = parsePricingOverrides(env.AGENT_COST_PRICING_JSON);
const UNKNOWN_INPUT_RATE = Number(env.AGENT_COST_UNKNOWN_INPUT_USD_PER_1M || 1.00);
const UNKNOWN_OUTPUT_RATE = Number(env.AGENT_COST_UNKNOWN_OUTPUT_USD_PER_1M || 3.00);

type LedgerEntry = {
  ts: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  cost_estimated?: boolean;
  pricing_source?: string;
  rate_input_usd_per_1m?: number;
  rate_output_usd_per_1m?: number;
  endpoint?: string;
  brand?: string;
};

function pricingMeta() {
  return {
    default_source: DEFAULT_PRICING_SOURCE,
    env_override_models: Object.keys(PRICING_OVERRIDES).sort(),
    unknown_model_fallback: {
      input_usd_per_1m: validRate(UNKNOWN_INPUT_RATE, UNKNOWN_OUTPUT_RATE) ? UNKNOWN_INPUT_RATE : 1.00,
      output_usd_per_1m: validRate(UNKNOWN_INPUT_RATE, UNKNOWN_OUTPUT_RATE) ? UNKNOWN_OUTPUT_RATE : 3.00,
      estimated: true,
    },
  };
}

function priceFor(model: string): PricingRate {
  if (PRICING_OVERRIDES[model]) return PRICING_OVERRIDES[model];
  if (PRICING[model]) return { ...PRICING[model], source: DEFAULT_PRICING_SOURCE, estimated: true };
                
  const overrideKey = Object.keys(PRICING_OVERRIDES).find((p) => model.includes(p) || p.includes(model));
  if (overrideKey) return PRICING_OVERRIDES[overrideKey];
  const k = Object.keys(PRICING).find((p) => model.includes(p) || p.includes(model));
  if (k) return { ...PRICING[k], source: DEFAULT_PRICING_SOURCE, estimated: true };
  const fallbackIn = validRate(UNKNOWN_INPUT_RATE, UNKNOWN_OUTPUT_RATE) ? UNKNOWN_INPUT_RATE : 1.00;
  const fallbackOut = validRate(UNKNOWN_INPUT_RATE, UNKNOWN_OUTPUT_RATE) ? UNKNOWN_OUTPUT_RATE : 3.00;
  return { in: fallbackIn, out: fallbackOut, source: "unknown_model_fallback", estimated: true };
}

function costFor(model: string, pTok: number, cTok: number): { cost: number; rate: PricingRate } {
  const p = priceFor(model);
  return { cost: (pTok / 1_000_000) * p.in + (cTok / 1_000_000) * p.out, rate: p };
}

async function readLedger(): Promise<LedgerEntry[]> {
  let raw: string | null = null;
  if (BLOB_PUBLIC_BASE) {
    try {
      const r = await fetch(`${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${LEDGER_KEY}?cb=${Date.now()}`, { cache: "no-store" });
      if (r.status === 404) return [];
      if (r.ok) raw = await r.text();
    } catch {  }
  }
  if (raw === null) {
    const b = await list({ prefix: LEDGER_KEY, limit: 1 });
    if (b.blobs.length === 0) return [];
    const r = await fetch(b.blobs[0].url, { cache: "no-store" });
    if (!r.ok) return [];
    raw = await r.text();
  }
                                     
  const out: LedgerEntry[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch {  }
  }
  return out;
}

async function appendLedger(entry: LedgerEntry): Promise<void> {
                                                                               
                                                                      
  const existing = await readLedger();
  existing.push(entry);
                                                                      
  const cutoff = Date.now() - 30 * 86400000;
  const trimmed = existing.filter((e) => new Date(e.ts).getTime() > cutoff);
  const jsonl = trimmed.map((e) => JSON.stringify(e)).join("\n") + "\n";
  await put(LEDGER_KEY, jsonl, {
    access: "public", contentType: "text/plain", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true,
  });
}

function windowSums(entries: LedgerEntry[]) {
  const now = Date.now();
  const hourAgo = now - 3600_000;
  const dayAgo = now - 86400_000;
  const monthAgo = now - 30 * 86400_000;
  let h = 0, d = 0, m = 0, hC = 0, dC = 0, mC = 0;
  for (const e of entries) {
    const t = new Date(e.ts).getTime();
    if (t > hourAgo) { h += e.cost_usd; hC++; }
    if (t > dayAgo) { d += e.cost_usd; dC++; }
    if (t > monthAgo) { m += e.cost_usd; mC++; }
  }
  return {
    hour: { spent_usd: round(h), ceiling_usd: MAX_HOUR, headroom_usd: round(MAX_HOUR - h), pct_saturation: round(100 * h / MAX_HOUR), calls: hC, kill_switch: h >= MAX_HOUR * KILL_MULT },
    day:  { spent_usd: round(d), ceiling_usd: MAX_DAY,  headroom_usd: round(MAX_DAY - d),  pct_saturation: round(100 * d / MAX_DAY),  calls: dC, kill_switch: d >= MAX_DAY * KILL_MULT },
    month:{ spent_usd: round(m), ceiling_usd: MAX_MONTH,headroom_usd: round(MAX_MONTH - m),pct_saturation: round(100 * m / MAX_MONTH),calls: mC, kill_switch: m >= MAX_MONTH * KILL_MULT },
  };
}
function round(n: number, dp = 4): number { const f = Math.pow(10, dp); return Math.round(n * f) / f; }

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }

  try {
    const action = qs(req, "action");

    if (method === "POST" && action === "log") {
      const body = (await readBody(req)) as any;
      const provider = String(body?.provider || "unknown");
      const model = String(body?.model || "unknown");
      const pTok = Math.max(0, Number(body?.prompt_tokens || 0));
      const cTok = Math.max(0, Number(body?.completion_tokens || 0));
      const endpoint = body?.endpoint ? String(body.endpoint) : undefined;
      const brand = body?.brand ? String(body.brand) : undefined;
      const priced = costFor(model, pTok, cTok);
      const entry: LedgerEntry = {
        ts: new Date().toISOString(),
        provider,
        model,
        prompt_tokens: pTok,
        completion_tokens: cTok,
        cost_usd: round(priced.cost, 6),
        cost_estimated: priced.rate.estimated,
        pricing_source: priced.rate.source,
        rate_input_usd_per_1m: priced.rate.in,
        rate_output_usd_per_1m: priced.rate.out,
        endpoint,
        brand,
      };
                                                               
      try { await appendLedger(entry); } catch {  }
      res.status(200).json({
        ok: true,
        cost_usd: entry.cost_usd,
        cost_estimated: entry.cost_estimated,
        pricing_source: entry.pricing_source,
        rate: { input_usd_per_1m: entry.rate_input_usd_per_1m, output_usd_per_1m: entry.rate_output_usd_per_1m },
      });
      return;
    }

    if (method === "POST" && action === "check") {
      const body = (await readBody(req).catch(() => null)) as any;
      const estimated = Math.max(0, Number(body?.estimated_cost || 0));
      const entries = await readLedger();
      const w = windowSums(entries);
      const projected_hour = w.hour.spent_usd + estimated;
      const projected_day = w.day.spent_usd + estimated;
      const projected_month = w.month.spent_usd + estimated;
      const blocks: string[] = [];
      if (projected_hour > MAX_HOUR) blocks.push(`hour ceiling ($${MAX_HOUR})`);
      if (projected_day > MAX_DAY) blocks.push(`day ceiling ($${MAX_DAY})`);
      if (projected_month > MAX_MONTH) blocks.push(`month ceiling ($${MAX_MONTH})`);
      const kill = w.hour.kill_switch || w.day.kill_switch || w.month.kill_switch;
      res.status(200).json({ ok: true, allowed: blocks.length === 0 && !kill, reason: kill ? "kill switch tripped" : (blocks[0] || "ok"), kill_switch: kill, window: w });
      return;
    }

    if (method === "GET" && action === "window") {
      const entries = await readLedger();
      res.status(200).json({ ok: true, window: windowSums(entries), max: { hour_usd: MAX_HOUR, day_usd: MAX_DAY, month_usd: MAX_MONTH }, pricing: pricingMeta() });
      return;
    }

    if (method === "GET" && action === "ledger") {
      const limit = Math.min(Math.max(1, Number(qs(req, "limit") || 50)), 500);
      const entries = await readLedger();
      res.status(200).json({ ok: true, count: entries.length, entries: entries.slice(-limit).reverse() });
      return;
    }

    res.status(400).json({ error: "unknown action; ?action=log|check|window|ledger" });
  } catch (e) {
    console.error("[api/agent-cost] error:", e);
    res.status(500).json({ error: String((e as Error).message || e) });
  }
}
