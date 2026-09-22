# Roteiro até à v1.0.0 - Pétalas de Sonho

> Objetivo desta versão: **um site institucional completo, legal e publicável**,
> com a loja presente mas ainda não trabalhada a fundo. A loja estruturada é a v2.0.
>
> Continuação de `docs/DESIGN-AUDIT.md`. Uma funcionalidade por PR, na ordem abaixo.
>
> **Aviso:** não sou jurista. Este documento estrutura o trabalho técnico e de
> design e identifica as obrigações que se aplicam a um site de comércio
> eletrónico em Portugal. O **conteúdo** das políticas e dos termos tem de ser
> validado por quem tenha competência legal antes de ir para o ar.

---

## Princípio de ordenação

A ordem não é por dificuldade, é por **dependência e por risco**.

1. Primeiro o que impede o trabalho de acontecer em segurança (portão de qualidade).
2. Depois a identidade, porque tudo o resto é desenhado em cima dela.
3. Depois a camada legal, porque é o que impede o site de ir para o ar.
4. Só no fim o polimento.

Pôr a camada legal antes da loja está certo, e por uma razão que vai além do
cumprimento: **o site já faz afirmações comerciais que ainda não tem como
sustentar** (ver F9). Isso é exposição real, hoje, mesmo sem vender nada.

---

## Estado atual, em duas linhas

Depois do PR de desbloqueio estrutural, o projeto compila e o sistema de design
chega ao browser. O que existe é o esqueleto de um site institucional com um
catálogo ligado a uma base de dados, sem identidade própria, sem camada legal e
sem rede de segurança técnica.

---

# Fase 0 - Fundação

## F0. Portão de qualidade

**Porquê primeiro:** o `next build` esteve partido em `master` por quatro razões
diferentes e ninguém deu por isso. Enquanto não houver nada a verificar cada PR,
volta a acontecer.

- **CI no GitHub Actions**, a correr em cada pull request: `tsc --noEmit`, `next lint`,
  `next build`. Sem isto, todo o resto deste roteiro assenta em areia
- **Alinhar o ESLint.** O repo tem `eslint.config.mjs` (flat config) e
  `eslint-config-next@14`, que espera `.eslintrc`. O `next lint` pede configuração
  interativa. Escolher um dos dois formatos
- **Validar as variáveis de ambiente ao arranque**, com Zod. Hoje `lib/mongodb.ts`
  rebenta a meio do build com uma mensagem críptica se faltar `MONGODB_URI`.
  Falhar cedo e com nome
- **`.env.example`** com todas as chaves necessárias, sem valores
- **`error.tsx`, `not-found.tsx` e `loading.tsx`** na raiz do App Router. Hoje um erro
  de runtime mostra o ecrã por omissão do Next
- **Testes.** Vitest para a lógica pura e Playwright para os percursos, divididos
  por domínio em vez de um ficheiro único:

  | Ficheiro | Cobre |
  |---|---|
  | `e2e/resiliencia.spec.ts` | todas as rotas renderizam com a base de dados em baixo; erro da API distinguido de catálogo vazio |
  | `e2e/navegacao.spec.ts` | links do cabeçalho e do rodapé, logótipo, migalhas, loja até ao produto |
  | `e2e/loja.spec.ts` | grelha, pesquisa, filtro por categoria, ordenação, esgotados |
  | `e2e/carrinho.spec.ts` | adicionar, limite de stock, persistência, totais, remover |
  | `e2e/autenticacao.spec.ts` | formulários, validação, erros do servidor, rota protegida |
  | `e2e/interface.spec.ts` | menu de telemóvel, foco de teclado, texto alternativo, marcas estruturais, sem scroll horizontal |

  A API é interceptada com fixtures, por isso a suite é determinística e não
  precisa de base de dados. O servidor de testes arranca **sem** `MONGODB_URI`
  de propósito: é assim que se verifica que o site aguenta a base de dados em baixo.

**Critério de pronto:** um PR que parta o build não consegue ser fundido.

---

# Fase 1 - Identidade

## F1. Marca

**Bloqueia F2 e tudo o que vem depois.**

O ficheiro que existe, `logo-icon.svg`, tem 622 KB e é um par de imagens raster
em base64 embrulhadas em `<svg>`. Não é vetor, não escala, não muda de cor, não
serve para favicon nem para versão monocromática. Não existe original.

Logo, o logótipo tem de ser **redesenhado de raiz**.

**As cores da marca já estão resolvidas.** Extraí as imagens embutidas no SVG e medi
os pixels dominantes: o símbolo é um agregado de quartzo rosa com pétalas a 350° de
matiz, e o wordmark é creme a 53°. **Nem roxo nem dourado existem no logótipo.** Os
dois eram decoração acrescentada por cima, e o roxo aparece 130 vezes no código.

A paleta derivada daí está em `docs/PALETA.md`, com o raciocínio de cor e os
contrastes todos verificados. O redesenho do logótipo mantém estas cores e resolve
só a forma.

- Redesenhar o lockup em vetor real: marca isolada, lockup horizontal, monocromático
- Favicon e ícones de aplicação derivados da marca, a substituir o `favicon.ico`
  por omissão do `create-next-app`
- Imagem de partilha social (OG) da marca
- Escolher o par tipográfico contra o wordmark novo. A paleta já não bloqueia nada

## F2. Sistema de design

- Aplicar os tokens de `docs/PALETA.md` em `globals.css` e ligá-los ao
  `tailwind.config.js`. Eliminar os 18 hexadecimais literais, `#4a1e5c` incluído,
  que aparece 130 vezes, e o dourado `#d4af37`, que aparece 8
- **Unificar o tema.** Hoje são sete linguagens visuais e atravessar da home para
  a loja é mudar de website
- Escala tipográfica, escala de raios, escala de elevação, regras de movimento
- Retirar os glows roxos, o gradiente diagonal e o `hover:scale` genérico
- Corrigir os dois contrastes que falham WCAG AA: badge "Destaque" a 2.10:1 e o
  aviso de stock a 3.56:1

## F3. Biblioteca de componentes

Hoje o botão primário é uma classe CSS global e os campos de formulário são
copiados e colados em cinco ficheiros.

- `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Container`, `Section`,
  `Skeleton`, `EmptyState`
- Substituir os emoji por ícones de uma família única
- `AuthShell` partilhado: `login` e `register` são 80% o mesmo ficheiro
- Apagar os componentes órfãos: `categoryCard`, `cartItem`, `orderSummary`
- Decidir o comportamento do ícone do carrinho no header: hoje navega para
  `/carrinho` e o drawer só abre ao adicionar um produto. `openCart` está
  importado no header sem nunca ser chamado

**Critério de pronto:** nenhuma cor literal e nenhum `<button>` solto em páginas.

---

# Fase 2 - Camada legal

Esta fase é a razão de ser da v1.0.0. Nada disto existe hoje: os seis links legais
do footer apontam todos para páginas que dão 404.

## F4. Identificação do prestador

**Base:** DL 7/2004 (comércio eletrónico), art. 10º, e Código das Sociedades
Comerciais, art. 171º, quando aplicável.

Tem de estar acessível de forma permanente e direta:

- Denominação social ou nome do empresário
- NIF
- Sede ou domicílio
- Email e telefone de contacto efetivo
- Conservatória do registo comercial e número de matrícula, se for sociedade
- Capital social, se for sociedade

**Preciso destes dados da tua parte.** É o único bloqueio de conteúdo desta fase.
Hoje o footer tem `+351 xxx xxx xxx` e `tel:+351000000000` em produção.

## F5. Livro de Reclamações e resolução de litígios

**Base:** DL 156/2005, com as alterações do DL 74/2017, e Lei 144/2015, art. 18º.

- **Livro de Reclamações Eletrónico.** A ligação para `livroreclamacoes.pt` já existe
  no footer, mas tem de estar visível e identificada, não perdida numa lista de seis
- **Página `/livro-de-reclamacoes`** com explicação e a ligação direta
- **Entidade de resolução alternativa de litígios.** É obrigatório informar o
  consumidor de qual é a entidade competente, com nome e sítio. Sendo a morada no
  Porto, o candidato natural é o CICAP, o Centro de Informação de Consumo e
  Arbitragem do Porto. **A adesão tem de ser confirmada e é uma decisão tua**
- **Atenção a um detalhe que a maioria dos templates ainda erra:** a plataforma
  europeia de resolução de litígios em linha foi descontinuada em julho de 2025.
  Não deve ser acrescentada nenhuma ligação para ela. É exatamente o tipo de link
  morto que um gerador copia de um exemplo antigo. **Confirmar com jurista.**

## F6. Proteção de dados

**Base:** RGPD (Regulamento (UE) 2016/679) e Lei 58/2019.

O site já trata dados pessoais hoje, em dois sítios, sem qualquer aviso:

| Onde | Dados | Estado |
|---|---|---|
| Formulário de contacto | nome, email, telefone, mensagem | sem aviso de privacidade, sem consentimento |
| Registo de conta | nome, email, password | a caixa "concorda com os Termos" aponta para um 404 |
| Carrinho | conteúdo do carrinho em `localStorage` | não divulgado |
| Sessão | cookie do NextAuth | estritamente necessário, isento de consentimento |

Trabalho:

- **Página `/privacidade`** com: responsável pelo tratamento, finalidades e base legal
  para cada uma, categorias de dados, prazos de conservação, subcontratantes
  (alojamento, base de dados, serviço de email e, mais tarde, o processador de
  pagamentos), transferências internacionais se existirem, direitos do titular e
  como os exercer, e direito de reclamação junto da CNPD
- **Consentimento explícito** no formulário de contacto e no registo. Caixa não
  pré-selecionada, com ligação para a política. Marketing, se existir, é opt-in
  separado e nunca agregado à criação de conta
- **Direitos do titular, operacionais.** Na área pessoal: exportar os meus dados e
  apagar a conta. Um formulário de pedido não chega quando a funcionalidade é trivial
- **Registo de atividades de tratamento** (art. 30º). Documento interno, fica no repo
- **Política de conservação** com prazos concretos por tipo de dado

## F7. Cookies e armazenamento local

**Base:** Diretiva ePrivacy, Lei 41/2004 e as orientações da CNPD sobre cookies.

Regras que a maioria dos banners falha:

- Consentimento **antes** de colocar qualquer cookie não essencial
- **"Rejeitar tudo" com o mesmo destaque visual que "Aceitar tudo".** Um botão
  cinzento pequeno ao lado de um botão colorido grande não cumpre
- Granular por categoria, sem nada pré-selecionado
- Retirar o consentimento tem de ser tão fácil como dá-lo: ligação permanente no footer
- Sem muro de cookies

Trabalho:

- Banner de consentimento e painel de preferências
- **Bloquear o iframe do Google Maps em `/sobre-nos` até haver consentimento.**
  Hoje carrega sempre, e é um pedido a terceiro que coloca cookies antes de o
  utilizador dizer o que quer que seja. É a falha mais concreta do site nesta matéria.
  Substituir por um marcador estático clicável enquanto não houver consentimento
- **Página `/cookies`** com tabela: nome, finalidade, duração, titular
- Declarar o `localStorage` do carrinho. A CNPD trata armazenamento local como
  equivalente a cookies
- Uma nota boa: as fontes são carregadas por `next/font`, que as serve do próprio
  domínio. Não há pedido ao Google Fonts em tempo de execução e portanto não há
  aqui nada a consentir

## F8. Termos e condições

- **`/termos`**: termos de utilização do site
- **`/envios-e-devolucoes`**: condições de envio, prazos, custos, e o direito de
  livre resolução de 14 dias do DL 24/2014
- As condições gerais de venda e o formulário de livre resolução entram com a loja,
  na v2, mas a estrutura da página fica feita agora

## F9. Revisão das afirmações comerciais

**Base:** DL 57/2008, práticas comerciais desleais.

Este ponto é o que me preocupa mais, e não é um detalhe de conformidade. O site
**já afirma**, hoje, em produção:

| Afirmação | Onde |
|---|---|
| "Envio Grátis em compras acima de 50€" | loja |
| "14 dias para devolução" | loja, produto |
| "Entrega em 2-3 dias úteis" | catálogo, produto |
| "Certificado de autenticidade incluído" | produto |
| "gemologistas certificados" | home |
| "Todos os cristais são 100% autênticos" | catálogo |
| "Limpeza energética antes do envio" | catálogo |
| "Há mais de uma década" | sobre-nós |

Nenhuma destas afirmações tem hoje uma página que a sustente, e algumas podem
simplesmente não ser verdade, porque foram escritas por um gerador e não por ti.
Uma afirmação comercial falsa é uma prática comercial desleal, com ou sem loja a
funcionar.

Além disso, os "Benefícios Energéticos" que a página de produto mostra a partir da
base de dados precisam de cuidado redobrado: **alegações de efeito terapêutico ou
de saúde sobre cristais são território de publicidade enganosa.** A formulação tem
de ficar claramente no campo da tradição e do bem-estar, com um aviso explícito de
que não substitui aconselhamento médico.

Trabalho: passar todas as afirmações a pente fino contigo, manter só as verdadeiras,
e criar a página que as sustenta. Isto é trabalho de copy, não de código.

---

# Fase 3 - Conteúdo e conta

## F10. Páginas institucionais

- **`/contacto` autónomo.** Hoje o formulário vive dentro de `/sobre-nos` e o link
  do footer aponta para uma página que não existe
- **`/faq`**, ligada do footer e hoje inexistente
- **404 e 500 desenhados**, com caminho de regresso
- **`/sucesso` e `/falha`** reescritas. São nove linhas cada, sem header, sem footer,
  sem marca. É o momento de maior confiança de toda a loja

## F11. Segurança e robustez

Encontrado durante a análise:

- **O formulário de contacto interpola a mensagem do utilizador diretamente em HTML**
  no corpo do email. Injeção de HTML no email enviado. Tem de ser escapado
- **Sem limite de envios** no formulário de contacto. É um canal aberto de spam
  contra o próprio servidor SMTP
- **`emailVerified: false` e nenhum fluxo de verificação.** As contas nascem por
  verificar e nunca são verificadas
- **Recuperação de password inexistente.** O link `/auth/forgot-password` dá 404
- Cabeçalhos de segurança no `next.config.js`: CSP, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`

## F12. Área pessoal

- Substituir as encomendas mock, hoje hardcoded no ficheiro, por dados reais ou
  por um estado vazio honesto
- Editar perfil e morada
- Exportar dados e apagar conta, vindos de F6
- Favoritos: o botão de coração da página de produto não guarda nada

---

# Fase 4 - Qualidade

## F13. Acessibilidade

**Base:** Diretiva (UE) 2019/882, transposta pelo DL 82/2022, aplicável ao comércio
eletrónico desde 28 de junho de 2025. **As microempresas de serviços estão isentas**,
com menos de 10 trabalhadores e menos de 2 milhões de euros de volume de negócios.
Confirma se é o caso. Mesmo estando isento, o alvo deve ser WCAG 2.1 AA.

- Auditoria por página com axe
- Navegação completa por teclado, com ordem de foco e armadilhas de foco resolvidas
- Área de toque mínima de 44 por 44
- Contraste AA em toda a interface
- Texto alternativo com significado, não "imagem"
- Ligação "saltar para o conteúdo"

## F14. Performance

- As oito imagens de conteúdo são JPEG com extensão `.png`, a 2048 por 1152 e cerca
  de 450 KB cada. Os dois ficheiros de logótipo pesam 2.1 MB cada
- Converter para WebP ou AVIF, redimensionar, corrigir extensões
- `min-h-[100dvh]` em vez de `h-screen`, hoje em 13 sítios
- Orçamento de Core Web Vitals no CI: LCP abaixo de 2.5s, CLS abaixo de 0.1

## F15. SEO e partilha

**Nota de 22/09/2026 — esta fase foi dividida.** Deixá-la inteira para o fim
tinha um problema de ordem: sem `robots.ts`, pôr o site no ar antes da camada
legal significa deixar o Google indexar afirmações comerciais por validar (F9)
sem nenhuma das páginas obrigatórias. Isso é exposição real, não é SEO.

O que passou para a frente:

- **`robots.ts`, feito na F3.** Bloqueia todos os motores de busca enquanto
  `SITE_INDEXAVEL` não for `true`. Levanta-se quando F4 a F9 estiverem
  publicadas, e só aí passa a listar as rotas privadas no `disallow`
- **Metadata por página** passa a fazer-se à medida que cada página é
  construída, não retroativamente aqui no fim

O que fica nesta fase, porque depende do logótipo (F1) e da copy (F9):

- `sitemap.ts`
- Open Graph com imagem por página
- JSON-LD: `Organization`, `LocalBusiness`, `BreadcrumbList` e, mais tarde, `Product`
- Canónicos e `lang` correto
- Revisão dos títulos e descrições de todas as páginas

---

# v2.0.0 - A loja, fora do âmbito desta versão

Fica registado para não se perder:

- `/checkout` com Stripe, que hoje é um 404 no CTA principal do carrinho
- Modelo de encomenda, estados e histórico reais
- Emails transacionais
- Gestão de stock
- Faturação certificada, obrigatória em Portugal
- Condições gerais de venda e formulário de livre resolução
- Painel de administração a sério. Os três ficheiros de `admin/` estavam vazios e
  partiam o build; ficaram com marcadores mínimos

---

# Ordem de execução

```
F0  Portão de qualidade          sem dependências, faz-se já
F1  Marca                        bloqueia F2
F2  Sistema de design            depende de F1
F3  Componentes                  depende de F2
F4  Identificação do prestador   precisa dos teus dados legais
F5  Livro de Reclamações e RAL   precisa de decisão sobre entidade RAL
F6  Proteção de dados            precisa de validação jurídica
F7  Cookies                      depende de F6
F8  Termos                       precisa de validação jurídica
F9  Afirmações comerciais        precisa de decisões tuas sobre o negócio
F10 Páginas institucionais       depende de F3
F11 Segurança                    independente, pode correr em paralelo
F12 Área pessoal                 depende de F3 e F6
F13 Acessibilidade               depois de F10
F14 Performance                  depois de F1
F15 SEO                          robots.ts feito na F3; o resto por último
```

F0 e F11 não dependem de ti e podem arrancar imediatamente.
F1 depende de uma sessão de decisão sobre a marca.
Da F4 à F9 o bloqueio é conteúdo e decisões de negócio, não código.

---

# O que preciso de ti

1. **Dados legais da entidade:** denominação, NIF, sede, contactos reais, e se é
   sociedade ou empresário em nome individual
2. **Entidade RAL:** existe adesão a alguma? Se não, é uma decisão a tomar
3. **Dimensão da empresa**, para saber se a isenção de acessibilidade se aplica
4. **As afirmações comerciais da F9:** quais são verdadeiras e quais foram inventadas
   pelo gerador. Preciso da lista revista por ti
5. **Validação jurídica** do conteúdo de F6, F7 e F8 antes de publicar
6. **Sessão de marca** para a F1: o logótipo é para refazer em vetor. As cores já
   estão fechadas em `docs/PALETA.md`, falta validares-me a direção
