import {
  type DesiredDeployment,
  type GameState,
  type PodSpec,
  type RealPod,
  type RealNode,
  type Resources,
  podResourceSum,
} from './types';

let podCounter = 0;
const newPodId = () => `pod-${++podCounter}`;

function freeOnNode(node: RealNode, pods: RealPod[]): Resources {
  const used = pods
    .filter((p) => p.nodeId === node.id && p.status === 'running')
    .reduce(
      (acc, p) => {
        const r = podResourceSum(p.spec);
        return { ram: acc.ram + r.ram, cpu: acc.cpu + r.cpu };
      },
      { ram: 0, cpu: 0 }
    );
  return { ram: node.capacity.ram - used.ram, cpu: node.capacity.cpu - used.cpu };
}

function fits(free: Resources, need: Resources): boolean {
  return free.ram >= need.ram && free.cpu >= need.cpu;
}

function scheduleNode(nodes: RealNode[], pods: RealPod[], need: Resources): RealNode | undefined {
  const candidates = nodes.filter((n) => n.status === 'alive' && fits(freeOnNode(n, pods), need));
  if (candidates.length === 0) return undefined;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function newPod(desiredId: string, desiredKind: 'pod' | 'deployment', spec: PodSpec, node: RealNode | undefined): RealPod {
  return {
    id: newPodId(),
    desiredId,
    desiredKind,
    status: node ? 'running' : 'pending',
    nodeId: node ? node.id : null,
    spec,
    hitTimes: [],
  };
}

export function reconcile(state: GameState): GameState {
  const aliveNodeIds = new Set(state.nodes.filter((n) => n.status === 'alive').map((n) => n.id));

  let pods = state.pods
    .filter((p) => p.nodeId === null || aliveNodeIds.has(p.nodeId))
    .map((p) => (p.nodeId && !aliveNodeIds.has(p.nodeId) ? { ...p, status: 'pending' as const, nodeId: null } : p));

  for (const resource of state.desired) {
    if (resource.kind !== 'deployment') continue;
    const deployment = resource as DesiredDeployment;
    const owned = pods.filter((p) => p.desiredKind === 'deployment' && p.desiredId === deployment.id);
    const diff = deployment.replicas - owned.length;
    if (diff > 0) {
      const need = podResourceSum(deployment.template);
      for (let i = 0; i < diff; i++) {
        const node = scheduleNode(state.nodes, pods, need);
        pods = [...pods, newPod(deployment.id, 'deployment', deployment.template, node)];
      }
    } else if (diff < 0) {
      const toKill = -diff;
      const ownedIds = new Set(owned.slice(0, toKill).map((p) => p.id));
      pods = pods.filter((p) => !ownedIds.has(p.id));
    }
  }

  for (const pod of pods) {
    if (pod.status === 'pending') {
      const node = scheduleNode(state.nodes, pods, podResourceSum(pod.spec));
      if (node) {
        pods = pods.map((p) => (p.id === pod.id ? { ...p, status: 'running' as const, nodeId: node.id } : p));
      }
    }
  }

  return { ...state, pods };
}

export function manifestStandalonePod(state: GameState, desiredId: string, spec: PodSpec): GameState {
  const node = scheduleNode(state.nodes, state.pods, podResourceSum(spec));
  return { ...state, pods: [...state.pods, newPod(desiredId, 'pod', spec, node)] };
}
