   
                                                                                      
   

import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { runtime: "nodejs" };

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if ((req.method || "GET").toUpperCase() === "OPTIONS") {
    res.status(204).end();
    return;
  }
  const env = (typeof process !== "undefined" ? process.env : ({} as Record<string, string | undefined>)) || {};
  const openai = !!(env.OPENAI_API_KEY && String(env.OPENAI_API_KEY).length > 10);
  const anthropic = !!(env.ANTHROPIC_API_KEY && String(env.ANTHROPIC_API_KEY).length > 10);
  res.status(200).json({
    configured: openai || anthropic,
    provider: openai ? "openai" : anthropic ? "anthropic" : null,
  });
}
