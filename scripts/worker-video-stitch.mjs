#!/usr/bin/env node
                                                                                              
                                                                   
                                                                                     
                                                                                    
                                                                                 
                                                                                                  
                                                                                                       
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { upload } from "@vercel/blob/client";

const BASE = process.env.SITE_BASE || "https://abil-site.vercel.app";
const CRON = (process.env.CRON_SECRET || "").trim();
if (!CRON) { console.error("CRON_SECRET is missing from the environment"); process.exit(1); }

const jr = await fetch(`${BASE}/api/auto-creator?action=video-jobs`, { headers: { Authorization: `Bearer ${CRON}` } });
const jd = await jr.json().catch(() => null);
const jobs = Array.isArray(jd?.jobs) ? jd.jobs : [];
const todo = jobs.filter((j) => j?.state === "costura" && Array.isArray(j.tasks) && j.tasks.length > 0 && j.tasks.every((t) => t?.videoUrl));
if (!todo.length) { console.log(new Date().toISOString(), "no videos to stitch"); process.exit(0); }

for (const j of todo.slice(0, 2)) {
  const dir = mkdtempSync(join(tmpdir(), "vid-"));
  try {
    const files = [];
    for (let i = 0; i < j.tasks.length; i++) {
      const r = await fetch(j.tasks[i].videoUrl);
      if (!r.ok) throw new Error(`download clip ${i}: http ${r.status}`);
      const f = join(dir, `c${i}.mp4`);
      writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      files.push(f);
    }
    const concatOut = join(dir, "concat.mp4");
    const inputs = files.flatMap((f) => ["-i", f]);
    const fc = files.map((_, i) => `[${i}:v][${i}:a]`).join("") + `concat=n=${files.length}:v=1:a=1[v][a]`;
    execFileSync("ffmpeg", ["-y", ...inputs, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", concatOut], { stdio: "pipe" });
    let out = concatOut;
                                                                                          
                                                                                               
                                                                    
    if (j.trilhaUrl) {
      try {
        const tr = await fetch(j.trilhaUrl);
        if (tr.ok) {
          const tf = join(dir, "trilha.mp3");
          writeFileSync(tf, Buffer.from(await tr.arrayBuffer()));
          const mixed = join(dir, "final-trilha.mp4");
          execFileSync("ffmpeg", ["-y", "-i", concatOut, "-stream_loop", "-1", "-i", tf,
            "-filter_complex",
            "[1:a]volume=0.30,afade=t=in:d=1.2[bg];[bg][0:a]sidechaincompress=threshold=0.03:ratio=12:attack=20:release=400[duck];[0:a][duck]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[a]",
            "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", mixed], { stdio: "pipe" });
          out = mixed;
        }
      } catch (e) { console.error(new Date().toISOString(), `job ${j.id}: soundtrack failed (${e?.message || e}); continuing without it`); }
    }
    const buf = readFileSync(out);
    const blob = await upload(`autovideo/${j.id}.mp4`, buf, { access: "public", handleUploadUrl: `${BASE}/api/upload-token`, headers: { Authorization: `Bearer ${CRON}` }, contentType: "video/mp4" });
    const fr = await fetch(`${BASE}/api/auto-creator?action=video-final`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${CRON}` }, body: JSON.stringify({ id: j.id, videoUrl: blob.url }) });
    console.log(new Date().toISOString(), `job ${j.id}: stitched at ${blob.url} (video-final HTTP ${fr.status})`);
  } catch (e) {
    console.error(new Date().toISOString(), `job ${j.id}: failed: ${e?.message || e}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
