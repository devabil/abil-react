                                                                                
// ESLint Fast Refresh requires a component file to export only components.
                                                                      

export const EH_VIDEO_SRC = (s: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(s || "");

                                                                                                                 
export function ligarVideo(el: HTMLVideoElement | null) {
  if (!el) return;
  el.muted = true;
  if (el.paused) { const p = el.play(); if (p && p.catch) p.catch(() => {                        }); }
}
