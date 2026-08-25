import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

export const config = { runtime: "nodejs" };

const ADMIN = process.env.META_ADMIN_KEY || "";
const SITE = "abil";

type Check = { key: string; label: string; configured: boolean; required: boolean; hint?: string };
type Group = { id: string; label: string; status: "ready" | "partial" | "blocked"; checks: Check[]; action: string };

function has(name: string): boolean {
  return Boolean(String(process.env[name] || "").trim());
}

function hasAny(names: string[]): boolean {
  return names.some((name) => has(name));
}

function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"];
  const mkv = Array.isArray(mk) ? mk[0] : mk;
  if (ADMIN && mkv && mkv === ADMIN) return true;
  const gh = req.headers["x-abil-admin"];
  const token = Array.isArray(gh) ? gh[0] : gh;
  const pw = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  if (!pw || !token || token.indexOf(".") <= 0) return false;
  const split = token.indexOf(".");
  const exp = Number(token.slice(0, split));
  const sig = token.slice(split + 1);
  if (!exp || exp <= Date.now()) return false;
  const want = crypto.createHmac("sha256", pw).update(String(exp)).digest("hex");
  try {
    return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
  } catch {
    return false;
  }
}

                                                                                             
                                                                     
const HEADER_FOR: Record<string, string> = {
  OPENAI_API_KEY: "x-openai-key", ANTHROPIC_API_KEY: "x-anthropic-key",
  PEXELS_API_KEY: "x-pexels-key", UNSPLASH_ACCESS_KEY: "x-unsplash-key",
  RESEND_API_KEY: "x-resend-key", RESEND_FROM: "x-resend-from",
  HEYGEN_API_KEY: "x-heygen-key", ELEVENLABS_API_KEY: "x-elevenlabs-key",
};
function hdrPresent(req: VercelRequest, envName: string): boolean {
  const h = HEADER_FOR[envName];
  if (!h) return false;
  const v = req.headers[h];
  return Boolean(String(Array.isArray(v) ? v[0] : v || "").trim());
}
let _req: VercelRequest | null = null;
function present(name: string): boolean {
  return has(name) || (!!_req && hdrPresent(_req, name));
}
function check(key: string, label: string, required = true, configured = present(key), hint?: string): Check {
  return { key, label, configured, required, hint };
}

function group(id: string, label: string, checks: Check[], action: string): Group {
  const required = checks.filter((item) => item.required);
  const configured = required.filter((item) => item.configured);
  const status = required.length > 0 && configured.length === required.length
    ? "ready"
    : configured.length > 0
      ? "partial"
      : "blocked";
  return { id, label, status, checks, action };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
                                                                                       
                                                                                            
  {
    const _o = req.headers.origin; const _org = Array.isArray(_o) ? _o[0] : _o;
    const _ok = !!_org && (
      /^https:\/\/abil-site\.vercel\.app$/.test(_org) ||
      /^https:\/\/([a-z0-9-]+\.)?abil\.ch$/.test(_org) ||
      /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/.test(_org) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(_org)
    );
    if (_ok) { res.setHeader("Access-Control-Allow-Origin", _org as string); res.setHeader("Vary", "Origin"); }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization, x-openai-key, x-anthropic-key, x-pexels-key, x-unsplash-key, x-resend-key, x-resend-from, x-heygen-key, x-elevenlabs-key");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  _req = req;

  const groups: Group[] = [
    group("ai", "AI text and translation", [
      check("OPENAI_API_KEY", "OpenAI key", false),
      check("ANTHROPIC_API_KEY", "Anthropic key", false),
      { key: "OPENAI_OR_ANTHROPIC", label: "At least one LLM provider", configured: present("OPENAI_API_KEY") || present("ANTHROPIC_API_KEY"), required: true },
    ], "Add credit/key for OpenAI or configure Anthropic before relying on generated copy."),
    group("image-bank", "Image bank (stock photos)", [
      { key: "PEXELS_OR_UNSPLASH", label: "At least one stock provider", configured: present("PEXELS_API_KEY") || present("UNSPLASH_ACCESS_KEY"), required: true },
      check("PEXELS_API_KEY", "Pexels API key", false),
      check("UNSPLASH_ACCESS_KEY", "Unsplash access key", false),
    ], "Configure Pexels (or Unsplash) so blog and repost images can use real, relevant stock photos."),
    group("blob", "Blob storage and media", [
      check("BLOB_READ_WRITE_TOKEN", "Vercel Blob read/write token"),
      check("BLOB_PUBLIC_BASE_URL", "Public Blob base URL", false, has("BLOB_PUBLIC_BASE_URL"), "Optional because the API can fall back to Blob list, but public base is faster and clearer."),
    ], "Connect Vercel Blob before large covers, videos, thumbnails and generated media are treated as production-safe."),
    group("email", "Email delivery queue", [
      check("CRON_SECRET", "Cron bearer secret"),
      check("RESEND_API_KEY", "Resend API key"),
      check("RESEND_FROM", "Verified sender address"),
      check("BLOB_READ_WRITE_TOKEN", "Queue persistence in Blob"),
    ], "Configure Resend and sender domain before approved email templates can become delivered emails."),
    group("meta", "Meta publishing", [
      check("ABIL_ADMIN_AUTH_SECRET", "Server admin/vault password"),
      check("META_APP_ID", "Meta app id"),
      check("META_APP_SECRET", "Meta app secret"),
      check("META_TOKEN_ENC_KEY", "Token encryption key"),
      check("BLOB_READ_WRITE_TOKEN", "Encrypted connection storage"),
    ], "Complete Meta app envs, app review and tenant connection before Facebook/Instagram/WhatsApp publishing is real."),
    group("linkedin", "LinkedIn publishing", [
      check("ABIL_ADMIN_AUTH_SECRET", "Server admin/vault password"),
      check("LINKEDIN_CLIENT_ID", "LinkedIn client id"),
      check("LINKEDIN_CLIENT_SECRET", "LinkedIn client secret"),
      check("BLOB_READ_WRITE_TOKEN", "Connection storage"),
    ], "Complete LinkedIn OAuth envs and connect a tenant before approved social posts can be published on LinkedIn."),
    group("google", "Google and Gmail", [
      check("GOOGLE_CLIENT_ID", "Google client id"),
      check("GOOGLE_CLIENT_SECRET", "Google client secret"),
      check("GMAIL_REFRESH_TOKEN", "Gmail refresh token", false),
      check("GA4_PROPERTY_ID", "GA4 property id", false),
    ], "Google/Gmail can support inbox, drafts, finance scan and analytics only for the scopes/tokens configured."),
    group("media-ai", "AI media providers (video/voice)", [
      check("HEYGEN_API_KEY", "HeyGen API key", false),
      check("ELEVENLABS_API_KEY", "ElevenLabs API key", false),
    ], "Optional providers. Missing keys should disable provider-specific generation instead of simulating success."),
  ];

  const summary = {
    ready: groups.filter((item) => item.status === "ready").length,
    partial: groups.filter((item) => item.status === "partial").length,
    blocked: groups.filter((item) => item.status === "blocked").length,
    total: groups.length,
  };

  return res.status(200).json({ ok: true, site: SITE, generatedAt: new Date().toISOString(), summary, groups });
}
