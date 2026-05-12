import { useGame } from '../game/store';
import { TUTORIAL_TOTAL_STEPS } from '../game/store';

interface Slide {
  title: string;
  body: React.ReactNode;
  diagram?: React.ReactNode;
}

const slides: Slide[] = [
  {
    title: 'K8s é declarativo, não imperativo',
    body: (
      <>
        <p>
          Você não diz ao cluster <em>"crie um pod agora"</em>. Você diz{' '}
          <strong>"isso deve existir"</strong> — e ele se vira pra manter isso verdade.
        </p>
        <p>
          A diferença entre o que você quer e o que está rodando é a ferramenta de
          ensino do jogo.
        </p>
      </>
    ),
    diagram: (
      <div className="tut-diagram">
        <div className="tut-box">você declara</div>
        <div className="tut-arrow">→</div>
        <div className="tut-box tut-box-accent">cluster materializa</div>
      </div>
    ),
  },
  {
    title: 'Dois lados: Desejado e Real',
    body: (
      <>
        <p>
          <strong>Esquerda — Desejado:</strong> onde você arrasta peças. É a sua intenção.
        </p>
        <p>
          <strong>Direita — Real:</strong> o que o cluster está de fato executando.
          Pods aparecem em nodes; partículas representam requisições.
        </p>
        <p>Sua tarefa é manter Desejado e Real alinhados.</p>
      </>
    ),
    diagram: (
      <div className="tut-diagram tut-diagram-split">
        <div className="tut-half">
          <div className="tut-label">Desejado</div>
          <div className="tut-mini-card">📦 Pod</div>
        </div>
        <div className="tut-arrow">⇄</div>
        <div className="tut-half">
          <div className="tut-label">Real</div>
          <div className="tut-mini-node">N1 🟢</div>
        </div>
      </div>
    ),
  },
  {
    title: 'O cluster tem 3 nodes',
    body: (
      <>
        <p>
          <strong>N1, N2, N3</strong> são três máquinas físicas no lado Real. Pods rodam
          dentro delas.
        </p>
        <p>
          Você <em>não escolhe</em> onde o pod pousa — o cluster decide com base em
          capacidade livre.
        </p>
      </>
    ),
    diagram: (
      <div className="tut-diagram tut-diagram-nodes">
        <div className="tut-mini-node">N1</div>
        <div className="tut-mini-node">N2</div>
        <div className="tut-mini-node">N3</div>
      </div>
    ),
  },
  {
    title: 'Cada node tem capacidade: RAM e CPU',
    body: (
      <>
        <p>
          Sob o nome do node, duas barras: <strong>RAM (roxo)</strong> e{' '}
          <strong>CPU (laranja)</strong>. Cada container consome um pedaço dessas barras.
        </p>
        <p>
          Se um pod precisa de mais do que qualquer node tem livre, ele fica{' '}
          <strong>Pending</strong> (faixa amarela) — declarado mas sem onde rodar.
        </p>
      </>
    ),
    diagram: (
      <div className="tut-diagram">
        <div className="tut-mini-node tut-mini-node-detailed">
          <div className="tut-mini-node-label">N1</div>
          <div className="tut-mini-bar">
            <span>RAM</span>
            <div className="tut-mini-bar-track">
              <div className="tut-mini-bar-fill ram" style={{ width: '50%' }} />
            </div>
            <span className="mono">2/4 GB</span>
          </div>
          <div className="tut-mini-bar">
            <span>CPU</span>
            <div className="tut-mini-bar-track">
              <div className="tut-mini-bar-fill cpu" style={{ width: '25%' }} />
            </div>
            <span className="mono">0.5/2</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Suas peças: Pod e Deployment',
    body: (
      <>
        <p>
          <strong>📦 Pod:</strong> a menor unidade. Roda 1+ containers (aqui, sempre
          nginx). Coloca uma vez no Desejado, materializa uma vez no Real. Se morrer,{' '}
          <em>ninguém recria</em>.
        </p>
        <p>
          <strong>📋 Deployment:</strong> vigia que mantém N pods vivos. Se um morre, ele
          recria. É como você declara <em>"sempre quero N rodando, independente do que
          aconteça"</em>.
        </p>
      </>
    ),
    diagram: (
      <div className="tut-diagram tut-diagram-pieces">
        <div className="tut-piece">📦 Pod</div>
        <div className="tut-piece tut-piece-accent">📋 Deployment ×3</div>
      </div>
    ),
  },
  {
    title: 'Tempo, história e instrutor',
    body: (
      <>
        <p>
          <strong>Em cima (HUD):</strong> cronômetro da cena + taxa de requisições
          atendidas.
        </p>
        <p>
          <strong>À esquerda (Cena):</strong> a história anotada em tempo real conforme
          coisas acontecem.
        </p>
        <p>
          <strong>Embaixo (Painel do instrutor):</strong> botões pra causar caos manual —
          matar pod, derrubar node, pausar tempo.
        </p>
      </>
    ),
  },
];

export default function Tutorial() {
  const tutorialStep = useGame((s) => s.tutorialStep);
  const next = useGame((s) => s.nextTutorialStep);
  const skip = useGame((s) => s.skipTutorial);

  if (tutorialStep === null) return null;
  const slide = slides[tutorialStep];
  if (!slide) return null;

  const isLast = tutorialStep === TUTORIAL_TOTAL_STEPS - 1;

  return (
    <div className="overlay tutorial-overlay">
      <div className="tutorial-card">
        <div className="tutorial-progress">
          <span className="tutorial-step">
            Tutorial {tutorialStep + 1} / {TUTORIAL_TOTAL_STEPS}
          </span>
          <button className="tutorial-skip" onClick={skip}>
            pular tutorial
          </button>
        </div>
        <h2>{slide.title}</h2>
        <div className="tutorial-body">{slide.body}</div>
        {slide.diagram && <div className="tutorial-diagram-wrap">{slide.diagram}</div>}
        <button className="overlay-primary" onClick={next}>
          {isLast ? 'Pronto — ver Cena 1 →' : 'Próximo →'}
        </button>
      </div>
    </div>
  );
}
