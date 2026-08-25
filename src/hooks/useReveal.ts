   
                                                                               
  
                                                                             
                                                                                
                                                                           
  
               
                                                          
                                                                                 
  
                                                 
                            
                                                           
               
                      
                                                        
                                                                                
                       
              
         
        
  
                                                             
                                                                       
                                          
                                                               
   

import { useEffect, useRef, useState } from "react";
import React from "react";

export type UseRevealOptions = {
     
                                                                          
                                                                            
                                                            
     
  rootMargin?: string;
     
                                                                     
     
  threshold?: number | number[];
     
                                                                            
                                                                     
     
  once?: boolean;
};

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: UseRevealOptions = {},
) {
  const { rootMargin = "-50px 0px", threshold = 0.01, once = true } = options;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined";
    } catch { return false; }
  });

  useEffect(() => {
                                                                               
                                                                          
                                                                  
    if (typeof window !== "undefined") {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }
      } catch {                                          }
    }

    const el = ref.current;
    if (!el) return;

                                                                            
                                                      
    if (typeof IntersectionObserver === "undefined") {
                                                           
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { rootMargin, threshold },
    );

    obs.observe(el);
    return () => obs.disconnect();
                                                                       
                                                                           
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, visible };
}

   
                                                                          
                                                                            
  
                                                  
  
                                  
                              
                                                 
                             
                    
        
   
export function RevealItem({
  children,
  delay = 0,
  variant = "fade-up",
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: "fade-up" | "fade" | "scale";
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const cls = variant === "fade-up" ? "reveal" : variant === "fade" ? "reveal-fade" : "reveal-scale";
  return React.createElement(
    Tag,
    {
      ref,
      className: `${cls} ${visible ? "in" : ""} ${className}`.trim(),
      style: { "--reveal-delay": `${delay}ms` } as React.CSSProperties,
    },
    children,
  );
}

   
                                                                            
                                                                           
                                                                       
  
                                                                               
                                                                                     
                                                                                 
                     
  
                                                                                
  
                                                                         
  
                                                                       
                                                                       
  
                                                          
   
const REVEAL_SELECTOR = [
                                                                       
  "main h1",
  "main h2",
  "main h3",
  "main h4",
                                                  
  "main section p",
  "main section li",
                                    
  "main section button",
  "main section a.btn, main section a[role='button']",
                                                                  
  "main section img",
                   
  "main article",
  "main section .card",
                       
  "main blockquote",
].join(", ");

                                                                               
                                                          
const REVEAL_SKIP_SELECTOR = [
  "header",
  "nav",
  "footer",
  "[role='dialog']",
  "[data-no-reveal]",
  ".no-reveal",
  ".dashboard",
  "[data-dashboard]",
                                                                   
  ".reveal",
  ".reveal-fade",
  ".reveal-scale",
].join(", ");

export function GlobalScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;

                                                         
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
    } catch {  }

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      {
                                                                                
                                                                              
                                                                            
                                                                               
        rootMargin: "0px 0px 200px 0px",
        threshold: 0,
      },
    );

    function shouldSkip(el: Element): boolean {
                                                                 
      if (el.closest(REVEAL_SKIP_SELECTOR)) return true;
                                     
      if (el.hasAttribute("data-reveal-init")) return true;
                                                                              
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return true;
      return false;
    }

    function tagAndObserve(el: Element, index: number = 0) {
      if (shouldSkip(el)) return;
      el.setAttribute("data-reveal-init", "1");
                                                                                  
                                                                                        
                                                                                       
                                                                                 
                                                                         
      const r = el.getBoundingClientRect();
      const inViewport = r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
      if (inViewport) {
                                                                                                              
        el.classList.add("reveal-auto", "is-revealed");
        return;                                     
      }
      el.classList.add("reveal-auto");
                                                                      
      const delay = Math.min(index * 60, 200);
      if (delay > 0) {
        (el as HTMLElement).style.setProperty("--reveal-delay", `${delay}ms`);
      }
      observer.observe(el);
    }

    function scan() {
      const els = document.querySelectorAll(REVEAL_SELECTOR);
                                                                             
      const byParent = new Map<Element, Element[]>();
      els.forEach((el) => {
        const parent = el.parentElement;
        if (!parent) return;
        if (shouldSkip(el)) return;
        if (!byParent.has(parent)) byParent.set(parent, []);
        byParent.get(parent)!.push(el);
      });
      byParent.forEach((siblings) => {
        siblings.forEach((el, i) => tagAndObserve(el, i));
      });
    }

                   
    scan();

                                                                               
                                                                       
                                                                             
                                                    
      
                                                                             
                                     
    let scanTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingScan = false;
    const mo = new MutationObserver((mutations) => {
                                                           
      let hasAdditions = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          hasAdditions = true;
          break;
        }
      }
      if (!hasAdditions) return;
      pendingScan = true;
      if (scanTimeout) return;
      scanTimeout = setTimeout(() => {
        scanTimeout = null;
        if (pendingScan) {
          pendingScan = false;
          scan();
        }
      }, 250);
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mo.disconnect();
      if (scanTimeout) clearTimeout(scanTimeout);
    };
  }, []);

  return null;
}
