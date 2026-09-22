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

Em dois níveis, porque servem pessoas diferentes.

**No mapa**, um aviso curto: "Onde estamos — mapa fornecido pela Google", com um
botão. Quem está ali quer ver onde fica a loja, não ler sobre tratamento de
dados. Carregar no botão mostra o mapa **só naquela visita**.

**Em `/cookies`**, a explicação inteira — o que a Google passa a saber, e porquê
— e um interruptor *Mostrar sempre o mapa*. Ligado, o mapa aparece logo, sem
botão. A preferência fica em `localStorage`, na chave `pds.mapa`, e nunca chega
ao servidor.

A primeira versão desta fase punha a explicação toda no lugar do mapa, a falar
de endereços IP. Era linguagem de auditoria num sítio onde alguém só quer ver
onde fica a loja. **Isto veio de uma correção do dono do negócio**, e está
melhor: o aviso é proporcional ao momento, e a explicação está onde quem a
procura a vai procurar.

Guardar a escolha é consentimento, e consentimento exige poder retirá-lo tão
facilmente como se deu. Aqui é o **mesmo interruptor**, no mesmo sítio, com o
mesmo peso visual — que é onde a maioria dos painéis falha, ao esconder o
"rejeitar" num canto. Começa desligado e nada está pré-selecionado.

## A rede

`e2e/privacidade.spec.ts` falha se:

- qualquer página pública contactar um domínio externo sem interação
- o mapa carregar sozinho
- carregar em *Ver o mapa* passar a valer para além daquela visita
- o interruptor aparecer ligado num browser limpo
- a preferência passar a ser um cookie, ou seja, a viajar para o servidor
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
