                                                                            
                                                                           
                                                                                 
                                                                                  

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

                                                                               
let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const ff = new FFmpeg();
    if (onLog) ff.on("log", ({ message }) => onLog(message));
    await ff.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ff;
    return ff;
  })();
  return loadingPromise;
}

export type VideoPreviewProgress = {
  phase: "loading-ffmpeg" | "decoding" | "encoding-preview" | "encoding-compressed-full" | "extracting-poster" | "done";
  percent: number;         
  message: string;
};

export type VideoPreviewResult = {
  previewBlob: Blob;                                                                     
  posterBlob: Blob;                                                                      
                                                                              
                                                                             
                                                                                   
  compressedFullBlob: Blob;
  compressedFullDataUrl: string;
  previewDataUrl: string;
  posterDataUrl: string;
  originalDuration: number;
};

   
                                                                        
                                               
                                                                                                          
                                                              
   
export async function generateVideoPreview(
  file: File,
  targetWidth: number = 800,
  onProgress?: (p: VideoPreviewProgress) => void,
): Promise<VideoPreviewResult> {
  onProgress?.({ phase: "loading-ffmpeg", percent: 0, message: "A carregar FFmpeg (1ª vez ~30MB; depois cached)…" });
  const ff = await getFFmpeg();

                                        
  onProgress?.({ phase: "decoding", percent: 10, message: "A descodificar vídeo…" });
  const inputName = "input." + (file.name.split(".").pop() || "mp4");
  const inputData = await fetchFile(file);
  await ff.writeFile(inputName, inputData);

                                                                        
                                                                                       
  const originalDuration = await getVideoDurationSeconds(file);

                                                                           
                                                                             
                                                                       
                                                            
                                                                    
  onProgress?.({ phase: "extracting-poster", percent: 25, message: "A extrair poster (frame 1s, evita preto)…" });
  const safeSkipSec = originalDuration > 1.5 ? 1 : 0;
  try {
    await ff.exec([
      "-ss", String(safeSkipSec),
      "-i", inputName,
      "-vf", `scale=${targetWidth}:-2`,
      "-vframes", "1",
      "-q:v", "3",
      "poster.jpg",
    ]);
  } catch {
                                            
    await ff.exec([
      "-i", inputName,
      "-vf", `scale=${targetWidth}:-2`,
      "-vframes", "1",
      "-q:v", "3",
      "poster.jpg",
    ]);
  }
  const posterBytes = await ff.readFile("poster.jpg");
  const posterBlob = new Blob([posterBytes as Uint8Array], { type: "image/jpeg" });

                                                                          
  onProgress?.({ phase: "encoding-preview", percent: 50, message: "A gerar preview leve 5s…" });

                                         
  const onFFmpegProgress = ({ progress }: { progress: number }) => {
    if (typeof progress === "number" && progress >= 0 && progress <= 1) {
      const pct = 50 + Math.round(progress * 45);         
      onProgress?.({ phase: "encoding-preview", percent: pct, message: `A gerar preview leve 5s… ${Math.round(progress * 100)}%` });
    }
  };
  ff.on("progress", onFFmpegProgress);

  try {
    await ff.exec([
      "-i", inputName,
      "-t", "5",
      "-an",
      "-vf", `scale=${targetWidth}:-2`,
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "28",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "preview.mp4",
    ]);
  } finally {
    ff.off("progress", onFFmpegProgress);
  }

  const previewBytes = await ff.readFile("preview.mp4");
  const previewBlob = new Blob([previewBytes as Uint8Array], { type: "video/mp4" });

                                                                          
                                                                             
                                                                              
                                                                               
  onProgress?.({ phase: "encoding-compressed-full", percent: 60, message: "A gerar versão completa 1080p (áudio + qualidade alta)…" });

  const onFullProgress = ({ progress }: { progress: number }) => {
    if (typeof progress === "number" && progress >= 0 && progress <= 1) {
      const pct = 60 + Math.round(progress * 35);         
      onProgress?.({ phase: "encoding-compressed-full", percent: pct, message: `A gerar versão completa 1080p… ${Math.round(progress * 100)}%` });
    }
  };
  ff.on("progress", onFullProgress);

  let compressedFullBlob: Blob;
  try {
    await ff.exec([
      "-i", inputName,
                                                                             
                                                                                     
      "-vf", "scale='min(1920,iw)':'-2'",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "compressed_full.mp4",
    ]);
    const compressedFullBytes = await ff.readFile("compressed_full.mp4");
    compressedFullBlob = new Blob([compressedFullBytes as Uint8Array], { type: "video/mp4" });
  } catch (e) {
                                                                                        
    console.warn("[generateVideoPreview] compressed_full failed, fallback to preview blob:", e);
    compressedFullBlob = previewBlob;
  } finally {
    ff.off("progress", onFullProgress);
  }

                                         
  try {
    await ff.deleteFile(inputName);
    await ff.deleteFile("poster.jpg");
    await ff.deleteFile("preview.mp4");
    await ff.deleteFile("compressed_full.mp4");
  } catch {  }

                                                                    
  onProgress?.({ phase: "done", percent: 100, message: "Pronto." });
  const [previewDataUrl, posterDataUrl, compressedFullDataUrl] = await Promise.all([
    blobToDataUrl(previewBlob),
    blobToDataUrl(posterBlob),
    blobToDataUrl(compressedFullBlob),
  ]);

  return {
    previewBlob,
    posterBlob,
    compressedFullBlob,
    previewDataUrl,
    posterDataUrl,
    compressedFullDataUrl,
    originalDuration,
  };
}

export type GifToMp4Result = {
  mp4Blob: Blob;
  mp4DataUrl: string;
  posterBlob: Blob;
  posterDataUrl: string;
  width: number;
  height: number;
};

   
                                                                           
                                                                                
                                                                                     
                                                                             
   
export async function gifToMp4(
  file: File | Blob,
  onProgress?: (p: { phase: string; percent: number; message: string }) => void,
): Promise<GifToMp4Result> {
  onProgress?.({ phase: "loading-ffmpeg", percent: 0, message: "A carregar FFmpeg (1ª vez ~30MB; depois cached)…" });
  const ff = await getFFmpeg();

  onProgress?.({ phase: "decoding", percent: 15, message: "A descodificar GIF…" });
  await ff.writeFile("input.gif", await fetchFile(file));

  onProgress?.({ phase: "extracting-poster", percent: 30, message: "A extrair poster…" });
  let posterBlob = new Blob([], { type: "image/jpeg" });
  try {
    await ff.exec(["-i", "input.gif", "-vframes", "1", "-q:v", "3", "poster.jpg"]);
    const pb = await ff.readFile("poster.jpg");
    posterBlob = new Blob([pb as Uint8Array], { type: "image/jpeg" });
  } catch {  }

  onProgress?.({ phase: "encoding", percent: 50, message: "A converter para vídeo MP4…" });
  const onFF = ({ progress }: { progress: number }) => {
    if (typeof progress === "number" && progress >= 0 && progress <= 1) {
      onProgress?.({ phase: "encoding", percent: 50 + Math.round(progress * 45), message: `A converter para vídeo… ${Math.round(progress * 100)}%` });
    }
  };
  ff.on("progress", onFF);
  try {
    await ff.exec([
      "-i", "input.gif",
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "23",
      "-an",
      "output.mp4",
    ]);
  } finally {
    ff.off("progress", onFF);
  }
  const mp4Bytes = await ff.readFile("output.mp4");
  const mp4Blob = new Blob([mp4Bytes as Uint8Array], { type: "video/mp4" });

  let width = 0, height = 0;
  try { const d = await imageDims(posterBlob); width = d.w; height = d.h; } catch {  }

  try { await ff.deleteFile("input.gif"); await ff.deleteFile("poster.jpg"); await ff.deleteFile("output.mp4"); } catch {  }

  onProgress?.({ phase: "done", percent: 100, message: "Pronto." });
  const [mp4DataUrl, posterDataUrl] = await Promise.all([blobToDataUrl(mp4Blob), blobToDataUrl(posterBlob)]);
  return { mp4Blob, mp4DataUrl, posterBlob, posterDataUrl, width, height };
}

function imageDims(blob: Blob): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { const w = img.naturalWidth, h = img.naturalHeight; URL.revokeObjectURL(url); resolve({ w, h }); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      v.removeAttribute("src");
    };
    v.onloadedmetadata = () => {
      const d = v.duration;
      cleanup();
      resolve(isFinite(d) && d > 0 ? d : 0);
    };
    v.onerror = () => { cleanup(); resolve(0); };
  });
}
