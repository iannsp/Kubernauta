import { useEffect } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useGame } from './game/store';
import { NGINX_RESOURCES } from './game/types';
import Board from './components/Board';
import InstructorPanel from './components/InstructorPanel';
import HistoryPanel from './components/HistoryPanel';
import Hud from './components/Hud';
import SceneOverlay from './components/SceneOverlay';
import Tutorial from './components/Tutorial';
import './App.css';

const TICK_MS = 100;

export default function App() {
  const tick = useGame((s) => s.tick);
  const addStandalonePod = useGame((s) => s.addStandalonePod);
  const addDeployment = useGame((s) => s.addDeployment);

  useEffect(() => {
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [tick]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over?.id !== 'desired-drop') return;
    const type = e.active.data.current?.type;
    if (type === 'pod') {
      addStandalonePod([{ image: 'nginx', resources: { ...NGINX_RESOURCES } }]);
    } else if (type === 'deployment') {
      addDeployment(3, { containers: [{ image: 'nginx', resources: { ...NGINX_RESOURCES } }] });
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="app">
        <Hud />
        <div className="main-row">
          <HistoryPanel />
          <Board />
        </div>
        <InstructorPanel />
        <SceneOverlay />
        <Tutorial />
      </div>
    </DndContext>
  );
}
