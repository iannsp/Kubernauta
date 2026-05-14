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

export type AppVersion = 'v1' | 'v2';

export interface DesiredDeployment {
  id: string;
  kind: 'deployment';
  replicas: number;
  template: PodSpec;
  version: AppVersion;
  label: string;
}

export interface DesiredService {
  id: string;
  kind: 'service';
  selector: string;
}

export type DesiredResource = DesiredPod | DesiredDeployment | DesiredService;

export type PodStatus = 'running' | 'pending';

export interface RealPod {
  id: string;
  desiredId: string;
  desiredKind: 'pod' | 'deployment';
  status: PodStatus;
  nodeId: string | null;
  spec: PodSpec;
  hitTimes: number[];
  version: AppVersion;
  replicaSetId: string;
  label: string | null;
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

export interface RecentReq {
  at: number;
  ok: boolean;
}

export type SceneStatus = 'intro' | 'countdown' | 'running' | 'survived' | 'failed';

export interface GameState {
  desired: DesiredResource[];
  pods: RealPod[];
  nodes: RealNode[];
  paused: boolean;
  scenarioId: string;
  sceneStatus: SceneStatus;
  sceneStartedAt: number | null;
  countdownStartedAt: number | null;
  consecutiveDownSince: number | null;
  particles: Particle[];
  nextRequestAt: number;
  metrics: Metrics;
  recentReqs: RecentReq[];
  consecutiveLowUptimeSince: number | null;
  narrativeLog: string[];
  lastPhaseLogged: number;
  firedEvents: number[];
  tutorialStep: number | null;
  standalonePodsDeclared: number;
  stickyTargetPodId: string | null;
  upgradeOffered: boolean;
}

export const NGINX_RESOURCES: Resources = { ram: 0.5, cpu: 0.25 };

export const podResourceSum = (spec: PodSpec): Resources =>
  spec.containers.reduce(
    (acc, c) => ({ ram: acc.ram + c.resources.ram, cpu: acc.cpu + c.resources.cpu }),
    { ram: 0, cpu: 0 }
  );
