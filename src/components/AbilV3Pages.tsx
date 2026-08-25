











import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbilLogoLoop } from "./AbilLogoLoop";
import { ABIL_LANGS } from "./AbilSite";
import { type AbilLang } from "./AbilSite";
import { ABIL_POSTS, readingMinutes } from "./abil/posts";
import { nomeCaso, usePublicados } from "./abil/publicados";
import { useJornal, capaDoJornal } from "./abil/jornal";
import { edCfg, edTxt, edSrc, edUi, useEdicoesSite, useModoEdicao, gravarEdicaoLocal, publicarEdicoesNuvem } from "../lib/siteEdits";
import { EditLayerV3 } from "./abil/EditLayerV3";
import { CursorAbil } from "./abil/CursorAbil";
import { MediaCapa } from "./abil/MediaCapa";


const NOIR = "#0a0a0b";
const ALPIN = "#ffffff";
const LEMAN = "#c7c7c7";
const TELA = "#efefef";
const RHONE = "#7e7e7e";
const CITRON = "#d2ff01";







const VIOLETTE = "#be8efc";

export type V3PageId = "projets" | "journal" | "contact" | "services";


type L5 = Record<AbilLang, string>;


type TagKey = "identite" | "dircrea" | "strategie" | "digital" | "devweb" | "campagne" | "affichage" | "edition";
const TAGS: Record<TagKey, L5> = {
  identite: { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" },
  dircrea: { fr: "Direction créative", en: "Creative direction", pt: "Direção criativa", de: "Kreativdirektion", it: "Direzione creativa" },
  strategie: { fr: "Stratégie", en: "Strategy", pt: "Estratégia", de: "Strategie", it: "Strategia" },
  digital: { fr: "Digital", en: "Digital", pt: "Digital", de: "Digital", it: "Digitale" },
  devweb: { fr: "Développement web", en: "Web development", pt: "Desenvolvimento web", de: "Webentwicklung", it: "Sviluppo web" },
  campagne: { fr: "Campagne", en: "Campaign", pt: "Campanha", de: "Kampagne", it: "Campagna" },
  affichage: { fr: "Affichage", en: "Out of home", pt: "Exterior", de: "Plakat", it: "Affissione" },
  edition: { fr: "Édition", en: "Print", pt: "Edição", de: "Editorial", it: "Editoria" },
};


type Work = { slug: string; title: string; img: string; tags: TagKey[]; year: string; extra: string[] };
const WORKSP: Work[] = [
  { slug: "trame-urbaine", title: "Trame Urbaine", img: "/brand/mock-cartaz-2.jpg", tags: ["identite", "dircrea", "strategie"], year: "2026", extra: ["/brand/kv-woman-1.jpg", "/brand/mock-glass-card.jpg"] },
  { slug: "ligne-claire", title: "Ligne Claire", img: "/brand/mock-website-2.jpg", tags: ["digital", "devweb"], year: "2026", extra: ["/brand/mock-website-2.jpg", "/brand/kv-men-3.jpg"] },
  { slug: "voix-de-berne", title: "Voix de Berne", img: "/brand/mock-billboard-2.jpg", tags: ["dircrea", "campagne"], year: "2025", extra: ["/brand/mock-cartaz-2.jpg", "/brand/kv-men-2.jpg"] },
  { slug: "carte-blanche", title: "Carte Blanche", img: "/brand/mock-billboard-2.jpg", tags: ["identite", "campagne", "affichage"], year: "2025", extra: ["/brand/mock-cartaz-2.jpg", "/brand/kv-woman-2.jpg"] },
  { slug: "signal-leman", title: "Signal Léman", img: "/brand/mock-glass-card.jpg", tags: ["identite", "edition"], year: "2024", extra: ["/brand/kv-woman-3.jpg", "/brand/kv-logo-yellow-1.jpg"] },
  { slug: "nuit-blanche", title: "Nuit Blanche", img: "/brand/kv-logo-black-2.jpg", tags: ["digital", "dircrea"], year: "2024", extra: ["/brand/kv-men-1.jpg", "/brand/mock-website-2.jpg"] },
];



export { TAGS as ABIL_TAGS, WORKSP as ABIL_WORKS };
export type { TagKey as AbilTagKey, Work as AbilWork };

const pad2 = (n: number) => String(n).padStart(2, "0");


const CASES_COUNT = pad2(WORKSP.length);


const caseSlug = (title: string) => WORKSP.find((w) => w.title === title)?.slug ?? "";








const NAVP: { page: string; count?: string; label: L5 }[] = [
  { page: "projets", count: CASES_COUNT, label: { fr: "Projets", en: "Projects", pt: "Projetos", de: "Projekte", it: "Progetti" } },
  { page: "services", label: { fr: "Services", en: "Services", pt: "Serviços", de: "Leistungen", it: "Servizi" } },
  { page: "agence", label: { fr: "L'agence", en: "The agency", pt: "A agência", de: "Die Agentur", it: "L'agenzia" } },
  { page: "journal", label: { fr: "Journal", en: "Journal", pt: "Jornal", de: "Journal", it: "Giornale" } },
  { page: "contact", label: { fr: "Contact", en: "Contact", pt: "Contacto", de: "Kontakt", it: "Contatto" } },
];
const NEXT: Record<V3PageId, V3PageId> = { projets: "services", services: "journal", journal: "contact", contact: "projets" };
const navLabel = (p: string, l: AbilLang) => NAVP.find((n) => n.page === p)?.label[l] ?? p;





const JOURNAL_IMGS = ["/brand/mock-billboard-2.jpg", "/brand/kv-icon-yellow-1.jpg", "/brand/kv-logo-black-1.jpg", "/brand/mock-glass-card.jpg"];
const postImg = (slug: string) => {
  const capa = capaDoJornal(slug);
  if (capa) return capa;



  const proprio = ABIL_POSTS.find((p) => p.slug === slug);
  if (proprio && proprio.cover) return proprio.cover;
  const i = ABIL_POSTS.findIndex((p) => p.slug === slug);
  return JOURNAL_IMGS[(i < 0 ? 0 : i) % JOURNAL_IMGS.length];
};
const MONTHS: Record<AbilLang, string[]> = {
  fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  pt: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  it: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
};
const fmtPostDate = (d: string, l: AbilLang) => {
  const [y, mo] = d.split("-");
  const i = parseInt(mo, 10) - 1;
  return `${MONTHS[l][i] ?? mo} ${y}`;
};



const SOCIALS: { name: string; href: string; ed: string }[] = [
  { name: "Instagram", href: "https://www.instagram.com/abil.ch/", ed: "socIg" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/abil-medias/", ed: "socLi" },
  { name: "Facebook", href: "https://www.facebook.com/abilmedias/", ed: "socFb" },
];






const COUNTRIES: { code: string; dial: string; name: L5 }[] = [
  { code: "CH", dial: "+41", name: { fr: "Suisse", en: "Switzerland", pt: "Suíça", de: "Schweiz", it: "Svizzera" } },
  { code: "FR", dial: "+33", name: { fr: "France", en: "France", pt: "França", de: "Frankreich", it: "Francia" } },
  { code: "DE", dial: "+49", name: { fr: "Allemagne", en: "Germany", pt: "Alemanha", de: "Deutschland", it: "Germania" } },
  { code: "IT", dial: "+39", name: { fr: "Italie", en: "Italy", pt: "Itália", de: "Italien", it: "Italia" } },
  { code: "AT", dial: "+43", name: { fr: "Autriche", en: "Austria", pt: "Áustria", de: "Österreich", it: "Austria" } },
  { code: "BE", dial: "+32", name: { fr: "Belgique", en: "Belgium", pt: "Bélgica", de: "Belgien", it: "Belgio" } },
  { code: "LU", dial: "+352", name: { fr: "Luxembourg", en: "Luxembourg", pt: "Luxemburgo", de: "Luxemburg", it: "Lussemburgo" } },
  { code: "ES", dial: "+34", name: { fr: "Espagne", en: "Spain", pt: "Espanha", de: "Spanien", it: "Spagna" } },
  { code: "PT", dial: "+351", name: { fr: "Portugal", en: "Portugal", pt: "Portugal", de: "Portugal", it: "Portogallo" } },
  { code: "NL", dial: "+31", name: { fr: "Pays-Bas", en: "Netherlands", pt: "Países Baixos", de: "Niederlande", it: "Paesi Bassi" } },
  { code: "GB", dial: "+44", name: { fr: "Royaume-Uni", en: "United Kingdom", pt: "Reino Unido", de: "Vereinigtes Königreich", it: "Regno Unito" } },
  { code: "US", dial: "+1", name: { fr: "États-Unis", en: "United States", pt: "Estados Unidos", de: "Vereinigte Staaten", it: "Stati Uniti" } },
];







const FORM_ENDPOINT: string = "/api/private-store?append=leads";
const CONTACT_MAIL = "sam@abil.ch";






type Service = { name: L5; img: string; p: L5; caseTags: TagKey[]; caseTitle: string };

const SERV_SLUGS = ["strategie", "identite", "sites-web", "campagnes", "reseaux-sociaux", "contenus"];



const SERV_VIDEOS: Record<string, string> = {
  "strategie": "/videos/kv-10.mp4",
  "identite": "/videos/kv-14.mp4",
  "sites-web": "/videos/kv-13.mp4",
  "campagnes": "/videos/kv-9.mp4",
  "reseaux-sociaux": "/videos/kv-11.mp4",
  "contenus": "/videos/kv-15.mp4",
};
const SERVICES: Service[] = [
  { name: { fr: "Stratégie", en: "Strategy", pt: "Estratégia", de: "Strategie", it: "Strategia" },
    img: "/brand/kv-icon-yellow-1.jpg", caseTags: ["identite", "dircrea", "strategie"], caseTitle: "Trame Urbaine",
    p: {
      fr: "Avant de dessiner, nous écoutons. Étude du marché, des publics et de la concurrence, définition du positionnement, de la plateforme de marque et du ton: la stratégie donne un cap à chaque décision créative. C'est elle qui évite les allers-retours coûteux et qui permet à une petite équipe d'avancer vite, avec des choix assumés et mesurables.",
      en: "Before we draw, we listen. Market, audience and competitor research, definition of the positioning, the brand platform and the tone: strategy gives every creative decision a heading. It is what spares costly back and forth and lets a small team move fast, with assumed, measurable choices.",
      pt: "Antes de desenhar, escutamos. Estudo do mercado, dos públicos e da concorrência, definição do posicionamento, da plataforma de marca e do tom: a estratégia dá um rumo a cada decisão criativa. É ela que evita idas e voltas custosas e permite a uma equipa pequena avançar depressa, com escolhas assumidas e mensuráveis.",
      de: "Bevor wir gestalten, hören wir zu. Markt-, Publikums- und Wettbewerbsanalyse, Definition von Positionierung, Markenplattform und Ton: Die Strategie gibt jeder kreativen Entscheidung einen Kurs. Sie erspart teure Schleifen und lässt ein kleines Team schnell vorankommen, mit klaren, messbaren Entscheidungen.",
      it: "Prima di disegnare, ascoltiamo. Studio del mercato, dei pubblici e della concorrenza, definizione del posizionamento, della piattaforma di marca e del tono: la strategia dà una rotta a ogni decisione creativa. È lei che evita costosi avanti e indietro e permette a una piccola squadra di avanzare in fretta, con scelte assunte e misurabili.",
    } },
  { name: { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" },
    img: "/brand/mock-billboard-2.jpg", caseTags: ["identite", "campagne", "affichage"], caseTitle: "Carte Blanche",
    p: {
      fr: "L'identité est sans doute la part la plus durable de toute entreprise, grande ou petite. Nous dessinons des marques à l'allure reconnaissable entre toutes: logos, chartes, typographies et déclinaisons pensées pour tenir des années sans lifting forcé, et assez souples pour vivre sur tous les supports, de la carte de visite à l'écran géant.",
      en: "Identity is probably the most lasting part of any business, big or small. We draw brands with an allure recognisable among all: logos, guidelines, typography and variations designed to hold for years without forced facelifts, and supple enough to live on every medium, from business card to giant screen.",
      pt: "A identidade é talvez a parte mais duradoura de qualquer empresa, grande ou pequena. Desenhamos marcas com uma presença reconhecível entre todas: logótipos, manuais, tipografias e declinações pensadas para aguentar anos sem lifting forçado, e flexíveis para viver em todos os suportes, do cartão ao ecrã gigante.",
      de: "Die Identität ist wohl der dauerhafteste Teil jedes Unternehmens, gross oder klein. Wir zeichnen Marken mit unverwechselbarer Ausstrahlung: Logos, Richtlinien, Typografie und Ableitungen, gedacht, um Jahre ohne erzwungenes Lifting zu halten, und geschmeidig genug für jedes Medium, von der Visitenkarte bis zur Grossleinwand.",
      it: "L'identità è forse la parte più duratura di ogni impresa, grande o piccola. Disegniamo brand dall'allure riconoscibile tra tutti: loghi, linee guida, tipografie e declinazioni pensate per reggere anni senza lifting forzato, e abbastanza flessibili da vivere su ogni supporto, dal biglietto allo schermo gigante.",
    } },
  { name: { fr: "Sites web", en: "Websites", pt: "Sites web", de: "Websites", it: "Siti web" },
    img: "/brand/mock-website-2.jpg", caseTags: ["digital", "devweb"], caseTitle: "Ligne Claire",
    p: {
      fr: "En comprenant comment vos publics rencontrent votre marque, nous concevons des sites rapides, lisibles et faciles à tenir à jour. Vitrines, e-commerce ou plateformes: chaque page est pensée pour convaincre, avec un soin égal porté au texte, à l'image et à la performance, et une exigence simple: que la beauté serve toujours l'usage.",
      en: "By understanding how your audiences meet your brand, we design fast, readable sites that are easy to keep alive. Showcases, e-commerce or platforms: every page is built to convince, with equal care given to words, images and performance, and one simple rule: beauty must always serve use.",
      pt: "Ao perceber como os seus públicos encontram a sua marca, desenhamos sites rápidos, legíveis e fáceis de manter. Montras, e-commerce ou plataformas: cada página é pensada para convencer, com igual cuidado no texto, na imagem e na performance, e uma exigência simples: que a beleza sirva sempre o uso.",
      de: "Weil wir verstehen, wie Ihre Publika Ihrer Marke begegnen, bauen wir schnelle, lesbare Seiten, die leicht zu pflegen sind. Vitrinen, E-Commerce oder Plattformen: Jede Seite soll überzeugen, mit gleicher Sorgfalt für Text, Bild und Performance, und einer einfachen Regel: Schönheit dient immer dem Gebrauch.",
      it: "Capendo come i vostri pubblici incontrano il vostro brand, progettiamo siti rapidi, leggibili e facili da tenere aggiornati. Vetrine, e-commerce o piattaforme: ogni pagina è pensata per convincere, con pari cura per testo, immagine e prestazioni, e un'esigenza semplice: che la bellezza serva sempre l'uso.",
    } },
  { name: { fr: "Campagnes", en: "Campaigns", pt: "Campanhas", de: "Kampagnen", it: "Campagne" },
    img: "/brand/mock-cartaz-2.jpg", caseTags: ["dircrea", "campagne"], caseTitle: "Voix de Berne",
    p: {
      fr: "De l'affichage au spot, nous imaginons des campagnes qui assument leurs couleurs et restent en tête. Concept, production et déclinaisons sortent du même atelier, avec le même cap et le même soin du détail: une idée juste, portée par des images fortes, déclinée proprement sur chaque canal sans perdre sa voix en route.",
      en: "From billboards to spots, we imagine campaigns that own their colours and stay in mind. Concept, production and variations leave the same studio, with the same heading and the same care for detail: one right idea, carried by strong images, declined cleanly on every channel without losing its voice.",
      pt: "Do cartaz ao spot, imaginamos campanhas que assumem as suas cores e ficam na cabeça. Conceito, produção e declinações saem do mesmo ateliê, com o mesmo rumo e o mesmo cuidado no detalhe: uma ideia justa, levada por imagens fortes, declinada com asseio em cada canal sem perder a voz pelo caminho.",
      de: "Vom Plakat bis zum Spot denken wir Kampagnen, die zu ihren Farben stehen und im Kopf bleiben. Konzept, Produktion und Ableitungen kommen aus demselben Atelier, mit demselben Kurs und derselben Sorgfalt: eine richtige Idee, getragen von starken Bildern, sauber dekliniert auf jedem Kanal, ohne die Stimme zu verlieren.",
      it: "Dall'affissione allo spot, immaginiamo campagne che assumono i loro colori e restano in testa. Concetto, produzione e declinazioni escono dallo stesso atelier, con la stessa rotta e la stessa cura del dettaglio: un'idea giusta, portata da immagini forti, declinata con ordine su ogni canale senza perdere la voce.",
    } },
  { name: { fr: "Réseaux sociaux", en: "Social media", pt: "Redes sociais", de: "Social Media", it: "Social media" },
    img: "/brand/kv-logo-black-1.jpg", caseTags: ["digital", "dircrea"], caseTitle: "Nuit Blanche",
    p: {
      fr: "Ligne éditoriale, formats courts, animation de communauté et veille: nous donnons aux marques une voix reconnaissable, régulière et vivante. Pas de mode jetable ni de contenu pour le contenu: un calendrier tenu, des formats qui respectent l'identité et des chiffres regardés en face pour ajuster ce qui doit l'être.",
      en: "Editorial line, short formats, community care and monitoring: we give brands a recognisable, steady, living voice. No disposable fashion, no content for content's sake: a calendar that is kept, formats that respect the identity and numbers looked at straight to adjust what must be.",
      pt: "Linha editorial, formatos curtos, animação de comunidade e monitorização: damos às marcas uma voz reconhecível, regular e viva. Sem moda descartável nem conteúdo por conteúdo: um calendário cumprido, formatos que respeitam a identidade e números olhados de frente para ajustar o que for preciso.",
      de: "Redaktionslinie, Kurzformate, Community-Pflege und Beobachtung: Wir geben Marken eine erkennbare, verlässliche, lebendige Stimme. Keine Wegwerfmode, kein Inhalt um des Inhalts willen: ein gehaltener Kalender, Formate, die die Identität achten, und Zahlen, denen wir ins Gesicht sehen, um nachzusteuern.",
      it: "Linea editoriale, formati brevi, cura della community e ascolto: diamo ai brand una voce riconoscibile, regolare e viva. Niente moda usa e getta né contenuto per il contenuto: un calendario rispettato, formati che onorano l'identità e numeri guardati in faccia per aggiustare ciò che serve.",
    } },
  { name: { fr: "Contenus", en: "Content", pt: "Conteúdos", de: "Inhalte", it: "Contenuti" },
    img: "/brand/mock-glass-card.jpg", caseTags: ["identite", "edition"], caseTitle: "Signal Léman",
    p: {
      fr: "Photo, vidéo, motion et rédaction: nous produisons des contenus justes, pensés pour chaque canal, qui racontent la même histoire avec la même exigence, de la story au film de marque. La production reste proche de la création: ce qui est promis sur le papier est tenu à l'image, dans les délais et dans le budget.",
      en: "Photo, video, motion and copywriting: we produce accurate content, shaped for each channel, telling the same story with the same rigour, from a story to a brand film. Production stays close to creation: what is promised on paper is kept on screen, on time and on budget.",
      pt: "Foto, vídeo, motion e redação: produzimos conteúdos justos, pensados para cada canal, que contam a mesma história com a mesma exigência, da story ao filme de marca. A produção fica perto da criação: o que se promete no papel cumpre-se na imagem, no prazo e no orçamento.",
      de: "Foto, Video, Motion und Text: Wir produzieren stimmige Inhalte, gedacht für jeden Kanal, die dieselbe Geschichte mit derselben Sorgfalt erzählen, von der Story bis zum Markenfilm. Die Produktion bleibt nah an der Kreation: Was auf Papier versprochen ist, wird im Bild gehalten, im Termin und im Budget.",
      it: "Foto, video, motion e redazione: produciamo contenuti giusti, pensati per ogni canale, che raccontano la stessa storia con la stessa esigenza, dalla story al film di marca. La produzione resta vicina alla creazione: ciò che è promesso sulla carta è mantenuto all'immagine, nei tempi e nel budget.",
    } },
];
const PILLARS: { h: L5; items: L5[] }[] = [
  { h: { fr: "Stratégie", en: "Strategy", pt: "Estratégia", de: "Strategie", it: "Strategia" }, items: [
    { fr: "Étude des publics", en: "Customer research", pt: "Pesquisa de clientes", de: "Kundenforschung", it: "Ricerca clienti" },
    { fr: "Analyse des tendances", en: "Trends analysis", pt: "Análise de tendências", de: "Trendanalyse", it: "Analisi delle tendenze" },
    { fr: "Analyse de la concurrence", en: "Competitor review", pt: "Revisão da concorrência", de: "Wettbewerbsanalyse", it: "Analisi dei concorrenti" },
    { fr: "Positionnement de marque", en: "Brand positioning", pt: "Posicionamento de marca", de: "Markenpositionierung", it: "Posizionamento di marca" },
    { fr: "Plateforme de marque", en: "Brand platform", pt: "Plataforma de marca", de: "Markenplattform", it: "Piattaforma di marca" },
    { fr: "Architecture de l'offre", en: "Offer architecture", pt: "Arquitetura da oferta", de: "Angebotsarchitektur", it: "Architettura dell'offerta" },
    { fr: "Stratégie de lancement", en: "Launch strategy", pt: "Estratégia de lançamento", de: "Launch-Strategie", it: "Strategia di lancio" },
  ] },
  { h: { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" }, items: [
    { fr: "Direction artistique", en: "Art direction", pt: "Direção de arte", de: "Art Direction", it: "Direzione artistica" },
    { fr: "Identité visuelle", en: "Visual identity", pt: "Identidade visual", de: "Visuelle Identität", it: "Identità visiva" },
    { fr: "Systèmes graphiques", en: "Design systems", pt: "Sistemas de design", de: "Designsysteme", it: "Sistemi di design" },
    { fr: "Chartes graphiques", en: "Brand guidelines", pt: "Manuais gráficos", de: "Gestaltungsrichtlinien", it: "Linee guida grafiche" },
    { fr: "Naming", en: "Naming", pt: "Naming", de: "Naming", it: "Naming" },
    { fr: "Design graphique", en: "Graphic design", pt: "Design gráfico", de: "Grafikdesign", it: "Design grafico" },
    { fr: "Déclinaisons sur tous les supports", en: "Media variations", pt: "Declinações de suportes", de: "Medienableitungen", it: "Declinazioni dei supporti" },
  ] },
  { h: { fr: "Sites web", en: "Websites", pt: "Sites web", de: "Websites", it: "Siti web" }, items: [
    { fr: "Design UX/UI", en: "UX/UI design", pt: "Design UX/UI", de: "UX/UI-Design", it: "Design UX/UI" },
    { fr: "Prototypage", en: "Prototyping", pt: "Prototipagem", de: "Prototyping", it: "Prototipazione" },
    { fr: "Développement front-end", en: "Front-end development", pt: "Desenvolvimento front-end", de: "Front-End-Entwicklung", it: "Sviluppo front-end" },
    { fr: "CMS et back-office", en: "CMS and back office", pt: "CMS e back-office", de: "CMS und Backoffice", it: "CMS e back office" },
    { fr: "Intégration d'ERP", en: "ERP integration", pt: "Integração de ERP", de: "ERP-Integration", it: "Integrazione ERP" },
    { fr: "Intégration d'API", en: "API integration", pt: "Integração de APIs", de: "API-Integration", it: "Integrazione API" },
    { fr: "E-commerce", en: "E-commerce", pt: "E-commerce", de: "E-Commerce", it: "E-commerce" },
    { fr: "SEO et performance", en: "SEO and performance", pt: "SEO e performance", de: "SEO und Performance", it: "SEO e prestazioni" },
    { fr: "Tests multi-écrans", en: "Multi-screen testing", pt: "Testes multiecrã", de: "Multiscreen-Tests", it: "Test multischermo" },
  ] },
  { h: { fr: "Campagnes", en: "Campaigns", pt: "Campanhas", de: "Kampagnen", it: "Campagne" }, items: [
    { fr: "Concepts de campagne", en: "Campaign concepts", pt: "Conceitos de campanha", de: "Kampagnenkonzepte", it: "Concetti di campagna" },
    { fr: "Affichage", en: "Out of home", pt: "Exterior", de: "Plakat", it: "Affissione" },
    { fr: "Presse et print", en: "Press and print", pt: "Imprensa e print", de: "Presse und Print", it: "Stampa e print" },
    { fr: "Spots et audiovisuel", en: "Spots and film", pt: "Spots e audiovisual", de: "Spots und Film", it: "Spot e audiovisivo" },
    { fr: "Activations", en: "Activations", pt: "Ativações", de: "Aktivierungen", it: "Attivazioni" },
    { fr: "Déclinaisons média", en: "Media variations", pt: "Declinações média", de: "Media-Ableitungen", it: "Declinazioni media" },
  ] },
  { h: { fr: "Réseaux sociaux", en: "Social media", pt: "Redes sociais", de: "Social Media", it: "Social media" }, items: [
    { fr: "Ligne éditoriale", en: "Editorial line", pt: "Linha editorial", de: "Redaktionslinie", it: "Linea editoriale" },
    { fr: "Calendriers de publication", en: "Publishing calendars", pt: "Calendários de publicação", de: "Publikationskalender", it: "Calendari di pubblicazione" },
    { fr: "Formats courts", en: "Short formats", pt: "Formatos curtos", de: "Kurzformate", it: "Formati brevi" },
    { fr: "Animation de communauté", en: "Community management", pt: "Animação de comunidade", de: "Community-Betreuung", it: "Gestione della community" },
    { fr: "Veille et reporting", en: "Monitoring and reporting", pt: "Monitorização e reporting", de: "Monitoring und Reporting", it: "Ascolto e reporting" },
  ] },
  { h: { fr: "Contenus", en: "Content", pt: "Conteúdos", de: "Inhalte", it: "Contenuti" }, items: [
    { fr: "Photographie", en: "Photography", pt: "Fotografia", de: "Fotografie", it: "Fotografia" },
    { fr: "Vidéo et motion", en: "Video and motion", pt: "Vídeo e motion", de: "Video und Motion", it: "Video e motion" },
    { fr: "Rédaction", en: "Copywriting", pt: "Redação", de: "Text", it: "Redazione" },
    { fr: "Illustration", en: "Illustration", pt: "Ilustração", de: "Illustration", it: "Illustrazione" },
    { fr: "Packaging", en: "Packaging", pt: "Packaging", de: "Packaging", it: "Packaging" },
    { fr: "Gabarits et guides", en: "Templates and guides", pt: "Modelos e guias", de: "Vorlagen und Guides", it: "Modelli e guide" },
  ] },
];





const REPERES: { h: L5; items: L5[] }[] = [
  { h: { fr: "L'atelier", en: "The studio", pt: "O ateliê", de: "Das Atelier", it: "L'atelier" }, items: [
    { fr: "Genève, Rue de Berne 59", en: "Geneva, Rue de Berne 59", pt: "Genebra, Rue de Berne 59", de: "Genf, Rue de Berne 59", it: "Ginevra, Rue de Berne 59" },
    { fr: "Équipe courte, interlocuteur unique", en: "Short team, one point of contact", pt: "Equipa curta, interlocutor único", de: "Kleines Team, ein Ansprechpartner", it: "Squadra corta, un solo referente" },
    { fr: "Stratégie et exécution sous le même toit", en: "Strategy and delivery under one roof", pt: "Estratégia e execução sob o mesmo teto", de: "Strategie und Umsetzung unter einem Dach", it: "Strategia ed esecuzione sotto lo stesso tetto" },
  ] },
  { h: { fr: "Le métier", en: "The craft", pt: "O ofício", de: "Das Handwerk", it: "Il mestiere" }, items: [
    { fr: "6 disciplines, un seul cap", en: "6 disciplines, one heading", pt: "6 disciplinas, um só rumo", de: "6 Disziplinen, ein Kurs", it: "6 discipline, una sola rotta" },
    { fr: "De la plateforme de marque à la mise en ligne", en: "From brand platform to going live", pt: "Da plataforma de marca ao lançamento", de: "Von der Markenplattform bis zum Livegang", it: "Dalla piattaforma di marca alla messa online" },
    { fr: "Fichiers sources remis au client", en: "Source files handed to the client", pt: "Ficheiros de origem entregues ao cliente", de: "Quelldateien gehen an den Kunden", it: "File sorgente consegnati al cliente" },
  ] },
  { h: { fr: "Le terrain", en: "The ground", pt: "O terreno", de: "Das Terrain", it: "Il terreno" }, items: [
    { fr: "5 langues de travail", en: "5 working languages", pt: "5 línguas de trabalho", de: "5 Arbeitssprachen", it: "5 lingue di lavoro" },
    { fr: "Suisse romande et frontière française", en: "French-speaking Switzerland and the French border", pt: "Suíça francófona e fronteira francesa", de: "Westschweiz und französische Grenzregion", it: "Svizzera romanda e frontiera francese" },
    { fr: "PME, institutions, commerces", en: "SMEs, institutions, retail", pt: "PME, instituições, comércio", de: "KMU, Institutionen, Handel", it: "PMI, istituzioni, commercio" },
  ] },
];

const REPERES_SLUGS = ["atelier", "metier", "terrain"];


const UIP_FR = {
  navAria: "Navigation principale", logoAria: "ABiL MEDiAS, accueil", langsAria: "Langues", menuAria: "Menu",
  menu: "Menu +", fermer: "Fermer", accueil: "Accueil",

  heroTag: ["Vraiment", "Habiles."] as [string, string],
  lrgAlt: "ABiL MEDiAS, l'atelier au travail",
  filtre: "Filtre:", tous: "Tous", grille: "Grille", liste: "Liste", viewAria: "Affichage",
  accPlus: "Plus +", accMoins: "Moins -",
  jTitleLead: "Le", jTitleIt: "Journal", jSub1: "Regards de création", jSub2: "Perspectives de marque",
  jPara: "Un carnet ouvert sur la vie de l'atelier: des idées fraîches sur les marques, le design utile et la manière de rester lisible dans un paysage qui change sans prévenir.",
  trier: "Trier:", recents: "Récents", anciens: "Anciens", article: "Article", readArticle: "Lire l'article", cursorRead: "Lire",
  cTitle: "Contact", fNom: "Nom*", fEmail: "Email*", fSujet: "Sujet*", fTel: "Téléphone", fMsg: "Message*",
  topicAutre: "Autre", submitTop: "Envoyer", submitReveal: "Envoyez votre message",
  merci: "Merci!", sentMsg: "Votre message est bien parti. Nous revenons vers vous sous deux jours ouvrés.",
  againTop: "Nouveau message", againReveal: "Envoyer un autre message",
  errRequired: "Ce champ est requis.",
  errEmailSpace: "L'adresse ne peut pas contenir d'espace.",
  errEmailAt: "L'adresse doit contenir un @.",
  errEmailLocal: "Il manque le nom avant le @.",
  errEmailDomain: "Il manque le domaine après le @.",
  errEmailDot: "Le domaine doit contenir un point.",
  errEmailTld: "L'extension du domaine est trop courte.",
  errEmailChar: "L'adresse contient un caractère qui ne passe pas.",
  errEmailDouble: "L'adresse contient deux points de suite.",
  errTopic: "Choisissez au moins un sujet.",
  errPhone: "Ce numéro ne semble pas complet.",
  errMsgShort: "Message trop court: 20 caractères au minimum.",
  errForm: "Le formulaire n'est pas encore complet.",
  sending: "Envoi...", sendingMsg: "Votre message part vers l'atelier.",
  errNetTitle: "Envoi impossible.",
  errNet: "La connexion a échoué. Réessayez, ou ouvrez votre messagerie: rien n'est perdu.",
  retryTop: "Réessayer", retryReveal: "Envoyer à nouveau",
  mailReveal: "Ouvrir ma messagerie",
  removeAria: "Retirer", countryAria: "Indicatif du pays", honey: "Commentaires",
  cDesc: "Nous croyons à la force des marques bien menées et aimons collaborer avec ceux qui partagent cette exigence. Parlons-en.",
  sHero: "Des idées transformées en expériences de marque", sSub1: "Créativité assumée", sSub2: "Solutions concrètes",
  sP1: "Sur un marché saturé, le correct ne suffit plus. Nous visons une exigence complète, à chaque étape du processus: des réponses qui dépassent la demande et ouvrent des possibilités que la marque ne soupçonnait pas.",
  sP2: "Notre travail est conceptuel à la racine, stratégique dans la conduite et exécuté par des mains qui voient l'ensemble. Nous façonnons des marques, dessinons des sites et construisons des expériences.",
  projTop: "Un projet?", projReveal: "Démarrer un briefing", learnTop: "En savoir plus", servReveal: "Nos services {x}",
  cursorProject: "Voir le projet", detailTitle: "Le détail des services",
  detailDesc: "Des marques élevées par un design exigeant et des idées qui durent.",
  talkTop: "Parlons-en", talkReveal: "Écrivez-nous",
  reperesTitle: "Repères", reperesDesc: "Ce qui tient sous les promesses: un lieu, un métier, un terrain.",
  readerAria: "Article du journal", closeAria: "Fermer",
  minRead: "min de lecture", loading: "Chargement",
  nextPage: "Page suivante", footerHead: "Nous serions ravis de vous lire. Travaillons ensemble.",
  contactTop: "Contactez-nous", contactReveal: "Écrivez-nous",
  colBiz: "Demandes professionnelles", colJobs: "Candidatures", colCity: "Genève", colHours: "Horaires",
  hoursDays: "Lundi au vendredi", country: "Suisse", backTop: "Haut de page",

  etudesLink: "Études de cas", privacyLink: "Confidentialité", termsLink: "Conditions",
  skipLink: "Aller au contenu",
};
type UIPStrings = typeof UIP_FR;
const UIP: Record<AbilLang, UIPStrings> = {
  fr: UIP_FR,
  en: {
    navAria: "Main navigation", logoAria: "ABiL MEDiAS, home", langsAria: "Languages", menuAria: "Menu",
    menu: "Menu +", fermer: "Close", accueil: "Home",
    heroTag: ["Truly", "Able."],
    lrgAlt: "ABiL MEDiAS, the studio at work",
    filtre: "Filter:", tous: "All", grille: "Grid", liste: "List", viewAria: "Display",
    accPlus: "More +", accMoins: "Less -",
    jTitleLead: "The", jTitleIt: "Journal", jSub1: "Views on creation", jSub2: "Brand perspectives",
    jPara: "An open notebook on the life of the studio: fresh ideas on brands, useful design and how to stay readable in a landscape that changes without warning.",
    trier: "Sort:", recents: "Latest", anciens: "Oldest", article: "Article", readArticle: "Read the article", cursorRead: "Read",
    cTitle: "Contact", fNom: "Name*", fEmail: "Email*", fSujet: "Topic*", fTel: "Phone", fMsg: "Message*",
    topicAutre: "Other", submitTop: "Send", submitReveal: "Send us your message",
    merci: "Thank you!", sentMsg: "Your message is on its way. We will get back to you within two working days.",
    againTop: "New message", againReveal: "Send another message",
    errRequired: "This field is required.",
    errEmailSpace: "The address cannot contain a space.",
    errEmailAt: "The address must contain an @.",
    errEmailLocal: "The name before the @ is missing.",
    errEmailDomain: "The domain after the @ is missing.",
    errEmailDot: "The domain must contain a dot.",
    errEmailTld: "The domain ending is too short.",
    errEmailChar: "The address contains a character that will not pass.",
    errEmailDouble: "The address contains two dots in a row.",
    errTopic: "Choose at least one topic.",
    errPhone: "This number does not look complete.",
    errMsgShort: "Message too short: 20 characters minimum.",
    errForm: "The form is not complete yet.",
    sending: "Sending...", sendingMsg: "Your message is on its way to the studio.",
    errNetTitle: "Sending failed.",
    errNet: "The connection failed. Try again, or open your mail app: nothing is lost.",
    retryTop: "Try again", retryReveal: "Send once more",
    mailReveal: "Open my mail app",
    removeAria: "Remove", countryAria: "Country code", honey: "Comments",
    cDesc: "We believe in the strength of well-run brands and love working with those who share that standard. Let's talk.",
    sHero: "Ideas transformed into living brand experiences", sSub1: "Boldly creative", sSub2: "Solution driven",
    sP1: "In a saturated market, correct is no longer enough. We aim for complete rigour at every step of the process: answers that exceed the brief and open possibilities the brand did not suspect.",
    sP2: "Our work is conceptual at the root, strategic in its conduct and executed by hands that see the whole. We shape brands, design websites and build experiences.",
    projTop: "A project?", projReveal: "Start a briefing", learnTop: "Learn more", servReveal: "Our {x} services",
    cursorProject: "View project", detailTitle: "The services in detail",
    detailDesc: "Brands raised by demanding design and ideas that last.",
    talkTop: "Let's talk", talkReveal: "Write to us",
    reperesTitle: "Markers", reperesDesc: "What holds under the promises: a place, a craft, a ground.",
    readerAria: "Journal article", closeAria: "Close",
    minRead: "min read", loading: "Loading",
    nextPage: "Next page", footerHead: "We would love to hear from you. Let's work together.",
    contactTop: "Contact us", contactReveal: "Write to us",
    colBiz: "Business enquiries", colJobs: "Applications", colCity: "Geneva", colHours: "Hours",
    hoursDays: "Monday to Friday", country: "Switzerland", backTop: "Back to top",
    etudesLink: "Case studies", privacyLink: "Privacy", termsLink: "Terms",
    skipLink: "Skip to content",
  },
  pt: {
    navAria: "Navegação principal", logoAria: "ABiL MEDiAS, início", langsAria: "Línguas", menuAria: "Menu",
    menu: "Menu +", fermer: "Fechar", accueil: "Início",
    heroTag: ["Realmente", "Hábeis."],
    lrgAlt: "ABiL MEDiAS, o ateliê a trabalhar",
    filtre: "Filtro:", tous: "Todos", grille: "Grelha", liste: "Lista", viewAria: "Vista",
    accPlus: "Mais +", accMoins: "Menos -",
    jTitleLead: "O", jTitleIt: "Jornal", jSub1: "Olhares de criação", jSub2: "Perspetivas de marca",
    jPara: "Um caderno aberto sobre a vida do ateliê: ideias frescas sobre marcas, design útil e a maneira de continuar legível numa paisagem que muda sem avisar.",
    trier: "Ordenar:", recents: "Recentes", anciens: "Antigos", article: "Artigo", readArticle: "Ler o artigo", cursorRead: "Ler",
    cTitle: "Contacto", fNom: "Nome*", fEmail: "Email*", fSujet: "Assunto*", fTel: "Telefone", fMsg: "Mensagem*",
    topicAutre: "Outro", submitTop: "Enviar", submitReveal: "Envie a sua mensagem",
    merci: "Obrigado!", sentMsg: "A sua mensagem seguiu. Voltamos ao seu contacto em dois dias úteis.",
    againTop: "Nova mensagem", againReveal: "Enviar outra mensagem",
    errRequired: "Este campo é obrigatório.",
    errEmailSpace: "O endereço não pode ter espaços.",
    errEmailAt: "O endereço tem de conter um @.",
    errEmailLocal: "Falta o nome antes do @.",
    errEmailDomain: "Falta o domínio depois do @.",
    errEmailDot: "O domínio tem de conter um ponto.",
    errEmailTld: "A terminação do domínio é curta demais.",
    errEmailChar: "O endereço tem um carácter que não passa.",
    errEmailDouble: "O endereço tem dois pontos seguidos.",
    errTopic: "Escolha pelo menos um assunto.",
    errPhone: "Este número não parece completo.",
    errMsgShort: "Mensagem curta demais: 20 caracteres no mínimo.",
    errForm: "O formulário ainda não está completo.",
    sending: "A enviar...", sendingMsg: "A sua mensagem segue para o ateliê.",
    errNetTitle: "Envio impossível.",
    errNet: "A ligação falhou. Tente de novo, ou abra o seu email: nada se perde.",
    retryTop: "Tentar de novo", retryReveal: "Enviar outra vez",
    mailReveal: "Abrir o meu email",
    removeAria: "Retirar", countryAria: "Indicativo do país", honey: "Comentários",
    cDesc: "Acreditamos na força das marcas bem conduzidas e gostamos de colaborar com quem partilha essa exigência. Falemos.",
    sHero: "Ideias transformadas em experiências de marca", sSub1: "Criatividade assumida", sSub2: "Soluções concretas",
    sP1: "Num mercado saturado, o correto já não chega. Visamos uma exigência completa em cada etapa do processo: respostas que ultrapassam o pedido e abrem possibilidades que a marca não suspeitava.",
    sP2: "O nosso trabalho é conceptual na raiz, estratégico na condução e executado por mãos que veem o conjunto. Moldamos marcas, desenhamos sites e construímos experiências.",
    projTop: "Um projeto?", projReveal: "Começar um briefing", learnTop: "Saber mais", servReveal: "Os nossos serviços de {x}",
    cursorProject: "Ver o projeto", detailTitle: "O detalhe dos serviços",
    detailDesc: "Marcas elevadas por um design exigente e ideias que duram.",
    talkTop: "Falemos", talkReveal: "Escreva-nos",
    reperesTitle: "Referências", reperesDesc: "O que segura por baixo das promessas: um lugar, um ofício, um terreno.",
    readerAria: "Artigo do journal", closeAria: "Fechar",
    minRead: "min de leitura", loading: "A carregar",
    nextPage: "Página seguinte", footerHead: "Vamos adorar ler a sua mensagem. Trabalhemos juntos.",
    contactTop: "Contacte-nos", contactReveal: "Escreva-nos",
    colBiz: "Contactos profissionais", colJobs: "Candidaturas", colCity: "Genebra", colHours: "Horários",
    hoursDays: "Segunda a sexta", country: "Suíça", backTop: "Topo da página",
    etudesLink: "Estudos de caso", privacyLink: "Privacidade", termsLink: "Condições",
    skipLink: "Ir para o conteúdo",
  },
  de: {
    navAria: "Hauptnavigation", logoAria: "ABiL MEDiAS, Startseite", langsAria: "Sprachen", menuAria: "Menü",
    menu: "Menu +", fermer: "Schliessen", accueil: "Start",
    heroTag: ["Wirklich", "Fähig."],
    lrgAlt: "ABiL MEDiAS, das Atelier bei der Arbeit",
    filtre: "Filter:", tous: "Alle", grille: "Raster", liste: "Liste", viewAria: "Ansicht",
    accPlus: "Mehr +", accMoins: "Weniger -",
    jTitleLead: "Das", jTitleIt: "Journal", jSub1: "Blicke aufs Gestalten", jSub2: "Markenperspektiven",
    jPara: "Ein offenes Heft über das Leben des Ateliers: frische Ideen zu Marken, nützlichem Design und der Kunst, lesbar zu bleiben in einer Landschaft, die sich ohne Vorwarnung ändert.",
    trier: "Sortieren:", recents: "Neueste", anciens: "Älteste", article: "Artikel", readArticle: "Artikel lesen", cursorRead: "Lesen",
    cTitle: "Kontakt", fNom: "Name*", fEmail: "E-Mail*", fSujet: "Thema*", fTel: "Telefon", fMsg: "Nachricht*",
    topicAutre: "Anderes", submitTop: "Senden", submitReveal: "Senden Sie uns Ihre Nachricht",
    merci: "Danke!", sentMsg: "Ihre Nachricht ist unterwegs. Wir melden uns innerhalb von zwei Arbeitstagen.",
    againTop: "Neue Nachricht", againReveal: "Eine weitere Nachricht senden",
    errRequired: "Dieses Feld ist erforderlich.",
    errEmailSpace: "Die Adresse darf kein Leerzeichen enthalten.",
    errEmailAt: "Die Adresse muss ein @ enthalten.",
    errEmailLocal: "Der Name vor dem @ fehlt.",
    errEmailDomain: "Die Domain nach dem @ fehlt.",
    errEmailDot: "Die Domain muss einen Punkt enthalten.",
    errEmailTld: "Die Domain-Endung ist zu kurz.",
    errEmailChar: "Die Adresse enthält ein Zeichen, das nicht durchgeht.",
    errEmailDouble: "Die Adresse enthält zwei Punkte hintereinander.",
    errTopic: "Wählen Sie mindestens ein Thema.",
    errPhone: "Diese Nummer wirkt unvollständig.",
    errMsgShort: "Nachricht zu kurz: mindestens 20 Zeichen.",
    errForm: "Das Formular ist noch nicht vollständig.",
    sending: "Senden...", sendingMsg: "Ihre Nachricht geht ins Atelier.",
    errNetTitle: "Senden nicht möglich.",
    errNet: "Die Verbindung ist gescheitert. Versuchen Sie es erneut, oder öffnen Sie Ihr Mailprogramm: nichts geht verloren.",
    retryTop: "Erneut", retryReveal: "Noch einmal senden",
    mailReveal: "Mein Mailprogramm öffnen",
    removeAria: "Entfernen", countryAria: "Ländervorwahl", honey: "Kommentare",
    cDesc: "Wir glauben an die Kraft gut geführter Marken und arbeiten gern mit allen, die diesen Anspruch teilen. Reden wir.",
    sHero: "Ideen, verwandelt in gelebte Markenerlebnisse", sSub1: "Mutig kreativ", sSub2: "Konkret in Lösungen",
    sP1: "In einem gesättigten Markt reicht korrekt nicht mehr. Wir wollen volle Sorgfalt in jedem Schritt: Antworten, die über den Auftrag hinausgehen und Möglichkeiten öffnen, die die Marke nicht ahnte.",
    sP2: "Unsere Arbeit ist konzeptuell in der Wurzel, strategisch in der Führung und von Händen ausgeführt, die das Ganze sehen. Wir formen Marken, gestalten Websites und bauen Erlebnisse.",
    projTop: "Ein Projekt?", projReveal: "Ein Briefing starten", learnTop: "Mehr erfahren", servReveal: "Unsere Leistungen: {x}",
    cursorProject: "Projekt ansehen", detailTitle: "Die Leistungen im Detail",
    detailDesc: "Marken, getragen von präzisem Design und Ideen, die bleiben.",
    talkTop: "Reden wir", talkReveal: "Schreiben Sie uns",
    reperesTitle: "Anhaltspunkte", reperesDesc: "Was unter den Versprechen trägt: ein Ort, ein Handwerk, ein Terrain.",
    readerAria: "Journal-Artikel", closeAria: "Schliessen",
    minRead: "Min. Lesezeit", loading: "Laden",
    nextPage: "Nächste Seite", footerHead: "Wir freuen uns auf Ihre Nachricht. Arbeiten wir zusammen.",
    contactTop: "Kontakt", contactReveal: "Schreiben Sie uns",
    colBiz: "Geschäftsanfragen", colJobs: "Bewerbungen", colCity: "Genf", colHours: "Zeiten",
    hoursDays: "Montag bis Freitag", country: "Schweiz", backTop: "Nach oben",
    etudesLink: "Fallstudien", privacyLink: "Datenschutz", termsLink: "Bedingungen",
    skipLink: "Zum Inhalt springen",
  },
  it: {
    navAria: "Navigazione principale", logoAria: "ABiL MEDiAS, home", langsAria: "Lingue", menuAria: "Menu",
    menu: "Menu +", fermer: "Chiudi", accueil: "Home",
    heroTag: ["Davvero", "Abili."],
    lrgAlt: "ABiL MEDiAS, l'atelier al lavoro",
    filtre: "Filtro:", tous: "Tutti", grille: "Griglia", liste: "Lista", viewAria: "Vista",
    accPlus: "Più +", accMoins: "Meno -",
    jTitleLead: "Il", jTitleIt: "Giornale", jSub1: "Sguardi di creazione", jSub2: "Prospettive di marca",
    jPara: "Un quaderno aperto sulla vita dell'atelier: idee fresche su brand, design utile e su come restare leggibili in un paesaggio che cambia senza preavviso.",
    trier: "Ordina:", recents: "Recenti", anciens: "Vecchi", article: "Articolo", readArticle: "Leggi l'articolo", cursorRead: "Leggi",
    cTitle: "Contatti", fNom: "Nome*", fEmail: "Email*", fSujet: "Oggetto*", fTel: "Telefono", fMsg: "Messaggio*",
    topicAutre: "Altro", submitTop: "Invia", submitReveal: "Inviaci il tuo messaggio",
    merci: "Grazie!", sentMsg: "Il vostro messaggio è partito. Vi rispondiamo entro due giorni lavorativi.",
    againTop: "Nuovo messaggio", againReveal: "Inviare un altro messaggio",
    errRequired: "Questo campo è obbligatorio.",
    errEmailSpace: "L'indirizzo non può contenere spazi.",
    errEmailAt: "L'indirizzo deve contenere una @.",
    errEmailLocal: "Manca il nome prima della @.",
    errEmailDomain: "Manca il dominio dopo la @.",
    errEmailDot: "Il dominio deve contenere un punto.",
    errEmailTld: "La terminazione del dominio è troppo corta.",
    errEmailChar: "L'indirizzo contiene un carattere che non passa.",
    errEmailDouble: "L'indirizzo contiene due punti di seguito.",
    errTopic: "Scegliete almeno un oggetto.",
    errPhone: "Questo numero non sembra completo.",
    errMsgShort: "Messaggio troppo corto: 20 caratteri minimo.",
    errForm: "Il modulo non è ancora completo.",
    sending: "Invio...", sendingMsg: "Il vostro messaggio parte verso l'atelier.",
    errNetTitle: "Invio impossibile.",
    errNet: "La connessione è fallita. Riprovate, oppure aprite la posta: nulla va perso.",
    retryTop: "Riprova", retryReveal: "Inviare di nuovo",
    mailReveal: "Aprire la mia posta",
    removeAria: "Togliere", countryAria: "Prefisso del paese", honey: "Commenti",
    cDesc: "Crediamo nella forza dei brand ben condotti e amiamo collaborare con chi condivide questa esigenza. Parliamone.",
    sHero: "Idee trasformate in esperienze di marca vive", sSub1: "Creatività dichiarata", sSub2: "Soluzioni concrete",
    sP1: "In un mercato saturo, il corretto non basta più. Puntiamo a un'esigenza completa in ogni tappa del processo: risposte che superano la richiesta e aprono possibilità che il brand non sospettava.",
    sP2: "Il nostro lavoro è concettuale alla radice, strategico nella conduzione ed eseguito da mani che vedono l'insieme. Modelliamo brand, disegniamo siti e costruiamo esperienze.",
    projTop: "Un progetto?", projReveal: "Avviare un briefing", learnTop: "Scopri di più", servReveal: "I nostri servizi {x}",
    cursorProject: "Vedi il progetto", detailTitle: "I servizi nel dettaglio",
    detailDesc: "Marchi elevati da un design esigente e idee che durano.",
    talkTop: "Parliamone", talkReveal: "Scrivici",
    reperesTitle: "Riferimenti", reperesDesc: "Ciò che regge sotto le promesse: un luogo, un mestiere, un terreno.",
    readerAria: "Articolo del journal", closeAria: "Chiudi",
    minRead: "min di lettura", loading: "Caricamento",
    nextPage: "Pagina successiva", footerHead: "Ci farebbe piacere leggervi. Lavoriamo insieme.",
    contactTop: "Contattaci", contactReveal: "Scrivici",
    colBiz: "Richieste professionali", colJobs: "Candidature", colCity: "Ginevra", colHours: "Orari",
    hoursDays: "Dal lunedì al venerdì", country: "Svizzera", backTop: "Torna su",
    etudesLink: "Casi studio", privacyLink: "Privacy", termsLink: "Condizioni",
    skipLink: "Vai al contenuto",
  },
};





function useReveal(a?: unknown, b?: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".v3p-io:not(.in)"));
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".v3p-io").forEach((n) => n.classList.add("in"));
      return;
    }






    const desrecortarNoFim = (el: HTMLElement) => {
      let fim = 1400;
      el.querySelectorAll<HTMLElement>(".v3p-w,.v3p-rise").forEach((n) => {
        const cs = getComputedStyle(n);
        fim = Math.max(fim, ((parseFloat(cs.transitionDuration) || 0) + (parseFloat(cs.transitionDelay) || 0)) * 1000);
      });
      window.setTimeout(() => el.classList.add("unclip"), fim + 120);
    };
    const liga = (el: HTMLElement) => { el.classList.add("in"); desrecortarNoFim(el); };
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) { liga(en.target as HTMLElement); io.unobserve(en.target); }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));



    const jaAVista = window.requestAnimationFrame(() => {
      const vh = window.innerHeight;
      for (const el of els) {
        if (el.classList.contains("in")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) { liga(el); io.unobserve(el); }
      }
    });
    return () => { window.cancelAnimationFrame(jaAVista); io.disconnect(); };
  }, [a, b]);
}


function WordsP({ text, base, step }: { text: string[]; base: number; step: number }) {
  return (
    <>
      {text.map((w, i) => (
        <span className="v3p-wm" key={i}>
          <span className="v3p-w" style={{ "--d": `${base + i * step}s` } as React.CSSProperties}>{w}&nbsp;</span>
        </span>
      ))}
    </>
  );
}
function RiseP({ children, d }: { children: React.ReactNode; d: number }) {
  return (
    <span className="v3p-rm"><span className="v3p-rise" style={{ "--d": `${d}s` } as React.CSSProperties}>{children}</span></span>
  );
}







function PillP({ top, reveal, onClick, submit, disabled, edTop, edReveal }: { top: string; reveal: string; onClick?: () => void; submit?: boolean; disabled?: boolean; edTop?: string; edReveal?: string }) {

  const destino = edTop ? edCfg(`${edTop}.href`, "") : "";
  const novaAba = edTop ? edCfg(`${edTop}.hrefNova`, "") === "1" : false;
  const irPara = () => {
    if (!destino) { onClick?.(); return; }
    const externo = /^https?:\/\//i.test(destino);
    if (novaAba || externo) window.open(destino, novaAba ? "_blank" : "_self", "noopener,noreferrer");
    else window.location.assign(destino);
  };
  const topRef = useRef<HTMLSpanElement | null>(null);
  const hidRef = useRef<HTMLSpanElement | null>(null);
  const [diff, setDiff] = useState(0);
  useLayoutEffect(() => {
    let alive = true;
    const measure = () => {
      const a = topRef.current, b = hidRef.current;
      if (!alive || !a || !b) return;
      const d = Math.max(0, Math.round(b.getBoundingClientRect().width - a.getBoundingClientRect().width));
      setDiff((prev) => (prev === d ? prev : d));

      const btn = a.closest("button") as HTMLElement | null;
      if (btn) {
        const dot = Math.max(18, btn.offsetHeight - 8);
        btn.style.setProperty("--cut", `${Math.max(0, btn.offsetWidth - dot)}px`);
      }
    };
    measure();
    let tid = 0;
    const onResize = () => { window.clearTimeout(tid); tid = window.setTimeout(measure, 150); };
    window.addEventListener("resize", onResize);
    if (typeof document !== "undefined" && document.fonts) document.fonts.ready.then(measure).catch(() => {  });
    return () => { alive = false; window.clearTimeout(tid); window.removeEventListener("resize", onResize); };
  }, [top, reveal]);
  return (
    <button className="v3p-btn" type={submit ? "submit" : "button"} onClick={irPara} disabled={disabled}
      style={{ "--diff": `${diff}px` } as React.CSSProperties}>
      <span className="v3p-btn-in">
        <span className="v3p-mask v3p-mask-bottom"><span className="v3p-btn-t" data-ed={edReveal}>{reveal}</span></span>
        <span className="v3p-mask v3p-mask-top"><span className="v3p-btn-t" ref={topRef} data-ed={edTop}>{top}</span></span>
        {
                                                                                       }
        <span className="v3p-mask v3p-mask-hidden" aria-hidden="true">
          <span className="v3p-btn-sizer">
            <span className="v3p-btn-t">{top}</span>
            <span className="v3p-btn-t" ref={hidRef}>{reveal}</span>
          </span>
        </span>
      </span>
    </button>
  );
}



function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}



function useDismiss(open: boolean, ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    let tid = 0;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
    const onScroll = () => { window.clearTimeout(tid); tid = window.setTimeout(close, 200); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(tid);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, ref, close]);
}











function ServCaseVisual({ poster, posterEd, video, videoEd, alt, eager }: {
  poster: string; posterEd?: string; video: string; videoEd: string; alt: string; eager: boolean;
}) {
  const [falhou, setFalhou] = useState(false);
  const usaVideo = Boolean(video) && !falhou;
  const liga = (el: HTMLVideoElement | null) => {
    if (!el) return;
    el.muted = true;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {  });
  };
  if (!usaVideo) {
    return <img src={poster} data-ed={posterEd} alt={alt} loading={eager ? "eager" : "lazy"} />;
  }
  return (
    <video
      data-ed={videoEd} src={video} poster={poster} autoPlay muted loop playsInline
      preload="metadata" aria-label={alt} ref={liga}
      onCanPlay={(e) => liga(e.currentTarget)}
      onError={() => setFalhou(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}



function CapaCartao({ src, alt, ed, eager }: { src: string; alt: string; ed?: string; eager?: boolean }) {
  const video = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
  const estilo: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
  if (!video) return <img src={src} data-ed={ed} alt={alt} loading={eager ? "eager" : "lazy"} style={estilo} />;
  return <video src={src} data-ed={ed} autoPlay muted loop playsInline preload="metadata" aria-label={alt} style={estilo}
    ref={(el) => { if (el) { el.muted = true; const p = el.play(); if (p && p.catch) p.catch(() => {  }); } }} />;
}

function LargeVisualP({ src, alt, video, edImg, edVideo }: { src: string; alt: string; video?: string; edImg?: string; edVideo?: string }) {



  const liga = (el: HTMLVideoElement | null) => {
    if (el) { el.muted = true; if (el.paused) el.play().catch(() => {}); }
  };
  return (
    <div className="v3p-lrg v3p-io">
      <div className="v3p-lrg-box">
        <div className="v3p-lrg-up">
          {video ? (
            <video className="v3p-lrg-img" data-ed={edVideo} src={video} poster={src} autoPlay muted loop playsInline
              preload="metadata" aria-label={alt} ref={liga}
              onCanPlay={(e) => liga(e.currentTarget)} />
          ) : (
            <img className="v3p-lrg-img" data-ed={edImg} src={src} alt={alt} loading="lazy" />
          )}
        </div>
      </div>
    </div>
  );
}






function RelogioZurich({ lang }: { lang: AbilLang }) {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    const tick = () => setHora(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <li className="v3p-xs"><span data-ed="v3.ui.shell.hor3">{edTxt(lang, "v3.ui.shell.hor3", "GMT (+1) -", 160)}</span> {hora}</li>;
}




const ORG_LBL: Record<"btn" | "hint" | "save" | "cancel" | "okCloud" | "soLocal", L5> = {
  btn: { fr: "Organiser les pages", en: "Organize pages", pt: "Organizar páginas", de: "Seiten ordnen", it: "Organizza le pagine" },
  hint: { fr: "Glissez pour réordonner", en: "Drag to reorder", pt: "Arraste para reordenar", de: "Zum Ordnen ziehen", it: "Trascina per riordinare" },
  save: { fr: "Enregistrer", en: "Save", pt: "Guardar", de: "Speichern", it: "Salva" },
  cancel: { fr: "Annuler", en: "Cancel", pt: "Cancelar", de: "Abbrechen", it: "Annulla" },
  okCloud: { fr: "Publié en ligne", en: "Published live", pt: "Publicado na nuvem", de: "Online veröffentlicht", it: "Pubblicato online" },
  soLocal: { fr: "Enregistré seulement dans ce navigateur", en: "Saved only in this browser", pt: "Gravado só neste browser", de: "Nur in diesem Browser gespeichert", it: "Salvato solo in questo browser" },
};


const ORG_CAPSULA: React.CSSProperties = {
  background: NOIR, color: CITRON, border: `1px solid ${NOIR}`, borderRadius: 999,
  padding: "10px 22px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em",
  lineHeight: 1, cursor: "pointer",
};

type OrgItem = { slug: string; title: string; img: string };
function OrganizarPaginasP({ lang, works }: { lang: AbilLang; works: OrgItem[] }) {
  const [aberto, setAberto] = useState(false);
  const [ordem, setOrdem] = useState<OrgItem[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const avisoTid = useRef(0);
  useBodyLock(aberto);

  useEffect(() => {
    if (!aberto) return;
    try { window.dispatchEvent(new CustomEvent("abil:lenis", { detail: { pause: true } })); } catch {  }
    return () => { try { window.dispatchEvent(new CustomEvent("abil:lenis", { detail: { pause: false } })); } catch {  } };
  }, [aberto]);
  useEffect(() => () => window.clearTimeout(avisoTid.current), []);
  const abrir = () => {

    setOrdem(works.map((w) => ({ slug: w.slug, title: w.title, img: edSrc(`v3.work.${w.slug}.img`, w.img) })));
    setDragIdx(null); setOverIdx(null); setAberto(true);
  };

  const largar = (alvo: number) => {
    if (dragIdx !== null && dragIdx !== alvo) {
      setOrdem((prev) => { const arr = [...prev]; const [mov] = arr.splice(dragIdx, 1); arr.splice(alvo, 0, mov); return arr; });
    }
    setDragIdx(null); setOverIdx(null);
  };
  const mostrarAviso = (msg: string) => {
    setAviso(msg);
    window.clearTimeout(avisoTid.current);
    avisoTid.current = window.setTimeout(() => setAviso(null), 3000);
  };
  const guardar = () => {
    gravarEdicaoLocal({ "v3.projets.order": ordem.map((o) => o.slug).join(",") });
    setAberto(false);

    void publicarEdicoesNuvem().then((ok) => mostrarAviso(ok ? ORG_LBL.okCloud[lang] : ORG_LBL.soLocal[lang]));
  };
  return (
    <>
      <div className="v3p-margin" style={{ marginBottom: "1.4vw" }}>
        <button type="button" style={ORG_CAPSULA} onClick={abrir}>{ORG_LBL.btn[lang]}</button>
      </div>
      {aberto ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,11,.6)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setAberto(false)}>
          <div style={{ background: ALPIN, border: `1px solid ${NOIR}`, maxWidth: 880, width: "100%", maxHeight: "86vh", overflowY: "auto", padding: 24 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: NOIR }}>{ORG_LBL.btn[lang]}</strong>
              <span style={{ fontSize: 11, color: RHONE }}>{ORG_LBL.hint[lang]}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
              {ordem.map((o, i) => (
                <div key={o.slug} draggable
                  onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", o.slug); }}
                  onDragOver={(e) => { e.preventDefault(); if (overIdx !== i) setOverIdx(i); }}
                  onDrop={(e) => { e.preventDefault(); largar(i); }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  style={{ position: "relative", cursor: "grab", opacity: dragIdx === i ? 0.5 : 1, outline: overIdx === i && dragIdx !== null && dragIdx !== i ? `2px solid ${CITRON}` : "none", outlineOffset: 2 }}>
                  <span style={{ position: "absolute", top: 6, left: 6, zIndex: 1, background: NOIR, color: CITRON, borderRadius: 999, minWidth: 22, height: 22, padding: "0 6px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1 }}>{i + 1}</span>
                  <MediaCapa src={o.img} alt={o.title} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                  <span style={{ display: "block", marginTop: 6, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: NOIR }}>{o.title}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" style={{ ...ORG_CAPSULA, background: ALPIN, color: NOIR }} onClick={() => setAberto(false)}>{ORG_LBL.cancel[lang]}</button>
              <button type="button" style={ORG_CAPSULA} onClick={guardar}>{ORG_LBL.save[lang]}</button>
            </div>
          </div>
        </div>
      ) : null}
      {aviso ? (
        <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: NOIR, color: CITRON, borderRadius: 999, padding: "10px 22px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", lineHeight: 1, whiteSpace: "nowrap" }}>{aviso}</div>
      ) : null}
    </>
  );
}


function ProjetsBody({ lang, onNav }: { lang: AbilLang; onNav: (p: string) => void }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<TagKey | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [hovView, setHovView] = useState<number | null>(null);
  const [sizeTick, setSizeTick] = useState(0);
  useReveal(view, filter);
  const t = edUi(lang, "v3.ui.pages", UIP[lang]);



  const pubs = usePublicados();
  const BASE = pubs ?? WORKSP;
  const emEdicao = useModoEdicao();




  const ordemManual = edCfg("v3.projets.order", "").split(",").map((s) => s.trim()).filter(Boolean);
  const CATALOGO = ordemManual.length
    ? [
        ...BASE.filter((w) => ordemManual.includes(w.slug)).sort((a, b) => ordemManual.indexOf(a.slug) - ordemManual.indexOf(b.slug)),
        ...BASE.filter((w) => !ordemManual.includes(w.slug)),
      ]
    : BASE;
  const cats = Array.from(new Set(CATALOGO.flatMap((w) => w.tags)));
  const shown = filter ? CATALOGO.filter((w) => w.tags.includes(filter)) : CATALOGO;






  const filterRef = useRef<HTMLDivElement | null>(null);
  const dropInner = useRef<HTMLDivElement | null>(null);
  const dropBox = useRef<HTMLDivElement | null>(null);
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  useDismiss(filterOpen, filterRef, closeFilter);
  useLayoutEffect(() => {
    const b = dropBox.current, i = dropInner.current;
    if (b) b.style.height = filterOpen && i ? `${i.scrollHeight}px` : "0px";
  }, [filterOpen, lang]);


  const toggleRef = useRef<HTMLDivElement | null>(null);
  const [pill, setPill] = useState({ x: 0, w: 0 });
  const activeView = view === "grid" ? 0 : 1;
  const litView = hovView ?? activeView;
  useLayoutEffect(() => {
    const wrap = toggleRef.current;
    if (!wrap) return;
    const btn = wrap.querySelectorAll<HTMLElement>(".v3p-switch")[litView];
    if (!btn) return;
    setPill((p) => (p.x === btn.offsetLeft && p.w === btn.offsetWidth ? p : { x: btn.offsetLeft, w: btn.offsetWidth }));
  }, [litView, lang, sizeTick]);
  useEffect(() => {
    let tid = 0;
    const onResize = () => { window.clearTimeout(tid); tid = window.setTimeout(() => setSizeTick((n) => n + 1), 150); };
    window.addEventListener("resize", onResize);
    return () => { window.clearTimeout(tid); window.removeEventListener("resize", onResize); };
  }, []);



  const gridRef = useRef<HTMLDivElement | null>(null);
  const flipRef = useRef<Map<string, DOMRect>>(new Map());
  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const captureFlip = () => {
    if (reduced()) return;
    const m = new Map<string, DOMRect>();
    gridRef.current?.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      if (el.dataset.flip) m.set(el.dataset.flip, el.getBoundingClientRect());
    });
    flipRef.current = m;
  };
  useLayoutEffect(() => {
    const old = flipRef.current;
    flipRef.current = new Map();
    if (!old.size || reduced()) return;
    const els = Array.from(gridRef.current?.querySelectorAll<HTMLElement>("[data-flip]") ?? []);
    for (const el of els) {
      const key = el.dataset.flip ?? "";
      const prev = old.get(key);
      const next = el.getBoundingClientRect();
      if (!prev) {
        el.style.transition = "none";
        el.style.opacity = "0";
        requestAnimationFrame(() => { el.style.transition = "opacity .5s cubic-bezier(.4,.4,.1,1)"; el.style.opacity = "1"; });
        continue;
      }
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (!dx && !dy) continue;
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform .5s cubic-bezier(.4,.4,.1,1)";
        el.style.transform = "";
      });
    }
  }, [filter]);
  const pickFilter = (c: TagKey | null) => { captureFlip(); setFilter(c); setFilterOpen(false); };

  return (
    <section className="v3p-io">
      {                                                                    }
      <div className="v3p-workhead v3p-margin">
        <div className="v3p-workhead-title">
          {                                                                                       }
          <h1 className="v3p-xl"><span data-ed="v3.projets.hero.title"><WordsP text={[edTxt(lang, "v3.projets.hero.title", navLabel("projets", lang), 160)]} base={0.1} step={0.06} /></span></h1>
          <span className="v3p-worknum v3p-s"><RiseP d={0.2}>{String(shown.length)}</RiseP></span>
        </div>
        <div className="v3p-filterwrap v3p-xs" ref={filterRef}>
          <RiseP d={0.3}>
            <span className="v3p-grey"><span data-ed="v3.ui.pages.filtre">{t.filtre}</span>&nbsp;</span>
            <button type="button" className="v3p-lnk" aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)}>
              {filter ? <span>{TAGS[filter][lang]}</span> : <span data-ed="v3.ui.pages.tous">{t.tous}</span>}&nbsp;{filterOpen ? "-" : "+"}
            </button>
          </RiseP>
          <div className={`v3p-dropdown${filterOpen ? " open" : ""}`} ref={dropBox}>
            <div ref={dropInner}>
              <button type="button" className="v3p-droplabel v3p-xs" onClick={() => pickFilter(null)}>
                <span data-ed="v3.ui.pages.tous">{t.tous}</span> [{CATALOGO.length}]
              </button>
              {cats.map((c) => (
                <button key={c} type="button" className="v3p-droplabel v3p-xs" onClick={() => pickFilter(c)}>
                  {TAGS[c][lang]} [{CATALOGO.filter((w) => w.tags.includes(c)).length}]
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="v3p-viewtoggle v3p-xxs" role="tablist" aria-label={t.viewAria} ref={toggleRef}
          onMouseLeave={() => setHovView(null)}>
          <span className="v3p-hoverpill" aria-hidden="true" style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
          <button type="button" role="tab" aria-selected={view === "grid"} className={`v3p-switch${litView === 0 ? " lit" : ""}`}
            onMouseEnter={() => setHovView(0)} onClick={() => setView("grid")}><span data-ed="v3.ui.pages.grille">{t.grille}</span></button>
          <button type="button" role="tab" aria-selected={view === "list"} className={`v3p-switch${litView === 1 ? " lit" : ""}`}
            onMouseEnter={() => setHovView(1)} onClick={() => setView("list")}><span data-ed="v3.ui.pages.liste">{t.liste}</span></button>
        </div>
      </div>

      {                                                                           }

      {                                                                }
      {emEdicao ? <OrganizarPaginasP lang={lang} works={CATALOGO} /> : null}

      {view === "grid" ? (
        <div className="v3p-workgrid v3p-io" ref={gridRef}>
          <div className="v3p-bordv" style={{ "--d": ".8s" } as React.CSSProperties} />
          <div className="v3p-works">
            {
                                           }
            {shown.map((w, wi) => {


              const anim = wi < 4;

              const capa = edSrc(`v3.work.${w.slug}.img`, w.img);
              return (
              <button type="button" key={w.title} data-flip={w.title} className={`v3p-work${anim ? " v3p-io" : ""}`} data-v3hover={t.cursorProject} onClick={() => onNav(`projets/${w.slug}`)}>
                <div className="v3p-work-visual">
                  {anim ? (
                    <div className="v3p-imgfx" style={{ "--d": `${0.15 + (wi % 2) * 0.1}s`, width: "100%", height: "100%" } as React.CSSProperties}>
                      <CapaCartao src={capa} ed={`v3.work.${w.slug}.img`} alt={w.title} eager={wi === 0} />
                    </div>
                  ) : (
                    <CapaCartao src={capa} ed={`v3.work.${w.slug}.img`} alt={w.title} />
                  )}
                </div>
                <div className="v3p-work-info">
                  <div className="v3p-work-meta v3p-xxs">
                    {w.tags.map((tg, ti) => (
                      anim ? (
                        <RiseP d={0.3 + ti * 0.05} key={tg}>
                          <span>{TAGS[tg][lang]}</span>
                          {ti < w.tags.length - 1 ? <span className="v3p-work-dash">-</span> : null}
                        </RiseP>
                      ) : (
                        <span key={tg}>
                          <span>{TAGS[tg][lang]}</span>
                          {ti < w.tags.length - 1 ? <span className="v3p-work-dash">-</span> : null}
                        </span>
                      )
                    ))}
                  </div>
                  <h3 className="v3p-work-title v3p-m">{(() => { const nome = nomeCaso(w.slug, lang, w.title); return anim ? <WordsP text={nome.split(" ")} base={0.4} step={0.06} /> : nome; })()}</h3>
                  {

                                                           }
                  <div className={`v3p-work-line${wi % 2 === 0 ? " rev" : ""}`}>
                    <div className={`v3p-fillw${wi > 3 ? " filled" : ""}`} style={{ "--d": ".55s" } as React.CSSProperties} />
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="v3p-worklist">
          {shown.map((w) => (
            <div key={w.title} className="v3p-listrow">
              <button type="button" className="v3p-listhead" aria-expanded={openRow === w.title}
                onClick={() => setOpenRow(openRow === w.title ? null : w.title)}>
                <span className="v3p-xs">{w.title}</span>
                <span className="v3p-xxs v3p-listtags">{w.tags.map((tg) => TAGS[tg][lang]).join(" - ")}</span>
                <span className="v3p-xxs v3p-listyear">{w.year}</span>
              </button>
              <div className={`v3p-acc${openRow === w.title ? " open" : ""}`} aria-hidden={openRow !== w.title}>
                <div>
                  <div className="v3p-liststrip">
                    {[w.img, ...w.extra].map((src, si) => (
                      <button type="button" key={src} className="v3p-listslide" data-v3hover={t.cursorProject}
                        tabIndex={openRow === w.title ? 0 : -1} onClick={() => onNav(`projets/${w.slug}`)}>
                        {

                                                                            }
                        <MediaCapa src={edSrc(si === 0 ? `v3.work.${w.slug}.img` : `v3.work.${w.slug}.g${si}`, src)} ed={si === 0 ? `v3.work.${w.slug}.img` : `v3.work.${w.slug}.g${si}`} alt={`${w.title} ${si + 1}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {
                                                                                        }
              <div className={`v3p-rowline${openRow === w.title ? " on" : ""}`}><i /></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


function JournalBody({ lang, onNav }: { lang: AbilLang; onNav: (p: string) => void }) {
  const [recent, setRecent] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);



  const jornal = useJornal();
  const CATALOGO = jornal ?? ABIL_POSTS;
  const t = edUi(lang, "v3.ui.pages", UIP[lang]);




  const list = [...CATALOGO].sort((a, b) => {
    const d = recent ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    if (d !== 0) return d;
    const ia = CATALOGO.indexOf(a), ib = CATALOGO.indexOf(b);
    return recent ? ia - ib : ib - ia;
  });
  useReveal(recent);



  const sortRef = useRef<HTMLDivElement | null>(null);
  const sortInner = useRef<HTMLDivElement | null>(null);
  const sortBox = useRef<HTMLDivElement | null>(null);
  const closeSort = useCallback(() => setSortOpen(false), []);
  useDismiss(sortOpen, sortRef, closeSort);
  useLayoutEffect(() => {
    const b = sortBox.current, i = sortInner.current;
    if (b) b.style.height = sortOpen && i ? `${i.scrollHeight}px` : "0px";
  }, [sortOpen, lang]);
  const pickSort = (v: boolean) => { setRecent(v); setSortOpen(false); };

  return (
    <section>
      {                                                                           }
      <div className="v3p-newshead v3p-margin v3p-io">
        <h1 className="v3p-newstitle v3p-xl">
          <span data-ed="v3.ui.pages.jTitleLead"><WordsP text={[t.jTitleLead]} base={0.15} step={0.05} /></span>
          <span className="v3p-wm"><span className="v3p-w v3p-it" data-ed="v3.ui.pages.jTitleIt" style={{ "--d": ".22s" } as React.CSSProperties}>{t.jTitleIt}</span></span>
        </h1>
        <div className="v3p-newssub v3p-xs">
          <RiseP d={1.0}><span data-ed="v3.ui.pages.jSub1">{t.jSub1}</span></RiseP>
          <RiseP d={1.1}><span data-ed="v3.ui.pages.jSub2">{t.jSub2}</span></RiseP>
        </div>
        <p className="v3p-newsp v3p-p v3p-fadeup" data-ed="v3.ui.pages.jPara" style={{ "--d": ".4s" } as React.CSSProperties}>{t.jPara}</p>
        <div className="v3p-newssort v3p-xs" ref={sortRef}>
          <RiseP d={0.5}>
            <span className="v3p-grey"><span data-ed="v3.ui.pages.trier">{t.trier}</span>&nbsp;</span>
            <button type="button" className="v3p-lnk" aria-expanded={sortOpen} onClick={() => setSortOpen((v) => !v)}>
              <span data-ed={recent ? "v3.ui.pages.recents" : "v3.ui.pages.anciens"}>{recent ? t.recents : t.anciens}</span>&nbsp;{sortOpen ? "-" : "+"}
            </button>
          </RiseP>
          <div className={`v3p-dropdown${sortOpen ? " open" : ""}`} ref={sortBox}>
            <div ref={sortInner}>
              <button type="button" className="v3p-droplabel v3p-xs" onClick={() => pickSort(true)}><span data-ed="v3.ui.pages.recents">{t.recents}</span></button>
              <button type="button" className="v3p-droplabel v3p-xs" onClick={() => pickSort(false)}><span data-ed="v3.ui.pages.anciens">{t.anciens}</span></button>
            </div>
          </div>
        </div>
      </div>
      <div className="v3p-newswrap v3p-margin v3p-io">
        {                                                                            }
        <div className="v3p-newsbordh" aria-hidden="true"><div className="v3p-fillw" style={{ "--d": "1.2s" } as React.CSSProperties} /></div>
        {list.map((p, ai) => (
          <article className="v3p-article" key={p.slug} data-v3hover={t.cursorRead} onClick={() => onNav(`journal/${p.slug}`)}>
            <div className="v3p-article-img">
              {                                                                         }
              <div className="v3p-imgfx" style={{ "--d": `${ai < 2 ? 1.1 + ai * 0.1 : 0.15}s` } as React.CSSProperties}>
                <img src={edSrc(`v3.post.${p.slug}.cover`, postImg(p.slug))} data-ed={`v3.post.${p.slug}.cover`} alt="" loading={ai < 2 ? "eager" : "lazy"} />
              </div>
            </div>
            <div className="v3p-article-info">
              <div>
                <div className="v3p-article-meta v3p-xs">
                  <RiseP d={ai < 2 ? 1.45 : 0.2}><span>{p.tag[lang]}</span><span className="v3p-grey">&nbsp;•&nbsp;</span></RiseP>
                  <RiseP d={(ai < 2 ? 1.45 : 0.2) + 0.05}><span>{fmtPostDate(p.date, lang)}</span><span className="v3p-grey">&nbsp;•&nbsp;</span></RiseP>
                  <RiseP d={(ai < 2 ? 1.45 : 0.2) + 0.1}><span>{readingMinutes(p, lang)} <span data-ed="v3.ui.pages.minRead">{t.minRead}</span></span></RiseP>
                </div>
                <h2 className="v3p-article-title v3p-s"><WordsP text={p.title[lang].split(" ")} base={0.2} step={0.03} /></h2>
              </div>
              {                                                                             }
              <button type="button" className="v3p-xs v3p-lnk v3p-artlink"
                onClick={(e) => { e.stopPropagation(); onNav(`journal/${p.slug}`); }}><span data-ed="v3.ui.pages.readArticle">{t.readArticle}</span></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}





function checkEmail(v: string, t: UIPStrings): string {
  const s = v.trim();
  if (!s) return t.errRequired;
  if (/\s/.test(s)) return t.errEmailSpace;
  if (!s.includes("@")) return t.errEmailAt;
  const parts = s.split("@");
  if (parts.length !== 2) return t.errEmailAt;
  if (!parts[0]) return t.errEmailLocal;
  if (!parts[1]) return t.errEmailDomain;
  if (!parts[1].includes(".")) return t.errEmailDot;
  if (s.includes("..")) return t.errEmailDouble;
  if ((parts[1].split(".").pop() ?? "").length < 2) return t.errEmailTld;
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(s)) return t.errEmailChar;
  if (s.length > 254) return t.errEmailChar;
  return "";
}
type FieldKey = "nom" | "email" | "topics" | "tel" | "msg";
type FormVals = { nom: string; email: string; tel: string; msg: string; honey: string };

function ContactBody({ lang }: { lang: AbilLang }) {
  const t = edUi(lang, "v3.ui.pages", UIP[lang]);
  const [vals, setVals] = useState<FormVals>({ nom: "", email: "", tel: "", msg: "", honey: "" });
  const [topics, setTopics] = useState<string[]>([]);
  const [errs, setErrs] = useState<Partial<Record<FieldKey, string>>>({});
  const [topicOpen, setTopicOpen] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [dial, setDial] = useState(COUNTRIES[0]);



  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formBad, setFormBad] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);


  const options = [...SERVICES.map((s, i) => edTxt(lang, `v3.service.${SERV_SLUGS[i]}.name`, s.name[lang], 160)), t.topicAutre];



  const emailTxt = edTxt(lang, "v3.ui.shell.email", CONTACT_MAIL, 160);
  const telTxt = edTxt(lang, "v3.ui.shell.tel", "+41 22 548 00 40", 160);
  const emailHref = edSrc("v3.contact.email.href", `mailto:${emailTxt}`);
  const telHref = edSrc("v3.contact.tel.href", `tel:${telTxt.replace(/[^+\d]/g, "")}`);


  const topicRef = useRef<HTMLDivElement | null>(null);
  const topicInner = useRef<HTMLDivElement | null>(null);
  const topicBox = useRef<HTMLDivElement | null>(null);
  const closeTopic = useCallback(() => setTopicOpen(false), []);
  useDismiss(topicOpen, topicRef, closeTopic);
  useLayoutEffect(() => {
    const b = topicBox.current, i = topicInner.current;
    if (b) b.style.height = topicOpen && i ? `${i.scrollHeight}px` : "0px";
  }, [topicOpen, lang]);
  const dialRef = useRef<HTMLDivElement | null>(null);
  const closeDial = useCallback(() => setDialOpen(false), []);
  useDismiss(dialOpen, dialRef, closeDial);

  const check = (k: FieldKey, v: FormVals = vals, tp: string[] = topics): string => {
    if (k === "nom") return !v.nom.trim() ? t.errRequired : v.nom.trim().length < 2 ? t.errRequired : "";
    if (k === "email") return checkEmail(v.email, t);
    if (k === "topics") return tp.length === 0 ? t.errTopic : "";
    if (k === "tel") return !v.tel.trim() ? "" : v.tel.replace(/\D/g, "").length < 6 ? t.errPhone : "";
    return !v.msg.trim() ? t.errRequired : v.msg.trim().length < 20 ? t.errMsgShort : "";
  };
  const blur = (k: FieldKey) => setErrs((e) => ({ ...e, [k]: check(k) }));
  const setVal = (k: keyof FormVals, v: string) => {
    setVals((p) => ({ ...p, [k]: v }));
    setErrs((e) => (e[k as FieldKey] ? { ...e, [k]: "" } : e));
    setFormBad(false);
  };
  const toggleTopic = (tp: string) => {
    const next = topics.includes(tp) ? topics.filter((x) => x !== tp) : [...topics, tp];
    setTopics(next);
    setFormBad(false);
    setErrs((e) => ({ ...e, topics: next.length ? "" : e.topics }));
  };

  const mailHref = () => {
    const body = [
      `${t.fNom.replace("*", "")}: ${vals.nom}`,
      `${t.fEmail.replace("*", "")}: ${vals.email}`,
      `${t.fSujet.replace("*", "")}: ${topics.join(", ")}`,
      vals.tel.trim() ? `${t.fTel}: ${dial.dial} ${vals.tel}` : "",
      "",
      vals.msg,
    ].filter(Boolean).join("\n");
    return `${emailHref}?subject=${encodeURIComponent(`${t.cTitle}: ${vals.nom}`)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keys: FieldKey[] = ["nom", "email", "topics", "tel", "msg"];
    const next: Partial<Record<FieldKey, string>> = {};
    for (const k of keys) next[k] = check(k);
    setErrs(next);
    const bad = keys.find((k) => next[k]);
    if (bad) {


      setFormBad(true);
      const el = formRef.current?.querySelector<HTMLElement>(`[data-f="${bad}"]`);
      el?.focus();
      return;
    }
    setFormBad(false);
    if (vals.honey.trim()) { setState("sent"); return; }
    setState("sending");
    try {
      const r = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },


        body: JSON.stringify({
          name: vals.nom.trim(),
          email: vals.email.trim(),
          message: vals.msg.trim(),
          topics,
          phone: vals.tel.trim() ? `${dial.dial} ${vals.tel.trim()}` : "",
          lang,
          source: "v3-contact",
        }),
      });
      setState(r.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  const reset = () => {
    setVals({ nom: "", email: "", tel: "", msg: "", honey: "" });
    setTopics([]); setErrs({}); setState("idle"); setFormBad(false);
  };

  return (
    <section className="v3p-contact v3p-margin v3p-io">
      <h1 className="v3p-contact-title v3p-l"><span data-ed="v3.ui.pages.cTitle"><WordsP text={[t.cTitle]} base={0.1} step={0.06} /></span></h1>

      {                                                             }
      <div className="v3p-contact-form">
        {state === "idle" || state === "sending" ? (
          <form className="v3p-form" ref={formRef} noValidate onSubmit={submit}>
            {formBad ? <div className="v3p-formerr v3p-xxs" role="alert">{t.errForm}</div> : null}
            <div className={`v3p-field${errs.nom ? " bad" : ""}`}>
              <input id="v3p-nom" data-f="nom" className="v3p-input v3p-p" type="text" placeholder=" " value={vals.nom}
                aria-invalid={!!errs.nom} aria-errormessage={errs.nom ? "v3p-nom-e" : undefined}
                onChange={(e) => setVal("nom", e.target.value)} onBlur={() => blur("nom")} />
              <label htmlFor="v3p-nom" className="v3p-label v3p-p" data-ed="v3.ui.pages.fNom">{t.fNom}</label>
              <span className="v3p-line" aria-hidden="true"><i /></span>
              {errs.nom ? <span className="v3p-err v3p-xxs" id="v3p-nom-e" role="alert">{errs.nom}</span> : null}
            </div>

            <div className={`v3p-field${errs.email ? " bad" : ""}`}>
              <input id="v3p-email" data-f="email" className="v3p-input v3p-p" type="email" placeholder=" " value={vals.email}
                aria-invalid={!!errs.email} aria-errormessage={errs.email ? "v3p-email-e" : undefined}
                onChange={(e) => setVal("email", e.target.value)} onBlur={() => blur("email")} />
              <label htmlFor="v3p-email" className="v3p-label v3p-p" data-ed="v3.ui.pages.fEmail">{t.fEmail}</label>
              <span className="v3p-line" aria-hidden="true"><i /></span>
              {errs.email ? <span className="v3p-err v3p-xxs" id="v3p-email-e" role="alert">{errs.email}</span> : null}
            </div>

            {



                                                                               }
            <div className={`v3p-field${errs.topics ? " bad" : ""}`} ref={topicRef}>
              <div className="v3p-input v3p-p v3p-topicbtn">
                <button type="button" data-f="topics" className="v3p-topicopen" aria-expanded={topicOpen}
                  aria-labelledby="v3p-topics-l" aria-invalid={!!errs.topics}
                  aria-errormessage={errs.topics ? "v3p-topics-e" : undefined}
                  onClick={() => setTopicOpen((v) => !v)} onBlur={() => { if (!topicOpen) blur("topics"); }}>
                  <i className={`v3p-chev${topicOpen ? " up" : ""}`} aria-hidden="true" />
                </button>
                <span className="v3p-tags">
                  {topics.map((tp) => (
                    <button type="button" className="v3p-tag v3p-xxs" key={tp} aria-label={`${t.removeAria}: ${tp}`}
                      onClick={() => toggleTopic(tp)}>{tp}<i aria-hidden="true">+</i></button>
                  ))}
                </span>
              </div>
              <span id="v3p-topics-l" className={`v3p-label v3p-p${topics.length ? " up" : ""}`} data-ed="v3.ui.pages.fSujet">{t.fSujet}</span>
              <span className="v3p-line" aria-hidden="true"><i /></span>
              <div className={`v3p-dropdown v3p-dropfield${topicOpen ? " open" : ""}`} ref={topicBox}>
                <div ref={topicInner}>
                  {options.map((tp) => (
                    <button key={tp} type="button" className={`v3p-droplabel v3p-xs${topics.includes(tp) ? " on" : ""}`}
                      tabIndex={topicOpen ? 0 : -1} onClick={() => toggleTopic(tp)}>{tp}</button>
                  ))}
                </div>
              </div>
              {errs.topics ? <span className="v3p-err v3p-xxs" id="v3p-topics-e" role="alert">{errs.topics}</span> : null}
            </div>

            {                                                                          }
            <div className={`v3p-field v3p-field-tel${errs.tel ? " bad" : ""}`} ref={dialRef}>
              <button type="button" className="v3p-dialbtn v3p-xxs" aria-expanded={dialOpen} aria-label={t.countryAria}
                onClick={() => setDialOpen((v) => !v)}>
                {dial.code} {dial.dial}<i className={`v3p-chev${dialOpen ? " up" : ""}`} aria-hidden="true" />
              </button>
              <div className={`v3p-diallist${dialOpen ? " open" : ""}`}>
                {COUNTRIES.map((c) => (
                  <button key={c.code} type="button" className="v3p-droplabel v3p-xs" tabIndex={dialOpen ? 0 : -1}
                    onClick={() => { setDial(c); setDialOpen(false); }}>
                    <span className="v3p-grey">{c.code}</span>&nbsp;&nbsp;{c.name[lang]}&nbsp;&nbsp;{c.dial}
                  </button>
                ))}
              </div>
              <input id="v3p-tel" data-f="tel" className="v3p-input v3p-p" type="tel" placeholder=" " value={vals.tel}
                aria-invalid={!!errs.tel} aria-errormessage={errs.tel ? "v3p-tel-e" : undefined}
                onChange={(e) => setVal("tel", e.target.value)} onBlur={() => blur("tel")} />
              <label htmlFor="v3p-tel" className="v3p-label v3p-label-tel v3p-p" data-ed="v3.ui.pages.fTel">{t.fTel}</label>
              <span className="v3p-line" aria-hidden="true"><i /></span>
              {errs.tel ? <span className="v3p-err v3p-xxs" id="v3p-tel-e" role="alert">{errs.tel}</span> : null}
            </div>

            <div className={`v3p-field v3p-field-msg${errs.msg ? " bad" : ""}`}>
              <textarea id="v3p-msg" data-f="msg" className="v3p-input v3p-p" rows={8} placeholder=" " value={vals.msg}
                aria-invalid={!!errs.msg} aria-errormessage={errs.msg ? "v3p-msg-e" : undefined}
                onChange={(e) => setVal("msg", e.target.value)} onBlur={() => blur("msg")} />
              <label htmlFor="v3p-msg" className="v3p-label v3p-p" data-ed="v3.ui.pages.fMsg">{t.fMsg}</label>
              <span className="v3p-line" aria-hidden="true"><i /></span>
              {errs.msg ? <span className="v3p-err v3p-xxs" id="v3p-msg-e" role="alert">{errs.msg}</span> : null}
            </div>

            {                                                                       }
            <div className="v3p-honey" aria-hidden="true">
              <label htmlFor="v3p-comments">{t.honey}</label>
              <input id="v3p-comments" name="comments" type="text" tabIndex={-1} autoComplete="off"
                value={vals.honey} onChange={(e) => setVal("honey", e.target.value)} />
            </div>

            <div className="v3p-formfoot">
              <PillP top={state === "sending" ? t.sending : t.submitTop} reveal={state === "sending" ? t.sendingMsg : t.submitReveal}
                edTop={state === "sending" ? undefined : "v3.ui.pages.submitTop"} edReveal={state === "sending" ? undefined : "v3.ui.pages.submitReveal"}
                submit disabled={state === "sending"} />
            </div>
          </form>
        ) : state === "error" ? (
          <div className="v3p-sent">
            <div className="v3p-s" data-ed="v3.ui.pages.errNetTitle">{t.errNetTitle}</div>
            <p className="v3p-p" role="alert" data-ed="v3.ui.pages.errNet">{t.errNet}</p>
            <PillP top={t.retryTop} reveal={t.retryReveal} edTop="v3.ui.pages.retryTop" edReveal="v3.ui.pages.retryReveal" onClick={() => setState("idle")} />
            <a className="v3p-xs v3p-lnk" href={mailHref()} data-ed="v3.ui.pages.mailReveal">{t.mailReveal}</a>
          </div>
        ) : (
          <div className="v3p-sent">
            <div className="v3p-s" data-ed="v3.ui.pages.merci">{t.merci}</div>
            <p className="v3p-p" data-ed="v3.ui.pages.sentMsg">{t.sentMsg}</p>
            <PillP top={t.againTop} reveal={t.againReveal} edTop="v3.ui.pages.againTop" edReveal="v3.ui.pages.againReveal" onClick={reset} />
          </div>
        )}
      </div>

      <p className="v3p-contact-desc v3p-s v3p-fadeup" data-ed="v3.ui.pages.cDesc" style={{ "--d": ".3s" } as React.CSSProperties}>{t.cDesc}</p>

      <div className="v3p-contact-cols">
        <div>
          <div className="v3p-colh v3p-xxs" data-ed="v3.ui.shell.colContacts">{edTxt(lang, "v3.ui.shell.colContacts", UIP[lang].colBiz, 160)}</div>
          <ul>
            <li><a className="v3p-xs v3p-lnk" href={emailHref} data-ed="v3.ui.shell.email">{emailTxt}</a></li>
            <li><a className="v3p-xs v3p-lnk" href={telHref} data-ed="v3.ui.shell.tel">{telTxt}</a></li>
          </ul>
        </div>
        <div>
          <div className="v3p-colh v3p-xxs" data-ed="v3.ui.shell.colCandid">{edTxt(lang, "v3.ui.shell.colCandid", UIP[lang].colJobs, 160)}</div>
          <ul><li><a className="v3p-xs v3p-lnk" href={emailHref} data-ed="v3.ui.shell.email">{emailTxt}</a></li></ul>
        </div>
        <div>
          <div className="v3p-colh v3p-xxs" data-ed="v3.ui.shell.colVille">{edTxt(lang, "v3.ui.shell.colVille", UIP[lang].colCity, 160)}</div>
          <ul>
            <li className="v3p-xs" data-ed="v3.ui.shell.adr1">{edTxt(lang, "v3.ui.shell.adr1", "Rue de Berne 59", 160)}</li>
            <li className="v3p-xs"><span data-ed="v3.ui.shell.adr2">{edTxt(lang, "v3.ui.shell.adr2", "1201 Genève", 160)}</span>, <span data-ed="v3.ui.shell.adr3">{edTxt(lang, "v3.ui.shell.adr3", UIP[lang].country, 160)}</span></li>
          </ul>
        </div>
      </div>
    </section>
  );
}


function ServicesBody({ lang, onNav }: { lang: AbilLang; onNav: (p: string) => void }) {
  const t = edUi(lang, "v3.ui.pages", UIP[lang]);

  const [openPillar, setOpenPillar] = useState<number | null>(null);


  return (
    <section>
      {                                                            }
      <div className="v3p-pagehero v3p-margin v3p-io">
        {                                                                               }
        <h1 className="v3p-xl"><span data-ed="v3.ui.pages.sHero"><WordsP text={t.sHero.split(" ")} base={0.15} step={0.05} /></span></h1>
        <div className="v3p-pagehero-sub v3p-xs">
          <RiseP d={1.0}><span data-ed="v3.ui.pages.sSub1">{t.sSub1}</span></RiseP>
          <RiseP d={1.1}><span data-ed="v3.ui.pages.sSub2">{t.sSub2}</span></RiseP>
        </div>
        <div className="v3p-pagehero-desc">
          <p className="v3p-p v3p-fadeup" data-ed="v3.ui.pages.sP1" style={{ "--d": ".4s" } as React.CSSProperties}>{t.sP1}</p>
          <p className="v3p-p v3p-fadeup" data-ed="v3.ui.pages.sP2" style={{ "--d": ".5s" } as React.CSSProperties}>{t.sP2}</p>
          {
                                                                                     }
          <div className="v3p-fadeup" style={{ "--d": ".6s" } as React.CSSProperties}>
            <PillP top={t.projTop} reveal={t.projReveal} edTop="v3.ui.pages.projTop" edReveal="v3.ui.pages.projReveal" onClick={() => onNav("contact")} />
          </div>
        </div>
      </div>

      {                                                                        }
      <LargeVisualP src={edSrc("v3.services.banner.img", "/brand/kv-icon-yellow-2.jpg")} video={edSrc("v3.services.banner.video", "/videos/kv-9.mp4")} alt={t.lrgAlt} edImg="v3.services.banner.img" edVideo="v3.services.banner.video" />

      {                                                                                    }
      <div className="v3p-servlist">
        {SERVICES.map((s, si) => {



          const cw = WORKSP.find((x) => x.title === s.caseTitle);
          return (
          <div className="v3p-servblock v3p-margin v3p-io" key={s.name.fr}>
            <div className="v3p-servinfo">
              <h2 className="v3p-m" data-ed={`v3.service.${SERV_SLUGS[si]}.name`}><WordsP text={edTxt(lang, `v3.service.${SERV_SLUGS[si]}.name`, s.name[lang], 160).split(" ")} base={0.2} step={0.06} /></h2>
              <p className="v3p-p v3p-fadeup" data-ed={`v3.service.${SERV_SLUGS[si]}.p`} style={{ "--d": ".35s" } as React.CSSProperties}>{edTxt(lang, `v3.service.${SERV_SLUGS[si]}.p`, s.p[lang], 2000)}</p>
              <div className="v3p-fadeup" style={{ "--d": ".45s" } as React.CSSProperties}>
                {                                                                                 }
                <PillP top={t.learnTop} reveal={edTxt(lang, `v3.services.card.${SERV_SLUGS[si]}.reveal`, t.servReveal.replace("{x}", edTxt(lang, `v3.service.${SERV_SLUGS[si]}.name`, s.name[lang], 160)), 160)} edTop="v3.ui.pages.learnTop" edReveal={`v3.services.card.${SERV_SLUGS[si]}.reveal`} onClick={() => onNav(`services/${SERV_SLUGS[si]}`)} />
              </div>
            </div>
            {
                                                            }
            {
                                                                              }
            <div className="v3p-servcase">
              <div className="v3p-servcase-visual">
                <div className="v3p-imgfx" style={{ "--d": ".2s", width: "100%", height: "100%" } as React.CSSProperties}>
                  <ServCaseVisual
                    poster={cw ? edSrc(`v3.work.${cw.slug}.img`, cw.img) : s.img}
                    posterEd={cw ? `v3.work.${cw.slug}.img` : undefined}
                    video={edSrc(`v3.services.card.${SERV_SLUGS[si]}.video`, SERV_VIDEOS[SERV_SLUGS[si]] || "")}
                    videoEd={`v3.services.card.${SERV_SLUGS[si]}.video`}
                    alt={s.caseTitle}
                    eager={si === 0}
                  />
                </div>
              </div>
              <div className="v3p-servcase-info">
                <div className="v3p-xxs v3p-servcase-tags">{s.caseTags.map((tg) => TAGS[tg][lang]).join(" - ")}</div>
                <div className="v3p-s"><WordsP text={nomeCaso(caseSlug(s.caseTitle) || "", lang, s.caseTitle).split(" ")} base={0.3} step={0.06} /></div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {                                                                     }
      <div className="v3p-pillars v3p-margin v3p-io">
        <div className="v3p-pillars-head">
          <h2 className="v3p-l"><span data-ed="v3.ui.pages.detailTitle"><WordsP text={t.detailTitle.split(" ")} base={0.1} step={0.06} /></span></h2>
          <p className="v3p-s v3p-fadeup" data-ed="v3.ui.pages.detailDesc" style={{ "--d": ".3s" } as React.CSSProperties}>{t.detailDesc}</p>
          <div className="v3p-fadeup" style={{ "--d": ".4s" } as React.CSSProperties}>
            <PillP top={t.talkTop} reveal={t.talkReveal} edTop="v3.ui.pages.talkTop" edReveal="v3.ui.pages.talkReveal" onClick={() => onNav("contact")} />
          </div>
        </div>
        <div className="v3p-pillars-grid">
          {PILLARS.map((p, pi) => (
            <div className="v3p-pillar v3p-fadeup" id={`v3p-pillar-${pi}`} tabIndex={-1}
              style={{ "--d": `${0.25 + pi * 0.06}s` } as React.CSSProperties} key={p.h.fr}>
              <h3 className="v3p-s" data-ed={`v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.h`}>{edTxt(lang, `v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.h`, p.h[lang], 160)}</h3>
              <ul>
                {p.items.map((it, ii) => (
                  <li className="v3p-p" key={ii} data-ed={`v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.i${ii + 1}`}>{edTxt(lang, `v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.i${ii + 1}`, it[lang], 160)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {
                                                          }
        <ol className="v3p-pillars-acc">
          {PILLARS.map((p, pi) => (
            <li key={p.h.fr}>
              <button type="button" className="v3p-accbtn" aria-expanded={openPillar === pi}
                onClick={() => setOpenPillar(openPillar === pi ? null : pi)}>
                <span className="v3p-xs" data-ed={`v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.h`}>{edTxt(lang, `v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.h`, p.h[lang], 160)}</span>
                <span className="v3p-xxs" data-ed={openPillar === pi ? "v3.ui.pages.accMoins" : "v3.ui.pages.accPlus"}>{openPillar === pi ? t.accMoins : t.accPlus}</span>
              </button>
              <div className={`v3p-acc${openPillar === pi ? " open" : ""}`} aria-hidden={openPillar !== pi}>
                <div>
                  <ul className="v3p-accbody">
                    {p.items.map((it, ii) => (
                      <li className="v3p-p" key={ii} data-ed={`v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.i${ii + 1}`}>{edTxt(lang, `v3.services.pillars.${SERV_SLUGS[pi] ?? pi}.i${ii + 1}`, it[lang], 160)}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className={`v3p-rowline${openPillar === pi ? " on" : ""}`} aria-hidden="true"><i /></div>
            </li>
          ))}
        </ol>
      </div>

      {                                                                               }
      <div className="v3p-awards v3p-margin v3p-io">
        <h2 className="v3p-l"><span data-ed="v3.ui.pages.reperesTitle"><WordsP text={t.reperesTitle.split(" ")} base={0.1} step={0.06} /></span></h2>
        <p className="v3p-awards-p v3p-p v3p-fadeup" data-ed="v3.ui.pages.reperesDesc" style={{ "--d": ".3s" } as React.CSSProperties}>{t.reperesDesc}</p>
        <div className="v3p-awards-groups">
          {REPERES.map((g, gi) => (
            <div className="v3p-award v3p-fadeup" style={{ "--d": `${0.25 + gi * 0.08}s` } as React.CSSProperties} key={g.h.fr}>
              <h3 className="v3p-s" data-ed={`v3.services.reperes.${REPERES_SLUGS[gi] ?? gi}.h`}>{edTxt(lang, `v3.services.reperes.${REPERES_SLUGS[gi] ?? gi}.h`, g.h[lang], 160)}</h3>
              <ul>
                {g.items.map((it, ii) => (
                  <li className="v3p-xs" key={ii} data-ed={`v3.services.reperes.${REPERES_SLUGS[gi] ?? gi}.i${ii + 1}`}>{edTxt(lang, `v3.services.reperes.${REPERES_SLUGS[gi] ?? gi}.i${ii + 1}`, it[lang], 160)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




export function AbilV3Page({ page, lang, setLang, onNav }: { page: "projets" | "journal" | "contact" | "services"; lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void; onGoto?: (view: string) => void }) {

  useEdicoesSite();
  const rootRef = useRef<HTMLDivElement | null>(null);


  const pubsNav = usePublicados();
  const contagemCasos = pubsNav ? pad2(pubsNav.length) : CASES_COUNT;
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [navRolled, setNavRolled] = useState(false);

  const [navPeek, setNavPeek] = useState(false);
  const [navNamed, setNavNamed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(id);
  }, []);




  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [page]);
  useReveal(page);





  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lrg = document.querySelector<HTMLElement>(".v3p-lrg");
    const h1 = document.querySelector<HTMLElement>(".v3p-main h1");
    let raf = 0;
    const clamp = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);


    const geo = { h1Fim: 0, footTopo: 0, lrgTopo: 0, lrgAlt: 1 };
    const measure = () => {
      const y = window.scrollY;
      if (h1) geo.h1Fim = h1.getBoundingClientRect().bottom + y;
      const fr = footerRef.current?.getBoundingClientRect();
      if (fr) geo.footTopo = fr.top + y;
      if (lrg) { const r = lrg.getBoundingClientRect(); geo.lrgTopo = r.top + y; geo.lrgAlt = r.height || 1; }
    };
    const read = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      setNavRolled((p) => (p === y > 2 ? p : y > 2));
      if (h1) {
        const named = geo.h1Fim - y < 56;
        setNavNamed((p) => (p === named ? p : named));
      }
      if (footerRef.current && geo.footTopo > 0) {
        const topo = geo.footTopo - y;
        const hide = topo <= vh * 0.2;
        setNavHidden((p) => (p === hide ? p : hide));
        if (!reduced && !coarse && page !== "contact") {
          footerRef.current.style.setProperty("--fp", clamp((vh - topo) / Math.max(1, vh)).toFixed(4));
        }
      }
      if (lrg && !reduced) {
        lrg.style.setProperty("--p", clamp((vh - (geo.lrgTopo - y)) / geo.lrgAlt).toFixed(4));
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; read(); });
    };
    const onResize = () => { measure(); onScroll(); };
    measure();
    read();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize).catch(() => {});
    window.addEventListener("load", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [page]);


  useEffect(() => {
    const root = rootRef.current;
    const cur = cursorRef.current;
    if (!root || !cur) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: MouseEvent) => { cur.style.transform = `translate3d(${e.clientX + 18}px,${e.clientY + 18}px,0)`; };
    const over = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.("[data-v3hover]");
      const label = t ? t.getAttribute("data-v3hover") || "" : "";
      if (label) { cur.textContent = label; cur.style.opacity = "1"; } else { cur.style.opacity = "0"; }
    };
    const out = (e: MouseEvent) => {
      const t = (e.relatedTarget as Element | null)?.closest?.("[data-v3hover]");
      if (!t) cur.style.opacity = "0";
    };
    window.addEventListener("mousemove", move, { passive: true });
    root.addEventListener("mouseover", over);
    root.addEventListener("mouseout", out);
    return () => {
      window.removeEventListener("mousemove", move);
      root.removeEventListener("mouseover", over);
      root.removeEventListener("mouseout", out);
    };
  }, []);

  const backToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };



  const nav = (p: string) => {
    setMenuOpen(false);
    if (p === page) { backToTop(); return; }
    onNav(p);
  };


  useBodyLock(menuOpen);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);


  useEffect(() => {
    if (!navPeek) return;
    const y0 = window.scrollY;
    const onS = () => { if (Math.abs(window.scrollY - y0) > 8) setNavPeek(false); };
    window.addEventListener("scroll", onS, { passive: true });
    return () => window.removeEventListener("scroll", onS);
  }, [navPeek]);

  const t = edUi(lang, "v3.ui.pages", UIP[lang]);


  const emailTxt = edTxt(lang, "v3.ui.shell.email", CONTACT_MAIL, 160);
  const telTxt = edTxt(lang, "v3.ui.shell.tel", "+41 22 548 00 40", 160);
  const emailHref = edSrc("v3.contact.email.href", `mailto:${emailTxt}`);
  const telHref = edSrc("v3.contact.tel.href", `tel:${telTxt.replace(/[^+\d]/g, "")}`);




  const navVis = NAVP.filter((n) => edCfg(`v3.cfg.nav.hide.${n.page}`) !== "1");
  const langsOn = ABIL_LANGS.filter((l) => l === "fr" || edCfg(`v3.cfg.langs.off.${l}`) !== "1");


  const langDesligada = lang !== "fr" && edCfg(`v3.cfg.langs.off.${lang}`) === "1";
  useEffect(() => { if (langDesligada) setLang("fr"); }, [langDesligada, setLang]);
  const nextPage = NEXT[page];
  const rolled = navRolled && !navPeek;

  return (



    <div ref={rootRef} data-no-reveal className={`v3p-root${ready ? " v3p-ready" : ""}`}>
      <style>{`
        /* Actual Mundial font via Adobe Fonts (kit opg3hrq, index.html) */
        .v3p-root{position:relative;background:${TELA};color:${NOIR};
          font-family:"mundial","Figtree","Helvetica Neue",sans-serif;
          font-weight:400;line-height:1;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
        .v3p-root *{box-sizing:border-box;margin:0;padding:0;box-shadow:none !important}
        .v3p-root ::selection{background:${VIOLETTE};color:${NOIR}}
        .v3p-root img{display:block;max-width:100%}
        .v3p-root button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:left}
        .v3p-root a{color:inherit;text-decoration:none}
        .v3p-root ul{list-style:none}

        /* Typographic scale, identical to the V3 home page. */
        .v3p-xl,.v3p-l,.v3p-m,.v3p-s,.v3p-xs,.v3p-xxs{text-transform:uppercase;letter-spacing:-.03em;margin-left:-.03em;line-height:1}
        .v3p-xl{font-size:7vw;line-height:.8;font-weight:300}
        .v3p-l{font-size:4.86vw;line-height:.8;font-weight:300}
        .v3p-m{font-size:2.8vw;line-height:.9;font-weight:300}
        .v3p-s{font-size:1.5vw;line-height:.9;font-weight:400}
        .v3p-xs{font-size:14px;line-height:1.2;font-weight:400}
        .v3p-xxs{font-size:12px;line-height:1.17;font-weight:400}
        .v3p-p{font-size:1.111vw;line-height:1.35;font-weight:400;font-family:"mundial","Figtree","Helvetica Neue",sans-serif;letter-spacing:-.01em;text-transform:none}
        .v3p-it{font-style:italic}
        .v3p-grey{color:${RHONE}}
        .v3p-margin{margin-left:2vw;margin-right:2vw}
        .v3p-main{padding-top:55px;padding-bottom:2vw;min-height:60vh}

        /* Reveal masks with .26em/.24em clearance, learned from the clipped fonts. */
        .v3p-wm,.v3p-rm{display:inline-block;overflow:hidden;vertical-align:top;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
        /* Clip ONLY during entry, then remove it to prevent global clipping. */
        .unclip .v3p-wm,.unclip .v3p-rm,.unclip [class*="-head"],.unclip [class*="-title"]{overflow:visible}
        /* Navigation labels never wrap or clip. */
        .v3p-lnk,.v3p-nav a,.v3p-nav button{white-space:nowrap}
        .v3p-w,.v3p-rise{display:inline-block;transform:translateY(165%);transition:transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s);will-change:transform}
        .v3p-io.in .v3p-w,.v3p-io.in .v3p-rise,.v3p-ready .v3p-nav .v3p-rise{transform:translateY(0)}
        /* Safety net: if the observer never fires during printing, in a background
           tab or in a search engine, the content must still appear. */
        @media print{.v3p-w,.v3p-rise,.v3p-imgfx,.v3p-imgup{transform:none !important;opacity:1 !important}
          .v3p-fillw{width:100% !important}}
        .v3p-imgfx{opacity:0;transform:scale(1.3) rotate(8deg);transition:opacity 1s cubic-bezier(.075,0,.165,0),transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s);will-change:transform}
        .v3p-io.in .v3p-imgfx{opacity:1;transform:scale(1) rotate(0deg)}
        .v3p-fillw{width:0;height:1px;background:${NOIR};transition:width 1s cubic-bezier(.3,.3,0,1);transition-delay:var(--d,0s)}
        .v3p-io.in .v3p-fillw{width:100%}
        .v3p-fadeup{opacity:0;transform:translateY(40px);transition:opacity 1s cubic-bezier(.075,0,.165,0),transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s)}
        .v3p-io.in .v3p-fadeup{opacity:1;transform:translateY(0)}

        .v3p-lnk{position:relative;padding-bottom:2px;text-transform:uppercase;cursor:pointer;display:inline-block}
        .v3p-lnk:after{content:"";position:absolute;width:100%;height:1px;bottom:0;left:0;transform:scaleX(0);transform-origin:bottom right;transition:transform .3s;background:${NOIR}}
        .v3p-lnk:hover:after,.v3p-lnk.on:after{transform:scaleX(1);transform-origin:bottom left}

        /* Navigation and overlay use the same shell as the V3 home page. */
        .v3p-nav{position:fixed;top:0;left:0;right:0;height:56px;padding:0 2vw;z-index:3010;color:${NOIR};background:${ALPIN};
          display:grid;grid-template-columns:1fr 1fr 1fr 1fr;column-gap:2vw;align-items:center;
          transition:transform 1s cubic-bezier(.215,.61,.355,1),background-color .45s ease}
        /* B1: the bar leaves the screen only when the footer reaches 80%. At 2px,
           the links ROLL upward and "Menu +" takes their place. */
        .v3p-nav.hide{transform:translateY(-370px)}







        .v3p-nav.menuaberto{opacity:0;pointer-events:none}
        .v3p-nav.rolled{background:${CITRON}}
        .v3p-logo{display:flex;align-items:baseline;gap:2px}
        .v3p-nav .v3p-logo{display:inline-flex;align-items:center;gap:2px;flex-wrap:nowrap;white-space:nowrap;width:auto}
        .v3p-logo img{height:19.4px;width:auto}
        .v3p-foot-logo{display:block;height:19.4px;width:auto}
        .v3p-foot-home{display:block;background:none;border:0;padding:0;margin:0;cursor:pointer;line-height:0}
        .v3p-logo sup{font-size:8px;transform:translateY(-4px)}
        /* The separator and page name grow after passing the H1.
           ABiL copy rules use a slash as the separator. */
        .v3p-navpage{display:flex;align-items:center;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
        .v3p-navdash{display:inline-block;width:14px;margin:0 .35em;text-align:center;overflow:hidden;white-space:nowrap;
          opacity:0;transition:opacity .6s}
        .v3p-nav.named .v3p-navdash{opacity:1}
        .v3p-navnamem{display:inline-block;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
        .v3p-navname{display:inline-block;transform:translateY(260%);transition:transform .8s cubic-bezier(.075,.82,.165,1)}
        .v3p-nav.named .v3p-navname{transform:translateY(0)}
        .v3p-tagline{display:flex;flex-direction:column;gap:2px}
        .v3p-langs{display:flex;gap:10px;justify-self:start}
        .v3p-navend{grid-column:4/5;justify-self:end;position:relative;display:flex;align-items:center}
        .v3p-links{display:flex;gap:16px;align-items:baseline}
        /* >=1281: links spread across the right half (Nav_menuWrap 47vw). */
        @media (min-width:1281px){.v3p-links{width:36vw;justify-content:space-between;gap:0}}
        .v3p-navroll{display:inline-block;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}

        .v3p-navroll>.v3p-rm{transition:transform .64s cubic-bezier(.4,.4,.1,1);transition-delay:calc((4 - var(--i,0)) * .035s)}
        .v3p-nav.rolled .v3p-navroll>.v3p-rm{transition-delay:calc(var(--i,0) * .058s)}
        .v3p-nav.rolled .v3p-links{pointer-events:none}
        .v3p-nav.rolled .v3p-navroll>.v3p-rm{transform:translateY(-135%)}
        .v3p-navmenu{position:absolute;right:0;top:50%;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em;
          transform:translateY(-50%);pointer-events:none}
        .v3p-navmenu span{display:block;transform:translateY(130%);transition:transform .55s cubic-bezier(.4,.4,.1,1);transition-delay:.1s}
        .v3p-nav.rolled .v3p-navmenu{pointer-events:auto}
        .v3p-nav.rolled .v3p-navmenu span{transform:translateY(0)}
        /* B3: menu counters appear only on mobile and in the overlay. */
        .v3p-count{font-size:9px;vertical-align:super;margin-left:3px;color:${RHONE};display:none}
        .v3p-overlay .v3p-count{display:inline}
        .v3p-menubtn{display:none}
        /* B5: full-colour panel moves down with staggered links, reversed on close,
           while body scrolling is locked. */
        .v3p-overlay{position:fixed;inset:0;z-index:60;background:${ALPIN};display:flex;flex-direction:column;justify-content:space-between;
          padding:16px 4vw 8vw;transform:translateY(-100%);visibility:hidden;
          transition:transform 1s cubic-bezier(.4,.4,.1,1),visibility 0s linear 1s}
        .v3p-overlay.open{transform:translateY(0);visibility:visible;transition:transform 1s cubic-bezier(.4,.4,.1,1),visibility 0s}
        .v3p-overlay-top{display:flex;justify-content:space-between;align-items:center;height:40px}
        .v3p-overlay-links{display:flex;flex-direction:column;gap:2vw}
        .v3p-overlay-links .v3p-biglink{font-size:6vw;text-transform:uppercase;letter-spacing:-.03em;font-weight:300;line-height:1;
          overflow:hidden;padding:.2em 0 .3em;margin:-.2em 0 -.3em}
        .v3p-overlay-links .v3p-biglink i{display:block;font-style:normal;transform:translateY(120%);
          transition:transform .9s cubic-bezier(.4,.4,.1,1);transition-delay:calc((4 - var(--i,0)) * .03s)}
        .v3p-overlay.open .v3p-biglink i{transform:translateY(0);transition-delay:calc(var(--i,0) * .05s + .18s)}

        /* Dropdown for the work filter, journal sorting and contact subject. */
        /* F10: opens to its MEASURED HEIGHT in 1s, closes outside, on Escape or scroll. */
        .v3p-dropdown{position:absolute;top:100%;left:0;z-index:40;margin-top:.6vw;
          background:${ALPIN};border:1px solid ${LEMAN};border-radius:5px;overflow:hidden;min-width:14vw;
          height:0;visibility:hidden;transition:height 1s cubic-bezier(.25,1,.5,1),visibility 0s linear 1s}
        .v3p-dropdown.open{visibility:visible;transition:height 1s cubic-bezier(.25,1,.5,1),visibility 0s}
        .v3p-dropdown>div{display:flex;flex-direction:column}
        .v3p-droplabel{padding:.8vw .9vw;white-space:nowrap}
        .v3p-droplabel:hover{background:${LEMAN}}
        .v3p-droplabel.on{background:${NOIR};color:${ALPIN}}

        .v3p-filterwrap .v3p-dropdown{margin-top:28px}
        .v3p-newssort .v3p-droplabel,.v3p-dropfield .v3p-droplabel,.v3p-diallist .v3p-droplabel{padding:16px 20px}



        .v3p-workhead{padding-top:1vw;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;column-gap:2vw;align-items:end;margin-bottom:2.4vw}
        .v3p-workhead-title{display:flex;align-items:flex-start;overflow:hidden;min-width:min-content;padding:.32em .06em .78em;margin:-.32em -.06em -.78em}
        .v3p-worknum{margin-top:.3vw;margin-left:.8vw;font-size:1.6vw;line-height:1}
        .v3p-filterwrap{position:relative;grid-column:3/4;align-self:end;padding-bottom:.6vw}
        /* F8: capsule with a dark pill that SLIDES beneath the labels and follows
           the pointer on hover, returning to the active item when it leaves. */
        .v3p-viewtoggle{grid-column:4/5;justify-self:end;align-self:end;margin-bottom:.4vw;display:flex;padding:4px;
          border:1px solid ${LEMAN};border-radius:10vw;position:relative}
        .v3p-hoverpill{position:absolute;top:4px;bottom:4px;left:0;background:${NOIR};border-radius:999px;
          transition:transform .2s cubic-bezier(.645,.045,.355,1),width .2s cubic-bezier(.645,.045,.355,1)}
        .v3p-switch{padding:8px 18px;border-radius:999px;position:relative;z-index:1;
          transition:color .2s cubic-bezier(.645,.045,.355,1)}
        .v3p-switch.lit{color:${ALPIN}}
        .v3p-workgrid{position:relative;margin:0 1vw;min-height:100vh}
        .v3p-bordv{position:absolute;left:50%;top:1vw;width:1px;height:0;background:${NOIR};transition:height 6s cubic-bezier(.3,.3,0,1);transition-delay:var(--d,0s)}
        .v3p-io.in .v3p-bordv{height:calc(100% - 1vw)}
        .v3p-works{position:relative;display:grid;grid-template-columns:1fr 1fr}
        .v3p-work{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:1vw 1vw 0;cursor:pointer}
        .v3p-work-visual{position:relative;width:100%;height:34vw;overflow:hidden;display:flex;align-items:center;justify-content:center}
        .v3p-work-visual img{transition:transform 1.5s cubic-bezier(.075,.82,.165,1)}
        .v3p-work:hover .v3p-work-visual img{transform:scale(1.045)}
        .v3p-work-info{display:flex;flex-direction:column;align-items:flex-start;margin-top:1.2vw;margin-bottom:0;width:100%;flex:1}
        .v3p-work-meta{display:flex;flex-wrap:wrap;align-items:center}
        .v3p-work-dash{margin:0 4px}
        .v3p-work-title{margin-top:.8vw;font-size:1.48vw;line-height:.9}
        /* D5: the hairline fills from the left in odd columns and from the right in even columns. */
        .v3p-work-line{width:100%;overflow:hidden;display:flex;justify-content:flex-start;margin-top:3vw}

        .v3p-work:last-child .v3p-work-line,.v3p-work:nth-last-child(2) .v3p-work-line{display:none}
        .v3p-work:nth-last-child(-n+2) .v3p-work-info{margin-bottom:0}
        .v3p-work-line.rev{justify-content:flex-end}
        .v3p-io.in .v3p-fillw.filled,.v3p-fillw.filled{width:100%;transition:none}
        .v3p-worklist{margin:2vw;min-height:100vh}
        .v3p-listrow{position:relative}
        .v3p-listslide{padding:0;flex:0 0 auto;cursor:pointer}
        .v3p-listhead{width:100%;display:grid;grid-template-columns:47fr 40fr 5fr;column-gap:2vw;align-items:center;padding:1.4vw 0}
        .v3p-listtags{justify-self:start}
        .v3p-listyear{justify-self:end}
        .v3p-acc{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .6s cubic-bezier(.165,.84,.44,1),opacity .6s cubic-bezier(.165,.84,.44,1)}
        .v3p-acc.open{grid-template-rows:1fr;opacity:1}
        .v3p-acc>div{overflow:hidden;min-height:0}
        .v3p-liststrip{display:flex;gap:2vw;padding:1vw 0 2vw;overflow-x:auto;scrollbar-width:none}
        .v3p-liststrip::-webkit-scrollbar{display:none}
        .v3p-liststrip img{height:15vw;width:22.5vw;object-fit:cover;flex:0 0 auto}
        /* F6: the hairline SWEEPS on hover, enters from the left (1.4s), exits to
           the right (1.6s, slower), and remains fixed at 0 while the row is open. */
        .v3p-rowline{position:relative;height:1px;width:100%;overflow:hidden;background:${LEMAN}}
        .v3p-rowline i{position:absolute;inset:0;background:${NOIR};transform:scaleX(0);transform-origin:right center;
          transition:transform 1.6s cubic-bezier(.165,.84,.44,1)}
        .v3p-listrow:hover .v3p-rowline i{transform:scaleX(1);transform-origin:left center;
          transition:transform 1.4s cubic-bezier(.165,.84,.44,1)}
        .v3p-rowline.on i{transform:scaleX(1);transform-origin:left center;transition:transform .6s cubic-bezier(.165,.84,.44,1)}

        /* ---- JOURNAL ---- */
        .v3p-newshead{padding:6vw 0 1.4vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:3vw}
        .v3p-newstitle{grid-column:1/-1}
        .v3p-newssub{grid-column:1/3;display:flex;flex-direction:column;align-items:flex-start;gap:2px}
        .v3p-newsp{grid-column:5/8;margin-bottom:3vw}
        .v3p-newssort{position:relative;grid-column:5/7;align-self:center}
        .v3p-newswrap{position:relative;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;margin-top:1vw}

        .v3p-newsbordh{grid-column:1/-1;height:1px;overflow:hidden}
        .v3p-article{display:grid;grid-template-columns:1fr 1fr;column-gap:2vw;padding:2vw 0;position:relative;cursor:pointer}
        .v3p-article:after{content:"";position:absolute;bottom:0;left:0;width:calc(200% + 2vw);height:1px;background:${LEMAN};opacity:.5;
          transform:scaleX(0);transform-origin:left center;transition:transform 1.4s cubic-bezier(.3,.3,0,1);transition-delay:2.2s}
        .v3p-article:nth-of-type(even):after,.v3p-article:nth-last-of-type(-n+2):after{display:none}
        .v3p-io.in .v3p-article:after{transform:scaleX(1)}

        .v3p-artlink{position:absolute;left:-9999px;top:0}
        .v3p-artlink:focus{position:static;left:auto;align-self:flex-start}
        .v3p-article-img{position:relative;overflow:hidden}
        .v3p-article-img img{width:100%;height:auto;aspect-ratio:1296/1120;object-fit:cover;transition:transform 1.5s cubic-bezier(.075,.82,.165,1)}
        .v3p-article:hover .v3p-article-img img{transform:scale(1.045)}
        .v3p-article-info{display:flex;flex-direction:column;justify-content:space-between;gap:12px}
        .v3p-article-meta{display:flex;align-items:baseline}
        .v3p-article-title{margin-top:.4vw}

        /* ---- CONTACT ---- */

        .v3p-contact{padding-top:2vw;min-height:calc(100vh - 56px - 2vw);display:grid;grid-template-columns:repeat(2,1fr);grid-template-areas:"t f" "d c";column-gap:2vw;row-gap:0;align-items:start;padding-bottom:6vw}
        .v3p-contact-title{grid-area:t;overflow:hidden;padding:.32em 0 .44em;margin:-.32em 0 -.44em}
        .v3p-contact-form{grid-area:f;margin-bottom:4vw}
        .v3p-form{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:2vw}
        .v3p-field{position:relative;padding-bottom:18px}
        .v3p-field-msg{grid-column:1/span 2}
        .v3p-input{width:100%;padding:24px 0 8px;background:none;border:0;border-bottom:1px solid ${LEMAN};border-radius:0;color:${NOIR};min-height:56px}
        .v3p-input:focus{outline:none;border-bottom-color:${NOIR}}
        .v3p-topicbtn{position:relative;text-align:left;cursor:pointer;display:flex;align-items:flex-end;justify-content:space-between;gap:8px}
        /* The Sujet box is no longer a button. This control opens the panel, fills
           the space below the tags, keeps the whole area clickable and places the
           chevron in the bottom right corner. */
        .v3p-topicopen{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:flex-end;padding:24px 0 8px}
        .v3p-topicopen:focus{outline:none}
        .v3p-topicbtn:focus-within{border-bottom-color:${NOIR}}
        /* General form alert, rendered from the dictionary. */
        .v3p-formerr{grid-column:1/span 2;color:#c8102e;text-transform:none;letter-spacing:0}
        .v3p-label{pointer-events:none;position:absolute;top:24px;left:0;transform-origin:0 0;transition:.15s;color:${NOIR}}
        .v3p-input:focus+.v3p-label,.v3p-input:not(:placeholder-shown)+.v3p-label,.v3p-label.up{color:${RHONE};transform:translateY(-100%) scale(.75)}
        .v3p-dropfield{min-width:100%}
        /* F17: 1px track per field with a bar that enters from the left on hover
           (1s) and exits right (1.1s). It stays red and FIXED when invalid. */
        .v3p-line{position:absolute;left:0;right:0;bottom:18px;height:1px;overflow:hidden;pointer-events:none}
        .v3p-line i{position:absolute;inset:0;background:${NOIR};transform:scaleX(0);transform-origin:right center;
          transition:transform 1.1s cubic-bezier(.165,.84,.44,1)}
        .v3p-field:hover .v3p-line i,.v3p-field:focus-within .v3p-line i{transform:scaleX(1);transform-origin:left center;
          transition:transform 1s cubic-bezier(.165,.84,.44,1)}
        .v3p-field.bad .v3p-line i{background:#c8102e;transform:scaleX(1);transform-origin:left center;transition:none}
        .v3p-err{position:absolute;left:0;bottom:0;color:#c8102e;text-transform:none;letter-spacing:0}
        .v3p-field.bad .v3p-label{color:#c8102e}
        /* F19: removable multi-select tags and a chevron that rotates 180 degrees. */
        .v3p-tags{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:6px;min-height:18px;align-items:center}
        /* The tag is now a <button>. The selector prefixes .v3p-root so it outranks
           the .v3p-root button{border:0} reset and preserves the capsule outline. */
        .v3p-root .v3p-tag{display:inline-flex;align-items:center;gap:6px;padding:5px 10px 6px;border:1px solid ${LEMAN};border-radius:999px;
          text-transform:uppercase;cursor:pointer;transition:background-color .2s,color .2s}
        .v3p-tag:hover{background:${NOIR};color:${ALPIN}}
        .v3p-tag i{font-style:normal;display:inline-block;transform:rotate(45deg);line-height:1}
        .v3p-chev{width:8px;height:8px;border-right:1px solid ${NOIR};border-bottom:1px solid ${NOIR};
          transform:rotate(45deg) translateY(-2px);transition:transform .4s cubic-bezier(.4,.4,.1,1);flex:0 0 auto;margin-bottom:6px}
        .v3p-chev.up{transform:rotate(225deg) translateY(-2px)}
        /* F18: country dialling-code selector, with the ISO code standing in for the flag. */
        .v3p-field-tel .v3p-input{padding-left:74px}
        .v3p-label-tel{left:74px}
        .v3p-dialbtn{position:absolute;left:0;bottom:27px;display:flex;align-items:center;gap:6px;padding:0;z-index:2;white-space:nowrap}
        .v3p-dialbtn .v3p-chev{width:6px;height:6px;margin-bottom:2px}
        .v3p-diallist{position:absolute;left:0;top:100%;z-index:40;background:${ALPIN};border:1px solid ${LEMAN};border-radius:5px;
          overflow:hidden auto;height:0;visibility:hidden;min-width:16vw;
          transition:height .6s cubic-bezier(.25,1,.5,1),visibility 0s linear .6s}
        .v3p-diallist.open{height:20vw;visibility:visible;transition:height .6s cubic-bezier(.25,1,.5,1),visibility 0s}
        .v3p-diallist .v3p-droplabel{display:block;width:100%;border-bottom:1px solid ${LEMAN}}
        .v3p-diallist .v3p-droplabel:last-child{border-bottom:0}
        .v3p-honey{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
        .v3p-formfoot{grid-column:1/span 2;display:flex;justify-content:flex-start;margin-top:24px}
        .v3p-btn:disabled{cursor:progress;opacity:.7}
        .v3p-sent{display:flex;flex-direction:column;gap:1.6vw;align-items:flex-start;padding-top:24px}
        .v3p-contact-desc{width:22.5vw;grid-area:d}
        .v3p-contact-cols{grid-area:c;display:flex;align-items:flex-start;gap:2vw;flex-wrap:wrap}
        .v3p-contact-cols>div{width:22.5vw}


        .v3p-colh{color:#ffffff;margin-bottom:1vw}

        .v3p-contact-cols .v3p-colh{color:${NOIR};margin-bottom:.5vw}
        .v3p-nextlbl{color:#ffffff}
        .v3p-contact-cols li{margin-bottom:4px}

        /* ---- SERVICES ---- */
        .v3p-pagehero{padding:6vw 0 4vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw}
        .v3p-pagehero h1{grid-column:1/-1}
        .v3p-pagehero-sub{grid-column:1/3;margin-top:3vw;display:flex;flex-direction:column;align-items:flex-start;gap:2px}
        .v3p-pagehero-desc{grid-column:5/8;margin-top:3vw;display:flex;flex-direction:column;gap:1vw;align-items:flex-start}
        /* The large hero frame expands from 96vw to 100% and the image
           moves from -14% to 0% according to --p, written by the shell handler.
           The image entry lasts 2.4s, much longer than the text transition. */
        .v3p-lrg{--p:0;margin-top:2vw;margin-bottom:0}
        .v3p-lrg-box{width:calc(100% - 4vw * (1 - var(--p)));margin:0 auto;height:45vw;overflow:hidden;position:relative}
        .v3p-lrg-up{position:absolute;inset:0;transform:translateY(120%);
          transition:transform 2.4s cubic-bezier(.4,.4,.1,1);transition-delay:var(--d,0s);will-change:transform}
        .v3p-io.in .v3p-lrg-up{transform:translateY(0)}
        .v3p-lrg-img{width:100%;height:118%;object-fit:cover;transform:translateY(calc(-14% * (1 - var(--p))))}
        /* G9: sticky offset for ServicesOverview. The first block stays out so it
           does not overlap the hero. */
        .v3p-servblock{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;padding:4vw 0;border-bottom:1px solid ${RHONE}}
        .v3p-servblock+.v3p-servblock{padding-top:calc(2vw + 158px);margin-top:-158px}
        .v3p-servinfo{width:34.75vw;display:flex;flex-direction:column;gap:1.6vw;align-items:flex-start}

        .v3p-servcase{cursor:pointer;display:flex;flex-direction:column;width:100%}
        .v3p-servcase-visual{overflow:hidden;height:34vw;width:100%}
        .v3p-servcase-visual img{width:100%;height:100%;object-fit:cover;transition:transform 1.5s cubic-bezier(.075,.82,.165,1)}
        .v3p-servcase:hover .v3p-servcase-visual img{transform:scale(1.045)}
        .v3p-servcase-info{margin-top:1.2vw;margin-bottom:3vw;display:flex;flex-direction:column;align-items:flex-start}
        .v3p-servcase-tags{margin-bottom:.8vw;color:${RHONE}}
        .v3p-pillars{margin-top:8vw;margin-bottom:4vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:2vw}
        .v3p-pillars-head{width:34.75vw;display:flex;flex-direction:column;gap:2vw;align-items:flex-start}
        .v3p-pillars-grid{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:4vw}
        .v3p-pillar{display:flex;flex-direction:column;gap:1vw;position:relative}
        /* The internal jump focuses the destination pillar. Pointer users see no
           change, while keyboard users can see where focus landed. Previously,
           outline:none removed every focus cue. */
        .v3p-pillar:focus{outline:none}
        .v3p-pillar:focus-visible{outline:2px solid ${NOIR};outline-offset:6px}
        .v3p-pillar li{margin-bottom:.2vw}
        /* Mobile pillar accordion (Services Unpacked), hidden on desktop. */
        .v3p-pillars-acc{display:none;grid-column:1/-1}
        .v3p-accbtn{width:100%;display:flex;justify-content:space-between;align-items:center;padding:6vw 0}
        .v3p-accbody{padding:0 0 4vw}
        .v3p-accbody li{margin-bottom:1vw}
        /* G8: destination for each service button, highlighting THAT discipline. */
        .v3p-pillar:before{content:"";position:absolute;left:-1vw;right:-1vw;top:-1vw;bottom:-1vw;border:1px solid ${CITRON};
          opacity:0;transition:opacity .5s cubic-bezier(.4,.4,.1,1);pointer-events:none}
        .v3p-pillar.hit:before{opacity:1}
        /* G6: three-column closing section with the wide Awards_groups column gap. */
        .v3p-awards{margin-top:8vw;margin-bottom:4vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:2vw}
        .v3p-awards h2{grid-column:1/-1}
        .v3p-awards-p{grid-column:1/4;margin-top:1vw}
        .v3p-awards-groups{grid-column:1/-1;margin-top:3vw;display:grid;grid-template-columns:repeat(3,1fr);column-gap:14.25vw;row-gap:3vw}
        .v3p-award{display:flex;flex-direction:column;gap:1vw;border-top:1px solid ${LEMAN};padding-top:1.4vw}
        .v3p-award li{margin-bottom:.2vw;color:${RHONE}}

        /* Footer, identical to the V3 home page. */
        .v3p-footer{position:relative;min-height:100vh;margin-top:0;background:${VIOLETTE};color:${NOIR};display:flex;flex-direction:column;--fp:1}

        .v3p-footer.meta{min-height:0;margin-top:0;background:${TELA}}
        .v3p-footer.meta .v3p-footer-base{display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;align-items:center;height:4vw;padding:0 2vw}
        .v3p-footer.meta .v3p-base-copy{grid-column:1/3}
        .v3p-footer.meta .v3p-socials{grid-column:5/8}
        .v3p-footer.meta .v3p-footer-base>button{grid-column:8/9;justify-self:end}
        .v3p-footer-nav{height:56px;padding:0 2vw;display:grid;grid-template-columns:1fr 1fr 2fr;align-items:center}
        .v3p-footer-menu{display:flex;justify-content:space-between;grid-column:3/4}






        .v3p-footer-in{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 2vw;
          overflow:hidden;
          transform:translateY(calc(-80px * (1 - var(--fp))))}

        .v3p-footer-grid{display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:3vw;align-items:start;padding-bottom:4vw}
        .v3p-next{grid-column:1/5;grid-row:1;display:flex;flex-direction:column;gap:.5vw;margin-bottom:8vw}
        .v3p-next-row{display:flex;align-items:flex-start;cursor:pointer}
        .v3p-next-count{margin-top:.45vw;margin-left:.6vw}
        .v3p-fcontact{grid-column:1/3;grid-row:2/4}
        .v3p-fcontact-h{margin-bottom:2vw;width:76%}
        .v3p-fcols{display:contents}
        .v3p-fcols>div{width:22.5vw}
        .v3p-fcols>div:nth-child(1){grid-column:5/7;grid-row:2}
        .v3p-fcols>div:nth-child(2){grid-column:7/9;grid-row:2}
        .v3p-fcols>div:nth-child(3){grid-column:7/9;grid-row:3}
        .v3p-fcols>div:nth-child(4){grid-column:5/7;grid-row:3}
        .v3p-fcols li{margin-bottom:6px}

        .v3p-footer-base{padding:2vw;display:flex;justify-content:space-between;align-items:center;gap:2vw;border-top:1px solid ${LEMAN}}
        .v3p-socials{display:flex}
        .v3p-socials a{width:10.25vw}
        .v3p-legalinks{display:flex;gap:1.2vw;flex-wrap:wrap}

        /* C4: skip to content, invisible until focused. Navigation otherwise adds
           dozens of tab stops before main on every page. */
        .v3p-skip{position:absolute;left:-9999px;top:0}
        .v3p-skip:focus{position:fixed;left:2vw;top:8px;z-index:70;background:${NOIR};color:${ALPIN};padding:8px 12px}
        .v3p-main:focus{outline:none}

        .v3p-cursor{pointer-events:none;position:fixed;top:0;left:0;z-index:1000;padding:3px 6px 4px;
          border:1px solid ${NOIR};background:${NOIR};color:${ALPIN};font-size:14px;text-transform:uppercase;
          white-space:nowrap;opacity:0;transition:opacity .3s linear}

        /* G4: article reader.
           The project lightbox (F12) was removed because the component was mounted
           but never opened. Its exclusive rules (.v3p-lightbox, .v3p-lbtrack,
           .v3p-lbslide, .v3p-lbprog) were removed with it. The remaining rules are
           used by the article reader: wrap, veil, bar, name and count. */
        .v3p-lbwrap{position:fixed;inset:0;z-index:120}
        .v3p-veil{position:absolute;inset:0;background:rgba(10,10,11,.5);opacity:0;transition:opacity .6s linear}
        .v3p-lbwrap.in .v3p-veil{opacity:1}
        .v3p-reader{position:absolute;top:56px;left:0;right:0;bottom:0;display:flex;flex-direction:column;
          border-radius:12px 12px 0 0;overflow:hidden;transform:translateY(100%);
          transition:transform 1s cubic-bezier(.4,.4,.1,1);background:${ALPIN};color:${NOIR}}
        .v3p-lbwrap.in .v3p-reader{transform:translateY(0)}
        .v3p-lbbar{position:relative;display:grid;grid-template-columns:1fr auto auto;align-items:center;column-gap:2vw;
          padding:1.2vw 2vw;border-bottom:1px solid rgba(255,255,255,.25)}
        .v3p-readerbar{border-bottom:1px solid ${LEMAN}}
        .v3p-lbname{text-transform:uppercase}
        .v3p-lbcount{color:${LEMAN}}
        .v3p-readerbody{flex:1;overflow-y:auto;padding:0 2vw 8vw}
        .v3p-readerimg{margin:0 -2vw 3vw;height:28vw;overflow:hidden}
        .v3p-readerimg img{width:100%;height:100%;object-fit:cover}
        .v3p-readerbody h1{max-width:22ch;margin-bottom:2vw}
        .v3p-readertext{max-width:56ch}
        .v3p-readertext p{margin-bottom:1.2em}
        .v3p-readertext h2{margin:2em 0 .8em}

        /* E6: preloader, only when opening a page directly. */
        .v3p-pre{position:fixed;inset:0;z-index:200;background:${ALPIN};color:${NOIR};display:flex;flex-direction:column;
          justify-content:space-between;align-items:flex-end;padding:2vw;clip-path:inset(0);
          transition:clip-path .75s cubic-bezier(.645,.045,.355,1)}
        .v3p-pre.out{clip-path:inset(0 0 100% 0)}
        .v3p-pre img{height:23.9px;width:auto}
        .v3p-pre-foot{display:flex;align-items:center;gap:12px}
        .v3p-pre-bar{width:64px;height:1px;background:${LEMAN};overflow:hidden}
        .v3p-pre-bar i{display:block;height:100%;background:${NOIR};transition:width .2s linear}

        /* E7: page transitions use the V3 home panel (.v3-trans). The .v3p-trans
           rules that lived here had no JSX consumer. */

        /* Pill, corrected pattern: 9x20, centred label at line-height 1, no extra gap. */
        .v3p-btn{display:inline-block;line-height:14px;user-select:none}
        .v3p-btn-in{position:relative;display:inline-block}
        .v3p-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px 26px;border-radius:999px}
        .v3p-mask-hidden{position:relative;visibility:hidden}
        .v3p-btn-sizer{display:grid;justify-items:start}
        .v3p-btn-sizer>*{grid-area:1/1}
        /* F1: --diff is how much wider the revealed label is than the resting one.
           The resting pill is clipped by that amount, removing the spare space on
           the right, while label padding keeps the visible part centred. On hover,
           the frame opens and the dark layer collapses to a point. */
        .v3p-mask-bottom{background:${CITRON};color:${NOIR};clip-path:inset(1px calc(var(--diff,0px) + 1px) 1px 1px round 999px);
          transition:clip-path .6s cubic-bezier(.4,.4,.1,1)}
        .v3p-mask-top{background:${NOIR};color:${ALPIN};padding:12px calc(26px + var(--diff,0px)) 12px 26px;
          clip-path:inset(0px var(--diff,0px) 0px 0px round 999px);transition:clip-path .6s cubic-bezier(.4,.4,.1,1)}
        .v3p-btn:hover .v3p-mask-bottom{clip-path:inset(1px 1px 1px 1px round 999px)}
        .v3p-btn:hover .v3p-mask-top{clip-path:inset(4px var(--cut,60%) 4px 4px round 999px)}

        .v3p-btn-t{font-size:12px;line-height:1;white-space:nowrap;text-transform:uppercase;letter-spacing:-.01em;display:block;transform:translateY(-.085em)}


        /* 769-1280: Text_p body copy stays at 14px. The 1.111vw size starts at 1281. */
        @media (min-width:769px) and (max-width:1280px){.v3p-p{font-size:14px}}
        @media (min-width:1441px){.v3p-xxs{font-size:.9vw}.v3p-xs{font-size:1vw}}
        @media (min-width:1921px){.v3p-xxs{font-size:.6vw}.v3p-xs{font-size:.7vw}.v3p-s{font-size:1.4vw}.v3p-p{font-size:.9vw}}

        @media (max-width:915px){
          .v3p-newswrap{grid-template-columns:1fr}
          .v3p-article:after{width:100%}
          .v3p-article:nth-of-type(even):after,.v3p-article:nth-last-of-type(-n+2):after{display:block}
          .v3p-article:last-of-type:after{display:none}
        }

        /* Responsive rules. */
        @media (max-width: 768px){
          .v3p-xl{font-size:11vw;line-height:.9}
          .v3p-l{font-size:9.5vw}
          .v3p-m{font-size:6.9vw;line-height:1.1}
          .v3p-s{font-size:4.4vw;line-height:1}
          .v3p-p{font-size:16px}
          .v3p-margin{margin-left:4vw;margin-right:4vw}
          .v3p-nav{grid-template-columns:1fr auto;padding:0 4vw}


  .v3p-logo{flex:0 0 auto;min-width:0}
  .v3p-logo img{height:17px;width:auto;max-width:none}

          .v3p-tagline,.v3p-langs{display:none}
          .v3p-navend{grid-column:auto;justify-self:end}
          .v3p-links{gap:10px}
          .v3p-links .v3p-lnk{font-size:12px}
          .v3p-lrg-box{height:80vw}
          .v3p-servblock+.v3p-servblock{padding-top:12vw;margin-top:0}
          .v3p-awards{grid-template-columns:1fr;margin-top:20vw}
          .v3p-awards-p{grid-column:1/-1}
          .v3p-awards-groups{grid-template-columns:1fr;column-gap:2vw;row-gap:8vw}
          .v3p-reader{border-radius:8px 8px 0 0}
          .v3p-readerimg{height:56vw}
          .v3p-field-tel .v3p-input{padding-left:0}
          .v3p-label-tel{left:0}
          .v3p-dialbtn{position:static;margin-bottom:6px}
          .v3p-diallist{top:auto;bottom:18px}
          .v3p-diallist.open{height:52vw}
          .v3p-workhead{grid-template-columns:1fr 1fr;row-gap:4vw;padding-top:24vw}
          .v3p-workhead-title{grid-column:1/-1}
          .v3p-filterwrap{display:none}
          .v3p-viewtoggle{grid-column:1/-1;justify-self:start}
          .v3p-workgrid{margin:0 4vw}
          .v3p-works{grid-template-columns:1fr;row-gap:3vw;padding-top:3vw}
          .v3p-bordv{display:none}
          .v3p-work{padding:0}
          .v3p-work-visual{height:auto}
          .v3p-work-info{margin-top:4vw;margin-bottom:12vw}
          .v3p-work-title{margin-top:2.8vw}
          .v3p-work:nth-last-child(2) .v3p-work-line{display:flex}
          .v3p-worknum{font-size:2vw;line-height:1}
          .v3p-worklist{margin:4vw}
          .v3p-listhead{grid-template-columns:1fr auto;padding:3.4vw 0}
          .v3p-listtags{display:none}
          .v3p-liststrip img{height:34vw;width:52vw}
          .v3p-newshead{padding:24vw 0 3vw;grid-template-columns:1fr 1fr}
          .v3p-newstitle,.v3p-newssub,.v3p-newsp{grid-column:1/-1}
          .v3p-newssort{grid-column:1/-1}
          .v3p-newswrap{grid-template-columns:1fr}
          .v3p-article{grid-template-columns:1fr;row-gap:6vw;padding:8vw 0}
          .v3p-article-img img{height:56vw}
          .v3p-contact{padding-top:24vw;grid-template-columns:1fr;grid-template-areas:"t" "f" "d" "c";row-gap:12vw;margin-bottom:12vw}
          .v3p-contact-form{margin-bottom:8vw}
          .v3p-contact-desc{width:100%}
          .v3p-contact-cols{flex-direction:column;gap:8vw}
          .v3p-contact-cols>div{width:auto}

          .v3p-mask{position:relative;padding:8px 16px}
          .v3p-mask-bottom,.v3p-mask-hidden{display:none}
          .v3p-mask-top{clip-path:none;padding:8px 16px}
          .v3p-pagehero{padding:24vw 0 16vw}
          .v3p-pagehero-sub,.v3p-pagehero-desc{grid-column:1/-1}
          .v3p-servblock{grid-template-columns:1fr;row-gap:6vw;padding:12vw 0}
          .v3p-servcase-visual{height:60vw}
          .v3p-servinfo{width:100%}
          .v3p-pillars{grid-template-columns:1fr;row-gap:10vw;margin-top:20vw}
          .v3p-pillars-head{width:100%}
          .v3p-pillars-grid{display:none}
          .v3p-pillars-acc{display:block}
          .v3p-dropdown{min-width:52vw}
          .v3p-droplabel{padding:3vw 4vw}
          .v3p-footer-nav{grid-template-columns:1fr;padding:0 4vw}
          .v3p-footer-menu{display:none}
          .v3p-footer{min-height:auto}
          .v3p-footer-in{padding:18vw 4vw 20vw;transform:none;justify-content:flex-start}
          .v3p-footer-grid{grid-template-columns:1fr;padding-bottom:0}
          .v3p-next{grid-column:auto;grid-row:auto;margin-bottom:6vw}
          .v3p-fcontact{grid-column:auto;grid-row:auto}
          .v3p-fcontact-h{width:100%}
          .v3p-fcols{display:grid;grid-template-columns:1fr 1fr;column-gap:4vw;row-gap:6vw;grid-column:auto}
          .v3p-fcols>div{width:auto;grid-column:auto;grid-row:auto}
          .v3p-footer-base{padding:4vw;flex-wrap:wrap}
          .v3p-socials{gap:4vw}
          .v3p-socials a{width:auto}
          .v3p-footer.meta .v3p-footer-base{display:flex;height:auto;padding:4vw}
        }


        @media (max-width: 480px){
          .v3p-navend{display:none}
          .v3p-menubtn{display:block;justify-self:end}
          .v3p-overlay-links .v3p-biglink{font-size:13vw}
          .v3p-lrg-box{height:140vw}
          .v3p-worknum{font-size:5vw}
        }

        /* Reduced motion. */
        @media (prefers-reduced-motion: reduce){
          .v3p-root *{transition-duration:.01s !important;animation:none !important}
          .v3p-w,.v3p-rise,.v3p-imgfx,.v3p-fadeup{transform:none !important;opacity:1 !important}
          .v3p-fillw{width:100% !important}
          .v3p-bordv{height:calc(100% - 1vw) !important}
          .v3p-article:after,.v3p-rowline i,.v3p-line i{transform:none !important}
          .v3p-lrg-box{width:100% !important}
          .v3p-lrg-up,.v3p-lrg-img{transform:none !important}
          .v3p-footer-in{transform:none !important}
          .v3p-reader{transform:none !important}
          .v3p-veil{opacity:1 !important}
        }
      `}</style>

      {                                                                             }
      <a className="v3p-skip v3p-xs" href="#v3p-main">{t.skipLink}</a>

      <div ref={cursorRef} className="v3p-cursor" aria-hidden="true" />
      <CursorAbil />

      {

                                                         }

      {                           }
      <nav className={`v3p-nav${menuOpen ? " menuaberto" : ""}${navHidden && !menuOpen ? " hide" : ""}${rolled && !menuOpen ? " rolled" : ""}${navNamed ? " named" : ""}`} aria-label={t.navAria}>
        <div className="v3p-navpage">
          <button className="v3p-logo" type="button" onClick={() => nav("home")} aria-label={t.logoAria}>
            <AbilLogoLoop />
          </button>
          {                                                                                    }
          <span className="v3p-navdash v3p-xs" aria-hidden="true">·</span>
          <span className="v3p-navnamem v3p-xs">
            {                                                              }
            <span className="v3p-navname" data-ed={`v3.ui.nav.${page}`}>{edTxt(lang, `v3.ui.nav.${page}`, navLabel(page, lang), 160)}</span>
          </span>
        </div>
        <div className="v3p-tagline v3p-xxs">
          {                                                                                  }
          <RiseP d={0.2}><span data-ed="v3.home.hero.l1">{edTxt(lang, "v3.home.hero.l1", t.heroTag[0], 160)}</span></RiseP>
          <RiseP d={0.3}><span data-ed="v3.home.hero.l2">{edTxt(lang, "v3.home.hero.l2", t.heroTag[1], 160)}</span></RiseP>
        </div>
        <div className="v3p-langs v3p-xxs" aria-label={t.langsAria}>
          {langsOn.map((l, i) => (
            <RiseP d={0.3 + i * 0.05} key={l}>
              <button type="button" className={`v3p-lnk${l === lang ? " on" : ""}`} onClick={() => setLang(l)}>{l}</button>
            </RiseP>
          ))}
        </div>
        {                                                                    }
        <div className="v3p-navend">
          <div className="v3p-links v3p-xs">
            {navVis.map((n, i) => (
              <span className="v3p-navroll" key={n.page} style={{ "--i": i } as React.CSSProperties}>
                <RiseP d={0.35 + i * 0.06}>
                  <button type="button" className={`v3p-lnk${n.page === page ? " on" : ""}`} tabIndex={rolled ? -1 : 0} onClick={() => nav(n.page)}>
                    <span data-ed={`v3.ui.nav.${n.page}`}>{edTxt(lang, `v3.ui.nav.${n.page}`, n.label[lang], 160)}</span>
                    {n.count ? <span className="v3p-count">{n.page === "projets" ? contagemCasos : n.count}</span> : null}
                  </button>
                </RiseP>
              </span>
            ))}
          </div>
          <span className="v3p-navmenu v3p-xs">
            {
                                                                                       }
            <span><button type="button" className="v3p-lnk" tabIndex={rolled ? 0 : -1} onClick={() => setNavPeek(true)}><span data-ed="v3.ui.nav.menu">{edTxt(lang, "v3.ui.nav.menu", UIP[lang].menu, 160)}</span></button></span>
          </span>
        </div>
        <button className="v3p-menubtn v3p-xs" type="button" onClick={() => setMenuOpen(true)}><span data-ed="v3.ui.nav.menu">{edTxt(lang, "v3.ui.nav.menu", UIP[lang].menu, 160)}</span></button>
      </nav>

      {                                                                            }
      <div className={`v3p-overlay${menuOpen ? " open" : ""}`} role="dialog" aria-modal="true" aria-label={t.menuAria} aria-hidden={!menuOpen}>
        <div className="v3p-overlay-top">
          <span className="v3p-xs" data-ed="v3.ui.nav.marque">{edTxt(lang, "v3.ui.nav.marque", "ABiL MEDiAS®", 160)}</span>
          <button className="v3p-xs v3p-lnk" type="button" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}><span data-ed="v3.ui.nav.fermer">{edTxt(lang, "v3.ui.nav.fermer", UIP[lang].fermer, 160)}</span></button>
        </div>
        <div className="v3p-overlay-links">
          {navVis.map((n, i) => (
            <button key={n.page} type="button" className="v3p-biglink" tabIndex={menuOpen ? 0 : -1}
              style={{ "--i": i } as React.CSSProperties} onClick={() => nav(n.page)}>
              <i><span data-ed={`v3.ui.nav.${n.page}`}>{edTxt(lang, `v3.ui.nav.${n.page}`, n.label[lang], 160)}</span>{n.count ? <span className="v3p-count">{n.page === "projets" ? contagemCasos : n.count}</span> : null}</i>
            </button>
          ))}
        </div>
        <div className="v3p-langs v3p-xxs" style={{ display: "flex" }}>
          {langsOn.map((l) => (
            <button key={l} type="button" className={`v3p-lnk${l === lang ? " on" : ""}`} tabIndex={menuOpen ? 0 : -1} onClick={() => setLang(l)}>{l}</button>
          ))}
        </div>
      </div>

      <main id="v3p-main" className="v3p-main" tabIndex={-1}>
        {page === "projets" ? <ProjetsBody lang={lang} onNav={onNav} /> : null}
        {page === "journal" ? <JournalBody lang={lang} onNav={onNav} /> : null}
        {page === "contact" ? <ContactBody lang={lang} /> : null}
        {page === "services" ? <ServicesBody lang={lang} onNav={nav} /> : null}
      </main>

      {                                                                      }
      <footer className={`v3p-footer v3p-io${page === "contact" ? " meta" : ""}`} ref={footerRef}>
        {page === "contact" ? null : (
        <div className="v3p-footer-nav">
          {                                                                       }
          <button type="button" className="v3p-foot-home" onClick={() => nav("home")} aria-label={t.logoAria}>
            <img className="v3p-foot-logo" src="/brand/abil-wordmark.svg" alt="ABiL MEDiAS" />
          </button>
          <span />
          <div className="v3p-footer-menu v3p-xs">
            {navVis.map((n) => (
              <button key={n.page} type="button" className={`v3p-lnk${n.page === page ? " on" : ""}`} onClick={() => nav(n.page)}><span data-ed={`v3.ui.nav.${n.page}`}>{edTxt(lang, `v3.ui.nav.${n.page}`, n.label[lang], 160)}</span></button>
            ))}
          </div>
        </div>
        )}
        {page === "contact" ? null : (
        <div className="v3p-footer-in">
          <div className="v3p-footer-grid">
            <div className="v3p-next">
              <span className="v3p-xs v3p-nextlbl" data-ed="v3.ui.shell.nextPage">{edTxt(lang, "v3.ui.shell.nextPage", UIP[lang].nextPage, 160)}</span>
              <button type="button" className="v3p-next-row" onClick={() => nav(nextPage)}>
                <span className="v3p-l v3p-lnk" data-ed={`v3.ui.nav.${nextPage}`}>{edTxt(lang, `v3.ui.nav.${nextPage}`, navLabel(nextPage, lang), 160)}</span>
                {nextPage === "projets" ? <span className="v3p-next-count v3p-s">{contagemCasos}</span> : null}
              </button>
            </div>
            <div className="v3p-fcontact">
              <div className="v3p-fcontact-h v3p-s" data-ed="v3.ui.shell.fcontactH">{edTxt(lang, "v3.ui.shell.fcontactH", UIP[lang].footerHead, 160)}</div>
              <PillP top={edTxt(lang, "v3.ui.shell.contacter", UIP[lang].contactTop, 160)} reveal={edTxt(lang, "v3.ui.shell.escreva", UIP[lang].contactReveal, 160)}
                edTop="v3.ui.shell.contacter" edReveal="v3.ui.shell.escreva" onClick={() => nav("contact")} />
            </div>
            <div className="v3p-fcols">
              <div>
                <div className="v3p-colh v3p-xxs" data-ed="v3.ui.shell.colContacts">{edTxt(lang, "v3.ui.shell.colContacts", UIP[lang].colBiz, 160)}</div>
                <ul>
                  <li><a className="v3p-xs v3p-lnk" href={emailHref} data-ed="v3.ui.shell.email">{emailTxt}</a></li>
                  <li><a className="v3p-xs v3p-lnk" href={telHref} data-ed="v3.ui.shell.tel">{telTxt}</a></li>
                </ul>
              </div>
              <div>
                <div className="v3p-colh v3p-xxs" data-ed="v3.ui.shell.colCandid">{edTxt(lang, "v3.ui.shell.colCandid", UIP[lang].colJobs, 160)}</div>
                <ul><li><a className="v3p-xs v3p-lnk" href={emailHref} data-ed="v3.ui.shell.email">{emailTxt}</a></li></ul>
              </div>
              <div>
                <div className="v3p-colh v3p-xxs" data-ed="v3.ui.shell.colVille">{edTxt(lang, "v3.ui.shell.colVille", UIP[lang].colCity, 160)}</div>
                <ul>
                  <li className="v3p-xs" data-ed="v3.ui.shell.adr1">{edTxt(lang, "v3.ui.shell.adr1", "Rue de Berne 59", 160)}</li>
                  <li className="v3p-xs" data-ed="v3.ui.shell.adr2">{edTxt(lang, "v3.ui.shell.adr2", "1201 Genève", 160)}</li>
                  <li className="v3p-xs" data-ed="v3.ui.shell.adr3">{edTxt(lang, "v3.ui.shell.adr3", UIP[lang].country, 160)}</li>
                </ul>
              </div>
              <div>
                <div className="v3p-colh v3p-xxs" data-ed="v3.ui.shell.colHoraires">{edTxt(lang, "v3.ui.shell.colHoraires", UIP[lang].colHours, 160)}</div>
                <ul>
                  <li className="v3p-xs" data-ed="v3.ui.shell.hor1">{edTxt(lang, "v3.ui.shell.hor1", UIP[lang].hoursDays, 160)}</li>
                  <li className="v3p-xs" data-ed="v3.ui.shell.hor2">{edTxt(lang, "v3.ui.shell.hor2", "08:00 - 18:00", 160)}</li>
                  <RelogioZurich lang={lang} />
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}
        <div className="v3p-footer-base v3p-xs">
          <span className="v3p-base-copy" data-ed="v3.ui.shell.copy">{edTxt(lang, "v3.ui.shell.copy", "ABiL MEDiAS® ©2026", 160)}</span>
          {

                                                                              }
          {page === "contact" ? null : (
          <div className="v3p-legalinks v3p-xs">
            <button type="button" className="v3p-lnk" onClick={() => nav("etudes")}><span data-ed="v3.ui.shell.lnkCases">{edTxt(lang, "v3.ui.shell.lnkCases", UIP[lang].etudesLink, 160)}</span></button>
            <button type="button" className="v3p-lnk" onClick={() => nav("confidentialite")}><span data-ed="v3.ui.shell.lnkPrivacy">{edTxt(lang, "v3.ui.shell.lnkPrivacy", UIP[lang].privacyLink, 160)}</span></button>
            <button type="button" className="v3p-lnk" onClick={() => nav("conditions")}><span data-ed="v3.ui.shell.lnkTerms">{edTxt(lang, "v3.ui.shell.lnkTerms", UIP[lang].termsLink, 160)}</span></button>
          </div>
          )}
          {                                                                }
          <div className="v3p-socials">
            {SOCIALS.map((s) => (
              <a key={s.name} className="v3p-lnk" href={s.href} target="_blank" rel="noreferrer noopener" data-ed={`v3.ui.shell.${s.ed}`}>{edTxt(lang, `v3.ui.shell.${s.ed}`, s.name, 160)}</a>
            ))}
          </div>
          <button type="button" className="v3p-lnk" onClick={backToTop}><span data-ed="v3.ui.shell.lnkTop">{edTxt(lang, "v3.ui.shell.lnkTop", UIP[lang].backTop, 160)}</span></button>
        </div>
      </footer>

      {
                                                                             }
      <EditLayerV3 lang={lang} />
    </div>
  );
}
