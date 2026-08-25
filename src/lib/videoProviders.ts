                                                                                        
                                                                                      
                                                                                    

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

export type TTSInput = { text: string; voice?: string; lang?: string };
export type RenderScene = { n?: number; title: string; onScreen: string[]; voiceover?: string };
export type RenderInput = { scenes: RenderScene[]; aspect?: "16:9" | "9:16" | "1:1"; onProgress?: (p: { phase: string; current: number; total: number }) => void };
export type AvatarInput = { script: string; voice?: string; aspect?: "16:9" | "9:16" | "1:1" };

export interface TextToSpeechProvider {
  id: string;
  available(): boolean;
  synthesize(input: TTSInput): Promise<Blob>;
}
export interface VideoRenderProvider {
  id: string;
  available(): boolean;
  render(input: RenderInput): Promise<{ videoUrl: string }>;
}
export interface AvatarProvider {
  id: string;
  available(): boolean;
  generate(input: AvatarInput): Promise<{ videoUrl: string }>;
}

function aiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window === "undefined") return headers;
  try { const vt = localStorage.getItem("abil_vault_token"); if (vt) headers["x-abil-admin"] = vt; } catch {            }
                                                                                                          
  return headers;
}

                                                                                                                                                     
export const openAITTSProvider: TextToSpeechProvider = {
  id: "openai-tts",
  available: () => true,
  async synthesize({ text, voice = "onyx" }) {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: aiHeaders(),
      body: JSON.stringify({ text: text.slice(0, 4000), voice }),
    });
    if (!r.ok) throw new Error(`TTS ${r.status}`);
    return r.blob();
  },
};

                                                                                                                           
                                                                                  
                                                                                         
                                                                                      
const FFMPEG_CORE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
let _ff: FFmpeg | null = null;
async function loadFFmpeg(): Promise<FFmpeg> {
  if (_ff) return _ff;
  const f = new FFmpeg();
  await f.load({
    coreURL: await toBlobURL(`${FFMPEG_CORE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${FFMPEG_CORE}/ffmpeg-core.wasm`, "application/wasm"),
  });
  _ff = f;
  return f;
}
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, max = 4): string[] {
  const words = (text || "").split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines.slice(0, max);
}
async function sceneFramePng(s: RenderScene, total: number): Promise<Uint8Array> {
  const W = 1280, H = 720;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  x.fillStyle = "#0a0a0b"; x.fillRect(0, 0, W, H);                           
  x.textAlign = "center";
  x.fillStyle = "#d2ff01"; x.font = "600 24px Arial";                          
  x.fillText(`${String(s.n || 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, W / 2, 170);
  x.fillStyle = "#ffffff"; x.font = "700 58px Arial";                
  const lines = wrapLines(x, s.title, W - 260);
  lines.forEach((l, i) => x.fillText(l, W / 2, 300 + i * 72));
  x.fillStyle = "rgba(255,255,255,0.65)"; x.font = "500 26px Arial";
  (s.onScreen || []).slice(0, 4).forEach((t, i) => x.fillText(t, W / 2, 300 + lines.length * 72 + 50 + i * 42));
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b as Blob), "image/png"));
  return new Uint8Array(await blob.arrayBuffer());
}
export const ffmpegRenderProvider: VideoRenderProvider = {
  id: "ffmpeg-wasm",
  available: () => typeof document !== "undefined" && typeof window !== "undefined",
  async render({ scenes, onProgress }) {
    const list = scenes.filter((s) => s && (s.title || s.voiceover));
    if (!list.length) throw new Error("sem cenas para renderizar");
    const ff = await loadFFmpeg();
    const tts = getTTSProvider();
    const parts: string[] = [];
    for (let i = 0; i < list.length; i++) {
      onProgress?.({ phase: "narração + frame", current: i + 1, total: list.length });
      await ff.writeFile(`f${i}.png`, await sceneFramePng(list[i], list.length));
      let hasAudio = false;
      try {
        const a = new Uint8Array(await (await tts.synthesize({ text: list[i].voiceover || list[i].title || "." })).arrayBuffer());
        if (a.length) { await ff.writeFile(`a${i}.mp3`, a); hasAudio = true; }
      } catch {  }
      if (hasAudio) {
        await ff.exec(["-loop", "1", "-i", `f${i}.png`, "-i", `a${i}.mp3`, "-r", "25", "-vf", "scale=1280:720", "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "44100", "-shortest", `s${i}.mp4`]);
      } else {
        await ff.exec(["-loop", "1", "-i", `f${i}.png`, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-t", "3", "-r", "25", "-vf", "scale=1280:720", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "44100", "-shortest", `s${i}.mp4`]);
      }
      parts.push(`file 's${i}.mp4'`);
    }
    onProgress?.({ phase: "montagem final", current: list.length, total: list.length });
    await ff.writeFile("list.txt", parts.join("\n"));
    await ff.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "out.mp4"]);
    const data = await ff.readFile("out.mp4");
    return { videoUrl: URL.createObjectURL(new Blob([data as BlobPart], { type: "video/mp4" })) };
  },
};

                                                                                                                           
export const externalAvatarProvider: AvatarProvider = {
  id: "heygen",
  available: () => false,
  async generate() {
    throw new Error("avatar provider requires the site ElevenLabs + HeyGen pipeline");
  },
};
export async function isAvatarConfigured(): Promise<boolean> {
  try { const r = await fetch("/api/heygen"); const d = await r.json(); return !!(d && d.configured); } catch { return false; }
}

                                                                                                                                                                                                                   
const TTS_PROVIDERS: TextToSpeechProvider[] = [openAITTSProvider];
const RENDER_PROVIDERS: VideoRenderProvider[] = [ffmpegRenderProvider];
const AVATAR_PROVIDERS: AvatarProvider[] = [externalAvatarProvider];

export function getTTSProvider(): TextToSpeechProvider {
  return TTS_PROVIDERS.find((p) => p.available()) || openAITTSProvider;
}
export function getRenderProvider(): VideoRenderProvider | null {
  return RENDER_PROVIDERS.find((p) => p.available()) || null;
}
export function getAvatarProvider(): AvatarProvider | null {
  return AVATAR_PROVIDERS.find((p) => p.available()) || null;
}
export function videoCapabilities() {
  return { tts: getTTSProvider().available(), renderMp4: getRenderProvider() !== null, avatar: getAvatarProvider() !== null };
}
