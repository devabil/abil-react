                                                                                    
                                                                                      
                                                                                      
                                                                                           
                                                                                     
                                                     
                                                                                        
                                                                                            
const OPT_SIZES = [384, 640, 750, 828, 1080, 1200, 1920];

export function vercelOptimizedSrc(url: string | undefined | null, renderWidth?: number): string {
  if (!url || typeof url !== "string") return url || "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
                                                                                          
                                                                                               
                                                                             
  if (/\.gif(\?|#|$)/i.test(url)) return url;
  if (!/\.public\.blob\.vercel-storage\.com\//.test(url)) return url;
  const target = renderWidth && renderWidth > 0 ? Math.min(1920, Math.round(renderWidth * 2)) : 828;
  const w = OPT_SIZES.find((s) => s >= target) || 1920;
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${w}&q=72`;
}
