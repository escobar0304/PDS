# Segurança

F11.1 e F11.2, feitas em 22/09/2026. A F11.3 (verificação de email, recuperação
de password) fica por fazer.

## O que esta fase entrega

**Automação, não correções.** Corrigir as quatro rotas que existem hoje resolve
hoje. O que evita a repetição daqui a seis meses são os testes que falham
quando o padrão volta.

Uma correção de segurança sem teste é uma fotografia que envelhece.

## O relay de correio

`POST /api/contact` enviava uma cópia para `to: email` — o endereço que quem
submetia escrevia — com `${name}` e `${message}` interpolados em HTML, sem
autenticação e sem limite.

Qualquer pessoa fazia o servidor de correio do negócio enviar **HTML à escolha
dela, para o endereço à escolha dela**, com o domínio e a reputação de SMTP do
negócio. A consequência pior não era o email adulterado que chegava ao negócio:
eram vítimas enganadas em nome da loja, o domínio em listas negras e a conta de
SMTP suspensa.

Três mudanças:

**A cópia para quem submete desaparece.** Era ela que tornava o destino
escolhível por terceiros. Limitar o conteúdo não chegava — mesmo em texto
simples, continuava a ser possível encher a caixa de correio de uma vítima a
partir dali. O único destino é agora o endereço do negócio, fixo no ambiente.

**Texto simples em vez de HTML.** Sem HTML não há injeção de HTML. Escapar
também resolvia, mas deixava a próxima pessoa a mexer nisto livre de voltar a
esquecer-se; não haver HTML nenhum não deixa.

**Limite de pedidos**, por IP e por endereço indicado.

## Injeção NoSQL

Não é SQLi — não há SQL. É outra classe de bug, com outra mitigação: validação
de tipo, não consultas parametrizadas.

O problema não era "campo em falta" — isso já era verificado com um `if`. Era o
tipo. Um parâmetro de URL chega sempre como texto; o corpo em JSON aceita
objetos. `{"email": {"$ne": null}}` passa num `if (!email)` e transforma
`findOne({ email })` em "devolve-me um utilizador qualquer".

Todas as rotas passam agora por `lerCorpo` com um esquema Zod. O Zod foi
deliberadamente adiado na F0; é aqui que se paga.

Nota: `/api/auth/register` estava salvo **por acaso** — validava o formato do
email por expressão regular, e `regex.test({})` compara contra `"[object
Object]"` e falha. Mas `name` e `password` não tinham essa rede, e ninguém
tinha escrito aquela linha a pensar nisso.

## Enumeração de contas

A autenticação distinguia "Utilizador não encontrado" de "Password incorreta".
Isso entrega a lista de emails com conta a quem estiver a sondar.

Havia um segundo canal, mais discreto: **o tempo**. Não existindo a conta,
respondia-se de imediato; existindo, esperava-se pelo argon2. Agora verifica-se
sempre, contra um hash de referência quando a conta não existe, e a mensagem é
uma só.

## Controlo de acesso — o que foi encontrado por engano

`POST /api/categories` **criava categorias na base de dados sem verificação
nenhuma.** Qualquer pessoa na internet podia escrever ali.

Vale registar como foi encontrado: **não foi por procura**. Tinha concluído,
numa análise anterior, que controlo de acesso quebrado não se aplicava ao
projeto por não haver rotas de administração no `master`. Estava errado. Foi o
teste `rotas-seguras.test.ts`, escrito para outra coisa — verificar validação
do corpo — que o apanhou na primeira execução.

A lição está na regra, não no bug: a página de administração estar protegida
não protege a API. Quem chama a API não passa pela página.

`src/lib/autorizacao.ts` ganha `exigirAdmin()`, com um resultado de duas saídas
para obrigar a rota a tratar o caso negativo em vez de o poder ignorar.

## Cabeçalhos

CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` e HSTS, em `next.config.js`.

A CSP está escrita a partir do que o site faz, não de um modelo: `frame-src`
permite a Google por causa do mapa, `img-src` permite `data:` por causa do
ícone do `<select>`. Fica registada como dívida o `'unsafe-inline'` em
`script-src`, que o Next exige para os dados de hidratação e que só sai com
`middleware` e nonce por pedido.

`preload` fica de fora do HSTS de propósito: entrar na lista de pré-carregamento
é difícil de reverter e decide-se com o domínio já estável.

## A rede

| Teste | Falha quando |
|---|---|
| `rotas-seguras.test.ts` | uma rota nova lê o corpo sem `lerCorpo`, monta HTML por interpolação, ou deixa o destino de email vir do pedido |
| `validacao.test.ts` | um esquema passa a aceitar operadores do Mongo, arrays ou números onde espera texto |
| `limites.test.ts` | a contagem, a janela ou o `Retry-After` deixam de funcionar |
| `e2e/seguranca.spec.ts` | uma rota real aceita um operador, a escrita fica aberta, o limite deixa de travar, ou um cabeçalho desaparece |

Os unitários e os de ponta a ponta verificam a mesma coisa por lados
diferentes: um que o esquema recusa, outro que a rota responde 400. Falham por
razões diferentes, e é por isso que existem os dois.

## Limitações conhecidas

**O limite de pedidos é em memória.** Com mais do que uma instância, cada uma
conta os seus. Para o tráfego deste sítio é a diferença entre nenhuma proteção
e proteção suficiente para tornar o abuso desinteressante; com mais instâncias,
passa para Redis sem a interface mudar.

**`x-forwarded-for` pode ser forjado** por quem fale com a aplicação
diretamente. Trava abuso casual e automatizado, não um atacante decidido — para
esse, o limite tem de estar na borda.

## Por fazer

- **F11.3:** verificação de email (as contas nascem `emailVerified: false` e
  nunca são verificadas), recuperação de password (`/auth/recuperar-password`
  dá 404)
- **Manipulação de preço**, quando o checkout existir. O carrinho guarda preços
  em `localStorage`; a regra está no `CLAUDE.md`
- **Rotas de administração** que virão da `redesign-geral` — passam todas por
  `exigirAdmin()`
