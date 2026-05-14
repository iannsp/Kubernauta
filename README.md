# Kubernauta

> Um jogo para aprender Kubernetes uma camada por vez — do encaixe visual à configuração real.

Serious game de browser para treinamento em Kubernetes. Você arrasta peças (Pod, Deployment, Service...) para declarar o estado desejado e observa o cluster reconciliar a realidade. Cada cena introduz um conceito quando ele faz falta, sempre fazendo o jogador viver o problema antes de receber a solução.

## Como rodar

Requer Node 25+ (Vite 8 depende de `node:util.styleText`).

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173/`. Para acesso na rede local: `npm run dev -- --host`.

## Status

Em desenvolvimento. 9 cenas jogáveis + tutorial inicial.

- Design e princípios pedagógicos: [`DESIGN.md`](./DESIGN.md)
- Guia didático por cena: [`CENAS.md`](./CENAS.md)
