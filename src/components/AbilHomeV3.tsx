









import { useEffect, useRef, useState } from "react";
import { AbilLogoLoop } from "./AbilLogoLoop";
import { ABIL_LANGS } from "./AbilSite";
import { type AbilLang } from "./AbilSite";
import Lenis from "lenis";
import { AbilV3Page } from "./AbilV3Pages";
import { ABIL_POSTS, readingMinutes } from "./abil/posts";
import { nomeCaso, usePublicados, usePublicadosACarregar, slugsPublicados } from "./abil/publicados";
import { useJornal, slugsJornal, capaDoJornal } from "./abil/jornal";
import { edTxt, edSrc, edUi, edCfg, edCfgTxt, useEdicoesSite } from "../lib/siteEdits";
import { EditLayerV3 } from "./abil/EditLayerV3";
import { CursorAbil } from "./abil/CursorAbil";
import {
  AbilV3Case, AbilV3Service, AbilV3Agence, AbilV3Article,
  AbilV3CaseOverview, AbilV3Legal, AbilV3NotFound, v3dDocTitle, v3dDocDescription,
  V3D_CASE_SLUGS, V3D_SERVICE_SLUGS, V3D_LEGAL_KINDS,
  type V3DLegalKind, type V3DPageKind,
} from "./AbilV3Detail";


const NOIR = "#0a0a0b";
const ALPIN = "#ffffff";
const LEMAN = "#c7c7c7";
const TELA = "#efefef";
const RHONE = "#7e7e7e";
const CITRON = "#d2ff01";







const _PINHO_RETIRADO = "#0b2622";



const VIOLETTE = "#be8efc";


type L5 = Record<AbilLang, string>;

const HERO_LINE: L5 = {
  fr: "Une agence de communication portée par la stratégie",
  en: "A communication agency driven by strategy and craft",
  pt: "Uma agência de comunicação guiada pela estratégia",
  de: "Eine von Strategie getragene Kommunikationsagentur",
  it: "Un'agenzia di comunicazione guidata dalla strategia",
};
const HERO_SUB: Record<AbilLang, [string, string]> = {
  fr: ["Vraiment", "Habiles."],
  en: ["Truly", "Able."],
  pt: ["Realmente", "Hábeis."],
  de: ["Wirklich", "Fähig."],
  it: ["Davvero", "Abili."],
};






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




const WORKS: { slug: string; img: string; title: string; tags: TagKey[] }[] = [
  { slug: "trame-urbaine", img: "/brand/mock-cartaz-2.jpg", title: "Trame Urbaine", tags: ["identite", "dircrea", "strategie"] },
  { slug: "ligne-claire", img: "/brand/mock-website-2.jpg", title: "Ligne Claire", tags: ["digital", "devweb"] },
  { slug: "voix-de-berne", img: "/brand/mock-billboard-2.jpg", title: "Voix de Berne", tags: ["dircrea", "campagne"] },
  { slug: "carte-blanche", img: "/brand/mock-billboard-2.jpg", title: "Carte Blanche", tags: ["identite", "campagne", "affichage"] },
  { slug: "signal-leman", img: "/brand/mock-glass-card.jpg", title: "Signal Léman", tags: ["identite", "edition"] },
  { slug: "nuit-blanche", img: "/brand/kv-logo-black-2.jpg", title: "Nuit Blanche", tags: ["digital", "dircrea"] },
];


const WORKS_COUNT = String(WORKS.length).padStart(2, "0");

const ABOUT_TITLE: L5 = { fr: "L'agence", en: "The agency", pt: "A agência", de: "Die Agentur", it: "L'agenzia" };
const ABOUT_SUB: L5 = {
  fr: "Une agence genevoise qui repense la manière dont les gens rencontrent les marques.",
  en: "A Geneva agency rethinking the way people meet and remember brands.",
  pt: "Uma agência de Genebra que repensa a forma como as pessoas encontram as marcas.",
  de: "Eine Genfer Agentur, die neu denkt, wie Menschen Marken begegnen und vertrauen.",
  it: "Un'agenzia di Ginevra che ripensa il modo in cui le persone incontrano i brand.",
};
const ABOUT_P: L5 = {
  fr: "Nous sommes une petite équipe de curieux, réunie autour d'un directeur de création, qui signe un travail dont elle est fière " +
    "pour des gens et des marques en qui elle croit. La collaboration est au coeur de chaque projet: nous identifions les " +
    "savoir-faire nécessaires, puis réunissons les bonnes personnes pour créer quelque chose de singulier. En mêlant stratégie, " +
    "identité, sites web et contenus, nous construisons des expériences qui changent la relation entre les gens et les marques.",
  en: "We are a small team of curious minds, gathered around a creative director, doing work we are proud of for people and " +
    "brands we believe in. Collaboration sits at the heart of every project: we identify the skills required, then bring the " +
    "right people together to create something singular. Blending strategy, identity, websites and content, we build " +
    "experiences that change the relationship between people and brands.",
  pt: "Somos uma equipa pequena e curiosa, reunida em torno de um diretor de criação, que assina um trabalho de que se orgulha " +
    "para pessoas e marcas em que acredita. A colaboração está no coração de cada projeto: identificamos os saberes " +
    "necessários e juntamos as pessoas certas para criar algo singular. Ao cruzar estratégia, identidade, sites e conteúdos, " +
    "construímos experiências que mudam a relação entre as pessoas e as marcas.",
  de: "Wir sind ein kleines, neugieriges Team um einen Creative Director, das Arbeit macht, auf die es stolz ist, für Menschen " +
    "und Marken, an die es glaubt. Zusammenarbeit steht im Zentrum jedes Projekts: Wir erkennen die nötigen Fähigkeiten und " +
    "bringen die richtigen Leute zusammen, um etwas Eigenes zu schaffen. Mit Strategie, Identität, Websites und Inhalten " +
    "bauen wir Erlebnisse, die die Beziehung zwischen Menschen und Marken verändern.",
  it: "Siamo una piccola squadra di curiosi, riunita attorno a un direttore creativo, che firma un lavoro di cui è fiera per " +
    "persone e brand in cui crede. La collaborazione è al cuore di ogni progetto: individuiamo le competenze necessarie e " +
    "riuniamo le persone giuste per creare qualcosa di singolare. Intrecciando strategia, identità, siti web e contenuti, " +
    "costruiamo esperienze che cambiano il rapporto tra le persone e i brand.",
};





const CLIENTS_TITLE: L5 = { fr: "Ce que nous savons faire", en: "What we know how to do", pt: "O que sabemos fazer", de: "Was wir können", it: "Cosa sappiamo fare" };


const CLIENTS: { k: string; name: L5; top: L5; reveal: L5; p: L5 }[] = [
  { k: "horlogerie", name: { fr: "Horlogerie", en: "Watchmaking", pt: "Relojoaria", de: "Uhrmacherei", it: "Orologeria" },
    top: { fr: "Nos services", en: "Our services", pt: "Os nossos serviços", de: "Unsere Leistungen", it: "I nostri servizi" },
    reveal: { fr: "En parler", en: "Talk to us", pt: "Falar connosco", de: "Sprechen wir", it: "Parliamone" },
    p: {
      fr: "Une image à la hauteur du geste. Nous travaillons la ligne sobre qui laisse la précision parler: identité, supports, site, jusqu'au détail du réglage typographique.",
      en: "An image worthy of the craft. We work the sober line that lets precision speak: identity, materials, website, down to the detail of the typographic setting.",
      pt: "Uma imagem à altura do gesto. Trabalhamos a linha sóbria que deixa a precisão falar: identidade, suportes, site, até ao detalhe do acerto tipográfico.",
      de: "Ein Auftritt auf Höhe des Handwerks. Wir arbeiten die nüchterne Linie, die die Präzision sprechen lässt: Identität, Unterlagen, Website, bis ins typografische Detail.",
      it: "Un'immagine all'altezza del gesto. Lavoriamo la linea sobria che lascia parlare la precisione: identità, supporti, sito, fino al dettaglio tipografico.",
    } },
  { k: "hotellerie", name: { fr: "Hôtellerie", en: "Hospitality", pt: "Hotelaria", de: "Hotellerie", it: "Ospitalità" },
    top: { fr: "Nos services", en: "Our services", pt: "Os nossos serviços", de: "Unsere Leistungen", it: "I nostri servizi" },
    reveal: { fr: "En parler", en: "Talk to us", pt: "Falar connosco", de: "Sprechen wir", it: "Parliamone" },
    p: {
      fr: "L'accueil commence avant la porte. Nous alignons le nom, la voix et les supports pour que la promesse tienne du premier écran jusqu'à la chambre.",
      en: "Welcome starts before the door. We align the name, the voice and the materials so the promise holds from the first screen to the room.",
      pt: "O acolhimento começa antes da porta. Alinhamos o nome, a voz e os suportes para que a promessa se cumpra do primeiro ecrã até ao quarto.",
      de: "Gastfreundschaft beginnt vor der Tür. Wir bringen Name, Stimme und Unterlagen in Einklang, damit das Versprechen vom ersten Bildschirm bis ins Zimmer trägt.",
      it: "L'accoglienza inizia prima della porta. Allineiamo nome, voce e supporti perché la promessa regga dal primo schermo alla camera.",
    } },
  { k: "culture", name: { fr: "Culture", en: "Culture", pt: "Cultura", de: "Kultur", it: "Cultura" },
    top: { fr: "Nos services", en: "Our services", pt: "Os nossos serviços", de: "Unsere Leistungen", it: "I nostri servizi" },
    reveal: { fr: "En parler", en: "Talk to us", pt: "Falar connosco", de: "Sprechen wir", it: "Parliamone" },
    p: {
      fr: "Une programmation se lit de loin. Affiche, signalétique et campagne pensées ensemble, pour que le public sache où aller sans lire deux fois.",
      en: "A programme is read from afar. Poster, signage and campaign designed together, so the audience knows where to go without reading twice.",
      pt: "Uma programação lê-se de longe. Cartaz, sinalética e campanha pensados juntos, para o público saber onde ir sem ler duas vezes.",
      de: "Ein Programm liest man aus der Ferne. Plakat, Leitsystem und Kampagne zusammen gedacht, damit das Publikum ohne zweimal zu lesen weiss, wohin.",
      it: "Un cartellone si legge da lontano. Manifesto, segnaletica e campagna pensati insieme, perché il pubblico sappia dove andare senza rileggere.",
    } },
  { k: "institution", name: { fr: "Institutions", en: "Institutions", pt: "Instituições", de: "Institutionen", it: "Istituzioni" },
    top: { fr: "Nos services", en: "Our services", pt: "Os nossos serviços", de: "Unsere Leistungen", it: "I nostri servizi" },
    reveal: { fr: "En parler", en: "Talk to us", pt: "Falar connosco", de: "Sprechen wir", it: "Parliamone" },
    p: {
      fr: "Parler clair engage. Nous mettons de l'ordre dans le message et dans les documents, pour qu'une décision publique se comprenne à la première lecture.",
      en: "Speaking clearly is a commitment. We put the message and the documents in order, so a public decision is understood on first reading.",
      pt: "Falar claro compromete. Pomos ordem na mensagem e nos documentos, para que uma decisão pública se perceba à primeira leitura.",
      de: "Klar zu sprechen verpflichtet. Wir bringen Botschaft und Dokumente in Ordnung, damit eine öffentliche Entscheidung beim ersten Lesen verstanden wird.",
      it: "Parlare chiaro impegna. Mettiamo ordine nel messaggio e nei documenti, perché una decisione pubblica si capisca alla prima lettura.",
    } },
];

const METIERS_TITLE: L5 = { fr: "Les métiers de la maison", en: "The crafts of the house", pt: "Os ofícios da casa", de: "Das Handwerk des Hauses", it: "I mestieri della casa" };

const METIERS: { k: string; name: L5; tags: L5; p: L5 }[] = [
  { k: "strategie", name: { fr: "Stratégie", en: "Strategy", pt: "Estratégia", de: "Strategie", it: "Strategia" },
    tags: { fr: "Recherche - Positionnement", en: "Research - Positioning", pt: "Pesquisa - Posicionamento", de: "Recherche - Positionierung", it: "Ricerca - Posizionamento" },
    p: {
      fr: "Avant de dessiner, nous écoutons. Étude du marché, des publics et de la concurrence, définition du positionnement et du ton: la stratégie donne un cap à chaque décision créative et évite les allers-retours coûteux.",
      en: "Before we draw, we listen. Market, audience and competitor research, definition of positioning and tone: strategy gives every creative decision a heading and spares costly back and forth.",
      pt: "Antes de desenhar, escutamos. Estudo do mercado, dos públicos e da concorrência, definição do posicionamento e do tom: a estratégia dá um rumo a cada decisão criativa e evita idas e voltas custosas.",
      de: "Bevor wir gestalten, hören wir zu. Markt-, Publikums- und Wettbewerbsanalyse, Definition von Positionierung und Ton: Die Strategie gibt jeder kreativen Entscheidung einen Kurs und erspart teure Schleifen.",
      it: "Prima di disegnare, ascoltiamo. Studio del mercato, dei pubblici e della concorrenza, definizione del posizionamento e del tono: la strategia dà una rotta a ogni decisione creativa ed evita costosi avanti e indietro.",
    } },
  { k: "identite", name: { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" },
    tags: { fr: "Design - Chartes", en: "Design - Guidelines", pt: "Design - Manuais", de: "Design - Richtlinien", it: "Design - Linee guida" },
    p: {
      fr: "Logos, chartes graphiques, typographies et déclinaisons: nous posons des identités faites pour durer, assez solides pour tenir des années et assez souples pour vivre sur tous les supports, de la carte de visite à l'écran géant.",
      en: "Logos, brand guidelines, typography and variations: we set identities built to last, solid enough to hold for years and supple enough to live on every medium, from business card to giant screen.",
      pt: "Logótipos, manuais gráficos, tipografias e declinações: assentamos identidades feitas para durar, sólidas para aguentar anos e flexíveis para viver em todos os suportes, do cartão ao ecrã gigante.",
      de: "Logos, Richtlinien, Typografie und Ableitungen: Wir setzen Identitäten, die halten sollen, fest genug für Jahre und geschmeidig genug für jedes Medium, von der Visitenkarte bis zur Grossleinwand.",
      it: "Loghi, linee guida, tipografie e declinazioni: posiamo identità fatte per durare, abbastanza solide da reggere anni e abbastanza flessibili da vivere su ogni supporto, dal biglietto allo schermo gigante.",
    } },
  { k: "sitesweb", name: { fr: "Sites web", en: "Websites", pt: "Sites web", de: "Websites", it: "Siti web" },
    tags: { fr: "Design - Développement", en: "Design - Development", pt: "Design - Desenvolvimento", de: "Design - Entwicklung", it: "Design - Sviluppo" },
    p: {
      fr: "Vitrines, e-commerce ou plateformes: nous concevons des sites rapides, lisibles et faciles à tenir à jour. Chaque page est pensée pour convaincre, avec un soin égal porté au texte, à l'image et à la performance.",
      en: "Showcases, e-commerce or platforms: we design fast, readable sites that are easy to keep alive. Every page is built to convince, with equal care given to words, images and performance.",
      pt: "Montras, e-commerce ou plataformas: desenhamos sites rápidos, legíveis e fáceis de manter. Cada página é pensada para convencer, com igual cuidado no texto, na imagem e na performance.",
      de: "Vitrinen, E-Commerce oder Plattformen: Wir bauen schnelle, lesbare Seiten, die leicht zu pflegen sind. Jede Seite soll überzeugen, mit gleicher Sorgfalt für Text, Bild und Performance.",
      it: "Vetrine, e-commerce o piattaforme: progettiamo siti rapidi, leggibili e facili da tenere aggiornati. Ogni pagina è pensata per convincere, con pari cura per testo, immagine e prestazioni.",
    } },
  { k: "campagnes", name: { fr: "Campagnes", en: "Campaigns", pt: "Campanhas", de: "Kampagnen", it: "Campagne" },
    tags: { fr: "Création - Média", en: "Creation - Media", pt: "Criação - Média", de: "Kreation - Media", it: "Creazione - Media" },
    p: {
      fr: "De l'affichage au spot, nous imaginons des campagnes qui assument leurs couleurs et restent en tête. Concept, production et déclinaisons: tout sort du même atelier, avec le même cap et le même soin du détail.",
      en: "From billboards to spots, we imagine campaigns that own their colours and stay in mind. Concept, production and variations: everything leaves the same studio, with the same heading and the same care.",
      pt: "Do cartaz ao spot, imaginamos campanhas que assumem as suas cores e ficam na cabeça. Conceito, produção e declinações: tudo sai do mesmo ateliê, com o mesmo rumo e o mesmo cuidado no detalhe.",
      de: "Vom Plakat bis zum Spot denken wir Kampagnen, die zu ihren Farben stehen und im Kopf bleiben. Konzept, Produktion und Ableitungen: Alles kommt aus demselben Atelier, mit demselben Kurs und derselben Sorgfalt.",
      it: "Dall'affissione allo spot, immaginiamo campagne che assumono i loro colori e restano in testa. Concetto, produzione e declinazioni: tutto esce dallo stesso atelier, con la stessa rotta e la stessa cura.",
    } },
  { k: "social", name: { fr: "Réseaux sociaux", en: "Social media", pt: "Redes sociais", de: "Social Media", it: "Social media" },
    tags: { fr: "Éditorial - Communauté", en: "Editorial - Community", pt: "Editorial - Comunidade", de: "Redaktion - Community", it: "Editoriale - Community" },
    p: {
      fr: "Ligne éditoriale, formats courts, animation de communauté et veille: nous donnons aux marques une voix reconnaissable, régulière et vivante, sans jamais céder à la mode jetable du moment.",
      en: "Editorial line, short formats, community care and monitoring: we give brands a recognisable, steady, living voice, without ever giving in to the disposable fashion of the moment.",
      pt: "Linha editorial, formatos curtos, animação de comunidade e monitorização: damos às marcas uma voz reconhecível, regular e viva, sem nunca ceder à moda descartável do momento.",
      de: "Redaktionslinie, Kurzformate, Community-Pflege und Beobachtung: Wir geben Marken eine erkennbare, verlässliche, lebendige Stimme, ohne je der Wegwerfmode des Moments nachzugeben.",
      it: "Linea editoriale, formati brevi, cura della community e ascolto: diamo ai brand una voce riconoscibile, regolare e viva, senza mai cedere alla moda usa e getta del momento.",
    } },
  { k: "contenus", name: { fr: "Contenus", en: "Content", pt: "Conteúdos", de: "Inhalte", it: "Contenuti" },
    tags: { fr: "Photo - Vidéo - Rédaction", en: "Photo - Video - Copy", pt: "Foto - Vídeo - Redação", de: "Foto - Video - Text", it: "Foto - Video - Redazione" },
    p: {
      fr: "Photo, vidéo, motion et rédaction: nous produisons des contenus justes, pensés pour chaque canal, qui racontent la même histoire avec la même exigence, de la story au film de marque.",
      en: "Photo, video, motion and copywriting: we produce accurate content, shaped for each channel, telling the same story with the same rigour, from a story to a brand film.",
      pt: "Foto, vídeo, motion e redação: produzimos conteúdos justos, pensados para cada canal, que contam a mesma história com a mesma exigência, da story ao filme de marca.",
      de: "Foto, Video, Motion und Text: Wir produzieren stimmige Inhalte, gedacht für jeden Kanal, die dieselbe Geschichte mit derselben Sorgfalt erzählen, von der Story bis zum Markenfilm.",
      it: "Foto, video, motion e redazione: produciamo contenuti giusti, pensati per ogni canale, che raccontano la stessa storia con la stessa esigenza, dalla story al film di marca.",
    } },
];



const REPERES_TITLE: L5 = { fr: "Repères et convictions", en: "Landmarks and convictions", pt: "Referências e convicções", de: "Fixpunkte und Haltung", it: "Riferimenti e convinzioni" };
const REPERES_P: L5 = {
  fr: "Notre passion du métier nous pousse à soigner chaque étape: recherche, stratégie, identité, design et production. " +
    "Nous ne courons pas après les prix; nous cherchons des résultats utiles pour nos clients et leurs publics. " +
    "Voici quelques repères qui disent d'où nous parlons et ce qui nous tient.",
  en: "Our passion for the craft pushes us to care for every step: research, strategy, identity, design and production. " +
    "We do not chase awards; we look for results that serve our clients and their audiences. " +
    "Here are a few bearings that say where we speak from and what we hold to.",
  pt: "A paixão pelo ofício leva-nos a cuidar de cada etapa: pesquisa, estratégia, identidade, design e produção. " +
    "Não corremos atrás de prémios; procuramos resultados úteis para os nossos clientes e os seus públicos. " +
    "Eis alguns marcos que dizem de onde falamos e o que nos guia.",
  de: "Die Leidenschaft fürs Handwerk treibt uns, jede Etappe zu pflegen: Recherche, Strategie, Identität, Design und Produktion. " +
    "Wir jagen keinen Preisen nach; wir suchen Resultate, die unseren Kunden und ihren Publika dienen. " +
    "Hier einige Fixpunkte, die sagen, woher wir sprechen und was uns hält.",
  it: "La passione per il mestiere ci spinge a curare ogni tappa: ricerca, strategia, identità, design e produzione. " +
    "Non corriamo dietro ai premi; cerchiamo risultati utili per i nostri clienti e i loro pubblici. " +
    "Ecco alcuni riferimenti che dicono da dove parliamo e cosa ci guida.",
};


const REPERES: { k: string; h: L5; items: L5[] }[] = [
  { k: "atelier", h: { fr: "L'atelier", en: "The studio", pt: "O ateliê", de: "Das Atelier", it: "L'atelier" }, items: [
    { fr: "Fondé par un directeur de création", en: "Founded by a creative director", pt: "Fundada por um diretor de criação", de: "Gegründet von einem Creative Director", it: "Fondata da un direttore creativo" },
    { fr: "Rue de Berne 59, à Genève", en: "Rue de Berne 59, Geneva", pt: "Rue de Berne 59, em Genebra", de: "Rue de Berne 59, Genf", it: "Rue de Berne 59, Ginevra" },
    { fr: "Une équipe resserrée", en: "A tight team", pt: "Uma equipa enxuta", de: "Ein kompaktes Team", it: "Una squadra compatta" },
    { fr: "Des circuits courts", en: "Short decision paths", pt: "Circuitos curtos", de: "Kurze Wege", it: "Percorsi corti" },
  ] },
  { k: "metier", h: { fr: "Le métier", en: "The craft", pt: "O ofício", de: "Das Handwerk", it: "Il mestiere" }, items: [
    { fr: "Depuis 2015 à Genève", en: "In Geneva since 2015", pt: "Em Genebra desde 2015", de: "Seit 2015 in Genf", it: "A Ginevra dal 2015" },
    { fr: "Des campagnes nationales", en: "National campaigns", pt: "Campanhas nacionais", de: "Nationale Kampagnen", it: "Campagne nazionali" },
    { fr: "Des identités qui durent", en: "Identities that last", pt: "Identidades que duram", de: "Identitäten, die halten", it: "Identità che durano" },
    { fr: "Des sites qui convainquent", en: "Websites that convince", pt: "Sites que convencem", de: "Websites, die überzeugen", it: "Siti che convincono" },
  ] },
  { k: "langues", h: { fr: "Les langues", en: "The languages", pt: "As línguas", de: "Die Sprachen", it: "Le lingue" }, items: [
    { fr: "Français", en: "French", pt: "Francês", de: "Französisch", it: "Francese" },
    { fr: "Anglais", en: "English", pt: "Inglês", de: "Englisch", it: "Inglese" },
    { fr: "Portugais", en: "Portuguese", pt: "Português", de: "Portugiesisch", it: "Portoghese" },
    { fr: "Allemand", en: "German", pt: "Alemão", de: "Deutsch", it: "Tedesco" },
    { fr: "Italien", en: "Italian", pt: "Italiano", de: "Italienisch", it: "Italiano" },
  ] },
  { k: "terrain", h: { fr: "Le terrain", en: "The ground", pt: "O terreno", de: "Das Terrain", it: "Il terreno" }, items: [
    { fr: "Genève et la Suisse romande", en: "Geneva and Romandy", pt: "Genebra e a Suíça romanda", de: "Genf und die Romandie", it: "Ginevra e la Svizzera romanda" },
    { fr: "L'arc lémanique", en: "The Lake Geneva arc", pt: "O arco lemânico", de: "Der Genferseebogen", it: "L'arco lemanico" },
    { fr: "L'Europe en ligne de mire", en: "Europe in our sights", pt: "A Europa no horizonte", de: "Europa im Blick", it: "L'Europa nel mirino" },
  ] },
];

const NEWS_TITLE: Record<AbilLang, [string, string]> = {
  fr: ["Le", "journal"], en: ["The", "journal"], pt: ["O", "jornal"], de: ["Das", "Journal"], it: ["Il", "giornale"],
};




const JOURNAL_IMGS = ["/brand/kv-woman-2.jpg", "/brand/kv-men-1.jpg", "/brand/kv-logo-black-2.jpg", "/brand/kv-woman-3.jpg"];
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
const NEWS = ABIL_POSTS.slice(0, 2);

const SLIDER_IMGS = ["/brand/mock-cartaz-2.jpg", "/brand/mock-website-2.jpg", "/brand/kv-men-2.jpg", "/brand/mock-billboard-2.jpg", "/brand/mock-glass-card.jpg", "/brand/kv-logo-yellow-1.jpg"];




const SOCIALS: { name: string; href: string; ed: string }[] = [
  { name: "Instagram", href: "https://www.instagram.com/abil.ch/", ed: "socIg" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/abil-medias/", ed: "socLi" },
  { name: "Facebook", href: "https://www.facebook.com/abilmedias/", ed: "socFb" },
];








const NAV_LINKS: { sub: string; count?: string; label: L5 }[] = [
  { sub: "projets", count: WORKS_COUNT, label: { fr: "Projets", en: "Projects", pt: "Projetos", de: "Projekte", it: "Progetti" } },
  { sub: "services", label: { fr: "Services", en: "Services", pt: "Serviços", de: "Leistungen", it: "Servizi" } },
  { sub: "agence", label: { fr: "L'agence", en: "The agency", pt: "A agência", de: "Die Agentur", it: "L'agenzia" } },


  { sub: "journal", label: { fr: "Journal", en: "Journal", pt: "Jornal", de: "Journal", it: "Giornale" } },

  { sub: "contact", label: { fr: "Contact", en: "Contact", pt: "Contacto", de: "Kontakt", it: "Contatto" } },
];


const UI_FR = {
  etudesLink: "Études de cas", privacyLink: "Confidentialité", termsLink: "Conditions",
  navAria: "Navigation principale", logoAria: "ABiL MEDiAS, accueil", langsAria: "Langues", menuAria: "Menu",
  menu: "Menu +", fermer: "Fermer", accueil: "Accueil", chargement: "Chargement",
  skipLink: "Aller au contenu", minRead: "min de lecture",
  hiddenWorks: "Travaux choisis", cursorProject: "Voir le projet", cursorRead: "Lire",

  cursorBrand: "Image de marque", cursorPlay: "Cliquez pour regarder", lrgAlt: "ABiL MEDiAS, l'atelier au travail",
  reelAlt: "ABiL MEDiAS, image de marque", stripAria: "Aperçus de travaux",
  aboutTop: "L'agence", aboutReveal: "Faisons connaissance",
  plus: "Plus +", moins: "Moins -",
  viewAll: "Voir tout", allJournal: "Tout le journal", article: "Article", readArticle: "Lire l'article",
  nextPage: "Page suivante", nextLabel: "Projets",
  footerHead: "Nous serions ravis de vous lire. Travaillons ensemble.",
  contactTop: "Contactez-nous", contactReveal: "Écrivez-nous",
  colBiz: "Demandes professionnelles", colJobs: "Candidatures", colCity: "Genève", colHours: "Horaires",
  hoursDays: "Lundi au vendredi", country: "Suisse", backTop: "Haut de page",
};
type UIStrings = typeof UI_FR;
const UI: Record<AbilLang, UIStrings> = {
  fr: UI_FR,
  en: { etudesLink: "Case studies", privacyLink: "Privacy", termsLink: "Terms",
    navAria: "Main navigation", logoAria: "ABiL MEDiAS, home", langsAria: "Languages", menuAria: "Menu",
    menu: "Menu +", fermer: "Close", accueil: "Home", chargement: "Loading",
    skipLink: "Skip to content", minRead: "min read",
    hiddenWorks: "Selected work", cursorProject: "View project", cursorRead: "Read",
    cursorBrand: "Brand image", cursorPlay: "Click to watch", lrgAlt: "ABiL MEDiAS, the studio at work",
    reelAlt: "ABiL MEDiAS, brand image", stripAria: "Work previews",
    aboutTop: "The agency", aboutReveal: "Get to know us",
    plus: "More +", moins: "Less -",
    viewAll: "View all", allJournal: "The whole journal", article: "Article", readArticle: "Read the article",
    nextPage: "Next page", nextLabel: "Projects",
    footerHead: "We would love to hear from you. Let's work together.",
    contactTop: "Contact us", contactReveal: "Write to us",
    colBiz: "Business enquiries", colJobs: "Applications", colCity: "Geneva", colHours: "Hours",
    hoursDays: "Monday to Friday", country: "Switzerland", backTop: "Back to top",
  },
  pt: { etudesLink: "Estudos de caso", privacyLink: "Privacidade", termsLink: "Condições",
    navAria: "Navegação principal", logoAria: "ABiL MEDiAS, início", langsAria: "Línguas", menuAria: "Menu",
    menu: "Menu +", fermer: "Fechar", accueil: "Início", chargement: "A carregar",
    skipLink: "Ir para o conteúdo", minRead: "min de leitura",
    hiddenWorks: "Trabalhos escolhidos", cursorProject: "Ver o projeto", cursorRead: "Ler",
    cursorBrand: "Imagem de marca", cursorPlay: "Clique para assistir", lrgAlt: "ABiL MEDiAS, o ateliê a trabalhar",
    reelAlt: "ABiL MEDiAS, imagem de marca", stripAria: "Vistas de trabalhos",
    aboutTop: "A agência", aboutReveal: "Vamos conhecer-nos",
    plus: "Mais +", moins: "Menos -",
    viewAll: "Ver tudo", allJournal: "Todo o jornal", article: "Artigo", readArticle: "Ler o artigo",
    nextPage: "Página seguinte", nextLabel: "Projetos",
    footerHead: "Vamos adorar ler a sua mensagem. Trabalhemos juntos.",
    contactTop: "Contacte-nos", contactReveal: "Escreva-nos",
    colBiz: "Contactos profissionais", colJobs: "Candidaturas", colCity: "Genebra", colHours: "Horários",
    hoursDays: "Segunda a sexta", country: "Suíça", backTop: "Topo da página",
  },
  de: { etudesLink: "Fallstudien", privacyLink: "Datenschutz", termsLink: "Bedingungen",
    navAria: "Hauptnavigation", logoAria: "ABiL MEDiAS, Startseite", langsAria: "Sprachen", menuAria: "Menü",
    menu: "Menu +", fermer: "Schliessen", accueil: "Start", chargement: "Lädt",
    skipLink: "Zum Inhalt springen", minRead: "Min. Lesezeit",
    hiddenWorks: "Ausgewählte Arbeiten", cursorProject: "Projekt ansehen", cursorRead: "Lesen",
    cursorBrand: "Markenbild", cursorPlay: "Zum Ansehen klicken", lrgAlt: "ABiL MEDiAS, das Atelier bei der Arbeit",
    reelAlt: "ABiL MEDiAS, Markenbild", stripAria: "Einblicke in Arbeiten",
    aboutTop: "Die Agentur", aboutReveal: "Lernen wir uns kennen",
    plus: "Mehr +", moins: "Weniger -",
    viewAll: "Alle ansehen", allJournal: "Das ganze Journal", article: "Artikel", readArticle: "Artikel lesen",
    nextPage: "Nächste Seite", nextLabel: "Projekte",
    footerHead: "Wir freuen uns auf Ihre Nachricht. Arbeiten wir zusammen.",
    contactTop: "Kontakt", contactReveal: "Schreiben Sie uns",
    colBiz: "Geschäftsanfragen", colJobs: "Bewerbungen", colCity: "Genf", colHours: "Zeiten",
    hoursDays: "Montag bis Freitag", country: "Schweiz", backTop: "Nach oben",
  },
  it: { etudesLink: "Casi studio", privacyLink: "Privacy", termsLink: "Condizioni",
    navAria: "Navigazione principale", logoAria: "ABiL MEDiAS, home", langsAria: "Lingue", menuAria: "Menu",
    menu: "Menu +", fermer: "Chiudi", accueil: "Home", chargement: "Caricamento",
    skipLink: "Vai al contenuto", minRead: "min di lettura",
    hiddenWorks: "Lavori scelti", cursorProject: "Vedi il progetto", cursorRead: "Leggi",
    cursorBrand: "Immagine di marca", cursorPlay: "Clicca per guardare", lrgAlt: "ABiL MEDiAS, l'atelier al lavoro",
    reelAlt: "ABiL MEDiAS, immagine di marca", stripAria: "Anteprime dei lavori",
    aboutTop: "L'agenzia", aboutReveal: "Conosciamoci",
    plus: "Più +", moins: "Meno -",
    viewAll: "Vedi tutto", allJournal: "Tutto il giornale", article: "Articolo", readArticle: "Leggi l'articolo",
    nextPage: "Pagina successiva", nextLabel: "Progetti",
    footerHead: "Ci farebbe piacere leggervi. Lavoriamo insieme.",
    contactTop: "Contattaci", contactReveal: "Scrivici",
    colBiz: "Richieste professionali", colJobs: "Candidature", colCity: "Ginevra", colHours: "Orari",
    hoursDays: "Dal lunedì al venerdì", country: "Svizzera", backTop: "Torna su",
  },
};




function Words({ text, base, step }: { text: string[]; base: number; step: number }) {
  return (
    <>
      {text.map((w, i) => (
        <span className="v3-wm" key={i}>
          <span className="v3-w" style={{ "--d": `${base + i * step}s` } as React.CSSProperties}>{w}&nbsp;</span>
        </span>
      ))}
    </>
  );
}


function Rise({ children, d }: { children: React.ReactNode; d: number }) {
  return (
    <span className="v3-rm"><span className="v3-rise" style={{ "--d": `${d}s` } as React.CSSProperties}>{children}</span></span>
  );
}













function PillBtn({ top, reveal, onClick, edTop, edReveal }: { top: string; reveal: string; onClick?: () => void; edTop?: string; edReveal?: string }) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const sizerRef = useRef<HTMLSpanElement | null>(null);
  const sizerTopRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const btn = btnRef.current;
    const caixa = sizerRef.current;
    const rotulo = sizerTopRef.current;
    if (!btn || !caixa || !rotulo) return;
    let morto = false;
    const medir = () => {
      if (morto || !btnRef.current) return;
      const diff = Math.max(0, Math.round(caixa.offsetWidth - rotulo.offsetWidth));
      btn.style.setProperty("--diff", `${diff}px`);
      const dot = Math.max(18, btn.offsetHeight - 4);
      btn.style.setProperty("--dot", `${dot}px`);




      btn.style.setProperty("--cut", `${Math.max(0, btn.offsetWidth - dot)}px`);
    };
    medir();

    if ("fonts" in document) { void document.fonts.ready.then(medir); }
    window.addEventListener("resize", medir, { passive: true });
    return () => { morto = true; window.removeEventListener("resize", medir); };
  }, [top, reveal]);
  return (
    <button className="v3-btn" type="button" onClick={onClick} ref={btnRef}>
      <span className="v3-btn-in">
        {                                                                            }
        <span className="v3-mask v3-mask-bottom"><span className="v3-btn-t" data-ed={edReveal}>{reveal}</span></span>
        <span className="v3-mask v3-mask-top"><span className="v3-btn-t" data-ed={edTop}>{top}</span></span>
        <span className="v3-mask v3-mask-hidden" aria-hidden="true">
          <span className="v3-btn-sizer" ref={sizerRef}>
            <span className="v3-btn-t" ref={sizerTopRef}>{top}</span>
            <span className="v3-btn-t">{reveal}</span>
          </span>
        </span>
      </span>
    </button>
  );
}




const SHELL_CSS = `

  .v3-pre{position:fixed;inset:0;z-index:2100;background:${ALPIN};color:${NOIR};margin:0;padding:2vw;
    display:flex;flex-direction:row;justify-content:center;align-items:center;gap:14px;
    font-family:"mundial","Figtree","Helvetica Neue",sans-serif;
    clip-path:inset(0 0 0 0);transition:clip-path .75s cubic-bezier(.645,.045,.355,1)}
  .v3-pre.out{clip-path:inset(0 0 100% 0)}
  .v3-pre img{display:block;height:19.4px;width:auto;margin:0}
  .v3-pre-logo{display:flex;align-items:baseline;gap:2px;font-size:8px;line-height:1}
  .v3-pre-foot{display:flex;align-items:center;gap:12px;font-size:16px;line-height:1;
    text-transform:uppercase;letter-spacing:-.03em}
  .v3-pre-bar{display:block;width:64px;height:1px;background:${LEMAN};overflow:hidden}
  .v3-pre-bar i{display:block;height:100%;width:100%;background:${NOIR};transform-origin:left center;
    transition:transform .07s linear}




  .v3-trans{position:fixed;inset:0;z-index:2000;background:${NOIR};color:${ALPIN};margin:0;padding:0;
    display:flex;align-items:center;justify-content:center;pointer-events:none;
    clip-path:inset(100% 0 0 0);transition:none}
  .v3-trans.in{clip-path:inset(0 0 0 0);transition:clip-path .8s cubic-bezier(.24,.36,0,1)}

  .v3-trans.out{clip-path:inset(0 0 110% 0);transform:translateY(-10%);
    transition:clip-path 1s cubic-bezier(.24,.36,0,1),transform 1s cubic-bezier(.24,.36,0,1)}
  .v3-trans-mask{display:block;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
  .v3-trans-mask img{display:block;height:56px;width:auto;transform:translateY(140%);
    transition:transform .8s cubic-bezier(.24,.36,0,1)}
  .v3-trans.in .v3-trans-mask img,.v3-trans.out .v3-trans-mask img{transform:translateY(0)}
  @media (prefers-reduced-motion: reduce){
    .v3-pre,.v3-trans{display:none}
  }
`;





const BASE = "";

const ABAS = ["projets", "journal", "contact", "services"];


const subDe = (p: string) => {
  if (BASE && !p.startsWith(BASE)) return "home";
  const resto = p.slice(BASE.length).replace(/^\/|\/$/g, "");
  if (!resto) return "home";
  const [a, b] = resto.split("/");
  if (!b) {
    if (ABAS.includes(a)) return a;
    if (a === "agence" || a === "etudes") return a;
    if (a === "confidentialite" || a === "conditions") return `legal:${a}`;
    return "404";
  }
  if (a === "projets") return `case:${b}`;
  if (a === "journal") return `article:${b}`;
  if (a === "services") return `service:${b}`;
  return "404";
};



const ehQuatroZeroQuatro = (sub: string) => {
  const [tipo, slug] = sub.split(":");
  if (tipo === "404") return true;



  if (tipo === "case") return !V3D_CASE_SLUGS.includes(slug) && !slugsPublicados().includes(slug);
  if (tipo === "service") return !V3D_SERVICE_SLUGS.includes(slug);
  if (tipo === "article") return !ABIL_POSTS.some((p) => p.slug === slug) && !slugsJornal().includes(slug);
  if (tipo === "legal") return !V3D_LEGAL_KINDS.includes(slug as V3DLegalKind);
  return false;
};
const reduzido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const entre01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);


const FMT_ZURIQUE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
const horaZurique = () => FMT_ZURIQUE.format(new Date());




export function AbilHomeV3({ lang, setLang, onGoto, ativo = true }: { lang: AbilLang; setLang: (l: AbilLang) => void; onGoto?: (view: string) => void; ativo?: boolean }) {


  useEdicoesSite();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLHeadingElement | null>(null);
  const lrgRef = useRef<HTMLDivElement | null>(null);
  const reelRef = useRef<HTMLDivElement | null>(null);
  const footRef = useRef<HTMLElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const relogios = useRef<number[]>([]);
  const navOcupado = useRef(false);
  const fecharRef = useRef<HTMLButtonElement | null>(null);

  const [sub, setSub] = useState(() => (typeof window === "undefined" ? "home" : subDe(window.location.pathname)));
  const emCasa = sub === "home";



  const [promoOn, setPromoOn] = useState(false);
  const promoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!ativo && promoRef.current && !promoRef.current.paused) { promoRef.current.pause(); }
  }, [ativo]);
  const ligarPromo = () => {
    const v = promoRef.current; if (!v) return;
    setPromoOn(true);
    v.muted = false;
    void v.play().catch(() => {  });
  };



  const pubs = usePublicados();



  const aCarregarPubs = usePublicadosACarregar();











  const destacadosPub = pubs ? pubs.filter((p) => (p as { destacado?: boolean }).destacado) : null;
  const WORKS_VIVOS = pubs
    ? (destacadosPub && destacadosPub.length ? destacadosPub : pubs.slice(0, 4))
    : (aCarregarPubs ? [] : WORKS.slice(0, 4));
  const contagemViva = pubs ? String(pubs.length).padStart(2, "0") : WORKS_COUNT;


  const jornal = useJornal();
  const noticias = jornal ? jornal.slice(0, 2) : NEWS;



  const [fase, setFase] = useState<"load" | "out" | "done">(() => (reduzido() ? "done" : "load"));
  const [pct, setPct] = useState(0);
  const ready = fase !== "load";




  const [navRolled, setNavRolled] = useState(false);
  const [navNamed, setNavNamed] = useState(false);
  const [navGone, setNavGone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [reelLoaded, setReelLoaded] = useState(false);
  const [trans, setTrans] = useState<"idle" | "in" | "out">("idle");

  useEffect(() => {
    const ids = relogios.current;
    return () => { ids.forEach((id) => window.clearTimeout(id)); };
  }, []);



  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    if (!ativo || reduzido()) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);



    const aoPausarLenis = (e: Event) => {
      const pausa = Boolean((e as CustomEvent<{ pause?: boolean }>).detail?.pause);
      if (pausa) lenisRef.current?.stop(); else lenisRef.current?.start();
    };
    window.addEventListener("abil:lenis", aoPausarLenis);
    return () => {
      window.removeEventListener("abil:lenis", aoPausarLenis);
      cancelAnimationFrame(raf); lenis.destroy(); lenisRef.current = null;
    };
  }, [ativo]);



  useEffect(() => {
    if (fase !== "load") return;
    let n = 0;
    let saida = 0;
    const id = window.setInterval(() => {
      n = Math.min(100, n + 7);
      setPct(n);
      if (n >= 100) { window.clearInterval(id); saida = window.setTimeout(() => setFase("out"), 140); }
    }, 45);
    return () => { window.clearInterval(id); if (saida) window.clearTimeout(saida); };
  }, [fase]);
  useEffect(() => {
    if (fase !== "out") return;
    const id = window.setTimeout(() => setFase("done"), 780);
    return () => window.clearTimeout(id);
  }, [fase]);






  useEffect(() => {
    const root = rootRef.current;
    if (!emCasa || !root || fase === "load") return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".v3-io:not(.in)"));
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }






    const desrecortarNoFim = (el: HTMLElement) => {
      let fim = 1400;
      el.querySelectorAll<HTMLElement>(".v3-w,.v3-rise").forEach((n) => {
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
  }, [emCasa, fase]);






  useEffect(() => {
    if (!emCasa) return;
    const suave = !reduzido();
    const fino = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;




    const geo = { heroFim: 0, lrgTopo: 0, lrgAlt: 1, reelTopo: 0, reelAlt: 1, footTopo: 0, footAlt: 1 };
    const medir = () => {
      const y = window.scrollY;
      const h = heroRef.current?.getBoundingClientRect();
      const l = lrgRef.current?.getBoundingClientRect();
      const r = reelRef.current?.getBoundingClientRect();
      const f = footRef.current?.getBoundingClientRect();
      if (h) geo.heroFim = h.bottom + y;
      if (l) { geo.lrgTopo = l.top + y; geo.lrgAlt = l.height || 1; }
      if (r) { geo.reelTopo = r.top + y; geo.reelAlt = r.height || 1; }
      if (f) { geo.footTopo = f.top + y; geo.footAlt = f.height || 1; }
    };
    const ler = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const largo = window.innerWidth > 768;
      const y = window.scrollY;
      setNavRolled(y > 2);
      setNavNamed(geo.heroFim > 0 && geo.heroFim - y < 56);
      setNavGone(geo.footTopo > 0 && (geo.footTopo - y) + geo.footAlt * 0.8 <= vh);
      if (!suave) return;




      if (lrgRef.current) {
        const p = entre01((vh - (geo.lrgTopo - y)) / geo.lrgAlt);

        const alvo = largo ? 0.96 + 0.04 * p : 1;
        lrgRef.current.style.setProperty("--sx", alvo.toFixed(4));
        lrgRef.current.style.setProperty("--inv", (1 / alvo).toFixed(4));
        lrgRef.current.style.setProperty("--p", p.toFixed(4));
      }
      if (largo && reelRef.current) {
        reelRef.current.style.setProperty("--p", entre01((vh - (geo.reelTopo - y)) / geo.reelAlt).toFixed(4));
      }
      if (fino && footRef.current) {
        footRef.current.style.setProperty("--fp", entre01((vh - (geo.footTopo - y)) / vh).toFixed(4));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(ler); };
    const onResize = () => { medir(); onScroll(); };
    medir();
    ler();
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
  }, [emCasa]);




  useEffect(() => {
    if (!emCasa) return;
    const el = stripRef.current;
    if (!el) return;
    let baixo = false, x0 = 0, s0 = 0;
    const down = (e: PointerEvent) => { baixo = true; x0 = e.clientX; s0 = el.scrollLeft; el.classList.add("drag"); };
    const move = (e: PointerEvent) => { if (baixo) el.scrollLeft = s0 - (e.clientX - x0); };
    const up = () => { baixo = false; el.classList.remove("drag"); };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [emCasa]);





  useEffect(() => {
    const root = rootRef.current;
    const cur = cursorRef.current;
    if (!emCasa || !root || !cur) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (reduzido()) return;
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
  }, [emCasa]);



  useEffect(() => {
    if (!menuOpen) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const gatilho = document.activeElement as HTMLElement | null;

    const fid = window.requestAnimationFrame(() => fecharRef.current?.focus());
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = antes;
      window.cancelAnimationFrame(fid);
      document.removeEventListener("keydown", onKey);
      if (gatilho && document.contains(gatilho)) gatilho.focus();
    };
  }, [menuOpen]);





  const [navCompacta, setNavCompacta] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const ler = () => setNavCompacta(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);

  useEffect(() => {
    const pop = () => setSub(subDe(window.location.pathname));
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);




  const [horaCH, setHoraCH] = useState(horaZurique);
  useEffect(() => {
    const id = window.setInterval(() => setHoraCH(horaZurique()), 1000);
    return () => window.clearInterval(id);
  }, []);



  useEffect(() => {
    if (!ativo) return;
    const st = document.createElement("style");




    st.textContent = "html{scroll-behavior:auto !important}html,body{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}";
    document.head.appendChild(st);
    return () => { st.remove(); };
  }, [ativo]);

  const irPara = (alvo: string) => {
    const path = alvo === "home" ? (BASE || "/") : `${BASE}/${alvo}`;

    setSub(subDe(path));
    if (window.location.pathname !== path) window.history.pushState({}, "", path);



    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  };


  const onNav = (p: string) => {
    setMenuOpen(false);
    const alvo = p === "home" ? "home" : p;
    if (navOcupado.current) return;
    if (alvo === sub) { window.scrollTo({ top: 0, behavior: reduzido() ? "auto" : "smooth" }); return; }
    if (reduzido()) { irPara(alvo); return; }
    navOcupado.current = true;
    setTrans("in");
    relogios.current.push(
      window.setTimeout(() => { irPara(alvo); setTrans("out"); }, 820),

      window.setTimeout(() => { setTrans("idle"); navOcupado.current = false; }, 1860)
    );
  };




  const porTecla = (e: React.KeyboardEvent, alvo: string) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNav(alvo); }
  };
  const t = edUi(lang, "v3.ui.home", UI[lang]);


  const emailTxt = edTxt(lang, "v3.ui.shell.email", "sam@abil.ch", 400);
  const telTxt = edTxt(lang, "v3.ui.shell.tel", "+41 22 548 00 40", 400);






  const linksVivos = NAV_LINKS.filter((n) => edCfg(`v3.cfg.nav.hide.${n.sub}`) !== "1");

  const langsVivas = ABIL_LANGS.filter((l) => l === "fr" || edCfg(`v3.cfg.langs.off.${l}`) !== "1");


  const langDesligada = lang !== "fr" && edCfg(`v3.cfg.langs.off.${lang}`) === "1";
  useEffect(() => { if (langDesligada) setLang("fr"); }, [langDesligada, setLang]);






  const pubsSeo = usePublicados();
  const tituloHome = edCfgTxt(lang, "v3.meta.home.title", v3dDocTitle(lang, "home"));
  const descricaoHome = edCfgTxt(lang, "v3.meta.home.description", v3dDocDescription(lang, "home"));












  useEffect(() => {
    if (!ativo || typeof document === "undefined") return;
    const [tipo, slug] = sub.split(":");
    const kind = (tipo === "home" ? "home" : tipo) as V3DPageKind;
    document.title = kind === "home" ? tituloHome : v3dDocTitle(lang, kind, slug);
    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", `${window.location.origin}${window.location.pathname}`);
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", kind === "home" ? descricaoHome : v3dDocDescription(lang, kind, slug));



  }, [sub, lang, ativo, tituloHome, descricaoHome, pubsSeo]);









  useEffect(() => {
    if (!ativo) return;
    const alvo = (ehQuatroZeroQuatro(sub) && !aCarregarPubs) ? "noindex" : null;
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (alvo === null) { if (meta) meta.remove(); return; }
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", alvo);


  }, [sub, ativo, pubs, jornal]);
  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: reduzido() ? "auto" : "smooth" });
  };


  const shell = (
    <>
      <style>{SHELL_CSS}</style>
      {fase !== "done" ? (
        <div className={`v3-pre${fase === "out" ? " out" : ""}`} role="status" aria-label={t.chargement}>
          <span className="v3-pre-logo">
            <img src="/brand/abil-wordmark.svg" alt="ABiL MEDiAS" />
          </span>
          <span className="v3-pre-foot">
            <span className="v3-pre-bar"><i style={{ transform: `scaleX(${pct / 100})` }} /></span>
            <span>{pct}%</span>
          </span>
        </div>
      ) : null}
      <div className={`v3-trans${trans === "idle" ? "" : ` ${trans}`}`} aria-hidden="true">
        <span className="v3-trans-mask"><img src="/brand/abil-wordmark-citron.svg" alt="" /></span>
      </div>
    </>
  );

  if (!emCasa) {
    const [tipo, slug] = sub.split(":");
    const pagina = (() => {





      if (ehQuatroZeroQuatro(sub) && !aCarregarPubs) return <AbilV3NotFound lang={lang} setLang={setLang} onNav={onNav} />;
      if (ABAS.includes(tipo)) {
        return <AbilV3Page page={tipo as "projets" | "journal" | "contact" | "services"} lang={lang} setLang={setLang} onNav={onNav} onGoto={onGoto} />;
      }

      if (tipo === "case") return <AbilV3Case slug={slug} lang={lang} setLang={setLang} onNav={onNav} />;





      if (tipo === "article") return <AbilV3Article slug={slug || ""} lang={lang} setLang={setLang} onNav={onNav} />;
      if (tipo === "service") return <AbilV3Service slug={slug} lang={lang} setLang={setLang} onNav={onNav} onGoto={onGoto} />;
      if (tipo === "agence") return <AbilV3Agence lang={lang} setLang={setLang} onNav={onNav} onGoto={onGoto} />;
      if (tipo === "etudes") return <AbilV3CaseOverview lang={lang} setLang={setLang} onNav={onNav} />;
      if (tipo === "legal") return <AbilV3Legal kind={slug as V3DLegalKind} lang={lang} setLang={setLang} onNav={onNav} />;
      return <AbilV3NotFound lang={lang} setLang={setLang} onNav={onNav} />;
    })();
    return (
      <>
        {shell}
        {pagina}
      </>
    );
  }
  return (
    <>
      {shell}
      {

                                                                           }
      <div ref={rootRef} data-no-reveal className={`v3-root${ready ? " v3-ready" : ""}`}>
      <style>{`




        .v3-root{position:relative;background:${TELA};color:${NOIR};
          font-family:"mundial","Figtree","Helvetica Neue",sans-serif;
          font-weight:400;line-height:1;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
        .v3-root *{box-sizing:border-box;margin:0;padding:0;box-shadow:none !important}
        .v3-root ::selection{background:${VIOLETTE};color:${NOIR}}
        .v3-root img{display:block;max-width:100%}
        .v3-root button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:left}
        .v3-root a{color:inherit;text-decoration:none}

        /* Typographic scale measured from the actual CSS. At a 1440px base: XL 7vw equals 101px,
           L 4.86vw equals 70px, M 2.8vw equals 40px, S 1.5vw equals 22px, XS 14, XXS 12 and p 16. */
        .v3-xl,.v3-l,.v3-m,.v3-s,.v3-xs,.v3-xxs{text-transform:uppercase;letter-spacing:-.03em;margin-left:-.03em;line-height:1}
        .v3-xl{font-size:7vw;line-height:.8;font-weight:300}
        .v3-l{font-size:4.86vw;line-height:.8;font-weight:300}
        .v3-m{font-size:2.8vw;line-height:.9;font-weight:300}
        .v3-s{font-size:1.5vw;line-height:.9;font-weight:400}
        .v3-xs{font-size:14px;line-height:1.2;font-weight:400}
        .v3-xxs{font-size:12px;line-height:1.17;font-weight:400}

        .v3-p{font-size:1.111vw;line-height:1.2;font-weight:300;font-family:"mundial","Figtree","Helvetica Neue",sans-serif;letter-spacing:-.01em}
        .v3-root p{margin-bottom:8px}
        .v3-it{font-style:italic}
        .v3-grey{color:${RHONE}}

        .v3-margin{margin-left:2vw;margin-right:2vw}
        .v3-main{padding-top:55px;padding-bottom:2vw}

        /* Masks and entrances: Animation_moveUp, fadeRotate, fillWidth and fillHeight. */
        .v3-wm,.v3-rm{display:inline-block;overflow:hidden;vertical-align:top;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
        /* Clip only during the entrance, then remove it through the global clipping safeguard. */
        .unclip .v3-wm,.unclip .v3-rm,.unclip [class*="-head"],.unclip [class*="-title"]{overflow:visible}
        /* Navigation labels never wrap or clip. */
        .v3-lnk,.v3-nav a,.v3-nav button{white-space:nowrap}
        .v3-w,.v3-rise{display:inline-block;transform:translateY(165%);transition:transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s);will-change:transform}
        .v3-io.in .v3-w,.v3-io.in .v3-rise,.v3-ready .v3-nav .v3-rise{transform:translateY(0)}
        /* Safety net: if the observer never fires during printing, in a background tab or in a search
           engine, the content must still appear. */
        @media print{.v3-w,.v3-rise,.v3-imgfx,.v3-imgup{transform:none !important;opacity:1 !important}
          .v3-fillw{width:100% !important}}
        .v3-imgfx{opacity:0;transform:scale(1.3) rotate(8deg);transition:opacity 1s cubic-bezier(.075,0,.165,0),transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s);will-change:transform}
        .v3-io.in .v3-imgfx{opacity:1;transform:scale(1) rotate(0deg)}

        .v3-imgup{transform:translateY(120%);transition:transform 2.4s cubic-bezier(.4,.4,.1,1);transition-delay:var(--d,0s);will-change:transform}
        .v3-io.in .v3-imgup{transform:translateY(0)}
        .v3-fillw{width:0;height:1px;background:${NOIR};transition:width 1s cubic-bezier(.3,.3,0,1);transition-delay:var(--d,0s)}
        .v3-io.in .v3-fillw{width:100%}
        /* Only the first four blocks animate the line. The remaining lines start fully drawn. */
        .v3-fillw.fill-on,.v3-io.in .v3-fillw.fill-on{width:100%;transition:none}
        .v3-fadeup{opacity:0;transform:translateY(40px);transition:opacity 1s cubic-bezier(.075,0,.165,0),transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s)}
        .v3-io.in .v3-fadeup{opacity:1;transform:translateY(0)}


        .v3-lnk{position:relative;padding-bottom:2px;text-transform:uppercase;cursor:pointer;display:inline-block}
        .v3-lnk:after{content:"";position:absolute;width:100%;height:1px;bottom:0;left:0;transform:scaleX(0);transform-origin:bottom right;transition:transform .3s;background:${NOIR}}
        .v3-lnk:hover:after,.v3-lnk.on:after{transform:scaleX(1);transform-origin:bottom left}

        /* Fixed navigation at 56px.
           Gap B1: after scrolling 2px the bar stays visible, while links roll upwards and "Menu +"
           replaces them. The bar leaves the screen through translateY(-370px) only when the footer
           reaches 80 percent. */
        .v3-nav{position:fixed;top:0;left:0;right:0;height:56px;padding:0 2vw;z-index:3010;color:${NOIR};background:transparent;
          display:grid;grid-template-columns:1fr 1fr 1fr 1fr;column-gap:2vw;align-items:center;
          transition:transform 1s cubic-bezier(.215,.61,.355,1),background .45s ease}
        .v3-nav.hide{transform:translateY(-370px)}







        .v3-nav.menuaberto{opacity:0;pointer-events:none}

        .v3-nav.rolled{background:${CITRON};box-shadow:none}
        .v3-logo-wrap{display:block;overflow:hidden;line-height:0}
        .v3-logo{display:flex;align-items:baseline;gap:2px}
        .v3-nav .v3-logo{display:inline-flex;align-items:center;gap:2px;flex-wrap:nowrap;white-space:nowrap;width:auto}
        .v3-logo img{height:19.4px;width:auto}
        .v3-foot-logo{display:block;height:19.4px;width:auto}
        .v3-foot-home{display:block;background:none;border:0;padding:0;margin:0;cursor:pointer;line-height:0}
        .v3-logo sup{font-size:8px;transform:translateY(-4px)}

        .v3-nav-dash{display:inline-block;overflow:hidden;width:14px;margin:0 .35em;text-align:center;white-space:nowrap;
          opacity:0;transition:opacity .6s cubic-bezier(.4,.4,.1,1)}
        .v3-nav.named .v3-nav-dash{opacity:1}
        .v3-nav-name{display:inline-block;overflow:hidden;vertical-align:top;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
        .v3-nav-name span{display:inline-block;transform:translateY(260%);transition:transform .8s cubic-bezier(.075,.82,.165,1)}
        .v3-nav.named .v3-nav-name span{transform:translateY(0)}
        .v3-tagline{display:flex;flex-direction:column;gap:2px}
        .v3-langs{display:flex;gap:10px;justify-self:start}
        .v3-navlinks{position:relative;justify-self:end;display:flex;align-items:baseline;
          overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
        .v3-links{display:flex;gap:16px;align-items:baseline}



        .v3-links>*{transition:transform .92s cubic-bezier(.075,.82,.165,1)}
        .v3-links>*:nth-child(1){transition-delay:.24s}
        .v3-links>*:nth-child(2){transition-delay:.18s}
        .v3-links>*:nth-child(3){transition-delay:.12s}
        .v3-links>*:nth-child(4){transition-delay:.06s}
        .v3-links>*:nth-child(5){transition-delay:0s}
        /* Rolled links do not receive pointer events, matching the navigation behaviour on detail pages. */
        .v3-nav.rolled .v3-links{pointer-events:none}
        .v3-nav.rolled .v3-links>*{transform:translateY(-160%)}
        .v3-nav.rolled .v3-links>*:nth-child(1){transition-delay:0s}
        .v3-nav.rolled .v3-links>*:nth-child(2){transition-delay:.06s}
        .v3-nav.rolled .v3-links>*:nth-child(3){transition-delay:.12s}
        .v3-nav.rolled .v3-links>*:nth-child(4){transition-delay:.18s}
        .v3-nav.rolled .v3-links>*:nth-child(5){transition-delay:.24s}
        .v3-navmenu{position:absolute;right:.06em;top:.32em;transform:translateY(160%);
          transition:transform .92s cubic-bezier(.075,.82,.165,1);transition-delay:.12s;text-transform:uppercase}
        .v3-nav.rolled .v3-navmenu{transform:translateY(0)}
        /* B3: counts remain in the DOM but appear only on mobile. */
        .v3-count{display:none;font-size:9px;vertical-align:super;margin-left:3px;color:${RHONE}}

        /* Mobile menu overlay: a solid-colour panel descends while links enter and exit in sequence.
           The closing sequence reverses the stagger and locks body scrolling. */
        .v3-overlay{position:fixed;inset:0;z-index:60;background:${ALPIN};display:flex;flex-direction:column;justify-content:space-between;padding:16px 4vw 3vh;overflow:hidden;
          transform:translateY(-100%);visibility:hidden;pointer-events:none;
          transition:transform 1s cubic-bezier(.165,.84,.44,1),visibility 0s linear 1s}
        .v3-overlay.open{transform:translateY(0);visibility:visible;pointer-events:auto;
          transition:transform 1s cubic-bezier(.165,.84,.44,1),visibility 0s linear 0s}
        .v3-overlay-top{display:flex;justify-content:space-between;align-items:center;height:40px}
        .v3-overlay-links{display:flex;flex-direction:column;gap:min(1vw,1.2vh);flex:1 1 auto;min-height:0;justify-content:center}
        .v3-overlay-links .v3-biglink{font-size:min(8.5vw, 11.2vh);text-transform:uppercase;letter-spacing:-.03em;font-weight:300;line-height:1;
          display:block;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}




        .v3-overlay-links .v3-biglink>span{display:inline-block;transform:translateY(120%);
          transition:transform 0s linear 1s}
        .v3-overlay.open .v3-biglink>span{transform:translateY(0);
          transition:transform .9s cubic-bezier(.165,.84,.44,1);transition-delay:calc(.12s + var(--i,0) * .05s)}
        .v3-overlay-tag{opacity:0;transition:opacity 0s linear 1s}
        .v3-overlay.open .v3-overlay-tag{opacity:1;transition:opacity .4s linear;transition-delay:.5s}

        /* Hero. */
        .v3-hero{padding:6vw 0 4vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw}
        .v3-hero h1{grid-column:1/-1}
        .v3-hero-sub{grid-column:1/3;margin-top:3vw;display:flex;flex-direction:column;align-items:flex-start}

        /* Two-column work grid with a central vertical line. */
        .v3-workgrid{position:relative;margin:0 1vw;min-height:100vh}

        .v3-bordv{position:absolute;left:50%;top:0;width:1px;height:0;background:${NOIR};transition:height 6s cubic-bezier(.3,.3,0,1);transition-delay:var(--d,0s)}
        /* The home grid has two rows, so the line must span the full grid rather than the height of
           one image. This follows gap D4 and the same rule already used on the project pages. */
        .v3-io.in .v3-bordv{height:100%}
        .v3-works{position:relative;display:grid;grid-template-columns:1fr 1fr}
        .v3-work{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:1vw 1vw 0;cursor:pointer}

        .v3-work:nth-child(-n+2){padding-top:0}
        .v3-work-visual{position:relative;width:100%;height:34vw;overflow:hidden;display:flex;align-items:center;justify-content:center}
        .v3-work-visual img{width:100%;height:100%;object-fit:cover;transition:transform 1.5s cubic-bezier(.075,.82,.165,1)}
        .v3-work:hover .v3-work-visual img{transform:scale(1.045)}
        .v3-work-info{display:flex;flex-direction:column;align-items:flex-start;margin-top:1.2vw;margin-bottom:0;width:100%;flex:1}
        .v3-work-meta{display:flex;flex-wrap:wrap;align-items:center;gap:0}
        .v3-work-dash{margin:0 4px}
        .v3-work-title{margin-top:.8vw;font-size:1.48vw;line-height:.9}
        /* Each block's line fills from the column that contains it, following gap D5. */
        .v3-work-line{width:100%;overflow:hidden;display:flex;justify-content:flex-start;margin-top:3vw}

        .v3-work:last-child .v3-work-line,.v3-work:nth-last-child(2) .v3-work-line{display:none}
        .v3-work:nth-last-child(-n+2) .v3-work-info{margin-bottom:0}
        .v3-work:nth-child(even) .v3-work-line{justify-content:flex-end}

        /* About section using TextButton. */
        .v3-about{margin-top:12vw;margin-bottom:12vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:2vw}
        .v3-about-h{grid-column:1/-1;overflow:hidden;display:flex;padding:.32em 0 .44em;margin:-.32em 0 -.44em}
        .v3-about-sub{grid-column:1/5;width:96%}
        .v3-about-inner{grid-column:5/8}
        .v3-about-inner .v3-p{margin-bottom:2.4vw}


        .v3-lrg{margin-top:4vw;margin-bottom:6vw;display:flex;justify-content:center;overflow:hidden}
        .v3-lrg-box{position:relative;width:100%;height:45vw;overflow:hidden;background:${LEMAN};transform:scaleX(var(--sx,1));transform-origin:center;will-change:transform;backface-visibility:hidden}
        .v3-lrg-box.v3-promo{height:auto;aspect-ratio:16/9;background:${NOIR}}
        .v3-promo video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}


        .v3-promo-scrim{position:absolute;inset:0;background:rgba(0,0,0,.15);pointer-events:none;transition:opacity .5s ease}
        .v3-promo.on .v3-promo-scrim{opacity:0}





        .v3-root button.v3-promo-play{position:absolute;left:50%;top:50%;width:96px;height:96px;
          border-radius:999px;border:3px solid ${ALPIN};background:transparent;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          animation:v3PlayPulse 1.4s cubic-bezier(.45,0,.55,1) infinite}
        @keyframes v3PlayPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1)}}
        .v3-promo-play:hover{animation-play-state:paused;transform:translate(-50%,-50%) scale(1.12)}
        @media (prefers-reduced-motion:reduce){.v3-promo-play{animation:none;transform:translate(-50%,-50%)}}
        .v3-promo-play:focus-visible{outline:2px solid ${ALPIN};outline-offset:4px}
        .v3-promo-play span{display:block;width:0;height:0;margin-left:7px;
          border-top:15px solid transparent;border-bottom:15px solid transparent;border-left:24px solid ${ALPIN}}
        .v3-lrg-up{position:absolute;inset:0;overflow:hidden;transform:scaleX(var(--inv,1));transform-origin:center;will-change:transform}
        .v3-lrg-box img{position:absolute;top:0;left:0;width:100%;height:118%;object-fit:cover;
          transform:translateY(calc(-14% + 14% * var(--p,1)))}

        /* Reel with 56.25vw video and a loading bar.
           Gap A3: it grows from 47vw to 100vw while scrolling, only on wide screens. */
        .v3-reel{margin-top:4vw;margin-bottom:8vw;display:flex;justify-content:center;overflow:hidden}
        .v3-reel-in{position:relative;width:calc(47vw + (100% - 47vw) * var(--p,1));height:56.25vw;background:${LEMAN};display:flex;align-items:center;justify-content:center;overflow:hidden}
        .v3-reel-in img,.v3-reel-in video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
        .v3-loader{overflow:hidden;height:1px;width:10vw;background:${RHONE}}
        .v3-loader div{height:100%;width:100%;background:${NOIR};animation:v3-load 2s linear 0s infinite forwards}
        @keyframes v3-load{0%{transform:translateX(-100%)}50%{transform:translateX(0)}to{transform:translateX(100%)}}

        .v3-reel-badge{display:none;position:absolute;left:2vw;bottom:2vw;padding:3px 6px 4px;
          border:1px solid ${NOIR};background:${NOIR};color:${ALPIN};text-transform:uppercase}
        @media (pointer: coarse){.v3-reel-badge{display:block}}

        /* Clients displayed as sliding 22.5vw cards. */
        .v3-clients{margin-top:4vw;margin-bottom:8vw}
        .v3-clients-head{margin-left:2vw;overflow:hidden;padding:.32em 0 .44em;margin-top:-.32em;margin-bottom:-.44em}
        .v3-cards{display:flex;gap:2vw;padding:4vw 2vw;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none}
        .v3-cards::-webkit-scrollbar{display:none}
        .v3-card{flex:0 0 22.5vw;display:flex;flex-direction:column;justify-content:space-between;scroll-snap-align:start}
        .v3-card-logo{width:64%;margin-bottom:1vw;font-weight:300}
        .v3-card .v3-p{margin-bottom:2vw;color:${NOIR}}

        /* Metiers displayed as an accordion list with hairlines. */
        .v3-list{margin:2vw}
        .v3-row-head{width:100%;padding:1.4vw 0;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;align-items:center}
        .v3-row-name{grid-column:1/5;justify-self:start}
        .v3-row-tags{grid-column:5/8;justify-self:start}
        .v3-row-toggle{grid-column:8/9;justify-self:end;white-space:nowrap}
        .v3-acc{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .6s cubic-bezier(.165,.84,.44,1),opacity .6s cubic-bezier(.165,.84,.44,1)}
        .v3-acc.open{grid-template-rows:1fr;opacity:1}

        .v3-acc>div{overflow:hidden;min-height:0;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw}
        .v3-acc .v3-p{grid-column:5/8;padding:0 0 1.4vw}
        .v3-rowline{position:relative;height:1px;width:100%;overflow:hidden;background:${LEMAN}}
        /* Gap F6: on hover the hairline sweeps in from the left over 1.4 seconds and exits more slowly
           to the right over 1.6 seconds. It remains fixed while the row is open. */
        .v3-rowline i{position:absolute;inset:0;background:${NOIR};transform:scaleX(0);transform-origin:right center;
          transition:transform 1.6s cubic-bezier(.16,1,.3,1)}
        .v3-rowwrap:hover .v3-rowline i{transform:scaleX(1);transform-origin:left center;transition-duration:1.4s}
        .v3-rowline.on i{transform:scaleX(1);transform-origin:left center;transition:transform .6s cubic-bezier(.165,.84,.44,1)}

        /* The image strip keeps a 24vw visual rhythm on wide screens. */

        .v3-stripwrap{margin-top:8vw;margin-bottom:0}
        .v3-strip{display:flex;gap:2vw;height:24vw;overflow-x:auto;padding:0 2vw;scrollbar-width:none;cursor:grab}
        .v3-strip.drag{cursor:grabbing}
        .v3-strip::-webkit-scrollbar{display:none}
        .v3-strip img{height:100%;width:auto;flex:0 0 auto;object-fit:cover;pointer-events:none;user-select:none}

        /* Reperes and awards. */

        .v3-rep{margin-top:8vw;margin-bottom:8vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:3vw}
        .v3-rep-title{grid-column:1/5;grid-row:1;max-width:34.75vw;overflow:hidden;padding:.32em 0 .44em;margin:-.32em 0 -.44em}
        .v3-rep-desc{grid-column:1/5;grid-row:2}
        .v3-rep-wrap{grid-column:5/9;grid-row:2}
        .v3-rep-block{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2.25vw;
          border-bottom:1px solid ${LEMAN};padding:2.25vw 0}
        .v3-rep-block:first-child{padding-top:0}
        .v3-rep-block:last-child{border-bottom:0}
        .v3-rep-block h4{font-weight:400}
        .v3-rep-block li{list-style:none;margin-bottom:.2vw}

        /* Two-column journal with one hairline at the top of the grid. */
        .v3-news{margin-top:6vw}
        .v3-news-head{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;margin-bottom:3.2vw;align-items:end}
        .v3-news-head .v3-btnwrap{justify-self:end}
        .v3-news-grid{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;border-top:1px solid ${LEMAN}}
        .v3-article{display:grid;grid-template-columns:1fr 1fr;column-gap:2vw;padding:2vw 0;cursor:pointer;position:relative}
        .v3-article-img{position:relative;overflow:hidden}
        .v3-article-img img{width:100%;height:16vw;object-fit:cover;transition:transform 1.5s cubic-bezier(.075,.82,.165,1)}
        .v3-article:hover .v3-article-img img{transform:scale(1.045)}
        .v3-article-info{display:flex;flex-direction:column;justify-content:space-between;gap:12px}
        .v3-article-meta{display:flex;gap:.3vw;align-items:baseline}
        .v3-article-title{margin-top:.4vw}

        /* Full-viewport footer containing navigation, the next page and contacts. */
        .v3-footer{position:relative;min-height:100vh;margin-top:0;background:${VIOLETTE};color:${NOIR};display:flex;flex-direction:column;overflow:hidden}
        .v3-footer-nav{height:56px;padding:0 2vw;display:grid;grid-template-columns:1fr 1fr 2fr;align-items:center}
        .v3-footer-menu{display:flex;justify-content:space-between;grid-column:3/4}






        .v3-footer-in{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 2vw;
          overflow:hidden;
          transform:translateY(calc(-80px + 80px * var(--fp,1)))}

        .v3-footer-grid{display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:3vw;align-items:start;padding-bottom:4vw}
        .v3-next{grid-column:1/5;grid-row:1;display:flex;flex-direction:column;gap:.5vw;margin-bottom:8vw}
        .v3-next-row{display:flex;align-items:flex-start;cursor:pointer}
        .v3-next-count{margin-top:.45vw;margin-left:.6vw}
        .v3-contact{grid-column:1/3;grid-row:2/4}
        .v3-contact-h{margin-bottom:2vw;width:76%}
        .v3-cols{display:contents}
        .v3-col{width:22.5vw}
        .v3-col:nth-child(1){grid-column:5/7;grid-row:2}
        .v3-col:nth-child(2){grid-column:7/9;grid-row:2}
        .v3-col:nth-child(3){grid-column:7/9;grid-row:3}
        .v3-col:nth-child(4){grid-column:5/7;grid-row:3}
        .v3-colh{color:#ffffff}
        .v3-nextlbl{color:#ffffff;margin-bottom:1vw}
        .v3-col li{list-style:none;margin-bottom:6px}

        .v3-footer-base{padding:2vw;display:flex;justify-content:space-between;align-items:center;gap:2vw;border-top:1px solid ${LEMAN}}
        .v3-socials{display:flex}
        .v3-socials .v3-lnk{width:10.25vw}
        .v3-legalinks{display:flex;gap:1.2vw;flex-wrap:wrap}

        /* Label that follows the cursor. */
        .v3-cursor{pointer-events:none;position:fixed;top:0;left:0;z-index:1000;padding:3px 6px 4px;
          border:1px solid ${NOIR};background:${NOIR};color:${ALPIN};font-size:14px;text-transform:uppercase;
          white-space:nowrap;opacity:0;transition:opacity .3s linear}


        .v3-btn{display:inline-block;line-height:14px;user-select:none}
        .v3-btn-in{position:relative;display:inline-block}
        .v3-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px 26px;border-radius:999px}
        .v3-mask-hidden{position:relative;visibility:hidden}
        /* The sizing element overlaps both labels so the box adopts the width of the longer one. */
        .v3-btn-sizer{display:grid;justify-items:start}
        .v3-btn-sizer>*{grid-area:1/1}
        /* The --diff value is measured in JavaScript for gap F1. At rest both layers end with the
           resting label, while on hover the citron layer expands to the full width. */
        .v3-mask-bottom{background:${CITRON};color:${NOIR};clip-path:inset(1px 1px 1px 1px round 999px);
          right:var(--diff,0px);transition:right .6s cubic-bezier(.4,.4,.1,1)}
        .v3-btn:hover .v3-mask-bottom{right:0}
        .v3-mask-top{background:${NOIR};color:${ALPIN};right:var(--diff,0px);clip-path:inset(0px 0px 0px 0px round 999px);transition:clip-path .6s cubic-bezier(.4,.4,.1,1)}
        .v3-btn:hover .v3-mask-top{clip-path:inset(4px var(--cut,60%) 4px 4px round 999px)}


        .v3-btn-t{font-size:12px;line-height:1;white-space:nowrap;text-transform:uppercase;letter-spacing:-.01em;display:block;transform:translateY(-.085em)}

        .v3-hidden-title{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

        /* Skip link remains invisible until focused. Navigation otherwise requires 11 tab stops
           before reaching main on every visit. */
        .v3-skip{position:absolute;left:-9999px;top:0}
        .v3-skip:focus{position:fixed;left:2vw;top:8px;z-index:70;background:${NOIR};color:${ALPIN};padding:8px 12px}
        .v3-main:focus{outline:none}

        /* Responsive layout. */
        @media (max-width: 768px){
          .v3-xl{font-size:11vw;line-height:.9}
          .v3-l{font-size:9.5vw}
          .v3-m{font-size:6.9vw;line-height:1.1}
          .v3-s{font-size:4.4vw;line-height:1}
          .v3-p{font-size:16px}
          .v3-margin{margin-left:4vw;margin-right:4vw}

          .v3-nav{padding:0 4vw}
          .v3-tagline,.v3-nav-dash,.v3-nav-name{display:none}
          .v3-navlinks{font-size:12px}
          .v3-links{gap:10px}
          .v3-langs{gap:6px}
          .v3-lrg-box{height:64vw;transform:none}
          .v3-reel-in{width:100%}
          .v3-hero{padding:24vw 0 16vw}
          .v3-hero-sub{grid-column:1/-1}
          .v3-workgrid{margin:0 4vw}
          .v3-works{grid-template-columns:1fr;row-gap:3vw;padding-top:3vw}
          .v3-bordv{display:none}
          .v3-work{padding:0}
          .v3-work-visual{height:64vw}
          .v3-about{margin-top:24vw;margin-bottom:24vw;row-gap:4vw}
          .v3-about-sub{grid-column:1/-1;width:100%}
          .v3-about-inner{grid-column:1/-1}
          .v3-card{flex:0 0 80vw}
          .v3-cards{padding:16vw 4vw 12vw}
          .v3-row-head{padding:3.4vw 0;grid-template-columns:1fr auto;column-gap:4vw}
          .v3-row-name{grid-column:auto}
          .v3-row-tags{display:none}
          .v3-row-toggle{grid-column:auto}
          .v3-acc>div{display:block}
          .v3-acc .v3-p{width:100%}
          .v3-strip{height:44vw;padding:0 4vw;gap:4vw}
          .v3-rep{margin-top:20vw;margin-bottom:20vw}
          .v3-rep-title{grid-column:1/-1;max-width:none}
          .v3-rep-desc{grid-column:1/-1;grid-row:auto}
          .v3-rep-wrap{grid-column:1/-1;grid-row:auto}
          .v3-rep-block{grid-template-columns:1fr;row-gap:2vw;padding:6vw 0}
          .v3-news{margin-top:24vw}
          .v3-news-head,.v3-news-grid{grid-template-columns:1fr}
          .v3-news-head{row-gap:4vw}
          .v3-news-head .v3-btnwrap{justify-self:start}
          .v3-article{grid-template-columns:1fr;row-gap:6vw;padding:8vw 0}
          .v3-article-img img{height:56vw}
          .v3-footer-nav{grid-template-columns:1fr;padding:0 4vw}
          .v3-footer-menu{display:none}

          .v3-footer{min-height:auto}
          .v3-footer-in{padding:18vw 4vw 20vw;transform:none;justify-content:flex-start}
          .v3-reel{margin-top:20vw;margin-bottom:20vw}
          .v3-trans-mask img{height:10vw}
          .v3-pre{padding:4vw}
          .v3-footer-grid{grid-template-columns:1fr;padding-bottom:0}
          .v3-next{grid-column:auto;grid-row:auto;margin-bottom:6vw}
          .v3-contact{grid-column:auto;grid-row:auto}
          .v3-contact-h{width:100%}
          .v3-cols{display:grid;grid-template-columns:1fr 1fr;grid-column:auto;column-gap:2vw;row-gap:2vw}
          .v3-cols .v3-col{width:auto;grid-column:auto;grid-row:auto}
          .v3-footer-base{padding:4vw;flex-wrap:wrap}
          .v3-socials{gap:4vw}
          .v3-socials .v3-lnk{width:auto}
        }


        @media (max-width: 480px){




          .v3-nav{grid-template-columns:auto 1fr auto;column-gap:3vw}
          .v3-logo{grid-column:1;flex:0 0 auto;min-width:0}
          .v3-logo img{height:17px;width:auto;max-width:none}
          .v3-langs{grid-column:2;justify-self:center}
          .v3-navlinks{grid-column:3;justify-self:end}
          .v3-langs,.v3-links{display:none}
          .v3-navlinks{overflow:visible}
          .v3-navmenu{position:static;transform:none !important;transition:none}
          .v3-overlay-links .v3-biglink{font-size:min(13vw, 10.5vh)}
          .v3-overlay .v3-count{display:inline}
        }


        @media (min-width: 1281px){

          .v3-links{width:36vw;justify-content:space-between;gap:0}
        }


        @media (min-width: 1441px){
          .v3-xxs{font-size:.9vw}
          .v3-xs{font-size:1vw}
        }
        @media (min-width: 1921px){
          .v3-xxs{font-size:.6vw}
          .v3-xs{font-size:.7vw}
          .v3-s{font-size:1.4vw}
          .v3-p{font-size:.9vw}
        }

        /* Reduced motion: everything remains visible and nothing animates. */
        @media (prefers-reduced-motion: reduce){
          .v3-root *{transition-duration:.01s !important;animation:none !important}
          .v3-w,.v3-rise,.v3-imgfx,.v3-fadeup,.v3-imgup{transform:none !important;opacity:1 !important}
          .v3-fillw{width:100% !important}
          .v3-bordv{height:100% !important}
          .v3-loader{display:none}
          /* Navigation states for rolling, page name and menu remain because they are behaviour,
             not decoration. Their changes become instantaneous. */
          .v3-lrg-box{transform:none}
          .v3-lrg-box img{transform:none !important}
          .v3-reel-in{width:100%}
          .v3-footer-in{transform:none !important}
        }
      `}</style>

      {                                                                         }
      <a className="v3-skip v3-xs" href="#v3-main">{t.skipLink}</a>

      {                        }
      <div ref={cursorRef} className="v3-cursor" aria-hidden="true" />
      <CursorAbil />

      {                   }
      <nav
        className={`v3-nav${menuOpen ? " menuaberto" : ""}${navGone && !menuOpen ? " hide" : ""}${navRolled && !menuOpen ? " rolled" : ""}${navNamed ? " named" : ""}`}
        aria-label={t.navAria}
      >
        <button className="v3-logo" type="button" onClick={() => onNav("home")} aria-label={t.logoAria}>
          <AbilLogoLoop />
          {                                                                                   }
          <span className="v3-nav-dash v3-xs" aria-hidden="true">·</span>
          <span className="v3-nav-name v3-xs"><span data-ed="v3.ui.nav.home">{edTxt(lang, "v3.ui.nav.home", t.accueil, 160)}</span></span>
        </button>
        <div className="v3-tagline v3-xxs">
          {
                                                           }
          <Rise d={0.2}><span data-ed="v3.home.hero.l1">{edTxt(lang, "v3.home.hero.l1", HERO_SUB[lang][0], 160)}</span></Rise>
          <Rise d={0.3}><span data-ed="v3.home.hero.l2">{edTxt(lang, "v3.home.hero.l2", HERO_SUB[lang][1], 160)}</span></Rise>
        </div>
        <div className="v3-langs v3-xxs" aria-label={t.langsAria}>
          {langsVivas.map((l, i) => (
            <Rise d={0.3 + i * 0.05} key={l}>
              <button type="button" className={`v3-lnk${l === lang ? " on" : ""}`} onClick={() => setLang(l)}>{l}</button>
            </Rise>
          ))}
        </div>
        <div className="v3-navlinks v3-xs">
          <div className="v3-links">
            {                                                      }
            {linksVivos.map((n, i) => (
              <Rise d={0.7 + i * 0.05} key={n.sub}>
                {
                                                                                 }
                <button type="button" className="v3-lnk" tabIndex={navRolled ? -1 : 0} onClick={() => onNav(n.sub)}>
                  {                                                             }
                  <span data-ed={`v3.ui.nav.${n.sub}`}>{edTxt(lang, `v3.ui.nav.${n.sub}`, n.label[lang], 160)}</span>
                  {n.count ? <span className="v3-count">{n.sub === "projets" ? contagemViva : n.count}</span> : null}
                </button>
              </Rise>
            ))}
          </div>
          {


                                                            }
          <button className="v3-navmenu" type="button" tabIndex={navCompacta || navRolled ? 0 : -1} onClick={() => { setNavRolled(false); setMenuOpen(true); }}><span data-ed="v3.ui.nav.menu">{edTxt(lang, "v3.ui.nav.menu", t.menu, 160)}</span></button>
        </div>
      </nav>

      {
                                                                                  }
      <div className={`v3-overlay${menuOpen ? " open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!menuOpen} aria-label={t.menuAria}>
        <div className="v3-overlay-top">
          <span className="v3-xs" data-ed="v3.ui.nav.marque">{edTxt(lang, "v3.ui.nav.marque", "ABiL MEDiAS®", 160)}</span>
          <button className="v3-xs v3-lnk" type="button" ref={fecharRef} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}><span data-ed="v3.ui.nav.fermer">{edTxt(lang, "v3.ui.nav.fermer", t.fermer, 160)}</span></button>
        </div>
        <div className="v3-overlay-links">
          <button
            type="button"
            className="v3-biglink"
            style={{ "--i": 0 } as React.CSSProperties}
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => onNav("home")}
          >
            <span data-ed="v3.ui.nav.home">{edTxt(lang, "v3.ui.nav.home", t.accueil, 160)}</span>
          </button>
          {linksVivos.map((n, i) => (
            <button
              key={n.sub}
              type="button"
              className="v3-biglink"
              style={{ "--i": i + 1 } as React.CSSProperties}
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => onNav(n.sub)}
            >
              <span><span data-ed={`v3.ui.nav.${n.sub}`}>{edTxt(lang, `v3.ui.nav.${n.sub}`, n.label[lang], 160)}</span>{n.count ? <span className="v3-count">{n.sub === "projets" ? contagemViva : n.count}</span> : null}</span>
            </button>
          ))}
        </div>
        <div className="v3-overlay-tag">
          <div className="v3-tagline v3-xxs" style={{ display: "flex", marginBottom: "4vw" }}>
            {
                                                                                         }
            <span data-ed="v3.home.hero.l1">{edTxt(lang, "v3.home.hero.l1", HERO_SUB[lang][0], 160)}</span>
            <span data-ed="v3.home.hero.l2">{edTxt(lang, "v3.home.hero.l2", HERO_SUB[lang][1], 160)}</span>
          </div>
          <div className="v3-langs v3-xxs" style={{ display: "flex" }}>
            {langsVivas.map((l) => (
              <button key={l} type="button" className={`v3-lnk${l === lang ? " on" : ""}`} tabIndex={menuOpen ? 0 : -1} onClick={() => setLang(l)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <main className="v3-main" id="v3-main" tabIndex={-1}>
        {                    }
        <header>
          <section className="v3-hero v3-margin v3-io">
            {                                                             }
            <h1 className="v3-xl" ref={heroRef} data-ed="v3.home.hero.line">
              <Words text={edTxt(lang, "v3.home.hero.line", HERO_LINE[lang], 160).split(" ")} base={0.15} step={0.05} />
            </h1>
            <h2 className="v3-hero-sub v3-xs">
              <Rise d={1.15}><span data-ed="v3.home.hero.l1">{edTxt(lang, "v3.home.hero.l1", HERO_SUB[lang][0], 160)}</span></Rise>
              <Rise d={1.25}><span data-ed="v3.home.hero.l2">{edTxt(lang, "v3.home.hero.l2", HERO_SUB[lang][1], 160)}</span></Rise>
            </h2>
          </section>

          {                                                                           }
          <section>
            <h2 className="v3-hidden-title">{t.hiddenWorks}</h2>
            <div className="v3-workgrid v3-io">
              <div className="v3-bordv" style={{ "--d": "1.1s" } as React.CSSProperties} />
              <div className="v3-works">
                {WORKS_VIVOS.map((w, wi) => (
                  <article
                    key={w.slug}
                    className="v3-work v3-io"
                    data-v3hover={t.cursorProject}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => porTecla(e, `projets/${w.slug}`)}
                    onClick={() => onNav(`projets/${w.slug}`)}
                  >
                    <div className="v3-work-visual">
                      <div className="v3-imgfx" style={{ "--d": `${0.15 + (wi % 2) * 0.1}s`, width: "100%", height: "100%" } as React.CSSProperties}>
                        {(() => {
                          const capaW = edSrc(`v3.work.${w.slug}.img`, w.img);
                          const estiloW: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

                          return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(capaW)
                            ? <video src={capaW} data-ed={`v3.work.${w.slug}.img`} autoPlay muted loop playsInline preload="metadata" aria-label={w.title} style={estiloW}
                                ref={(el) => { if (el) { el.muted = true; const pp = el.play(); if (pp && pp.catch) pp.catch(() => {  }); } }} />
                            : <img src={capaW} data-ed={`v3.work.${w.slug}.img`} alt={w.title} loading="lazy" style={estiloW} />;
                        })()}
                      </div>
                    </div>
                    <div className="v3-work-info">
                      <div className="v3-work-meta v3-xxs">
                        {w.tags.map((tg, ti) => (
                          <Rise d={0.35 + ti * 0.05} key={tg}>
                            <span>{edTxt(lang, `v3.ui.tag.${tg}`, TAGS[tg][lang], 160)}</span>
                            {ti < w.tags.length - 1 ? <span className="v3-work-dash">-</span> : null}
                          </Rise>
                        ))}
                      </div>
                      <h3 className="v3-work-title v3-m">
                        <Words text={nomeCaso(w.slug, lang, w.title).split(" ")} base={0.45} step={0.06} />
                      </h3>
                      {                                                        }
                      <div className="v3-work-line">
                        <div className={`v3-fillw${wi > 3 ? " fill-on" : ""}`} style={{ "--d": ".6s" } as React.CSSProperties} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </header>

        {                                     }
        <section className="v3-about v3-margin v3-io">
          <h2 className="v3-about-h v3-l" data-ed="v3.home.about.title"><Words text={edTxt(lang, "v3.home.about.title", ABOUT_TITLE[lang], 160).split(" ")} base={0.1} step={0.06} /></h2>
          <h3 className="v3-about-sub v3-s" data-ed="v3.home.about.sub"><span className="v3-fadeup" style={{ "--d": ".25s", display: "inline-block" } as React.CSSProperties}>{edTxt(lang, "v3.home.about.sub", ABOUT_SUB[lang], 400)}</span></h3>
          <div className="v3-about-inner">
            <p className="v3-p v3-fadeup" data-ed="v3.home.about.p" style={{ "--d": ".35s" } as React.CSSProperties}>{edTxt(lang, "v3.home.about.p", ABOUT_P[lang], 2000)}</p>
            <div className="v3-fadeup" style={{ "--d": ".45s" } as React.CSSProperties}>
              <PillBtn top={t.aboutTop} reveal={t.aboutReveal} edTop="v3.ui.home.aboutTop" edReveal="v3.ui.home.aboutReveal" onClick={() => onNav("agence")} />
            </div>
          </div>
        </section>

        {


                                                               }
        <section className="v3-lrg v3-io">
          {
                                                                                     }
          {




                                                                                 }
          <div className={`v3-lrg-box v3-promo${promoOn ? " on" : ""}`} ref={lrgRef}>
            <video
              ref={promoRef}
              src={edSrc("v3.home.promo.video", "/videos/abil-promo-1080-v2.mp4")}
              data-ed="v3.home.promo.video"
              poster={edSrc("v3.home.promo.poster", "/brand/kv-woman-2.jpg")}
              preload="metadata"
              playsInline
              controls={promoOn}
              onEnded={() => setPromoOn(false)}
            />
            <div className="v3-promo-scrim" aria-hidden="true" />
            {!promoOn ? (
              <button type="button" className="v3-promo-play" aria-label={t.cursorPlay} data-v3hover={t.cursorPlay} onClick={ligarPromo}>
                <span aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </section>

        {

                                                                                    }
        <section className="v3-reel">
          {

                                                   }
          <div className="v3-reel-in" data-v3hover={t.cursorBrand} ref={reelRef}>
            {!reelLoaded ? <div className="v3-loader"><div /></div> : null}
            {

                                                                                      }
            <video
              src={edSrc("v3.home.kv1.video", "/videos/kv-1.mp4")}
              data-ed="v3.home.kv1.video"
              autoPlay muted loop playsInline
              ref={(el) => { if (el) { el.muted = true; if (el.paused) void el.play().catch(() => {  }); } }}
              onCanPlay={(e) => { const el = e.currentTarget; if (el.paused) void el.play().catch(() => {  }); }}
              onLoadedData={() => setReelLoaded(true)} aria-label={t.reelAlt} />
            {                                                                }
            <span className="v3-reel-badge v3-xs" aria-hidden="true">{t.cursorBrand}</span>
          </div>
        </section>

        {                                                }
        <section className="v3-clients v3-io">
          <header className="v3-clients-head">
            <h2 className="v3-l" data-ed="v3.home.clients.title"><Words text={edTxt(lang, "v3.home.clients.title", CLIENTS_TITLE[lang], 160).split(" ")} base={0.1} step={0.08} /></h2>
          </header>
          <div className="v3-cards">
            {CLIENTS.map((c, ci) => (
              <div className="v3-card" key={ci}>
                <div>
                  <div className="v3-card-logo v3-m v3-fadeup" data-ed={`v3.home.clients.${c.k}.name`} style={{ "--d": `${0.2 + ci * 0.08}s` } as React.CSSProperties}>{edTxt(lang, `v3.home.clients.${c.k}.name`, c.name[lang], 160)}</div>
                  <p className="v3-p v3-fadeup" data-ed={`v3.home.clients.${c.k}.p`} style={{ "--d": `${0.3 + ci * 0.08}s` } as React.CSSProperties}>{edTxt(lang, `v3.home.clients.${c.k}.p`, c.p[lang], 2000)}</p>
                </div>
                <div className="v3-fadeup" style={{ "--d": `${0.4 + ci * 0.08}s` } as React.CSSProperties}>
                  <PillBtn top={edTxt(lang, `v3.home.clients.${c.k}.top`, c.top[lang], 160)} reveal={edTxt(lang, `v3.home.clients.${c.k}.reveal`, c.reveal[lang], 160)} edTop={`v3.home.clients.${c.k}.top`} edReveal={`v3.home.clients.${c.k}.reveal`} onClick={() => onNav("projets")} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {                                                                 }
        <section className="v3-io">
          <header className="v3-clients-head">
            {                                                          }
            <h2 className="v3-m" data-ed="v3.home.metiers.title"><Words text={edTxt(lang, "v3.home.metiers.title", METIERS_TITLE[lang], 160).split(" ")} base={0.1} step={0.06} /></h2>
          </header>
          <div className="v3-list">
            {METIERS.map((m, mi) => (
              <div className="v3-rowwrap" key={mi}>
                <button
                  type="button"
                  className="v3-row-head"
                  id={`v3-row-${mi}`}
                  aria-expanded={openRow === mi}
                  aria-controls={`v3-acc-${mi}`}
                  onClick={() => setOpenRow(openRow === mi ? null : mi)}
                >
                  <span className="v3-row-name v3-xs" data-ed={`v3.home.metiers.${m.k}.name`}>{edTxt(lang, `v3.home.metiers.${m.k}.name`, m.name[lang], 160)}</span>
                  <span className="v3-row-tags v3-xxs" data-ed={`v3.home.metiers.${m.k}.tags`}>{edTxt(lang, `v3.home.metiers.${m.k}.tags`, m.tags[lang], 160)}</span>
                  <span className="v3-row-toggle v3-xxs">{openRow === mi ? <span data-ed="v3.ui.home.moins">{t.moins}</span> : <span data-ed="v3.ui.home.plus">{t.plus}</span>}</span>
                </button>
                <div
                  className={`v3-acc${openRow === mi ? " open" : ""}`}
                  id={`v3-acc-${mi}`}
                  role="region"
                  aria-labelledby={`v3-row-${mi}`}
                  aria-hidden={openRow !== mi}
                >
                  <div><p className="v3-p" data-ed={`v3.home.metiers.${m.k}.p`}>{edTxt(lang, `v3.home.metiers.${m.k}.p`, m.p[lang], 2000)}</p></div>
                </div>
                <div className={`v3-rowline${openRow === mi ? " on" : ""}`}><i /></div>
              </div>
            ))}
          </div>
        </section>

        {                                            }
        <section className="v3-stripwrap v3-io" aria-label={t.stripAria}>
          <div className="v3-strip" ref={stripRef}>
            {SLIDER_IMGS.map((src, si) => (
              <img key={src} src={edSrc(`v3.home.strip.i${si + 1}`, src)} data-ed={`v3.home.strip.i${si + 1}`} alt="" loading="lazy" draggable={false} className="v3-fadeup" style={{ "--d": `${0.1 + si * 0.06}s` } as React.CSSProperties} />
            ))}
          </div>
        </section>

        {                                              }
        <section className="v3-rep v3-margin v3-io">
          <h2 className="v3-rep-title v3-l" data-ed="v3.home.reperes.title"><Words text={edTxt(lang, "v3.home.reperes.title", REPERES_TITLE[lang], 160).split(" ")} base={0.1} step={0.07} /></h2>
          <div className="v3-rep-desc v3-p v3-fadeup" data-ed="v3.home.reperes.p" style={{ "--d": ".25s" } as React.CSSProperties}>{edTxt(lang, "v3.home.reperes.p", REPERES_P[lang], 2000)}</div>
          <div className="v3-rep-wrap">
            {REPERES.map((r, ri) => (
              <div className="v3-rep-block v3-fadeup" style={{ "--d": `${0.3 + ri * 0.08}s` } as React.CSSProperties} key={ri}>
                <h4 className="v3-s" data-ed={`v3.home.reperes.${r.k}.h`}>{edTxt(lang, `v3.home.reperes.${r.k}.h`, r.h[lang], 160)}</h4>
                <ul>
                  {r.items.map((it, ii) => (
                    <li className="v3-xs" key={ii} data-ed={`v3.home.reperes.${r.k}.i${ii + 1}`}>{edTxt(lang, `v3.home.reperes.${r.k}.i${ii + 1}`, it[lang], 160)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {                                 }
        <section className="v3-news v3-margin v3-io">
          <div className="v3-news-head">
            {                                                          }
            {                                                                      }
            <h2 className="v3-m"><span data-ed="v3.home.journal.l1"><Words text={[edTxt(lang, "v3.home.journal.l1", NEWS_TITLE[lang][0], 160)]} base={0.1} step={0.06} /></span><span className="v3-wm" data-ed="v3.home.journal.l2"><span className="v3-w v3-it" style={{ "--d": ".18s" } as React.CSSProperties}>{edTxt(lang, "v3.home.journal.l2", NEWS_TITLE[lang][1], 160)}</span></span></h2>
            <div className="v3-btnwrap v3-fadeup" style={{ "--d": ".3s" } as React.CSSProperties}>
              <PillBtn top={t.viewAll} reveal={t.allJournal} edTop="v3.ui.home.viewAll" edReveal="v3.ui.home.allJournal" onClick={() => onNav("journal")} />
            </div>
          </div>
          <div className="v3-news-grid">
            {noticias.map((a, ai) => (
              <article
                className="v3-article"
                key={a.slug}
                data-v3hover={t.cursorRead}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => porTecla(e, `journal/${a.slug}`)}
                onClick={() => onNav(`journal/${a.slug}`)}
              >
                <div className="v3-article-img">
                  {                                                                   }
                  <div className="v3-imgfx" style={{ "--d": `${0.2 + ai * 0.1}s`, width: "100%", height: "100%" } as React.CSSProperties}>
                    {                                                                          }
                    <img src={edSrc(`v3.post.${a.slug}.cover`, postImg(a.slug))} data-ed={`v3.post.${a.slug}.cover`} alt="" loading="lazy" />
                  </div>
                </div>
                <div className="v3-article-info">
                  <div>
                    <div className="v3-article-meta v3-xxs">
                      {                                                             }
                      <Rise d={0.45 + ai * 0.1}><span data-ed="v3.ui.home.article">{t.article}</span></Rise>
                      <Rise d={0.5 + ai * 0.1}><span className="v3-grey">&nbsp;•&nbsp;</span><span>{fmtPostDate(a.date, lang)}</span></Rise>
                      <Rise d={0.55 + ai * 0.1}><span className="v3-grey">&nbsp;•&nbsp;</span><span>{readingMinutes(a, lang)} <span data-ed="v3.ui.home.minRead">{t.minRead}</span></span></Rise>
                    </div>
                    {                                                            }
                    <h3 className="v3-article-title v3-s">
                      <Words text={a.title[lang].split(" ")} base={0.2 + ai * 0.1} step={0.04} />
                    </h3>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {                              }
      <footer className="v3-footer v3-io" ref={footRef}>
        <div className="v3-footer-nav">
          {
                                                                   }
          <button type="button" className="v3-foot-home" onClick={() => onNav("home")} aria-label={t.logoAria}>
            <img className="v3-foot-logo" src="/brand/abil-wordmark.svg" alt="ABiL MEDiAS" />
          </button>
          <span />
          <div className="v3-footer-menu v3-xs">
            {linksVivos.map((n) => (
              <button key={n.sub} type="button" className="v3-lnk" onClick={() => onNav(n.sub)}><span data-ed={`v3.ui.nav.${n.sub}`}>{edTxt(lang, `v3.ui.nav.${n.sub}`, n.label[lang], 160)}</span></button>
            ))}
          </div>
        </div>
        <div className="v3-footer-in">
          <div className="v3-footer-grid">
            <div className="v3-next">
              <span className="v3-xs v3-nextlbl" data-ed="v3.ui.shell.nextPage">{edTxt(lang, "v3.ui.shell.nextPage", t.nextPage, 400)}</span>
              <span
                className="v3-next-row"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => porTecla(e, "projets")}
                onClick={() => onNav("projets")}
              >
                <span className="v3-l v3-lnk" data-ed="v3.ui.home.nextLabel">{t.nextLabel}</span>
                {                                                  }
                <span className="v3-next-count v3-s">{contagemViva}</span>
              </span>
            </div>
            <div className="v3-contact">
              <div className="v3-contact-h v3-s" data-ed="v3.ui.shell.fcontactH">{edTxt(lang, "v3.ui.shell.fcontactH", t.footerHead, 400)}</div>
              <PillBtn top={edTxt(lang, "v3.ui.shell.contacter", t.contactTop, 400)} reveal={edTxt(lang, "v3.ui.shell.escreva", t.contactReveal, 400)} edTop="v3.ui.shell.contacter" edReveal="v3.ui.shell.escreva" onClick={() => onNav("contact")} />
            </div>
            <div className="v3-cols">
              <div className="v3-col">
                <div className="v3-colh v3-xxs" data-ed="v3.ui.shell.colContacts">{edTxt(lang, "v3.ui.shell.colContacts", t.colBiz, 400)}</div>
                <ul>
                  <li><a className="v3-xs v3-lnk" href={`mailto:${emailTxt}`}><span data-ed="v3.ui.shell.email">{emailTxt}</span></a></li>
                  <li><a className="v3-xs v3-lnk" href={`tel:${telTxt.replace(/\s+/g, "")}`}><span data-ed="v3.ui.shell.tel">{telTxt}</span></a></li>
                </ul>
              </div>
              <div className="v3-col">
                <div className="v3-colh v3-xxs" data-ed="v3.ui.shell.colCandid">{edTxt(lang, "v3.ui.shell.colCandid", t.colJobs, 400)}</div>
                <ul>
                  <li><a className="v3-xs v3-lnk" href={`mailto:${emailTxt}`}><span data-ed="v3.ui.shell.email">{emailTxt}</span></a></li>
                </ul>
              </div>
              <div className="v3-col">
                <div className="v3-colh v3-xxs" data-ed="v3.ui.shell.colVille">{edTxt(lang, "v3.ui.shell.colVille", t.colCity, 400)}</div>
                <ul>
                  <li className="v3-xs" data-ed="v3.ui.shell.adr1">{edTxt(lang, "v3.ui.shell.adr1", "Rue de Berne 59", 400)}</li>
                  <li className="v3-xs" data-ed="v3.ui.shell.adr2">{edTxt(lang, "v3.ui.shell.adr2", "1201 Genève", 400)}</li>
                  <li className="v3-xs" data-ed="v3.ui.shell.adr3">{edTxt(lang, "v3.ui.shell.adr3", t.country, 400)}</li>
                </ul>
              </div>
              <div className="v3-col">
                <div className="v3-colh v3-xxs" data-ed="v3.ui.shell.colHoraires">{edTxt(lang, "v3.ui.shell.colHoraires", t.colHours, 400)}</div>
                <ul>
                  <li className="v3-xs" data-ed="v3.ui.shell.hor1">{edTxt(lang, "v3.ui.shell.hor1", t.hoursDays, 400)}</li>
                  <li className="v3-xs" data-ed="v3.ui.shell.hor2">{edTxt(lang, "v3.ui.shell.hor2", "08:00 - 18:00", 400)}</li>
                  {
                                                                                 }
                  <li className="v3-xs"><span data-ed="v3.ui.shell.hor3">{edTxt(lang, "v3.ui.shell.hor3", "GMT (+1) -", 400)}</span> {horaCH}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="v3-footer-base v3-xs">
          <span data-ed="v3.ui.shell.copy">{edTxt(lang, "v3.ui.shell.copy", "ABiL MEDiAS® ©2026", 400)}</span>
          {                                                                             }
          <div className="v3-legalinks v3-xs">
            <button type="button" className="v3-lnk" onClick={() => onNav("etudes")}><span data-ed="v3.ui.shell.lnkCases">{edTxt(lang, "v3.ui.shell.lnkCases", t.etudesLink, 400)}</span></button>
            <button type="button" className="v3-lnk" onClick={() => onNav("confidentialite")}><span data-ed="v3.ui.shell.lnkPrivacy">{edTxt(lang, "v3.ui.shell.lnkPrivacy", t.privacyLink, 400)}</span></button>
            <button type="button" className="v3-lnk" onClick={() => onNav("conditions")}><span data-ed="v3.ui.shell.lnkTerms">{edTxt(lang, "v3.ui.shell.lnkTerms", t.termsLink, 400)}</span></button>
          </div>
          <div className="v3-socials">
            {SOCIALS.map((s) => (
              <a key={s.name} className="v3-lnk v3-grey" href={s.href} target="_blank" rel="noreferrer noopener"><span data-ed={`v3.ui.shell.${s.ed}`}>{edTxt(lang, `v3.ui.shell.${s.ed}`, s.name, 400)}</span></a>
            ))}
          </div>
          <button type="button" className="v3-lnk" onClick={backToTop}><span data-ed="v3.ui.shell.lnkTop">{edTxt(lang, "v3.ui.shell.lnkTop", t.backTop, 400)}</span></button>
        </div>
      </footer>
      </div>
      {


                                                                       }
      <EditLayerV3 lang={lang} />
    </>
  );
}
