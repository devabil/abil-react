   
                                                                                    
  
                                                                                           
                                                                                            
                                                                              
  
                                                                               
                                                                                 
                                                                                  
                                                                                       
                                              
   
export type ServiceCatalogItem = {
  id: string;
  nome: string;
  cobre: string;
  dores: string[];
};

export const SERVICES_CATALOG: ServiceCatalogItem[] = [
  {
    id: "branding",
    nome: "Branding",
    cobre: "Identidade visual completa, logo, sistema gráfico.",
    dores: ["A marca parece igual as concorrentes do segmento.", "O logotipo existe so em versao de baixa qualidade ou improvisada.", "Cada peca de comunicacao sai com um visual diferente, sem sistema."],
  },
  {
    id: "naming",
    nome: "Naming",
    cobre: "Nome de marca, slogan, manifesto.",
    dores: ["O nome atual nao diz nada sobre o negocio ou confunde o cliente.", "Falta um slogan ou uma frase que resuma a promessa da marca.", "A empresa vai lancar um produto ou negocio novo e ainda nao tem nome."],
  },
  {
    id: "activation",
    nome: "Ativação de marca",
    cobre: "Eventos, pop-ups, lançamentos físicos.",
    dores: ["A marca nao tem presenca fisica memoravel em eventos ou lancamentos.", "Os lancamentos passam despercebidos, sem momento de experiencia.", "Falta ligar o online ao mundo fisico com uma acao concreta."],
  },
  {
    id: "campaigns",
    nome: "Publicidade",
    cobre: "Billboard, front light, jornais, revistas, OOH, ATL/BTL.",
    dores: ["A marca nao aparece nos canais tradicionais onde o publico dela esta.", "As campanhas saem soltas, sem conceito criativo que as una.", "O investimento em midia nao tem uma peca criativa a altura."],
  },
  {
    id: "social_media",
    nome: "Social media",
    cobre: "Redes, orgânico, tráfego pago, buyer personas, templates, tags.",
    dores: ["As redes estao paradas ou publicam sem constancia.", "O feed nao tem identidade nem linha editorial reconhecivel.", "Publica-se sem saber para que publico nem com que objetivo."],
  },
  {
    id: "marketing_digital",
    nome: "Marketing digital",
    cobre: "Google Ads, Facebook Ads, inbound marketing, social, SEO.",
    dores: ["O site nao aparece nas pesquisas do publico-alvo.", "Nao ha captacao de leads alem do boca a boca.", "Investe-se em anuncios sem estrategia nem medicao."],
  },
  {
    id: "marketing_360",
    nome: "Marketing 360°",
    cobre: "Estratégia integrada multi-canal.",
    dores: ["Cada canal da marca fala uma lingua diferente, sem estrategia comum.", "Ha acoes soltas mas nenhuma visao integrada de marketing.", "A marca precisa de um plano completo, do posicionamento a execucao."],
  },
  {
    id: "video",
    nome: "Vídeo",
    cobre: "Live, IA, bastidores, promocional, institucional, depoimentos, eventos.",
    dores: ["A marca nao tem video institucional nem promocional atual.", "Os depoimentos e bastidores existem mas nunca foram filmados.", "O conteudo em video da concorrencia tem mais qualidade percebida."],
  },
  {
    id: "webdesign",
    nome: "Webdesign",
    cobre: "Sites, plataformas digitais, e-commerce.",
    dores: ["O site esta datado ou nao representa o nivel atual do negocio.", "O site nao funciona bem no telemovel.", "A marca ainda nao vende online ou a loja atual trava a compra."],
  },
  {
    id: "app_design",
    nome: "App mobile",
    cobre: "UI/UX para apps nativas iOS + Android.",
    dores: ["O negocio precisa de uma app e nao sabe por onde comecar o design.", "A app atual confunde os utilizadores e gera abandono.", "A experiencia da app nao esta a altura da marca."],
  },
  {
    id: "label",
    nome: "Rótulos",
    cobre: "Packaging para bebidas, alimentos & produtos.",
    dores: ["O produto some na prateleira entre embalagens parecidas.", "O rotulo atual nao conta a historia nem o valor do produto.", "A gama cresceu e as embalagens perderam coerencia de familia."],
  },
  {
    id: "motion_graphic",
    nome: "Motion graphic",
    cobre: "All type, personagens, 3D fake, animação de logotipo.",
    dores: ["A marca so tem pecas estaticas num mercado que consome movimento.", "O logotipo nunca foi animado para video e redes.", "As apresentacoes e anuncios precisam de mais vida visual."],
  },
  {
    id: "photo",
    nome: "Fotografia",
    cobre: "Live, IA, produto, eventos, moda, retrato.",
    dores: ["O site e as redes usam fotos de banco de imagem genericas.", "As fotos de produto nao mostram a qualidade real do que se vende.", "A equipa e o espaco nunca tiveram um retrato profissional."],
  },
  {
    id: "cgi_3d",
    nome: "3D / CGI",
    cobre: "Visualização, modelação, animação 3D.",
    dores: ["O produto ou projeto ainda nao existe fisicamente e precisa de ser mostrado.", "As fotos reais nao conseguem o angulo ou o acabamento pretendido.", "A concorrencia ja apresenta renders 3D e a marca ainda nao."],
  },
  {
    id: "ai_music",
    nome: "Música",
    cobre: "Spot, jingle, trilha sonora, IA ou produção tradicional.",
    dores: ["Os videos da marca usam musica de biblioteca igual a de toda a gente.", "A marca nao tem assinatura sonora nem jingle proprio.", "Os spots precisam de trilha a medida do conceito."],
  },
  {
    id: "editorial",
    nome: "Editorial design",
    cobre: "Revistas, relatórios anuais, livros, catálogos.",
    dores: ["O catalogo ou relatorio anual esta desatualizado ou feito em cima do joelho.", "O material impresso nao esta a altura da marca.", "Ha muito conteudo valioso sem formato editorial para o apresentar."],
  },
  {
    id: "consulting",
    nome: "Consultoria",
    cobre: "Análise de clima, benchmark, SWOT, estudo de concorrência.",
    dores: ["A empresa sente que estagnou mas nao sabe diagnosticar porque.", "Nunca foi feito um estudo serio da concorrencia e do mercado.", "As decisoes de marketing sao tomadas sem analise de base."],
  },
  {
    id: "signage",
    nome: "Sinalética",
    cobre: "Sistemas de sinalização para espaços, eventos, fachadas.",
    dores: ["A fachada nao atrai nem se destaca na rua.", "Os clientes perdem-se dentro do espaco por falta de sinalizacao.", "O espaco fisico nao comunica a identidade da marca."],
  },
  {
    id: "talk_team",
    nome: "Falar com a equipa",
    cobre: "Conversa exploratória sem briefing definido.",
    dores: ["O lead sabe que precisa de ajuda mas ainda nao consegue nomear o servico.", "Ha varias frentes possiveis e falta clareza sobre por onde comecar.", "Prefere conversar com a equipa antes de preencher qualquer formulario."],
  },
];

                                                                                            
                                                          
export function servicesCatalogBlock(): string {
  const linhas = SERVICES_CATALOG.map((s) => `- ${s.nome} (id ${s.id}): ${s.cobre} Dores tipicas: ${s.dores.join(" ")}`);
  return `\n\nSERVICOS DO CATALOGO (a lista REAL do briefing deste site; e a UNICA fonte de servicos que existe). REGRA DURA: so podes citar servicos DESTA lista. Se o lead perguntar por algo fora dela, di-lo honestamente e oferece verificar; nunca inventes um servico, um preco ou um prazo.\n${linhas.join("\n")}\n`;
}
