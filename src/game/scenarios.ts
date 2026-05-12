import type { Resources } from './types';

export type SceneEventAction = 'killRandomPod' | 'killRandomNode' | 'narrate';

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

export type PieceKind = 'pod' | 'deployment';

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
    nextSceneId: null,
  },
};

export const FIRST_SCENE = 'cena-1';
