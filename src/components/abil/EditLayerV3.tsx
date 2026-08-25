                                                                             
                                                                           
                                                                          
                                                                           
                                                                                
                                                                            
                                                                         
                                                                               
                                                         
                                                                            
                                                                       
                                                                            
                                                                     
import { useCallback, useEffect, useRef, useState } from "react";
import { REGISTO_EDITAVEIS, edicoesBrutas, gravarEdicaoLocal } from "../../lib/siteEdits";
import { cloudUploadFile } from "../../lib/cloudProjects";

type Lang = "fr" | "en" | "pt" | "de" | "it";

const TXT: Record<string, Record<Lang, string>> = {
  chip: { fr: "Édition", en: "Edit", pt: "Edição", de: "Bearbeiten", it: "Modifica" },
  sair: { fr: "Quitter l'édition", en: "Exit editing", pt: "Sair da edição", de: "Bearbeitung beenden", it: "Esci dalla modifica" },
  guardar: { fr: "Sauver", en: "Save", pt: "Guardar", de: "Speichern", it: "Salva" },
  cancelar: { fr: "Annuler", en: "Cancel", pt: "Cancelar", de: "Abbrechen", it: "Annulla" },
  repor: { fr: "Original", en: "Original", pt: "Original", de: "Original", it: "Originale" },
  trocar: { fr: "Remplacer", en: "Replace", pt: "Trocar", de: "Ersetzen", it: "Sostituisci" },
  ia: { fr: "Générer par IA", en: "Generate with AI", pt: "Gerar por IA", de: "Mit KI erzeugen", it: "Genera con IA" },
  ampliar: { fr: "Agrandir l'image", en: "Enlarge image", pt: "Ampliar imagem", de: "Bild vergrössern", it: "Ingrandisci immagine" },
  reduzir: { fr: "Réduire l'image", en: "Shrink image", pt: "Reduzir imagem", de: "Bild verkleinern", it: "Riduci immagine" },
  modificado: { fr: "Modifié", en: "Modified", pt: "Modificado", de: "Geändert", it: "Modificato" },
  publicado: { fr: "Publié", en: "Published", pt: "Publicado", de: "Veröffentlicht", it: "Pubblicato" },
  soLocal: { fr: "Enregistré ici seulement: le cloud a refusé (coffre?)", en: "Saved here only: cloud refused (vault?)", pt: "Gravado só neste browser: a nuvem recusou (cofre?)", de: "Nur hier gespeichert: Cloud abgelehnt (Tresor?)", it: "Salvato solo qui: cloud ha rifiutato (cassaforte?)" },
  atual: { fr: "Actuel", en: "Current", pt: "Atual", de: "Aktuell", it: "Attuale" },
  carregar: { fr: "Charger de l'ordinateur", en: "Upload from computer", pt: "Carregar do computador", de: "Vom Computer laden", it: "Carica dal computer" },
  escolher: { fr: "Choisir un fichier", en: "Choose file", pt: "Escolher ficheiro", de: "Datei wählen", it: "Scegli file" },
  ouUrl: { fr: "Ou coller une URL", en: "Or paste a URL", pt: "Ou colar um URL", de: "Oder URL einfügen", it: "O incolla un URL" },
  aplicar: { fr: "Appliquer", en: "Apply", pt: "Aplicar", de: "Anwenden", it: "Applica" },
  sugestoes: { fr: "Images de la maison", en: "House images", pt: "Imagens da casa", de: "Bilder des Hauses", it: "Immagini della casa" },
  fechar: { fr: "Fermer", en: "Close", pt: "Fechar", de: "Schliessen", it: "Chiudi" },
  promptIa: { fr: "Décrivez l'image à générer...", en: "Describe the image to generate...", pt: "Descreve a imagem a gerar...", de: "Beschreibe das zu erzeugende Bild...", it: "Descrivi l'immagine da generare..." },
  gerar: { fr: "Générer", en: "Generate", pt: "Gerar", de: "Erzeugen", it: "Genera" },
  aGerar: { fr: "Génération en cours...", en: "Generating...", pt: "A gerar...", de: "Wird erzeugt...", it: "Generazione..." },
  aSubir: { fr: "Envoi au Blob...", en: "Uploading...", pt: "A subir...", de: "Wird hochgeladen...", it: "Caricamento..." },
  erroUpload: { fr: "L'envoi a échoué (coffre?). Rien n'a été enregistré.", en: "Upload failed (vault?). Nothing was saved.", pt: "O envio falhou (cofre?). Nada foi gravado.", de: "Upload fehlgeschlagen (Tresor?). Nichts gespeichert.", it: "Caricamento fallito (cassaforte?). Nulla salvato." },
  erroIa: { fr: "La génération a échoué.", en: "Generation failed.", pt: "A geração falhou.", de: "Erzeugung fehlgeschlagen.", it: "Generazione fallita." },
  urlErro: { fr: "URL invalide (/... ou https://...)", en: "Invalid URL (/... or https://...)", pt: "URL inválido (/... ou https://...)", de: "Ungültige URL (/... oder https://...)", it: "URL non valido (/... o https://...)" },
  play: { fr: "Bouton lecture", en: "Play button", pt: "Botão de play", de: "Play-Schaltfläche", it: "Pulsante play" },
  loop: { fr: "Boucle sans bouton", en: "Loop, no button", pt: "Loop sem botão", de: "Schleife ohne Taste", it: "Loop senza pulsante" },
  frame: { fr: "Choisir l'image fixe", en: "Choose the still", pt: "Escolher o frame", de: "Standbild wählen", it: "Scegli il fotogramma" },
  usarFrame: { fr: "Utiliser cette image", en: "Use this still", pt: "Usar este frame", de: "Dieses Bild nehmen", it: "Usa questo fotogramma" },
  notaLang: { fr: "Cette langue; les autres suivent le FR jusqu'à révision.", en: "This language; others follow FR until reviewed.", pt: "Esta língua; as outras seguem o FR até revisão.", de: "Diese Sprache; andere folgen FR bis zur Prüfung.", it: "Questa lingua; le altre seguono il FR fino a revisione." },
};

const CITRON = "#d2ff01";
const NOIR = "#0a0a0b";

function temCofre(): boolean {
  try { return Boolean(window.localStorage.getItem("abil_vault_token")); } catch { return false; }
}
function tokenCofre(): string | null {
  try { return window.localStorage.getItem("abil_vault_token"); } catch { return null; }
}

async function publicarNuvem(): Promise<boolean> {
  try {
    const tok = tokenCofre();
    if (!tok) return false;
    const r = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-abil-admin": tok },
                                                                              
      body: JSON.stringify({ updates: [{ key: "abil_site_edits_inline", value: edicoesBrutas() }] }),
    });
    return r.ok;
  } catch { return false; }
}

                                                                                   
async function comprimirImagem(file: File, maxDim = 1920, qualidade = 0.82): Promise<string> {
  if (!/^image\//.test(file.type) || file.type === "image/gif") {
    return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file); });
  }
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(bmp.width * escala); cv.height = Math.round(bmp.height * escala);
  cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
  return cv.toDataURL("image/jpeg", qualidade);
}
function dataUrlParaFile(dataUrl: string, nome: string): File | null {
  try {
    const [meta, b64] = dataUrl.split(",");
    const mime = /data:(.*?);/.exec(meta)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
    return new File([arr], nome, { type: mime });
  } catch { return null; }
}

type Alvo = { path: string; el: HTMLElement; rect: DOMRect; media: boolean };

const PROPS_TIPO = ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "textTransform", "textAlign", "color", "textDecorationLine"] as const;

                                                                                                                                        
                                                                         
                                                                              
                                                                           
                                                                                  
const LINGUAS_SITE = ["fr", "en", "pt", "de", "it"] as const;
async function traduzirParaAsOutras(path: string, texto: string, origem: string, tok: string | null): Promise<number> {
  if (!texto.trim() || !tok) return 0;
  const alvos = LINGUAS_SITE.filter((l) => l !== origem);
  const patch: Record<string, string> = {};
  await Promise.all(alvos.map(async (alvo) => {
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-abil-admin": tok },
        body: JSON.stringify({ text: texto, from: origem, to: alvo }),
      });
      if (!r.ok) return;
      const j = await r.json().catch(() => null);
                                                                                 
                                                                          
      const t = String(j?.translated || j?.text || j?.translation || "").trim();
      if (t) patch[`${path}__${alvo}`] = t;
    } catch {  }
  }));
  const n = Object.keys(patch).length;
  if (n) gravarEdicaoLocal(patch);
  return n;
}

                                                                              
                                                                                  
const CTA_EXTRA = new Set(["v3.ui.home.viewAll", "v3.ui.shell.contacter"]);
                                                                             
                                                                          
                                                    
function ehParteDeCta(path: string): boolean {
  return /Top$/.test(path) || /Reveal$/.test(path) || CTA_EXTRA.has(path) || path === "v3.ui.shell.escreva";
}
function baseDoCta(path: string): string {
  return path.replace(/(Top|Reveal)$/, "");
}
function ehCta(path: string): boolean {
  return /Top$/.test(path) || CTA_EXTRA.has(path);
}

export function EditLayerV3({ lang }: { lang: Lang }) {
  const t = (k: keyof typeof TXT) => TXT[k][lang] ?? TXT[k].fr;
  const [autenticado, setAutenticado] = useState<boolean>(() => temCofre());
  const [ativo, setAtivo] = useState<boolean>(() => {
    try { return new URLSearchParams(window.location.search).get("edit") === "1"; } catch { return false; }
  });
  const [alvos, setAlvos] = useState<Alvo[]>([]);
  const [hoverMedia, setHoverMedia] = useState<string | null>(null);
  const [aviso, setAviso] = useState<"" | "publicado" | "soLocal">("");
                                                                                 
                                                                               
  const [traducao, setTraducao] = useState<"" | "a-traduzir" | string>("");
                                                                                
                                                                              
                                                                           
  const [frameDe, setFrameDe] = useState<{ path: string; src: string } | null>(null);
  const [aCapturar, setACapturar] = useState(false);
  const videoFrameRef = useRef<HTMLVideoElement | null>(null);
                             
  const [emEdicao, setEmEdicao] = useState<{ path: string; el: HTMLElement; inicial: string | undefined; chave: string } | null>(null);
  const [rectEdicao, setRectEdicao] = useState<DOMRect | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef(0);
                    
  const [picker, setPicker] = useState<{ path: string; video: boolean } | null>(null);
                                                                      
  const [destinoCta, setDestinoCta] = useState<{ path: string } | null>(null);
  const [destinoUrl, setDestinoUrl] = useState("");
  const [destinoNova, setDestinoNova] = useState(false);
  const [ctaTopTxt, setCtaTopTxt] = useState("");
  const [ctaRevealTxt, setCtaRevealTxt] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [promptIa, setPromptIa] = useState("");
  const [ocupado, setOcupado] = useState<"" | "upload" | "ia">("");
  const [erroPicker, setErroPicker] = useState("");
  const rafRef = useRef(0);

  useEffect(() => {
    const f = () => setAutenticado(temCofre());
    window.addEventListener("abil:vault", f);
    window.addEventListener("storage", f);
    return () => { window.removeEventListener("abil:vault", f); window.removeEventListener("storage", f); };
  }, []);

  const varrer = useCallback(() => {
    const novos: Alvo[] = [];
    document.querySelectorAll<HTMLElement>("[data-ed]").forEach((el) => {
      const path = el.getAttribute("data-ed") || "";
      if (!path || !REGISTO_EDITAVEIS.has(path)) return;
      const rect = el.getBoundingClientRect();
                                                                              
                                                                              
                                                                              
                                                                              
      if (rect.width < 6 || rect.height < 6) return;
      if (rect.bottom < -60 || rect.top > window.innerHeight + 60) return;
      const media = el.tagName === "IMG" || el.tagName === "VIDEO";
      if (!media && !(el.innerText || "").trim()) return;
      type ComVisibilidade = HTMLElement & { checkVisibility?: (o?: Record<string, boolean>) => boolean };
      const cv = (el as ComVisibilidade).checkVisibility;
      if (typeof cv === "function" && !cv.call(el, { checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true })) return;
                                                                                
                                                                               
                                                                              
                                                                                 
                                                                              
      let recortado = false;
      for (let pai = el.parentElement; pai; pai = pai.parentElement) {
        const cs = getComputedStyle(pai);
        if (cs.overflow === "visible" && cs.overflowY === "visible" && cs.overflowX === "visible") continue;
        const rp = pai.getBoundingClientRect();
        if (rp.width < 1 || rp.height < 1) continue;
        const dentroY = Math.min(rect.bottom, rp.bottom) - Math.max(rect.top, rp.top);
        const dentroX = Math.min(rect.right, rp.right) - Math.max(rect.left, rp.left);
        if (dentroY / Math.max(rect.height, 1) < 0.5 || dentroX / Math.max(rect.width, 1) < 0.5) { recortado = true; break; }
      }
      if (recortado) return;
      novos.push({ path, el, rect, media });
    });
                                                                              
                                                                                
                                       
    setAlvos((antigos) => {
      if (antigos.length === novos.length) {
        let igual = true;
        for (let i = 0; i < novos.length; i++) {
          const a = antigos[i], n = novos[i];
          if (a.path !== n.path || Math.abs(a.rect.top - n.rect.top) > 0.5 ||
              Math.abs(a.rect.left - n.rect.left) > 0.5 ||
              Math.abs(a.rect.width - n.rect.width) > 0.5 ||
              Math.abs(a.rect.height - n.rect.height) > 0.5) { igual = false; break; }
        }
        if (igual) return antigos;
      }
      return novos;
    });
  }, []);
  useEffect(() => {
    if (!ativo || !autenticado) { setAlvos([]); return; }
    varrer();
    const aoMexer = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => { rafRef.current = 0; varrer(); });
    };
    window.addEventListener("scroll", aoMexer, { passive: true });
    window.addEventListener("resize", aoMexer, { passive: true });
                                                                         
                                                                             
                                                                               
                                                                               
                                                                       
                                                                                 
    let vivo = true;
    const porFrame = () => {
      if (!vivo) return;
      varrer();
      window.requestAnimationFrame(porFrame);
    };
    const idFrame = window.requestAnimationFrame(porFrame);
    return () => {
      vivo = false;
      window.cancelAnimationFrame(idFrame);
      window.removeEventListener("scroll", aoMexer);
      window.removeEventListener("resize", aoMexer);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      setAlvos([]);                                                              
    };
  }, [ativo, autenticado, varrer]);

                                                                                 
                                                                               
                                                 
  useEffect(() => {
    const aoPedir = (ev: Event) => {
      const d = (ev as CustomEvent).detail as { path?: string; ia?: boolean } | undefined;
      if (!d?.path) return;
      const alvo = document.querySelector<HTMLElement>(`[data-ed="${CSS.escape(d.path)}"]`);
      setPicker({ path: d.path, video: alvo?.tagName === "VIDEO" });
      setErroPicker("");
                                                                                
                                                                             
      if (d.ia) { setPromptIa(""); window.setTimeout(() => { try { document.getElementById("elv3-ia")?.focus(); } catch {  } }, 120); }
    };
    window.addEventListener("abil:trocar-media", aoPedir as EventListener);
    return () => window.removeEventListener("abil:trocar-media", aoPedir as EventListener);
  }, []);

                                                             
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent("abil:lenis", { detail: { pause: Boolean(emEdicao || picker) } })); } catch {  }
  }, [emEdicao, picker]);

                                                                             
                                                                            
                                                  
  useEffect(() => {
    const on = Boolean(ativo && autenticado);
    try {
      document.documentElement.dataset.abilEdicao = on ? "1" : "";
      window.dispatchEvent(new CustomEvent("abil:edicao"));
    } catch {  }
    return () => {
      try { document.documentElement.dataset.abilEdicao = ""; window.dispatchEvent(new CustomEvent("abil:edicao")); } catch {  }
    };
  }, [ativo, autenticado]);

                                                                                
                                                                                 
                                                             
  const editandoTexto = Boolean(emEdicao);
  useEffect(() => {
    if (!editandoTexto) return;
    const st = document.createElement("style");
    st.id = "elv3-faixa";
    st.textContent = `body{padding-top:56px !important}.v3-nav,.v3p-nav,.v3d-nav{margin-top:56px !important}`;
    document.head.appendChild(st);
    return () => { st.remove(); };
  }, [editandoTexto]);

                                                                       
  useEffect(() => {
    if (!emEdicao) { setRectEdicao(null); return; }
    let vivo = true;
    const seguir = () => {
      if (!vivo) return;
      setRectEdicao(emEdicao.el.getBoundingClientRect());
      window.requestAnimationFrame(seguir);
    };
    seguir();
    return () => { vivo = false; };
  }, [emEdicao]);

  const valorAtual = (path: string): string => {
    const reg = REGISTO_EDITAVEIS.get(path);
    if (!reg) return "";
    const m = edicoesBrutas();
    return reg.tipo === "txt"
      ? (m[`${path}__${lang}`] ?? m[`${path}__fr`] ?? m[path] ?? reg.def)
      : (m[path] ?? reg.def);
  };

                                                                               
                                                                               
  const textoAtual = (path: string): string => {
    const m = edicoesBrutas();
    const reg = REGISTO_EDITAVEIS.get(path);
    const v = m[`${path}__${lang}`] ?? m[`${path}__fr`] ?? m[path];
    if (typeof v === "string") return v;
    if (reg) return reg.def;
    const el = document.querySelector<HTMLElement>(`[data-ed="${CSS.escape(path)}"]`);
    return (el?.innerText || "").trim();
  };

                             
  const abrirTexto = (a: Alvo) => {
    if (a.media) return;
    const chave = `${a.path}__${lang}`;
    const m = edicoesBrutas();
    setEmEdicao({ path: a.path, el: a.el, inicial: m[chave], chave });
    setAviso("");
    a.el.style.visibility = "hidden";
    window.setTimeout(() => {
      const ed = editorRef.current;
      if (!ed) return;
      ed.textContent = valorAtual(a.path);
      ed.focus();
      const sel = window.getSelection();
      if (sel) { const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
    }, 30);
  };
  const aoTeclar = () => {
    if (!emEdicao) return;
    const reg = REGISTO_EDITAVEIS.get(emEdicao.path);
    const texto = (editorRef.current?.textContent ?? "");
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const v = reg && reg.max > 0 ? texto.slice(0, reg.max) : texto;
      gravarEdicaoLocal({ [emEdicao.chave]: v });
    }, 160);
  };
  const fecharTexto = (guardarNaNuvem: boolean) => {
    if (!emEdicao) return;
    window.clearTimeout(debounceRef.current);
    const reg = REGISTO_EDITAVEIS.get(emEdicao.path);
    if (guardarNaNuvem) {
      const texto = (editorRef.current?.textContent ?? "").trim();
      const v = reg && reg.max > 0 ? texto.slice(0, reg.max) : texto;
      gravarEdicaoLocal({ [emEdicao.chave]: v || null });
                                                                                 
      const lingua = emEdicao.chave.includes("__") ? emEdicao.chave.split("__").pop()! : "fr";
      void (async () => {
        if (v) {
          setTraducao("a-traduzir");
          try {
            const n = await traduzirParaAsOutras(emEdicao.path, v, lingua, tokenCofre());
            setTraducao(n > 0 ? String(n) : "");
          } catch { setTraducao(""); }
        }
        const ok = await publicarNuvem();
        setAviso(ok ? "publicado" : "soLocal");
        window.setTimeout(() => setTraducao(""), 3200);
      })();
    } else {
      gravarEdicaoLocal({ [emEdicao.chave]: emEdicao.inicial ?? null });
    }
    emEdicao.el.style.visibility = "";
    setEmEdicao(null);
  };
  const reporTexto = () => {
    if (!emEdicao) return;
    const chaves: Record<string, string | null> = { [emEdicao.path]: null };
    for (const l of ["fr", "en", "pt", "de", "it"]) chaves[`${emEdicao.path}__${l}`] = null;
    gravarEdicaoLocal(chaves);
    void publicarNuvem().then((ok) => setAviso(ok ? "publicado" : "soLocal"));
    emEdicao.el.style.visibility = "";
    setEmEdicao(null);
  };

                    
  const gravarMedia = async (path: string, url: string) => {
    gravarEdicaoLocal({ [path]: url });
    const ok = await publicarNuvem();
    setAviso(ok ? "publicado" : "soLocal");
    setPicker(null); setUrlInput(""); setPromptIa(""); setErroPicker("");
  };
  const reporMedia = async (path: string) => {
                                                                                
                                                              
    gravarEdicaoLocal({ [path]: null, [`${path}.escala`]: null });
    const ok = await publicarNuvem();
    setAviso(ok ? "publicado" : "soLocal");
  };
                                                                            
                                                                              
                                                                              
                                                                        
  const escalaDe = (path: string) => {
    const v = parseFloat(editados[`${path}.escala`] || "1");
    return Number.isFinite(v) && v > 0 ? v : 1;
  };
  const mudarEscala = (path: string, delta: number) => {
    const n = Math.round(Math.max(0.3, Math.min(3, escalaDe(path) + delta)) * 100) / 100;
    gravarEdicaoLocal({ [`${path}.escala`]: n === 1 ? null : String(n) });
    void publicarNuvem().then((ok) => setAviso(ok ? "publicado" : "soLocal"));
  };
  const aoFicheiro = async (f: File) => {
    setErroPicker(""); setOcupado("upload");
    try {
      let ficheiro = f;
      if (/^image\//.test(f.type)) {
        const dataUrl = await comprimirImagem(f);
        const comp = dataUrlParaFile(dataUrl, f.name || `edit-${Date.now()}.jpg`);
        if (comp) ficheiro = comp;
      } else if (f.size > 12_000_000) { setErroPicker(t("erroUpload")); setOcupado(""); return; }
      const up = await cloudUploadFile(ficheiro, { prefix: "assets" });
      if (up.ok && up.url) { await gravarMedia(picker!.path, up.url); }
      else setErroPicker(t("erroUpload"));
    } catch { setErroPicker(t("erroUpload")); }
    setOcupado("");
  };
  const gerarIa = async () => {
    if (!picker || !promptIa.trim()) return;
    setErroPicker(""); setOcupado("ia");
    try {
      const tok = tokenCofre();
      const r = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(tok ? { "x-abil-admin": tok } : {}) },
        body: JSON.stringify({ prompt: promptIa.trim(), size: "1536x1024" }),
      });
      const j = await r.json().catch(() => null);
      const dataUrl = j?.dataUrl || j?.image || "";
      if (!r.ok || !String(dataUrl).startsWith("data:")) { setErroPicker(t("erroIa")); setOcupado(""); return; }
      setOcupado("upload");
      const f = dataUrlParaFile(String(dataUrl), `ia-${Date.now()}.png`);
      if (!f) { setErroPicker(t("erroUpload")); setOcupado(""); return; }
      const up = await cloudUploadFile(f, { prefix: "assets" });
      if (up.ok && up.url) { await gravarMedia(picker.path, up.url); }
      else setErroPicker(t("erroUpload"));
    } catch { setErroPicker(t("erroIa")); }
    setOcupado("");
  };

  if (!autenticado) return null;

  const editados = edicoesBrutas();
  const sugestoes: string[] = Array.from(new Set(
    Array.from(REGISTO_EDITAVEIS.entries())
      .filter(([, r]) => r.tipo === "img" && /^\//.test(r.def))
      .map(([, r]) => r.def),
  )).slice(0, 12);

  const estiloTipo: React.CSSProperties = {};
  if (emEdicao) {
    const cs = window.getComputedStyle(emEdicao.el);
    for (const p of PROPS_TIPO) (estiloTipo as Record<string, string>)[p] = cs[p as keyof CSSStyleDeclaration] as string;
  }

  return (
    <div aria-live="polite">
      <button
        type="button"
        onClick={() => { fecharTexto(false); setPicker(null); setAtivo(!ativo); }}
        style={{
          position: "fixed", left: "50%", bottom: 18, transform: "translateX(-50%)", zIndex: 3000,
          background: ativo ? NOIR : CITRON, color: ativo ? CITRON : NOIR,
          border: `1px solid ${NOIR}`, borderRadius: 999, padding: "10px 22px",
          font: "600 12px/1 mundial, sans-serif", letterSpacing: ".02em", textTransform: "uppercase", cursor: "pointer",
        }}
      >
        {ativo ? t("sair") : t("chip")}
      </button>

      {                                                                           
                                                                                   }
      {traducao && (
        <div style={{
          position: "fixed", left: "50%", bottom: 100, transform: "translateX(-50%)", zIndex: 3000,
          background: NOIR, color: CITRON, padding: "6px 14px",
          font: "600 11px/1.3 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".06em",
        }}>
          {traducao === "a-traduzir" ? "A traduzir para as outras línguas…" : `${traducao} línguas traduzidas`}
        </div>
      )}
      {aviso && (
        <div style={{
          position: "fixed", left: "50%", bottom: 64, transform: "translateX(-50%)", zIndex: 3000,
          background: aviso === "publicado" ? CITRON : "#fff3f3", color: aviso === "publicado" ? NOIR : "#a00",
          border: `1px solid ${aviso === "publicado" ? NOIR : "#d33"}`, padding: "6px 14px",
          font: "600 11px/1.3 mundial, sans-serif",
        }}>
          {aviso === "publicado" ? t("publicado") : t("soLocal")}
        </div>
      )}

      {                                                                                       }
      {ativo && !emEdicao && alvos.map((a) => {
        const foiEditado = a.media ? a.path in editados : Boolean(editados[`${a.path}__${lang}`] ?? editados[a.path]);
        return (
          <div
            key={a.path}
            onMouseEnter={() => a.media && setHoverMedia(a.path)}
            onMouseLeave={() => a.media && setHoverMedia((h) => (h === a.path ? null : h))}
            style={{
              position: "fixed", zIndex: 2990,
              left: a.rect.left - 3, top: a.rect.top - 3, width: a.rect.width + 6, height: a.rect.height + 6,
              outline: `2px dashed ${foiEditado ? NOIR : "rgba(10,10,11,.38)"}`, outlineOffset: -2,
              boxShadow: `inset 0 0 0 1px ${CITRON}`,
              cursor: a.media ? "default" : "text",
              pointerEvents: "auto",
            }}
            onClick={() => {
              if (a.media) return;
                                                                              
              if (ehParteDeCta(a.path)) {
                const base = baseDoCta(a.path);
                setDestinoCta({ path: `${base}Top` });
                setDestinoUrl(editados[`${base}Top.href`] || "");
                setDestinoNova(editados[`${base}Top.hrefNova`] === "1");
                setCtaTopTxt(textoAtual(`${base}Top`));
                setCtaRevealTxt(textoAtual(`${base}Reveal`));
                return;
              }
              abrirTexto(a);
            }}
            title={a.path}
          >
            {foiEditado && (
              <span style={{ position: "absolute", top: 6, left: 6, background: NOIR, color: CITRON, font: "600 9px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".04em", padding: "3px 6px", pointerEvents: "none" }}>
                ● {t("modificado")}
              </span>
            )}
            {                                                                  
                                                                           
                                                                            
                                           }
            {!a.media && ehCta(a.path) && (
              <span style={{ position: "absolute", top: -11, right: -4, display: "flex", gap: 4, zIndex: 2 }}>
                <button type="button" title="Para onde este botão leva"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDestinoCta({ path: a.path });
                    setDestinoUrl(editados[`${a.path}.href`] || "");
                    setDestinoNova(editados[`${a.path}.hrefNova`] === "1");
                  }}
                  style={{ height: 20, padding: "0 9px", background: editados[`${a.path}.href`] ? CITRON : NOIR,
                    color: editados[`${a.path}.href`] ? NOIR : CITRON, border: 0, cursor: "pointer",
                    font: "600 9px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".08em",
                    borderRadius: 999, whiteSpace: "nowrap" }}>
                  ↗ {editados[`${a.path}.href`] ? String(editados[`${a.path}.href`]).slice(0, 18) : "destino"}
                </button>
              </span>
            )}
            {a.media && hoverMedia === a.path && (
                                                                                                 
              <span style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                <button type="button" title={t("trocar")} onClick={(e) => { e.stopPropagation(); setPicker({ path: a.path, video: a.el.tagName === "VIDEO" }); setErroPicker(""); }}
                  style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, background: NOIR, color: CITRON, border: 0, cursor: "pointer", fontFamily: "sans-serif", fontSize: 15, lineHeight: 1 }}>✎</button>
                {a.el.tagName === "VIDEO" && (
                  <>
                    <button type="button" title={editados[`${a.path}.play`] === "1" ? t("loop") : t("play")}
                      onClick={(e) => {
                        e.stopPropagation();
                        const ligado = editados[`${a.path}.play`] === "1";
                        gravarEdicaoLocal({ [`${a.path}.play`]: ligado ? null : "1" });
                        void publicarNuvem().then((ok) => setAviso(ok ? "publicado" : "soLocal"));
                      }}
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, background: editados[`${a.path}.play`] === "1" ? CITRON : NOIR, color: editados[`${a.path}.play`] === "1" ? NOIR : CITRON, border: 0, cursor: "pointer", fontFamily: "sans-serif", fontSize: 13, lineHeight: 1 }}>▶</button>
                    <button type="button" title={t("frame")}
                      onClick={(e) => { e.stopPropagation(); setFrameDe({ path: a.path, src: (a.el as HTMLVideoElement).currentSrc || (a.el as HTMLVideoElement).src }); }}
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, background: NOIR, color: CITRON, border: 0, cursor: "pointer", fontFamily: "sans-serif", fontSize: 13, lineHeight: 1 }}>◱</button>
                  </>
                )}
                {a.el.tagName === "IMG" && (
                  <>
                    <button type="button" title={t("reduzir")} disabled={escalaDe(a.path) <= 0.3}
                      onClick={(e) => { e.stopPropagation(); mudarEscala(a.path, -0.1); }}
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, background: escalaDe(a.path) !== 1 ? CITRON : NOIR, color: escalaDe(a.path) !== 1 ? NOIR : CITRON, border: 0, cursor: "pointer", fontFamily: "sans-serif", fontSize: 15, lineHeight: 1 }}>−</button>
                    {escalaDe(a.path) !== 1 && (
                      <span style={{ height: 34, display: "flex", alignItems: "center", padding: "0 6px", background: NOIR, color: CITRON, fontFamily: "sans-serif", fontSize: 11, lineHeight: 1 }}>{Math.round(escalaDe(a.path) * 100)}%</span>
                    )}
                    <button type="button" title={t("ampliar")} disabled={escalaDe(a.path) >= 3}
                      onClick={(e) => { e.stopPropagation(); mudarEscala(a.path, 0.1); }}
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, background: escalaDe(a.path) !== 1 ? CITRON : NOIR, color: escalaDe(a.path) !== 1 ? NOIR : CITRON, border: 0, cursor: "pointer", fontFamily: "sans-serif", fontSize: 15, lineHeight: 1 }}>＋</button>
                    <button type="button" title={t("ia")} onClick={(e) => { e.stopPropagation(); setPicker({ path: a.path, video: false }); setErroPicker(""); window.setTimeout(() => document.getElementById("elv3-ia")?.focus(), 60); }}
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, background: NOIR, color: CITRON, border: 0, cursor: "pointer", fontFamily: "sans-serif", fontSize: 14, lineHeight: 1 }}>✦</button>
                  </>
                )}
                <button type="button" title={t("repor")} onClick={(e) => { e.stopPropagation(); void reporMedia(a.path); }}
                  style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, background: NOIR, color: CITRON, border: 0, cursor: "pointer", fontFamily: "sans-serif", fontSize: 15, lineHeight: 1 }}>↺</button>
              </span>
            )}
          </div>
        );
      })}

      {                                                                           }
      {emEdicao && rectEdicao && (
        <>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={aoTeclar}
            onKeyDown={(e) => {
              if (e.key === "Escape") { e.preventDefault(); fecharTexto(false); }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); fecharTexto(true); }
            }}
            onPaste={(e) => {
              e.preventDefault();
              document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
            }}
            style={{
              position: "fixed", zIndex: 3005,
              left: rectEdicao.left, top: rectEdicao.top, width: rectEdicao.width, minHeight: rectEdicao.height,
              ...estiloTipo,
              background: "transparent", outline: `2px dashed ${NOIR}`, outlineOffset: 2,
              boxShadow: `0 0 0 4px rgba(210,255,1,.35)`,
              whiteSpace: "pre-wrap", overflowWrap: "break-word",
            }}
          />
          {                                                                      
                                                                            
                                                                            }
          <div style={{
            position: "fixed", zIndex: 3006, top: 0, left: 0, right: 0, height: 56,
            background: NOIR, display: "flex", gap: 8, alignItems: "center", padding: "0 20px",
          }}>
            <button type="button" onClick={() => fecharTexto(true)}
              style={{ background: CITRON, color: NOIR, border: 0, borderRadius: 999, padding: "9px 18px", font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", cursor: "pointer" }}>
              {t("guardar")}
            </button>
            <button type="button" onClick={reporTexto}
              style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.55)", borderRadius: 999, padding: "8px 14px", font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", cursor: "pointer" }}>
              ↺ {t("repor")}
            </button>
            <button type="button" onClick={() => fecharTexto(false)}
              style={{ background: "transparent", color: "rgba(255,255,255,.55)", border: "1px solid rgba(255,255,255,.28)", borderRadius: 999, padding: "8px 14px", font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", cursor: "pointer" }}>
              {t("cancelar")}
            </button>
            <span style={{ marginLeft: "auto", font: "10px/1.2 mundial, sans-serif", color: "rgba(255,255,255,.6)", textAlign: "right" }}>{t("notaLang")}</span>
          </div>
        </>
      )}

      {                                                                           
                                                                         }
      {frameDe && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3030, background: "rgba(10,10,11,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { if (!aCapturar) setFrameDe(null); }}>
          <div style={{ background: "#fff", border: `1px solid ${NOIR}`, width: 720, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", padding: 20 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <strong style={{ textTransform: "uppercase", letterSpacing: ".03em", fontSize: 12, color: NOIR }}>{t("frame")}</strong>
              <button type="button" onClick={() => { if (!aCapturar) setFrameDe(null); }} style={{ background: "none", border: 0, cursor: "pointer", color: "#777", font: "inherit" }}>{t("fechar")} ✕</button>
            </div>
            <video ref={videoFrameRef} src={frameDe.src} controls crossOrigin="anonymous" playsInline
              style={{ width: "100%", display: "block", background: "#000" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button type="button" disabled={aCapturar}
                onClick={async () => {
                  const v = videoFrameRef.current;
                  if (!v) return;
                  setACapturar(true);
                  try {
                    const cv = document.createElement("canvas");
                    cv.width = v.videoWidth || 1280; cv.height = v.videoHeight || 720;
                    const ctx = cv.getContext("2d");
                    if (!ctx) throw new Error("sem contexto");
                    ctx.drawImage(v, 0, 0, cv.width, cv.height);
                    const dataUrl = cv.toDataURL("image/jpeg", 0.86);
                    const f = dataUrlParaFile(dataUrl, `frame-${Date.now()}.jpg`);
                    if (!f) throw new Error("frame invalido");
                    const up = await cloudUploadFile(f, { prefix: "assets" });
                    if (!up.ok || !up.url) throw new Error("upload falhou");
                    const url = up.url;
                                                                                         
                    gravarEdicaoLocal({ [`${frameDe.path}.poster`]: url, [`${frameDe.path}.play`]: "1" });
                    const ok = await publicarNuvem();
                    setAviso(ok ? "publicado" : "soLocal");
                    setFrameDe(null);
                  } catch {
                    setAviso("soLocal");
                  } finally { setACapturar(false); }
                }}
                style={{ background: NOIR, color: CITRON, border: 0, borderRadius: 999, padding: "10px 20px", font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", cursor: "pointer", opacity: aCapturar ? 0.5 : 1 }}>
                {aCapturar ? t("aSubir") : t("usarFrame")}
              </button>
            </div>
          </div>
        </div>
      )}

      {                                   }
      {                                                                         
                                                                                 
                                                                                   }
      {destinoCta && (
        <div onClick={() => setDestinoCta(null)}
          style={{ position: "fixed", inset: 0, zIndex: 3100, background: "rgba(10,10,11,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", color: NOIR, width: "min(520px, 92vw)", padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <strong style={{ font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".1em" }}>Botão</strong>
            {                                                                    
                                                                                
                                              }
            <div style={{ display: "flex", gap: 10 }}>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ font: "600 9px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".1em", color: "#777" }}>Texto em repouso</span>
                <input value={ctaTopTxt} onChange={(e) => setCtaTopTxt(e.target.value)}
                  style={{ border: "1px solid #ddd", padding: "9px 11px", fontSize: 13, fontFamily: "mundial, sans-serif" }} />
              </label>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ font: "600 9px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".1em", color: "#777" }}>Texto ao passar o cursor</span>
                <input value={ctaRevealTxt} onChange={(e) => setCtaRevealTxt(e.target.value)}
                  style={{ border: "1px solid #ddd", padding: "9px 11px", fontSize: 13, fontFamily: "mundial, sans-serif" }} />
              </label>
            </div>
            <span style={{ font: "600 9px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".1em", color: "#777", marginTop: 4 }}>Destino do clique</span>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#555" }}>
              Deixa vazio para manter o destino original. Aceita uma página do site
              (ex.: <code>/contact</code>) ou um endereço completo (ex.: <code>https://…</code>).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ font: "600 9px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".1em", color: "#777" }}>Atalhos</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["/projets", "/services", "/agence", "/journal", "/contact"].map((r) => (
                  <button key={r} type="button" onClick={() => setDestinoUrl(r)}
                    style={{ padding: "6px 10px", border: `1px solid ${destinoUrl === r ? NOIR : "#ddd"}`, background: destinoUrl === r ? NOIR : "#fff",
                      color: destinoUrl === r ? CITRON : NOIR, cursor: "pointer", font: "500 11px/1 mundial, sans-serif" }}>{r}</button>
                ))}
              </div>
            </div>
            <input value={destinoUrl} onChange={(e) => setDestinoUrl(e.target.value)}
              placeholder="/contact  ou  https://exemplo.com"
              style={{ border: "1px solid #ddd", padding: "10px 12px", fontSize: 13, fontFamily: "mundial, sans-serif" }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={destinoNova} onChange={(e) => setDestinoNova(e.target.checked)} />
              Abrir noutro separador
            </label>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" onClick={() => {
                  gravarEdicaoLocal({ [`${destinoCta.path}.href`]: null, [`${destinoCta.path}.hrefNova`]: null });
                  setDestinoCta(null);
                  void publicarNuvem().then((ok) => setAviso(ok ? "publicado" : "soLocal"));
                }}
                style={{ padding: "10px 16px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: 12 }}>Repor original</button>
              <button type="button" onClick={() => {
                  const v = destinoUrl.trim();
                  const base = baseDoCta(destinoCta.path);
                  const pTop = `${base}Top`, pRev = `${base}Reveal`;
                  gravarEdicaoLocal({
                    [`${destinoCta.path}.href`]: v || null,
                    [`${destinoCta.path}.hrefNova`]: v && destinoNova ? "1" : null,
                    [`${pTop}__${lang}`]: ctaTopTxt.trim() || null,
                    [`${pRev}__${lang}`]: ctaRevealTxt.trim() || null,
                  });
                  setDestinoCta(null);
                                                                                       
                  void (async () => {
                    const tok = tokenCofre();
                    setTraducao("a-traduzir");
                    let n = 0;
                    try {
                      if (ctaTopTxt.trim()) n += await traduzirParaAsOutras(pTop, ctaTopTxt.trim(), lang, tok);
                      if (ctaRevealTxt.trim()) n += await traduzirParaAsOutras(pRev, ctaRevealTxt.trim(), lang, tok);
                    } catch {  }
                    setTraducao(n > 0 ? String(n) : "");
                    const ok = await publicarNuvem();
                    setAviso(ok ? "publicado" : "soLocal");
                    window.setTimeout(() => setTraducao(""), 3200);
                  })();
                }}
                style={{ padding: "10px 18px", border: 0, background: NOIR, color: CITRON, cursor: "pointer", font: "600 12px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".08em" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
      {picker && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3020, background: "rgba(10,10,11,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => { if (!ocupado) { setPicker(null); setErroPicker(""); } }}>
          <div style={{ width: 520, maxWidth: "92vw", maxHeight: "86vh", overflowY: "auto", background: "#fff", border: `1px solid ${NOIR}`, padding: 20, font: "400 13px/1.45 mundial, sans-serif", color: NOIR }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <strong style={{ textTransform: "uppercase", letterSpacing: ".03em", fontSize: 12 }}>{t("trocar")}</strong>
              <button type="button" onClick={() => { if (!ocupado) { setPicker(null); setErroPicker(""); } }} style={{ background: "none", border: 0, cursor: "pointer", color: "#777", font: "inherit" }}>{t("fechar")} ✕</button>
            </div>
            <div style={{ fontSize: 10, color: "#888", marginBottom: 10, wordBreak: "break-all" }}>{picker.path}</div>

            <div style={{ border: "1px solid #e2e2e2", padding: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 6 }}>{t("atual")}</div>
              {picker.video
                ? <video src={valorAtual(picker.path)} style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} muted loop autoPlay playsInline />
                : <img src={valorAtual(picker.path)} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />}
            </div>

            <div style={{ border: "1px solid #e2e2e2", padding: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 8 }}>{t("carregar")}</div>
              <label style={{ display: "inline-block", background: NOIR, color: CITRON, borderRadius: 999, padding: "8px 18px", font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", cursor: ocupado ? "wait" : "pointer" }}>
                {ocupado === "upload" ? t("aSubir") : t("escolher")}
                <input type="file" accept={picker.video ? "video/*" : "image/*"} disabled={Boolean(ocupado)} style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void aoFicheiro(f); }} />
              </label>
            </div>

            <div style={{ border: "1px solid #e2e2e2", padding: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 8 }}>{t("ouUrl")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="/brand/... | https://..."
                  onKeyDown={(e) => { if (e.key === "Enter" && /^(\/|https:\/\/)/.test(urlInput.trim())) void gravarMedia(picker.path, urlInput.trim()); }}
                  style={{ flex: 1, border: "1px solid #d9d9d9", padding: 8, font: "inherit" }} />
                <button type="button" disabled={!/^(\/|https:\/\/)/.test(urlInput.trim()) || Boolean(ocupado)}
                  onClick={() => void gravarMedia(picker.path, urlInput.trim())}
                  style={{ background: NOIR, color: CITRON, border: 0, borderRadius: 999, padding: "8px 16px", font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", cursor: "pointer", opacity: /^(\/|https:\/\/)/.test(urlInput.trim()) ? 1 : .4 }}>
                  {t("aplicar")}
                </button>
              </div>
            </div>

            {!picker.video && (
              <div style={{ border: "1px solid #e2e2e2", padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 8 }}>✦ {t("ia")}</div>
                <textarea id="elv3-ia" value={promptIa} onChange={(e) => setPromptIa(e.target.value)} placeholder={t("promptIa")} rows={2}
                  style={{ width: "100%", border: "1px solid #d9d9d9", padding: 8, font: "inherit", resize: "vertical" }} />
                <button type="button" disabled={!promptIa.trim() || Boolean(ocupado)} onClick={() => void gerarIa()}
                  style={{ marginTop: 8, background: NOIR, color: CITRON, border: 0, borderRadius: 999, padding: "8px 18px", font: "600 11px/1 mundial, sans-serif", textTransform: "uppercase", cursor: "pointer", opacity: promptIa.trim() ? 1 : .4 }}>
                  {ocupado === "ia" ? t("aGerar") : ocupado === "upload" ? t("aSubir") : t("gerar")}
                </button>
              </div>
            )}

            {!picker.video && sugestoes.length > 0 && (
              <div style={{ border: "1px solid #e2e2e2", padding: 10 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", color: "#888", marginBottom: 8 }}>{t("sugestoes")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {sugestoes.map((s) => (
                    <button key={s} type="button" onClick={() => void gravarMedia(picker.path, s)}
                      style={{ border: 0, padding: 0, cursor: "pointer", aspectRatio: "3/2", overflow: "hidden", background: "#f2f2f2" }}>
                      <img src={s} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {erroPicker && (
              <div style={{ marginTop: 10, padding: "6px 8px", fontSize: 11, background: "#fff3f3", border: "1px solid #d33", color: "#a00" }}>{erroPicker}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
