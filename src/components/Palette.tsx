import { useDraggable } from '@dnd-kit/core';
import { useGame } from '../game/store';
import { scenes } from '../game/scenarios';

interface ChipProps {
  id: string;
  type: 'pod' | 'deployment';
  label: string;
}

function DraggableChip({ id, type, label }: ChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type },
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
  const available = scenes[scenarioId].availablePieces;

  return (
    <div className="palette">
      <span className="palette-title">peças</span>
      {available.includes('pod') && (
        <DraggableChip id="palette-pod" type="pod" label="📦 Pod (nginx)" />
      )}
      {available.includes('deployment') && (
        <DraggableChip id="palette-deploy" type="deployment" label="📋 Deployment ×3 (nginx)" />
      )}
    </div>
  );
}
