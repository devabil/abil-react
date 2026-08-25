                                                                                                                                                                                                                                          
                                                                           
  
                                                                       
                                                                               
                                                                             
                                                                                  
                                                                                 
                                                                                      
  
                                                                                    
                                                                            
                                                                                 
                                                                               
                                                                                     
                                                                               
                                                                       
  
                                                                              
                                                                  
                                                                                                                                                                                                                                          
import { useEffect, useRef, useState } from "react";

const VIOLETTE = "#be8efc";
const NOIR = "#0a0a0b";
const TELA: [number, number, number] = [239, 239, 239];
const VIOLETTE_RGB: [number, number, number] = [190, 142, 252];
const CONTRASTE_MINIMO = 1.7;

const CLICAVEL = "a, button, [role='button'], select, label, input, textarea, [data-cursor='clickable'], [data-v3hover]";

function canal(v: number) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminancia([r, g, b]: [number, number, number]) {
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}
function contraste(a: [number, number, number], b: [number, number, number]) {
  const la = luminancia(a), lb = luminancia(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
                                                                                          
function fundoSob(x: number, y: number): [number, number, number] {
  let el: Element | null = document.elementFromPoint(x, y);
  let saltos = 0;
  while (el && saltos < 24) {
    const bg = getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(",").map((n) => parseFloat(n.trim()));
      const alpha = p.length > 3 ? p[3] : 1;
      if (alpha > 0.5) return [p[0], p[1], p[2]];
    }
    el = el.parentElement;
    saltos++;
  }
  return TELA;
}

export function CursorAbil() {
  const pontoRef = useRef<HTMLDivElement>(null);
  const [sobreClicavel, setSobreClicavel] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [cor, setCor] = useState(VIOLETTE);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf: number | null = null;
    let corAnterior = VIOLETTE;
    let clicavelAnterior = false;

    const lerFundo = () => {
      const { x, y } = pos.current;
      if (!x && !y) return;
      const nova = contraste(VIOLETTE_RGB, fundoSob(x, y)) < CONTRASTE_MINIMO ? NOIR : VIOLETTE;
      if (nova !== corAnterior) { corAnterior = nova; setCor(nova); }
    };

    const mover = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const el = pontoRef.current;
        if (el) el.style.transform = `translate3d(${pos.current.x}px,${pos.current.y}px,0) translate(-50%,-50%)`;
        if (!visivel) setVisivel(true);
      });
    };
    const sobre = (e: MouseEvent) => {
      const alvo = e.target as Element | null;
      const clicavel = !!alvo?.closest?.(CLICAVEL);
      if (clicavel !== clicavelAnterior) { clicavelAnterior = clicavel; setSobreClicavel(clicavel); }
      lerFundo();
    };
    const sair = () => setVisivel(false);
    const entrar = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const el = pontoRef.current;
      if (el) el.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0) translate(-50%,-50%)`;
      setVisivel(true);
      lerFundo();
    };
    let rafScroll: number | null = null;
    const aoRolar = () => {
      if (rafScroll) return;
      rafScroll = requestAnimationFrame(() => { rafScroll = null; lerFundo(); });
    };

    document.addEventListener("mousemove", mover, { passive: true });
    document.addEventListener("mouseover", sobre, { passive: true });
    document.addEventListener("mouseleave", sair);
    document.addEventListener("mouseenter", entrar);
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      document.removeEventListener("mousemove", mover);
      document.removeEventListener("mouseover", sobre);
      document.removeEventListener("mouseleave", sair);
      document.removeEventListener("mouseenter", entrar);
      window.removeEventListener("scroll", aoRolar);
      if (raf) cancelAnimationFrame(raf);
      if (rafScroll) cancelAnimationFrame(rafScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {                                                                              
                                                                                
                                                                 }
      {visivel ? (
        <style>{`@media (pointer: fine){
          body, a, button, [role='button'], select, label, input, textarea,
          [contenteditable], [data-cursor='clickable'], [data-v3hover] { cursor: none; }
        }`}</style>
      ) : null}
      <div
        ref={pontoRef}
        aria-hidden="true"
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 2147483647, pointerEvents: "none",
          width: sobreClicavel ? 44 : 22,
          height: sobreClicavel ? 44 : 22,
          opacity: visivel ? 1 : 0,
          willChange: "transform",
          transition: "width .5s ease-out, height .5s ease-out, opacity .2s linear",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "block", borderRadius: "50%",
            width: sobreClicavel ? "100%" : "60%",
            height: sobreClicavel ? "100%" : "60%",
            background: sobreClicavel ? "transparent" : cor,
            border: sobreClicavel ? `1.5px solid ${cor}` : "none",
            transition: "width .3s ease, height .3s ease, background .25s ease, border-color .25s ease",
          }}
        />
      </div>
    </>
  );
}
