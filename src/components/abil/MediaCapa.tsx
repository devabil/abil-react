                                                                                                                                                                                                                                          
                                                             
  
                                                                                 
                                                                            
                                                                            
                                                                            
                                                                             
                                                                   
  
                                                                               
                                                                                
                                                                     
                                                                                                                                                                                                                                          
import type { CSSProperties } from "react";
import { EH_VIDEO_SRC, ligarVideo } from "./media";

export function MediaCapa({
  src, alt = "", ed, className, style, eager, poster,
}: {
  src: string; alt?: string; ed?: string; className?: string;
  style?: CSSProperties; eager?: boolean; poster?: string;
}) {
  if (EH_VIDEO_SRC(src)) {
    return (
      <video
        src={src} data-ed={ed} poster={poster} className={className} style={style}
        autoPlay muted loop playsInline preload="metadata" aria-label={alt}
        ref={ligarVideo} onCanPlay={(e) => ligarVideo(e.currentTarget)}
      />
    );
  }
  return <img src={src} data-ed={ed} alt={alt} className={className} style={style} loading={eager ? "eager" : "lazy"} />;
}
