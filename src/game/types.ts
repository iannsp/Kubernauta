export type ContainerImage = 'nginx';

export interface Resources {
  ram: number;
  cpu: number;
}

export interface ContainerSpec {
  image: ContainerImage;
  resources: Resources;
}

export interface PodSpec {
  containers: ContainerSpec[];
}

export interface DesiredPod {
  id: string;
  kind: 'pod';
  spec: PodSpec;
}

export interface DesiredDeployment {
  id: string;
  kind: 'deployment';
  replicas: number;
  template: PodSpec;
}

export type DesiredResource = DesiredPod | DesiredDeployment;

export type PodStatus = 'running' | 'pending';

export interface RealPod {
  id: string;
  desiredId: string;
  desiredKind: 'pod' | 'deployment';
  status: PodStatus;
  nodeId: string | null;
  spec: PodSpec;
  hitTimes: number[];
}

export interface RealNode {
  id: string;
  status: 'alive' | 'down';
  capacity: Resources;
}

export interface Particle {
  id: string;
  status: 'success' | 'failed';
  targetPodId: string | null;
  bornAt: number;
}

export interface Metrics {
  totalReqs: number;
  successReqs: number;
  failedReqs: number;
}

export type SceneStatus = 'intro' | 'running' | 'survived' | 'failed';

export interface GameState {
  desired: DesiredResource[];
  pods: RealPod[];
  nodes: RealNode[];
  paused: boolean;
  scenarioId: string;
  sceneStatus: SceneStatus;
  sceneStartedAt: number | null;
  consecutiveDownSince: number | null;
  particles: Particle[];
  nextRequestAt: number;
  metrics: Metrics;
  narrativeLog: string[];
  lastPhaseLogged: number;
  firedEvents: number[];
  tutorialStep: number | null;
}

export const NGINX_RESOURCES: Resources = { ram: 0.5, cpu: 0.25 };

export const podResourceSum = (spec: PodSpec): Resources =>
  spec.containers.reduce(
    (acc, c) => ({ ram: acc.ram + c.resources.ram, cpu: acc.cpu + c.resources.cpu }),
    { ram: 0, cpu: 0 }
  );
