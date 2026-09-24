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

## C1. Dinheiro em cêntimos

`19.9` em vírgula flutuante não é 19,90 €: `0.1 + 0.2 !== 0.3`, e somar
quantidades por portes arredonda mal ao terceiro produto. Todos os fornecedores
de pagamento pedem inteiros em cêntimos.

**Fazer agora** é barato porque a base de dados não tem produtos. Depois da
primeira encomenda, é uma migração com dinheiro real no meio.

## C2. Peças únicas ou modelos com medida

**Bloqueado: decisão tua.** Disseste que "as peças vão ter medida e as pessoas
escolhem o que querem". Isso pode querer dizer duas coisas, com modelos de dados
diferentes:

| | peça única | modelo com medidas |
|---|---|---|
| exemplo | *esta* drusa de ametista, fotografada | anel de quartzo rosa, tamanhos 14 a 20 |
| stock | 1, e desaparece ao vender | por medida |
| fotografia | tem de ser a da própria peça | pode ser de um exemplar, dito como tal |
| modelo | o que existe hoje chega | variantes, cada uma com stock e talvez preço |

É provável que sejam as duas, por categoria: cristais em bruto únicos, anéis
por tamanho. O modelo tem de suportar as duas antes do painel de produtos ser
escrito, senão escreve-se duas vezes.

## C3. Painel de produtos

Criar, editar, desativar (nunca apagar: uma encomenda aponta para o produto),
peso obrigatório — os portes dependem dele —, e imagens.

**O código faz-se agora. As imagens, não:** precisam de sítio onde ficar, e
esse sítio é um subcontratante (ver "Alojamento" em
`REGISTO-TRATAMENTOS.md`), por decidir.

## C4. Painel de categorias

Hoje só há a rota da API. Pequeno, e depende da C3 só para reaproveitar os
componentes.

---

# Fase 2 - Encomenda

## E1. Preço e portes calculados no servidor

O carrinho guarda o preço que o produto tinha quando lá entrou. O servidor
**nunca** o lê: recebe identificadores e quantidades, e calcula tudo a partir
da base de dados. Um carrinho editado à mão no browser tem de dar o mesmo
total que um honesto.

Os portes saem de `CONDICOES.tabelaPortes` e do peso de cada peça. **O cálculo
faz-se agora**; enquanto a tabela for `null`, o checkout não abre — exatamente
como o `robots.ts` não deixa indexar.

## E2. Stock

Duas pessoas a comprar a última peça ao mesmo tempo: só uma pode conseguir. A
reserva é uma operação atómica na base de dados (`stock >= quantidade` na
própria condição da atualização), não um "ler, verificar, escrever". Uma
reserva cujo pagamento não chega a acontecer liberta-se sozinha.

Faz-se agora. **Só se sabe verdadeira no CI**, contra um MongoDB real.

## E3. Estados, histórico e numeração

Estados com transições permitidas (não se expede uma encomenda por pagar),
cada mudança registada com data e autor, e um número de encomenda legível que
não seja o `_id`. Faz-se agora.

---

# Fase 3 - Pagamento

## E4. Fornecedor de pagamentos

**Decisão tua, com uma medição minha primeiro.** A v1 assumiu Stripe. Não está
errado, mas não foi comparado: em Portugal, **MB WAY e Multibanco** pesam mais
do que o cartão, e há fornecedores portugueses que os tratam como primeira
classe. Comparo antes de escrever uma linha: meios suportados, comissão por
transação, e o que cada um exige para abrir conta.

Seja qual for, as regras já estão decididas:

- o script do fornecedor carrega **só na rota de pagamento**, nunca no layout
  raiz (ver F7b no roteiro da v1 — carregado em todo o sítio, obriga a pedir
  consentimento em todo o sítio)
- o estado "pago" só vem do aviso servidor-a-servidor do fornecedor (*webhook*),
  com assinatura verificada, e processar o mesmo aviso duas vezes não pode
  fazer nada duas vezes
- nunca da página para onde a pessoa volta: essa pode ser aberta à mão

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

**Comprar sem conta: decisão tua.** Recomendo que sim. Obrigar a criar conta
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
2. **O regime de IVA.** A v1 diz em `/envios` e `/termos` que os preços incluem IVA. Se
   a atividade estiver no regime de isenção do art. 53.º do CIVA, não se cobra
   IVA e essa frase é falsa **hoje**, não só na v2. Confirma com o
   contabilista antes de a v1 ir para o ar
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

Não é uma fase no fim: cada ponto entra no PR que o torna verdadeiro.

| | entra com |
|---|---|
| Termos: quando o contrato fica celebrado, meios de pagamento | E5 |
| Privacidade e registo: encomendas (base legal contrato e obrigação fiscal), fornecedor de pagamentos, programa de faturação, CTT | E3, E4, P2 |
| Cookies: o script de pagamento, só na rota dele, e o teste que o garante | E4 |
| CSP: os domínios do fornecedor de pagamento | E4 |
| **CSP sem `'unsafe-inline'`** | antes da E4 |

O último é dívida da v1 e faz-se agora. Um sítio com um formulário de pagamento
é o sítio onde um *script* injetado mais custa. Os *nonces* tornam as páginas
dinâmicas; **o custo mede-se antes** — é o tipo de coisa que a
`PERFORMANCE.md` já desmentiu uma vez.

---

# O que se faz já, e o que espera

## Agora, sem depender de ninguém

```
L1  /sucesso e /falha saem                feito
L2  a dependência stripe sai              feito
L3  /admin protegido, com teste           feito
C1  preços em cêntimos
E1  cálculo de total e portes no servidor
E2  reserva de stock atómica           (verdadeira só depois do CI)
E3  estados, histórico, numeração
    CSP sem 'unsafe-inline'            (medir o custo primeiro)
    comparação de fornecedores de pagamento, para decidires a E4
```

## Código agora, ligar depois

| | falta para ligar |
|---|---|
| C3 painel de produtos | onde ficam as imagens (alojamento) |
| E4 pagamento | a tua escolha de fornecedor, e a conta dele (NIF, IBAN) |
| E5 checkout | tabela de portes, prazo de entrega, levantamento na loja |
| P1 email de confirmação | fornecedor de email |
| P3 painel de encomendas | nada além da E3 |

## Espera por ti

| | pergunta |
|---|---|
| C2 | peças únicas, modelos com medida, ou as duas — e em que categorias |
| E4 | fornecedor de pagamentos, depois da comparação |
| E5 | comprar sem conta: sim ou não |
| E5 | levantamento na loja (já estava pendente da v1) |
| C3, P1 | alojamento, base de dados, email (já estavam pendentes da v1) |
| Favoritos | se aceitas deixá-los de fora |

## Espera por terceiros

| | de quem |
|---|---|
| Regime de IVA — **afeta a v1** | contabilista |
| Programa de faturação certificado | contabilista |
| Prazo de conservação fiscal | contabilista |
| Termos de venda e política atualizados | jurista |

---

## Ordem de execução

```
v1.0.0 publicada
  │
  ├─ L1 L2 L3                   já
  ├─ C1 ── C2 ── C3 ── C4       C2 é decisão tua
  ├─ E1 ── E2 ── E3             já, depois da C1
  ├─ CSP                        já, antes da E4
  ├─ E4 ── E5                   fornecedor escolhido, portes preenchidos
  ├─ P1 ── P3 ── P4             depois da E5
  ├─ P2                         contabilista
  └─ Conta                      depois da P1
```
