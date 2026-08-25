/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                               
                                                                                               
                                                                                  
                                                                                              
                                                                                                                                
  
                                                                            
                                                                                                            
import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

function igualSeguro(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
}

export const config = { runtime: "nodejs", maxDuration: 30 };

const ADMIN = process.env.META_ADMIN_KEY || "";
const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || "";

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && igualSeguro(mkv, ADMIN)) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  if (!PLACES_KEY) return res.status(503).json({ ok: false, error: "sem_chave", detail: "Falta GOOGLE_PLACES_API_KEY no ambiente." });

  const q = String(req.query.q || "").trim();
  const city = String(req.query.city || "").trim();
  if (!q || !city) return res.status(400).json({ ok: false, error: "bad_input", detail: "q (nicho) e city (cidade) obrigatórios." });
  const max = Math.min(20, Math.max(1, Number(req.query.max) || 20));
  const filter = String(req.query.filter || "all");                           
  const lang = String(req.query.lang || "pt");
  const region = String(req.query.region || "").trim();               

  try {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryType,places.types,places.googleMapsUri,places.businessStatus,places.regularOpeningHours,places.priceLevel",
      },
      body: JSON.stringify({ textQuery: `${q} em ${city}`, maxResultCount: max, languageCode: lang, ...(region ? { regionCode: region } : {}) }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(502).json({ ok: false, error: "places_error", status: r.status, detail: detail.slice(0, 300) });
    }
    const d: any = await r.json();
    const places: any[] = Array.isArray(d.places) ? d.places : [];
    const PRICE_TXT: Record<string, string> = { PRICE_LEVEL_INEXPENSIVE: "€", PRICE_LEVEL_MODERATE: "€€", PRICE_LEVEL_EXPENSIVE: "€€€", PRICE_LEVEL_VERY_EXPENSIVE: "€€€€" };
    let results = places.map((p) => ({
      placeId: String(p.id || ""),
      nome: String(p.displayName?.text || ""),
      morada: String(p.formattedAddress || ""),
      telefone: String(p.nationalPhoneNumber || p.internationalPhoneNumber || ""),
      website: String(p.websiteUri || ""),
      rating: typeof p.rating === "number" ? p.rating : null,
      reviews: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
      tipo: String(p.primaryType || (Array.isArray(p.types) ? p.types[0] : "") || ""),
      mapsUrl: String(p.googleMapsUri || ""),
      preco: String(PRICE_TXT[p.priceLevel] || ""),
      horario: Array.isArray(p.regularOpeningHours?.weekdayDescriptions) ? p.regularOpeningHours.weekdayDescriptions.join(" · ") : "",
      status: String(p.businessStatus || ""),
    })).filter((x) => x.nome && x.status !== "CLOSED_PERMANENTLY");
    if (filter === "nosite") results = results.filter((x) => !x.website);
    else if (filter === "withsite") results = results.filter((x) => !!x.website);
    return res.status(200).json({ ok: true, query: `${q} · ${city}`, count: results.length, results });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "exception", detail: String(e?.message || e).slice(0, 200) });
  }
}
