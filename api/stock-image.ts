                                                                                
                                                                       
                                                  
  
                                                                               
                                                                                    
                                                                                
  
                                                                       
                                                                                
                                               
                                                                                
  
                                                      
                                                                             
import crypto from "node:crypto";

const ADMIN_PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
function adminOk(req: any): boolean {
  if (!ADMIN_PW) return false;
  const raw = req.headers?.["x-abil-admin"];
  const tok = Array.isArray(raw) ? raw[0] : String(raw || "");
  if (!tok) return false;
  const [expS, sig] = tok.split(".");
  const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex");
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}

export default async function handler(req: any, res: any): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-pexels-key, x-unsplash-key");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (!adminOk(req)) { res.status(401).json({ error: "unauthorized" }); return; }

  const q = String((req.query?.q ?? "")).trim().slice(0, 80) || "swiss editorial minimalism";
  const orientation = String(req.query?.orientation ?? "landscape");

                                                                                           
  const hdr = (name: string): string => { const v = req.headers?.[name]; return (Array.isArray(v) ? v[0] : String(v || "")).trim(); };
  const pexels = (process.env.PEXELS_API_KEY || hdr("x-pexels-key") || "").trim();
  const unsplash = (process.env.UNSPLASH_ACCESS_KEY || hdr("x-unsplash-key") || "").trim();

  if (!pexels && !unsplash) {
    res.status(503).json({
      error: "stock_image_provider_not_configured",
      message: "Configure PEXELS_API_KEY or UNSPLASH_ACCESS_KEY to use real stock photos.",
      reasons: ["no-provider-key"],
    });
    return;
  }

  const reasons: string[] = [];

  if (pexels) {
    try {
      const r = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15&orientation=${orientation}`,
        { headers: { Authorization: pexels } },
      );
      if (r.ok) {
        const d: any = await r.json();
        const photos: any[] = d.photos || [];
        if (photos.length) {
          const p = photos[Math.floor(Math.random() * photos.length)];
          const url = p?.src?.large2x || p?.src?.large || p?.src?.original;
          if (url) { res.status(200).json({ url, credit: p.photographer, creditUrl: p.photographer_url, source: "pexels" }); return; }
          reasons.push("pexels-no-url");
        } else {
          reasons.push("pexels-no-results");
        }
      } else {
        reasons.push(`pexels-http-${r.status}`);
      }
    } catch {
      reasons.push("pexels-fetch-exception");
    }
  }

  if (unsplash) {
    try {
      const r = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=15&orientation=${orientation}`,
        { headers: { Authorization: `Client-ID ${unsplash}` } },
      );
      if (r.ok) {
        const d: any = await r.json();
        const results: any[] = d.results || [];
        if (results.length) {
          const p = results[Math.floor(Math.random() * results.length)];
          const url = p?.urls?.regular || p?.urls?.full;
          if (url) { res.status(200).json({ url, credit: p.user?.name, creditUrl: p.user?.links?.html, source: "unsplash" }); return; }
          reasons.push("unsplash-no-url");
        } else {
          reasons.push("unsplash-no-results");
        }
      } else {
        reasons.push(`unsplash-http-${r.status}`);
      }
    } catch {
      reasons.push("unsplash-fetch-exception");
    }
  }

  const noResultsOnly = reasons.length > 0 && reasons.every((reason) => reason.endsWith("-no-results") || reason.endsWith("-no-url"));
  res.status(noResultsOnly ? 404 : 502).json({
    error: noResultsOnly ? "stock_image_no_results" : "stock_image_provider_failed",
    message: noResultsOnly
      ? "No configured stock provider returned a usable image for this query."
      : "Configured stock provider failed. No local fallback was used.",
    reasons,
  });
}
