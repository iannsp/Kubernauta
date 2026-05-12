import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/store';

function nodeColumnPercent(nodeIdx: number, totalNodes: number): number {
  return ((nodeIdx + 0.5) / totalNodes) * 100;
}

export default function Particles() {
  const particles = useGame((s) => s.particles);
  const pods = useGame((s) => s.pods);
  const nodes = useGame((s) => s.nodes);

  return (
    <div className="particles">
      <div className="particles-entry" aria-hidden="true">
        👥
      </div>
      <AnimatePresence>
        {particles.map((p) => {
          let targetLeft = 50;
          let hasTarget = false;
          if (p.targetPodId) {
            const pod = pods.find((x) => x.id === p.targetPodId);
            if (pod?.nodeId) {
              const nodeIdx = nodes.findIndex((n) => n.id === pod.nodeId);
              if (nodeIdx >= 0) {
                targetLeft = nodeColumnPercent(nodeIdx, nodes.length);
                hasTarget = true;
              }
            }
          }
          const isFailed = p.status === 'failed';
          const endTop = isFailed && !hasTarget ? 190 : 100;
          return (
            <motion.div
              key={p.id}
              className={`particle ${p.status}`}
              initial={{ left: '50%', top: 18, opacity: 0 }}
              animate={{
                left: `${targetLeft}%`,
                top: endTop,
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
