import splashImg from '../assets/kubernauta-splash.jpg';

interface Props {
  onClose: () => void;
}

export default function Splash({ onClose }: Props) {
  return (
    <div className="splash-overlay" onClick={onClose}>
      <div className="splash-card" onClick={(e) => e.stopPropagation()}>
        <img src={splashImg} alt="Kubernauta" className="splash-img" />
        <div className="splash-signature">by Ivo Nascimento</div>
        <button className="overlay-primary splash-cta" onClick={onClose}>
          Entrar →
        </button>
      </div>
    </div>
  );
}
