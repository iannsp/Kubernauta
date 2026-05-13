import { useDraggable } from '@dnd-kit/core';
import { useGame } from '../game/store';
import { scenes } from '../game/scenarios';

interface ChipProps {
  id: string;
  type: 'pod' | 'deployment' | 'service';
  label: string;
  data?: Record<string, unknown>;
}

function DraggableChip({ id, type, label, data }: ChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type, ...data },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`chip ${isDragging ? 'dragging' : ''}`}
    >
      {label}
    </div>
  );
}

export default function Palette() {
  const scenarioId = useGame((s) => s.scenarioId);
  const scene = scenes[scenarioId];
  const available = scene.availablePieces;
  const showLabels = scene.showLabels;
  const serviceVariants = scene.serviceVariants;

  return (
    <div className="palette">
      <span className="palette-title">peças</span>
      {available.includes('pod') && (
        <DraggableChip id="palette-pod" type="pod" label="📦 Pod (nginx)" />
      )}
      {available.includes('deployment') && (
        <DraggableChip
          id="palette-deploy"
          type="deployment"
          label={showLabels ? '📋 Deployment ×3 (nginx) 🏷 app:web' : '📋 Deployment ×3 (nginx)'}
          data={{ label: 'app:web' }}
        />
      )}
      {available.includes('service') && (
        serviceVariants && serviceVariants.length > 0 ? (
          serviceVariants.map((sel) => (
            <DraggableChip
              key={sel}
              id={`palette-svc-${sel}`}
              type="service"
              label={`🧲 Service 🏷 → ${sel}`}
              data={{ selector: sel }}
            />
          ))
        ) : (
          <DraggableChip
            id="palette-svc"
            type="service"
            label={showLabels ? '🧲 Service 🏷 → app:web' : '🧲 Service'}
            data={{ selector: 'app:web' }}
          />
        )
      )}
    </div>
  );
}
