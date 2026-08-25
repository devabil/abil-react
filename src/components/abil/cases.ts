                                                                                          
                                                                                      
                                                 
type AbilLang = "fr" | "en" | "pt" | "de" | "it";                                             
type L5 = Record<AbilLang, string>;

export type AbilCase = {
  slug: string;
  cover: string;
  images: string[];
  year: string;
  tag: L5;
  title: L5;
  context: L5;
  role: L5;
  result: L5;
};

export const ABIL_CASES: AbilCase[] = [
  {
    slug: "identite-2026",
    cover: "/brand/kv-logo-black-1.jpg",
    images: ["/brand/kv-logo-black-1.jpg", "/brand/kv-icon-yellow-1.jpg", "/brand/mock-glass-card.jpg"],
    year: "2026",
    tag: { fr: "Branding", en: "Branding", pt: "Branding", de: "Branding", it: "Branding" },
    title: { fr: "ABiL · Nouvelle identité 2026", en: "ABiL · New identity 2026", pt: "ABiL · Nova identidade 2026", de: "ABiL · Neue Identität 2026", it: "ABiL · Nuova identità 2026" },
    context: {
      fr: "Une agence qui clarifie des marques ne peut pas vivre avec une marque confuse. Le diagnostic était honnête: un nom au sens enfermé, un jaune timide, des supports dépareillés.",
      en: "An agency that clarifies brands cannot live with a confused brand. The diagnosis was honest: a name with its meaning locked away, a shy yellow, mismatched materials.",
      pt: "Uma agência que clarifica marcas não pode viver com uma marca confusa. O diagnóstico foi honesto: um nome com o sentido fechado, um amarelo tímido, suportes desirmanados.",
      de: "Eine Agentur, die Marken klärt, kann nicht mit einer verwirrten Marke leben. Die Diagnose war ehrlich: ein Name mit eingesperrtem Sinn, ein schüchternes Gelb, unzusammenhängende Träger.",
      it: "Un'agenzia che chiarisce marchi non può vivere con un marchio confuso. La diagnosi è stata onesta: un nome dal senso chiuso, un giallo timido, supporti scoordinati.",
    },
    role: {
      fr: "Stratégie de marque, direction créative, identité complète: symbole, logotype, couleur, typographie Mundial, iconographie, matière acrylique 3D.",
      en: "Brand strategy, creative direction, full identity: symbol, logotype, colour, Mundial typography, iconography, 3D acrylic matter.",
      pt: "Estratégia de marca, direção criativa, identidade completa: símbolo, logótipo, cor, tipografia Mundial, iconografia, matéria acrílica 3D.",
      de: "Markenstrategie, Creative Direction, komplette Identität: Symbol, Logotyp, Farbe, Mundial-Typografie, Ikonografie, 3D-Acrylmaterie.",
      it: "Strategia di marca, direzione creativa, identità completa: simbolo, logotipo, colore, tipografia Mundial, iconografia, materia acrilica 3D.",
    },
    result: {
      fr: "Une identité à deux couleurs et un seul geste, le A à l'angle dur et à la courbe organique, déclinable du favicon au billboard sans perdre sa voix. Vraiment habiles, écrit noir sur citron.",
      en: "A two-colour identity with a single gesture, the A with its hard angle and organic curve, scaling from favicon to billboard without losing its voice.",
      pt: "Uma identidade de duas cores e um só gesto, o A de ângulo duro e curva orgânica, declinável do favicon ao billboard sem perder a voz.",
      de: "Eine Identität mit zwei Farben und einer Geste, dem A mit hartem Winkel und organischer Kurve, vom Favicon bis zum Billboard skalierbar.",
      it: "Un'identità a due colori e un solo gesto, la A dall'angolo duro e dalla curva organica, declinabile dal favicon al billboard senza perdere la voce.",
    },
  },
  {
    slug: "billboard",
    cover: "/brand/mock-billboard-2.jpg",
    images: ["/brand/mock-billboard-2.jpg", "/brand/kv-icon-yellow-1.jpg"],
    year: "2026",
    tag: { fr: "Affichage", en: "Out of home", pt: "Exterior", de: "Aussenwerbung", it: "Affissione" },
    title: { fr: "ABiL · Campagne d'affichage", en: "ABiL · Billboard campaign", pt: "ABiL · Campanha de exterior", de: "ABiL · Plakatkampagne", it: "ABiL · Campagna di affissione" },
    context: {
      fr: "Lancer la nouvelle identité dans la rue, à Genève, au format le plus impitoyable qui soit: un billboard se lit en trois secondes ou ne se lit pas.",
      en: "Launching the new identity in the street, in Geneva, in the most unforgiving format there is: a billboard reads in three seconds or not at all.",
      pt: "Lançar a nova identidade na rua, em Genebra, no formato mais impiedoso que existe: um billboard lê-se em três segundos ou não se lê.",
      de: "Die neue Identität auf der Strasse lancieren, in Genf, im gnadenlosesten Format überhaupt: ein Billboard liest man in drei Sekunden oder gar nicht.",
      it: "Lanciare la nuova identità in strada, a Ginevra, nel formato più spietato che esista: un billboard si legge in tre secondi o non si legge.",
    },
    role: {
      fr: "Concept, direction artistique, production des visuels, déclinaison des formats.",
      en: "Concept, art direction, visual production, format declination.",
      pt: "Conceito, direção de arte, produção dos visuais, declinação de formatos.",
      de: "Konzept, Art Direction, Produktion der Visuals, Formatableitung.",
      it: "Concept, direzione artistica, produzione dei visual, declinazione dei formati.",
    },
    result: {
      fr: "Trois secondes suffisent: le citron électrique arrête l'oeil, le wordmark fait le reste. Aucun slogan explicatif, la marque assume.",
      en: "Three seconds are enough: electric citron stops the eye, the wordmark does the rest. No explanatory slogan, the brand stands on its own.",
      pt: "Três segundos chegam: o citron elétrico trava o olhar, o wordmark faz o resto. Nenhum slogan explicativo, a marca assume-se.",
      de: "Drei Sekunden genügen: Das elektrische Citron stoppt das Auge, die Wortmarke macht den Rest.",
      it: "Tre secondi bastano: il citron elettrico ferma l'occhio, il wordmark fa il resto.",
    },
  },
  {
    slug: "affiches",
    cover: "/brand/mock-cartaz-2.jpg",
    images: ["/brand/mock-cartaz-2.jpg", "/brand/kv-logo-black-1.jpg"],
    year: "2026",
    tag: { fr: "Print", en: "Print", pt: "Print", de: "Print", it: "Print" },
    title: { fr: "ABiL · Affiches de lancement", en: "ABiL · Launch posters", pt: "ABiL · Cartazes de lançamento", de: "ABiL · Launch-Plakate", it: "ABiL · Poster di lancio" },
    context: {
      fr: "Une série d'affiches pour habiter les vitrines et les couloirs des partenaires: le même système, décliné en noir sur citron et citron sur noir.",
      en: "A poster series to inhabit partner windows and corridors: the same system, declined black on citron and citron on black.",
      pt: "Uma série de cartazes para habitar montras e corredores de parceiros: o mesmo sistema, declinado em noir sobre citron e citron sobre noir.",
      de: "Eine Plakatserie für Schaufenster und Flure der Partner: dasselbe System, schwarz auf Citron und Citron auf Schwarz.",
      it: "Una serie di poster per vetrine e corridoi dei partner: lo stesso sistema, declinato nero su citron e citron su nero.",
    },
    role: {
      fr: "Direction artistique, grille typographique, production print.",
      en: "Art direction, typographic grid, print production.",
      pt: "Direção de arte, grelha tipográfica, produção print.",
      de: "Art Direction, typografisches Raster, Printproduktion.",
      it: "Direzione artistica, griglia tipografica, produzione print.",
    },
    result: {
      fr: "La preuve que deux couleurs suffisent: la série se reconnaît de loin, avant même de lire. Le système tient sans photo, la typographie porte tout.",
      en: "Proof that two colours suffice: the series is recognisable from afar, before reading. The system holds without photos, typography carries everything.",
      pt: "A prova de que duas cores chegam: a série reconhece-se ao longe, antes de ler. O sistema aguenta sem fotografia, a tipografia carrega tudo.",
      de: "Der Beweis, dass zwei Farben genügen: Die Serie erkennt man von weitem, noch vor dem Lesen.",
      it: "La prova che due colori bastano: la serie si riconosce da lontano, prima ancora di leggere.",
    },
  },
  {
    slug: "papeterie",
    cover: "/brand/mock-glass-card.jpg",
    images: ["/brand/mock-glass-card.jpg"],
    year: "2026",
    tag: { fr: "Identité", en: "Identity", pt: "Identidade", de: "Identität", it: "Identità" },
    title: { fr: "ABiL · Papeterie & cartes", en: "ABiL · Stationery & cards", pt: "ABiL · Estacionário & cartões", de: "ABiL · Geschäftsausstattung", it: "ABiL · Cancelleria & biglietti" },
    context: {
      fr: "Le premier objet de marque que l'on tend à un client est une carte. Elle devait raconter la matière de la marque: transparence et solidité.",
      en: "The first brand object handed to a client is a card. It had to tell the brand's matter: transparency and solidity.",
      pt: "O primeiro objeto de marca que se estende a um cliente é um cartão. Tinha de contar a matéria da marca: transparência e solidez.",
      de: "Das erste Markenobjekt, das man einem Kunden reicht, ist eine Karte. Sie musste die Materie der Marke erzählen: Transparenz und Solidität.",
      it: "Il primo oggetto di marca che si porge a un cliente è un biglietto. Doveva raccontare la materia del marchio: trasparenza e solidità.",
    },
    role: {
      fr: "Design des supports, choix des matières, direction de production.",
      en: "Support design, material choice, production direction.",
      pt: "Design dos suportes, escolha de matérias, direção de produção.",
      de: "Gestaltung der Träger, Materialwahl, Produktionsleitung.",
      it: "Design dei supporti, scelta dei materiali, direzione di produzione.",
    },
    result: {
      fr: "Une carte que l'on garde en main: le citron plein, le A en réserve, l'information réduite à ce qui sert. On voit à travers, et pourtant ça tient.",
      en: "A card you keep in hand: full citron, the A in reserve, information reduced to what serves. You see through it, and yet it holds.",
      pt: "Um cartão que fica na mão: o citron cheio, o A em reserva, a informação reduzida ao que serve.",
      de: "Eine Karte, die man in der Hand behält: volles Citron, das A ausgespart, die Information aufs Nötige reduziert.",
      it: "Un biglietto che resta in mano: il citron pieno, la A in riserva, l'informazione ridotta a ciò che serve.",
    },
  },
  {
    slug: "site-experience",
    cover: "/brand/mock-website-2.jpg",
    images: ["/brand/mock-website-2.jpg", "/brand/kv-icon-yellow-1.jpg"],
    year: "2026",
    tag: { fr: "Digital", en: "Digital", pt: "Digital", de: "Digital", it: "Digitale" },
    title: { fr: "ABiL · Site & expérience", en: "ABiL · Site & experience", pt: "ABiL · Site & experiência", de: "ABiL · Website & Experience", it: "ABiL · Sito & esperienza" },
    context: {
      fr: "Le site devait faire ce que la marque promet: dire beaucoup avec peu, bouger avec justesse, et laisser le citron travailler.",
      en: "The site had to do what the brand promises: say a lot with little, move with rightness, and let the citron work.",
      pt: "O site tinha de fazer o que a marca promete: dizer muito com pouco, mover-se com justeza, e deixar o citron trabalhar.",
      de: "Die Website musste tun, was die Marke verspricht: viel mit wenig sagen, sich mit Genauigkeit bewegen, das Citron arbeiten lassen.",
      it: "Il sito doveva fare ciò che il marchio promette: dire molto con poco, muoversi con giustezza, lasciar lavorare il citron.",
    },
    role: {
      fr: "Design d'expérience, système de design en tokens, développement, animations, cinq langues.",
      en: "Experience design, token-based design system, development, animation, five languages.",
      pt: "Design de experiência, design system em tokens, desenvolvimento, animações, cinco línguas.",
      de: "Experience Design, tokenbasiertes Designsystem, Entwicklung, Animation, fünf Sprachen.",
      it: "Design dell'esperienza, design system a token, sviluppo, animazioni, cinque lingue.",
    },
    result: {
      fr: "Un site fidèle au dessin original au pixel près, mesuré et non estimé, avec un système d'animation sobre: les entrées par ligne, la seta qui guide, le curseur qui répond.",
      en: "A site faithful to the original drawing to the pixel, measured not estimated, with a sober animation system: line reveals, a guiding arrow, a cursor that responds.",
      pt: "Um site fiel ao desenho original ao pixel, medido e não estimado, com um sistema de animação sóbrio.",
      de: "Eine Website, die der Originalzeichnung pixelgenau folgt, gemessen statt geschätzt, mit nüchternem Animationssystem.",
      it: "Un sito fedele al disegno originale al pixel, misurato e non stimato, con un sistema di animazione sobrio.",
    },
  },
  {
    slug: "key-visual",
    cover: "/brand/kv-icon-yellow-1.jpg",
    images: ["/brand/kv-icon-yellow-1.jpg", "/brand/kv-logo-black-1.jpg"],
    year: "2026",
    tag: { fr: "Direction créative", en: "Creative direction", pt: "Direção criativa", de: "Creative Direction", it: "Direzione creativa" },
    title: { fr: "ABiL · Key visual acrylique", en: "ABiL · Acrylic key visual", pt: "ABiL · Key visual acrílico", de: "ABiL · Acryl-Key-Visual", it: "ABiL · Key visual acrilico" },
    context: {
      fr: "Une identité plate ne suffit plus: la marque avait besoin d'une matière. Le A a été construit en acrylique 3D, transparent et massif à la fois.",
      en: "A flat identity is no longer enough: the brand needed a matter. The A was built in 3D acrylic, transparent and massive at once.",
      pt: "Uma identidade plana já não chega: a marca precisava de uma matéria. O A foi construído em acrílico 3D, transparente e maciço ao mesmo tempo.",
      de: "Eine flache Identität genügt nicht mehr: Die Marke brauchte eine Materie. Das A wurde in 3D-Acryl gebaut, transparent und massiv zugleich.",
      it: "Un'identità piatta non basta più: il marchio aveva bisogno di una materia. La A è stata costruita in acrilico 3D, trasparente e massiccia insieme.",
    },
    role: {
      fr: "Direction créative, modélisation 3D, rendus, système d'application sur tous les supports.",
      en: "Creative direction, 3D modelling, renders, application system across supports.",
      pt: "Direção criativa, modelação 3D, renders, sistema de aplicação em todos os suportes.",
      de: "Creative Direction, 3D-Modellierung, Renderings, Anwendungssystem.",
      it: "Direzione creativa, modellazione 3D, render, sistema di applicazione.",
    },
    result: {
      fr: "Le key visual porte le site, les affiches et le billboard. Il traduit en matière ce que la marque promet en mots: la transparence, la solidité, la modernité.",
      en: "The key visual carries the site, posters and billboard. It translates into matter what the brand promises in words: transparency, solidity, modernity.",
      pt: "O key visual carrega o site, os cartazes e o billboard. Traduz em matéria o que a marca promete em palavras.",
      de: "Das Key Visual trägt Website, Plakate und Billboard. Es übersetzt in Materie, was die Marke in Worten verspricht.",
      it: "Il key visual porta il sito, i poster e il billboard. Traduce in materia ciò che il marchio promette a parole.",
    },
  },
];
