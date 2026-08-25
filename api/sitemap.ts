import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ABIL_POSTS } from "../src/components/abil/posts.js";

export const config = { runtime: "nodejs" };

                                                                               
                                                                            
const SITE_BASE = "https://abil-site.vercel.app";
                                                                            
                                                                            
                                                
                                                                            
                                                                            
                                                                             
                                                                              
                                                                      
                                                                         
                                                                                  
                                                                            
                                                                  
const STATIC_PATHS = ["/", "/projets", "/services", "/journal",
  "/contact", "/agence", "/etudes", "/confidentialite", "/conditions"];

                                                                           
                                                                                
                                                                   
                                                                                
                                                                                
const V3_SERVICE_SLUGS = ["strategie", "identite", "sites-web", "campagnes",
  "reseaux-sociaux", "contenus"];

type SitemapEntry = { loc: string; lastmod?: string };

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function requestOrigin(req: VercelRequest): string {
  const proto = firstHeader(req.headers["x-forwarded-proto"]) || "https";
  const host = firstHeader(req.headers.host);
  return host ? `${proto}://${host}` : SITE_BASE;
}

function normalizedDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

                                                                                  
                                                                                   
                                                         
function v3DetailEntries(): SitemapEntry[] {
  return [
    ...V3_SERVICE_SLUGS.map((slug) => ({ loc: `/services/${slug}` })),
    ...ABIL_POSTS.map((post) => ({
      loc: `/journal/${post.slug}`,
      lastmod: normalizedDate(post.date),
    })),
  ];
}

function absoluteUrl(path: string, origin: string): string {
  if (path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function uniqueEntries(entries: SitemapEntry[], origin: string): SitemapEntry[] {
  const seen = new Map<string, SitemapEntry>();
  for (const entry of entries) {
    const loc = absoluteUrl(entry.loc, origin);
    const existing = seen.get(loc);
    if (!existing || (entry.lastmod && (!existing.lastmod || entry.lastmod > existing.lastmod))) {
      seen.set(loc, { loc, lastmod: entry.lastmod });
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.loc.localeCompare(b.loc));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderXml(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => [
    "  <url>",
    `    <loc>${escapeXml(entry.loc)}</loc>`,
    entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "",
    "  </url>",
  ].filter(Boolean).join("\n"));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

                                                                         
                                                                              
                                                                                 
                                                                   
                                                                                 
                                                                               
                                                                                  
                                                                         
async function publishedCaseEntries(origin: string): Promise<SitemapEntry[]> {
  try {
    const r = await fetch(`${origin}/api/projects`, { cache: "no-store" as RequestCache });
    if (!r.ok) return [];
    const dados = (await r.json()) as Array<{ slug?: string; title?: string; hidden?: boolean; cover?: { type?: string; src?: string; posterSrc?: string } | null; assets?: { type?: string; src?: string; posterSrc?: string }[] }>;
    if (!Array.isArray(dados)) return [];
    const slugDe = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "projet";
    return dados
      .filter((p) => p && !p.hidden && String(p.title || "").trim())
      .filter((p) => (p.cover && ((p.cover.type === "image" && p.cover.src) || p.cover.posterSrc || (p.cover.type === "video" && p.cover.src))) || (p.assets || []).some((a) => a && ((a.type === "image" && a.src) || a.posterSrc || (a.type === "video" && a.src))))
      .map((p) => ({ loc: `/projets/${String(p.slug || "").trim() || slugDe(String(p.title))}` }));
  } catch { return []; }
}

                                                                                 
                                                                                
                                                                                 
async function publishedPostEntries(origin: string): Promise<SitemapEntry[]> {
  try {
    const r = await fetch(`${origin}/api/store?key=abil_blog_drafts`, { cache: "no-store" as RequestCache });
    if (!r.ok) return [];
    const doc = (await r.json()) as { value?: Array<{ title?: string; status?: string; createdAt?: string; byLang?: Record<string, { title?: string }> }> };
    const brutos = Array.isArray(doc?.value) ? doc.value : [];
    const slugDe = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
    return brutos
      .filter((d) => d && d.status === "published")
      .map((d) => ({ titulo: String(d.byLang?.fr?.title || d.title || "").trim(), lastmod: String(d.createdAt || "").slice(0, 10) }))
      .filter((x) => x.titulo && /^\d{4}-\d{2}-\d{2}$/.test(x.lastmod))
      .map((x) => ({ loc: `/journal/${slugDe(x.titulo)}`, lastmod: x.lastmod }));
  } catch { return []; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = requestOrigin(req);
  const entries = uniqueEntries([
    ...STATIC_PATHS.map((loc) => ({ loc })),
    ...v3DetailEntries(),
    ...(await publishedCaseEntries(origin)),
    ...(await publishedPostEntries(origin)),
  ], origin);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(renderXml(entries));
}
