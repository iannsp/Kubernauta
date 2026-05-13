import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { scenes, LEVELS } from '../game/scenarios';

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
  const selectScene = useGame((s) => s.selectScene);
  const scene = scenes[scenarioId];

  const [now, setNow] = useState(Date.now());
  const [selectorOpen, setSelectorOpen] = useState(false);
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
        <button
          className="scene-title-btn"
          onClick={() => setSelectorOpen((o) => !o)}
          title="trocar cena"
        >
          <span className="hud-value">{scene.title}</span>
          <span className="dropdown-caret">▾</span>
        </button>
        {selectorOpen && (
          <>
            <div className="scene-selector-backdrop" onClick={() => setSelectorOpen(false)} />
            <div className="scene-selector">
              {LEVELS.map((level) => (
                <div key={level.id} className="scene-selector-group">
                  <div className="scene-selector-group-header">{level.name}</div>
                  {level.scenes.map((id, i) => {
                    const s = scenes[id];
                    if (!s) return null;
                    const isCurrent = id === scenarioId;
                    return (
                      <button
                        key={id}
                        className={`scene-item ${isCurrent ? 'current' : ''}`}
                        onClick={() => {
                          selectScene(id);
                          setSelectorOpen(false);
                        }}
                      >
                        <span className="scene-item-num mono">{i + 1}</span>
                        <span className="scene-item-title">{s.title}</span>
                        {isCurrent && <span className="scene-item-tag">atual</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
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
