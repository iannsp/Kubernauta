import DesiredSide from './DesiredSide';
import RealSide from './RealSide';

export default function Board() {
  return (
    <main className="board">
      <DesiredSide />
      <RealSide />
    </main>
  );
}
