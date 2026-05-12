import type { GameState } from './types';
import type { Scene } from './scenarios';

export const POD_CAPACITY = 5;
const MAX_REQ_PER_TICK = 20;
const PARTICLE_TTL_MS = 800;

function currentRps(scene: Scene, elapsedMs: number): number {
  let rps = 0;
  for (const phase of scene.phases) {
    if (elapsedMs >= phase.startMs) rps = phase.rps;
  }
  return rps;
}

let particleCounter = 0;
const newParticleId = () => `p-${++particleCounter}`;

export function processTraffic(state: GameState, scene: Scene, now: number): GameState {
  if (state.sceneStatus !== 'running' || state.sceneStartedAt === null) return state;
  const elapsedMs = now - state.sceneStartedAt;
  const rps = currentRps(scene, elapsedMs);

  let pods = state.pods.map((p) => ({ ...p, hitTimes: p.hitTimes.filter((t) => now - t < 1000) }));
  let particles = state.particles.filter((p) => now - p.bornAt < PARTICLE_TTL_MS);
  let metrics = { ...state.metrics };
  let nextAt = state.nextRequestAt;
  let stickyId = state.stickyTargetPodId;

  const hasService = state.desired.some((r) => r.kind === 'service');

  if (rps > 0) {
    const intervalMs = 1000 / rps;
    let generated = 0;
    while (nextAt <= now && generated < MAX_REQ_PER_TICK) {
      generated++;
      const aliveNodeIds = new Set(state.nodes.filter((n) => n.status === 'alive').map((n) => n.id));
      const runningPods = pods.filter(
        (p) => p.status === 'running' && p.nodeId && aliveNodeIds.has(p.nodeId)
      );

      let target = undefined as typeof runningPods[number] | undefined;

      if (hasService) {
        if (runningPods.length > 0) {
          target = runningPods[Math.floor(Math.random() * runningPods.length)];
        }
      } else {
        if (stickyId === null && runningPods.length > 0) {
          stickyId = runningPods[Math.floor(Math.random() * runningPods.length)].id;
        }
        if (stickyId !== null) {
          target = runningPods.find((p) => p.id === stickyId);
        }
      }

      if (!target) {
        metrics.totalReqs++;
        metrics.failedReqs++;
        particles = [
          ...particles,
          { id: newParticleId(), status: 'failed', targetPodId: null, bornAt: nextAt },
        ];
      } else if (target.hitTimes.length >= POD_CAPACITY) {
        metrics.totalReqs++;
        metrics.failedReqs++;
        particles = [
          ...particles,
          { id: newParticleId(), status: 'failed', targetPodId: target.id, bornAt: nextAt },
        ];
      } else {
        metrics.totalReqs++;
        metrics.successReqs++;
        pods = pods.map((p) =>
          p.id === target!.id ? { ...p, hitTimes: [...p.hitTimes, nextAt] } : p
        );
        particles = [
          ...particles,
          { id: newParticleId(), status: 'success', targetPodId: target.id, bornAt: nextAt },
        ];
      }
      nextAt += intervalMs;
    }
  } else {
    nextAt = now;
  }

  return { ...state, pods, particles, nextRequestAt: nextAt, metrics, stickyTargetPodId: stickyId };
}
