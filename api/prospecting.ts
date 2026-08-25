/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                                                              
                                                                                                                
                                                                                                                   
                                                                                                                   
                                                                                             
                                                                                                       
                                                                                                                   
                                                       
                                                                                                                       
  
                                                                                                                       
                                                                                                                       
                                                                                                                    
                                                                                                                      
                                                                                                 
                                                                          
  
                                                                                                                       
                                                                                                                       
                                                                                                                              
                                                                                                                    
                                                                                                             
  
                                                                                                                         
                                                                                                                                       
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";
import { renderAbilEmailHtml } from "../src/lib/emailTemplates/html.js";

export const config = { runtime: "nodejs", maxDuration: 120 };
const ADMIN_PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
const CRON_SECRET = process.env.CRON_SECRET || "";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
                                                                                                                   
                                                                                                                     
                                                                                                                          
const AUTOSEND_CFG = "prospecting/abil/autosend-config.json";
const AUTOSEND_STATE = "prospecting/abil/autosend-state.json";
                                                                                                                     
                                                                                                     
const SUPPRESS_KEY = "prospecting/abil/suppress.json";                                                                     
const FOLLOWUP_CFG = "prospecting/abil/followup-config.json";
const JOURNEY_CFG = "email/journey-config-abil.json";
const COPY_CACHE_KEY = "prospecting/abil/copy-cache.json";
const EVENTS_KEY = "replies/events.json";                                      
const LEADS_KEY = "crm/leads.json";                                                       
const runKey = (p: string) => `prospecting/abil/${p}-lastrun.json`;
const lockKey = (p: string) => `prospecting/abil/${p}.lock`;
const TENANT = "abil";
const FROM_NAME = process.env.COLD_FROM_NAME || process.env.OUTBOUND_FROM_NAME || "Samuel Dahan";                                                                                                                                                 
                                                                                                       
                                                                                                                  
const FROM_EMAIL = process.env.COLD_FROM_EMAIL || process.env.RESEND_FROM || "hello@abil.ch";
                                                                                                           
const ZOHO_USER = process.env.ZOHO_SMTP_USER || "";
const ZOHO_PASS = process.env.ZOHO_SMTP_PASS || "";
const ZOHO_READY = !!(ZOHO_USER && ZOHO_PASS);
const COLD_DOMAINS = (process.env.COLD_DOMAINS || "abil.ch").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
function isColdDomain(email: string): boolean { const m = String(email || "").toLowerCase().match(/@([^@\s>]+)/); return !!(m && COLD_DOMAINS.includes(m[1])); }
const SITE = "abil.ch";
                                                                                    
const SITE_URL = (process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app").replace(/\/$/, "");

                                                                                                            
                                                                                                               
const SEND_HARD_OFF = process.env.ABIL_SEND_HARD_OFF !== "0";
                                                                                                                        
function hardOffBlocked(res: VercelResponse, where: string): boolean {
  if (!SEND_HARD_OFF) return false;
  console.log(`[abil] HARD-OFF: envio bloqueado (teaser) . ${where}`);
  try { res.setHeader("Cache-Control", "no-store"); } catch {  }
  res.status(200).json({ ok: true, skipped: "hard_off_teaser", nota: "ABiL em teaser: envio de email desligado por trava de codigo (ABIL_SEND_HARD_OFF). Zero email sai." });
  return true;
}

                                                                                                                    
const DEFAULT_AUTOSEND = { enabled: false, dailyTarget: 40, warmupBase: 8, warmupDoubleEveryDays: 3, sendGapSeconds: 60, minConfidence: "media", segments: [] as string[], countries: [] as string[], sendHourStart: 9, sendHourEnd: 17, paused: false, signatureHtml: "" };
const DEFAULT_DAYS = [5, 10, 20];
                                                                                                     
                                                                           
const FOLLOWUP_NEG_DIAS = 5;
const NURTURE_PHASES = ["atracao", "boasvindas", "dor", "repost_blog", "solucao", "interesse", "prova", "qualificacao", "convite"];
const DEFAULT_CADENCE: Record<string, number> = { prospeccao: 0, atracao: 0, boasvindas: 1, dor: 4, repost_blog: 7, solucao: 11, interesse: 15, prova: 20, qualificacao: 25, convite: 30, projeto_publicado: 0 };
const MIN_GAP_MS = 20 * 60 * 60 * 1000;
const CONF_RANK: Record<string, number> = { baixa: 0, media: 1, alta: 2 };

                                                                                                                                                                                                                                                                       
function hdr(req: VercelRequest, n: string): string { const v = req.headers[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function qv(req: VercelRequest, n: string): string { const v = req.query[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function adminAuthed(req: VercelRequest): boolean {
  const tok = hdr(req, "x-abil-admin");
  if (ADMIN_PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}
function cronAuthed(req: VercelRequest): boolean { const a = hdr(req, "authorization"); return (!!CRON_SECRET && a === `Bearer ${CRON_SECRET}`) || adminAuthed(req); }
function mintAdmin(): string { const exp = Date.now() + 5 * 60 * 1000; const sig = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex"); return `${exp}.${sig}`; }
function baseUrl(): string { return (process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app").replace(/\/$/, ""); }
async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    if (BLOB_PUBLIC_BASE) { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.json(); if (r.status === 404) return fallback; }
    const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return fallback; const r = await fetch(`${bl.url}${bl.url.includes("?") ? "&" : "?"}cb=${Date.now()}`, { cache: "no-store" }); return r.ok ? await r.json() : fallback;
  } catch { return fallback; }
}
async function writeJson(key: string, data: any): Promise<void> { await put(key, JSON.stringify(data), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
async function acquireLock(p: string): Promise<boolean> {
  const k = lockKey(p);
  try { await put(k, JSON.stringify({ at: Date.now() }), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: false }); return true; }
  catch { try { const cur = await readJson<any>(k, null); const age = cur?.at ? Date.now() - cur.at : Infinity; if (age > 5 * 60 * 1000) { await put(k, JSON.stringify({ at: Date.now() }), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); return true; } } catch {  } return false; }
}
async function releaseLock(p: string): Promise<void> { try { await del(lockKey(p)); } catch {  } }
function todayStr(): string { return new Date().toISOString().slice(0, 10); }
                                                                                                             
                                                                                                                 
function sentThisStepToday(l: any, kind: "cold" | "fase2" | "followup"): boolean {
  const day = (iso: any) => (iso ? String(iso).slice(0, 10) : "");
  const today = todayStr();
  if (kind === "followup") return day(l?.lastFollowupAt) === today;
  if (kind === "fase2") return day(l?.fase2SentAt) === today;
  return day(l?.lastEmailSentAt) === today;                                                                           
}
function emailOk(e: any): boolean { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || "").trim()); }
function esc(s: any): string { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function emailKey(e: any): string { return String(e || "").trim().toLowerCase(); }
function absLink(u: string): string { const s = String(u || ""); return /^https?:\/\//.test(s) ? s : `${SITE_URL}${s.startsWith("/") ? "" : "/"}${s}`; }
function prenomOf(email: string): string { const loc = String(email || "").split("@")[0] || ""; const t = loc.split(/[._+\-0-9]/).filter(Boolean)[0] || ""; return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; }
function isEmpregoLead(l: any): boolean { const b = `${l?.notes || ""}\n${l?.resumo || ""}`; return (/Prova do sinal:/i.test(b) && /Decisor a achar:/i.test(b)) || /Est[áa] a contratar:/i.test(b); }
function warmupQuota(cfg: any, dayIdx: number): number { const every = Math.max(1, Number(cfg.warmupDoubleEveryDays) || 3); const factor = Math.pow(2, Math.floor(Math.max(0, dayIdx) / every)); return Math.min(Number(cfg.dailyTarget) || 40, Math.max(1, Math.round((Number(cfg.warmupBase) || 8) * factor))); }
                                                                                                                        
function suppressed(email: string, sup: any): boolean {
  const e = String(email || "").trim().toLowerCase(); if (!e || e.indexOf("@") < 0) return false;
  const ems = Array.isArray(sup?.emails) ? sup.emails.map((x: string) => String(x).toLowerCase().trim()) : [];
  if (ems.includes(e)) return true;
  const dom = e.split("@")[1] || "";
  const doms = Array.isArray(sup?.domains) ? sup.domains.map((d: string) => String(d).toLowerCase().replace(/^@/, "").trim()).filter(Boolean) : [];
  return doms.some((d: string) => dom === d || dom.endsWith("." + d));
}
                                                                                                          
                                                                                                                 
const FREEMAIL = new Set(["gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.it", "outlook.com", "outlook.pt", "live.com", "live.co.uk", "msn.com", "yahoo.com", "yahoo.co.uk", "yahoo.fr", "yahoo.it", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "gmx.com", "gmx.net", "protonmail.com", "proton.me", "mail.com", "yandex.com", "sapo.pt", "orange.fr", "free.fr", "laposte.net", "bluewin.ch", "sunrise.ch", "libero.it", "virgilio.it"]);
const domainOf = (em: any): string => { const e = String(em || "").trim().toLowerCase(); const i = e.indexOf("@"); return i > 0 ? e.slice(i + 1) : ""; };
                                                                                                                
                                                                                                                    
                                                                                                                 
                                                                                                                    
                                                                                                                        
function hasResponded(l: any): boolean { return !!(l && (l.replied || String(l.outcome || "") === "declinou")); }
function respondedDomains(leads: any[]): Set<string> { const s = new Set<string>(); for (const l of leads) { if (hasResponded(l)) { const d = domainOf(l?.email); if (d && !FREEMAIL.has(d)) s.add(d); } } return s; }
                                                                                                                
                                                                                                            
                                                                                                   
                                                
                                                                                                   
                                                                                                  
                                                                                                
                                                                                                
                                                           
                                                                  
function leadPodeReceberProspeccao(l: any, ctx: { sup?: any; respDoms?: Set<string>; mode: "cold" | "conversa" | "marketing" }): boolean {
  if (!l) return false;
  if ((l as any).humanHandoff) return false;
  if (String(l.lifecycle || "active") !== "active") return false;
  const em = String(l.email || "").trim().toLowerCase();
  if (!em || em.indexOf("@") < 0) return false;
  if (l.emailBounced) return false;
  if (ctx.sup && suppressed(em, ctx.sup)) return false;
  if (String((l as any).negativeKind || "") === "hostil" || (l as any).optOutAt) return false;
  const declinou = String(l.outcome || "") === "declinou" || String(l.replyClass || "") === "negativa";
  if (ctx.mode === "marketing") {
    if (declinou && String((l as any).negativeKind || "") !== "suave") return false;
    if ((l as any).marketingOptIn === false) return false;
    return true;
  }
  if (declinou) return false;
  const ooo = String((l as any).oooUntil || "");
  if (ooo && Date.parse(ooo) > Date.now()) return false;
  if (ctx.mode === "conversa") return !!l.replied && String(l.replyClass || "") === "positiva";
                                                                                              
  if (l.replied || hasResponded(l)) return false;
  const d = domainOf(em);
  if (d && !FREEMAIL.has(d) && ctx.respDoms && ctx.respDoms.has(d)) return false;
  return true;
}
                                                                                                                  
                                                                                                                    
                                                                                                                    
                                                                                                                  
                                                                                              
function noDash(s: string): string {
  return String(s || "")
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1-$2")
    .replace(/\s*[\u2013\u2014]\s*/g, ", ");
}

                                                                                                                                                                                                                                  
type Copy = { subject: string; body: string[]; optout: string; semMarca?: string; ctaLabel?: string };
function langOfLead(lead: any): string {
  const pais = String(lead?.pais || "").toLowerCase();
  if (/bras|brazil|br[ée]sil/.test(pais)) return "pt-BR";
  if (/portugal/.test(pais)) return "pt-PT";
  const i = String(lead?.idioma || "").toLowerCase();
  if (i === "pt") return "pt-PT";
  return ["en", "fr", "de", "it", "es"].includes(i) ? i : "en";
}
                                                                                                                     
                                                                                                                     
                                                                                                                     
                                                                                 
const LANG_LABEL: Record<string, string> = { "pt-BR": "portugues", "pt-PT": "portugues", en: "ingles", fr: "frances", de: "alemao", it: "italiano", es: "espanhol" };
function hashStr(s: string): string { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
                                                                                                                      
                                                                                                                      
                                                                                                                     
                                                                                                           
                                                                                                                     
                                                                                                                  
                                                                  
async function localizeCopy(purpose: string, baseMap: Record<string, Copy>, lang: string, srcLang = "pt-PT"): Promise<Copy> {
  if ((lang === "fr" || lang === "pt-PT" || lang === "en") && baseMap[lang]) return baseMap[lang];
  const src = baseMap[srcLang] || baseMap["pt-PT"] || baseMap["en"] || baseMap["fr"];                                           
  if (lang === "pt-BR" && srcLang.startsWith("pt")) return src;                                                  
  const fromCode = srcLang.startsWith("pt") ? "pt" : srcLang;                                        
  const toCode = lang === "pt-BR" ? "pt" : lang;                                                                     
  const ck = `${purpose}:${lang}:${hashStr(src.subject + src.body.join("|") + (src.ctaLabel || ""))}`;
  const cache = await readJson<Record<string, Copy>>(COPY_CACHE_KEY, {});
  if (cache[ck]) return cache[ck];
  const tok = mintAdmin(); const url = `${baseUrl()}/api/translate`;
  const tr = async (t: string) => { if (!t) return t; try { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ text: t, from: fromCode, to: toCode }) }); const d: any = await r.json(); return (d && typeof d.translated === "string" && d.translated.trim()) ? d.translated.trim() : t; } catch { return t; } };
  const subject = await tr(src.subject);
  const bodyJoined = await tr(src.body.join("\n\n"));
  const optout = await tr(src.optout);
  const ctaLabel = src.ctaLabel ? await tr(src.ctaLabel) : undefined;
                                                                                                                               
  const out: Copy = { subject: noDash(subject), body: bodyJoined.split(/\n\n+/).map((s: string) => noDash(s.trim())).filter(Boolean), optout: noDash(optout), semMarca: src.semMarca, ctaLabel: ctaLabel ? noDash(ctaLabel) : undefined };
  cache[ck] = out; try { await writeJson(COPY_CACHE_KEY, cache); } catch {  }
  return out;
}
                                                                                                         
                                                                                                        
                                                                                                     
                                                                                                    
const DEFAULT_SIGNATURE_HTML = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr><td style="padding:12px 0 0 0"><div style="font-size:14px;font-weight:bold;color:#0a0a0b">Samuel Dahan</div><div style="font-size:12px;color:#555">ABiL MEDiAS &middot; Habilit&eacute;s en communication</div><div style="font-size:12px;color:#555">Rue de Berne 59, 1201 Gen&egrave;ve &middot; +41 22 548 00 40</div><div style="font-size:12px"><a href="https://abil.ch" style="color:#0a0a0b">abil.ch</a> &middot; <a href="mailto:sam@abil.ch" style="color:#0a0a0b">sam@abil.ch</a></div></td></tr></table>`;
function renderCopy(copy: Copy, marca: string, signatureHtml?: string, link?: string): { subject: string; html: string } {
  const m = marca || copy.semMarca || "a marca";
  const fill = (s: string) => esc(noDash(s)).replace(/\[EMPRESA\]/g, esc(m));                                                                                                        
  const sign = (signatureHtml && signatureHtml.length > 20) ? `<div style="margin-top:20px">${signatureHtml}</div>` : `<div style="margin-top:20px">${DEFAULT_SIGNATURE_HTML}</div>`;
                                                                                                                
                                                                                                                    
                                                                             
  const linkUrl = link ? esc(absLink(link)) : "";
  const linkLine = link ? `<p style="margin:0 0 14px">${fill(copy.ctaLabel || "Ver a leitura")}: <a href="${linkUrl}">${linkUrl.replace(/^https?:\/\//, "")}</a></p>` : "";
  const inner = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;text-align:left">${copy.body.map((p) => `<p style="margin:0 0 14px">${fill(p)}</p>`).join("")}${linkLine}${sign}<div style="margin-top:18px;color:#9a9a9a;font-size:12px">${fill(copy.optout)}</div></div>`;
                                                                                                                   
                                                                           
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>:root{color-scheme:light dark}</style></head><body style="margin:0;padding:0">${inner}</body></html>`;
  return { subject: fill(copy.subject), html };                                                                       
}

                                                                                                                      
                                                                                                                               
const OPTOUT = { "pt-BR": "Se preferir que não voltemos a escrever, é só dizer.", "pt-PT": "Se preferir que não voltemos a escrever, é só dizer.", "en": "If you'd rather we didn't write again, just let us know.", "fr": "Si vous préférez ne plus recevoir de message, dites-le nous." };
                                                                                                              
                                                                                                                 
                                                                                                   
const ORIGIN = { "pt-BR": "Escrevemos porque encontrámos a [EMPRESA] publicamente (no Google ou na vossa página).", "pt-PT": "Escrevemos porque encontrámos a [EMPRESA] publicamente (no Google ou na vossa página).", "en": "We're writing because we found [EMPRESA] publicly (on Google or on your website).", "fr": "Nous vous écrivons parce que nous avons trouvé [EMPRESA] publiquement (sur Google ou sur votre site)." };
const COLD_OPTOUT = { "pt-BR": `${ORIGIN["pt-BR"]} ${OPTOUT["pt-BR"]}`, "pt-PT": `${ORIGIN["pt-PT"]} ${OPTOUT["pt-PT"]}`, "en": `${ORIGIN["en"]} ${OPTOUT["en"]}`, "fr": `${ORIGIN["fr"]} ${OPTOUT["fr"]}` };
                                                                                                                             
const COLD_BASE: Record<string, Copy> = {
  "fr": { subject: "Une note sur [EMPRESA]", semMarca: "votre marque", optout: COLD_OPTOUT["fr"], body: ["Bonjour,", "Je suis Samuel Dahan, associé directeur de ABiL, atelier créatif à Genève. Depuis 2015, la stratégie, la direction artistique et la production vivent chez nous sous le même toit.", "J'ai croisé [EMPRESA] et j'y ai repensé : je la regarde posément et je vous dis, sans détour, où la marque pourrait aller plus loin. Courte, honnête, gratuite. Sans aucun engagement.", "Souhaitez-vous que je la prépare et vous l'envoie ? Si le moment est mal choisi, ignorez simplement ce message.", "Samuel"] },
  "pt-PT": { subject: "Uma nota sobre a [EMPRESA]", semMarca: "a vossa marca", optout: COLD_OPTOUT["pt-PT"], body: ["Olá,", "Sou o Samuel Dahan, sócio-diretor do ABiL, atelier criativo em Genève, na Suíça. Desde 2015 que a estratégia, a direção artística e a produção vivem connosco sob o mesmo teto.", "Cruzei-me com a [EMPRESA] e fiquei a pensar nela: olho com calma e digo-vos, sem rodeios, onde a marca podia ir mais longe. Curta, honesta, gratuita. Sem compromisso nenhum.", "Querem que a prepare e vos envie? Se não for a altura, ignorem à vontade.", "Samuel"] },
  "en": { subject: "A note about [EMPRESA]", semMarca: "your brand", optout: COLD_OPTOUT["en"], body: ["Hello,", "I am Samuel Dahan, managing partner at ABiL, a creative atelier in Genève, Switzerland. Since 2015, strategy, art direction and production have lived with us under one roof.", "[EMPRESA] caught my eye and stayed on my mind: I take a proper look and tell you, plainly, where the brand could go further. Short, honest, free. No strings at all.", "Would you like me to put it together and send it over? If it is not the moment, simply ignore this.", "Samuel"] },
};
                                                                                                                    
const FASE2_BASE: Record<string, Copy> = {
  "fr": { subject: "La lecture de [EMPRESA], comme promis", semMarca: "votre marque", optout: OPTOUT["fr"], ctaLabel: "Voir la lecture", body: ["Bonjour,", "Comme convenu, la voici. J'ai regardé [EMPRESA] à l'atelier et tout réuni sur une seule page : ce qui est déjà fort, et là où je mènerais la marque.", "Rien à vendre. C'est ma lecture honnête, à garder même si nos chemins ne se recroisent jamais.", "Si quelque chose vous parle, dites-moi ce que vous en pensez. Je serais ravi de vous lire.", "Samuel"] },
  "pt-PT": { subject: "A leitura da [EMPRESA], como prometido", semMarca: "a vossa marca", optout: OPTOUT["pt-PT"], ctaLabel: "Ver a leitura", body: ["Olá,", "Como combinámos, aqui está. Olhei para a [EMPRESA] no atelier e reuni tudo numa só página: o que já está forte, e onde eu levaria a marca.", "Sem vender nada. É a minha leitura honesta, para guardar mesmo que os nossos caminhos nunca mais se cruzem.", "Se algo aí vos tocar, digam-me o que acharam. Ia adorar ler-vos.", "Samuel"] },
  "en": { subject: "The read on [EMPRESA], as promised", semMarca: "your brand", optout: OPTOUT["en"], ctaLabel: "See the read", body: ["Hello,", "As agreed, here it is. I looked at [EMPRESA] in the atelier and gathered it all on one page: what is already strong, and where I would take the brand.", "Nothing to sell. It is my honest read, yours to keep even if our paths never cross again.", "If anything resonates, tell me what you think. I would love to hear from you.", "Samuel"] },
};
                                                                                                                     
                                                                                                                    
                                                                                                                    
                                                                                                               
const FOLLOWUP_BASE: Array<Record<string, Copy>> = [
  {
    "fr": { subject: "Un mot rapide", semMarca: "votre marque", optout: OPTOUT["fr"], body: ["Bonjour, la boîte de réception ne pardonne rien, alors je serai bref. Il y a quelques jours, je vous proposais de regarder [EMPRESA] de près et de vous envoyer une lecture honnête et gratuite.", "L'offre tient toujours. Un oui, et je la prépare. Un silence, et je vous laisse tranquille.", "Samuel"] },
    "pt-PT": { subject: "Uma linha rápida", semMarca: "a vossa marca", optout: OPTOUT["pt-PT"], body: ["Olá, a caixa de entrada não perdoa, por isso vou ser breve. Há uns dias propus olhar de perto para a [EMPRESA] e enviar-vos uma leitura honesta e gratuita.", "A oferta mantém-se. Um sim, e preparo-a. Um silêncio, e deixo-vos em paz.", "Samuel"] },
    "en": { subject: "A quick line", semMarca: "your brand", optout: OPTOUT["en"], body: ["Hello, the inbox is brutal, so I will keep this short. A few days ago I offered to take a close look at [EMPRESA] and send you an honest, free read.", "The offer still stands. A yes, and I will put it together. Silence, and I will leave you in peace.", "Samuel"] },
  },
  {
    "fr": { subject: "Ce n'était peut-être pas le moment", semMarca: "votre marque", optout: OPTOUT["fr"], body: ["Bonjour, je vous ai sans doute écrit une semaine chargée, aucun souci. Juste une pensée, vraie même si nous ne travaillons jamais ensemble : aujourd'hui, la marque est la première chose qui parle pour vous, avant toute réunion. Autant qu'elle joue en votre faveur.", "Si vous voulez que je la regarde et vous dise ce que je ferais, il suffit de répondre.", "Samuel"] },
    "pt-PT": { subject: "Talvez não fosse a altura", semMarca: "a vossa marca", optout: OPTOUT["pt-PT"], body: ["Olá, se calhar apanhei-vos numa semana cheia, sem problema. Fica só um pensamento, que vale mesmo que nunca trabalhemos juntos: hoje a marca é a primeira coisa que fala por vós, antes de qualquer reunião. Vale a pena que jogue a vosso favor.", "Se quiserem que eu a olhe e vos diga o que faria, basta responder.", "Samuel"] },
    "en": { subject: "Perhaps it was not the moment", semMarca: "your brand", optout: OPTOUT["en"], body: ["Hello, I probably reached you in a full week, no problem. Just one thought, true even if we never work together: today the brand is the first thing that speaks for you, before any meeting. Worth having it work in your favour.", "If you would like me to look and tell you what I would do, just reply.", "Samuel"] },
  },
  {
    "fr": { subject: "Je m'arrête ici (la porte reste ouverte)", semMarca: "votre marque", optout: OPTOUT["fr"], body: ["Bonjour, je ne veux pas encombrer davantage votre boîte de réception, alors ce sera le dernier. Je m'arrête ici.", "Mais la porte reste ouverte : le jour où [EMPRESA] voudra une marque à la hauteur de ce que vous avez bâti, répondez à ce message et nous reprenons là où nous en étions.", "Merci pour votre temps.", "Samuel"] },
    "pt-PT": { subject: "Fico por aqui (porta aberta)", semMarca: "a vossa marca", optout: OPTOUT["pt-PT"], body: ["Olá, não quero encher mais a vossa caixa de entrada, por isso este é o último. Fico por aqui.", "Mas a porta fica aberta: no dia em que a [EMPRESA] quiser uma marca à altura do que já construíram, respondam a este email e retomamos de onde ficámos.", "Obrigado pelo tempo.", "Samuel"] },
    "en": { subject: "I will leave it here (door open)", semMarca: "your brand", optout: OPTOUT["en"], body: ["Hello, I do not want to fill your inbox any further, so this is the last one. I will leave it here.", "But the door stays open: the day [EMPRESA] wants a brand worthy of what you have built, reply to this email and we pick up where we left off.", "Thank you for your time.", "Samuel"] },
  },
];

                                                                                                                     
                                                                                                                  
                                       

                                                                                                                                                                                                                        
                                                                                              
const POS = /\b(yes\b|yeah|sure,? (yes|please|send|go)|please (do|send|share)|go ahead|sounds (good|great)|i'?d love|i would love|keen to|tell me more|let'?s (talk|chat|schedule)|schedule a (call|meeting)|(i'?m|i am) (curious|interested)|send (it|them) (over|through)|sim,? (por favor|claro|manda|envia|quero|pode)|com certeza|claro,? (que sim|manda|envia|sim|pode)|por favor,? (manda|envia)|pode (enviar|mandar|preparar)|podes (enviar|mandar|preparar)|gostaria de (ver|saber|receber)|quero (ver|saber|receber)|tenho (interesse|curiosidade)|fico (curioso|a aguardar)|vamos (falar|conversar)|agende|marque uma|avec plaisir|volontiers|oui\b|c'?est d'?accord|d'?accord,?\s|tu peux (pr[ée]parer|envoyer|m'?envoyer)|vous pouvez (pr[ée]parer|envoyer|m'?envoyer)|envoie[sz]?[- ](le|la|moi|nous)?|je suis (curieux|curieuse|int[ée]ress[ée]+)|(ç|c)a m'?int[ée]resse|ja,? (bitte|gerne|her|das)|gerne,? (ja|her)|klingt (gut|interessant|spannend)|schicken sie (es )?(mir|uns)|bin (interessiert|gespannt|neugierig)|s[íi],?\s|claro,? env[íi]|env[íi][ae]melo|me interesa|estoy interesad|s[ìi],?\s|certo,? mandami|mandami (pure|la)|mi piacerebbe|mi interessa|sono (curioso|curiosa|interessat))\b/i;
const NEG = /\b(no thanks?|not interested|unsubscribe|remove me|opt[- ]?out|stop sending|don'?t send|please don'?t|spam|wrong (person|address|number|email)|who (is|are) (this|you)|how did you get|n[ãa]o( ,| obrigad| interess| envie| quero| me)|nein danke|non merci|no gracias|leave me alone)\b/i;
const AUTOREPLY = /\b(out of office|automatic reply|auto[- ]?reply|on (vacation|leave|holiday)|away from (my|the office)|fora do escrit[óo]rio|de f[ée]rias|resposta autom[áa]tica|abwesenheit|absence du bureau|delivery (status|failure)|undeliverable|mailer-daemon|returned to sender)\b/i;
function isPositive(text: string): boolean { const t = String(text || ""); return POS.test(t) && !NEG.test(t) && !AUTOREPLY.test(t); }

                                                                                                                                                  
                                                                                                                      
function renderJourneyHtml(t: any, prenom: string, gdpr: string, phase?: string): string {
                                                                             
                                                                             
                                                                           
                                                                          
                                                                   
  const base = baseUrl();
  const abs = (src: string) => {
    const raw = String(src || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return raw.startsWith("/") ? base + raw : raw;
  };
  const html = renderAbilEmailHtml({
    phase: phase || String(t.phase || ""),
    subject: String(t.subject || ""),
    preheader: String(t.preheader || ""),
    body: String(t.body || ""),
    ctaLabel: String(t.ctaLabel || ""),
    ctaUrl: String(t.ctaUrl || ""),
    heroImage: String(t.heroUrl || ""),
    projectGallery: Array.isArray(t.gallery) ? t.gallery : [],
    blocks: Array.isArray(t.blocks) ? t.blocks : [],
  }, { absolute: abs, mergeName: prenom, preheader: String(t.preheader || "") });
                                                                               
                                                      
  return gdpr
    ? html.replace("</body></html>", `<div style="padding:18px 29px 28px;background:#efefef;color:#7e7e7e;font:300 11px/1.5 Arial,sans-serif;">${gdpr}</div></body></html>`)
    : html;
}

function jrnLang(l: any): string { const x = String(l.idioma || "").toLowerCase(); return ["pt", "en", "fr", "de", "it"].includes(x) ? x : "en"; }

                                                                                                 
async function sharedSignature(): Promise<string> { const c = await readJson<any>(AUTOSEND_CFG, {}); return typeof c?.signatureHtml === "string" ? c.signatureHtml : ""; }

           
async function coldEmail(lead: any, signatureHtml?: string, langOverride?: string): Promise<{ subject: string; html: string }> {
  const lang = langOverride || langOfLead(lead);
  const copy = await localizeCopy("cold", COLD_BASE, lang);
  return renderCopy(copy, String(lead?.entreprise || lead?.nom || "").trim(), signatureHtml);
}
                                                                                                                     
async function fase2Email(lead: any, link: string, signatureHtml?: string): Promise<{ subject: string; html: string }> {
  const lang = langOfLead(lead);
  const copy = await localizeCopy("fase2", FASE2_BASE, lang);
  return renderCopy(copy, String(lead?.entreprise || lead?.nom || "").trim(), signatureHtml, link);
}
                                                                                                                                
                                                                                                                
                                                                                                                  
                                                                                                                
                                                                                                         
                                                                                                                         
const FU_COPY_LANGS = ["fr", "pt-PT", "en"];                                                        
const FU_MAX_SEGS = 40;
function cleanFuText(s: any, max: number): string {
  return String(s == null ? "" : s).replace(/<[^>]*>/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}
                                                                                          
function sanitizeFuTouches(arr: any): Array<{ assunto: string; corpo: string }> | null {
  if (!Array.isArray(arr) || arr.length !== 3) return null;
  const out = arr.map((t: any) => ({ assunto: cleanFuText(t?.assunto, 200), corpo: cleanFuText(t?.corpo, 4000) }));
  return out.some((t) => !t.assunto || !t.corpo) ? null : out;
}
async function fuSegOverride(lead: any, step: number, baseMap: Record<string, Copy>): Promise<{ map: Record<string, Copy>; srcLang: string; segKey: string } | null> {
  const segKey = String(lead?.setor || "").trim();
  if (!segKey) return null;
  const fcfg = await readJson<any>(FOLLOWUP_CFG, {});
  const byS = (fcfg && fcfg.copyBySeg && typeof fcfg.copyBySeg === "object") ? fcfg.copyBySeg : null;
  const entry = byS ? byS[segKey] : null;
  const toques = (entry && Array.isArray(entry.toques)) ? entry.toques : null;
  const t = toques ? toques[Math.max(0, Math.min(2, step))] : null;
  const assunto = cleanFuText(t?.assunto, 200); const corpo = cleanFuText(t?.corpo, 4000);
  if (!assunto || !corpo) return null;
  const srcLang = FU_COPY_LANGS.includes(String(entry.lang || "")) ? String(entry.lang) : "fr";
  const base = baseMap[srcLang] || baseMap["fr"] || baseMap["en"] || baseMap["pt-PT"];
  const copy: Copy = { subject: assunto, body: corpo.split(/\n\n+/).map((s: string) => s.trim()).filter(Boolean), optout: base.optout, semMarca: base.semMarca, ctaLabel: base.ctaLabel };
  return { map: { [srcLang]: copy }, srcLang, segKey };
}
                                                                                                                
                                                                                                                 
                                                                                                              
async function aiFollowupBody(lead: any, step: number, prompt: string, lang: string, marca: string): Promise<string[] | null> {
  try {
                                                                                                                  
                                                                                                                
                                                                 
    const coldMap = COLD_BASE;
    const coldBase = coldMap[lang] || coldMap["fr"] || coldMap["pt-PT"] || coldMap["en"];
    const coldText = coldBase ? coldBase.body.join("\n\n").replace(/\[EMPRESA\]/g, marca || coldBase.semMarca || "") : "";
    const sentMs = lead?.lastEmailSentAt ? Date.parse(lead.lastEmailSentAt) : 0;
    const daysElapsed = sentMs ? Math.max(0, Math.round((Date.now() - sentMs) / 86400000)) : 0;
    const langName = LANG_LABEL[lang] || "frances";
    const tok = mintAdmin();
    const r = await fetch(`${baseUrl()}/api/reply-scan?action=followup-copy`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leadId: String(lead.id), step, prompt, langName, coldText, daysElapsed, marca }) });
    if (!r.ok) return null;
    const d: any = await r.json().catch(() => null);
    if (!d?.ok || !Array.isArray(d.body) || !d.body.length) return null;
    const body = d.body.map((s: any) => String(s || "").trim()).filter(Boolean).slice(0, 8);
    return body.length ? body : null;
  } catch { return null; }
}
async function followupEmail(lead: any, step: number, signatureHtml?: string, langOverride?: string): Promise<{ subject: string; html: string }> {
  const lang = langOverride || langOfLead(lead);
                                                                                                                    
                                                                     
  const touch = (FOLLOWUP_BASE[step] || FOLLOWUP_BASE[0]);
  const marca = String(lead?.entreprise || lead?.nom || "").trim();
                                                                                                                      
                                                                                                                    
                                                                                                                
  const fcfg = await readJson<any>(FOLLOWUP_CFG, {});
                                                                                                               
                                                                             
                                                                                                       
  const fuPromptScoped = String(fcfg.followupPromptCliente || "").trim();
  const fuPrompt = fuPromptScoped || (typeof fcfg.followupPrompt === "string" ? fcfg.followupPrompt.trim() : "");
  const leadId = String(lead?.id || "").trim();
  if (fuPrompt && leadId) {
    const aiBody = await aiFollowupBody(lead, step, fuPrompt, lang, marca);
    if (aiBody && aiBody.length) {
      const meta = await localizeCopy(`followup${step}`, touch, lang);
      return renderCopy({ ...meta, body: aiBody }, marca, signatureHtml);
    }
  }
                                                                                                             
  const ov = await fuSegOverride(lead, step, touch);
  const copy = ov
    ? await localizeCopy(`followup${step}:seg:${ov.segKey}`, ov.map, lang, ov.srcLang)                                                                                
    : await localizeCopy(`followup${step}`, touch, lang);
  return renderCopy(copy, marca, signatureHtml);
}
async function loadLeads(): Promise<any[]> { const cloud = await readJson<any>(LEADS_KEY, { leads: [] }); return Array.isArray(cloud) ? cloud : (Array.isArray(cloud?.leads) ? cloud.leads : []); }

                                                                                                                                                                                                                                                                                  
                                           
async function runAutosend(req: VercelRequest, res: VercelResponse, dryRun: boolean) {
  if (hardOffBlocked(res, "autosend")) return;                                       
  const cfg = { ...DEFAULT_AUTOSEND, ...(await readJson<any>(AUTOSEND_CFG, {})) };
  if (!dryRun && (!cfg.enabled || cfg.paused)) return res.status(200).json({ ok: true, skipped: cfg.paused ? "pausado" : "desligado" });
  if (!dryRun && !(await acquireLock("autosend"))) return res.status(200).json({ ok: true, skipped: "outra_corrida_em_curso" });
  try {
    let st = await readJson<any>(AUTOSEND_STATE, { date: todayStr(), sentToday: 0, warmupStartedAt: "" });
    if (!st.warmupStartedAt) { st = { ...st, warmupStartedAt: new Date().toISOString() }; if (!dryRun) await writeJson(AUTOSEND_STATE, st); }
    if (st.date !== todayStr()) { st = { ...st, date: todayStr(), sentToday: 0 }; if (!dryRun) await writeJson(AUTOSEND_STATE, st); }
    const dayIdx = Math.floor((Date.now() - Date.parse(st.warmupStartedAt)) / 86400000);
    const quota = warmupQuota(cfg, dayIdx); const remaining = Math.max(0, quota - (st.sentToday || 0));
    if (remaining <= 0) return res.status(200).json({ ok: true, skipped: "quota_de_hoje_atingida", quota, enviadosHoje: st.sentToday });
    const now = Date.now();
    const startMs = (() => { const d = new Date(); d.setUTCHours(Number(cfg.sendHourStart) || 9, 0, 0, 0); return d.getTime(); })();
    const endMs = (() => { const d = new Date(); d.setUTCHours(Number(cfg.sendHourEnd) || 17, 0, 0, 0); return d.getTime(); })();
    const winStart = Math.max(now, startMs);
    if (!dryRun && winStart >= endMs - 60000) return res.status(200).json({ ok: true, skipped: "fora_da_janela_de_envio" });
    const base = baseUrl(); const leads = await loadLeads();
    const minRank = CONF_RANK[String(cfg.minConfidence || "media")] ?? 1;
    const segOk = (l: any) => !cfg.segments?.length || cfg.segments.includes(String(l.setor || ""));
    const paisOk = (l: any) => !cfg.countries?.length || cfg.countries.includes(String(l.pais || ""));
    const sup = await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] });
    const respDoms = respondedDomains(leads);                                                                 
                                                                                                            
                                                                                                            
    let eligible = leads.filter((l) => l && leadPodeReceberProspeccao(l, { sup, respDoms, mode: "cold" }) && l.fase === "lead" && emailOk(l.email) && !l.lastEmailSentAt && !sentThisStepToday(l, "cold") && !isEmpregoLead(l) && !hasResponded(l) && !respDoms.has(domainOf(l.email)) && String(l.abordagem || "cliente") !== "agencia" && (CONF_RANK[String(l.emailConfidence || "media")] ?? 1) >= minRank && segOk(l) && paisOk(l)).sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    const seen = new Set<string>(); eligible = eligible.filter((l) => { const e = emailKey(l.email); if (seen.has(e)) return false; seen.add(e); return true; });
    const picked = eligible.slice(0, remaining);
    if (dryRun) return res.status(200).json({ ok: true, dryRun: true, diaAquecimento: dayIdx + 1, quota, remaining, elegiveis: eligible.length, vaiEnviar: picked.length, exemplos: picked.slice(0, 6).map((l) => ({ entreprise: l.entreprise, pais: l.pais, setor: l.setor, email: l.email, conf: l.emailConfidence, lang: langOfLead(l) })) });
    if (!picked.length) return res.status(200).json({ ok: true, enviados: 0, nota: "sem leads elegíveis hoje" });
    const adminTok = mintAdmin();
    let reserved = false;
    try { const rr = await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: picked.map((l) => ({ id: l.id, lastEmailSentAt: new Date().toISOString(), followupCount: 0 })) }) }); const rd: any = await rr.json().catch(() => ({})); reserved = rr.ok && !!rd?.ok; } catch { reserved = false; }
    if (!reserved) return res.status(200).json({ ok: false, skipped: "nao_reservou", note: "não enviei: falhei a marcar contactados (trava anti-duplicação)" });
    const gap = picked.length > 1 ? Math.max(Math.max(5, Number(cfg.sendGapSeconds) || 60) * 1000, Math.floor((endMs - winStart) / picked.length)) : 0;                                                   
    const sig = cfg.signatureHtml;
    const items = await Promise.all(picked.map(async (l, i) => { const { subject, html } = await coldEmail(l, sig); return { id: `cold-${l.id}-${now}`, dedupeKey: `${TENANT}:cold:${l.id}:${todayStr()}`, to: String(l.email).trim(), subject, html, fromName: FROM_NAME, fromEmail: FROM_EMAIL, scheduledAt: new Date(winStart + i * gap + Math.floor(Math.random() * Math.min(gap * 0.6, 15 * 60 * 1000))).toISOString(), leadId: l.id, empresa: l.entreprise || l.nom || "", segmento: l.setor || "" }; }));
    let enqueued = 0;
    try { const r = await fetch(`${base}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ tenantId: TENANT, items }) }); const d: any = await r.json().catch(() => ({})); enqueued = d?.ok ? (Array.isArray(d.added) ? d.added.length : items.length) : 0; } catch {  }
    st = { ...st, sentToday: (st.sentToday || 0) + picked.length }; await writeJson(AUTOSEND_STATE, st);
    const summary = { at: new Date().toISOString(), diaAquecimento: dayIdx + 1, quota, elegiveis: eligible.length, reservados: picked.length, enfileirados: enqueued, enviadosHoje: st.sentToday };
    try { await writeJson(runKey("autosend"), summary); } catch {  }
    return res.status(200).json({ ok: true, ...summary });
  } finally { if (!dryRun) await releaseLock("autosend"); }
}

                                                                                                                     
                                                                                                                        
                                                                                                                   
                                                                                                             

                                                                                                              
async function runFlow(req: VercelRequest, res: VercelResponse, dryRun: boolean) {
  if (hardOffBlocked(res, "flow")) return;                                                                  
  const asend = await readJson<any>(AUTOSEND_CFG, {});
  if (!dryRun && (!asend.enabled || asend.paused)) return res.status(200).json({ ok: true, skipped: asend?.paused ? "pausado" : "desligado" });
  if (!dryRun && !(await acquireLock("flow"))) return res.status(200).json({ ok: true, skipped: "outra_corrida_em_curso" });
  try {
    const base = baseUrl(); const leads = await loadLeads();
    const fcfg = await readJson<any>(FOLLOWUP_CFG, {}); const followupColdEnabled = !!(fcfg.enabled && fcfg.followupColdEnabled);                                                                                                  
    const byEmail = new Map<string, any>(); for (const l of leads) { const e = emailKey(l.email); if (e) byEmail.set(e, l); }
    const events: any[] = await readJson<any[]>(EVENTS_KEY, []);
    const repliedEmails = new Set<string>(events.map((e) => emailKey(e.fromEmail)).filter(Boolean));
    const supFL = await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] });                                                                        
    const adminTok = mintAdmin(); const sig = await sharedSignature();
                                                                                                    
    const f2seen = new Set<string>(); const f2cands: any[] = [];
                                                                                                                
                                                                                                              
                                                                                                        
    for (const ev of events) { const lead = byEmail.get(emailKey(ev.fromEmail)); if (!lead) continue; if ((lead as any).humanHandoff) continue;                                                      if (String(lead.lifecycle || "active") !== "active") continue; if (String(lead.outcome || "") === "declinou" || String(lead.replyClass || "") === "negativa") continue; if (String((lead as any).negativeKind || "") === "hostil" || (lead as any).optOutAt) continue; if (lead.emailBounced) continue; if (suppressed(String(lead.email || ""), supFL)) continue; if (f2seen.has(lead.id) || lead.fase2SentAt || sentThisStepToday(lead, "fase2")) continue; if (!lead.audit?.publishedUrl) continue; if (!isPositive(`${ev.subject || ""} ${ev.snippet || ""}`)) continue; f2seen.add(lead.id); f2cands.push(lead); }
    let f2sent = 0; let f2reserved = false;
    if (f2cands.length && !dryRun) {
      try { const rr = await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: f2cands.map((l) => ({ id: l.id, fase2SentAt: new Date().toISOString() })) }) }); const rd: any = await rr.json().catch(() => ({})); f2reserved = rr.ok && !!rd?.ok; } catch { f2reserved = false; }
      if (f2reserved) {
        const items = await Promise.all(f2cands.map(async (l, i) => { const { subject, html } = await fase2Email(l, l.audit.publishedUrl, sig); return { id: `fase2-${l.id}-${Date.now()}`, dedupeKey: `${TENANT}:fase2:${l.id}:${todayStr()}`, to: String(l.email).trim(), subject, html, fromName: FROM_NAME, fromEmail: FROM_EMAIL, scheduledAt: new Date(Date.now() + i * 90000).toISOString(), leadId: l.id, empresa: l.entreprise || l.nom || "", segmento: l.setor || "" }; }));
        try { const r = await fetch(`${base}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ tenantId: TENANT, items }) }); const d: any = await r.json().catch(() => ({})); f2sent = d?.ok ? (Array.isArray(d.added) ? d.added.length : items.length) : 0; } catch { f2sent = 0; }
        if (f2sent === 0) { try { await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: f2cands.map((l) => ({ id: l.id, fase2SentAt: null })) }) }); } catch {  } }
      }
    }
                                                                                                                      
    const now = Date.now();
    const respDoms = respondedDomains(leads);                                                                               
    const enrollCands = leads.filter((l) => l && leadPodeReceberProspeccao(l, { sup: supFL, respDoms, mode: "cold" }) && l.fase === "lead" && l.lastEmailSentAt && !l.nurtureStartedAt && !l.marketingOptIn && (!followupColdEnabled || Number(l.followupCount || 0) >= 3) && !l.fase2SentAt && !hasResponded(l) && !respDoms.has(domainOf(l.email)) && !repliedEmails.has(emailKey(l.email)) && (now - Date.parse(l.lastEmailSentAt)) >= 25 * 86400000).slice(0, 500);
    let enrolled = 0;
    if (enrollCands.length && !dryRun) { try { const r = await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: enrollCands.map((l) => ({ id: l.id, nurtureStartedAt: new Date().toISOString(), nurtureStep: 0 })) }) }); const d: any = await r.json().catch(() => ({})); enrolled = d?.ok ? enrollCands.length : 0; } catch {  } }
    const summary = { at: new Date().toISOString(), fase2Candidatos: f2cands.length, fase2Reservados: f2reserved, fase2Enviados: f2sent, nurtureCandidatos: enrollCands.length, nurtureInscritos: enrolled, dryRun: !!dryRun };
    if (!dryRun) { try { await writeJson(runKey("flow"), summary); } catch {  } }
    return res.status(200).json({ ok: true, ...summary, exemplosFase2: f2cands.slice(0, 4).map((l) => ({ entreprise: l.entreprise, email: l.email, lp: l.audit?.publishedUrl })) });
  } finally { if (!dryRun) await releaseLock("flow"); }
}

                                                                                                               
async function runFollowup(req: VercelRequest, res: VercelResponse, dryRun: boolean) {
  if (hardOffBlocked(res, "followup")) return;                                       
  const fcfg = await readJson<any>(FOLLOWUP_CFG, {});
  if (!fcfg.enabled && !dryRun) return res.status(200).json({ ok: true, skipped: "desligado" });
  const days: number[] = (Array.isArray(fcfg.days) && fcfg.days.length === 3) ? fcfg.days : DEFAULT_DAYS;
  const coldEnabled = !!fcfg.followupColdEnabled;                                                                                           
  if (!dryRun && !(await acquireLock("followup"))) return res.status(200).json({ ok: true, skipped: "outra_corrida_em_curso" });
  try {
    const base = baseUrl(); const leads = await loadLeads(); const now = Date.now();
    const supFU = await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] });                                                                         
    const respDoms = respondedDomains(leads);                                                                                             
                                                                                                             
                                                                                                                
                                                                                                                  
                                                                                                                  
                                                                                                              
                                                                                                                     
                                                                                                            
                                                                                                     
                                                                                               
    const negBase = leads.filter((l) => l && leadPodeReceberProspeccao(l, { sup: supFU, mode: "conversa" })
      && l.proposalSentAt && !l.proposalApprovedAt && !l.followupNegSentAt
      && String(l.replyClass || "") !== "negativa" && emailOk(l.email)
      && (now - (Date.parse(l.proposalSentAt) || now)) / 86400000 >= FOLLOWUP_NEG_DIAS).slice(0, 8);
    const negDue: any[] = [];
    for (const l of negBase) {
                                                                                                                       
      const psMs = Date.parse(l.proposalSentAt) || 0;
      if (l.repliedAt && (Date.parse(l.repliedAt) || 0) > psMs) continue;                                                                                
      try {
        const th = await readJson<any[]>(`crm/threads/${l.id}.json`, []);
        const lastIn = Array.isArray(th) ? [...th].reverse().find((m) => m && m.dir === "in") : null;
        if (lastIn && (Date.parse(String(lastIn.at || "")) || 0) > psMs) continue;
      } catch {  }
      negDue.push(l);
    }
    let negSent = 0;
    if (!dryRun && negDue.length) {
      const negTok = mintAdmin(); const negSig = await sharedSignature();
      for (const l of negDue) {
        try {
          const r = await fetch(`${base}/api/reply-scan?action=followup-neg-copy`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": negTok }, body: JSON.stringify({ leadId: String(l.id) }) });
          const d: any = await r.json().catch(() => null);
          if (!r.ok || !d?.ok || !Array.isArray(d.body) || !d.body.length) continue;                                  
                                                                              
          let reservedNeg = false;
          try { const rr = await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": negTok }, body: JSON.stringify({ leads: [{ id: l.id, followupNegSentAt: new Date().toISOString() }] }) }); const rd: any = await rr.json().catch(() => ({})); reservedNeg = rr.ok && !!rd?.ok; } catch { reservedNeg = false; }
          if (!reservedNeg) continue;
          const sign = (negSig && negSig.length > 20) ? `<div style="margin-top:20px">${negSig}</div>` : `<div style="margin-top:20px">${DEFAULT_SIGNATURE_HTML}</div>`;
          const inner = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;text-align:left">${d.body.map((p: any) => `<p style="margin:0 0 14px">${esc(noDash(String(p)))}</p>`).join("")}${sign}</div>`;
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><style>:root{color-scheme:light dark}</style></head><body style="margin:0;padding:0">${inner}</body></html>`;
          const item = { id: `fupneg-${l.id}-${Date.now()}`, dedupeKey: `${TENANT}:fupneg:${l.id}`, to: String(l.email).trim(), subject: noDash(String(d.subject || "Re:")), html, fromName: FROM_NAME, fromEmail: FROM_EMAIL, leadId: l.id, empresa: l.entreprise || l.nom || "", segmento: l.setor || "" };
          let queued = 0;
          try { const rq = await fetch(`${base}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": negTok }, body: JSON.stringify({ tenantId: TENANT, items: [item] }) }); const dq: any = await rq.json().catch(() => ({})); queued = dq?.ok ? 1 : 0; } catch { queued = 0; }
          if (!queued) { try { await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": negTok }, body: JSON.stringify({ leads: [{ id: l.id, followupNegSentAt: null }] }) }); } catch {  } continue; }
          negSent++;
        } catch {  }
      }
    }
    const due = leads.filter((l) => {
      if (!l) return false;
      if (!leadPodeReceberProspeccao(l, { sup: supFU, respDoms, mode: "cold" })) return false;                                               
      if ((l as any).humanHandoff) return false;                                                  
      if (Date.parse(String((l as any).oooUntil || "")) > Date.now()) return false;                                                                              
      if (String(l.lifecycle || "active") !== "active") return false;                                                     
      if (hasResponded(l) || respDoms.has(domainOf(l.email))) return false;                                                                              
                                                                                                                 
                                                                                                                      
                                                                                                                   
      if (String(l.abordagem || "cliente") === "agencia") return false;
      const isCold = !l.marketingOptIn;
      if (!(l.marketingOptIn || (isCold && coldEnabled)) || l.nurtureStartedAt || isEmpregoLead(l) || l.fase !== "lead") return false;                                                                                       
      if (l.emailBounced || l.emailClicked || l.replied || l.fase2SentAt) return false;
      if (!emailOk(l.email)) return false;
      const sent = l.lastEmailSentAt ? Date.parse(l.lastEmailSentAt) : 0; if (!sent) return false;
      const step = Number(l.followupCount || 0); if (step >= 3) return false;
      if (sentThisStepToday(l, "followup")) return false;                                                    
      return (now - sent) / 86400000 >= (Number(days[step]) || DEFAULT_DAYS[step]);
    }).slice(0, 20);
    if (dryRun) return res.status(200).json({ ok: true, dryRun: true, candidatos: due.length, negociacaoCandidatos: negDue.length, exemplosNegociacao: negDue.slice(0, 4).map((l) => ({ entreprise: l.entreprise, email: l.email, propostaEm: String(l.proposalSentAt || "").slice(0, 10) })), exemplos: due.slice(0, 4).map((l) => ({ entreprise: l.entreprise, email: l.email, toque: Number(l.followupCount || 0) + 1, lang: langOfLead(l) })) });
    let sent = 0; let reserved = false;
    if (due.length) {
      const adminTok = mintAdmin(); const sig = await sharedSignature();
      const items = await Promise.all(due.map(async (l) => { const step = Number(l.followupCount || 0); const { subject, html } = await followupEmail(l, step, sig); return { id: `fup-${l.id}-${step}-${Date.now()}`, dedupeKey: `${TENANT}:fup:${l.id}:${step}:${todayStr()}`, to: String(l.email).trim(), subject, html, fromName: FROM_NAME, fromEmail: FROM_EMAIL, leadId: l.id, empresa: l.entreprise || l.nom || "", segmento: l.setor || "", auditSlug: (l.audit?.publishedUrl || "").split("/").filter(Boolean).pop() || "" }; }));
      try { const rr = await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: due.map((l) => ({ id: l.id, followupCount: Number(l.followupCount || 0) + 1, lastFollowupAt: new Date().toISOString() })) }) }); const rd: any = await rr.json().catch(() => ({})); reserved = rr.ok && !!rd?.ok; } catch { reserved = false; }
      if (reserved) {
        try { const r = await fetch(`${base}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ tenantId: TENANT, items }) }); const d: any = await r.json().catch(() => ({})); sent = d?.ok ? (Array.isArray(d.added) ? d.added.length : items.length) : 0; } catch { sent = 0; }
        if (sent === 0) { try { await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: due.map((l) => ({ id: l.id, followupCount: Number(l.followupCount || 0), lastFollowupAt: l.lastFollowupAt ?? null })) }) }); } catch {  } }
      }
    }
    const summary = { at: new Date().toISOString(), candidatos: due.length, reservados: reserved, enviados: sent, negociacaoCandidatos: negDue.length, negociacaoEnviados: negSent };
    try { await writeJson(runKey("followup"), summary); } catch {  }
    return res.status(200).json({ ok: true, ...summary });
  } finally { if (!dryRun) await releaseLock("followup"); }
}

                                                                                                         
async function runJourney(req: VercelRequest, res: VercelResponse, dryRun: boolean) {
  if (hardOffBlocked(res, "journey")) return;                                                 
  const asend = await readJson<any>(AUTOSEND_CFG, {});
  if ((!asend.enabled || asend.paused) && !dryRun) return res.status(200).json({ ok: true, skipped: asend?.paused ? "pausado" : "desligado" });
  const cfg = await readJson<any>(JOURNEY_CFG, {});
  const templates = (cfg.templates && typeof cfg.templates === "object") ? cfg.templates : {};
                                                                                                                         
                                                                                                                      
  const campaigns: any[] = Array.isArray(cfg.campaigns) ? cfg.campaigns : [];
  const campMatch = (l: any, c: any): boolean => {
    const f = (c && c.filtro) || {};
    if (f.abordagem && String(l.abordagem || "cliente") !== String(f.abordagem)) return false;
    if (Array.isArray(f.setores) && f.setores.length && !f.setores.includes(String(l.setor || ""))) return false;
    if (Array.isArray(f.paises) && f.paises.length && !f.paises.includes(String(l.pais || ""))) return false;
    return true;
  };
  if (!Object.keys(templates).length) return res.status(200).json({ ok: true, skipped: "sem_templates" });
  const cadence: Record<string, number> = (cfg.cadence && typeof cfg.cadence === "object") ? cfg.cadence : DEFAULT_CADENCE;
  if (!dryRun && !(await acquireLock("journey"))) return res.status(200).json({ ok: true, skipped: "outra_corrida_em_curso" });
  try {
    const base = baseUrl(); const leads = await loadLeads(); const now = Date.now();
    const supJ = await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] });                                                                
    const respDoms = respondedDomains(leads);
    const due = leads.filter((l) => {
      if (!l || !l.nurtureStartedAt || isEmpregoLead(l)) return false;
                                                                                                          
                                                                                                              
                                                                                                      
      const ehMarketingPosNegativa = String((l as any).nurtureKind || "") === "pos_negativa";
      if (ehMarketingPosNegativa) { if (!leadPodeReceberProspeccao(l, { sup: supJ, mode: "marketing" })) return false; }
      else if (!leadPodeReceberProspeccao(l, { sup: supJ, respDoms, mode: "cold" }) || l.replied) return false;
      if (Date.parse(String((l as any).oooUntil || "")) > Date.now()) return false;                          
      if (!ehMarketingPosNegativa && (hasResponded(l) || respDoms.has(domainOf(l.email)))) return false;                                                                                      
      if (!emailOk(l.email)) return false;
      const step = Number(l.nurtureStep || 0); if (step >= NURTURE_PHASES.length) return false;
      const startedAt = Date.parse(l.nurtureStartedAt); if (!startedAt) return false;
      const phase = NURTURE_PHASES[step]; if (!templates[phase]) return false;
      const daysIn = (now - startedAt) / 86400000; const cad = Number(cadence[phase]); if (daysIn < (Number.isFinite(cad) ? cad : (DEFAULT_CADENCE[phase] ?? 0))) return false;
      const lastSent = l.nurtureLastSentAt ? Date.parse(l.nurtureLastSentAt) : 0; if (lastSent && (now - lastSent) < MIN_GAP_MS) return false;
      return true;
    }).slice(0, 120);
    if (dryRun) return res.status(200).json({ ok: true, dryRun: true, candidatos: due.length, exemplos: due.slice(0, 6).map((l) => ({ entreprise: l.entreprise, email: l.email, fase: NURTURE_PHASES[Number(l.nurtureStep || 0)], lang: jrnLang(l), abordagem: String(l.abordagem || "cliente") })) });
    let sent = 0; let reserved = false;
    if (due.length) {
      const adminTok = mintAdmin(); const nowIso = new Date().toISOString();
      const items = due.map((l) => { const step = Number(l.nurtureStep || 0); const phase = NURTURE_PHASES[step]; const lang = jrnLang(l); const camp = campaigns.find((c) => c && c.ativa !== false && c.templates && c.templates[phase] && campMatch(l, c)); const tset = (camp && camp.templates[phase]) ? camp.templates : templates; const t = ((tset[phase] && (tset[phase][lang] || tset[phase].en || tset[phase].pt)) || (templates[phase] && (templates[phase][lang] || templates[phase].en || templates[phase].pt))) || {}; const gdpr = lang === "pt" ? (cfg.gdprPt || "") : (cfg.gdprEn || ""); return { id: `jrn-${l.id}-${phase}-${Date.now()}`, dedupeKey: `${cfg.tenantId || TENANT}:jrn:${l.id}:${phase}:${todayStr()}`, to: String(l.email).trim(), subject: String(t.subject || "").replace(/{{\s*prenom\s*}}/gi, prenomOf(l.email)), html: renderJourneyHtml(t, prenomOf(l.email), gdpr, phase), fromName: cfg.fromName || FROM_NAME, fromEmail: cfg.fromEmail || FROM_EMAIL, leadId: l.id, empresa: l.entreprise || l.nom || "", segmento: l.setor || "" }; });
      try { const rr = await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: due.map((l) => ({ id: l.id, nurtureStep: Number(l.nurtureStep || 0) + 1, nurtureLastSentAt: nowIso })) }) }); const rd: any = await rr.json().catch(() => ({})); reserved = rr.ok && !!rd?.ok; } catch { reserved = false; }
      if (reserved) {
        try { const r = await fetch(`${base}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ tenantId: cfg.tenantId || TENANT, items }) }); const d: any = await r.json().catch(() => ({})); sent = d?.ok ? (Array.isArray(d.added) ? d.added.length : items.length) : 0; } catch { sent = 0; }
        if (sent === 0) { try { await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: due.map((l) => ({ id: l.id, nurtureStep: Number(l.nurtureStep || 0), nurtureLastSentAt: l.nurtureLastSentAt ?? null })) }) }); } catch {  } }
      }
    }
    const summary = { at: new Date().toISOString(), candidatos: due.length, reservados: reserved, enviados: sent };
    try { await writeJson(runKey("journey"), summary); } catch {  }
    return res.status(200).json({ ok: true, ...summary });
  } finally { if (!dryRun) await releaseLock("journey"); }
}

                                                                                                                                                                                                                                                                                
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  const action = qv(req, "action");
  const dryRun = qv(req, "dryRun") === "1" || qv(req, "dry") === "1";
                                                                                                                 
                                                                                                             
  const runs: Record<string, (req: VercelRequest, res: VercelResponse, dry: boolean) => Promise<any>> = { autosend: runAutosend, flow: runFlow, followup: runFollowup, journey: runJourney };

                                                            
  if (runs[action]) { if (!cronAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" }); if (!ADMIN_PW) return res.status(503).json({ ok: false, error: "admin_nao_configurado" }); return runs[action](req, res, dryRun); }

                                                    
  if (!adminAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
  let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};


                                                                                                 
                                                                                                      
                                                                                                         
  if (action === "agenda") {
    const fcfg = await readJson<any>(FOLLOWUP_CFG, {});
    const days: number[] = (Array.isArray(fcfg.days) && fcfg.days.length === 3) ? fcfg.days : DEFAULT_DAYS;
    const leads = await loadLeads(); const now = Date.now();
    const retornos: any[] = []; const followups: any[] = []; const negociacao: any[] = [];
    for (const l of leads) {
      if (!l || String(l.lifecycle || "active") !== "active") continue;
      const nome = String(l.entreprise || l.nome || (l as any).nom || "");
      const ooo = Date.parse(String((l as any).oooUntil || "")) || 0;
      if (ooo > now) retornos.push({ leadId: l.id, nome, quando: new Date(ooo).toISOString(), tipo: "retorno_ferias" });
      if (l.proposalSentAt && !l.proposalApprovedAt && !l.followupNegSentAt && String(l.replyClass || "") !== "negativa" && !l.emailBounced) {
        const p = Date.parse(l.proposalSentAt) || 0;
        if (p) negociacao.push({ leadId: l.id, nome, quando: new Date(Math.max(now, p + FOLLOWUP_NEG_DIAS * 86400000)).toISOString(), tipo: "followup_proposta" });
      }
      if ((l as any).humanHandoff || l.replied || l.emailBounced || l.fase !== "lead" || !l.lastEmailSentAt) continue;
      const step = Number(l.followupCount || 0); if (step >= 3) continue;
      const sent = Date.parse(l.lastEmailSentAt) || 0; if (!sent) continue;
      const nextAt = Math.max(sent + (Number(days[step]) || DEFAULT_DAYS[step]) * 86400000, ooo || 0);
      if (nextAt < now - 86400000 || nextAt > now + 45 * 86400000) continue;
      followups.push({ leadId: l.id, nome, quando: new Date(Math.max(nextAt, now)).toISOString(), tipo: "followup_frio", toque: step + 1 });
    }
    followups.sort((a, b) => a.quando.localeCompare(b.quando));
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ ok: true, retornos, followups: followups.slice(0, 60), negociacao: negociacao.slice(0, 30) });
  }
  if (req.method === "POST" && action === "autosend-config") {
    const cur = { ...DEFAULT_AUTOSEND, ...(await readJson<any>(AUTOSEND_CFG, {})) };
    const patch = body.config || body; const next = { ...cur, ...patch };
    if (patch.enabled === true && !cur.enabled) { const st = await readJson<any>(AUTOSEND_STATE, {}); if (!st.warmupStartedAt) await writeJson(AUTOSEND_STATE, { ...st, warmupStartedAt: new Date().toISOString() }); }
                                                                                                                          
    await writeJson(AUTOSEND_CFG, next);
                                                                                                                                    
    res.setHeader("Cache-Control", "no-store"); return res.status(200).json({ ok: true, config: next, hardOff: SEND_HARD_OFF });
  }
  if (req.method === "POST" && action === "followup-config") {
    const prev = await readJson<any>(FOLLOWUP_CFG, {});
                                                                                                                     
                                                                                      
    const copyBySeg: Record<string, { lang: string; toques: Array<{ assunto: string; corpo: string }> }> = (prev && prev.copyBySeg && typeof prev.copyBySeg === "object") ? { ...prev.copyBySeg } : {};
    const cs = body.copySeg;
    if (cs && typeof cs === "object") {
      const k = String(cs.key || "").trim().slice(0, 64);
      const toques = sanitizeFuTouches(cs.toques);
      const lang = FU_COPY_LANGS.includes(String(cs.lang || "")) ? String(cs.lang) : "fr";
      if (k && toques && (copyBySeg[k] || Object.keys(copyBySeg).length < FU_MAX_SEGS)) copyBySeg[k] = { lang, toques };
    }
    const rm = String(body.copySegDelete || "").trim().slice(0, 64);                                              
    if (rm) delete copyBySeg[rm];
    const next = {
      enabled: (typeof body.enabled === "boolean") ? body.enabled : !!prev.enabled,
      followupColdEnabled: (typeof body.followupColdEnabled === "boolean") ? body.followupColdEnabled : !!prev.followupColdEnabled,
      days: (Array.isArray(body.days) && body.days.length === 3) ? body.days.map((n: any) => Math.max(1, Number(n) || 1)) : (prev.days || DEFAULT_DAYS),
      copyBySeg,
                                                                                                                 
                                                                                                               
                                                                                                        
                                                                                                            
      followupPrompt: (typeof body.followupPrompt === "string") ? body.followupPrompt.replace(/<[^>]*>/g, " ").replace(/\r/g, "").trim().slice(0, 4000) : (typeof prev.followupPrompt === "string" ? prev.followupPrompt : ""),
      followupPromptCliente: (typeof body.followupPromptCliente === "string") ? body.followupPromptCliente.replace(/<[^>]*>/g, " ").replace(/\r/g, "").trim().slice(0, 4000) : (typeof prev.followupPromptCliente === "string" ? prev.followupPromptCliente : ""),
      updatedAt: new Date().toISOString(),
    };
    await writeJson(FOLLOWUP_CFG, next);
    return res.status(200).json({ ok: true, enabled: next.enabled, followupColdEnabled: next.followupColdEnabled, days: next.days, copyBySeg: next.copyBySeg, followupPrompt: next.followupPrompt, followupPromptCliente: next.followupPromptCliente });
  }
  if (req.method === "POST" && action === "journey-config") {
    const prev = await readJson<any>(JOURNEY_CFG, {});
                                                                                 
    const prevCamps: any[] = Array.isArray(prev.campaigns) ? prev.campaigns : [];
    const delIds = (Array.isArray(body.campaignsDelete) ? body.campaignsDelete : []).map((x: any) => String(x));
    let nextCamps = prevCamps.filter((c) => c && !delIds.includes(String(c.id)));
    if (Array.isArray(body.campaigns)) {
      const cm = new Map(nextCamps.map((c) => [String(c.id), c]));
      for (const c of body.campaigns) { if (c && c.id) { const cur: any = cm.get(String(c.id)) || {}; cm.set(String(c.id), { ...cur, ...c, templates: { ...(cur.templates || {}), ...((c as any).templates || {}) } }); } }
      nextCamps = Array.from(cm.values());
    }
                                                                                                    
    const next = { cadence: (body.cadence && typeof body.cadence === "object") ? body.cadence : (prev.cadence || DEFAULT_CADENCE), templates: (body.templates && typeof body.templates === "object") ? body.templates : (prev.templates || {}), campaigns: nextCamps, gdprPt: typeof body.gdprPt === "string" ? body.gdprPt : (prev.gdprPt || ""), gdprEn: typeof body.gdprEn === "string" ? body.gdprEn : (prev.gdprEn || ""), fromName: typeof body.fromName === "string" ? body.fromName : (prev.fromName || FROM_NAME), fromEmail: typeof body.fromEmail === "string" ? body.fromEmail : (prev.fromEmail || FROM_EMAIL), tenantId: typeof body.tenantId === "string" ? body.tenantId : (prev.tenantId || TENANT), updatedAt: new Date().toISOString() };
    await writeJson(JOURNEY_CFG, next);
    return res.status(200).json({ ok: true, fases: Object.keys(next.templates || {}).length, campanhas: (next.campaigns || []).length });
  }
                                                                                         
                                                                                                          
  if (req.method === "POST" && action === "briefing-thanks") {
    if (hardOffBlocked(res, "briefing-thanks")) return;                                       
    const leadId = String(body?.leadId || ""); if (!leadId) return res.status(400).json({ ok: false, error: "leadId em falta" });
    const leads = await loadLeads(); const lead = leads.find((l: any) => String(l.id) === leadId);
    const to = String(lead?.email || body?.to || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return res.status(200).json({ ok: false, error: "sem_email" });
                                                                                                         
    const lang = (() => { const x = String(lead?.idioma || "").toLowerCase(); if (["pt", "en", "fr", "de", "it", "es"].includes(x)) return x; const p = String(lead?.pais || "").toLowerCase(); if (/portugal|brasil|brazil/.test(p)) return "pt"; if (/france|fran[çc]a/.test(p)) return "fr"; if (/germany|deutschland|alemanha|austria|áustria/.test(p)) return "de"; if (/ital/.test(p)) return "it"; if (/spain|espanha|españa/.test(p)) return "es"; return "en"; })();
    const cfg = await readJson<any>(JOURNEY_CFG, {});
                                                                                                                       
                                                                                                  
    const clientTset: any = (cfg.templates && cfg.templates.briefing_thanks) || {};
    const tset: any = clientTset;
    const gdpr = lang === "pt" ? (cfg.gdprPt || "") : (cfg.gdprEn || "");
                                                 
    const clientFallback = lang === "pt"
      ? { tag: "BRIEFING RECEBIDO", subject: "Recebi o seu briefing, obrigado", preheader: "Passo agora à leitura. Volto logo com uma proposta pensada para o seu caso.", body: "Olá {{prenom}},\n\nRecebi o seu briefing, obrigado por partilhar os detalhes com cuidado. Vou estudar tudo com calma e volto logo com uma proposta pensada para o seu caso.", heroUrl: "", ctaUrl: "", ctaLabel: "", blocks: [], gallery: [] }
      : { tag: "BRIEFING RECEIVED", subject: "Got your briefing, thank you", preheader: "I'm reading it now. I'll come back soon with a proposal built around your case.", body: "Hi {{prenom}},\n\nGot your briefing, thanks for sharing the details with care. I'll go through everything and come back soon with a proposal built around your case.", heroUrl: "", ctaUrl: "", ctaLabel: "", blocks: [], gallery: [] };
    const fallback = clientFallback;
    const tpl = tset[lang] || tset.en || tset.pt || fallback;
    const prenom = prenomOf(to);
    const subject = String(tpl.subject || fallback.subject).replace(/{{\s*prenom\s*}}/gi, prenom);
    const html = renderJourneyHtml(tpl, prenom, gdpr);
                                                  
    if (body?.preview) return res.status(200).json({ ok: true, preview: true, lang, tag: String(tpl.tag || ""), subject, htmlLen: html.length });
    const adminTok = mintAdmin(); const base = baseUrl(); let sent = 0;
    try {
      const r = await fetch(`${base}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ tenantId: TENANT, items: [{ id: `bthx-${leadId}-${Date.now()}`, dedupeKey: `${TENANT}:bthx:${leadId}:${todayStr()}`, to, subject, html, fromName: FROM_NAME, fromEmail: FROM_EMAIL, leadId, scheduledAt: new Date().toISOString() }] }) });
      const d: any = await r.json().catch(() => ({})); sent = d?.ok ? 1 : 0;
      try { void fetch(`${base}/api/email-queue?action=drain`, { headers: { "x-abil-admin": adminTok } }); } catch {  }
    } catch { sent = 0; }
    return res.status(200).json({ ok: true, sent, lang, from: FROM_EMAIL });
  }
                                                                                                                       
                                                                                                                       
                                                                                           
  if (action === "agency-send" || action === "agency-autosend") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(410).json({ ok: false, error: "abordagem_a_agencias_nao_existe_neste_site", nota: "O ABiL e um atelier e so prospeta CLIENTES por segmento. O molde de agencias foi removido em 2026-07-16." });
  }
                                                                                    
  if (req.method === "POST" && action === "send-test") {
    if (hardOffBlocked(res, "send-test")) return;                                       
    const pcfg = { ...DEFAULT_AUTOSEND, ...(await readJson<any>(AUTOSEND_CFG, {})) };
    const to = String(body.to || "").trim();
    if (!emailOk(to)) return res.status(400).json({ ok: false, error: "email de destino invalido" });
    const lng0 = String(body.lang || "pt"); const lng = lng0 === "pt" ? "pt-PT" : lng0;
                                                                                                                        
    const fake = { entreprise: String(body.empresa || "Marca Exemplo"), idioma: lng === "pt-BR" ? "pt" : lng, pais: lng === "pt-PT" ? "Portugal" : "" };
    const out = await coldEmail(fake, pcfg.signatureHtml, lng);
                                                                                                                           
    if (isColdDomain(FROM_EMAIL)) {
      if (!ZOHO_READY) { res.setHeader("Cache-Control", "no-store"); return res.status(503).json({ ok: false, error: "Zoho SMTP nao configurado (ZOHO_SMTP_USER/PASS)" }); }
      try {
                                                                                                                    
                                                                                                                    
                                                                                                             
        const nmSpec = "nodemailer";
        const nm: any = await import(/* @vite-ignore */ nmSpec);
        const tx = (nm.default || nm).createTransport({ host: process.env.ZOHO_SMTP_HOST || "smtp.zoho.eu", port: Number(process.env.ZOHO_SMTP_PORT || 465), secure: Number(process.env.ZOHO_SMTP_PORT || 465) === 465, auth: { user: ZOHO_USER, pass: ZOHO_PASS } });
        await tx.sendMail({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject: `[TESTE] ${out.subject}`, html: out.html });
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({ ok: true, to, via: "zoho", subject: `[TESTE] ${out.subject}` });
      } catch (e: any) { res.setHeader("Cache-Control", "no-store"); return res.status(200).json({ ok: false, error: "zoho:" + String(e?.message || e).slice(0, 200) }); }
    }
    const key = process.env.RESEND_API_KEY || "";
    if (!key) return res.status(503).json({ ok: false, error: "RESEND_API_KEY nao configurada" });
    const from = process.env.RESEND_FROM || `${FROM_NAME} <${FROM_EMAIL}>`;
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject: `[TESTE] ${out.subject}`, html: out.html }) });
    const d: any = await r.json().catch(() => ({}));
    res.setHeader("Cache-Control", "no-store");
    if (!r.ok) return res.status(200).json({ ok: false, error: String(d?.message || d?.name || `http_${r.status}`) });
    return res.status(200).json({ ok: true, to, subject: `[TESTE] ${out.subject}` });
  }
  if (action === "autosend-preview") {
    const pcfg = { ...DEFAULT_AUTOSEND, ...(await readJson<any>(AUTOSEND_CFG, {})) };
    const lng = qv(req, "lang") || "pt-PT"; const lang = lng === "pt" ? "pt-PT" : lng;
    const purpose = qv(req, "tipo") || "cold";
    let out: { subject: string; html: string };
    const fakeLead = { entreprise: qv(req, "empresa") || "" };
                                                                                                                        
                                                                                                                   
    if (purpose === "agency" || purpose === "agencia" || purpose.startsWith("agfollowup")) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(410).json({ ok: false, error: "abordagem_a_agencias_nao_existe_neste_site", nota: "O ABiL so prospeta CLIENTES. Pre-visualizacoes disponiveis: cold, fase2, followup0..2." });
    }
    if (purpose === "fase2") out = await fase2Email({ ...fakeLead, idioma: lang === "pt-BR" ? "pt" : lang, pais: lang === "pt-PT" ? "Portugal" : lang === "pt-BR" ? "Brasil" : "" }, `${SITE_URL}/p/exemplo`, pcfg.signatureHtml);
    else if (purpose.startsWith("followup")) out = await followupEmail({ ...fakeLead, idioma: lang === "pt-BR" ? "pt" : lang, pais: lang === "pt-PT" ? "Portugal" : lang === "pt-BR" ? "Brasil" : "" }, Math.max(0, Math.min(2, Number(purpose.replace("followup", "")) || 0)), pcfg.signatureHtml, lang);
    else out = await coldEmail(fakeLead, pcfg.signatureHtml, lang);
    res.setHeader("Cache-Control", "no-store"); return res.status(200).json({ ok: true, ...out, lang, tipo: purpose });
  }
  if (action === "suppress") {
    const cur = await readJson<any>(SUPPRESS_KEY, { emails: [], domains: [] });
    if (req.method === "POST") {
      const rmMode = body.remove === true || body.action === "remove";
      const addE = (Array.isArray(body.emails) ? body.emails : (body.email ? [body.email] : [])).map((x: string) => String(x).toLowerCase().trim()).filter(Boolean);
      const addD = (Array.isArray(body.domains) ? body.domains : (body.domain ? [body.domain] : [])).map((x: string) => String(x).toLowerCase().replace(/^@/, "").trim()).filter(Boolean);
      const baseE: string[] = Array.isArray(cur.emails) ? cur.emails : [];
      const baseD: string[] = Array.isArray(cur.domains) ? cur.domains : [];
      const emails = rmMode ? baseE.filter((x) => !addE.includes(x)) : Array.from(new Set([...baseE, ...addE]));
      const domains = rmMode ? baseD.filter((x) => !addD.includes(x)) : Array.from(new Set([...baseD, ...addD]));
      const next = { emails, domains, updatedAt: new Date().toISOString() };
      await writeJson(SUPPRESS_KEY, next);
      res.setHeader("Cache-Control", "no-store"); return res.status(200).json({ ok: true, emails, domains });
    }
    res.setHeader("Cache-Control", "no-store"); return res.status(200).json({ ok: true, emails: cur.emails || [], domains: cur.domains || [] });
  }
                                          
  const [a, f, j] = await Promise.all([readJson<any>(AUTOSEND_CFG, {}), readJson<any>(FOLLOWUP_CFG, {}), readJson<any>(JOURNEY_CFG, {})]);
  const cfg = { ...DEFAULT_AUTOSEND, ...a };
  const st = await readJson<any>(AUTOSEND_STATE, { date: todayStr(), sentToday: 0, warmupStartedAt: "" });
  const dayIdx = st.warmupStartedAt ? Math.floor((Date.now() - Date.parse(st.warmupStartedAt)) / 86400000) : 0;
                                                                                                                     
                                                                                                                  
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ ok: true, hardOff: SEND_HARD_OFF, config: cfg, state: st, hoje: { diaAquecimento: dayIdx + 1, quotaHoje: warmupQuota(cfg, dayIdx), enviadosHoje: st.date === todayStr() ? (st.sentToday || 0) : 0 }, followup: { enabled: !!f.enabled, coldEnabled: !!f.followupColdEnabled, days: f.days || DEFAULT_DAYS, copyBySeg: (f.copyBySeg && typeof f.copyBySeg === "object") ? f.copyBySeg : {}, followupPrompt: typeof f.followupPrompt === "string" ? f.followupPrompt : "", followupPromptCliente: typeof f.followupPromptCliente === "string" ? f.followupPromptCliente : "" }, journey: { temTemplates: Object.keys(j.templates || {}).length } });
}
