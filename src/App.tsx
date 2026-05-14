import { useEffect, useState } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useGame } from './game/store';
import { NGINX_RESOURCES } from './game/types';
import Board from './components/Board';
import InstructorPanel from './components/InstructorPanel';
import HistoryPanel from './components/HistoryPanel';
import Hud from './components/Hud';
import SceneOverlay from './components/SceneOverlay';
import Splash from './components/Splash';
import Tutorial from './components/Tutorial';
import './App.css';

const TICK_MS = 100;

export default function App() {
  const [splashOpen, setSplashOpen] = useState(true);
  const tick = useGame((s) => s.tick);
  const addStandalonePod = useGame((s) => s.addStandalonePod);
  const addDeployment = useGame((s) => s.addDeployment);
  const addService = useGame((s) => s.addService);

  useEffect(() => {
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [tick]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over?.id !== 'desired-drop') return;
    const data = e.active.data.current;
    const type = data?.type;
    if (type === 'pod') {
      addStandalonePod([{ image: 'nginx', resources: { ...NGINX_RESOURCES } }]);
    } else if (type === 'deployment') {
      addDeployment(3, { containers: [{ image: 'nginx', resources: { ...NGINX_RESOURCES } }] }, data?.label);
    } else if (type === 'service') {
      addService(data?.selector);
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
        {splashOpen && <Splash onClose={() => setSplashOpen(false)} />}
      </div>
    </DndContext>
  );
}
