# k8s-puzzle — notas de design

Documento vivo registrando decisões, princípios e contexto de design do jogo.
Capturado no estado de 2026-05-11 a partir das conversas de design.

---

## Objetivo

Jogo web visual de encaixar peças que ensina **conceitos puros de Kubernetes**
(sem YAML, sem kubectl), para **treinamento corporativo**. Cada cena dura
30–60 segundos e simula uma situação real onde o jogador precisa configurar
o cluster para sobreviver.

A coisa que diferencia o jogo de um tutorial K8s: o jogador *experimenta*
o modelo declarativo. Não lê sobre ele.

## Público

Treinamento corporativo: instrutor + alunos. Cada aluno joga no próprio
browser; instrutor projeta o dele e narra. Mesma build atende os dois papéis
(o instrutor tem o "painel de instrutor" no rodapé para causar caos manual,
mas o aluno também).

## Princípios pedagógicos

### 1. O modelo declarativo é o coração

K8s não responde a comandos ("faça isso agora"). Responde a declarações
("isso deve existir"). O jogo todo gira em torno disso: tudo o que você faz
é arrastar peças para o lado Desejado; o cluster se vira para manter no Real.

### 2. O gap entre Desejado e Real é a ferramenta de ensino

A diferença entre o que você declarou e o que está rodando é onde a história
do mundo real entra. Pods morrem, nodes caem, tráfego dispara. **A pedagogia
do jogo é revelar onde a promessa declarativa silenciosamente falhava** porque
o jogador não declarou o suficiente.

### 3. Cenas amarradas: só uma configuração específica vence

Cada cena é tunada (load + timing de eventos) para que apenas a configuração
correta sobreviva. Cena 2 (Plantonista) tem kills a cada 8s — sem
re-declaração manual ininterrupta, falha. Cena 3 tem kills que excedem o
window de grace — sem Deployment, falha. Isso força a descoberta.

### 4. Outros viram post-mortem

Formato padrão: *"Você [não] previu que [X]. [Explicação]. Em K8s, [verdade
do mundo real]."* O fim da cena nomeia o comportamento que o jogador não
estava preparado para encarar.

### 5. Sobreviveu = ganhou (no nível do sistema)

Critério único: site não pode ficar 100% caído por mais de 5s seguidos.
Forgiving por design — o foco é entender, não acertar score. A camada de
"3 estrelas" pode vir depois se quisermos gamificar.

### 6. Narrativa híbrida: carga visível + história anotada

- **Partículas** (verdes/vermelhas) caem do topo da coluna Real até a coluna
  do node onde o pod-alvo está, comunicando roteamento e load balancing.
- **History panel** à esquerda vai anotando o que acontece em texto.
- **HUD** em cima mostra tempo, taxa de requisições atendidas, e pods
  declarados (quando relevante).

## Arco curricular

Estado atual (commit `0ee61b3`):

| # | id        | Título               | Conceito                                          | Status |
|---|-----------|---------------------|---------------------------------------------------|--------|
| 1 | cena-1    | Primeiro dia        | Modelo declarativo: declare e o cluster materializa | ✓ feito |
| 2 | cena-2    | O plantonista       | Pod solto exige plantão humano — não escala       | ✓ feito |
| 3 | cena-3    | Bug intermitente    | Deployment como alívio: recria automaticamente    | ✓ feito |
| 4 | cena-4    | Service magnet      | Pods perdem IP; Service é endereço estável       | a planejar |
| 5 | cena-5    | Datacenter pegou fogo | Nodes morrem; pods migram (ou não)              | a planejar |
| 6 | cena-6    | Rolling update      | Lançar versão nova sem downtime — ReplicaSet aparece | a planejar |

A separação Cena 2 (Plantonista, só Pod) e Cena 3 (Bug intermitente, libera
Deployment) é deliberada: o jogador *sente falta* do Deployment antes de
recebê-lo. Cena 2 sem alternativa força o "isso não pode ser certo, deve ter
outro jeito".

## Mecânicas

### Reconciler

Loop que roda a cada 1000ms:
- Para cada Deployment no Desejado, conta pods vivos com `desiredId` igual.
- Se faltam, schedula novos em nodes com capacidade livre. Sem capacidade →
  pod fica `pending`.
- Pods em nodes que caíram são removidos (Deployment recria no próximo tick).
- Pods soltos (kind 'pod') NÃO são geridos — declaração one-shot. Ninguém
  recria se morrerem.

### Traffic sim

Loop que roda a cada 100ms, gera requests baseado na fase atual (rps):
- Cada request escolhe um pod random `running` de qualquer node vivo
  (modelo K8s: rede plana, cluster decide).
- Pod tem capacidade 5 req/s. Acima disso, requests caem (vermelho).
- Particula visual: sai do topo central, voa pra coluna do node-alvo.
- Métricas: totalReqs, successReqs, failedReqs.

### Capacity (RAM + CPU)

Cada cena define `nodeCapacity: { ram, cpu }` aplicada a todos os 3 nodes.
Cada container declara `resources: { ram, cpu }` (nginx default 0.5 GB / 0.25
cores). Reconciler só pousa pod num node com headroom; sem headroom → pending.

Pending tray amarela aparece embaixo do Real quando há pods sem onde rodar.

### Cenas: fases e eventos

`scenarios.ts` define cada cena com:
- `phases: [{ startMs, rps, narrative }]` — taxas de tráfego que mudam ao
  longo do tempo. Narrativa de cada fase aparece no history panel quando a
  fase começa.
- `events: [{ atMs, action, text? }]` — coisas que acontecem em momentos
  específicos. Ações: `killRandomPod`, `killRandomNode`, `narrate` (só texto,
  sem efeito mecânico).

### Briefing das cenas (intro overlay)

Substituiu `recommendedReplicas` (que dava a resposta) por:
- `loadDescription`: ex *"Tráfego cresce de 0.3 a 0.6 req/s"*
- `chaosDescription`: ex *"3 pods morrem a cada ~15s"*

O jogador deduz a configuração necessária a partir da pressão descrita.

### Outros (intro / outro overlays)

- `introNarrative` planta a pergunta
- `objective` é uma linha do que precisa fazer
- `outroSurvived` / `outroFailed` são post-mortems que nomeiam o aprendizado

### Tutorial pré-cena

6 slides antes da Cena 1:
1. K8s é declarativo (com diagrama de setas)
2. Desejado ↔ Real (com mini-cards)
3. 3 nodes (mini-nodes em fila)
4. Capacidade RAM/CPU (mini-node com barras)
5. Peças: Pod e Deployment (em revisão — vai virar história "gado/pastor")
6. HUD + história + instrutor

Botão "pular tutorial" no canto. Estado preserva entre retry/advance dentro
da sessão (não reabre).

### Painel do instrutor

Footer com botões pra causar caos manual:
- 💀 matar pod (random)
- ⚡ derrubar/reerguer cada node
- ⏸ pausar/retomar
- ↻ resetar

Visível sempre, durante e fora de cena. Para uso em sala de aula (instrutor
para o tempo pra explicar) ou exploração depois da cena.

## Arquitetura técnica

Stack: Vite + React 19 + TypeScript + Zustand + dnd-kit + framer-motion.
Single-page, sem backend. Deploy como página estática.

```
src/
  game/
    types.ts         Tipos: GameState, RealPod, Resources, Particle, ...
    scenarios.ts     Data das cenas
    reconciler.ts    Loop "manter desejado", schedule por capacity
    traffic.ts      Loop "gerar requests, escolher pod, emit particles"
    store.ts        Zustand store com state + actions + tick orquestrador
  components/
    Board, DesiredSide, Palette, DesiredResource  ← painel esquerdo
    RealSide, Particles                            ← painel direito
    HistoryPanel, Hud                              ← topo/esquerda
    SceneOverlay, Tutorial, InstructorPanel        ← overlays/footer
  App.tsx                                          ← layout principal
```

Tick interval: 100ms. Dentro:
- Reconcile só a cada 1000ms (drama visível na recriação)
- Traffic + phase narrative + events + uptime check a cada tick (smooth)
- Scene end check

## Design visual

- Layout: HUD em cima, 3 colunas (History | Desired | Real), painel
  instrutor embaixo.
- Cores semânticas:
  - 🟢 verde (`#34c759`) — pod vivo / requisição atendida
  - 🔴 vermelho (`#ff3b30`) — falha / node down / danger
  - 🔵 azul accent (`#007aff`) — Deployment / acentos
  - 🟣 roxo (`#5856d6`) — barras de RAM
  - 🟠 laranja (`#ff9500`) — barras de CPU
  - 🟡 amarelo (`#ffcc00`) — Pending
- Tipo: system font, peso 600 pra títulos, mono pra números
- Animações: framer-motion. Pods nascem/morrem com spring. Particulas voam
  com easeOut. Deployment pulsa azul quando o reconciler age.

## Princípios narrativos

- **Voz**: pt-BR, segunda pessoa direta, presente. Tom técnico-mas-acessível.
- **Metáfora central**: "Pods são gado, não estimação" (do K8s real)
- **Cada conceito ganha história**: discutido o esqueleto pra Pod, Deployment,
  Node ("prédio"), Reconciler ("jardineiro"), Container ("caixa de porto"),
  Service ("recepção"), Pending ("sala de espera"), Cluster ("cidade").
  Aplicação por cena conforme necessidade.

## Decisões em aberto

### Indicadores de gap nos cards do Desejado

Concluído design, faltou implementar:
- Badge 🟢 quando declaração tem real correspondente
- 🟡 quando parcialmente (Deployment ×3 com só 2 pods rodando)
- 🔴 quando broken (Pod declarado mas não existe; Deployment com 0 pods)

A ideia maior por trás: **o indicador é o presente; a narrativa é o passado**.
O badge dá o sinal; a narrativa explica o que ele significa. Live narrative
no history panel quando o estado muda (ex: "💀 Pod morreu. Desejado 1, Real
0. ⚠ Quem vai recriar?").

### Telemetria por cena pra outros contextuais

A ideia: gravar trajetória durante a cena (firstDeclaredAt, gapStateTimeline,
manualKillCount, removalCount, nodeKillCount, failedAt). Outro NÃO é mais
string fixa — é função que olha telemetria e escolhe template apropriado.
Permite outros como *"Gap 🔴 durou 18 segundos depois que você matou o pod..."*
que referenciam o que de fato aconteceu.

### Reescrever slide 5 do tutorial

Aplicar a história "Pod = gado, não estimação" + "Deployment = pastor" no
slide de peças. Hoje é lista; deve virar narrativa curta.

## Backlog

- **Partículas com peso**: request leve (GET) consome 1 slot, pesada (POST)
  consome N. Abre conceitos: por que pods têm tamanhos diferentes, escalar
  não é linear, distribuição irregular.
- **Histórias para outros conceitos** (descritas na conversa, prontas pra
  uso): Node como prédio, Reconciler como jardineiro, Container como caixa,
  Service como recepção, Pending como sala de espera, Cluster como cidade.

## Como rodar

```bash
export PATH=/home/ivo/.nvm/versions/node/v25.5.0/bin:$PATH
cd /home/ivo/k8s-puzzle
npm run dev
# → http://localhost:5173/
```

Node 25+ é obrigatório (create-vite usa `node:util.styleText` que veio em 22+,
e nosso ambiente só tem 19 e 25).
