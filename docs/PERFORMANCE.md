# Performance

F14, feita em 22/09/2026.

## A fase começou por desmentir a fase

Andei a repetir, em três PRs seguidos, que "as imagens continuam JPEG com
extensão `.png`, ~450 kB cada". **Nunca tinha medido.** Quando medi:

| | |
|---|---|
| No repositório | 3,7 MB, oito ficheiros a 2048×1152 |
| Entregue ao browser | **582 kB** em duas páginas, já em WebP e redimensionado |

O otimizador do Next estava a funcionar. O browser recebia 15–26 kB nos
cartões e 134–183 kB nos heros — não 450 kB. Os 3,7 MB são tamanho de
repositório, não de entrega.

Segunda medição, mesma lição: o lettering da marca ocupa 25 kB no disco, mas
**10 kB comprimido na rede** e fica em cache. Também não valia a pena tocar.

Fica registado porque é a segunda vez neste projeto que medir muda a decisão,
e desta vez o que mudou foi descobrir que o problema era mais pequeno do que
eu andava a dizer.

## O que sobrou, e valeu

**Qualidade de 90 para 82.** Não é um palpite:

| Qualidade | Hero | PSNR vs q=95 |
|---|---|---|
| 90 | 124 kB | 44,7 dB |
| **82** | **74 kB** | **42,4 dB** |
| 75 | 53 kB | 40,6 dB |

Acima de 40 dB a diferença considera-se impercetível. Vi também a 100% numa
face de cristal: q=90 e q=82 não se distinguem; q=75 começa a perder textura
mineral — e numa loja de pedras a textura é o produto.

**`sizes` em oito imagens que não o tinham.** Sem `sizes`, uma imagem com
`fill` assume `100vw`: a miniatura de 80 px no painel do carrinho pedia a
imagem a 1920 px. Cada valor sai da largura a que a imagem é mesmo mostrada.

## Resultado

| | antes | depois |
|---|---|---|
| Desktop, duas páginas | 582 kB | **287 kB** |
| Telemóvel | — | **121 kB** |

## Um erro que só a medição apanhou

Ao baixar a qualidade no `next.config.js`, **os dois heros deixaram de
carregar**. `images.qualities` é uma **lista de permissões**: `Hero.tsx` e a
página inicial tinham `quality={90}` escrito à mão, e pedir 90 quando só 82 é
permitido faz o otimizador recusar o pedido.

Não apareceu no build, não apareceu no typecheck, não apareceu no lint. Só
apareceu por ter havido uma medição depois da alteração — e a primeira leitura
dessa medição até parecia boa, porque menos imagens carregadas dá menos bytes.

Há agora um teste que falha se `quality` voltar a ser escrito numa página.

## A rede

| Teste | Falha quando |
|---|---|
| `imagens.test.ts` | uma imagem com `fill` perde o `sizes`, `quality` reaparece numa página, ou a qualidade sai do intervalo medido |
| `e2e/interface.spec.ts` | a página inicial passa dos 420 kB de imagens, ou fica alguma por carregar |

O limite de 420 kB é generoso de propósito: serve para apanhar uma regressão
grande, não para discutir kilobytes.

## O que não foi feito, e porquê

**Converter as imagens de origem para WebP.** O ganho seria tamanho de
repositório, e mesmo esse é ilusório — os blobs antigos ficam no histórico do
git. Os bytes entregues não mudavam, porque o Next recodifica na mesma.

**Corrigir a extensão.** Os ficheiros são JPEG chamados `.png`, o que faz o
servidor anunciar `image/png` num JPEG. Nunca são pedidos diretamente — passam
todos pelo otimizador — por isso é uma incorreção sem consequência prática.
Verificou-se também que o `X-Content-Type-Options: nosniff` acrescentado na
F11 não as parte: os browsers continuam a inferir o tipo de imagens.

Ambas ficam registadas como dívida cosmética, não como trabalho adiado.

## O `loading.tsx` por rota: medido, e não se faz

O `src/app/loading.tsx` estava marcado «Provisório. Ganha esqueletos por
página na F10». A F10 foi entregue sem eles. Antes de os escrever, mediu-se
se chegavam a ser vistos.

**Método.** Servidor de produção, três navegações `next/link` reais a
400 kbit/s com 800 ms de latência (throttling por CDP), e um
`MutationObserver` a registar todas as vezes que o bloco entrasse no DOM.

**Resultado: zero aparições.**

Todas as páginas são `'use client'` com `fetch` dentro de um `useEffect`, e
estão pré-renderizadas estaticamente (`○` na saída do `build`). O Next
pré-carrega o payload quando a ligação entra no ecrã, por isso no momento do
clique não há nada que suspenda. A espera real é a do `fetch`, que acontece
*depois* de a página renderizar — e essa é tratada dentro de cada página.

Escrever `loading.tsx` por rota seria, hoje, código morto.

Não se apaga o da raiz: volta a contar no dia em que uma página passar a
componente de servidor com dados assíncronos — que é para onde a F15 tem de
ir, porque o JSON-LD precisa dos dados no HTML servido.

**Nota de método, para não se repetir.** A primeira versão desta medição
estava errada: criava um `<a>` normal em vez de usar uma ligação do
`next/link`, e um `<a>` força navegação completa, onde o `loading.tsx` nunca
entra. O número certo só apareceu depois de a sonda ser corrigida — o
primeiro resultado teria dado a mesma conclusão pela razão errada.
