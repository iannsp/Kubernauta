import { useDroppable } from '@dnd-kit/core';
import { useGame } from '../game/store';
import Palette from './Palette';
import DesiredResource from './DesiredResource';

export default function DesiredSide() {
  const { setNodeRef, isOver } = useDroppable({ id: 'desired-drop' });
  const desired = useGame((s) => s.desired);

  return (
    <section className="side desired">
      <h2>Desejado</h2>
      <p className="subtitle">o que você quer</p>
      <div ref={setNodeRef} className={`drop-zone ${isOver ? 'over' : ''}`}>
        {desired.length === 0 && <span className="placeholder">arraste uma peça aqui</span>}
        {desired.map((r) => (
          <DesiredResource key={r.id} resource={r} />
        ))}
      </div>
      <Palette />
    </section>
  );
}
