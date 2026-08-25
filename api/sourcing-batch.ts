/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                       
                                                                                                                   
                                                                               
                                                                                    
                                                                  
                                                                                                
                                                                                                 
                                                                                                         
                                                                                                    
                                                                                                     
                                                                                                              
                                                                                                     
                                                                                                
                                                                                            
                                                                                                      
                                                                         
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 300 };

const ADMIN_PW = process.env.ABIL_ADMIN_AUTH_SECRET || "";
const CRON_SECRET = process.env.CRON_SECRET || "";
const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const BUDGET_KEY = "sourcing/budget.json";
const CONFIG_KEY = "sourcing/config.json";
const ROT_KEY = "sourcing/rot.json";                                                                     

                                                                                                        
                                                                                                                
const REGION: Record<string, { pais: string; lang: string }> = {
  CH: { pais: "Suíça", lang: "de" }, LU: { pais: "Luxemburgo", lang: "fr" }, NO: { pais: "Noruega", lang: "en" },
  DK: { pais: "Dinamarca", lang: "en" }, SE: { pais: "Suécia", lang: "en" }, NL: { pais: "Países Baixos", lang: "en" },
  IE: { pais: "Irlanda", lang: "en" }, AT: { pais: "Áustria", lang: "de" }, BE: { pais: "Bélgica", lang: "en" },
  FI: { pais: "Finlândia", lang: "en" }, DE: { pais: "Alemanha", lang: "de" }, GB: { pais: "Reino Unido", lang: "en" },
  FR: { pais: "França", lang: "fr" }, IT: { pais: "Itália", lang: "it" }, ES: { pais: "Espanha", lang: "es" },
  PT: { pais: "Portugal", lang: "pt" }, MT: { pais: "Malta", lang: "en" }, BR: { pais: "Brasil", lang: "pt" },
};
                                                                                                                                      
const CITY_LANG: Record<string, string> = {
  geneve: "fr", lausanne: "fr", neuchatel: "fr", fribourg: "fr", sion: "fr", montreux: "fr", biel: "fr", bienne: "fr",
  zurich: "de", basel: "de", bern: "de", luzern: "de", winterthur: "de", zug: "de", "st gallen": "de", "st. gallen": "de", stgallen: "de",
  lugano: "it", bellinzona: "it", locarno: "it",
  bruxelles: "fr", brussels: "fr", luxembourg: "fr",
};
function cityLang(city: string, region: string): string {
  const k = String(city || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return CITY_LANG[k] || (REGION[region] || { lang: "en" }).lang;
}
                                                                             
                                                                                                           
                                                                                                          
                                                                                                        
                                                                                                         
const TARGET_SEGMENTS: Record<string, { q: string; label: string }> = {
  restauracao: { q: "restaurant", label: "Restauração" },
  hotelaria: { q: "boutique hotel", label: "Hotelaria e turismo" },
  imobiliario: { q: "real estate agency", label: "Imobiliário e construção" },
  ecommerce: { q: "lifestyle concept store", label: "E-commerce e retalho online" },
  "clinicas-saude": { q: "private clinic", label: "Clínicas e saúde" },
  "arquitetura-interiores": { q: "architecture studio", label: "Arquitetura e interiores" },
  moda: { q: "fashion boutique", label: "Moda e vestuário" },
  "desporto-ginasios": { q: "boutique fitness studio", label: "Desporto e ginásios" },
  "tecnologia-saas": { q: "software company", label: "Tecnologia e SaaS" },
  generico: { q: "small business services", label: "Serviços e PME (genérico)" },
                                                                                                        
                                                                           
  "escolas-ski-guias": { q: "ski school mountain guide", label: "Escolas de ski e guias" },
  "atividades-outdoor": { q: "outdoor activities paragliding bike rental", label: "Atividades outdoor" },
  "spa-wellness": { q: "spa wellness", label: "Spa e wellness" },
  "bares-apres-ski": { q: "bar apres ski", label: "Bares e après-ski" },
  "aluguer-ski-desporto": { q: "ski rental sport shop", label: "Aluguer de ski e desporto" },
  "joalharia-relojoaria": { q: "jewelry watch store", label: "Joalharia e relojoaria" },
  "estetica-cabeleireiro": { q: "beauty salon hairdresser", label: "Estética e cabeleireiros" },
  "eventos-catering": { q: "event planner catering wedding", label: "Eventos e catering" },
  "transfers-taxi": { q: "taxi transfer service", label: "Transfers e táxis" },
  "construcao-carpintaria": { q: "construction carpentry chalet builder", label: "Construção e carpintaria de chalés" },
  "vinicolas-caves": { q: "winery wine cellar", label: "Vinícolas e caves" },
  "gourmet-delicatessen": { q: "delicatessen gourmet food shop", label: "Gourmet e delicatessen" },
  "kids-camps-educacao": { q: "kids camp private school", label: "Kids camps e educação privada" },
  "fitness-yoga": { q: "fitness studio yoga", label: "Fitness e yoga" },
};

                                                                                                            
                                                                                                   
                                                                                                     
                                                                                                  
const DEFAULT_CONFIG = {
  enabled: false,
  targets: [
    { region: "CH", cities: ["Zürich", "Genève", "Basel", "Lausanne", "Lugano", "Bern"] },
    { region: "LU", cities: ["Luxembourg"] },
    { region: "NO", cities: ["Oslo", "Bergen", "Stavanger"] },
    { region: "DK", cities: ["Copenhagen", "Aarhus"] },
    { region: "SE", cities: ["Stockholm", "Göteborg", "Malmö"] },
    { region: "NL", cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht"] },
    { region: "IE", cities: ["Dublin", "Cork"] },
    { region: "AT", cities: ["Wien", "Salzburg"] },
    { region: "DE", cities: ["München", "Berlin", "Hamburg", "Frankfurt", "Düsseldorf"] },
    { region: "GB", cities: ["London", "Manchester", "Edinburgh"] },
    { region: "FR", cities: ["Paris", "Lyon", "Bordeaux"] },
  ],
  segments: ["restauracao", "hotelaria", "imobiliario", "ecommerce", "clinicas-saude", "arquitetura-interiores", "moda", "desporto-ginasios", "tecnologia-saas", "generico"],
                                                                                           
  clientMapping: false,
  maxPerSeg: 18,                                          
  filter: "all" as string,
  enrich: true,
  dailyCap: 500,                                                                                                 
  maxPerRun: 350,                                                                                                   
  enrichCap: 350,                                                                                           
};

function hdr(req: VercelRequest, n: string): string { const v = req.headers[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function qv(req: VercelRequest, n: string): string { const v = req.query[n]; return String((Array.isArray(v) ? v[0] : v) || "").trim(); }
function adminAuthed(req: VercelRequest): boolean {
  const tok = hdr(req, "x-abil-admin");
  if (ADMIN_PW && tok && tok.indexOf(".") > 0) {
    const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1);
    if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } }
  }
  return false;
}
function cronAuthed(req: VercelRequest): boolean { const a = hdr(req, "authorization"); return (!!CRON_SECRET && a === `Bearer ${CRON_SECRET}`) || adminAuthed(req); }
                                                                                                      
function mintAdmin(): string { const exp = Date.now() + 5 * 60 * 1000; const sig = crypto.createHmac("sha256", ADMIN_PW).update(String(exp)).digest("hex"); return `${exp}.${sig}`; }
function baseUrl(_req: VercelRequest): string {
                                                                                                     
                                                                                
  return (process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app").replace(/\/$/, "");
}
async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    if (BLOB_PUBLIC_BASE) { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.json(); if (r.status === 404) return fallback; }
    const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (!bl) return fallback; const r = await fetch(bl.url, { cache: "no-store" }); return r.ok ? await r.json() : fallback;
  } catch { return fallback; }
}
async function writeJson(key: string, data: any): Promise<void> { await put(key, JSON.stringify(data), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); }
function todayStr(): string { return new Date().toISOString().slice(0, 10); }
function dedupKey(entreprise: string, website: string): string { return `${String(entreprise || "").toLowerCase().trim()}|${String(website || "").toLowerCase().replace(/\/$/, "")}`; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const action = qv(req, "action");
  const isRun = action === "run" || hdr(req, "authorization").startsWith("Bearer ");

                                                                   
  if (!isRun) {
    if (!adminAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
                                                                                                         
                                                                                           
                                                                                                                        
    if (req.method === "POST" && action === "config-set") {
      let body: any = req.body; if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } } if (!body || typeof body !== "object") body = {};
      const prev = { ...DEFAULT_CONFIG, ...(await readJson<any>(CONFIG_KEY, {})) };
      if ("clientMapping" in body) prev.clientMapping = !!body.clientMapping;
      if ("dailyCap" in body) prev.dailyCap = Math.max(1, Math.min(2000, Number(body.dailyCap) || prev.dailyCap));
      if ("maxPerSeg" in body) prev.maxPerSeg = Math.max(1, Math.min(40, Number(body.maxPerSeg) || prev.maxPerSeg));
      if ("enrich" in body) prev.enrich = !!body.enrich;
                                                                                                  
                                                                                                
                                                                               
      if (body.customSegments && typeof body.customSegments === "object") {
        const clean: Record<string, { q: string; label: string }> = {};
        for (const [k, v] of Object.entries(body.customSegments as Record<string, any>).slice(0, 24)) {
          const key = String(k).trim().toLowerCase();
          if (!/^[a-z0-9_]{2,32}$/.test(key) || TARGET_SEGMENTS[key]) continue;                            
          const q = String(v?.q || "").trim().slice(0, 60); const label = String(v?.label || "").trim().slice(0, 40);
          if (!q || !label) continue;
          clean[key] = { q, label };
        }
        prev.customSegments = clean;                                                            
      }
      const DICT: Record<string, { q: string; label: string }> = { ...TARGET_SEGMENTS, ...((prev.customSegments && typeof prev.customSegments === "object") ? prev.customSegments : {}) };
      if (Array.isArray(body.segments)) {
        const segs = body.segments.map((s: any) => String(s).trim()).filter((k: string) => !!DICT[k]);
        if (segs.length) prev.segments = [...new Set(segs)];                                                                 
      }
      if (Array.isArray(body.targets)) {
        const tgts = body.targets
          .map((t: any) => ({ region: String(t?.region || "").trim().toUpperCase(), cities: (Array.isArray(t?.cities) ? t.cities : []).map((c: any) => String(c).trim().slice(0, 40)).filter(Boolean).slice(0, 10) }))
          .filter((t: any) => REGION[t.region] && t.cities.length)
          .slice(0, 16);
        if (tgts.length) prev.targets = tgts;
      }
      prev.enabled = prev.clientMapping !== false;                                                              
      await writeJson(CONFIG_KEY, prev);
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, config: prev, clientMapping: prev.clientMapping !== false, enabled: prev.enabled, dailyCap: prev.dailyCap });
    }
    const cfg = await readJson<any>(CONFIG_KEY, DEFAULT_CONFIG);
    const bud = await readJson<any>(BUDGET_KEY, { date: todayStr(), count: 0 });
    const lastRun = await readJson<any>("sourcing/last-run.json", null);
    res.setHeader("Cache-Control", "no-store");
    const dictAll: Record<string, { q: string; label: string }> = { ...TARGET_SEGMENTS, ...((cfg.customSegments && typeof cfg.customSegments === "object") ? cfg.customSegments : {}) };
    return res.status(200).json({ ok: true, config: cfg, budget: bud, lastRun, segmentosDisponiveis: Object.keys(dictAll), regioesDisponiveis: Object.keys(REGION), segmentosMeta: Object.entries(dictAll).map(([key, v]) => ({ key, label: v.label, abordagem: "cliente", custom: !TARGET_SEGMENTS[key] })), regioesMeta: Object.entries(REGION).map(([key, v]) => ({ key, pais: v.pais })) });
  }

  if (!cronAuthed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!ADMIN_PW) return res.status(503).json({ ok: false, error: "admin_nao_configurado" });

                                                                               
  const cfg = { ...DEFAULT_CONFIG, ...(await readJson<any>(CONFIG_KEY, {})) };
  const dryRun = qv(req, "dryRun") === "1" || qv(req, "dry") === "1";
                                                                                                              
  const rawTargets: any[] = qv(req, "region")
    ? [{ region: qv(req, "region"), cities: qv(req, "cities").split(",") }]
    : (Array.isArray(cfg.targets) ? cfg.targets : []);
  const targets = rawTargets
    .map((t) => ({ region: String(t.region || "").toUpperCase(), cities: (Array.isArray(t.cities) ? t.cities : []).map((c: string) => String(c).trim()).filter(Boolean) }))
    .filter((t) => REGION[t.region] && t.cities.length);
  const manualSegs = qv(req, "segments");
                                                                                                         
  const SEGS: Record<string, { q: string; label: string }> = { ...TARGET_SEGMENTS, ...((cfg.customSegments && typeof cfg.customSegments === "object") ? cfg.customSegments : {}) };
  const baseSegs = (manualSegs ? manualSegs.split(",") : (cfg.clientMapping === false ? [] : (Array.isArray(cfg.segments) ? cfg.segments : []))).map((s: string) => s.trim()).filter((k: string) => SEGS[k]);
  const segments = baseSegs;
  const maxPerSeg = Math.min(20, Math.max(1, Number(qv(req, "max")) || cfg.maxPerSeg || 20));
  const filter = qv(req, "filter") || cfg.filter || "all";
  const doEnrich = qv(req, "enrich") ? qv(req, "enrich") === "1" : !!cfg.enrich;
  const dailyCap = Number(cfg.dailyCap) || 200;
  const enrichCap = Number(cfg.enrichCap) || 350;                                                                  

                                                                                                        
  const manual = !!(qv(req, "cities") || qv(req, "segments") || qv(req, "region"));
  if (!manual && cfg.enabled === false) return res.status(200).json({ ok: true, skipped: "disabled", hint: "config.enabled=false" });
  if (!targets.length || !segments.length) return res.status(400).json({ ok: false, error: "sem_targets_ou_segmentos" });

                     
  let budget = await readJson<{ date: string; count: number }>(BUDGET_KEY, { date: todayStr(), count: 0 });
  if (budget.date !== todayStr()) budget = { date: todayStr(), count: 0 };
  const remaining = Math.max(0, dailyCap - (budget.count || 0));
  if (remaining <= 0) return res.status(200).json({ ok: true, skipped: "daily_cap_atingido", dailyCap, jaMapeadoHoje: budget.count });
  const perRun = Math.min(remaining, Number(cfg.maxPerRun) || 350);                                                                                   

  const adminTok = mintAdmin();
  const base = baseUrl(req);

                                                                                                    
                                                                                                    
                                                                                                      
                                                                                                        
                                                                                  
  const plan: { region: string; city: string }[] = [];
  const maxCities = targets.reduce((m, t) => Math.max(m, t.cities.length), 0);
  for (let ci = 0; ci < maxCities; ci++) for (const t of targets) { if (t.cities[ci]) plan.push({ region: t.region, city: t.cities[ci] }); }
  const rot = await readJson<{ idx: number }>(ROT_KEY, { idx: 0 });
  const idxInicial = plan.length ? (((Number(rot?.idx) || 0) % plan.length) + plan.length) % plan.length : 0;
  let idxFinal = idxInicial;
  const regioesTocadas: string[] = [];

  const found: any[] = [];
  const segErrors: string[] = [];
  for (let step = 0; step < plan.length; step++) {
    if (found.length >= perRun) break;
    const pos = (idxInicial + step) % plan.length;
    const { region, city } = plan[pos];
    const reg = (REGION[region] || ({ pais: (qv(req, "pais") || region), lang: "en", cities: [] } as any));                                                            
    if (!regioesTocadas.includes(region)) regioesTocadas.push(region);
    idxFinal = (pos + 1) % plan.length;                                             
    for (const segKey of segments) {
      if (found.length >= perRun) break;
      const seg = SEGS[segKey];
      try {
        const u = `${base}/api/sourcing?q=${encodeURIComponent(seg.q)}&city=${encodeURIComponent(city)}&filter=${encodeURIComponent(filter)}&region=${encodeURIComponent(region)}&lang=${encodeURIComponent(reg.lang)}&max=${maxPerSeg}`;
        const r = await fetch(u, { headers: { "x-abil-admin": adminTok } });
        const d: any = await r.json().catch(() => ({}));
        if (d && d.ok && Array.isArray(d.results)) {
          for (const x of d.results) found.push({ ...x, _seg: segKey, _segLabel: seg.label, _city: city, _region: region });
        } else { segErrors.push(`${region}/${city}/${segKey}: ${d?.error || r.status}`); }
      } catch (e) { segErrors.push(`${region}/${city}/${segKey}: ${String(e).slice(0, 60)}`); }
    }
  }
                                                                                                                 
  if (!dryRun) { try { await writeJson(ROT_KEY, { idx: idxFinal }); } catch {  } }

                                                                              
  const cloud = await readJson<any>("crm/leads.json", { leads: [] });
  const cloudLeads: any[] = Array.isArray(cloud) ? cloud : (Array.isArray(cloud?.leads) ? cloud.leads : []);
  const seen = new Set<string>(cloudLeads.map((l) => dedupKey(l.entreprise, l.website)));
  const novos: any[] = [];
  for (const r of found) {
    if (novos.length >= perRun) break;
    const k = dedupKey(r.nome, r.website);
    if (!r.nome || seen.has(k)) continue;
    seen.add(k);
    const nowIso = new Date().toISOString();
    novos.push({
      id: crypto.randomUUID(), nom: String(r.nome || ""), email: "", entreprise: String(r.nome || ""), telephone: String(r.telefone || ""),
      website: String(r.website || ""), setor: String(r._seg || ""), abordagem: "cliente", pais: (REGION[r._region] || ({ pais: (qv(req, "pais") || String(r._region || "")) } as any)).pais, idioma: cityLang(String(r._city || ""), String(r._region || "")), fase: "lead", tier: "frio",
      score: 50, valeur: 0, source: "google-places",
      placeId: String(r.placeId || ""), googleRating: (typeof r.rating === "number" ? r.rating : null), googleReviews: (typeof r.reviews === "number" ? r.reviews : null),
      googleCategoria: String(r.tipo || ""), googleHorario: String(r.horario || ""), googlePreco: String(r.preco || ""), googleMapsUrl: String(r.mapsUrl || ""), placeFetchedAt: nowIso,
      infoEncontradas: [r.morada, r.rating ? `${r.rating}★ (${r.reviews || 0} avaliações)` : "", r.mapsUrl].filter(Boolean).join(" · "),
      dataMapeamento: nowIso, updatedAt: nowIso, lastContact: new Date().toLocaleDateString("fr-CH"),
    });
  }

  if (dryRun) return res.status(200).json({ ok: true, dryRun: true, regioes: targets.map((t) => t.region), regioesTocadas, planoLen: plan.length, idxInicial, idxFinal, segments, encontrados: found.length, novosAposDedup: novos.length, exemplos: novos.slice(0, 6).map((n) => ({ entreprise: n.entreprise, pais: n.pais, website: n.website, setor: n.setor })), segErrors });

                                                                                                                 
  let enriched = 0;
  if (doEnrich) {
    const alvos = novos.filter((n) => n.website && !n.email).slice(0, enrichCap);
    const CHUNK = 15;
    for (let i = 0; i < alvos.length; i += CHUNK) {
      const slice = alvos.slice(i, i + CHUNK);
      await Promise.all(slice.map(async (n) => {
        try {
          const er = await fetch(`${base}/api/enrich-email`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ website: n.website }) });
          const ed: any = await er.json().catch(() => ({}));
          if (ed && ed.ok && ed.email) { n.email = String(ed.email); n.emailSource = ed.source; n.emailConfidence = ed.confidence; enriched++; }
        } catch {  }
      }));
    }
  }


                                                                 
                                                                                                          
                                                                                                  
  const semEmail = novos.filter((n) => !String(n.email || "").trim()).length;
  const aGravar = novos.filter((n) => !!String(n.email || "").trim());

                                                            
  let saved = 0;
  if (aGravar.length) {
    try {
      const sr = await fetch(`${base}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ leads: aGravar }) });
      const sd: any = await sr.json().catch(() => ({}));
                                                                                                                
                                                                                                   
                                                                                              
                                                                                    
      saved = sd && sd.ok && Number.isFinite(Number(sd.upserted)) ? Number(sd.upserted) : 0;
    } catch {  }
  }

                                                                                                        
                                                                                                          
                                                                                                              
  let enfileirados = 0; let enqResp = "";
  try {
                                                                                                        
                                                                                
    const byId = new Map<string, any>();
    for (const l of [...cloudLeads, ...aGravar]) { if (l && l.id && l.source === "google-places" && (l.website || l.placeId) && !(l.audit && l.audit.publishedUrl)) byId.set(String(l.id), l); }
    const items = Array.from(byId.values()).slice(0, 200).map((l) => ({ leadId: l.id, url: l.website || "", placeId: l.placeId || "", company: l.entreprise || l.nom || "" }));
    if (items.length) {
      const dr = await fetch(`${base}/api/lead-audit-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": adminTok }, body: JSON.stringify({ tenantId: "abil", items }) });
      const dd: any = await dr.json().catch(() => ({}));
      enfileirados = dd && dd.ok ? Number(dd.added || 0) : 0;
      enqResp = `${dr.status} ${JSON.stringify(dd).slice(0, 120)}`;
    } else { enqResp = "pend=0"; }
  } catch (e) { enqResp = "exc:" + String(e).slice(0, 80); }

                                    
  budget = { date: todayStr(), count: (budget.count || 0) + aGravar.length };
  await writeJson(BUDGET_KEY, budget);

                                                                           
  const summary = { at: new Date().toISOString(), base, regioes: targets.map((t) => t.region), regioesTocadas, planoLen: plan.length, idxInicial, idxFinal, segments, encontrados: found.length, novos: aGravar.length, descartadosSemEmail: semEmail, enriquecidos: enriched, gravados: saved, enfileiradosDiag: enfileirados, enqResp, orcamentoHoje: budget.count, segErrors, clientOn: cfg.clientMapping !== false, isCron: !manualSegs };
  try { await writeJson("sourcing/last-run.json", summary); } catch {  }
  return res.status(200).json({ ok: true, ...summary, dailyCap });
}
