# Mostrar a loja

> Como pôr a loja a funcionar num computador e mostrá-la a alguém. Medido a
> 30/09/2026, num browser, a partir de um arranque limpo.

## O que é preciso

- **Docker Desktop** instalado e aberto ([docker.com](https://www.docker.com/products/docker-desktop/)).
- Este repositório no computador: `git clone`, ou "Code → Download ZIP" no
  GitHub.

## Antes da demonstração (uma vez, uns 5 minutos)

Na pasta do repositório:

```
docker compose up --build
```

A primeira vez demora (aqui foram 2–3 minutos). Está pronto quando aparecer
`Ready` nas linhas do `sitio`. Deixa a janela aberta.

Usa **as portas 3001 e 8026**, e não as da montra (3000 e 8025), para as
duas poderem estar abertas ao mesmo tempo e comparar.

Depois, **define a palavra-passe da gestão**:

1. Abre http://localhost:3001/auth/login e carrega em "Esqueci a password".
2. Escreve `gestao@exemplo.pt`.
3. Abre o correio em http://localhost:8026, segue a ligação do email e
   escolhe a palavra-passe.
4. Entra com ela. Na primeira vez a loja pede para declarar que tens 18 anos
   ou mais: é a mesma regra que para quem compra.

## A demonstração

1. **A loja.** Início, "Sobre Nós", a Loja. As cinco peças dizem "Exemplo":
   são inventadas, com as fotografias do próprio sítio.
2. **O carrinho.** Numa peça, "Adicionar ao carrinho", e o carrinho no topo.
3. **O pagamento não abre**, e é de propósito: sem a chave de testes da
   Stripe, o carrinho diz "A loja online ainda não aceita encomendas" e
   oferece "Falar connosco". É o que um cliente vê hoje.
4. **O painel.** http://localhost:3001/admin: produtos, categorias, stock,
   vendas ao balcão.
   Numa peça nova, "Carregar fotografias" aceita uma fotografia do
   telemóvel: chega rodada como foi tirada e sem a localização GPS que o
   telemóvel lhe pôs. Numa peça sem tamanhos, a medida pode ficar em branco.
5. **A conta de cliente.** "Criar conta", com a declaração de idade; o email
   de confirmação chega ao correio (http://localhost:8026).
6. **O que falta.** O rodapé e as páginas legais mostram a vermelho "por
   preencher": é a lista do que a loja tem de decidir antes de vender.

Para comparar com a montra (receber pedidos em vez de vender), abre-a ao
lado: está em `escobar0304/pds_montra`, com o mesmo `docker compose up`.

## Para mostrar o pagamento

Precisa de uma **chave de testes da Stripe** (`sk_test_…`, conta gratuita,
nenhum dinheiro se move) e de ligar os avisos de pagamento da Stripe a este
computador. Ainda não está feito aqui: é o passo seguinte quando houver a
chave, e testa-se antes de o mostrar.

## Recomeçar do zero

```
docker compose down -v
docker compose up
```

## Se alguma coisa falhar

| Sintoma | Porquê, e o que fazer |
|---|---|
| `port is already allocated` | outra coisa usa a porta 3001 ou 8026 |
| a página não abre | ainda está a arrancar: espera pelo `Ready` do `sitio` |
| o email não chega | está em http://localhost:8026, e não na caixa de correio real |

## O que isto não é

Não é o sítio no ar, nem configuração de produção: corre só neste
computador, e as portas não abrem para a rede.
