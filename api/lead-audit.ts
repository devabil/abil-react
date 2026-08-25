/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                        
                                                                                                               
                                                                                                          
                                    
                                                                                                               
                                                                                                            
                                                                              
  
                                                                                              
  
                                                                                     
                                                                                                                         
                                                                                                                                   
                                                                                                                             
                                                                                                                 
                                                                  
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 180 };

const ADMIN = process.env.META_ADMIN_KEY || "";
const PSI_KEY = process.env.PAGESPEED_API_KEY || "";                                                         
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || "";                                                            
                                                                                                          
                                                                                                          
                                                                                                            
                                                                                             
const PLACES_TTL_MS = Math.max(1, Number(process.env.PLACES_TTL_DAYS) || 30) * 24 * 60 * 60 * 1000;
                                                                                                          
const BASE_URL = (process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app").replace(/\/$/, "");
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

function qv(req: VercelRequest, n: string): string { const v = req.query[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }

                                                                          
function safeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return null;
    return u.toString();
  } catch { return null; }
}

                                                                                                         
async function fetchT(input: string, opts: any = {}, ms = 15000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(input, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

const UA_BOT = `Mozilla/5.0 (compatible; AbilBot/1.0; +${BASE_URL})`;

                                                                                                           
                                                                                                                      
                                          
function mintAbilToken(): string {
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; if (!PW) return "";
  const exp = Date.now() + 60_000;
  const sig = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}
async function logAiCost(host: string, promptChars: number, compChars: number): Promise<void> {
  try {
    const tok = mintAbilToken(); if (!host || !tok) return;
    await fetchT(`https://${host}/api/agent-cost?action=log`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok },
      body: JSON.stringify({ provider: "openai", model: "gpt-4o-mini", prompt_tokens: Math.ceil(Math.max(0, promptChars) / 4), completion_tokens: Math.ceil(Math.max(0, compChars) / 4), endpoint: "lead-audit" }),
    }, 6000);
  } catch {                                                   }
}

                                                                                     
                                                                                                                           
const INTERIOR_HINTS = ["sobre", "about", "servic", "service", "quem-somos", "empresa", "company", "work", "portfolio", "portfólio", "projetos", "projects", "blog", "solucoes", "solutions", "equipa", "team", "story", "historia"];
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}
async function interiorPagesText(baseUrl: string, maxPages = 2, perMs = 6000): Promise<{ text: string; pages: string[] }> {
  try {
    const base = new URL(baseUrl);
    const sameHost = (u: URL) => u.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "");
    const r = await fetchT(baseUrl, { headers: { "user-agent": UA_BOT } }, perMs);
    if (!r.ok) return { text: "", pages: [] };
    const html = (await r.text()).slice(0, 400_000);
    const hrefs = new Set<string>();
    for (const m of html.matchAll(/href=["']([^"'#\s]+)["']/gi)) {
      const h = m[1].trim();
      if (!h || /^(mailto:|tel:|javascript:|data:)/i.test(h)) continue;
      try { const u = new URL(h, base); if (!sameHost(u)) continue; u.hash = ""; if (u.pathname === "/" || u.pathname === base.pathname) continue; hrefs.add(u.toString()); } catch {                     }
    }
    const score = (u: string): number => { const low = u.toLowerCase(); return INTERIOR_HINTS.reduce((n, h) => n + (low.includes(h) ? 1 : 0), 0); };
    const ranked = [...hrefs].sort((a, b) => score(b) - score(a));
    const hinted = ranked.filter((u) => score(u) > 0);
    const targets = (hinted.length ? hinted : ranked).slice(0, maxPages);
    const texts = await Promise.all(targets.map(async (u) => {
      try { const rr = await fetchT(u, { headers: { "user-agent": UA_BOT } }, perMs); if (!rr.ok) return ""; const h2 = (await rr.text()).slice(0, 200_000); return htmlToText(h2); } catch { return ""; }
    }));
    return { text: texts.filter(Boolean).join("\n\n").slice(0, 6000), pages: targets };
  } catch { return { text: "", pages: [] }; }
}

                                                                                                              
                                                                                                             
                                                                                                           
                                                                                                
async function igProbe(igUrl: string): Promise<{ estado: "lido" | "so-bio" | "inacessivel"; bio: string }> {
  try {
    const r = await fetchT(igUrl, { headers: { "user-agent": UA_BOT } }, 8000);
    if (!r.ok) return { estado: "inacessivel", bio: "" };
    const html = (await r.text()).slice(0, 300_000);
    const bio = ((html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{5,400})/i) || [])[1] || "").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').trim();
    if (bio) return { estado: "so-bio", bio };
    return { estado: "inacessivel", bio: "" };
  } catch { return { estado: "inacessivel", bio: "" }; }
}

                                                                                                                                                                                                                    
                                                                                                                    
                                                                                                                 
                                                                                                                          
                                                                                                                  
                                                                                                      
                                                                                                                 
                                                                                                                 
const GRAPH = "https://graph.facebook.com/v21.0";
const META_ENC_PW = process.env.META_TOKEN_ENC_KEY || process.env.ABIL_ADMIN_AUTH_SECRET || "";
const META_TENANT = process.env.META_TENANT_ID || "abil";                                              
let _metaKey: Buffer | null = null;
function metaAesKey(): Buffer { if (!META_ENC_PW) throw new Error("enc_locked"); if (!_metaKey) _metaKey = crypto.scryptSync(META_ENC_PW, "abil_meta_salt_v1", 32); return _metaKey; }
function metaDecrypt(b: string): string {
  const [v, ivb, tagb, encb] = String(b || "").split(".");
  if (v !== "v1") throw new Error("bad_cipher");
  const d = crypto.createDecipheriv("aes-256-gcm", metaAesKey(), Buffer.from(ivb, "base64"));
  d.setAuthTag(Buffer.from(tagb, "base64"));
  return Buffer.concat([d.update(Buffer.from(encb, "base64")), d.final()]).toString("utf8");
}
                                                                                                                 
async function metaReadText(key: string): Promise<string | null> {
  if (BLOB_PUBLIC_BASE) {
    try { const r = await fetchT(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }, 6000); if (r.ok) return await r.text(); if (r.status === 404) return null; } catch {  }
  }
  try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return null; const r = await fetchT(bl.url, { cache: "no-store" }, 6000); return r.ok ? await r.text() : null; } catch { return null; }
}
type MetaPage = { pageId: string; name: string; pageToken: string; igUserId: string; igUsername: string };
                                                                                                                  
                                                                                                               
async function readMetaPage(tenant: string): Promise<MetaPage | null> {
  if (!META_ENC_PW) return null;
  const id = String(tenant || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  if (!id) return null;
  try {
    const enc = await metaReadText(`meta/connections/${id}.enc`);
    if (!enc) return null;
    const conn: any = JSON.parse(metaDecrypt(enc));
    const pages: any[] = Array.isArray(conn?.facebook?.pages) ? conn.facebook.pages : [];
    const p = pages.find((x) => x && x.igUserId && x.pageToken);
    if (!p) return null;
    return { pageId: String(p.pageId || ""), name: String(p.name || ""), pageToken: String(p.pageToken || ""), igUserId: String(p.igUserId || ""), igUsername: String(p.igUsername || "") };
  } catch { return null; }
}
                                                                                                                 
                                                                                                                         
function igHandleFrom(igUrl: string): string {
  try {
    const u = new URL(igUrl);
    if (!/(^|\.)instagram\.com$/i.test(u.hostname.replace(/^www\./i, ""))) return "";
    const seg = (u.pathname.split("/").filter(Boolean)[0] || "").replace(/^@/, "");
    if (!seg || /^(p|reel|reels|explore|stories|tv|accounts|about|directory)$/i.test(seg)) return "";
    return seg.replace(/[^A-Za-z0-9._]/g, "").slice(0, 60);
  } catch { return ""; }
}
                                                                                                                    
                                                                                                               
                                                                                                           
async function instagramBusinessDiscovery(page: MetaPage, handle: string): Promise<any> {
  const profileUrl = `https://instagram.com/${handle}`;
  try {
    const fields = `business_discovery.username(${handle}){username,followers_count,media_count,media.limit(6){like_count,comments_count,timestamp}}`;
    const params = new URLSearchParams();
    params.set("fields", fields);
    params.set("access_token", page.pageToken);
    const r = await fetchT(`${GRAPH}/${encodeURIComponent(page.igUserId)}?${params.toString()}`, {}, 8000);
    const j: any = await r.json().catch(() => ({}));
    if (j && j.error) {
      return { status: "indisponivel", motivo: String(j.error.message || "erro Graph").slice(0, 240), code: (j.error.code ?? null), source: profileUrl, at: new Date().toISOString() };
    }
    const bd: any = j?.business_discovery;
    if (!bd || typeof bd.followers_count !== "number") {
      return { status: "indisponivel", motivo: "sem business_discovery na resposta", code: null, source: profileUrl, at: new Date().toISOString() };
    }
    const media: any[] = Array.isArray(bd.media?.data) ? bd.media.data : [];
                                                                                                               
                                                                                                       
    let engagementMedio: number | null = null;
    let engagementTaxa: number | null = null;
    if (media.length) {
      const soma = media.reduce((s, m) => s + (Number(m.like_count) || 0) + (Number(m.comments_count) || 0), 0);
      engagementMedio = Math.round((soma / media.length) * 10) / 10;
      if (typeof bd.followers_count === "number" && bd.followers_count > 0) {
        engagementTaxa = Math.round((engagementMedio / bd.followers_count) * 10000) / 100;
      }
    }
    return {
      status: "ok",
      username: String(bd.username || handle),
      followers: bd.followers_count,
      mediaCount: (typeof bd.media_count === "number" ? bd.media_count : null),
      postsAnalisados: media.length,
      engagementMedio,
      engagementTaxa,
      source: profileUrl,
      at: new Date().toISOString(),
    };
  } catch (e: any) {
    return { status: "indisponivel", motivo: String(e?.message || "excecao de rede").slice(0, 240), code: null, source: profileUrl, at: new Date().toISOString() };
  }
}
                                                                                                                    
                                                                                                       
async function metaAdLibrary(page: MetaPage, brand: string, countries: string[]): Promise<any> {
  const source = "https://www.facebook.com/ads/library/";
  try {
    const params = new URLSearchParams();
    params.set("search_terms", brand);
    params.set("ad_reached_countries", JSON.stringify(countries));
    params.set("ad_type", "ALL");
    params.set("fields", "id,ad_delivery_start_time,publisher_platforms,ad_creative_bodies");
    params.set("limit", "5");
    params.set("access_token", page.pageToken);
    const r = await fetchT(`${GRAPH}/ads_archive?${params.toString()}`, {}, 8000);
    const j: any = await r.json().catch(() => ({}));
    if (j && j.error) {
      return { status: "indisponivel", motivo: String(j.error.message || "erro Graph").slice(0, 240), code: (j.error.code ?? null), source, at: new Date().toISOString() };
    }
    const data: any[] = Array.isArray(j?.data) ? j.data : [];
    const samples = data.slice(0, 5).map((a) => ({
      id: String(a.id || ""),
      inicio: String(a.ad_delivery_start_time || ""),
      plataformas: Array.isArray(a.publisher_platforms) ? a.publisher_platforms : [],
      texto: (Array.isArray(a.ad_creative_bodies) && a.ad_creative_bodies[0] ? String(a.ad_creative_bodies[0]) : "").replace(/\s+/g, " ").trim().slice(0, 300),
    }));
    return { status: "ok", count: data.length, samples, countries, source, at: new Date().toISOString() };
  } catch (e: any) {
    return { status: "indisponivel", motivo: String(e?.message || "excecao de rede").slice(0, 240), code: null, source, at: new Date().toISOString() };
  }
}
                                                                                                                     
                                                                                                           
                                                                                                       
async function providerFollowers(handle: string): Promise<{ followers: number; source: string } | null> {
  const provider = String(process.env.SOCIAL_PROVIDER || "").trim();
  const key = String(process.env.SOCIAL_PROVIDER_KEY || "").trim();
  const base = String(process.env.SOCIAL_PROVIDER_BASE || "").replace(/\/$/, "");
  if (!provider || !key || !handle || !base) return null;
  try {
    const r = await fetchT(`${base}?handle=${encodeURIComponent(handle)}`, { headers: { Authorization: `Bearer ${key}` } }, 8000);
    if (!r.ok) return null;
    const j: any = await r.json().catch(() => ({}));
    const f = Number(j?.followers ?? j?.followers_count ?? j?.data?.followers);
    if (!Number.isFinite(f) || f < 0) return null;
    return { followers: Math.round(f), source: `provider:${provider}` };
  } catch { return null; }
}
                                                                                                                     
function adCountries(req: VercelRequest): string[] {
  const raw = String(req.query.country || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(raw)) return [raw];
  return ["CH", "FR"];
}
                                                                                                                
                                                                                                                      
                                                                                                               
async function collectSocialStats(opts: { igUrl: string; brand: string; countries: string[] }): Promise<any | null> {
  const page = await readMetaPage(META_TENANT);
  const handle = igHandleFrom(opts.igUrl || "");
  const [instagram, ads] = await Promise.all([
    (async () => {
      if (!handle) return null;
      const ig: any = page ? await instagramBusinessDiscovery(page, handle) : null;
      if (!ig || ig.status !== "ok") {
        const prov = await providerFollowers(handle);                                                     
        if (prov) return { status: "ok", via: "fornecedor", username: handle, followers: prov.followers, mediaCount: null, postsAnalisados: 0, engagementMedio: null, engagementTaxa: null, source: prov.source, at: new Date().toISOString() };
        return ig || { status: "indisponivel", motivo: page ? "sem dados" : "sem ligacao Meta configurada", code: null, source: `https://instagram.com/${handle}`, at: new Date().toISOString() };
      }
      return { ...ig, via: "business_discovery" };
    })(),
    (page && opts.brand) ? metaAdLibrary(page, opts.brand, opts.countries) : Promise.resolve(null),
  ]);
  const out: any = {};
  if (instagram) out.instagram = instagram;
  if (ads) out.ads = ads;
  return Object.keys(out).length ? out : null;
}

async function pageSpeed(url: string): Promise<any> {
  try {
    const cats = ["performance", "seo", "accessibility", "best-practices"].map((c) => `category=${c}`).join("&");
    const k = PSI_KEY ? `&key=${PSI_KEY}` : "";
    const r = await fetchT(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&${cats}${k}`, {}, 40000);
    if (!r.ok) return { ok: false, status: r.status };
    const d: any = await r.json();
    const cat = d.lighthouseResult?.categories || {};
    const audits = d.lighthouseResult?.audits || {};
    const pct = (x: any) => (x && typeof x.score === "number" ? Math.round(x.score * 100) : null);
                                                                                                           
    const shot = audits["final-screenshot"]?.details?.data || d.lighthouseResult?.fullPageScreenshot?.screenshot?.data || "";
    return {
      ok: true,
      performance: pct(cat.performance),
      seo: pct(cat.seo),
      accessibility: pct(cat.accessibility),
      bestPractices: pct(cat["best-practices"]),
      lcp: audits["largest-contentful-paint"]?.displayValue || null,
      cls: audits["cumulative-layout-shift"]?.displayValue || null,
      screenshot: typeof shot === "string" && shot.startsWith("data:image") ? shot : "",
    };
  } catch { return { ok: false }; }
}

                                                                                                          
                                                                                                           
                                                                                                             
                                      
const WORKER_URL = (process.env.RAIOX_WORKER_URL || "").replace(/\/$/, "");
const WORKER_TOKEN = process.env.RAIOX_WORKER_TOKEN || "";
async function workerSnap(url: string): Promise<any> {
  if (!WORKER_URL || !WORKER_TOKEN) return null;
  try {
    const r = await fetchT(`${WORKER_URL}/snap`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${WORKER_TOKEN}` }, body: JSON.stringify({ url }) }, 60000);
    if (!r.ok) return null;
    const d: any = await r.json();
    return d && d.ok ? d : null;
  } catch { return null; }
}
async function workerLighthouse(url: string): Promise<any> {
  if (!WORKER_URL || !WORKER_TOKEN) return null;
  try {
    const r = await fetchT(`${WORKER_URL}/lighthouse`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${WORKER_TOKEN}` }, body: JSON.stringify({ url }) }, 90000);
    if (!r.ok) return null;
    const d: any = await r.json();
    return d && d.ok ? d : null;
  } catch { return null; }
}

                                                                                                                   
                                                                                                                
                                                                                                                 
                                                                                                                 
                                                                                                               
                                                                                                  
                                                                                                 
                                                                                               
async function uploadDesktopShot(siteUrl: string, shotData: string): Promise<string> {
  try {
    const b64 = shotData.startsWith("data:") ? shotData.slice(shotData.indexOf(",") + 1) : shotData;
    if (!b64 || b64.length < 1000) return "";
    const bin = Buffer.from(b64, "base64"); if (bin.length < 500) return "";
    const ct = shotData.startsWith("data:image/png") ? "image/png" : "image/jpeg";
    const ext = ct === "image/png" ? "png" : "jpg";
    const slug = crypto.createHash("sha1").update(String(siteUrl || "")).digest("hex").slice(0, 20);
    const r = await put(`leadaudit/desktop/${slug}.${ext}`, bin, { access: "public", contentType: ct, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 86400 });
    return r?.url || "";
  } catch { return ""; }
}

async function uploadMobileShot(siteUrl: string, b64: string): Promise<string> {
  try {
    if (!b64 || b64.length < 1000) return "";
    const bin = Buffer.from(b64, "base64"); if (bin.length < 500) return "";
    const slug = crypto.createHash("sha1").update(String(siteUrl || "")).digest("hex").slice(0, 20);
    const r = await put(`leadaudit/mobile/${slug}.jpg`, bin, { access: "public", contentType: "image/jpeg", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 86400 });
    return r?.url || "";
  } catch { return ""; }
}

                                                                                                    
                                                                                                           
                                                                                                
const DIAG_TOGGLEABLE = ["speed", "visual", "brand", "briefing", "google", "interior"];
function parseLayers(req: VercelRequest): Set<string> | null {
  const raw = String(req.query.layers || "").trim();
  if (!raw) return null;                                
  return new Set(raw.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
}
                                                                                         
                                                                                                   
                                                                                                 
                                                                                                    
                                                                                                   
                                                                               
async function visionAnalyze(dataUri: string, mobileUri?: string): Promise<any> {
  const KEY = process.env.OPENAI_API_KEY || "";
  if (!KEY || !dataUri) return null;
  try {
    const sys = 'You are a senior creative director auditing a business WEBSITE from screenshots (the website ONLY, never the physical store, facade or signage). Image 1 is the DESKTOP homepage; image 2, when present, is the MOBILE homepage. Judge ONLY what you can SEE; ground EVERY judgment in visible evidence and say WHERE you see it (hero, menu, footer); if you truly cannot tell, use "" or [] (never invent). Return ONLY JSON: {"palette":["#hex up to 5 dominant colors on the website"],"style":"one of: premium|modern|minimal|generic|dated|cluttered","logoVisible":true|false,"impression":"one honest sentence on the visual impression","issues":["short concrete visual issue seen", up to 3],"hierarchy":"one sentence on the visual hierarchy (what reads first, is it clear), with the visible reason","typography":"one sentence on typography quality and legibility, with the visible reason","polish":"one of: polished|competent|amateur, then a short reason","premiumRead":"one of: premium|mid|cheap, with the visible reason","personality":"one sentence: distinctive or generic/template-like, with the visible reason","segmentGuess":"what this business appears to sell or do, in a few words, from the image alone","segmentClear":true|false,"segmentNote":"would a first-time visitor understand what this business is within 3 seconds? why","goalAction":"the main action a customer would come to do (book, order, call, buy), as seen","goalVisible":true|false,"goalNote":"is that action visible on the FIRST screen and reachable in ONE obvious click? where is the button, does it stand out","breathing":"one sentence: margins and white space, cramped or breathing, with the visible reason","imageQuality":"one of: professional|acceptable|poor, with the visible reason","consistency":"one sentence: do the sections read as ONE same site, or does the style drift","mobileRead":"one sentence from image 2 ONLY: does mobile hold up (legibility, spacing, is the main action still visible)? empty string if there is no image 2","strengths":["what genuinely works, up to 3, each with its visible evidence"],"fixFirst":"the ONE visual change with the biggest business impact, concrete"}';
    const content: any[] = [{ type: "text", text: sys }, { type: "image_url", image_url: { url: dataUri, detail: "high" } }];
    if (mobileUri) content.push({ type: "image_url", image_url: { url: mobileUri, detail: "low" } });
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, max_tokens: 1100, response_format: { type: "json_object" }, messages: [{ role: "user", content }] }),
    });
    if (!r.ok) return null;
    const d: any = await r.json();
    const p = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    const S = (k: string) => String(p[k] || "");
    const B = (k: string) => !!p[k];
    const A = (k: string, n: number) => Array.isArray(p[k]) ? p[k].slice(0, n).map((x: any) => String(x)) : [];
    return {
      palette: A("palette", 5), style: S("style"), logoVisible: B("logoVisible"), impression: S("impression"),
      issues: A("issues", 3), hierarchy: S("hierarchy"), typography: S("typography"), polish: S("polish"),
      premiumRead: S("premiumRead"), personality: S("personality"),
      segmentGuess: S("segmentGuess"), segmentClear: B("segmentClear"), segmentNote: S("segmentNote"),
      goalAction: S("goalAction"), goalVisible: B("goalVisible"), goalNote: S("goalNote"),
      breathing: S("breathing"), imageQuality: S("imageQuality"), consistency: S("consistency"),
      mobileRead: S("mobileRead"), strengths: A("strengths", 3), fixFirst: S("fixFirst"),
    };
  } catch { return null; }
}

                                                                                               
                                                                                                  
                                                                                                
async function logoAnalyze(dataUri: string, mobileUri: string, segmentHint: string): Promise<any> {
  const KEY = process.env.OPENAI_API_KEY || "";
  if (!KEY || !dataUri) return null;
  try {
    const sys = `You are a brand identity director analyzing ONLY the LOGO of a business, as it appears on its website screenshots (image 1 desktop, image 2 mobile when present). Separate BRAND from WEBSITE: judge the mark itself, not the page layout. Segment hint from Google: "${segmentHint || "unknown"}". Judge only what you can see; give the visible reason for everything; use "" when you truly cannot tell; never invent. Return ONLY JSON: {"found":true|false (false when there is only a typed name, no designed mark),"kind":"one of: designed_mark|styled_wordmark|plain_text","visibility":"one sentence: size and placement on desktop AND on mobile, does it survive the small screen","contrast":"one sentence: contrast against the real background where it sits","legibility":"one sentence: can you read it at the size it is shown","craft":"one of: professional|basic|amateur, with the visible reason (rough edges, default font, clipart look)","colorsFit":"one sentence: do the logo colors belong to this segment's world? why","audienceFit":"one sentence: does the style speak to the public this business seems to serve (premium vs popular)? name the mismatch if there is one","memorable":"one sentence: would you recognize this mark tomorrow among rivals?","opportunities":["concrete branding opportunity, up to 3"]}`;
    const content: any[] = [{ type: "text", text: sys }, { type: "image_url", image_url: { url: dataUri, detail: "high" } }];
    if (mobileUri) content.push({ type: "image_url", image_url: { url: mobileUri, detail: "low" } });
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, max_tokens: 700, response_format: { type: "json_object" }, messages: [{ role: "user", content }] }),
    });
    if (!r.ok) return null;
    const d: any = await r.json();
    const p = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    const S = (k: string) => String(p[k] || "");
    return { found: !!p.found, kind: S("kind"), visibility: S("visibility"), contrast: S("contrast"), legibility: S("legibility"), craft: S("craft"), colorsFit: S("colorsFit"), audienceFit: S("audienceFit"), memorable: S("memorable"), opportunities: Array.isArray(p.opportunities) ? p.opportunities.slice(0, 3).map((x: any) => String(x)) : [] };
  } catch { return null; }
}

                                                                                             
                                                                                                
                                                                                           
async function copyAudit(corpus: string): Promise<any> {
  const KEY = process.env.OPENAI_API_KEY || "";
  const t = String(corpus || "").replace(/\s+/g, " ").trim();
  if (!KEY || t.length < 200) return null;
  try {
    const sys = 'You are a meticulous proofreader and content strategist auditing the TEXT of a business website. The input is raw extracted text and may contain navigation fragments; ignore obvious extraction noise. Work in the site\'s own language. Quote EXACTLY when flagging; never invent; when nothing is found return empty arrays. Return ONLY JSON: {"lang":"main language code of the site","typos":["exact quote, then what is wrong, up to 5"],"inconsistencies":["tone, spelling or naming inconsistencies (mixed languages, the same thing written two ways), exact quotes, up to 4"],"missing":["content a customer would expect from this type of business and that was NOT found in the pages read (phrase it as: not found in the pages we read), up to 4"]}';
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.1, max_tokens: 800, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: t.slice(0, 9000) }] }),
    });
    if (!r.ok) return null;
    const d: any = await r.json();
    const p = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    const A = (k: string, n: number) => Array.isArray(p[k]) ? p[k].slice(0, n).map((x: any) => String(x)) : [];
    return { lang: String(p.lang || ""), typos: A("typos", 5), inconsistencies: A("inconsistencies", 4), missing: A("missing", 4) };
  } catch { return null; }
}

                                                                                                         
                                                                                             
async function brandAnalyze(company: string, text: string, visual: any): Promise<any> {
  const KEY = process.env.OPENAI_API_KEY || "";
  if (!KEY || (!text && !company)) return null;
  try {
    const ctx = `Company: ${company || "(unknown)"}. Visual style: ${visual?.style || "n/a"}. Visual impression: ${visual?.impression || "n/a"}. Homepage text (excerpt): ${(text || "").slice(0, 1800) || "(little text, likely JS-rendered)"}`;
    const sys = 'You are the senior creative director of ABiL, a creative agency (branding, advertising, disruptive campaigns), using the 5 P method (Personality first). Analyze this brand from the material ONLY (never invent; if unknown, say so). The material is the WEBSITE text + a website screenshot + provided Google data ONLY: you did NOT see the physical store, facade, signage or printed logo, so NEVER assert anything about those, and frame any weakness as an OPPORTUNITY to build rather than a verdict. Return ONLY JSON: {"what":"1-2 sentences: what the company does, how, and for whom (their audience)","sector":"the sector/category in 1-3 words","hasBranding":true|false (does it read as an intentional, crafted BRAND, or just a company with a logo?),"archetype":"one of the 12 brand archetypes (Hero, Outlaw, Sage, Creator, Magician, Jester, Lover, Caregiver, Ruler, Explorer, Innocent, Everyman)","personality":"one short sentence on the brand personality and voice","distinct":true|false,"distinctNote":"one sentence: distinct or generic/interchangeable with rivals?","coherence":"one sentence on whether the message and brand are coherent","creative":"one sentence: is the brand bold/disruptive/original, or safe and expected?","opportunities":["short, concrete brand/creative opportunity", up to 3]}.';
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.3, max_tokens: 600, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: ctx }] }),
    });
    if (!r.ok) return null;
    const d: any = await r.json();
    const p = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    return { what: String(p.what || ""), sector: String(p.sector || ""), hasBranding: !!p.hasBranding, archetype: String(p.archetype || ""), personality: String(p.personality || ""), distinct: !!p.distinct, distinctNote: String(p.distinctNote || ""), coherence: String(p.coherence || ""), creative: String(p.creative || ""), opportunities: Array.isArray(p.opportunities) ? p.opportunities.slice(0, 3) : [] };
  } catch { return null; }
}

                                                                                                      
                                                                         
                                                                                                     
                                                                                                         
                                                                                                           
const FONTES_VALIDAS = ["site", "pagina-interna", "review-google", "places", "visao", "ig-bio", "inferido"];
                                                                                                                    
                                                                                                                   
                                                                  
const INTERIOR_MARK = "--- PÁGINAS INTERIORES DO SITE ---";
                                                                  
                                                                                                                     
                                                                                                                    
                                                                                                                   
                                                                                                                     
                                                                                                          
                                                                                           
function fontesLidasNestaCorrida(text: string, visual: any, geo: any, place?: any, opts?: { semSite?: boolean; igBio?: string }): Set<string> {
  const lidas = new Set<string>(["inferido"]);
  const temTextoSite = String(text || "").replace(/\s+/g, " ").trim().length >= 80;
                                                                                                                   
                                                                                      
  if (!opts?.semSite && (String(geo?.title || "").trim() || String(geo?.metaDesc || "").trim() || temTextoSite)) lidas.add("site");
  if (String(text || "").includes(INTERIOR_MARK)) lidas.add("pagina-interna");
  if (place && (place as any).ok && Array.isArray((place as any).reviews) && (place as any).reviews.length) lidas.add("review-google");
  if (place && (place as any).ok) lidas.add("places");
  if (visual && String(visual.style || "").trim()) lidas.add("visao");                                                 
  if (String(opts?.igBio || "").trim()) lidas.add("ig-bio");
  return lidas;
}
async function briefingAnalyze(company: string, text: string, visual: any, geo: any, place?: any, opts?: { semSite?: boolean; igBio?: string }): Promise<any> {
  const KEY = process.env.OPENAI_API_KEY || "";
  if (!KEY || (!text && !company)) return null;
  try {
    const socials = (geo?.socials && geo.socials.length) ? geo.socials.join(", ") : "none linked on the site";
    const reviewsTxt = (place && place.reviews && place.reviews.length) ? place.reviews.slice(0, 8).map((rv: any) => `(${rv.rating || "?"}★) ${rv.text}`).join("  ||  ").slice(0, 2400) : "";
    const placeCtx = (place && place.ok) ? ` Google category: ${place.categoria || "n/a"}. Google rating: ${place.rating != null ? place.rating + "★ (" + (place.reviewsCount || 0) + " reviews)" : "n/a"}. Google editorial: ${place.editorial || "n/a"}. REAL Google customer reviews: ${reviewsTxt || "none"}.` : "";
    const igCtx = (opts?.igBio) ? ` Instagram public profile description (og:description ONLY; NO posts were read): ${opts.igBio.slice(0, 400)}.` : "";
    const ctx = `Company: ${company || "(unknown)"}. Visual style: ${visual?.style || "n/a"}. Socials on site: ${socials}. Homepage title: ${geo?.title || ""}. Meta description: ${geo?.metaDesc || ""}.${placeCtx}${igCtx} Homepage text (excerpt): ${(text || "").slice(0, 3200) || "(little text, likely JS-rendered)"}`;
    let sys = 'You are the senior creative director of ABiL, a creative agency, building a DEEP PRE-BRIEFING on a prospect for an audit-led approach, from the material ONLY. CRITICAL RULE: NEVER invent and NEVER use generic filler (no "quality service", no vague claims). The material is ONLY the website text and the Google reviews provided: you did NOT see the physical store, facade, signage or logo, so NEVER infer or state anything about those. If a field is not genuinely supported by the material, set it to null (not a guess) and add its key to "lacunas". The material may include the WEBSITE and/or REAL Google customer reviews: reviews are the strongest evidence for dor_resolvida, prova_social and diferencial_real, prefer them; if there is NO website, set fields only a website answers (promessa_comunicada, marca_promessa) to null and list them in lacunas. Every non-null value must be REAL, specific and concrete. Return ONLY JSON: {"produto_central":"the core product/service, concrete"|null,"dor_resolvida":"the real customer pain it solves"|null,"diferencial_real":"what it has that rivals do not, per the material"|null,"marca_promessa":"the central promise the brand makes"|null,"promessa_comunicada":"the actual headline/tagline they use, quoted"|null,"preco_posicionamento":"price positioning (premium/mid/accessible) if inferable"|null,"amplitude_oferta":"focused on one thing or spread across many services"|null,"prova_social":"awards/clients/testimonials actually shown"|null,"fundador":"founder name/story if present"|null,"pontos_contacto":"the main CTA/booking/contact path on the site"|null,"subnicho":"the exact sub-niche in the market\'s own words"|null,"geografia":"market/geography if stated"|null,"gap_principal":"the single biggest creative OPPORTUNITY grounded in the material (what could be elevated), framed as an opportunity to build, NOT as a fault you observed"|null,"porta_entrada":"the natural entry offer for a creative agency"|null,"lacunas":["keys of fields that could NOT be answered from the material"],"fontes":{"<field key>":"one of: site|pagina-interna|review-google|places|visao|ig-bio|inferido, for EVERY non-null field"}}.';
                                                                                                                  
                                                                                                                    
                                                                                                                     
                                                                                                               
                                                                                                             
    sys += ` PROVENANCE RULE for "fontes": "site" = homepage text/title/meta description; "pagina-interna" = only text that appears AFTER the marker line "${INTERIOR_MARK}" (the site's inner pages); "review-google" = the REAL Google customer reviews; "places" = Google category/rating/editorial data; "visao" = the visual style/impression provided; "ig-bio" = the Instagram profile description; "inferido" = anything you deduced that is NOT literally stated in the material. NEVER claim a source that did not contain the value; when unsure, use "inferido". A field whose declared source is not actually present in this material will be DISCARDED by the server.`;
    const temSite = !opts?.semSite;
    const temReviews = !!(place && place.ok && Array.isArray(place.reviews) && place.reviews.length);
    if (!temSite) {
                                                                                                          
      sys += ' THERE IS NO WEBSITE in this material. Therefore: promessa_comunicada and marca_promessa MUST be null and listed in lacunas. A self-declared differential or FORMAL social proof (awards, client logos, testimonials page) also requires a website: diferencial_real and prova_social may ONLY be non-null when directly grounded in the Google reviews, phrased citing the origin explicitly, with fonte "review-google"; otherwise set them null and add to lacunas.';
    }
    if (temSite && temReviews) {
                                                                                                            
      sys += ' CROSS-CHECK PROMISE vs DELIVERY: the material has BOTH the website text (what the brand COMMUNICATES) and REAL Google reviews (what customers say it DELIVERS). For gap_principal, compare the two and state the most concrete, citable gap between the communicated promise and the delivered experience (or the strongest strength customers praise in reviews that the site fails to communicate), quoting or closely paraphrasing the review evidence, and set fontes.gap_principal to "review-google". Never invent review content.';
    }
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, max_tokens: 1100, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: ctx }] }),
    });
    if (!r.ok) return null;
    const d: any = await r.json();
    const p = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    const keys = ["produto_central", "dor_resolvida", "diferencial_real", "marca_promessa", "promessa_comunicada", "preco_posicionamento", "amplitude_oferta", "prova_social", "fundador", "pontos_contacto", "subnicho", "geografia", "gap_principal", "porta_entrada"];
    const out: any = {};
    const lacunas: string[] = Array.isArray(p.lacunas) ? p.lacunas.filter((x: any) => keys.includes(String(x))) : [];
    for (const k of keys) {
      const raw = p[k];
      const val = (raw == null || String(raw).trim() === "" || /^(n\/?a|null|none|unknown|desconhecido|nao informado|não informado)$/i.test(String(raw).trim())) ? null : String(raw).trim();
      out[k] = val;
      if (val == null && !lacunas.includes(k)) lacunas.push(k);
    }
                                                                         
                                                         
                                                                                                                  
                                                                                                                   
                                                                                   
                                                                                                                    
                                                                              
                                                                                                     
    const fontesRaw = (p.fontes && typeof p.fontes === "object" && !Array.isArray(p.fontes)) ? p.fontes : null;
    if (fontesRaw) {
      const lidas = fontesLidasNestaCorrida(text, visual, geo, place, opts);
      const fontes: Record<string, string> = {};
      const descartadas: string[] = [];
      for (const k of keys) {
        if (out[k] == null) continue;
        const v = String((fontesRaw as any)[k] || "").trim().toLowerCase();
        if (!v) continue;                                                                                         
        if (FONTES_VALIDAS.includes(v) && lidas.has(v)) { fontes[k] = v; continue; }
        out[k] = null;                                                                                                   
        if (!lacunas.includes(k)) lacunas.push(k);
        descartadas.push(`${k}:${v.slice(0, 20)}`);
      }
      if (Object.keys(fontes).length) out.fontes = fontes;
                                                                                                              
      if (descartadas.length) out.fontesDescartadas = descartadas.slice(0, 14);
    }
    out.lacunas = lacunas;
    out.preenchidos = keys.length - lacunas.length;
    out.total = keys.length;
    return out;
  } catch { return null; }
}

async function geoAndSsl(url: string): Promise<any> {
  const out: any = { https: false, hsts: false, robotsAllowsAI: null, blocksAI: [] as string[], hasLlmsTxt: false, hasSitemap: false, hasSchema: false, hasTitle: false, hasMetaDesc: false, hasOg: false, socials: [] as string[], hasBlog: false, colors: [] as string[], fonts: [] as string[], colorCount: 0, fontCount: 0, text: "", title: "", metaDesc: "" };
  let origin = "";
  try { const u = new URL(url); origin = u.origin; out.https = u.protocol === "https:"; } catch { return out; }
  try {
    const r = await fetchT(url, { redirect: "follow" }, 15000);
    out.https = r.url.startsWith("https:");
    out.hsts = !!r.headers.get("strict-transport-security");
    const html = (await r.text()).slice(0, 300000);
    out.hasTitle = /<title[^>]*>[^<]{3,}<\/title>/i.test(html);
    out.hasMetaDesc = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{10,}/i.test(html);
    out.hasOg = /<meta[^>]+property=["']og:/i.test(html);
    out.hasSchema = /application\/ld\+json/i.test(html);
                                                                                         
    const socialPats: Record<string, RegExp> = { Instagram: /instagram\.com\/[a-z0-9._]/i, LinkedIn: /linkedin\.com\/(company|in)\//i, Facebook: /facebook\.com\/[a-z0-9.]/i, X: /(twitter\.com|x\.com)\/[a-z0-9_]/i, YouTube: /(youtube\.com\/(c|channel|user|@)|youtu\.be)/i, TikTok: /tiktok\.com\/@/i };
    out.socials = Object.entries(socialPats).filter(([, re]) => re.test(html)).map(([k]) => k);
                                                                                                          
                                                                                             
    const socialUrlPats: Record<string, RegExp> = {
      Instagram: /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]+/i,
      LinkedIn: /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in|school)\/[A-Za-z0-9._%-]+/i,
      Facebook: /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9.%-]+/i,
      X: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+/i,
      YouTube: /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:c\/|channel\/|user\/|@)[A-Za-z0-9._-]+|youtu\.be\/[A-Za-z0-9_-]+)/i,
      TikTok: /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._]+/i,
    };
    const socialLinks: Array<{ platform: string; url: string }> = [];
    for (const [plat, re] of Object.entries(socialUrlPats)) { const m = html.match(re); if (m) socialLinks.push({ platform: plat, url: m[0] }); }
    try { const sm = html.match(/"sameAs"\s*:\s*\[([^\]]{0,1500})\]/i); if (sm) { for (const u of (sm[1].match(/https?:\/\/[^"'\s,]+/gi) || [])) { const host = (u.match(/https?:\/\/(?:www\.)?([^/]+)/i) || [])[1] || ""; const plat = /instagram/i.test(host) ? "Instagram" : /linkedin/i.test(host) ? "LinkedIn" : /facebook/i.test(host) ? "Facebook" : /(twitter|x)\.com/i.test(host) ? "X" : /youtu/i.test(host) ? "YouTube" : /tiktok/i.test(host) ? "TikTok" : ""; if (plat && !socialLinks.some((l) => l.platform === plat)) socialLinks.push({ platform: plat, url: u }); } } } catch {  }
    out.socialLinks = socialLinks;
    out.hasBlog = /href=["'][^"']*\/blog\b/i.test(html) || /\/(news|insights|journal|articles)\b/i.test(html);
    out.title = ((html.match(/<title[^>]*>([^<]{1,160})<\/title>/i) || [])[1] || "").trim();
    out.metaDesc = ((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})/i) || [])[1] || "").trim();
                                                      
    out.text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
                                                                                                                                                           
    const abs = (u: string) => { try { return u ? new URL(u, origin + "/").href : ""; } catch { return ""; } };
    const headM = html.match(/<header[\s\S]{0,5000}?<\/header>/i) || html.match(/<nav[\s\S]{0,4000}?<\/nav>/i);
    const headHtml = headM ? headM[0] : html.slice(0, 5000);
    out.hasInlineSvgLogo = /<svg[\s\S]{0,600}?<\/svg>/i.test(headHtml);
    let logoUrl = "", logoKind = "";
    const logoImgTag = (headHtml.match(/<img[^>]*(?:class|alt|src|id)=["'][^"']*logo[^"']*["'][^>]*>/i) || [])[0] || (headHtml.match(/<img[^>]+src=["'][^"']+["'][^>]*>/i) || [])[0] || "";
    const logoImgSrc = logoImgTag ? ((logoImgTag.match(/\ssrc=["']([^"']+)["']/i) || [])[1] || "") : "";
    if (logoImgSrc && !/^data:/i.test(logoImgSrc)) { logoUrl = abs(logoImgSrc); logoKind = "header-img"; }
    if (!logoUrl) { const at = (html.match(/<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i) || [])[1] || ""; if (at) { logoUrl = abs(at); logoKind = "apple-touch-icon"; } }
    if (!logoUrl) { const og = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || [])[1] || ""; if (og) { logoUrl = abs(og); logoKind = "og-image"; } }
    if (!logoUrl) { const fav = (html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) || [])[1] || ""; if (fav) { logoUrl = abs(fav); logoKind = "favicon"; } }
    out.logoUrl = logoUrl; out.logoKind = logoKind; out.hasLogo = !!(logoUrl || out.hasInlineSvgLogo);
                                                      
    const fonts = new Set<string>();
    (html.match(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi) || []).forEach((m) => { const fam = decodeURIComponent((m.split("family=")[1] || "")).split(":")[0].replace(/\+/g, " ").trim(); if (fam) fonts.add(fam); });
    (html.match(/font-family\s*:\s*([^;"}]+)/gi) || []).slice(0, 60).forEach((m) => { const fam = (m.split(":")[1] || "").split(",")[0].replace(/['"]/g, "").trim(); if (fam && fam.length < 28 && !/var\(|inherit|initial|sans-serif|serif|monospace|system-ui|ui-/i.test(fam)) fonts.add(fam); });
                                                                                
    let cssText = html;
    const cssLinks = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]).slice(0, 2);
    for (const href of cssLinks) { try { const cu = href.startsWith("http") ? href : origin + (href.startsWith("/") ? "" : "/") + href; const cr = await fetchT(cu, {}, 8000); if (cr.ok) cssText += " " + (await cr.text()).slice(0, 160000); } catch {  } }
    const colorFreq: Record<string, number> = {};
    (cssText.match(/#[0-9a-f]{6}\b/gi) || []).forEach((c) => { const k = c.toLowerCase(); colorFreq[k] = (colorFreq[k] || 0) + 1; });
    out.colorCount = Object.keys(colorFreq).length;
    out.colors = Object.entries(colorFreq).sort((a, b) => b[1] - a[1]).map(([c]) => c).filter((c) => !/^#(ffffff|000000|fefefe|fcfcfc|fafafa|111111|222222|333333)$/i.test(c)).slice(0, 6);
    out.fonts = [...fonts].slice(0, 6);
    out.fontCount = fonts.size;
  } catch {  }
  try {
    const rb = await fetchT(`${origin}/robots.txt`, {}, 8000);
    if (rb.ok) {
      const txt = (await rb.text()).toLowerCase();
      const bots = ["gptbot", "claudebot", "perplexitybot", "google-extended", "ccbot"];
      const blocked = bots.filter((b) => new RegExp(`user-agent:\\s*${b}[\\s\\S]{0,400}?disallow:\\s*/\\s`, "i").test(txt + "\n"));
      out.blocksAI = blocked;
      out.robotsAllowsAI = blocked.length === 0;
    }
  } catch {  }
  try { const l = await fetchT(`${origin}/llms.txt`, {}, 6000); out.hasLlmsTxt = l.ok; } catch {  }
  try { const s = await fetchT(`${origin}/sitemap.xml`, {}, 6000); out.hasSitemap = s.ok; } catch {  }
  return out;
}

                                                                               
function summarize(ps: any, geo: any, visual?: any): { headline: string; findings: string[] } {
  const f: string[] = [];
  if (ps?.ok) {
    if (ps.performance != null && ps.performance < 50) f.push(`Site lento no telemóvel: ${ps.performance}/100 de performance.`);
    if (ps.seo != null && ps.seo < 80) f.push(`SEO abaixo do ideal: ${ps.seo}/100.`);
    if (ps.accessibility != null && ps.accessibility < 80) f.push(`Acessibilidade fraca: ${ps.accessibility}/100.`);
  }
  if (geo) {
    if (geo.https === false) f.push("Sem HTTPS (sinal de pouca confiança).");
    if (Array.isArray(geo.blocksAI) && geo.blocksAI.length) f.push(`Bloqueia crawlers de IA (${geo.blocksAI.join(", ")}): invisível para o ChatGPT/Claude.`);
    if (geo.hasSchema === false) f.push("Sem dados estruturados (schema.org): a IA não percebe a marca.");
    if (geo.hasLlmsTxt === false) f.push("Sem llms.txt (não preparado para a era da IA).");
    if (geo.hasMetaDesc === false) f.push("Sem meta-description (partilhas e pesquisa ficam pobres).");
  }
  if (visual && /dated|generic|cluttered/i.test(visual.style || "") && visual.impression) {
    const t = visual.style === "dated" ? "datado" : visual.style === "cluttered" ? "carregado" : "genérico";
    f.push(`Visual ${t}: ${visual.impression}`);
  }
  const headline = f[0] || (visual?.impression || "Base técnica saudável: a oportunidade está na marca e na personalidade.");
  return { headline, findings: f };
}

const PLACES_DETAIL_MASK = "id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,primaryType,types,editorialSummary,reviews,regularOpeningHours,priceLevel,googleMapsUri,businessStatus";
                                                                                                                                    
async function placeDetails(placeId: string): Promise<any> {
  if (!PLACES_KEY || !placeId) return null;
  try {
    const r = await fetchT(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, { headers: { "X-Goog-Api-Key": PLACES_KEY, "X-Goog-FieldMask": PLACES_DETAIL_MASK } }, 12000);
    if (!r.ok) return { ok: false, status: r.status };
    const d: any = await r.json();
    const reviews = Array.isArray(d.reviews) ? d.reviews.map((rv: any) => ({ rating: rv.rating ?? null, text: String(rv.originalText?.text || rv.text?.text || "").replace(/\s+/g, " ").trim().slice(0, 600) })).filter((x: any) => x.text) : [];
    return { ok: true, placeFetchedAt: new Date().toISOString(), nome: String(d.displayName?.text || ""), morada: String(d.formattedAddress || ""), telefone: String(d.nationalPhoneNumber || ""), website: String(d.websiteUri || ""), rating: typeof d.rating === "number" ? d.rating : null, reviewsCount: typeof d.userRatingCount === "number" ? d.userRatingCount : null, categoria: String(d.primaryType || (Array.isArray(d.types) ? d.types[0] : "") || ""), editorial: String(d.editorialSummary?.text || ""), horario: Array.isArray(d.regularOpeningHours?.weekdayDescriptions) ? d.regularOpeningHours.weekdayDescriptions.join(" · ") : "", mapsUrl: String(d.googleMapsUri || ""), reviews };
  } catch { return { ok: false }; }
}
                                                                                                           
                                                                                                             
                                                                                                            
                                                                                                          
                                                                                                             
                                                                                                           
function placeFieldsUsable(place: any): boolean {
  if (!place || !place.ok) return false;
  const t = place.placeFetchedAt ? Date.parse(String(place.placeFetchedAt)) : NaN;
  return Number.isFinite(t) && (Date.now() - t) <= PLACES_TTL_MS;
}
                                                                         
function placeMeta(place: any): any { if (!place || !place.ok) return null; const { reviews, ...rest } = place; return { ...rest, reviewsSample: Array.isArray(reviews) ? reviews.slice(0, 3) : [], reviewsUsed: Array.isArray(reviews) ? reviews.length : 0 }; }
                                                                     
function buildPlaceCorpus(place: any): string {
  if (!place || !place.ok) return "";
  const parts: string[] = [];
  if (place.editorial) parts.push(`Resumo Google: ${place.editorial}`);
  if (place.categoria) parts.push(`Categoria: ${place.categoria}`);
  if (place.rating != null) parts.push(`Avaliacao: ${place.rating}★ (${place.reviewsCount || 0} avaliacoes)`);
  if (Array.isArray(place.reviews) && place.reviews.length) parts.push("Avaliacoes reais de clientes: " + place.reviews.slice(0, 8).map((rv: any) => `(${rv.rating || "?"}★) ${rv.text}`).join("  ||  "));
  return parts.join(". ").slice(0, 3200);
}
                                                                                                       
function summarizeNoSite(place: any): { headline: string; findings: string[] } {
  const f: string[] = [];
  const rep = (place?.rating != null) ? `${place.rating}★ no Google (${place.reviewsCount || 0} avaliacoes)` : "presenca no Google";
  f.push(`Sem site proprio: invisivel para SEO, para a IA (ChatGPT/Claude) e para quem partilha um link, apesar de ${rep}.`);
  f.push("Toda a reputacao vive numa plataforma alugada (Google): sem casa digital propria, sem controlo da marca.");
  if (place?.rating != null && place.rating >= 4.3) f.push(`Reputacao forte (${place.rating}★) desperdicada: nada a converte em marca e clientes novos.`);
                                                                                                       
  const headline = (place?.rating != null)
    ? `${place.rating}★ no Google com ${place.reviewsCount || 0} avaliacoes e nenhuma presenca web propria: invisivel para pesquisa, para a IA e para partilha.`
    : "Reputacao real no Google, zero presenca digital propria: a maior oportunidade e dar-lhe uma casa a altura.";
  return { headline, findings: f };
}

                                                                               
                                                                                   
                                                                               

                                                                                            
async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    if (BLOB_PUBLIC_BASE) { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.json(); if (r.status === 404) return fallback; }
    const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return fallback; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.json() : fallback;
  } catch { return fallback; }
}
async function loadLead(leadId: string): Promise<any> {
  const cloud = await readJson<any>("crm/leads.json", { leads: [] });
  const leads: any[] = Array.isArray(cloud) ? cloud : (cloud?.leads || []);
  return leads.find((l) => String(l.id) === String(leadId)) || null;
}
                                                                                                  
function selfAdmin(): string { const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; if (!PW) return ""; const exp = Date.now() + 5 * 60 * 1000; const sig = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); return `${exp}.${sig}`; }
                                                                                                   
async function readPersonaCtx(): Promise<string> {
  const tok = selfAdmin(); if (!tok) return "";
  const get = async (col: string) => { try { const r = await fetch(`${BASE_URL}/api/private-store?col=${col}&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" }); if (!r.ok) return null; const d: any = await r.json(); return d?.value ?? d?.data ?? d?.content ?? null; } catch { return null; } };
  const bp = await get("brand_persona"); const buy = await get("buyer_personas");
  const parts: string[] = [];
  if (bp) parts.push("BRAND PERSONA (voz, tom, valores): " + JSON.stringify(bp).slice(0, 1800));
  if (buy) parts.push("BUYER PERSONAS (publico-alvo): " + JSON.stringify(buy).slice(0, 900));
  return parts.join("\n");
}
                                                                                         
                                                                                                                    
                                                                                                                     
                                                                                                                       
                                                                                                                 
                                                                              
const DEFAULT_PHILOSOPHY = [
  "Somos a ABiL, agencia de criacao, gestao e promocao de marcas.",
  "Nao vendemos performance de site: entregamos marca, ideia e campanha, em 360, da personalidade da marca a activacao que a torna memoravel.",
  "O que nos distingue e a criatividade e a disrupcao: a qualidade e o minimo que um cliente espera.",
  "Postura comercial: nunca comecamos por dizer que ja sabemos do que o cliente precisa. Para vender a marca de alguem e preciso mergulhar no negocio dele primeiro. A analise automatica mostra a PRIMEIRA IMPRESSAO; uma analise profunda exige tempo, conversa e proximidade.",
  "Limites: nunca inventar factos, numeros, clientes ou precos; nunca fingir uma analise que nao foi feita; nunca prometer resultados; falar sempre na lingua do lead.",
].join("\n");
const PHILO_MAX = 6000;
let _philoCache: { at: number; text: string } | null = null;
async function readPhilosophyCtx(): Promise<string> {
  if (_philoCache && Date.now() - _philoCache.at < 10 * 60 * 1000) return _philoCache.text;
  let txt = "";
  try {
    const tok = selfAdmin();
    if (tok) {
      const r = await fetch(`${BASE_URL}/api/private-store?col=work_philosophy&cb=${Date.now()}`, { headers: { "x-abil-admin": tok }, cache: "no-store" });
      if (r.ok) {
        const d: any = await r.json().catch(() => null);
        const v: any = d?.value ?? null;
        const raw = typeof v === "string" ? v : (typeof v?.texto === "string" ? v.texto : "");
        txt = String(raw || "").trim();
      }
    }
  } catch { txt = ""; }                                                                        
  const text = `\n\nQUEM TU ES (dossier real: quem somos, filosofia de trabalho e postura comercial. E a tua identidade: nunca a contradigas, nunca acrescentes factos que nao estejam aqui):\n${String(txt || DEFAULT_PHILOSOPHY).slice(0, PHILO_MAX)}\n`;
  _philoCache = { at: Date.now(), text };
  return text;
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
                                                                                                   
                                                                                            
                                                                                                  
                                                                                                                      
                                                                                                                   
                                                                                                                 
                                              
const SERVICOS_ABIL = "personalidade e identidade de marca (branding, DNA, arquétipo, tom de voz, logotipo vetorial); sistema de marca e guidelines; reposicionamento e direção de arte; conceito criativo e campanha 360 (digital e tradicional); motion, filme e audiovisual; ativações de marca e guerrilha; sistema de conteúdo social e jornada de cliente; gestão de media e campanha paga; narrativa e comunicação da marca; estratégia de prova social; website de raiz e redesign; loja online (e-commerce); otimização para IA e busca (GEO)";
                                                                                                 
                                                                                                                 
                                                                                                                              
function colorConventionFor(setor: string): string {
  const s = String(setor || "").toLowerCase();
  if (/est[eé]tica|beleza|sal[aã]o|spa|skincare|harmoniza/.test(s)) return "o mercado de estetica repete fonte dourada sobre bege; se a paleta observada cair nesse cliche e uma fraqueza (parece a clinica da esquina) e abre venda de reposicionamento visual.";
  if (/igaming|casino|cassino|aposta|betting|\bgaming\b|slots/.test(s)) return "o iGaming repete dourado + neon escuro (cara de caca-niquel); se a paleta observada seguir esse cliche e uma fraqueza (parece armadilha, gera desconfianca) e abre venda de marca premium e direcao de arte propria.";
  if (/\bpet\b|veterin|animal|tosa/.test(s)) return "o setor pet repete azul-clarinho com patinha de clipart; se a paleta ou o logo observado seguir isso e uma fraqueza (igual a todos) e abre venda de identidade com alma.";
  if (/dent|odonto/.test(s)) return "as clinicas dentarias repetem jaleco branco + dente azul; se a marca observada seguir esse cliche e uma fraqueza (parece posto de saude) e abre venda de marca que vende confianca.";
  if (/barbear|barber/.test(s)) return "as barbearias repetem neon generico e logo de gerador; se a fachada ou identidade observada seguir isso e uma fraqueza (some na rua) e abre venda de identidade como territorio.";
  if (/saas|software|tecnolog|\btech\b|startup/.test(s)) return "o SaaS repete o mesmo azul corporativo e o mesmo dashboard; se a paleta observada for esse azul generico e uma fraqueza (troca-se o logo e ninguem percebe) e abre venda de posicionamento e identidade distinta.";
  if (/arquitet|imobili|constru|incorpora|lancamento/.test(s)) return "o imobiliario repete o render azulzinho e o casal feliz; se a paleta observada seguir esse cliche e uma fraqueza (parece imobiliaria de bairro) e abre venda de naming e direcao de arte que valoriza o empreendimento.";
  if (/hamburg|burger/.test(s)) return "as hamburguerias repetem preto com amarelo e vermelho grunge, fonte grossa e vaquinha no logo; se a identidade observada cair nesse cliche e uma fraqueza (camuflada no meio de cem iguais no app) e abre venda de marca com universo proprio que faz fila pelo nome, nao pelo cupom do delivery.";
  if (/pizz/.test(s)) return "as pizzarias repetem o verde, branco e vermelho de bandeira italiana com foto da pizza vista de cima; se a identidade observada cair nesse cliche e uma fraqueza (mais uma entre as 200 da cidade, refem do app) e abre venda de marca com embalagem e canal proprio que fazem o cliente atravessar a cidade.";
  if (/cervej|brew|beer/.test(s)) return "a cerveja artesanal repete papel kraft com paleta vintage e letra retro; se o rotulo observado cair nesse cliche e uma fraqueza (some no meio das 40 latas iguais da prateleira) e abre venda de sistema de rotulos e familia visual com personalidade propria.";
  if (/vinic|vinho|wine|adega|vinhedo/.test(s)) return "as vinicolas repetem bordo sobre creme com serifada classica e brasao de familia; se o rotulo observado cair nesse cliche e uma fraqueza (garrafa invisivel entre cinquenta iguais na gondola) e abre venda de identidade do rotulo a experiencia, que conta o terroir em meio segundo.";
  if (/restaurant|bistr|gastronom|cantina|taberna|tasca/.test(s)) return "os restaurantes repetem o vermelho com amarelo de apetite fast-food; se a paleta observada cair nesse cliche e uma fraqueza (parece praca de alimentacao, nao casa com alma) e abre venda de identidade que vende a experiencia antes do garfo, do cardapio a embalagem do delivery.";
  if (/hotel|hostel|resort|pousada|alojamento|guest/.test(s)) return "a hotelaria repete azul-marinho com dourado serifado de luxo generico; se a paleta observada cair nesse cliche e uma fraqueza (parece hotel generico de aeroporto que so compete no preco da OTA) e abre venda de identidade de atmosfera que vende a estadia antes do check-in.";
  if (/e-?commerce|loja (online|virtual)|marketplace|dropship/.test(s)) return "o ecommerce repete o azul de confianca com botao laranja de template; se a paleta observada cair nesse cliche e uma fraqueza (parece mais uma loja de template que so compete no preco) e abre venda de marca propria com identidade, embalagem e experiencia de loja.";
  if (/academ|fitness|\bgym\b|gin[aá]sio|crossfit|pilates|\byoga\b/.test(s)) return "o fitness repete preto com verde-neon ou vermelho agressivo e logo musculoso; se a paleta observada cair nesse cliche e uma fraqueza (mais uma academia que grita supere seus limites e ninguem lembra) e abre venda de marca de pertencimento que vende experiencia, nao metro quadrado de aparelho.";
  if (/engenhar|engineering|metalurg|industria/.test(s)) return "a engenharia repete azul corporativo com cinza e icone de capacete ou engrenagem; se a marca observada cair nesse cliche e uma fraqueza (parece orcamento feito no Word, commodity que briga no centavo) e abre venda de identidade que traduz solidez de engenharia em autoridade de marca.";
  if (/fashion|\bmoda\b|vestu[aá]rio|apparel|confec/.test(s)) return "a moda repete o preto e branco minimal de logotipo serifado indistinto; se a identidade observada cair nesse cliche e uma fraqueza (mais um cabide na vitrine do Instagram) e abre venda de marca com historia e direcao de arte que vende pertencimento, nao roupa.";
  return "";
}
function studyFacts(lead: any, A: any): string {
  const b = A.briefing || {}; const br = A.brand || {}; const f: string[] = [];
  if (lead.entreprise) f.push(`empresa: ${lead.entreprise}`);
  if (lead.setor || br.sector) f.push(`setor: ${lead.setor || br.sector}`);
  if (lead.pais) f.push(`pais/mercado: ${lead.pais}`);
  if (!lead.website && !A.googleRating) f.push(`SEM site proprio detetado`);
  if (br.what || b.produto_central) f.push(`o que faz: ${br.what || b.produto_central}`);
  if (b.subnicho) f.push(`subnicho: ${b.subnicho}`);
  if (b.preco_posicionamento) f.push(`posicionamento de preco: ${b.preco_posicionamento}`);
  if (b.dor_resolvida) f.push(`dor que resolve: ${b.dor_resolvida}`);
  if (b.diferencial_real) f.push(`diferencial: ${b.diferencial_real}`);
  if (b.prova_social) f.push(`prova social exibida: ${b.prova_social}`);
  if (b.promessa_comunicada) f.push(`headline/tagline atual: ${b.promessa_comunicada}`);
  if (b.gap_principal) f.push(`gap/oportunidade ja detetada: ${b.gap_principal}`);
  if (br.archetype) f.push(`arquetipo de marca: ${br.archetype}`);
  if (br.personality) f.push(`personalidade da marca: ${br.personality}`);
  if (br.distinctNote) f.push(`distintividade: ${br.distinctNote}`);
  if (br.coherence) f.push(`coerencia da marca: ${br.coherence}`);
  if (A.visual?.style) f.push(`estilo visual do site: ${A.visual.style}`);
  if (A.visual?.impression) f.push(`impressao visual: ${A.visual.impression}`);
  if (Array.isArray(A.visual?.issues) && A.visual.issues.length) f.push(`problemas visuais vistos: ${A.visual.issues.join("; ")}`);
  if (A.visual?.hierarchy) f.push(`hierarquia visual do site: ${A.visual.hierarchy}`);
  if (A.visual?.typography) f.push(`tipografia do site: ${A.visual.typography}`);
  if (A.visual?.polish) f.push(`acabamento visual (polido/amador): ${A.visual.polish}`);
  if (A.visual?.premiumRead) f.push(`leitura de valor (premium/barato): ${A.visual.premiumRead}`);
  if (A.visual?.personality) f.push(`personalidade visual: ${A.visual.personality}`);
  if (A.hasLogo === false) f.push(`SEM logotipo proprio detetado no site`);
  else if (A.logoKind === "favicon") f.push(`logotipo so como favicon (sem versao de qualidade no site)`);
  if (typeof A.perf === "number") f.push(`performance do site: ${A.perf} de 100${A.perf < 50 ? " (LENTO)" : ""}`);
  if (typeof A.seo === "number") f.push(`SEO do site: ${A.seo} de 100`);
  if (A.https === false) f.push(`SEM HTTPS`);
  if (A.aiBlocked) f.push(`bloqueia bots de IA (nao encontravel por IA)`);
  if (A.hasSchema === false) f.push(`SEM dados estruturados (schema)`);
  if (Array.isArray(A.socials)) f.push(`redes sociais ligadas no site: ${A.socials.length ? A.socials.join(", ") : "NENHUMA"}`);
                                                                                                         
  const SD = lead.socialDeep;
  if (SD && typeof SD === "object") {
    if (SD.ads && SD.ads.advertises === true) f.push(`ANUNCIA no Google (Ads Transparency): ${SD.ads.total} criativo(s)${SD.ads.active ? `, ${SD.ads.active} ativo(s)` : ""}${Array.isArray(SD.ads.formats) && SD.ads.formats.length ? ` (${SD.ads.formats.join("/")})` : ""} - investe em midia, argumento para elevar o criativo`);
    else if (SD.ads && SD.ads.advertises === false) f.push(`NAO corre anuncios detetaveis no Google - oportunidade de ativar aquisicao paga com criativo forte`);
    if (SD.youtube && typeof SD.youtube.subs === "number") f.push(`YouTube: ${SD.youtube.subs} subscritores, ${SD.youtube.videos} videos${SD.youtube.created ? `, canal desde ${SD.youtube.created}` : ""}`);
    else if (SD.youtube && SD.youtube.indeterminado) f.push(`YouTube: ${SD.youtube.indeterminado}`);
  }
  if (A.hasBlog === false) f.push(`SEM blog`);
  if (A.googleRating != null) f.push(`Google: ${A.googleRating} estrelas, ${A.googleReviews || 0} avaliacoes`);
  if (Array.isArray(A.colors) && A.colors.length) f.push(`cores do site: ${A.colors.join(", ")}`);
  if (Array.isArray(A.fonts) && A.fonts.length) f.push(`fontes do site: ${A.fonts.join(", ")}`);
  if (A.headline) f.push(`achado principal: ${A.headline}`);
  if (Array.isArray(A.findings) && A.findings.length) f.push(`achados: ${A.findings.slice(0, 6).join("; ")}`);
  return f.length ? f.map((x) => `- ${x}`).join("\n") : "(poucos factos observados)";
}
async function generateLeadStudy(leadId: string, auditOverride?: any): Promise<{ ok: boolean; study?: any; error?: string }> {
  const lead = await loadLead(leadId); if (!lead) return { ok: false, error: "lead_nao_encontrado" };
  const A = (auditOverride && typeof auditOverride === "object") ? auditOverride : lead.audit;
  if (!A || typeof A !== "object") return { ok: false, error: "sem_audit" };
  const persona = await readPersonaCtx();
  const facts = studyFacts(lead, A);
  const system = `Es o diretor de criacao da ABiL, agencia de CRIACAO, GESTAO e PROMOCAO de marcas, em Genève, com o humano no comando e a IA como ferramenta. O que vendes e MARCA, IDEIA e CAMPANHA, em 360, da personalidade da marca a ativacao que a torna memoravel. NAO es um especialista em performance de site: a performance do site e um SINTOMA que les, NAO e o teu produto (o digital entra como parte do todo, nunca como o produto). O que vos distingue e a criatividade e a disrupcao: a qualidade e o minimo que um cliente espera. Vais escrever um ESTUDO INTERNO deste lead, so para TI (nao vai para o cliente), para decidires como abordar e o que vender.\n\nREGRA DE FERRO ABSOLUTA: usa APENAS os factos observados abaixo. NUNCA inventes numeros, nomes, factos nem historia. Se algo nao esta nos factos, NAO o menciones (nem a favor nem contra). Cada ponto do SWOT e cada servico a vender TEM de apontar a evidencia observada nos factos.\n\nSOBRE COR: descreve a cor e a paleta observada. So podes julgar adequacao cromatica se houver uma CONVENCAO DE COR DO SEGMENTO nos factos abaixo: nesse caso compara a cor observada com essa convencao (que diz de que cliche o mercado esta saturado) e aponta se a marca cai no cliche (fraqueza) ou foge dele (forca). Sem convencao fornecida, limita-te ao que ves, sem juizo de adequacao cromatica.\n\nOs teus servicos possiveis a vender: ${SERVICOS_ABIL}. Mapeia cada FRAQUEZA ou AUSENCIA observada para o servico que a resolve (ex.: sem redes -> sistema de conteúdo social; sem site -> website; site lento/datado -> redesign; marca genérica -> reposicionamento; sem logo ou logo fraco -> identidade visual; nao encontravel por IA -> otimização GEO).\n\nEscreve na TUA voz: pt-PT informal e direto, sem jargao, SEM travessao (usa virgula, dois pontos, parenteses). Devolve SO um JSON valido, sem texto antes nem depois, com este formato exato:\n{"estudo":"um paragrafo curto e afiado na tua voz: quem e a marca de verdade, a dor central, a oportunidade concreta que atacarias e o angulo de abordagem","swot":{"forcas":[{"ponto":"","evidencia":""}],"fraquezas":[{"ponto":"","evidencia":""}],"oportunidades":[{"ponto":"","evidencia":""}],"ameacas":[{"ponto":"","evidencia":""}]},"vender":[{"servico":"","motivo":"a fraqueza ou ausencia observada que o justifica"}],"proximoPasso":"uma linha: o que fazer a seguir com este lead"}`;
  const colorConv = colorConventionFor(lead.setor || A.brand?.sector || "");
  const philoStudy = await readPhilosophyCtx();                                                                          
  const user = `PERSONA E VOZ:\n${persona}${philoStudy}\n\nFACTOS OBSERVADOS DESTE LEAD (a tua UNICA fonte):\n${facts}${colorConv ? `\n\nCONVENCAO DE COR DO SEGMENTO (do que o mercado esta saturado, para comparar com a cor observada): ${colorConv}` : ""}\n\nDevolve o JSON.`;
  const study: any = await callLLMJson(system, user);
  if (!study || typeof study !== "object") return { ok: false, error: "ia_indisponivel_ou_json" };
  study.at = new Date().toISOString();
  try { const tok = selfAdmin(); await fetch(`${BASE_URL}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, study }] }) }).catch(() => undefined); } catch {  }
  return { ok: true, study };
}
                                                                                                   
                                                                                                    
                                                                                                     
                                                                                                  
                                                                
const SOS_GEO: Record<string, string> = { portugal: "PT", pt: "PT", franca: "FR", "frança": "FR", france: "FR", suica: "CH", "suíça": "CH", switzerland: "CH", suisse: "CH", alemanha: "DE", germany: "DE", italia: "IT", "itália": "IT", italy: "IT", espanha: "ES", spain: "ES", brasil: "BR", brazil: "BR", "reino unido": "GB", uk: "GB", "united kingdom": "GB", malta: "MT", eua: "US", usa: "US", "united states": "US", suecia: "SE", "suécia": "SE", sweden: "SE", holanda: "NL", netherlands: "NL", belgica: "BE", "bélgica": "BE", belgium: "BE", austria: "AT", "áustria": "AT", irlanda: "IE", ireland: "IE", luxemburgo: "LU", luxembourg: "LU" };
function sosGeo(pais: string): string { const k = String(pais || "").trim().toLowerCase(); return SOS_GEO[k] || ""; }
async function suggestCompetitors(lead: any): Promise<string[]> {
  const A = lead.audit || {};
  const system = `Es um analista de mercado rigoroso. Dada uma empresa e o seu setor e regiao, sugere 2 a 3 marcas CONCORRENTES REAIS e conhecidas, no mesmo setor e mercado, que provavelmente tenham volume de busca no Google. Devolve SO JSON: {"concorrentes":["Marca A","Marca B"]}. Se nao souberes concorrentes reais, devolve lista vazia. NUNCA inventes nomes falsos nem genericos.`;
  const user = `EMPRESA: ${lead.entreprise || lead.nome || "?"}\nSETOR: ${lead.setor || A.brand?.sector || "?"}\nMERCADO/PAIS: ${lead.pais || "?"}\nDevolve o JSON.`;
  const r = await callLLMJson(system, user);
  const arr = Array.isArray(r?.concorrentes) ? r.concorrentes : [];
  return arr.map((x: any) => String(x || "").trim()).filter(Boolean).slice(0, 3);
}
async function shareOfSearch(leadId: string, brandOverride?: string, competitorsOverride?: string[]): Promise<any> {
  const lead = await loadLead(leadId); if (!lead) return { ok: false, error: "lead_nao_encontrado" };
  const KEY = process.env.SERPAPI_KEY || "";                                                                                                           
  const brand = String(brandOverride || lead.entreprise || lead.nome || "").trim();
  if (!brand) return { ok: false, error: "sem_marca", message: "Este lead nao tem nome de marca para procurar." };
  const hasOverride = Array.isArray(competitorsOverride) && competitorsOverride.length > 0;
  let competitors = hasOverride ? competitorsOverride!.map((x) => String(x || "").trim()).filter(Boolean) : await suggestCompetitors(lead);
  competitors = competitors.filter((c) => c.toLowerCase() !== brand.toLowerCase()).slice(0, 3);
  const geo = sosGeo(lead.pais);
  const terms = [brand, ...competitors];
  const q = terms.join(",");
                                                                                                          
                                                                                                              
                                                                            
  if (WORKER_URL && WORKER_TOKEN) {
    try {
      const wr = await fetch(`${WORKER_URL}/trends`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${WORKER_TOKEN}` }, body: JSON.stringify({ terms, geo }), signal: AbortSignal.timeout(90000) });
      const wd: any = await wr.json().catch(() => null);
      if (wd?.ok && Array.isArray(wd.points) && wd.points.length) {
        const nT = terms.length;
        const sums = new Array(nT).fill(0);
        for (const pt of wd.points) for (let k = 0; k < nT; k++) sums[k] += Number(pt.values?.[k]) || 0;
        const rows = terms.map((t, k) => ({ marca: t, media: Math.round((sums[k] / wd.points.length) * 10) / 10, ehLead: t.toLowerCase() === brand.toLowerCase() }));
        const total = rows.reduce((sm, rw) => sm + rw.media, 0);
        const brandRow = rows.find((rw) => rw.ehLead) || { media: 0 };
        const sharePct = total > 0 ? Math.round((brandRow.media / total) * 100) : 0;
        let brandMax = 0; for (const pt of wd.points) brandMax = Math.max(brandMax, Number(pt.values?.[0]) || 0);
        let trend = "indeterminado";
        if (wd.points.length >= 6) {
          const seg = Math.floor(wd.points.length / 3);
          const first = wd.points.slice(0, seg); const last = wd.points.slice(-seg);
          const fa = first.reduce((sm: number, pt: any) => sm + (Number(pt.values?.[0]) || 0), 0) / (first.length || 1);
          const la = last.reduce((sm: number, pt: any) => sm + (Number(pt.values?.[0]) || 0), 0) / (last.length || 1);
          if (fa === 0 && la === 0) trend = "indeterminado"; else if (la > fa * 1.15) trend = "subindo"; else if (la < fa * 0.85) trend = "caindo"; else trend = "estavel";
        }
        const status = brandMax < 5 ? "indeterminado" : "ok";
        const wresult = { brand, competitors, competitorsSuggested: !hasOverride, geo: geo || "worldwide", rows, sharePct, trend, status, brandMax, source: "Google Trends via worker proprio (12m)", checkedAt: new Date().toISOString() };
        try { const tok = selfAdmin(); await fetch(`${BASE_URL}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, shareOfSearch: wresult }] }) }).catch(() => undefined); } catch {  }
        return { ok: true, shareOfSearch: wresult };
      }
    } catch {  }
  }
  if (!KEY) {
    const wresult = { brand, competitors, competitorsSuggested: !hasOverride, geo: geo || "worldwide", rows: [], sharePct: 0, trend: "indeterminado", status: "indeterminado", brandMax: 0, source: "worker bloqueado pelo Google e sem SerpApi: sem medicao nesta corrida", checkedAt: new Date().toISOString() };
    return { ok: true, shareOfSearch: wresult };
  }
  const url = `https://serpapi.com/search.json?engine=google_trends&data_type=TIMESERIES&date=${encodeURIComponent("today 12-m")}${geo ? `&geo=${geo}` : ""}&q=${encodeURIComponent(q)}&api_key=${KEY}`;
  let d: any = null;
  try { const r = await fetch(url); d = await r.json(); } catch (e: any) { return { ok: false, error: "fetch_falhou", message: String(e?.message || e).slice(0, 120) }; }
  if (d?.error) {
    const msg = String(d.error);
                                                                                                    
                                                                                                    
                                                                                                   
    if (/run out of searches|exhausted|out of quota/i.test(msg)) {
      const result = { brand, competitors, competitorsSuggested: !hasOverride, geo: geo || "worldwide", rows: [], sharePct: 0, trend: "indeterminado", status: "indeterminado", brandMax: 0, source: "worker bloqueado pelo Google e SerpApi sem quota: sem medicao nesta corrida", checkedAt: new Date().toISOString() };
      return { ok: true, shareOfSearch: result };
    }
    if (/hasn't returned any results|has not returned any results|no results|not enough (search )?volume|nenhum resultado/i.test(msg)) {
      const result = { brand, competitors, competitorsSuggested: !hasOverride, geo: geo || "worldwide", rows: [], sharePct: 0, trend: "indeterminado", status: "indeterminado", brandMax: 0, source: "SerpApi google_trends (12m)", checkedAt: new Date().toISOString() };
      try { const tok = selfAdmin(); await fetch(`${BASE_URL}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, shareOfSearch: result }] }) }).catch(() => undefined); }
      catch {  }
      return { ok: true, shareOfSearch: result };
    }
    return { ok: false, error: "serpapi_erro", message: msg.slice(0, 160) };
  }
  const iot = d?.interest_over_time || {};
  const timeline: any[] = Array.isArray(iot.timeline_data) ? iot.timeline_data : [];
  const averages: any[] = Array.isArray(iot.averages) ? iot.averages : [];
  const valAt = (p: any, term: string): number => { const v = (p.values || []).find((y: any) => String(y.query).toLowerCase() === term.toLowerCase()); return v ? (Number(v.extracted_value) || 0) : 0; };
  const avgOf = (term: string): number => {
    const a = averages.find((x) => String(x.query).toLowerCase() === term.toLowerCase());
    if (a && a.value != null) return Number(a.value) || 0;
    if (!timeline.length) return 0;
    let s = 0; for (const p of timeline) s += valAt(p, term); return s / timeline.length;
  };
  const rows = terms.map((t) => ({ marca: t, media: Math.round(avgOf(t) * 10) / 10, ehLead: t.toLowerCase() === brand.toLowerCase() }));
  const total = rows.reduce((s, r) => s + r.media, 0);
  const brandRow = rows.find((r) => r.ehLead) || { media: 0 };
  const sharePct = total > 0 ? Math.round((brandRow.media / total) * 100) : 0;
  let brandMax = 0; for (const p of timeline) brandMax = Math.max(brandMax, valAt(p, brand));
  let trend = "indeterminado";
  if (timeline.length >= 6) {
    const seg = Math.floor(timeline.length / 3);
    const first = timeline.slice(0, seg); const last = timeline.slice(-seg);
    const fa = first.reduce((s, p) => s + valAt(p, brand), 0) / (first.length || 1);
    const la = last.reduce((s, p) => s + valAt(p, brand), 0) / (last.length || 1);
    if (fa === 0 && la === 0) trend = "indeterminado";
    else if (la > fa * 1.15) trend = "subindo";
    else if (la < fa * 0.85) trend = "caindo";
    else trend = "estavel";
  }
  const status = brandMax < 5 ? "indeterminado" : "ok";
  const result = { brand, competitors, competitorsSuggested: !hasOverride, geo: geo || "worldwide", rows, sharePct, trend, status, brandMax, source: "SerpApi google_trends (12m)", checkedAt: new Date().toISOString() };
  try { const tok = selfAdmin(); await fetch(`${BASE_URL}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, shareOfSearch: result }] }) }).catch(() => undefined); } catch {  }
  return { ok: true, shareOfSearch: result };
}
                                                                                                       
                                                                     
                                                                            
                                                                                                           
                                                                                        
                                                                                                               
                                                                                                            
function domainOfSite(website: string): string { return String(website || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/[/?#].*$/, "").trim().toLowerCase(); }
function ytRef(url: string): { forHandle?: string; id?: string } | null {
  const h = url.match(/youtube\.com\/@([A-Za-z0-9._-]+)/i); if (h) return { forHandle: "@" + h[1] };
  const c = url.match(/youtube\.com\/channel\/(UC[A-Za-z0-9_-]{20,})/i); if (c) return { id: c[1] };
  return null;                                                                                                  
}
async function extractSocialLinksFromSite(website: string): Promise<Array<{ platform: string; url: string }>> {
  try {
    const u = website.startsWith("http") ? website : `https://${website}`;
    const r = await fetch(u, { headers: { "User-Agent": UA_BOT }, redirect: "follow" });
    if (!r.ok) return [];
    const html = (await r.text()).slice(0, 300000);
    const pats: Record<string, RegExp> = {
      Instagram: /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]+/i,
      LinkedIn: /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in|school)\/[A-Za-z0-9._%-]+/i,
      Facebook: /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9.%-]+/i,
      X: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9_]+/i,
      YouTube: /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:c\/|channel\/|user\/|@)[A-Za-z0-9._-]+|youtu\.be\/[A-Za-z0-9_-]+)/i,
      TikTok: /https?:\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._]+/i,
    };
    const out: Array<{ platform: string; url: string }> = [];
    for (const [p, re] of Object.entries(pats)) { const m = html.match(re); if (m) out.push({ platform: p, url: m[0] }); }
    return out;
  } catch { return []; }
}
async function analyzeSocialDeep(leadId: string): Promise<any> {
  const lead = await loadLead(leadId); if (!lead) return { ok: false, error: "lead_nao_encontrado" };
  const A = lead.audit || {};
                                                                                        
  let profiles: Array<{ platform: string; url: string }> = Array.isArray(A.socialLinks) ? A.socialLinks : [];
  if (!profiles.length && lead.website) profiles = await extractSocialLinksFromSite(lead.website);
                                                             
  const domain = domainOfSite(lead.website);
  let ads: any;
  const SERP = process.env.SERPAPI_KEY || "";
                                                                                                 
                                                                                    
  if (!domain) ads = { indeterminado: "sem dominio do lead" };
  else if (WORKER_URL && WORKER_TOKEN) {
    try {
      const wr = await fetch(`${WORKER_URL}/ads`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${WORKER_TOKEN}` }, body: JSON.stringify({ domain }), signal: AbortSignal.timeout(45000) });
      const wd: any = await wr.json().catch(() => null);
      if (wd?.ok && wd.advertises !== null && wd.advertises !== undefined) ads = { advertises: !!wd.advertises, total: Number(wd.creatives) || 0, active: Number(wd.creatives) || 0, formats: [], latestShown: null, source: "Ads Transparency Center via worker proprio" };
      else ads = null;
    } catch { ads = null; }
    if (!ads && !SERP) ads = { indeterminado: "worker sem leitura e sem SerpApi" };
  }
  if (ads) {  }
  else if (!SERP) ads = { indeterminado: "SerpApi desligado" };
  else {
    try {
      const url = `https://serpapi.com/search.json?engine=google_ads_transparency_center&text=${encodeURIComponent(domain)}&api_key=${SERP}`;
      const r = await fetch(url); const d: any = await r.json();
      if (d?.error) {
                                                                                                                       
                                                                                 
        if (/hasn'?t returned any results|has not returned any results|no results/i.test(String(d.error))) ads = { advertises: false, total: 0, active: 0, formats: [], latestShown: null, source: "SerpApi Google Ads Transparency Center" };
        else ads = { indeterminado: String(d.error).slice(0, 120) };
      } else {
        const cr: any[] = Array.isArray(d.ad_creatives) ? d.ad_creatives : [];
        const now = Date.now() / 1000;
        const active = cr.filter((c) => c.last_shown && (now - Number(c.last_shown)) < 45 * 86400);
        const formats = Array.from(new Set(cr.map((c) => String(c.format || "")).filter(Boolean)));
        const latest = cr.reduce((m, c) => Math.max(m, Number(c.last_shown) || 0), 0);
        ads = { advertises: cr.length > 0, total: cr.length, active: active.length, formats, latestShown: latest ? new Date(latest * 1000).toISOString().slice(0, 10) : null, source: "SerpApi Google Ads Transparency Center" };
      }
    } catch (e: any) { ads = { indeterminado: "erro SerpApi: " + String(e?.message || e).slice(0, 80) }; }
  }
                                                                  
                                                                                                     
                                                                                                       
  const YKEY = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY || "";
  const ytLink = profiles.find((p) => /youtube/i.test(p.platform));
  const ref = ytLink ? ytRef(ytLink.url) : null;
  let youtube: any;
  if (!ytLink) youtube = { indeterminado: "sem canal de YouTube ligado no site" };
  else if (!YKEY) youtube = { indeterminado: "YouTube Data API por ligar (chave Google sem a API ativa)" };
  else if (!ref) youtube = { indeterminado: "canal em formato /c/ ou /user/ (nao resolvivel sem busca paga)" };
  else {
    try {
      const q = ref.forHandle ? `forHandle=${encodeURIComponent(ref.forHandle)}` : `id=${encodeURIComponent(ref.id!)}`;
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&${q}&key=${YKEY}`;
      const r = await fetch(url); const d: any = await r.json();
      if (d?.error) youtube = { indeterminado: "YouTube API: " + String(d.error?.message || "erro").slice(0, 100) };
      else {
        const it = (d.items || [])[0];
        if (!it) youtube = { indeterminado: "canal nao encontrado" };
        else {
          const st = it.statistics || {}; const sn = it.snippet || {};
          youtube = { title: sn.title || "", handle: sn.customUrl || "", subsHidden: !!st.hiddenSubscriberCount, subs: st.hiddenSubscriberCount ? null : Number(st.subscriberCount || 0), views: Number(st.viewCount || 0), videos: Number(st.videoCount || 0), created: sn.publishedAt ? String(sn.publishedAt).slice(0, 10) : null, source: "YouTube Data API v3 (subs arredondados pela Google)" };
        }
      }
    } catch (e: any) { youtube = { indeterminado: "erro YouTube: " + String(e?.message || e).slice(0, 80) }; }
  }
  const result = { profiles, ads, youtube, paidNote: "Seguidores e engagement exatos de Instagram/LinkedIn/TikTok exigem fornecedor pago (fase 2), nao inventados aqui.", checkedAt: new Date().toISOString() };
  try { const tok = selfAdmin(); await fetch(`${BASE_URL}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, socialDeep: result }] }) }).catch(() => undefined); } catch {  }
  return { ok: true, socialDeep: result };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });

                                                                        
  if (req.method === "POST") {
    const action = qv(req, "action");
    let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};

                                                                                                                                                             
    if (action === "lead-study") {
      const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
      const r = await generateLeadStudy(leadId, (body && typeof body.audit === "object") ? body.audit : undefined);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(r);
    }

                                                                                                                            
    if (action === "lead-social-deep") {
      const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
      const r = await analyzeSocialDeep(leadId);
      res.setHeader("Cache-Control", "no-store");
      return res.status(r.ok ? 200 : 400).json(r);
    }

    if (action === "share-of-search") {
      const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
      const comp = Array.isArray(body?.competitors) ? body.competitors : undefined;
      const r = await shareOfSearch(leadId, body?.brand ? String(body.brand) : undefined, comp);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(r);
    }

    return res.status(400).json({ ok: false, error: "action desconhecida" });
  }

  const raw = String(req.query.url || "");
  const url = safeUrl(raw);
  const placeId = String(req.query.placeId || "").slice(0, 300);
  const company = String(req.query.company || "").slice(0, 80);
  if (!url && !placeId) return res.status(400).json({ error: "bad_input", detail: "URL http(s) público OU placeId obrigatório" });

                                                                                   
  if (url) {
    const LSET = parseLayers(req); const hasL = (k: string) => !LSET || LSET.has(k);                                  
    let [pagespeed, geo, place, wsnap] = await Promise.all([hasL("speed") ? pageSpeed(url) : Promise.resolve({ ok: false, skipped: true }), geoAndSsl(url), (placeId && hasL("google")) ? placeDetails(placeId) : Promise.resolve(null), workerSnap(url)]);
                                                                                                                                       
    if (place && !placeFieldsUsable(place)) place = null;
                                                                                               
    let shot = (pagespeed as any)?.screenshot || "";
    let shotSource = shot ? "pagespeed" : "none";
    if (wsnap && typeof wsnap.screenshotB64 === "string" && wsnap.screenshotB64.length > 1000) { shot = `data:image/jpeg;base64,${wsnap.screenshotB64}`; shotSource = "worker"; }
                                                                                                                   
                                                                                                                         
    const mobileShot = (wsnap && typeof wsnap.mobileShotB64 === "string") ? await uploadMobileShot(url, wsnap.mobileShotB64) : "";
                                                                                      
    const desktopShot = (typeof shot === "string" && shot.length > 1000) ? await uploadDesktopShot(url, shot) : "";
    if (wsnap) {
                                                                                                 
      if (Array.isArray(wsnap.colors) && wsnap.colors.length) { (geo as any).colors = wsnap.colors.slice(0, 8); (geo as any).stylesSource = "worker"; }
      if (Array.isArray(wsnap.fonts) && wsnap.fonts.length) { (geo as any).fonts = wsnap.fonts.slice(0, 6); (geo as any).fontCount = wsnap.fonts.length; }
      if (!(geo as any).logoUrl && wsnap.logoUrl) { (geo as any).logoUrl = String(wsnap.logoUrl).slice(0, 500); (geo as any).logoKind = wsnap.logoKind || "img"; (geo as any).hasLogo = true; }
      if (wsnap.inlineSvg && !(geo as any).hasInlineSvgLogo) { (geo as any).hasInlineSvgLogo = true; (geo as any).hasLogo = true; }
    }
                                                                                                                                          
    if (hasL("speed") && (!pagespeed || (pagespeed as any).ok === false) && WORKER_URL) {
      const wlh = await workerLighthouse(url);
      if (wlh) pagespeed = { ok: true, performance: wlh.perf ?? null, seo: wlh.seo ?? null, accessibility: null, bestPractices: null, lcp: wlh.lcp || null, cls: wlh.cls || null, screenshot: "", source: "worker-lighthouse" };
    }
    const _mobUri = (wsnap && typeof wsnap.mobileShotB64 === "string" && wsnap.mobileShotB64.length > 1000) ? `data:image/jpeg;base64,${wsnap.mobileShotB64}` : "";
    const visual = (hasL("visual") && shot) ? await visionAnalyze(shot, _mobUri) : null;
    if (pagespeed && (pagespeed as any).screenshot) delete (pagespeed as any).screenshot;                                
                                                                                                           
                                                                                                        
    const siteText = String((geo as any)?.text || "");
    const usableSite = siteText.replace(/\s+/g, " ").trim().length >= 80;
    const googleCorpus = (place && (place as any).ok) ? buildPlaceCorpus(place) : "";
    const usedGoogleFallback = !usableSite && googleCorpus.length > 40;
                                                                                                 
    const corpusBase = usableSite ? siteText : (usedGoogleFallback ? googleCorpus : siteText);
    const interior = (hasL("interior") && usableSite) ? await interiorPagesText(url, 2, 6000) : { text: "", pages: [] as string[] };
    const corpus = interior.text ? `${corpusBase}\n\n${INTERIOR_MARK}\n${interior.text}`.slice(0, 14000) : corpusBase;
    const dataQuality = interior.text ? "multi_page" : (usedGoogleFallback ? "google_fallback" : "homepage_only");
                                                                                                    
                                                                                                 
                                                                                                
    if (visual) {
      const [_lg, _cp] = await Promise.all([
        logoAnalyze(shot, _mobUri, String((place as any)?.categoria || "")),
        copyAudit(corpus),
      ]);
      if (_lg) (visual as any).logo = _lg;
      if (_cp) (visual as any).copyRead = _cp;
    }
                                                                                                                
    const igLink = Array.isArray((geo as any).socialLinks) ? (geo as any).socialLinks.find((l: any) => l && l.platform === "Instagram") : null;
    const ig = igLink ? await igProbe(String(igLink.url)) : null;
                                                                                                                
                                                                                                                           
    let socialStats: any = null;
    if (hasL("visual")) {
      try {
        const brandName = company || String((place as any)?.nome || "") || String((geo as any)?.title || "");
        socialStats = await collectSocialStats({ igUrl: igLink ? String(igLink.url) : "", brand: brandName, countries: adCountries(req) });
      } catch { socialStats = null; }
    }
    const [brand, briefing] = await Promise.all([
      hasL("brand") ? brandAnalyze(company, corpus, visual) : Promise.resolve(null),
      hasL("briefing") ? briefingAnalyze(company, corpus, visual, geo, place, { semSite: !usableSite, igBio: ig?.bio || "" }) : Promise.resolve(null),
    ]);
    if (usedGoogleFallback && briefing) { (briefing as any).viaGoogleFallback = true; }
    if (briefing) { (briefing as any).dataQuality = dataQuality; }
                                                                                                                  
    await logAiCost(String(req.headers.host || ""), corpus.length * 2 + (visual ? 3000 : 0) + 6000, JSON.stringify({ brand, briefing, visual }).length);
    const summary = usedGoogleFallback ? summarizeNoSite(place) : summarize(pagespeed, geo, visual);
    const aiError = !!process.env.OPENAI_API_KEY && hasL("brand") && hasL("briefing") && !brand && !briefing;                                                                                                           
    const layersSkipped = LSET ? DIAG_TOGGLEABLE.filter((k) => !LSET.has(k)) : [];                                      
    return res.status(200).json({ ok: true, mode: usedGoogleFallback ? "site_google_fallback" : "site", url, siteReachable: usableSite, usedGoogleFallback, dataQuality, interiorPages: interior.pages.length, ...(ig ? { igEstado: ig.estado } : {}), ...(socialStats ? { socialStats } : {}), place: placeMeta(place), auditedAt: new Date().toISOString(), aiError, shotSource, ...(mobileShot ? { mobileShot } : {}), ...(desktopShot ? { desktopShot } : {}), partial: layersSkipped.length > 0, layersSkipped, pagespeed, geo, visual, brand, briefing, summary });
  }

                                                                                                             
  const place = await placeDetails(placeId);
                                                                                                                     
  if (!placeFieldsUsable(place)) return res.status(200).json({ ok: true, mode: "nosite", place: null, brand: null, briefing: null, summary: { headline: "Sem site e sem dados públicos suficientes no Google para um diagnóstico fiável.", findings: [] }, note: "place_details_unavailable", auditedAt: new Date().toISOString() });
  const corpus = buildPlaceCorpus(place);
  const fakeGeo = { socials: [], title: place.nome, metaDesc: place.editorial };
                                                                                                             
  const igRawNS = safeUrl(String(req.query.ig || ""));
  const igUrlNS = igRawNS && /instagram\.com\//i.test(igRawNS) ? igRawNS : null;
  const igNS = igUrlNS ? await igProbe(igUrlNS) : null;
                                                                                                                      
                                                                                           
  let socialStatsNS: any = null;
  try { socialStatsNS = await collectSocialStats({ igUrl: igUrlNS || "", brand: company || place.nome || "", countries: adCountries(req) }); } catch { socialStatsNS = null; }
  const [brand, briefing] = await Promise.all([
    brandAnalyze(company || place.nome, corpus, null),
    briefingAnalyze(company || place.nome, corpus, null, fakeGeo, place, { semSite: true, igBio: igNS?.bio || "" }),
  ]);
  if (briefing) {
    const b: any = briefing;
    b.semSite = true;
                                                                                                    
                                                                                              
    const rep = place.rating != null ? `${place.rating}★ no Google com ${place.reviewsCount || 0} avaliações` : "presença registada no Google";
    b.gap_principal = `Sem site próprio: invisível para pesquisa, para a IA (ChatGPT/Claude) e para partilha de link. Tem ${rep} e nenhuma presença web própria que converta essa reputação.`;
    b.porta_entrada = `Dar casa digital à reputação já provada (${rep}): uma presença web própria, dona da marca, que a converta em clientes novos.`;
    b.fontes = { ...(b.fontes || {}), gap_principal: "places", porta_entrada: "places" };
    b.lacunas = (Array.isArray(b.lacunas) ? b.lacunas : []).filter((k: string) => k !== "gap_principal" && k !== "porta_entrada");
    b.preenchidos = Math.max(0, (b.total || 14) - b.lacunas.length);
  }
  const summary = summarizeNoSite(place);
                                                                                
  await logAiCost(String(req.headers.host || ""), corpus.length * 2 + 6000, JSON.stringify({ brand, briefing }).length);
  const aiErrorNS = !!process.env.OPENAI_API_KEY && !brand && !briefing;                                  
  return res.status(200).json({ ok: true, mode: "nosite", placeId, ...(igNS ? { igEstado: igNS.estado } : {}), ...(socialStatsNS ? { socialStats: socialStatsNS } : {}), place: placeMeta(place), auditedAt: new Date().toISOString(), aiError: aiErrorNS, brand, briefing, summary });
}
