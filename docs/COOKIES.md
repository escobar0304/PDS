# Cookies e armazenamento local

Feito na F7. A página pública é `/cookies`.

## A conclusão, primeiro

**O site não precisa de banner de consentimento.** Tudo o que guarda no
equipamento de quem o visita é estritamente necessário e está isento ao abrigo
do artigo 5.º, n.º 3 da Diretiva ePrivacy e do artigo 5.º da Lei 41/2004.

Isto não foi assumido. Foi medido.

## Como foi medido

Carregou-se a versão de produção num browser limpo, percorreram-se as páginas
públicas (`/`, `/loja`, `/catalogo`, `/sobre-nos`, `/carrinho`, `/auth/login`)
e leram-se os cookies, o `localStorage`, o `sessionStorage` e todos os pedidos
a domínios externos.

Resultado:

| | encontrado |
|---|---|
| Cookies | 2 (`next-auth.csrf-token`, `next-auth.callback-url`) — ambos `httpOnly`, ambos de sessão |
| `localStorage` | `cart`, `nextauth.message` (e `pds.mapa`, se ligar o mapa) |
| `sessionStorage` | nenhum |
| Domínios externos | **`www.google.com`** |

Sem análise de tráfego, sem publicidade, sem tipos de letra de CDN (o
`next/font` serve-os do próprio domínio), sem píxeis de redes sociais. As
ligações para o Facebook e o Instagram no rodapé são `<a href>`, não carregam
nada.

## O único problema era o mapa

O `<iframe>` do Google Maps em `/sobre-nos` carregava assim que a página
abria. Isso é um pedido a um terceiro: a Google recebia o IP e o *referer* de
quem visitasse a página, e podia colocar informação no equipamento, antes de
a pessoa dizer o que quer que fosse.

Passa despercebido a auditorias que só olham para `document.cookie`, porque o
cookie não é do site. Mas a Diretiva ePrivacy não distingue pela origem: o que
conta é o acesso ao equipamento.

## Porquê isto e não um banner

O banner é a resposta automática, e aqui seria a errada.

**Pediria consentimento para coisas que não precisam dele.** As orientações da
CNPD são claras em que não se pede autorização para o que está isento; fazê-lo
treina as pessoas a carregar em "aceitar" sem ler, e finge uma escolha que, para
tudo menos o mapa, não existe.

**Havia um terceiro, num sítio só.** Pedir onde ele está custa menos a quem
visita do que uma barra em todas as páginas, e a informação chega no momento em
que é relevante em vez de num aviso genérico à entrada.

## Como está feito

A escolha vive **no mapa**, e o painel em `/cookies` é o ponto permanente.

**No mapa**, um aviso curto — "Onde estamos, mapa fornecido pela Google" — um
botão *Ver o mapa*, e uma caixa *Mostrar sempre, sem perguntar*. Sem a caixa, o
mapa aparece só naquela visita. Com ela, fica. Quando aparece por preferência
guardada, a linha por baixo diz *Deixar de mostrar* e desliga-a num clique.

**Em `/cookies`**, a explicação inteira e um interruptor com o mesmo efeito,
ligado do rodapé em todas as páginas.

### Porquê no mapa e não num aviso à entrada

Duas razões, e a primeira é legal.

**O consentimento tem de ser informado**, e só é informado quando a pessoa sabe
do que se trata. Junto ao mapa está a olhar para o sítio do mapa. Num aviso à
entrada do site estaria a decidir sobre uma página que ainda não viu e que
talvez nunca veja — Sobre Nós é página secundária.

**Retirar tem de ser tão fácil como dar.** Dar é uma caixa junto ao botão;
retirar é um clique na linha por baixo do mapa, no mesmo sítio. Se o controlo
vivesse só em `/cookies`, dar custava um clique e retirar custava três — e
`/cookies` é uma página onde praticamente ninguém entra. **Isto foi uma
correção do dono do negócio**, que notou que o painel de definições é um sítio
estranho para o controlo. Tinha razão quanto ao problema; a solução não foi o
banner que propôs, mas trazer o controlo para onde a decisão faz sentido.

### E porque continua a não haver banner

A primeira versão desta fase punha a explicação toda no lugar do mapa, a falar
de endereços IP. Era linguagem de auditoria num sítio onde alguém só quer ver
onde fica a loja, e foi corrigida. Mas o passo seguinte — um aviso de cookies à
entrada — foi discutido e recusado, por quatro razões:

1. **Pedia uma decisão sem contexto**, sobre um mapa que a pessoa ainda não viu
2. **Criava a obrigação que serve para cumprir.** Hoje nada no site exige
   consentimento; um aviso à entrada afirma a todos os visitantes que exige, o
   que é falso e treina as pessoas a despachar a caixa sem ler
3. **A proporção é má:** dispara em todas as visitas para controlar um recurso
   que uma minoria alcança
4. **É o elemento que assinala "site feito por modelo".** A auditoria inicial
   deste projeto existiu precisamente para tirar esses elementos

## A rede

`e2e/privacidade.spec.ts` falha se:

- qualquer página pública contactar um domínio externo sem interação
- o mapa carregar sozinho
- carregar em *Ver o mapa* sem marcar a caixa passar a valer além daquela visita
- deixar de haver forma de retirar a escolha no próprio mapa
- a caixa ou o interruptor aparecerem ligados num browser limpo
- a preferência passar a ser um cookie, ou seja, a viajar para o servidor
- aparecer um cookie ou uma chave de `localStorage` que `/cookies` não declare

O valor está em falhar no dia em que alguém acrescentar um script de análise ou
um tipo de letra de um CDN, e obrigar a atualizar a página antes de a alteração
chegar a produção.

## Quando é que isto muda

Está planeado na **F7b** do roteiro. O resumo: vender não obriga a banner, e
aceitar pagamentos também não, desde que o `stripe.js` seja carregado por rota
e nunca no `layout` raiz — carregado em todas as páginas, os cookies de fraude
que ele põe deixam de ser isentos.

O que obriga mesmo é análise de tráfego, publicidade, testes A/B, chat de apoio
de terceiro e vídeos incorporados. Nada disso é consequência de ter loja: é
escolha do negócio.

`src/lib/preferencias.ts` já é um registo de preferências por finalidade, não
código específico do mapa. Acrescentar finalidades é estendê-lo, não
recomeçar.

## O que isto não é

Esta fase trata do **armazenamento no equipamento**. Os dados pessoais que o
site recolhe — nome, email, password, mensagens do formulário de contacto — e
os direitos de quem os fornece são a F6, e continuam por fazer. O conteúdo
desta página e da política de privacidade deve ser validado por quem tenha
competência legal antes de ir para o ar.
