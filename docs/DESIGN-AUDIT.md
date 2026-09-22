# Auditoria de Design - Pétalas de Sonho

> Estado analisado: commit `2709721` (branch `claude/dreamy-planck-d4zdp1`).
> Âmbito: **só design**. Nenhum ficheiro de código foi alterado nesta fase.
> Método: varrimento integral do repo + skills de design (`redesign-existing-projects`,
> `design-taste-frontend`, `ui-ux-pro-max`).
>
> **Correção (2026-09-22):** as contagens de uso de classe na secção 3.1 foram
> revistas. A primeira medição contava também nomes de variáveis com o mesmo texto
> (`loading`, por exemplo). Os números abaixo são contagens de `className` reais.
>
> **Correção (2026-09-22):** a secção 5.2 dizia que o drawer do carrinho nunca abre.
> Estava errado: abre ao adicionar um produto. O que não funciona é o ícone do
> header. Texto corrigido.

---

## 0. Leitura do projeto

**Lido como:** loja de e-commerce de nicho (cristais e minerais) para um público
português adulto que compra por confiança e por afinidade estética, com linguagem
atual de "luxo espiritual" - e que, tal como está, aterra no genérico de template.

**Modo de intervenção:** *redesign - overhaul visual, com preservação total de
conteúdo, rotas e arquitetura de informação.* Nada de mexer em slugs, labels de
navegação ou copy de fundo sem decisão explícita.

**Dials propostos** (escala 1-10, vocabulário da skill `design-taste-frontend`):

| Dial | Atual (inferido) | Proposto | Porquê |
|---|---|---|---|
| `DESIGN_VARIANCE` | 3 | **7** | Tudo centrado e simétrico. Precisa de assimetria controlada, não de caos. |
| `MOTION_INTENSITY` | 6 (mal usado) | **4** | Há movimento a mais e sem intenção. Menos gestos, melhor executados. |
| `VISUAL_DENSITY` | 5 | **3** | Loja de peças únicas pede respiração, não grelhas apertadas. |

---

## 1. Veredicto

O site não está mal desenhado por falta de gosto. Está mal desenhado por **três
causas mecânicas**, e todas elas têm arranjo:

1. **Metade do sistema de design nunca chega ao browser.** O ficheiro
   `src/styles/globals.css` (207 linhas: botões, container, transições, sombras,
   animações) **nunca é importado**. Cerca de 120 usos de classe no JSX não fazem
   absolutamente nada.
2. **Existem dois sites com o mesmo header.** Uma home preta-azulada com roxo néon,
   e uma loja/catálogo creme com roxo-e-dourado. São duas marcas diferentes coladas.
3. **Não existem tokens.** 18 hexadecimais hardcoded e ~40 tokens Tailwind soltos
   espalhados por 20 ficheiros. Sem fonte de verdade, cada página inventa a sua.

A "cara de IA" de que falas é o sintoma. A causa é esta. Se se atacar só o sintoma
(trocar roxo por outra cor), volta tudo em duas semanas.

---

## 2. Porque é que "berra IA": as impressões digitais, com provas

Cada linha foi verificada no código, não é impressão.

| # | Padrão | Onde | Prova | Porque denuncia |
|---|---|---|---|---|
| 1 | **Roxo/azul como tinta universal** | todo o site | `#4a1e5c` aparece **130 vezes** | O "AI purple" é a assinatura nº1 de interface gerada. Não é a cor, é o facto de estar em *tudo*: títulos, ícones, preços, bordas, focus, hovers. |
| 2 | **Glow roxo à volta dos blocos** | `page.tsx` | `shadow-purple-900/20` (x4), `hover:shadow-purple-500/30`, um `<div>` comentado `{/* Subtle glow effect */}` | Néon exterior sem fonte de luz. Nenhum objeto físico brilha assim. |
| 3 | **Três cartões iguais em fila** | home, catálogo, sobre-nós, loja | 4 secções com `grid sm:grid-cols-2 lg:grid-cols-3` e conteúdo simétrico | O layout mais previsível que existe. Aparece **quatro vezes** no mesmo site. |
| 4 | **Emoji dentro de círculo roxo a 10%** | loja, catálogo, sobre-nós | `🔒 🚚 ↩️ 💬 ✨ 🎁 💝 🔍 🌱 📍 📧 📞 🕐 ✅ ❌ ✓ ✦` | Emoji como ícone. Renderiza diferente em cada SO, não herda a cor da marca, e o círculo-tinta-10% é o cliché exato de landing gerada. |
| 5 | **`hover:scale` como gesto único** | global | `hover:scale-105` (x5), `hover:scale-110` (x4), `group-hover:scale-110` em imagens, `hover:-translate-y-1` | Tudo reage da mesma maneira: incha. Um cartão, um botão e uma fotografia são materiais diferentes e deviam responder de forma diferente. |
| 6 | **Gradiente diagonal roxo na secção CTA** | `page.tsx` | `bg-gradient-to-br from-[#000414] via-[#3a1650] to-[#1a0b2e]` | Gradiente linear a 135°, três paragens, roxo para azul. É literalmente o preset. |
| 7 | **Par botão-cheio + botão-fantasma** | home, carrinho, produto | pill branco `rounded-full` + outline branco, sempre lado a lado | Sempre dois CTAs com o mesmo peso visual. Não há hierarquia, há simetria. |
| 8 | **Ícone em círculo gradiente por cima do título** | login, registo | `w-20 h-20 ... bg-gradient-to-r from-[#4a1e5c] to-[#6b2d7f] rounded-full` com `<LogIn/>` dentro | O cabeçalho de página de autenticação gerado por IA, tal e qual. |
| 9 | **Lucide em todo o lado** | 10 ficheiros | `lucide-react` em todos os componentes com ícones | Biblioteca de ícones por omissão da IA. Reconhecível à distância. |
| 10 | **Um único raio de canto para tudo** | global | `rounded-lg` x69, `rounded-full` x27, `rounded-xl` x4 | Cartões, inputs, badges, botões, thumbnails: todos com o mesmo canto. Sem sistema de forma. |
| 11 | **Copy de gerador** | global | "jornada espiritual" x5, "Descubra pedras preciosas e cristais" x3, "cuidadosamente selecionada", "Bem-vindo de volta" | Frases que não dizem nada de específico sobre esta loja. Qualquer loja de cristais podia usá-las. |
| 12 | **Números e contactos de placeholder** | footer, sobre-nós | `+351 xxx xxx xxx`, `tel:+351000000000` | Em produção. |

---

## 3. Causas estruturais (o que tem de ser resolvido primeiro)

### 3.1 O sistema de design nunca é carregado 🔴

`src/app/layout.tsx:3` importa `./globals.css`. Mais nada importa
`src/styles/globals.css`. Logo, **nada disto existe no browser**:

| Classe no JSX | Usos | O que devia fazer | O que faz hoje |
|---|---|---|---|
| `transition-smooth` | **51** | transição 300ms cubic-bezier | nada: todos os hovers são instantâneos |
| `container-custom` | **20** | max-width + padding responsivo | nada: o conteúdo cola-se às margens e estica até à borda do ecrã |
| `shadow-soft` | **20** | elevação subtil | nada: cartões brancos sobre fundo creme, sem separação |
| `btn-primary` | **14** | botão gradiente, pill, 1rem 2rem | nada: **os CTAs principais são texto azul sublinhado** |
| `loading` | 2 | pulsar de carregamento | nada: `<div class="loading"></div>` é uma div sem dimensões, invisível de qualquer forma |
| `btn-secondary` | 4 | botão outline | nada |
| `shadow-medium` / `shadow-strong` | 4 / 2 | elevação média/alta | nada |
| `fade-in` | 2 | entrada 0.6s | nada |
| `overlay-dark` | 0 | overlay 40% | classe definida e nunca usada |

Consequência prática: **"Finalizar Compra" no carrinho, "Adicionar ao Carrinho" na
página de produto, "Criar Conta" e "Entrar" são neste momento links de texto por
estilizar.** O botão mais importante da loja não parece um botão.

Também morrem aqui: `font-family: Playfair Display` nos `h1..h6`, o
`*:focus-visible` com outline dourado (ou seja, **o site não tem indicador de foco
de teclado em links e botões**), o `scroll-behavior: smooth` e o reset `* { margin: 0 }`.

### 3.2 Dois temas em guerra 🔴

| Superfície | Fundo | Texto | Acento |
|---|---|---|---|
| Header / Footer | `#000414` quase-preto azulado | branco | dourado `#d4af37` |
| Home | `#000414` | branco | `text-purple-300` (roxo Tailwind) |
| Loja, catálogo, produto, carrinho, login, registo, área pessoal | `#faf8f5` creme | `#2c2c2c` | `#4a1e5c` roxo + `#d4af37` dourado |
| `categoryCard.tsx` | branco | `text-gray-800` | **`text-pink-500`** |
| `orderSummary.tsx` | branco | preto | **`bg-pink-500`** |
| `adminHeader.tsx` | `bg-gray-800` | branco | nenhum |
| `sucesso` / `falha` | nenhum (sem layout) | verde / vermelho | nenhum |

São **sete** linguagens visuais. A regra `Page Theme Lock` da skill é explícita: uma
página tem um tema. Aqui, atravessar da home para a loja é mudar de website, com o
mesmo header preto pendurado por cima de um corpo creme.

### 3.3 Tipografia: a fonte de marca é descarregada e nunca usada 🟠

`layout.tsx` carrega **Playfair Display** via `next/font` e expõe `--font-playfair`.
Nada no projeto usa essa variável. `tailwind.config.js` tem `theme.extend: {}` vazio,
por isso `font-serif` (usado **38 vezes**) resolve para o serif por omissão do
Tailwind: Georgia / Times. Todos os títulos "elegantes" do site são **Georgia**.

Em paralelo, `src/app/globals.css` referencia `--font-geist-sans` e `--font-geist-mono`,
que nunca são carregados, dentro de um bloco `@theme inline` que é sintaxe de
**Tailwind v4** num projeto que corre **Tailwind v3.4**. O bloco é ignorado por completo.

### 3.4 Build de CSS ambíguo 🟠

Coexistem `postcss.config.js` (plugin `tailwindcss`, v3) e `postcss.config.mjs`
(plugin `@tailwindcss/postcss`, v4). O `package.json` tem `tailwindcss@^3.4.18` em
devDependencies **e** `@tailwindcss/postcss@^4.1.14` em dependencies. Uma das duas
configurações está a ser silenciosamente ignorada e o comportamento pode mudar entre
máquinas. Tem de ficar só uma.

### 3.5 Logótipo: um SVG que não é um SVG 🟠

`public/images/logo-icon.svg` tem **622 KB** e contém **duas imagens raster em
base64** dentro de `<pattern>`. Não é vetor: não escala, não muda de cor, não serve
para favicon nem para versão monocromática.

Pior, é geometricamente incompatível com onde está colocado:

- ficheiro: `1683 × 466` (rácio 3.6:1, é um **lockup horizontal com texto**)
- caixa no header: `w-32 h-32` = `128 × 128` com `object-contain`
- resultado: renderiza a `128 × 35`, com ~46px de vazio transparente em cima e em baixo
- a caixa de 128px está dentro de uma barra de `h-16` (64px): **transborda o header em 64px**

O mesmo acontece no footer com `w-36 h-36` / `w-40 h-40`. O logo parece pequeno e ao
mesmo tempo ocupa uma área de clique enorme e invisível.

### 3.6 Imagens: extensão errada, peso a mais 🟠

Todos os `public/images/*.png` de conteúdo são, na realidade, **JPEG progressivos**
`2048×1152` a qualidade 95 com a extensão `.png`:

```
hero-bg.png          446K   JPEG 2048x1152
hero-catalogo.png    504K   JPEG 2048x1152
sobre-nos-hero.png   615K   JPEG 2048x1152
nossa-historia.png   477K   JPEG 2048x1152
expertise.png        426K   JPEG 2048x1152
personalizacao.png   476K   JPEG 2048x1152
confianca.png        346K   JPEG 2048x1152
pedras-especiais.png 474K   JPEG 2048x1152
logo-icon.png        2.1M   PNG 1536x1024
logo-text.png        2.1M   PNG 1536x1024
```

Além disso são visivelmente imagens geradas, todas com o mesmo tratamento de luz
roxa, e `expertise.png` é usada **duas vezes na mesma página** (`page.tsx`, secção de
duas colunas e depois outra vez no primeiro cartão da grelha).

### 3.7 Cores sem sistema 🟠

18 hexadecimais literais + ~40 utilitários de cor Tailwind avulsos. Contagem real:

```
130× #4a1e5c    67× #6b6b6b    54× #2c2c2c    17× #faf8f5     9× #000414
  8× #d4af37     6× #6b2d7f     4× #f5f1e8     2× #fffce6     1× #3a1650
  1× #1a0b2e     1× #e0e0e0     1× #000000     1× #ffffff
```

Nenhuma destas cores tem nome semântico. Mudar o tom da marca implica hoje 130
substituições manuais e uma revisão visual página a página.

---

## 4. Falhas de contraste (verificadas, WCAG 2.1)

| Combinação | Onde | Rácio | AA (4.5:1) |
|---|---|---|---|
| branco sobre dourado `#d4af37` | badge "Destaque" em `productCard.tsx` e na página de produto | **2.10:1** | ❌ **falha grave** |
| `text-orange-600` sobre branco | aviso "Apenas N em stock" | **3.56:1** | ❌ falha |
| `#6b6b6b` sobre `#faf8f5` | corpo de texto secundário, 67 usos | 5.03:1 | ⚠️ passa à tangente, falha AAA |
| `text-gray-400` sobre `#000414` | todo o footer | 8.05:1 | ✅ |
| `#4a1e5c` sobre `#faf8f5` | títulos | 12.14:1 | ✅ |

O badge "Destaque" é o pior caso: é um selo comercial, está por cima de fotografia, e
é praticamente ilegível.

---

## 5. Estados mortos, em falta e desligados

### 5.1 Links que dão 404

Rotas referenciadas no JSX que **não existem** em `src/app/`:

| Link | Onde | Gravidade |
|---|---|---|
| `/checkout` | `carrinho/page.tsx` - botão **"Finalizar Compra"** | 🔴 quebra a conversão |
| `/privacidade` | footer + registo | 🟠 obrigação legal |
| `/termos` | footer + registo | 🟠 obrigação legal |
| `/envios` | footer | 🟠 |
| `/faq` | footer | 🟠 |
| `/contacto` | footer | 🟠 (a página existe embutida em `/sobre-nos`) |
| `/auth/forgot-password` | login | 🟠 |

### 5.2 Interface construída mas inalcançável

`CartPreview` (drawer lateral de carrinho, 189 linhas, com animação de entrada) está
montado em `ClientProviders.tsx` e funciona. **Abre quando se adiciona um produto**,
porque `addItem` no contexto faz `setIsOpen(true)`.

O que não funciona é o ícone do carrinho no header: é um `<Link href="/carrinho">`
que navega em vez de abrir o drawer, e `header.tsx:11` importa `openCart` do contexto
sem nunca o chamar. Ficam duas experiências de carrinho, e a escolha entre elas
depende de como lá se chega, não de uma decisão de desenho.

### 5.3 Páginas vazias ou sem marca

- `admin/page.tsx`, `admin/produtos/page.tsx`, `admin/encomendas/page.tsx`: **ficheiros com 0 bytes**
- `sucesso/page.tsx` e `falha/page.tsx`: 9 linhas cada, **sem Header, sem Footer, sem marca**. O cliente acaba de pagar e cai numa página branca com um `<h1>` verde. É o momento de maior confiança da loja e está por desenhar.
- Não existe `not-found.tsx`: o 404 é o ecrã por omissão do Next.js
- `area-pessoal` corre com encomendas **mock hardcoded** ("Ametista Bruta", "Colar Quartzo Rosa")

### 5.4 Acessibilidade e movimento

| Item | Estado |
|---|---|
| `prefers-reduced-motion` | **0 ocorrências** em todo o projeto |
| foco visível em links e botões | inexistente (o `*:focus-visible` vive no CSS morto) |
| `focus:outline-none` sem substituto garantido | 20 ocorrências (41 têm `focus:ring`, os restantes ficam sem nada) |
| `min-h-screen` / `h-screen` em vez de `dvh` | 13 ocorrências - salta na barra de endereço do Safari iOS |
| área de toque mínima 44×44 | não auditada por componente, mas os botões `p-1` do `cartPreview` ficam abaixo |

### 5.5 Bug funcional adjacente (fora de âmbito, mas bloqueia qualquer revisão visual)

`src/app/produto/[id]/page.tsx:40` faz `const slug = params.slug`, mas a pasta da rota
é `[id]`. `params.slug` é sempre `undefined`, o fetch vai para `/api/products/undefined`
e **a página de produto nunca carrega**. Não se pode avaliar nem redesenhar o ecrã mais
importante da loja enquanto isto não for corrigido.

---

## 6. Direção proposta

### 6.1 O princípio

> **O cristal é a cor. A interface é pedra e papel.**

Uma ametista é roxa. Um quartzo rosa é rosa. Uma aventurina é verde. O catálogo já
traz cor a mais, em todas as direções. Quando a interface também pinta tudo de roxo e
dourado, as fotografias dos produtos deixam de se distinguir do cenário.

A decisão de design é portanto: **tirar a cor da interface para a devolver ao produto.**
Casca cromaticamente calada, produto a gritar. É o oposto exato do que o site faz hoje,
é defensável comercialmente, e resolve de uma vez o "cheiro a IA" - porque o roxo néon
e o gradiente diagonal simplesmente deixam de ter onde existir.

### 6.2 O que se mantém (regras de preservação)

Da skill de redesign, o que **não** se toca sem decisão explícita:

- rotas e slugs (`/loja`, `/catalogo`, `/sobre-nos`, `/carrinho`, `/area-pessoal`)
- labels de navegação (Início, Sobre Nós, Catálogo, Loja)
- a arquitetura de informação e os fluxos existentes
- a beringela como cor da marca: ela fica, mas muda de função (ver abaixo)
- a voz em português de Portugal

### 6.3 O que muda de função

O roxo `#4a1e5c` deixa de ser **tinta** e passa a ser **superfície**. Em vez de pintar
130 elementos, passa a ser o fundo escuro das secções de marca. É a mesma cor, com
outro papel, e o efeito visual é completamente diferente.

---

## 7. Sistema de design proposto

### 7.1 Cor

Tokens semânticos, definidos uma vez em `globals.css` e expostos ao Tailwind via
`tailwind.config.js`. Nenhum hexadecimal literal em componentes.

| Token | Hex | Papel |
|---|---|---|
| `--surface` | `#F3F2EE` | fundo de página (pedra clara, neutro frio, **não** o creme quente de template) |
| `--surface-raised` | `#FAFAF8` | cartões e painéis |
| `--surface-deep` | `#241726` | secções de marca, header, footer (beringela profunda) |
| `--surface-deep-raised` | `#3B2440` | elevação sobre beringela |
| `--ink` | `#17151A` | texto principal |
| `--ink-muted` | `#6E6B63` | texto secundário |
| `--line` | `#DEDCD6` | bordas e divisores |
| `--accent` | `#4A5B3C` | **único** acento interativo, tema claro (musgo) |
| `--accent-on-deep` | `#A8BE94` | o mesmo acento sobre beringela |
| `--danger` | `#9B2C2C` | erro, remover, esgotado |

Contrastes verificados:

| Par | Rácio | Nível |
|---|---|---|
| `ink` sobre `surface` | **16.18:1** | AAA |
| `ink-muted` sobre `surface` | 4.75:1 | AA |
| `accent` sobre `surface` | 6.57:1 | AA+ |
| branco sobre `accent` | 7.04:1 | AAA |
| `surface` sobre `surface-deep` | 15.30:1 | AAA |
| `accent-on-deep` sobre `surface-deep` | 8.53:1 | AAA |

**Porquê musgo e não dourado:** dourado sobre roxo é o reflexo automático de "luxo" e é
exatamente onde a geração automática aterra. O `#d4af37` atual, além disso, já falha
contraste (2.10:1 com texto branco). O musgo é mineral, terroso, coerente com a
categoria, e é uma cor que quase nenhuma loja de cristais usa - o que é precisamente o
objetivo.

**Regras de cor, não negociáveis:**

1. **Um acento, em todo o site.** Nada de roxo aqui, dourado ali, rosa no `categoryCard`.
2. **Zero glow.** Nenhum `shadow-<cor>`. Sombras são pretas tingidas com o matiz do fundo, a opacidade baixa, com direção de luz única (de cima).
3. **Zero gradientes diagonais de marca.** Se for preciso profundidade, usa-se um radial muito subtil ou grão, não `bg-gradient-to-br`.
4. **A cor dos produtos não compete.** Nenhum overlay colorido por cima de fotografia de peça.

> A confirmar contigo: se o wordmark real tiver dourado, o dourado fica **só no
> logótipo** e não entra na UI. Preciso de ver o ficheiro de marca original.

### 7.2 Tipografia

Playfair Display + Inter é a combinação por omissão do Wix e do Squarespace, e é
também a sugestão automática de qualquer gerador. Troca-se por um par com a mesma
elegância e menos quilometragem:

| Papel | Fonte | Regra |
|---|---|---|
| Display | **Bodoni Moda** | **apenas ≥ 36px.** Abaixo disso as hastes finas partem-se, sobretudo em fundo escuro. |
| UI e corpo | **Jost** | tudo o resto: navegação, nomes de produto, preços, labels, corpo de texto |
| Números | Jost com `font-variant-numeric: tabular-nums` | preços, quantidades, totais - para as colunas alinharem |

Alternativa mais conservadora se o Bodoni for demasiado contrastado para o wordmark:
**Cormorant Garamond** no lugar do Bodoni, mesma regra de tamanho.

Escala (rácio 1.25, base 16px):

```
display-xl  64px / 1.05 / -0.02em    Bodoni Moda
display-l   48px / 1.08 / -0.02em    Bodoni Moda
display-m   36px / 1.15 / -0.01em    Bodoni Moda
title       24px / 1.3  /  0         Jost 500
body-l      18px / 1.6  /  0         Jost 400
body        16px / 1.6  /  0         Jost 400
caption     14px / 1.5  /  0.01em    Jost 400
label       12px / 1.4  /  0.08em    Jost 500 maiúsculas
```

Corpo de texto limitado a `max-w-[65ch]`. Títulos com `text-wrap: balance`.

### 7.3 Forma

Uma escala de raio, documentada e seguida:

| Elemento | Raio |
|---|---|
| Painéis e contentores grandes | `12px` |
| Cartões de produto, imagens | `8px` |
| Inputs, selects, botões | `4px` |
| Badges e pills de estado | `2px` (retangulares, não pills) |
| Avatares e ícones circulares | apenas onde o conteúdo é mesmo circular |

O `rounded-full` nos botões principais desaparece. O botão-pílula branco é um dos
marcadores mais fortes de landing gerada.

### 7.4 Elevação e luz

- **Uma fonte de luz, vinda de cima.** Todas as sombras deslocam para baixo, nunca para os lados.
- Sombra tingida com o matiz do fundo, nunca preto puro: em tema claro `0 1px 2px rgb(23 21 26 / 0.04), 0 8px 24px rgb(23 21 26 / 0.06)`.
- **Cartões só quando a elevação comunica hierarquia.** Nas grelhas de listagem, separar por espaço e por uma linha de 1px, não por caixa branca com sombra. Isto sozinho retira uma camada enorme de "template".
- Em fundo beringela, a elevação faz-se por **clareamento da superfície**, não por sombra.

### 7.5 Movimento

Regra nova: **cada animação tem de responder a uma pergunta - o que é que isto comunica?**
Hierarquia, narrativa, feedback ou mudança de estado. "Fica giro" não conta.

| Material | Gesto ao hover | Duração |
|---|---|---|
| Fotografia de produto | zoom máximo `1.03`, `ease-out` | 700ms |
| Cartão | borda passa de `--line` para `--accent`, fundo sobe um tom. **Sem lift, sem scale.** | 200ms |
| Botão primário | escurece 6%. Ao `:active`, `translateY(1px)` | 150ms |
| Link de texto | sublinhado a crescer da esquerda | 200ms |
| Ícone de ação | só mudança de cor | 150ms |

Obrigatório e hoje inexistente:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Entradas de secção: `opacity` + `translateY(16px)`, escalonadas a 60ms, **uma só vez**
(`viewport once`). Nada de loops infinitos, nada de parallax, nada de scroll hijack.

### 7.6 Iconografia

Sair do `lucide-react` (a escolha por omissão) para **Phosphor** (`@phosphor-icons/react`),
peso `regular`, tamanho e stroke normalizados. Uma família em todo o projeto.

**Zero emoji como ícone.** Os 17 emoji atuais passam a glifos Phosphor, herdando a cor
do token e o tamanho da escala.

### 7.7 Layout

- Contentor: `max-w-[1280px]` com `px-4 / md:px-8`, definido **uma vez** (o `container-custom` ressuscitado ou uma classe Tailwind equivalente).
- `min-h-[100dvh]` em vez de `h-screen` / `min-h-screen`.
- **Regra de repetição de layout:** uma família de layout, uma vez por página. As quatro grelhas de três cartões iguais têm de virar quatro coisas diferentes.
- Assimetria controlada: cabeçalhos de secção alinhados à esquerda, conteúdo com respiração desigual, imagens de rácios variados.

---

## 8. Plano de alterações, superfície a superfície

### `layout.tsx` + CSS global

- Fundir `src/styles/globals.css` em `src/app/globals.css` e **apagar o ficheiro órfão**
- Remover o bloco `@theme inline` (sintaxe v4 em projeto v3) e as referências a `--font-geist-*`
- Escolher **um** `postcss.config` e eliminar o outro; alinhar as dependências
- Declarar os tokens da secção 7.1 em `:root` e ligá-los em `tailwind.config.js` (`theme.extend.colors`, `fontFamily`, `borderRadius`, `boxShadow`)
- Carregar Bodoni Moda + Jost via `next/font`; remover Playfair e Inter
- Adicionar o bloco `prefers-reduced-motion` e o `:focus-visible` global
- Adicionar link "saltar para o conteúdo"

### `header.tsx`

- Altura fixa `72px`. Logótipo dimensionado pelo rácio real (`h-8 w-auto`, ~`128×35`), nunca numa caixa quadrada
- Fundo `--surface-deep` com uma linha inferior de 1px em vez de `shadow-sm`
- **Estado de página ativa** na navegação (hoje não existe: o utilizador nunca sabe onde está)
- Ícone do carrinho passa a chamar `openCart()` em vez de navegar. Adicionar `aria-live` à contagem
- Menu mobile: deslizar em vez de aparecer de repente; remover `border-gray-100` (invisível em fundo escuro)

### `footer.tsx`

- Reduzir de 4 colunas para 2 blocos: navegação essencial + legal
- Substituir os placeholders `+351 xxx xxx xxx` e `tel:+351000000000` por dados reais, ou remover a linha
- Títulos de coluna: token `--accent-on-deep` em vez de dourado
- Criar as páginas legais em falta, ou remover os links até existirem

### `page.tsx` (home)

- **Hero:** tirar o `text-purple-300` do título; o destaque passa a ser itálico da mesma fonte, não outra cor. Um único CTA primário (o par branco + fantasma sai). `min-h-[100dvh]`
- **Secção "Avaliação Especializada":** a grelha de 3 cartões idênticos vira um layout diferente (bento assimétrico de 3 células, ou zig-zag de 2 com uma peça em destaque). Deixar de repetir `expertise.png` duas vezes na mesma página
- **Secção CTA:** o gradiente `to-br` sai. Fundo `--surface-deep` liso com grão subtil, ou fotografia de peça com escurecimento
- Remover os 4 `shadow-purple-900/20` e o `{/* Subtle glow effect */}`
- Trocar `group-hover:scale-105` nos blocos por resposta de borda/tom

### `loja/page.tsx`

- Corrigir o choque de tema: a loja herda `--surface`, não `#faf8f5` solto
- Os 4 blocos emoji-em-círculo (`🔒 🚚 ↩️ 💬`) passam a uma tira horizontal de 4 itens com ícones Phosphor, sem círculos e sem cartão
- Filtros: a sidebar sticky fica, mas os botões de categoria ganham estado selecionado por peso e linha, não por bloco roxo cheio
- Skeleton de carregamento a espelhar a forma real do cartão de produto
- Estado vazio composto (hoje é uma frase e um botão sem estilo)

### `catalogo/page.tsx`

- A grelha de categorias já é a melhor peça do site. Manter a estrutura, retirar `scale-110` na imagem (baixar para `1.03`) e trocar o hover dourado por `--accent`
- O `bg-gradient-to-t from-black` a 70% de opacidade está a matar as fotografias. Baixar para 45% e concentrar na base
- A secção "Características" (4 emoji em círculo) repete a da loja com outro conteúdo: fundir num componente único ou eliminar uma delas

### `produto/[id]/page.tsx`

- 🔴 **Bloqueado**: `params.slug` numa rota `[id]`. Corrigir antes de qualquer trabalho visual
- Badge "Destaque": fundo `--accent` com texto claro (7.04:1) em vez de dourado com branco (2.10:1)
- "Apenas N em stock": sair do `text-orange-600` (3.56:1) para `--danger`
- Galeria: thumbnails com estado selecionado mais forte que uma borda de 2px
- Os três botões circulares (carrinho, favorito, partilha) têm pesos visuais idênticos. O de adicionar ao carrinho tem de dominar
- O bloco de propriedades (`Chakra`, `Elemento`, `Signo`) merece ser a peça editorial da página, não uma caixa bege com dois-pontos

### `carrinho/page.tsx`

- 🔴 `/checkout` não existe. O CTA principal da loja leva a um 404
- Com o `btn-primary` a funcionar, "Finalizar Compra" volta a parecer um botão
- Os três `✓` do rodapé do resumo passam a ícones
- Estado vazio: bom na estrutura, precisa do tratamento tipográfico novo

### `auth/login` + `auth/register`

- Remover o círculo de gradiente roxo com ícone. O título chega
- "Bem-vindo de volta" → algo que pertença a esta loja
- Os dois ficheiros são ~80% idênticos: extrair `AuthShell` partilhado
- Campos: manter label acima (já está correto), acrescentar validação inline e mensagem de erro por campo em vez de uma caixa vermelha no topo
- A `<div className="loading">` invisível no ecrã de sucesso precisa de um indicador real

### `area-pessoal/page.tsx`

- Substituir as encomendas mock por estado vazio real desenhado
- Os badges de estado usam 6 pares de cor Tailwind diferentes (amarelo, azul, roxo, verde, vermelho): reduzir a três tons do sistema (neutro, acento, danger)

### `sucesso` / `falha`

- Reescrever por completo: Header, Footer, número da encomenda, próximos passos, CTA de regresso à loja. É o ecrã de maior confiança da loja e neste momento não tem marca nenhuma

### Componentes órfãos

| Ficheiro | Estado | Ação |
|---|---|---|
| `categoryCard.tsx` | nunca importado, usa `text-pink-500` | apagar ou realinhar |
| `cartItem.tsx` | nunca importado, 14 linhas sem estilo | apagar |
| `orderSummary.tsx` | nunca importado, `bg-pink-500` | apagar |
| `adminHeader.tsx` | `bg-gray-800`, `<a>` em vez de `<Link>` | redesenhar com o sistema |
| `Hero.tsx` | usado em catálogo e sobre-nós, depende de `btn-primary` morto | manter, realinhar |

### Assets

- Converter as 8 imagens de conteúdo para `.webp`, redimensionar para 1600px de largura, corrigir as extensões `.png` que são JPEG
- **Redesenhar o logótipo como vetor real** (paths, não base64), em três variantes: lockup horizontal, marca isolada, monocromático
- Favicon derivado da marca (hoje é o `favicon.ico` por omissão do `create-next-app`)
- Substituir o fallback Unsplash hardcoded em `productCard.tsx:48` e `produto/[id]:159` por um placeholder da marca

---

## 9. Backlog priorizado

### P0 - desbloqueio (nada de estético funciona antes disto)

1. Importar / fundir `src/styles/globals.css`. Devolve botões, container, sombras e transições a **cerca de 120 pontos do site**
2. Corrigir `params.slug` → `params.id` na página de produto
3. Criar `/checkout` ou desviar o CTA do carrinho
4. Resolver a duplicação de configuração PostCSS / Tailwind

### P1 - a "cara de IA" (impacto visual máximo)

5. Declarar os tokens de cor e eliminar os 18 hexadecimais literais
6. Unificar o tema: acabar com o corte escuro/creme entre home e loja
7. Trocar o par tipográfico e ligar as fontes ao Tailwind (os títulos deixam de ser Georgia)
8. Remover todos os glows roxos, o gradiente diagonal e o `hover:scale` genérico
9. Substituir os 17 emoji por ícones Phosphor
10. Corrigir os dois contrastes que falham (badge dourado, aviso laranja)
11. Corrigir o dimensionamento do logótipo no header e no footer

### P2 - estrutura

12. Quebrar a repetição das quatro grelhas de três cartões
13. Desenhar `/sucesso` e `/falha`
14. Ligar o drawer do carrinho ao ícone do header
15. Estado de página ativa na navegação
16. Criar as páginas legais e o 404
17. Adicionar `prefers-reduced-motion` e `:focus-visible`

### P3 - acabamento

18. Redesenhar o logótipo como vetor + favicon
19. Otimizar e reconverter as imagens
20. Apagar os componentes órfãos
21. Redesenhar o painel de administração (ficheiros vazios)
22. Reescrever a copy genérica ("jornada espiritual" x5, contactos placeholder)

---

## 10. O que preciso de ti antes da fase de implementação

1. **Ficheiro de marca original.** O logótipo atual é raster embrulhado em SVG. Se existir vetor, o par tipográfico e a decisão sobre o dourado dependem dele.
2. **Confirmação da direção.** "Pedra e papel" com acento musgo, ou preferes que eu apresente duas alternativas visuais lado a lado antes de mexer?
3. **Beringela como superfície:** concordas em manter a cor da marca mas mudar-lhe o papel?
4. **Dourado:** sai da UI e fica só no logótipo, ou queres mantê-lo como acento secundário?

Nada de código muda até estas quatro respostas.
