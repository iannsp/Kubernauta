import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/store';
import { podResourceSum, type RealNode, type RealPod } from '../game/types';
import { POD_CAPACITY } from '../game/traffic';
import { scenes } from '../game/scenarios';
import Particles from './Particles';

function freeOnNode(node: RealNode, pods: RealPod[]) {
  const used = pods
    .filter((p) => p.nodeId === node.id && p.status === 'running')
    .reduce(
      (acc, p) => {
        const r = podResourceSum(p.spec);
        return { ram: acc.ram + r.ram, cpu: acc.cpu + r.cpu };
      },
      { ram: 0, cpu: 0 }
    );
  return {
    ramUsed: used.ram,
    cpuUsed: used.cpu,
    ramTotal: node.capacity.ram,
    cpuTotal: node.capacity.cpu,
  };
}

function PodCircle({ pod, onKill }: { pod: RealPod; onKill: () => void }) {
  const load = Math.min(1, pod.hitTimes.length / POD_CAPACITY);
  return (
    <motion.div
      key={pod.id}
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`real-pod pod-${pod.version}`}
      title={`clique para matar (${pod.version})`}
      onClick={onKill}
    >
      <div className="real-pod-fill" style={{ height: `${load * 100}%` }} />
      <span className="real-pod-emoji">{pod.version === 'v2' ? '🔵' : '🟢'}</span>
    </motion.div>
  );
}

export default function RealSide() {
  const nodes = useGame((s) => s.nodes);
  const pods = useGame((s) => s.pods);
  const killPod = useGame((s) => s.killPod);
  const scenarioId = useGame((s) => s.scenarioId);
  const showReplicaSets = scenes[scenarioId]?.showReplicaSets;

  const pendingPods = pods.filter((p) => p.status === 'pending');

  const replicaSets = showReplicaSets
    ? Array.from(
        pods.reduce((acc, p) => {
          if (p.desiredKind !== 'deployment') return acc;
          const rs = acc.get(p.replicaSetId) ?? { id: p.replicaSetId, version: p.version, count: 0 };
          rs.count += 1;
          acc.set(p.replicaSetId, rs);
          return acc;
        }, new Map<string, { id: string; version: string; count: number }>()).values()
      ).sort((a, b) => a.version.localeCompare(b.version))
    : [];

  return (
    <section className="side real">
      <div className="side-header">
        <h2>Real</h2>
        <p className="subtitle">o que está acontecendo</p>
      </div>
      {showReplicaSets && replicaSets.length > 0 && (
        <div className="replica-set-banner">
          <span className="rs-banner-label">ReplicaSets:</span>
          {replicaSets.map((rs, i) => (
            <span key={rs.id} className={`rs-chip rs-${rs.version}`}>
              ⚙ {rs.id} <span className="mono">×{rs.count}</span>
              {i < replicaSets.length - 1 && <span className="rs-arrow"> → </span>}
            </span>
          ))}
        </div>
      )}
      <div className="real-stage">
        <Particles />
        <div className="cluster">
          {nodes.map((node) => {
            const usage = freeOnNode(node, pods);
            const nodePods = pods.filter((p) => p.nodeId === node.id && p.status === 'running');
            return (
              <div key={node.id} className={`node ${node.status}`}>
                <div className="node-header">
                  <span className="node-label">{node.id}</span>
                  <div className="node-bars">
                    <div className="node-bar">
                      <div className="node-bar-label">RAM</div>
                      <div className="node-bar-track">
                        <div
                          className="node-bar-fill ram"
                          style={{ width: `${(usage.ramUsed / usage.ramTotal) * 100}%` }}
                        />
                      </div>
                      <div className="node-bar-value mono">
                        {usage.ramUsed}/{usage.ramTotal} GB
                      </div>
                    </div>
                    <div className="node-bar">
                      <div className="node-bar-label">CPU</div>
                      <div className="node-bar-track">
                        <div
                          className="node-bar-fill cpu"
                          style={{ width: `${(usage.cpuUsed / usage.cpuTotal) * 100}%` }}
                        />
                      </div>
                      <div className="node-bar-value mono">
                        {usage.cpuUsed}/{usage.cpuTotal}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="node-pods">
                  <AnimatePresence>
                    {nodePods.map((p) => (
                      <PodCircle key={p.id} pod={p} onKill={() => killPod(p.id)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {pendingPods.length > 0 && (
        <div className="pending-tray">
          <span className="pending-label">⏳ Pending ({pendingPods.length}) — sem capacidade no cluster</span>
          <div className="pending-pods">
            {pendingPods.map((p) => (
              <div key={p.id} className="pending-pod" title="pod aguardando capacidade">
                🟡
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
