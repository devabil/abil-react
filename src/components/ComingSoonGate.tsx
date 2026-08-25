                                                                               
                                                                                   
                                                                              
                                                                                  
                                                                                                       
                                                                                
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchSiteLangs, DEFAULT_SITE_LANGS } from "../lib/siteConfig";

                                                                                     
const NOIR = "#0a0a0b";
const ROUGE = "#d2ff01";                                        
const FONT_DISPLAY =
  "'mundial', 'Figtree', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

                                                                                       
const EXIT_LABEL: Record<"fr" | "de" | "en" | "pt" | "it", string> = {
  fr: "Quitter l'aperçu",
  de: "Vorschau verlassen",
  en: "Exit preview",
  pt: "Sair da pré-visualização",
  it: "Esci dall'anteprima",
};

                                                                                  
function GateAsterisque({ size = 96, color = ROUGE }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="1311.18 714.84 103.87 83.30"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        fill={color}
        d="M1353.24,776.65 L1332.26,776.65 L1332.26,735.74 L1393.98,735.74 L1353.24,776.65 M1311.68,735.74 L1311.68,777.51 C1311.68,788.62 1320.69,797.63 1331.80,797.63 L1363.12,797.63 L1393.64,766.60 L1393.64,797.63 L1414.55,797.63 L1414.55,735.46 C1414.55,724.35 1405.54,715.34 1394.43,715.34 L1332.26,715.34 L1311.68,735.74 Z"
      />
    </svg>
  );
}

type GateLang = "fr" | "de" | "en" | "pt" | "it";

const COPY: Record<
  GateLang,
  {
    eyebrow: string;
    soon: string;
    build: string;
    admin: string;
    placeholder: string;
    cta: string;
    wrong: string;
    title: string;
  }
> = {
  fr: {
    eyebrow: "* EN CONSTRUCTION",
    soon: "Le nouveau site se construit.",
    build:
      "Nos idées prennent forme, pixel par pixel. Encore quelques finitions avant de tout vous montrer.",
    admin: "ADMIN",
    placeholder: "Mot de passe",
    cta: "Entrer",
    wrong: "Mot de passe incorrect.",
    title: "Accès administration",
  },
  de: {
    eyebrow: "* IM AUFBAU",
    soon: "Die neue Website entsteht.",
    build:
      "Unsere Ideen nehmen Form an, Pixel für Pixel. Noch ein paar letzte Schliffe, dann zeigen wir alles.",
    admin: "ADMIN",
    placeholder: "Passwort",
    cta: "Eintreten",
    wrong: "Falsches Passwort.",
    title: "Administrationszugang",
  },
  en: {
    eyebrow: "* UNDER CONSTRUCTION",
    soon: "Our new site is being built.",
    build:
      "Our ideas are taking shape, pixel by pixel. A few finishing touches before we reveal everything.",
    admin: "ADMIN",
    placeholder: "Password",
    cta: "Enter",
    wrong: "Wrong password.",
    title: "Admin access",
  },
  pt: {
    eyebrow: "* EM CONSTRUÇÃO",
    soon: "O novo site está a nascer.",
    build:
      "As nossas ideias ganham forma, pixel a pixel. Faltam os últimos retoques antes de revelar tudo.",
    admin: "ADMIN",
    placeholder: "Palavra-passe",
    cta: "Entrar",
    wrong: "Palavra-passe incorrecta.",
    title: "Acesso de administração",
  },
  it: {
    eyebrow: "* IN COSTRUZIONE",
    soon: "Il nuovo sito sta nascendo.",
    build:
      "Le nostre idee prendono forma, pixel dopo pixel. Ancora qualche ritocco prima di svelare tutto.",
    admin: "ADMIN",
    placeholder: "Password",
    cta: "Entra",
    wrong: "Password errata.",
    title: "Accesso amministratore",
  },
  es: {
    eyebrow: "* EN CONSTRUCCIÓN",
    soon: "El nuevo sitio se está construyendo.",
    build:
      "Nuestras ideas van tomando forma, píxel a píxel. Unos últimos retoques antes de mostrarlo todo.",
    admin: "ADMIN",
    placeholder: "Contraseña",
    cta: "Entrar",
    wrong: "Contraseña incorrecta.",
    title: "Acceso de administración",
  },
};

const STORAGE_KEY = "abil_coming_soon_bypass_v1";

export function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const env = (import.meta as ImportMeta).env as Record<string, string | undefined>;
  const rawMode = env.VITE_COMING_SOON_MODE === "1";
                                                                                               
                                                                                           
                                                                                                  
  const gatePath = typeof window !== "undefined" ? window.location.pathname : "";
  const mode = rawMode && !/^\/(proposta|apresentacao|login|dashboard)(\/|$)/i.test(gatePath);
  const expected = env.VITE_COMING_SOON_PASSWORD || "";

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!mode) return true;
    try {
      return (
        typeof window !== "undefined" && window.sessionStorage.getItem(STORAGE_KEY) === "ok"
      );
    } catch {
      return false;
    }
  });
  const [showLogin, setShowLogin] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
                                                                                  
                                                                       
  const [lang, setLang] = useState<GateLang>("fr");
  const c = COPY[lang];

                                                                              
                                                                          
                                                                              
  const [gateLangs, setGateLangs] = useState<GateLang[]>(() => DEFAULT_SITE_LANGS as GateLang[]);
  useEffect(() => {
    if (!mode) return;
    let alive = true;
    fetchSiteLangs()
      .then((langs) => {
        if (alive && langs && langs.length) setGateLangs(langs as GateLang[]);
      })
      .catch(() => {
                                                    
      });
    return () => {
      alive = false;
    };
  }, [mode]);
                                                                                    
  useEffect(() => {
    if (gateLangs.includes(lang)) return;
    const id = window.setTimeout(() => setLang(gateLangs[0] ?? "fr"), 0);
    return () => window.clearTimeout(id);
  }, [gateLangs, lang]);

  useEffect(() => {
    if (!mode || unlocked) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [mode, unlocked]);

  if (!mode) return <>{children}</>;
  if (unlocked) {
    const onDash = typeof window !== "undefined" && /^\/dashboard/i.test(window.location.pathname);
    const exitPreview = () => {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem("abil_admin_session");
      } catch {              }
      window.location.href = "/";
    };
    return (
      <>
        {children}
        {!onDash && (
          <button
            type="button"
            onClick={exitPreview}
            title={EXIT_LABEL[lang]}
            style={{
              position: "fixed", left: 16, bottom: 16, zIndex: 2147483646,
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
              color: "#fff", background: "rgba(16,16,16,0.82)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "8px 14px",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ color: ROUGE }}>&#8617;</span> {EXIT_LABEL[lang]}
          </button>
        )}
      </>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw && pw.trim() === expected.trim()) {
      try {
                                                                                     
                                                                                 
        window.sessionStorage.setItem(STORAGE_KEY, "ok");
                                                                                   
                                                                                     
                                                                                       
                                                                                 
        window.sessionStorage.setItem("abil_admin_session", "1");
      } catch {
                    
      }
      setUnlocked(true);
    } else {
      setErr(true);
    }
  };

  const closeLogin = () => {
    setShowLogin(false);
    setPw("");
    setErr(false);
  };

  return (
    <>
      <style>{`
        @keyframes abilGateSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes abilGateLoading { 0% { left: -33%; } 50% { left: 50%; } 100% { left: 110%; } }
        @keyframes abilGateFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes abilGatePulse { 0%,100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        .abil-gate-spin { animation: abilGateSpin 7s linear infinite; transform-origin: 50% 50%; will-change: transform; }
        .abil-gate-fade { animation: abilGateFade 220ms ease-out both; }
      `}</style>

      {                                                     }
      <div
        role="presentation"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483646,
          background: NOIR,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          fontFamily: FONT_DISPLAY,
        }}
      >
        {                                                                                     }
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "44%",
            left: "50%",
            width: 520,
            height: 520,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${ROUGE}22 0%, ${ROUGE}0D 28%, transparent 62%)`,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div className="abil-gate-spin" style={{ display: "inline-flex" }}>
            <GateAsterisque size={104} color={ROUGE} />
          </div>

          <div style={{ textAlign: "center", maxWidth: 480, padding: "0 24px" }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: ROUGE,
                marginBottom: 14,
              }}
            >
              {c.eyebrow}
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(24px, 4vw, 34px)",
                fontWeight: 600,
                lineHeight: 1.12,
                letterSpacing: "-0.01em",
                color: "#fff",
              }}
            >
              {c.soon}
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 14.5,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.52)",
                marginTop: 16,
              }}
            >
              {c.build}
            </div>
          </div>

          {                                                                                     }
          <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
            {gateLangs.map((L, i) => (
              <React.Fragment key={L}>
                {i > 0 && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.18)",
                      fontFamily: FONT_MONO,
                      fontSize: 11,
                      margin: "0 9px",
                    }}
                  >
                    /
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setLang(L)}
                  aria-label={`Langue : ${L.toUpperCase()}`}
                  aria-pressed={L === lang}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 2px",
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    color: L === lang ? "#fff" : "rgba(255,255,255,0.34)",
                    fontWeight: L === lang ? 600 : 400,
                    transition: "color 180ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (L !== lang) e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }}
                  onMouseLeave={(e) => {
                    if (L !== lang) e.currentTarget.style.color = "rgba(255,255,255,0.34)";
                  }}
                >
                  {L}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {                                }
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          aria-label={c.title}
          style={{
            position: "absolute",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.22)",
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.32em",
            padding: "8px 14px",
            cursor: "pointer",
            transition: "color 200ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
        >
          {c.admin}
        </button>
      </div>

      {                                         }
      {showLogin && (
        <div
          role="dialog"
          aria-label={c.title}
          aria-modal="true"
          onClick={closeLogin}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            background: "rgba(0,0,0,0.74)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            fontFamily: FONT_DISPLAY,
          }}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="abil-gate-fade"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 360,
              background: "#0c0c0c",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "34px 28px 26px 28px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              color: "#fff",
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={closeLogin}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                padding: 6,
                lineHeight: 0,
              }}
            >
              <X size={16} />
            </button>

            {                                                             }
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <GateAsterisque size={30} color={ROUGE} />
            </div>

            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: "0.32em",
                color: "rgba(255,255,255,0.42)",
                marginBottom: 18,
                textAlign: "center",
              }}
            >
              {c.admin}
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <input
                type="password"
                value={pw}
                autoFocus
                name="abil-gate-key"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                onChange={(e) => {
                  setPw(e.target.value);
                  setErr(false);
                }}
                placeholder={c.placeholder}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: 14,
                  borderRadius: 3,
                  border: err
                    ? `1px solid ${ROUGE}99`
                    : "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)",
                  outline: "none",
                  fontFamily: FONT_DISPLAY,
                  color: "#fff",
                  letterSpacing: "0.04em",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 12,
                borderRadius: 3,
                border: "none",
                background: ROUGE,
                color: "#fff",
                cursor: "pointer",
                fontFamily: FONT_MONO,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {c.cta}
            </button>

            <div
              style={{
                minHeight: 18,
                marginTop: 12,
                fontSize: 11,
                textAlign: "center",
                color: err ? `${ROUGE}` : "transparent",
                letterSpacing: "0.04em",
              }}
            >
              {err ? c.wrong : "·"}
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default ComingSoonGate;
