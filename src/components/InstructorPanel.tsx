import { useGame } from '../game/store';
import { track } from '../lib/track';

export default function InstructorPanel() {
  const killRandomPod = useGame((s) => s.killRandomPod);
  const toggleNode = useGame((s) => s.toggleNode);
  const togglePause = useGame((s) => s.togglePause);
  const paused = useGame((s) => s.paused);
  const retryScene = useGame((s) => s.retryScene);
  const nodes = useGame((s) => s.nodes);
  const scenarioId = useGame((s) => s.scenarioId);

  return (
    <footer className="instructor">
      <span className="panel-label">Painel do instrutor</span>
      <button
        className="danger"
        onClick={() => {
          track('instructor_kill_pod');
          killRandomPod();
        }}
      >
        💀 matar pod
      </button>
      {nodes.map((n) => (
        <button
          key={n.id}
          onClick={() => {
            track('instructor_toggle_node', {
              node_id: n.id,
              to_status: n.status === 'alive' ? 'down' : 'alive',
            });
            toggleNode(n.id);
          }}
        >
          ⚡ {n.status === 'alive' ? 'derrubar' : 'reerguer'} {n.id}
        </button>
      ))}
      <button
        onClick={() => {
          track('instructor_pause_toggle', { to_state: paused ? 'running' : 'paused' });
          togglePause();
        }}
      >
        {paused ? '▶ retomar' : '⏸ pausar'} tempo
      </button>
      <button
        onClick={() => {
          track('instructor_reset', { scene_id: scenarioId });
          retryScene();
        }}
      >
        ↻ resetar
      </button>
    </footer>
  );
}
