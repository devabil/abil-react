/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                       
                                                
                                                                                                              
                                                                                                             
                                                                                                             
                                                                                                 
                                                                                         
                                                                               
  
                                                                                                                 
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import dns from "node:dns/promises";

export const config = { runtime: "nodejs", maxDuration: 30 };
const ADMIN = process.env.META_ADMIN_KEY || "";
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "";
const BASE_URL = process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app";
const UA = `Mozilla/5.0 (compatible; AbilBot/1.0; +${BASE_URL})`;

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

function domainOf(input: string): string {
  let s = String(input || "").trim().toLowerCase();
  const at = s.indexOf("@"); if (at >= 0) s = s.slice(at + 1);
  s = s.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "").trim();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(s) ? s : "";
}

async function fetchT(input: string, opts: any = {}, ms = 6000): Promise<Response> {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(input, { ...opts, signal: ctrl.signal }); } finally { clearTimeout(t); }
}

                                                                                                                 
function extractEmails(html: string): string[] {
  const out = new Set<string>();
  const add = (e: string) => { const x = String(e || "").toLowerCase().trim().replace(/^mailto:/, ""); if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(x)) out.add(x); };
  for (const m of html.matchAll(/mailto:([^"'?>\s]+)/gi)) { try { add(decodeURIComponent(m[1])); } catch { add(m[1]); } }
  for (const m of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) add(m[0]);
  const deob = html.replace(/\s*[([]\s*at\s*[)\]]\s*|\s+\(?at\)?\s+/gi, "@").replace(/\s*[([]\s*dot\s*[)\]]\s*|\s+\(?dot\)?\s+/gi, ".");
  for (const m of deob.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) add(m[0]);
  return [...out].filter((e) => !/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(e) && !/(sentry|wixpress|godaddy|squarespace|@example\.|yourdomain|your-domain|domain\.com|email\.com|placeholder|no-?reply|noreply)/i.test(e));
}

                                                                                                            
async function scrapeSiteEmails(website: string, domain: string): Promise<{ email: string; source: "site" } | null> {
  let origin = "";
  try { origin = new URL(website.startsWith("http") ? website : `https://${domain}`).origin; } catch { try { origin = new URL(`https://${domain}`).origin; } catch { return null; } }
  const paths = ["/", "/contact", "/contacto", "/contactos", "/about", "/sobre"];
  const urls = paths.map((p) => { try { return new URL(p, origin + "/").toString(); } catch { return ""; } }).filter(Boolean);
  const htmls = await Promise.all(urls.map(async (u) => { try { const r = await fetchT(u, { headers: { "user-agent": UA } }, 6000); if (!r.ok) return ""; return (await r.text()).slice(0, 250000); } catch { return ""; } }));
  const emails = extractEmails(htmls.join("  "));
  if (!emails.length) return null;
  const same = emails.filter((e) => e.endsWith("@" + domain));
  const pool = same.length ? same : emails;
  const generic = pool.find((e) => /^(info|hello|geral|contact|contacto|mail|email|hi|ola|olá|comercial|sales|vendas|booking|reservas|hallo|bonjour)@/i.test(e));
  return { email: generic || pool[0], source: "site" };
}

                                                                                                  
async function domainHasMx(domain: string): Promise<boolean> {
  try { const mx = await dns.resolveMx(domain); return Array.isArray(mx) && mx.length > 0; } catch { return false; }
}

                                                                     
async function hunterFind(domain: string): Promise<{ email: string; source: "hunter"; score: number | null } | null> {
  if (!HUNTER_API_KEY) return null;
  try {
    const r = await fetchT(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${HUNTER_API_KEY}`, {}, 12000);
    if (!r.ok) return null;
    const d: any = await r.json().catch(() => ({}));
    const emails: any[] = Array.isArray(d?.data?.emails) ? d.data.emails : [];
    if (!emails.length) return null;
    const generic = emails.filter((e) => e.type === "generic").sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const byConf = [...emails].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const best = generic[0] || byConf[0];
    return best?.value ? { email: String(best.value).toLowerCase(), source: "hunter", score: best.confidence ?? null } : null;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  const b: any = req.body || {};
  const domain = domainOf(b.domain || b.website || "");
  if (!domain) return res.status(400).json({ ok: false, reason: "bad_domain" });
  const website = String(b.website || "").trim() || `https://${domain}`;
  try {
                                                                                               
    let result: { email: string; source: string; score?: number | null; note?: string } | null = await scrapeSiteEmails(website, domain);
    if (!result && await domainHasMx(domain)) result = { email: `info@${domain}`, source: "pattern", note: "padrão genérico (o domínio recebe email); confirmar antes de enviar" };
    if (!result) result = await hunterFind(domain);
    if (!result) return res.status(200).json({ ok: false, reason: "no_email_found", domain });
                                                                                                                            
                                                                                                              
    const role = /^(info|contact|contacto|geral|hello|ola|sales|comercial|noreply|no-reply|admin|support|suporte)@/i.test(String(result.email || ""));
    const confidence = result.source === "site" ? (role ? "media" : "alta") : (result.source === "hunter" ? (((result.score ?? 0) >= 80) ? "alta" : "media") : "baixa");
    return res.status(200).json({ ok: true, email: result.email, source: result.source, confidence, role, score: result.score ?? null, note: result.note || undefined, domain });
  } catch {
    return res.status(200).json({ ok: false, reason: "error", domain });
  }
}
