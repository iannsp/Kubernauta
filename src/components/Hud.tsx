import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { scenes } from '../game/scenarios';

function formatTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `00:${String(s).padStart(2, '0')}`;
}

export default function Hud() {
  const sceneStartedAt = useGame((s) => s.sceneStartedAt);
  const sceneStatus = useGame((s) => s.sceneStatus);
  const scenarioId = useGame((s) => s.scenarioId);
  const metrics = useGame((s) => s.metrics);
  const standalonePodsDeclared = useGame((s) => s.standalonePodsDeclared);
  const scene = scenes[scenarioId];

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (sceneStatus !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [sceneStatus]);

  const elapsed = sceneStartedAt ? now - sceneStartedAt : 0;
  const remaining = Math.max(0, scene.durationMs - elapsed);
  const uptime =
    metrics.totalReqs > 0 ? Math.round((metrics.successReqs / metrics.totalReqs) * 100) : 100;

  return (
    <div className="hud">
      <div className="hud-cell hud-title">
        <span className="hud-label">cena</span>
        <span className="hud-value">{scene.title}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-label">tempo</span>
        <span className="hud-value mono">{formatTime(remaining)}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-label">requisições atendidas</span>
        <span className={`hud-value mono ${uptime < 80 ? 'warn' : ''}`}>
          {uptime}% ({metrics.successReqs}/{metrics.totalReqs})
        </span>
      </div>
      {standalonePodsDeclared > 0 && (
        <div className="hud-cell" title="Quantos Pods avulsos você declarou nesta cena (Deployments não contam)">
          <span className="hud-label">pods declarados</span>
          <span className="hud-value mono">{standalonePodsDeclared}</span>
        </div>
      )}
    </div>
  );
}
