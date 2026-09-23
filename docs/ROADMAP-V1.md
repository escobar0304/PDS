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

- **CI no GitHub Actions**, a correr em cada pull request: `tsc --noEmit`, `eslint`,
  `next build`. Sem isto, todo o resto deste roteiro assenta em areia
- **Alinhar o ESLint.** O repo tem `eslint.config.mjs` (flat config) e
  `eslint-config-next@14`, que espera `.eslintrc`. O `next lint` pede configuração
  interativa. Escolher um dos dois formatos. **Resolvido em 23/09/2026 com o
  Next 16:** flat config, ESLint 9, `eslint .` no lugar do `next lint`
- **Validar as variáveis de ambiente ao arranque**, com Zod. Hoje `lib/mongodb.ts`
  rebenta a meio do build com uma mensagem críptica se faltar `MONGODB_URI`.
  Falhar cedo e com nome
- **`.env.example`** com todas as chaves necessárias, sem valores
- **`error.tsx` e `not-found.tsx`** na raiz do App Router (o `loading.tsx` da raiz
  saiu em 23/09/2026: ver `docs/PERFORMANCE.md`). Hoje um erro
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

## F0c. Integração com a base de dados

> **Feita em 22/09/2026.**
>
> **O buraco:** nada neste projeto tinha alguma vez corrido contra uma base de
> dados. A suite corre com `MONGODB_URI` por definir de propósito — prova que
> o site aguenta a base de dados em baixo, e prova **zero** sobre funcionar com
> ela. Registo, entrada, tokens de verificação e reposição: tudo escrito, nada
> exercitado.
>
> Não é possível corrigir isto no ambiente onde o trabalho decorre: o binário
> do MongoDB não é descarregável daqui (o proxy recusa `fastdl.mongodb.org`) e
> não existe nos repositórios do sistema. Os testes ficam ignorados quando
> `MONGODB_URI` não existe, e o CI levanta um Mongo em contentor para os
> correr.
>
> Testam o que atravessa a fronteira: índices únicos, conversão de tipos pelo
> Mongoose, prazos guardados como `Date`, normalização do email para
> minúsculas, e o ciclo completo de repor uma palavra-passe. Um deles demonstra
> o dano concreto da injeção NoSQL — com o operador, a consulta devolve mesmo
> uma conta.

---

## F1. Marca

> **Feita em 22/09/2026.** O detalhe está em `docs/MARCA.md`. Fica uma decisão
> por tomar, e é do negócio, não de engenharia: **as letras do lettering**. Não
> existe original vetorial e a única fonte é um raster onde o lettering tem
> 831×118 px, por isso o que está no repositório é um traçado — fiel, mas com os
> contornos ondulados em usos grandes. Ou se aceita isso, ou se redesenham as
> letras e a marca muda. A tipografia do site (ainda Playfair + Inter) só se
> fecha depois disso.


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

> **Confirmado em 22/09/2026: não é sociedade.** Sendo empresário em nome
> individual, caem as duas últimas linhas da lista acima — não há conservatória,
> número de matrícula nem capital social a indicar. Ficam por saber o nome, o
> NIF, o domicílio e os contactos efetivos.

## F5. Livro de Reclamações e resolução de litígios

**Base:** DL 156/2005, com as alterações do DL 74/2017, e Lei 144/2015, art. 18º.

- **Livro de Reclamações Eletrónico.** A ligação para `livroreclamacoes.pt` já existe
  no footer, mas tem de estar visível e identificada, não perdida numa lista de seis
- ~~**Página `/livro-de-reclamacoes`** com explicação e a ligação direta~~
  **Retirado em 22/09/2026.** O DL 156/2005 exige a **ligação** para a
  plataforma, em local visível — não exige página própria. A ligação no rodapé
  cumpre. Isto era trabalho inventado acima da obrigação
- ~~**Entidade de resolução alternativa de litígios.**~~ **Feito em
  23/09/2026: CICAP**, por decisão do negócio. Aparece em `/contacto#litigios`
  e no rodapé. **Escreve-se «competente», nunca «aderimos».** A Lei 144/2015
  obriga a indicar a entidade competente mesmo a quem não aderiu a nenhuma, e
  a adesão não está confirmada — dizer que aderimos era inventar. Nos litígios
  até 5000 €, a arbitragem é obrigatória para a empresa se o consumidor a
  escolher (Lei 63/2019), com ou sem adesão.

  **Uma condição fica pendente da F4:** a competência do CICAP é territorial,
  os 16 municípios da Área Metropolitana do Porto. Quando a morada chegar, tem
  de ficar num deles — a lista está em `src/lib/empresa.ts`
- **Atenção a um detalhe que a maioria dos templates ainda erra:** a plataforma
  europeia de resolução de litígios em linha foi descontinuada em julho de 2025.
  Não deve ser acrescentada nenhuma ligação para ela. É exatamente o tipo de link
  morto que um gerador copia de um exemplo antigo. **Confirmar com jurista.**

## F6. Proteção de dados

> **Parcialmente feita em 22/09/2026.** O detalhe está em `docs/DADOS-PESSOAIS.md`.
>
> Feito: `src/lib/empresa.ts` como fonte única da identificação (com os campos
> por preencher a `null`, nunca a fingir), a página `/privacidade` derivada do
> código, o aviso no formulário de contacto, e a indexação a exigir que a
> identificação esteja completa e não só que a variável de ambiente esteja
> ligada.
>
> **Correção ao que estava planeado:** esta secção previa consentimento
> explícito no formulário de contacto. O fundamento ali não é consentimento —
> é responder a quem escreve. Uma caixa a pedir autorização criaria um
> fundamento falso. O que a lei pede é informação, e é isso que está.
>
> Por fazer: os direitos operacionais na área pessoal (exportar e apagar), o
> registo de atividades de tratamento do art. 30.º, e os dados do prestador,
> que continuam do lado do negócio.


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

> **Feita em 22/09/2026, e com uma conclusão diferente da planeada.** O detalhe
> está em `docs/COOKIES.md`.
>
> Esta secção previa banner de consentimento e painel de preferências. Depois de
> **medir** o que o site guarda de facto — dois cookies do NextAuth, ambos de
> sessão e `httpOnly`, mais o carrinho em `localStorage` — verificou-se que está
> tudo isento ao abrigo do art. 5.º, n.º 3 da Diretiva ePrivacy. **Não há nada
> para consentir**, e um banner pediria autorização para o que não precisa dela,
> o que as orientações da CNPD desaconselham.
>
> O único terceiro era o mapa da Google em `/sobre-nos`, que carregava sozinho.
> Passou a carregar só a pedido: um botão no lugar do mapa para aquela visita, e
> um interruptor em `/cookies` para quem o quiser sempre. O mesmo interruptor dá
> e retira, começa desligado, e a preferência fica no browser. Há uma página
> `/cookies` com o inventário medido e testes que falham se aparecer um terceiro
> novo ou se algo passar a estar ligado por omissão.
>
> O banner volta a ser a resposta certa no dia em que houver análise de tráfego,
> publicidade ou *scripts* de pagamento fora do checkout. Esse dia está
> planeado na **F7b**, mais abaixo: o que obriga, o que não obriga, a armadilha
> do `stripe.js`, e porque é que a arquitetura já está preparada.


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

> **Bloqueado no negócio.** As perguntas, por ordem de peso:
>
> 1. **Para onde envias?** Continente, ilhas, União Europeia?
> 2. **Com quem, e em quanto tempo** — o prazo que consegues de facto cumprir,
>    não o que soa bem
> 3. **Quanto custa o envio?** Fixo, por peso, grátis a partir de um valor?
> 4. **Há loja física ou entrega em mão?** O sítio fala em «a loja» e
>    `/sobre-nos` tem um mapa do Porto
> 5. **Na livre resolução, quem paga a devolução?** A lei deixa-a a cargo do
>    cliente se isso estiver escrito antes da compra; se não estiver, paga a
>    loja
> 6. **Há peças feitas por medida** (japamalas, anéis)? São exceção à livre
>    resolução (DL 24/2014, art. 17.º), mas só se estiver dito
> 7. **Preços com IVA, ou regime de isenção?** Muda o que se escreve junto de
>    cada preço e na fatura
>
> A garantia legal de conformidade (3 anos, DL 84/2021) aplica-se sempre e
> não precisa de decisão. O texto final precisa de validação jurídica.

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

> **Feito em 23/09/2026, em texto geral**, por decisão do negócio: sem
> promessas, a melhorar quando houver informação. Está tudo em
> `src/lib/afirmacoes.ts`, e muda-se ali. `afirmacoes.test.ts` falha se uma
> frase retirada voltar — verificado contra o texto antigo: 13 falhas.
>
> **O levantamento encontrou mais do que as oito da tabela:**
>
> - a página inicial descrevia um **serviço de avaliação gemológica** —
>   «gemologistas certificados», «avaliações detalhadas», «garantimos a
>   integridade de cada avaliação». Não era uma frase, era um serviço
> - «Pagamento Seguro — Stripe SSL certificado», sem checkout
> - «Embalagem sustentável» e «práticas éticas e sustentáveis na extração»:
>   alegações ambientais genéricas, o alvo da Diretiva 2024/825
> - «Atendimento personalizado»
> - «pedras preciosas» para quartzo e ametista, que não o são
> - um **horário inventado** em duas páginas, «Seg-Sex 10h-19h, Sáb 10h-14h».
>   É dado do negócio: passou a `EMPRESA.horario`, a `null`, e o bloco só
>   aparece quando existir
> - «Benefícios Energéticos» nas propriedades dos produtos passou a «Segundo a
>   tradição», com o aviso de que não substitui aconselhamento médico **junto
>   das propriedades**, não numa página à parte
> - textos alternativos errados: um dizia «pedra em bruto sobre madeira» para
>   uma imagem de brincos
>
> **Fica uma afirmação concreta: os 14 dias de livre resolução.** Não é
> promessa do negócio, é um direito que a lei dá em qualquer venda à
> distância (DL 24/2014, art. 10.º).
>
> **Uma pergunta que isto levantou:** as fotografias do sítio parecem
> geradas, não tiradas às peças. Se forem ilustrativas, isso tem de ser dito,
> ou substituídas por fotografias reais — mostrar como produto uma imagem que
> não o é é outra forma da mesma prática desleal.

---

# Fase 3 - Conteúdo e conta

## F10. Páginas institucionais

> **Feita em 23/09/2026.**
>
> O rodapé ligava para quatro páginas que não existiam: **quatro 404 em todas
> as páginas do sítio**. Havia três saídas e a escolhida foi a terceira —
> deixar os 404, criar páginas a dizer "em preparação", ou **o rodapé só
> mostrar o que existe**. Uma página legal a fingir é pior do que nenhuma:
> quem a encontre pode pensar que já tem valor.
>
> `src/lib/paginas.ts` é agora a fonte única. O rodapé lê dela, e o `robots.ts`
> passou a exigir também que as páginas obrigatórias existam — já exigia a
> variável de ambiente e a identificação preenchida; são três condições.
>
> Feito: `/contacto` autónomo, com a identificação do prestador exigida pelo
> art. 10.º do DL 7/2004. `/faq` com lista vazia, de propósito — um FAQ
> inventado compromete o negócio com condições que ninguém decidiu. 404 e 500
> reescritas **com cabeçalho e rodapé**: estavam sem, e uma página de erro é o
> momento em que a navegação faz mais falta, não menos. `global-error.tsx`
> acrescentado para erros no próprio layout.
>
> Também: o rodapé e o `/sobre-nos` tinham `+351 xxx xxx xxx` e
> `info@petalasdesonho.pt` escritos à mão. Passam a ler de `EMPRESA`, e há um
> teste que falha se um contacto voltar a ser escrito à mão em qualquer `.tsx`.
>
> Por fazer, e bloqueado no negócio: `/termos` e `/envios`.


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

- ~~Substituir as encomendas mock por um estado vazio honesto~~ — feito
- ~~Exportar dados e apagar conta, vindos de F6~~ — feito. Era o mais urgente
  dos quatro e não por estar no roteiro: a política de privacidade prometia
  «apaga-se quando a apagar» sem haver como apagar. Ver `DADOS-PESSOAIS.md`
- ~~Editar o nome~~ — feito em 23/09/2026. A área pessoal dizia «para alterar
  o nome, contacte-nos», com os contactos a `null` até à F4: o direito de
  retificação (art. 16.º) não tinha caminho. `PATCH /api/conta` aceita o nome
  e **só** o nome — um esquema `strict()` recusa `role`, `email` ou qualquer
  outro campo, em vez de os ignorar. A sessão relê o nome da base de dados,
  nunca o que o cliente manda
- **O email continua fixo, de propósito.** Mudá-lo exige provar a posse do
  endereço novo, que é outro fluxo. Não é bloqueante: a conta pode ser apagada
  e criada de novo, e o pedido pode ser feito pelo contacto quando existir
- A morada só passa a fazer sentido quando o checkout existir — guardá-la
  agora é guardar um dado pessoal que ninguém usa. **Passa para a v2**
- ~~Favoritos~~ — **passam para a v2, e o coração saiu.** Mudava de cor e não
  guardava nada. Construí-los agora era trabalho de loja numa versão que é
  institucional; deixá-lo era um controlo a mentir. O separador «Favoritos»
  da área pessoal, que prometia «guarde aqui as peças», saiu com ele
- ~~O botão de partilhar do produto~~ — não tinha `onClick`. Passou a usar a
  partilha nativa, ou a copiar a ligação onde ela não existe. Há agora uma
  guarda que falha se algum `<button>` do sítio não tiver acção nenhuma

---

# Fase 4 - Qualidade

## F13. Acessibilidade

> **Feita em 22/09/2026.** O detalhe está em `docs/ACESSIBILIDADE.md`.
>
> **A obrigação legal provavelmente não se aplica** — microempresa de serviços
> está isenta, e o negócio é empresário em nome individual. Fica dito porque
> dizer o contrário seria fabricar uma obrigação para justificar trabalho.
>
> A auditoria com `axe` em dez páginas e dois tamanhos deu **três regras
> violadas**: o botão secundário a 2,01:1 sobre ameixa, doze ligações que só se
> distinguiam pela cor, e uma tabela com deslocamento sem acesso por teclado.
>
> O que o `axe` não apanha era onde faltava trabalho: **não havia ligação para
> saltar a navegação** (quatro tabulações até ao conteúdo em todas as páginas)
> e vários controlos abaixo de 24×24. O critério aplicado é o 2.5.8 da WCAG 2.2
> (24×24, com isenção para ligações em frases), não os 44×44 que são AAA.


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

> **Feita em 22/09/2026.** O detalhe está em `docs/PERFORMANCE.md`.
>
> **A fase desmentiu o que estava escrito aqui.** Esta secção dizia que as
> imagens pesavam ~450 kB cada na entrega. Medido: o otimizador do Next já
> estava a funcionar e o browser recebia 15–26 kB nos cartões. Os 3,7 MB são
> tamanho de repositório, não de entrega.
>
> O que valeu: qualidade de 90 para 82 (medido, 42,4 dB de PSNR, indistinguível
> a 100%) e `sizes` em oito imagens que o não tinham — sem ele, a miniatura de
> 80 px do carrinho pedia a imagem a 1920 px. **582 kB passam a 287 kB.**


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

- ~~`sitemap.ts`~~ — feito em 23/09/2026. O `robots.ts` já o anunciava e
  ele não existia. Só lista o que é público e existe; as rotas privadas saem
  da mesma lista que o `robots.ts` bloqueia (`src/lib/site.ts`)
- Open Graph com imagem por página
- JSON-LD: `Organization`, `LocalBusiness`, `BreadcrumbList` e, mais tarde,
  `Product`. **Bloqueado na F4**: `Organization` sem nome, morada nem
  contactos é um bloco vazio, e inventá-los é o que o `empresa.ts` impede
- ~~Canónicos~~ — feito. O `lang` já estava certo (`pt-PT`)
- ~~Revisão dos títulos~~ — feito, e era mais do que SEO: **oito páginas
  tinham o mesmo título**, o que falha o 2.4.2 da WCAG, nível A. Ver
  `docs/ACESSIBILIDADE.md`

**Fica por confirmar o domínio.** `https://petalasdesonho.pt` é o valor por
omissão desde o início do projeto e ninguém confirmou que é o do negócio. Os
canónicos e o mapa do sítio dizem aos motores de busca qual é o endereço
verdadeiro de cada página: com o domínio errado, dizem-lhes o de outra
pessoa. Em produção, `NEXT_PUBLIC_SITE_URL` tem de estar definido.

---

## F7b. Consentimento, quando a loja o obrigar

**Não é agora, e não é a loja em si que o obriga.** Fica registado aqui para
não ser decidido à pressa no dia em que fizer falta.

### O que não obriga

Vender não obriga. Aceitar pagamentos não obriga, desde que se respeite a regra
abaixo. Guardar o carrinho, manter a sessão, lembrar a morada de envio — tudo
isso é necessário ao serviço que a pessoa pediu, e continua isento.

### A armadilha do Stripe

O `stripe.js` coloca cookies de deteção de fraude (`__stripe_mid`,
`__stripe_sid`) **no instante em que carrega**, antes de qualquer interação. A
documentação da Stripe recomenda carregá-lo em **todas as páginas**, porque dá
mais sinal ao motor de fraude.

**Não fazer isso.** Carregado só onde há pagamento a decorrer, é defensável
como necessário a um serviço que a pessoa pediu. Carregado na página inicial,
não é — e passa a exigir consentimento em todo o sítio, por uma otimização de
fraude que ninguém pediu.

Regra: `stripe.js` entra por rota, nunca no `layout` raiz. Há um teste em
`e2e/privacidade.spec.ts` que falha se uma página pública contactar um
terceiro; esse teste protege isto sem ser preciso lembrar.

O mesmo raciocínio vale para o checkout alojado da Stripe: o redirecionamento
acontece depois de a pessoa escolher pagar, e os cookies são do domínio da
Stripe, sob a política dela.

### O que obriga mesmo

| | porquê |
|---|---|
| Análise de tráfego | saber o que vende é interesse do negócio, não necessidade de quem visita |
| Píxeis de remarketing (Meta, Google Ads) | publicidade, nunca isento |
| Testes A/B | segmenta a pessoa sem ela pedir |
| Chat de apoio de terceiro | carrega e identifica antes de a conversa existir |
| Vídeos incorporados | mesmo problema do mapa, resolvido da mesma maneira |

Nada disto é inevitável. É tudo escolha do negócio, e vale a pena decidir
sabendo o que cada uma custa em cumprimento.

### Quando for preciso, o que tem de ter

As regras que a maioria dos banners falha, e que já estão discutidas em
`docs/COOKIES.md`:

- Consentimento **antes** de colocar o cookie, não em paralelo
- **"Rejeitar tudo" com o mesmo destaque visual que "aceitar tudo".** Um botão
  cinzento pequeno ao lado de um colorido grande não cumpre
- Granular por finalidade, nada pré-selecionado
- Retirar tão fácil como dar: ligação permanente no rodapé
- Sem muro de cookies — recusar não pode bloquear o acesso

### A arquitetura já está lá

`src/lib/preferencias.ts` não é código específico do mapa: é um registo de
preferências por finalidade, com evento para os componentes reagirem. O mapa é
a primeira finalidade. Acrescentar "análise de tráfego" ou "publicidade" é
estender esse módulo e o painel em `/cookies`, não recomeçar.

O que muda no dia em que houver uma finalidade não isenta é **onde se pergunta**:
o controlo junto ao recurso deixa de chegar, porque um *script* de análise não
tem um lugar visível na página onde a pessoa o encontre. Aí sim, o aviso à
entrada passa a ser a resposta certa — pela razão certa, e não por reflexo.

### Prioridade

Depois da v1.0.0, e **antes** de qualquer integração de medição ou publicidade.
Não é trabalho que se faça a seguir ao facto: o consentimento tem de existir
antes do primeiro cookie, não depois do primeiro relatório.

---

# v2.0.0 - A loja, fora do âmbito desta versão

Fica registado para não se perder:

- `/checkout` com Stripe, que hoje é um 404 no CTA principal do carrinho
- Modelo de encomenda, estados e histórico reais
- Emails transacionais
- Gestão de stock
- Faturação certificada, obrigatória em Portugal
- Condições gerais de venda e formulário de livre resolução
- Favoritos e morada guardada na conta, retirados da F12
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
F5  Livro de Reclamações e RAL   feita (CICAP); confirmar a morada na AMP
F6  Proteção de dados            precisa de validação jurídica
F7  Cookies                      depende de F6
F8  Termos                       precisa de validação jurídica
F9  Afirmações comerciais        texto geral feito; fotografias por esclarecer
F10 Páginas institucionais       feita; /termos e /envios bloqueados
F11 Segurança                    independente, pode correr em paralelo
F12 Área pessoal                 feita; favoritos e morada passam à v2
F13 Acessibilidade               feita
F14 Performance                  feita
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
