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
| `localStorage` | `cart`, `nextauth.message` |
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

## Porquê carregamento por clique e não um banner

O banner é a resposta automática, e aqui seria a errada.

**Um banner pediria consentimento para coisas que não precisam dele.** As
orientações da CNPD são claras em que não se pede autorização para o que está
isento; fazê-lo treina as pessoas a carregar em "aceitar" sem ler, e finge uma
escolha que não existe.

**Havia um terceiro, num sítio só.** Pedir uma vez, onde está, custa menos a
quem visita do que uma barra em todas as páginas. E a informação chega no
momento em que é relevante, em vez de num aviso genérico à entrada.

**Um banner traz consigo obrigações que a solução simples não tem:** guardar o
consentimento, dar onde o retirar com a mesma facilidade, registar quando foi
dado. Tudo isso existe para resolver um problema que o site deixa de ter.

A escolha de carregar o mapa **não é guardada de propósito**. Guardá-la seria
consentimento, e consentimento exige forma de o retirar — ou seja, exigia o
banner que esta decisão evita.

## A rede

`e2e/privacidade.spec.ts` falha se:

- qualquer página pública contactar um domínio externo sem interação
- o mapa carregar sozinho
- a escolha do mapa passar a ser guardada
- aparecer um cookie ou uma chave de `localStorage` que `/cookies` não declare

O valor está em falhar no dia em que alguém acrescentar um script de análise ou
um tipo de letra de um CDN, e obrigar a atualizar a página antes de a alteração
chegar a produção.

## Quando é que isto muda

Se for acrescentada análise de tráfego, publicidade, remarketing, chat de apoio
de terceiro, vídeos incorporados, ou o processador de pagamentos a carregar
*scripts* em páginas onde ainda não há intenção de pagar — aí é preciso
consentimento a sério, e o banner passa a ser a resposta certa. Nessa altura
valem as regras que a maioria falha: "rejeitar tudo" com o mesmo destaque que
"aceitar tudo", nada pré-selecionado, e retirar tão fácil como dar.

## O que isto não é

Esta fase trata do **armazenamento no equipamento**. Os dados pessoais que o
site recolhe — nome, email, password, mensagens do formulário de contacto — e
os direitos de quem os fornece são a F6, e continuam por fazer. O conteúdo
desta página e da política de privacidade deve ser validado por quem tenha
competência legal antes de ir para o ar.
