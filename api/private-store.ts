   
                                                                                  
  
                                                                                 
  
                                                                            
                                                                                  
                                                                    
                                                                                   
                                                                                
                                                                              
                                                                                
  
                                                                               
                                                                                
  
             
                                                                                
                                                                                              
                                                                                      
                                                                                                   
                                                                                   
  
                                           
   

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { del, list, put } from "@vercel/blob";
import crypto from "node:crypto";
import { decryptVaultText as decrypt, encryptVaultText as encrypt } from "./_vault-crypto.js";

export const config = { runtime: "nodejs" };

const PREFIX = "store/private/";
const SNAP_PREFIX = "store/private-snap/";
const BLOB_PUBLIC_BASE = (typeof process !== "undefined" ? process.env : ({} as any))?.BLOB_PUBLIC_BASE_URL || "";
const ADMIN_SECRET = (typeof process !== "undefined" ? process.env : ({} as any))?.ABIL_ADMIN_AUTH_SECRET || "";

                                                      
const COLLECTIONS = new Set(["briefings", "quotes", "leads", "subscribers", "helpdesk", "pricing", "central", "brand_persona", "buyer_personas", "pending_decisions", "integration_keys",
                                                                                                         
  "ai_agent_rules", "access_users",
                                                                     
  "ai_config",
                                                                                                     
                                                                                  
  "ai_channel_prompts", "ai_char_limits", "ai_global_on", "blog_editorial_prompt", "ai_template_prompts",
                                                                                              
                                                                                                
                                                                                        
                                        
  "agent_persona_snapshot",
                                                                                                               
                                                                                                                   
                                                                                                                   
                                                                                                                    
  "work_philosophy",
                                                                                                               
                                                                                                             
                                                                                                                  
                                                                             
  "journey_map", "biography",
                                                                                                            
                                                                                                            
                                                                                     
  "ai_safeguards",
                                                                                                       
                                                                                                       
                                                                                                     
  "quotes_config",
                                                                                                                 
                                                                                                                    
                                                                                                                 
                                                                                                      
  "testimonials",
                                                                                                    
                                                                                                   
                                                                                                   
  "notifications_read",
                                                                                                    
                                                                                                       
                                                                                                 
                                                                                               
                                                                                                        
  "work_reports", "client_logos",
                                                                                        
                                                                                  
                                                                                     
                                                                                 
                                                                                
                                           
  "pres_feedback",
                                                                                    
                                                                                  
                                                                                   
                                                
  "proposal_events", "quote_feedback"]);
                                                                 
                                                                                                          
                                                                                                           
                                                                                                                 
const PUBLIC_APPEND = new Set(["briefings", "leads", "subscribers", "proposal_events", "quote_feedback", "pres_feedback"]);

                                                                                                              
                                                                                                                 
                                                                                                                     
                                                                                                                   
                                                                                                            
                                                                                                   
                                                                                                                
                                                                                                                      
                                                                                                                        
                                                                
const DEFAULT_JOURNEY_MAP = {
  metodo: "Vendre avec méthode, jamais avec pression. La relation va de l'inconnu total au client convaincu, et chaque phase existe pour livrer de la valeur avant de demander quoi que ce soit. L'agent n'ouvre jamais par le portfolio ni par la vente: il ouvre par une observation réelle et vérifiable sur le métier du lead. La qualité est le minimum attendu; le vrai différenciateur, c'est la créativité et la disruption. Le prix ne se défend jamais, c'est la valeur et l'expérience qui se défendent. Une idée par email, l'humain aux commandes, l'IA comme outil. Ne jamais inventer de faits, de chiffres, de clients ni de prix; toujours écrire dans la langue du lead. Si le lead se tait, une relance légère ancrée sur la dernière date de contact, puis on le classe inactif. S'il dit non, la courtoisie, toujours via le moteur de refus, jamais réécrite à la main.",
  fases: [
    {
      id: "frio",
      nome: "Froid / inconnu",
      momento: "Premier contact: gagner l'attention de quelqu'un qui ne nous connaît pas et n'a rien demandé.",
      objetivo: "Gagner en quelques secondes l'attention d'un inconnu en prouvant qu'on a vraiment regardé son métier. Ici on ne vend pas, on plante une graine et on gagne le droit à une réponse.",
      estadoMental: "Le lead ne sait pas qui nous sommes, n'a pas demandé de contact et a une boîte pleine de propositions identiques. Il est sur la défensive et suppose que c'est encore du démarchage automatique. Au moindre signe de message générique, il supprime sans lire.",
      sinais: "La fiche n'a que des données de prospection, le segment et la persona attribués et, lorsqu'elle a déjà tourné, la mesure technique (audit) avec ses faits sourcés. L'analyse approfondie (deepStudy) N'EXISTE PAS à cette phase et on ne la lance pas: sur ordre de l'opérateur (2026-07-23), elle ne se paie qu'après une réponse POSITIVE au premier email froid. La phase du lead est lead (Nouveau) et replied est à false: aucune réponse détectée par le reply-scan. Il n'y a pas de suivi d'ouverture ni de clic enregistré sur la fiche, ce ne sont donc pas des signaux et on ne les invente pas: le seul observable ici est l'absence de réponse.",
      acao: "D'abord lire l'audit (la mesure technique) et ne retenir que les faits sourcés (un fait sans source lue se jette); ne jamais lancer l'analyse approfondie au froid. Choisir UN fait concret et vrai sur son métier. Ouvrir l'email avec ce fait, jamais par une présentation de l'atelier ni une liste de références. Offrir tout de suite une micro-idée gratuite comme preuve de valeur. Ne pas joindre de landing page, ne pas envoyer de lien d'analyse, ne pas demander de rendez-vous: au froid on demande, au plus, une réponse légère.",
      comoFalar: "Chaleur humaine, direct, première phrase qui répond déjà par le fait observé. Zéro jargon marketing, zéro déballage de références. Parler comme quelqu'un qui a remarqué quelque chose d'intéressant dans le métier du lead. Une personne qui parle à une autre, jamais un atelier qui tire un template.",
      entrega: "Un premier contact hyper personnalisé avec UN fait réel et sourcé sur le métier, plus une micro-idée offerte, sans autre demande qu'une réponse simple.",
      exemplo: "Bonjour, j'ai vu sur votre site que vous avez ouvert une deuxième adresse cette année en gardant la même carte que la première, et c'est justement ce détail qui, retourné, ouvre un angle que personne dans votre secteur n'ose prendre.",
      evitar: "Template générique; ouvrir par qui nous sommes; demander un rendez-vous dès le froid; envoyer une landing page ou un devis; citer un fait non lu sur la fiche ou sans source; lire des signaux qui n'existent pas comme l'ouverture ou le clic; le jargon; le tiret cadratin.",
      proximaFase: "Le seul signal qui fait avancer le lead est une réponse détectée par le reply-scan: replied passe à true et repliedAt est enregistré. Dès qu'il répond, même une ligne, il passe à A réagi. S'il ne répond jamais, au bout de quelques jours vient la relance légère, puis le lead est classé inactif.",
    },
    {
      id: "engajou",
      nome: "A réagi / a répondu",
      momento: "Début de la relation: de la première étincelle d'attention au premier vrai dialogue.",
      objetivo: "Transformer l'étincelle en dialogue réel. Confirmer l'intérêt, approfondir la valeur déjà donnée et gagner le droit à une première vraie question sur son métier.",
      estadoMental: "Curieux mais encore méfiant. Il se dit que celui-ci semble différent, qu'il a vraiment regardé, mais il teste s'il y a des gens sérieux ou une machine bien réglée. Il ne s'est engagé à rien.",
      sinais: "Le reply-scan a détecté une réponse: replied à true, repliedAt enregistré. La réponse est courte et curieuse, et replyClass, si classée, est positive ou neutre, jamais négative. La différence entre les deux décide de l'argent: seule la POSITIVE autorise à dépenser l'analyse approfondie et à publier le diagnostic; la neutre se répond quand même, avec ce qui est déjà sur la fiche. Un ou deux messages de sa part dans le thread. Pas encore de brief, ni de contexte sur le vrai problème, ni de mention de budget ou de délai.",
      acao: "Remercier avec sincérité, sans euphorie commerciale. Ré-ancrer sur un fait concret avec source (de l'analyse approfondie si elle existe déjà, sinon de l'audit). Ici la réponse se coupe en deux, selon le replyClass. Si POSITIVE: c'est le seul moment où l'analyse approfondie se lance et où une page naît; si une analyse est déjà publiée (audit.publishedUrl), LIVRER le lien comme preuve de valeur concrète, pas comme une option timide, et sinon, déclencher l'analyse d'abord et la livrer ensuite. Si NEUTRE: répondre comme une personne, avec ce qui est déjà sur la fiche, sans lancer d'analyse approfondie, sans rien publier et sans envoyer de lien; la preuve attend le oui. Distinguer deux choses: l'analyse (audit.publishedUrl) se livre maintenant; la landing page thématique n'arrive qu'en Phase 2, après un oui explicite, jamais au froid. Poser UNE question ouverte sur son métier.",
      comoFalar: "Impliqué, attentif, sans pression de vente. Montrer qu'on a écouté ce qu'il a dit. Humain et généreux en idées. Rappeler discrètement qu'il y a une personne aux commandes, pas un robot.",
      entrega: "Un deuxième email qui remercie, ancre sur un autre fait sourcé, livre le lien de l'analyse (publié à la volée s'il manque) comme preuve concrète, et pose une question ouverte. La landing page thématique n'entre PAS ici.",
      exemplo: "Content que ça vous parle. Je vous ai déposé juste ici une lecture de votre marque à ouvrir tout de suite, et j'ai repéré un point qu'on peut transformer en votre signe le plus mémorable, mais avant, dites-moi une chose sur votre activité.",
      evitar: "Déballer toute la méthode d'un coup; envoyer un prix; paraître pressé; poser cinq questions à la fois; prendre une simple réponse pour un oui d'achat; garder l'analyse comme une faveur alors qu'elle se livre; envoyer la landing page thématique à cette phase; lire des clics ou réactions que la fiche n'enregistre pas; le tiret cadratin.",
      proximaFase: "Le lead répond à la question ou entre dans un vrai échange sur son métier: il passe à En conversation. S'il se tait après avoir réagi, relance froide légère ancrée sur repliedAt, puis Inactif.",
    },
    {
      id: "em_conversa",
      nome: "Intéressé / en conversation",
      momento: "Milieu de la relation: approfondir l'échange et comprendre le métier à fond.",
      objetivo: "Approfondir la relation dans une vraie conversation sur le métier, comprendre le problème réel derrière la demande, et se positionner comme l'atelier qui plonge à fond avant de proposer. Nourrir la relation d'idées et de contenu utile, toujours gratuitement.",
      estadoMental: "Intéressé et qui s'ouvre, partage déjà du contexte et des difficultés, mais continue de comparer. Il n'est pas sûr du périmètre ni de l'investissement. Il veut se sentir compris et avoir la preuve qu'on comprend son monde, pas qu'on encastre un service de catalogue. Il mesure si on est conseil ou fournisseur.",
      sinais: "Plusieurs échanges de suite (3 messages ou plus de sa part dans le même thread); il partage des détails et ce qui le dérange; il demande comment nous travaillons; il demande à voir des cas; il envoie des accès. Thread actif et récurrent, replyClass positive. Pas encore de devis demandé fermement.",
      acao: "Plonger dans le métier: demander l'objectif réel, le pourquoi de la marque. Envoyer du contenu et des cas alignés à son segment, une idée utile à la fois, donner de la valeur avant de demander. Relier son besoin à l'offre 360 (création, gestion et promotion de marque) sans encore parler de prix. Qualifier avec naturel: ce qu'il veut vendre, à qui, ce qu'il a déjà essayé, qui décide, quel délai.",
      comoFalar: "Impliqué, attentif, en lui renvoyant ses propres mots pour prouver qu'on a écouté. Humain et généreux, sans pression de clôture. Conseil curieux, pas vendeur qui pousse.",
      entrega: "Des idées et des cas sur mesure pour son segment, une question de qualification à la fois, et une invitation légère au pas suivant (un court échange ou le briefing), sans prix et sans proposition encore.",
      exemplo: "Laissez-moi vous renvoyer une provocation: et si on retirait de votre activité les trois choses que tout le monde fait pareil dans votre secteur? C'est à peu près comme ça que nous pensons la marque, et c'est pour ça qu'on a d'abord besoin de comprendre ce qui vous anime.",
      evitar: "Sauter à la proposition ou au prix avant de comprendre le métier; déballer toute la méthode; faire un interrogatoire de dix questions d'un coup; paraître fournisseur de catalogue; promettre un résultat; parler de remise; le tiret cadratin.",
      proximaFase: "Quand le lead partage des détails concrets ou accepte et remplit le briefing, il passe à Qualifié. Si la demande de devis arrive directement, il saute en Négociation. S'il se tait, relance légère puis Inactif.",
    },
    {
      id: "qualificado",
      nome: "Qualifié / briefing",
      momento: "Compréhension profonde: qualifier le métier à fond avant de proposer.",
      objetivo: "Transformer la conversation en compréhension réelle et documentée du métier: ce qu'il veut, pour qui, ce qu'il a déjà essayé, qui décide, quel délai. Fermer le briefing pour que la proposition qui suit soit chirurgicale et défende la valeur, pas un chiffre au hasard.",
      estadoMental: "Il a assez confiance pour s'ouvrir et investir du temps. Il partage contexte, matériaux, accès. Il veut se sentir écouté et que la proposition à venir soit sur mesure. Il évalue s'il vaut la peine d'avancer vers les chiffres.",
      sinais: "A partagé des détails concrets ou rempli le briefing; la phase est briefing. Thread riche, avec contexte réel (objectif, public, concurrence, ce qui a déjà été tenté, qui décide, délai approximatif). replyClass positive. Pas encore de proposition demandée fermement, mais le terrain est prêt.",
      acao: "Approfondir et organiser ce qu'on sait: fermer les manques du briefing (objectif réel, public, qui décide, délai, ce qui a déjà été tenté). Renvoyer au lead notre lecture de son problème, pour montrer qu'on comprend son métier de l'intérieur. Proposer le pas naturel: un SWOT, une présentation ou le démarrage de la proposition. Préparer le terrain pour défendre la valeur, sans encore fixer de prix. Laisser le briefing enregistré sur la fiche.",
      comoFalar: "De conseil qui a déjà plongé à fond: sûr, précis, en renvoyant la lecture du métier avec les mots du lead. Maîtrise sans arrogance. Humain, attentif. Zéro pression pour clore.",
      entrega: "Un briefing fermé et enregistré sur la fiche, plus l'invitation au pas suivant (SWOT, présentation ou proposition), périmètre aligné et sans prix encore.",
      exemplo: "Laissez-moi vous rendre ce que j'ai compris pour voir si je vise juste: ce qui vous dérange, ce n'est pas le logo, c'est que votre marque se fond dans votre secteur, et c'est exactement ça qu'on peut résoudre. Si ça vous parle, je vous monte une proposition là-dessus.",
      evitar: "Envoyer une proposition sans avoir fermé le briefing; fixer un prix avant de comprendre le périmètre; présumer ce que veut le lead au lieu de le confirmer; déballer la méthodologie; traiter le briefing comme une formalité; le tiret cadratin.",
      proximaFase: "Quand le lead demande un devis ou une proposition, ou accepte d'en recevoir une, il passe à Négociation, et à l'envoi de la proposition la phase du lead devient négociation avec proposalSentAt enregistré. S'il se tait, relance puis Inactif.",
    },
    {
      id: "negociacao",
      nome: "Négociation / proposition",
      momento: "Conclure: défendre la valeur et l'expérience, jamais le prix.",
      objetivo: "Envoyer la bonne proposition et conduire la décision en défendant toujours la valeur et l'expérience, jamais en justifiant le prix. C'est ici qu'on transforme l'intérêt qualifié en oui, sans concourir sur la remise.",
      estadoMental: "Vraiment intéressé et en train d'évaluer l'investissement. Il comprend la valeur, mais pèse le coût contre le retour et compare probablement avec une autre option. Il peut soulever des objections de prix ou de périmètre. Il veut la certitude que ce qu'il recevra vaut ce qu'il paiera, et qu'il y a une personne derrière la livraison.",
      sinais: "A demandé un devis ou une proposition fermement; le briefing est reçu; la proposition est envoyée et la fiche a proposalSentAt et proposalUrl, phase négociation. Il peut y avoir des questions de périmètre, de délais, de conditions, ou des objections de prix dans le thread.",
      acao: "Définir le périmètre clairement et envoyer la proposition à partir de la grille tarifaire réelle, NE JAMAIS inventer de prix ni promettre de résultat. Traiter chaque objection par la valeur et l'expérience, jamais par la remise: si le prix est questionné, revenir au problème résolu, à la créativité comme différenciateur, et à l'expérience mémorable livrée. Garder l'humain aux commandes, rassurer, répondre vite et précis. En cas d'intention d'achat, de prix ou de contrat, escalader vers l'humain responsable pour décider.",
      comoFalar: "Ferme et tranquille, de celui qui est sûr de la valeur qu'il livre. Aucune anxiété, aucune pression. Défendre la valeur avec naturel. Humain et présent. Ne jamais s'excuser du prix.",
      entrega: "Une proposition claire à partir de la grille tarifaire (enregistrée sur la fiche en proposalSentAt et proposalUrl), plus des réponses aux objections qui défendent la valeur et l'expérience, jamais la remise.",
      exemplo: "Écoutez, je ne vais pas me battre sur le prix, parce que ce qui est en jeu, ce n'est pas combien coûte le travail, c'est à quel point votre marque va devenir mémorable. Laissez-moi vous montrer ce que ça donne concrètement.",
      evitar: "Inventer un prix ou donner un chiffre hors grille; promettre un résultat garanti; répondre à une objection de prix par une remise; paraître pressé de clore; cacher le périmètre; décider seul quand il y a intention d'achat ou contrat, car cela s'escalade; le tiret cadratin.",
      proximaFase: "Quand le lead accepte (bouton Approuver, email d'approbation claire ou marquage manuel), il passe à Approbation, avec proposalApprovedAt enregistré. S'il se tait au moins 5 jours après l'envoi de la proposition, UNE relance dédiée (phase Relance de négociation) rouvre la conversation; s'il refuse, courtoisie via le moteur de refus.",
    },
    {
      id: "followup_neg",
      nome: "Relance de négociation",
      momento: "La proposition est partie et le lead s'est tu: un seul toucher dédié pour rouvrir la conversation.",
      objetivo: "Rouvrir la conversation de la proposition avec un intérêt sincère (qu'en a-t-il pensé, la valeur a-t-elle du sens, changerait-il quelque chose au périmètre) et préparer le terrain pour la conclusion, sans rien brader.",
      estadoMental: "Il a reçu la proposition et n'a pas répondu. Il peut être occupé, en train de comparer, en attente d'une décision interne, ou gêné par un point qu'il n'a pas osé dire. Un silence n'est pas un non.",
      sinais: "proposalSentAt est enregistré sur la fiche, il n'y a pas de proposalApprovedAt, aucune réponse du lead depuis l'envoi de la proposition, au moins 5 jours de silence, et followupNegSentAt est encore vide (le toucher n'a pas déjà été fait).",
      acao: "UN seul toucher dédié, différent des relances froides: demander avec un intérêt sincère ce qu'il a pensé de la proposition, si la valeur a du sens pour lui et s'il changerait quelque chose au périmètre; proposer de présenter la proposition à qui décide. JAMAIS proposer de nouveaux montants, de remises ni de réajustements: le prix s'escalade à l'opérateur. Enregistrer followupNegSentAt; après ce toucher, la branche ne se déclenche plus.",
      comoFalar: "Vendeur intéressé, pro-actif et sensible: curieux de l'avis du lead, jamais pressant. La question porte sur la proposition et le périmètre, pas sur l'argent.",
      entrega: "Un seul email de relance dédié qui rouvre la conversation de la proposition et offre de la présenter à qui décide, sans toucher aux montants.",
      exemplo: "Avez-vous eu le temps de regarder la proposition posément ? Nous serions vraiment curieux de savoir ce que vous en pensez, et s'il y a un point que vous changeriez, nous sommes là: nous avons très envie de faire ce projet avec vous.",
      evitar: "Offrir une remise ou de nouveaux montants; faire pression; multiplier les touchers; culpabiliser le silence; le tiret cadratin.",
      proximaFase: "S'il approuve, il passe à Approbation. S'il demande des changements, retour à Négociation et l'ajustement s'escalade à l'opérateur. S'il refuse, courtoisie via le moteur de refus. S'il reste silencieux, le lead est classé inactif.",
    },
    {
      id: "aprovacao",
      nome: "Approbation",
      momento: "Le lead a dit oui à la proposition: transformer ce oui en démarrage sûr.",
      objetivo: "Transformer le oui en démarrage sûr: remercier, sécuriser, lever les derniers doutes de processus et mettre le contrat en route.",
      estadoMental: "Il vient de s'engager et veut la confirmation immédiate que son choix était le bon. Toute hésitation ou imprécision de notre part à ce moment sème le doute.",
      sinais: "proposalApprovedAt est enregistré sur la fiche (bouton Approuver sur la proposition, email d'approbation claire, ou marquage manuel de l'opérateur), avec proposalApprovedVia.",
      acao: "Remercier avec un enthousiasme sincère et de l'assurance. S'il a des doutes de processus ou de service, répondre avec des données RÉELLES: la proposition enregistrée, le portfolio publié, le catalogue de services; jamais rien inventer. Rappeler avec douceur le paiement selon les conditions DE LA PROPOSITION (jamais inventer de pourcentages ni d'échéances) et annoncer que le contrat suit avec tous les termes pour signature; l'émission du contrat s'escalade à l'opérateur, l'agent ne fait que l'annoncer.",
      comoFalar: "Chaleureux, sûr, précis. De partenaire qui prend le relais avec confiance: zéro hésitation, zéro promesse non documentée.",
      entrega: "Un remerciement enthousiaste et sûr, les doutes de processus levés avec des données réelles, le rappel des conditions de paiement de la proposition et l'annonce du contrat à signer.",
      exemplo: "Quelle bonne nouvelle, merci pour votre confiance ! Nous avons hâte de nous y mettre. Le paiement suit exactement les conditions de la proposition, et le contrat avec tous les termes arrive pour signature. La moindre question sur le processus, nous sommes là.",
      evitar: "Inventer des conditions ou des pourcentages; promettre des délais non documentés; la froideur administrative; laisser le oui refroidir sans réponse; le tiret cadratin.",
      proximaFase: "Contrat signé et projet en production puis livré: le lead passe à Gagné.",
    },
    {
      id: "ganho",
      nome: "Gagné / client",
      momento: "Après la livraison: le projet est livré et diffusé, transformer le client en promoteur.",
      objetivo: "Après la livraison et la diffusion, récolter ce que l'expérience a semé: un retour sincère, un témoignage autorisé et des recommandations. La vente ne se termine pas à la livraison: elle continue dans la relation.",
      estadoMental: "Le projet est livré et diffusé. Le client a une opinion fraîche sur ce qu'on a vécu ensemble, et c'est le meilleur moment pour la demander; plus le temps passe, plus elle s'estompe.",
      sinais: "La phase du lead est gagné et le projet est livré et diffusé. L'onboarding et la production sont derrière; l'historique montre la livraison.",
      acao: "Demander un retour sincère (qu'a-t-il pensé du service et de l'expérience). Demander une recommandation. Demander l'AUTORISATION EXPLICITE de publier son commentaire comme témoignage sur le site: sans autorisation, rien ne se publie. Garder l'onboarding et la livraison soignés tant que le projet court, mais le centre de cette phase est le retour, le témoignage et la recommandation. Rester humain et présent après la livraison.",
      comoFalar: "Chaleureux, reconnaissant, sans rien exiger: on demande un retour comme on demande un avis à quelqu'un qu'on respecte, et on accepte un non sans insister.",
      entrega: "Un retour sincère recueilli, un témoignage publié seulement avec autorisation explicite, et des recommandations qui ouvrent de nouveaux projets.",
      exemplo: "Maintenant que tout est en ligne, dites-nous franchement: qu'avez-vous pensé du travail et du chemin ? Et si vous êtes à l'aise, aimeriez-vous qu'on publie votre commentaire comme témoignage ? Rien ne se publie sans votre accord.",
      evitar: "Publier un témoignage sans autorisation explicite; disparaître après la livraison; transformer la demande de retour en formulaire froid; promettre après la signature ce qu'on n'a pas promis avant; le tiret cadratin.",
      proximaFase: "Le client satisfait devient ambassadeur: il recommande, ouvre de nouveaux projets, et son témoignage autorisé renforce le site.",
    },
    {
      id: "negativa",
      nome: "Refus",
      momento: "À n'importe quelle phase: le lead dit non ou n'est pas intéressé.",
      objetivo: "Fermer avec courtoisie, respecter la décision et laisser la porte ouverte, sans aucune insistance. Préserver la relation et l'image de l'atelier même quand c'est non.",
      estadoMental: "Il a décidé que ce n'est pas le moment ou pas pour lui. Il veut que ce soit respecté sans discussion, et il retiendra la manière dont on encaisse le non.",
      sinais: "A dit qu'il n'est pas intéressé; replyClass négative. Il peut y avoir un refus explicite, une demande de ne plus être contacté (respectée en silence, sans réponse), ou un simple non poli.",
      acao: "Courtoisie brève et humaine dans la langue du lead, via le moteur de refus (jamais réécrite à la main): remercier, respecter la décision, laisser la porte ouverte. Zéro insistance, zéro relance après un non. Une demande explicite de retrait se respecte en silence.",
      comoFalar: "Bref, digne, chaleureux. Sans amertume ni relance déguisée. De quelqu'un qui respecte le temps de l'autre.",
      entrega: "Une courtoisie courte issue du moteur de refus, sans insistance, avec la porte laissée ouverte.",
      exemplo: "Merci pour votre réponse franche et pour le temps accordé. Nous comprenons tout à fait, nous en restons là. Si un jour cela a du sens d'en reparler, notre porte reste ouverte.",
      evitar: "Insister; relancer après un non; répondre à une demande de retrait; argumenter contre la décision; réécrire la courtoisie à la main au lieu d'utiliser le moteur de refus; le tiret cadratin.",
      proximaFase: "Le lead est classé inactif dans le pipeline. La porte reste ouverte pour un éventuel retour futur, sans initiative de notre part.",
    },
  ],
};
const DEFAULT_BIOGRAPHY = "ABiL est un atelier de création, de gestion et de promotion de marques, à Genève.\n\nNotre conviction: une marque ne se résume pas à un logo ni à un site rapide. C'est une relation entre la marque et les gens, qui se construit avec méthode, créativité et attention au détail.\n\nCe qui nous distingue, c'est la créativité et la disruption. La qualité, elle, est le minimum qu'un client est en droit d'attendre. Nous travaillons en 360: de la personnalité de la marque jusqu'à l'activation qui la rend mémorable, identité, design, web, vidéo et réseaux sociaux.\n\nNotre culture: l'humain aux commandes, l'IA comme outil, jamais l'inverse. Nous ne commençons jamais par affirmer que nous savons déjà ce dont un client a besoin; pour porter la marque de quelqu'un, il faut d'abord plonger dans son métier et l'écouter.\n\nCe texte est le manifeste de l'atelier, pas la biographie d'une personne. Complétez-le avec notre histoire réelle, nos valeurs et notre façon de travailler; l'agent le lit comme une source, jamais pour inventer.";
                                                                                                                   
                                                                                                                   
                                                                                                                     
                                                                                                          
const DEFAULT_WORK_PHILOSOPHY = [
  "Somos a ABiL, agência de criação, gestão e promoção de marcas, em Genève.",
  "Não vendemos performance de site: entregamos marca, ideia e campanha, em 360, da personalidade da marca à activação que a torna memorável.",
  "O que nos distingue é a criatividade e a disrupção: a qualidade é o mínimo que um cliente espera.",
  "Postura comercial: nunca começamos por dizer que já sabemos do que o cliente precisa. Para vender a marca de alguém é preciso mergulhar no negócio dele primeiro. A análise automática mostra a PRIMEIRA IMPRESSÃO; uma análise profunda exige tempo, conversa e proximidade.",
  "Limites: nunca inventar factos, números, clientes ou preços; nunca fingir uma análise que não foi feita; nunca prometer resultados; falar sempre na língua do lead.",
].join("\n");
                                                                                                                    
                                                                      
const SEED_DEFAULTS: Record<string, unknown> = { journey_map: DEFAULT_JOURNEY_MAP, biography: DEFAULT_BIOGRAPHY, work_philosophy: DEFAULT_WORK_PHILOSOPHY };

                                                                  
const TTL_MS = 30 * 24 * 60 * 60 * 1000;                                                             
function sign(exp: number): string { return crypto.createHmac("sha256", ADMIN_SECRET).update(String(exp)).digest("hex"); }
                                                                                                            
                                                                                                         
                                                                                                        
                                                                                                      
async function maybeBriefingHandoff(item: any): Promise<void> {
  try {
    const leadId = String(item?.leadId || "").trim(); if (!leadId) return;
    if (!ADMIN_SECRET) return;
    const exp = Date.now() + 5 * 60 * 1000; const tok = `${exp}.${sign(exp)}`;
                                                                                 
                                                                           
    const SELF = (process.env.PUBLIC_BASE_URL || "https://abil-site.vercel.app").replace(/\/$/, "");
    await fetch(`${SELF}/api/crm-leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leads: [{ id: leadId, fase: "briefing", briefingId: String(item.id || ""), briefingRecebidoAt: new Date().toISOString() }] }) }).catch(() => undefined);
    await fetch(`${SELF}/api/prospecting?action=briefing-thanks`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ leadId }) }).catch(() => undefined);
    try {
      const NTO = (typeof process !== "undefined" ? process.env : ({} as any))?.REPLY_NOTIFY_TO || "";
      if (NTO) {
                                                                                   
                                                                                    
                                                                                               
        const nome = escaparHtml(String(item?.empresa || item?.contactName || item?.name || leadId).slice(0, 120));
        const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.6"><p><b>⚡ Briefing recu: ${nome}</b></p><p>Le lead a rempli le briefing et attend la PROPOSITION. C'est la seule etape qui depend de l'operateur: ouvrir le dashboard, verifier le devis et l'envoyer.</p><p><a href="${SELF}/dashboard">Ouvrir le dashboard</a></p></div>`;
        await fetch(`${SELF}/api/email-queue`, { method: "POST", headers: { "Content-Type": "application/json", "x-abil-admin": tok }, body: JSON.stringify({ tenantId: "abil", items: [{ to: NTO, subject: `⚡ Briefing recu: ${nome} (proposition en attente)`, html, fromName: "ABiL", scheduledAt: new Date().toISOString() }] }) }).catch(() => undefined);
      }
    } catch {  }
  } catch {  }
}
function makeToken(): string { const exp = Date.now() + TTL_MS; return exp + "." + sign(exp); }
function validToken(tok: string | undefined): boolean {
  if (!tok || !ADMIN_SECRET) return false;
  const [expS, sig] = tok.split(".");
  const exp = Number(expS);
  if (!exp || exp < Date.now() || !sig) return false;
  const good = sign(exp);
  try { return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)); } catch { return false; }
}
function tokenFromReq(req: VercelRequest): string | undefined {
  const h = req.headers["x-abil-admin"];
  return Array.isArray(h) ? h[0] : (h as string | undefined);
}
function secretEquals(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
}
function passwordMatchesSecret(password: string): boolean {
  if (!password || password.length > 1024 || !ADMIN_SECRET) return false;
  const derived = crypto.scryptSync(password, "abil_admin_auth_salt_v1", 32).toString("hex");
  return secretEquals(derived, ADMIN_SECRET);
}

                                         
async function readCol(col: string): Promise<unknown | null> {
  let raw: string | null = null;
  if (BLOB_PUBLIC_BASE) {
    try {
      const r = await fetch(`${BLOB_PUBLIC_BASE.replace(/\/$/, "")}/${PREFIX}${col}.json?cb=${Date.now()}`, { cache: "no-store" });
      if (r.status === 404) return null;
      if (r.ok) raw = await r.text();
    } catch {  }
  }
  if (raw === null) {
    const b = await list({ prefix: `${PREFIX}${col}.json`, limit: 1 });
    if (b.blobs.length === 0) return null;
    const r = await fetch(b.blobs[0].url, { cache: "no-store" });
    if (!r.ok) return null;
    raw = await r.text();
  }
  let dec = decrypt(raw);
                                                                                                     
                                                                                                        
                                                                 
  if (dec === null) {
    try {
      const b2 = await list({ prefix: `${PREFIX}${col}.json`, limit: 1 });
      if (b2.blobs.length) { const r2 = await fetch(`${b2.blobs[0].url}?cb=${Date.now()}`, { cache: "no-store" }); if (r2.ok) dec = decrypt(await r2.text()); }
    } catch {  }
  }
  if (dec === null) return null;
  try { return JSON.parse(dec); } catch { return null; }
}
                                                                                                           
const SNAP_KEEP = 20;
async function snapshot(col: string, current: unknown) {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    await put(`${SNAP_PREFIX}${col}-${ts}.json`, encrypt(JSON.stringify(current)), {
      access: "public", contentType: "text/plain", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true,
    });
                                                                                                  
                                                                                                    
    try {
      const b = await list({ prefix: `${SNAP_PREFIX}${col}-`, limit: 1000 });
      const sorted = b.blobs.slice().sort((x, y) => x.pathname.localeCompare(y.pathname));
      const excess = sorted.slice(0, Math.max(0, sorted.length - SNAP_KEEP));
      if (excess.length) await del(excess.map((x) => x.url));
    } catch {  }
  } catch {  }
}
async function writeCol(col: string, data: unknown) {
  const current = await readCol(col);
  if (current != null) await snapshot(col, current);
  await put(`${PREFIX}${col}.json`, encrypt(JSON.stringify(data)), {
    access: "public", contentType: "text/plain", cacheControlMaxAge: 0, addRandomSuffix: false, allowOverwrite: true,
  });
}

function setCors(req: VercelRequest, res: VercelResponse) {
                                                                                       
                                                                                            
  {
    const _o = req.headers.origin; const _org = Array.isArray(_o) ? _o[0] : _o;
    const _ok = !!_org && (
      /^https:\/\/abil-site\.vercel\.app$/.test(_org) ||
      /^https:\/\/([a-z0-9-]+\.)?abil\.ch$/.test(_org) ||
      /^https:\/\/abil-site-[a-z0-9-]+\.vercel\.app$/.test(_org) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(_org)
    );
    if (_ok) { res.setHeader("Access-Control-Allow-Origin", _org as string); res.setHeader("Vary", "Origin"); }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-abil-admin");
}
function readBody(req: VercelRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === "string") { try { resolve(JSON.parse(req.body)); } catch (e) { reject(e); } }
      else resolve(req.body);
      return;
    }
    let buf = "";
    req.setEncoding("utf-8");
    req.on("data", (c: string) => { buf += c; });
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : null); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}
function qs(req: VercelRequest, k: string): string | null {
  const v = req.query[k];
  return typeof v === "string" ? v : Array.isArray(v) && v.length ? v[0] : null;
}
function uid(): string { return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function nestedPublicItem(item: Record<string, unknown>): Record<string, unknown> {
  return isRecord(item.item) ? item.item : item;
}
function nonEmpty(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}
function emailLike(value: unknown): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value || "").trim());
}
function publicAppendAllowed(col: string, item: Record<string, unknown>): boolean {
  const payload = nestedPublicItem(item);
  if (col === "briefings") return nonEmpty(payload.contactName ?? payload.name) && emailLike(payload.contactEmail ?? payload.email);
  if (col === "subscribers") return emailLike(payload.email ?? item.email);
  if (col === "leads") return emailLike(payload.email ?? payload.contactEmail ?? item.email ?? item.contactEmail) || nonEmpty(payload.message ?? payload.brief ?? payload.name ?? payload.contactName);
  if (col === "proposal_events") return nonEmpty(payload.slug) && ["viewed", "played", "pdf", "cta_approve", "cta_adjust"].includes(String(payload.type || ""));
  if (col === "quote_feedback") return nonEmpty(payload.qid ?? payload.slug) && (nonEmpty(payload.comentario) || (Array.isArray(payload.chips) && (payload.chips as unknown[]).length > 0));
  if (col === "pres_feedback") return nonEmpty(payload.slug) && (nonEmpty(payload.texto) || nonEmpty(payload.aprovacao) || payload.aprovado === true);
  return false;
}
function isEmptyAppendProbe(row: unknown): boolean {
  if (!isRecord(row)) return false;
  const nested = row.item;
  return isRecord(nested)
    && Object.keys(nested).length === 0
    && !nonEmpty(row.email)
    && !nonEmpty(row.name)
    && !nonEmpty(row.contactEmail)
    && !nonEmpty(row.contactName);
}
async function pruneEmptyAppendProbes(col: string): Promise<void> {
  if (!PUBLIC_APPEND.has(col)) return;
  const current = await readCol(col);
  if (!Array.isArray(current)) return;
  const next = current.filter((row) => !isEmptyAppendProbe(row));
  if (next.length !== current.length) await writeCol(col, next);
}

                                                                                                                                      
const LOGIN_FALHAS = new Map<string, { n: number; ate: number }>();
const LOGIN_MAX_LIVRE = 5;                                                 
const LOGIN_BASE_MS = 2000;                         
const LOGIN_TETO_MS = 15 * 60_000;                 
function ipDoPedido(req: VercelRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const bruto = Array.isArray(xf) ? xf[0] : (xf as string | undefined) || "";
                                                                                           
  return (bruto.split(",")[0] || req.socket?.remoteAddress || "sem-ip").trim();
}
function esperaDeLogin(ip: string): number {
  const f = LOGIN_FALHAS.get(ip);
  if (!f) return 0;
  return Math.max(0, f.ate - Date.now());
}
function registarFalhaDeLogin(ip: string): void {
  const f = LOGIN_FALHAS.get(ip) || { n: 0, ate: 0 };
  f.n += 1;
  if (f.n > LOGIN_MAX_LIVRE) {
    const recuo = Math.min(LOGIN_TETO_MS, LOGIN_BASE_MS * 2 ** (f.n - LOGIN_MAX_LIVRE - 1));
    f.ate = Date.now() + recuo;
  }
  LOGIN_FALHAS.set(ip, f);
  if (LOGIN_FALHAS.size > 5000) { for (const [k, v] of LOGIN_FALHAS) { if (v.ate < Date.now()) LOGIN_FALHAS.delete(k); } }
}

                                                                                  
                                                                                      
function escaparHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);
  const method = (req.method || "GET").toUpperCase();
  if (method === "OPTIONS") { res.status(204).end(); return; }
  if (!ADMIN_SECRET) { res.status(503).json({ error: "admin not configured", hint: "Set ABIL_ADMIN_AUTH_SECRET env var in Vercel." }); return; }

  try {
                          
                                                                                       
                                                                                       
                                                                                       
                                                                                         
                                                  
    if (method === "POST" && qs(req, "action") === "login") {
      const ip = ipDoPedido(req);
      const espera = esperaDeLogin(ip);
      if (espera > 0) {
        res.setHeader("Retry-After", String(Math.ceil(espera / 1000)));
        res.status(429).json({ ok: false, error: "too many attempts", retryAfterMs: espera });
        return;
      }
      const body = (await readBody(req)) as { password?: string } | null;
      if (body && typeof body.password === "string" && passwordMatchesSecret(body.password)) {
        LOGIN_FALHAS.delete(ip);
        res.status(200).json({ ok: true, token: makeToken(), ttlMs: TTL_MS });
      } else {
        registarFalhaDeLogin(ip);
        res.status(401).json({ ok: false, error: "invalid password" });
      }
      return;
    }

                                                                                     
                                                                                                          
                                                                                                                
                                                                                                              
                                                                                       
    if (method === "GET" && qs(req, "public") === "testimonials") {
      const cur = await readCol("testimonials");
      const arr = Array.isArray(cur) ? (cur as Array<Record<string, unknown>>) : [];
      const pub = arr
        .filter((x) => x && x.aprovado === true)
        .map((x) => ({ id: String(x.id || ""), cliente: String(x.cliente || ""), empresa: String(x.empresa || ""), texto: String(x.texto || ""), idioma: String(x.idioma || "") }));
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ ok: true, testimonials: pub });
      return;
    }

                                                            
    const appendCol = qs(req, "append");
    if (method === "POST" && appendCol) {
      if (!PUBLIC_APPEND.has(appendCol)) { res.status(403).json({ error: "collection not open to public append" }); return; }
      const raw = await readBody(req);
      await pruneEmptyAppendProbes(appendCol);
      const item = isRecord(raw) ? raw : null;
      if (!item || !publicAppendAllowed(appendCol, item)) { res.status(400).json({ error: "valid item required" }); return; }
      const cur = (await readCol(appendCol)) as unknown[] | null;
      const arr = Array.isArray(cur) ? cur : [];
      const withMeta = { id: (item.id as string) || uid(), createdAt: new Date().toISOString(), ...item };
      await writeCol(appendCol, [withMeta, ...arr]);
                                                                                   
                                                                            
      const lid = String((withMeta as any).leadId || "");
      if (appendCol === "briefings" && /^[A-Za-z0-9_-]{6,64}$/.test(lid)) { await maybeBriefingHandoff(withMeta); }
                                             
      res.status(200).json({ ok: true, id: withMeta.id });
      return;
    }

                                                             
    if (!validToken(tokenFromReq(req))) { res.status(401).json({ error: "unauthorized" }); return; }

    const col = qs(req, "col");
    if (!col || !COLLECTIONS.has(col)) { res.status(400).json({ error: "unknown collection" }); return; }

    if (method === "GET") {
      let data = await readCol(col);
                                                                                                                
                                                                                                                   
                                                                                       
      if (data == null && Object.prototype.hasOwnProperty.call(SEED_DEFAULTS, col)) {
        data = SEED_DEFAULTS[col];
        try { await writeCol(col, data); } catch {  }
      }
      res.status(200).json({ ok: true, col, value: data == null ? null : data });
      return;
    }
    if (method === "POST") {
      const body = (await readBody(req)) as { value?: unknown } | null;
      if (!body || !("value" in (body || {}))) { res.status(400).json({ error: "{value} required" }); return; }
      await writeCol(col, (body as { value: unknown }).value);
      res.status(200).json({ ok: true, col });
      return;
    }
    if (method === "DELETE") {
      const id = qs(req, "id");
      if (!id) { res.status(400).json({ error: "id required" }); return; }
      const cur = (await readCol(col)) as Array<{ id?: string }> | null;
      const arr = Array.isArray(cur) ? cur : [];
      const next = arr.filter((x) => x && x.id !== id);
      await writeCol(col, next);
      res.status(200).json({ ok: true, col, removed: arr.length - next.length });
      return;
    }

    res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error("[api/private-store] error:", e);
    res.status(500).json({ error: String((e as Error).message || e) });
  }
}
