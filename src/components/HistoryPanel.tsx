import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../game/store';
import { scenes } from '../game/scenarios';

export default function HistoryPanel() {
  const log = useGame((s) => s.narrativeLog);
  const scenarioId = useGame((s) => s.scenarioId);
  const scene = scenes[scenarioId];

  return (
    <aside className="history">
      <div className="history-header">
        <div className="history-label">Cena</div>
        <div className="history-title">{scene.title}</div>
      </div>
      <div className="history-log">
        <AnimatePresence initial={false}>
          {log.map((entry, i) => (
            <motion.div
              key={`${i}-${entry.slice(0, 16)}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="history-entry"
            >
              {entry}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </aside>
  );
}
