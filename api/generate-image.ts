                                                                     
                                                                       
                                                
                                                    
  
                                                                       
                                                                                                                               
                                                 
                                         
                                                                
                                                                

export const config = {
  runtime: "edge",
};

                                                              
                                                                                            
                                                                                                
const BRAND_VOICE_SUFFIX = `
Subject discipline: the image MUST depict the specific subject described in the brief above, literally and concretely. Do not replace the actual subject with a generic symbol, mascot or the brand asterisk.
Style: ABiL aesthetic, Swiss editorial minimalism, calm and confident.
Calm composition, generous negative space, restrained tonal palette.
Natural light when photographic, never harsh studio lighting. Always in full colour, never black and white or grayscale.
No text overlay, no asterisk symbol, no logo, no watermark.
Visual register: contemporary editorial photography or refined graphic design.
Avoid: stock-photo cliché, vibrant saturated colours, lens-flare, fake bokeh,
people staring at camera, corporate buzz imagery.`.trim();

type PersonaBits = { title?: string; tonality?: string; avoid?: string; keywords?: string; visualRef?: string; prompt?: string };
type GenerateImageRequest = {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
  context?: string;                                                                               
  globalImagePrompt?: string;                                  
  referenceNotes?: string;                                      
  brandPersona?: PersonaBits;                           
  buyerPersona?: PersonaBits;                           
  skipBrandVoice?: boolean;                                   
};

type GenerateImageResponse = {
  dataUrl?: string;
  prompt?: string;                              
  error?: string;
};

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function adminOk(req: Request): Promise<boolean> {
  const env = (typeof process !== "undefined" ? process.env : ({} as any)) as Record<string, string | undefined>;
  const pw = env.ABIL_ADMIN_AUTH_SECRET || "";
  const tok = req.headers.get("x-abil-admin") || "";
  if (!pw || !tok || !tok.includes(".")) return false;
  const i = tok.indexOf(".");
  const exp = Number(tok.slice(0, i));
  const sig = tok.slice(i + 1);
  if (!exp || exp <= Date.now()) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(String(exp))));
  const want = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return safeEqual(sig, want);
}

async function callOpenAIImage(args: {
  apiKey: string;
  prompt: string;
  size: string;
  quality: string;
}): Promise<{ dataUrl: string; revisedPrompt?: string }> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 60000);                                 
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${args.apiKey}` },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: args.prompt,
        size: args.size,
        quality: args.quality,
        n: 1,
        moderation: "low",
      }),
    });
    clearTimeout(tid);
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
                                    
      if (res.status === 401) throw new Error("OpenAI API key inválida ou expirada.");
      if (res.status === 403) throw new Error("Conta OpenAI sem acesso a gpt-image-1. Verifica conta em platform.openai.com (precisa de verification).");
      if (res.status === 429) throw new Error("Limite de pedidos OpenAI atingido, tenta de novo em alguns segundos.");
      if (res.status >= 500) throw new Error(`OpenAI server error ${res.status}. Tenta novamente.`);
      throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 300)}`);
    }
    const data: any = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error("Resposta OpenAI sem imagem (b64_json vazio).");
    return {
      dataUrl: `data:image/png;base64,${b64}`,
      revisedPrompt: data?.data?.[0]?.revised_prompt,
    };
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

export default async function handler(req: Request): Promise<Response> {
         
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-openai-key, x-abil-admin",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" } as GenerateImageResponse), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!(await adminOk(req))) {
    return new Response(JSON.stringify({ error: "unauthorized" } as GenerateImageResponse), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: GenerateImageRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" } as GenerateImageResponse), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userPrompt = (body.prompt || "").trim();
  if (!userPrompt) {
    return new Response(JSON.stringify({ error: "Prompt obrigatório" } as GenerateImageResponse), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

                                                  
  const envKey = (typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : "") || "";
  const apiKey = envKey;                          
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY não configurada" } as GenerateImageResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

                                                                                           
  const size = body.size || "1536x1024";
  const quality = body.quality || "medium";

                                                               
  const ctx = (body.context || "").trim();
  const globalDir = (body.globalImagePrompt || "").trim().slice(0, 1200);
  const refNotes = (body.referenceNotes || "").trim().slice(0, 800);
  const bp = body.brandPersona || {};
  const yp = body.buyerPersona || {};
  const brandBits = [
    bp.visualRef ? `visual reference: ${bp.visualRef}` : "",
    bp.keywords ? `brand keywords: ${bp.keywords}` : "",
  ].filter(Boolean).join("; ").slice(0, 600);
  const audienceBits = [
    yp.title ? `for ${yp.title}` : "",
    yp.keywords ? `audience cues: ${yp.keywords}` : "",
  ].filter(Boolean).join("; ").slice(0, 400);
  const finalPrompt = body.skipBrandVoice
    ? userPrompt
    : [
        userPrompt,
        ctx ? `Context: ${ctx}.` : "",
        brandBits ? `Brand identity (${bp.title || "ABiL"}), ${brandBits}.` : "",
        audienceBits ? `Audience, ${audienceBits}.` : "",
        globalDir ? `Global art direction (apply on top, complements the brief): ${globalDir}` : "",
        refNotes ? `Reference material: ${refNotes}` : "",
        BRAND_VOICE_SUFFIX,
      ].filter(Boolean).join("\n\n");

  try {
    const { dataUrl, revisedPrompt } = await callOpenAIImage({ apiKey, prompt: finalPrompt, size, quality });
    return new Response(JSON.stringify({ dataUrl, prompt: revisedPrompt || finalPrompt } as GenerateImageResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const message = err?.message || "Erro desconhecido na geração de imagem";
    return new Response(JSON.stringify({ error: message } as GenerateImageResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
