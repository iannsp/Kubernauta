import type { Resources } from './types';

export type SceneEventAction = 'killRandomPod' | 'killStickyPod' | 'killRandomNode' | 'narrate' | 'offerUpgrade';

export interface Phase {
  startMs: number;
  rps: number;
  narrative: string;
}

export interface SceneEvent {
  atMs: number;
  action: SceneEventAction;
  text?: string;
}

export type PieceKind = 'pod' | 'deployment' | 'service';

export interface Scene {
  id: string;
  title: string;
  introNarrative: string;
  objective: string;
  loadDescription: string;
  chaosDescription: string;
  outroSurvived: string;
  outroFailed: string;
  durationMs: number;
  phases: Phase[];
  events: SceneEvent[];
  availablePieces: PieceKind[];
  nodeCapacity: Resources;
  nextSceneId: string | null;
  showReplicaSets?: boolean;
  showLabels?: boolean;
  serviceVariants?: string[];
}

export const scenes: Record<string, Scene> = {
  'cena-1': {
    id: 'cena-1',
    title: 'Primeiro dia no ar',
    introNarrative:
      'Hoje você lança seu site. Algumas pessoas começam a achar você.',
    objective:
      'Coloque um Pod no Desejado antes da carga começar. O cluster faz o resto.',
    loadDescription: 'Tráfego cresce de 0.3 a 0.6 req/s ao longo da cena',
    chaosDescription: 'Nenhum imprevisto — dia tranquilo',
    outroSurvived:
      'Funciona. Você não pediu "crie um pod"; disse "isso deve existir", e o cluster materializou. Isso é o modelo declarativo — em condições calmas. As próximas cenas vão testar o que acontece quando as condições mudam.',
    outroFailed:
      'O site não sobreviveu. Você não declarou nada — K8s não age sozinho. Arraste um Pod e tente de novo.',
    durationMs: 30_000,
    phases: [
      { startMs: 0, rps: 0.3, narrative: 'Manhã calma. Primeiros visitantes chegam.' },
      { startMs: 15_000, rps: 0.6, narrative: 'À tarde, mais gente descobriu seu site.' },
    ],
    events: [],
    availablePieces: ['pod'],
    nodeCapacity: { ram: 4, cpu: 2 },
    nextSceneId: 'cena-2',
  },
  'cena-2': {
    id: 'cena-2',
    title: 'O plantonista',
    introNarrative:
      'É sua primeira vigília no servidor. Você é o único responsável por manter o site no ar. Mas pods são mortais — e ninguém recria por você.',
    objective:
      'Mantenha pelo menos 1 pod vivo. Sempre que um morrer, você precisa declarar de novo. E de novo. E de novo.',
    loadDescription: 'Tráfego constante de 1 req/s',
    chaosDescription: '7 pods morrem ao longo da cena, ~8s entre cada',
    outroSurvived:
      'Você sobreviveu — porque foi o controller humano. Cada pod morto, você ressuscitou na mão. Em K8s real, isso não escala: ninguém pode ficar 24/7 dropando pods. A próxima cena introduz a peça que faz esse trabalho por você, pra sempre.',
    outroFailed:
      'Você piscou. O pod morreu e você não chegou a tempo. Esse é o ponto: pod solto exige plantão humano sem pausa. Não dá pra escalar. A próxima cena traz a peça que resolve isso.',
    durationMs: 60_000,
    phases: [
      { startMs: 0, rps: 1, narrative: 'Você está de plantão. Coloque um Pod pra começar.' },
    ],
    events: [
      { atMs: 10_000, action: 'killRandomPod' },
      { atMs: 11_000, action: 'narrate', text: '💀 Pod morreu. Ninguém recria — você é o guardião.' },
      { atMs: 18_000, action: 'killRandomPod' },
      { atMs: 19_000, action: 'narrate', text: '💀 Foi mais um. Continue.' },
      { atMs: 26_000, action: 'killRandomPod' },
      { atMs: 27_000, action: 'narrate', text: 'Olha, isso aqui não tem hora pra parar.' },
      { atMs: 34_000, action: 'killRandomPod' },
      { atMs: 35_000, action: 'narrate', text: 'Você está fazendo o trabalho do controlador. Na mão.' },
      { atMs: 42_000, action: 'killRandomPod' },
      { atMs: 50_000, action: 'killRandomPod' },
      { atMs: 51_000, action: 'narrate', text: 'Quase lá. Resista mais um pouco.' },
      { atMs: 58_000, action: 'killRandomPod' },
    ],
    availablePieces: ['pod'],
    nodeCapacity: { ram: 4, cpu: 2 },
    nextSceneId: 'cena-3',
  },
  'cena-3': {
    id: 'cena-3',
    title: 'O bug intermitente',
    introNarrative:
      'Mesmo problema da cena anterior — pods morrem do nada. Mas dessa vez você tem uma peça nova disponível: 📋 Deployment. Tente.',
    objective:
      'Mantenha o site no ar mesmo com pods morrendo. Use a peça nova: ela declara "sempre quero N pods" e recria sozinha.',
    loadDescription: 'Tráfego constante de 1 req/s',
    chaosDescription: '3 pods morrem ao longo da cena, ~15s entre cada',
    outroSurvived:
      'Você descobriu o Deployment — a peça que faz o trabalho de plantonista por você. Você declara "sempre quero N pods", e ele recria automaticamente. Você não precisa estar acordado. Isso é o controller — a alma do K8s declarativo.',
    outroFailed:
      'Site caiu por mais de 5s. Tente o Deployment: ele declara N réplicas e mantém esse número, recriando pods conforme morrem.',
    durationMs: 60_000,
    phases: [
      { startMs: 0, rps: 1, narrative: 'Tráfego constante. Tudo parece bem...' },
      { startMs: 15_000, rps: 1, narrative: 'Algo travou.' },
      { startMs: 30_000, rps: 1, narrative: 'Travou de novo.' },
      { startMs: 45_000, rps: 1, narrative: 'Mais um.' },
    ],
    events: [
      { atMs: 22_000, action: 'killRandomPod' },
      { atMs: 38_000, action: 'killRandomPod' },
      { atMs: 52_000, action: 'killRandomPod' },
    ],
    availablePieces: ['pod', 'deployment'],
    nodeCapacity: { ram: 4, cpu: 2 },
    nextSceneId: 'cena-4',
  },
  'cena-4': {
    id: 'cena-4',
    title: 'O endereço que muda',
    introNarrative:
      'Você sabe declarar pods e fazê-los renascer. Mas tem um problema invisível: cada pod novo nasce com IP novo. Quem aponta pra IP velho, encontra silêncio. Hoje você vai sentir isso — e descobrir a peça que resolve.',
    objective:
      'Mantenha o site no ar. Combine Deployment (pra recriar pods) com a peça nova — 🧲 Service — pra que o tráfego sempre ache os pods atuais, não os antigos.',
    loadDescription: 'Tráfego constante de 1.5 req/s',
    chaosDescription: '4 pods morrem ao longo da cena, ~12s entre cada',
    outroSurvived:
      'Você descobriu o Service. Sem ele, cada pod recriado é um endereço novo que ninguém conhece — tráfego cai mesmo com pods vivos. O Service é a recepção fixa do prédio: você liga pra recepção, ela acha quem está de plantão hoje. Em K8s real, isso é label selector — Service casa pods por etiqueta, não por IP.',
    outroFailed:
      'Site caiu. Pode ser que você tenha Deployment mas não Service: pods renascem, mas o tráfego ainda mira no endereço antigo e bate em parede. Service resolve isso — é o endereço estável na frente do gado.',
    durationMs: 60_000,
    phases: [
      { startMs: 0, rps: 1.5, narrative: 'Tráfego entrando. Você precisa de pods e de um endereço estável.' },
      { startMs: 30_000, rps: 1.5, narrative: 'Continua entrando. Service segura a onda mesmo com pods trocando.' },
    ],
    events: [
      { atMs: 10_000, action: 'killStickyPod' },
      { atMs: 11_000, action: 'narrate', text: '💀 Pod morreu. Quem fala com ele agora?' },
      { atMs: 22_000, action: 'killStickyPod' },
      { atMs: 23_000, action: 'narrate', text: '💀 De novo. IP novo nasceu — quem sabia do velho?' },
      { atMs: 36_000, action: 'killStickyPod' },
      { atMs: 37_000, action: 'narrate', text: '🧲 Service não se importa: roteia pro pod do momento.' },
      { atMs: 50_000, action: 'killStickyPod' },
    ],
    availablePieces: ['pod', 'deployment', 'service'],
    nodeCapacity: { ram: 4, cpu: 2 },
    nextSceneId: 'cena-5',
  },
  'cena-5': {
    id: 'cena-5',
    title: 'Datacenter pegou fogo',
    introNarrative:
      'Notícia ruim: um rack inteiro do datacenter foi pro chão. Nodes inteiros vão sumir. Pods que estavam neles, somem juntos. Você descobre agora se declarou o suficiente — e se o cluster tem fôlego pros pods migrarem.',
    objective:
      'Use Deployment pra recriar pods perdidos, Service pra rotear pros pods novos, e pense em capacity: cada node aguenta poucos pods.',
    loadDescription: 'Tráfego constante de 2 req/s',
    chaosDescription: '1 node cai aos 20s, outro aos 40s. No final, sobra 1 node de pé.',
    outroSurvived:
      'Sobreviveu. Quando o node caiu, os pods dele evaporaram — mas o Deployment notou o gap e recriou em nodes vivos. Service apontou pros pods novos automaticamente. Em K8s real: pod não é amarrado ao node; node não é amarrado ao pod. Desacoplamento é resiliência.',
    outroFailed:
      'Caiu junto com o node. Pods soltos somem com o prédio; só Deployment recria. E mesmo Deployment falha se o tráfego ainda mira no IP antigo — sem Service, recriar não é o bastante. Resiliência exige declarar a peça inteira: Deployment + Service + capacity sobrando.',
    durationMs: 60_000,
    phases: [
      { startMs: 0, rps: 2, narrative: 'Cluster operando normal. 3 nodes, todos vivos.' },
      { startMs: 20_000, rps: 2, narrative: '🔥 Alarme no datacenter.' },
      { startMs: 40_000, rps: 2, narrative: '🔥 Outro rack foi.' },
    ],
    events: [
      { atMs: 20_000, action: 'killRandomNode' },
      { atMs: 21_000, action: 'narrate', text: '⚡ Node caiu. Os pods dele sumiram. Quem recria?' },
      { atMs: 40_000, action: 'killRandomNode' },
      { atMs: 41_000, action: 'narrate', text: '⚡ Outro foi. Só sobrou 1 node de pé.' },
    ],
    availablePieces: ['pod', 'deployment', 'service'],
    nodeCapacity: { ram: 1, cpu: 0.5 },
    nextSceneId: 'cena-6',
  },
  'cena-6': {
    id: 'cena-6',
    title: 'Versão nova, sem queda',
    introNarrative:
      'Seu site precisa atualizar pra nginx v2. Em servidor antigo isso era: derruba tudo, sobe novo, reza. Aqui não. K8s tem um truque: dois ReplicaSets convivem por alguns segundos — um descendo, outro subindo. Você nunca fica sem ninguém atendendo.',
    objective:
      'Suba Deployment + Service rodando v1. Quando aparecer o botão 🚀 no card do Deployment, clique. O Deployment vai orquestrar a transição sem queda.',
    loadDescription: 'Tráfego constante de 1.5 req/s',
    chaosDescription: 'Aos 20s chega a ordem de upgrade. Sem queda permitida durante a transição.',
    outroSurvived:
      'Você fez um rolling update. Por baixo do Deployment, dois ReplicaSets coexistiram: o velho (v1) escalou pra baixo enquanto o novo (v2) escalou pra cima. Em momento nenhum a soma de pods saudáveis bateu zero. Service apontou pra ambos durante a transição. Isso é deploy sem downtime — o pão com manteiga do K8s.',
    outroFailed:
      'Caiu durante o upgrade. Provável causa: faltou Deployment com réplicas (sem controller, nada se reorganiza), faltou Service (tráfego ficou preso no IP velho), ou faltou capacity pros dois ReplicaSets coexistirem por alguns segundos.',
    durationMs: 60_000,
    phases: [
      { startMs: 0, rps: 1.5, narrative: 'Site v1 rodando. Suba o Deployment e o Service.' },
      { startMs: 20_000, rps: 1.5, narrative: '📨 Ordem chegou: subir v2. Botão 🚀 liberado no Deployment.' },
      { startMs: 45_000, rps: 1.5, narrative: 'Transição em curso ou concluída. Aguente a onda.' },
    ],
    events: [
      { atMs: 20_000, action: 'offerUpgrade' },
      { atMs: 20_500, action: 'narrate', text: '📨 Versão nova disponível. Clique 🚀 no card do Deployment.' },
    ],
    availablePieces: ['pod', 'deployment', 'service'],
    nodeCapacity: { ram: 4, cpu: 2 },
    nextSceneId: 'cena-7',
    showReplicaSets: true,
  },
  'cena-7': {
    id: 'cena-7',
    title: 'A etiqueta que casa',
    introNarrative:
      'Você já usou Deployment e Service. Hoje você descobre o que faz um achar o outro. Olhe as peças com atenção — repare nas etiquetas.',
    objective:
      'Mantenha o site no ar. Use Deployment + Service. Repare em qual peça gera pods com etiqueta — Service só atende esses.',
    loadDescription: 'Tráfego constante de 1.5 req/s',
    chaosDescription: 'Sem imprevistos — descubra a etiqueta',
    outroSurvived:
      'Você descobriu a cola. Service e Deployment não se conhecem — nunca se referenciam. A etiqueta é o que faz o Service achar pods do Deployment, e ela só existe nos pods que vieram de um template. Pod solto é anônimo. Em K8s real, isso é label selector — texto arbitrário que você escolhe; aqui é fixo pra simplificar.',
    outroFailed:
      'Tráfego caiu. Provável: você tinha pod solto + Service. Pod solto não carrega etiqueta, então o Service o ignora — mesmo vivo, é invisível pra rede de roteamento. Use Deployment (que carimba etiqueta nos pods) e o Service vai achá-los.',
    durationMs: 60_000,
    phases: [
      { startMs: 0, rps: 1.5, narrative: 'Tráfego começou. Repare nas etiquetas das peças.' },
      { startMs: 30_000, rps: 1.5, narrative: 'Service só roteia pra quem tem etiqueta.' },
    ],
    events: [],
    availablePieces: ['pod', 'deployment', 'service'],
    nodeCapacity: { ram: 4, cpu: 2 },
    nextSceneId: 'cena-8',
    showLabels: true,
  },
  'cena-8': {
    id: 'cena-8',
    title: 'A etiqueta certa',
    introNarrative:
      'Em K8s, etiqueta é texto livre — você pode declarar app:loja, app:db, qualquer nome. Seu Deployment vem marcado como app:web. Olhe os Services disponíveis e escolha o que casa.',
    objective:
      'Mantenha o site no ar. Declare Deployment + Service. Existem duas variantes de Service na palette — só uma tem o selector certo.',
    loadDescription: 'Tráfego constante de 1.5 req/s',
    chaosDescription: 'Sem imprevistos — Service errado não enxerga seus pods',
    outroSurvived:
      'Você casou a etiqueta. Em K8s real, etiqueta é texto que VOCÊ escolhe — app:loja, tier:frontend, env:prod. O Service procura o que o selector dele especifica. Service e Deployment não se referenciam: a cola é só o texto da etiqueta combinar. Se mudar o texto de um lado, tem que mudar do outro.',
    outroFailed:
      'Tráfego caiu. Provável: você puxou o Service errado — selector dele não casa com a etiqueta do Deployment. Em K8s real, se o selector do Service for app:db mas seus pods são app:web, o Service literalmente não enxerga seus pods. Texto idêntico ou nada.',
    durationMs: 60_000,
    phases: [
      { startMs: 0, rps: 1.5, narrative: 'Tráfego entrando. Qual Service casa com app:web?' },
      { startMs: 30_000, rps: 1.5, narrative: 'Service errado é como ligar pro telefone errado: ninguém atende.' },
    ],
    events: [],
    availablePieces: ['pod', 'deployment', 'service'],
    nodeCapacity: { ram: 4, cpu: 2 },
    nextSceneId: null,
    showLabels: true,
    serviceVariants: ['app:web', 'app:db'],
  },
};

export const FIRST_SCENE = 'cena-1';

export interface Level {
  id: string;
  name: string;
  scenes: string[];
}

export const LEVELS: Level[] = [
  {
    id: 'tutorial',
    name: 'Tutorial',
    scenes: ['cena-1', 'cena-2', 'cena-3', 'cena-4', 'cena-5', 'cena-6', 'cena-7', 'cena-8'],
  },
];
