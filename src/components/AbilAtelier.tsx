                                                                           
  
                                                                           
                                                                            
                                                                                
                                                                               
                                                                             
                                                                    
  
                                                                           
                                                                           
                                                                              
                                                                               
                                                                                
  
                                                                        
                                                                               
                                                                      
  
                                                                     
                                                                        
                                                                                
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ABIL_LANGS, type AbilLang } from "./AbilSite";
import "../styles/abil-dash.css";
                                                                                
                                                                                
                                                                 
import { EstilosBase } from "./abil/dash/base";
import { EstilosCampos } from "./abil/dash/campos";
import { EstiloDados } from "./abil/dash/dados";
import { EstilosFeedback } from "./abil/dash/feedback";

                                                                               
                                                                                   
                                               

const CHAVE_TOKEN = "abil_vault_token";

type L5 = Record<AbilLang, string>;
const t5 = (o: L5, l: AbilLang) => o[l] || o.fr;

                                                                                
                                                                             
const UI = {
  atelier: { fr: "L'Atelier", en: "The Studio", pt: "O Ateliê", de: "Das Atelier", it: "L'Atelier" } as L5,
  porta: { fr: "Espace réservé à l'équipe. Le mot de passe est celui du coffre.", en: "Team only. The password is the vault one.", pt: "Espaço reservado à equipa. A palavra-passe é a do cofre.", de: "Nur für das Team. Das Passwort ist das des Tresors.", it: "Spazio riservato al team. La password è quella della cassaforte." } as L5,
  senha: { fr: "Mot de passe", en: "Password", pt: "Palavra-passe", de: "Passwort", it: "Password" } as L5,
  abrir: { fr: "Ouvrir", en: "Open", pt: "Abrir", de: "Öffnen", it: "Apri" } as L5,
  abrindo: { fr: "Ouverture...", en: "Opening...", pt: "A abrir...", de: "Wird geöffnet...", it: "Apertura..." } as L5,
  recusada: { fr: "Mot de passe refusé. Réessayez.", en: "Password refused. Try again.", pt: "Palavra-passe recusada. Tente de novo.", de: "Passwort abgelehnt. Bitte erneut versuchen.", it: "Password rifiutata. Riprova." } as L5,
  modulos: { fr: "Modules", en: "Modules", pt: "Módulos", de: "Module", it: "Moduli" } as L5,
  fecharMenu: { fr: "Fermer les modules", en: "Close modules", pt: "Fechar os módulos", de: "Module schließen", it: "Chiudi i moduli" } as L5,
  voltar: { fr: "Retour au site", en: "Back to site", pt: "Voltar ao site", de: "Zurück zur Website", it: "Torna al sito" } as L5,
  trancar: { fr: "Verrouiller", en: "Lock", pt: "Trancar", de: "Sperren", it: "Blocca" } as L5,
  fechar: { fr: "Fermer", en: "Close", pt: "Fechar", de: "Schließen", it: "Chiudi" } as L5,
};

export type AtelierModule = { id: string; label: string; group: string };
export type AtelierGroup = { id: string; label: string };

const lerToken = () => { try { return localStorage.getItem(CHAVE_TOKEN) || ""; } catch { return ""; } };

const CSS = `
.at-root{position:fixed;inset:0;z-index:60;background:var(--ad-superficie);color:var(--ad-tinta);overflow:hidden;
  font-family:var(--ad-fonte);font-weight:var(--ad-peso-normal);line-height:var(--ad-lh-corpo);
  -webkit-font-smoothing:antialiased;display:grid;grid-template-columns:248px 1fr}
.at-root *{box-sizing:border-box}
.at-root ::selection{background:var(--ad-sinal);color:var(--ad-tinta)}
.at-up{text-transform:uppercase;letter-spacing:var(--ad-track-titulo)}
.at-xs{font-size:var(--ad-t-micro);line-height:var(--ad-lh-corpo)}
.at-s{font-size:var(--ad-t-apoio);line-height:var(--ad-lh-corpo)}

/* Left column.
   The background is Noir, so the focus token inverts automatically and --ad-foco becomes Alpin
   inside [data-ad-fundo="noir"]. This is why the bar carries that attribute. */
.at-side{background:var(--ad-noir);color:var(--ad-alpin);display:flex;flex-direction:column;min-height:0}
.at-side-topo{flex:0 0 auto;padding:var(--ad-e4) var(--ad-e4) var(--ad-e3);
  border-bottom:var(--ad-linha-px) solid var(--ad-linha-noir)}
.at-side-topo img{height:15px;width:auto;display:block;margin-bottom:10px}
.at-side-nome{color:var(--ad-acao);margin:0}
.at-side-nav{flex:1 1 auto;overflow-y:auto;padding:var(--ad-e2) 0 var(--ad-e4);overscroll-behavior:contain}
.at-side-nav::-webkit-scrollbar{width:6px}
.at-side-nav::-webkit-scrollbar-thumb{background:var(--ad-linha-noir)}
/* Rhone over Noir reaches 4.87:1 and passes. This is the only place in the panel where the
   supporting grey has sufficient contrast because the background is dark. */
.at-gr{padding:var(--ad-e3) var(--ad-e4) 6px;color:var(--ad-rhone)}
.at-mod{display:block;width:100%;text-align:left;padding:7px var(--ad-e4);color:var(--ad-tinta-noir);
  background:none;border:0;font:inherit;font-size:var(--ad-t-apoio);line-height:1.3;cursor:pointer;
  position:relative;transition:color var(--ad-d-normal) var(--ad-curva),background var(--ad-d-normal) var(--ad-curva)}

.at-mod{text-transform:uppercase;letter-spacing:.06em}
.at-mod:hover{color:var(--ad-alpin);background:var(--ad-realce-noir)}
.at-mod:focus-visible{outline:var(--ad-foco);outline-offset:-2px}
.at-mod.on{color:var(--ad-tinta);background:var(--ad-acao)}
.at-side-pe{flex:0 0 auto;padding:var(--ad-e3) var(--ad-e4) var(--ad-e3);
  border-top:var(--ad-linha-px) solid var(--ad-linha-noir);display:flex;flex-direction:column;gap:var(--ad-e2)}
.at-side-pe button{background:none;border:0;color:var(--ad-tinta-noir);font:inherit;font-size:var(--ad-t-micro);
  text-align:left;cursor:pointer;padding:0;transition:color var(--ad-d-normal) var(--ad-curva)}
.at-side-pe button:hover{color:var(--ad-acao)}
.at-side-pe button:focus-visible{outline:var(--ad-foco);outline-offset:3px}

/* Right column. */
.at-main{min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--ad-superficie)}
.at-bar{flex:0 0 auto;display:flex;align-items:center;gap:var(--ad-e3);padding:0 var(--ad-e4);height:56px;
  border-bottom:var(--ad-linha-px) solid var(--ad-linha);background:var(--ad-superficie-alta)}
.at-bar-tit{display:flex;flex-direction:column;gap:2px;min-width:0}
/* The group name used Gris Rhone over white at 4.06:1, below the minimum, and at only 12px.
   It now uses full-strength ink, while size and tracking establish the hierarchy, matching how
   the public V3 separates an eyebrow from a title. */
.at-bar-grupo{color:var(--ad-tinta)}
.at-bar-push{margin-left:auto;display:flex;align-items:center;gap:var(--ad-e3)}
/* The module button exists only below 1024px, where the sidebar collapses.
   Above that width the sidebar is always visible, so a duplicate button would add noise. */
.at-bar-menu{display:none;background:none;border:var(--ad-linha-px) solid var(--ad-tinta);
  border-radius:var(--ad-raio-pill);color:var(--ad-tinta);font:inherit;font-size:var(--ad-t-micro);
  padding:6px 14px;cursor:pointer;flex:0 0 auto;
  transition:background var(--ad-d-normal) var(--ad-curva),color var(--ad-d-normal) var(--ad-curva)}
.at-bar-menu:hover{background:var(--ad-tinta);color:var(--ad-superficie-alta)}
.at-bar-menu:focus-visible{outline:var(--ad-foco);outline-offset:3px}
.at-langs{display:flex;gap:var(--ad-e2)}
/* Language options are controls, not decoration, so they use full-strength ink. The active option
   is identified by its underline rather than by fading the others. The resting opacity is a measured
   62 percent, not an arbitrary value. At 55 percent it measured 4.41 over Alpin and failed the minimum
   for small text. At 62 percent it reaches 5.65 over Alpin in the top bar and 7.75 over Noir at the gate.
   Any lower value would fail again. */
.at-lang{background:none;border:0;font:inherit;font-size:var(--ad-t-micro);text-transform:uppercase;letter-spacing:.06em;padding:0 1px;cursor:pointer;
  color:var(--ad-tinta);position:relative;opacity:.62;transition:opacity var(--ad-d-normal) var(--ad-curva)}
.at-lang:hover{opacity:1}
.at-lang:focus-visible{outline:var(--ad-foco);outline-offset:3px;opacity:1}
.at-lang.on{opacity:1}
.at-lang.on:after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:var(--ad-linha-px);
  background:var(--ad-tinta)}
.at-lnk{background:none;border:0;font:inherit;padding:0 0 2px;cursor:pointer;position:relative;color:inherit}
.at-lnk:after{content:"";position:absolute;left:0;right:0;bottom:0;height:var(--ad-linha-px);
  background:currentColor;transform:scaleX(0);transform-origin:right center;
  transition:transform var(--ad-d-lento) var(--ad-curva)}
.at-lnk:hover:after,.at-lnk:focus-visible:after{transform:scaleX(1);transform-origin:left center}
.at-scroll{flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain}
/* The veil starts hidden so widening the window while the drawer is open cannot leave
   a dark rectangle over the 1200px panel. */
.at-veu{display:none;position:fixed;inset:0;z-index:2;background:var(--ad-veu);
  border:0;padding:0;cursor:pointer}

/* ABiL theme applied to the dashboard module body.
   The V3 design system uses one type family, Gris Leman hairlines, no shadows, rectilinear corners,
   pills at 999px, and citron reserved for actions. The rules below map those principles to the
   module components without modifying their code. */
.at-modulo{padding:28px 24px 64px;font-size:14px}
.at-modulo *{box-shadow:none !important;font-family:inherit !important}
.at-modulo [class*="rounded"]{border-radius:0 !important}




.at-modulo [class*="rounded-full"]{border-radius:999px !important}






.at-modulo [class~="bg-rouge"],
.at-modulo [class~="bg-rouge"] *{color:var(--ad-noir) !important}




.at-modulo [class*="text-rouge"]{color:var(--ad-tinta) !important}
.at-modulo [class*="bg-noir"] [class*="text-rouge"],
.at-modulo [class*="bg-black"] [class*="text-rouge"],
.at-modulo [class*="bg-noir"][class*="text-rouge"]{color:var(--ad-citron) !important}
/* Emerald status text is outside the seven-colour palette and measures about 2.5:1
   over white. Status is communicated in words, while the ink follows the house palette. */
.at-modulo [class*="text-emerald"],.at-modulo [class*="text-green"]{color:var(--ad-tinta) !important}
.at-modulo [class*="border-neutral-"],.at-modulo [class*="border-gray-"],
.at-modulo [class*="divide-neutral-"]{border-color:var(--ad-linha) !important}
.at-modulo h1,.at-modulo h2,.at-modulo h3{letter-spacing:-.03em;font-weight:300}
.at-modulo h1{font-size:30px;line-height:1.05}
.at-modulo h2{font-size:22px;line-height:1.1}
.at-modulo h3{font-size:17px;line-height:1.15}
.at-modulo .eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:var(--ad-t-micro);color:var(--ad-tinta-fraca)}
/* The default --violet value is grey at 0 0% 78%, making AI labels and phases washed out and illegible.
   This restores the house Violette used for signalling. */
.at-root{--violet:270 95% 78%}
/* Colour consistency, 19 August, after the audit of 758 failures.
   One criterion applies: the surface determines the ink. Dark surfaces require light ink and light
   surfaces require dark ink. Components do not receive arbitrary colours, and no global rule extends
   beyond the module body because the sidebar and modals have their own rules. */
/* Important: use [class~="x"] for an exact class rather than [class*="x"]. The latter also matches
   hover variants such as "hover:bg-noir" and colours the resting element. That mistake caused
   white buttons to appear over a white background. */
.at-modulo [class~="bg-noir"],.at-modulo [class~="bg-black"],.at-modulo [class~="bg-ink"]{color:var(--ad-alpin)}
.at-modulo [class~="bg-white"],.at-modulo [class~="bg-neutral-50"],.at-modulo [class~="bg-neutral-100"]{color:var(--ad-tinta)}
/* Secondary text from neutral levels 300, 400 and 500 ranges from 1.5:1 to 2.5:1
   on this canvas. Light surfaces use the house muted ink, while dark surfaces use the light grey,
   which reaches 11.9:1 there. */
/* Include opacity variants such as text-neutral-500/70, which exact class matching misses.
   These are text colours rather than surfaces, so matching this class fragment is safe. */
.at-modulo [class*="text-neutral-"]:not([class*="hover:"]),
.at-modulo [class*="text-white/"]:not([class*="hover:"]){color:var(--ad-tinta-fraca) !important}
.at-modulo [class~="bg-noir"] [class*="text-neutral-"],.at-modulo [class~="bg-black"] [class*="text-neutral-"],
.at-modulo [class~="bg-ink"] [class*="text-neutral-"],.at-modulo [class~="bg-noir"] [class*="text-white/"],
.at-modulo [class~="bg-black"] [class*="text-white/"]{color:var(--ad-leman) !important}
/* Violette signals AI and status. The brand version measures 1.7:1 over light surfaces, so text uses
   the darker variant while the brand colour remains available for backgrounds and signals. */
.at-modulo [class~="bg-violet"]{color:var(--ad-tinta)}


.at-modulo [class~="bg-violet"] *{color:var(--ad-tinta) !important}
/* Indicator cards in the same row keep equal heights. A card with one extra line previously grew
   on its own and misaligned the row. */
.at-modulo [class*="grid-cols-"] > [class*="col-span-"]{display:flex;flex-direction:column}
.at-modulo [class*="grid-cols-"] > [class*="col-span-"] > *{flex:1 1 auto}






.at-modulo [class~="bg-noir"] [class~="text-noir"],
.at-modulo [class~="bg-black"] [class~="text-noir"],
.at-modulo [class~="bg-ink"] [class~="text-noir"]{color:var(--ad-alpin) !important}
/* Light status chips always use Noir ink. */
.at-modulo [class*="bg-amber"]:not([class*="hover:bg-amber"]),.at-modulo [class*="bg-emerald"]:not([class*="hover:bg-emerald"]),
.at-modulo [class*="bg-yellow"]:not([class*="hover:bg-yellow"]),.at-modulo [class*="bg-lime"]:not([class*="hover:bg-lime"]),
.at-modulo [class~="bg-leman"],.at-modulo [class~="bg-neutral-200"],
.at-modulo [class*="bg-amber"]:not([class*="hover:bg-amber"]) *,.at-modulo [class*="bg-emerald"]:not([class*="hover:bg-emerald"]) *,
.at-modulo [class*="bg-yellow"]:not([class*="hover:bg-yellow"]) *,.at-modulo [class*="bg-lime"]:not([class*="hover:bg-lime"]) *,
.at-modulo [class~="bg-leman"] *,.at-modulo [class~="bg-neutral-200"] *{color:var(--ad-tinta) !important}
.at-modulo [class~="bg-noir"][class~="text-noir"],
.at-modulo [class~="bg-black"][class~="text-noir"],
.at-modulo [class~="bg-noir"][class~="text-ink"],
[class*="fixed"] [class~="bg-noir"][class~="text-noir"]{color:var(--ad-alpin) !important}





.at-modulo [class~="bg-rouge"] > [class~="bg-white"],
[class*="fixed"] [class~="bg-rouge"] > [class~="bg-white"]{background-color:var(--ad-noir) !important}
.at-modulo [class~="bg-rouge"] > svg,.at-modulo [class~="bg-rouge"] > * > svg,
[class*="fixed"] [class~="bg-rouge"] > svg{color:var(--ad-noir) !important}
/* A light icon over a dark square remains light and is not overridden. */
.at-modulo [class~="bg-noir"] > svg,.at-modulo [class~="bg-black"] > svg{color:var(--ad-alpin) !important}
.at-modulo [class~="bg-noir"][class*="text-rouge"],
.at-modulo [class~="bg-black"][class*="text-rouge"],
.at-modulo [class~="bg-ink"][class*="text-rouge"]{color:var(--ad-acao) !important}
.at-modulo [class~="bg-noir"][class*="text-neutral-"],
.at-modulo [class~="bg-black"][class*="text-neutral-"]{color:var(--ad-leman) !important}
/* Outline buttons previously became legible only on hover because their resting ink was white over
   a light background. They now use full-strength ink at rest and switch to Alpin when Noir fills
   the background on hover. */
.at-modulo [class~="border-noir"][class~="text-noir"]{color:var(--ad-tinta) !important}
.at-modulo [class~="border-noir"][class*="hover:bg-noir"]:hover{color:var(--ad-alpin) !important}
/* Amber status text measures 3.2:1 over light surfaces, so darken it sufficiently. */
.at-modulo [class*="text-amber"],.at-modulo [class*="text-yellow-6"]{color:#8a5a00 !important}
.at-modulo [class*="text-violet"]{color:#5a2ea6 !important}
.at-modulo [class~="bg-noir"] [class*="text-violet"],.at-modulo [class~="bg-black"] [class*="text-violet"]{color:var(--ad-violette) !important}
.at-modulo input,.at-modulo textarea,.at-modulo select{border-radius:0 !important}
.at-modulo input:focus,.at-modulo textarea:focus,.at-modulo select:focus{outline:var(--ad-foco);outline-offset:1px}






html[data-abil-admin] .at-modulo [class~="bg-rouge"],
html[data-abil-admin] .at-modulo [class~="bg-rouge"] *,
html[data-abil-admin] [class*="fixed"] [class~="bg-rouge"],
html[data-abil-admin] [class*="fixed"] [class~="bg-rouge"] *{color:var(--ad-noir) !important}
html[data-abil-admin] .at-modulo [class*="text-rouge"],
html[data-abil-admin] [class*="fixed"] [class*="text-rouge"]{color:var(--ad-tinta) !important}



html[data-abil-admin] .at-modulo [class~="bg-noir"][class*="text-rouge"],
html[data-abil-admin] .at-modulo [class~="bg-black"][class*="text-rouge"],
html[data-abil-admin] .at-modulo [class~="bg-ink"][class*="text-rouge"],
html[data-abil-admin] .at-modulo [class~="bg-noir"] [class*="text-rouge"],
html[data-abil-admin] [class*="fixed"] [class~="bg-noir"][class*="text-rouge"]{color:var(--ad-acao) !important}
html[data-abil-admin] [class*="bg-noir"] [class*="text-rouge"],
html[data-abil-admin] [class*="bg-black"] [class*="text-rouge"]{color:var(--ad-citron) !important}
html[data-abil-admin] [class*="text-emerald"],
html[data-abil-admin] [class*="text-green"]{color:var(--ad-tinta) !important}
/* Regression identified on 19 August: the preceding rule also matched the sidebar and rendered tab
   names black over black. The sidebar has its own palette with light ink over Noir and is explicitly
   excluded here. */
html[data-abil-admin] .at-side .at-mod{color:var(--ad-tinta-noir) !important}
html[data-abil-admin] .at-side .at-mod:hover{color:var(--ad-alpin) !important}
html[data-abil-admin] .at-side .at-mod.on{color:var(--ad-tinta) !important}
html[data-abil-admin] .at-side .at-gr{color:var(--ad-rhone) !important}
html[data-abil-admin] .at-side-nome{color:var(--ad-acao) !important}
html[data-abil-admin] .at-side-pe button{color:var(--ad-tinta-noir) !important}
html[data-abil-admin] .at-side-pe button:hover{color:var(--ad-acao) !important}






.at-porta{--ad-foco:2px solid var(--ad-alpin);position:fixed;inset:0;z-index:61;background:var(--ad-noir);color:var(--ad-alpin);display:flex;
  align-items:center;justify-content:center;padding:var(--ad-e4);font-family:var(--ad-fonte)}
.at-porta form{width:min(420px,100%)}
.at-porta img{height:20px;width:auto;display:block;margin-bottom:40px}
.at-porta h1{font-size:var(--ad-t-titulo);line-height:var(--ad-lh-titulo);font-weight:var(--ad-peso-leve);letter-spacing:var(--ad-track-titulo);text-transform:uppercase;margin:0 0 8px}
.at-porta p{color:var(--ad-leman);font-size:var(--ad-t-apoio);line-height:var(--ad-lh-corpo);margin:0 0 32px}
.at-porta label{display:block;font-size:var(--ad-t-micro);letter-spacing:var(--ad-track-eyebrow);text-transform:uppercase;color:var(--ad-leman);margin-bottom:8px}
.at-porta input{width:100%;background:none;border:0;border-bottom:1px solid var(--ad-rhone);color:var(--ad-alpin);
  padding:8px 0 10px;font:inherit;font-size:16px;outline:none;transition:border-color .28s}
.at-porta input:focus{border-color:var(--ad-acao)}
/* The gate is the panel's only full-screen Noir surface and therefore has the only button outside
   the kit. Here Citron is the background rather than the revealed layer. This is a complete rule,
   not a patch over .at-btn, which no longer exists. */
.at-porta button[type="submit"]{display:block;width:100%;margin-top:28px;padding:11px 20px;
  border:var(--ad-linha-px) solid var(--ad-acao);border-radius:var(--ad-raio-pill);
  background:var(--ad-acao);color:var(--ad-noir);font:inherit;font-size:var(--ad-t-apoio);
  text-transform:uppercase;letter-spacing:var(--ad-track-titulo);text-align:center;cursor:pointer;
  transition:background var(--ad-d-normal) var(--ad-curva),border-color var(--ad-d-normal) var(--ad-curva)}
.at-porta button[type="submit"]:hover{background:var(--ad-alpin);border-color:var(--ad-alpin)}
.at-porta button[type="submit"]:focus-visible{outline:var(--ad-foco);outline-offset:3px}
.at-porta button[type="submit"][disabled]{opacity:.5;cursor:default}
.at-porta .at-msgerro{color:var(--ad-sinal);font-size:var(--ad-t-apoio);margin-top:16px}
.at-porta .at-langs{margin-top:28px;justify-content:center}
.at-porta .at-lang{color:var(--ad-alpin)}
.at-porta .at-lang.on:after{background:var(--ad-alpin)}

/* Below 1024px the sidebar collapses instead of disappearing. It previously used display:none,
   leaving the panel without navigation and showing only the current module. It is now a drawer
   with the same content and active-state indication. */
@media (max-width:1024px){
  .at-root{grid-template-columns:1fr}
  .at-bar-menu{display:inline-block}
  .at-side{position:fixed;top:0;bottom:0;left:0;width:min(300px,84vw);z-index:3;
    transform:translateX(-100%);transition:transform var(--ad-d-lento) var(--ad-curva)}
  .at-root.at-nav-aberta .at-side{transform:none}
  .at-veu{display:block;animation:at-veu-entra var(--ad-d-normal) var(--ad-curva)}
}
@keyframes at-veu-entra{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){ .at-root *{transition-duration:.01ms !important} }
`;

                                                                           
function Porta({ lang, setLang, onEntrar }: { lang: AbilLang; setLang: (l: AbilLang) => void; onEntrar: (tok: string) => void }) {
  const [senha, setSenha] = useState("");
  const [estado, setEstado] = useState<"parado" | "a-enviar" | "erro">("parado");
  const campo = useRef<HTMLInputElement | null>(null);
  useEffect(() => { campo.current?.focus(); }, []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha || estado === "a-enviar") return;
    setEstado("a-enviar");
    try {
      const r = await fetch("/api/private-store?action=login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha }),
      });
      const j = (await r.json()) as { ok?: boolean; token?: string };
      if (r.ok && j.ok && j.token) {
        try { localStorage.setItem(CHAVE_TOKEN, j.token); } catch {                     }
        setSenha("");
        onEntrar(j.token);
        return;
      }
      setEstado("erro");
    } catch { setEstado("erro"); }
  };

  return (
    <div className="at-porta">
      <style>{CSS}</style>
      <form onSubmit={entrar}>
        <img src="/brand/abil-wordmark-citron.svg" alt="ABiL MEDiAS" />
        <h1>{t5(UI.atelier, lang)}</h1>
        <p>{t5(UI.porta, lang)}</p>
        <label htmlFor="at-senha">{t5(UI.senha, lang)}</label>
        <input id="at-senha" ref={campo} type="password" autoComplete="current-password" value={senha}
          onChange={(e) => { setSenha(e.target.value); if (estado === "erro") setEstado("parado"); }} />
        <button type="submit" disabled={estado === "a-enviar"}>
          {estado === "a-enviar" ? t5(UI.abrindo, lang) : t5(UI.abrir, lang)}
        </button>
        {estado === "erro" ? <p className="at-msgerro" role="alert">{t5(UI.recusada, lang)}</p> : null}
        <div className="at-langs at-up">
          {ABIL_LANGS.map((l) => (
            <button key={l} type="button" className={`at-lang${l === lang ? " on" : ""}`}
              onClick={() => setLang(l)} aria-pressed={l === lang}>{l}</button>
          ))}
        </div>
      </form>
    </div>
  );
}

                                                                        
export function AbilAtelier({
  lang, setLang, modules, groups, renderModule, onSair, extras,
}: {
  lang: AbilLang;
  setLang: (l: AbilLang) => void;
  modules: AtelierModule[];
  groups: AtelierGroup[];
  renderModule: (id: string) => React.ReactNode;
  onSair?: () => void;
                                                                          
                                                                            
                                                                             
                                                                           
                               
  extras?: React.ReactNode;
}) {
  const [tok, setTok] = useState<string>(() => lerToken());
  const [activo, setActivo] = useState<string>(() => modules[0]?.id || "");
                                                                               
                                                                  
  const [navAberta, setNavAberta] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement | null>(null);
  const barraLateral = useRef<HTMLElement | null>(null);

  const fecharNav = useCallback(() => {
    setNavAberta(false);
    botaoMenu.current?.focus();
  }, []);

                                                                               
                                                    
  useEffect(() => {
    if (!navAberta) return;
    barraLateral.current?.querySelector<HTMLButtonElement>(".at-mod")?.focus();
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === "Escape") fecharNav(); };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [navAberta, fecharNav]);

  const perderToken = useCallback(() => {
    try { localStorage.removeItem(CHAVE_TOKEN); } catch {  }
    setTok("");
  }, []);

  const trancar = () => { perderToken(); setActivo(modules[0]?.id || ""); };

                                                                                  
                                                                                   
                                                                             
                                                                               
                                                                              
                                                               
  const gruposTodos: AtelierGroup[] = useMemo(() => groups, [groups]);
  const modsTodos: AtelierModule[] = useMemo(() => modules, [modules]);

  const mod = modsTodos.find((m) => m.id === activo) || modsTodos[0];
  const grupo = gruposTodos.find((g) => g.id === mod.group);

  if (!tok) return <Porta lang={lang} setLang={setLang} onEntrar={(t) => setTok(t)} />;

  return (
    <div className={`at-root${navAberta ? " at-nav-aberta" : ""}`}>
      <style>{CSS}</style>
      {                                                                           
                                                                                  
                                                                               
                                                    }
      <EstilosBase />
      <EstilosCampos />
      <EstiloDados />
      <EstilosFeedback />

      <aside className="at-side" data-ad-fundo="noir" aria-label={t5(UI.atelier, lang)}
        id="at-barra-lateral" ref={barraLateral}>
        <div className="at-side-topo">
          <img src="/brand/abil-wordmark-citron.svg" alt="ABiL MEDiAS" />
          <p className="at-xs at-up at-side-nome">{t5(UI.atelier, lang)}</p>
        </div>
        <nav className="at-side-nav">
          {gruposTodos.map((g) => {
            const doGrupo = modsTodos.filter((m) => m.group === g.id);
            if (!doGrupo.length) return null;
            return (
              <div key={g.id}>
                <p className="at-gr at-xs at-up">{g.label}</p>
                {doGrupo.map((m) => (
                  <button key={m.id} type="button" className={`at-mod${m.id === activo ? " on" : ""}`}
                    onClick={() => { setActivo(m.id); if (navAberta) fecharNav(); }}
                    aria-current={m.id === activo}>{m.label}</button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="at-side-pe at-xs at-up">
          {onSair ? <button type="button" onClick={onSair}>{t5(UI.voltar, lang)}</button> : null}
          <button type="button" onClick={trancar}>{t5(UI.trancar, lang)}</button>
        </div>
      </aside>

      <div className="at-main">
        <header className="at-bar">
          <button type="button" className="at-bar-menu at-up" ref={botaoMenu}
            aria-expanded={navAberta} aria-controls="at-barra-lateral"
            onClick={() => (navAberta ? fecharNav() : setNavAberta(true))}>
            {navAberta ? t5(UI.fecharMenu, lang) : t5(UI.modulos, lang)}
          </button>
          <span className="at-bar-tit">
            <span className="at-xs at-up at-bar-grupo">{grupo ? grupo.label : ""}</span>
            <span className="at-s at-up">{mod.label}</span>
          </span>
          <span className="at-bar-push at-xs at-up">
            <span className="at-langs">
              {ABIL_LANGS.map((l) => (
                <button key={l} type="button" className={`at-lang${l === lang ? " on" : ""}`}
                  onClick={() => setLang(l)} aria-pressed={l === lang}>{l}</button>
              ))}
            </span>
          </span>
        </header>

        <div className="at-scroll">
          <div className="at-modulo" key={activo}>{renderModule(activo)}</div>
        </div>
      </div>

      {navAberta ? (
        <button type="button" className="at-veu" aria-label={t5(UI.fecharMenu, lang)} onClick={fecharNav} />
      ) : null}
      {extras}
    </div>
  );
}
