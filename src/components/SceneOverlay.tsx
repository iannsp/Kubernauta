import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { scenes } from '../game/scenarios';

const COUNTDOWN_TOTAL_MS = 5000;

function Countdown({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, COUNTDOWN_TOTAL_MS - (now - startedAt));
  const secondsLeft = Math.ceil(remaining / 1000);
  return (
    <div className="countdown-overlay">
      <div key={secondsLeft} className="countdown-number">
        {secondsLeft}
      </div>
      <div className="countdown-hint">posicione suas peças</div>
    </div>
  );
}

export default function SceneOverlay() {
  const sceneStatus = useGame((s) => s.sceneStatus);
  const scenarioId = useGame((s) => s.scenarioId);
  const tutorialStep = useGame((s) => s.tutorialStep);
  const countdownStartedAt = useGame((s) => s.countdownStartedAt);
  const startScene = useGame((s) => s.startScene);
  const retryScene = useGame((s) => s.retryScene);
  const advanceScene = useGame((s) => s.advanceScene);

  const scene = scenes[scenarioId];

  if (tutorialStep !== null) return null;
  if (sceneStatus === 'countdown' && countdownStartedAt !== null) {
    return <Countdown startedAt={countdownStartedAt} />;
  }
  if (sceneStatus === 'running') return null;

  if (sceneStatus === 'intro') {
    return (
      <div className="overlay">
        <div className="overlay-card">
          <div className="overlay-label">próxima cena</div>
          <h2>{scene.title}</h2>
          <p className="overlay-narrative">{scene.introNarrative}</p>
          <div className="overlay-objective">
            <strong>Objetivo:</strong> {scene.objective}
          </div>
          <div className="overlay-meta">
            <div>
              <span className="meta-label">Capacidade por node</span>
              <span className="mono">
                {scene.nodeCapacity.ram} GB RAM · {scene.nodeCapacity.cpu} cores
              </span>
            </div>
            <div>
              <span className="meta-label">Tráfego</span>
              <span>{scene.loadDescription}</span>
            </div>
            <div>
              <span className="meta-label">Imprevistos</span>
              <span>{scene.chaosDescription}</span>
            </div>
            <div>
              <span className="meta-label">Duração</span>
              <span className="mono">{scene.durationMs / 1000}s</span>
            </div>
          </div>
          <button className="overlay-primary" onClick={startScene}>
            Começar
          </button>
        </div>
      </div>
    );
  }

  if (sceneStatus === 'survived') {
    return (
      <div className="overlay">
        <div className="overlay-card success">
          <div className="overlay-label">sobreviveu</div>
          <h2>{scene.title}</h2>
          <p className="overlay-narrative">{scene.outroSurvived}</p>
          {scene.nextSceneId ? (
            <button className="overlay-primary" onClick={advanceScene}>
              Próxima cena →
            </button>
          ) : (
            <>
              <p className="overlay-narrative" style={{ marginTop: 16 }}>
                Fim do MVP. Mais cenas em breve.
              </p>
              <button className="overlay-primary" onClick={retryScene}>
                Jogar de novo
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="overlay-card failure">
        <div className="overlay-label">não sobreviveu</div>
        <h2>{scene.title}</h2>
        <p className="overlay-narrative">{scene.outroFailed}</p>
        <button className="overlay-primary" onClick={retryScene}>
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
