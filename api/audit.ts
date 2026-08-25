/* eslint-disable @typescript-eslint/no-explicit-any */
                                                                                                              
                                                                                                           
                                                                                                                        
                                                                                                                                              
                                                                                                
                                                                                                
                                                                                                             
                                                                                                             
                                                                                                          
                                                                                                
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { LEAD_SEGMENTS } from "../src/lib/leadSegments.js";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const config = { runtime: "nodejs", maxDuration: 60 };

const BLOB_PUBLIC_BASE = (process.env.BLOB_PUBLIC_BASE_URL || "").replace(/\/$/, "");
                                                                                        
const SITE = (process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app").replace(/\/$/, "");

                                                                                                                          
function authed(req: VercelRequest): boolean {
  const mk = req.headers["x-meta-admin"]; const mkv = Array.isArray(mk) ? mk[0] : mk;
  const AD = process.env.META_ADMIN_KEY || "";
  if (AD && mkv && mkv === AD) return true;
  const PW = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const gh = req.headers["x-abil-admin"]; const tok = Array.isArray(gh) ? gh[0] : gh;
  if (PW && tok && tok.indexOf(".") > 0) { const i = tok.indexOf("."); const exp = Number(tok.slice(0, i)); const sig = tok.slice(i + 1); if (exp && exp > Date.now()) { const want = crypto.createHmac("sha256", PW).update(String(exp)).digest("hex"); try { return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); } catch { return false; } } }
  return false;
}

function slugify(s: string): string { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "marque"; }
function normalizeAuditSlug(s: string): string { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96); }
function esc(s: any): string { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

                                                                                                              
                                                                                                                
                                                                                              
function scrubLead(text: string): string {
  if (!text) return text;
  const PHYS = /\b(fa[çc]ade|vitrine|devanture|magasin physique|comptoir|enseigne|d[ée]coration|accueil en personne|fachada|montra|loja f[íi]sica|balc[ãa]o|sinal[ée]tica|decora[çc][ãa]o|atendimento presencial|prateleira|shelf)\b/i;
  const OVER = /\b(d[ée]terr\w*|fouill\w*|analyse approfondie|j'?ai inspect\w*|desenterr\w*|vasculh\w*|analisei a fundo|an[áa]lise profunda|inspecion\w*|radiografei)\b/i;
  const NEG = /\b((votre|ta|tua|vossa|sua)\s+marque?\s+(est|é|e)\s+g[ée]n[ée]riqu|invis[íi]vel|logo\s+(sans personnalit|sem personalidade|fraco|g[ée]n[ée]riqu)|comme toutes les autres|igual\s+[àa]s\s+(outras|demais))/i;
  const kept = String(text).split(/(?<=[.!?…])\s+/).filter((s) => !PHYS.test(s) && !OVER.test(s) && !NEG.test(s));
  return kept.join(" ").replace(/\s*[\u2013\u2014]\s*/g, ", ").replace(/\s{2,}/g, " ").trim();
}

                                                                                                                
                                                                                                          
                                                                                                                     
                                                                                                    
const GOOGLE_ATTRIB_TXT: Record<string, string> = { fr: "Données du profil de l'entreprise sur Google", en: "Data from the company's Business Profile on Google", pt: "Dados do perfil da empresa no Google", it: "Dati del profilo dell'azienda su Google", de: "Daten aus dem Unternehmensprofil auf Google" };
function googleAttrib(lang: string): string {
  return `<p class="gattrib">${esc(GOOGLE_ATTRIB_TXT[lang] || GOOGLE_ATTRIB_TXT.fr)}</p>`;
}

async function readAudit(slug: string): Promise<any | null> {
  const key = `audits/${slug}.json`;
  let txt: string | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${key}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); } catch {  } }
  if (txt === null) { try { const { blobs } = await list({ prefix: key, limit: 1 }); const bl = blobs.find((x) => x.pathname === key); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } } catch {  } }
  if (!txt) return null;
  try { return JSON.parse(txt); } catch { return null; }
}
async function writeAudit(slug: string, data: any): Promise<void> {
  await put(`audits/${slug}.json`, JSON.stringify(data), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
}

                                                                                                                  
const SEG_CFG_KEY = "config/abil-seg-lp.json";
async function readSegConfig(): Promise<Record<string, { banner?: string; cases?: any[] }>> {
  let txt: string | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${SEG_CFG_KEY}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); } catch {  } }
  if (txt === null) { try { const { blobs } = await list({ prefix: SEG_CFG_KEY, limit: 1 }); const bl = blobs.find((x) => x.pathname === SEG_CFG_KEY); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } } catch {  } }
  if (!txt) return {};
  try { const j = JSON.parse(txt); return (j && typeof j === "object") ? j : {}; } catch { return {}; }
}
async function writeSegConfig(cfg: any): Promise<void> {
  await put(SEG_CFG_KEY, JSON.stringify(cfg || {}), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
}

                                                                                                                                                                                                                                    
                                                                                                         
                                                                                                      
                                                                                                      
                                                                                                        
  
                                                                                                    
                                                                                                     
                                                                                     
  
                                                                                                            
                                                                                                         
                                                                                             
                                                                                                     
                                                                                                          
                                                                                                          
                                                                                                             
                                                                                             
type SegCopy = { quem: string; comoText: string; analise: string; bio: string; ps: Record<string, string> };

const SEG_LABEL_FR: Record<string, string> = {
  pizzarias: "Pizzerias", hamburguerias: "Burgers", restaurantes: "Restauration", cervejarias: "Brasseries artisanales",
  vinicolas: "Vins et domaines", hotelaria: "Hôtellerie", estetica: "Esthétique et beauté", barbearias: "Barbiers",
  salao_beleza: "Salons de coiffure", dentistas: "Cabinets dentaires", petvet: "Animalerie et vétérinaire",
  academias: "Salles de sport", arquitetura: "Architecture et immobilier", engenharia: "Ingénierie",
  mobiliario: "Mobilier et décoration", fashion: "Mode et habillement", ecommerce: "E-commerce", saas: "Technologie et SaaS",
};
const SEG_BANNERS: Record<string, string> = {
  pizzarias: "/brand/kv-icon-yellow-2.jpg",
  hamburguerias: "/brand/kv-men-3.jpg",
  restaurantes: "/brand/kv-woman-4.jpg",
  cervejarias: "/brand/kv-logo-black-2.jpg",
  vinicolas: "/brand/kv-logo-yellow-3.jpg",
  hotelaria: "/brand/kv-woman-3.jpg",
  estetica: "/brand/kv-woman-4.jpg",
  barbearias: "/brand/kv-men-2.jpg",
  salao_beleza: "/brand/kv-woman-1.jpg",
  dentistas: "/brand/kv-icon-black-1.jpg",
  petvet: "/brand/kv-icon-yellow-2.jpg",
  academias: "/brand/kv-men-1.jpg",
  arquitetura: "/brand/kv-logo-black-1.jpg",
  engenharia: "/brand/kv-logo-black-3.jpg",
  mobiliario: "/brand/kv-icon-yellow-1.jpg",
  fashion: "/brand/kv-woman-2.jpg",
  ecommerce: "/brand/kv-men-3.jpg",
  saas: "/brand/kv-men-2.jpg",
};

const SEG_COPY_FR: Record<string, SegCopy> = {
  pizzarias: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Notre signature est un astérisque, et une pizza bien coupée lui ressemble étrangement : c'est peut-être pour cela que votre métier nous parle depuis toujours.",
    comoText: "Nous ne proposons rien avant d'avoir compris comment tourne une soirée chez vous : le coup de feu de 19h30, le four qui dicte le rythme, le téléphone qui sonne pendant qu'une commande sort. Nous regardons d'abord, nous parlons ensuite, jamais l'inverse. Cette lecture est gratuite et sans engagement : nous n'avons rien à vous vendre aujourd'hui.",
    analise: "Ce que vous lisez ici est notre regard d'atelier sur votre pizzeria, réuni sur une seule page : ce qui est déjà fort, et là où nous mènerions la marque. Nous l'écrivons dans l'ordre des cinq P, en commençant par la personnalité, parce que c'est elle qui décide de tout le reste. C'est une lecture honnête, à garder même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "Une pizzeria n'est jamais neutre : elle est napolitaine ou romaine, elle est la cantine du quartier ou la table du samedi soir, elle est le four à bois ou la pâte à longue maturation. La question n'est pas de savoir laquelle est la bonne, mais laquelle est la vôtre, et si un client qui pousse la porte le comprend en trois secondes. Quand la personnalité est claire, le nom, le ton au téléphone, la lumière de la salle et la boîte de livraison racontent la même histoire. Quand elle ne l'est pas, chacun raconte la sienne.",
      produto: "Nous regardons votre carte comme un client la regarde, pas comme la cuisine la connaît : combien de pizzas, dans quel ordre, laquelle vous voulez vraiment vendre, laquelle vous porte la marge. Une carte trop longue ralentit le four et brouille le message ; une carte tenue raconte une conviction. Nous regardons aussi ce qui arrive au produit après le four : la boîte, les vingt minutes de scooter, la pâte qui ramollit sous la buée. Ce que le client goûte chez lui fait partie du produit, même si vous ne le voyez pas manger.",
      pessoas: "Le pizzaiolo tient le rythme, mais la marque se joue souvent chez celui qui décroche le téléphone en plein rush et chez l'extra du samedi qui apprend la salle en marchant. Nous regardons ce que vos gens ont réellement en main pour bien faire : une carte lisible, une réponse honnête sur le temps d'attente, une phrase simple pour expliquer pourquoi votre pâte n'est pas celle d'à côté. Une équipe qui sait raconter la maison vend mieux que n'importe quelle affiche.",
      processos: "La réservation, la commande à emporter, la plateforme de livraison et sa commission, le délai annoncé : ce sont des décisions de marque autant que d'organisation. Nous comptons combien de gestes il faut à un client pour commander chez vous un vendredi à 19h, et nous regardons ce qui se passe quand la réponse est « une heure d'attente ». Nous regardons aussi qui possède la relation : vous, ou la plateforme qui garde le numéro du client et vous laisse la cuisson.",
      propaganda: "De tout ce que nous voyons passer, la pizza est l'un des plats les plus photographiés, ce qui rend la photo médiocre encore plus coûteuse : une part grise sur une nappe ne vend rien à personne. Nous regardons vos images, votre vitrine, votre ardoise, votre fiche Google et ce qu'un inconnu y voit en premier. La propagande vient en dernier parce qu'elle ne fait qu'amplifier : si les quatre P d'avant sont justes, il y a peu à dire et cela porte très loin.",
    },
  },
  hamburguerias: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Autrement dit, nous ne livrons pas une idée qu'un autre devra fabriquer : nous la pensons et nous la faisons, du premier croquis à la dernière impression.",
    comoText: "Nous entrons dans le métier avant de proposer quoi que ce soit : la file du vendredi soir, les frites qui n'attendent personne, le burger qui doit sortir chaud, net et identique au centième exemplaire. Nous regardons d'abord, nous parlons ensuite. Cette lecture est gratuite, sans engagement, et il n'y a rien à acheter au bout.",
    analise: "Ce que vous lisez ici est notre regard d'atelier sur votre maison, réuni sur une seule page : ce qui tient déjà debout, et là où nous mènerions la marque. Nous suivons l'ordre des cinq P, en commençant par la personnalité, parce que c'est elle qui commande les quatre autres. Rien à vendre : une lecture honnête, à garder dans tous les cas.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "Le burger est un plat que tout le monde propose, et à nos yeux l'écart réel se joue chez la maison qui le sert. Smash sec et rapide au comptoir, ou pièce de boucher épaisse à couper au couteau : ce sont deux marques opposées, et beaucoup d'enseignes essaient d'être les deux à la fois. Nous cherchons votre position à vous, celle qui explique le nom, la playlist, le mobilier, le papier autour du pain et jusqu'à la façon dont vous répondez à un avis. Sans cela, vous êtes une bonne adresse dont personne ne sait quoi dire.",
      produto: "Nous regardons le pain, la sauce maison, la cuisson que vous défendez et surtout la frite, parce que c'est souvent elle qui décide du souvenir. Nous regardons le nombre de burgers à la carte : au-delà d'un certain point, ce n'est plus un choix pour le client, c'est une hésitation de la maison. Et nous regardons le take-away sans complaisance : un burger dans un carton clos pendant douze minutes n'est plus le même produit, la vapeur fait le travail à votre place.",
      pessoas: "Derrière un burger, il y a une chaîne courte et tendue : la plancha, l'assemblage, la friteuse, la caisse. La marque se voit dans le regard de la personne qui tend le plateau et dans sa capacité à dire, en une phrase, d'où vient la viande. Nous regardons aussi les extras et les saisonniers : ils portent votre nom sans avoir eu le temps de l'apprendre, et personne ne leur a expliqué ce que la maison défend.",
      processos: "La file, la borne, le click and collect, le numéro qu'on appelle, le temps entre la commande et le plateau : chacun de ces moments écrit votre marque, en bien ou en mal. Nous regardons ce que vit un client qui attend quinze minutes sans savoir combien il lui reste à attendre. Nous regardons aussi l'emballage et la course du livreur, parce que, si vous livrez, une partie de vos clients ne mettra jamais les pieds chez vous et jugera tout sur un carton posé sur une table de cuisine.",
      propaganda: "Votre plat est photogénique, et c'est un piège : tout le monde photographie le même burger sous le même angle, avec la même lumière chaude et la même fondue de fromage. Nous regardons vos images, vos réseaux, votre carte au mur et votre fiche Google pour voir ce qui reste quand on enlève le produit. La propagande vient en dernier parce qu'elle amplifie : si la personnalité est nette, une photo suffit à vous reconnaître sans lire le nom.",
    },
  },
  restaurantes: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous connaissons les maisons où l'on travaille tôt et où l'on ferme tard, parce que nous en sommes une.",
    comoText: "Nous ne proposons rien avant d'avoir compris votre table : le service de midi qui n'a rien à voir avec celui du soir, la carte qui bouge avec la saison, la terrasse qui change tout de mai à septembre. Nous regardons d'abord, nous parlons ensuite. C'est une lecture courte, honnête et gratuite, sans aucun engagement.",
    analise: "Ce que vous lisez ici est notre regard d'atelier sur votre restaurant, réuni sur une seule page : ce qui est déjà fort, et là où nous mènerions la marque. Nous avançons dans l'ordre des cinq P, la personnalité en tête, parce qu'une table sans point de vue devient interchangeable avant même d'être mauvaise. Rien à vendre : gardez cette lecture même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "Un restaurant est un point de vue avant d'être une carte. Le vôtre existe, il est dans les choix du chef, dans ce que vous refusez de servir, dans la manière dont vous accueillez un client seul un mardi. Le problème est rarement l'absence de personnalité : c'est qu'elle vit dans la maison sans jamais sortir sur la façade, sur la carte ou sur la page que l'on consulte à 18h avant de choisir. Nous cherchons à la nommer, en quelques mots que vous pourriez dire vous-même à voix haute sans rougir.",
      produto: "Nous regardons la carte comme un document de marque : sa longueur, son ordre, ce qu'elle promet et ce qu'elle laisse dans l'ombre. Le menu du midi et la carte du soir parlent souvent à deux publics différents et se contredisent parfois. Nous regardons le vin au verre, les suggestions, la place laissée au produit local, et si tout cela raconte une intention ou seulement un historique. Un plat que vous gardez par habitude coûte plus cher qu'un plat que vous retirez.",
      pessoas: "En salle, votre marque n'est pas écrite, elle est jouée : par la personne qui prend la réservation au téléphone, par celle qui place un client, par celle qui explique un plat sans réciter. Nous regardons ce que l'équipe sait raconter de la maison, et ce qu'elle invente faute d'avoir jamais reçu les mots. Nous regardons aussi la relève et les saisonniers, qui portent votre nom quelques mois et repartent avec la moitié de votre histoire.",
      processos: "La réservation, le placement, le rythme du service, le moment de l'addition : ce sont les gestes qui font qu'un client revient ou pas, bien avant l'assiette. Nous regardons combien de temps il faut pour réserver chez vous et si c'est aussi simple à 23h qu'à midi. Nous regardons ce qui se passe quand la salle est pleine et qu'un habitué appelle, et ce qui se passe quand elle est vide un mercredi de novembre : les deux situations écrivent votre marque, la seconde plus que vous ne le croyez.",
      propaganda: "La communication d'une table honnête est souvent son maillon faible : de belles assiettes photographiées vite, un site qui date, un menu en PDF illisible sur un téléphone. Nous regardons vos photos, votre fiche Google, vos avis et vos réponses aux avis, parce que c'est là que vous parlez le plus, souvent sans le vouloir. La propagande vient en dernier parce qu'elle ne fait qu'amplifier ce que les quatre P ont établi : bien tenue, elle ne crie pas, elle confirme.",
    },
  },
  cervejarias: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production : un peu comme un bon comptoir, tout se décide au même endroit, entre gens qui se parlent. Notre signature est un astérisque, ce point qui rayonne dans toutes les directions à la fois.",
    comoText: "Nous ne proposons rien avant d'avoir compris votre maison : le rythme d'un vendredi qui monte à partir de 22h, les habitués qui ont leur place au bar, le soir de match où la salle bascule, le lundi où il y a trois personnes. Nous regardons d'abord, nous parlons ensuite. Cette lecture est gratuite et sans engagement, il n'y a rien à signer.",
    analise: "Ce que vous lisez ici est notre regard d'atelier sur votre établissement, réuni sur une seule page : ce qui est déjà solide, et là où nous mènerions la marque. Nous suivons l'ordre des cinq P, la personnalité d'abord, parce qu'un bar est d'abord une ambiance et seulement ensuite une carte. Rien à vendre : une lecture honnête, à garder dans tous les cas.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "On ne choisit pas vraiment un pub pour la bière, on choisit un pub pour ce qu'on y devient pendant deux heures. Refuge de fin de journée, salle de match, scène de concert, terrasse d'après-ski : chacune de ces maisons demande une lumière, un volume sonore et un accueil différents, et beaucoup essaient de les tenir toutes. Nous cherchons celle que vous êtes vraiment le vendredi à 22h, parce que c'est celle-là que les gens racontent le lendemain. Un lieu qui sait qui il est se remplit d'habitués ; un lieu qui hésite se remplit de passants.",
      produto: "Nous regardons vos pressions comme une prise de position : combien de lignes, lesquelles vous défendez, laquelle est là par habitude ou par contrat. Une carte de vingt bières que personne ne comprend dit moins qu'une sélection de huit qu'un barman peut raconter en dix secondes. Nous regardons aussi la mousse, le verre, la température, ce qu'il y a à manger à 23h, et si l'on peut boire autre chose qu'une bière sans se sentir de passage.",
      pessoas: "Derrière un comptoir, le personnel fait partie du produit autant que ce qui est servi : c'est souvent le barman qui fait revenir, pas le fût. Nous regardons ce que vos gens savent dire d'une bière qu'ils servent cinquante fois par soir, et comment ils gèrent l'habitué, le groupe bruyant et la personne seule au comptoir. Nous regardons aussi ce que l'équipe fait quand la salle est vide, parce que c'est ce moment-là qu'un nouveau client voit en entrant.",
      processos: "Le service au comptoir ou à table, la file du samedi, l'ardoise des habitués, la fermeture, le voisinage et le bruit à minuit : ce sont des choix de marque déguisés en logistique. Nous regardons votre calendrier réel, les soirs qui portent la semaine et ceux qui la coûtent, et ce que vous faites du mardi. Nous regardons aussi comment on apprend qu'il y a un concert chez vous jeudi : si l'information vit uniquement dans la tête de vos habitués, votre meilleure soirée reste un secret.",
      propaganda: "Un pub communique surtout par sa façade, sa lumière depuis la rue et le bruit qui en sort : le reste vient après. Nous regardons vos affiches de soirées, vos sous-bocks, votre ardoise, vos réseaux et si un inconnu comprend en deux secondes ce qui l'attend derrière la porte. La propagande vient en dernier parce qu'elle ne fait qu'amplifier : quand l'ambiance est juste, une simple étoile sur une affiche suffit à dire que c'est ce soir.",
    },
  },
  vinicolas: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous travaillons dans un canton où le vin n'est pas un secteur mais un paysage : le métier de la vigne est un monde que nous côtoyons depuis toujours, avec ses pentes, ses millésimes et sa patience.",
    comoText: "Nous ne proposons rien avant d'avoir compris le domaine : les parcelles et leur pente, ce que vous choisissez de vinifier et ce que vous refusez, le millésime qui décide sans demander l'avis de personne. Nous regardons d'abord, nous parlons ensuite. Cette lecture est gratuite, sans engagement, et n'appelle aucune suite.",
    analise: "Ce que vous lisez ici est notre regard d'atelier sur votre domaine, réuni sur une seule page : ce qui est déjà fort, et là où nous mènerions la marque. Nous avançons dans l'ordre des cinq P, en commençant par la personnalité, parce qu'un domaine se vend sur une conviction bien avant de se vendre sur une note. Rien à vendre : gardez cette lecture même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "Un domaine porte souvent un nom de famille, ce qui est une force et un piège : la force, c'est qu'il y a quelqu'un derrière ; le piège, c'est qu'un nom de famille sur une étiquette ne distingue plus rien dès qu'on en aligne plusieurs côte à côte. La question n'est pas votre histoire, c'est ce que vous en dites : le vigneron qui a repris après son père, la parcelle que tout le monde vous déconseillait, le cépage que vous continuez de défendre. Nous cherchons la conviction qui tient debout sans dégustation, celle qui donne envie d'ouvrir la bouteille avant de l'avoir goûtée. Sans elle, il ne reste que le prix pour vous distinguer, et c'est la pire des conversations.",
      produto: "Nous regardons votre gamme comme un client la découvre, sans connaître la maison : combien de cuvées, dans quel ordre, laquelle vous représente et laquelle existe surtout parce qu'elle a toujours existé. Fendant, petite arvine, cornalin, humagne, syrah : chaque nom porte déjà un imaginaire, et l'étiquette décide si vous l'endossez ou si vous le subissez. Nous regardons l'étiquette comme le seul vendeur présent sur un linéaire ou sur une carte de restaurant, à trois secondes d'attention, au milieu d'autres bouteilles qui se battent pour la même seconde. Et nous regardons la cohérence entre le haut et le bas de gamme, parce qu'une entrée de gamme mal habillée abîme la cuvée que vous soignez le plus.",
      pessoas: "Un domaine, c'est deux ou trois personnes qui font tout : la vigne, la cave, le caveau, l'administration et parfois le camion. La marque se joue au caveau, dans les vingt minutes où quelqu'un reçoit un visiteur, et dans la façon dont on raconte une parcelle sans réciter une fiche technique. Nous regardons ce que la relève apporte et ce qu'elle n'ose pas encore changer, parce que ce point de tension est presque toujours l'endroit où la marque doit avancer.",
      processos: "La vente directe, le caveau, l'expédition, la carte des restaurants, le salon, l'export : ce sont des canaux qui ne demandent ni le même discours ni le même matériel, et beaucoup de domaines leur servent le même. Nous regardons ce qui se passe quand quelqu'un veut acheter deux cartons depuis Zurich un dimanche soir, et combien de gestes il lui faut. Nous regardons aussi la mémoire du client : qui garde le contact de celui qui est venu une fois, s'est enthousiasmé, et n'a plus jamais eu de vos nouvelles.",
      propaganda: "Dans le vin, la communication ment facilement, et c'est justement pour cela que l'honnêteté s'y remarque. Nous regardons vos étiquettes, vos photos, votre site, vos fiches et si l'on comprend, sans vocabulaire de dégustation, pourquoi ce vin existe. La propagande vient en dernier parce qu'elle ne fait qu'amplifier : quand la personnalité est claire, une étiquette suffit à faire le travail d'un discours.",
    },
  },
  hotelaria: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous vivons dans une vallée qui accueille des voyageurs depuis toujours : nous savons ce que la saison fait à une maison, et ce qu'elle fait aux gens qui la tiennent.",
    comoText: "Nous ne proposons rien avant d'avoir compris votre maison : la saison qui décide de l'année, l'entre-saison qui n'oublie personne, le client qui revient depuis quinze ans et celui qui vous découvre sur un écran à minuit. Nous regardons d'abord, nous parlons ensuite. C'est une lecture courte, honnête et gratuite, sans aucun engagement.",
    analise: "Ce que vous lisez ici est notre regard d'atelier sur votre hôtel, réuni sur une seule page : ce qui est déjà fort, et là où nous mènerions la marque. Nous suivons l'ordre des cinq P, la personnalité en tête, parce qu'un hôtel sans point de vue devient une ligne de résultats de recherche triée par prix. Rien à vendre : une lecture honnête, à garder dans tous les cas.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "Sur une plateforme de réservation, vous n'êtes plus un hôtel, vous êtes une vignette, un prix et une note : la seule défense possible est d'être quelqu'un. Maison de famille, refuge de montagne, adresse pour ceux qui travaillent en semaine, halte de passage : chacune promet une chose différente au voyageur, et beaucoup promettent tout à la fois, donc rien. Nous cherchons la promesse que votre maison tient vraiment un mardi de novembre, pas seulement en photo au mois de février. Une personnalité claire vous fait choisir avant la comparaison des prix, ce qui est le seul endroit où l'on gagne.",
      produto: "Le produit d'un hôtel n'est pas la chambre, c'est la journée du client, du moment où il pose ses bagages à celui où il repart. Nous regardons donc les vrais points d'appui : le lit, la douche, le silence, la lumière du matin, le petit déjeuner qui décide de l'humeur, et ce qu'il reste quand il pleut trois jours. Nous regardons aussi ce que vous vendez sans le savoir : une vue, une terrasse, un bar où les clients se parlent, un conseil sur la vallée qu'aucune application ne donne.",
      pessoas: "Un hôtel est tenu par des gens dont une partie change à chaque saison, et pourtant chacun d'eux est la marque pendant la minute où il croise un client. Nous regardons ce que la réception a en main pour bien accueillir : de quoi répondre, de quoi raconter la maison, de quoi régler un problème sans demander la permission. Nous regardons aussi les équipes qu'on ne voit jamais, celles qui font la chambre : leur travail est ce dont le client parle le plus, en bien comme en mal.",
      processos: "Le check-in, la réservation directe, la commission des plateformes, l'annulation, la relance après le séjour : ce sont les endroits où vous perdez de la marge et de la relation en même temps. Nous regardons combien de gestes il faut pour réserver chez vous directement, et si cela vaut vraiment la peine par rapport à trois clics ailleurs. Nous regardons aussi ce que vous savez de celui qui revient chaque année : s'il faut qu'il se présente à nouveau, la plateforme le connaît mieux que vous.",
      propaganda: "L'hôtellerie est un secteur où l'on communique beaucoup et où l'on ressemble énormément : les mêmes photos grand angle, les mêmes serviettes pliées, le même coucher de soleil. Nous regardons vos images, votre site, vos fiches et vos réponses aux avis, parce que c'est souvent là que votre voix apparaît pour la première fois. La propagande vient en dernier parce qu'elle ne fait qu'amplifier : une maison qui sait qui elle est n'a pas besoin de promettre l'exception, il lui suffit de la montrer.",
    },
  },
  estetica: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous travaillons les marques comme un métier de main, avec le temps qu'il faut, et nous préférons comprendre avant de proposer.",
    comoText: "Avant d'écrire la moindre ligne, nous entrons dans le métier. Pour un institut, cela veut dire regarder ce qui se joue vraiment en cabine : la cliente qui n'ose pas dire ce qui la gêne, la promesse qui doit tenir jusqu'au miroir du lendemain, la retenue de ne pas survendre un soin. Puis nous vous disons ce que nous voyons, sans détour et sans rien à vendre.",
    analise: "Cette lecture est une page, pas un dossier : ce qui est déjà fort dans votre maison, et là où nous mènerions la marque si elle était entre nos mains. Elle ne demande ni budget, ni décision, ni rendez-vous. Elle vous appartient, à garder même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le P qui commande, et de loin. Dans l'esthétique, les vitrines disent souvent la même chose : bien-être, éclat, parenthèse, cocon. Une marque d'institut n'existe que si elle a un tempérament assumé : la rigueur presque clinique ou la douceur du rituel, la discrétion absolue ou la franchise qui recadre. Nous cherchons d'abord qui vous êtes quand la porte de la cabine se referme, parce que tout le reste, les mots, les images, les prix, en découle.",
      produto: "Votre produit n'est pas une ligne sur une carte de prix, c'est une heure de la vie de quelqu'un. La plupart des instituts parlent en appareils et en protocoles, alors que la cliente, elle, achète un résultat qu'elle regardera seule dans sa salle de bains le lendemain. Nous regardons comment vos soins sont nommés, ordonnés et racontés, et à quel moment le vocabulaire technique éloigne au lieu de rassurer.",
      pessoas: "En institut, la marque tient dans deux mains et dans une voix d'accueil. Tout se décide dans les premières minutes : la cliente dira ce qui la préoccupe vraiment, ou bien elle prendra le soin le plus anodin de la carte et ne reviendra pas. Nous cherchons ce que vos esthéticiennes savent faire et que personne ne raconte à l'extérieur : lire une peau, poser la bonne question, oser dire non à un soin qui ne servirait à rien.",
      processos: "La cabine vide du mardi matin, le rendez-vous annulé la veille, la cliente venue une fois et jamais revue : ce sont des questions de marque autant que d'agenda. Nous suivons le chemin complet, de la première recherche sur le téléphone jusqu'au message qui suit le soin, et nous cherchons l'endroit exact où la promesse se perd. Le plus souvent, elle ne se perd pas en cabine, elle se perd avant ou après.",
      propaganda: "Le beau ne se prouve pas avec des images de banque achetées, où l'on voit toujours la même femme au peignoir blanc. Ce qui convainc, ce sont vos mains, votre lumière, vos vraies clientes et une parole qui ne promet jamais plus que ce que la cabine peut tenir. Nous regardons votre vitrine, vos photos, vos réseaux et votre bouche-à-oreille comme un seul et même discours, et nous vous disons s'il raconte la même maison.",
    },
  },
  barbearias: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Un atelier, pas une agence de passage : nous préférons la main au discours.",
    comoText: "Nous commençons toujours par le métier, jamais par la marque. Chez un barbier, cela veut dire regarder le fauteuil, la file du samedi, ce que le client vient chercher en plus de la coupe, et pourquoi il revient chez vous plutôt qu'à trois rues d'ici. Ensuite nous vous disons franchement ce que nous voyons. Rien à vendre sur cette page.",
    analise: "Cette lecture tient sur une page : ce qui est déjà juste chez vous, et là où nous mènerions l'enseigne si elle était entre nos mains. Aucun engagement, aucun devis derrière, aucun rendez-vous à prendre. Vous la gardez, même si nous n'en reparlons jamais.",
    bio: "ABiL, atelier indépendant à Genève, depuis 2015. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le P qui commande. Un barbier n'est pas un commerce, c'est un lieu : on y revient sans qu'on nous le demande, on y parle, on y amène son fils un jour. Le marché s'est rempli de la même mise en scène, néons, briques, tatouages, whisky, et cette copie a fini par ne plus rien dire à personne. Nous cherchons votre ton à vous : le silence respectueux ou la conversation, le vieux salon de village ou l'atelier d'artisan, la tradition ou la coupe nette d'aujourd'hui. Un client choisit un caractère, pas une paire de ciseaux.",
      produto: "Une coupe, un contour de nuque, une barbe taillée au millimètre : sur le papier, tout le monde vend la même chose. La différence est ailleurs, dans le rasage à l'ancienne que peu savent encore faire, dans la serviette chaude, dans le fait de reprendre gratuitement une coupe qui n'est pas tombée juste. Nous regardons votre carte et nous cherchons ce qui y est bradé sans le savoir, et ce qui mériterait d'être nommé comme un métier plutôt que comme un service.",
      pessoas: "Chez un barbier, le client est fidèle à un homme avant d'être fidèle à une enseigne. C'est une force et c'est un risque : le jour où la personne part, une partie de la clientèle part avec elle. Nous regardons comment votre équipe est présentée, ou pas présentée du tout, et comment faire pour que la maison ait un nom aussi fort que celui du meilleur fauteuil.",
      processos: "Le walk-in du samedi qui déborde, le mardi qui dort, le client qui reste debout à la porte parce qu'il ne sait pas s'il peut entrer sans rendez-vous : tout cela se voit de l'extérieur, et tout cela parle de vous. Nous suivons le trajet d'un homme qui ne vous connaît pas encore, depuis la recherche sur son téléphone jusqu'au moment où il s'assied. La marque se joue souvent avant même qu'il pousse la porte.",
      propaganda: "La bonne publicité d'un barbier ne s'achète pas, elle se filme dans son propre fauteuil. Les mains, le bruit de la tondeuse, la nuque nette, la tête que fait un homme qui se relève : c'est cela qui donne envie, pas une photo de mannequin importée. Nous regardons vos réseaux, votre enseigne et vos avis en ligne comme une seule voix, et nous vous disons si cette voix ressemble vraiment à ce qui se passe chez vous.",
    },
  },
  salao_beleza: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous aimons les maisons de métier, celles où le savoir-faire est réel et où il manque seulement les mots pour le dire.",
    comoText: "Nous ne proposons rien avant d'avoir compris le salon. Cela veut dire regarder ce qui se passe au bac et devant le miroir : la cliente qui arrive avec une photo, le diagnostic couleur qu'on n'ose pas contredire, le temps de pose pendant lequel tout se joue, la peur du changement. Ensuite, nous vous disons ce que nous voyons, honnêtement, sans rien à vendre.",
    analise: "C'est une lecture, pas une proposition commerciale : ce qui est déjà fort dans votre salon, et là où nous mènerions la marque si elle nous était confiée. Gratuite, courte, sans engagement. Elle est à vous, même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, agence de communication indépendante à Genève. Stratégie, direction artistique et production sous un même toit. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le P qui commande. Les salons promettent presque tous l'écoute, le naturel et le sur-mesure, et à force, plus personne ne promet quoi que ce soit. Il faut choisir : la maison qui ose contredire la photo apportée par la cliente, ou celle qui exauce sans discuter. Le salon de quartier où l'on connaît trois générations, ou l'atelier de coloriste qui ne fait qu'une chose et la fait exceptionnellement. Nous cherchons ce tempérament d'abord, parce que sans lui, les images et les prix ne disent rien.",
      produto: "Une couleur n'est pas un produit, c'est une décision que la cliente porte tous les jours pendant des semaines. Pourtant les cartes de salon ressemblent à des listes de pièces détachées : coupe, brushing, mèches, soin, chaque ligne au prix le plus bas possible, comme s'il fallait s'excuser. Nous regardons comment vos prestations sont construites et racontées, et où votre expertise la plus rare est vendue au prix de la plus banale.",
      pessoas: "Dans la coiffure, la relation est presque intime : on touche, on écoute, on entend des choses que personne d'autre n'entend. La cliente est fidèle à sa coiffeuse plus qu'au salon, et une jeune qui part emporte souvent son carnet avec elle. Nous regardons comment votre équipe existe aux yeux du dehors, et comment la maison peut porter un nom fort sans effacer celles qui la font vivre.",
      processos: "La consultation bâclée faute de temps, la photo Instagram impossible à reproduire sur cette base, la cliente déçue qui ne dit rien et ne revient pas : ce sont des ruptures de marque, pas seulement de planning. Nous suivons le parcours entier, de la prise de rendez-vous jusqu'au message qui devrait suivre une couleur importante, et nous cherchons l'endroit où la confiance se casse. Souvent, elle se casse dans les cinq minutes avant le premier coup de ciseaux.",
      propaganda: "Une coiffure se prouve en photo, mais pas n'importe laquelle. Les avant-après honnêtes, sur de vraies têtes, dans votre lumière et pas dans un studio importé, valent plus que toutes les images achetées. Nous regardons vos réseaux, votre vitrine et votre bouche-à-oreille comme un seul discours, et nous vous disons si ce discours promet un salon que le vôtre peut tenir.",
    },
  },
  dentistas: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous travaillons avec sobriété, et nous savons qu'un cabinet ne se raconte pas comme un commerce.",
    comoText: "Nous commençons par comprendre, jamais par proposer. Pour un cabinet dentaire, cela veut dire regarder ce qui précède le fauteuil : la personne qui repousse depuis des mois, le devis qu'elle relit chez elle sans oser poser de question, le mot d'accueil qui décide de tout. Ensuite nous vous disons ce que nous voyons, simplement. Rien à vendre ici.",
    analise: "Cette lecture porte sur la marque et sur la relation, jamais sur la pratique clinique, qui ne nous appartient pas. Elle tient sur une page : ce qui est déjà juste chez vous, et là où nous mènerions le cabinet si nous en avions la charge. Sans engagement, à garder même si nous n'en reparlons jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le P qui commande, même ici, et peut-être surtout ici. Les mêmes phrases reviennent d'un cabinet à l'autre : à l'écoute, technologies modernes, votre sourire entre de bonnes mains. Il reste alors le hasard et la proximité pour décider. Un cabinet a pourtant un caractère : la pédagogie patiente qui explique tout deux fois, la franchise qui déconseille un acte, le calme absolu pour ceux que le fauteuil terrifie, la précision d'une pratique très spécialisée. Nous cherchons ce caractère, et nous le formulons sans jamais promettre le moindre résultat clinique.",
      produto: "Ce que reçoit un patient ne se résume pas à un acte inscrit sur une facture. Il reçoit une explication, ou pas, un choix compris, ou subi, et une somme qu'il doit accepter sans pouvoir en juger la valeur. La plupart des sites de cabinet listent des disciplines dans le langage du métier, ce qui rassure les confrères et laisse les patients devant un mur. Nous regardons comment vos soins sont expliqués, et où le vocabulaire crée de la distance au lieu de la clarté.",
      pessoas: "Un cabinet, ce sont des praticiens, une hygiéniste, une assistante et une réception, et le patient les vit comme une seule personne. Le ton employé au téléphone quand quelqu'un appelle avec une douleur en dit plus long que n'importe quelle page de présentation. Nous regardons comment votre équipe est rendue visible, et si ce qui se passe réellement à l'accueil correspond à ce que la marque laisse entendre.",
      processos: "La salle d'attente, le rappel oublié, le devis remis sans un mot d'accompagnement, le silence après un traitement long : chacun de ces moments construit ou abîme la confiance. Nous suivons le parcours complet, du premier appel jusqu'au suivi, et nous cherchons les endroits où le patient reste seul avec ses questions. Ce sont presque toujours les mêmes.",
      propaganda: "En santé, la retenue est plus convaincante que la mise en scène. Pas de sourires importés, pas de superlatifs, pas de promesses : un ton clair, des mots que l'on comprend en salle d'attente, et la vérité sur ce qui va se passer. Nous regardons votre site, votre signalétique et le peu que vous dites publiquement, et nous vous disons si cela inspire ce que votre cabinet inspire vraiment.",
    },
  },
  petvet: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous aimons les métiers où l'on répond de ce que l'on fait, et le vôtre en est un.",
    comoText: "Nous entrons dans le métier avant de parler de marque. Chez vous, cela veut dire comprendre ce qui se passe dans la salle d'attente, quand un chat panique dans sa caisse et qu'un propriétaire attend un mot rassurant, et ce qui se passe en consultation quand la nouvelle est mauvaise et que la facture arrive juste après. Ensuite, nous vous disons franchement ce que nous voyons. Rien à vendre.",
    analise: "Cette lecture tient sur une seule page : ce qui est déjà fort chez vous, et là où nous mènerions la marque si elle nous était confiée. Elle est courte, honnête et gratuite, sans aucun engagement derrière. Elle vous reste, même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève, depuis 2015. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le P qui commande. Les cliniques et les animaleries affichent souvent la même image : un chiot, un chaton, le mot passion. Résultat, peu se distinguent et il ne reste que la distance et le prix. Or vous avez forcément un caractère : la fermeté qui ose dire à un maître que son chien est en surpoids, la douceur avec les animaux âgés, la vocation rurale et le travail au milieu de la nuit, la spécialisation qui vous fait recommander de loin. Nous cherchons ce tempérament d'abord, car c'est lui qui fait qu'on vous choisit avant même d'avoir besoin de vous.",
      produto: "Un vaccin, une stérilisation, un sac de croquettes : vu du dehors, ce sont des lignes de prix comparables en ligne en trente secondes. Ce que le propriétaire achète en réalité, c'est de ne pas se tromper au sujet d'un membre de sa famille qui ne parle pas. Nous regardons comment vos prestations et vos conseils sont présentés, et où la valeur réelle, le temps donné, l'examen approfondi, le refus d'un acte inutile, disparaît derrière un tarif.",
      pessoas: "Personne n'oublie le vétérinaire qui a pris le temps de s'accroupir au niveau du chien, ni celui qui a annoncé la fin avec les bons mots. Votre équipe encaisse aussi la culpabilité, la peur et parfois la colère des propriétaires, et cela ne se voit nulle part dans la communication. Nous regardons comment vos praticiens, vos assistants et le comptoir existent aux yeux du public, et ce que votre humanité mériterait qu'on dise d'elle.",
      processos: "L'urgence du samedi, l'attente avec un animal qui tremble, le rappel de vaccin envoyé ou pas, le devis annoncé trop tard : chaque friction touche quelqu'un qui a déjà peur. Nous suivons le parcours du propriétaire, de la recherche affolée sur son téléphone jusqu'au suivi après une opération, et nous cherchons l'endroit précis où il se sent laissé seul. C'est là que la fidélité se gagne ou se perd.",
      propaganda: "Dans votre métier, la photo mignonne est un piège : elle plaît, elle est partagée, et elle ne dit rien de votre sérieux. Ce qui donne confiance, c'est votre voix quand vous expliquez, la clarté sur ce que coûte un soin, et le conseil donné sans rien vendre. Nous regardons vos réseaux, votre site et vos avis en ligne comme un seul discours, et nous vous disons s'il inspire la même confiance que vous en consultation.",
    },
  },
  academias: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous ne courons pas après les modes, nous construisons des marques qui tiennent dans la durée.",
    comoText: "Nous commençons par le terrain, pas par la campagne. Pour une salle, cela veut dire regarder ce qui se passe le premier jour, quand quelqu'un pousse la porte sans savoir se servir d'une machine et prie pour que personne ne le remarque, et ce qui se passe le jour où il cesse de venir sans rien dire. Puis nous vous disons ce que nous voyons, sans détour et sans rien à vendre.",
    analise: "C'est une lecture de votre marque sur une page : ce qui est déjà solide chez vous, et là où nous la mènerions si elle nous était confiée. Pas de devis, pas d'engagement, pas de suite obligatoire. Elle est à vous, même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le P qui commande. Le secteur oscille entre deux caricatures, le low cost sans visage et la performance criée en majuscules, et les deux finissent par se ressembler. Une salle doit choisir son camp et l'assumer : la maison de quartier où l'on connaît tout le monde, l'exigence sportive qui ne fait pas de cadeau, la porte grande ouverte pour ceux qui n'ont jamais mis les pieds dans un vestiaire. Nous cherchons d'abord ce tempérament, parce qu'un abonnement se résilie facilement, mais on ne quitte pas un endroit auquel on appartient.",
      produto: "Vous ne vendez pas des machines ni des mètres carrés, vous vendez la probabilité que quelqu'un revienne. Pourtant presque tout le marché communique sur l'équipement et sur le prix de l'abonnement, c'est-à-dire sur ce que le voisin peut copier en une semaine. Nous regardons comment vos formules, vos cours et votre accompagnement sont construits, et où votre offre parle aux convaincus alors que votre croissance dépend de ceux qui hésitent encore.",
      pessoas: "Un coach qui retient un prénom et remarque une absence vaut plus que n'importe quelle machine neuve. Vos équipes portent la partie la plus difficile du métier : rassurer celui qui a honte, ralentir celui qui va se blesser, garder celui qui s'ennuie. Nous regardons si ces personnes existent dans votre communication ou si elles restent invisibles derrière des photos d'haltères.",
      processos: "L'inscription plus compliquée qu'il ne faudrait, les premières semaines sans le moindre accompagnement, le vestiaire, l'affluence de dix-huit heures, et surtout l'abonnement qui dort et que l'on finit par résilier avec un peu de rancune. Ce sont des questions de marque avant d'être des questions d'exploitation. Nous suivons le parcours entier, de la première visite du site jusqu'à la troisième semaine, celle où presque tout se joue, et nous cherchons où le membre décroche.",
      propaganda: "Les corps parfaits en photo attirent ceux qui s'entraînent déjà et font fuir la plupart des autres. Ce qui convainc, ce sont vos membres réels, vos coachs, votre lumière, et une parole qui promet un premier pas plutôt qu'un miracle. Nous regardons vos réseaux, votre façade et votre discours d'accueil comme un seul message, et nous vous disons à qui il parle vraiment aujourd'hui.",
    },
  },
  arquitetura: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous travaillons un peu comme vous : rien ne se construit avant d'avoir été pensé, et rien ne se pense hors de son terrain.",
    comoText: "Avant de proposer quoi que ce soit, nous entrons dans le métier. Nous regardons vos projets livrés, la manière dont vous les racontez, et ce qu'un maître d'ouvrage comprend de vous en trois minutes sur votre site. Ensuite seulement, nous vous rendons une lecture courte et honnête, avec rien à vendre.",
    analise: "Cette lecture tient sur une page : ce qui est déjà fort dans votre marque, et là où nous la mènerions. Ce n'est ni un audit technique ni une offre déguisée, c'est un regard extérieur sur la façon dont votre bureau se donne à voir. Vous la gardez, même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, atelier créatif indépendant à Genève. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le point de départ, et pour nous le plus important des cinq. Les bureaux finissent par se ressembler : mêmes photos au grand angle, même béton, même mot «contemporain». Vous n'êtes pourtant pas contemporains, vous êtes quelqu'un : une façon de tenir une pente, de traiter la lumière courte d'un hiver, de dire non à un client. Tant que cette personnalité n'est pas nommée, le site, le dossier et le concours restent interchangeables.",
      produto: "Un bureau d'architectes ne vend pas des plans, il vend la certitude que le bâtiment tiendra la promesse du dessin. Or vos réalisations sont presque toujours présentées de la même façon : de belles galeries d'images, muettes. Un projet mérite son intention, son contexte, la contrainte que vous avez résolue et que personne ne voit. C'est précisément là que se décide un mandat.",
      pessoas: "Vos clients ne parlent pas votre langue. Un particulier qui construit une seule fois dans sa vie n'a pas peur du budget, il a peur de se tromper et de vivre trente ans avec cette erreur. Une commune, un jury de concours ou un investisseur cherchent autre chose : la preuve que vous tiendrez le calendrier et le crédit. Une marque d'architecte doit parler à ces trois personnes sans jamais les confondre.",
      processos: "Entre le premier téléphone et le premier rendez-vous, il y a un vide que personne n'a jamais conçu. Nous regardons ce chemin comme on lit un plan : par où l'on entre, ce que l'on trouve, ce que l'on comprend, où l'on hésite. Vos phases de mandat sont limpides pour vous et opaques pour celui qui paie. Rendre le processus lisible rassure plus sûrement que n'importe quelle image de synthèse.",
      propaganda: "Un bureau d'architectes ne fait pas de publicité, il fait des preuves. Le dossier de concours, la plaque de chantier, la photo publiée, la conférence, la visite : chacun est déjà une prise de parole, la plupart du temps sans direction. Nous regardons si tout cela raconte la même chose ou six choses différentes. Le but n'est pas d'être vu partout, c'est d'être reconnu par les quelques maîtres d'ouvrage qui comptent cette année.",
    },
  },
  engenharia: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production, ce qui, dans votre langage, revient à avoir le bureau et l'atelier dans la même maison. Nous sommes un atelier de Genève, et nous connaissons les métiers où la parole donnée se tient d'abord sur le chantier.",
    comoText: "Nous ne proposons rien avant d'avoir compris comment vous gagnez vos affaires : les soumissions, le bouche-à-oreille, les mandats qui reviennent. Nous regardons votre entreprise depuis l'extérieur, comme la regardent un maître d'ouvrage et un futur apprenti. Puis nous vous rendons une lecture honnête, en une page, avec rien à vendre.",
    analise: "Une page : ce qui est déjà solide, et là où nous mènerions la marque. Rien de théorique, rien qui vous engage, aucune suite obligatoire. C'est une lecture à garder même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, Genève. Stratégie, direction artistique et production, sous un même toit.",
    ps: {
      personalidade: "Pour nous, c'est le premier P, celui qui commande tous les autres. Dans ce métier, les mêmes mots reviennent d'une entreprise à l'autre : qualité, sécurité, délais, respect. Ce sont des conditions d'entrée, pas une identité. Ce qui vous distingue est ailleurs : une manière d'attaquer un terrain que d'autres refusent, une parole tenue quand il aurait été plus simple de renégocier, une équipe qui reste au chantier à la nuit tombante parce que le béton n'attend pas. Tant que cela n'est pas dit clairement, vous restez une ligne dans un tableau comparatif.",
      produto: "Votre produit devient invisible dès qu'il est terminé : un mur de soutènement, une conduite, une dalle, une route que personne ne remarque tant qu'elle tient. Le prix, lui, se voit tout de suite, et c'est sur lui que tout se décide quand le reste n'est pas dit. Nous regardons si votre savoir-faire est raconté quelque part, ou s'il ne vit que dans la tête de vos contremaîtres. Une entreprise qui ne sait dire que son tarif sera comparée sur son tarif.",
      pessoas: "Vous avez deux publics et un seul discours. D'un côté les maîtres d'ouvrage, les architectes et les communes qui adjugent. De l'autre les femmes et les hommes que vous cherchez à engager, machinistes, maçons, apprentis, chefs d'équipe, qui choisissent une entreprise comme on choisit une équipe. Une marque de construction qui ne parle qu'aux premiers perd les seconds, et ce sont eux qui livrent le chantier.",
      processos: "Entre l'adjudication et la réception, il y a des mois de silence pour le client, et il remplit ce silence tout seul, souvent mal. Nous regardons vos points de contact : l'offre, le panneau de chantier, le rapport, le mot aux riverains, la remise des clés. Chacun rassure ou inquiète, aucun n'est neutre. Ce sont les vrais supports de votre marque, bien avant le site.",
      propaganda: "Vos meilleures affiches sont déjà plantées dans le paysage : vos panneaux, vos machines, vos camions, vos gilets, vos barrières. La plupart du temps, elles portent un logo et rien d'autre. Nous regardons cette flotte comme un média, parce que c'en est un : vu chaque jour par ceux que vous voulez convaincre et par ceux que vous voulez engager. Le site, l'offre et le dossier viennent après.",
    },
  },
  mobiliario: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Un atelier parle bien à un autre atelier : nous savons ce que coûte une finition parfaite que personne ne remarquera jamais.",
    comoText: "Nous entrons d'abord dans la matière : ce que vous fabriquez ou sélectionnez, ce qui se joue en showroom et ce qui se joue en ligne, ce qui fait signer et ce qui fait fuir. Nous n'arrivons pas avec une idée toute faite. Nous vous rendons ensuite une lecture honnête, en une page, avec rien à vendre.",
    analise: "Ce n'est ni un audit ni une proposition commerciale : c'est une page qui dit ce qui est déjà fort dans votre marque, et là où nous la mènerions. Vous y gagnez un regard extérieur, celui d'un client qui n'a jamais poussé votre porte. Elle est à garder, même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, un atelier qui parle aux ateliers. Des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le P qui commande tous les autres, et c'est celui que le mobilier oublie le plus vite. Le mot «design» ne distingue plus personne, du fabricant de la vallée au géant du meuble en kit. Vous, vous avez un parti pris : une essence que vous refusez, une ligne que vous ne dessinerez jamais, une durée que vous assumez. Nommez-le, et le prix cesse d'être le seul sujet de la conversation.",
      produto: "Le meuble se juge avec la main, et votre marque doit faire ce travail sans la main. Une photo de catalogue sur fond blanc dit le prix, elle ne dit ni le chêne, ni l'assemblage, ni les années à venir. Nous regardons comment la matière, l'origine et le geste apparaissent, ou disparaissent, dans ce que vous montrez. Un meuble sans récit devient un objet comparable, et un objet comparable perd le plus souvent contre moins cher.",
      pessoas: "On n'achète pas une table, on achète les repas des dix prochaines années. Le couple qui pousse votre porte arrive souvent avec un déménagement, un enfant, une séparation, une maison enfin terminée. L'architecte d'intérieur ou l'agenceur qui vous prescrit, lui, joue sa crédibilité sur vos délais et votre régularité. Ces deux publics n'ont pas besoin des mêmes mots, et la plupart des marques de mobilier ne parlent qu'au premier.",
      processos: "Entre le coup de coeur en showroom et la livraison, il y a des semaines, parfois des mois, et c'est là que la confiance s'use. Le devis sur-mesure, l'attente, le camion, les deux personnes qui montent l'escalier, la protection du parquet : tout cela est votre marque, autant que la vitrine. Nous regardons ce parcours tel que le client le vit, pas tel qu'il est décrit à l'interne. Un meuble parfait mal livré redevient un meuble ordinaire.",
      propaganda: "Votre premier média est votre showroom, le second est le meuble lui-même, une fois installé chez les gens. Le catalogue, la foire, la vitrine, la photo d'ambiance, la fiche produit : chacun raconte quelque chose, rarement la même chose. Nous regardons si l'on reconnaît la même maison du panneau au bord de la route jusqu'à l'emballage, ou s'il y a trois marques dans la même entreprise. Le but n'est pas de parler plus fort, c'est d'être reconnaissable même de loin.",
    },
  },
  fashion: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous travaillons au rythme des saisons depuis longtemps, et nous savons que dans la mode, arriver une saison trop tard revient à ne rien faire.",
    comoText: "Nous commençons par regarder ce que voit une cliente : la vitrine, le compte, la boutique, l'accueil, le sac qu'elle emporte. Nous ne jugeons pas votre goût, nous cherchons ce qui, dans votre maison, mérite d'être dit plus fort. Puis nous vous rendons une lecture honnête, en une page, avec rien à vendre.",
    analise: "Une seule page : ce qui tient déjà debout, et là où nous mènerions la marque. Aucun engagement, aucune présentation interminable, rien à signer. Vous la gardez, même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, agence de communication indépendante à Genève depuis 2015.",
    ps: {
      personalidade: "C'est le premier P, et dans la mode c'est presque le seul qui compte. Une photo se copie en une nuit, un caractère ne se copie pas. Une boutique est sévère ou joyeuse, discrète ou frontale, ancrée dans sa ville et fière de l'être ou résolument ailleurs. Tant que ce caractère n'est pas décidé, votre compte ressemble à celui d'à côté : mêmes portants, même lumière, mêmes mots.",
      produto: "Vous vendez souvent des marques que d'autres vendent aussi, parfois moins cher, à deux clics. Ce qui vous appartient vraiment n'est pas la pièce, c'est le choix : pourquoi celle-ci et pas les vingt autres du même fournisseur. Nous regardons si cette sélection est assumée quelque part, ou si elle reste dans la tête de celle qui achète les collections. Une boutique qui n'explique pas son oeil vend du stock, une boutique qui l'explique vend son regard.",
      pessoas: "Une cliente n'entre pas pour acheter, elle entre pour se voir autrement. Les dix secondes qui suivent la porte décident de tout : est-ce qu'on la regarde, est-ce qu'on la laisse respirer, est-ce qu'on la juge. Vos vendeuses savent sa vraie taille, ce qu'elle n'ose pas essayer et l'occasion pour laquelle elle cherche, et ce savoir ne sort jamais des quatre murs. C'est pourtant la seule chose qu'aucune plateforme ne pourra copier.",
      processos: "La saison commande tout : les achats se décident des mois à l'avance, les soldes arrivent trop vite, le réassort manque toujours sur la bonne taille. Dans ce rythme, la communication se fait le dimanche soir, entre deux inventaires, quand il reste de l'énergie. Nous regardons ce calendrier réel plutôt qu'un plan idéal que personne ne tiendra en février. Une cadence tenable, décidée à l'avance, vaut mieux que trois semaines brillantes suivies de deux mois de silence.",
      propaganda: "Votre vitrine est la campagne la mieux placée que vous aurez jamais, et elle change chaque semaine sans direction artistique. Le compte, l'infolettre, l'événement, le sac que la cliente porte dans la rue : tout cela travaille pour vous ou contre vous. Nous regardons si ces prises de parole ont une même main, ou si chacune répond à l'urgence du jour. Le but n'est pas de publier davantage, c'est qu'on vous reconnaisse avant d'avoir lu le nom.",
    },
  },
  ecommerce: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Pour vous, cela veut dire une chose simple : la pensée, l'image et la fabrication ne se perdent pas entre trois prestataires qui ne se parlent pas.",
    comoText: "Nous commençons par essayer d'acheter : on arrive sur la page, on cherche, on hésite, on abandonne. Ce parcours nous apprend plus sur votre marque que n'importe quel document de présentation. Ensuite seulement, nous vous rendons une lecture honnête, en une page, avec rien à vendre.",
    analise: "Le résultat tient sur une page : ce qui est déjà fort, et là où nous mènerions la marque. Ce n'est pas un rapport d'outil, c'est un regard : celui d'un acheteur méfiant et celui d'un atelier. Vous la gardez même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, Des idées à la hauteur de l'ambition. Atelier indépendant, Genève.",
    ps: {
      personalidade: "C'est le P qui décide, et c'est le premier que le commerce en ligne sacrifie. Les gabarits sont les mêmes pour tous, les polices aussi, les promotions aussi : à la fin, il ne reste que le prix et la livraison pour choisir, et ce combat se perd presque toujours contre plus gros. Une boutique qui a une voix, un point de vue, une raison d'exister au-delà du catalogue cesse d'être une ligne dans un comparateur. C'est la seule protection durable contre la remise permanente.",
      produto: "Sur une fiche produit, il y a le produit et il y a le doute : la taille, la matière, le retour, le délai, la personne derrière. Beaucoup de boutiques répondent au premier et laissent le second entier. Nous regardons vos pages comme un acheteur méfiant, pas comme un propriétaire fier de son catalogue. Ce qui manque n'est presque jamais une fonctionnalité, c'est une phrase.",
      pessoas: "Votre client n'est pas un panier, c'est quelqu'un qui a peur de se tromper avec son argent, seul, le soir, sur un téléphone. Il ne vous connaît pas, il ne peut rien toucher, et il a déjà été déçu par quelqu'un d'autre avant vous. Il y a aussi celui qui écrit au service client, souvent le jour où tout va mal, et cette réponse vaut toutes les campagnes. Une marque qui ne parle qu'aux nouveaux venus oublie les seuls qui reviennent.",
      processos: "Votre marque ne s'arrête pas au paiement, elle commence là. La confirmation, l'attente, le suivi, le carton ouvert sur la table de la cuisine, le retour : ce sont vos vrais moments de vérité, et ce sont souvent les plus négligés. Nous regardons la chaîne entière, y compris les courriels automatiques que personne n'a jamais vraiment écrits. Une seule de ces étapes ratée efface tout ce que l'acquisition a coûté.",
      propaganda: "Louer de l'attention se paie tous les jours et ne s'arrête jamais : le jour où vous coupez, le trafic s'arrête net. Une marque, elle, se construit et reste. Nous regardons si votre publicité achète des clics ou construit quelque chose, et si l'annonce, la page et le colis racontent la même histoire. Quand les trois se répondent, chaque franc dépensé travaille deux fois.",
    },
  },
  saas: {
    quem: "Nous sommes ABiL, un atelier créatif indépendant à Genève. Depuis 2015, nous réunissons sous un même toit la stratégie, la direction artistique et la production. Nous ne sommes pas nés avec le numérique, nous l'avons traversé, et cela nous a appris une chose : les outils changent bien plus vite que les gens.",
    comoText: "Nous commençons par comprendre ce que votre logiciel change réellement dans la journée de quelqu'un. Pas l'architecture, pas la feuille de route : le problème que votre client avait le lundi matin avant vous. Puis nous vous rendons une lecture honnête, en une page, avec rien à vendre.",
    analise: "Une page, lisible en trois minutes : ce qui est déjà fort, et là où nous mènerions la marque. Ce n'est pas un audit technique et ce n'est pas une offre déguisée. C'est une lecture honnête, à garder même si nos chemins ne se recroisent jamais.",
    bio: "ABiL, Genève. Depuis 2015, des idées à la hauteur de l'ambition.",
    ps: {
      personalidade: "C'est le premier P et, dans un marché où tout le monde promet la même chose, c'est l'un des rares terrains encore libres. Les captures d'écran se ressemblent, les dégradés se ressemblent, les promesses aussi. Vous avez pourtant un point de vue : ce que vous refusez de faire, ce que vous croyez de votre métier, la raison pour laquelle vous avez commencé. Tant que ce n'est pas dit, vous vendez une liste de fonctions, et une liste de fonctions se compare toujours.",
      produto: "Votre produit est probablement excellent, et votre page d'accueil parle d'intégrations, de modules et de tableaux de bord. Le visiteur, lui, cherche une seule phrase : qu'est-ce que ça règle, pour qui, et à la place de quoi. Une fonctionnalité se copie en un trimestre, une raison d'exister ne se copie pas. Nous regardons l'écart entre ce que vous avez construit et ce qu'on en comprend en dix secondes.",
      pessoas: "Trois personnes décident et aucune ne veut la même chose : celle qui utilisera l'outil chaque jour, celle qui signera, celle qui devra le brancher au reste. La première veut récupérer sa soirée, la deuxième veut ne pas se tromper devant son comité, la troisième veut que rien ne casse. La plupart des sites de logiciels ne parlent qu'à la deuxième, avec le vocabulaire de la troisième. Une marque claire donne à chacune sa phrase, sans mentir aux deux autres.",
      processos: "Votre marque se joue dans l'essai, pas dans la brochure. L'inscription, les premières minutes, le moment où l'on comprend enfin, la démonstration, le message au support, le renouvellement : chacun est une promesse tenue ou trahie. Nous regardons ce chemin tel qu'un nouveau venu le vit, sans votre vocabulaire interne pour l'aider. Un produit qu'on n'a pas compris le premier jour ne sera pas adopté le trentième.",
      propaganda: "Un logiciel se raconte mal en criant, il se raconte en montrant : une démonstration honnête, un cas rendu concret, une page qui ne noie pas son lecteur, une image qui n'est pas un vaisseau spatial violet. Nous regardons si votre prise de parole s'adresse à une personne ou à un moteur de recherche. La constance vaut mieux que l'intensité : la même voix, longtemps, partout. C'est ainsi qu'un nom finit par être connu avant d'être cherché.",
    },
  },
};

                                                                                                       
                                                                                                         
const PS_ORDER = ["personalidade", "produto", "pessoas", "processos", "propaganda"] as const;

                                                                                                         
                                                                                                        
                                                     
const SEG_COPY_I18N_KEY = "config/abil-seg-copy-i18n.json";
async function readSegCopyCache(): Promise<Record<string, SegCopy>> {
  let txt: string | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${SEG_COPY_I18N_KEY}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); } catch {  } }
  if (txt === null) { try { const { blobs } = await list({ prefix: SEG_COPY_I18N_KEY, limit: 1 }); const bl = blobs.find((x) => x.pathname === SEG_COPY_I18N_KEY); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } } catch {  } }
  if (!txt) return {};
  try { const j = JSON.parse(txt); return (j && typeof j === "object") ? j : {}; } catch { return {}; }
}
                                                                                                         
                                                                                                       
                                                                                            
function noDash(s: string): string {
  return String(s || "").replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1-$2").replace(/\s*[\u2013\u2014]\s*/g, ", ");
}
function hashStr(s: string): string { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function selfBase(): string { return (process.env.PUBLIC_BASE_URL || process.env.ABIL_PUBLIC_BASE || SITE).replace(/\/$/, ""); }
function mintAdmin(): string { const pw = process.env.ABIL_ADMIN_AUTH_SECRET || ""; const exp = Date.now() + 5 * 60 * 1000; return `${exp}.${crypto.createHmac("sha256", pw).update(String(exp)).digest("hex")}`; }

                                                                                                       
                                                                            
                                                                                          
                                                                                                
                                                                                                    
                                                                                                    
                                                                                                         
async function segCopyFor(segKey: string, lang: string): Promise<SegCopy | null> {
  const src = SEG_COPY_FR[segKey];
  if (!src) return null;
  if (lang === "fr") return src;
  const fields = ["quem", "comoText", "analise", "bio", ...PS_ORDER] as const;
  const ck = `${segKey}:${lang}:${hashStr(fields.map((f) => (f in src ? (src as any)[f] : src.ps[f])).join("|"))}`;
  let cache: Record<string, SegCopy> = {};
  try { cache = await readSegCopyCache(); if (cache[ck]) return cache[ck]; } catch {  }
  const pw = process.env.ABIL_ADMIN_AUTH_SECRET || "";
  if (!pw) return null;                                                                                                
  const tok = mintAdmin(); const url = `${selfBase()}/api/translate`;
  const tr = async (t: string): Promise<string | null> => {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ text: t, from: "fr", to: lang }), signal: AbortSignal.timeout(20000) });
      if (!r.ok) return null;
      const d: any = await r.json();
      return (d && typeof d.translated === "string" && d.translated.trim()) ? noDash(d.translated.trim()) : null;
    } catch { return null; }
  };
                                                                                               
  const done = await Promise.all(fields.map((f) => tr(f in src ? (src as any)[f] : src.ps[f])));
  if (done.some((x) => !x)) return null;
  const out: SegCopy = { quem: done[0]!, comoText: done[1]!, analise: done[2]!, bio: done[3]!, ps: {} };
  PS_ORDER.forEach((p, i) => { out.ps[p] = done[4 + i]!; });
  cache[ck] = out; try { await put(SEG_COPY_I18N_KEY, JSON.stringify(cache), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true }); } catch {  }
  return out;
}

                                                                                                                    
                                                                                                                  
const SUPPRESS_KEY = "prospecting/abil/suppress.json";
async function readSuppress(): Promise<{ emails: string[]; domains: string[] }> {
  let txt: string | null = null;
  if (BLOB_PUBLIC_BASE) { try { const r = await fetch(`${BLOB_PUBLIC_BASE}/${SUPPRESS_KEY}?cb=${Date.now()}`, { cache: "no-store" }); if (r.ok) txt = await r.text(); } catch {  } }
  if (txt === null) { try { const { blobs } = await list({ prefix: SUPPRESS_KEY, limit: 1 }); const bl = blobs.find((x) => x.pathname === SUPPRESS_KEY); if (bl) { const r = await fetch(bl.url, { cache: "no-store" }); if (r.ok) txt = await r.text(); } } catch {  } }
  const base = { emails: [] as string[], domains: [] as string[] };
  if (!txt) return base;
  try { const j = JSON.parse(txt); return { emails: Array.isArray(j?.emails) ? j.emails : [], domains: Array.isArray(j?.domains) ? j.domains : [] }; } catch { return base; }
}
async function writeSuppress(s: { emails: string[]; domains: string[] }): Promise<void> {
  await put(SUPPRESS_KEY, JSON.stringify(s), { access: "public", contentType: "application/json", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true });
}
function normDomain(u: string): string {
  const h = String(u || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  return h.split(/[/?#:]/)[0].trim();
}

const L: Record<string, Record<string, string>> = {
  fr: { audit: "Analyse de marque", who: "Qui est", sBrand: "La marque et sa personnalité", sDigital: "Présence en marketing digital", sWeb: "La maison digitale (le site)", sCreative: "La lecture créative", verdict: "Le verdict", prio: "La plus grande opportunité", next: "Parlons-en", cta: "Réserver un échange sans engagement", perf: "Performance", seo: "SEO", acc: "Accessibilité", secure: "Connexion sécurisée", aivis: "Visible pour l'IA", schema: "Données structurées", gen: "Générée le", by: "Une lecture de l'atelier ABiL", psT: "La méthode des cinq P", pPersonalidade: "Personnalité", pProduto: "Produit", pPessoas: "Personnes", pProcessos: "Processus", pPropaganda: "Propagande",
    diagT: "Le diagnostic en un coup d'œil", diagScore: "Lisibilité de marque", techScore: "Santé technique du site", techT: "Ce que nous avons mesuré", techGood: "solide", techMid: "à renforcer", techBad: "prioritaire", seenT: "Comment votre marque est perçue", brandReadT: "La lecture de votre marque", archetypeT: "Archétype", paletteT: "Votre palette, telle que mesurée", oppT: "Les opportunités repérées", deepT: "La radiographie approfondie", factsT: "Ce que nous avons vérifié, avec la source", sourceLbl: "source", readProof: "Ce que nous avons lu pour cette lecture", pagesRead: "pages lues", netsRead: "réseaux lus", webSearch: "recherches web", socialT: "Présence sociale", followers: "abonnés", googleT: "La voix de vos clients", reviewsN: "avis", honestT: "Ce que nous n'avons pas pu voir", exampleTag: "Exemple de lecture", signRole: "Associé directeur", signBio: "Associé de ABiL. Stratégie de marque, direction de la relation client et des projets sur la durée. C'est lui qui lit chaque marque avant que nous en parlions.", signCta: "Parlons-en, sans engagement", firstImpr: "La première impression", styleLbl: "Style", finishLbl: "Finition",
    introT: "Pourquoi cette lecture", introKick: "Aller plus loin que le visible.",
    introP1: "Vous avez répondu, et c'est plus rare qu'on ne le croit. Alors nous avons regardé votre marque comme la regarde quelqu'un qui vous découvre : sur un écran, en quelques secondes, sans personne pour expliquer.",
    introP2: "Ce qui suit n'est pas un rapport, c'est une lecture. Ouvrez votre site à côté et suivez-nous : vous allez voir votre maison avec des yeux qui ne sont pas les vôtres.",
    introP3: "Soyons honnêtes : regarder de l'extérieur ne suffit pas. Pour défendre une marque il faut la connaître de l'intérieur, et cela demande du temps, de l'immersion, une forme d'intimité avec la maison. Ceci est un début. Donnez-nous la suite et nous ne nous arrêterons pas au digital : identité, création, publicité, production. En pensant ABiL.",
    techNote: "Ces mesures sont un signal parmi d'autres, pas le sujet. Nous les plaçons en fin de lecture, parce qu'un site lent se répare en quelques semaines, alors qu'une marque sans direction se paie pendant des années.",
    frontsT: "Quatre fronts, une seule équipe", frontsSub: "De la stratégie au master final. Chaque projet traverse les fronts qui ont du sens, jamais plus.",
    f1n: "Stratégie", f1d: "Positionnement, étude de marque, architecture de portfolio, planification.",
    f2n: "Direction artistique", f2d: "Branding, identité visuelle, campagne 360°, éditorial.",
    f3n: "Production", f3d: "Film, photo, motion, son. Équipe interne, exigence festival.",
    f4n: "Activation", f4d: "Média payant, social, performance, OOH et événementiel.",
    langT: "Langue", previewTag: "Aperçu de thème",
    strongT: "Ce qui est déjà fort", brakeT: "Ce qui freine", fixFirstT: "Si vous ne changez qu'une chose", signT: "Votre signe", swotT: "La lecture stratégique", swotF: "Forces", swotW: "Faiblesses", swotO: "Opportunités", swotM: "Menaces", actT: "Là où nous commencerions", deskLbl: "Écran", mobLbl: "Mobile" ,
    introHi: "Bonjour,",
    shotT: "Ce qu'un client voit de vous", shotP: "Voici votre marque telle qu'elle apparaît sur un téléphone, sans rien retoucher. C'est cette image, et pas une autre, qui décide si la personne reste ou passe au suivant." },
  en: { audit: "Brand analysis", who: "Who is", sBrand: "The brand and its personality", sDigital: "Digital marketing presence", sWeb: "The digital house (the website)", sCreative: "The creative read", verdict: "The verdict", prio: "The biggest opportunity", next: "Let's talk", cta: "Book a no-strings conversation", perf: "Performance", seo: "SEO", acc: "Accessibility", secure: "Secure connection", aivis: "Visible to AI", schema: "Structured data", gen: "Generated on", by: "A read by the ABiL atelier", psT: "The five P method", pPersonalidade: "Personality", pProduto: "Product", pPessoas: "People", pProcessos: "Processes", pPropaganda: "Propaganda",
    diagT: "The diagnosis at a glance", diagScore: "Brand legibility", techScore: "Technical health of the site", techT: "What we measured", techGood: "solid", techMid: "to strengthen", techBad: "priority", seenT: "How your brand reads", brandReadT: "The read on your brand", archetypeT: "Archetype", paletteT: "Your palette, as measured", oppT: "The opportunities we spotted", deepT: "The deep X-ray", factsT: "What we verified, with the source", sourceLbl: "source", readProof: "What we read for this analysis", pagesRead: "pages read", netsRead: "networks read", webSearch: "web searches", socialT: "Social presence", followers: "followers", googleT: "The voice of your customers", reviewsN: "reviews", honestT: "What we could not see", exampleTag: "Sample analysis", signRole: "Managing partner", signBio: "Partner at ABiL. Brand strategy, client relationships and projects that last. He is the one who reads every brand before we talk.", signCta: "Let's talk, no strings attached", firstImpr: "The first impression", styleLbl: "Style", finishLbl: "Finish",
    introT: "Why this reading", introKick: "Go further than the visible.",
    introP1: "You replied, and that is rarer than people think. So we looked at your brand the way someone discovering you looks at it: on a screen, in a few seconds, with nobody there to explain.",
    introP2: "What follows is not a report, it is a reading. Open your website next to this page and come with us: you are about to see your own house through eyes that are not yours.",
    introP3: "Let us be honest: looking from the outside is not enough. To defend a brand you have to know it from the inside, and that takes time, immersion, a kind of intimacy with the house. This is a beginning. Give us the rest and we will not stop at digital: identity, creative work, advertising, production. Thinking ABiL.",
    techNote: "These measurements are one signal among many, not the point. We place them at the end of the reading, because a slow website is fixed in a few weeks, while a brand without direction is paid for over years.",
    frontsT: "Four fronts, one team", frontsSub: "From strategy to final master. Every project goes through the fronts that make sense, never more.",
    f1n: "Strategy", f1d: "Positioning, brand research, portfolio architecture, planning.",
    f2n: "Art direction", f2d: "Branding, visual identity, 360° campaign, editorial.",
    f3n: "Production", f3d: "Film, photo, motion, sound. In-house team, festival standard.",
    f4n: "Activation", f4d: "Paid media, social, performance, OOH and events.",
    langT: "Language", previewTag: "Theme preview",
    strongT: "What is already strong", brakeT: "What is holding you back", fixFirstT: "If you change only one thing", signT: "Your mark", swotT: "The strategic read", swotF: "Strengths", swotW: "Weaknesses", swotO: "Opportunities", swotM: "Threats", actT: "Where we would start", deskLbl: "Desktop", mobLbl: "Mobile" ,
    introHi: "Hello,",
    shotT: "What a customer sees of you", shotP: "This is your brand exactly as it appears on a phone, untouched. That image, and no other, decides whether the person stays or moves on to the next one." },
  pt: { audit: "Análise de marca", who: "Quem é", sBrand: "A marca e a personalidade", sDigital: "Presença em marketing digital", sWeb: "A casa digital (o site)", sCreative: "A leitura criativa", verdict: "O veredicto", prio: "A maior oportunidade", next: "Vamos conversar", cta: "Marcar uma conversa sem compromisso", perf: "Performance", seo: "SEO", acc: "Acessibilidade", secure: "Ligação segura", aivis: "Visível para a IA", schema: "Dados estruturados", gen: "Gerada a", by: "Uma leitura do atelier ABiL", psT: "O método dos cinco P", pPersonalidade: "Personalidade", pProduto: "Produto", pPessoas: "Pessoas", pProcessos: "Processos", pPropaganda: "Propaganda",
    diagT: "O diagnóstico num relance", diagScore: "Legibilidade da marca", techScore: "Saúde técnica do site", techT: "O que medimos", techGood: "sólido", techMid: "a reforçar", techBad: "prioritário", seenT: "Como a vossa marca é percebida", brandReadT: "A leitura da vossa marca", archetypeT: "Arquétipo", paletteT: "A vossa paleta, tal como medida", oppT: "As oportunidades detetadas", deepT: "A radiografia profunda", factsT: "O que verificámos, com a fonte", sourceLbl: "fonte", readProof: "O que lemos para esta leitura", pagesRead: "páginas lidas", netsRead: "redes lidas", webSearch: "pesquisas web", socialT: "Presença social", followers: "seguidores", googleT: "A voz dos vossos clientes", reviewsN: "avaliações", honestT: "O que não conseguimos ver", exampleTag: "Exemplo de leitura", signRole: "Sócio director", signBio: "Sócio da ABiL. Estratégia de marca, relação com o cliente e projetos que duram. É ele que lê cada marca antes de conversarmos.", signCta: "Vamos conversar, sem compromisso", firstImpr: "A primeira impressão", styleLbl: "Estilo", finishLbl: "Acabamento",
    introT: "Porquê esta leitura", introKick: "Ir mais longe do que o visível.",
    introP1: "Vocês responderam, e isso é mais raro do que parece. Por isso olhámos para a vossa marca como olha quem vos descobre: num ecrã, em poucos segundos, sem ninguém para explicar.",
    introP2: "O que vem a seguir não é um relatório, é uma leitura. Abram o vosso site ao lado desta página e venham connosco: vão ver a vossa casa com olhos que não são os vossos.",
    introP3: "Sejamos honestos: olhar de fora não chega. Para defender uma marca é preciso conhecê-la por dentro, e isso exige tempo, imersão, uma forma de intimidade com a casa. Isto é um princípio. Deem-nos o resto e não ficamos pelo digital: identidade, criação, publicidade, produção. A pensar ABiL.",
    techNote: "Estas medições são um sinal entre muitos, não são o assunto. Ficam no fim da leitura, porque um site lento resolve-se em semanas, enquanto uma marca sem direção paga-se durante anos.",
    frontsT: "Quatro frentes, uma só equipa", frontsSub: "Da estratégia ao master final. Cada projeto passa pelas frentes que fazem sentido, nunca mais do que isso.",
    f1n: "Estratégia", f1d: "Posicionamento, estudo de marca, arquitetura de portefólio, planeamento.",
    f2n: "Direção artística", f2d: "Branding, identidade visual, campanha 360°, editorial.",
    f3n: "Produção", f3d: "Filme, foto, motion, som. Equipa interna, exigência de festival.",
    f4n: "Ativação", f4d: "Média pago, social, performance, OOH e eventos.",
    langT: "Idioma", previewTag: "Pré-visualização do tema",
    strongT: "O que já é forte", brakeT: "O que trava", fixFirstT: "Se mudar uma coisa só", signT: "O vosso signo", swotT: "A leitura estratégica", swotF: "Forças", swotW: "Fraquezas", swotO: "Oportunidades", swotM: "Ameaças", actT: "Por onde começaríamos", deskLbl: "Ecrã", mobLbl: "Telemóvel" ,
    introHi: "Olá,",
    shotT: "O que um cliente vê de vocês", shotP: "Esta é a vossa marca tal como aparece num telemóvel, sem retoque nenhum. É esta imagem, e não outra, que decide se a pessoa fica ou passa à seguinte." },
  de: { audit: "Markenanalyse", who: "Wer ist", sBrand: "Die Marke und ihre Persönlichkeit", sDigital: "Präsenz im digitalen Marketing", sWeb: "Das digitale Haus (die Website)", sCreative: "Der kreative Blick", verdict: "Das Fazit", prio: "Die grösste Chance", next: "Sprechen wir darüber", cta: "Ein unverbindliches Gespräch buchen", perf: "Performance", seo: "SEO", acc: "Barrierefreiheit", secure: "Sichere Verbindung", aivis: "Für KI sichtbar", schema: "Strukturierte Daten", gen: "Erstellt am", by: "Eine Lesart des Ateliers ABiL", psT: "Die Methode der fünf P", pPersonalidade: "Persönlichkeit", pProduto: "Produkt", pPessoas: "Menschen", pProcessos: "Prozesse", pPropaganda: "Propaganda",
    diagT: "Die Diagnose auf einen Blick", diagScore: "Lesbarkeit der Marke", techScore: "Technischer Zustand der Website", techT: "Was wir gemessen haben", techGood: "solide", techMid: "zu stärken", techBad: "vorrangig", seenT: "Wie Ihre Marke wahrgenommen wird", brandReadT: "Die Lesart Ihrer Marke", archetypeT: "Archetyp", paletteT: "Ihre Palette, so wie gemessen", oppT: "Die erkannten Chancen", deepT: "Das tiefe Röntgenbild", factsT: "Was wir geprüft haben, mit Quelle", sourceLbl: "Quelle", readProof: "Was wir für diese Lesart gelesen haben", pagesRead: "gelesene Seiten", netsRead: "gelesene Netzwerke", webSearch: "Websuchen", socialT: "Soziale Präsenz", followers: "Follower", googleT: "Die Stimme Ihrer Kundschaft", reviewsN: "Bewertungen", honestT: "Was wir nicht sehen konnten", exampleTag: "Beispiel einer Lesart", signRole: "Geschäftsführender Partner", signBio: "Partner bei ABiL. Markenstrategie, Kundenbeziehung und Projekte, die bleiben. Er ist es, der jede Marke liest, bevor wir miteinander sprechen.", signCta: "Sprechen wir darüber, unverbindlich", firstImpr: "Der erste Eindruck", styleLbl: "Stil", finishLbl: "Ausführung",
    introT: "Warum diese Lesart", introKick: "Weiter gehen als das Sichtbare.",
    introP1: "Sie haben geantwortet, und das ist seltener, als man denkt. Also haben wir Ihre Marke so angesehen, wie jemand sie ansieht, der Sie gerade entdeckt: auf einem Bildschirm, in wenigen Sekunden, ohne dass jemand etwas erklärt.",
    introP2: "Was jetzt kommt, ist kein Bericht, sondern eine Lesart. Öffnen Sie Ihre Website daneben und kommen Sie mit: Sie werden Ihr eigenes Haus mit fremden Augen sehen.",
    introP3: "Seien wir ehrlich: von aussen schauen genügt nicht. Um eine Marke zu vertreten, muss man sie von innen kennen, und das braucht Zeit, Eintauchen, eine Form von Vertrautheit mit dem Haus. Das hier ist ein Anfang. Geben Sie uns den Rest und wir bleiben nicht beim Digitalen stehen: Identität, Kreation, Werbung, Produktion. ABiL gedacht.",
    techNote: "Diese Messwerte sind ein Signal unter vielen, nicht das Thema. Sie stehen am Ende der Lesart, weil eine langsame Website in wenigen Wochen repariert ist, während eine Marke ohne Richtung über Jahre bezahlt wird.",
    frontsT: "Vier Fronten, ein Team", frontsSub: "Von der Strategie bis zum finalen Master. Jedes Projekt durchläuft die Fronten, die Sinn ergeben, nie mehr.",
    f1n: "Strategie", f1d: "Positionierung, Markenforschung, Portfolio-Architektur, Planung.",
    f2n: "Art Direction", f2d: "Branding, visuelle Identität, 360°-Kampagne, Editorial.",
    f3n: "Produktion", f3d: "Film, Foto, Motion, Ton. Internes Team, Festivalanspruch.",
    f4n: "Aktivierung", f4d: "Paid Media, Social, Performance, OOH und Events.",
    langT: "Sprache", previewTag: "Themenvorschau",
    strongT: "Was bereits stark ist", brakeT: "Was bremst", fixFirstT: "Wenn Sie nur eines ändern", signT: "Ihr Zeichen", swotT: "Die strategische Lesart", swotF: "Stärken", swotW: "Schwächen", swotO: "Chancen", swotM: "Risiken", actT: "Wo wir anfangen würden", deskLbl: "Desktop", mobLbl: "Mobil" ,
    introHi: "Guten Tag,",
    shotT: "Was ein Kunde von Ihnen sieht", shotP: "So erscheint Ihre Marke auf einem Telefon, unbearbeitet. Genau dieses Bild entscheidet, ob jemand bleibt oder zum nächsten weitergeht." },
  it: { audit: "Analisi di marca", who: "Chi è", sBrand: "La marca e la sua personalità", sDigital: "Presenza nel marketing digitale", sWeb: "La casa digitale (il sito)", sCreative: "La lettura creativa", verdict: "Il verdetto", prio: "La più grande opportunità", next: "Parliamone", cta: "Prenotare uno scambio senza impegno", perf: "Performance", seo: "SEO", acc: "Accessibilità", secure: "Connessione sicura", aivis: "Visibile all'IA", schema: "Dati strutturati", gen: "Generata il", by: "Una lettura dell'atelier ABiL", psT: "Il metodo delle cinque P", pPersonalidade: "Personalità", pProduto: "Prodotto", pPessoas: "Persone", pProcessos: "Processi", pPropaganda: "Propaganda",
    diagT: "La diagnosi in un colpo d'occhio", diagScore: "Leggibilità della marca", techScore: "Salute tecnica del sito", techT: "Ciò che abbiamo misurato", techGood: "solido", techMid: "da rafforzare", techBad: "prioritario", seenT: "Come viene percepita la vostra marca", brandReadT: "La lettura della vostra marca", archetypeT: "Archetipo", paletteT: "La vostra palette, così come misurata", oppT: "Le opportunità individuate", deepT: "La radiografia approfondita", factsT: "Ciò che abbiamo verificato, con la fonte", sourceLbl: "fonte", readProof: "Ciò che abbiamo letto per questa lettura", pagesRead: "pagine lette", netsRead: "reti lette", webSearch: "ricerche web", socialT: "Presenza social", followers: "follower", googleT: "La voce dei vostri clienti", reviewsN: "recensioni", honestT: "Ciò che non abbiamo potuto vedere", exampleTag: "Esempio di lettura", signRole: "Socio direttore", signBio: "Socio di ABiL. Strategia di marca, relazione con il cliente e progetti che durano. È lui che legge ogni marca prima che ne parliamo.", signCta: "Parliamone, senza impegno", firstImpr: "La prima impressione", styleLbl: "Stile", finishLbl: "Finitura",
    introT: "Perché questa lettura", introKick: "Andare oltre il visibile.",
    introP1: "Avete risposto, ed è più raro di quanto si creda. Così abbiamo guardato la vostra marca come la guarda chi vi scopre: su uno schermo, in pochi secondi, senza nessuno che spieghi.",
    introP2: "Quello che segue non è un rapporto, è una lettura. Aprite il vostro sito accanto a questa pagina e venite con noi: stai per vedere casa vostra con occhi che non sono i vostri.",
    introP3: "Siamo onesti: guardare da fuori non basta. Per difendere una marca bisogna conoscerla da dentro, e questo richiede tempo, immersione, una forma di intimità con la casa. Questo è un inizio. Dateci il resto e non ci fermeremo al digitale: identità, creazione, pubblicità, produzione. Pensando ABiL.",
    techNote: "Queste misure sono un segnale tra tanti, non sono il tema. Le mettiamo alla fine della lettura, perché un sito lento si ripara in poche settimane, mentre una marca senza direzione si paga per anni.",
    frontsT: "Quattro fronti, una sola squadra", frontsSub: "Dalla strategia al master finale. Ogni progetto attraversa i fronti che hanno senso, mai di più.",
    f1n: "Strategia", f1d: "Posizionamento, ricerca di marca, architettura di portfolio, pianificazione.",
    f2n: "Direzione artistica", f2d: "Branding, identità visiva, campagna 360°, editoriale.",
    f3n: "Produzione", f3d: "Film, foto, motion, suono. Squadra interna, esigenza da festival.",
    f4n: "Attivazione", f4d: "Media a pagamento, social, performance, OOH ed eventi.",
    langT: "Lingua", previewTag: "Anteprima del tema",
    strongT: "Ciò che è già forte", brakeT: "Ciò che frena", fixFirstT: "Se cambiate una sola cosa", signT: "Il vostro segno", swotT: "La lettura strategica", swotF: "Forze", swotW: "Debolezze", swotO: "Opportunità", swotM: "Minacce", actT: "Da dove cominceremmo", deskLbl: "Schermo", mobLbl: "Mobile" ,
    introHi: "Buongiorno,",
    shotT: "Quello che un cliente vede di voi", shotP: "Ecco la vostra marca come appare su un telefono, senza ritocchi. È questa immagine, e non un'altra, a decidere se la persona resta o passa alla successiva." },
};

                                                                                                             
                                                                                    
                                                                                             
                                                                    
                                                                
                                                        
                                                                                                             
                                                                                            
                                                                                             
const LP_LANGS = ["fr", "de", "it", "en", "pt"];
const LP_ANIM_JS = `
(function(){
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function count(el){
    var to = +el.getAttribute('data-count')||0, t0=null, dur=1100;
    el.textContent='0';
    function step(ts){ if(!t0)t0=ts; var k=Math.min(1,(ts-t0)/dur); el.textContent=Math.round(to*(0.2+0.8*k*(2-k))*(k<1?1:1)); if(k>=1){el.textContent=to;return;} requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function video(sec){
    sec.querySelectorAll('video[data-src]').forEach(function(v){
      if(rm){ return; }
      v.src = v.getAttribute('data-src'); v.removeAttribute('data-src');
      var p = v.play(); if(p && p.catch){ p.catch(function(){}); }
    });
  }
  function fill(sec){
    video(sec);
    sec.querySelectorAll('.bar i').forEach(function(b){ b.style.width=(+b.getAttribute('data-w')||0)+'%'; });
    sec.querySelectorAll('.darc').forEach(function(a){ a.style.strokeDashoffset=a.getAttribute('data-arc'); });
    if(!rm){ sec.querySelectorAll('[data-count]').forEach(count); } else { sec.querySelectorAll('[data-count]').forEach(function(e){ e.textContent=e.getAttribute('data-count'); }); }
  }
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); fill(e.target); io.unobserve(e.target); } });
  }, { threshold: .18 }) : null;
  document.querySelectorAll('.reveal').forEach(function(el){ if(io){ io.observe(el); } else { el.classList.add('in'); fill(el); } });
})();`;

                                                                                                          
                                                                                                 
                                                                                   
const AST = `<svg class="ast" role="img" aria-label="ABiL MEDiAS" xmlns="http://www.w3.org/2000/svg" viewBox="1311.18 714.84 103.87 83.30"><path fill="currentColor" fill-rule="nonzero" d="M1353.24,776.65 L1332.26,776.65 L1332.26,735.74 L1393.98,735.74 L1353.24,776.65 M1311.68,735.74 L1311.68,777.51 C1311.68,788.62 1320.69,797.63 1331.80,797.63 L1363.12,797.63 L1393.64,766.60 L1393.64,797.63 L1414.55,797.63 L1414.55,735.46 C1414.55,724.35 1405.54,715.34 1394.43,715.34 L1332.26,715.34 L1311.68,735.74 Z"/></svg>`;
                                                                                             
                                                                                                
                                                                                            
                               
                                                                             
                                                                         
const LOGO = `<svg class="abil-logo" role="img" aria-label="ABiL MEDiAS" xmlns="http://www.w3.org/2000/svg" viewBox="1311.18 714.84 350.93 83.30"><path fill="currentColor" fill-rule="nonzero" d="M1558.69,715.34H1579.60V797.63H1558.69Z"/><path fill="currentColor" fill-rule="nonzero" d="M1620.64,715.34 L1599.72,715.34 L1599.72,777.51 C1599.72,788.62 1608.73,797.63 1619.84,797.63 L1641.04,797.63 L1661.27,777.40 L1620.64,777.23 L1620.64,715.34 Z"/><path fill="currentColor" fill-rule="nonzero" d="M1644.34,723.33 L1646.17,723.33 L1646.17,716.91 L1649.66,716.91 L1649.66,715.34 L1640.87,715.34 L1640.87,716.91 L1644.34,716.91 L1644.34,723.33 Z"/><path fill="currentColor" fill-rule="nonzero" d="M1659.66,715.34 L1656.28,719.56 L1652.90,715.34 L1650.91,715.34 L1650.91,723.33 L1652.68,723.33 L1652.68,717.77 L1656.19,722.05 L1656.28,722.05 L1659.79,717.77 L1659.79,723.33 L1661.61,723.33 L1661.61,715.34 L1659.66,715.34 Z"/><path fill="currentColor" fill-rule="nonzero" d="M1517.48,736.32 L1517.48,777.23 L1455.76,777.23 L1496.50,736.32 L1517.48,736.32 M1456.10,746.37 L1456.10,715.34 L1435.18,715.34 L1435.18,777.51 C1435.18,788.62 1444.19,797.63 1455.31,797.63 L1517.48,797.63 L1538.05,777.23 L1538.05,735.46 C1538.05,724.35 1529.05,715.34 1517.93,715.34 L1486.62,715.34 L1456.10,746.37 Z"/><path fill="currentColor" fill-rule="nonzero" d="M1353.24,776.65 L1332.26,776.65 L1332.26,735.74 L1393.98,735.74 L1353.24,776.65 M1311.68,735.74 L1311.68,777.51 C1311.68,788.62 1320.69,797.63 1331.80,797.63 L1363.12,797.63 L1393.64,766.60 L1393.64,797.63 L1414.55,797.63 L1414.55,735.46 C1414.55,724.35 1405.54,715.34 1394.43,715.34 L1332.26,715.34 L1311.68,735.74 Z"/></svg>`;

                                                                                                                 
                                                                                                              
const ATELIER: Record<string, { whoT: string; whoP: string; howT: string; howP: string }> = {
  fr: {
    whoT: "Qui nous sommes",
    whoP: "ABiL est un atelier créatif basé à Genève. Nous construisons des marques qui refusent de passer inaperçues : identité, direction artistique, site et présence digitale, du concept au pixel. Notre parti pris est simple, la marque d'abord, la technique au service de la marque.",
    howT: "Comment nous travaillons",
    howP: "Avant de proposer une idée, nous regardons ce qui existe déjà, sans complaisance et sans rien vendre. Nous partons de ce que nous pouvons vraiment observer (votre site et votre présence publique), nous nommons l'opportunité concrète, puis nous montrons ce que nous ferions. Pas de promesse en l'air, une lecture honnête et une direction claire.",
  },
  en: {
    whoT: "Who we are",
    whoP: "ABiL is a creative atelier based in Genève, Switzerland. We build brands that refuse to go unnoticed: identity, art direction, website and digital presence, from concept to pixel. Our stance is simple, brand first, technique in service of the brand.",
    howT: "How we work",
    howP: "Before we propose an idea, we look at what already exists, with no flattery and nothing to sell. We start from what we can actually observe (your website and your public presence), we name the concrete opportunity, then we show what we would do. No hollow promises, an honest read and a clear direction.",
  },
  pt: {
    whoT: "Quem somos",
    whoP: "A ABiL é um atelier criativo em Genève, na Suíça. Construímos marcas que se recusam a passar despercebidas: identidade, direção de arte, site e presença digital, do conceito ao pixel. A nossa postura é simples, a marca primeiro, a técnica ao serviço da marca.",
    howT: "Como trabalhamos",
    howP: "Antes de propor uma ideia, olhamos para o que já existe, sem complacência e sem vender nada. Partimos do que conseguimos mesmo observar (o vosso site e a vossa presença pública), nomeamos a oportunidade concreta e depois mostramos o que faríamos. Sem promessas vazias, uma leitura honesta e uma direção clara.",
  },
  de: {
    whoT: "Wer wir sind",
    whoP: "ABiL ist ein unabhängiges Kreativatelier in Genf. Wir bauen Marken, die sich weigern, unbemerkt zu bleiben: Identität, Art Direction, Website und digitale Präsenz, vom Konzept bis zum Pixel.",
    howT: "Wie wir arbeiten",
    howP: "Bevor wir eine Idee vorschlagen, schauen wir uns an, was schon da ist, ohne Gefälligkeit und ohne etwas zu verkaufen. Wir gehen von dem aus, was wir wirklich beobachten können.",
  },
  it: {
    whoT: "Chi siamo",
    whoP: "ABiL è un atelier creativo con sede a Genève, in Svizzera. Costruiamo marche che si rifiutano di passare inosservate: identità, direzione artistica, sito e presenza digitale, dal concetto al pixel.",
    howT: "Come lavoriamo",
    howP: "Prima di proporre un'idea, guardiamo ciò che esiste già, senza compiacenza e senza vendere nulla. Partiamo da ciò che possiamo davvero osservare.",
  },
};

                                                                                           
function gonePage(lang0?: string): string {
  const lang = (lang0 && L[lang0]) ? lang0 : "fr";
  const T: Record<string, string> = { fr: "Cette analyse a expiré ou a été retirée sur demande.", en: "This analysis has expired or was removed on request.", pt: "Esta análise expirou ou foi removida a pedido.", de: "Diese Analyse ist abgelaufen oder wurde auf Wunsch entfernt.", it: "Questa analisi è scaduta o è stata rimossa su richiesta." };
  const msg = T[lang] || T.fr;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(msg)}</title></head><body style="background:#0a0a0b;color:#ece5da;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:40px;margin:0"><div style="max-width:520px"><p style="font-size:1.05rem;line-height:1.6;color:#8a8178">${esc(msg)}</p></div></body></html>`;
}

function notFoundPage(lang0?: string): string {
  const lang = (lang0 && L[lang0]) ? lang0 : "fr";
  const T: Record<string, { title: string; body: string }> = {
    fr: { title: "Analyse introuvable", body: "Cette adresse ne correspond à aucune analyse active. Vérifiez le lien reçu ou contactez ABiL." },
    en: { title: "Analysis not found", body: "This address does not match an active analysis. Check the link you received or contact ABiL." },
    pt: { title: "Análise não encontrada", body: "Este endereço não corresponde a uma análise ativa. Confirme a ligação que recebeu ou contacte a ABiL." },
    de: { title: "Analyse nicht gefunden", body: "Diese Adresse gehört zu keiner aktiven Analyse. Prüfen Sie den erhaltenen Link oder kontaktieren Sie ABiL." },
    it: { title: "Analisi non trovata", body: "Questo indirizzo non corrisponde a un'analisi attiva. Verificate il link ricevuto o contattate ABiL." },
  };
  const x = T[lang] || T.fr;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(x.title)} · ABiL</title><style>@font-face{font-family:Mundial;src:url(/fonts/Mundial-Regular.otf) format('opentype');font-display:swap}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:32px;background:#0a0a0b;color:#fff;font-family:Mundial,system-ui,sans-serif}.card{width:min(560px,100%);border-top:1px solid #d2ff01;padding-top:28px}.abil-logo{width:118px;height:auto;color:#fff;margin-bottom:72px}.code{font:400 11px/1.2 ui-monospace,monospace;letter-spacing:.2em;color:#d2ff01;margin:0 0 16px}h1{font-size:clamp(34px,7vw,64px);line-height:.96;letter-spacing:-.04em;margin:0 0 24px}p{max-width:42ch;color:#c7c7c7;font-size:18px;line-height:1.5;margin:0}</style></head><body><main class="card">${LOGO}<div class="code">404</div><h1>${esc(x.title)}</h1><p>${esc(x.body)}</p></main></body></html>`;
}

                                                                                                              
                                                                                                       
function takedownConfirmPage(lang0: string | undefined, company: string | undefined, done: boolean): string {
  const lang = (lang0 && L[lang0]) ? lang0 : "fr";
  const C = esc(company || "");
  const TT: Record<string, { title: string; intro: string; btn: string; done: string }> = {
    fr: { title: "Retirer cette page", intro: `Ceci marque l'analyse${C ? ` de ${C}` : ""} comme retirée et ajoute votre contact à notre liste de suppression, pour ne plus vous écrire. Il suffit d'appuyer sur le bouton, rien d'autre n'est nécessaire.`, btn: "Retirer maintenant", done: "Terminé. La page a été marquée comme retirée et votre contact ne sera plus contacté." },
    en: { title: "Remove this page", intro: `This marks the analysis${C ? ` for ${C}` : ""} as removed and adds your contact to our suppression list, so we won't write to you again. Just press the button, nothing else is needed.`, btn: "Remove now", done: "Done. The page has been marked as removed and your contact will not be contacted again." },
    pt: { title: "Remover esta página", intro: `Isto marca a análise${C ? ` de ${C}` : ""} como removida e acrescenta o vosso contacto à nossa lista de supressão, para não voltarmos a escrever-vos. É só carregar no botão, não é preciso mais nada.`, btn: "Remover agora", done: "Pronto. A página foi marcada como removida e o vosso contacto não voltará a ser contactado." },
    de: { title: "Diese Seite entfernen", intro: `Damit wird die Analyse${C ? ` für ${C}` : ""} als entfernt markiert und Ihr Kontakt in unsere Sperrliste aufgenommen, damit wir Ihnen nicht mehr schreiben. Ein Klick auf die Schaltfläche genügt.`, btn: "Jetzt entfernen", done: "Erledigt. Die Seite wurde als entfernt markiert, und Ihr Kontakt wird nicht erneut kontaktiert." },
    it: { title: "Rimuovere questa pagina", intro: `Questa azione contrassegna l'analisi${C ? ` di ${C}` : ""} come rimossa e aggiunge il vostro contatto alla lista di esclusione, così non vi scriveremo più. Basta premere il pulsante.`, btn: "Rimuovere ora", done: "Fatto. La pagina è stata contrassegnata come rimossa e il vostro contatto non sarà contattato di nuovo." },
  };
  const x = TT[lang] || TT.fr;
  const inner = done
    ? `<p style="font-size:1.05rem;line-height:1.6;color:#8a8178">${esc(x.done)}</p>`
    : `<h1 style="font-family:system-ui,sans-serif;font-size:1.4rem;margin:0 0 16px">${esc(x.title)}</h1><p style="font-size:1rem;line-height:1.6;color:#8a8178;margin:0 0 26px">${esc(x.intro)}</p><form method="POST" action=""><button type="submit" style="background:#f52232;color:#ffffff;border:0;padding:14px 28px;font-size:.82rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;font-family:ui-monospace,monospace;cursor:pointer">${esc(x.btn)}</button></form>`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(x.title)}</title></head><body style="background:#0a0a0b;color:#ece5da;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:40px;margin:0"><div style="max-width:520px">${inner}</div></body></html>`;
}

                                                                                                        
                                                                                                               
                                                                                                          
const ICO: Record<string, string> = {
  speed: '<path d="M12 21a9 9 0 1 1 9-9"/><path d="m12 12 5-3"/><circle cx="12" cy="12" r="1.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  access: '<circle cx="12" cy="5" r="2"/><path d="M5 9h14M12 9v5m0 0-3 6m3-6 3 6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.6"/>',
  code: '<path d="m9 8-5 4 5 4M15 8l5 4-5 4"/>',
  map: '<path d="M9 4 3 7v13l6-3 6 3 6-3V4l-6 3Z"/><path d="M9 4v13M15 7v13"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="9.5" r="1.2"/><circle cx="12" cy="7.5" r="1.2"/><circle cx="15.5" cy="9.5" r="1.2"/>',
  type: '<path d="M4 6V4h16v2M12 4v16M9 20h6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  star: '<path d="m12 3 2.6 5.6 6.4.9-4.6 4.4 1.1 6.1-5.5-3-5.5 3 1.1-6.1L3 9.5l6.4-.9L12 3Z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5M18 20a6 6 0 0 0-3-5.2"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  quote: '<path d="M9 7H5v5h4v3a3 3 0 0 1-3 3M19 7h-4v5h4v3a3 3 0 0 1-3 3"/>',
  alert: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4"/><circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  cross: '<path d="M6 6l12 12M18 6 6 18"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"/>',
};
                                                                                                           
function ico(name: string, cls = ""): string {
  const p = ICO[name];
  if (!p) return "";
  return `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true">${p}</svg>`;
}
                                                                                                              
                                                                                                                
                                      
function bar(label: string, v: any, icon: string): string {
  if (v == null || !isFinite(Number(v))) return "";
  const n = Math.max(0, Math.min(100, Math.round(Number(v))));
  const tone = n >= 90 ? "good" : n >= 50 ? "mid" : "bad";
  return `<div class="mrow"><div class="mlab">${ico(icon)}<span>${esc(label)}</span></div><div class="bar"><i class="${tone}" data-w="${n}"></i></div><div class="mval mono" data-count="${n}">${n}</div></div>`;
}
                                                                                                    
function donut(score: number, label: string, sub: string): string {
  const n = Math.max(0, Math.min(100, Math.round(score)));
  const C = 326.7;
  return `<div class="donut"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="dbg" cx="60" cy="60" r="52"/><circle class="darc" cx="60" cy="60" r="52" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-arc="${(C * (1 - n / 100)).toFixed(1)}"/></svg><div class="dctr"><div class="dnum mono" data-count="${n}">${n}</div><div class="dlab mono">${esc(label)}</div></div></div>${sub ? `<p class="dsub">${esc(sub)}</p>` : ""}`;
}
                                                                                                              
function checkRow(label: string, v: any, icon: string): string {
  if (typeof v !== "boolean") return "";
  return `<li class="ck ${v ? "yes" : "no"}">${ico(icon)}<span>${esc(label)}</span>${ico(v ? "check" : "cross", "ckm")}</li>`;
}

                                                                                                              
                                                                                                          
function visPremiumLabel(v: any, lang: string): string {
  const M: Record<string, Record<string, string>> = { premium: { fr: "Perçue premium", en: "Reads premium", pt: "Percebida premium" }, mid: { fr: "Perçue moyenne", en: "Reads mid", pt: "Percebida média" }, cheap: { fr: "Perçue bon marché", en: "Reads cheap", pt: "Percebida barata" } };
  return (M[String(v)] && (M[String(v)][lang] || M[String(v)].fr)) || "";
}
function visStyleLabel(v: any, lang: string): string {
  const M: Record<string, Record<string, string>> = { premium: { fr: "Premium", en: "Premium", pt: "Premium" }, modern: { fr: "Moderne", en: "Modern", pt: "Moderno" }, minimal: { fr: "Minimal", en: "Minimal", pt: "Minimal" }, generic: { fr: "Générique", en: "Generic", pt: "Genérico" }, dated: { fr: "Daté", en: "Dated", pt: "Datado" }, cluttered: { fr: "Chargé", en: "Cluttered", pt: "Sobrecarregado" } };
  return (M[String(v)] && (M[String(v)][lang] || M[String(v)].fr)) || "";
}
function visPolishLabel(v: any, lang: string): string {
  const M: Record<string, Record<string, string>> = { polished: { fr: "Soignée", en: "Polished", pt: "Cuidada" }, competent: { fr: "Correcte", en: "Competent", pt: "Competente" }, amateur: { fr: "Amateur", en: "Amateur", pt: "Amadora" } };
  return (M[String(v)] && (M[String(v)][lang] || M[String(v)].fr)) || "";
}
                                                                                                                 
                                                                                                             
function pickPalette(vis: any, a: any): string[] {
  const raw = (vis && Array.isArray(vis.palette) && vis.palette.length) ? vis.palette : (Array.isArray(a.colors) ? a.colors : []);
  return raw.map((c: any) => String(c || "").trim()).filter((c: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c));
}
                                                                                                             
                                                                                                                
                                                                                                           
const DOSSIER_ORDER: [string, string][] = [
  ["quemSao", "users"], ["oQueVendem", "target"], ["paraQuem", "users"], ["tomDeVoz", "quote"], ["provaSocial", "star"], ["oportunidade", "target"],
];
const DOSSIER_LABELS: Record<string, Record<string, string>> = {
  fr: { quemSao: "Qui vous êtes", oQueVendem: "Ce que vous vendez", paraQuem: "Pour qui", tomDeVoz: "Votre ton", provaSocial: "Votre preuve sociale", oportunidade: "L'opportunité" },
  en: { quemSao: "Who you are", oQueVendem: "What you sell", paraQuem: "For whom", tomDeVoz: "Your tone", provaSocial: "Your social proof", oportunidade: "The opportunity" },
  pt: { quemSao: "Quem são", oQueVendem: "O que vendem", paraQuem: "Para quem", tomDeVoz: "O vosso tom", provaSocial: "A vossa prova social", oportunidade: "A oportunidade" },
  de: { quemSao: "Wer Sie sind", oQueVendem: "Was Sie verkaufen", paraQuem: "Für wen", tomDeVoz: "Ihr Ton", provaSocial: "Ihr sozialer Beweis", oportunidade: "Die Chance" },
  it: { quemSao: "Chi siete", oQueVendem: "Cosa vendete", paraQuem: "Per chi", tomDeVoz: "Il vostro tono", provaSocial: "La vostra prova sociale", oportunidade: "L'opportunità" },
};

                                                                                                            
                                                                                                           
                                                                                                        
                                                          
const TR_LANGNAME: Record<string, string> = { pt: "português de Portugal", en: "inglês", es: "espanhol", fr: "francês", de: "alemão", it: "italiano" };
function copyTextFields(copy: any): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of ["intro", "verdict", "priority", "who", "quem", "analise", "help", "cta"]) { const v = copy?.[k]; if (typeof v === "string" && v.trim()) out[k] = v; }
  const secs = copy?.sections || {};
  for (const k of ["branding", "digital", "web", "creative"]) { const t = secs?.[k]?.t; if (typeof t === "string" && t.trim()) out[`sec_${k}`] = t; }
  return out;
}
const _trErr: string[] = [];
async function trBatch(fields: Record<string, string>, lang: string): Promise<any | null> {
  if (!Object.keys(fields).length) return {};
  const AK = process.env.ANTHROPIC_API_KEY || ""; const OK = process.env.OPENAI_API_KEY || "";
  const sys = `Traduz cada VALOR do JSON para ${TR_LANGNAME[lang] || lang}, mantendo o tom, o sentido e os números exatos. Sem saudações novas, sem títulos, sem travessão. Devolve SÓ o JSON com as MESMAS chaves.`;
  const usr = JSON.stringify(fields);
  let txt = "";
  if (!OK && !AK) _trErr.push("sem_chaves");
  if (OK) { try { const r = await fetch("https://api.openai.com/v1/chat/completions", { signal: AbortSignal.timeout(28000), method: "POST", headers: { Authorization: `Bearer ${OK}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 5000, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }) }); if (r.ok) { const d: any = await r.json(); txt = d?.choices?.[0]?.message?.content?.trim() || ""; } else { _trErr.push(`openai_${r.status}:${(await r.text().catch(() => "")).slice(0, 120)}`); } } catch (e: any) { _trErr.push("openai_exc:" + String(e?.message || e).slice(0, 80)); } }
  if (!txt && AK) { try { const r = await fetch("https://api.anthropic.com/v1/messages", { signal: AbortSignal.timeout(25000), method: "POST", headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 5000, system: sys, messages: [{ role: "user", content: usr }] }) }); if (r.ok) { const d: any = await r.json(); txt = (d?.content || []).map((c: any) => c?.text || "").join("").trim(); } else { _trErr.push(`anthropic_${r.status}:${(await r.text().catch(() => "")).slice(0, 120)}`); } } catch (e: any) { _trErr.push("anthropic_exc:" + String(e?.message || e).slice(0, 80)); } }
  if (!txt) return null;
  let j: any = null; try { j = JSON.parse((txt.match(/\{[\s\S]*\}/) || [txt])[0]); } catch { return null; }
  return (j && typeof j === "object") ? j : null;
}
async function translateCopyTo(copy: any, lang: string): Promise<any | null> {
  const fields = copyTextFields(copy);
  const keys = Object.keys(fields);
  if (!keys.length) return null;
                                                                                                          
                                                                                                  
  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < keys.length; i += 3) { const c: Record<string, string> = {}; keys.slice(i, i + 3).forEach((k) => { c[k] = fields[k]; }); chunks.push(c); }
  const rs = await Promise.all(chunks.map((c) => trBatch(c, lang)));
  const j: any = Object.assign({}, ...rs.map((r) => r || {}));
  let faltam = keys.filter((k) => !(typeof j[k] === "string" && j[k].trim()));
  if (faltam.length) {
    const rechunks: Record<string, string>[] = [];
    for (let i = 0; i < faltam.length; i += 2) { const c: Record<string, string> = {}; faltam.slice(i, i + 2).forEach((k) => { c[k] = fields[k]; }); rechunks.push(c); }
    const rs2 = await Promise.all(rechunks.map((c) => trBatch(c, lang)));
    Object.assign(j, ...rs2.map((r) => r || {}));
    faltam = keys.filter((k) => !(typeof j[k] === "string" && j[k].trim()));
  }
  (translateCopyTo as any)._dbg = { lotes: chunks.length, faltam, erros: _trErr.slice(-8) };
  if (faltam.length) return null;
  const tr = JSON.parse(JSON.stringify(copy));
  for (const k of ["intro", "verdict", "priority", "who", "quem", "analise", "help", "cta"]) { if (typeof j[k] === "string" && j[k].trim()) tr[k] = j[k].trim(); }
  for (const k of ["branding", "digital", "web", "creative"]) { const v = j[`sec_${k}`]; if (typeof v === "string" && v.trim() && tr.sections?.[k]) tr.sections[k].t = v.trim(); }
  return tr;
}

                                                                                                                                                                                                    
                                                                                                
                                                                                                  
                                                                        
                                                                                                        
                                                      
const LEAD_TR_MAX = { issues: 4, opps: 4, factos: 6, lims: 4 };

function leadTextFields(d: any): Record<string, string> {
  const out: Record<string, string> = {};
  const put = (k: string, v: any) => { if (typeof v === "string" && v.trim()) out[k] = v.trim(); };
  const vis = d?.audit?.visual || {};
  for (const k of ["impression", "hierarchy", "typography", "style", "polish", "premiumRead", "personality"]) put("v_" + k, vis[k]);
  (Array.isArray(vis.issues) ? vis.issues : []).slice(0, LEAD_TR_MAX.issues).forEach((x: any, i: number) => put("v_issue_" + i, x));
  const br = d?.audit?.brand || {};
  for (const k of ["archetype", "personality", "distinctNote", "coherence", "creative", "what"]) put("b_" + k, br[k]);
  (Array.isArray(br.opportunities) ? br.opportunities : []).slice(0, LEAD_TR_MAX.opps).forEach((x: any, i: number) => put("b_opp_" + i, x));
  const ds = d?.deepStudy || {};
  const dos = (ds.dossier && typeof ds.dossier === "object") ? ds.dossier : {};
  for (const k of ["quemSao", "oQueVendem", "paraQuem", "tomDeVoz", "provaSocial", "oportunidade"]) put("d_" + k, dos[k]);
  (Array.isArray(ds.factos) ? ds.factos : []).slice(0, LEAD_TR_MAX.factos).forEach((f: any, i: number) => put("d_facto_" + i, f && f.facto));
  (Array.isArray(ds.limitacoes) ? ds.limitacoes : []).slice(0, LEAD_TR_MAX.lims).forEach((x: any, i: number) => put("d_lim_" + i, x));
                                                     
  (Array.isArray(vis.strengths) ? vis.strengths : []).slice(0, 3).forEach((x: any, i: number) => put("v_str_" + i, x));
  put("v_fixFirst", vis.fixFirst);
                    
  const lg = (vis.logo && typeof vis.logo === "object") ? vis.logo : {};
  for (const k of ["craft", "colorsFit", "audienceFit", "memorable"]) put("lg_" + k, lg[k]);
  (Array.isArray(lg.opportunities) ? lg.opportunities : []).slice(0, 3).forEach((x: any, i: number) => put("lg_opp_" + i, x));
                                                                               
  const st = (d?.study && typeof d.study === "object") ? d.study : {};
  put("st_estudo", st.estudo);
  const stw = (st.swot && typeof st.swot === "object") ? st.swot : {};
  for (const q of ["forcas", "fraquezas", "oportunidades", "ameacas"]) {
    (Array.isArray(stw[q]) ? stw[q] : []).slice(0, 3).forEach((it: any, i: number) => put(`st_${q}_${i}`, it?.ponto));
  }
  (Array.isArray(st.vender) ? st.vender : []).slice(0, 3).forEach((v: any, i: number) => { put(`st_sv_${i}`, v?.servico); put(`st_mo_${i}`, v?.motivo); });
  return out;
}

                                                                                                  
                                                                                          
                                                                                                 
                                                                 
async function translateStudyTo(study: any, lang: string): Promise<any | null> {
  try {
    const fields: Record<string, string> = {};
    const put = (k: string, v: any) => { const t = String(v || "").trim(); if (t) fields[k] = t; };
    put("estudo", study.estudo);
    const sw = (study.swot && typeof study.swot === "object") ? study.swot : {};
    for (const q of ["forcas", "fraquezas", "oportunidades", "ameacas"]) {
      (Array.isArray(sw[q]) ? sw[q] : []).slice(0, 3).forEach((it: any, i: number) => put(`${q}_${i}`, it?.ponto));
    }
    (Array.isArray(study.vender) ? study.vender : []).slice(0, 3).forEach((v: any, i: number) => { put(`sv_${i}`, v?.servico); put(`mo_${i}`, v?.motivo); });
    const keys = Object.keys(fields);
    if (!keys.length) return study;
    const chunks: Record<string, string>[] = [];
    for (let i = 0; i < keys.length; i += 4) { const c: Record<string, string> = {}; keys.slice(i, i + 4).forEach((k) => { c[k] = fields[k]; }); chunks.push(c); }
    const j: any = Object.assign({}, ...(await Promise.all(chunks.map((c) => trBatch(c, lang)))).map((r) => r || {}));
    const faltam = keys.filter((k) => !(typeof j[k] === "string" && j[k].trim()));
    if (faltam.length) return null;                                                     
    const o = JSON.parse(JSON.stringify(study));
    if (j.estudo) o.estudo = j.estudo.trim();
    const osw = (o.swot && typeof o.swot === "object") ? o.swot : null;
    if (osw) for (const q of ["forcas", "fraquezas", "oportunidades", "ameacas"]) {
      if (Array.isArray(osw[q])) osw[q] = osw[q].map((it: any, i: number) => (it && j[`${q}_${i}`]) ? { ...it, ponto: j[`${q}_${i}`].trim() } : it);
    }
    if (Array.isArray(o.vender)) o.vender = o.vender.map((v: any, i: number) => v ? { ...v, ...(j[`sv_${i}`] ? { servico: j[`sv_${i}`].trim() } : {}), ...(j[`mo_${i}`] ? { motivo: j[`mo_${i}`].trim() } : {}) } : v);
    o._trLang = lang;
    return o;
  } catch { return null; }
}

async function translateLeadTo(d: any, lang: string): Promise<Record<string, string> | null> {
  const fields = leadTextFields(d);
  const keys = Object.keys(fields);
  if (!keys.length) return {};
  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < keys.length; i += 4) { const c: Record<string, string> = {}; keys.slice(i, i + 4).forEach((k) => { c[k] = fields[k]; }); chunks.push(c); }
  const rs = await Promise.all(chunks.map((c) => trBatch(c, lang)));
  const j: any = Object.assign({}, ...rs.map((r) => r || {}));
  const faltam = keys.filter((k) => !(typeof j[k] === "string" && j[k].trim()));
  if (faltam.length) {
    const re: Record<string, string>[] = [];
    for (let i = 0; i < faltam.length; i += 3) { const c: Record<string, string> = {}; faltam.slice(i, i + 3).forEach((k) => { c[k] = fields[k]; }); re.push(c); }
    Object.assign(j, ...(await Promise.all(re.map((c) => trBatch(c, lang)))).map((r) => r || {}));
  }
  const out: Record<string, string> = {};
  for (const k of keys) { if (typeof j[k] === "string" && j[k].trim()) out[k] = j[k].trim(); }
  return Object.keys(out).length ? out : null;
}

                                                                                                   
                                                                                                   
function applyLeadTr(d: any, tr: Record<string, string> | null | undefined): any {
  if (!tr || !Object.keys(tr).length) return d;
  const o = JSON.parse(JSON.stringify(d));
  const set = (obj: any, k: string, v: any) => { if (obj && typeof v === "string" && v.trim()) obj[k] = v; };
  if (o.audit?.visual) {
    for (const k of ["impression", "hierarchy", "typography", "style", "polish", "premiumRead", "personality"]) set(o.audit.visual, k, tr["v_" + k]);
    if (Array.isArray(o.audit.visual.issues)) o.audit.visual.issues = o.audit.visual.issues.map((x: any, i: number) => tr["v_issue_" + i] || x);
  }
  if (o.audit?.brand) {
    for (const k of ["archetype", "personality", "distinctNote", "coherence", "creative", "what"]) set(o.audit.brand, k, tr["b_" + k]);
    if (Array.isArray(o.audit.brand.opportunities)) o.audit.brand.opportunities = o.audit.brand.opportunities.map((x: any, i: number) => tr["b_opp_" + i] || x);
  }
  if (o.audit?.visual) {
    if (Array.isArray(o.audit.visual.strengths)) o.audit.visual.strengths = o.audit.visual.strengths.map((x: any, i: number) => tr["v_str_" + i] || x);
    set(o.audit.visual, "fixFirst", tr["v_fixFirst"]);
    if (o.audit.visual.logo && typeof o.audit.visual.logo === "object") {
      for (const k of ["craft", "colorsFit", "audienceFit", "memorable"]) set(o.audit.visual.logo, k, tr["lg_" + k]);
      if (Array.isArray(o.audit.visual.logo.opportunities)) o.audit.visual.logo.opportunities = o.audit.visual.logo.opportunities.map((x: any, i: number) => tr["lg_opp_" + i] || x);
    }
  }
  if (o.study && typeof o.study === "object") {
    set(o.study, "estudo", tr["st_estudo"]);
    const sw2 = (o.study.swot && typeof o.study.swot === "object") ? o.study.swot : null;
    if (sw2) for (const q of ["forcas", "fraquezas", "oportunidades", "ameacas"]) {
      if (Array.isArray(sw2[q])) sw2[q] = sw2[q].map((it: any, i: number) => (it && tr[`st_${q}_${i}`]) ? { ...it, ponto: tr[`st_${q}_${i}`] } : it);
    }
    if (Array.isArray(o.study.vender)) o.study.vender = o.study.vender.map((v: any, i: number) => v ? { ...v, ...(tr[`st_sv_${i}`] ? { servico: tr[`st_sv_${i}`] } : {}), ...(tr[`st_mo_${i}`] ? { motivo: tr[`st_mo_${i}`] } : {}) } : v);
  }
  if (o.deepStudy) {
    if (o.deepStudy.dossier && typeof o.deepStudy.dossier === "object") { for (const k of ["quemSao", "oQueVendem", "paraQuem", "tomDeVoz", "provaSocial", "oportunidade"]) set(o.deepStudy.dossier, k, tr["d_" + k]); }
    if (Array.isArray(o.deepStudy.factos)) o.deepStudy.factos = o.deepStudy.factos.map((f: any, i: number) => (f && tr["d_facto_" + i]) ? { ...f, facto: tr["d_facto_" + i] } : f);
    if (Array.isArray(o.deepStudy.limitacoes)) o.deepStudy.limitacoes = o.deepStudy.limitacoes.map((x: any, i: number) => tr["d_lim_" + i] || x);
  }
  return o;
}
function renderHtml(d: any): string {
  const a = d.audit || {};
  const lang = lang0Of(d);
  const t = L[lang] || L.fr;
  const at = ATELIER[lang] || ATELIER.fr;
  const company = esc(d.company || "");
  const date = esc((d.publishedAt || "").slice(0, 10));
  const copy = d.copy || {};
  const segLabel = (copy.segment && copy.segment.label) ? String(copy.segment.label) : "";
  const segUnconfirmed = !!d.segmentoPorConfirmar;
  const siteUnreadable = !!d.siteNaoLegivel;
                                                                                                                 
                                                                                                        
  const S = (v: any) => { const s = v ? esc(scrubLead(String(v))) : ""; return s; };
                                                                                             
                                                                                               
  const clip = (raw: any, max: number): string => {
    const t = String(raw || "").trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const fim = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf(".\n"));
    if (fim > max * 0.45) return cut.slice(0, fim + 1);
    const sp = cut.lastIndexOf(" ");
    return (sp > 0 ? cut.slice(0, sp) : cut) + ".";
  };
  const intro = S(clip(copy.intro, 300)), verdict = S(clip(copy.verdict, 220)), priority = S(clip(copy.priority, 260)), who = S(clip(copy.who, 300)), quem = S(clip(copy.quem, 300)), analise = S(clip(copy.analise, 280)), help = S(clip(copy.help, 240)), cta = S(clip(copy.cta, 180));
  const sec = copy.sections || {};
  const brandingT = siteUnreadable ? "" : S(clip(sec.branding && sec.branding.t, 460));
  const digitalT = S(clip(sec.digital && sec.digital.t, 460));
  const webT = S(clip(sec.web && sec.web.t, 460));
  const creativeT = siteUnreadable ? "" : S(clip(sec.creative && sec.creative.t, 460));
  const q = (o: any) => (o && o.q) ? esc(String(o.q)) : "";
  const segNote = ({ fr: "Note honnête : nous n'avons pas pu déterminer votre secteur à partir des sources publiques (votre site et votre présence publique). Cette lecture est donc transversale, pas spécifique à un secteur.", en: "Honest note: we couldn't pin down your sector from the public sources (your website and your public presence). So this read is cross-sector, not specific to any one industry.", pt: "Nota honesta: não conseguimos determinar o vosso setor a partir das fontes públicas (o vosso site e a vossa presença pública). Por isso esta leitura é transversal, não específica de um setor." } as Record<string, string>)[lang] || "";
  const siteNote = ({ fr: "Note technique honnête : votre site est construit en JavaScript et son contenu n'est pas explorable de l'extérieur, nous n'avons donc pas pu lire la marque ni la partie créative. Il ne reste que la lecture technique mesurée (vitesse, SEO technique et sécurité de la connexion).", en: "Honest technical note: your site is built in JavaScript and its content isn't crawlable from the outside, so we couldn't read the brand or the creative side. Only the measured technical read remains (speed, technical SEO and connection security).", pt: "Nota técnica honesta: o vosso site é construído em JavaScript e o conteúdo não é rastreável de fora, por isso não conseguimos ler a marca nem a parte criativa. Fica apenas a leitura técnica medida (velocidade, SEO técnico e segurança da ligação)." } as Record<string, string>)[lang] || "";
  const base = (process.env.PUBLIC_BASE_URL || process.env.ABIL_PUBLIC_BASE || SITE).replace(/\/$/, "");
  const takedownUrl = `${base}/api/audit?slug=${encodeURIComponent(String(d.slug || ""))}&action=takedown`;
  const disclaimerTxt = ({ fr: "Cette analyse a été générée automatiquement à partir de sources publiques (votre site et votre présence publique), n'a pas été demandée par vous et peut être retirée à tout moment, sur demande.", en: "This analysis was generated automatically from public sources (your website and your public presence), was not requested by you, and can be removed at any time on request.", pt: "Esta análise foi gerada automaticamente a partir de fontes públicas (o vosso site e a vossa presença pública), não foi solicitada por vós e pode ser removida a qualquer momento, a pedido." } as Record<string, string>)[lang] || "";
  const removeLabel = ({ fr: "Retirer cette page", en: "Remove this page", pt: "Remover esta página", de: "Diese Seite entfernen", it: "Rimuovere questa pagina" } as Record<string, string>)[lang] || "Retirer cette page";

                                                                                       
  const metricPill = (label: string, val: string) => `<span class="pill"><b>${esc(label)}</b> ${esc(val)}</span>`;
  const metrics: string[] = [];
  if (!a.semSite) {
    metrics.push(metricPill(t.perf, a.perf != null ? `${a.perf}/100` + (a.lcp ? " · " + a.lcp : "") : "n/d"));
    metrics.push(metricPill(t.seo, a.seo != null ? `${a.seo}/100` : "n/d"));
    metrics.push(metricPill(t.acc, a.a11y != null ? `${a.a11y}/100` : "n/d"));
                                                                                                                 
                                                                                                              
    metrics.push(metricPill(t.secure, typeof a.https === "boolean" ? (a.https ? "✓" : "✕") : "n/d"));
    metrics.push(metricPill(t.aivis, typeof a.aiBlocked === "boolean" ? (a.aiBlocked ? "✕" : "✓") : "n/d"));
    metrics.push(metricPill(t.schema, typeof a.hasSchema === "boolean" ? (a.hasSchema ? "✓" : "✕") : "n/d"));
  }
  const metricsBar = metrics.length ? `<div class="pills">${metrics.join("")}</div>` : "";

  const section = (title: string, question: string, body: string, extra?: string) => body ? `<section class="blk"><div class="eyebrow">${esc(title)}</div>${question ? `<h2>${question}</h2>` : ""}<p>${body}</p>${extra || ""}</section>` : "";

                                                                                                              
                                                                                                
  const segKey = (copy.segment && copy.segment.key) ? String(copy.segment.key) : "";
  const bannerUrl = (d._segCfg && typeof d._segCfg.banner === "string" && /^https?:\/\//.test(d._segCfg.banner))
    ? d._segCfg.banner
    : (SEG_BANNERS[segKey] || "");
                                                                                                     
                                                                                            
                                                                                                  
                                                                                                   
  const banner900 = /^\/lp\/[a-z0-9_]+-1600\.webp$/.test(bannerUrl) ? bannerUrl.replace("-1600.webp", "-900.webp") : "";
  const heroSrcset = banner900 ? ` srcset="${esc(banner900)} 900w, ${esc(bannerUrl)} 1600w" sizes="100vw"` : "";
  const heroHtml = bannerUrl ? `<figure class="hero"><img src="${esc(bannerUrl)}"${heroSrcset} width="1600" height="901" alt="" loading="eager" decoding="async" fetchpriority="high"><figcaption class="heroc"><span class="eyebrow">${esc(segLabel || t.audit)}</span><h1 class="heron">${company}</h1></figcaption></figure>` : "";

                                                                                                  
                                                                                                         
                                                                                                                 
  const sc: SegCopy | null = (d._segCopy && typeof d._segCopy === "object") ? d._segCopy : null;
                                                                                                        
  const whoP = sc ? sc.quem : at.whoP;
  const howP = sc ? sc.comoText : at.howP;
  const psHtml = sc ? `<section class="blk"><div class="eyebrow">${esc(t.psT)}</div>${sc.analise ? `<p class="lead">${esc(sc.analise)}</p>` : ""}<div class="ps">${PS_ORDER.map((p, i) => ({ p, i, txt: String(sc.ps[p] || "").trim() })).filter((x) => x.txt).map(({ p, i, txt }, idx) => `<details class="p"${idx === 0 ? " open" : ""}><summary><span class="pn mono">${String(i + 1).padStart(2, "0")}</span><h3>${esc(t[("p" + p.charAt(0).toUpperCase() + p.slice(1)) as string] || p)}</h3><span class="pt mono" aria-hidden="true">+</span></summary><p>${esc(txt)}</p></details>`).join("")}</div></section>` : "";
  const bioHtml = sc && sc.bio ? `<p class="bio mono">${esc(sc.bio)}</p>` : "";

                                                                                                              
                                                                                                            
                                                                                        
  const briefing = (d.briefing && typeof d.briefing === "object") ? d.briefing : ((a.briefing && typeof a.briefing === "object") ? a.briefing : null);
  const hasGoogleData = (a.googleRating != null) || (a.googleReviews != null) || (Number(a.reviewsUsed) > 0) ||
    !!(briefing && briefing.fontes && typeof briefing.fontes === "object" && Object.keys(briefing.fontes).some((k) => briefing.fontes[k] === "places" || briefing.fontes[k] === "review-google"));
  const gAttrib = hasGoogleData ? googleAttrib(lang) : "";
  const whoBlock = (!siteUnreadable && (who || quem)) ? `<section class="blk"><div class="eyebrow">${esc(t.who)} ${company}</div><p>${[who, quem].filter(Boolean).join("</p><p>")}</p>${gAttrib}</section>` : "";
  const analiseBlock = (!siteUnreadable && analise) ? `<section class="blk cont"><p class="lead">${analise}</p>${gAttrib}</section>` : "";

                                                                                                                                                                                                                                                                                                     
                                                                                                         
                                                                                                          
                                                                                                         
                                                                                                       
  const deep = (d.deepStudy && typeof d.deepStudy === "object" && d.deepStudy.ok) ? d.deepStudy : null;
  const vis = (a.visual && typeof a.visual === "object") ? a.visual : null;
  const brand = (a.brand && typeof a.brand === "object") ? a.brand : null;
  const dossier = (deep && deep.dossier && typeof deep.dossier === "object") ? deep.dossier : null;
  const isExample = !!d._example;
  const exampleTag = isExample ? `<span class="extag mono">${esc(t.exampleTag)}</span>` : "";
  const chip = (label: string, val: string) => val ? `<div class="chip"><span class="chl mono">${esc(label)}</span><span class="chv">${esc(val)}</span></div>` : "";

                                                                                                     
                                                                                                            
  const techNums = [a.perf, a.seo, a.a11y].filter((x) => x != null && isFinite(Number(x))).map(Number);
  const scoreVal = techNums.length ? Math.round(techNums.reduce((s, n) => s + n, 0) / techNums.length) : null;
  const bars = !a.semSite ? [bar(t.perf, a.perf, "speed"), bar(t.seo, a.seo, "search"), bar(t.acc, a.a11y, "access")].filter(Boolean).join("") : "";
  const checks = !a.semSite ? [
    checkRow(t.secure, a.https, "lock"),
    checkRow(t.aivis, a.aiBlocked === true ? false : (a.aiBlocked === false ? true : undefined), "eye"),
    checkRow(t.schema, a.hasSchema, "code"),
  ].filter(Boolean).join("") : "";
  const techPanel = (bars || checks || scoreVal != null) ? `<section class="blk reveal"><div class="eyebrow">${esc(t.techT)}${exampleTag}</div><div class="tpanel">${scoreVal != null ? `<div class="tdonut">${donut(scoreVal, "/100", t.techScore)}</div>` : ""}<div class="tbars">${bars}${checks ? `<ul class="cks">${checks}</ul>` : ""}</div></div><div class="note">${esc(t.techNote)}</div></section>` : "";

                                                                                                             
                                                                                                             
  const cleanList = (arr: any[], n: number): string[] => (Array.isArray(arr) ? arr : []).map((x) => S(String(x || ""))).filter(Boolean).slice(0, n);

                                                                                          
  const visChips = vis ? [chip(t.diagScore, visPremiumLabel(vis.premiumRead, lang)), chip(t.styleLbl, visStyleLabel(vis.style, lang)), chip(t.finishLbl, visPolishLabel(vis.polish, lang))].filter(Boolean).join("") : "";
  const visIssuesArr = vis ? cleanList(vis.issues, 3) : [];
  const visIssues = visIssuesArr.length ? `<ul class="ilist">${visIssuesArr.map((x) => `<li>${ico("alert")}<span>${x}</span></li>`).join("")}</ul>` : "";
  const visText = vis ? [vis.impression, vis.hierarchy, vis.typography].map((x) => S(String(x || ""))).filter(Boolean) : [];
  const palette = pickPalette(vis, a);
  const swatches = palette.length ? `<div class="swatches">${palette.slice(0, 6).map((c) => `<span class="sw" style="background:${esc(c)}"><span class="swl mono">${esc(c)}</span></span>`).join("")}</div>` : "";
  const seenPanel = (visChips || visIssues || visText.length || swatches) ? `<section class="blk reveal"><div class="eyebrow">${esc(t.seenT)}${exampleTag}</div>${visText[0] ? `<p class="lead">${visText[0]}</p>` : ""}${visChips ? `<div class="chips">${visChips}</div>` : ""}${visText.slice(1).map((x) => `<p>${x}</p>`).join("")}${swatches ? `<div class="eyebrow subeb">${esc(t.paletteT)}</div>${swatches}` : ""}${visIssues}</section>` : "";

                                                                                                       
  const brandOpps = cleanList((brand && Array.isArray(brand.opportunities) && brand.opportunities.length) ? brand.opportunities : (dossier && dossier.oportunidade ? [dossier.oportunidade] : []), 3);
  const brandText = brand ? [brand.personality, brand.distinctNote, brand.coherence].map((x) => S(String(x || ""))).filter(Boolean) : [];
  const oppList = brandOpps.length ? `<div class="eyebrow subeb">${esc(t.oppT)}</div><ul class="olist">${brandOpps.map((x) => `<li>${ico("target")}<span>${x}</span></li>`).join("")}</ul>` : "";
  const brandPanel = ((brand && (brand.archetype || brandText.length)) || oppList) ? `<section class="blk reveal"><div class="eyebrow">${esc(t.brandReadT)}${exampleTag}</div>${brandText.map((x) => `<p>${x}</p>`).join("")}${oppList}</section>` : "";

                                                                                                         
                                                                                                       
  const dossierRows = dossier ? DOSSIER_ORDER.map(([k, iconName]) => {
    const v = S(clip(dossier[k], 150)); const lab = (DOSSIER_LABELS[lang] || DOSSIER_LABELS.fr)[k] || k;
    return v ? `<div class="drow">${ico(iconName)}<div><div class="dk mono">${esc(lab)}</div><p>${v}</p></div></div>` : "";
  }).filter(Boolean).join("") : "";
  const factos = (deep && Array.isArray(deep.factos)) ? deep.factos.filter((f: any) => f && f.facto && S(String(f.facto))).slice(0, 4) : [];
  const factosHtml = factos.length ? `<div class="eyebrow subeb">${esc(t.factsT)}</div><ul class="flist">${factos.map((f: any) => {
                                                                                                           
                                                                                                               
    const fonteOk = /^https?:\/\//i.test(String(f.fonte || ""));
    const src = fonteOk ? `<a class="fsrc mono" href="${esc(String(f.fonte))}" target="_blank" rel="noopener nofollow">${esc(t.sourceLbl)}</a>` : "";
    const cit = (f.citacaoOk && f.citacao) ? `<span class="fcit">« ${esc(String(f.citacao))} »</span>` : "";
    return `<li>${ico("check")}<div><span>${S(String(f.facto))}</span>${cit}${src}</div></li>`;
  }).join("")}</ul>` : "";
  const rigor = deep ? [
    (Number(deep.paginasLidas) > 0) ? { n: Number(deep.paginasLidas), l: t.pagesRead, i: "doc" } : null,
    (Number(deep.redesLidas) > 0) ? { n: Number(deep.redesLidas), l: t.netsRead, i: "users" } : null,
    (deep.pesquisaWeb && Number(deep.pesquisaWeb.n) > 0) ? { n: Number(deep.pesquisaWeb.n), l: t.webSearch, i: "globe" } : null,
  ].filter(Boolean) as { n: number; l: string; i: string }[] : [];
  const rigorHtml = rigor.length ? `<div class="rigor">${rigor.map((r) => `<div class="rstat">${ico(r.i)}<div><span class="rn mono">${r.n}</span><span class="rl">${esc(r.l)}</span></div></div>`).join("")}</div>` : "";
                                                                                                                  
  const seguidores = (deep && Array.isArray(deep.redesSeguidores)) ? deep.redesSeguidores.filter((s: any) => s && s.valor && String(s.platform || "").trim()) : [];
                                                                                                                
  const segHtml = seguidores.length ? `<div class="eyebrow subeb">${esc(t.socialT)}</div><div class="chips">${seguidores.slice(0, 4).map((s: any) => chip(String(s.platform), `${String(s.valor)} ${t.followers}`)).join("")}</div>` : "";
  const deepPanel = (dossierRows || factosHtml || rigorHtml || segHtml) ? `<section class="blk deepblk reveal"><div class="eyebrow">${esc(t.deepT)}${exampleTag}</div>${rigorHtml}${dossierRows ? `<div class="dossier">${dossierRows}</div>` : ""}${segHtml}${factosHtml}</section>` : "";

                                                                                                  
  const gr = Number(a.googleRating); const grN = Number(a.googleReviews);
  const stars = (isFinite(gr) && gr > 0) ? `<div class="stars" aria-label="${gr.toFixed(1)}/5">${[0, 1, 2, 3, 4].map((i) => `<span class="star${gr >= i + 0.75 ? " f" : gr >= i + 0.25 ? " h" : ""}">${ico("star")}</span>`).join("")}<span class="grn mono">${gr.toFixed(1)}${isFinite(grN) && grN > 0 ? ` · ${grN} ${t.reviewsN}` : ""}</span></div>` : "";
  const revSample = (Array.isArray(a.reviewsSample) ? a.reviewsSample : []).filter((r: any) => r && r.text && S(String(r.text))).slice(0, 2);
  const revHtml = revSample.length ? `<ul class="revs">${revSample.map((r: any) => `<li>${ico("quote")}<p>${S(String(r.text))}</p></li>`).join("")}</ul>` : "";
  const googlePanel = (stars || revHtml) ? `<section class="blk reveal"><div class="eyebrow">${esc(t.googleT)}${exampleTag}</div>${stars}${revHtml}${googleAttrib(lang)}</section>` : "";

                                                                                                          
  const lims = deep ? cleanList(deep.limitacoes, 3) : [];
  const honestPanel = lims.length ? `<section class="blk honest reveal"><div class="eyebrow">${esc(t.honestT)}${exampleTag}</div><ul class="hlist">${lims.map((x) => `<li>${ico("cross")}<span>${x}</span></li>`).join("")}</ul></section>` : "";

                                                                                                                
                                                                                                                   
                                                                                                     
                                                                                                    
                                                                                                   
                                                                                              
                                                                                 
  const introBlock = `<section class="blk intro reveal"><div class="eyebrow">${esc(t.introT)}</div><p class="hi">${esc(t.introHi)}</p><p class="lead">${esc(t.introP1)}</p><p>${esc(t.introP2)}</p><p>${esc(t.introP3)}</p><div class="introk">${AST}<span>${esc(t.introKick)}</span></div></section>`;

                                                                                                    
                                                                                                
  const FRONTS: [string, string][] = [[t.f1n, t.f1d], [t.f2n, t.f2d], [t.f3n, t.f3d], [t.f4n, t.f4d]];
  const frontsBlock = `<section class="blk reveal"><div class="eyebrow">${esc(t.frontsT)}</div><p>${esc(t.frontsSub)}</p><ul class="fronts">${FRONTS.map(([n, dsc]) => `<li><span class="fn">${esc(n)}</span><span class="fd">${esc(dsc)}</span></li>`).join("")}</ul></section>`;

                                                                                                    
                                                                                                 
                                                                                                 
                                                                                                   
                                                         
  const langSwitch = `<nav class="langs" aria-label="${esc(t.langT)}">${LP_LANGS.filter((k) => L[k]).map((k) => `<a href="?lang=${k}"${k === lang ? ' aria-current="page"' : ""} hreflang="${k}">${esc(k.toUpperCase())}</a>`).join("")}</nav>`;

                                                                                                    
                                                      
  const rdvUrl = (process.env.ABIL_LP_RDV_URL || "").trim()
    || `mailto:sam@abil.ch?subject=${encodeURIComponent(t.audit + " · " + (d.company || ""))}`;

                                                                                                  
                                                                                                 
                                                                                                  
                                                                                          
  const shotDesk = /^https:\/\//.test(String(a.desktopShot || "").trim()) ? String(a.desktopShot).trim() : "";
  const shotMob = /^https:\/\//.test(String(a.mobileShot || "").trim()) ? String(a.mobileShot).trim() : "";
  const shotHost = (() => { try { return new URL(String(d.website || "")).host.replace(/^www\./, ""); } catch { return ""; } })();
  const visStrengths = vis ? cleanList((vis as any).strengths, 3) : [];
  const visFix = vis ? S(String((vis as any).fixFirst || "")) : "";
  const galDevices = (shotDesk || shotMob) ? `<div class="gal">${shotDesk ? `<figure class="bwin"><div class="bbar"><i></i><i></i><i></i><span class="mono">${esc(shotHost)}</span></div><img src="${esc(shotDesk)}" alt="" loading="lazy" decoding="async"></figure>` : ""}${shotMob ? `<figure class="pwin"><img src="${esc(shotMob)}" alt="" loading="lazy" decoding="async"><figcaption class="mono">${esc(t.mobLbl)}</figcaption></figure>` : ""}</div>` : "";
  const galCols = (visStrengths.length || visIssuesArr.length) ? `<div class="gcols">${visStrengths.length ? `<div class="gcol"><div class="eyebrow subeb">${esc(t.strongT)}</div><ul class="olist">${visStrengths.map((x) => `<li>${ico("check")}<span>${x}</span></li>`).join("")}</ul></div>` : ""}${visIssuesArr.length ? `<div class="gcol"><div class="eyebrow subeb">${esc(t.brakeT)}</div><ul class="ilist">${visIssuesArr.map((x) => `<li>${ico("alert")}<span>${x}</span></li>`).join("")}</ul></div>` : ""}</div>` : "";
  const galFix = visFix ? `<div class="fixcall"><span class="mono fixlbl">${esc(t.fixFirstT)}</span><p>${visFix}</p></div>` : "";
  const shotBlock = (galDevices || galCols) ? `<section class="blk reveal"><div class="eyebrow">${esc(t.shotT)}${exampleTag}</div>${visText[0] ? `<p class="lead">${visText[0]}</p>` : `<p class="lead">${esc(t.shotP)}</p>`}${galDevices}${galCols}${galFix}</section>` : "";

                                                                                             
  const lgo = (vis && (vis as any).logo && typeof (vis as any).logo === "object") ? (vis as any).logo : null;
  const lgoText = lgo ? [lgo.craft, lgo.colorsFit, lgo.audienceFit, lgo.memorable].map((x: any) => S(String(x || ""))).filter(Boolean) : [];
  const lgoOpps = lgo ? cleanList(lgo.opportunities, 3) : [];
  const logoBlock = (lgoText.length || lgoOpps.length) ? `<section class="blk reveal"><div class="eyebrow">${esc(t.signT)}${exampleTag}</div>${lgoText.map((x) => `<p>${x}</p>`).join("")}${lgoOpps.length ? `<ul class="olist">${lgoOpps.map((x) => `<li>${ico("target")}<span>${x}</span></li>`).join("")}</ul>` : ""}</section>` : "";

                                                                                                      
                                                                                                    
                                                                                        
  const stu = (d.study && typeof d.study === "object") ? d.study : null;
  const swotQ = (rot: string, arr: any[], icon: string) => (Array.isArray(arr) && arr.length) ? `<div class="swq"><div class="eyebrow subeb">${esc(rot)}</div><ul>${arr.slice(0, 3).map((it: any) => `<li>${ico(icon)}<div><p>${S(String(it?.ponto || ""))}</p>${it?.evidencia ? `<span class="swev mono">${esc(String(it.evidencia).slice(0, 160))}</span>` : ""}</div></li>`).join("")}</ul></div>` : "";
  const sw = stu && stu.swot && typeof stu.swot === "object" ? stu.swot : null;
  const swQuads = sw ? [swotQ(t.swotF, sw.forcas, "check"), swotQ(t.swotW, sw.fraquezas, "alert"), swotQ(t.swotO, sw.oportunidades, "target"), swotQ(t.swotM, sw.ameacas, "eye")].filter(Boolean).join("") : "";
  const swotBlock = (swQuads || (stu && S(String(stu.estudo || "")))) ? `<section class="blk reveal"><div class="eyebrow">${esc(t.swotT)}${exampleTag}</div>${stu && stu.estudo ? `<p class="lead">${S(clip(stu.estudo, 320))}</p>` : ""}${swQuads ? `<div class="swot">${swQuads}</div>` : ""}</section>` : "";
  const acts = stu && Array.isArray(stu.vender) ? stu.vender.slice(0, 3).filter((v: any) => v && (v.servico || v.motivo)) : [];
  const actsBlock = acts.length ? `<section class="blk reveal"><div class="eyebrow">${esc(t.actT)}${exampleTag}</div><ol class="acts">${acts.map((v: any, i: number) => `<li><span class="an">${String(i + 1).padStart(2, "0")}</span><div><h3>${S(String(v.servico || ""))}</h3><p>${S(String(v.motivo || ""))}</p></div></li>`).join("")}</ol></section>` : "";

  const WM = AST.replace('class="ast"', 'class="wm"');

                                                                                                 
                                                                                                  
                                                            
  const atBand = (src: string, cap: string, tall: boolean) => `<figure class="band${tall ? " tall" : ""} reveal"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"><figcaption class="mono">${esc(cap)}</figcaption></figure>`;
  const atelierBand1 = atBand("/brand/kv-logo-yellow-3.jpg", "ABiL · Genève", true);
  const atelierBand2 = atBand("/brand/kv-men-3.jpg", "L'atelier", false);

  const signBlock = `<section class="signoff reveal"><div class="savatar"><img src="https://d1vtit0cxozsxwqh.public.blob.vercel-storage.com/equipa/v3/samuel-dahan.jpg" width="520" height="500" loading="lazy" decoding="async" alt="Samuel Dahan"></div><div class="sinfo"><div class="sname">Samuel Dahan</div><div class="srole mono">${esc(t.signRole)} · ABiL${AST}</div><p class="sbio">${esc(t.signBio)}</p><a class="btn" href="mailto:sam@abil.ch?subject=${encodeURIComponent(t.audit + " · " + (d.company || ""))}">${esc(t.signCta)} →</a></div></section>`;

  return `<!doctype html><html lang="${lang}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(t.audit)} · ${company}</title>
<style>
/* Mundial, ABiL's actual font, is served from the site's own domain (public/fonts, same origin, no CORS).
   The landing page is standalone HTML and does not load the site bundle. Without these @font-face rules,
   visitors fell back to system-ui and lost the design system typography unless Mundial was installed locally.
   The font stays in a separate file instead of inline base64 because the landing page uses no-store. Inline data
   would download about 135 KB on every visit, while this file can be cached by the browser across all 18 pages. */
@font-face{font-family:'Mundial';src:url(/fonts/Mundial-Regular.otf) format('opentype');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:'Mundial';src:url(/fonts/Mundial-DemiBold.otf) format('opentype');font-weight:600;font-style:normal;font-display:swap}
@font-face{font-family:'Mundial';src:url(/fonts/Mundial-DemiBold.otf) format('opentype');font-weight:700;font-style:normal;font-display:swap}
/* Silent precision. ABiL design system: Noir #0a0a0b, Citron #d2ff01, Violette #be8efc, Leman #c7c7c7;
   Mundial plus JetBrains Mono; radius 0 because the ABiL site is rectilinear. Swiss editorial spacing and hairlines. */
:root{--noir:#0a0a0b;--ink:#efe9df;--muted:#7a736a;--rouge:#d2ff01;--violet:#be8efc;--beige:#c7c7c7;--line:rgba(239,233,223,.12);--line2:rgba(239,233,223,.30);--gut:clamp(20px,5vw,34px)}
*{box-sizing:border-box}
html,body{margin:0;padding:0;max-width:100%;overflow-x:hidden}
body{background:var(--noir);color:var(--ink);font-family:'Mundial',system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.62;letter-spacing:-.01em;-webkit-font-smoothing:antialiased;font-feature-settings:"kern" 1}
.mono{font-family:ui-monospace,'JetBrains Mono',Menlo,monospace;letter-spacing:0}
.wrap{max-width:768px;margin:0 auto;padding:0 var(--gut) clamp(80px,12vw,132px);counter-reset:sec}
/* Masthead: identity on the left, monospaced discipline on the right, separated by a hairline. */
.mast{max-width:768px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:clamp(26px,5vw,40px) var(--gut) 16px}
.mast.line{border-bottom:1px solid var(--line2)}
.logo{white-space:nowrap;display:inline-flex;align-items:center;color:var(--ink);text-decoration:none}
/* Use the vector brand logo from src/assets/logos/abil-blanc.svg, never a manually typeset name. */
.abil-logo{height:19px;width:auto;display:block}
.by{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted)}
/* Language selector: the page opens in the visitor's language and still allows switching.
   These are real ?lang= links rather than JavaScript, so they always work and the server returns the cached translation. */
.langs{display:flex;align-items:center;gap:0;flex:0 0 auto}
.langs a{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);text-decoration:none;padding:5px 9px;border:1px solid transparent;transition:color .2s}
.langs a:hover{color:var(--ink)}
.langs a[aria-current="page"]{color:var(--ink);border-color:var(--line2)}
/* Canonical brand asterisk, matching the pinwheel in src/App.tsx, never a generic typeset asterisk. */
.ast{width:8px;height:8px;display:inline-block;margin-left:3px;color:var(--rouge);flex:0 0 auto}
/* Editorial eyebrow: numbered index in rouge plus a monospaced label, numbered through a CSS counter. */
.eyebrow{font-family:ui-monospace,'JetBrains Mono',Menlo,monospace;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--beige);margin:0 0 20px;display:flex;align-items:center;flex-wrap:wrap;gap:11px}
.blk{counter-increment:sec}.blk.cont{counter-increment:none}
.blk>.eyebrow::before{content:counter(sec,decimal-leading-zero);color:var(--rouge);font-size:11px;letter-spacing:.1em}
.blk>.eyebrow::after{content:"";flex:1;height:1px;background:var(--line);min-width:20px}
/* Subheadings such as palette, facts and opportunities have no section number or rule because they belong to the preceding section. */
.subeb{display:flex;align-items:center;gap:10px;font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:36px 0 14px}
.blk>.eyebrow.subeb::before{content:none}
.blk>.eyebrow.subeb::after{background:var(--line);min-width:16px}
/* Hero: segment banner with the client's monumental name bleeding across it. */
.hero{position:relative;margin:0;width:100%;height:clamp(300px,44vh,460px);overflow:hidden}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 38%;display:block}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,var(--noir) 2%,rgba(11,11,11,.55) 42%,rgba(11,11,11,.08) 82%)}
.heroc{position:absolute;left:50%;transform:translateX(-50%);bottom:0;z-index:2;width:100%;max-width:768px;padding:0 var(--gut) clamp(34px,5vw,52px)}
.heroc .eyebrow{margin-bottom:14px;color:var(--rouge)}
.heron{display:block;font-size:clamp(1.9rem,5.2vw,3.2rem);line-height:1.02;letter-spacing:-.03em;font-weight:700;margin:0}
/* Page header below the hero: signed analysis and date in monospaced type. */
.by-lead{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);padding-top:clamp(34px,5vw,48px)}
/* The five Ps: Personality leads with a violet number, while the others use rouge. */
.ps{list-style:none;margin:22px 0 0;padding:0}
.p{display:flex;gap:clamp(16px,4vw,32px);padding:26px 0;border-top:1px solid var(--line)}
.p:first-child{border-top:0;padding-top:6px}
.pn{font-family:ui-monospace,'JetBrains Mono',monospace;color:var(--rouge);font-size:12px;letter-spacing:.08em;padding-top:8px;min-width:28px}
.p:first-child .pn{color:var(--violet)}
.pb{flex:1;min-width:0}
.pb h3{font-size:clamp(17px,2.6vw,20px);margin:0 0 9px;font-weight:600;letter-spacing:-.02em;color:var(--ink)}
.pb p{margin:0;color:var(--beige)}
.bio{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:.05em;color:var(--muted);margin:22px 0 0}
h1{font-size:clamp(1.7rem,4.6vw,2.6rem);line-height:1.05;letter-spacing:-.028em;margin:0 0 18px;font-weight:700}
h2{font-size:clamp(18px,2.4vw,22px);line-height:1.25;letter-spacing:-.02em;margin:0 0 14px;font-weight:600;max-width:34ch}
p{margin:0 0 15px;color:var(--ink)}
.blk{padding:clamp(48px,7.5vw,80px) 0 0;border-top:1px solid var(--line)}
.lead{font-size:clamp(16.5px,2.2vw,19px);line-height:1.5;letter-spacing:-.018em;color:var(--ink)}
.verdict{font-size:clamp(26px,5.2vw,42px);line-height:1.1;letter-spacing:-.03em;font-weight:700;color:var(--ink);margin:16px 0 4px;max-width:16ch}
.prio{border-left:2px solid var(--rouge);padding:4px 0 4px 24px;margin:4px 0}
.note{border-left:2px solid var(--line2);padding:2px 0 2px 22px;color:var(--muted);font-size:14.5px;line-height:1.55;margin:22px 0}
/* Legacy metrics use rectilinear monospaced labels with hairlines instead of pills. */
.pills{display:flex;flex-wrap:wrap;gap:0;margin:20px 0 2px;border-top:1px solid var(--line)}
.pill{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:.04em;color:var(--muted);border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:11px 16px}
.pill b{color:var(--ink);font-weight:600;font-family:'Mundial',sans-serif}
.gattrib{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.08em;color:var(--muted);margin:14px 0 0}
.cta{margin-top:clamp(56px,8vw,88px);border-top:1px solid var(--line2);padding-top:clamp(30px,4vw,42px)}
.btn{display:inline-flex;align-items:center;gap:10px;background:var(--rouge);color:#fff;text-decoration:none;font-family:ui-monospace,'JetBrains Mono',monospace;font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;padding:17px 30px;margin-top:14px;border:1px solid var(--rouge);transition:background .35s cubic-bezier(.22,1,.36,1),color .35s cubic-bezier(.22,1,.36,1)}
.btn:hover{background:transparent;color:var(--ink)}
.foot{margin-top:clamp(52px,7vw,80px);padding-top:24px;border-top:1px solid var(--line);color:var(--muted);font-size:12px;font-family:ui-monospace,'JetBrains Mono',monospace;letter-spacing:.04em;line-height:1.7}
.foot a{color:var(--muted)}
/* Infographic. */
.ico{width:17px;height:17px;flex:0 0 auto;display:inline-block;vertical-align:middle}
.extag{margin-left:auto;color:var(--violet);border:1px solid var(--line2);padding:3px 10px;font-size:9px;letter-spacing:.18em;flex:0 0 auto}
/* Technical panel: donut chart and thin rectilinear bars. */
.tpanel{display:flex;gap:clamp(28px,5vw,48px);align-items:center;flex-wrap:wrap}
.tdonut{flex:0 0 auto;text-align:center}
.tbars{flex:1;min-width:250px}
.donut{position:relative;width:140px;height:140px;margin:0 auto}
.donut svg{width:140px;height:140px;transform:rotate(-90deg)}
.dbg{fill:none;stroke:var(--line);stroke-width:5}
.darc{fill:none;stroke:var(--rouge);stroke-width:5;transition:stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1)}
.dctr{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.dnum{font-size:38px;font-weight:700;color:var(--ink);line-height:1;letter-spacing:-.03em}
.dlab{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-top:4px}
.dsub{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);text-align:center;margin:12px 0 0}
.mrow{display:flex;align-items:center;gap:14px;margin:0;padding:13px 0;border-top:1px solid var(--line)}
.mrow:first-child{border-top:0}
.mlab{display:flex;align-items:center;gap:9px;width:150px;flex:0 0 auto;color:var(--beige);font-size:13.5px}
.mlab .ico{color:var(--muted)}
.bar{flex:1;height:2px;background:var(--line);overflow:hidden}
.bar i{display:block;height:100%;width:0;transition:width 1.4s cubic-bezier(.22,1,.36,1)}
.bar i.good{background:var(--violet)}.bar i.mid{background:var(--beige)}.bar i.bad{background:var(--rouge)}
.mval{width:38px;text-align:right;flex:0 0 auto;color:var(--ink);font-size:15px;font-variant-numeric:tabular-nums}
/* Checks use a strict hairline grid without pills. */
.cks{list-style:none;margin:24px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0;border-top:1px solid var(--line)}
.ck{display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--line);padding:12px 2px;font-size:12.5px;color:var(--beige)}
.ck .ico{color:var(--muted)}
.ck .ckm{width:14px;height:14px;margin-left:auto}
.ck.yes .ckm{color:var(--violet)}.ck.no .ckm{color:var(--rouge)}
/* Chips are rectilinear, hairlined and have no fill. */
.chips{display:flex;flex-wrap:wrap;gap:0;margin:14px 0 4px;border-top:1px solid var(--line)}
.chip{display:flex;flex-direction:column;gap:4px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);padding:13px 18px 13px 0;padding-right:26px}
.chl{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.chv{font-size:15px;color:var(--ink);font-weight:600;letter-spacing:-.01em}
/* The measured palette uses square swatches. */
.swatches{display:flex;flex-wrap:wrap;gap:0;margin:14px 0 4px}
.sw{position:relative;width:76px;height:76px;display:flex;align-items:flex-end;overflow:hidden}
.swl{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:8.5px;padding:4px 6px;width:100%;background:rgba(11,11,11,.66);color:#fff;letter-spacing:.02em}
/* Lists with icons. */
.ilist,.olist,.flist,.hlist,.revs{list-style:none;margin:14px 0 0;padding:0}
.ilist li,.olist li,.flist li,.hlist li,.revs li{display:flex;gap:13px;padding:14px 0;border-top:1px solid var(--line);align-items:flex-start}
.ilist li:first-child,.olist li:first-child,.flist li:first-child,.hlist li:first-child,.revs li:first-child{border-top:0}
.ilist .ico{color:var(--rouge);margin-top:2px}.olist .ico{color:var(--violet);margin-top:2px}
.flist .ico{color:var(--violet);margin-top:2px}.hlist .ico{color:var(--muted);margin-top:2px}.revs .ico{color:var(--beige);margin-top:3px}
.ilist span,.olist span,.hlist span{color:var(--beige);font-size:15px;line-height:1.5}
.flist span{color:var(--ink);font-size:15px;display:block;line-height:1.5}
.fcit{display:block;color:var(--muted);font-style:italic;font-size:13.5px;margin-top:6px;line-height:1.5}
.fsrc{display:inline-block;margin-top:8px;font-family:ui-monospace,'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--violet);text-decoration:none;border-bottom:1px solid var(--violet);padding-bottom:1px}
.revs p{margin:0;color:var(--beige);font-size:15px;font-style:italic;line-height:1.5}
/* Evidence of rigour: large numbers, rectilinear geometry and hairlines. */
.rigor{display:flex;gap:0;flex-wrap:wrap;margin:4px 0 8px;border-top:1px solid var(--line2)}
.rstat{display:flex;align-items:baseline;gap:11px;border-bottom:1px solid var(--line);padding:18px 30px 18px 0;flex:1;min-width:130px}
.rstat .ico{display:none}
.rn{font-size:20px;font-weight:700;color:var(--beige);line-height:1;display:block;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.rl{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
/* Dossier grid with hairlines. */
.dossier{display:grid;grid-template-columns:1fr 1fr;gap:0 clamp(24px,4vw,44px);margin:12px 0 4px}
.drow{display:block;padding:18px 0;border-top:1px solid var(--line)}
.drow .ico{display:none}
.dk{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--beige);margin-bottom:8px}
.drow p{margin:0;color:var(--beige);font-size:17px;line-height:1.55}
/* Google review stars. */
.stars{display:flex;align-items:center;gap:4px;margin:6px 0 8px}
.star{width:18px;height:18px;color:var(--line2)}
.star.f,.star.h{color:var(--beige)}
.grn{margin-left:14px;color:var(--ink);font-size:clamp(21px,3vw,26px);font-weight:700;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.honest .hlist span{color:var(--muted)}
/* Samuel's signature: square portrait and editorial composition. */
.signoff{margin-top:clamp(64px,9vw,104px);padding-top:clamp(44px,6vw,60px);border-top:1px solid var(--line2);display:flex;flex-direction:column;align-items:center;text-align:center}
/* Moving portrait using the same take as the atelier page, not a still image. It is the last thing
   visitors see before deciding, and a person looking back is worth more than a static rectangle.
   The frame is square and monochrome, as required by the editorial design system. */
.savatar{flex:0 0 auto;width:clamp(210px,44vw,296px);height:clamp(210px,44vw,296px);overflow:hidden;filter:grayscale(1) contrast(1.02);margin-bottom:clamp(26px,4vw,34px)}
.savatar img,.savatar video{width:100%;height:100%;object-fit:cover;object-position:center 18%;display:block}
.sinfo{max-width:56ch;display:flex;flex-direction:column;align-items:center}
.sname{font-size:clamp(21px,3vw,27px);font-weight:700;color:var(--ink);letter-spacing:-.03em;line-height:1.05}
.srole{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--rouge);margin:10px 0 20px;display:flex;align-items:center;justify-content:center;gap:6px}
.srole .ast{width:7px;height:7px}
.sbio{margin:0 0 26px;color:var(--beige);font-size:16.5px;line-height:1.6;max-width:44ch}
.signoff .btn{margin-top:0}
/* Gallery: browser window on desktop and phone frame on mobile, with hairlines and radius 0. */
.gal{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(0,1fr);gap:clamp(16px,3vw,28px);align-items:start;margin:26px 0 6px}
.bwin{margin:0;border:1px solid var(--line2);background:#000}
.bbar{display:flex;align-items:center;gap:5px;padding:8px 10px;border-bottom:1px solid var(--line)}
.bbar i{width:7px;height:7px;border:1px solid var(--line2);display:block}
.bbar span{margin-left:8px;font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:lowercase}
.bwin img{width:100%;height:auto;display:block;max-height:420px;object-fit:cover;object-position:top center}
.pwin{margin:0;border:1px solid var(--line2);background:#000;padding:8px 8px 10px;display:flex;flex-direction:column;gap:8px}
.pwin img{width:100%;height:auto;display:block;aspect-ratio:9/16;object-fit:cover;object-position:top center}
.pwin figcaption{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);text-align:center}
.gcols{display:grid;grid-template-columns:1fr 1fr;gap:clamp(18px,4vw,40px);margin-top:18px}
.gcol .subeb{margin-bottom:2px}
/* The single-change recommendation is the block's only rouge highlight, limited to one per page. */
.fixcall{border-left:2px solid var(--rouge);padding:4px 0 4px 18px;margin:26px 0 2px}
.fixcall .fixlbl{display:block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--rouge);margin-bottom:6px}
.fixcall p{margin:0;font-size:17px;line-height:1.5;color:var(--ink)}
/* SWOT: hairline quadrants with evidence in small monospaced type, kept in the source language. */
.swot{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--line2);margin-top:20px}
.swq{padding:18px 22px 20px 0;border-bottom:1px solid var(--line)}
.swq:nth-child(odd){border-right:1px solid var(--line);padding-right:22px}
.swq:nth-child(even){padding-left:22px;padding-right:0}
.swq ul{list-style:none;margin:0;padding:0}
.swq li{display:flex;gap:10px;padding:9px 0;align-items:flex-start}
.swq p{margin:0;font-size:15px;line-height:1.45;color:var(--beige)}
.swev{display:block;margin-top:4px;font-size:10.5px;letter-spacing:.02em;color:var(--muted)}
/* Actions: large numbering for the page's most commercial block. */
.acts{list-style:none;margin:6px 0 0;padding:0;border-top:1px solid var(--line2)}
.acts li{display:grid;grid-template-columns:clamp(44px,7vw,72px) 1fr;gap:clamp(12px,2.6vw,24px);padding:20px 0;border-bottom:1px solid var(--line)}
.acts .an{font-size:clamp(18px,2.6vw,25px);font-weight:700;letter-spacing:-.04em;color:var(--rouge);line-height:1;font-variant-numeric:tabular-nums}
.acts h3{font-size:clamp(15.5px,1.9vw,18px);margin:0 0 6px;letter-spacing:-.02em}
.acts p{margin:0;font-size:14.5px;line-height:1.55;color:var(--beige)}
@media (max-width:560px){.gal{grid-template-columns:1fr}.pwin{max-width:240px;margin:0 auto}.gcols{grid-template-columns:1fr}.swot{grid-template-columns:1fr}.swq:nth-child(odd){border-right:0;padding-right:0}.swq:nth-child(even){padding-left:0}}
/* Motion rules from 2026-08-11: elements within a block enter in sequence rather than as one slab,
   Samuel's seal is the only signature moment, and all motion is disabled by reduced-motion. */
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes heroZoom{from{transform:scale(1.045)}to{transform:none}}
@keyframes stamp{0%{opacity:0;transform:scale(2.4) rotate(-60deg)}60%{opacity:1;transform:scale(.92) rotate(4deg)}100%{opacity:1;transform:none}}
/* Within each revealed block, list items, quadrants, figures and rows enter at 80 ms intervals.
   The first six are staggered, while subsequent elements enter together once the eye stops counting. */
.js .reveal.in .olist li,.js .reveal.in .ilist li,.js .reveal.in .flist li,.js .reveal.in .hlist li,.js .reveal.in .revs li,.js .reveal.in .acts li,.js .reveal.in .swq,.js .reveal.in .gal figure,.js .reveal.in .fronts li,.js .reveal.in .ps .p,.js .reveal.in .drow{animation:rise .65s cubic-bezier(.22,1,.36,1) backwards}
.js .reveal.in :is(.olist,.ilist,.flist,.hlist,.revs,.acts) li:nth-child(2),.js .reveal.in .swq:nth-child(2),.js .reveal.in .gal figure:nth-child(2),.js .reveal.in .fronts li:nth-child(2),.js .reveal.in .ps .p:nth-child(2),.js .reveal.in .drow:nth-child(2){animation-delay:80ms}
.js .reveal.in :is(.olist,.ilist,.flist,.hlist,.revs,.acts) li:nth-child(3),.js .reveal.in .swq:nth-child(3),.js .reveal.in .fronts li:nth-child(3),.js .reveal.in .ps .p:nth-child(3),.js .reveal.in .drow:nth-child(3){animation-delay:160ms}
.js .reveal.in :is(.olist,.ilist,.flist,.hlist,.revs,.acts) li:nth-child(4),.js .reveal.in .swq:nth-child(4),.js .reveal.in .fronts li:nth-child(4),.js .reveal.in .ps .p:nth-child(4),.js .reveal.in .drow:nth-child(4){animation-delay:240ms}
.js .reveal.in :is(.olist,.ilist,.hlist,.revs) li:nth-child(5),.js .reveal.in .ps .p:nth-child(5),.js .reveal.in .drow:nth-child(5){animation-delay:320ms}
.js .reveal.in :is(.olist,.ilist,.hlist,.revs) li:nth-child(6),.js .reveal.in .drow:nth-child(6){animation-delay:400ms}
/* On arrival, the hero image settles and the title rises once. */
.js .hero img{animation:heroZoom 1.6s cubic-bezier(.22,1,.36,1) both}
.js .heroc .eyebrow{animation:rise .7s cubic-bezier(.22,1,.36,1) .15s backwards}
.js .heroc .heron{animation:rise .8s cubic-bezier(.22,1,.36,1) .3s backwards}
/* The gallery responds to the pointer by brightening the hairline and lifting the frame by 2 px. */
.bwin,.pwin{transition:transform .35s cubic-bezier(.22,1,.36,1),border-color .35s}
.bwin:hover,.pwin:hover{transform:translateY(-2px);border-color:var(--line2)}
/* The seal stamps the signature asterisk beside Samuel's role when the final block enters.
   This one-time gesture is the page's only theatrical moment and acts as the atelier's signature. */
.js .signoff.in .srole .ast{animation:stamp .8s cubic-bezier(.34,1.4,.64,1) .55s backwards}
/* Watermark: an almost invisible oversized asterisk behind the final invitation. */
.cta{position:relative;overflow:hidden}
.wm{position:absolute;right:-46px;top:-34px;width:clamp(150px,26vw,230px);height:auto;color:var(--ink);opacity:.05;pointer-events:none;transform:rotate(-8deg);transition:transform 1.4s cubic-bezier(.22,1,.36,1)}
.js .cta.reveal.in .wm{transform:rotate(4deg)}
@media (prefers-reduced-motion:reduce){.js .reveal.in *,.js .hero img,.js .heroc .eyebrow,.js .heroc .heron,.js .signoff.in .srole .ast{animation:none!important}.wm,.js .cta.reveal.in .wm{transform:rotate(-8deg)}.bwin:hover,.pwin:hover{transform:none}}
/* Visual review, 2026 08 11: less visible copy, stronger image rhythm. */
/* Five-P fan: titles stay visible, text opens on interaction without JavaScript, and prints expanded. */
.ps{border-top:1px solid var(--line2)}
.ps details{border-bottom:1px solid var(--line)}
.ps summary{display:flex;align-items:baseline;gap:clamp(14px,3vw,26px);padding:18px 0;cursor:pointer;list-style:none}
.ps summary::-webkit-details-marker{display:none}
.ps summary .pn{font-size:clamp(17px,2.6vw,23px);font-weight:700;letter-spacing:-.04em;color:var(--rouge);line-height:1;flex:0 0 clamp(40px,6vw,58px);font-variant-numeric:tabular-nums}
.ps summary h3{font-size:clamp(16px,2vw,19px);margin:0;letter-spacing:-.02em;flex:1}
.ps summary .pt{color:var(--muted);font-size:15px;transition:transform .3s}
.ps details[open] summary .pt{transform:rotate(45deg)}
.ps details>p{margin:0;padding:0 0 22px clamp(54px,9vw,84px);font-size:15px;line-height:1.6;color:var(--beige);max-width:58ch}
@media print{.ps details>p{display:block}}
/* Spread: the darkened segment banner returns midway through the page with copy over it. */
.spread{position:relative;width:100vw;margin-left:calc(50% - 50vw);margin-top:clamp(56px,9vw,96px);min-height:clamp(320px,52vh,520px);display:flex;align-items:flex-end;overflow:hidden}
.spread img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:grayscale(.35) brightness(.5)}
.spread::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(11,11,11,.88) 8%,rgba(11,11,11,.25) 70%)}
.spreadc{position:relative;z-index:2;width:min(768px,100%);margin:0 auto;padding:0 var(--gut) clamp(30px,5vw,52px)}
.spreadc .eyebrow{color:var(--rouge);margin-bottom:14px}
.spreadc p{margin:0;font-size:clamp(18px,2.8vw,24px);font-weight:600;letter-spacing:-.026em;line-height:1.22;max-width:26ch;color:var(--ink)}
/* Verdict styled as a magazine pull quote. */
.verdict{font-size:clamp(17px,2.4vw,21px)!important;font-weight:600;letter-spacing:-.024em;line-height:1.3;max-width:30ch;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2);padding:clamp(20px,3vw,28px) 0;margin:clamp(26px,4vw,36px) 0}
/* The first Google review is set as a quotation. */
.revs li:first-child span{font-size:clamp(18px,2.7vw,23px);font-weight:600;letter-spacing:-.022em;line-height:1.3;color:var(--ink)}
/* Atelier photo bands break up the reading with real colours, including the signage and brand rouge. */
.band{margin:clamp(48px,7vw,76px) 0 0;border:1px solid var(--line)}
.band img{width:100%;height:clamp(180px,30vh,300px);object-fit:cover;object-position:center 42%;display:block}
.band.tall img{height:clamp(240px,42vh,400px)}
.band figcaption{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);padding:9px 12px;border-top:1px solid var(--line)}
.midcta{margin:26px 0 0;font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.midcta a{color:var(--rouge);text-decoration:none;border-bottom:1px solid var(--line2);padding-bottom:3px}
.midcta a:hover{border-color:var(--rouge)}
/* reveal on scroll. */
.js .reveal{opacity:0;transform:translateY(14px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.js .reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.js .reveal{opacity:1;transform:none;transition:none}.darc,.bar i{transition:none}}
/* Opening: the argument comes before the data. This block sets the tone for the whole reading,
   so it has more space than any other and opens with manifesto-scale copy. */
.hi{font-size:clamp(22px,3.4vw,30px);font-weight:700;letter-spacing:-.035em;line-height:1;margin:0 0 clamp(18px,3vw,26px);color:var(--ink)}
/* The visitor's screen uses a sober radius-0 frame and a hairline instead of a shadow. The full-colour
   image and brand stand out naturally against a background made entirely of black and grey. */
.shot{margin:clamp(26px,4vw,36px) 0 0;display:flex;flex-direction:column;align-items:center;gap:14px}
.phone{width:clamp(220px,58vw,300px);border:1px solid var(--line2);padding:10px 10px 14px;background:#000}
.phone img{width:100%;height:auto;display:block;aspect-ratio:9/16;object-fit:cover;object-position:top center}
.shot figcaption{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.intro .lead{max-width:40ch;font-size:clamp(17.5px,2.4vw,21px);line-height:1.3;letter-spacing:-.026em;margin:0 0 clamp(24px,3.6vw,34px)}
.intro p:not(.lead){max-width:62ch;margin:0 0 17px}
.introk{margin-top:clamp(26px,4vw,36px);padding-top:20px;border-top:1px solid var(--line2);font-size:clamp(16px,2.3vw,19px);letter-spacing:-.02em;color:var(--ink);display:flex;align-items:center;gap:9px}
.introk .ast{width:9px;height:9px;margin:0}
/* Four fronts demonstrate that this is a full-service atelier rather than only a website supplier. */
.fronts{list-style:none;margin:24px 0 0;padding:0;border-top:1px solid var(--line)}
.fronts li{display:flex;gap:clamp(14px,3vw,26px);padding:19px 0;border-bottom:1px solid var(--line);align-items:baseline}
.fronts .fn{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--rouge);flex:0 0 clamp(92px,21vw,148px)}
.fronts .fd{flex:1;min-width:0;color:var(--beige);font-size:14.5px;line-height:1.55}
@media (max-width:560px){.tpanel{gap:24px}.fronts li{flex-direction:column;gap:6px}.langs a{padding:5px 7px}.dossier{grid-template-columns:1fr;gap:0}.mlab{width:130px}.chip{padding-right:16px}.savatar{margin-bottom:22px}.heron{font-size:clamp(2.3rem,13vw,3.4rem)}}
</style></head>
<body>
<script>document.documentElement.className+=" js";</script>
${                                                                                              
                                                                                               
                                                              ""}
<div class="mast${heroHtml ? "" : " line"}"><span class="logo" aria-label="ABiL">${LOGO}</span>${langSwitch}</div>
${heroHtml}
<div class="wrap">
<div class="by-lead">${esc(t.by)}${d._preview ? " · " + esc(t.previewTag) : (date ? " · " + esc(t.gen) + " " + date : "")}</div>
${heroHtml ? "" : `<h1>${company}</h1>`}
${                                                                           
                                                                                            
                                                                                            
                                                                             
                                                                                             
                                                                                                   ""}
${intro ? `<p class="lead">${intro}</p>` : ""}
${verdict ? `<p class="verdict">${verdict}</p>` : ""}
${segUnconfirmed ? `<div class="note">${esc(segNote)}</div>` : ""}
${siteUnreadable ? `<div class="note">${esc(siteNote)}</div>` : ""}
${introBlock}
${shotBlock}
${logoBlock}
${brandPanel}
${analiseBlock}
${section(t.sBrand, q(sec.branding), brandingT)}
${section(t.sCreative, q(sec.creative), creativeT)}
${whoBlock}
${deepPanel}
${googlePanel}
${swotBlock}
${actsBlock}
${acts.length ? `<p class="midcta"><a href="${esc(rdvUrl)}">${esc(t.cta)} →</a></p>` : ""}
${(priority && bannerUrl) ? `<section class="spread reveal"><img src="${esc(bannerUrl)}"${heroSrcset} alt="" loading="lazy" decoding="async"><div class="spreadc"><div class="eyebrow">${esc(t.prio)}</div><p>${priority}</p></div></section>` : (priority ? `<section class="blk"><div class="eyebrow">${esc(t.prio)}</div><div class="prio"><p>${priority}</p></div></section>` : "")}
${section(t.sDigital, q(sec.digital), digitalT)}
${atelierBand1}
<section class="blk"><div class="eyebrow">${esc(at.whoT)}</div><p>${esc(clip(whoP, 300))}</p></section>
<section class="blk"><div class="eyebrow">${esc(at.howT)}</div><p>${esc(clip(howP, 300))}</p>${bioHtml}</section>
${atelierBand2}
${frontsBlock}
${psHtml}
${section(t.sWeb, q(sec.web), webT)}
${honestPanel}
<div class="cta reveal">${WM}<div class="eyebrow">${esc(t.next)}</div>${help ? `<p>${help}</p>` : ""}${cta ? `<p class="lead">${cta}</p>` : ""}<a class="btn" href="${esc(rdvUrl)}">${esc(t.cta)}</a></div>
${signBlock}
<div class="foot"><p>${esc(disclaimerTxt)}</p><p><a href="${esc(takedownUrl)}">${esc(removeLabel)}</a></p></div>
</div>
<script>${LP_ANIM_JS}</script>
</body></html>`;
}
                                                                      
function lang0Of(d: any): string { const l = String(d && d.lang || "").slice(0, 2); return L[l] ? l : "fr"; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin, x-meta-admin, authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

                                                                                                                   
                                                                                                                 
                                                                                                                    
  if (String(req.query.action || "") === "takedown") {
    const tslug = normalizeAuditSlug(String(req.query.slug || ""));
    if (!tslug) { res.setHeader("Content-Type", "text/html; charset=utf-8"); return res.status(400).send(gonePage("fr")); }
    const tdata = await readAudit(tslug);
    const tlang = (tdata && tdata.lang && L[tdata.lang]) ? tdata.lang : "fr";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "GET") return res.status(200).send(takedownConfirmPage(tlang, tdata?.company, false));
    if (req.method === "POST") {
      try {
        if (tdata) {
          if (!tdata.takenDownAt) { try { await writeAudit(tslug, { ...tdata, takenDownAt: new Date().toISOString() }); } catch {  } }
          const dom = normDomain(String(tdata.website || ""));
          const email = String(tdata.email || (tdata.copy && tdata.copy.email) || "").trim().toLowerCase();
          const sup = await readSuppress();
          if (dom && !sup.domains.includes(dom)) sup.domains.push(dom);
          if (email && email.includes("@") && !sup.emails.includes(email)) sup.emails.push(email);
          try { await writeSuppress(sup); } catch {  }
        }
      } catch {  }
      return res.status(200).send(takedownConfirmPage(tlang, tdata?.company, true));
    }
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (req.method === "POST") {
    if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
    const b: any = req.body || {};
    if (b.action === "seg-config") {
      try { await writeSegConfig(b.config || {}); return res.status(200).json({ ok: true, saved: Object.keys(b.config || {}).length }); }
      catch (e: any) { return res.status(500).json({ error: "cfg_write_failed", detail: String(e?.message || e) }); }
    }
    const company = String(b.company || "").trim();
    if (!company) return res.status(400).json({ error: "company_required" });
                                                                                                                     
                                           
                                                                                      
                                                                                     
  const _salt = process.env.AUDIT_SLUG_SALT || process.env.ABIL_ADMIN_AUTH_SECRET || "";
  if (!_salt) throw new Error("audit slug salt not configured");
    const _tok = crypto.createHmac("sha256", _salt).update(String(company) + "|" + String(b.website || "")).digest("hex").slice(0, 24);
    const requestedSlug = normalizeAuditSlug(String(b.slug || ""));
    const slug = requestedSlug || (slugify(company) + "-" + _tok);
    const prev = await readAudit(slug);
    const _ttlDays = Number(process.env.AUDIT_TTL_DAYS || 90);
    const _ttl = (Number.isFinite(_ttlDays) && _ttlDays > 0) ? _ttlDays : 90;
    const data: any = {
      slug, company, website: String(b.website || prev?.website || ""), audit: b.audit || prev?.audit || {},
      copy: b.copy || prev?.copy || null, lang: (L[String(b.lang || "").slice(0, 2)] ? String(b.lang).slice(0, 2) : (prev?.lang || "fr")),
      publishedAt: new Date().toISOString(), views: prev?.views || 0, lastView: prev?.lastView || "",
                                                                                                                           
      expiresAt: new Date(Date.now() + _ttl * 86400000).toISOString(),
                                                  
      segmentoPorConfirmar: b.segmentoPorConfirmar != null ? !!b.segmentoPorConfirmar : !!prev?.segmentoPorConfirmar,
      siteNaoLegivel: b.siteNaoLegivel != null ? !!b.siteNaoLegivel : !!prev?.siteNaoLegivel,
                                                                                                                   
                                                                                                                     
                                                                                                                   
                                                                                                                    
      ...(typeof b.lpNivel === "string" && b.lpNivel ? { lpNivel: String(b.lpNivel).slice(0, 16) } : (prev?.lpNivel ? { lpNivel: prev.lpNivel } : {})),
      ...(typeof b.lpGeradaEm === "string" && b.lpGeradaEm ? { lpGeradaEm: String(b.lpGeradaEm).slice(0, 40) } : (prev?.lpGeradaEm ? { lpGeradaEm: prev.lpGeradaEm } : {})),
                                                                                                                         
      ...(prev?.takenDownAt ? { takenDownAt: prev.takenDownAt } : {}),
      ...(b.email ? { email: String(b.email) } : (prev?.email ? { email: prev.email } : {})),
                                                                                                                 
                                                                                                                 
                                                                                                          
      ...((b.deepStudy && b.deepStudy.ok) ? { deepStudy: b.deepStudy } : (prev?.deepStudy ? { deepStudy: prev.deepStudy } : {})),
                                                                                                
                                                                                   
      ...(await (async () => { const st = (b.study && typeof b.study === "object") ? b.study : (prev?.study || null); if (!st) return {}; const lg = (L[String(b.lang || "").slice(0, 2)] ? String(b.lang).slice(0, 2) : (prev?.lang || "fr")); if (lg === "pt" || st._trLang === lg) return { study: st }; const tr = await translateStudyTo(st, lg); return { study: tr || st }; })()),
    };
    try { await writeAudit(slug, data); } catch (e: any) { return res.status(500).json({ error: "blob_write_failed", detail: String(e?.message || e) }); }
    const baseU = (process.env.PUBLIC_BASE_URL || process.env.ABIL_PUBLIC_BASE || SITE).replace(/\/$/, "");
    return res.status(200).json({ ok: true, slug, url: `${baseU}/audit/${slug}` });
  }

  if (req.method === "DELETE") {
    if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
    const slugQ = normalizeAuditSlug(String(req.query.slug || ""));
    const prefixQ = String(req.query.prefix || "");
    try {
      if (prefixQ) {
        const safePrefix = normalizeAuditSlug(prefixQ);
        if (!safePrefix) return res.status(400).json({ error: "prefix_invalid" });
        const { blobs } = await list({ prefix: `audits/${safePrefix}`, limit: 1000 });
        const urls = blobs.map((x) => x.url);
        if (urls.length) await del(urls);
        return res.status(200).json({ ok: true, deleted: urls.length });
      }
      if (!slugQ) return res.status(400).json({ error: "slug_required" });
      const { blobs } = await list({ prefix: `audits/${slugQ}.json`, limit: 1 });
      const bl = blobs.find((x) => x.pathname === `audits/${slugQ}.json`);
      if (bl) { await del(bl.url); return res.status(200).json({ ok: true, deleted: 1 }); }
      return res.status(200).json({ ok: true, deleted: 0, note: "not_found" });
    } catch (e: any) { return res.status(500).json({ error: "del_failed", detail: String(e?.message || e) }); }
  }

  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  if (req.query.segConfig !== undefined) {
    const overrides = await readSegConfig();
                                                                                                             
                                                                                                             
    return res.status(200).json({ ok: true, site: SITE, overrides, banners: SEG_BANNERS, segCopy: Object.keys(SEG_COPY_FR), segCopySrcLang: "fr" });
  }

                                                                                          
                                                                                              
                                                                                      
                                                                                                      
                                                                                                 
  const rawSlug = String(req.query.slug || "").trim();
  const qseg0 = String((req.query.seg as string) || "");
  if (!rawSlug && qseg0 && SEG_COPY_FR[qseg0]) {
    const plang = String((req.query.lang as string) || "");
    const plang0 = (plang && L[plang]) ? plang : "fr";
    const segDef = LEAD_SEGMENTS.find((x) => x.key === qseg0);
    let pview: any = {
      company: SEG_LABEL_FR[qseg0] || (segDef ? segDef.label : qseg0), website: "", lang: plang0, _preview: true,
      copy: { segment: { key: qseg0, label: SEG_LABEL_FR[qseg0] || (segDef ? segDef.label : qseg0) } },
    };
    try { const c = await readSegConfig(); if (c && c[qseg0]) pview = { ...pview, _segCfg: c[qseg0] }; } catch {  }
    try { const sc = await segCopyFor(qseg0, plang0); if (sc) pview = { ...pview, _segCopy: sc }; } catch {  }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    return res.status(200).send(renderHtml(pview));
  }

  const slug = normalizeAuditSlug(String(req.query.slug || ""));
  const data = await readAudit(slug);
  if (!data) {
    if (req.query.json !== undefined) return res.status(404).json({ error: "not_found" });
    const nlang = String((req.query.lang as string) || "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    return res.status(404).send(notFoundPage(nlang));
  }
                                                                                                                 
  const _expired = !!data.expiresAt && Date.now() > Date.parse(data.expiresAt);
  if (data.takenDownAt || _expired) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    if (req.query.json !== undefined) return res.status(410).json({ error: "gone" });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(410).send(gonePage(data.lang));
  }
                                                                                              
                                                                                                    
  if (req.query.json !== undefined) {
    if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  }

  let _newTr: { lang: string; tr: any } | null = null;                                          
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  const qlang = String((req.query.lang as string) || "");
  let view: any = (qlang && L[qlang]) ? { ...data, lang: qlang } : data;
                                                                                                    
  if (qlang && L[qlang] && qlang !== String(data.lang || "pt")) {
                                                                                                      
                                                                  
    const cached: any = (data.translations || {})[qlang];
    const cCopy = (cached && cached.copy !== undefined) ? cached.copy : cached;
    const _cl = (cached && cached.lead !== undefined) ? cached.lead : null;
                                                                                                 
    const cLead = (_cl && Object.keys(_cl).length) ? _cl : null;
                                                                                                   
                                                                  
    const [trCopy, trLead] = await Promise.all([
      (data.copy && !cCopy) ? translateCopyTo(data.copy, qlang).catch(() => null) : Promise.resolve(null),
      (!cLead) ? translateLeadTo(data, qlang).catch(() => null) : Promise.resolve(null),
    ]);
    const novaCopy = trCopy; const novoLead = trLead;
    if (cCopy) view = { ...view, copy: cCopy };
    else if (trCopy) view = { ...view, copy: trCopy };
                                                                                     
    view = applyLeadTr(view, cLead || trLead);
    if (novaCopy || novoLead) _newTr = { lang: qlang, tr: { copy: novaCopy || cCopy || null, lead: novoLead || cLead || null } };
  }
                                                                                                   
                                                                                                  
                                                                
  if (!qlang || qlang === String(data.lang || "")) {
    const bl = String(data.lang || "fr");
    const cachedB: any = (data.translations || {})[bl];
    const cbLead = (cachedB && cachedB.lead && Object.keys(cachedB.lead).length) ? cachedB.lead : null;
    if (cbLead) view = applyLeadTr(view, cbLead);
    else {
      const lt = await translateLeadTo(data, bl).catch(() => null);
      if (lt) { view = applyLeadTr(view, lt); _newTr = { lang: bl, tr: { copy: (cachedB && cachedB.copy) || null, lead: lt } }; }
    }
  }
  try { await writeAudit(slug, { ...data, views: (data.views || 0) + 1, lastView: new Date().toISOString(), ...(_newTr ? { translations: { ...(data.translations || {}), [_newTr.lang]: _newTr.tr } } : {}) }); } catch {  }
  try {
    const _sk = (view.copy && view.copy.segment && view.copy.segment.key) || "";
    if (_sk) {
      const _cfg = await readSegConfig(); if (_cfg && _cfg[_sk]) view = { ...view, _segCfg: _cfg[_sk] };
                                                                                                              
                                                                                                             
      const _sc = await segCopyFor(String(_sk), lang0Of(view)); if (_sc) view = { ...view, _segCopy: _sc };
    }
  } catch {  }
  return res.status(200).send(renderHtml(view));
}
