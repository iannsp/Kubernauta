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

Estado atual (HEAD `e879e72`):

| # | id     | Título                 | Modo          | Conceito                                          | Peças                    |
|---|--------|------------------------|---------------|---------------------------------------------------|--------------------------|
| 1 | cena-1 | Primeiro dia           | Pré-declarado | Declare e o cluster materializa                   | Pod                      |
| 2 | cena-2 | O plantonista          | Reativo       | Pod solto exige plantão humano — não escala       | Pod                      |
| 3 | cena-3 | Bug intermitente       | Pré-declarado | Deployment como alívio: recria automaticamente    | Pod, Deployment          |
| 4 | cena-4 | O endereço que muda    | Pré-declarado | Service como endereço estável; IPs efêmeros       | Pod, Deployment, Service |
| 5 | cena-5 | Datacenter pegou fogo  | Pré-declarado | Desacoplamento Pod↔Node, capacity, stack completo | Pod, Deployment, Service |
| 6 | cena-6 | Versão nova, sem queda | Híbrido       | Rolling update; ReplicaSet visível só aqui        | Pod, Deployment, Service |
| 7 | cena-7 | A etiqueta que casa    | Pré-declarado | Labels visíveis; Service ↔ Pod via etiqueta; pod solto é anônimo | Pod, Deployment, Service |
| 8 | cena-8 | A etiqueta certa       | Pré-declarado | Etiqueta é texto livre; selector errado = Service não enxerga pods | Pod, Deployment, Service (2 variantes) |
| 9 | cena-9 | Mais gente do que eu esperava | Pré-declarado | Pod tem capacidade (5 req/s); replicas escalam capacidade; preview de HPA | Pod, Deployment, Service |

### Modo de cena

Classificação do que a vitória exige do jogador durante o runtime, e o
que o jogo permite que ele faça:

- **Reativo** — vitória depende de ação contínua durante a cena. Sem agir
  em runtime, falha. É o modo "controller humano" — lição pedagógica
  negativa: agir manualmente não escala.
- **Híbrido** — configuração prévia + ação pontual durante a cena
  (ex.: clicar 🚀 num momento específico).
- **Pré-declarado** — configurou antes, vitória depende só disso. Pode
  mexer depois mas não precisa. É o modo "K8s normal" — declare e o
  controller cuida. O Desejado continua editável.
- **Selado** — fase explícita de configuração com tempo definido, depois
  o Desejado trava em read-only e o jogador só observa. Versão forte do
  Pré-declarado: a constraint vem do jogo, não da escolha do jogador.
  Implementa a mecânica `configure-then-watch` catalogada abaixo. Encarna
  o paradigma declarativo como regra do jogo.

Ordem do mais ao menos exigente em runtime:
Reativo → Híbrido → Pré-declarado → Selado.

A separação Cena 2 (Plantonista, só Pod) e Cena 3 (Bug intermitente, libera
Deployment) é deliberada: o jogador *sente falta* do Deployment antes de
recebê-lo. Cena 2 sem alternativa força o "isso não pode ser certo, deve ter
outro jeito".

Cenas 4–6 foram planejadas por agente sub (Plan) em 2026-05-12 e executadas em
sequência com tradeoffs validados pelo usuário (commits `2f78277`, `5c1ad03`,
`e879e72`).

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
- **Com Service no Desejado:** request escolhe um pod random `running`
  elegível pelo selector (quando `scene.showLabels`, filtra por
  `pod.label === service.selector`; caso contrário qualquer pod running).
  Modelo K8s: Service é load balancer com pool de endpoints.
- **Sem Service no Desejado:** comportamento "sticky" — o primeiro pod
  escolhido vira `stickyTargetPodId`, e todo tráfego daí pra frente vai
  só pra esse pod. Modelo K8s: cliente conhece UM IP (do pod específico),
  sem indireção via Service. Se o pod sticky some (morre, removido pelo
  jogador), `stickyTargetPodId` é invalidado em `removeDesired` (ações
  do jogador) mas mantido em kills programados (eventos da cena) — é
  como a cena 4 ensina que "sem Service, pod morto = silêncio".
- Pod tem capacidade 5 req/s. Acima disso, requests caem (vermelho).
- Particula visual: sai do topo central, voa pra coluna do node-alvo.
- Métricas: totalReqs, successReqs, failedReqs.
- Janela móvel `recentReqs` (10s) alimenta o HUD e o critério
  `failBelowUptime` da cena.

**Consequência prática na cena 9 (escala):** sem Service, o sticky tranca
todo o tráfego em UM pod só. Mesmo com Deployment ×3, o cluster atende
no máximo 5 req/s (a capacidade de um pod) — os outros 2 ficam ociosos.
Pra escalar capacidade, Service distribuindo é obrigatório. É o cruzamento
das lições: cena 4 (Service como indireção) + cena 9 (replicas escalam,
mas só com Service distribuindo).

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

## Catálogo de mecânicas de jogo (gameficação)

Inventário de recursos de game design já em uso no jogo, agrupados por
função. Serve como kit de ferramentas: quando desenhar uma cena nova,
puxar daqui em vez de inventar do zero. A seção `## Mecânicas` acima
descreve **como** os subsistemas funcionam por dentro; esta seção descreve
**o que** o jogo tem como vocabulário de design.

### A. Loop central (estrutural)
- **Duas zonas: Desejado ↔ Real** — manipulação só na esquerda; direita é
  consequência. Conceito-mãe do jogo.
- **Reconciler tick a cada 1s** — materializa peças do Desejado em Real.
  Torna o modelo declarativo palpável.

### B. Manipulação do jogador
- **Drag-and-drop de chips** (Pod, Deployment, Service) da Palette pro Desejado.
- **Stepper de replicas** no card do Deployment — ajusta N em tempo real.
- **Clique-pra-matar pod no Real** (afordância extra).
- **Botão 🚀 dentro do card do Deployment** — destravado por evento (cena 6).
- **Remoção de peça do Desejado** (afordância de excluir).

### C. Tempo
- **Duração fixa por cena** (`durationMs`, 30–60s).
- **Phases automatizadas** — narrativa muda em `startMs` específicos.
- **Countdown pré-cena (5s)** — board interativo, contagem regressiva
  sem fundo escuro. Permite pré-posicionar peças.
- **Pause global** (instrutor).

### D. Feedback visual
- **Health bar dentro do pod** (carga atual em req/s).
- **Capacity bars no node** (RAM/CPU usado vs total).
- **Pending tray** (faixa amarela com pods sem onde caber).
- **Partículas** (verde sucesso / vermelho falha) representando requests.
- **Pulse animation no card de Deployment** quando reconciler age.
- **Cor de versão** (v1 verde 🟢, v2 azul 🔵) — cena 6.
- **Banner de ReplicaSet** (cena 6, opt-in via `showReplicaSets`).

### E. Caos
- **Eventos programados de cena** — `killRandomPod`, `killStickyPod`,
  `killRandomNode`, `narrate`, `offerUpgrade`.
- **Painel do instrutor** — mesmas ações + derrubar/reerguer node específico
  + pausar + reset.
- **Sticky pod determinístico** — força ensino do problema do IP volátil
  (cena 4).

### F. Narrativa / pedagógica
- **Briefing pré-cena** (objetivo, loadDescription, chaosDescription, duração,
  capacity).
- **Painel de história lateral** — narrativa empilhada em log à esquerda.
- **Narração em runtime** (eventos do tipo `narrate` durante a cena).
- **Outro reflexivo** (survived/failed) com template
  *"Você [não] previu... em K8s real..."*.
- **Tutorial pré-cena** — 6 slides explicativos antes da cena 1, com botão "pular".

### G. Vitória / derrota
- **Vence:** uptime sustentado durante `durationMs`.
- **Perde:** todos pods mortos por **5s consecutivos** (`GRACE_DOWN_MS` evita
  falsos negativos durante transições).
- **Capacity-aware:** pods sem espaço viram `Pending` (existem mas não atendem).
  Não causa derrota direta — derrota vem do tráfego falhando.

### H. Peças-como-conceitos (recursos K8s)
- **Pod (one-shot)** — não é recriado quando morre. Lição negativa.
- **Deployment (controller)** — recria automático, replicas ajustáveis.
- **Service (singleton magnet)** — sem selector visível, auto-routing.
- **Container resources** (parametriza peça) — `{ram, cpu}`, soma pro pod.
- **Version + ReplicaSet** (cena 6) — habilita rolling update.

### I. Progressão
- **Cenas sequenciais** com `nextSceneId`.
- **Status de cena** (`intro → countdown → running → survived/failed`).
- **Availability de peças por cena** (`availablePieces`) — level-gating leve.
- **Retry / Advance** explícitos no outro.

### Mecânicas anotadas, ainda não em uso

Ferramentas no kit, sem cena que use ainda:

- **Configure-then-watch** — countdown longo + Desejado read-only durante
  cena. Vira o paradigma declarativo em mecânica de jogo (declara antes,
  sistema executa). Mata o hack do "declarar é grátis". Implementa o
  modo de cena **Selado** descrito acima.
- **HUD estilo Street Fighter** — duas barras coladas (timer + uptime),
  leitura "vital" rápida.
- **Partículas com peso** — light GET vs heavy POST consomem slots diferentes.
- **Priority Class** — peça nova pra triagem em cluster saturado
  (cenário Kobayashi Maru Versão B).
- **Budget / custo visível** — penalizar declarar demais (anti-hack
  do "declarar é grátis"). Pode ser $$$ ou "pods ociosos no HUD".
- **Pré-declarar trigger** — *"quando X acontecer, faça Y"* sem clicar.
  Substitui o botão 🚀 da cena 6 por declaração condicional.
- **Labels e Selectors visíveis** — tornar a cola Service↔Pod explícita.
  Possível cena 7 do tutorial.

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

## Adições das Cenas 4–6 (deltas técnicos)

Cada cena nova introduziu mecânicas que outras podem reusar:

### Cena 4 — Service magnet

- **Peça nova `service`** (singleton por cena, sem label selector — auto-routing).
  `DesiredService` no types; `addService` action; ServiceCard no DesiredResource.
- **Roteamento bifurcado em `traffic.ts`**:
  - Com Service no Desejado → random sobre pods rodando (igual antes).
  - Sem Service → sticky: primeira request elege um pod (`stickyTargetPodId`);
    requests subsequentes miram nele. Se morre, requests falham até Service
    ser adicionado.
- **Ação `killStickyPod`** mira no sticky pod especificamente (determinismo).
- **Visual**: card amarelo-ocre `#d4a017`, sem indicador de "ligação" (particulas
  já fazem o trabalho).

### Cena 5 — Datacenter pegou fogo

- **Nenhuma mecânica nova** — reusa `killRandomNode`, reconcile com capacity,
  pending tray, Service.
- **Tuning**: `nodeCapacity: { ram: 1, cpu: 0.5 }` (2 nginx pods por node);
  2 nodes caem em 60s deixando 1 de pé com 2 slots de capacity.

### Cena 6 — Versão nova, sem queda

- **`DesiredDeployment.version: 'v1' | 'v2'`** (default v1); flip pelo
  `triggerUpgrade(deploymentId)`.
- **`RealPod.version` + `replicaSetId`**: cada pod sabe qual ReplicaSet pertence
  (id formato `rs-${version}-${deploymentId}` ou `bare-${desiredId}`).
- **Ramp logic em `reconciler.ts`**: quando `oldVersion.length > 0`, faz rolling
  update com maxSurge=1, maxUnavailable=0, uma troca por tick:
  - Se `currentVersion < replicas` e `total < replicas+1` → spawn 1 v2
  - Senão se `oldVersion > 0` e (`currentVersion >= replicas` ou
    `total >= replicas+1`) → kill 1 v1
- **Ação `offerUpgrade`** seta `upgradeOffered: true` aos 20s.
- **Botão "🚀 atualizar v1→v2"** aparece no card do Deployment quando
  `upgradeOffered && resource.version === 'v1'`.
- **Banner "ReplicaSets: ⚙ rs-v1-X ×N → ⚙ rs-v2-X ×M"** acima do cluster,
  visível só quando `scene.showReplicaSets === true`.
- **Pod v2 azul** (`#007aff` + emoji 🔵), v1 verde (igual antes).

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
- **Sticky line visual na Cena 4**: linha tracejada do topo até o pod sticky
  quando não há Service. Removido do MVP pra simplicidade — particulas já
  contam a história.
- **ReplicaSet com agrupamento visual mais elaborado**: hoje é banner em texto.
  Podia virar caixas verticais como contêineres dentro do node mostrando
  fisicamente o agrupamento.

## Como rodar

```bash
export PATH=/home/ivo/.nvm/versions/node/v25.5.0/bin:$PATH
cd /home/ivo/k8s-puzzle
npm run dev
# → http://localhost:5173/
```

Node 25+ é obrigatório (create-vite usa `node:util.styleText` que veio em 22+,
e nosso ambiente só tem 19 e 25).

## Como recuperar o status (para continuar daqui)

**1. Onde está o código.** `/home/ivo/k8s-puzzle/`. Git inicializado, branch
`master`. Sem remote configurado.

**2. Histórico de commits significativos** (`git log --oneline`):

```
e879e72  Cena 6 Rolling update (Deployment com version + ReplicaSet visível)
5c1ad03  Cena 5 Datacenter pegou fogo (2 nodes caem, capacity apertada)
2f78277  Cena 4 Service magnet + sticky routing sem Service
7e95245  DESIGN.md: notas de design vivas
0ee61b3  Cena 2 Plantonista + reorder do arco (cena-3 = ex-cena-2)
e6eb678  Tutorial pre-cena: 6 slides explicando a tela
9828c4c  Initial baseline: cenas 1 e 2 funcionais
```

**3. Estado funcional**: 6 cenas jogáveis ponta-a-ponta. Tutorial de 6 slides
abre antes da Cena 1. Capacity model (RAM/CPU + Pending) funciona em todas as
cenas mas só pressiona em Cena 5. Service singleton sem label selector. Rolling
update com maxSurge=1, maxUnavailable=0. Todos os outros são post-mortems
estáticos por cena (não contextuais por telemetria — ver "Decisões em aberto").

**4. Smoke test recomendado**:
- Cena 1 (30s): drope um Pod, sobreviva tranquilo.
- Cena 2 (60s): drope um Pod, espere 8s, drope outro, repita. Veja contador
  "pods declarados" crescer no HUD.
- Cena 3 (60s): drope Deployment ×3. Sobrevive sem esforço — Deployment recria.
- Cena 4 (60s): drope só Deployment ×3 → falha (`killStickyPod` mata o sticky,
  Deployment recria com IP novo mas tráfego não acha). Tente de novo com
  Deployment ×3 + Service → sobrevive.
- Cena 5 (60s): Deployment ×3 + Service → sobrevive (pods migram pra outros
  nodes); alguns pods ficam Pending quando só sobra 1 node.
- Cena 6 (60s): Deployment ×3 + Service → aos 20s o botão 🚀 libera no card
  do Deployment. Clique. Banner mostra rs-v1 esvaziando, rs-v2 enchendo.
  Pods azuis (🔵) substituem verdes (🟢) gradualmente. Sem queda no uptime.

**5. O que está pendente** (ver seções acima):

| Pendente | Esforço | Por que importa |
|----------|---------|-----------------|
| Indicadores de gap nos cards do Desejado (🟢/🟡/🔴) | médio | Torna o gap Desejado↔Real visível em tempo real, não só pela narrativa |
| Telemetria por cena pra outros contextuais | médio-alto | Outros que referenciam o que de fato aconteceu ("Gap 🔴 durou 18s...") em vez de string fixa |
| Reescrever slide 5 do tutorial com história "gado/pastor" | baixo | Já temos o texto pronto; é só substituir |
| Histórias dos demais conceitos (Node, Reconciler, etc.) | baixo cada | Esqueletos prontos na conversa; aplicar onde fizer sentido |
| Partículas com peso | médio | Abre conceitos novos (sizing, escala não-linear). Marcado como backlog. |

**6. Arquivos-chave para mexer em coisas comuns**:

- Adicionar/editar cena → `src/game/scenarios.ts`
- Mudar mecânica de tráfego → `src/game/traffic.ts`
- Mudar lógica de scheduling/reconciliação → `src/game/reconciler.ts`
- Mudar estado global ou actions → `src/game/store.ts`
- Mudar UI da peça no Desejado → `src/components/DesiredResource.tsx`
- Mudar UI do cluster/pods/nodes → `src/components/RealSide.tsx`
- Mudar overlays de intro/outro → `src/components/SceneOverlay.tsx`
- Mudar tutorial → `src/components/Tutorial.tsx`
- Estilos visuais → `src/App.css`
