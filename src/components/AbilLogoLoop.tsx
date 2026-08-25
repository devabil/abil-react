                                                                        
                                                                
                                                                             
                                                                                
                                                                                
                                                                           
                                                                               
                                                                            
                                                                               
                                                                              
                                                                              
import { useEffect, useState } from "react";

const DESVIO_ESQ = "0.316vw";
                                                                             
                                                                             
                                                                             
                                                                            
                                                                            
                                                                             
                                                         
const SUBIDA_PX = 4.88;

                                                                               
                                                                              
                                  
  
                                                                             
                                                                                
                                                                              
                                                                            
                                                                       
                                                                               
                                                                                 
                                                                      
                                                                          
                                                                            
                                                                         
  
                                                          
                                                                              
                                                        
                                                  
                                                                                 
                                                                         
                                                                                
                                                                                
                                                     
                                                                               
                                                     
                                                                              
                  
                                                                               
const INTRO_MS = 2000;                                                             
const FOLGA_MS = 260;                                                           

function semMovimento() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function AbilLogoLoop({ height = 26.77, citron = false }: { height?: number; citron?: boolean }) {
  const gif = citron ? "/brand/abil-intro-citron.gif" : "/brand/abil-intro-black.gif";
  const marca = citron ? "/brand/abil-mark-citron.png" : "/brand/abil-mark-black.png";
  const [parado, setParado] = useState(semMovimento);
                                                                               
                                                                               
                                               
  const [gifAnterior, setGifAnterior] = useState(gif);
  if (gifAnterior !== gif) {
    setGifAnterior(gif);
    setParado(semMovimento());
  }

  useEffect(() => {
    if (semMovimento()) return;
    const id = window.setTimeout(() => setParado(true), INTRO_MS + FOLGA_MS);
    return () => window.clearTimeout(id);
  }, [gif]);

  return (
    <span
      className="abil-loop-wrap"
      style={{
        position: "relative",
        display: "inline-block",
        lineHeight: 0,
        marginLeft: DESVIO_ESQ,
        marginBottom: SUBIDA_PX,
      }}
    >
      {                                                                       
                                                                        }
      <img
        className="abil-loop-gif"
        src={gif}
        alt=""
        aria-hidden="true"
        style={{ height, width: "auto", display: "block", opacity: parado ? 0 : 1 }}
      />
      <img
        className="abil-loop-still"
        src={marca}
        alt="ABiL MEDiAS"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: "100%",
          display: "block",
          opacity: parado ? 1 : 0,
          pointerEvents: "none",
        }}
      />
    </span>
  );
}
