




































// eslint react-refresh/only-export-components: disabled intentionally for this file.






/* eslint-disable react-refresh/only-export-components */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AbilLogoLoop } from "./AbilLogoLoop";
import { nomeCaso, usePublicados, casoPublicado, slugsPublicados, usePublicadosACarregar } from "./abil/publicados";
import { postDoJornal, useJornal } from "./abil/jornal";
import { ABIL_LANGS } from "./AbilSite";
import { type AbilLang } from "./AbilSite";
import { ABIL_POSTS, readingMinutes } from "./abil/posts";


import { edTxt, edSrc, edUi, edCfg, edCfgTxt, useEdicoesSite, useModoEdicao, gravarEdicaoLocal, publicarEdicoesNuvem } from "../lib/siteEdits";


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

type L5 = Record<AbilLang, string>;




export const NAVD: { page: string; label: L5 }[] = [
  { page: "projets", label: { fr: "Projets", en: "Projects", pt: "Projetos", de: "Projekte", it: "Progetti" } },
  { page: "services", label: { fr: "Services", en: "Services", pt: "Serviços", de: "Leistungen", it: "Servizi" } },
  { page: "agence", label: { fr: "L'agence", en: "The agency", pt: "A agência", de: "Die Agentur", it: "L'agenzia" } },
  { page: "journal", label: { fr: "Journal", en: "Journal", pt: "Jornal", de: "Journal", it: "Giornale" } },
  { page: "contact", label: { fr: "Contact", en: "Contact", pt: "Contacto", de: "Kontakt", it: "Contatto" } },
];
const navLabelD = (p: string, l: AbilLang) => NAVD.find((n) => n.page === p)?.label[l] ?? p;



const navVisivelD = (p: string): boolean => edCfg(`v3.cfg.nav.hide.${p}`) !== "1";

const langLigadaD = (l: AbilLang): boolean => l === "fr" || edCfg(`v3.cfg.langs.off.${l}`) !== "1";




const navCountD = (p: string): string | undefined => {
  if (p !== "projets") return undefined;



  const n = slugsPublicados().length;
  return pad2(n || V3D_CASES.length);
};




const SOCIALS: { name: string; href: string; ed: string }[] = [
  { name: "Instagram", href: "https://www.instagram.com/abil.ch/", ed: "socIg" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/abil-medias/", ed: "socLi" },
  { name: "Facebook", href: "https://www.facebook.com/abilmedias/", ed: "socFb" },
];


type TagKey = "identite" | "dircrea" | "strategie" | "digital" | "devweb" | "campagne" | "affichage" | "edition";
const TAGSD: Record<TagKey, L5> = {
  identite: { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" },
  dircrea: { fr: "Direction créative", en: "Creative direction", pt: "Direção criativa", de: "Kreativdirektion", it: "Direzione creativa" },
  strategie: { fr: "Stratégie", en: "Strategy", pt: "Estratégia", de: "Strategie", it: "Strategia" },
  digital: { fr: "Digital", en: "Digital", pt: "Digital", de: "Digital", it: "Digitale" },
  devweb: { fr: "Développement web", en: "Web development", pt: "Desenvolvimento web", de: "Webentwicklung", it: "Sviluppo web" },
  campagne: { fr: "Campagne", en: "Campaign", pt: "Campanha", de: "Kampagne", it: "Campagna" },
  affichage: { fr: "Affichage", en: "Out of home", pt: "Exterior", de: "Plakat", it: "Affissione" },
  edition: { fr: "Édition", en: "Print", pt: "Edição", de: "Editorial", it: "Editoria" },
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const pad3 = (n: number) => String(n).padStart(3, "0");



const UID_FR = {
  navAria: "Navigation principale", logoAria: "ABiL MEDiAS, accueil", langsAria: "Langues", menuAria: "Menu",
  menu: "Menu +", fermer: "Fermer", accueil: "Accueil",
  nextPage: "Page suivante", backTop: "Haut de page",
  footerHead: "Nous serions ravis de vous lire. Travaillons ensemble.",
  contactTop: "Contactez-nous", contactReveal: "Écrivez-nous",
  colBiz: "Demandes professionnelles", colJobs: "Candidatures", colCity: "Genève", colHours: "Horaires",
  hoursDays: "Lundi au vendredi", country: "Suisse",
  plus: "Plus +", moins: "Moins -",

  csRelated: "Autres projets", csCursor: "Voir le projet",
  csTalkTop: "Un projet?", csTalkReveal: "Parlons-en",

  article: "Article", readArticle: "Lire l'article", cursorRead: "Lire",
  share: "Partager", shareCopy: "Copier le lien", shareCopied: "Lien copié",
  shareLi: "Partager sur LinkedIn", shareX: "Partager sur X", shareFb: "Partager sur Facebook", shareWa: "Partager sur WhatsApp",
  otherArticles: "Autres articles", allJournalTop: "Voir tout", allJournalReveal: "Tout le journal",
  quoteRole: "Note de l'atelier",

  svcProcess: "Le processus",
  svcProcessDesc: "Une méthode courte et lisible, la même pour chaque métier: on comprend, on cadre, on dessine, on déploie, on transmet.",
  svcPillars: "Ce que couvre ce métier", svcRelated: "Travaux liés",
  svcAllTop: "Tous les services", svcAllReveal: "Voir les six métiers",

  agBased: "Basés à Genève, actifs sur tout l'arc lémanique",
  agDisciplines: "Ce que nous savons faire", agTeam: "L'équipe", agTeamSub: "Une équipe resserrée, complétée projet par projet par les bons artisans.",
  agOffices: "Bureaux", agRep: "Repères et convictions", agStrip: "Aperçus de l'atelier",
  agTalkTop: "Travaillons ensemble", agTalkReveal: "Écrivez-nous",
  artAutor: "Auteur", artData: "Date", artLeitura: "Lecture", artTema: "Sujet",
  artOutros: "Autres articles", artMinRead: "min de lecture",
  agSvcPara: "Nous construisons des marques et des expériences numériques utiles, pour des organisations qui veulent avancer. Chaque métier se pratique en circuit court: la personne qui vous répond est celle qui fait le travail.",
  agSvcAllTop: "Voir tous nos services", agSvcAllReveal: "Nos services",
  agOffSub: "Un atelier au coeur de Genève, complété par un réseau d'artisans créatifs qui collaborent d'où ils travaillent le mieux.",
  agOffPara: "La collaboration est tout. Nous ne travaillons pas pour vous, et vous ne travaillez certainement pas pour nous: nous travaillons ensemble, avec la même ambition de faire avancer votre marque.",

  legalKicker: "Légal", legalSommaire: "Sommaire",
  legalRef: "Ce document juridique n'existe qu'en français. Pour toute question sur son contenu, écrivez-nous.",
  legalUpdated: "Mise à jour",

  nfTitle: "Page introuvable", nfBackTop: "Retour", nfBackReveal: "Revenir à l'accueil",
  nfText: "La page que vous cherchez n'existe pas ou a changé d'adresse.",
  nfBackHome: "Retour à l'accueil",

  lbClose: "Fermer", lbAria: "Images du projet", coAria: "Études de cas",


  etudesLink: "Études de cas", privacyLink: "Confidentialité", termsLink: "Conditions",
  skipLink: "Aller au contenu", lrgAlt: "ABiL MEDiAS, l'atelier au travail",
};
type UIDStrings = typeof UID_FR;
const UID: Record<AbilLang, UIDStrings> = {
  fr: UID_FR,
  en: {
    navAria: "Main navigation", logoAria: "ABiL MEDiAS, home", langsAria: "Languages", menuAria: "Menu",
    menu: "Menu +", fermer: "Close", accueil: "Home",
    nextPage: "Next page", backTop: "Back to top",
    footerHead: "We would love to hear from you. Let's work together.",
    contactTop: "Contact us", contactReveal: "Write to us",
    colBiz: "Business enquiries", colJobs: "Applications", colCity: "Geneva", colHours: "Hours",
    hoursDays: "Monday to Friday", country: "Switzerland",
    plus: "More +", moins: "Less -",
    csRelated: "Other projects", csCursor: "View project",
    csTalkTop: "A project?", csTalkReveal: "Let's talk",
    article: "Article", readArticle: "Read the article", cursorRead: "Read",
    share: "Share", shareCopy: "Copy link", shareCopied: "Link copied",
    shareLi: "Share on LinkedIn", shareX: "Share on X", shareFb: "Share on Facebook", shareWa: "Share on WhatsApp",
    otherArticles: "Other articles", allJournalTop: "View all", allJournalReveal: "The whole journal",
    quoteRole: "Note from the studio",
    svcProcess: "The process",
    svcProcessDesc: "A short, readable method, the same for every craft: understand, frame, draw, roll out, hand over.",
    svcPillars: "What this craft covers", svcRelated: "Related work",
    svcAllTop: "All services", svcAllReveal: "See the six crafts",
    agBased: "Based in Geneva, active across the Lake Geneva arc",
    agDisciplines: "What we know how to do", agTeam: "The team", agTeamSub: "A tight team, completed project by project by the right craftspeople.",
    agOffices: "Offices", agRep: "Landmarks and convictions", agStrip: "Glimpses of the studio",
    agTalkTop: "Let's work together", agTalkReveal: "Write to us",
    artAutor: "Author", artData: "Date", artLeitura: "Reading", artTema: "Topic",
    artOutros: "Other articles", artMinRead: "min read",
    agSvcPara: "We build brands and useful digital experiences for organisations that want to move forward. Every craft here runs on a short circuit: the person who answers you is the one doing the work.",
    agSvcAllTop: "View all our services", agSvcAllReveal: "Our services",
    agOffSub: "A studio in the heart of Geneva, completed by a network of creative craftspeople collaborating from wherever they work best.",
    agOffPara: "Collaboration is everything. We don't work for you, and you certainly don't work for us: we work together, with the shared ambition of moving your brand forward.",
    legalKicker: "Legal", legalSommaire: "Contents",
    legalRef: "This legal document is available in French only. Write to us with any question about its content.",
    legalUpdated: "Updated",
    nfTitle: "Page not found", nfBackTop: "Go back", nfBackReveal: "Return home",
    nfText: "The page you are looking for does not exist or has moved.",
    nfBackHome: "Back to home",
    lbClose: "Close", lbAria: "Project images", coAria: "Case studies",
    etudesLink: "Case studies", privacyLink: "Privacy", termsLink: "Terms",
    skipLink: "Skip to content", lrgAlt: "ABiL MEDiAS, the studio at work",
  },
  pt: {
    navAria: "Navegação principal", logoAria: "ABiL MEDiAS, início", langsAria: "Línguas", menuAria: "Menu",
    menu: "Menu +", fermer: "Fechar", accueil: "Início",
    nextPage: "Página seguinte", backTop: "Topo da página",
    footerHead: "Vamos adorar ler a sua mensagem. Trabalhemos juntos.",
    contactTop: "Contacte-nos", contactReveal: "Escreva-nos",
    colBiz: "Contactos profissionais", colJobs: "Candidaturas", colCity: "Genebra", colHours: "Horários",
    hoursDays: "Segunda a sexta", country: "Suíça",
    plus: "Mais +", moins: "Menos -",
    csRelated: "Outros projetos", csCursor: "Ver o projeto",
    csTalkTop: "Um projeto?", csTalkReveal: "Falemos",
    article: "Artigo", readArticle: "Ler o artigo", cursorRead: "Ler",
    share: "Partilhar", shareCopy: "Copiar a ligação", shareCopied: "Ligação copiada",
    shareLi: "Partilhar no LinkedIn", shareX: "Partilhar no X", shareFb: "Partilhar no Facebook", shareWa: "Partilhar no WhatsApp",
    otherArticles: "Outros artigos", allJournalTop: "Ver tudo", allJournalReveal: "Todo o jornal",
    quoteRole: "Nota do ateliê",
    svcProcess: "O processo",
    svcProcessDesc: "Um método curto e legível, o mesmo para cada ofício: compreender, enquadrar, desenhar, lançar, transmitir.",
    svcPillars: "O que este ofício cobre", svcRelated: "Trabalhos ligados",
    svcAllTop: "Todos os serviços", svcAllReveal: "Ver os seis ofícios",
    agBased: "Sediados em Genebra, ativos em todo o arco lemânico",
    agDisciplines: "O que sabemos fazer", agTeam: "A equipa", agTeamSub: "Uma equipa enxuta, completada projeto a projeto pelos artesãos certos.",
    agOffices: "Escritórios", agRep: "Referências e convicções", agStrip: "Vistas do ateliê",
    agTalkTop: "Trabalhemos juntos", agTalkReveal: "Escreva-nos",
    artAutor: "Autor", artData: "Data", artLeitura: "Leitura", artTema: "Tema",
    artOutros: "Outros artigos", artMinRead: "min de leitura",
    agSvcPara: "Construímos marcas e experiências digitais úteis para organizações que querem avançar. Cada ofício pratica-se em circuito curto: quem lhe responde é quem faz o trabalho.",
    agSvcAllTop: "Ver todos os serviços", agSvcAllReveal: "Os serviços",
    agOffSub: "Um ateliê no coração de Genebra, completado por uma rede de artesãos criativos que colaboram de onde trabalham melhor.",
    agOffPara: "A colaboração é tudo. Não trabalhamos para si e você não trabalha para nós: trabalhamos juntos, com a mesma ambição de fazer a sua marca avançar.",
    legalKicker: "Legal", legalSommaire: "Sumário",
    legalRef: "Este documento jurídico só existe em francês. Para qualquer questão sobre o seu conteúdo, escreva-nos.",
    legalUpdated: "Atualização",
    nfTitle: "Página não encontrada", nfBackTop: "Voltar", nfBackReveal: "Voltar ao início",
    nfText: "A página que procura não existe ou mudou de endereço.",
    nfBackHome: "Voltar ao início",
    lbClose: "Fechar", lbAria: "Imagens do projeto", coAria: "Estudos de caso",
    etudesLink: "Estudos de caso", privacyLink: "Privacidade", termsLink: "Condições",
    skipLink: "Ir para o conteúdo", lrgAlt: "ABiL MEDiAS, o ateliê a trabalhar",
  },
  de: {
    navAria: "Hauptnavigation", logoAria: "ABiL MEDiAS, Startseite", langsAria: "Sprachen", menuAria: "Menü",
    menu: "Menu +", fermer: "Schliessen", accueil: "Start",
    nextPage: "Nächste Seite", backTop: "Nach oben",
    footerHead: "Wir freuen uns auf Ihre Nachricht. Arbeiten wir zusammen.",
    contactTop: "Kontakt", contactReveal: "Schreiben Sie uns",
    colBiz: "Geschäftsanfragen", colJobs: "Bewerbungen", colCity: "Genf", colHours: "Zeiten",
    hoursDays: "Montag bis Freitag", country: "Schweiz",
    plus: "Mehr +", moins: "Weniger -",
    csRelated: "Weitere Projekte", csCursor: "Projekt ansehen",
    csTalkTop: "Ein Projekt?", csTalkReveal: "Reden wir",
    article: "Artikel", readArticle: "Artikel lesen", cursorRead: "Lesen",
    share: "Teilen", shareCopy: "Link kopieren", shareCopied: "Link kopiert",
    shareLi: "Auf LinkedIn teilen", shareX: "Auf X teilen", shareFb: "Auf Facebook teilen", shareWa: "Über WhatsApp teilen",
    otherArticles: "Weitere Artikel", allJournalTop: "Alle ansehen", allJournalReveal: "Das ganze Journal",
    quoteRole: "Notiz aus dem Atelier",
    svcProcess: "Der Prozess",
    svcProcessDesc: "Eine kurze, lesbare Methode, für jedes Handwerk dieselbe: verstehen, rahmen, zeichnen, ausrollen, übergeben.",
    svcPillars: "Was dieses Handwerk abdeckt", svcRelated: "Verwandte Arbeiten",
    svcAllTop: "Alle Leistungen", svcAllReveal: "Die sechs Handwerke ansehen",
    agBased: "In Genf zu Hause, am ganzen Genferseebogen tätig",
    agDisciplines: "Was wir können", agTeam: "Das Team", agTeamSub: "Ein kompaktes Team, Projekt für Projekt ergänzt durch die richtigen Handwerker.",
    agOffices: "Büros", agRep: "Fixpunkte und Haltung", agStrip: "Einblicke ins Atelier",
    agTalkTop: "Arbeiten wir zusammen", agTalkReveal: "Schreiben Sie uns",
    artAutor: "Autor", artData: "Datum", artLeitura: "Lesezeit", artTema: "Thema",
    artOutros: "Weitere Artikel", artMinRead: "Min. Lesezeit",
    agSvcPara: "Wir bauen Marken und nützliche digitale Erlebnisse für Organisationen, die vorankommen wollen. Jedes Handwerk läuft auf kurzem Weg: Wer Ihnen antwortet, macht auch die Arbeit.",
    agSvcAllTop: "Alle Leistungen ansehen", agSvcAllReveal: "Unsere Leistungen",
    agOffSub: "Ein Atelier im Herzen von Genf, ergänzt durch ein Netz kreativer Handwerker, die von dort arbeiten, wo sie am besten sind.",
    agOffPara: "Zusammenarbeit ist alles. Wir arbeiten nicht für Sie, und Sie arbeiten sicher nicht für uns: Wir arbeiten zusammen, mit demselben Ziel, Ihre Marke voranzubringen.",
    legalKicker: "Rechtliches", legalSommaire: "Inhalt",
    legalRef: "Dieses Rechtsdokument liegt nur auf Französisch vor. Bei Fragen zum Inhalt schreiben Sie uns.",
    legalUpdated: "Aktualisiert",
    nfTitle: "Seite nicht gefunden", nfBackTop: "Zurück", nfBackReveal: "Zur Startseite",
    nfText: "Die gesuchte Seite gibt es nicht oder sie hat die Adresse gewechselt.",
    nfBackHome: "Zurück zur Startseite",
    lbClose: "Schliessen", lbAria: "Bilder des Projekts", coAria: "Fallstudien",
    etudesLink: "Fallstudien", privacyLink: "Datenschutz", termsLink: "Bedingungen",
    skipLink: "Zum Inhalt springen", lrgAlt: "ABiL MEDiAS, das Atelier bei der Arbeit",
  },
  it: {
    navAria: "Navigazione principale", logoAria: "ABiL MEDiAS, home", langsAria: "Lingue", menuAria: "Menu",
    menu: "Menu +", fermer: "Chiudi", accueil: "Home",
    nextPage: "Pagina successiva", backTop: "Torna su",
    footerHead: "Ci farebbe piacere leggervi. Lavoriamo insieme.",
    contactTop: "Contattaci", contactReveal: "Scrivici",
    colBiz: "Richieste professionali", colJobs: "Candidature", colCity: "Ginevra", colHours: "Orari",
    hoursDays: "Dal lunedì al venerdì", country: "Svizzera",
    plus: "Più +", moins: "Meno -",
    csRelated: "Altri progetti", csCursor: "Vedi il progetto",
    csTalkTop: "Un progetto?", csTalkReveal: "Parliamone",
    article: "Articolo", readArticle: "Leggi l'articolo", cursorRead: "Leggi",
    share: "Condividi", shareCopy: "Copia il link", shareCopied: "Link copiato",
    shareLi: "Condividi su LinkedIn", shareX: "Condividi su X", shareFb: "Condividi su Facebook", shareWa: "Condividi su WhatsApp",
    otherArticles: "Altri articoli", allJournalTop: "Vedi tutto", allJournalReveal: "Tutto il giornale",
    quoteRole: "Nota dell'atelier",
    svcProcess: "Il processo",
    svcProcessDesc: "Un metodo corto e leggibile, lo stesso per ogni mestiere: capire, inquadrare, disegnare, lanciare, consegnare.",
    svcPillars: "Che cosa copre questo mestiere", svcRelated: "Lavori collegati",
    svcAllTop: "Tutti i servizi", svcAllReveal: "Vedi i sei mestieri",
    agBased: "Con base a Ginevra, attivi su tutto l'arco lemanico",
    agDisciplines: "Che cosa sappiamo fare", agTeam: "La squadra", agTeamSub: "Una squadra compatta, completata progetto per progetto dagli artigiani giusti.",
    agOffices: "Uffici", agRep: "Riferimenti e convinzioni", agStrip: "Scorci dell'atelier",
    agTalkTop: "Lavoriamo insieme", agTalkReveal: "Scrivici",
    artAutor: "Autore", artData: "Data", artLeitura: "Lettura", artTema: "Tema",
    artOutros: "Altri articoli", artMinRead: "min di lettura",
    agSvcPara: "Costruiamo brand ed esperienze digitali utili per organizzazioni che vogliono avanzare. Ogni mestiere si pratica a circuito corto: chi vi risponde è chi fa il lavoro.",
    agSvcAllTop: "Vedi tutti i servizi", agSvcAllReveal: "I servizi",
    agOffSub: "Un atelier nel cuore di Ginevra, completato da una rete di artigiani creativi che collaborano da dove lavorano meglio.",
    agOffPara: "La collaborazione è tutto. Non lavoriamo per voi, e voi di certo non lavorate per noi: lavoriamo insieme, con la stessa ambizione di far avanzare il vostro brand.",
    legalKicker: "Legale", legalSommaire: "Sommario",
    legalRef: "La versione francese resta il testo giuridico di riferimento. Per qualsiasi domanda sul contenuto, scriveteci.",
    legalUpdated: "Aggiornamento",
    nfTitle: "Pagina non trovata", nfBackTop: "Indietro", nfBackReveal: "Torna alla home",
    nfText: "La pagina che cercate non esiste o ha cambiato indirizzo.",
    nfBackHome: "Torna alla home",
    lbClose: "Chiudi", lbAria: "Immagini del progetto", coAria: "Casi studio",
    etudesLink: "Casi studio", privacyLink: "Privacy", termsLink: "Condizioni",
    skipLink: "Vai al contenuto", lrgAlt: "ABiL MEDiAS, l'atelier al lavoro",
  },
};






type CaseItem = {
  slug: string; title: string; year: string; tags: TagKey[]; img: string; gallery: string[];
  lede: L5; defi: L5; reponse: L5; secB: L5;
};





const FICHA: { k: string; papel: Record<AbilLang, string>; quem: string }[] = [
  { k: "dircrea", papel: { fr: "Direction créative", en: "Creative direction", pt: "Direção criativa", de: "Kreativdirektion", it: "Direzione creativa" }, quem: "Samuel Dahan" },
  { k: "strategie", papel: { fr: "Stratégie de marque", en: "Brand strategy", pt: "Estratégia de marca", de: "Markenstrategie", it: "Strategia di marca" }, quem: "ABiL MEDiAS" },
  { k: "design", papel: { fr: "Design graphique", en: "Graphic design", pt: "Design gráfico", de: "Grafikdesign", it: "Progetto grafico" }, quem: "Studio ABiL" },
  { k: "prod", papel: { fr: "Production", en: "Production", pt: "Produção", de: "Produktion", it: "Produzione" }, quem: "Studio ABiL" },
  { k: "photo", papel: { fr: "Images", en: "Imagery", pt: "Imagens", de: "Bilder", it: "Immagini" }, quem: "Studio ABiL" },
  { k: "annee", papel: { fr: "Année", en: "Year", pt: "Ano", de: "Jahr", it: "Anno" }, quem: "" },
];
const FICHA_TITULO: Record<AbilLang, string> = {
  fr: "Fiche technique", en: "Credits", pt: "Ficha técnica", de: "Impressum", it: "Scheda tecnica",
};

export const V3D_CASES: CaseItem[] = [
  {
    slug: "trame-urbaine", title: "Trame Urbaine", year: "2026", tags: ["identite", "dircrea", "strategie"],
    img: "/brand/mock-cartaz-2.jpg", gallery: ["/brand/kv-woman-1.jpg", "/brand/mock-glass-card.jpg", "/brand/mock-cartaz-2.jpg", "/brand/kv-men-2.jpg"],
    lede: {
      fr: "Une marque de quartier remise d'aplomb: un système de signes assez simple pour tenir sur une vitrine et assez large pour porter toute une saison.",
      en: "A neighbourhood brand set straight again: a system of signs simple enough for a shopfront and wide enough to carry a whole season.",
      pt: "Uma marca de bairro reposta de pé: um sistema de sinais simples para caber numa montra e amplo para levar uma estação inteira.",
      de: "Eine Quartiermarke wieder ins Lot gebracht: ein Zeichensystem, einfach genug für eine Schaufensterfront und weit genug für eine ganze Saison.",
      it: "Un marchio di quartiere rimesso in piedi: un sistema di segni semplice per una vetrina e ampio per reggere un'intera stagione.",
    },
    defi: {
      fr: "Le nom était connu, l'image ne suivait plus. Chaque support avait été dessiné à part, par des mains différentes, et le public ne reconnaissait plus rien d'une affiche à l'autre. Il fallait remettre de l'ordre sans effacer ce qui avait fait la réputation de la maison.",
      en: "The name was known, the image no longer followed. Every item had been drawn separately, by different hands, and the public no longer recognised anything from one poster to the next. Order had to be restored without erasing what had built the house's reputation.",
      pt: "O nome era conhecido, a imagem já não acompanhava. Cada suporte tinha sido desenhado à parte, por mãos diferentes, e o público já não reconhecia nada de um cartaz para o outro. Era preciso pôr ordem sem apagar o que fez a reputação da casa.",
      de: "Der Name war bekannt, das Bild folgte nicht mehr. Jedes Medium war separat gestaltet worden, von verschiedenen Händen, und das Publikum erkannte von Plakat zu Plakat nichts mehr wieder. Es galt aufzuräumen, ohne zu löschen, was den Ruf des Hauses ausmachte.",
      it: "Il nome era noto, l'immagine non seguiva più. Ogni supporto era stato disegnato a parte, da mani diverse, e il pubblico non riconosceva più nulla da un manifesto all'altro. Bisognava rimettere ordine senza cancellare ciò che aveva fatto la reputazione della casa.",
    },
    reponse: {
      fr: "Nous avons gardé trois signes forts et jeté le reste. Une grille unique, deux graisses, une palette courte: le système tient sur une page et se transmet en dix minutes. Chaque support est né de la même règle, donc chaque support se reconnaît de loin.",
      en: "We kept three strong signs and dropped the rest. One grid, two weights, a short palette: the system fits on a page and is passed on in ten minutes. Every item was born from the same rule, so every item is recognisable from afar.",
      pt: "Guardámos três sinais fortes e deitámos fora o resto. Uma grelha única, duas gramagens, uma paleta curta: o sistema cabe numa página e transmite-se em dez minutos. Cada suporte nasceu da mesma regra, por isso reconhece-se de longe.",
      de: "Wir behielten drei starke Zeichen und liessen den Rest weg. Ein Raster, zwei Schnitte, eine kurze Palette: Das System passt auf eine Seite und ist in zehn Minuten übergeben. Jedes Medium entstand aus derselben Regel, also erkennt man jedes von weitem.",
      it: "Abbiamo tenuto tre segni forti e buttato il resto. Una griglia unica, due pesi, una palette corta: il sistema sta in una pagina e si trasmette in dieci minuti. Ogni supporto nasce dalla stessa regola, quindi si riconosce da lontano.",
    },
    secB: {
      fr: "La grille dicte les marges, la place du logo et la taille du texte sur les quatre formats les plus utilisés. Ce n'est pas une contrainte de style, c'est un gain de temps: l'équipe du client produit ses propres visuels sans nous appeler, et rien ne sort du cadre.",
      en: "The grid sets the margins, the logo position and the text size on the four most used formats. It is not a style constraint, it is time saved: the client's team produces its own visuals without calling us, and nothing falls out of frame.",
      pt: "A grelha dita as margens, o lugar do logótipo e o tamanho do texto nos quatro formatos mais usados. Não é uma restrição de estilo, é tempo ganho: a equipa do cliente produz os seus visuais sem nos ligar, e nada sai do enquadramento.",
      de: "Das Raster bestimmt Ränder, Logoposition und Textgrösse auf den vier meistgenutzten Formaten. Das ist keine Stilfessel, das ist Zeitgewinn: Das Team des Kunden produziert seine Visuals selbst, und nichts fällt aus dem Rahmen.",
      it: "La griglia detta i margini, la posizione del logo e la dimensione del testo sui quattro formati più usati. Non è un vincolo di stile, è tempo guadagnato: la squadra del cliente produce i propri visual senza chiamarci, e nulla esce dal quadro.",
    },
  },
  {
    slug: "ligne-claire", title: "Ligne Claire", year: "2026", tags: ["digital", "devweb"],
    img: "/brand/mock-website-2.jpg", gallery: ["/brand/mock-website-2.jpg", "/brand/kv-men-3.jpg", "/brand/kv-logo-yellow-1.jpg", "/brand/mock-glass-card.jpg"],
    lede: {
      fr: "Un site qui charge vite, se lit sans effort et se met à jour sans nous: trois promesses tenues en une refonte, mesurées avant et après.",
      en: "A site that loads fast, reads without effort and updates without us: three promises kept in one rebuild, measured before and after.",
      pt: "Um site que carrega depressa, se lê sem esforço e se atualiza sem nós: três promessas cumpridas numa reformulação, medidas antes e depois.",
      de: "Eine Seite, die schnell lädt, mühelos zu lesen ist und sich ohne uns aktualisiert: drei Versprechen in einem Relaunch, vorher und nachher gemessen.",
      it: "Un sito che carica in fretta, si legge senza fatica e si aggiorna senza di noi: tre promesse mantenute in un rifacimento, misurate prima e dopo.",
    },
    defi: {
      fr: "L'ancien site avait grossi page après page jusqu'à devenir illisible. Les visiteurs abandonnaient avant le formulaire et l'équipe interne n'osait plus rien publier, faute de savoir où cliquer. Le problème n'était pas le graphisme, c'était la structure.",
      en: "The old site had grown page after page until it became unreadable. Visitors gave up before the form and the internal team no longer dared publish anything, unsure where to click. The problem was not the graphics, it was the structure.",
      pt: "O antigo site tinha crescido página após página até ficar ilegível. Os visitantes desistiam antes do formulário e a equipa interna já não publicava nada, sem saber onde clicar. O problema não era o grafismo, era a estrutura.",
      de: "Die alte Seite war Seite um Seite gewachsen, bis sie unlesbar wurde. Besucher gaben vor dem Formular auf, und das interne Team traute sich nichts mehr zu publizieren. Das Problem war nicht die Grafik, es war die Struktur.",
      it: "Il vecchio sito era cresciuto pagina dopo pagina fino a diventare illeggibile. I visitatori mollavano prima del modulo e la squadra interna non pubblicava più nulla. Il problema non era la grafica, era la struttura.",
    },
    reponse: {
      fr: "Nous avons réduit l'arborescence de trente pages à neuf, réécrit chaque titre pour qu'il dise ce qu'il fait, et construit un back office où publier prend deux minutes. Le reste est de la discipline technique: images au bon format, polices locales, zéro script inutile.",
      en: "We cut the tree from thirty pages to nine, rewrote every heading so it says what it does, and built a back office where publishing takes two minutes. The rest is technical discipline: right sized images, local fonts, zero useless scripts.",
      pt: "Reduzimos a árvore de trinta páginas para nove, reescrevemos cada título para dizer o que faz e construímos um back-office onde publicar leva dois minutos. O resto é disciplina técnica: imagens no formato certo, fontes locais, zero scripts inúteis.",
      de: "Wir kürzten den Baum von dreissig auf neun Seiten, schrieben jede Überschrift so um, dass sie sagt, was sie tut, und bauten ein Backoffice, in dem Publizieren zwei Minuten dauert. Der Rest ist technische Disziplin: passende Bilder, lokale Schriften, null unnötige Skripte.",
      it: "Abbiamo ridotto l'albero da trenta pagine a nove, riscritto ogni titolo perché dica cosa fa e costruito un back office dove pubblicare richiede due minuti. Il resto è disciplina tecnica: immagini giuste, font locali, zero script inutili.",
    },
    secB: {
      fr: "Rien de magique: chaque image pèse ce qu'elle doit peser, les polices sont servies depuis le même domaine et aucune bibliothèque n'est chargée pour un effet que le navigateur sait déjà faire. La page s'affiche avant que le visiteur ait le temps de douter.",
      en: "Nothing magic: every image weighs what it should, fonts are served from the same domain and no library is loaded for an effect the browser already knows. The page shows up before the visitor has time to doubt.",
      pt: "Nada de mágico: cada imagem pesa o que deve, as fontes vêm do mesmo domínio e nenhuma biblioteca é carregada para um efeito que o browser já sabe fazer. A página aparece antes de o visitante ter tempo de duvidar.",
      de: "Nichts Magisches: Jedes Bild wiegt, was es soll, Schriften kommen von derselben Domain und keine Bibliothek wird für einen Effekt geladen, den der Browser schon kann. Die Seite ist da, bevor der Besucher zweifeln kann.",
      it: "Niente di magico: ogni immagine pesa il giusto, i font arrivano dallo stesso dominio e nessuna libreria è caricata per un effetto che il browser già conosce. La pagina appare prima che il visitatore abbia tempo di dubitare.",
    },
  },
  {
    slug: "voix-de-berne", title: "Voix de Berne", year: "2025", tags: ["dircrea", "campagne"],
    img: "/brand/mock-billboard-2.jpg", gallery: ["/brand/mock-cartaz-2.jpg", "/brand/kv-men-2.jpg", "/brand/mock-billboard-2.jpg", "/brand/kv-woman-2.jpg"],
    lede: {
      fr: "Une campagne d'information qui parle à tout le monde sans parler à personne en particulier: une idée simple, tenue sur douze semaines et six formats.",
      en: "An information campaign that speaks to everyone without speaking to no one: one simple idea, held over twelve weeks and six formats.",
      pt: "Uma campanha de informação que fala a todos sem falar a ninguém em particular: uma ideia simples, mantida ao longo de doze semanas e seis formatos.",
      de: "Eine Informationskampagne, die alle anspricht, ohne niemanden anzusprechen: eine einfache Idee, über zwölf Wochen und sechs Formate gehalten.",
      it: "Una campagna d'informazione che parla a tutti senza parlare a nessuno in particolare: un'idea semplice, tenuta su dodici settimane e sei formati.",
    },
    defi: {
      fr: "Le message était technique, le public très large et le budget calibré au franc près. Les campagnes précédentes avaient été jugées froides et personne ne s'en souvenait. Il fallait de la chaleur sans perdre la précision de l'information.",
      en: "The message was technical, the audience very wide and the budget calibrated to the franc. Earlier campaigns had been judged cold and nobody remembered them. Warmth was needed without losing the precision of the information.",
      pt: "A mensagem era técnica, o público muito largo e o orçamento calibrado ao franco. As campanhas anteriores foram consideradas frias e ninguém se lembrava delas. Era preciso calor sem perder a precisão da informação.",
      de: "Die Botschaft war technisch, das Publikum sehr breit und das Budget auf den Franken genau. Frühere Kampagnen galten als kalt und niemand erinnerte sich. Es brauchte Wärme, ohne die Präzision der Information zu verlieren.",
      it: "Il messaggio era tecnico, il pubblico molto ampio e il budget calibrato al franco. Le campagne precedenti erano state giudicate fredde e nessuno le ricordava. Serviva calore senza perdere la precisione dell'informazione.",
    },
    reponse: {
      fr: "Nous sommes partis des mots des gens, pas de ceux du dossier. Six phrases entendues sur le terrain sont devenues six affiches, chacune avec la donnée juste en petit caractère. Le ton est direct, presque parlé, et la mise en page reste sobre.",
      en: "We started from people's words, not the file's. Six sentences heard in the field became six posters, each with the exact figure in small type. The tone is direct, almost spoken, and the layout stays sober.",
      pt: "Partimos das palavras das pessoas, não das do dossiê. Seis frases ouvidas no terreno tornaram-se seis cartazes, cada um com o dado certo em corpo pequeno. O tom é direto, quase falado, e a paginação mantém-se sóbria.",
      de: "Wir gingen von den Worten der Leute aus, nicht von denen des Dossiers. Sechs im Feld gehörte Sätze wurden zu sechs Plakaten, jedes mit der genauen Zahl im Kleingedruckten. Der Ton ist direkt, fast gesprochen, das Layout bleibt ruhig.",
      it: "Siamo partiti dalle parole della gente, non da quelle del dossier. Sei frasi sentite sul campo sono diventate sei manifesti, ognuno con il dato giusto in corpo piccolo. Il tono è diretto, quasi parlato, e l'impaginazione resta sobria.",
    },
    secB: {
      fr: "Une campagne se joue d'abord sur la phrase. Nous testons les formulations à voix haute, dans la rue, avant de poser la moindre image. Ce qui ne se retient pas après deux lectures ne part pas à l'impression, quelle que soit la qualité du visuel.",
      en: "A campaign is won on the sentence first. We test wordings out loud, in the street, before laying down a single image. What is not remembered after two readings does not go to print, whatever the quality of the visual.",
      pt: "Uma campanha joga-se primeiro na frase. Testamos as formulações em voz alta, na rua, antes de pôr uma única imagem. O que não fica após duas leituras não vai para a impressão, seja qual for a qualidade do visual.",
      de: "Eine Kampagne entscheidet sich zuerst am Satz. Wir testen Formulierungen laut, auf der Strasse, bevor wir ein einziges Bild setzen. Was nach zwei Lesungen nicht haftet, geht nicht in den Druck, egal wie gut das Visual ist.",
      it: "Una campagna si gioca prima sulla frase. Testiamo le formulazioni a voce alta, per strada, prima di posare una sola immagine. Ciò che non resta dopo due letture non va in stampa, qualunque sia la qualità del visual.",
    },
  },
  {
    slug: "carte-blanche", title: "Carte Blanche", year: "2025", tags: ["identite", "campagne", "affichage"],
    img: "/brand/mock-billboard-2.jpg", gallery: ["/brand/mock-cartaz-2.jpg", "/brand/kv-woman-2.jpg", "/brand/mock-billboard-2.jpg", "/brand/kv-men-1.jpg"],
    lede: {
      fr: "Une identité pensée pour le grand format: lisible à quarante mètres, encore juste sur un carton d'invitation de dix centimètres.",
      en: "An identity built for large format: readable at forty metres, still right on a ten centimetre invitation card.",
      pt: "Uma identidade pensada para o grande formato: legível a quarenta metros, ainda certa num cartão de convite de dez centímetros.",
      de: "Eine Identität für das Grossformat: auf vierzig Meter lesbar und auf einer zehn Zentimeter grossen Einladung immer noch stimmig.",
      it: "Un'identità pensata per il grande formato: leggibile a quaranta metri, ancora giusta su un invito di dieci centimetri.",
    },
    defi: {
      fr: "Le premier point de contact était un panneau au bord d'une route, vu trois secondes à cinquante kilomètres heure. Tout ce qui marchait à l'écran s'effondrait à cette échelle: trop de mots, trop de niveaux, un logo trop fin.",
      en: "The first touchpoint was a roadside billboard, seen for three seconds at fifty kilometres an hour. Everything that worked on screen collapsed at that scale: too many words, too many levels, too thin a logo.",
      pt: "O primeiro ponto de contacto era um painel à beira da estrada, visto três segundos a cinquenta quilómetros por hora. Tudo o que funcionava no ecrã desmoronava a essa escala: palavras a mais, níveis a mais, um logótipo fino demais.",
      de: "Der erste Kontaktpunkt war eine Plakatwand am Strassenrand, drei Sekunden bei fünfzig Stundenkilometern. Alles, was am Bildschirm funktionierte, brach in diesem Massstab ein: zu viele Wörter, zu viele Ebenen, ein zu feines Logo.",
      it: "Il primo punto di contatto era un cartellone a bordo strada, visto tre secondi a cinquanta all'ora. Tutto ciò che funzionava a schermo crollava a quella scala: troppe parole, troppi livelli, un logo troppo sottile.",
    },
    reponse: {
      fr: "Nous avons dessiné la marque à partir du panneau et non l'inverse. Le signe est épais, la palette tient en deux couleurs et le message ne dépasse jamais cinq mots. Tout le reste de la déclinaison descend de cette contrainte de départ.",
      en: "We drew the brand from the billboard, not the other way round. The mark is thick, the palette holds in two colours and the message never exceeds five words. Everything else descends from that starting constraint.",
      pt: "Desenhámos a marca a partir do painel e não ao contrário. O sinal é espesso, a paleta cabe em duas cores e a mensagem nunca passa de cinco palavras. Todo o resto da declinação desce dessa restrição inicial.",
      de: "Wir zeichneten die Marke vom Plakat her, nicht umgekehrt. Das Zeichen ist kräftig, die Palette hält in zwei Farben und die Botschaft überschreitet nie fünf Wörter. Alles Weitere folgt aus dieser Ausgangsbedingung.",
      it: "Abbiamo disegnato il marchio a partire dal cartellone e non il contrario. Il segno è spesso, la palette sta in due colori e il messaggio non supera mai cinque parole. Tutto il resto discende da quel vincolo iniziale.",
    },
    secB: {
      fr: "Une identité qui naît au grand format descend bien: il suffit d'enlever, jamais d'ajouter. Sur les petits supports, nous coupons la baseline, gardons le signe et laissons le papier respirer. Le résultat est cohérent sans être répétitif.",
      en: "An identity born at large format scales down well: you only remove, never add. On small items we cut the baseline, keep the mark and let the paper breathe. The result is coherent without being repetitive.",
      pt: "Uma identidade que nasce no grande formato desce bem: basta tirar, nunca acrescentar. Nos suportes pequenos cortamos a assinatura, guardamos o sinal e deixamos o papel respirar. O resultado é coerente sem ser repetitivo.",
      de: "Eine im Grossformat geborene Identität skaliert gut nach unten: Man nimmt nur weg, fügt nie hinzu. Auf kleinen Medien streichen wir die Baseline, behalten das Zeichen und lassen das Papier atmen. Das Ergebnis ist stimmig, ohne repetitiv zu sein.",
      it: "Un'identità nata nel grande formato scende bene: basta togliere, mai aggiungere. Sui supporti piccoli tagliamo la baseline, teniamo il segno e lasciamo respirare la carta. Il risultato è coerente senza essere ripetitivo.",
    },
  },
  {
    slug: "signal-leman", title: "Signal Léman", year: "2024", tags: ["identite", "edition"],
    img: "/brand/mock-glass-card.jpg", gallery: ["/brand/kv-woman-3.jpg", "/brand/kv-logo-yellow-1.jpg", "/brand/mock-glass-card.jpg", "/brand/kv-woman-1.jpg"],
    lede: {
      fr: "Une collection imprimée pensée comme un objet à garder: papier choisi à la main, grille sobre et un rythme de lecture qui tient sur cent pages.",
      en: "A printed collection built as an object to keep: paper picked by hand, a sober grid and a reading rhythm that holds across a hundred pages.",
      pt: "Uma coleção impressa pensada como objeto para guardar: papel escolhido à mão, grelha sóbria e um ritmo de leitura que aguenta cem páginas.",
      de: "Eine gedruckte Reihe als Objekt zum Behalten: von Hand gewähltes Papier, ruhiges Raster und ein Leserhythmus, der hundert Seiten trägt.",
      it: "Una collezione stampata pensata come oggetto da tenere: carta scelta a mano, griglia sobria e un ritmo di lettura che regge cento pagine.",
    },
    defi: {
      fr: "Le contenu existait déjà, épars, écrit par sept personnes différentes. Assemblé tel quel, il donnait un document que personne n'ouvrait deux fois. La difficulté n'était pas d'ajouter, c'était de choisir et d'assumer les coupes.",
      en: "The content already existed, scattered, written by seven different people. Assembled as it was, it made a document nobody opened twice. The difficulty was not to add, it was to choose and stand by the cuts.",
      pt: "O conteúdo já existia, disperso, escrito por sete pessoas diferentes. Junto tal como estava, dava um documento que ninguém abria duas vezes. A dificuldade não era acrescentar, era escolher e assumir os cortes.",
      de: "Der Inhalt existierte bereits, verstreut, von sieben Personen geschrieben. So zusammengesetzt ergab er ein Dokument, das niemand zweimal öffnete. Die Schwierigkeit war nicht das Hinzufügen, sondern das Auswählen und Streichen.",
      it: "Il contenuto esisteva già, sparso, scritto da sette persone diverse. Messo insieme così com'era, dava un documento che nessuno apriva due volte. La difficoltà non era aggiungere, era scegliere e assumersi i tagli.",
    },
    reponse: {
      fr: "Nous avons construit un chemin de fer avant d'ouvrir le premier fichier: une idée par double page, une image par idée, aucune page de remplissage. La typographie fait le reste, avec deux tailles seulement et beaucoup de blanc.",
      en: "We built a flatplan before opening the first file: one idea per spread, one image per idea, no filler page. Typography does the rest, with two sizes only and plenty of white.",
      pt: "Construímos um chemin de fer antes de abrir o primeiro ficheiro: uma ideia por página dupla, uma imagem por ideia, nenhuma página de enchimento. A tipografia faz o resto, com apenas dois tamanhos e muito branco.",
      de: "Wir bauten einen Ablaufplan, bevor wir die erste Datei öffneten: eine Idee pro Doppelseite, ein Bild pro Idee, keine Füllseite. Die Typografie macht den Rest, mit nur zwei Graden und viel Weiss.",
      it: "Abbiamo costruito un menabò prima di aprire il primo file: un'idea per doppia pagina, un'immagine per idea, nessuna pagina di riempimento. La tipografia fa il resto, con due soli corpi e molto bianco.",
    },
    secB: {
      fr: "Le choix du papier vient avant la mise en page, pas après. Un grammage un peu plus lourd change la façon dont la main tourne les pages, donc le rythme du texte. Nous imprimons des essais grandeur nature dès la deuxième semaine.",
      en: "Paper comes before layout, not after. A slightly heavier stock changes how the hand turns the pages, so the rhythm of the text. We print full size proofs from the second week.",
      pt: "A escolha do papel vem antes da paginação, não depois. Uma gramagem um pouco mais pesada muda a forma como a mão vira as páginas, logo o ritmo do texto. Imprimimos provas em tamanho real desde a segunda semana.",
      de: "Das Papier kommt vor dem Layout, nicht danach. Ein etwas schwereres Gewicht verändert, wie die Hand blättert, also den Rhythmus des Textes. Wir drucken ab der zweiten Woche Proofs in Originalgrösse.",
      it: "La scelta della carta viene prima dell'impaginazione, non dopo. Una grammatura un po' più pesante cambia il modo in cui la mano gira le pagine, quindi il ritmo del testo. Stampiamo prove a grandezza reale dalla seconda settimana.",
    },
  },
  {
    slug: "nuit-blanche", title: "Nuit Blanche", year: "2024", tags: ["digital", "dircrea"],
    img: "/brand/kv-logo-black-2.jpg", gallery: ["/brand/kv-men-1.jpg", "/brand/mock-website-2.jpg", "/brand/kv-logo-black-2.jpg", "/brand/kv-men-3.jpg"],
    lede: {
      fr: "Une plateforme d'événement à lire dans le noir, sur un téléphone, entre deux salles: contraste tenu, parcours court, information à jour à la minute.",
      en: "An event platform to read in the dark, on a phone, between two rooms: contrast held, short journey, information current to the minute.",
      pt: "Uma plataforma de evento para ler no escuro, no telemóvel, entre duas salas: contraste mantido, percurso curto, informação atualizada ao minuto.",
      de: "Eine Event-Plattform zum Lesen im Dunkeln, auf dem Telefon, zwischen zwei Sälen: gehaltener Kontrast, kurzer Weg, minutenaktuelle Information.",
      it: "Una piattaforma di evento da leggere al buio, su un telefono, tra due sale: contrasto tenuto, percorso corto, informazione aggiornata al minuto.",
    },
    defi: {
      fr: "Le public consulte le programme debout, dans la rue, avec une seule main et peu de réseau. Un site classique, pensé pour un bureau éclairé, devenait illisible dans ces conditions et personne ne trouvait la salle suivante.",
      en: "The audience checks the programme standing, in the street, one handed and with little signal. A classic site, made for a lit desk, became unreadable in those conditions and nobody found the next room.",
      pt: "O público consulta o programa de pé, na rua, com uma só mão e pouca rede. Um site clássico, pensado para uma secretária iluminada, tornava-se ilegível nessas condições e ninguém encontrava a sala seguinte.",
      de: "Das Publikum liest das Programm im Stehen, auf der Strasse, einhändig und mit wenig Empfang. Eine klassische Seite, für den beleuchteten Schreibtisch gedacht, wurde so unlesbar und niemand fand den nächsten Saal.",
      it: "Il pubblico consulta il programma in piedi, per strada, con una mano sola e poca rete. Un sito classico, pensato per una scrivania illuminata, diventava illeggibile e nessuno trovava la sala successiva.",
    },
    reponse: {
      fr: "Fond sombre par défaut, corps de texte plus grand, boutons à portée du pouce et un plan qui s'ouvre en une seule pression. Tout ce qui n'aide pas à trouver la salle a été retiré de l'écran principal.",
      en: "Dark background by default, larger body text, buttons within thumb reach and a map that opens in a single press. Everything that does not help find the room was removed from the main screen.",
      pt: "Fundo escuro por defeito, corpo de texto maior, botões ao alcance do polegar e um mapa que abre com uma só pressão. Tudo o que não ajuda a encontrar a sala saiu do ecrã principal.",
      de: "Dunkler Hintergrund als Standard, grösserer Fliesstext, Buttons in Daumenreichweite und ein Plan, der mit einem Druck aufgeht. Alles, was nicht beim Finden des Saals hilft, verschwand vom Hauptschirm.",
      it: "Sfondo scuro di default, corpo di testo più grande, pulsanti a portata di pollice e una mappa che si apre con una sola pressione. Tutto ciò che non aiuta a trovare la sala è uscito dalla schermata principale.",
    },
    secB: {
      fr: "Nous avons testé l'écran dehors, la nuit, avec des gens qui marchaient. Trois réglages ont changé après ce test: la taille du texte, la zone tactile des boutons et l'ordre des deux premiers blocs. Aucun de ces réglages ne se voyait au bureau.",
      en: "We tested the screen outside, at night, with people walking. Three settings changed after that test: text size, the touch area of the buttons and the order of the first two blocks. None of them showed up at the desk.",
      pt: "Testámos o ecrã na rua, à noite, com pessoas a andar. Três ajustes mudaram depois desse teste: o tamanho do texto, a área tátil dos botões e a ordem dos dois primeiros blocos. Nenhum se via na secretária.",
      de: "Wir testeten den Bildschirm draussen, nachts, mit Gehenden. Drei Einstellungen änderten sich danach: Textgrösse, Touch-Fläche der Buttons und die Reihenfolge der ersten beiden Blöcke. Keine davon zeigte sich am Schreibtisch.",
      it: "Abbiamo testato lo schermo fuori, di notte, con persone che camminavano. Tre regolazioni sono cambiate dopo quel test: il corpo del testo, l'area tattile dei pulsanti e l'ordine dei primi due blocchi. Nessuna si vedeva alla scrivania.",
    },
  },
];
export const V3D_CASE_SLUGS = V3D_CASES.map((c) => c.slug);












type ServiceItem = {
  slug: string; name: L5; img: string; sub1: L5; sub2: L5; p1: L5; p2: L5;
  pillars: L5[]; related: TagKey[];
};
export const V3D_SERVICES: ServiceItem[] = [
  {
    slug: "strategie", img: "/brand/kv-icon-yellow-1.jpg", related: ["strategie", "dircrea"],
    name: { fr: "Stratégie", en: "Strategy", pt: "Estratégia", de: "Strategie", it: "Strategia" },
    sub1: { fr: "Comprendre avant de dessiner", en: "Understand before drawing", pt: "Compreender antes de desenhar", de: "Verstehen vor dem Gestalten", it: "Capire prima di disegnare" },
    sub2: { fr: "Décider et assumer", en: "Decide and stand by it", pt: "Decidir e assumir", de: "Entscheiden und dazu stehen", it: "Decidere e assumersi" },
    p1: {
      fr: "La stratégie n'est pas une présentation, c'est une série de choix écrits noir sur blanc: à qui l'on parle, ce que l'on promet, ce que l'on refuse. Sans ces trois lignes, chaque décision créative repart de zéro, et le projet coûte deux fois son prix.",
      en: "Strategy is not a presentation, it is a set of choices written in black and white: who we speak to, what we promise, what we refuse. Without those three lines every creative decision gets reopened, and the project costs twice its price.",
      pt: "A estratégia não é uma apresentação, é uma série de escolhas escritas a preto e branco: com quem falamos, o que prometemos, o que recusamos. Sem essas três linhas, cada decisão criativa volta ao início e o projeto custa o dobro.",
      de: "Strategie ist keine Präsentation, sondern eine Reihe schriftlich festgehaltener Entscheidungen: zu wem wir sprechen, was wir versprechen, was wir ablehnen. Ohne diese drei Zeilen wird jede kreative Entscheidung neu verhandelt und das Projekt kostet doppelt.",
      it: "La strategia non è una presentazione, è una serie di scelte scritte nero su bianco: a chi parliamo, cosa promettiamo, cosa rifiutiamo. Senza quelle tre righe ogni decisione creativa si ridiscute daccapo e il progetto costa il doppio.",
    },
    p2: {
      fr: "Nous travaillons en trois temps: écouter les gens qui achètent, regarder ce que fait la concurrence, puis poser un positionnement que l'équipe interne peut répéter sans notes. Le livrable tient en quelques pages et sert de juge de paix pendant les deux ans qui suivent.",
      en: "We work in three moves: listen to the people who buy, look at what the competition does, then set a positioning the internal team can repeat without notes. The deliverable fits in a few pages and settles arguments for the next two years.",
      pt: "Trabalhamos em três tempos: ouvir quem compra, olhar para o que faz a concorrência e depois assentar um posicionamento que a equipa interna consiga repetir sem notas. O entregável cabe em poucas páginas e serve de árbitro nos dois anos seguintes.",
      de: "Wir arbeiten in drei Schritten: den Kaufenden zuhören, den Wettbewerb ansehen und dann eine Positionierung setzen, die das interne Team ohne Notizen wiederholen kann. Das Ergebnis passt auf wenige Seiten und entscheidet zwei Jahre lang Streitfragen.",
      it: "Lavoriamo in tre tempi: ascoltare chi compra, guardare cosa fa la concorrenza, poi posare un posizionamento che la squadra interna sappia ripetere senza appunti. Il deliverable sta in poche pagine e fa da arbitro per i due anni successivi.",
    },
    pillars: [
      { fr: "Étude des publics et entretiens", en: "Customer research and interviews", pt: "Pesquisa de clientes e entrevistas", de: "Kundenforschung und Interviews", it: "Ricerca clienti e interviste" },
      { fr: "Analyse de la concurrence", en: "Competitor review", pt: "Revisão da concorrência", de: "Wettbewerbsanalyse", it: "Analisi dei concorrenti" },
      { fr: "Positionnement de marque", en: "Brand positioning", pt: "Posicionamento de marca", de: "Markenpositionierung", it: "Posizionamento di marca" },
      { fr: "Plateforme et ton de voix", en: "Platform and tone of voice", pt: "Plataforma e tom de voz", de: "Plattform und Tonalität", it: "Piattaforma e tono di voce" },
      { fr: "Architecture de l'offre", en: "Offer architecture", pt: "Arquitetura da oferta", de: "Angebotsarchitektur", it: "Architettura dell'offerta" },
      { fr: "Plan de lancement", en: "Launch plan", pt: "Plano de lançamento", de: "Launch-Plan", it: "Piano di lancio" },
    ],
  },
  {
    slug: "identite", img: "/brand/mock-billboard-2.jpg", related: ["identite", "edition"],
    name: { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" },
    sub1: { fr: "Un signe qui tient", en: "A mark that holds", pt: "Um sinal que aguenta", de: "Ein Zeichen, das hält", it: "Un segno che regge" },
    sub2: { fr: "Un système qui se transmet", en: "A system that passes on", pt: "Um sistema que se transmite", de: "Ein System, das übergeben wird", it: "Un sistema che si trasmette" },
    p1: {
      fr: "L'identité est la part la plus durable d'une entreprise. Nous dessinons des marques faites pour tenir des années sans lifting forcé: un signe simple, deux graisses, une palette courte et des règles assez claires pour qu'un tiers les applique sans nous.",
      en: "Identity is the most lasting part of a business. We draw brands built to hold for years without forced facelifts: a simple mark, two weights, a short palette and rules clear enough for a third party to apply without us.",
      pt: "A identidade é a parte mais duradoura de uma empresa. Desenhamos marcas feitas para aguentar anos sem lifting forçado: um sinal simples, duas gramagens, uma paleta curta e regras claras para que um terceiro as aplique sem nós.",
      de: "Die Identität ist der dauerhafteste Teil eines Unternehmens. Wir zeichnen Marken, die Jahre ohne erzwungenes Lifting halten: ein einfaches Zeichen, zwei Schnitte, eine kurze Palette und Regeln, die auch Dritte ohne uns anwenden.",
      it: "L'identità è la parte più duratura di un'impresa. Disegniamo marchi fatti per reggere anni senza lifting forzato: un segno semplice, due pesi, una palette corta e regole chiare abbastanza perché un terzo le applichi senza di noi.",
    },
    p2: {
      fr: "Une identité se juge sur ses extrêmes: un panneau de quatre mètres et un tampon d'un centimètre. Nous testons les deux avant de valider quoi que ce soit, puis nous livrons une charte courte, des gabarits prêts à l'emploi et une séance de passation avec vos équipes.",
      en: "An identity is judged at its extremes: a four metre board and a one centimetre stamp. We test both before validating anything, then deliver short guidelines, ready to use templates and a handover session with your teams.",
      pt: "Uma identidade julga-se pelos extremos: um painel de quatro metros e um carimbo de um centímetro. Testamos os dois antes de validar seja o que for e depois entregamos um manual curto, modelos prontos e uma sessão de passagem com as suas equipas.",
      de: "Eine Identität misst sich an ihren Extremen: einer Vier-Meter-Tafel und einem Ein-Zentimeter-Stempel. Wir testen beides, bevor wir etwas freigeben, und liefern dann kurze Richtlinien, einsatzbereite Vorlagen und eine Übergabe mit Ihren Teams.",
      it: "Un'identità si giudica sugli estremi: un pannello di quattro metri e un timbro di un centimetro. Testiamo entrambi prima di validare qualsiasi cosa, poi consegniamo linee guida corte, modelli pronti e una sessione di passaggio con le vostre squadre.",
    },
    pillars: [
      { fr: "Direction artistique", en: "Art direction", pt: "Direção de arte", de: "Art Direction", it: "Direzione artistica" },
      { fr: "Logo et déclinaisons", en: "Logo and variations", pt: "Logótipo e declinações", de: "Logo und Ableitungen", it: "Logo e declinazioni" },
      { fr: "Typographie et palette", en: "Typography and palette", pt: "Tipografia e paleta", de: "Typografie und Palette", it: "Tipografia e palette" },
      { fr: "Système graphique", en: "Design system", pt: "Sistema de design", de: "Designsystem", it: "Sistema di design" },
      { fr: "Charte et gabarits", en: "Guidelines and templates", pt: "Manual e modelos", de: "Richtlinien und Vorlagen", it: "Linee guida e modelli" },
      { fr: "Naming", en: "Naming", pt: "Naming", de: "Naming", it: "Naming" },
    ],
  },
  {
    slug: "sites-web", img: "/brand/mock-website-2.jpg", related: ["digital", "devweb"],
    name: { fr: "Sites web", en: "Websites", pt: "Sites web", de: "Websites", it: "Siti web" },
    sub1: { fr: "Rapides et lisibles", en: "Fast and readable", pt: "Rápidos e legíveis", de: "Schnell und lesbar", it: "Rapidi e leggibili" },
    sub2: { fr: "Faciles à tenir à jour", en: "Easy to keep current", pt: "Fáceis de manter", de: "Leicht zu pflegen", it: "Facili da tenere aggiornati" },
    p1: {
      fr: "Vitrines, boutiques ou plateformes: nous concevons des sites qui chargent vite, se lisent sans effort et se mettent à jour depuis l'intérieur de l'entreprise. La performance n'est pas un bonus technique, c'est la première condition pour qu'un visiteur reste.",
      en: "Showcases, shops or platforms: we design sites that load fast, read without effort and update from inside the company. Performance is not a technical bonus, it is the first condition for a visitor to stay.",
      pt: "Montras, lojas ou plataformas: desenhamos sites que carregam depressa, se leem sem esforço e se atualizam a partir de dentro da empresa. A performance não é um extra técnico, é a primeira condição para o visitante ficar.",
      de: "Vitrinen, Shops oder Plattformen: Wir bauen Seiten, die schnell laden, mühelos zu lesen sind und aus dem Unternehmen heraus gepflegt werden. Performance ist kein technischer Bonus, sie ist die erste Bedingung, damit ein Besucher bleibt.",
      it: "Vetrine, negozi o piattaforme: progettiamo siti che caricano in fretta, si leggono senza fatica e si aggiornano dall'interno dell'azienda. Le prestazioni non sono un extra tecnico, sono la prima condizione perché un visitatore resti.",
    },
    p2: {
      fr: "Nous partons de la structure, pas des couleurs: quelles pages existent, dans quel ordre et pour quelle décision. Ensuite seulement viennent la maquette, le développement et la recette. La formation de vos équipes fait partie du prix, pas d'un devis séparé.",
      en: "We start from structure, not colours: which pages exist, in what order and for what decision. Only then come the design, the build and the testing. Training your teams is part of the price, not a separate quote.",
      pt: "Partimos da estrutura, não das cores: que páginas existem, em que ordem e para que decisão. Só depois vêm a maquete, o desenvolvimento e os testes. A formação das suas equipas faz parte do preço, não de um orçamento à parte.",
      de: "Wir beginnen bei der Struktur, nicht bei den Farben: welche Seiten es gibt, in welcher Reihenfolge und für welche Entscheidung. Erst dann folgen Layout, Entwicklung und Abnahme. Die Schulung Ihrer Teams ist im Preis enthalten.",
      it: "Partiamo dalla struttura, non dai colori: quali pagine esistono, in che ordine e per quale decisione. Solo dopo arrivano il layout, lo sviluppo e il collaudo. La formazione delle vostre squadre è nel prezzo, non in un preventivo a parte.",
    },
    pillars: [
      { fr: "Design UX et UI", en: "UX and UI design", pt: "Design UX e UI", de: "UX- und UI-Design", it: "Design UX e UI" },
      { fr: "Prototypage", en: "Prototyping", pt: "Prototipagem", de: "Prototyping", it: "Prototipazione" },
      { fr: "Développement front-end", en: "Front end development", pt: "Desenvolvimento front-end", de: "Front-End-Entwicklung", it: "Sviluppo front end" },
      { fr: "CMS et back-office", en: "CMS and back office", pt: "CMS e back-office", de: "CMS und Backoffice", it: "CMS e back office" },
      { fr: "Intégration d'ERP", en: "ERP integration", pt: "Integração de ERP", de: "ERP-Integration", it: "Integrazione ERP" },
      { fr: "Intégration d'API", en: "API integration", pt: "Integração de APIs", de: "API-Integration", it: "Integrazione API" },
      { fr: "E-commerce", en: "E-commerce", pt: "E-commerce", de: "E-Commerce", it: "E-commerce" },
      { fr: "SEO et performance", en: "SEO and performance", pt: "SEO e performance", de: "SEO und Performance", it: "SEO e prestazioni" },
    ],
  },
  {
    slug: "campagnes", img: "/brand/mock-cartaz-2.jpg", related: ["campagne", "affichage"],
    name: { fr: "Campagnes", en: "Campaigns", pt: "Campanhas", de: "Kampagnen", it: "Campagne" },
    sub1: { fr: "Une idée qui se retient", en: "An idea that sticks", pt: "Uma ideia que fica", de: "Eine Idee, die bleibt", it: "Un'idea che resta" },
    sub2: { fr: "Un plan qui tient", en: "A plan that holds", pt: "Um plano que se aguenta", de: "Ein Plan, der hält", it: "Un piano che regge" },
    p1: {
      fr: "De l'affichage au spot, nous imaginons des campagnes qui assument leurs couleurs et restent en tête. Concept, production et déclinaisons sortent du même atelier: une seule idée, portée par des images fortes, déclinée proprement sur chaque canal.",
      en: "From billboards to spots, we imagine campaigns that own their colours and stay in mind. Concept, production and variations leave the same studio: one idea, carried by strong images, declined cleanly on every channel.",
      pt: "Do cartaz ao spot, imaginamos campanhas que assumem as suas cores e ficam na cabeça. Conceito, produção e declinações saem do mesmo ateliê: uma só ideia, levada por imagens fortes, declinada com asseio em cada canal.",
      de: "Vom Plakat bis zum Spot denken wir Kampagnen, die zu ihren Farben stehen und im Kopf bleiben. Konzept, Produktion und Ableitungen kommen aus demselben Atelier: eine Idee, getragen von starken Bildern, sauber auf jedem Kanal.",
      it: "Dall'affissione allo spot, immaginiamo campagne che assumono i loro colori e restano in testa. Concetto, produzione e declinazioni escono dallo stesso atelier: una sola idea, portata da immagini forti, declinata con ordine su ogni canale.",
    },
    p2: {
      fr: "Une campagne se joue d'abord sur la phrase. Nous testons les formulations à voix haute avant de poser la moindre image, puis nous calons le plan média sur le budget réel plutôt que sur un idéal. Ce qui ne se retient pas après deux lectures ne part pas.",
      en: "A campaign is won on the sentence first. We test wordings out loud before laying down a single image, then set the media plan on the real budget rather than an ideal one. What is not remembered after two readings does not ship.",
      pt: "Uma campanha joga-se primeiro na frase. Testamos as formulações em voz alta antes de pôr uma imagem e depois ajustamos o plano média ao orçamento real, não a um ideal. O que não fica após duas leituras não sai.",
      de: "Eine Kampagne entscheidet sich zuerst am Satz. Wir testen Formulierungen laut, bevor wir ein Bild setzen, und richten den Mediaplan am realen Budget aus, nicht an einem Ideal. Was nach zwei Lesungen nicht haftet, geht nicht raus.",
      it: "Una campagna si gioca prima sulla frase. Testiamo le formulazioni a voce alta prima di posare una sola immagine, poi tariamo il piano media sul budget reale e non su un ideale. Ciò che non resta dopo due letture non parte.",
    },
    pillars: [
      { fr: "Concept de campagne", en: "Campaign concept", pt: "Conceito de campanha", de: "Kampagnenkonzept", it: "Concetto di campagna" },
      { fr: "Affichage et grand format", en: "Out of home and large format", pt: "Exterior e grande formato", de: "Plakat und Grossformat", it: "Affissione e grande formato" },
      { fr: "Presse et print", en: "Press and print", pt: "Imprensa e print", de: "Presse und Print", it: "Stampa e print" },
      { fr: "Spots et audiovisuel", en: "Spots and film", pt: "Spots e audiovisual", de: "Spots und Film", it: "Spot e audiovisivo" },
      { fr: "Plan média", en: "Media plan", pt: "Plano média", de: "Mediaplan", it: "Piano media" },
      { fr: "Mesure et bilan", en: "Measurement and review", pt: "Medição e balanço", de: "Messung und Bilanz", it: "Misura e bilancio" },
    ],
  },
  {
    slug: "reseaux-sociaux", img: "/brand/kv-logo-black-1.jpg", related: ["digital", "dircrea"],
    name: { fr: "Réseaux sociaux", en: "Social media", pt: "Redes sociais", de: "Social Media", it: "Social media" },
    sub1: { fr: "Une voix reconnaissable", en: "A recognisable voice", pt: "Uma voz reconhecível", de: "Eine erkennbare Stimme", it: "Una voce riconoscibile" },
    sub2: { fr: "Un rythme tenable", en: "A rhythm you can hold", pt: "Um ritmo sustentável", de: "Ein haltbarer Rhythmus", it: "Un ritmo sostenibile" },
    p1: {
      fr: "Ligne éditoriale, formats courts, animation de communauté et veille: nous donnons aux marques une voix régulière et vivante. Pas de mode jetable ni de contenu pour le contenu, mais un calendrier que votre équipe peut réellement tenir.",
      en: "Editorial line, short formats, community care and monitoring: we give brands a steady, living voice. No disposable fashion, no content for content's sake, but a calendar your team can actually hold.",
      pt: "Linha editorial, formatos curtos, animação de comunidade e monitorização: damos às marcas uma voz regular e viva. Sem moda descartável nem conteúdo por conteúdo, mas um calendário que a sua equipa consiga cumprir.",
      de: "Redaktionslinie, Kurzformate, Community-Pflege und Beobachtung: Wir geben Marken eine verlässliche, lebendige Stimme. Keine Wegwerfmode, kein Inhalt um des Inhalts willen, sondern ein Kalender, den Ihr Team wirklich halten kann.",
      it: "Linea editoriale, formati brevi, cura della community e ascolto: diamo ai brand una voce regolare e viva. Niente moda usa e getta né contenuto per il contenuto, ma un calendario che la vostra squadra riesca davvero a tenere.",
    },
    p2: {
      fr: "Nous préférons trois publications par semaine pendant un an à dix par semaine pendant un mois. Le format suit l'identité, jamais l'inverse, et les chiffres sont regardés en face une fois par mois pour ajuster ce qui doit l'être.",
      en: "We prefer three posts a week for a year to ten a week for a month. Format follows identity, never the other way round, and the numbers are looked at squarely once a month to adjust what needs it.",
      pt: "Preferimos três publicações por semana durante um ano a dez por semana durante um mês. O formato segue a identidade, nunca o contrário, e os números são olhados de frente uma vez por mês.",
      de: "Uns sind drei Beiträge pro Woche über ein Jahr lieber als zehn pro Woche über einen Monat. Das Format folgt der Identität, nie umgekehrt, und die Zahlen werden monatlich ehrlich angesehen.",
      it: "Preferiamo tre pubblicazioni a settimana per un anno a dieci a settimana per un mese. Il formato segue l'identità, mai il contrario, e i numeri si guardano in faccia una volta al mese.",
    },
    pillars: [
      { fr: "Ligne éditoriale", en: "Editorial line", pt: "Linha editorial", de: "Redaktionslinie", it: "Linea editoriale" },
      { fr: "Calendrier de publication", en: "Publishing calendar", pt: "Calendário de publicação", de: "Publikationskalender", it: "Calendario di pubblicazione" },
      { fr: "Formats courts et motion", en: "Short formats and motion", pt: "Formatos curtos e motion", de: "Kurzformate und Motion", it: "Formati brevi e motion" },
      { fr: "Animation de communauté", en: "Community management", pt: "Animação de comunidade", de: "Community-Betreuung", it: "Gestione della community" },
      { fr: "Veille et reporting", en: "Monitoring and reporting", pt: "Monitorização e reporting", de: "Monitoring und Reporting", it: "Ascolto e reporting" },
      { fr: "Gestion de crise", en: "Crisis handling", pt: "Gestão de crise", de: "Krisenbegleitung", it: "Gestione di crisi" },
    ],
  },
  {
    slug: "contenus", img: "/brand/mock-glass-card.jpg", related: ["edition", "identite"],
    name: { fr: "Contenus", en: "Content", pt: "Conteúdos", de: "Inhalte", it: "Contenuti" },
    sub1: { fr: "Des images justes", en: "Accurate images", pt: "Imagens justas", de: "Stimmige Bilder", it: "Immagini giuste" },
    sub2: { fr: "Des mots à leur place", en: "Words in their place", pt: "Palavras no seu lugar", de: "Worte am richtigen Ort", it: "Parole al loro posto" },
    p1: {
      fr: "Photo, vidéo, motion et rédaction: nous produisons des contenus pensés pour chaque canal, qui racontent la même histoire avec la même exigence, de la story au film de marque. La production reste proche de la création, donc rien ne se perd en route.",
      en: "Photo, video, motion and copywriting: we produce content shaped for each channel, telling the same story with the same rigour, from a story to a brand film. Production stays close to creation, so nothing gets lost on the way.",
      pt: "Foto, vídeo, motion e redação: produzimos conteúdos pensados para cada canal, que contam a mesma história com a mesma exigência, da story ao filme de marca. A produção fica perto da criação, por isso nada se perde pelo caminho.",
      de: "Foto, Video, Motion und Text: Wir produzieren Inhalte für jeden Kanal, die dieselbe Geschichte mit derselben Sorgfalt erzählen, von der Story bis zum Markenfilm. Die Produktion bleibt nah an der Kreation, also geht unterwegs nichts verloren.",
      it: "Foto, video, motion e redazione: produciamo contenuti pensati per ogni canale, che raccontano la stessa storia con la stessa esigenza, dalla story al film di marca. La produzione resta vicina alla creazione, così nulla si perde per strada.",
    },
    p2: {
      fr: "Un tournage bien préparé coûte moins cher qu'un tournage improvisé. Nous écrivons le plan de prise de vue avant de réserver quoi que ce soit, et nous livrons les fichiers déjà déclinés dans les formats dont vous avez besoin, prêts à publier.",
      en: "A well prepared shoot costs less than an improvised one. We write the shot list before booking anything, and we deliver files already declined into the formats you need, ready to publish.",
      pt: "Uma rodagem bem preparada custa menos do que uma improvisada. Escrevemos o plano de filmagem antes de reservar seja o que for e entregamos os ficheiros já declinados nos formatos de que precisa, prontos a publicar.",
      de: "Ein gut vorbereiteter Dreh kostet weniger als ein improvisierter. Wir schreiben die Shotlist, bevor wir irgendetwas buchen, und liefern die Dateien bereits in den benötigten Formaten, publikationsfertig.",
      it: "Una ripresa ben preparata costa meno di una improvvisata. Scriviamo il piano di ripresa prima di prenotare qualsiasi cosa e consegniamo i file già declinati nei formati che vi servono, pronti da pubblicare.",
    },
    pillars: [
      { fr: "Photographie", en: "Photography", pt: "Fotografia", de: "Fotografie", it: "Fotografia" },
      { fr: "Vidéo et motion", en: "Video and motion", pt: "Vídeo e motion", de: "Video und Motion", it: "Video e motion" },
      { fr: "Rédaction", en: "Copywriting", pt: "Redação", de: "Text", it: "Redazione" },
      { fr: "Illustration", en: "Illustration", pt: "Ilustração", de: "Illustration", it: "Illustrazione" },
      { fr: "Packaging", en: "Packaging", pt: "Packaging", de: "Packaging", it: "Packaging" },
      { fr: "Gabarits et guides", en: "Templates and guides", pt: "Modelos e guias", de: "Vorlagen und Guides", it: "Modelli e guide" },
    ],
  },
];
export const V3D_SERVICE_SLUGS = V3D_SERVICES.map((s) => s.slug);


const PROCESS: { h: L5; p: L5 }[] = [
  { h: { fr: "Découverte", en: "Discovery", pt: "Descoberta", de: "Entdeckung", it: "Scoperta" },
    p: {
      fr: "Nous écoutons avant de proposer: questionnaire court, entretiens avec les personnes qui vendent et qui achètent, revue des supports existants. Cette étape produit une note de synthèse d'une page, validée par vous avant d'aller plus loin.",
      en: "We listen before proposing: short questionnaire, interviews with the people who sell and who buy, a review of existing materials. This step produces a one page summary, approved by you before we go further.",
      pt: "Escutamos antes de propor: questionário curto, entrevistas com quem vende e com quem compra, revisão dos suportes existentes. Esta etapa produz uma nota de síntese de uma página, validada por si antes de avançarmos.",
      de: "Wir hören zu, bevor wir vorschlagen: kurzer Fragebogen, Gespräche mit denen, die verkaufen und kaufen, Sichtung der bestehenden Materialien. Daraus entsteht eine einseitige Zusammenfassung, die Sie freigeben, bevor es weitergeht.",
      it: "Ascoltiamo prima di proporre: questionario corto, colloqui con chi vende e chi compra, revisione dei supporti esistenti. Questa tappa produce una nota di sintesi di una pagina, validata da voi prima di proseguire.",
    } },
  { h: { fr: "Cadrage", en: "Framing", pt: "Enquadramento", de: "Rahmung", it: "Inquadramento" },
    p: {
      fr: "Nous posons le positionnement, le ton et le périmètre exact du projet: ce qui est inclus, ce qui ne l'est pas, dans quel délai et à quel prix. Un projet cadré se discute une fois; un projet flou se rediscute à chaque livraison.",
      en: "We set the positioning, the tone and the exact scope: what is included, what is not, by when and at what price. A framed project is discussed once; a vague project is discussed at every delivery.",
      pt: "Assentamos o posicionamento, o tom e o âmbito exato do projeto: o que está incluído, o que não está, em que prazo e a que preço. Um projeto enquadrado discute-se uma vez; um projeto vago rediscute-se em cada entrega.",
      de: "Wir setzen Positionierung, Ton und den genauen Umfang: was enthalten ist, was nicht, in welcher Frist und zu welchem Preis. Ein gerahmtes Projekt wird einmal besprochen; ein unklares bei jeder Lieferung erneut.",
      it: "Posiamo il posizionamento, il tono e il perimetro esatto del progetto: cosa è incluso, cosa no, in quali tempi e a quale prezzo. Un progetto inquadrato si discute una volta; uno vago si ridiscute a ogni consegna.",
    } },
  { h: { fr: "Conception", en: "Design", pt: "Conceção", de: "Konzeption", it: "Concezione" },
    p: {
      fr: "Deux pistes, jamais dix. Chacune est présentée en situation réelle, sur les supports qui comptent pour vous, avec les raisons du choix. Nous montrons aussi ce que nous avons écarté: c'est souvent ce qui rend la décision évidente.",
      en: "Two routes, never ten. Each is presented in real situations, on the media that matter to you, with the reasons behind the choice. We also show what we set aside: that is often what makes the decision obvious.",
      pt: "Duas pistas, nunca dez. Cada uma é apresentada em situação real, nos suportes que lhe interessam, com as razões da escolha. Mostramos também o que pusemos de lado: é muitas vezes isso que torna a decisão evidente.",
      de: "Zwei Wege, nie zehn. Jeder wird in realer Situation gezeigt, auf den Medien, die für Sie zählen, mit den Gründen der Wahl. Wir zeigen auch das Verworfene: Oft macht genau das die Entscheidung offensichtlich.",
      it: "Due piste, mai dieci. Ognuna è presentata in situazione reale, sui supporti che vi interessano, con le ragioni della scelta. Mostriamo anche ciò che abbiamo scartato: spesso è questo a rendere la decisione evidente.",
    } },
  { h: { fr: "Déploiement", en: "Roll out", pt: "Lançamento", de: "Ausrollen", it: "Lancio" },
    p: {
      fr: "La piste retenue est déclinée sur tous les supports du périmètre, avec les fichiers d'exécution et le suivi de production. Rien ne part à l'impression ou en ligne sans une relecture croisée par deux personnes de l'atelier.",
      en: "The chosen route is declined across every item in scope, with production files and supervision. Nothing goes to print or online without a cross check by two people from the studio.",
      pt: "A pista escolhida é declinada em todos os suportes do âmbito, com os ficheiros de execução e o acompanhamento de produção. Nada vai para a impressão ou para o ar sem revisão cruzada por duas pessoas do ateliê.",
      de: "Der gewählte Weg wird auf alle Medien im Umfang übertragen, mit Produktionsdaten und Betreuung. Nichts geht in den Druck oder online ohne Gegenlesen durch zwei Personen aus dem Atelier.",
      it: "La pista scelta è declinata su tutti i supporti del perimetro, con i file esecutivi e il seguimento di produzione. Nulla va in stampa o online senza una rilettura incrociata da due persone dell'atelier.",
    } },
  { h: { fr: "Passation", en: "Handover", pt: "Passagem", de: "Übergabe", it: "Passaggio" },
    p: {
      fr: "Nous livrons les sources, une charte courte et une séance de prise en main avec vos équipes. L'objectif est simple: que vous puissiez produire vous-mêmes la majorité de vos supports courants, et nous appeler seulement pour ce qui compte.",
      en: "We hand over the sources, short guidelines and a working session with your teams. The goal is simple: that you can produce most of your everyday items yourselves, and call us only for what matters.",
      pt: "Entregamos as fontes, um manual curto e uma sessão de arranque com as suas equipas. O objetivo é simples: que possa produzir sozinho a maioria dos seus suportes correntes e chamar-nos só para o que conta.",
      de: "Wir übergeben die Quelldateien, kurze Richtlinien und eine Einführungssitzung mit Ihren Teams. Das Ziel ist einfach: dass Sie die meisten Alltagsmedien selbst produzieren und uns nur für das Wesentliche rufen.",
      it: "Consegniamo i sorgenti, linee guida corte e una sessione di presa in mano con le vostre squadre. L'obiettivo è semplice: che possiate produrre da soli la maggior parte dei supporti correnti e chiamarci solo per ciò che conta.",
    } },
];


const AG_TITLE: L5 = {
  fr: "Une agence genevoise qui repense la rencontre entre les gens et les marques",
  en: "A Geneva agency rethinking how people and brands actually meet",
  pt: "Uma agência de Genebra que repensa o encontro entre as pessoas e as marcas",
  de: "Eine Genfer Agentur, die die Begegnung von Menschen und Marken neu denkt",
  it: "Un'agenzia ginevrina che ripensa l'incontro tra le persone e i brand",
};
const AG_SUB1: L5 = { fr: "Petite équipe", en: "Small team", pt: "Equipa pequena", de: "Kleines Team", it: "Squadra piccola" };
const AG_SUB2: L5 = { fr: "Grandes exigences", en: "High standards", pt: "Grandes exigências", de: "Hohe Ansprüche", it: "Grandi esigenze" };
const AG_P1: L5 = {
  fr: "ABiL MEDiAS est un atelier de communication installé Rue de Berne 59, à Genève. Nous réunissons stratégie, identité, sites web et contenus sous un même toit, pour des marques qui veulent être comprises avant d'être remarquées.",
  en: "ABiL MEDiAS is a communication studio based at Rue de Berne 59 in Geneva. We gather strategy, identity, websites and content under one roof, for brands that want to be understood before being noticed.",
  pt: "A ABiL MEDiAS é um ateliê de comunicação instalado na Rue de Berne 59, em Genebra. Reunimos estratégia, identidade, sites e conteúdos sob o mesmo teto, para marcas que querem ser compreendidas antes de serem notadas.",
  de: "ABiL MEDiAS ist ein Kommunikationsatelier an der Rue de Berne 59 in Genf. Wir bündeln Strategie, Identität, Websites und Inhalte unter einem Dach, für Marken, die verstanden werden wollen, bevor sie auffallen.",
  it: "ABiL MEDiAS è un atelier di comunicazione con sede in Rue de Berne 59, a Ginevra. Riuniamo strategia, identità, siti web e contenuti sotto lo stesso tetto, per brand che vogliono essere capiti prima di essere notati.",
};
const AG_P2: L5 = {
  fr: "L'équipe est resserrée par choix: les décisions se prennent vite et la personne qui vous répond est celle qui fait le travail. Pour chaque projet, nous identifions les savoir-faire nécessaires et réunissons les bons artisans autour de la table.",
  en: "The team is tight by choice: decisions come fast and the person who answers you is the one doing the work. For every project we identify the skills required and bring the right craftspeople around the table.",
  pt: "A equipa é enxuta por opção: as decisões tomam-se depressa e quem lhe responde é quem faz o trabalho. Para cada projeto identificamos os saberes necessários e juntamos os artesãos certos à volta da mesa.",
  de: "Das Team ist bewusst klein: Entscheidungen fallen schnell und wer antwortet, macht auch die Arbeit. Für jedes Projekt bestimmen wir die nötigen Fähigkeiten und holen die richtigen Handwerker an den Tisch.",
  it: "La squadra è compatta per scelta: le decisioni si prendono in fretta e chi vi risponde è chi fa il lavoro. Per ogni progetto individuiamo le competenze necessarie e riuniamo gli artigiani giusti attorno al tavolo.",
};




const AG_SLIDES: { slug: string; h: L5; items: L5[] }[] = V3D_SERVICES.map((s) => ({ slug: s.slug, h: s.name, items: s.pillars }));


const AG_TEAM: { first: string; last: string; photo: string; hobby: L5; role: L5 }[] = [









  { first: "Samuel", last: "Dahan", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/samuel-dahan.jpg",
    hobby: { fr: "Genève", en: "Geneva", pt: "Genebra", de: "Genf", it: "Ginevra" },
    role: { fr: "Associé directeur", en: "Managing partner", pt: "Sócio diretor", de: "Geschäftsführender Partner", it: "Socio direttore" } },
  { first: "Nicolas", last: "Juban", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/nicolas-juban.jpg",
    hobby: { fr: "Genève", en: "Geneva", pt: "Genebra", de: "Genf", it: "Ginevra" },
    role: { fr: "Direction de création", en: "Creative direction", pt: "Direção de criação", de: "Kreativdirektion", it: "Direzione creativa" } },
  { first: "Jimmy", last: "Dubuisson", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/jimmy-dubuisson.jpg",
    hobby: { fr: "Genève", en: "Geneva", pt: "Genebra", de: "Genf", it: "Ginevra" },
    role: { fr: "Direction artistique", en: "Art direction", pt: "Direção artística", de: "Art Direction", it: "Direzione artistica" } },
  { first: "Elizabeth", last: "C.", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/elizabeth-c.jpg",
    hobby: { fr: "Genève", en: "Geneva", pt: "Genebra", de: "Genf", it: "Ginevra" },
    role: { fr: "Gestion de projets", en: "Project management", pt: "Gestão de projetos", de: "Projektmanagement", it: "Gestione progetti" } },
  { first: "Ihor", last: "Trokhymchuk", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/ihor-trokhymchuk.jpg",
    hobby: { fr: "Web et mobile", en: "Web and mobile", pt: "Web e mobile", de: "Web und Mobile", it: "Web e mobile" },
    role: { fr: "Développement web et mobile", en: "Web and mobile development", pt: "Desenvolvimento web e mobile", de: "Web- und Mobile-Entwicklung", it: "Sviluppo web e mobile" } },
  { first: "Inna", last: "Krychuniak", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/inna-krychuniak.jpg",
    hobby: { fr: "Genève", en: "Geneva", pt: "Genebra", de: "Genf", it: "Ginevra" },
    role: { fr: "Design graphique", en: "Graphic design", pt: "Design gráfico", de: "Grafikdesign", it: "Design grafico" } },
  { first: "Stephen", last: "Bellotto", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/stephen-bellotto.jpg",
    hobby: { fr: "Direction créative", en: "Creative direction", pt: "Direção criativa", de: "Kreativdirektion", it: "Direzione creativa" },



    role: { fr: "Écosystèmes créatifs IA", en: "Creative AI ecosystems", pt: "Ecossistemas criativos IA", de: "Kreative KI-Ökosysteme", it: "Ecosistemi creativi IA" } },
  { first: "Chivas", last: "", photo: "https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/chivas.jpg",
    hobby: { fr: "Mascotte", en: "Mascot", pt: "Mascote", de: "Maskottchen", it: "Mascotte" },
    role: { fr: "Directeur des siestes", en: "Head of naps", pt: "Diretor de sestas", de: "Leiter der Nickerchen", it: "Direttore dei pisolini" } },
];

const AG_STRIP = [
  "/brand/kv-icon-yellow-1.jpg", "/brand/mock-website-2.jpg", "/brand/mock-cartaz-2.jpg", "/brand/mock-billboard-2.jpg",
  "/brand/mock-glass-card.jpg", "/brand/kv-logo-black-1.jpg", "/brand/kv-icon-yellow-2.jpg", "/brand/kv-icon-black-1.jpg",
];























export type V3DLegalKind = "confidentialite" | "conditions";
type LegalParagraph = { fr: string; it: string };
type LegalSection = { id: string; h: L5; body: LegalParagraph[] };


const LEGAL_DOCS: Record<V3DLegalKind, { title: L5; updated: L5; sections: LegalSection[] }> = {
  confidentialite: {
    title: { fr: "Politique de confidentialité", en: "Privacy policy", pt: "Política de privacidade", de: "Datenschutzerklärung", it: "Informativa sulla privacy" },
    updated: { fr: "14 août 2026", en: "14 August 2026", pt: "14 de agosto de 2026", de: "14. August 2026", it: "14 agosto 2026" },
    sections: [
      { id: "responsable", h: { fr: "Responsable du traitement", en: "Data controller", pt: "Responsável pelo tratamento", de: "Verantwortliche Stelle", it: "Titolare del trattamento" }, body: [
        { fr: "ABiL MEDiAS, AMD COMMUNICATION Sàrl, Rue de Berne 59, 1201 Genève, Suisse, exploite le présent site. Contact: sam@abil.ch, +41 22 548 00 40.", it: "ABiL MEDiAS, AMD COMMUNICATION Sàrl, Rue de Berne 59, 1201 Genève, Svizzera, gestisce il presente sito. Contatto: sam@abil.ch, +41 22 548 00 40." },
        { fr: "Le traitement est soumis à la loi fédérale suisse sur la protection des données (nLPD) et, pour les personnes résidant dans l'Union européenne, au RGPD.", it: "Il trattamento è soggetto alla legge federale svizzera sulla protezione dei dati (nLPD) e, per le persone residenti nell'Unione europea, al GDPR." },
        { fr: "Autorité de contrôle: PFPDT, Préposé fédéral à la protection des données et à la transparence (edoeb.admin.ch). Les personnes résidant dans l'Union européenne peuvent également saisir l'autorité de leur pays (edpb.europa.eu).", it: "Autorità di controllo: PFPDT, Incaricato federale della protezione dei dati e della trasparenza (edoeb.admin.ch). Le persone residenti nell'Unione europea possono inoltre rivolgersi all'autorità del proprio Paese (edpb.europa.eu)." },
      ] },
      { id: "collecte", h: { fr: "Collecte des données", en: "Data collection", pt: "Recolha de dados", de: "Datenerhebung", it: "Raccolta dei dati" }, body: [
        { fr: "Le formulaire de contact de ce site envoie votre message à notre serveur. Les informations que vous nous adressez (nom, adresse électronique, téléphone facultatif, sujets choisis, contenu du message et langue de la page) y sont chiffrées avant d'être écrites, en AES-256-GCM, avec une clé qui ne quitte jamais le serveur.", it: "Il modulo di contatto di questo sito invia il vostro messaggio al nostro server. Le informazioni che ci trasmettete (nome, indirizzo email, telefono facoltativo, argomenti scelti, contenuto del messaggio e lingua della pagina) vengono cifrate prima di essere registrate, con AES-256-GCM e una chiave che non lascia mai il server." },
        { fr: "Le message chiffré est rangé dans un coffre de l'atelier, hébergé par Vercel Inc. Seule une personne de l'atelier authentifiée peut l'ouvrir et le lire. Le dépôt public n'ouvre aucun accès en lecture: il confirme la réception, sans jamais renvoyer votre message ni celui de quelqu'un d'autre.", it: "Il messaggio cifrato viene conservato in un vault dello studio, ospitato da Vercel Inc. Solo una persona autenticata dello studio può aprirlo e leggerlo. Il deposito pubblico non concede alcun accesso in lettura: conferma la ricezione senza mai restituire il vostro messaggio né quello di altre persone." },
        { fr: "Tant que la clé de chiffrement n'est pas configurée sur le serveur, rien n'est enregistré: le dépôt est refusé et le formulaire bascule sur votre propre messagerie, votre message nous parvenant alors comme un courriel ordinaire. Vous pouvez aussi nous écrire directement à sam@abil.ch.", it: "Finché la chiave di cifratura non è configurata sul server, non viene registrato nulla: il deposito viene rifiutato e il modulo passa al vostro programma di posta, così il messaggio ci arriva come una normale email. Potete anche scriverci direttamente a sam@abil.ch." },
        { fr: "Le site ne conserve ni votre adresse IP ni votre parcours de navigation. Notre hébergeur enregistre des journaux techniques de fonctionnement et de sécurité, auxquels nous n'ajoutons aucun profilage.", it: "Il sito non conserva né il vostro indirizzo IP né il vostro percorso di navigazione. Il nostro provider registra log tecnici di funzionamento e sicurezza, ai quali non aggiungiamo alcuna profilazione." },
      ] },
      { id: "finalites", h: { fr: "Finalités et base légale", en: "Purposes and legal basis", pt: "Finalidades e base legal", de: "Zwecke und Rechtsgrundlage", it: "Finalità e base giuridica" }, body: [
        { fr: "Répondre à vos messages et préparer une éventuelle collaboration: mesure précontractuelle et intérêt légitime à vous répondre.", it: "Rispondere ai vostri messaggi e preparare un'eventuale collaborazione: misura precontrattuale e interesse legittimo a rispondervi." },
        { fr: "Exécuter un mandat accepté et tenir la comptabilité qui s'y rattache: exécution du contrat et obligation légale.", it: "Eseguire un mandato accettato e tenere la relativa contabilità: esecuzione del contratto e obbligo legale." },
        { fr: "Assurer le fonctionnement et la sécurité du site: intérêt légitime. Nous ne traitons aucune donnée sensible et nous ne prenons aucune décision automatisée à votre sujet.", it: "Garantire il funzionamento e la sicurezza del sito: interesse legittimo. Non trattiamo dati sensibili e non prendiamo decisioni automatizzate che vi riguardano." },
      ] },
      { id: "conservation", h: { fr: "Durées de conservation", en: "Retention periods", pt: "Prazos de conservação", de: "Aufbewahrungsfristen", it: "Tempi di conservazione" }, body: [
        { fr: "Demandes restées sans suite: six mois. Échanges liés à un projet: trente-six mois après le dernier contact. Pièces comptables d'un mandat: dix ans, comme l'exige le droit suisse.", it: "Richieste senza seguito: sei mesi. Scambi legati a un progetto: trentasei mesi dopo l'ultimo contatto. Documenti contabili di un mandato: dieci anni, come richiesto dal diritto svizzero." },
        { fr: "Journaux techniques de l'hébergeur: douze mois. Passé ces délais, les données sont supprimées ou rendues anonymes.", it: "Log tecnici del provider: dodici mesi. Trascorsi questi termini, i dati vengono eliminati o anonimizzati." },
      ] },
      { id: "tiers", h: { fr: "Services tiers", en: "Third party services", pt: "Serviços de terceiros", de: "Dienste Dritter", it: "Servizi di terzi" }, body: [
        { fr: "L'hébergement du site, sa diffusion et le coffre où sont rangés les messages du formulaire sont assurés par Vercel Inc. (États-Unis). Les courriels que vous nous envoyez transitent par votre fournisseur de messagerie et par le nôtre.", it: "L'hosting del sito, la sua distribuzione e il vault in cui sono conservati i messaggi del modulo sono gestiti da Vercel Inc. (Stati Uniti). Le email che ci inviate transitano attraverso il vostro provider di posta e il nostro." },
        { fr: "Les polices de caractères de ce site ne sont pas servies depuis nos serveurs: elles sont chargées à chaque page depuis Adobe Fonts (Adobe Inc., États-Unis, domaines use.typekit.net et p.typekit.net) et Google Fonts (Google LLC, États-Unis, domaines fonts.googleapis.com et fonts.gstatic.com). Adobe et Google reçoivent donc votre adresse IP et les informations techniques de votre navigateur à chaque chargement de page, sur toutes les pages du site.", it: "I caratteri di questo sito non vengono forniti dai nostri server: a ogni pagina vengono caricati da Adobe Fonts (Adobe Inc., Stati Uniti, domini use.typekit.net e p.typekit.net) e Google Fonts (Google LLC, Stati Uniti, domini fonts.googleapis.com e fonts.gstatic.com). Adobe e Google ricevono quindi il vostro indirizzo IP e le informazioni tecniche del browser a ogni caricamento, su tutte le pagine del sito." },
        { fr: "Nous ne leur transmettons rien d'autre, et ces chargements ne déposent aucun cookie sur votre appareil. Si vous souhaitez éviter ces requêtes, un bloqueur de contenus ou le mode restreint de votre navigateur suffit: le site reste lisible, avec des polices de substitution.", it: "Non trasmettiamo loro nient'altro e questi caricamenti non depositano cookie sul vostro dispositivo. Se desiderate evitare tali richieste, è sufficiente un blocco dei contenuti o la modalità limitata del browser: il sito resta leggibile con caratteri sostitutivi." },
        { fr: "Ces prestataires n'accèdent qu'aux données nécessaires à leur mission. Nous ne vendons, ne louons et n'échangeons aucune donnée personnelle avec des tiers à des fins commerciales.", it: "Questi fornitori accedono solo ai dati necessari al loro incarico. Non vendiamo, noleggiamo né scambiamo dati personali con terzi per finalità commerciali." },
      ] },
      { id: "transfert", h: { fr: "Transfert des données", en: "Data transfers", pt: "Transferência de dados", de: "Datenübermittlung", it: "Trasferimento dei dati" }, body: [
        { fr: "Certaines données techniques sont traitées sur des serveurs situés hors de Suisse. Ces transferts s'appuient sur les clauses contractuelles types de l'Union européenne (2021/914) et sur leur équivalent suisse. Copie des garanties sur demande à sam@abil.ch.", it: "Alcuni dati tecnici sono trattati su server situati fuori dalla Svizzera. Questi trasferimenti si basano sulle clausole contrattuali standard dell'Unione europea (2021/914) e sul loro equivalente svizzero. Una copia delle garanzie è disponibile su richiesta a sam@abil.ch." },
        { fr: "En cas de reprise ou de fusion de l'entreprise, les données de contact pourraient être transmises au repreneur, qui resterait soumis à la présente politique.", it: "In caso di acquisizione o fusione dell'impresa, i dati di contatto potrebbero essere trasmessi al nuovo titolare, che resterebbe soggetto alla presente informativa." },
      ] },
      { id: "cookies", h: { fr: "Cookies", en: "Cookies", pt: "Cookies", de: "Cookies", it: "Cookie" }, body: [
        { fr: "Ce site ne dépose aucun cookie: ni de mesure d'audience, ni publicitaire, ni de réseau social. Aucune bannière ne vous est présentée, faute de choix à vous demander.", it: "Questo sito non deposita alcun cookie: né di misurazione dell'audience, né pubblicitario, né di social network. Non viene mostrato alcun banner, perché non c'è alcuna scelta da richiedervi." },
        { fr: "Le stockage effectué sur votre appareil est purement technique. La langue que vous choisissez est gardée dans la mémoire locale du navigateur, sous la clé abil_lang, pour que la page revienne dans cette langue. Le moteur du site crée par ailleurs une base locale technique, qui ne contient aucune donnée personnelle vous concernant.", it: "La memorizzazione effettuata sul vostro dispositivo è puramente tecnica. La lingua scelta viene conservata nella memoria locale del browser, con la chiave abil_lang, affinché la pagina torni in quella lingua. Il motore del sito crea inoltre una base locale tecnica che non contiene alcun dato personale che vi riguardi." },
        { fr: "Vous pouvez effacer ces deux éléments à tout moment depuis les réglages de votre navigateur, sans perdre l'accès au site: la page repartira simplement dans la langue par défaut.", it: "Potete eliminare questi due elementi in qualsiasi momento dalle impostazioni del browser senza perdere l'accesso al sito: la pagina ripartirà semplicemente nella lingua predefinita." },
        { fr: "Si une mesure d'audience était activée un jour, cette page serait mise à jour et votre consentement demandé avant tout dépôt.", it: "Se in futuro venisse attivata una misurazione dell'audience, questa pagina sarebbe aggiornata e il vostro consenso richiesto prima di qualsiasi deposito." },
      ] },
      { id: "securite", h: { fr: "Sécurité", en: "Security", pt: "Segurança", de: "Sicherheit", it: "Sicurezza" }, body: [
        { fr: "Les échanges avec ce site sont chiffrés. L'accès aux messages reçus est limité aux personnes de l'atelier qui traitent votre demande.", it: "Gli scambi con questo sito sono cifrati. L'accesso ai messaggi ricevuti è limitato alle persone dello studio che trattano la vostra richiesta." },
        { fr: "Aucun système n'est infaillible. En cas de violation de la sécurité des données, nous informons le PFPDT dans les meilleurs délais et, si le risque est élevé, les personnes concernées.", it: "Nessun sistema è infallibile. In caso di violazione della sicurezza dei dati, informiamo il PFPDT nel più breve tempo possibile e, se il rischio è elevato, le persone interessate." },
      ] },
      { id: "droits", h: { fr: "Vos droits", en: "Your rights", pt: "Os seus direitos", de: "Ihre Rechte", it: "I vostri diritti" }, body: [
        { fr: "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, ainsi que du droit de retirer à tout moment un consentement donné.", it: "Avete il diritto di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità, nonché il diritto di revocare in qualsiasi momento un consenso prestato." },
        { fr: "Pour les exercer: sam@abil.ch. Nous répondons dans les trente jours. Vous pouvez aussi adresser une réclamation au PFPDT en Suisse, ou à l'autorité de protection des données de votre pays de résidence dans l'Union européenne.", it: "Per esercitarli: sam@abil.ch. Rispondiamo entro trenta giorni. Potete inoltre presentare un reclamo al PFPDT in Svizzera o all'autorità di protezione dei dati del vostro Paese di residenza nell'Unione europea." },
      ] },
      { id: "modifications", h: { fr: "Modifications", en: "Changes", pt: "Alterações", de: "Änderungen", it: "Modifiche" }, body: [
        { fr: "Cette politique peut évoluer. La date de mise à jour figure en haut de page et la version en vigueur est toujours celle publiée ici.", it: "La presente informativa può evolvere. La data di aggiornamento figura in cima alla pagina e la versione vigente è sempre quella pubblicata qui." },
      ] },
      { id: "contact", h: { fr: "Questions et contact", en: "Questions and contact", pt: "Questões e contacto", de: "Fragen und Kontakt", it: "Domande e contatti" }, body: [
        { fr: "Pour toute question sur vos données, pour en obtenir une copie ou pour en demander la suppression: sam@abil.ch ou ABiL MEDiAS, AMD COMMUNICATION Sàrl, Rue de Berne 59, 1201 Genève.", it: "Per qualsiasi domanda sui vostri dati, per ottenerne una copia o richiederne la cancellazione: sam@abil.ch oppure ABiL MEDiAS, AMD COMMUNICATION Sàrl, Rue de Berne 59, 1201 Genève." },
      ] },
    ],
  },
  conditions: {
    title: { fr: "Conditions générales", en: "Terms and conditions", pt: "Condições gerais", de: "Allgemeine Bedingungen", it: "Condizioni generali" },
    updated: { fr: "14 août 2026", en: "14 August 2026", pt: "14 de agosto de 2026", de: "14. August 2026", it: "14 agosto 2026" },
    sections: [
      { id: "objet", h: { fr: "Objet", en: "Purpose", pt: "Objeto", de: "Zweck", it: "Oggetto" }, body: [
        { fr: "Les présentes conditions régissent l'utilisation du site d'ABiL MEDiAS. Consulter le site vaut acceptation de ces conditions dans leur version publiée au jour de la visite.", it: "Le presenti condizioni disciplinano l'utilizzo del sito di ABiL MEDiAS. La consultazione del sito implica l'accettazione delle condizioni nella versione pubblicata il giorno della visita." },
      ] },
      { id: "acces", h: { fr: "Accès au site", en: "Access to the site", pt: "Acesso ao site", de: "Zugang zur Website", it: "Accesso al sito" }, body: [
        { fr: "Nous faisons notre possible pour que le site reste accessible, sans garantie de disponibilité permanente. Des interruptions peuvent survenir pour maintenance ou pour des causes indépendantes de notre volonté.", it: "Facciamo il possibile affinché il sito resti accessibile, senza garantire una disponibilità permanente. Possono verificarsi interruzioni per manutenzione o per cause indipendenti dalla nostra volontà." },
      ] },
      { id: "propriete", h: { fr: "Propriété intellectuelle", en: "Intellectual property", pt: "Propriedade intelectual", de: "Geistiges Eigentum", it: "Proprietà intellettuale" }, body: [
        { fr: "Les textes, images, mises en page et éléments graphiques de ce site sont protégés. Toute reprise, même partielle, demande notre accord écrit préalable.", it: "I testi, le immagini, le impaginazioni e gli elementi grafici di questo sito sono protetti. Qualsiasi riproduzione, anche parziale, richiede il nostro previo consenso scritto." },
        { fr: "Les marques et travaux présentés restent la propriété de leurs titulaires respectifs et sont montrés à titre de référence.", it: "I marchi e i lavori presentati restano di proprietà dei rispettivi titolari e sono mostrati a titolo di riferimento." },
      ] },
      { id: "contenus", h: { fr: "Contenus et exactitude", en: "Content and accuracy", pt: "Conteúdos e exatidão", de: "Inhalte und Richtigkeit", it: "Contenuti ed esattezza" }, body: [
        { fr: "Les informations publiées sont données de bonne foi et à titre indicatif. Elles peuvent être modifiées à tout moment et ne constituent pas un engagement contractuel.", it: "Le informazioni pubblicate sono fornite in buona fede e a titolo indicativo. Possono essere modificate in qualsiasi momento e non costituiscono un impegno contrattuale." },
      ] },
      { id: "devis", h: { fr: "Devis et prestations", en: "Quotes and services", pt: "Orçamentos e serviços", de: "Offerten und Leistungen", it: "Preventivi e prestazioni" }, body: [
        { fr: "Toute prestation fait l'objet d'un devis écrit précisant le périmètre, le délai et le prix. Seul le devis signé engage les parties.", it: "Ogni prestazione è oggetto di un preventivo scritto che precisa il perimetro, il termine e il prezzo. Solo il preventivo firmato vincola le parti." },
        { fr: "Les conditions particulières figurant sur un devis priment sur les présentes conditions générales.", it: "Le condizioni particolari riportate in un preventivo prevalgono sulle presenti condizioni generali." },
      ] },
      { id: "responsabilite", h: { fr: "Responsabilité", en: "Liability", pt: "Responsabilidade", de: "Haftung", it: "Responsabilità" }, body: [
        { fr: "Notre responsabilité ne peut être engagée pour un dommage indirect lié à l'usage du site ou à l'impossibilité d'y accéder.", it: "Non possiamo essere ritenuti responsabili di danni indiretti legati all'uso del sito o all'impossibilità di accedervi." },
        { fr: "Les liens vers des sites tiers sont proposés pour information; nous n'exerçons aucun contrôle sur leur contenu.", it: "I link a siti terzi sono proposti a titolo informativo; non esercitiamo alcun controllo sul loro contenuto." },
      ] },
      { id: "droit", h: { fr: "Droit applicable", en: "Applicable law", pt: "Direito aplicável", de: "Anwendbares Recht", it: "Diritto applicabile" }, body: [
        { fr: "Les présentes conditions sont soumises au droit suisse. Le for est à Genève, sous réserve des dispositions impératives contraires.", it: "Le presenti condizioni sono soggette al diritto svizzero. Il foro competente è Ginevra, fatte salve le disposizioni imperative contrarie." },
      ] },
      { id: "contact", h: { fr: "Contact", en: "Contact", pt: "Contacto", de: "Kontakt", it: "Contatti" }, body: [
        { fr: "ABiL MEDiAS, AMD COMMUNICATION Sàrl, Rue de Berne 59, 1201 Genève, Suisse. sam@abil.ch, +41 22 548 00 40.", it: "ABiL MEDiAS, AMD COMMUNICATION Sàrl, Rue de Berne 59, 1201 Genève, Svizzera. sam@abil.ch, +41 22 548 00 40." },
      ] },
    ],
  },
};
export const V3D_LEGAL_KINDS: V3DLegalKind[] = ["confidentialite", "conditions"];


const CSS_V3D = `
/* Actual Mundial font via Adobe Fonts (kit opg3hrq, index.html). */
.v3d-root{position:relative;background:${TELA};color:${NOIR};
  font-family:"mundial","Figtree","Helvetica Neue",sans-serif;
  font-weight:400;line-height:1;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.v3d-root *{box-sizing:border-box;margin:0;padding:0;box-shadow:none !important}
.v3d-root ::selection{background:${VIOLETTE};color:${NOIR}}
.v3d-root img{display:block;max-width:100%}
.v3d-root button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:left}
/* Clickable blocks: each card title is now a real <button>, making the block
   available to keyboard users. There is no visual change: the reset above inherits
   the typography, and display:block gives it the same frame as the title. */
.v3d-root h2>button,.v3d-root h3>button{display:block}
.v3d-root a{color:inherit;text-decoration:none}
.v3d-root ul,.v3d-root ol{list-style:none}

/* Typographic scale, identical to the V3 home page and other pages. */
.v3d-xl,.v3d-l,.v3d-m,.v3d-s,.v3d-xs,.v3d-xxs{text-transform:uppercase;letter-spacing:-.03em;margin-left:-.03em;line-height:1}
.v3d-xl{font-size:7vw;line-height:.8;font-weight:300}
.v3d-l{font-size:4.86vw;line-height:.8;font-weight:300}
.v3d-m{font-size:2.8vw;line-height:.9;font-weight:300}
.v3d-s{font-size:1.5vw;line-height:.9;font-weight:400}
.v3d-xs{font-size:14px;line-height:1.2;font-weight:400}
.v3d-xxs{font-size:12px;line-height:1.17;font-weight:400}
.v3d-p{font-size:1.111vw;line-height:1.35;font-weight:400;font-family:"mundial","Figtree","Helvetica Neue",sans-serif;letter-spacing:-.01em;text-transform:none}
.v3d-it{font-style:italic}
.v3d-grey{color:${RHONE}}
.v3d-margin{margin-left:2vw;margin-right:2vw}
.v3d-main{padding-top:55px;padding-bottom:2vw;min-height:60vh}
.v3d-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
/* First tab stop, using the same pattern as the home page (.v3-skip). */
.v3d-skip{position:absolute;left:-9999px;top:0}
.v3d-skip:focus{position:fixed;left:2vw;top:8px;z-index:70;background:${NOIR};color:${ALPIN};padding:8px 12px}

/* Reveal masks with .32em/.06em/.44em clearance and a 165% offset: FIXED values. */
.v3d-wm,.v3d-rm{display:inline-block;overflow:hidden;vertical-align:top;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
        /* Clip ONLY during entry, then remove it to prevent global clipping. */
        .unclip .v3d-wm,.unclip .v3d-rm,.unclip [class*="-head"],.unclip [class*="-title"]{overflow:visible}
        /* Navigation labels never wrap or clip. */
        .v3d-lnk,.v3d-nav a,.v3d-nav button{white-space:nowrap}
.v3d-w,.v3d-rise{display:inline-block;transform:translateY(165%);transition:transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s);will-change:transform}
.v3d-io.in .v3d-w,.v3d-io.in .v3d-rise,.v3d-ready .v3d-nav .v3d-rise{transform:translateY(0)}
        /* Safety net: if the observer never fires during printing, in a background
           tab or in a search engine, the content must still appear. */
        @media print{.v3d-w,.v3d-rise,.v3d-imgfx,.v3d-imgup{transform:none !important;opacity:1 !important}
          .v3d-fillw{width:100% !important}}
.v3d-imgfx{opacity:0;transform:scale(1.3) rotate(8deg);transition:opacity 1s cubic-bezier(.075,0,.165,0),transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s);will-change:transform}
.v3d-io.in .v3d-imgfx{opacity:1;transform:scale(1) rotate(0deg)}
/* The image rises inside a mask over 2.4s. */
.v3d-imgmask{overflow:hidden}
.v3d-imgup{transform:translateY(20%);transition:transform 2.4s cubic-bezier(.4,.4,.1,1);transition-delay:var(--d,0s);will-change:transform}
.v3d-io.in .v3d-imgup{transform:translateY(0)}
.v3d-fillw{width:0;height:1px;background:${NOIR};transition:width 1s cubic-bezier(.3,.3,0,1);transition-delay:var(--d,0s)}
.v3d-io.in .v3d-fillw{width:100%}

.v3d-fadeup{opacity:0;transform:translateY(80%);transition:opacity 1s cubic-bezier(.075,0,.165,0),transform 1.5s cubic-bezier(.075,.82,.165,1);transition-delay:var(--d,0s)}
.v3d-io.in .v3d-fadeup{opacity:1;transform:translateY(0)}
/* Large top block on internal pages: expands from 96vw to 100% (gap A2, no scrub). */
.v3d-expand{width:96vw;margin:0 auto;overflow:hidden;transition:width 1.5s cubic-bezier(.4,.4,.1,1)}
.v3d-io.in .v3d-expand{width:100%}

.v3d-lnk{position:relative;padding-bottom:2px;text-transform:uppercase;cursor:pointer;display:inline-block}
.v3d-lnk:after{content:"";position:absolute;width:100%;height:1px;bottom:0;left:0;transform:scaleX(0);transform-origin:bottom right;transition:transform .3s;background:${NOIR}}
.v3d-lnk:hover:after,.v3d-lnk.on:after{transform:scaleX(1);transform-origin:bottom left}

.v3d-lnk2{padding-bottom:.4vw}
.v3d-lnk2:after{height:2px}

/* Navigation uses the same shell as the V3 home page and other pages. */
.v3d-nav{position:fixed;top:0;left:0;right:0;height:56px;padding:0 2vw;z-index:3010;color:${NOIR};background:${ALPIN};
  display:grid;grid-template-columns:1fr 1fr 1fr 1fr;column-gap:2vw;align-items:center;
  transition:transform 1s cubic-bezier(.215,.61,.355,1),background .45s ease}
/* The bar leaves the screen only when the footer reaches about 80% of the viewport.
   At 2px, the links ROLL away and "Menu +" takes their place, following the v3p pattern. */
.v3d-nav.hide{transform:translateY(-370px)}







.v3d-nav.menuaberto{opacity:0;pointer-events:none}
.v3d-nav.rolled{background:${CITRON}}



        .v3d-proj{background:#ffffff}
        .v3d-projcapa{width:100%;height:min(78vh,52vw);overflow:hidden;background:${LEMAN}}
        .v3d-projcapa img{width:100%;height:100%;object-fit:cover;display:block}
        .v3d-projtxt{max-width:1440px;margin:0 auto;padding:6vw 2vw 4vw}
        .v3d-projtxt h1{font-size:4.86vw;line-height:.9;font-weight:300;letter-spacing:-.03em;margin:0 0 2.4vw}
        .v3d-projtxt .lede{font-size:1.6vw;line-height:1.3;font-weight:300;max-width:34ch;margin:0 0 2vw}
        .v3d-projtxt p{font-size:1.111vw;line-height:1.5;font-weight:300;max-width:62ch;margin:0 0 1em}
        .v3d-ficha{max-width:1440px;margin:0 auto;padding:0 2vw 6vw;display:grid;
          grid-template-columns:repeat(3,1fr);column-gap:2vw;row-gap:1.6vw}
        .v3d-ficha .lin{border-top:1px solid ${LEMAN};padding-top:.8vw}
        .v3d-ficha .papel{display:block;font-size:12px;letter-spacing:.02em;color:${RHONE};margin-bottom:.35vw}
        .v3d-ficha .quem{display:block;font-size:1.111vw;line-height:1.2;font-weight:300}



        .v3d-art{background:#ffffff}
        .v3d-artcapa{width:100%;height:min(78vh,52vw);overflow:hidden;background:${LEMAN}}
        .v3d-artcapa img{width:100%;height:100%;object-fit:cover;display:block}
        .v3d-arthead{max-width:1440px;margin:0 auto;padding:6vw 2vw 3vw;text-align:center}
        .v3d-arthead .v3d-arttag{font-size:12px;letter-spacing:.02em;color:${RHONE};text-transform:uppercase;margin-bottom:1.2vw;display:block}
        .v3d-arthead h1{font-size:4.86vw;line-height:.9;font-weight:300;letter-spacing:-.03em;margin:0 auto 2vw;max-width:22ch}
        .v3d-arthead .lede{font-size:1.6vw;line-height:1.3;font-weight:300;max-width:44ch;margin:0 auto}
        .v3d-artficha{max-width:1440px;margin:0 auto;padding:0 2vw 4vw;display:grid;
          grid-template-columns:repeat(4,1fr);column-gap:2vw;row-gap:1.6vw}
        .v3d-artficha .lin{border-top:1px solid ${LEMAN};padding-top:.8vw}
        .v3d-artficha .papel{display:block;font-size:12px;letter-spacing:.02em;color:${RHONE};margin-bottom:.35vw;text-transform:uppercase}
        .v3d-artficha .quem{display:block;font-size:1.111vw;line-height:1.2;font-weight:300}
        .v3d-art-autor{display:flex;align-items:center;gap:.8vw}





        .v3d-art-avatar{width:3vw;height:3vw;border-radius:0;background:${NOIR};object-fit:contain;padding:.6vw;flex:0 0 auto}



        .v3d-art-bio{font-size:14px;font-weight:300;line-height:1.45;color:${RHONE};margin-top:1.6vw;max-width:34ch}
        .v3d-artbody{max-width:1440px;margin:0 auto;padding:2vw 2vw 6vw}




        .v3d-artbody{--coluna:43.2vw}
        .v3d-artbody p{font-size:1.111vw;line-height:1.6;font-weight:300;max-width:var(--coluna);margin:0 auto 1em}
        .v3d-artbody h2{font-size:1.6vw;line-height:1.15;font-weight:400;letter-spacing:-.02em;max-width:var(--coluna);margin:2.2em auto .8em}
        .v3d-artbody h3,.v3d-artbody ul,.v3d-artbody ol,.v3d-artbody blockquote{max-width:var(--coluna);margin-left:auto;margin-right:auto}


        .v3d-artbody figure{width:100%;max-width:var(--coluna);margin:3vw auto;font-size:0;line-height:0}
        .v3d-artbody figure img{width:100%;height:auto;display:block}
        .v3d-artbody figcaption{font-size:11px;line-height:1.3;color:${RHONE};padding-top:.5vw;text-align:right}
        .v3d-artoutros{max-width:1440px;margin:0 auto;padding:0 2vw 8vw}
        .v3d-artoutros-h{display:flex;align-items:flex-start;margin-bottom:2.6vw}
        .v3d-artoutros-grid{display:grid;grid-template-columns:repeat(3,1fr);column-gap:2vw;row-gap:4vw}
        .v3d-artcard{display:flex;flex-direction:column;align-items:flex-start;text-align:left;cursor:pointer;border-top:1px solid ${NOIR};padding-top:1.2vw}
        .v3d-artcard-img{width:100%;aspect-ratio:1296/1120;overflow:hidden;margin-bottom:1.2vw}
        .v3d-artcard-img img{width:100%;height:100%;object-fit:cover;display:block}
        .v3d-artcard .meta{font-size:12px;color:${RHONE};text-transform:uppercase;margin-bottom:.6vw}
        .v3d-artcard .tit{font-size:1.5vw;line-height:.9;font-weight:400;letter-spacing:-.03em;text-transform:uppercase}
        @media(max-width:900px){
          .v3d-arthead{padding:12vw 4vw 6vw}
          .v3d-arthead h1{font-size:9vw}
          .v3d-arthead .lede{font-size:4.4vw;max-width:none}
          .v3d-artficha{grid-template-columns:1fr 1fr;padding:0 4vw 8vw}
          .v3d-art-avatar{width:10vw;height:10vw;padding:1.8vw}
          .v3d-artbody{padding:4vw 4vw 10vw}
          .v3d-artbody p{font-size:3.8vw;max-width:none}
          .v3d-artbody h2{font-size:5.4vw;max-width:none}
          .v3d-artoutros{padding:0 4vw 16vw}
          .v3d-artoutros-grid{grid-template-columns:1fr;row-gap:10vw}
          .v3d-artcard .tit{font-size:5.6vw}
        }


        .v3d-projimgs{display:block;font-size:0;line-height:0;max-width:1440px;margin:0 auto;padding:0 2vw}
        .v3d-projimgs img{display:block;width:100%;height:auto;margin:0;padding:0}
        /* Each image now lives inside a button that opens the lightbox. The button
           must exactly fill the image frame or the column develops gaps. */
        .v3d-projimgs button{display:block;width:100%;overflow:hidden}



        .v3d-projimgs .v3d-imgfx,.v3d-projimgs img,.v3d-projimgs video,.v3d-projimgs canvas{opacity:1 !important;transform:none !important;animation:none !important;transition:none !important}
        @media(max-width:900px){
          .v3d-projtxt h1{font-size:9vw}
          .v3d-projtxt .lede{font-size:4.4vw;max-width:none}
          .v3d-projtxt p{font-size:3.8vw;max-width:none}
          .v3d-ficha{grid-template-columns:1fr 1fr;padding:0 4vw 10vw}
          .v3d-ficha .quem{font-size:3.8vw}
          .v3d-projtxt{padding:10vw 4vw 6vw}
        }
.v3d-logo{display:flex;align-items:baseline;gap:2px}
        .v3d-nav .v3d-logo{display:inline-flex;align-items:center;gap:2px;flex-wrap:nowrap;white-space:nowrap;width:auto}
.v3d-logo img{height:19.4px;width:auto}
        .v3d-foot-logo{display:block;height:19.4px;width:auto}
        .v3d-foot-home{display:block;background:none;border:0;padding:0;margin:0;cursor:pointer;line-height:0}
.v3d-logo sup{font-size:8px;transform:translateY(-4px)}
/* Page name beside the wordmark: home-page behaviour. The label rises 260% inside
   a mask over .8s, and the separator appears through opacity over .6s. */
.v3d-pagename{display:flex;align-items:center}
.v3d-navdash{display:inline-block;width:14px;margin:0 .35em;text-align:center;white-space:nowrap;
  opacity:0;transition:opacity .6s cubic-bezier(.4,.4,.1,1)}
.v3d-nav.named .v3d-navdash{opacity:1}
.v3d-navnamem{display:inline-block;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
.v3d-navname{display:inline-block;transform:translateY(260%);transition:transform .8s cubic-bezier(.075,.82,.165,1)}
.v3d-nav.named .v3d-navname{transform:translateY(0)}
.v3d-tagline{display:flex;flex-direction:column;gap:2px}
.v3d-langs{display:flex;gap:10px;justify-self:start}
.v3d-navend{grid-column:4/5;justify-self:end;position:relative;display:flex;align-items:center}
.v3d-links{display:flex;gap:16px;align-items:baseline}
/* Rolled state, following the v3p pattern: each link rolls inside its own mask with
   a reversed cascade on return, while Menu + rises into their place. */
.v3d-navroll{display:inline-block;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em}
.v3d-navroll>.v3d-rm{transition:transform .64s cubic-bezier(.4,.4,.1,1);transition-delay:calc((4 - var(--i,0)) * .035s)}
.v3d-nav.rolled .v3d-navroll>.v3d-rm{transition-delay:calc(var(--i,0) * .058s)}
.v3d-nav.rolled .v3d-links{pointer-events:none}
.v3d-nav.rolled .v3d-navroll>.v3d-rm{transform:translateY(-135%)}
.v3d-navmenu{position:absolute;right:0;top:50%;overflow:hidden;padding:.32em .06em .44em;margin:-.32em -.06em -.44em;
  transform:translateY(-50%);pointer-events:none}
.v3d-navmenu span{display:block;transform:translateY(130%);transition:transform .55s cubic-bezier(.4,.4,.1,1);transition-delay:.1s}
.v3d-nav.rolled .v3d-navmenu{pointer-events:auto}
.v3d-nav.rolled .v3d-navmenu span{transform:translateY(0)}

@media(min-width:1281px){.v3d-links{width:36vw;justify-content:space-between;gap:0}}

.v3d-count{font-size:9px;vertical-align:super;margin-left:3px;color:${RHONE};display:none}
.v3d-overlay .v3d-count{display:inline}
.v3d-menubtn{display:none}
/* Overlay stays mounted: the panel descends in 1s with staggered links, reversed on close. */
.v3d-overlay{position:fixed;inset:0;z-index:60;background:${ALPIN};display:flex;flex-direction:column;justify-content:space-between;
  padding:16px 4vw 8vw;transform:translateY(-100%);visibility:hidden;
  transition:transform 1s cubic-bezier(.4,.4,.1,1),visibility 0s linear 1s}
.v3d-overlay.open{transform:translateY(0);visibility:visible;transition:transform 1s cubic-bezier(.4,.4,.1,1),visibility 0s}
.v3d-overlay-top{display:flex;justify-content:space-between;align-items:center;height:40px}
.v3d-overlay-links{display:flex;flex-direction:column;gap:2vw}
.v3d-overlay-links .v3d-biglink{font-size:8.5vw;text-transform:uppercase;letter-spacing:-.03em;font-weight:300;line-height:1;
  overflow:hidden;padding:.2em 0 .3em;margin:-.2em 0 -.3em}
.v3d-overlay-links .v3d-biglink i{display:block;font-style:normal;transform:translateY(120%);
  transition:transform .9s cubic-bezier(.4,.4,.1,1);transition-delay:calc((4 - var(--i,0)) * .03s)}
.v3d-overlay.open .v3d-biglink i{transform:translateY(0);transition-delay:calc(var(--i,0) * .05s + .18s)}

.v3d-cursor{pointer-events:none;position:fixed;top:0;left:0;z-index:1000;padding:3px 6px 4px;
  border:1px solid ${NOIR};background:${NOIR};color:${ALPIN};font-size:14px;text-transform:uppercase;
  white-space:nowrap;opacity:0;transition:opacity .3s linear}

/* Pill, FIXED pattern: 12px 26px padding, label at line-height 1 plus translateY(.07em). */
.v3d-btn{display:inline-block;line-height:14px;user-select:none}
.v3d-btn-in{position:relative;display:inline-block}
.v3d-mask{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px 26px;border-radius:999px}
.v3d-mask-hidden{position:relative;visibility:hidden}
.v3d-btn-sizer{display:grid;justify-items:start}
.v3d-btn-sizer>*{grid-area:1/1}
.v3d-mask-bottom{background:${CITRON};color:${NOIR};clip-path:inset(1px 1px 1px 1px round 999px)}
.v3d-mask-top{background:${NOIR};color:${ALPIN};clip-path:inset(0px 0px 0px 0px round 999px);transition:clip-path .6s cubic-bezier(.4,.4,.1,1)}
.v3d-btn:hover .v3d-mask-top{clip-path:inset(4px var(--cut,60%) 4px 4px round 999px)}

.v3d-btn-t{font-size:12px;line-height:1;white-space:nowrap;text-transform:uppercase;letter-spacing:-.01em;display:block;transform:translateY(-.085em)}





.v3d-footer{position:relative;min-height:100vh;margin-top:0;background:${VIOLETTE};color:${NOIR};display:flex;flex-direction:column}
.v3d-footer-nav{height:56px;padding:0 2vw;display:grid;grid-template-columns:1fr 1fr 2fr;align-items:center}
.v3d-footer-menu{display:flex;justify-content:space-between;grid-column:3/4}


.v3d-footer-in{flex:1;display:flex;flex-direction:column;justify-content:center;padding:2.4vw 2vw 0;overflow:hidden}

.v3d-footer-grid{display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:3vw;align-items:start;padding-bottom:4vw}
.v3d-next{grid-column:1/5;grid-row:1;display:flex;flex-direction:column;gap:.5vw;margin-bottom:8vw}
.v3d-next-row{display:flex;align-items:flex-start;cursor:pointer}
.v3d-next-count{margin-top:.45vw;margin-left:.6vw}
.v3d-fcontact{grid-column:1/3;grid-row:2/4}
.v3d-fcontact-h{margin-bottom:2vw;width:76%}
.v3d-fcols{display:contents}
.v3d-fcol{width:22.5vw}
.v3d-fcol-biz{grid-column:5/7;grid-row:2}
.v3d-fcol-jobs{grid-column:7/9;grid-row:2}
.v3d-fcol-hours{grid-column:5/7;grid-row:3}
.v3d-fcol-city{grid-column:7/9;grid-row:3}
.v3d-fcols li{margin-bottom:6px}
.v3d-colh{color:#ffffff;margin-bottom:1vw}
.v3d-nextlbl{color:#ffffff}

.v3d-footer-base{padding:2vw;display:flex;justify-content:space-between;align-items:center;gap:2vw;border-top:1px solid ${LEMAN}}
.v3d-socials{display:flex}
.v3d-socials a{width:10.25vw}
.v3d-legalinks{display:flex;gap:1.2vw;flex-wrap:wrap}
/* Compact footer variant for /contact and /case-studies. */
.v3d-metafoot{border-top:1px solid ${LEMAN};padding:2vw;display:flex;justify-content:space-between;align-items:center;gap:2vw;background:${ALPIN}}

/* CASE STUDY (CaseStudy_ / Overview_ / CaseServiceLists_ / CaseCard_). */
.v3d-csintro{padding-top:6vw;margin-bottom:4vw}
.v3d-cstitle{overflow:hidden;padding:.32em 0 .44em;margin:-.32em 0 -.44em}
.v3d-csgrid{display:grid;margin-top:2vw;grid-template-columns:repeat(4,1fr);column-gap:2vw;row-gap:2vw;align-items:start}
.v3d-csnum{display:flex;justify-content:space-between;align-items:center;overflow:hidden}
.v3d-csdash{overflow:hidden;width:8vw;height:1px;background:${LEMAN}}
.v3d-csdash i{display:block;width:0;height:100%;background:${NOIR};transition:width 1s cubic-bezier(.3,.3,0,1);transition-delay:.3s}
.v3d-io.in .v3d-csdash i{width:100%}
.v3d-cstags{display:flex;flex-direction:column;align-items:flex-start}
.v3d-csyear{justify-self:end}
.v3d-csimg{margin-top:2vw;margin-bottom:2vw;height:45vw;overflow:hidden}
.v3d-csimg img{width:100%;height:100%;object-fit:cover}
.v3d-ov{margin-top:8vw;margin-bottom:8vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:8vw}
.v3d-ov-head{grid-column:1/-1}
.v3d-ov-rec{grid-column:1/4}
.v3d-ov-rech{display:flex;margin-bottom:2vw;align-items:flex-start}
.v3d-ov-count{margin-top:.05vw;margin-left:.3vw;font-size:12px}
.v3d-ov-list li{margin-bottom:.2vw;display:flex;justify-content:space-between;gap:2vw}
.v3d-ov-blocks{grid-column:5/8}
.v3d-ov-block{margin-bottom:4vw}
.v3d-ov-block:last-child{margin-bottom:0}
.v3d-ov-blockh{margin-bottom:2vw}
.v3d-sech{margin-top:8vw;margin-bottom:8vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw}
.v3d-sech>div:first-child{grid-column:1/4}
.v3d-sech>div:last-child{grid-column:5/8}
.v3d-fullimg{margin-top:4vw;margin-bottom:4vw;overflow:hidden}
.v3d-fullimg img{width:100%;height:45vw;object-fit:cover}
.v3d-imgvid{margin-top:2vw;margin-bottom:2vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:2vw}
.v3d-imgvid img{width:100%;height:35.35vw;object-fit:cover}
.v3d-cap{margin-top:1vw;color:${RHONE}}
.v3d-scope{margin-top:8vw;margin-bottom:8vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:2vw;align-items:start}
.v3d-scope-inner{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:4vw;margin-bottom:4vw}
.v3d-pillar{display:flex;flex-direction:column;gap:1vw}
.v3d-pillar li{margin-bottom:.2vw}
.v3d-rel{display:flex;flex-direction:column;align-items:flex-start;gap:2vw;margin-top:4vw;padding-bottom:2vw}
.v3d-relgrid{width:100%;display:grid;grid-template-columns:repeat(4,1fr);column-gap:2vw}
.v3d-card{position:relative;cursor:pointer}
.v3d-card-num{position:absolute;left:-1.6vw;top:0;transform:rotate(-90deg);transform-origin:100% 0;color:${RHONE}}
/* Related project covers share a fixed ratio and fill the frame consistently. */
.v3d-card-img{overflow:hidden;aspect-ratio:16 / 10}
/* Per page editing controls support ordering, media replacement, zoom,
   spacing and deletion. Zoom is a persisted CSS crop, not an AI operation. */
.v3d-pgpage{position:relative}
/* The bar appears only when its page is hovered. With 30+ pages, showing every
   bar at once would cover the entire project. */
.v3d-pgbar{opacity:0;pointer-events:none;transition:opacity .16s ease}
.v3d-pgpage:hover .v3d-pgbar,.v3d-pgbar:focus-within{opacity:1;pointer-events:auto}
.v3d-pgbar{position:absolute;top:12px;left:12px;z-index:9;display:flex;align-items:center;gap:2px;
  background:${NOIR};border:1px solid rgba(255,255,255,.14);padding:3px;
  box-shadow:0 2px 14px rgba(10,10,11,.28)}
.v3d-pgbar-grip{font:600 10px/1 mundial,sans-serif;letter-spacing:.06em;color:${NOIR};background:${CITRON};
  padding:0 8px;height:24px;cursor:grab;display:inline-flex;align-items:center;gap:5px;user-select:none;flex:0 0 auto}
.v3d-pgbar-grip:active{cursor:grabbing}
.v3d-pgbar-ic{font:500 12px/1 mundial,sans-serif;background:transparent;border:0;color:#fff;
  width:26px;height:24px;padding:0;display:inline-flex;align-items:center;justify-content:center;
  cursor:pointer;transition:background .15s,color .15s;flex:0 0 auto}
.v3d-pgbar-ic:hover{background:${CITRON};color:${NOIR}}
.v3d-pgbar-ic:disabled{opacity:.3;cursor:default}
.v3d-pgbar-ic:disabled:hover{background:transparent;color:#fff}
.v3d-pgbar-ic.del:hover{background:#c0392b;color:#fff}
.v3d-pgbar-px{font:600 9px/1 mundial,sans-serif;letter-spacing:.08em;color:${CITRON};padding:0 6px 0 3px;
  text-transform:uppercase;white-space:nowrap;flex:0 0 auto}
.v3d-pgbar-sep{width:1px;height:16px;background:rgba(255,255,255,.16);margin:0 2px;flex:0 0 auto}

.v3d-card-img img,.v3d-card-img video{width:100%;height:100%;object-fit:cover;border-radius:0;transition:border-radius .5s cubic-bezier(.165,.84,.44,1)}
.v3d-card:hover .v3d-card-img img,.v3d-card:hover .v3d-card-img video{border-radius:50%}
.v3d-card-line{width:100%;height:1px;margin-top:1vw;background:${NOIR}}
.v3d-card-info{display:flex;justify-content:space-between;gap:1vw;padding-top:.8vw;margin-bottom:.5vw}

/* ARTICLE (article_ / RichText_ / Quote_ / TextBreak_ / TextPin_). */
.v3d-arthead{padding-top:6vw}
/* Grid areas: ". . . . title title title title" / "subtitle subtitle . . details details . share". */
.v3d-artgrid{display:grid;align-items:start;grid-template-columns:repeat(8,1fr);grid-template-rows:auto auto;column-gap:2vw;row-gap:4vw;margin-bottom:3vw}
.v3d-arttitle{grid-column:5/9;grid-row:1}
.v3d-artsub{grid-column:1/3;grid-row:2;display:flex;flex-direction:column;align-items:flex-start}
.v3d-artdet{grid-column:5/7;grid-row:2}
.v3d-artdet-in{display:flex;flex-wrap:wrap;column-gap:.3vw;margin-bottom:1vw;overflow:hidden}
.v3d-artshare{position:relative;grid-column:8/9;grid-row:2;justify-self:end}
.v3d-artshare-btn{display:flex;align-items:center;column-gap:12px;margin-left:auto}
.v3d-artdrop{position:absolute;top:calc(100% + 12px);right:0;z-index:40;display:flex;flex-direction:column;
  background:${ALPIN};border:1px solid ${LEMAN};border-radius:4px;overflow:hidden;min-width:14vw}
.v3d-artdrop button,.v3d-artdrop a{display:flex;align-items:center;width:100%;column-gap:12px;padding:12px 16px;white-space:nowrap}
.v3d-artdrop button:hover,.v3d-artdrop a:hover{background:${LEMAN}}
.v3d-artimgs{display:grid;grid-template-columns:2fr 1fr;column-gap:2vw;margin-bottom:4vw}
.v3d-artimgs .v3d-artbig{height:45vw;overflow:hidden}
.v3d-artimgs .v3d-artsml{height:45vw;overflow:hidden}
.v3d-artimgs img{width:100%;height:100%;object-fit:cover}
.v3d-rich{margin-top:4vw;margin-bottom:4vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;align-items:start}
.v3d-rich>div:last-child{grid-column:2/3}
.v3d-rich h2{margin-bottom:2vw}
.v3d-quote{margin-top:4vw;margin-bottom:4vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;align-items:start}
.v3d-quote-in{grid-column:2/3;display:flex;flex-direction:column;gap:calc(2vw - 12px);border-left:2px solid ${NOIR};padding-left:2vw}
.v3d-break{margin-top:8vw;margin-bottom:8vw}
.v3d-pin{margin-top:2vw;margin-bottom:8vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;align-items:start}
.v3d-pin-h{width:34.75vw;position:sticky;top:80px}
.v3d-pin-list{display:flex;flex-direction:column;gap:2vw}
.v3d-other{margin-top:9.5vw}
.v3d-other-head{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;margin-bottom:3.2vw;align-items:end}
.v3d-other-head .v3d-btnwrap{justify-self:end}
.v3d-other-grid{position:relative;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw}
.v3d-artblock{display:grid;grid-template-columns:1fr 1fr;column-gap:2vw;padding:2vw 0;position:relative;cursor:pointer}
.v3d-artblock:after{content:"";position:absolute;bottom:0;left:0;right:0;height:1px;background:${LEMAN};opacity:.5}
.v3d-artblock-img{overflow:hidden}
.v3d-artblock-img img{width:100%;height:16vw;object-fit:cover;transition:transform 1.5s cubic-bezier(.075,.82,.165,1)}
.v3d-artblock:hover .v3d-artblock-img img{transform:scale(1.045)}
.v3d-artblock-info{display:flex;flex-direction:column;justify-content:space-between;gap:12px}
.v3d-artblock-meta{display:flex;align-items:baseline}

/* SERVICE SUBPAGE (Hero_ / ServicesList_ / ProcessAccordion_). */
.v3d-hero{padding:6vw 0 4vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:1vw}
.v3d-hero h1{grid-column:1/-1}
.v3d-hero-sub{grid-column:1/3;margin-top:3vw;display:flex;flex-direction:column;align-items:flex-start;gap:2px}
.v3d-hero-desc{grid-column:5/8;margin-top:3vw;display:flex;flex-direction:column;gap:2vw;align-items:flex-start}


.v3d-hero-desc .v3d-p,.v3d-svclist-head .v3d-p,.v3d-proc-head .v3d-p{line-height:1.6;max-width:52ch}
.v3d-herolrg{height:45vw;overflow:hidden;margin-bottom:4vw}
.v3d-herolrg img{width:100%;height:100%;object-fit:cover}
.v3d-svclist{margin-top:8vw;margin-bottom:8vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:2vw;align-items:start}
.v3d-svclist-head{width:34.75vw;display:flex;flex-direction:column;align-items:flex-start;gap:2.6vw}

.v3d-svclist-grid{display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:4vw}
.v3d-svclist-grid li{margin-bottom:.2vw}
.v3d-proc{margin-top:8vw;margin-bottom:8vw;display:grid;grid-template-columns:repeat(2,1fr);column-gap:2vw;row-gap:2vw;align-items:start}
.v3d-proc-head{display:flex;flex-direction:column;width:34.75vw;gap:2.6vw}
.v3d-proc-row{width:100%;padding:1.4vw 0;display:flex;justify-content:space-between;align-items:center;gap:2vw}
.v3d-acc{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .6s cubic-bezier(.165,.84,.44,1),opacity .6s cubic-bezier(.165,.84,.44,1)}
.v3d-acc.open{grid-template-rows:1fr;opacity:1}
.v3d-acc>div{overflow:hidden;min-height:0}
.v3d-acc .v3d-p{padding:0.6vw 0 2.4vw;line-height:1.6;max-width:60ch}
.v3d-rowline{position:relative;height:1px;width:100%;overflow:hidden;background:${LEMAN}}
.v3d-rowline i{position:absolute;inset:0;background:${NOIR};transform:translateX(-101%);transition:transform .6s cubic-bezier(.165,.84,.44,1)}
.v3d-rowline.on i{transform:translateX(0)}
.v3d-relwork{margin-top:8vw;margin-bottom:4vw}
.v3d-relwork-grid{position:relative;display:grid;grid-template-columns:1fr 1fr;margin:0 1vw}
.v3d-work{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:1vw 1vw 0;cursor:pointer}
.v3d-work-visual{position:relative;width:100%;height:34vw;overflow:hidden}
.v3d-work-visual img{width:100%;height:100%;object-fit:cover;transition:transform 1.5s cubic-bezier(.075,.82,.165,1)}
.v3d-work:hover .v3d-work-visual img{transform:scale(1.045)}
.v3d-work-info{display:flex;flex-direction:column;align-items:flex-start;margin-top:1.2vw;margin-bottom:3vw;width:100%}
.v3d-work-title{margin-top:.8vw}
.v3d-work-line{margin-top:3vw;width:100%;overflow:hidden}
.v3d-bordv{position:absolute;left:50%;top:1vw;width:1px;height:0;background:${NOIR};transition:height 6s cubic-bezier(.3,.3,0,1);transition-delay:var(--d,0s)}
.v3d-io.in .v3d-bordv{height:calc(100% - 2vw)}




.v3d-agvidwrap{position:relative;margin:0 2vw;overflow:hidden}
.v3d-agvidload{position:absolute;left:50%;top:50%;width:10vw;height:1px;background:${LEMAN};transform:translate(-50%,-50%);overflow:hidden;z-index:1}
.v3d-agvidload i{position:absolute;inset:0;background:${NOIR};animation:v3dVidLoad 2s linear infinite}
@keyframes v3dVidLoad{0%{transform:translateX(-100%)}50%{transform:translateX(0)}100%{transform:translateX(100%)}}
.v3d-agvid{position:relative;z-index:2;display:block;width:100%;height:45vw;object-fit:cover;
  opacity:0;transform:scale(1.3) rotate(8deg);
  transition:opacity 1s cubic-bezier(.075,0,.165,0),transform 1.5s cubic-bezier(.075,.82,.165,1)}
.v3d-io.in .v3d-agvid{opacity:1;transform:scale(1) rotate(0deg)}
/* SlidePillars: sticky left side with titles in a masked window, rolling counter,
   progress bar, paragraph and pill. Groups enter sideways on the right. */
.v3d-agsp{margin-top:4vw;margin-bottom:4vw;display:flex;align-items:flex-start}
.v3d-agsp-left{position:sticky;top:80px;flex:0 0 50%;padding:0 1vw .8vw 2vw;display:flex;flex-direction:column;align-items:flex-start}




.v3d-agsp-mask{overflow:hidden;height:6.5vw;--step:6.5vw;margin-top:.6vw;margin-bottom:2vw}
.v3d-agsp-stack{display:flex;flex-direction:column;transition:transform .8s cubic-bezier(.075,.82,.165,1)}
.v3d-agsp-stack .v3d-l{height:6.5vw;display:flex;align-items:center}

.v3d-agsp-countwrap{display:flex;align-items:center;margin-bottom:1.6vw}
.v3d-agsp-count{display:flex;align-items:center;justify-content:space-between;width:22.5vw}
.v3d-agsp-total{margin-left:2vw}









.v3d-agsp-digits{display:inline-block;height:1em;overflow:hidden;line-height:1;vertical-align:baseline}
.v3d-agsp-roll{display:block;transition:transform .8s cubic-bezier(.075,.82,.165,1);will-change:transform}
.v3d-agsp-roll span{display:block;height:1em;line-height:1}
.v3d-agsp-prog{flex:none;width:8vw;height:1px;background:${LEMAN};overflow:hidden}
.v3d-agsp-prog i{display:block;height:100%;background:${NOIR};transform:translateX(calc(var(--p,0)*100% - 100%));transition:transform .8s cubic-bezier(.075,.82,.165,1)}
.v3d-agsp-para{margin:0 0 2vw;max-width:34.75vw;line-height:1.6}
.v3d-agsp-right{flex:0 0 50%;border-left:1px solid ${NOIR};padding:0 2vw 0 1vw;overflow:hidden}


.v3d-agsp-item{font-size:2.5vw;line-height:3vw;text-transform:uppercase;letter-spacing:-.03em;font-weight:300;white-space:nowrap;
  transform:translateX(36vw);will-change:transform}
.v3d-agsp-sep{height:1px;background:${NOIR};margin-top:4vw;margin-bottom:4vw;transform:translateX(24vw);will-change:transform}





.v3d-agteam{margin-top:10vw;margin-bottom:10vw;display:grid;grid-template-columns:repeat(4,1fr);column-gap:1.6vw;row-gap:4vw}
.v3d-agteam-head{grid-column:1/-1;display:flex;align-items:flex-start;margin-bottom:2vw}
.v3d-agteam-num{font-size:1.2vw;margin:.6vw 0 0 1vw}
.v3d-agteam-sub{grid-column:1/-1;margin-bottom:2.6vw;max-width:34.75vw;line-height:1.6}
.v3d-agteam-row{display:contents}
.v3d-agcard{border-top:1px solid ${NOIR};padding:1.2vw 0 3vw;display:flex;flex-direction:column;align-items:flex-start}
.v3d-agcard.bot{border-bottom:1px solid ${NOIR}}







.v3d-agcard-info{display:block;max-width:14vw;min-height:2.34em}
.v3d-agcard-info span{display:block}

.v3d-agcard-photo{width:14vw;aspect-ratio:242 / 346;height:auto;overflow:hidden;margin-top:1.2vw;margin-bottom:1.2vw;border-radius:0;transition:border-radius .5s cubic-bezier(.165,.84,.44,1)}
.v3d-agcard:hover .v3d-agcard-photo{border-radius:50%}
.v3d-agcard-photo img{width:100%;height:100%;object-fit:cover;display:block}
.v3d-agcard-name{margin-top:.4vw}

.v3d-agoff{margin-top:8vw;margin-bottom:4vw;display:grid;grid-template-columns:repeat(8,1fr);column-gap:2vw;row-gap:2vw}
.v3d-agoff-h{grid-column:1/-1;display:flex;align-items:flex-start}
.v3d-agoff-sub{grid-column:1/4;max-width:72%}
.v3d-agoff-in{grid-column:5/8;display:flex;flex-direction:column;align-items:flex-start;gap:2vw}
.v3d-agoff-in .v3d-p{line-height:1.6;max-width:52ch}
/* Draggable photo strip. */
.v3d-agstrip{margin-top:8vw;margin-bottom:0;display:flex;gap:2vw;height:24vw;overflow-x:auto;padding:0 2vw;scrollbar-width:none;cursor:grab}
.v3d-agstrip.drag{cursor:grabbing}
.v3d-agstrip::-webkit-scrollbar{display:none}
.v3d-agstrip img{height:100%;width:auto;flex:0 0 auto;object-fit:cover;pointer-events:none;user-select:none}

/* IMMERSIVE CASE STUDY INDEX (CaseOverview_). */
.v3d-co{position:relative;scroll-snap-type:y proximity}
.v3d-coslide{position:relative;min-height:100svh;width:100%;overflow:clip;clip-path:inset(0);scroll-snap-align:start;cursor:pointer}
/* A position:fixed image sits inside a clip-path slide that crops it.
   This creates a "fixed image, moving window" effect without any JavaScript. */
.v3d-coimg{position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover}
.v3d-coveil{position:absolute;inset:0;background:rgba(10,10,11,.25)}
.v3d-cocontent{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:flex-end;padding:0 2vw 2vw;color:${ALPIN}}
.v3d-cobox{width:47vw;display:flex;flex-direction:column;align-items:flex-start;gap:1vw}
.v3d-cotags{display:flex;flex-direction:column;align-items:flex-start}
.v3d-conum{position:fixed;left:2vw;bottom:2vw;z-index:20;color:${ALPIN};mix-blend-mode:difference}

/* LEGAL PAGES (Legal_). */
.v3d-legalhead{margin-top:6vw;padding-bottom:2vw;border-bottom:1px solid ${NOIR}}
.v3d-legalhead h1{margin-bottom:2vw}
.v3d-legalmeta{display:flex;gap:2vw;align-items:baseline;flex-wrap:wrap}
.v3d-legalsec{position:relative;display:flex;align-items:flex-start;justify-content:space-between;
  margin-right:12.25vw;margin-top:2vw;padding:0 2vw;margin-bottom:6vw;gap:2vw}
.v3d-legalnav{position:sticky;top:calc(55px + 2vw)}
.v3d-legallinks{display:flex;align-items:flex-start;flex-direction:column;gap:.4vw}
.v3d-legalbody{display:flex;flex-direction:column;row-gap:2vw;width:34.75vw}
.v3d-legalblock{padding-top:calc(55px + 2vw);margin-top:calc(-55px - 2vw)}
.v3d-legalblock h2{margin-bottom:1vw}
.v3d-legalblock p{margin-bottom:.5vw}

/* ---- 404 (NotFound_) ---- */
.v3d-nf{position:relative;min-height:calc(100vh - 56px);overflow:hidden;display:flex;flex-direction:column;justify-content:center}
/* Grid areas: "Area x4 . . . ." / "Area-2 Area-2 . . Area-3 x4" / "Area-2 Area-2 . . Area-4 x4". */
.v3d-nfgrid{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:auto auto auto;column-gap:2vw;row-gap:2vw;padding-bottom:8vw;align-items:start}
.v3d-nfnext{grid-column:1/5;grid-row:1;margin-bottom:8vw;display:flex;flex-direction:column;gap:1vw;align-items:flex-start}
.v3d-nfcontact{grid-column:1/3;grid-row:2/4}
.v3d-nfcontact-h{margin-bottom:2vw}
.v3d-nfcompany{grid-column:5/9;grid-row:2;display:flex;align-items:flex-start;gap:2vw}
.v3d-nfaddr{grid-column:5/9;grid-row:3;display:flex;align-items:flex-start;gap:2vw}
.v3d-nflist{width:22.5vw;display:flex;flex-direction:column;align-items:flex-start}
.v3d-nflist li{margin-bottom:.2vw}
/* Use min-height instead of height because the row grew from five to eight entries
   with the three legal pages. On a narrow screen, the strip should grow instead of
   letting links overflow. While they fit, the design remains exactly the same. */
.v3d-nfmeta{position:absolute;bottom:0;left:0;right:0;min-height:4vw;display:flex;align-items:center;justify-content:space-between;
  gap:2vw;border-top:1px solid ${LEMAN};white-space:nowrap;padding:0 2vw}
.v3d-nflinks{display:flex;gap:2vw;flex-wrap:wrap}

/* NOTE: the preloader (E6) and transition overlay (E7) live OUTSIDE .v3d-root
   because they mount before or between pages. Their styles therefore live inline
   in those components, avoiding a second copy of this stylesheet in the DOM. */

/* PROJECT LIGHTBOX (F12). */
.v3d-lbveil{position:fixed;inset:0;z-index:1040;background:rgba(10,10,11,.5);opacity:0;transition:opacity 1s cubic-bezier(.4,.4,.1,1)}
.v3d-lbveil.open{opacity:1}
.v3d-lb{position:fixed;top:56px;left:0;right:0;bottom:0;z-index:1050;background:${NOIR};color:${ALPIN};
  border-radius:12px 12px 0 0;overflow:hidden;display:flex;flex-direction:column;
  transform:translateY(100%);transition:transform 1s cubic-bezier(.4,.4,.1,1)}
.v3d-lb.open{transform:translateY(0)}
.v3d-lb-bar{display:flex;align-items:center;justify-content:space-between;gap:2vw;padding:1vw 2vw}
.v3d-lb-prog{flex:1;height:1px;background:rgba(255,255,255,.3);margin:0 2vw;overflow:hidden}
.v3d-lb-prog i{display:block;height:100%;background:${CITRON};transition:width .4s cubic-bezier(.4,.4,.1,1)}
.v3d-lb-track{flex:1;display:flex;gap:2vw;overflow-x:auto;scroll-snap-type:x proximity;padding:0 2vw 2vw;scrollbar-width:none}
.v3d-lb-track::-webkit-scrollbar{display:none}
.v3d-lb-track img{flex:0 0 48vw;width:48vw;height:auto;max-height:78vh;object-fit:cover;scroll-snap-align:center}

/* Responsive rules. */
@media (max-width: 768px){
  .v3d-xl{font-size:11vw;line-height:.9}
  .v3d-l{font-size:9.5vw}
  .v3d-m{font-size:6.9vw;line-height:1.1}
  .v3d-s{font-size:4.4vw;line-height:1}
  .v3d-p{font-size:16px}
  .v3d-margin{margin-left:4vw;margin-right:4vw}
  .v3d-nav{grid-template-columns:1fr auto;padding:0 4vw}


  .v3d-logo{flex:0 0 auto;min-width:0}
  .v3d-logo img{height:17px;width:auto;max-width:none}
  .v3d-tagline,.v3d-langs,.v3d-pagename{display:none}
  /* 481-768 keeps desktop links with tighter typography. The overlay starts only at <=480. */
  .v3d-navend{grid-column:auto}
  .v3d-links{gap:10px;font-size:12px}
  .v3d-ov{grid-template-columns:1fr;row-gap:12vw;margin-top:16vw;margin-bottom:16vw}
  .v3d-ov-rec,.v3d-ov-blocks{grid-column:1/-1}
  .v3d-sech{grid-template-columns:1fr;row-gap:4vw;margin-top:12vw;margin-bottom:12vw}
  .v3d-sech>div:first-child,.v3d-sech>div:last-child{grid-column:1/-1}
  .v3d-fullimg img{height:110vw}
  .v3d-imgvid{grid-template-columns:1fr;row-gap:4vw}
  .v3d-imgvid img{height:69vw}
  .v3d-scope{grid-template-columns:1fr;row-gap:8vw;margin-top:12vw;margin-bottom:12vw}
  .v3d-scope-inner{grid-template-columns:1fr;row-gap:8vw}
  .v3d-relgrid{grid-template-columns:1fr;row-gap:8vw}
  .v3d-card-num{display:none}
  .v3d-arthead{padding-top:24vw}
  .v3d-artgrid{grid-template-columns:1fr;row-gap:3vw}
  .v3d-arttitle,.v3d-artsub,.v3d-artdet,.v3d-artshare{grid-column:1/-1}
  .v3d-artshare{justify-self:start}
  .v3d-artdrop{right:auto;left:0;min-width:60vw}
  .v3d-artimgs{grid-template-columns:1fr;row-gap:4vw}
  .v3d-artimgs .v3d-artbig,.v3d-artimgs .v3d-artsml{height:110vw}
  .v3d-rich,.v3d-quote,.v3d-pin{grid-template-columns:1fr;row-gap:6vw;margin-top:12vw;margin-bottom:12vw}
  .v3d-rich>div:last-child,.v3d-quote-in{grid-column:1/-1}
  .v3d-quote-in{padding-left:4vw;gap:3.2vw}
  .v3d-break{margin-top:12vw;margin-bottom:12vw}
  .v3d-pin-h{width:100%;position:relative;top:0}
  .v3d-other{margin-top:24vw}
  .v3d-other-head,.v3d-other-grid{grid-template-columns:1fr}
  .v3d-other-head{row-gap:4vw}
  .v3d-other-head .v3d-btnwrap{justify-self:start}
  .v3d-artblock{grid-template-columns:1fr;row-gap:6vw;padding:8vw 0}
  .v3d-artblock-img img{height:56vw}
  .v3d-hero{padding:24vw 0 16vw}
  .v3d-hero-sub,.v3d-hero-desc{grid-column:1/-1}
  .v3d-herolrg{height:140vw}
  .v3d-svclist,.v3d-proc{grid-template-columns:1fr;row-gap:10vw;margin-top:20vw;margin-bottom:20vw}
  .v3d-svclist-head,.v3d-proc-head{width:100%}
  .v3d-svclist-grid{grid-template-columns:1fr;row-gap:8vw}
  .v3d-proc-row{padding:6vw 0}
  .v3d-relwork-grid{grid-template-columns:1fr;row-gap:6vw;margin:0 4vw}
  .v3d-bordv{display:none}
  .v3d-work{padding:0}
  .v3d-work-visual{height:64vw}
  .v3d-agvidwrap{margin:0 4vw}
  .v3d-agvid{height:80vw}
  .v3d-agsp{flex-direction:column;margin-top:8vw;margin-bottom:8vw}
  .v3d-agsp-left{position:sticky;top:56px;flex:none;width:100%;background:${TELA};z-index:1;padding:0 4vw 4vw}
  .v3d-agsp-mask{height:12vw;--step:12vw}
  .v3d-agsp-stack .v3d-l{height:12vw;font-size:9vw}
  .v3d-agsp-count{width:44vw}
  .v3d-agsp-prog{width:20vw}
  .v3d-agsp-total{margin-left:4vw}
  .v3d-agsp-para{max-width:100%;margin-bottom:4vw}
  .v3d-agsp-right{flex:none;width:100%;border-left:0;border-top:1px solid ${NOIR};padding:4vw}
  .v3d-agsp-item{font-size:5.6vw;line-height:7.4vw}
  .v3d-agteam{margin-top:20vw;margin-bottom:20vw;display:block}
  .v3d-agteam-head{margin-bottom:6vw}
  .v3d-agteam-sub{margin-bottom:6vw}

  .v3d-agteam-row{display:flex;overflow-x:auto;scrollbar-width:none;gap:4vw;margin-right:-4vw}
  .v3d-agteam-row::-webkit-scrollbar{display:none}
  .v3d-agteam-num{font-size:4vw}
  .v3d-agcard{flex:0 0 80vw;border-bottom:1px solid ${NOIR};padding:4vw 0 8vw}
  .v3d-agcard-info{max-width:60vw;min-height:2.34em}
  .v3d-agcard-photo{width:60vw;height:86vw;aspect-ratio:auto;margin-top:4vw;margin-bottom:4vw}
  .v3d-agcard:hover .v3d-agcard-photo{border-radius:0}
  .v3d-agoff{grid-template-columns:1fr;row-gap:4vw;margin-top:12vw;margin-bottom:12vw}
  .v3d-agoff-h,.v3d-agoff-sub,.v3d-agoff-in{grid-column:1/-1;max-width:100%}
  .v3d-agstrip{height:44vw;padding:0 4vw;gap:4vw}
  .v3d-cobox{width:100%}
  .v3d-legalsec{flex-direction:column;margin-right:0;padding:0;margin-bottom:12vw;gap:6vw}
  .v3d-legalnav{position:relative;top:0;width:100%}
  .v3d-legallinks{flex-direction:row;flex-wrap:nowrap;white-space:nowrap;overflow-x:auto;gap:3vw;scrollbar-width:none}
  .v3d-legallinks::-webkit-scrollbar{display:none}
  .v3d-legalbody{width:100%;row-gap:6vw;border-top:1px solid ${LEMAN};padding-top:8vw}
  .v3d-legalblock{padding-top:calc(55px + 4vw);margin-top:calc(-55px - 4vw)}
  .v3d-nfgrid{grid-template-columns:1fr;row-gap:8vw;padding-top:18vw;padding-bottom:20vw}
  .v3d-nfnext,.v3d-nfcontact,.v3d-nfcompany,.v3d-nfaddr{grid-column:1/-1}
  .v3d-nfcompany,.v3d-nfaddr{flex-direction:column;gap:8vw}
  .v3d-nflist{width:100%}
  .v3d-nfmeta{position:relative;height:auto;flex-wrap:wrap;padding:4vw;row-gap:4vw}
  .v3d-footer-nav{grid-template-columns:1fr;padding:0 4vw}
  .v3d-footer-menu{display:none}
  .v3d-footer{min-height:auto}
  .v3d-footer-in{padding:18vw 4vw 20vw;transform:none;justify-content:flex-start}
  .v3d-footer-grid{grid-template-columns:1fr;padding-bottom:0}
  .v3d-next{grid-column:auto;grid-row:auto;margin-bottom:6vw}
  .v3d-fcontact{grid-column:auto;grid-row:auto}
  .v3d-fcontact-h{width:100%}
  .v3d-fcols{display:grid;grid-template-columns:1fr 1fr;column-gap:2vw;row-gap:2vw;grid-column:auto}
  .v3d-fcol{width:auto;grid-column:auto;grid-row:auto}
  .v3d-socials{gap:1.6vw}
  .v3d-socials a{width:auto}
  .v3d-footer-base,.v3d-metafoot{padding:4vw;flex-wrap:wrap}
  .v3d-lb-track img{flex:0 0 84vw;width:84vw}
}


@media (max-width: 480px){
  .v3d-navend{display:none}
  .v3d-menubtn{display:block;justify-self:end}
  .v3d-overlay-links .v3d-biglink{font-size:13vw}
  .v3d-csintro{padding-top:24vw;margin-bottom:8vw}
  .v3d-csgrid{grid-template-columns:1fr 1fr;row-gap:4vw}
  .v3d-cstags{grid-column:1/-1;margin-top:4vw}
  .v3d-csyear{display:none}
  .v3d-csdash{width:22.5vw}
  .v3d-csimg{height:110vw}
  .v3d-card-img{aspect-ratio:16 / 10}
  .v3d-card-img img{height:100%}
}


@media (min-width: 1441px){
  .v3d-xxs{font-size:.9vw}
  .v3d-xs{font-size:1vw}
}
@media (min-width: 1921px){
  .v3d-xxs{font-size:.6vw}
  .v3d-xs{font-size:.7vw}
  .v3d-s{font-size:1.4vw}
  .v3d-p{font-size:.9vw}
}

/* Reduced motion: everything is visible and nothing animates. */
@media (prefers-reduced-motion: reduce){
  .v3d-root *{transition-duration:.01s !important;animation:none !important}
  .v3d-w,.v3d-rise,.v3d-imgfx,.v3d-fadeup,.v3d-imgup{transform:none !important;opacity:1 !important}
  .v3d-fillw{width:100% !important}
  .v3d-expand{width:100% !important}
  .v3d-bordv{height:calc(100% - 2vw) !important}
  .v3d-csdash i{width:100% !important}
  .v3d-co{scroll-snap-type:none}
}
`;




function useRevealD(a?: unknown, b?: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".v3d-io:not(.in)"));
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".v3d-io").forEach((n) => n.classList.add("in"));
      return;
    }
    const pend = new Set(els);





    const desrecortarNoFim = (el: HTMLElement) => {
      let fim = 1400;
      el.querySelectorAll<HTMLElement>(".v3d-w,.v3d-rise").forEach((n) => {
        const cs = getComputedStyle(n);
        fim = Math.max(fim, ((parseFloat(cs.transitionDuration) || 0) + (parseFloat(cs.transitionDelay) || 0)) * 1000);
      });
      window.setTimeout(() => el.classList.add("unclip"), fim + 120);
    };
    const liga = (el: Element) => {
      el.classList.add("in");
      pend.delete(el as HTMLElement);
      desrecortarNoFim(el as HTMLElement);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) { liga(en.target); io.unobserve(en.target); }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));



    let raf = 0;
    const varre = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of Array.from(pend)) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top < vh * 0.9) { io.unobserve(el); liga(el); }
      }
      if (!pend.size) window.removeEventListener("scroll", aoScroll);
    };
    const aoScroll = () => { if (!raf) raf = window.requestAnimationFrame(varre); };
    window.addEventListener("scroll", aoScroll, { passive: true });

    const jaAVista = window.requestAnimationFrame(varre);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(jaAVista);
      window.removeEventListener("scroll", aoScroll);
      io.disconnect();
    };
  }, [a, b]);
}

function WordsD({ text, base, step }: { text: string[]; base: number; step: number }) {
  return (
    <>
      {text.map((w, i) => (
        <span className="v3d-wm" key={i}>
          <span className="v3d-w" style={{ "--d": `${base + i * step}s` } as React.CSSProperties}>{w}&nbsp;</span>
        </span>
      ))}
    </>
  );
}
function RiseD({ children, d }: { children: React.ReactNode; d: number }) {
  return (
    <span className="v3d-rm"><span className="v3d-rise" style={{ "--d": `${d}s` } as React.CSSProperties}>{children}</span></span>
  );
}
function PillD({ top, reveal, onClick, edTop, edReveal }: { top: string; reveal: string; onClick?: () => void; edTop?: string; edReveal?: string }) {




  const destino = edTop ? edCfg(`${edTop}.href`, "") : "";
  const novaAba = edTop ? edCfg(`${edTop}.hrefNova`, "") === "1" : false;
  const irPara = () => {
    if (!destino) { onClick?.(); return; }
    const externo = /^https?:\/\//i.test(destino);
    if (novaAba || externo) window.open(destino, novaAba ? "_blank" : "_self", "noopener,noreferrer");
    else window.location.assign(destino);
  };






  const medir = (btn: HTMLButtonElement | null) => {
    if (!btn) return;
    const aplica = () => {
      const dot = Math.max(18, btn.offsetHeight - 8);
      btn.style.setProperty("--cut", `${Math.max(0, btn.offsetWidth - dot)}px`);
    };
    aplica();
    if (typeof document !== "undefined" && document.fonts) { void document.fonts.ready.then(aplica).catch(() => {  }); }
  };
  return (
    <button className="v3d-btn" type="button" onClick={irPara} ref={medir}>
      <span className="v3d-btn-in">
        <span className="v3d-mask v3d-mask-bottom"><span className="v3d-btn-t" data-ed={edReveal}>{reveal}</span></span>
        <span className="v3d-mask v3d-mask-top"><span className="v3d-btn-t" data-ed={edTop}>{top}</span></span>
        <span className="v3d-mask v3d-mask-hidden" aria-hidden="true">
          <span className="v3d-btn-sizer">
            <span className="v3d-btn-t">{top}</span>
            <span className="v3d-btn-t">{reveal}</span>
          </span>
        </span>
      </span>
    </button>
  );
}




function RelogioZurich({ lang }: { lang: string }) {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    const tick = () => setHora(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <li className="v3d-xs"><span data-ed="v3.ui.shell.hor3">{edTxt(lang, "v3.ui.shell.hor3", "GMT (+1) -", 160)}</span> {hora}</li>;
}


const TAGLINE: Record<AbilLang, [string, string]> = {
  fr: ["Vraiment", "Habiles."],
  en: ["Truly", "Able."],
  pt: ["Realmente", "Hábeis."],
  de: ["Wirklich", "Fähig."],
  it: ["Davvero", "Abili."],
};


type ShellProps = {
  lang: AbilLang;
  setLang: (l: AbilLang) => void;
  onNav: (p: string) => void;
  active?: string;
  pageName?: string;
  pageEd?: string;
  next?: { label: string; to: string; count?: string };
  footer?: "full" | "meta" | "none";
  children: React.ReactNode;
};
function Shell({ lang, setLang, onNav, active, pageName, pageEd, next, footer = "full", children }: ShellProps) {
  usePublicados();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const footRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [navHidden, setNavHidden] = useState(false);


  const emEdicaoShell = useModoEdicao();
  const [navRolled, setNavRolled] = useState(false);
  const [named, setNamed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);



  useEdicoesSite();
  const t = edUi(lang, "v3.ui.detail", UID[lang]);




  const langForaDoAr = !langLigadaD(lang);
  useEffect(() => { if (langForaDoAr) setLang("fr"); }, [langForaDoAr, lang, setLang]);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 60);
    return () => window.clearTimeout(id);
  }, []);




  useEffect(() => {
    let raf = 0;
    const geo = { footTopo: 0 };
    const measure = () => {
      const fr = footRef.current?.getBoundingClientRect();
      geo.footTopo = fr ? fr.top + window.scrollY : 0;
    };
    const read = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      setNavRolled((prev) => (prev === y > 2 ? prev : y > 2));
      setNamed((prev) => (prev === y > 320 ? prev : y > 320));
      const hide = geo.footTopo > 0 ? geo.footTopo - y <= vh * 0.2 : false;
      setNavHidden((prev) => (prev === hide ? prev : hide));
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
  }, []);



  useEffect(() => {
    const st = document.createElement("style");
    st.textContent = "html,body{scrollbar-width:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}";
    document.head.appendChild(st);
    return () => { st.remove(); };
  }, []);


  useEffect(() => {
    const root = rootRef.current;
    const cur = cursorRef.current;
    if (!root || !cur) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: MouseEvent) => { cur.style.transform = `translate3d(${e.clientX + 18}px,${e.clientY + 18}px,0)`; };
    const over = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-v3hover]");
      const label = el ? el.getAttribute("data-v3hover") || "" : "";
      if (label) { cur.textContent = label; cur.style.opacity = "1"; } else { cur.style.opacity = "0"; }
    };
    const out = (e: MouseEvent) => {
      const el = (e.relatedTarget as Element | null)?.closest?.("[data-v3hover]");
      if (!el) cur.style.opacity = "0";
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




  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const gatilho = menuBtnRef.current;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      gatilho?.focus();
    };
  }, [menuOpen]);

  const go = (p: string) => { setMenuOpen(false); onNav(p); };


  const emailTxt = edTxt(lang, "v3.ui.shell.email", "sam@abil.ch", 160);
  const telTxt = edTxt(lang, "v3.ui.shell.tel", "+41 22 548 00 40", 160);
  const emailHref = edSrc("v3.contact.email.href", `mailto:${emailTxt}`);
  const telHref = edSrc("v3.contact.tel.href", `tel:${telTxt.replace(/[^+\d]/g, "")}`);
  const backToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (


    <div ref={rootRef} className={`v3d-root${ready ? " v3d-ready" : ""}`} data-no-reveal>
      <style>{CSS_V3D}</style>
      {                                                                         }
      <a className="v3d-skip v3d-xs" href="#v3d-main">{t.skipLink}</a>
      <div ref={cursorRef} className="v3d-cursor" aria-hidden="true" />
      <CursorAbil />

      <nav className={`v3d-nav${menuOpen ? " menuaberto" : ""}${navHidden && !menuOpen && !emEdicaoShell ? " hide" : ""}${navRolled && !menuOpen ? " rolled" : ""}${named && pageName ? " named" : ""}`} aria-label={t.navAria}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="v3d-logo" type="button" onClick={() => go("home")} aria-label={t.logoAria}>
            <AbilLogoLoop />
          </button>
          {pageName ? (
            <span className="v3d-pagename v3d-xxs" aria-hidden="true">
              {
                                                                           }
              <span className="v3d-navdash">·</span>
              <span className="v3d-navnamem"><span className="v3d-navname" data-ed={pageEd}>{pageName}</span></span>
            </span>
          ) : null}
        </div>
        <div className="v3d-tagline v3d-xxs">
          {                                                            }
          <RiseD d={0.2}><span data-ed="v3.home.hero.l1">{edTxt(lang, "v3.home.hero.l1", TAGLINE[lang][0], 160)}</span></RiseD>
          <RiseD d={0.3}><span data-ed="v3.home.hero.l2">{edTxt(lang, "v3.home.hero.l2", TAGLINE[lang][1], 160)}</span></RiseD>
        </div>
        <div className="v3d-langs v3d-xxs" aria-label={t.langsAria}>
          {ABIL_LANGS.filter(langLigadaD).map((l, i) => (
            <RiseD d={0.3 + i * 0.05} key={l}>
              <button type="button" className={`v3d-lnk${l === lang ? " on" : ""}`} onClick={() => setLang(l)}>{l}</button>
            </RiseD>
          ))}
        </div>
        {
                                                                      }
        <div className="v3d-navend">
          <div className="v3d-links v3d-xs">
            {NAVD.filter((n) => navVisivelD(n.page)).map((n, i) => (
              <span className="v3d-navroll" key={n.page} style={{ "--i": i } as React.CSSProperties}>
                <RiseD d={0.35 + i * 0.06}>
                  <button type="button" className={`v3d-lnk${n.page === active ? " on" : ""}`} tabIndex={navRolled ? -1 : 0} onClick={() => go(n.page)}>
                    <span data-ed={`v3.ui.nav.${n.page}`}>{edTxt(lang, `v3.ui.nav.${n.page}`, n.label[lang], 160)}</span>
                    {navCountD(n.page) ? <span className="v3d-count">{navCountD(n.page)}</span> : null}
                  </button>
                </RiseD>
              </span>
            ))}
          </div>
          <span className="v3d-navmenu v3d-xs">
            <span><button type="button" className="v3d-lnk" data-ed="v3.ui.nav.menu" tabIndex={navRolled ? 0 : -1} onClick={() => setNavRolled(false)}>{edTxt(lang, "v3.ui.nav.menu", t.menu, 160)}</button></span>
          </span>
        </div>
        <button ref={menuBtnRef} className="v3d-menubtn v3d-xs" type="button" data-ed="v3.ui.nav.menu" onClick={() => setMenuOpen(true)}>{edTxt(lang, "v3.ui.nav.menu", t.menu, 160)}</button>
      </nav>

      {                                                                               }
      <div className={`v3d-overlay${menuOpen ? " open" : ""}`} role="dialog" aria-modal="true" aria-label={t.menuAria} aria-hidden={!menuOpen}>
        <div className="v3d-overlay-top">
          <span className="v3d-xs" data-ed="v3.ui.nav.marque">{edTxt(lang, "v3.ui.nav.marque", "ABiL MEDiAS®", 160)}</span>
          <button ref={closeBtnRef} className="v3d-xs v3d-lnk" type="button" data-ed="v3.ui.nav.fermer" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{edTxt(lang, "v3.ui.nav.fermer", t.fermer, 160)}</button>
        </div>
        <div className="v3d-overlay-links">
          <button type="button" className="v3d-biglink" tabIndex={menuOpen ? 0 : -1} style={{ "--i": 0 } as React.CSSProperties} onClick={() => go("home")}>
            <i data-ed="v3.ui.nav.home">{edTxt(lang, "v3.ui.nav.home", t.accueil, 160)}</i>
          </button>
          {NAVD.filter((n) => navVisivelD(n.page)).map((n, i) => (
            <button key={n.page} type="button" className="v3d-biglink" tabIndex={menuOpen ? 0 : -1}
              style={{ "--i": i + 1 } as React.CSSProperties} onClick={() => go(n.page)}>
              <i><span data-ed={`v3.ui.nav.${n.page}`}>{edTxt(lang, `v3.ui.nav.${n.page}`, n.label[lang], 160)}</span>{navCountD(n.page) ? <span className="v3d-count">{navCountD(n.page)}</span> : null}</i>
            </button>
          ))}
        </div>
        <div className="v3d-langs v3d-xxs" style={{ display: "flex" }}>
          {ABIL_LANGS.filter(langLigadaD).map((l) => (
            <button key={l} type="button" className={`v3d-lnk${l === lang ? " on" : ""}`} tabIndex={menuOpen ? 0 : -1} onClick={() => setLang(l)}>{l}</button>
          ))}
        </div>
      </div>

      <main className="v3d-main" id="v3d-main" tabIndex={-1}>{children}</main>

      {footer === "full" ? (
        <footer className="v3d-footer v3d-io" ref={footRef}>
          <div className="v3d-footer-nav">
            {                                                                       }
            <button type="button" className="v3d-foot-home" onClick={() => go("home")} aria-label={t.logoAria}>
              <img className="v3d-foot-logo" src="/brand/abil-wordmark.svg" alt="ABiL MEDiAS" />
            </button>
            <span />
            <div className="v3d-footer-menu v3d-xs">
              {NAVD.filter((n) => navVisivelD(n.page)).map((n) => (
                <button key={n.page} type="button" className={`v3d-lnk${n.page === active ? " on" : ""}`} data-ed={`v3.ui.nav.${n.page}`} onClick={() => go(n.page)}>{edTxt(lang, `v3.ui.nav.${n.page}`, n.label[lang], 160)}</button>
              ))}
            </div>
          </div>
          <div className="v3d-footer-in">
            <div className="v3d-footer-grid">
              {next ? (
                <div className="v3d-next">
                  <span className="v3d-xs v3d-nextlbl" data-ed="v3.ui.shell.nextPage">{edTxt(lang, "v3.ui.shell.nextPage", t.nextPage, 160)}</span>
                  {                                                           }
                  <button type="button" className="v3d-next-row" onClick={() => go(next.to)}>
                    <span className="v3d-l v3d-lnk v3d-lnk2" data-ed={`v3.ui.nav.${next.to}`}>{edTxt(lang, `v3.ui.nav.${next.to}`, next.label, 160)}</span>
                    {next.count ? <span className="v3d-next-count v3d-s">{next.count}</span> : null}
                  </button>
                </div>
              ) : <div className="v3d-next" />}
              <div className="v3d-fcontact">
                <div className="v3d-fcontact-h v3d-s" data-ed="v3.ui.shell.fcontactH">{edTxt(lang, "v3.ui.shell.fcontactH", t.footerHead, 160)}</div>
                <PillD top={edTxt(lang, "v3.ui.shell.contacter", t.contactTop, 160)} reveal={edTxt(lang, "v3.ui.shell.escreva", t.contactReveal, 160)}
                  edTop="v3.ui.shell.contacter" edReveal="v3.ui.shell.escreva" onClick={() => go("contact")} />
              </div>
              {                                                                                   }
              <div className="v3d-fcols">
                <div className="v3d-fcol v3d-fcol-biz">
                  <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colContacts">{edTxt(lang, "v3.ui.shell.colContacts", t.colBiz, 160)}</div>
                  <ul>
                    <li><a className="v3d-xs v3d-lnk" data-ed="v3.ui.shell.email" href={emailHref}>{emailTxt}</a></li>
                    <li><a className="v3d-xs v3d-lnk" data-ed="v3.ui.shell.tel" href={telHref}>{telTxt}</a></li>
                  </ul>
                </div>
                <div className="v3d-fcol v3d-fcol-jobs">
                  <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colCandid">{edTxt(lang, "v3.ui.shell.colCandid", t.colJobs, 160)}</div>
                  <ul><li><a className="v3d-xs v3d-lnk" data-ed="v3.ui.shell.email" href={emailHref}>{emailTxt}</a></li></ul>
                </div>
                <div className="v3d-fcol v3d-fcol-city">
                  <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colVille">{edTxt(lang, "v3.ui.shell.colVille", t.colCity, 160)}</div>
                  <ul>
                    <li className="v3d-xs" data-ed="v3.ui.shell.adr1">{edTxt(lang, "v3.ui.shell.adr1", "Rue de Berne 59", 160)}</li>
                    <li className="v3d-xs" data-ed="v3.ui.shell.adr2">{edTxt(lang, "v3.ui.shell.adr2", "1201 Genève", 160)}</li>
                    <li className="v3d-xs" data-ed="v3.ui.shell.adr3">{edTxt(lang, "v3.ui.shell.adr3", t.country, 160)}</li>
                  </ul>
                </div>
                <div className="v3d-fcol v3d-fcol-hours">
                  <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colHoraires">{edTxt(lang, "v3.ui.shell.colHoraires", t.colHours, 160)}</div>
                  <ul>
                    <li className="v3d-xs" data-ed="v3.ui.shell.hor1">{edTxt(lang, "v3.ui.shell.hor1", t.hoursDays, 160)}</li>
                    <li className="v3d-xs" data-ed="v3.ui.shell.hor2">{edTxt(lang, "v3.ui.shell.hor2", "08:00 - 18:00", 160)}</li>
                    {                                                   }
                    <RelogioZurich lang={lang} />
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="v3d-footer-base v3d-xs">
            <span data-ed="v3.ui.shell.copy">{edTxt(lang, "v3.ui.shell.copy", "ABiL MEDiAS® ©2026", 160)}</span>
            {                                                                               }
            <div className="v3d-legalinks v3d-xs">
              <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkCases" onClick={() => go("etudes")}>{edTxt(lang, "v3.ui.shell.lnkCases", t.etudesLink, 160)}</button>
              <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkPrivacy" onClick={() => go("confidentialite")}>{edTxt(lang, "v3.ui.shell.lnkPrivacy", t.privacyLink, 160)}</button>
              <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkTerms" onClick={() => go("conditions")}>{edTxt(lang, "v3.ui.shell.lnkTerms", t.termsLink, 160)}</button>
            </div>
            <div className="v3d-socials">
              {SOCIALS.map((s) => (
                <a key={s.name} className="v3d-lnk v3d-grey" data-ed={`v3.ui.shell.${s.ed}`} href={s.href} target="_blank" rel="noreferrer noopener">{edTxt(lang, `v3.ui.shell.${s.ed}`, s.name, 160)}</a>
              ))}
            </div>
            <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkTop" onClick={backToTop}>{edTxt(lang, "v3.ui.shell.lnkTop", t.backTop, 160)}</button>
          </div>
        </footer>
      ) : null}

      {footer === "meta" ? (
        <div className="v3d-metafoot v3d-xs" ref={(el) => { footRef.current = el; }}>
          <span data-ed="v3.ui.shell.copy">{edTxt(lang, "v3.ui.shell.copy", "ABiL MEDiAS® ©2026", 160)}</span>
          {                                                                                   }
          <div className="v3d-legalinks v3d-xs">
            <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkCases" onClick={() => go("etudes")}>{edTxt(lang, "v3.ui.shell.lnkCases", t.etudesLink, 160)}</button>
            <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkPrivacy" onClick={() => go("confidentialite")}>{edTxt(lang, "v3.ui.shell.lnkPrivacy", t.privacyLink, 160)}</button>
            <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkTerms" onClick={() => go("conditions")}>{edTxt(lang, "v3.ui.shell.lnkTerms", t.termsLink, 160)}</button>
            {

                                                                                   }
            {navVisivelD("contact") ? (
              <button type="button" className="v3d-lnk" data-ed="v3.ui.nav.contact" onClick={() => go("contact")}>{edTxt(lang, "v3.ui.nav.contact", navLabelD("contact", lang), 160)}</button>
            ) : null}
          </div>
          <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkTop" onClick={backToTop}>{edTxt(lang, "v3.ui.shell.lnkTop", t.backTop, 160)}</button>
        </div>
      ) : null}

      {


                                                                               }
      <EditLayerV3 lang={lang} />
    </div>
  );
}




export function AbilV3NotFound({ lang, setLang, onNav }: {
  lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void;
}) {
  useEdicoesSite();
  const t = edUi(lang, "v3.ui.detail", UID[lang]);
  useRevealD("404");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  const emailTxt = edTxt(lang, "v3.ui.shell.email", "sam@abil.ch", 160);
  const telTxt = edTxt(lang, "v3.ui.shell.tel", "+41 22 548 00 40", 160);
  const emailHref = edSrc("v3.contact.email.href", `mailto:${emailTxt}`);
  const telHref = edSrc("v3.contact.tel.href", `tel:${telTxt.replace(/[^+\d]/g, "")}`);
  return (
    <Shell lang={lang} setLang={setLang} onNav={onNav} footer="none" pageName="404">
      <section className="v3d-nf v3d-margin v3d-io">
        <div className="v3d-nfgrid">
          <div className="v3d-nfnext">
            <span className="v3d-xs v3d-grey">404</span>
            <h1 className="v3d-l" data-ed="v3.ui.detail.nfTitle"><WordsD text={t.nfTitle.split(" ")} base={0.1} step={0.06} /></h1>
            <p className="v3d-p v3d-fadeup" data-ed="v3.ui.detail.nfText" style={{ "--d": ".3s", maxWidth: "34.75vw" } as React.CSSProperties}>{t.nfText}</p>
            <div className="v3d-fadeup" style={{ "--d": ".4s" } as React.CSSProperties}>
              <PillD top={t.nfBackTop} reveal={t.nfBackReveal} edTop="v3.ui.detail.nfBackTop" edReveal="v3.ui.detail.nfBackReveal" onClick={() => onNav("home")} />
            </div>
          </div>
          <div className="v3d-nfcontact">
            <div className="v3d-nfcontact-h v3d-s" data-ed="v3.ui.shell.fcontactH">{edTxt(lang, "v3.ui.shell.fcontactH", t.footerHead, 160)}</div>
            <PillD top={edTxt(lang, "v3.ui.shell.contacter", t.contactTop, 160)} reveal={edTxt(lang, "v3.ui.shell.escreva", t.contactReveal, 160)}
              edTop="v3.ui.shell.contacter" edReveal="v3.ui.shell.escreva" onClick={() => onNav("contact")} />
          </div>
          <div className="v3d-nfcompany">
            <div className="v3d-nflist">
              <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colContacts">{edTxt(lang, "v3.ui.shell.colContacts", t.colBiz, 160)}</div>
              <ul>
                <li><a className="v3d-xs v3d-lnk" data-ed="v3.ui.shell.email" href={emailHref}>{emailTxt}</a></li>
                <li><a className="v3d-xs v3d-lnk" data-ed="v3.ui.shell.tel" href={telHref}>{telTxt}</a></li>
              </ul>
            </div>
            <div className="v3d-nflist">
              <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colCandid">{edTxt(lang, "v3.ui.shell.colCandid", t.colJobs, 160)}</div>
              <ul><li><a className="v3d-xs v3d-lnk" data-ed="v3.ui.shell.email" href={emailHref}>{emailTxt}</a></li></ul>
            </div>
          </div>
          <div className="v3d-nfaddr">
            <div className="v3d-nflist">
              <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colVille">{edTxt(lang, "v3.ui.shell.colVille", t.colCity, 160)}</div>
              <ul>
                <li className="v3d-xs" data-ed="v3.ui.shell.adr1">{edTxt(lang, "v3.ui.shell.adr1", "Rue de Berne 59", 160)}</li>
                <li className="v3d-xs" data-ed="v3.ui.shell.adr2">{edTxt(lang, "v3.ui.shell.adr2", "1201 Genève", 160)}</li>
                <li className="v3d-xs" data-ed="v3.ui.shell.adr3">{edTxt(lang, "v3.ui.shell.adr3", t.country, 160)}</li>
              </ul>
            </div>
            <div className="v3d-nflist">
              <div className="v3d-colh v3d-xxs" data-ed="v3.ui.shell.colHoraires">{edTxt(lang, "v3.ui.shell.colHoraires", t.colHours, 160)}</div>
              <ul>
                <li className="v3d-xs" data-ed="v3.ui.shell.hor1">{edTxt(lang, "v3.ui.shell.hor1", t.hoursDays, 160)}</li>
                <li className="v3d-xs" data-ed="v3.ui.shell.hor2">{edTxt(lang, "v3.ui.shell.hor2", "08:00 - 18:00", 160)}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="v3d-nfmeta v3d-xxs">
          <span data-ed="v3.ui.shell.copy">{edTxt(lang, "v3.ui.shell.copy", "ABiL MEDiAS® ©2026", 160)}</span>
          <div className="v3d-nflinks">
            {NAVD.filter((n) => navVisivelD(n.page)).map((n) => (
              <button key={n.page} type="button" className="v3d-lnk" data-ed={`v3.ui.nav.${n.page}`} onClick={() => onNav(n.page)}>{edTxt(lang, `v3.ui.nav.${n.page}`, n.label[lang], 160)}</button>
            ))}
            {                                                                             }
            <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkCases" onClick={() => onNav("etudes")}>{edTxt(lang, "v3.ui.shell.lnkCases", t.etudesLink, 160)}</button>
            <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkPrivacy" onClick={() => onNav("confidentialite")}>{edTxt(lang, "v3.ui.shell.lnkPrivacy", t.privacyLink, 160)}</button>
            <button type="button" className="v3d-lnk" data-ed="v3.ui.shell.lnkTerms" onClick={() => onNav("conditions")}>{edTxt(lang, "v3.ui.shell.lnkTerms", t.termsLink, 160)}</button>
          </div>
          <button type="button" className="v3d-lnk" data-ed="v3.ui.detail.nfBackHome" onClick={() => onNav("home")}>{t.nfBackHome}</button>
        </div>
      </section>
    </Shell>
  );
}






export function AbilV3Lightbox({ title, images, open, onClose, lang, start = 0 }: {
  title: string; images: string[]; open: boolean; onClose: () => void; lang: AbilLang; start?: number;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [idx, setIdx] = useState(start);
  const t = edUi(lang, "v3.ui.detail", UID[lang]);





  useEffect(() => {
    if (!open) return;
    const gatilho = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const painel = panelRef.current;
      if (!painel) return;
      const alvos = Array.from(
        painel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (!alvos.length) return;
      const primeiro = alvos[0];
      const ultimo = alvos[alvos.length - 1];
      const atual = document.activeElement;
      if (e.shiftKey && (atual === primeiro || !painel.contains(atual))) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (atual === ultimo || !painel.contains(atual))) { e.preventDefault(); primeiro.focus(); }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      gatilho?.focus?.();
    };
  }, [open, onClose]);




  useEffect(() => {
    if (!open) return;
    trackRef.current
      ?.querySelector<HTMLElement>(`[data-slide="${start}"]`)
      ?.scrollIntoView({ behavior: "auto", inline: "start", block: "nearest" });
  }, [open, start]);

  useEffect(() => {
    const track = trackRef.current;
    if (!open || !track || !("IntersectionObserver" in window)) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) setIdx(Number(en.target.getAttribute("data-slide")) || 0);
      }
    }, { root: track, threshold: 0.6 });
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [open, images.length]);

  if (!open) return null;
  const pct = images.length ? Math.round(((idx + 1) / images.length) * 100) : 0;
  return (
    <>
      <div className="v3d-lbveil open" onClick={onClose} aria-hidden="true" />
      <div className="v3d-lb open" role="dialog" aria-label={t.lbAria} aria-modal="true" ref={panelRef}>
        <div className="v3d-lb-bar v3d-xs">
          <span>{title}</span>
          <span className="v3d-lb-prog"><i style={{ width: `${pct}%` }} /></span>
          <span>{pad2(idx + 1)} / {pad2(images.length)}</span>
          <button ref={closeBtnRef} type="button" className="v3d-lnk" data-ed="v3.ui.detail.lbClose" onClick={onClose}>{t.lbClose}</button>
        </div>
        {
                                                                                }
        <div className="v3d-lb-track" ref={trackRef} tabIndex={0} aria-label={title}>
          {images.map((src, i) => (
            <MediaCapa key={src + i} ed={undefined} src={src} alt={`${title} ${i + 1}`} eager={i === 0} />
          ))}
        </div>
      </div>
    </>
  );
}








function aoMontarAutoplay(el: HTMLVideoElement | null) {
  if (!el || (el as any).__vobs) return;
  (el as any).__vobs = true;
  el.muted = true;
  if (typeof IntersectionObserver === "undefined") { void el.play().catch(() => {  }); return; }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const v = en.target as HTMLVideoElement;
      if (en.isIntersecting) {
        if (v.preload !== "auto") v.preload = "auto";
        void v.play().catch(() => {  });
      } else if (!v.paused) {
        v.pause();
      }
    }
  }, { rootMargin: "200px 0px", threshold: 0.1 });
  io.observe(el);
}

function VideoPagina({ src, chave, alt, lang }: { src: string; chave: string; alt: string; lang: AbilLang }) {
  const comPlay = edCfg(`${chave}.play`, "") === "1";
  const poster = edCfg(`${chave}.poster`, "") || undefined;
  const ref = useRef<HTMLVideoElement | null>(null);
  const [aTocar, setATocar] = useState(false);
  const estilo: React.CSSProperties = { width: "100%", height: "auto", display: "block" };
  if (!comPlay) {





    return <video ref={aoMontarAutoplay} data-ed={chave} src={src} poster={poster} muted loop playsInline
      preload="none" aria-label={alt} style={estilo} />;
  }
  return (
    <span style={{ position: "relative", display: "block" }}>
      <video ref={ref} data-ed={chave} src={src} poster={poster} loop playsInline preload="metadata" aria-label={alt} style={estilo}
        onPlay={() => setATocar(true)} onPause={() => setATocar(false)} />
      {!aTocar && (
        <button type="button" aria-label={lang === "it" ? "Riproduci" : "Play"}
          onClick={(e) => { e.stopPropagation(); const v = ref.current; if (v) { v.muted = false; void v.play(); } }}
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 84, height: 84, borderRadius: 999, border: 0, cursor: "pointer", background: CITRON, color: NOIR, font: "600 13px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".06em" }}>
          {lang === "it" ? "Riproduci" : "Play"}
        </button>
      )}
    </span>
  );
}




let motorPdf: Promise<{
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (o: { data: Uint8Array }) => { promise: Promise<{ getPage: (n: number) => Promise<{
    getViewport: (o: { scale: number }) => { width: number; height: number };
    render: (o: unknown) => { promise: Promise<void> };
  }> }> };
}> | null = null;
function carregarMotorPdf() {
  if (!motorPdf) {
    motorPdf = import("pdfjs-dist").then((m) => {
      const mod = m as unknown as { GlobalWorkerOptions: { workerSrc: string } };
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return m as never;
    });
  }
  return motorPdf;
}
let aDesenhar = 0;
const fila: (() => void)[] = [];
function pedirVez(): Promise<void> {
  return new Promise((res) => {
    const tentar = () => { if (aDesenhar < 2) { aDesenhar += 1; res(); } else { fila.push(tentar); } };
    tentar();
  });
}
function largarVez() { aDesenhar = Math.max(0, aDesenhar - 1); const p = fila.shift(); if (p) p(); }










function ImagemPagina({ chave, src, alt, eager }: { chave: string; src: string; alt: string; eager: boolean }) {
  const exp = parseInt(edCfg(`${chave}.exp`, "0"), 10) || 0;
  const [ar, setAr] = useState<number | null>(null);
  const base: React.CSSProperties = { display: "block", width: "100%", height: "auto" };
  if (!exp || !ar) {
    return <img data-ed={chave} src={src} alt={alt} loading={eager ? "eager" : "lazy"} style={base}
      onLoad={(e) => { const im = e.currentTarget; if (im.naturalWidth && im.naturalHeight) setAr(im.naturalWidth / im.naturalHeight); }} />;
  }
  return (
    <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: String(ar), overflow: "hidden" }}>
      <img data-ed={chave} src={src} alt={alt} loading={eager ? "eager" : "lazy"}
        style={{ position: "absolute", top: -exp, left: -exp, width: `calc(100% + ${2 * exp}px)`, height: `calc(100% + ${2 * exp}px)`, objectFit: "cover" }} />
    </span>
  );
}






const INSERIR_LBL: L5 = { fr: "Ajouter une page ici", en: "Add page here", pt: "Adicionar página aqui", de: "Seite hier hinzufügen", it: "Aggiungi pagina qui" };
function InserirAqui({ lang, aoEscolher }: { lang: AbilLang; aoEscolher: (f: File) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <label
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={INSERIR_LBL[lang]}
      style={{
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", cursor: "pointer", overflow: "hidden", transition: "height .18s ease, background .18s ease",
        height: hover ? 46 : 12,
        background: hover ? "rgba(210,255,1,.14)" : "transparent",
        borderTop: hover ? `2px dashed ${CITRON}` : "2px dashed transparent",
        borderBottom: hover ? `2px dashed ${CITRON}` : "2px dashed transparent",
      }}>
      {hover ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: NOIR,
          font: "600 10px/1 mundial, sans-serif", textTransform: "uppercase", letterSpacing: ".14em" }}>
          + {INSERIR_LBL[lang]}
        </span>
      ) : null}
      <input type="file" accept="image/*,video/*,application/pdf" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) aoEscolher(f); e.currentTarget.value = ""; }} />
    </label>
  );
}

function BarraPagina({ chave, slug, indice, total, gap, setGap, lang }: {
  chave: string; slug: string; indice: number; total: number; gap: number; setGap: (v: number) => void; lang: AbilLang;
}) {
  const exp = parseInt(edCfg(`${chave}.exp`, "0"), 10) || 0;
  const mudarExp = (v: number) => {
    const n = Math.max(0, Math.min(80, v));
    gravarEdicaoLocal({ [`${chave}.exp`]: String(n) });
  };
  const trocar = () => {

    try { window.dispatchEvent(new CustomEvent("abil:trocar-media", { detail: { path: chave } })); } catch { /* noop */ }
  };


  const gerarIa = () => {
    try { window.dispatchEvent(new CustomEvent("abil:trocar-media", { detail: { path: chave, ia: true } })); } catch {  }
  };


  const apagar = () => {
    if (!window.confirm(lang === "it" ? "Rimuovere questa pagina dal progetto?" : "Remover esta página do projeto?")) return;
    const ordem = ordemDaGaleria(slug, total).filter((b) => b !== indice);
    gravarEdicaoLocal({ [`v3.work.${slug}.order`]: ordem.join(",") });
    void publicarEdicoesNuvem();
  };
  const mover = (delta: number) => {
    const ordem = ordemDaGaleria(slug, total);
    const de = ordem.indexOf(indice);
    const para = de + delta;
    if (de < 0 || para < 0 || para >= ordem.length) return;
    const nova = ordem.slice();
    nova.splice(para, 0, nova.splice(de, 1)[0]);
    gravarEdicaoLocal({ [`v3.work.${slug}.order`]: nova.join(",") });
  };
  return (
    <div className="v3d-pgbar" onClick={(e) => e.stopPropagation()}>
      <span className="v3d-pgbar-grip" title={lang === "it" ? "Posizione di questa pagina nel progetto" : "Posição desta página no projeto"}>{indice + 1}/{total}</span>
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Sposta su di una posizione" : "Subir uma posição"} onClick={() => mover(-1)} disabled={indice === 0}>↑</button>
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Sposta giù di una posizione" : "Descer uma posição"} onClick={() => mover(1)} disabled={indice === total - 1}>↓</button>
      <span className="v3d-pgbar-sep" />
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Sostituisci media (computer · libreria)" : "Trocar media (computador · biblioteca)"} onClick={trocar}>⇄</button>
      <span className="v3d-pgbar-sep" />
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Espansione: nasconde il bordo bianco (+1px)" : "Expansão: esconde o filete branco da borda (+1px)"} onClick={() => mudarExp(exp + 1)}>＋</button>
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Riduci espansione" : "Menos expansão"} onClick={() => mudarExp(exp - 1)} disabled={exp === 0}>−</button>
      {exp > 0 ? <span className="v3d-pgbar-px">{exp}px</span> : null}
      <span className="v3d-pgbar-sep" />
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Aumenta la distanza tra le pagine" : "Aumentar distância entre páginas"} onClick={() => setGap(Math.min(96, gap + 8))}>↕</button>
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Riduci la distanza tra le pagine" : "Diminuir distância entre páginas"} onClick={() => setGap(Math.max(0, gap - 8))} disabled={gap === 0}>↥</button>
      {gap > 0 ? <span className="v3d-pgbar-px">{gap}px</span> : null}
      <span className="v3d-pgbar-sep" />
      <button type="button" className="v3d-pgbar-ic" title={lang === "it" ? "Genera immagine con l'IA" : "Gerar imagem com IA"} onClick={gerarIa}>✦</button>
      <button type="button" className="v3d-pgbar-ic del" title={lang === "it" ? "Rimuovi questa pagina dal progetto" : "Remover esta página do projeto"} onClick={apagar}>🗑</button>
    </div>
  );
}

function PaginaPdf({ src, poster, alt, chave, lang }: { src: string; poster?: string; alt: string; chave?: string; lang: AbilLang }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const jaComecou = useRef(false);
  const [falhou, setFalhou] = useState("");
  useEffect(() => {
    jaComecou.current = false;
    setFalhou("");
    const cv = ref.current;
    if (!cv) return;
    let ativo = true;
    const desenhar = async () => {
      if (jaComecou.current) return;
      jaComecou.current = true;
      await pedirVez();
      try {
        const limite = <T,>(p: Promise<T>, ms: number, oQue: string): Promise<T> =>
          Promise.race([p, new Promise<T>((_, rej) => window.setTimeout(() => rej(new Error(`${oQue}: ${lang === "it" ? "tempo scaduto" : "demorou demais"}`)), ms))]);
        const pdfjs = await carregarMotorPdf();




        let bytes: Uint8Array;
        if (src.startsWith("data:")) {
          const b64 = src.slice(src.indexOf(",") + 1);
          const bin = atob(b64);
          bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        } else {
          const carregar = lang === "it" ? "scaricare" : "descarregar";
          const resp = await limite(fetch(src, { cache: "force-cache" }), 30000, carregar);
          if (!resp.ok) throw new Error(`${carregar}: ${resp.status}`);
          bytes = new Uint8Array(await resp.arrayBuffer());
        }
        const doc = await limite(pdfjs.getDocument({ data: bytes }).promise, 40000, lang === "it" ? "aprire" : "abrir");
        const pag = await limite(doc.getPage(1), 20000, lang === "it" ? "pagina" : "pagina");
        const base = pag.getViewport({ scale: 1 });


        const larguraCss = Math.max(900, cv.parentElement?.clientWidth || 1200);
        const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
        const vp = pag.getViewport({ scale: (larguraCss * dpr) / base.width });
        cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
        const ctx = cv.getContext("2d");
        if (!ctx) throw new Error(lang === "it" ? "contesto non disponibile" : "sem contexto");
        await limite(pag.render({ canvas: cv, canvasContext: ctx, viewport: vp } as never).promise, 40000, lang === "it" ? "renderizzare" : "desenhar");
      } catch (e) {
        if (ativo) setFalhou(String((e as Error)?.message || e).slice(0, 120));
      } finally { largarVez(); }
    };
    const io = new IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) { io.disconnect(); void desenhar(); }
    }, { rootMargin: "1200px 0px" });
    io.observe(cv);
    return () => { ativo = false; io.disconnect(); };
  }, [src, lang]);
  if (falhou) {
    return (
      <span style={{ display: "block", padding: "18px 20px", background: "#f2f2f2", color: "#555", font: "12px/1.4 mundial, sans-serif" }}>
        {alt}: <a href={src} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>{lang === "it" ? "apri il PDF" : "abrir o PDF"}</a> <span data-erro-pdf>{falhou}</span>
      </span>
    );
  }
  return (
    <span style={{ position: "relative", display: "block", background: poster ? undefined : "#f2f2f2" }}>
      {

                                                     }
      {poster ? <img data-ed={chave} src={poster} alt="" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block" }} /> : null}
      <canvas ref={ref} aria-label={alt}
        style={poster
          ? { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }
          : { width: "100%", height: "auto", display: "block", minHeight: 220 }} />
    </span>
  );
}





const ORGD_LBL: Record<"btn" | "hint" | "dist" | "save" | "cancel" | "okCloud" | "soLocal", L5> = {
  btn: { fr: "Organiser les pages", en: "Organize pages", pt: "Organizar páginas", de: "Seiten ordnen", it: "Organizza le pagine" },
  hint: { fr: "Glissez pour réordonner", en: "Drag to reorder", pt: "Arraste para reordenar", de: "Zum Ordnen ziehen", it: "Trascina per riordinare" },
  dist: { fr: "Distance entre pages", en: "Distance between pages", pt: "Distância entre páginas", de: "Abstand zwischen Seiten", it: "Distanza tra le pagine" },
  save: { fr: "Enregistrer", en: "Save", pt: "Guardar", de: "Speichern", it: "Salva" },
  cancel: { fr: "Annuler", en: "Cancel", pt: "Cancelar", de: "Abbrechen", it: "Annulla" },
  okCloud: { fr: "Publié en ligne", en: "Published live", pt: "Publicado na nuvem", de: "Online veröffentlicht", it: "Pubblicato online" },
  soLocal: { fr: "Enregistré seulement dans ce navigateur", en: "Saved only in this browser", pt: "Gravado só neste browser", de: "Nur in diesem Browser gespeichert", it: "Salvato solo in questo browser" },
};
const ORGD_CAPSULA: React.CSSProperties = {
  background: CITRON, color: NOIR, border: 0, borderRadius: 999,
  padding: "10px 22px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em",
  lineHeight: 1, cursor: "pointer",
};
const ORGD_QUAD: React.CSSProperties = {
  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
  padding: 0, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.55)",
  fontSize: 13, lineHeight: 1, cursor: "pointer",
};



function ordemDaGaleria(slug: string, total: number): number[] {
  const guardada = edCfg(`v3.work.${slug}.order`, "")
    .split(",").map((x) => parseInt(x.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < total);
  const vistos = new Set<number>();
  const fora: number[] = [];
  guardada.forEach((n) => { if (!vistos.has(n)) { vistos.add(n); fora.push(n); } });
  for (let i = 0; i < total; i += 1) if (!vistos.has(i)) fora.push(i);
  return fora;
}
function gapDaGaleria(slug: string): number {
  const n = parseInt(edCfg(`v3.work.${slug}.gap`, "0"), 10);
  return Math.max(0, Math.min(96, Number.isFinite(n) ? n : 0));
}

const MINI_ORG_ESTILO: React.CSSProperties = { width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", pointerEvents: "none" };



function MiniPdf({ indice }: { src: string; indice: number }) {
  return (
    <div style={{ ...MINI_ORG_ESTILO, background: TELA, border: `1px solid ${NOIR}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, letterSpacing: ".08em", color: NOIR, pointerEvents: "none" }}>
      PDF · {indice + 1}
    </div>
  );
}

function OrganizarGaleriaD({ lang, slug, pares }: {
  lang: AbilLang; slug: string; pares: { base: number; src: string; tipo: "image" | "video" | "pdf"; poster?: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [ordem, setOrdem] = useState<{ base: number; src: string; tipo: "image" | "video" | "pdf"; poster?: string }[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const avisoTid = useRef(0);
  const pubTid = useRef(0);
  const gap = gapDaGaleria(slug);

  useEffect(() => {
    if (!aberto) return;
    try { window.dispatchEvent(new CustomEvent("abil:lenis", { detail: { pause: true } })); } catch {  }
    return () => { try { window.dispatchEvent(new CustomEvent("abil:lenis", { detail: { pause: false } })); } catch {  } };
  }, [aberto]);
  useEffect(() => () => { window.clearTimeout(avisoTid.current); window.clearTimeout(pubTid.current); }, []);
  const mostrarAviso = (msg: string) => {
    setAviso(msg);
    window.clearTimeout(avisoTid.current);
    avisoTid.current = window.setTimeout(() => setAviso(null), 3000);
  };
  const publicar = () => { void publicarEdicoesNuvem().then((ok) => mostrarAviso(ok ? ORGD_LBL.okCloud[lang] : ORGD_LBL.soLocal[lang])); };

  const publicarTarde = () => { window.clearTimeout(pubTid.current); pubTid.current = window.setTimeout(publicar, 800); };
  const mudarGap = (v: number) => {
    const val = Math.max(0, Math.min(96, Math.round(v)));
    gravarEdicaoLocal({ [`v3.work.${slug}.gap`]: String(val) });
    publicarTarde();
  };
  const abrir = () => { setOrdem(pares.slice()); setDragIdx(null); setOverIdx(null); setAberto(true); };
  const largar = (alvo: number) => {
    if (dragIdx !== null && dragIdx !== alvo) {
      setOrdem((prev) => { const arr = [...prev]; const [mov] = arr.splice(dragIdx, 1); arr.splice(alvo, 0, mov); return arr; });
    }
    setDragIdx(null); setOverIdx(null);
  };
  const guardar = () => {

    gravarEdicaoLocal({ [`v3.work.${slug}.order`]: ordem.map((o) => o.base).join(",") });
    setAberto(false);
    publicar();
  };
  return (
    <>
      {

                                                           }
      <div style={{ position: "sticky", top: 56, zIndex: 3009, background: NOIR, color: "#fff", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "12px 16px", marginBottom: "1.2vw" }}>
        <button type="button" style={ORGD_CAPSULA} onClick={abrir}>{ORGD_LBL.btn[lang]}</button>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{ORGD_LBL.dist[lang]} · {gap}px</span>
        <span style={{ display: "flex", gap: 6 }}>
          <button type="button" style={{ ...ORGD_QUAD, opacity: gap === 0 ? 0.4 : 1 }} disabled={gap === 0} onClick={() => mudarGap(gap - 8)} title="-8">−</button>
          <button type="button" style={ORGD_QUAD} onClick={() => mudarGap(gap + 8)} title="+8">+</button>
          <button type="button" style={ORGD_QUAD} onClick={() => mudarGap(0)} title="0">0</button>
        </span>
      </div>
      {aberto ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,11,.6)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setAberto(false)}>
          <div style={{ background: ALPIN, border: `1px solid ${NOIR}`, maxWidth: 880, width: "100%", maxHeight: "86vh", overflowY: "auto", padding: 24 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: NOIR }}>{ORGD_LBL.btn[lang]}</strong>
              <span style={{ fontSize: 11, color: RHONE }}>{ORGD_LBL.hint[lang]}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
              {ordem.map((o, i) => (
                <div key={o.base} draggable
                  onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(o.base)); }}
                  onDragOver={(e) => { e.preventDefault(); if (overIdx !== i) setOverIdx(i); }}
                  onDrop={(e) => { e.preventDefault(); largar(i); }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  style={{ position: "relative", cursor: "grab", opacity: dragIdx === i ? 0.5 : 1, outline: overIdx === i && dragIdx !== null && dragIdx !== i ? `2px solid ${CITRON}` : "none", outlineOffset: 2 }}>
                  <span style={{ position: "absolute", top: 6, left: 6, zIndex: 1, background: NOIR, color: CITRON, borderRadius: 999, minWidth: 22, height: 22, padding: "0 6px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1 }}>{i + 1}</span>
                  {

                                                                             }
                  {o.poster ? (
                    <img src={o.poster} alt="" draggable={false} style={MINI_ORG_ESTILO} />
                  ) : o.tipo === "video" ? (
                    <video src={`${o.src}#t=0.1`} muted playsInline preload="metadata" style={MINI_ORG_ESTILO} />
                  ) : o.tipo === "pdf" ? (
                    <MiniPdf src={o.src} indice={i} />
                  ) : (
                    <img src={o.src} alt="" draggable={false} style={MINI_ORG_ESTILO} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" style={{ ...ORGD_CAPSULA, background: ALPIN, color: NOIR, border: `1px solid ${NOIR}` }} onClick={() => setAberto(false)}>{ORGD_LBL.cancel[lang]}</button>
              <button type="button" style={ORGD_CAPSULA} onClick={guardar}>{ORGD_LBL.save[lang]}</button>
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




export function AbilV3Case({ slug, lang, setLang, onNav }: {
  slug: string; lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void; onGoto?: (view: string) => void;
}) {
  useEdicoesSite();
  const emEdicao = useModoEdicao();
  const t = edUi(lang, "v3.ui.detail", UID[lang]);



  const pubs = usePublicados();
  const aCarregarPubs = usePublicadosACarregar();
  const pub = casoPublicado(slug);
  const idx = V3D_CASES.findIndex((c) => c.slug === slug);
  const item = pub ?? (idx >= 0 ? V3D_CASES[idx] : null);
  const [lb, setLb] = useState(false);
  const [lbAt, setLbAt] = useState(0);
  useRevealD(slug);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [slug]);


  const universo = useMemo(
    () => (pub ? (pubs ?? []) : V3D_CASES),
    [pub, pubs]
  );
  const related = useMemo(
    () => (item ? universo.filter((c) => c.slug !== item.slug).slice(0, 4) : []),
    [item, universo]
  );

  if (!item) return <AbilV3NotFound lang={lang} setLang={setLang} onNav={onNav} />;
  const posicao = universo.findIndex((c) => c.slug === item.slug);
  const next = universo.length > 1 ? universo[(posicao + 1) % universo.length] : null;

  const capa = edSrc(`v3.work.${item.slug}.img`, item.img);
  const lede = edTxt(lang, `v3.work.${item.slug}.lede`, item.lede[lang], 2000);
  const defi = edTxt(lang, `v3.work.${item.slug}.defi`, item.defi[lang], 2000);
  const reponse = edTxt(lang, `v3.work.${item.slug}.reponse`, item.reponse[lang], 2000);
  const secB = edTxt(lang, `v3.work.${item.slug}.secB`, item.secB[lang], 2000);






  const pubPaginas = (item as { paginas?: { tipo: "image" | "video" | "pdf"; src: string; poster?: string }[] }).paginas;
  const paresBase = (pubPaginas && pubPaginas.length)
    ? pubPaginas.map((pg, i) => ({ base: i, src: edSrc(`v3.work.${item.slug}.g${i + 1}`, pg.src), tipo: pg.tipo, poster: pg.poster }))
    : item.gallery.map((g, i) => ({ base: i, src: edSrc(`v3.work.${item.slug}.g${i + 1}`, g), tipo: "image" as const, poster: undefined as string | undefined }));
  const paresOrdenados = ordemDaGaleria(item.slug, paresBase.length).map((b) => paresBase[b]);
  const galleryGap = gapDaGaleria(item.slug);


  const gallery = paresOrdenados.map((o) => o.src);
  const tipos: ("image" | "video" | "pdf")[] = paresOrdenados.map((o) => o.tipo);
  const posters: (string | undefined)[] = paresOrdenados.map((o) => o.poster);

  const galleryKeys = paresOrdenados.map((o) => `v3.work.${item.slug}.g${o.base + 1}`);



  const inserirPagina = async (f: File, posicao: number) => {
    try {
      const { cloudUploadFile } = await import("@/lib/cloudProjects");
      const up = await cloudUploadFile(f, { prefix: "assets" });
      if (!up.ok || !up.url) { window.alert(lang === "it" ? "Non è stato possibile caricare il file. Riprova." : "Não consegui subir o ficheiro. Tenta outra vez."); return; }
      const novoBase = paresBase.length;
      const chave = `v3.work.${item.slug}.g${novoBase + 1}`;
      const ordemAtual = ordemDaGaleria(item.slug, paresBase.length);
      const nova = ordemAtual.slice();
      nova.splice(Math.max(0, Math.min(posicao, nova.length)), 0, novoBase);
      gravarEdicaoLocal({
        [chave]: up.url,
        [`v3.work.${item.slug}.order`]: nova.join(","),
      });
      void publicarEdicoesNuvem();
    } catch (e) {
      window.alert((lang === "it" ? "Inserimento della pagina non riuscito: " : "Falhou a inserir a página: ") + String((e as Error).message || e));
    }
  };

  return (
    <Shell
      lang={lang} setLang={setLang} onNav={onNav} active="projets" pageName={item.title}
      next={next ? { label: next.title, to: `projets/${next.slug}` } : undefined}
    >
      {                                                         }
      <div className="v3d-proj">
      {



                                                                  }
      {emEdicao ? <OrganizarGaleriaD lang={lang} slug={item.slug} pares={paresOrdenados} /> : null}
      {                                                              }
      <section className="v3d-projcapa v3d-io">
        {                                                                      }
        {/\.(mp4|webm|mov|m4v)(\?|$)/i.test(capa) ? (
          <video className="v3d-imgfx" data-ed={`v3.work.${item.slug}.img`} src={capa} autoPlay muted loop playsInline preload="metadata"
            aria-label="" style={{ width: "100%", height: "auto", display: "block" }}
            ref={(el) => { if (el) { el.muted = true; const pp = el.play(); if (pp && pp.catch) pp.catch(() => {  }); } }} />
        ) : (
          <img className="v3d-imgfx" data-ed={`v3.work.${item.slug}.img`} src={capa} alt="" loading="eager" />
        )}
      </section>

      {                                                                                }
      <section className="v3d-projtxt v3d-io">
        <h1><WordsD text={nomeCaso(item.slug, lang, item.title).split(" ")} base={0.1} step={0.06} /></h1>
        {lede ? <p className="lede v3d-fadeup" data-ed={`v3.work.${item.slug}.lede`} style={{ "--d": ".15s" } as React.CSSProperties}>{lede}</p> : null}
        {defi ? <p className="v3d-fadeup" data-ed={`v3.work.${item.slug}.defi`} style={{ "--d": ".25s" } as React.CSSProperties}>{defi}</p> : null}
        {reponse ? <p className="v3d-fadeup" data-ed={`v3.work.${item.slug}.reponse`} style={{ "--d": ".35s" } as React.CSSProperties}>{reponse}</p> : null}
        {secB ? <p className="v3d-fadeup" data-ed={`v3.work.${item.slug}.secB`} style={{ "--d": ".45s" } as React.CSSProperties}>{secB}</p> : null}
      </section>

      {                                                 }
      <section className="v3d-ficha v3d-io" aria-label={FICHA_TITULO[lang]}>
        {FICHA.map((f, fi) => (
          <div className="lin v3d-fadeup" style={{ "--d": `${0.1 + fi * 0.05}s` } as React.CSSProperties} key={f.k}>
            <span className="papel">{f.papel[lang]}</span>
            <span className="quem">{f.k === "annee" ? item.year : f.quem}</span>
          </div>
        ))}
      </section>

      {

                                                                                    }
      <section className="v3d-projimgs" aria-label={item.title}>
        {gallery.map((src, gi) => (




          <Fragment key={src + gi}>
          {emEdicao ? (
            <InserirAqui lang={lang} aoEscolher={(f) => void inserirPagina(f, gi)} />
          ) : null}
          <div className={emEdicao ? "v3d-pgpage" : undefined} style={{ position: "relative", ...(gi === 0 || emEdicao ? {} : { marginTop: galleryGap }) }}>
            {emEdicao ? (
              <BarraPagina chave={galleryKeys[gi]} slug={item.slug} indice={gi} total={gallery.length} lang={lang}
                gap={galleryGap} setGap={(v) => gravarEdicaoLocal({ [`v3.work.${item.slug}.gap`]: String(v) })} />
            ) : null}
            {tipos[gi] === "pdf" ? (



              <PaginaPdf src={src} poster={posters[gi]} alt={`${item.title} ${gi + 1}`} chave={galleryKeys[gi]} lang={lang} />
            ) : /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src) ? (
              <VideoPagina src={src} chave={galleryKeys[gi]} alt={`${item.title} ${gi + 1}`} lang={lang} />
            ) : (
              <ImagemPagina chave={galleryKeys[gi]} src={src} alt={`${item.title} ${gi + 1}`} eager={gi < 3} />
            )}
          </div>
          </Fragment>
        ))}
        {emEdicao ? <InserirAqui lang={lang} aoEscolher={(f) => void inserirPagina(f, gallery.length)} /> : null}
      </section>
      </div>

      {                                                 }
      <section className="v3d-rel v3d-margin v3d-io">
        <h2 className="v3d-l" data-ed="v3.ui.detail.csRelated"><WordsD text={t.csRelated.split(" ")} base={0.1} step={0.06} /></h2>
        <div className="v3d-relgrid">
          {related.map((c, ci) => (
            <article className="v3d-card" key={c.slug} data-v3hover={t.csCursor} onClick={() => onNav(`projets/${c.slug}`)}>
              <span className="v3d-card-num v3d-xxs">00-{ci + 1}</span>
              {                                                                        }
              <div className="v3d-card-img v3d-imgfx" style={{ "--d": `${0.15 + ci * 0.08}s` } as React.CSSProperties}>
                {


                                                   }
                {/\.(mp4|webm|mov|m4v)(\?|$)/i.test(edSrc(`v3.work.${c.slug}.img`, c.img)) ? (
                  <video data-ed={`v3.work.${c.slug}.img`} src={edSrc(`v3.work.${c.slug}.img`, c.img)}
                    autoPlay muted loop playsInline preload="metadata" aria-label="" />
                ) : (
                  <img data-ed={`v3.work.${c.slug}.img`} src={edSrc(`v3.work.${c.slug}.img`, c.img)} alt="" loading="lazy" />
                )}
              </div>
              <div className="v3d-card-line" />
              <div className="v3d-card-info">
                <span className="v3d-xxs">{c.tags.map((tg) => TAGSD[tg][lang]).join(" - ")}</span>
                <span className="v3d-xxs v3d-grey">{c.year}</span>
              </div>
              <h3 className="v3d-s">
                <button type="button" onClick={(e) => { e.stopPropagation(); onNav(`projets/${c.slug}`); }}>{c.title}</button>
              </h3>
            </article>
          ))}
        </div>
      </section>

      {                                                                                       }
      <AbilV3Lightbox key={lbAt} title={item.title} images={gallery} open={lb} start={lbAt} onClose={() => setLb(false)} lang={lang} />
    </Shell>
  );
}





export function AbilV3Service({ slug, lang, setLang, onNav }: {
  slug: string; lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void; onGoto?: (view: string) => void;
}) {
  useEdicoesSite();
  const pubsServ = usePublicados();
  const t = edUi(lang, "v3.ui.detail", UID[lang]);
  const idx = V3D_SERVICES.findIndex((s) => s.slug === slug);
  const item = idx >= 0 ? V3D_SERVICES[idx] : null;
  const [openStep, setOpenStep] = useState<number | null>(0);
  useRevealD(slug);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [slug]);
  const related = useMemo(() => {
    if (!item) return [];



    const universoRel = (pubsServ && pubsServ.length ? pubsServ : V3D_CASES);
    const hit = universoRel.filter((c) => c.tags.some((tg) => item.related.includes(tg)));
    const rest = universoRel.filter((c) => !hit.includes(c));
    return [...hit, ...rest].slice(0, 4);
  }, [item, pubsServ]);

  if (!item) return <AbilV3NotFound lang={lang} setLang={setLang} onNav={onNav} />;
  const next = V3D_SERVICES[(idx + 1) % V3D_SERVICES.length];
  const metadePilares = Math.ceil(item.pillars.length / 2);

  const nome = edTxt(lang, `v3.service.${item.slug}.name`, item.name[lang], 160);
  const sub1 = edTxt(lang, `v3.service.${item.slug}.sub1`, item.sub1[lang], 160);
  const sub2 = edTxt(lang, `v3.service.${item.slug}.sub2`, item.sub2[lang], 160);
  const p1 = edTxt(lang, `v3.service.${item.slug}.p1`, item.p1[lang], 2000);
  const p2 = edTxt(lang, `v3.service.${item.slug}.p2`, item.p2[lang], 2000);

  return (
    <Shell
      lang={lang} setLang={setLang} onNav={onNav} active="services" pageName={nome} pageEd={`v3.service.${item.slug}.name`}
      next={{ label: edTxt(lang, `v3.service.${next.slug}.name`, next.name[lang], 160), to: `services/${next.slug}` }}
    >
      <section className="v3d-hero v3d-margin v3d-io">
        <h1 className="v3d-xl" data-ed={`v3.service.${item.slug}.name`}><WordsD text={nome.split(" ")} base={0.15} step={0.05} /></h1>
        <div className="v3d-hero-sub v3d-xs">
          <RiseD d={0.9}><span data-ed={`v3.service.${item.slug}.sub1`}>{sub1}</span></RiseD>
          <RiseD d={1}><span data-ed={`v3.service.${item.slug}.sub2`}>{sub2}</span></RiseD>
        </div>
        <div className="v3d-hero-desc">
          {

                                                                              }
          <h3 className="v3d-s v3d-fadeup" style={{ "--d": ".3s" } as React.CSSProperties}>
            <span data-ed={`v3.service.${item.slug}.sub1`}>{sub1}</span>, <span data-ed={`v3.service.${item.slug}.sub2`}>{lang === "de" ? sub2 : sub2.toLowerCase()}</span>.
          </h3>
          <p className="v3d-p v3d-fadeup" data-ed={`v3.service.${item.slug}.p1`} style={{ "--d": ".4s" } as React.CSSProperties}>{p1}</p>
          <p className="v3d-p v3d-fadeup" data-ed={`v3.service.${item.slug}.p2`} style={{ "--d": ".5s" } as React.CSSProperties}>{p2}</p>
          <div className="v3d-fadeup" style={{ "--d": ".6s" } as React.CSSProperties}>
            {
                                                                                       }
            <PillD top={t.csTalkTop} reveal={t.csTalkReveal} edTop="v3.ui.detail.csTalkTop" edReveal="v3.ui.detail.csTalkReveal" onClick={() => onNav("contact")} />
          </div>
        </div>
      </section>

      {                                                                                }
      <section className="v3d-io">
        <div className="v3d-herolrg v3d-expand v3d-imgmask">
          {                                                                          }
          <img className="v3d-imgup" data-ed={`v3.service.${item.slug}.img`} src={edSrc(`v3.service.${item.slug}.img`, item.img)} alt="" loading="eager" />
        </div>
      </section>

      {                                                         }
      <section className="v3d-svclist v3d-margin v3d-io">
        <div className="v3d-svclist-head">
          <h2 className="v3d-l" data-ed="v3.ui.detail.svcPillars"><WordsD text={t.svcPillars.split(" ")} base={0.1} step={0.05} /></h2>
          {
                                                                         }
          <p className="v3d-p v3d-fadeup" style={{ "--d": ".3s" } as React.CSSProperties}>
            <span data-ed={`v3.service.${item.slug}.sub1`}>{sub1}</span>, <span data-ed={`v3.service.${item.slug}.sub2`}>{lang === "de" ? sub2 : sub2.toLowerCase()}</span>.
          </p>
          <div className="v3d-fadeup" style={{ "--d": ".4s" } as React.CSSProperties}>
            <PillD top={t.svcAllTop} reveal={t.svcAllReveal} edTop="v3.ui.detail.svcAllTop" edReveal="v3.ui.detail.svcAllReveal" onClick={() => onNav("services")} />
          </div>
        </div>
        {

                                               }
        <div className="v3d-svclist-grid">
          {[item.pillars.slice(0, metadePilares), item.pillars.slice(metadePilares)].map((col, colI) => (
            <ul key={colI}>
              {col.map((p, pi) => (
                <li className="v3d-p v3d-fadeup" data-ed={`v3.service.${item.slug}.pillar.${colI * metadePilares + pi + 1}`} style={{ "--d": `${0.2 + (colI * metadePilares + pi) * 0.05}s` } as React.CSSProperties} key={pi}>{edTxt(lang, `v3.service.${item.slug}.pillar.${colI * metadePilares + pi + 1}`, p[lang], 160)}</li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {                                                                                }
      <section className="v3d-proc v3d-margin v3d-io">
        <div className="v3d-proc-head">
          <h2 className="v3d-l" data-ed="v3.ui.detail.svcProcess"><WordsD text={t.svcProcess.split(" ")} base={0.1} step={0.06} /></h2>
          {                                                                          }
          <p className="v3d-s v3d-fadeup" data-ed="v3.ui.detail.svcProcessDesc" style={{ "--d": ".3s" } as React.CSSProperties}>{t.svcProcessDesc}</p>
        </div>
        <div>
          {PROCESS.map((st, si) => (
            <div key={si}>
              <button type="button" className="v3d-proc-row" aria-expanded={openStep === si}
                onClick={() => setOpenStep(openStep === si ? null : si)}>
                {
                                                                                   }
                <span className="v3d-xs" data-ed={`v3.servdet.proc.${si + 1}.h`}>{edTxt(lang, `v3.servdet.proc.${si + 1}.h`, st.h[lang], 160)}</span>
                <span className="v3d-xxs" data-ed={openStep === si ? "v3.ui.detail.moins" : "v3.ui.detail.plus"}>{openStep === si ? t.moins : t.plus}</span>
              </button>
              <div className={`v3d-acc${openStep === si ? " open" : ""}`} aria-hidden={openStep !== si}>
                <div><p className="v3d-p" data-ed={`v3.servdet.proc.${si + 1}.p`}>{edTxt(lang, `v3.servdet.proc.${si + 1}.p`, st.p[lang], 800)}</p></div>
              </div>
              <div className={`v3d-rowline${openStep === si ? " on" : ""}`}><i /></div>
            </div>
          ))}
        </div>
      </section>

      {                                                               }
      <section className="v3d-relwork v3d-io">
        <div className="v3d-margin" style={{ marginBottom: "2vw" }}>
          <h2 className="v3d-l" data-ed="v3.ui.detail.svcRelated"><WordsD text={t.svcRelated.split(" ")} base={0.1} step={0.06} /></h2>
        </div>
        <div className="v3d-relwork-grid">
          <div className="v3d-bordv" style={{ "--d": ".8s" } as React.CSSProperties} />
          {related.map((c, ci) => (
            <article className="v3d-work v3d-io" key={c.slug} data-v3hover={t.csCursor} onClick={() => onNav(`projets/${c.slug}`)}>
              <div className="v3d-work-visual">
                <div className="v3d-imgfx" style={{ "--d": `${0.15 + (ci % 2) * 0.1}s`, width: "100%", height: "100%" } as React.CSSProperties}>
                  <MediaCapa ed={`v3.work.${c.slug}.img`} src={edSrc(`v3.work.${c.slug}.img`, c.img)} eager={ci === 0} />
                </div>
              </div>
              <div className="v3d-work-info">
                <div className="v3d-xxs">{c.tags.map((tg) => TAGSD[tg][lang]).join(" - ")}</div>
                <h3 className="v3d-work-title v3d-m">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onNav(`projets/${c.slug}`); }}>
                    <WordsD text={c.title.split(" ")} base={0.4} step={0.06} />
                  </button>
                </h3>
                <div className="v3d-work-line"><div className="v3d-fillw" style={{ "--d": ".55s" } as React.CSSProperties} /></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}






export function AbilV3Agence({ lang, setLang, onNav }: {
  lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void; onGoto?: (view: string) => void;
}) {
  useEdicoesSite();
  const t = edUi(lang, "v3.ui.detail", UID[lang]);
  const [sp, setSp] = useState(0);
  const spRef = useRef<HTMLElement | null>(null);
  const stripRef = useRef<HTMLElement | null>(null);
  useRevealD("agence");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);



  useEffect(() => {
    const wrap = spRef.current;
    if (!wrap || !("IntersectionObserver" in window)) return;
    const groups = Array.from(wrap.querySelectorAll<HTMLElement>("[data-group]"));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) setSp(Number(en.target.getAttribute("data-group")) || 0);
      }
    }, { rootMargin: "-35% 0px -35% 0px", threshold: 0 });
    groups.forEach((g) => io.observe(g));
    return () => io.disconnect();
  }, []);




  useEffect(() => {
    const wrap = spRef.current;
    if (!wrap) return;
    const itens = Array.from(wrap.querySelectorAll<HTMLElement>(".v3d-agsp-item"));
    const seps = Array.from(wrap.querySelectorAll<HTMLElement>(".v3d-agsp-sep"));
    let raf = 0;
    const anda = () => {
      raf = 0;
      const vh = window.innerHeight;
      const prog = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55)));
      };
      for (const el of itens) el.style.transform = `translateX(${((1 - prog(el)) * 36).toFixed(3)}vw)`;
      for (const el of seps) el.style.transform = `translateX(${((1 - prog(el)) * 24).toFixed(3)}vw)`;
    };
    const aoScroll = () => { if (!raf) raf = window.requestAnimationFrame(anda); };
    anda();
    window.addEventListener("scroll", aoScroll, { passive: true });
    window.addEventListener("resize", aoScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", aoScroll);
      window.removeEventListener("resize", aoScroll);
    };
  }, []);



  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let baixo = false, x0 = 0, s0 = 0, vx = 0, lastX = 0, lastT = 0, raf = 0;
    const down = (e: PointerEvent) => {
      baixo = true; x0 = e.clientX; s0 = el.scrollLeft;
      vx = 0; lastX = e.clientX; lastT = performance.now();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      el.classList.add("drag");
    };
    const move = (e: PointerEvent) => {
      if (!baixo) return;
      el.scrollLeft = s0 - (e.clientX - x0);
      const agora = performance.now();
      const dt = agora - lastT;
      if (dt > 0) { vx = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = agora; }
    };
    const up = () => {
      if (!baixo) return;
      baixo = false; el.classList.remove("drag");
      if (reduced) return;
      let v = -vx * 16;
      const solta = () => {
        raf = 0;
        if (Math.abs(v) < 0.5) return;
        el.scrollLeft += v;
        v *= 0.94;
        raf = window.requestAnimationFrame(solta);
      };
      if (Math.abs(v) >= 0.5) raf = window.requestAnimationFrame(solta);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);


  const equipaBruta = edCfg("v3.agence.team.lista", "");
  const equipaDoPainel = useMemo(() => {
    try {
      if (!equipaBruta) return null;
      const arr = JSON.parse(equipaBruta) as { slug?: string; first?: string; last?: string; photo?: string; role?: string }[];
      if (!Array.isArray(arr) || !arr.length) return null;
      const limpos = arr
        .map((m) => ({
          slug: String(m?.slug || "").toLowerCase().trim(),
          first: String(m?.first || "").trim(),
          last: String(m?.last || "").trim(),
          photo: String(m?.photo || ""),
          role: String(m?.role || ""),
        }))
        .filter((m) => m.slug && m.first);
      return limpos.length ? limpos : null;
    } catch { return null; }
  }, [equipaBruta]);
  const MEMBROS = useMemo(() => (
    equipaDoPainel
      ? equipaDoPainel.map((m) => ({ slug: m.slug, first: m.first, last: m.last, photo: m.photo, roleDef: m.role }))
      : AG_TEAM.map((m) => ({ slug: m.first.toLowerCase(), first: m.first, last: m.last, photo: m.photo, roleDef: m.role[lang] }))
  ), [equipaDoPainel, lang]);

  return (
    <Shell
      lang={lang} setLang={setLang} onNav={onNav} active="agence" pageName={edTxt(lang, "v3.ui.nav.agence", navLabelD("agence", lang), 160)} pageEd="v3.ui.nav.agence"
      next={{ label: edTxt(lang, "v3.ui.nav.projets", navLabelD("projets", lang), 160), to: "projets", count: pad2(V3D_CASES.length) }}
    >
      <section className="v3d-hero v3d-margin v3d-io">
        <h1 className="v3d-xl" data-ed="v3.agence.hero.title"><WordsD text={edTxt(lang, "v3.agence.hero.title", AG_TITLE[lang], 300).split(" ")} base={0.15} step={0.05} /></h1>
        <div className="v3d-hero-sub v3d-xs">
          <RiseD d={0.9}><span data-ed="v3.agence.hero.sub1">{edTxt(lang, "v3.agence.hero.sub1", AG_SUB1[lang], 160)}</span></RiseD>
          <RiseD d={1}><span data-ed="v3.agence.hero.sub2">{edTxt(lang, "v3.agence.hero.sub2", AG_SUB2[lang], 160)}</span></RiseD>
        </div>
        <div className="v3d-hero-desc">
          <p className="v3d-p v3d-fadeup" data-ed="v3.agence.hero.p1" style={{ "--d": ".4s" } as React.CSSProperties}>{edTxt(lang, "v3.agence.hero.p1", AG_P1[lang], 2000)}</p>
          <p className="v3d-p v3d-fadeup" data-ed="v3.agence.hero.p2" style={{ "--d": ".5s" } as React.CSSProperties}>{edTxt(lang, "v3.agence.hero.p2", AG_P2[lang], 2000)}</p>
          <div className="v3d-fadeup" style={{ "--d": ".6s" } as React.CSSProperties}>
            <PillD top={t.agTalkTop} reveal={t.agTalkReveal} edTop="v3.ui.detail.agTalkTop" edReveal="v3.ui.detail.agTalkReveal" onClick={() => onNav("contact")} />
          </div>
        </div>
      </section>

      <section className="v3d-io">
        {
                                                                 }
        <div className="v3d-agvidwrap">
          <div className="v3d-agvidload" aria-hidden="true"><i /></div>
          <video className="v3d-agvid" data-ed="v3.agence.kv2.video" src={edSrc("v3.agence.kv2.video", "/videos/kv-2.mp4")} poster={edSrc("v3.agence.video.poster", "/brand/kv-icon-yellow-2.jpg")}
            autoPlay muted loop playsInline preload="metadata" aria-label={t.lrgAlt}
            ref={(el) => { if (el) { el.muted = true; if (el.paused) el.play().catch(() => {  }); } }}
            onCanPlay={(e) => { const v = e.currentTarget; v.muted = true; if (v.paused) v.play().catch(() => {  }); }} />
        </div>
        <div className="v3d-margin v3d-xs v3d-grey" data-ed="v3.ui.detail.agBased" style={{ marginTop: "1vw" }}>{t.agBased}</div>
      </section>

      {

                                                                              }
      <section className="v3d-agsp v3d-io" ref={spRef}>
        <div className="v3d-agsp-left">
          <div className="v3d-agsp-mask">
            <div className="v3d-agsp-stack" style={{ transform: `translateY(calc(var(--step) * -${sp}))` }}>
              {AG_SLIDES.map((s, si) => <h2 className="v3d-l" data-ed={`v3.service.${s.slug}.name`} key={si}>{edTxt(lang, `v3.service.${s.slug}.name`, s.h[lang], 160)}</h2>)}
            </div>
          </div>
          {                                                                               }
          <div className="v3d-agsp-countwrap v3d-xs">
            <div className="v3d-agsp-count">
              <span style={{ display: "flex", alignItems: "baseline", lineHeight: 1 }} aria-hidden="true">
                00
                <span className="v3d-agsp-digits">
                  <span className="v3d-agsp-roll" style={{ transform: `translateY(${sp * -1}em)` }}>
                    {AG_SLIDES.map((_, si) => <span key={si}>{si + 1}</span>)}
                  </span>
                </span>
              </span>
              <span className="v3d-agsp-prog"><i style={{ "--p": (sp + 1) / AG_SLIDES.length } as React.CSSProperties} /></span>
            </div>
            <span className="v3d-agsp-total" aria-hidden="true">{pad3(AG_SLIDES.length)}</span>
          </div>
          <p className="v3d-p v3d-agsp-para" data-ed="v3.ui.detail.agSvcPara">{t.agSvcPara}</p>
          <PillD top={t.agSvcAllTop} reveal={t.agSvcAllReveal} edTop="v3.ui.detail.agSvcAllTop" edReveal="v3.ui.detail.agSvcAllReveal" onClick={() => onNav("services")} />
        </div>
        <div className="v3d-agsp-right">
          {AG_SLIDES.map((s, si) => (
            <div className="v3d-agsp-group v3d-io" data-group={si} key={si}>
              {si > 0 ? <div className="v3d-agsp-sep" aria-hidden="true" /> : null}
              {s.items.map((it, ii) => (
                <div className="v3d-agsp-item" data-ed={`v3.service.${s.slug}.pillar.${ii + 1}`} style={{ "--d": `${ii * 0.05}s` } as React.CSSProperties} key={ii}>{edTxt(lang, `v3.service.${s.slug}.pillar.${ii + 1}`, it[lang], 160)}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {

                                                            }
      {







                                                                                      }
      <section className="v3d-agteam v3d-margin v3d-io">
        <div className="v3d-agteam-head">
          <h2 className="v3d-l" data-ed="v3.ui.detail.agTeam"><WordsD text={t.agTeam.split(" ")} base={0.1} step={0.06} /></h2>
          <span className="v3d-agteam-num v3d-xxs">{pad2(MEMBROS.length)}</span>
        </div>
        <p className="v3d-p v3d-agteam-sub v3d-fadeup" data-ed="v3.ui.detail.agTeamSub" style={{ "--d": ".2s" } as React.CSSProperties}>{t.agTeamSub}</p>
        <div className="v3d-agteam-row">
          {MEMBROS.map((m, mi) => (



            <div className={`v3d-agcard v3d-fadeup${mi >= MEMBROS.length - ((MEMBROS.length - 1) % 4 + 1) ? " bot" : ""}`}
              style={{ "--d": `${0.15 + mi * 0.05}s` } as React.CSSProperties} key={mi}>
              <div className="v3d-agcard-info v3d-xxs">
                <span data-ed={`v3.agence.team.${m.slug}.role`}>{edTxt(lang, `v3.agence.team.${m.slug}.role`, m.roleDef, 160)}</span>
              </div>
              <div className="v3d-agcard-photo"><img data-ed={`v3.agence.team.${m.slug}.img`} src={edSrc(`v3.agence.team.${m.slug}.img`, m.photo)} alt={`${m.first} ${m.last}`} loading="lazy" /></div>
              <h3 className="v3d-s v3d-agcard-name">
                <span style={{ display: "block" }} data-ed={`v3.agence.team.${m.slug}.first`}>{edTxt(lang, `v3.agence.team.${m.slug}.first`, m.first, 80)}</span>
                <span style={{ display: "block" }} data-ed={`v3.agence.team.${m.slug}.last`}>{edTxt(lang, `v3.agence.team.${m.slug}.last`, m.last, 80)}</span>
              </h3>
            </div>
          ))}
        </div>
      </section>

      {
                                                                           }
      <section className="v3d-agoff v3d-margin v3d-io">
        <div className="v3d-agoff-h">
          <h2 className="v3d-l" data-ed="v3.ui.detail.agOffices"><WordsD text={t.agOffices.split(" ")} base={0.1} step={0.06} /></h2>
          <span className="v3d-agteam-num v3d-xxs">01</span>
        </div>
        <div className="v3d-s v3d-agoff-sub v3d-fadeup" data-ed="v3.ui.detail.agOffSub" style={{ "--d": ".2s" } as React.CSSProperties}>{t.agOffSub}</div>
        <div className="v3d-agoff-in">
          <p className="v3d-p v3d-fadeup" data-ed="v3.ui.detail.agOffPara" style={{ "--d": ".3s" } as React.CSSProperties}>{t.agOffPara}</p>
          <div className="v3d-fadeup" style={{ "--d": ".4s" } as React.CSSProperties}>
            <PillD top={t.agTalkTop} reveal={t.agTalkReveal} edTop="v3.ui.detail.agTalkTop" edReveal="v3.ui.detail.agTalkReveal" onClick={() => onNav("contact")} />
          </div>
        </div>
      </section>

      {                                                                              }
      <section className="v3d-agstrip v3d-io" aria-label={t.agStrip} ref={stripRef}>
        {AG_STRIP.map((src) => {

          const ed = `v3.agence.strip.${src.slice(src.lastIndexOf("/") + 1, src.lastIndexOf("."))}`;
          return <img key={src} data-ed={ed} src={edSrc(ed, src)} alt="" loading="lazy" />;
        })}
      </section>
    </Shell>
  );
}





const CAPAS_CASA = ["/brand/mock-billboard-2.jpg", "/brand/kv-icon-yellow-1.jpg", "/brand/kv-logo-black-1.jpg", "/brand/mock-glass-card.jpg"];
const fmtDataArt = (d: string, l: AbilLang) => {
  const [a, m] = d.split("-").map(Number);
  const loc = l === "fr" ? "fr-CH" : l === "en" ? "en-GB" : l === "pt" ? "pt-PT" : l === "de" ? "de-CH" : "it-CH";
  const nome = new Intl.DateTimeFormat(loc, { month: "long" }).format(new Date(Date.UTC(a, (m || 1) - 1, 1)));
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} ${a}`;
};
export function AbilV3Article({ slug, lang, setLang, onNav }: {
  slug: string; lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void;
}) {
  useEdicoesSite();
  const t = edUi(lang, "v3.ui.detail", UID[lang]);
  const jornal = useJornal();
  const lista = jornal ?? ABIL_POSTS;
  const post = lista.find((p) => p.slug === slug) || null;
  useRevealD("article", slug);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [slug]);
  if (!post) {


    if (!jornal) return <div style={{ minHeight: "100vh" }} />;
    return <AbilV3NotFound lang={lang} setLang={setLang} onNav={onNav} />;
  }
  const idx = Math.max(0, ABIL_POSTS.findIndex((p) => p.slug === slug));

  const capa = edSrc(`v3.post.${slug}.cover`, post.cover || CAPAS_CASA[idx % CAPAS_CASA.length]);
  const corpo = post.body[lang] || [];
  const imgs = post.images || [];
  const temMarcador = corpo.some((p) => /^\[\[IMG:\d+\]\]$/.test(p.trim()));


  const pontos = !temMarcador && imgs.length
    ? imgs.map((_, i) => Math.max(1, Math.round(((i + 1) * corpo.length) / (imgs.length + 1))))
    : [];
  const nodos: { tipo: "p" | "h2" | "img"; texto?: string; img?: number }[] = [];
  corpo.forEach((par, pi) => {
    const m = par.trim().match(/^\[\[IMG:(\d+)\]\]$/);
    if (m) { const n = Number(m[1]); if (imgs[n]) nodos.push({ tipo: "img", img: n }); return; }
    if (par.startsWith("## ")) nodos.push({ tipo: "h2", texto: par.slice(3) });
    else nodos.push({ tipo: "p", texto: par });
    const ponto = pontos.indexOf(pi + 1);
    if (ponto >= 0 && imgs[ponto]) nodos.push({ tipo: "img", img: ponto });
  });
  const outros = lista.filter((p) => p.slug !== slug).slice(0, 3);
  const autor = post.author;
  return (
    <Shell lang={lang} setLang={setLang} onNav={onNav} active="journal" pageName={edTxt(lang, "v3.ui.nav.journal", navLabelD("journal", lang), 160)} pageEd="v3.ui.nav.journal"
      next={{ label: edTxt(lang, "v3.ui.nav.journal", navLabelD("journal", lang), 160), to: "journal", count: pad2(lista.length) }}>
      <div className="v3d-art">
        <div className="v3d-artcapa v3d-io"><img className="v3d-imgfx" data-ed={`v3.post.${slug}.cover`} src={capa} alt={post.title[lang]} /></div>
        <header className="v3d-arthead v3d-io">
          <span className="v3d-arttag v3d-fadeup" style={{ "--d": ".1s" } as React.CSSProperties}>{post.tag[lang]}</span>
          <h1 className="v3d-fadeup" style={{ "--d": ".2s" } as React.CSSProperties}>{post.title[lang]}</h1>
          <p className="lede v3d-fadeup" style={{ "--d": ".3s" } as React.CSSProperties}>{post.excerpt[lang]}</p>
        </header>
        <div className="v3d-artficha v3d-io">
          <div className="lin v3d-fadeup" style={{ "--d": ".1s" } as React.CSSProperties}>
            <span className="papel" data-ed="v3.ui.detail.artAutor">{t.artAutor}</span>
            {autor ? (
              <>
                <span className="v3d-art-autor">
                  {autor.photo ? <img className="v3d-art-avatar" data-ed="v3.journal.author.img" src={edSrc("v3.journal.author.img", autor.photo)} alt="" /> : null}
                  <span className="quem">{autor.name}<br /><span style={{ color: RHONE, fontSize: "12px" }}>{autor.role[lang]}</span></span>
                </span>
                <span className="v3d-art-bio">{autor.bio[lang]}</span>
              </>
            ) : <span className="quem">ABiL MEDiAS</span>}
          </div>
          <div className="lin v3d-fadeup" style={{ "--d": ".15s" } as React.CSSProperties}>
            <span className="papel" data-ed="v3.ui.detail.artData">{t.artData}</span><span className="quem">{fmtDataArt(post.date, lang)}</span>
          </div>
          <div className="lin v3d-fadeup" style={{ "--d": ".2s" } as React.CSSProperties}>
            <span className="papel" data-ed="v3.ui.detail.artLeitura">{t.artLeitura}</span><span className="quem">{readingMinutes(post, lang)} <span data-ed="v3.ui.detail.artMinRead">{t.artMinRead}</span></span>
          </div>
          <div className="lin v3d-fadeup" style={{ "--d": ".25s" } as React.CSSProperties}>
            <span className="papel" data-ed="v3.ui.detail.artTema">{t.artTema}</span><span className="quem">{post.tag[lang]}</span>
          </div>
        </div>
        <div className="v3d-artbody">
          {nodos.map((n, ni) => n.tipo === "img" ? (
            <figure key={ni} className="v3d-io">
              <img className="v3d-imgfx" data-ed={`v3.post.${slug}.img${n.img! + 1}`} src={edSrc(`v3.post.${slug}.img${n.img! + 1}`, imgs[n.img!])} alt="" loading="lazy" />
              {post.imageCredits?.[n.img!]?.credit ? <figcaption>{post.imageCredits[n.img!].credit}</figcaption> : null}
            </figure>
          ) : n.tipo === "h2" ? <h2 key={ni}>{n.texto}</h2> : <p key={ni}>{n.texto}</p>)}
        </div>
        <section className="v3d-artoutros v3d-io">
          <div className="v3d-artoutros-h">
            <h2 className="v3d-l" data-ed="v3.ui.detail.artOutros">{t.artOutros}</h2>
            <span className="v3d-agteam-num v3d-xxs">{pad2(outros.length)}</span>
          </div>
          <div className="v3d-artoutros-grid">
            {outros.map((p, oi) => (
              <button type="button" className="v3d-artcard v3d-fadeup" style={{ "--d": `${0.1 + oi * 0.08}s` } as React.CSSProperties}
                key={p.slug} onClick={() => onNav(`journal/${p.slug}`)}>
                <span className="v3d-artcard-img"><img data-ed={`v3.post.${p.slug}.cover`} src={edSrc(`v3.post.${p.slug}.cover`, p.cover || CAPAS_CASA[oi % CAPAS_CASA.length])} alt="" loading="lazy" /></span>
                <span className="meta">{p.tag[lang]} · {fmtDataArt(p.date, lang)}</span>
                <span className="tit">{p.title[lang]}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}





export function AbilV3CaseOverview({ lang, setLang, onNav }: {
  lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void;
}) {
  useEdicoesSite();



  const pubsCo = usePublicados();
  const CASOS_CO = (pubsCo && pubsCo.length ? pubsCo : V3D_CASES);
  const t = edUi(lang, "v3.ui.detail", UID[lang]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [cur, setCur] = useState(0);
  useRevealD("case-studies");
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !("IntersectionObserver" in window)) return;
    const slides = Array.from(wrap.querySelectorAll<HTMLElement>("[data-slide]"));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) setCur(Number(en.target.getAttribute("data-slide")) || 0);
      }
    }, { threshold: 0.55 });
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <Shell lang={lang} setLang={setLang} onNav={onNav} active="projets" footer="meta">
      <h1 className="v3d-hidden">{t.coAria}</h1>
      <div className="v3d-co" ref={wrapRef} aria-label={t.coAria}>
        {CASOS_CO.map((c, ci) => (
          <section
            className="v3d-coslide" data-slide={ci} key={c.slug}
            data-v3hover={t.csCursor} onClick={() => onNav(`projets/${c.slug}`)}
          >
            <img className="v3d-coimg" data-ed={`v3.work.${c.slug}.img`} src={edSrc(`v3.work.${c.slug}.img`, c.img)} alt="" loading={ci < 2 ? "eager" : "lazy"} />
            <div className="v3d-coveil" />
            <div className="v3d-cocontent">
              <div className="v3d-cobox">
                <div className="v3d-cotags v3d-xxs">
                  {c.tags.map((tg) => <span key={tg}>{TAGSD[tg][lang]}</span>)}
                </div>
                {
                                                                                    }
                <h2 className="v3d-l">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onNav(`projets/${c.slug}`); }}>{c.title}</button>
                </h2>
              </div>
            </div>
          </section>
        ))}
      </div>
      <span className="v3d-conum v3d-xs">{pad2(cur + 1)} / {pad2(V3D_CASES.length)}</span>
    </Shell>
  );
}


export function AbilV3Legal({ kind, lang, setLang, onNav }: {
  kind: V3DLegalKind; lang: AbilLang; setLang: (l: AbilLang) => void; onNav: (p: string) => void;
}) {
  useEdicoesSite();
  const t = edUi(lang, "v3.ui.detail", UID[lang]);
  const doc = LEGAL_DOCS[kind];


  const [mark, setMark] = useState<{ kind: V3DLegalKind; id: string }>({ kind, id: doc.sections[0].id });
  const active = mark.kind === kind ? mark.id : doc.sections[0].id;
  useRevealD(kind);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [kind]);


  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(".v3d-legalblock"));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) setMark({ kind, id: en.target.id });
      }
    }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
    blocks.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, [kind]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };
  const other: V3DLegalKind = kind === "confidentialite" ? "conditions" : "confidentialite";

  const pk = kind === "confidentialite" ? "privacy" : "terms";
  const otherPk = other === "confidentialite" ? "privacy" : "terms";

  return (
    <Shell
      lang={lang} setLang={setLang} onNav={onNav} pageName={t.legalKicker} pageEd="v3.ui.detail.legalKicker"
      next={{ label: edTxt(lang, `v3.legal.${otherPk}.title`, LEGAL_DOCS[other].title[lang], 160), to: other }}
    >
      <header className="v3d-legalhead v3d-margin v3d-io">
        <h1 className="v3d-l" data-ed={`v3.legal.${pk}.title`}><WordsD text={edTxt(lang, `v3.legal.${pk}.title`, doc.title[lang], 160).split(" ")} base={0.1} step={0.05} /></h1>
        <div className="v3d-legalmeta v3d-xxs">
          <span className="v3d-grey" data-ed="v3.ui.detail.legalKicker">{t.legalKicker}</span>
          <span><span data-ed="v3.ui.detail.legalUpdated">{t.legalUpdated}</span> <span data-ed={`v3.legal.${pk}.updated`}>{edTxt(lang, `v3.legal.${pk}.updated`, doc.updated[lang], 160)}</span></span>
          {lang === "fr" ? null : <span className="v3d-grey" data-ed="v3.ui.detail.legalRef">{t.legalRef}</span>}
        </div>
      </header>

      <div className="v3d-legalsec v3d-io">
        <nav className="v3d-legalnav" aria-label={t.legalSommaire}>
          <div className="v3d-colh v3d-xxs" data-ed="v3.ui.detail.legalSommaire">{t.legalSommaire}</div>
          <ul className="v3d-legallinks v3d-xs">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <button type="button" className={`v3d-lnk${active === s.id ? " on" : ""}`} data-ed={`v3.legal.${pk}.${s.id}.h`} onClick={() => jump(s.id)}>
                  {edTxt(lang, `v3.legal.${pk}.${s.id}.h`, s.h[lang], 160)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="v3d-legalbody">
          {doc.sections.map((s) => (
            <section className="v3d-legalblock" id={s.id} key={s.id}>
              <h2 className="v3d-s" data-ed={`v3.legal.${pk}.${s.id}.h`}>{edTxt(lang, `v3.legal.${pk}.${s.id}.h`, s.h[lang], 160)}</h2>
              {
                                                                                       }
              {s.body.map((p, pi) => <p className="v3d-p" lang={lang === "it" ? "it" : "fr"} data-ed={`v3.legal.${pk}.${s.id}.p${pi + 1}`} key={pi}>{edTxt(lang, `v3.legal.${pk}.${s.id}.p${pi + 1}`, lang === "it" ? p.it : p.fr, 4000)}</p>)}
            </section>
          ))}
        </div>
      </div>
    </Shell>
  );
}





export function AbilV3Preloader({ onDone }: { onDone?: () => void }) {
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);

  const [gone, setGone] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (gone) { onDone?.(); return; }
    let n = 0;
    const id = window.setInterval(() => {
      n = Math.min(100, n + Math.ceil(Math.random() * 9) + 4);
      setPct(n);
      if (n >= 100) window.clearInterval(id);
    }, 60);
    return () => window.clearInterval(id);
  }, [gone, onDone]);

  useEffect(() => {
    if (pct < 100) return;
    const a = window.setTimeout(() => setOut(true), 180);
    const b = window.setTimeout(() => { setGone(true); onDone?.(); }, 980);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [pct, onDone]);

  if (gone) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 1200, background: ALPIN, color: NOIR,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "16px 2vw 2vw", clipPath: out ? "inset(0 0 100% 0)" : "inset(0)",
        transition: "clip-path .75s cubic-bezier(.645,.045,.355,1)",
        fontFamily: '"Figtree","Helvetica Neue",sans-serif',
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: "2px" }}>
        <img src="/brand/abil-wordmark.svg" alt="" style={{ height: "13px", width: "auto", display: "block" }} />
        <sup style={{ fontSize: "8px", transform: "translateY(-4px)" }}>®</sup>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "2vw" }}>
        <div style={{ width: "64px", height: "1px", background: LEMAN, overflow: "hidden" }}>
          <i style={{ display: "block", height: "100%", width: `${pct}%`, background: NOIR, transition: "width .12s linear" }} />
        </div>
        <span style={{ fontSize: "12px", lineHeight: 1.17, letterSpacing: "-.03em" }}>{pad3(pct)}</span>
      </div>
    </div>
  );
}




export function AbilV3Transition({ token }: { token: string }) {
  const first = useRef(true);


  const [phase, setPhase] = useState<"idle" | "loading" | "loaded">("idle");

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raf = requestAnimationFrame(() => setPhase("loading"));
    const a = window.setTimeout(() => setPhase("loaded"), 540);
    const b = window.setTimeout(() => setPhase("idle"), 1580);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(a); window.clearTimeout(b); };
  }, [token]);

  const clip = phase === "loading" ? "inset(0 0 0 0)" : phase === "loaded" ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)";
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, zIndex: 1100, background: NOIR, color: ALPIN,
        display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
        clipPath: clip,
        transition: phase === "idle" ? "none" : "clip-path 1s cubic-bezier(.24,.36,0,1)",
      }}
    >
      <span
        style={{
          display: "block",
          transform: phase === "loading" ? "translateY(0)" : "translateY(-40px)",
          transition: phase === "idle" ? "none" : "transform 1s cubic-bezier(.24,.36,0,1)",
        }}
      >
        <img src="/brand/abil-wordmark-citron.svg" alt="" style={{ height: "18px", width: "auto", display: "block" }} />
      </span>
    </div>
  );
}




export type V3DPageKind =
  | "home" | "projets" | "services" | "agence" | "journal" | "contact"
  | "case" | "article" | "service" | "case-studies" | "etudes" | "legal" | "404";





const META_TOPO = new Set<V3DPageKind>(["home", "projets", "services", "agence", "journal", "contact"]);

export function v3dDocTitle(lang: AbilLang, kind: V3DPageKind, slug?: string): string {
  const brand = "ABiL MEDiAS";
  const t = edUi(lang, "v3.ui.detail", UID[lang]);
  const name = (() => {
    switch (kind) {
      case "home": return brand;



      case "case": return casoPublicado(slug || "")?.title ?? V3D_CASES.find((c) => c.slug === slug)?.title ?? t.nfTitle;
      case "article": {

        const p = postDoJornal(slug || "") ?? ABIL_POSTS.find((x) => x.slug === slug);
        return p ? p.title[lang] : t.nfTitle;
      }
      case "service": {
        const s = V3D_SERVICES.find((x) => x.slug === slug);
        return s ? edTxt(lang, `v3.service.${s.slug}.name`, s.name[lang], 160) : t.nfTitle;
      }
      case "case-studies":
      case "etudes": return t.coAria;
      case "legal": return LEGAL_DOCS[(slug as V3DLegalKind) in LEGAL_DOCS ? (slug as V3DLegalKind) : "confidentialite"].title[lang];
      case "404": return t.nfTitle;
      default: return navLabelD(kind, lang);
    }
  })();
  const cheio = kind === "home" ? brand : `${name} · ${brand}`;



  return META_TOPO.has(kind) ? edCfgTxt(lang, `v3.meta.${kind}.title`, cheio) : cheio;
}












const DESCD_FR = {
  home: "ABiL MEDiAS, atelier de communication à Genève: stratégie, identité, sites web, campagnes, réseaux sociaux et contenus, sous un même toit.",
  projets: "Les projets d'ABiL MEDiAS: identités, campagnes, sites web et éditions menés depuis notre atelier de la Rue de Berne, à Genève.",
  services: "Les six métiers d'ABiL MEDiAS: stratégie, identité, sites web, campagnes, réseaux sociaux et contenus, avec le périmètre de chacun.",
  agence: "ABiL MEDiAS, atelier genevois à équipe resserrée: qui nous sommes, comment nous travaillons et où nous trouver, Rue de Berne 59.",
  journal: "Le journal d'ABiL MEDiAS: des notes d'atelier sur la marque, le design, les sites web et la façon dont nous travaillons à Genève.",
  contact: "Écrivez à ABiL MEDiAS: un formulaire court, une réponse par une personne de l'atelier, Rue de Berne 59 à Genève, du lundi au vendredi.",
  etudes: "Toutes les études de cas d'ABiL MEDiAS: le contexte, la réponse de l'atelier et les images de chaque projet mené depuis Genève.",
  privacy: "Politique de confidentialité d'ABiL MEDiAS: quelles données nous recevons, où elles sont conservées, combien de temps et comment les effacer.",
  terms: "Conditions générales du site d'ABiL MEDiAS: accès, propriété intellectuelle, devis et prestations, responsabilité et droit applicable.",
  nf: "Cette adresse n'existe pas ou a changé. Revenez à l'accueil d'ABiL MEDiAS, ou écrivez-nous: nous vous mettrons sur la bonne page.",
  caseTail: "étude de cas d'ABiL MEDiAS: le contexte, la réponse de l'atelier et les images du projet, vus depuis notre bureau genevois.",
  svcTail: "un des six métiers d'ABiL MEDiAS: ce que couvre le périmètre, la méthode de l'atelier et les travaux liés, vus depuis Genève.",
  artLong: "Une note d'atelier signée ABiL MEDiAS, agence de communication à Genève, dans le journal.",
  artShort: "Une note d'atelier signée ABiL MEDiAS, à Genève.",
};
type DescStrings = typeof DESCD_FR;
const DESCD: Record<AbilLang, DescStrings> = {
  fr: DESCD_FR,
  en: {
    home: "ABiL MEDiAS, a communication studio in Geneva: strategy, identity, websites, campaigns, social media and content, all under one roof.",
    projets: "The projects of ABiL MEDiAS: identities, campaigns, websites and print work, made in our studio on Rue de Berne, in Geneva.",
    services: "The six crafts of ABiL MEDiAS: strategy, identity, websites, campaigns, social media and content, with the scope of each one.",
    agence: "ABiL MEDiAS is a Geneva studio with a tight team: who we are, how we work and where to find us, at Rue de Berne 59.",
    journal: "The journal of ABiL MEDiAS: studio notes on branding, design, websites and the way we work, written in Geneva.",
    contact: "Write to ABiL MEDiAS: a short form, an answer from someone in the studio, Rue de Berne 59 in Geneva, Monday to Friday.",
    etudes: "Every case study by ABiL MEDiAS: the context, the answer from the studio and the images of each project, made in Geneva.",
    privacy: "Privacy policy of ABiL MEDiAS: what data reaches us, where it is kept, for how long, and how to have it erased.",
    terms: "Terms and conditions of the ABiL MEDiAS website: access, intellectual property, quotes and services, liability and applicable law.",
    nf: "This address does not exist or has moved. Go back to the ABiL MEDiAS home page, or write to us and we will point you the right way.",
    caseTail: "a case study by ABiL MEDiAS: the context, the answer from the studio and the images of the project, seen from Geneva.",
    svcTail: "one of the six crafts of ABiL MEDiAS: what the scope covers, the method of the studio and the related work, seen from Geneva.",
    artLong: "A studio note from ABiL MEDiAS, a communication agency in Geneva, in the journal.",
    artShort: "A studio note from ABiL MEDiAS, in Geneva.",
  },
  pt: {
    home: "ABiL MEDiAS, ateliê de comunicação em Genebra: estratégia, identidade, sites, campanhas, redes sociais e conteúdos sob o mesmo teto.",
    projets: "Os projetos da ABiL MEDiAS: identidades, campanhas, sites e edições feitos a partir do nosso ateliê da Rue de Berne, em Genebra.",
    services: "Os seis ofícios da ABiL MEDiAS: estratégia, identidade, sites, campanhas, redes sociais e conteúdos, com o âmbito de cada um.",
    agence: "A ABiL MEDiAS é um ateliê de Genebra com equipa enxuta: quem somos, como trabalhamos e onde nos encontrar, na Rue de Berne 59.",
    journal: "O jornal da ABiL MEDiAS: notas de ateliê sobre marca, design, sites e a maneira como trabalhamos a partir de Genebra.",
    contact: "Escreva à ABiL MEDiAS: um formulário curto, resposta de uma pessoa do ateliê, na Rue de Berne 59 em Genebra, de segunda a sexta.",
    etudes: "Todos os estudos de caso da ABiL MEDiAS: o contexto, a resposta do ateliê e as imagens de cada projeto feito a partir de Genebra.",
    privacy: "Política de privacidade da ABiL MEDiAS: que dados nos chegam, onde ficam guardados, durante quanto tempo e como pedir que sejam apagados.",
    terms: "Condições gerais do site da ABiL MEDiAS: acesso, propriedade intelectual, orçamentos e serviços, responsabilidade e direito aplicável.",
    nf: "Este endereço não existe ou mudou de sítio. Volte ao início da ABiL MEDiAS, ou escreva-nos, que o levamos à página certa.",
    caseTail: "estudo de caso da ABiL MEDiAS: o contexto, a resposta do ateliê e as imagens do projeto, vistos a partir de Genebra.",
    svcTail: "um dos seis ofícios da ABiL MEDiAS: o que o âmbito cobre, o método do ateliê e os trabalhos ligados, vistos a partir de Genebra.",
    artLong: "Uma nota de ateliê da ABiL MEDiAS, agência de comunicação em Genebra, no jornal.",
    artShort: "Uma nota de ateliê da ABiL MEDiAS, em Genebra.",
  },
  de: {
    home: "ABiL MEDiAS, Kommunikationsatelier in Genf: Strategie, Identität, Websites, Kampagnen, Social Media und Inhalte unter einem Dach.",
    projets: "Die Projekte von ABiL MEDiAS: Identitäten, Kampagnen, Websites und Editionen aus unserem Atelier an der Rue de Berne in Genf.",
    services: "Die sechs Handwerke von ABiL MEDiAS: Strategie, Identität, Websites, Kampagnen, Social Media und Inhalte, mit dem Umfang von jedem.",
    agence: "ABiL MEDiAS ist ein Genfer Atelier mit kompaktem Team: wer wir sind, wie wir arbeiten und wo Sie uns finden, Rue de Berne 59.",
    journal: "Das Journal von ABiL MEDiAS: Notizen aus dem Atelier über Marke, Gestaltung, Websites und unsere Arbeitsweise in Genf.",
    contact: "Schreiben Sie ABiL MEDiAS: ein kurzes Formular, eine Antwort von einer Person aus dem Atelier, Rue de Berne 59 in Genf.",
    etudes: "Alle Fallstudien von ABiL MEDiAS: der Kontext, die Antwort des Ateliers und die Bilder jedes Projekts, entstanden in Genf.",
    privacy: "Datenschutzerklärung von ABiL MEDiAS: welche Daten bei uns ankommen, wo sie liegen, wie lange und wie Sie sie löschen lassen.",
    terms: "Allgemeine Bedingungen der Website von ABiL MEDiAS: Zugang, geistiges Eigentum, Offerten und Leistungen, Haftung und Recht.",
    nf: "Diese Adresse gibt es nicht oder sie hat gewechselt. Zurück zur Startseite von ABiL MEDiAS, oder schreiben Sie uns kurz.",
    caseTail: "eine Fallstudie von ABiL MEDiAS: der Kontext, die Antwort des Ateliers und die Bilder des Projekts, gesehen aus Genf.",
    svcTail: "eines der sechs Handwerke von ABiL MEDiAS: was der Umfang abdeckt, die Methode des Ateliers und verwandte Arbeiten aus Genf.",
    artLong: "Eine Notiz aus dem Atelier von ABiL MEDiAS, Kommunikationsagentur in Genf, im Journal.",
    artShort: "Eine Notiz aus dem Atelier von ABiL MEDiAS, in Genf.",
  },
  it: {
    home: "ABiL MEDiAS, atelier di comunicazione a Ginevra: strategia, identità, siti web, campagne, social media e contenuti sotto lo stesso tetto.",
    projets: "I progetti di ABiL MEDiAS: identità, campagne, siti web ed edizioni realizzati dal nostro atelier di Rue de Berne, a Ginevra.",
    services: "I sei mestieri di ABiL MEDiAS: strategia, identità, siti web, campagne, social media e contenuti, con il perimetro di ciascuno.",
    agence: "ABiL MEDiAS è un atelier ginevrino con una squadra compatta: chi siamo, come lavoriamo e dove trovarci, in Rue de Berne 59.",
    journal: "Il giornale di ABiL MEDiAS: note dell'atelier su marca, design, siti web e sul modo in cui lavoriamo da Ginevra.",
    contact: "Scrivete a ABiL MEDiAS: un modulo corto, la risposta di una persona dell'atelier, in Rue de Berne 59 a Ginevra, dal lunedì al venerdì.",
    etudes: "Tutti i casi studio di ABiL MEDiAS: il contesto, la risposta dell'atelier e le immagini di ogni progetto realizzato a Ginevra.",
    privacy: "Informativa sulla privacy di ABiL MEDiAS: quali dati riceviamo, dove restano, per quanto tempo e come chiederne la cancellazione.",
    terms: "Condizioni generali del sito di ABiL MEDiAS: accesso, proprietà intellettuale, preventivi e prestazioni, responsabilità e diritto.",
    nf: "Questo indirizzo non esiste o è cambiato. Tornate alla home di ABiL MEDiAS, oppure scriveteci e vi portiamo sulla pagina giusta.",
    caseTail: "caso studio di ABiL MEDiAS: il contesto, la risposta dell'atelier e le immagini del progetto, visti da Ginevra.",
    svcTail: "uno dei sei mestieri di ABiL MEDiAS: che cosa copre il perimetro, il metodo dell'atelier e i lavori collegati, visti da Ginevra.",
    artLong: "Una nota dell'atelier di ABiL MEDiAS, agenzia di comunicazione a Ginevra, nel giornale.",
    artShort: "Una nota dell'atelier di ABiL MEDiAS, a Ginevra.",
  },
};

export function v3dDocDescription(lang: AbilLang, kind: V3DPageKind, slug?: string): string {
  const d = DESCD[lang];


  const artigo = (titulo: string) => `${titulo}. ${titulo.length <= 60 ? d.artLong : d.artShort}`;
  switch (kind) {


    case "home": return edCfgTxt(lang, "v3.meta.home.description", d.home);
    case "projets": return edCfgTxt(lang, "v3.meta.projets.description", d.projets);
    case "services": return edCfgTxt(lang, "v3.meta.services.description", d.services);
    case "agence": return edCfgTxt(lang, "v3.meta.agence.description", d.agence);
    case "journal": return edCfgTxt(lang, "v3.meta.journal.description", d.journal);
    case "contact": return edCfgTxt(lang, "v3.meta.contact.description", d.contact);
    case "case-studies":
    case "etudes": return d.etudes;
    case "404": return d.nf;
    case "case": {
      const c = casoPublicado(slug || "") ?? V3D_CASES.find((x) => x.slug === slug);
      return c ? `${c.title}, ${d.caseTail}` : d.nf;
    }
    case "service": {
      const s = V3D_SERVICES.find((x) => x.slug === slug);
      return s ? `${edTxt(lang, `v3.service.${s.slug}.name`, s.name[lang], 160)}, ${d.svcTail}` : d.nf;
    }
    case "article": {

      const p = postDoJornal(slug || "") ?? ABIL_POSTS.find((x) => x.slug === slug);
      return p ? artigo(p.title[lang]) : d.nf;
    }
    case "legal":
      return slug === "conditions" ? d.terms : d.privacy;
    default: return d.home;
  }
}
