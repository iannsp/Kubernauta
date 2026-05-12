import { useEffect, useRef, useState } from 'react';
import type { DesiredResource as DR } from '../game/types';
import { podResourceSum } from '../game/types';
import { useGame } from '../game/store';

function ResourceBadge({ ram, cpu }: { ram: number; cpu: number }) {
  return (
    <span className="resource-badge mono" title="recursos solicitados">
      {ram} GB · {cpu} cores
    </span>
  );
}

function ServiceCard({ id }: { id: string }) {
  const remove = useGame((s) => s.removeDesired);
  const connectedCount = useGame(
    (s) => s.pods.filter((p) => p.status === 'running' && p.nodeId !== null).length
  );
  return (
    <div className="resource service-card">
      <div className="resource-header">
        <span>🧲 Service</span>
        <div className="controls">
          <span className="resource-badge mono">→ {connectedCount} pod{connectedCount !== 1 ? 's' : ''}</span>
          <button onClick={() => remove(id)} title="remover">×</button>
        </div>
      </div>
      <div className="service-hint">endereço estável: roteia pra qualquer pod vivo</div>
    </div>
  );
}

export default function DesiredResource({ resource }: { resource: DR }) {
  const remove = useGame((s) => s.removeDesired);
  const setReplicas = useGame((s) => s.setReplicas);
  const triggerUpgrade = useGame((s) => s.triggerUpgrade);
  const upgradeOffered = useGame((s) => s.upgradeOffered);
  const podCountForDeployment = useGame((s) =>
    resource.kind === 'deployment'
      ? s.pods.filter((p) => p.desiredKind === 'deployment' && p.desiredId === resource.id).length
      : 0
  );

  const [pulse, setPulse] = useState(false);
  const lastCount = useRef(podCountForDeployment);
  useEffect(() => {
    if (resource.kind !== 'deployment') return;
    if (lastCount.current !== podCountForDeployment) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 400);
      lastCount.current = podCountForDeployment;
      return () => clearTimeout(t);
    }
  }, [podCountForDeployment, resource.kind]);

  if (resource.kind === 'pod') {
    const r = podResourceSum(resource.spec);
    return (
      <div className="resource pod-card-outer">
        <div className="resource-header">
          <span>📦 Pod</span>
          <div className="controls">
            <ResourceBadge ram={r.ram} cpu={r.cpu} />
            <button onClick={() => remove(resource.id)} title="remover">×</button>
          </div>
        </div>
        <div className="container-card">🟢 nginx</div>
      </div>
    );
  }

  if (resource.kind === 'service') {
    return <ServiceCard id={resource.id} />;
  }

  const r = podResourceSum(resource.template);
  const canUpgrade = upgradeOffered && resource.version === 'v1';
  const containerEmoji = resource.version === 'v2' ? '🔵' : '🟢';
  return (
    <div className={`resource deployment-card ${pulse ? 'pulsing' : ''}`}>
      <div className="resource-header">
        <span>
          📋 Deployment <span className="version-tag mono">{resource.version}</span>
        </span>
        <div className="controls">
          <button onClick={() => setReplicas(resource.id, resource.replicas - 1)} title="menos">−</button>
          <span className="replicas">×{resource.replicas}</span>
          <button onClick={() => setReplicas(resource.id, resource.replicas + 1)} title="mais">+</button>
          <button onClick={() => remove(resource.id)} title="remover">×</button>
        </div>
      </div>
      {canUpgrade && (
        <button className="upgrade-btn" onClick={() => triggerUpgrade(resource.id)}>
          🚀 atualizar v1 → v2
        </button>
      )}
      <div className="template-label">modelo de Pod ({r.ram} GB · {r.cpu} cores cada):</div>
      <div className="pod-card-inner">
        <div className="pod-label">📦 Pod</div>
        <div className="container-card">{containerEmoji} nginx {resource.version}</div>
      </div>
    </div>
  );
}
