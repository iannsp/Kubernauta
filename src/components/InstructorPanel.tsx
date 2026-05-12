import { useGame } from '../game/store';

export default function InstructorPanel() {
  const killRandomPod = useGame((s) => s.killRandomPod);
  const toggleNode = useGame((s) => s.toggleNode);
  const togglePause = useGame((s) => s.togglePause);
  const paused = useGame((s) => s.paused);
  const reset = useGame((s) => s.reset);
  const nodes = useGame((s) => s.nodes);

  return (
    <footer className="instructor">
      <span className="panel-label">Painel do instrutor</span>
      <button className="danger" onClick={killRandomPod}>
        💀 matar pod
      </button>
      {nodes.map((n) => (
        <button key={n.id} onClick={() => toggleNode(n.id)}>
          ⚡ {n.status === 'alive' ? 'derrubar' : 'reerguer'} {n.id}
        </button>
      ))}
      <button onClick={togglePause}>{paused ? '▶ retomar' : '⏸ pausar'} tempo</button>
      <button onClick={reset}>↻ resetar</button>
    </footer>
  );
}
