# CENAS.md — guia didático do tutorial

Cada cena é uma situação de 30–60s que isola **um** conceito de Kubernetes. O jogador arrasta peças da Palette para o lado **Desejado**; o lado **Real** mostra o cluster reagindo. Reconciler roda a cada 1000ms; tráfego a cada 100ms. Pod aguenta 5 req/s (`POD_CAPACITY` em `traffic.ts`).

A ordem das cenas não é aleatória: cada uma planta uma falta que a próxima resolve. Cena 2 dói pra que a Cena 3 alivie. Cena 4 silencia o tráfego pra que o Service apareça como solução, não como mais uma peça arbitrária.

---

## Cena 1 — Primeiro dia no ar

**Modo:** Pré-declarado
**Peças:** 📦 Pod
**Tráfego:** 0.3 req/s → 0.6 req/s (sobe aos 15s)
**Duração:** 30s

### Conceito K8s

Modelo declarativo: você diz o que deve existir, o cluster materializa.

### O que a cena quer demonstrar

Primeiro contato com a metáfora central do jogo. O jogador não digita comando, não escreve YAML — só arrasta `📦 Pod` pra zona Desejado e vê o cluster instanciar um pod do outro lado. A carga é baixíssima de propósito: nada pode dar errado, o foco é só absorver o gesto "declare e algo aparece".

É a única cena sem caos e sem prazo apertado. Ela existe pra estabelecer o vocabulário (Desejado ↔ Real, reconciler tick visível) antes que qualquer mecânica adversa entre em jogo.

### Cenário provável

Jogador lê o briefing, hesita um instante achando que vai precisar configurar algo, arrasta o `📦 Pod` pro Desejado. No próximo tick (≤ 1s) um pod nasce num node aleatório. Partículas verdes começam a cair. Aos 15s o tráfego dobra de 0.3 pra 0.6 req/s — ainda muito abaixo dos 5 req/s que um pod aguenta, então o uptime fica em 100%. Cena passa.

Se o jogador não declarou nada, o tráfego entra e não acha pod nenhum — partículas vermelhas. O `outroFailed` lembra: *K8s não age sozinho*.

### Como vencer

1 Pod no Desejado, antes ou durante a cena. Pronto.

### Aha pedagógico

Você não pediu "crie um pod"; disse "isso deve existir", e o cluster materializou. Esse é o modelo declarativo — em condições calmas.

---

## Cena 2 — O plantonista

**Modo:** Reativo (única do tutorial)
**Peças:** 📦 Pod
**Tráfego:** 1 req/s constante
**Duração:** 60s

### Conceito K8s

Pod solto é one-shot: ninguém recria quando ele morre.

### O que a cena quer demonstrar

A lição negativa. Deployment ainda **não** está disponível — propositalmente — pra que o jogador *sinta falta dele*. Em 60s morrem 7 pods (`killRandomPod` aos 10s, 18s, 26s, 34s, 42s, 50s, 58s). Pra sobreviver, o jogador precisa redeclarar manualmente toda vez. É o "controller humano" — e a cena tá tunada pra que esse trabalho seja insustentável.

A separação Cena 2 → Cena 3 é deliberada (DESIGN.md): só introduzir o Deployment depois que o jogador *quiser* o Deployment.

### Cenário provável

Jogador arrasta `📦 Pod`, pod nasce, tráfego flui. Aos 10s — 💀. Pod some. Tráfego despenca. Jogador entra em pânico, arrasta outro Pod. Funciona de novo por uns segundos. Aos 18s — 💀 de novo. Daqui pra frente é uma corrida: cada 8 segundos a narrativa solta uma frase irritada (*"Olha, isso aqui não tem hora pra parar"*), e o jogador percebe que tá fazendo na unha um trabalho que devia ser automatizado. Se piscar por mais de 5s seguidos, perde.

### Como vencer

Re-arrastar Pod toda vez que um morrer, sem deixar passar 5s de downtime. Não há atalho — a cena exige ação contínua.

### Aha pedagógico

Você foi o controller — na mão. *Não escala.* Tem que existir uma peça que faça isso por você.

---

## Cena 3 — O bug intermitente

**Modo:** Pré-declarado
**Peças:** 📦 Pod, 📋 Deployment
**Tráfego:** 1 req/s constante
**Duração:** 60s

### Conceito K8s

Deployment é o controller: declara `replicas: N` e o cluster mantém esse número, recriando pods que morrerem.

### O que a cena quer demonstrar

A solução do problema da Cena 2. Mesmo padrão de kills (3 mortes em 60s, aos 22s, 38s, 52s — mais espaçadas que na Cena 2 pra dar tempo de notar a recriação automática), mas agora o jogador tem `📋 Deployment` na palette. Se ele usar Pod solto de novo, o problema volta. Se usar Deployment, ele descobre o alívio: cada kill é seguido por uma recriação automática no próximo tick.

### Cenário provável

Jogador, marcado pela Cena 2, arrasta o `📋 Deployment` na hora — talvez com `replicas: 3` pra ter folga. Aos 22s morre um pod. Antes que ele consiga reagir, o card do Deployment pulsa azul, o reconciler age e um pod novo nasce. Ele percebe: *na verdade*, ele só precisa declarar uma vez. Resto da cena passa sem tocar em nada — o tráfego flui, pods morrem, pods renascem.

Se insistir em Pod solto, repete a Cena 2 sem o socorro do Deployment.

### Como vencer

`📋 Deployment` com `replicas ≥ 1` no Desejado. Service ainda não é necessário (tráfego sticky cai em um pod e o Deployment recria — funciona, ainda que precariamente; é exatamente isso que a Cena 4 vai quebrar).

### Aha pedagógico

O Deployment faz o trabalho do plantonista por você, *pra sempre*. Você declara N réplicas; ele segura o número.

---

## Cena 4 — O endereço que muda

**Modo:** Pré-declarado
**Peças:** 📦 Pod, 📋 Deployment, 🧲 Service
**Tráfego:** 1.5 req/s constante
**Duração:** 60s

### Conceito K8s

Service é a indireção: endereço estável na frente de pods cujo IP muda toda vez que eles renascem.

### O que a cena quer demonstrar

Por que Deployment sozinho não basta. O tráfego sem Service é **sticky**: a primeira request elege UM pod (`stickyTargetPodId` em `traffic.ts`) e gruda nele. Os eventos da cena usam `killStickyPod` (não `killRandomPod`) — matam *especificamente* o pod ao qual o tráfego tá amarrado. Deployment recria, mas o tráfego continua mirando o IP morto: silêncio.

Service muda essa regra: com Service no Desejado, cada request escolhe aleatoriamente entre pods vivos. Pod morre → recria com IP novo → Service inclui o novo no pool automaticamente.

### Cenário provável

Jogador chega vindo da Cena 3 confiante: `📋 Deployment ×3` resolve tudo, certo? Tráfego começa a fluir num pod só (sticky). Aos 10s — 💀, o sticky morre. Deployment recria. Mas a partícula vermelha continua caindo — o tráfego não acha ninguém. *Na verdade*, sem Service, o cliente conhece um IP só, não importa quantos pods o Deployment criou. Jogador puxa `🧲 Service` no susto. A próxima request elege um pod vivo do pool e o uptime volta. Daí pra frente, kills no sticky são absorvidos automaticamente.

### Como vencer

`📋 Deployment ×3` + `🧲 Service`. Sem o Service, falha mesmo com pods sobrando.

### Aha pedagógico

Pods são gado: nascem com IP novo toda vez. *Sem Service*, recriar é inútil — quem fala com eles? Service é a recepção fixa do prédio.

---

## Cena 5 — Datacenter pegou fogo

**Modo:** Pré-declarado
**Peças:** 📦 Pod, 📋 Deployment, 🧲 Service
**Tráfego:** 2 req/s constante
**Duração:** 60s
**Capacity apertada:** `{ ram: 1, cpu: 0.5 }` por node (≈ 2 pods por node)

### Conceito K8s

Desacoplamento Pod ↔ Node, e o papel da capacity. Pods são realocáveis; o cluster aguenta perder máquina.

### O que a cena quer demonstrar

Stack completo (Deployment + Service) agora num cenário com falha de infra, não só falha de pod. Aos 20s e 40s caem nodes inteiros (`killRandomNode`). Pods que estavam neles evaporam junto. O reconciler nota o gap e recria em nodes vivos — *se houver capacity*. Como a capacity é apertada (1 GB/0.5 cpu por node = só 2 pods cada), no final da cena sobra 1 node com slots pra 2 pods, e qualquer excedente vira `pending` na tray amarela.

A cena conecta dois conceitos: resiliência (Deployment recria em qualquer node disponível) e limite físico (cluster não cria hardware sozinho).

### Cenário provável

Jogador entra com `📋 Deployment ×3 + 🧲 Service` da Cena 4. Tudo certo até os 20s — ⚡, um node vai pro chão. Os pods que estavam nele somem. Reconciler nos próximos ticks recria em nodes vivos. Service aponta pros novos. Aos 40s — ⚡, outro node. Agora só sobra 1 com 2 slots. O terceiro pod fica `pending` na tray amarela. Mas 2 pods rodando aguentam 2 req/s tranquilamente (cada um aguenta 5), então o site não cai. Vitória.

Quem entrou só com `📦 Pod` solto perdeu na primeira queda de node — não tem quem recrie. Quem entrou com Deployment mas sem Service repete o problema da Cena 4.

### Como vencer

`📋 Deployment ×3 + 🧲 Service`. Réplicas demais (ex: ×5) saturam capacity e enchem o pending tray sem ajudar.

### Aha pedagógico

Pod não é amarrado ao node; node não é amarrado ao pod. Desacoplamento é resiliência — *desde que* você declare o stack inteiro e tenha capacity sobrando.

---

## Cena 6 — Versão nova, sem queda

**Modo:** Híbrido (botão 🚀)
**Peças:** 📦 Pod, 📋 Deployment, 🧲 Service
**Tráfego:** 1.5 req/s constante
**Duração:** 60s
**Visual:** `showReplicaSets: true` — banner mostra rs-v1 → rs-v2

### Conceito K8s

Rolling update: dois ReplicaSets convivem durante a transição, soma de pods saudáveis nunca chega a zero.

### O que a cena quer demonstrar

Que deploy de versão nova não precisa ter downtime. Por baixo do Deployment, o reconciler (com `MAX_SURGE = 1`, `maxUnavailable = 0`) faz uma troca por tick: sobe um pod v2, espera, derruba um v1, repete. Service aponta pra ambos durante a transição porque o selector casa com a etiqueta do Deployment (e os dois ReplicaSets carregam essa etiqueta).

É a única cena com modo Híbrido: o jogador configura antes, mas precisa clicar `🚀` no card do Deployment aos 20s quando o evento `offerUpgrade` libera o botão. É também a única com banner de ReplicaSet visível — em todas as outras cenas eles existem internamente mas o jogo não os exibe.

### Cenário provável

Jogador entra com `📋 Deployment ×3 (v1) + 🧲 Service`. Pods verdes 🟢 nascem, tráfego flui. Aos 20s aparece o botão `🚀 atualizar v1→v2` no card do Deployment. Clica. No banner acima do cluster: `rs-v1 ×3 → rs-v2 ×0`. Próximo tick: `rs-v1 ×3 → rs-v2 ×1` (sobe um pod azul 🔵). Próximo: `rs-v1 ×2 → rs-v2 ×1` (derruba um v1). E assim sucessivamente até `rs-v1 ×0 → rs-v2 ×3`. Em momento nenhum o total de pods rodando bateu zero. Service continuou roteando o tempo todo.

Se faltar Deployment, não tem rolling update — Pod solto não tem ReplicaSet. Se faltar Service, tráfego fica sticky num v1 que vai ser derrubado.

### Como vencer

`📋 Deployment ×3 (v1) + 🧲 Service`, clicar `🚀` quando aparecer aos 20s.

### Aha pedagógico

Dois ReplicaSets coexistem por alguns segundos: um descendo, outro subindo. *Você nunca fica sem ninguém atendendo.* Deploy sem queda é o pão com manteiga do K8s.

---

## Cena 7 — A etiqueta que casa

**Modo:** Pré-declarado
**Peças:** 📦 Pod, 📋 Deployment, 🧲 Service
**Tráfego:** 1.5 req/s constante
**Duração:** 60s
**Visual:** `showLabels: true` — etiquetas visíveis nas peças

### Conceito K8s

Label selector: a cola entre Service e Pod é texto, não referência. Pod solto é anônimo (`label: null`).

### O que a cena quer demonstrar

Que Service e Deployment não se conhecem — nunca se referenciam diretamente. O que faz um achar o outro é uma etiqueta (`label`) idêntica nos dois lados. Até a Cena 6 isso ficou escondido (Service era "mágico" e roteava pra qualquer pod). Agora as etiquetas aparecem na UI, e o tráfego com Service filtra pods por `pod.label === service.selector` (em `traffic.ts`, dentro do branch `scene.showLabels`).

Detalhe crítico do `reconciler.ts`: Deployment carimba `deployment.label` em todo pod que cria. Pod solto vai pra `manifestStandalonePod` que cria com `label: null`. *Anônimo.*

### Cenário provável

Jogador declara `📦 Pod` solto + `🧲 Service` achando que basta tudo estar declarado. Pod nasce vivo no Real. Service aponta. Mas o tráfego falha — partículas vermelhas. *Na verdade*, o Service tem selector `app:web`, e o pod solto não tem etiqueta nenhuma (porque pod solto não vem de template). O Service o ignora silenciosamente. Aí está: por isso existe Deployment — ele carimba a etiqueta nos pods que cria.

Jogador troca pra `📋 Deployment + 🧲 Service`. Pods nascem com a etiqueta correta, Service os reconhece, tráfego flui.

### Como vencer

`📋 Deployment ×N + 🧲 Service`. Pod solto + Service falha silenciosamente.

### Aha pedagógico

Service e Deployment nunca se referenciam. A etiqueta é a cola — e ela só existe nos pods que vieram de um template. *Pod solto é anônimo.*

---

## Cena 8 — A etiqueta certa

**Modo:** Pré-declarado
**Peças:** 📦 Pod, 📋 Deployment, 🧲 Service (×2 variantes: `app:web` e `app:db`)
**Tráfego:** 1.5 req/s constante
**Duração:** 60s
**Visual:** `showLabels: true`, `serviceVariants: ['app:web', 'app:db']`

### Conceito K8s

Etiqueta é texto livre. Selector errado = Service não enxerga os pods, mesmo que estejam rodando.

### O que a cena quer demonstrar

A continuação da Cena 7: agora que o jogador entendeu *que* existe uma etiqueta, ele precisa entender que ela é só texto. Em K8s real, `app:web`, `app:loja`, `tier:frontend`, `env:prod` — você escolhe. Aqui o Deployment vem fixado em `app:web`, mas a palette oferece **dois** Services, um com selector `app:web` e outro com `app:db`. Visualmente parecidos; só o texto distingue.

A cena é uma checagem: o jogador olha as etiquetas antes de declarar? Ou puxa o primeiro Service que enxerga?

### Cenário provável

Jogador, confiante depois da Cena 7, declara `📋 Deployment + 🧲 Service` — mas escolhe o `app:db` por descuido. Pods nascem com `app:web`. Service procura pods `app:db`. Não acha nenhum. Tráfego falha, mesmo com cluster cheio de pods saudáveis. *Aha:* o Service literalmente não enxerga os pods. Jogador troca o Service pelo `app:web` e o tráfego volta na hora.

### Como vencer

`📋 Deployment + 🧲 Service (app:web)`. O Service `app:db` é uma armadilha proposital.

### Aha pedagógico

Texto idêntico ou nada. Se mudar o texto de um lado, *tem que mudar do outro.* Service e Deployment não se referenciam — só a etiqueta combina.

---

## Cena 9 — Mais gente do que eu esperava

**Modo:** Pré-declarado
**Peças:** 📦 Pod, 📋 Deployment, 🧲 Service
**Tráfego:** 2 → 8 → 15 req/s (sobe aos 20s e 40s)
**Duração:** 60s
**Critério especial:** `failBelowUptime: 85` — uptime na janela móvel de 10s cair abaixo de 85% por 5s seguidos = falha

### Conceito K8s

Horizontal scaling: replicas escalam capacidade. Cada pod aguenta 5 req/s; cluster aguenta `replicas × 5` — *desde que* Service distribua.

### O que a cena quer demonstrar

A matemática da escala. Tráfego sobe em três degraus: 2 req/s (1 pod basta), 8 req/s (precisa de 2 pods), 15 req/s (precisa de 3 pods). Diferente das cenas anteriores onde "site não pode ficar caído por 5s" era forgiving, aqui é mais apertado: se mais de 15% das requests falharem por 5s seguidos (`failBelowUptime: 85`), a cena perde. Saturação de pod (acima de 5 req/s, requests viram vermelhas) conta como falha.

A cena também é o cruzamento das lições anteriores: replicas só ajudam *com* Service distribuindo. Sem Service, sticky tranca tudo num pod só (5 req/s teto), e o jogador descobre que escalar e indireção são duas faces do mesmo problema.

### Cenário provável

Jogador declara `📋 Deployment ×3 + 🧲 Service`. Fase 1 (2 req/s) tranquila. Fase 2 (8 req/s) cada pod fica em ~2.7 req/s, ainda confortável. Fase 3 (15 req/s) cada pod fica em 5 — no limite, mas não estoura. Sobreviveu. *Ele acabou de fazer o trabalho do HPA na unha.*

Cenário do "quase certo": jogador declarou `📋 Deployment ×3` mas removeu o pod solto inicial e esqueceu o `🧲 Service`. Sticky pod do tráfego ainda aponta pro pod solto morto — todos requests falham. Mesmo que ele coloque Service depois, a capacity efetiva sem Service distribuindo seria de 5 req/s (1 pod sticky) — quando o tráfego pular pra 15 req/s, 10 viram vermelho e o uptime despenca abaixo de 85%.

Cenário do subestimou: `📋 Deployment ×2 + 🧲 Service` aguenta até a fase 2 (8 req/s ÷ 2 = 4 req/s por pod), mas na fase 3 satura — 15 ÷ 2 = 7.5 req/s por pod, acima de 5. Vermelho. Falha.

### Como vencer

`📋 Deployment ×3 (ou mais) + 🧲 Service`. A conta é: `replicas ≥ ⌈ rps_máximo / 5 ⌉ = ⌈15/5⌉ = 3`.

### Aha pedagógico

Replicas = capacidade. Adicionar pods adiciona vazão *linearmente*, mas só com Service distribuindo. Em K8s real, é o HPA que faz essa conta sozinho — você acabou de fazer o trabalho dele na mão.

---

## Apêndice — modos de cena (referência rápida)

| Modo | Cenas | O que exige do jogador em runtime |
|---|---|---|
| Reativo | 2 | Ação contínua. Sem agir, falha. Lição negativa. |
| Híbrido | 6 | Configuração prévia + um clique pontual (🚀 aos 20s). |
| Pré-declarado | 1, 3, 4, 5, 7, 8, 9 | Configurou antes; pode observar. Desejado segue editável. |
| Selado | — | (Mecânica catalogada no DESIGN.md, sem cena ainda.) |

Ordem do mais ao menos exigente em runtime: Reativo → Híbrido → Pré-declarado → Selado.
