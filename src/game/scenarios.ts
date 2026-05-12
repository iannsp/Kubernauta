import type { Resources } from './types';

export type SceneEventAction = 'killRandomPod' | 'killStickyPod' | 'killRandomNode' | 'narrate';

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
    nextSceneId: null,
  },
};

export const FIRST_SCENE = 'cena-1';
