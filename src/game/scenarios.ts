import type { Resources } from './types';

export type SceneEventAction = 'killRandomPod' | 'killRandomNode';

export interface Phase {
  startMs: number;
  rps: number;
  narrative: string;
}

export interface SceneEvent {
  atMs: number;
  action: SceneEventAction;
}

export type PieceKind = 'pod' | 'deployment';

export interface Scene {
  id: string;
  title: string;
  introNarrative: string;
  objective: string;
  outroSurvived: string;
  outroFailed: string;
  durationMs: number;
  phases: Phase[];
  events: SceneEvent[];
  availablePieces: PieceKind[];
  nodeCapacity: Resources;
  recommendedReplicas: number;
  nextSceneId: string | null;
}

export const scenes: Record<string, Scene> = {
  'cena-1': {
    id: 'cena-1',
    title: 'Primeiro dia no ar',
    introNarrative: 'Hoje você lança seu site. Algumas pessoas começam a achar você.',
    objective: 'Coloque um Pod no Desejado antes da carga começar. 1 réplica basta.',
    outroSurvived: 'Funciona. Você colocou seu primeiro pod no ar — e o cluster fez o resto.',
    outroFailed: 'O site não sobreviveu. Coloque um Pod no Desejado antes de iniciar a cena.',
    durationMs: 30_000,
    phases: [
      { startMs: 0, rps: 0.3, narrative: 'Manhã calma. Primeiros visitantes chegam.' },
      { startMs: 15_000, rps: 0.6, narrative: 'À tarde, mais gente descobriu seu site.' },
    ],
    events: [],
    availablePieces: ['pod'],
    nodeCapacity: { ram: 4, cpu: 2 },
    recommendedReplicas: 1,
    nextSceneId: 'cena-2',
  },
  'cena-2': {
    id: 'cena-2',
    title: 'O bug intermitente',
    introNarrative: 'Reportaram um bug: o pod trava do nada a cada ~15s. Garanta que o site fique no ar mesmo assim.',
    objective: 'Mantenha pelo menos 1 pod vivo em todos os momentos. Sugerido: 2-3 réplicas com algo que recrie pods.',
    outroSurvived: 'O Deployment vigia. Ele garante que sempre haja N pods rodando, sem você fazer nada.',
    outroFailed: 'Site caiu por mais de 5s. Quem vai recriar o pod quando ele morrer? Tente um Deployment.',
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
    recommendedReplicas: 3,
    nextSceneId: null,
  },
};

export const FIRST_SCENE = 'cena-1';
