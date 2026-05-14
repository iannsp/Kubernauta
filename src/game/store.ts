import { create } from 'zustand';
import type { ContainerSpec, DesiredResource, GameState, PodSpec } from './types';
import { manifestStandalonePod, reconcile } from './reconciler';
import { scenes, FIRST_SCENE, type Scene } from './scenarios';
import { processTraffic } from './traffic';

let resourceCounter = 0;
const newResourceId = (prefix: string) => `${prefix}-${++resourceCounter}`;

const GRACE_DOWN_MS = 5000;
const RECONCILE_INTERVAL_MS = 1000;
const COUNTDOWN_MS = 5000;

let lastReconcileAt = 0;

interface Actions {
  addStandalonePod: (containers: ContainerSpec[]) => void;
  addDeployment: (replicas: number, template: PodSpec, label?: string) => void;
  addService: (selector?: string) => void;
  triggerUpgrade: (deploymentId: string) => void;
  removeDesired: (id: string) => void;
  setReplicas: (deploymentId: string, replicas: number) => void;
  killPod: (podId: string) => void;
  killRandomPod: () => void;
  toggleNode: (nodeId: string) => void;
  togglePause: () => void;
  tick: () => void;

  startScene: () => void;
  retryScene: () => void;
  advanceScene: () => void;
  selectScene: (scenarioId: string) => void;

  nextTutorialStep: () => void;
  skipTutorial: () => void;
  restartTutorial: () => void;
}

export const TUTORIAL_TOTAL_STEPS = 6;

function freshState(scenarioId: string): GameState {
  const cap = scenes[scenarioId].nodeCapacity;
  return {
    desired: [],
    pods: [],
    nodes: [
      { id: 'N1', status: 'alive', capacity: { ...cap } },
      { id: 'N2', status: 'alive', capacity: { ...cap } },
      { id: 'N3', status: 'alive', capacity: { ...cap } },
    ],
    paused: false,
    scenarioId,
    sceneStatus: 'intro',
    sceneStartedAt: null,
    countdownStartedAt: null,
    consecutiveDownSince: null,
    particles: [],
    nextRequestAt: 0,
    metrics: { totalReqs: 0, successReqs: 0, failedReqs: 0 },
    recentReqs: [],
    consecutiveLowUptimeSince: null,
    narrativeLog: [],
    lastPhaseLogged: -1,
    firedEvents: [],
    tutorialStep: 0,
    standalonePodsDeclared: 0,
    stickyTargetPodId: null,
    upgradeOffered: false,
  };
}

export const useGame = create<GameState & Actions>((set, get) => ({
  ...freshState(FIRST_SCENE),

  addStandalonePod: (containers) => {
    const id = newResourceId('pod');
    const spec: PodSpec = { containers };
    const resource: DesiredResource = { id, kind: 'pod', spec };
    set((s) => {
      const next = manifestStandalonePod({ ...s, desired: [...s.desired, resource] }, id, spec);
      return { ...next, standalonePodsDeclared: next.standalonePodsDeclared + 1 };
    });
  },

  addDeployment: (replicas, template, label = 'app:web') => {
    const id = newResourceId('deploy');
    const resource: DesiredResource = { id, kind: 'deployment', replicas, template, version: 'v1', label };
    set((s) => ({ ...s, desired: [...s.desired, resource] }));
  },

  triggerUpgrade: (deploymentId: string) => {
    set((s) => ({
      ...s,
      desired: s.desired.map((r) =>
        r.id === deploymentId && r.kind === 'deployment' ? { ...r, version: 'v2' } : r
      ),
    }));
  },

  addService: (selector = 'app:web') => {
    set((s) => {
      if (s.desired.some((r) => r.kind === 'service')) return s;
      const id = newResourceId('svc');
      const resource: DesiredResource = { id, kind: 'service', selector };
      return { ...s, desired: [...s.desired, resource] };
    });
  },

  removeDesired: (id) => set((s) => {
    const remainingPods = s.pods.filter((p) => p.desiredId !== id);
    const stickyStillValid =
      s.stickyTargetPodId !== null && remainingPods.some((p) => p.id === s.stickyTargetPodId);
    return {
      ...s,
      desired: s.desired.filter((r) => r.id !== id),
      pods: remainingPods,
      stickyTargetPodId: stickyStillValid ? s.stickyTargetPodId : null,
    };
  }),

  setReplicas: (deploymentId, replicas) => set((s) => ({
    ...s,
    desired: s.desired.map((r) =>
      r.id === deploymentId && r.kind === 'deployment'
        ? { ...r, replicas: Math.max(0, Math.min(9, replicas)) }
        : r
    ),
  })),

  killPod: (podId) => set((s) => ({ ...s, pods: s.pods.filter((p) => p.id !== podId) })),

  killRandomPod: () => {
    const pods = get().pods;
    if (pods.length === 0) return;
    const victim = pods[Math.floor(Math.random() * pods.length)];
    get().killPod(victim.id);
  },

  toggleNode: (nodeId) => set((s) => ({
    ...s,
    nodes: s.nodes.map((n) =>
      n.id === nodeId ? { ...n, status: n.status === 'alive' ? 'down' : 'alive' } : n
    ),
  })),

  togglePause: () => set((s) => ({ ...s, paused: !s.paused })),

  tick: () => {
    const s = get();
    if (s.paused) return;
    const now = Date.now();

    let next: GameState = s;
    const scene: Scene | undefined = scenes[next.scenarioId];

    if (now - lastReconcileAt >= RECONCILE_INTERVAL_MS) {
      next = reconcile(next);
      lastReconcileAt = now;
    }

    if (next.sceneStatus === 'countdown' && next.countdownStartedAt !== null) {
      if (now - next.countdownStartedAt >= COUNTDOWN_MS) {
        next = {
          ...next,
          sceneStatus: 'running',
          sceneStartedAt: now,
          countdownStartedAt: null,
          nextRequestAt: now,
        };
      }
    }

    if (scene && next.sceneStatus === 'running' && next.sceneStartedAt !== null) {
      const elapsed = now - next.sceneStartedAt;

      let lastLogged = next.lastPhaseLogged;
      const newLogs: string[] = [];
      for (let i = lastLogged + 1; i < scene.phases.length; i++) {
        if (elapsed >= scene.phases[i].startMs) {
          newLogs.push(scene.phases[i].narrative);
          lastLogged = i;
        }
      }
      if (newLogs.length > 0) {
        next = { ...next, narrativeLog: [...next.narrativeLog, ...newLogs], lastPhaseLogged: lastLogged };
      }

      let fired = next.firedEvents;
      for (let i = 0; i < scene.events.length; i++) {
        if (fired.includes(i)) continue;
        const ev = scene.events[i];
        if (elapsed >= ev.atMs) {
          if (ev.action === 'killRandomPod' && next.pods.length > 0) {
            const idx = Math.floor(Math.random() * next.pods.length);
            const victim = next.pods[idx];
            next = { ...next, pods: next.pods.filter((p) => p.id !== victim.id) };
          } else if (ev.action === 'killStickyPod' && next.pods.length > 0) {
            let victim = next.stickyTargetPodId
              ? next.pods.find((p) => p.id === next.stickyTargetPodId)
              : undefined;
            if (!victim) {
              victim = next.pods[Math.floor(Math.random() * next.pods.length)];
            }
            next = { ...next, pods: next.pods.filter((p) => p.id !== victim!.id) };
          } else if (ev.action === 'killRandomNode') {
            const alive = next.nodes.filter((n) => n.status === 'alive');
            if (alive.length > 0) {
              const victim = alive[Math.floor(Math.random() * alive.length)];
              next = {
                ...next,
                nodes: next.nodes.map((n) =>
                  n.id === victim.id ? { ...n, status: 'down' } : n
                ),
              };
            }
          } else if (ev.action === 'narrate' && ev.text) {
            next = { ...next, narrativeLog: [...next.narrativeLog, ev.text] };
          } else if (ev.action === 'offerUpgrade') {
            next = { ...next, upgradeOffered: true };
          }
          fired = [...fired, i];
        }
      }
      if (fired !== next.firedEvents) next = { ...next, firedEvents: fired };

      next = processTraffic(next, scene, now);

      const aliveNodeIds = new Set(next.nodes.filter((n) => n.status === 'alive').map((n) => n.id));
      const alivePods = next.pods.filter((p) => p.nodeId !== null && aliveNodeIds.has(p.nodeId));
      const warmupOver = elapsed > 1000;
      if (alivePods.length === 0 && warmupOver) {
        if (next.consecutiveDownSince === null) {
          next = { ...next, consecutiveDownSince: now };
        } else if (now - next.consecutiveDownSince >= GRACE_DOWN_MS) {
          next = { ...next, sceneStatus: 'failed' };
        }
      } else if (next.consecutiveDownSince !== null) {
        next = { ...next, consecutiveDownSince: null };
      }

      const recent = next.recentReqs ?? [];
      if (scene.failBelowUptime !== undefined && warmupOver && recent.length >= 5) {
        const okCount = recent.filter((r) => r.ok).length;
        const recentUptime = (okCount / recent.length) * 100;
        if (recentUptime < scene.failBelowUptime) {
          if (next.consecutiveLowUptimeSince === null) {
            next = { ...next, consecutiveLowUptimeSince: now };
          } else if (now - next.consecutiveLowUptimeSince >= GRACE_DOWN_MS) {
            next = { ...next, sceneStatus: 'failed' };
          }
        } else if (next.consecutiveLowUptimeSince !== null) {
          next = { ...next, consecutiveLowUptimeSince: null };
        }
      }

      if (next.sceneStatus === 'running' && elapsed >= scene.durationMs) {
        next = { ...next, sceneStatus: 'survived' };
      }
    }

    set(next);
  },

  startScene: () => {
    set((s) => ({
      ...s,
      sceneStatus: 'countdown',
      sceneStartedAt: null,
      countdownStartedAt: Date.now(),
      nextRequestAt: Date.now(),
      consecutiveDownSince: null,
      consecutiveLowUptimeSince: null,
      metrics: { totalReqs: 0, successReqs: 0, failedReqs: 0 },
      recentReqs: [],
      particles: [],
      narrativeLog: [scenes[s.scenarioId].introNarrative],
      lastPhaseLogged: -1,
      firedEvents: [],
    }));
    lastReconcileAt = Date.now();
  },

  retryScene: () => {
    set((s) => ({ ...freshState(s.scenarioId), tutorialStep: s.tutorialStep }));
    lastReconcileAt = 0;
  },

  advanceScene: () => {
    set((s) => {
      const current = scenes[s.scenarioId];
      const nextId = current.nextSceneId;
      if (!nextId) return s;
      return { ...freshState(nextId), tutorialStep: s.tutorialStep };
    });
    lastReconcileAt = 0;
  },

  selectScene: (scenarioId: string) => {
    if (!scenes[scenarioId]) return;
    set((s) => ({ ...freshState(scenarioId), tutorialStep: s.tutorialStep }));
    lastReconcileAt = 0;
  },

  nextTutorialStep: () =>
    set((s) => {
      if (s.tutorialStep === null) return s;
      const next = s.tutorialStep + 1;
      return { ...s, tutorialStep: next >= TUTORIAL_TOTAL_STEPS ? null : next };
    }),

  skipTutorial: () => set((s) => ({ ...s, tutorialStep: null })),

  restartTutorial: () => set((s) => ({ ...s, tutorialStep: 0 })),
}));
