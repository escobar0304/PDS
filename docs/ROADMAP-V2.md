# Roteiro até à v2.0.0 - Pétalas de Sonho

> Objetivo desta versão: **vender online**. Uma pessoa escolhe peças, paga, a
> encomenda chega, e se quiser desistir desiste — tudo dentro da lei e sem uma
> frase no sítio que não seja verdade.
>
> Continuação de `docs/ROADMAP-V1.md`. Uma funcionalidade por PR, na ordem abaixo.
>
> **Não sou jurista.** O que aqui se diz sobre a lei identifica obrigações; não
> as valida.

---

## Pré-condição

**A v1.0.0 publicada primeiro.** A v2 depende dos mesmos dados que bloqueiam a
v1 — sem NIF não há conta de pagamentos, nem faturação, nem termos de venda —
e mais alguns. Trabalhar na v2 enquanto a v1 espera é possível no que não
depende de ninguém, e está separado abaixo. Mas nada da v2 vai para o ar antes
de a v1 estar indexada.

---

## O que existe hoje, medido em 24/09/2026

| | estado |
|---|---|
| Produtos na base de dados | **nenhum**. O `seed` só cria categorias, e não há outra forma de criar um produto |
| `/admin` | três páginas de marcador, **sem proteção** — qualquer pessoa as abre (só não fazem nada) |
| Preços | `price: Number` em euros, com casas decimais. A Stripe e qualquer outro fornecedor trabalham em cêntimos inteiros |
| Variantes | não existem. `dimensions` é texto livre; não há como escolher uma medida |
| Modelo `Order` | existe, nunca foi escrito por código nenhum. Sem numeração, sem histórico de estados, sem IVA discriminado |
| `stripe` | nas dependências de **produção**, sem um único `import`. `src/services/stripe.ts` tem 0 bytes |
| `/sucesso` | diz "Pagamento concluído. Receberá um email de confirmação em breve" — a quem lá chegar, sem ter pago nada |
| Carrinho | só no browser, com o preço copiado do produto no momento em que entrou |

A primeira linha muda a ordem: **sem administração não há produtos, e sem
produtos não há loja.** O checkout, que parecia ser o centro da v2, é a
terceira coisa a fazer, não a primeira.

---

## Princípio de ordenação

Por dependência, como na v1:

1. Limpar o que a v1 deixou a fingir
2. O catálogo gerível — produtos, preços em cêntimos, medidas
3. A encomenda — preço, portes e stock calculados no servidor
4. O pagamento
5. Depois do pagamento — confirmação, fatura, expedição, desistência
6. A conta — histórico, morada
7. Legal e privacidade, atualizados para o que passou a existir

A 7 corre em paralelo com todas: cada PR que cria um tratamento de dados novo
atualiza a política e o registo no mesmo PR, como na v1.

---

# Fase 0 - O que a v1 deixou a fingir

Pode fazer-se já, e é defensável fazê-lo **antes** da v1 ir para o ar.

## L1. `/sucesso` e `/falha` — feito

Afirmam um pagamento que não existe. Estão fora do mapa e dos motores de
busca, mas abrem para quem escrever o endereço. Saem agora; voltam na P1, a
ler o estado real da encomenda em vez de o supor.

## L2. A dependência `stripe` — feito

Código de terceiros em produção que ninguém chama é superfície de ataque sem
contrapartida, e entra no `npm audit` sem razão. Sai agora; volta na E4, se a
Stripe for a escolha (ver E4 — não é garantido).

## L3. `/admin` sem proteção — feito

Hoje não expõe nada, porque não faz nada. O problema é o dia em que fizer: a
proteção tem de estar antes da primeira linha que lê dados.

**Não num `layout.tsx`, como estava previsto aqui.** O guia de autenticação do
Next 16 diz porquê: o layout não volta a correr ao navegar dentro do segmento,
e não impede as páginas-filhas de renderizar. Cada página chama
`paginaDeAdmin()`, e `admin.test.ts` falha se uma página nova a esquecer.

---

# Fase 1 - Catálogo

## C1. Dinheiro em cêntimos — feito

`19.9` em vírgula flutuante não é 19,90 €: `0.1 + 0.2 !== 0.3`, e somar
quantidades por portes arredonda mal ao terceiro produto. Todos os fornecedores
de pagamento pedem inteiros em cêntimos.

**Fazer agora** é barato porque a base de dados não tem produtos. Depois da
primeira encomenda, é uma migração com dinheiro real no meio.

Feito com nomes novos (`priceCents`, `totalCents`…) e não com `price` a mudar
de significado: um sítio esquecido mostraria 1990 € em vez de 19,90 €, e com o
nome novo não compila. Os esquemas recusam valores que não sejam inteiros. Os
preços passam também a escrever-se como em Portugal — `19,90 €`, e não
`19.90€` como até aqui. Os carrinhos guardados antes da mudança descartam-se:
convertê-los era adivinhar, e quem tinha um carrinho era quem testava.

## C2. Peças únicas e modelos com medida — decidido: as duas, pela categoria

**Decidido em 24/09/2026:** é a categoria que diz. Cristais em bruto são peças
únicas; anéis, por exemplo, têm medidas.

| | peça única | modelo com medidas |
|---|---|---|
| exemplo | *esta* drusa de ametista, fotografada | anel de quartzo rosa, tamanhos 14 a 20 |
| stock | 0 ou 1, e desaparece ao vender | por medida |
| fotografia | tem de ser a da própria peça | pode ser de um exemplar, dito como tal |
| no modelo | o produto, sem medidas | o produto e as suas medidas, cada uma com stock |

A categoria ganha `pecasUnicas`, e o produto herda a regra dela. O preço fica no
produto, igual para todas as medidas — **se alguma medida tiver de custar
diferente, diz**, e passa para a medida.

## O stock é um só, e é o da loja física

**Decidido em 24/09/2026:** não há encomendas a fornecedores nem peças feitas
por encomenda — tudo o que se vende está na loja. Isto tem duas consequências:

1. **Uma venda ao balcão tem de sair do sítio no mesmo instante.** Senão, o
   sítio vende uma peça que já não existe. Para uma peça única, é certo que
   acontece. O painel tem de o tornar rápido: o produto, e "vendido na loja".
2. **O stock muda-se por movimentos, nunca por valor.** "−1, vendido na
   loja", "+5, entrada", "−1, partida" — cada um com data, autor e razão. Um
   "o stock passa a ser 3" escrito por cima apagava em silêncio uma reserva
   online que estivesse a decorrer no mesmo segundo; um `−1` não apaga nada.
   É a mesma atualização condicional da E2: o stock nunca fica negativo.

E uma terceira, para quem está ao balcão: o painel mostra o que está
**reservado online** à espera de pagamento. A peça continua na prateleira
durante esses 30 minutos, e quem a vender ali tem de saber que alguém a está a
pagar.

Confirma também que a exceção à livre resolução para peças personalizadas
(`excecaoPersonalizadas: false`) fica desligada: não há peças feitas por
encomenda.

## C3. Painel de produtos

**O painel é gestão, e só isso:** produtos, medidas, stock e categorias. Criar,
editar, desativar (nunca apagar: uma encomenda aponta para o produto), peso
obrigatório — os portes dependem dele —, movimentos de stock, e imagens.

Cada ação é uma rota em `/api/admin/`, e todas cumprem as mesmas regras, com
testes que falham se uma rota nova as esquecer:

- `exigirAdmin()` antes de qualquer outra coisa (`rotas-seguras.test.ts`)
- o corpo validado por esquema, com `strict()`: campos a mais são recusados
- limite de pedidos por administrador
- a validação no formulário é só para ajudar quem preenche; o servidor repete-a
  toda (ver fase 6)

**Quem é administrador** não se decide na web. Não há página nem rota que
promova uma conta: faz-se com um *script* corrido no servidor
(`npm run admin:promover`). Uma rota que o fizesse seria a rota mais
interessante do sítio para quem o quisesse atacar.

**O código faz-se agora. As imagens, não:** precisam de sítio onde ficar, e
esse sítio é um subcontratante (ver "Alojamento" em
`REGISTO-TRATAMENTOS.md`), por decidir.

## C4. Painel de categorias

Hoje só há a rota da API. Pequeno, e depende da C3 só para reaproveitar os
componentes.

---

# Fase 2 - Encomenda

## E1. Preço e portes calculados no servidor — feito, sem rota

O carrinho guarda o preço que o produto tinha quando lá entrou. O servidor
**nunca** o lê: recebe identificadores e quantidades, e calcula tudo a partir
da base de dados. Um carrinho editado à mão no browser tem de dar o mesmo
total que um honesto.

Os portes saem de `CONDICOES.tabelaPortes` e do peso de cada peça. **O cálculo
faz-se agora**; enquanto a tabela for `null`, o checkout não abre — exatamente
como o `robots.ts` não deixa indexar.

Está em `src/lib/encomenda.ts`, e **sem rota de API, de propósito**: uma rota
sem ninguém que a chame é superfície de ataque sem uso. Entra com a E5. O que
ficou decidido pelo caminho:

- o peso passou a `weightGrams`, pela razão dos cêntimos — `weight: 250` não
  dizia se eram gramas ou quilos, e os portes dependem da resposta
- a tabela passou de texto (`"até 500 g"`, `"3,50 €"`) a números, e uma tabela
  mal preenchida (fora de ordem, em euros) conta como em falta
- nada é corrigido em silêncio: quantidade acima do stock, produto
  desativado, peça sem peso, peso acima do último escalão voltam **todos**
  como problemas, e quem pediu decide
- o esquema do pedido **recusa** um preço enviado junto, em vez de o ignorar

## E2. Stock — feito

Duas pessoas a comprar a última peça ao mesmo tempo: só uma pode conseguir. A
reserva é uma operação atómica na base de dados (`stock >= quantidade` na
própria condição da atualização), não um "ler, verificar, escrever". Uma
reserva cujo pagamento não chega a acontecer liberta-se sozinha.

Faz-se agora. **Só se sabe verdadeira no CI**, contra um MongoDB real.

**Sem transações, e porquê:** o MongoDB só as tem em *replica set*; o do CI
não é, e o de produção está por escolher. Cada peça é uma atualização atómica
condicional, e se uma falhar as já tiradas voltam ao stock. O custo é um
instante em que o stock parece menor do que é; vender o que não há não
acontece. Não há tarefa agendada no projeto: as reservas expiradas libertam-se
no início de cada encomenda nova, que é quando o stock faz falta. Os testes de
integração põem duas encomendas a disputar a última peça e duas limpezas a
correr ao mesmo tempo.

## E3. Estados, histórico e numeração — feito

Estados com transições permitidas (não se expede uma encomenda por pagar),
cada mudança registada com data e autor, e um número de encomenda legível que
não seja o `_id`. Faz-se agora.

As transições estão em `src/lib/transicoes.ts`. O número é `2026-000123`, de
um contador atómico por ano — **não é o número da fatura**, que é do programa
certificado (P2). `stripePaymentId` passou a `pagamentoId`: o fornecedor
ainda não está escolhido.

---

# Fase 3 - Pagamento

## E4. Fornecedor de pagamentos — decidido: Stripe, com a página alojada

**Decidido em 24/09/2026**, depois da comparação abaixo — que continua por
confirmar nos preçários. Com o **Checkout alojado** da Stripe: a pessoa escolhe
pagar, o servidor cria a sessão de pagamento e a pessoa é levada para a página
da Stripe. Isso decide três coisas de uma vez:

- **o `stripe.js` não carrega no nosso sítio.** Não há cookies da Stripe no
  nosso domínio, e o consentimento continua desnecessário (F7b)
- **a CSP não muda**, e a questão do *nonce* na rota do pagamento deixa de se
  pôr: não há formulário de cartão nenhum no sítio
- os dados do cartão nunca passam pelo nosso servidor

**A reserva tem de durar mais do que a sessão de pagamento.** Se a sessão e a
reserva expirassem ao mesmo tempo, um pagamento feito no último segundo podia
chegar depois de a limpeza ter cancelado a encomenda e devolvido a peça ao
stock. A reserva dura a sessão mais uma margem, e um pagamento que chegue para
uma encomenda já cancelada não se perde: fica marcado para reembolso, ou para
reativar se a peça ainda lá estiver. O prazo mínimo de uma sessão tem de ser
confirmado na documentação da Stripe.

**Este ambiente não chega à Stripe** — o proxy bloqueia `stripe.com`. O código
testa-se sem rede: a assinatura dos avisos com a própria biblioteca, a API
simulada. Um teste de ponta a ponta contra o modo de testes da Stripe precisa
das chaves de teste da tua conta, nos segredos do CI.

Seja qual for, as regras já estão decididas:

- o script do fornecedor carrega **só na rota de pagamento**, nunca no layout
  raiz (ver F7b no roteiro da v1 — carregado em todo o sítio, obriga a pedir
  consentimento em todo o sítio)
- o estado "pago" só vem do aviso servidor-a-servidor do fornecedor (*webhook*),
  com assinatura verificada, e processar o mesmo aviso duas vezes não pode
  fazer nada duas vezes
- nunca da página para onde a pessoa volta: essa pode ser aberta à mão

### Comparação preliminar — 24/09/2026

**Não confirmada na fonte.** O ambiente onde isto foi feito bloqueia os sítios
dos três fornecedores; os valores vêm de resumos de pesquisa e têm de ser
confirmados nos preçários antes de decidir. Ficam aqui pela ordem de grandeza.

| | MB WAY | Multibanco | Cartões | Mensalidade | A notar |
|---|---|---|---|---|---|
| [Stripe](https://stripe.com/en-pt/pricing/local-payment-methods) | 1,5% + 0,25 € | 1,5% + 0,25 € durante um período promocional; depois, por confirmar | 1,5% + 0,25 € (europeus) | não | uma integração só para tudo; modo de testes sem NIF; página de pagamento alojada |
| [ifthenpay](https://helpdesk.ifthenpay.com/pt-PT/support/solutions/articles/79000086484-quais-os-custos-do-servico-) | 0,7% + 0,07 € + IVA | 1,5–1,6% + 0,20 € + IVA (as fontes discordam) | por confirmar | não | português, o MB WAY mais barato |
| [Eupago](https://www.eupago.pt/tpa) | 0,7% + 0,07 € | por confirmar | por confirmar | isenta no 1.º ano | depois do 1.º ano, por confirmar |
| [easypay](https://www.easypay.pt/en/prices) | 1,5% + 0,25 € + IVA | igual | igual (+2% fora da SEPA) | não | **500 € + IVA de adesão se não transacionar nos primeiros 6 meses** — um risco real para uma loja que ainda não abriu |

Numa encomenda de 30 € paga por MB WAY: cerca de **0,28 €** na ifthenpay ou
na Eupago, contra **0,70 €** na Stripe ou na easypay (antes do IVA, onde se
aplica). A diferença é de uns 40
cêntimos por encomenda: a 100 encomendas por mês, uns 40 € por mês.

**A minha leitura, se os números se confirmarem:** Stripe para abrir. Os 40
cêntimos compram uma integração só para os três meios, um modo de testes que
não precisa do NIF — o que deixa fazer e testar a E4 e a E5 inteiras
enquanto os dados do negócio não chegam — e uma página de pagamento alojada,
onde os dados do cartão nunca passam pelo sítio. Com volume, a ifthenpay ou a
Eupago para o MB WAY passam a compensar, e a troca é num sítio só
(`lib/encomenda.ts` não sabe quem é o fornecedor). A easypay fica de fora pela
cláusula dos seis meses.

**Decisão tua.** Depende de quantas encomendas esperas, e se aceitas cartões
desde o início.

**O código pode fazer-se antes de haver conta real**, com o fornecedor simulado
nos testes. A conta de testes normalmente só pede email; a conta real pede NIF
e IBAN.

## E5. Checkout

Dados, entrega, resumo com portes e total, pagar. Com o que a lei pede e que
não é opcional:

- toda a informação pré-contratual **imediatamente antes** do botão de pagar:
  total com portes, prazo de entrega, direito de desistir
  (DL 24/2014, art. 4.º)
- o botão diz **"Encomenda com obrigação de pagar"** ou fórmula inequívoca
  equivalente (art. 5.º, n.º 3). "Continuar" não serve: sem isto, a pessoa não
  fica obrigada a pagar
- a pessoa fica a saber, antes, se a entrega é por envio ou levantamento — o
  levantamento na loja **continua por responder** (`levantamentoNaLoja`)

**Comprar sem conta: decidido em 24/09/2026 — pode.** Obrigar a criar conta
para comprar uma pedra é guardar dados de quem não pediu uma conta — contra a
minimização do RGPD —, e é a razão mais comum de desistência a meio do
checkout. A encomenda precisa de nome, email, morada e telefone de qualquer
maneira; a palavra-passe não acrescenta nada à venda.

---

# Fase 4 - Depois do pagamento

## P1. Confirmação

Email com o resumo da encomenda, as condições e o formulário de livre
resolução: **obrigatório**, em "suporte duradouro" (DL 24/2014, art. 6.º). E
as páginas de sucesso e de falha, de volta, a ler o estado real.

O código faz-se agora. **O envio depende do fornecedor de email**, por decidir
(`REGISTO-TRATAMENTOS.md`).

## P2. Faturação certificada

**Bloqueado, e não por código.** Em Portugal a fatura tem de sair de software
certificado pela AT, com ATCUD e código QR. O sítio não emite faturas: ou pede
a um programa certificado que as emita (por API), ou se certifica, o que não é
realista para uma loja. Preciso de saber:

1. **Que programa de faturação usa o teu contabilista.** Se já há um, é esse —
   integrar com outro obriga a reconciliar dois
2. **O regime de IVA.** O negócio confirmou em 24/09/2026 que os preços
   incluem IVA, e o texto fica assim. Mas isso só é verdade no regime normal:
   no regime de isenção do art. 53.º do CIVA não se cobra IVA, e a frase seria
   falsa. É um facto a confirmar com o contabilista, não uma escolha
3. **O prazo de conservação** das faturas e das encomendas. Tem de ir para a
   política de privacidade no dia da primeira venda (`src/lib/conta.ts` já
   deixou isto escrito)

## P3. Painel de encomendas

Ver, mudar de estado, marcar como expedida com o número de seguimento dos CTT,
reembolsar. Depende da E3. O código faz-se agora.

## P4. Desistência e reembolso

Hoje a `/envios` explica o direito. Na v2 tem de funcionar: registar o pedido,
reembolsar até 14 dias depois (art. 12.º) pelo mesmo meio de pagamento, e o
painel mostrar quantos dias faltam.

---

# Fase 5 - Conta

- **Histórico de encomendas** na área pessoal, e exportado com os outros dados
  (art. 20.º)
- **Apagar a conta com encomendas:** a regra já está escrita em
  `src/lib/conta.ts` — a encomenda desliga-se da conta e fica pelo prazo
  fiscal. Na v2 passa a ter teste
- **Morada guardada:** só se a pessoa a pedir guardar ao comprar. Os campos já
  existem no modelo e ninguém os preenche
- **Favoritos: discordo que entrem na v2.** Não ajudam a vender nada que o
  carrinho não ajude, e cada um é um dado pessoal a declarar e a exportar.
  Proponho medir primeiro — se o sítio tiver visitas que voltam, reabre-se

---

# Fase 6 - Legal, privacidade e segurança

## S1. Nenhuma decisão de acesso no browser

**Pedido do negócio em 24/09/2026, e é a regra que o projeto já seguia —
passa a estar escrita e testada.** O browser é de quem o usa: tudo o que lá
corre pode ser mudado. Esconder um botão, redirecionar uma página no
cliente, validar um formulário — nada disso protege coisa nenhuma. Serve para
ajudar quem usa o sítio honestamente; a decisão é sempre do servidor.

| | onde se decide | o teste que o mantém |
|---|---|---|
| páginas de `/admin` | `paginaDeAdmin()`, no servidor, em cada página | `admin.test.ts` |
| rotas de `/api/admin` | `exigirAdmin()` antes de ler o pedido | `rotas-seguras.test.ts` |
| rotas da conta | `exigirSessao()`, e só o id da sessão | `rotas-seguras.test.ts`, integração |
| todo o corpo de pedido | esquema no servidor | `rotas-seguras.test.ts` |
| preços, portes, stock | calculados no servidor a partir da base de dados | `encomenda.test.ts` |
| **limite de pedidos** | **em todos os métodos de todas as rotas**, leituras incluídas | `rotas-seguras.test.ts` |

O limite de pedidos tem uma fraqueza conhecida: vive na memória de cada
servidor. Com uma instância chega; num alojamento *serverless*, com muitas
instâncias de vida curta, cada uma conta os seus e o limite quase desaparece.
**É um critério na escolha do alojamento:** ou uma instância, ou um
armazenamento partilhado para os contadores — e esse armazenamento é mais um
subcontratante.

Não é uma fase no fim: cada ponto entra no PR que o torna verdadeiro.

| | entra com |
|---|---|
| Termos: quando o contrato fica celebrado, meios de pagamento | E5 |
| Privacidade e registo: encomendas (base legal contrato e obrigação fiscal), fornecedor de pagamentos, programa de faturação, CTT | E3, E4, P2 |
| Cookies: o script de pagamento, só na rota dele, e o teste que o garante | E4 |
| CSP: os domínios do fornecedor de pagamento | não é preciso: o pagamento é na página da Stripe (E4) |
| **CSP sem `'unsafe-inline'`** | medido, ver abaixo; com o Checkout alojado não há rota de pagamento no sítio onde o aplicar |

O último é dívida da v1. Um sítio com um formulário de pagamento é o sítio
onde um *script* injetado mais custa. **Medido em 24/09/2026, e a medição
mudou o plano** — estava "faz-se agora, no sítio todo":

| | resultado |
|---|---|
| SRI (a alternativa experimental do Next, que mantém as páginas estáticas) | **não funciona.** Cobre os ficheiros `.js`, mas os dois *scripts* em linha que o Next escreve em cada página para a hidratação ficam bloqueados, e a página deixa de funcionar |
| *Nonces* no sítio todo | funcionam: 122 de 123 testes verdes. Mas as 20 páginas estáticas passam a dinâmicas, o tempo até ao primeiro byte passa de **1,5–1,9 ms para 6,6–7,4 ms** (mediana de 300 pedidos, sem rede nem base de dados; p95 de 2,8 para 11,5 ms), deixam de se poder servir de uma CDN, e `/loja` volta a chegar com o conteúdo escondido à espera do JavaScript — o problema que saiu com o `loading.tsx` |
| Superfície que os *nonces* fechariam hoje | nenhum `dangerouslySetInnerHTML`, `innerHTML` ou `eval` no código; o React escapa o texto. O `'unsafe-inline'` é uma segunda linha de defesa, não a primeira |

**A proposta era** a CSP com *nonce* só na rota do pagamento. Com o Checkout
alojado da Stripe (E4), o formulário de cartão não está no sítio, e a proposta
cai: o `'unsafe-inline'` fica, com a condição que o sustenta guardada por
`injecao.test.ts`.

---

# O que se faz já, e o que espera

## Agora, sem depender de ninguém

```
L1  /sucesso e /falha saem                feito
L2  a dependência stripe sai              feito
L3  /admin protegido, com teste           feito
C1  preços em cêntimos                    feito
E1  cálculo de total e portes no servidor  feito; a rota entra com a E5
E2  reserva de stock atómica              feito, verificado no CI
E3  estados, histórico, numeração         feito
    CSP sem 'unsafe-inline'               medido; fica, e o Checkout alojado dispensa-o
    comparação de fornecedores de pagamento  feita; Stripe escolhida
```

Desbloqueado pelas decisões de 24/09/2026, pela ordem em que se faz:

```
S1  limite de pedidos em todas as rotas, e os testes que o exigem
C2  categorias com peças únicas ou com medidas; stock por movimentos
C3  painel: produtos, medidas, stock, categorias (API, depois páginas)
    promoção a administrador por script, nunca pela web
E4  Stripe: sessão de pagamento, aviso assinado e idempotente
E5  checkout sem conta, fechado enquanto faltarem condições
```

## Código agora, ligar depois

| | falta para ligar |
|---|---|
| C3 painel de produtos | onde ficam as imagens (alojamento) |
| E4 pagamento | as chaves de teste da Stripe para o ensaio real; as de produção pedem NIF e IBAN |
| E5 checkout | tabela de portes, prazo de entrega, levantamento na loja |
| P1 email de confirmação | fornecedor de email |
| P3 painel de encomendas | nada além da E3 |

## Espera por ti

| | pergunta |
|---|---|
| C2 | se alguma medida custa diferente das outras |
| E4 | confirmar os preços da Stripe no preçário |
| E4 | criar a conta da Stripe, e pôr as chaves **de teste** nos segredos do CI |
| E5 | levantamento na loja (já estava pendente da v1) |
| C3, P1, S1 | alojamento, base de dados, email — e o alojamento decide o limite de pedidos |
| Favoritos | se aceitas deixá-los de fora |

## Espera por terceiros

| | de quem |
|---|---|
| Regime de IVA: confirmar que é o normal, como os preços dizem | contabilista |
| Programa de faturação certificado | contabilista |
| Prazo de conservação fiscal | contabilista |
| Termos de venda e política atualizados | jurista |

---

## Ordem de execução

```
v1.0.0 publicada
  │
  ├─ L1 L2 L3 C1 E1 E2 E3      feito
  ├─ S1                         a decorrer
  ├─ C2 ── C3 ── C4             decidido; faz-se a seguir
  ├─ E4 ── E5                   Stripe; ligar pede portes, prazo e chaves
  ├─ P1 ── P3 ── P4             depois da E5
  ├─ P2                         contabilista
  └─ Conta                      depois da P1
```
