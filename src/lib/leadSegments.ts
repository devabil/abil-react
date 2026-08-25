                                                                                                            
                                                                                                           
                                                                                                                  
                                                                                                            
                                                                                                                
                                                                                                                   
                                                                                                           
                                                                                                                      
                                                                                                                   
                                                                                                                

type LeadSegment = { key: string; label: string; icon?: string; keywords: string[]; dores: string[]; oportunidades: string[]; angulo: string; projetos: { nome: string; porque: string; thumb: string }[] };
const LEAD_SEGMENTS: LeadSegment[] = [
  { key: "saas", label: "Tecnologia e SaaS", keywords: ["SaaS", "software", "tecnologia", "startup", "produto digital", "posicionamento"], dores: ["O produto é tecnicamente sólido, mas ninguém percebe em cinco segundos o que faz nem porque importa.", "A imagem é a mesma de todos os concorrentes de software: trocava-se o logótipo e ninguém dava conta.", "A aquisição fica cara a compensar uma marca fraca, e a baixa perceção trava a ronda de investimento e as vendas."], oportunidades: ["Posicionamento e identidade que tornam o produto memorável na lista de comparação.", "Site e narrativa que traduzem a tecnologia em valor humano, percebido em segundos.", "Sistema de marca e conteúdo que baixa o custo de aquisição e sustenta o crescimento."], angulo: "Onde todos vendem a mesma funcionalidade, a ABiL constrói a marca que faz escolher antes de comparar a tabela de preços.", projetos: [] },
                                                                                                          
                                                                                                    
  { key: "salao_beleza", label: "Salão de beleza", keywords: ["salão de beleza", "cabeleireiro", "cabeleireira", "coiffure", "coiffeur", "penteado", "coloração"], dores: ["A marca do salão é a de sempre: o nome da dona em manuscrito, uma foto de cabelo de banco de imagens e pouco mais.", "O corte e a cor são trabalho técnico de alto nível, mas nada na comunicação mostra a mão de quem os faz.", "Sem imagem própria, a cliente escolhe pela agenda livre e pelo preço, e a casa nunca sai da comparação com a da mesma rua."], oportunidades: ["Identidade com assinatura própria, que separa a casa do salão genérico ao lado.", "Site e redes com marcação simples e portefólio de trabalho real, que atraem a cliente certa.", "Sistema visual que transforma cada transformação feita na cadeira em prova social contínua."], angulo: "A ABiL dá aos salões uma marca com a mesma assinatura da mão que corta, para se escolherem pelo trabalho e não pela agenda.", projetos: [] },
  { key: "estetica", label: "Estética e beleza", keywords: ["estética", "beleza", "clínica estética", "spa", "cuidados de pele", "medicina estética"], dores: ["A marca repete o cliché do setor: rosa, dourado e fotografia de banco de imagens iguais aos de qualquer salão.", "O nível do serviço e do resultado é alto, mas a comunicação não transmite esse cuidado, e a cliente não percebe o valor.", "Sem imagem consistente, as marcações vivem de recomendação e de localização, e o preço fica preso à concorrência da esquina."], oportunidades: ["Identidade que transmite cuidado e resultado premium, distinta do salão genérico ao lado.", "Site e redes com estética própria e marcação simples, que atraem a cliente certa.", "Sistema visual que transforma resultados reais em prova social contínua."], angulo: "Em estética a imagem é o primeiro tratamento: a ABiL desenha marcas de beleza que comunicam o resultado com o mesmo requinte com que ele é entregue.", projetos: [] },
  { key: "hotelaria", label: "Hotelaria", keywords: ["hotel", "resort", "hospitalidade", "experiência do hóspede", "reservas diretas", "boutique hotel"], dores: ["A marca parece um hotel qualquer de brochura: a mesma promessa de vista e de conforto que todos os concorrentes usam.", "As plataformas de reserva ficam com a margem porque o site próprio não convence ninguém a reservar direto.", "A experiência no local é de outra categoria, mas a comunicação online não a transmite, e a tarifa não acompanha o valor real."], oportunidades: ["Identidade de atmosfera que vende a estadia antes do check-in e justifica a tarifa certa.", "Site com marca forte e reserva direta, para recuperar margem às plataformas.", "Narrativa visual coerente do quarto às redes, que transforma hóspedes em prova social."], angulo: "A ABiL desenha marcas de hospitalidade que se escolhem pelo desejo, não pelo filtro de preço da plataforma.", projetos: [] },
                                                                                                      
                                                                                            
  { key: "mobiliario", label: "Mobiliário e decoração", keywords: ["mobiliário", "móveis", "marcenaria", "decoração de interiores", "meubles", "ameublement"], dores: ["A marca vende peças feitas para durar décadas com uma imagem que parece de catálogo descartável.", "A oficina e a escolha do material são o argumento, mas o site mostra só um preço ao lado de uma foto recortada sobre fundo branco.", "Sem marca que sustente o valor, a peça é comparada ao equivalente industrial e a conversa acaba no desconto."], oportunidades: ["Identidade e direção de arte que põem a matéria e a mão de obra no centro, que é onde está o valor.", "Site e catálogo que mostram a peça em uso e em contexto, não recortada sobre branco.", "Sistema visual coerente da loja à entrega, que sustenta o preço de uma peça feita para durar."], angulo: "A ABiL dá ao mobiliário a marca da matéria e da mão que o faz, para se vender pela durabilidade e não pelo desconto.", projetos: [] },
  { key: "ecommerce", label: "E-commerce", keywords: ["e-commerce", "loja online", "marca", "conversão", "produto", "checkout"], dores: ["A loja usa o mesmo template de todas as outras, e nada na marca faz o visitante confiar o suficiente para comprar.", "O produto é bom, mas as fotos, a ficha e a montra digital não lhe fazem justiça, e o carrinho fica por concluir.", "A concorrência de preço e de marketplace obriga a competir no desconto, porque a marca não sustenta o valor."], oportunidades: ["Identidade e direção de arte de loja que criam confiança e elevam o valor percebido do produto.", "Experiência de compra coerente, da montra ao checkout, pensada para converter e fidelizar.", "Sistema de conteúdo e campanha que sustenta vendas sem depender só de promoções."], angulo: "A ABiL transforma catálogos numa marca que se compra por desejo, para vender sem competir só no desconto.", projetos: [] },
  { key: "petvet", label: "Pet shop e veterinária", keywords: ["pet shop", "veterinária", "clínica animal", "animais", "tutores", "cuidado animal"], dores: ["A marca é a mesma pata azul e tipografia redonda de qualquer clínica ou loja de animais do bairro.", "O cuidado com o animal é genuíno e diferenciado, mas a comunicação não o mostra, e o tutor não percebe o valor.", "Sem imagem própria, a escolha do tutor cai na proximidade e no preço, não na confiança na marca."], oportunidades: ["Identidade com carácter que transmite confiança e proximidade, distinta da concorrência de bairro.", "Site e redes com marcação e conteúdo úteis, que fidelizam o tutor além da consulta.", "Sistema visual que transforma o cuidado real e os casos felizes em prova social."], angulo: "A ABiL dá às marcas de pet e veterinária a imagem da confiança que os tutores já sentem, para escolherem pelo nome e não pela distância.", projetos: [] },
  { key: "academias", label: "Ginásios e fitness", keywords: ["ginásio", "fitness", "treino", "personal trainer", "estúdio", "bem-estar"], dores: ["A marca é igual à do ginásio ao lado: o mesmo laranja energético e as mesmas fotos de banco de imagens.", "A experiência e a comunidade lá dentro são fortes, mas a comunicação não as transmite, e o valor da mensalidade parece só um número.", "Sem marca e conteúdo próprios, a retenção depende do preço e a angariação vive de campanhas de desconto."], oportunidades: ["Identidade com energia própria que cria pertença e distingue o espaço da concorrência low-cost.", "Site e redes com inscrição simples e conteúdo que motiva, para angariar e reter sócios.", "Sistema de conteúdo que transforma a comunidade e os resultados em prova social contínua."], angulo: "A ABiL constrói marcas de fitness a que as pessoas querem pertencer, para reter pelo valor e não pela guerra de mensalidades.", projetos: [] },
  { key: "arquitetura", label: "Arquitetura e imobiliário", keywords: ["arquitetura", "imobiliário", "empreendimento", "atelier", "promoção", "lançamento"], dores: ["O render azulado e o casal feliz de banco de imagens fazem o projeto parecer igual a todos os outros.", "Os materiais de venda estão desalinhados: cada brochura, portal e stand com uma cara diferente.", "O trabalho de atelier é de exceção, mas a marca comunica como um gabinete qualquer, e o preço é pressionado."], oportunidades: ["Naming e identidade por projeto que valorizam o metro quadrado e aceleram a venda.", "Sistema de marca coerente do stand ao portal, com materiais que respiram o mesmo desenho.", "Site com narrativa e captação de contactos, pensado para vender e para posicionar o atelier."], angulo: "Em arquitetura e imobiliário compra-se primeiro a promessa: a ABiL constrói a marca que faz o projeto valer mais antes da primeira visita.", projetos: [] },
  { key: "engenharia", label: "Engenharia", keywords: ["engenharia", "técnico", "infraestrutura", "projeto", "B2B", "precisão"], dores: ["O rigor técnico é de topo, mas a marca comunica como um gabinete qualquer, sem sinal da competência que existe lá dentro.", "Materiais técnicos e comerciais desalinhados: cada proposta, catálogo e apresentação com uma imagem diferente.", "A qualidade está lá, mas o preço é pressionado porque a imagem não sustenta o posicionamento nem abre portas B2B."], oportunidades: ["Identidade que traduz precisão e competência em marca, coerente da proposta à apresentação e ao digital.", "Narrativa de projeto e de método que justifica o preço e abre conversas com clientes maiores.", "Sistema visual duradouro, pensado para uma casa que trabalha em ciclos longos."], angulo: "A ABiL põe a imagem à altura da engenharia: marcas técnicas que comunicam o rigor que já praticam.", projetos: [] },
  { key: "fashion", label: "Moda e vestuário", keywords: ["moda", "vestuário", "marca", "coleção", "têxtil", "estilo"], dores: ["O produto tem estilo, mas a marca nasceu improvisada e nunca acompanhou a ambição das coleções.", "A imagem é dispersa: logótipo antigo, lookbook fraco e redes sem direção de arte.", "A concorrência de fast-fashion e de template obriga a competir no preço, porque a marca não sustenta o valor."], oportunidades: ["Identidade completa, do logótipo à etiqueta e ao lookbook, que cria desejo e repetição.", "Direção de arte de coleção e de campanha que eleva o valor percebido de cada peça.", "Sistema de conteúdo consistente que constrói marca sem depender só de saldos."], angulo: "A ABiL transforma boas coleções em marcas de moda com desejo, que se vendem pelo estilo e não pelo desconto.", projetos: [] },
  { key: "dentistas", label: "Clínicas dentárias", keywords: ["clínica dentária", "dentista", "medicina dentária", "sorriso", "implantes", "ortodontia"], dores: ["A marca repete o cliché do setor: branco clínico, azul frio e o mesmo sorriso de banco de imagens.", "O nível do serviço é alto, mas a comunicação parece de qualquer consultório, e o paciente não percebe o valor.", "Sem presença digital consistente, as marcações vivem de recomendação e de seguro, não da confiança na marca."], oportunidades: ["Identidade que transmite confiança e cuidado premium, distinta da clínica genérica ao lado.", "Site claro com marcação simples e conteúdo que educa e tranquiliza o paciente.", "Sistema de comunicação que transforma pacientes satisfeitos em prova social contínua."], angulo: "Em medicina dentária a confiança decide: a ABiL desenha marcas que comunicam o cuidado com o mesmo rigor com que ele é prestado.", projetos: [] },
  { key: "barbearias", label: "Barbearias", keywords: ["barbearia", "barbeiro", "grooming", "corte", "estilo masculino", "cuidado"], dores: ["A marca é a mesma estética vintage de todas as barbearias: o mesmo poste, a mesma navalha, o mesmo tom.", "O ritual e a experiência lá dentro são fortes, mas a comunicação não os transmite, e o corte parece só mais um.", "Sem marca e conteúdo próprios, a escolha do cliente cai na proximidade e no preço, não na preferência."], oportunidades: ["Identidade com carácter próprio que distingue a casa do lugar-comum vintage do setor.", "Site e redes com marcação simples e conteúdo que constrói ritual e fidelidade.", "Sistema visual que transforma o estilo da casa e os clientes em prova social."], angulo: "A ABiL dá às barbearias uma marca com assinatura própria, para se escolherem pelo estilo e não pela esquina.", projetos: [] },
  { key: "cervejarias", label: "Cervejarias artesanais", keywords: ["cerveja artesanal", "cervejaria", "craft", "rótulo", "lúpulo", "prova"], dores: ["O rótulo perde-se na prateleira: a mesma ilustração e o mesmo tom de todas as craft ao lado.", "A cerveja e a história da casa são boas, mas nada disso chega a quem escolhe a lata na prateleira.", "Sem marca forte, o preço fica preso à média do craft, por muito que a qualidade justifique mais."], oportunidades: ["Identidade e sistema de rótulos que contam a casa e destacam cada lata na prateleira e no bar.", "Site e loja com narrativa própria, para vender direto e criar comunidade em volta da marca.", "Direção de arte de gama e de edições que posiciona a cervejaria acima da média do craft."], angulo: "A ABiL transforma cervejarias com boa cerveja em marcas com território próprio, que se pagam ao preço que merecem.", projetos: [] },
  { key: "vinicolas", label: "Vinhos e vinícolas", keywords: ["vinho", "vinícola", "adega", "terroir", "quinta", "prova"], dores: ["O rótulo perde-se na prateleira: tipografia clássica e medalha dourada iguais às de todos os vizinhos de região.", "A história da quinta e do terroir é rica, mas nada disso chega a quem compra a garrafa.", "Sem marca própria, o preço fica preso à média da denominação, por muito que a qualidade justifique mais."], oportunidades: ["Identidade e sistema de rótulos que contam o terroir e valorizam cada garrafa na prateleira e à mesa.", "Site e loja com narrativa de origem, para vender direto e fidelizar o cliente final.", "Direção de arte de prova e de gama que posiciona a quinta acima da denominação."], angulo: "A ABiL transforma quintas com bom vinho em marcas com território próprio, que se pagam ao preço que merecem.", projetos: [] },
  { key: "restaurantes", label: "Restauração", keywords: ["restaurante", "restauração", "cozinha", "menu", "chef", "reservas"], dores: ["A marca não se distingue: a mesma paleta de apetite de qualquer casa, e o restaurante desaparece entre os vizinhos.", "As fotos e o menu online não fazem justiça à cozinha: a experiência real é bem melhor do que a que o site mostra.", "Dependência das plataformas de reserva e entrega de terceiros, sem canal próprio nem marca que puxe gente à porta."], oportunidades: ["Identidade com carácter próprio, do logótipo ao menu e à sala, que vende a experiência antes do primeiro prato.", "Site próprio com reservas e menu sempre atual, para reduzir a dependência das plataformas.", "Sistema de conteúdo para redes que mostra a casa como ela é e enche mesas nos dias fracos."], angulo: "Onde todos comunicam apetite, a ABiL constrói marcas de restauração que se reconhecem à distância e enchem a sala pelo nome.", projetos: [] },
  { key: "hamburguerias", label: "Hamburguerias", keywords: ["hamburgueria", "burger", "smash", "fast-casual", "menu", "entregas"], dores: ["A marca é o mesmo estilo americano de todas as hamburguerias: o mesmo vermelho, o mesmo lettering, o mesmo tom.", "O produto é bom, mas as fotos e a marca não o distinguem, e a casa desaparece entre dezenas de concorrentes.", "Dependência das plataformas de entrega, que ficam com a margem e com a relação com o cliente."], oportunidades: ["Identidade com carácter próprio que destaca a casa no meio da uniformidade do setor.", "Site próprio com menu e encomenda, para recuperar margem e relação às plataformas.", "Sistema de conteúdo para redes que cria fome, marca e enchentes nos dias fracos."], angulo: "Onde todas as hamburguerias se parecem, a ABiL constrói a marca que se reconhece e se escolhe pelo nome.", projetos: [] },
  { key: "pizzarias", label: "Pizzarias", keywords: ["pizzaria", "pizza", "forno a lenha", "napolitana", "menu", "entregas"], dores: ["A marca é o mesmo cliché italiano de sempre: verde, branco e vermelho iguais aos de qualquer pizzaria.", "A pizza e o forno são de verdade, mas a comunicação não os distingue, e a casa parece só mais uma.", "Dependência das plataformas de entrega, que ficam com a margem e com a relação com o cliente."], oportunidades: ["Identidade com carácter próprio que foge ao lugar-comum italiano e destaca a casa.", "Site próprio com menu e encomenda, para recuperar margem e relação às plataformas.", "Sistema de conteúdo para redes que mostra o produto real e enche a casa nos dias fracos."], angulo: "Onde todas as pizzarias repetem o mesmo cliché, a ABiL constrói a marca que se reconhece e se escolhe pelo nome.", projetos: [] },
  { key: "igaming", label: "iGaming e casino online", keywords: ["iGaming", "casino online", "apostas", "plataforma", "jogo", "marca"], dores: ["A marca é a mesma de todos os operadores: o mesmo dourado, o mesmo néon, a mesma promessa de bónus.", "Num setor saturado e regulado, sem identidade forte a aquisição fica cara e a retenção não acontece.", "A confiança é decisiva neste mercado, mas a imagem genérica não a constrói, e o jogador não fica."], oportunidades: ["Posicionamento e identidade que distinguem o operador no meio da uniformidade do setor.", "Direção de arte de marca e de campanha que baixa o custo de aquisição e constrói confiança.", "Sistema visual coerente da plataforma às redes, que sustenta retenção e valor de marca."], angulo: "Num mercado onde todos os operadores se parecem, a ABiL constrói a marca que se distingue e em que o jogador confia.", projetos: [] },
  { key: "generico", label: "Serviços e PME (genérico)", keywords: ["PME", "serviços", "negócio local", "marca", "site", "comunicação"], dores: ["A marca nasceu improvisada e nunca acompanhou o crescimento do negócio.", "A comunicação é dispersa: logótipo antigo, site desatualizado e redes sem plano.", "O negócio vale mais do que aparenta, e o preço é pressionado porque a imagem não sustenta o valor."], oportunidades: ["Identidade profissional coerente que põe a imagem ao nível da qualidade real do serviço.", "Site claro e atual que funciona como o melhor comercial da empresa.", "Plano de comunicação simples e consistente, executável sem equipa de marketing interna."], angulo: "Para uma PME, a marca é preço: a ABiL alinha a imagem com o valor real do negócio, para vender melhor sem vender mais barato.", projetos: [] },
];

                                                                                                             
                                                                                                              
function computeBriefingScore(briefing: any): { score: number; ancoras_faltando: string[]; publishable: boolean; selo: string } {
  if (!briefing) return { score: 0, ancoras_faltando: ["produto_central", "subnicho", "dor_resolvida", "gap_principal", "porta_entrada"], publishable: false, selo: "sem-briefing" };
  const ANCORAS = ["produto_central", "subnicho", "dor_resolvida", "gap_principal", "porta_entrada"];
  const SECUND = ["diferencial_real", "marca_promessa", "promessa_comunicada", "preco_posicionamento", "amplitude_oferta", "prova_social", "fundador", "pontos_contacto", "geografia"];
  const has = (k: string) => { const v = (briefing as any)[k]; return v != null && String(v).trim() !== ""; };
  const ancFalt = ANCORAS.filter((k) => !has(k));
  const ancOk = ANCORAS.length - ancFalt.length;
  const secOk = SECUND.filter(has).length;
  const score = Math.round((ancOk / ANCORAS.length) * 70 + (secOk / SECUND.length) * 30);
  const temAncoraEspecifica = ["gap_principal", "diferencial_real", "promessa_comunicada", "prova_social", "dor_resolvida"].some(has);
  const publishable = ancOk >= 3 && temAncoraEspecifica;
  const selo = (score >= 70 && publishable) ? "rico" : (score >= 45 ? "parcial" : "insuficiente");
  return { score, ancoras_faltando: ancFalt, publishable, selo };
}

                                                                                                                   
                                                                                                                 
function siteIlegivelDeAudit(lead: any): boolean {
  const A = lead?.audit; if (!A) return false;
  const semSite = !!(A as any).semSite;
  const temSite = !semSite && !!String(lead?.website || "").trim();
  if (!temSite) return false;
  const spaIlegivel = !((A.siteTitle || "").trim()) && !((A.metaDescText || "").trim()) && (!A.colorCount || A.colorCount < 2);
  const textoUtilLen = `${A.siteTitle || ""} ${A.metaDescText || ""} ${A.brand?.what || ""} ${(A.briefing as any)?.produto_central || ""}`.replace(/\s+/g, " ").trim().length;
  return spaIlegivel || textoUtilLen < 12;
}

                                                                                                                                                                                                                                             
                                                                                                              
                                                                                                               
                                                                                                                   
                                                                                               
                                                                                                                   
                                                                                                
function lpNivelDeLead(lead: any): "profundo" | "raso" | "" {
  const url = String(lead?.audit?.publishedUrl || "").trim();
  if (!url) return "";
  return String(lead?.audit?.lpNivel || "") === "profundo" ? "profundo" : "raso";
}
                                                                                                                   
                                                                                                                    
                                                                                
function precisaLpProfunda(lead: any): boolean { return lpNivelDeLead(lead) !== "profundo"; }

                                                                                                              
                                                                                                                  
const GOOGLE_TYPE_TO_SEG: Record<string, string> = {
  dentist: "dentistas", dental_clinic: "dentistas",
                                                                                                       
                                                                                                           
                                                                                                  
  barber_shop: "barbearias",
  hair_care: "salao_beleza", hair_salon: "salao_beleza",
  beauty_salon: "estetica", spa: "estetica", nail_salon: "estetica", skin_care_clinic: "estetica",
  furniture_store: "mobiliario", home_goods_store: "mobiliario",
  gym: "academias", fitness_center: "academias",
  lodging: "hotelaria", hotel: "hotelaria", resort_hotel: "hotelaria", bed_and_breakfast: "hotelaria", guest_house: "hotelaria", motel: "hotelaria",
  restaurant: "restaurantes", meal_takeaway: "restaurantes", meal_delivery: "restaurantes", cafe: "restaurantes", bakery: "restaurantes", coffee_shop: "restaurantes",
  bar: "cervejarias", pub: "cervejarias", brewery: "cervejarias",
  hamburger_restaurant: "hamburguerias", fast_food_restaurant: "hamburguerias",
  pizza_restaurant: "pizzarias",
  clothing_store: "fashion", shoe_store: "fashion", boutique: "fashion",
  veterinary_care: "petvet", pet_store: "petvet",
  winery: "vinicolas",
  architect: "arquitetura",
  general_contractor: "engenharia",
};

                                                                                                                
                                                                                                                   
                                                         
const CLAIM_RISKY: RegExp[] = [
  /(pr[ée]mio|pr[ée]mios|prix remport\w*|award|awards|galard\w*|lauread\w*|primé|vencedor d\w+)/i,
  /(l[íi]der de mercado|l[íi]der d[oa]\s|leader du march[ée]|market leader|n[ºo.]\s?1|#1|number one|num[ée]ro un)/i,
];
function scrubClaims(text: string, factsLc: string): { clean: string; removed: string[] } {
  if (!text || !text.trim()) return { clean: text, removed: [] };
  const removed: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => {
    for (const re of CLAIM_RISKY) { const mm = s.match(re); if (mm && !factsLc.includes(String(mm[0]).toLowerCase())) { removed.push(s.trim()); return false; } }
    const num = s.match(/(\d{2,4})\s*(ans|anos|clients|clientes|projets|projetos|projectos|pays|pa[íi]ses|paises|marques|marcas|filiais|magasins|lojas|stores)/i);
    if (num && !factsLc.includes(num[1])) { removed.push(s.trim()); return false; }
    return true;
  });
  return { clean: kept.join(" ").trim(), removed };
}

                                                                                                                  
                                                                                            
function matchLeadSegment(txt: string | undefined, SEGS: LeadSegment[] = LEAD_SEGMENTS): LeadSegment {
  const s = String(txt || "").toLowerCase();
  const found = s ? SEGS.find((x) => x.key !== "generico" && (s.includes(x.label.toLowerCase()) || x.keywords.some((k) => s.includes(k.toLowerCase())))) : undefined;
  return found || SEGS.find((x) => x.key === "generico") || SEGS[0];
}
                                                                                                                         
                                                                                                                     
function pickSegmentForLead(lead: any, SEGS: LeadSegment[] = LEAD_SEGMENTS): { seg: LeadSegment; segmentoPorConfirmar: boolean } {
  const A = lead?.audit || {};
  let seg = matchLeadSegment(lead?.setor || A?.brand?.sector, SEGS);
  let segmentoPorConfirmar = false;
  if (seg.key === "generico") {
    const gType = String(lead?.googleCategoria || A?.googleCategoria || "").trim().toLowerCase();
    const segKeyFromGoogle = gType ? GOOGLE_TYPE_TO_SEG[gType] : undefined;
    if (segKeyFromGoogle) { const found = SEGS.find((x) => x.key === segKeyFromGoogle); if (found) seg = found; }
    if (seg.key === "generico") segmentoPorConfirmar = true;
  }
  return { seg, segmentoPorConfirmar };
}

export type { LeadSegment };
export {
  LEAD_SEGMENTS,
  GOOGLE_TYPE_TO_SEG,
  CLAIM_RISKY,
  computeBriefingScore,
  siteIlegivelDeAudit,
  scrubClaims,
  matchLeadSegment,
  pickSegmentForLead,
  lpNivelDeLead,
  precisaLpProfunda,
};
