# Marca

Feita na F1. Vive em `public/marca/` e usa-se por `src/components/marca.tsx`.

## O que estava lá antes

`public/images/logo-icon.svg` tinha **636 kB** e não era um vetor. Eram três
`<rect>` preenchidos com PNG em base64 — uma imagem com fantasia de SVG. Ao
lado estavam `logo-icon.png` e `logo-text.png`, com **2,1 MB cada**. O ficheiro
de 636 kB era carregado no cabeçalho de **todas as páginas**, e outra vez no
rodapé.

| | antes | agora |
|---|---|---|
| Símbolo | 636 kB (raster disfarçado) | **1,6 kB** de geometria |
| Lettering | incluído no mesmo ficheiro | **26 kB**, servido e cacheado à parte |
| Ficheiros órfãos | 4,2 MB | removidos |

## O símbolo

Redesenhado como geometria. Três prismas hexagonais de quartzo rosa a sair de
duas pétalas, gerados por `scripts/` a partir de três medidas por prisma: eixo,
meia-largura e alturas. Assim as facetas fecham sempre sem folgas.

Três decisões:

**A luz vem toda do mesmo lado**, superior direito. A faceta esquerda fica em
sombra, a central em meio-tom, a direita apanha o claro, e a faceta direita da
terminação apanha o brilho. No original cada cristal tinha o seu próprio
gradiente, o que é o que um gerador de imagens faz e um desenhador não.

**Os prismas laterais inclinam-se**, não só no ápice mas no corpo todo, em
torno da base. Sem isso ficam três colunas a prumo e o conjunto lê-se como uma
muralha, não como um aglomerado de cristais.

**As pétalas ficam à frente**, e comem a base dos cristais. É essa sobreposição
que faz os cristais nascerem da flor em vez de assentarem nela — e de caminho
esconde a linha reta onde as bases acabam.

### Variantes

- `Simbolo` — os três cristais. Acima de 32 px
- `SimboloCompacto` — um cristal, mais largo, com as duas pétalas. Abaixo disso
  os três viram uma mancha. É a mesma ideia com menos informação, não outro
  desenho
- `Logotipo` — a assinatura horizontal, símbolo mais lettering

## As cores não são tokens

São as medidas no logótipo original e estão escritas à mão no componente. A
marca tem de se manter igual mesmo que a paleta do site mude. A paleta do site
é que foi derivada da marca (ver `PALETA.md`), não o contrário.

## O lettering, e o que falta decidir

Não existe ficheiro vetorial original. A única fonte é um raster de 1536×1024
onde o lettering ocupa **831×118 px** — e não há nada maior em lado nenhum do
repositório. O que está em `wordmark.svg` é um traçado (`potrace`) sobre esse
raster, a 4× com suavização.

**A essa resolução o traçado sai com os contornos ondulados.** No cabeçalho, a
uns 130 px de largura, não se nota. Na imagem de partilha, a 640 px, nota-se.

Testei se o lettering era alguma fonte conhecida, comparando a silhueta
normalizada contra seis scripts monolineares (Pacifico, Grand Hotel, Yellowtail,
Kaushan Script, Satisfy, Courgette). O melhor IoU foi **0,31** e nenhuma acertou
sequer na proporção — o original tem rácio 7,04 e a mais próxima, Courgette,
6,74. Não é nenhuma delas: é um desenho gerado, como o resto do repositório.

Ficam duas saídas, e a escolha é do negócio:

1. **Manter o traçado.** As letras ficam exatamente as que a marca já tem. O
   custo é a ondulação em usos grandes
2. **Redesenhar as letras**, à mão ou sobre um script existente. Fica limpo a
   qualquer tamanho, mas as letras mudam

Por omissão está a 1, porque trocar as letras da marca não é uma decisão de
engenharia.

## Não é JSX

O lettering entra por `mask-image`, não por SVG embutido. Embutido, os 26 kB de
coordenadas iam parar ao *bundle* de JavaScript de todas as páginas — mediu-se,
eram **+11 kB de First Load JS**. Como máscara é um ficheiro estático, servido e
cacheado uma vez, e a cor continua a ser nossa porque é o fundo do elemento que
pinta o desenho.

## Favicon e partilha

- `src/app/icon.svg` — o símbolo compacto sobre um quadrado de ameixa com cantos
  arredondados. O fundo é preciso: o rosa claro desaparece em separadores claros
- `src/app/opengraph-image.png` — gerada por `npm run marca:og`, não desenhada em
  cada pedido, porque não muda entre pedidos. Sem assinatura por baixo da marca:
  qualquer frase ali é uma afirmação comercial, e isso decide-se na F9

## Tipografia

Continua Playfair Display e Inter. **Ainda não é a decisão final.** O par
definitivo escolhe-se contra o lettering depois de resolvido o ponto acima —
escolher agora seria escolher contra um desenho que pode mudar.
