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

## F11.3 — verificação de email e recuperação de password

Feita a 22/09/2026, no mesmo dia.

### O que não existia

`emailVerified: false` estava no modelo desde o início e **nada o punha a
`true`**. Qualquer pessoa se registava com o email de outra. Hoje uma conta não
dá acesso a nada, mas dará quando houver encomendas associadas.

`/auth/recuperar-password` dava 404. Quem perdesse a palavra-passe ficava
trancado para sempre.

### O desenho dos tokens

Três decisões, e a primeira é a que importa.

**O que vai no email não é o que fica guardado.** Gera-se um token aleatório de
32 bytes, envia-se esse, e na base de dados guarda-se apenas o resumo SHA-256.
Quem leia a base de dados fica com resumos, que não servem para nada. Guardar o
token em claro transformava uma leitura da base de dados numa tomada de todas as
contas.

**Prazos diferentes por finalidade.** Verificar o email a expirar é uma
inconveniência; repor a palavra-passe a ser intercetado é uma tomada de conta.
Daí 24 horas contra 1 hora.

**Uso único por eliminação, não por marca.** O token é apagado ao ser usado. O
que não existe não pode ser reutilizado por um caminho que se esqueceu de ler a
marca.

Há ainda um índice de expiração no Mongo que limpa os vencidos, mas o prazo é
verificado também em código: esse índice corre periodicamente e pode deixar um
token expirado vivo durante minutos.

### Enumeração, outra vez — e agora pelo tempo

O pedido de reposição responde sempre o mesmo, exista a conta ou não. Isso é o
óbvio. O que se falha com frequência é o segundo canal:

**Se só se enviasse email quando a conta existe, esse caminho demorava
visivelmente mais** — e o tempo dizia o que a mensagem se recusava a dizer. O
envio não é esperado: a resposta sai imediatamente nos dois casos e o email
segue em segundo plano.

Até o erro responde igual. Uma falha da base de dados é registada e devolve a
mesma mensagem.

### A verificação não aceita GET

Pré-carregadores de ligações e antivírus de correio abrem os URL das mensagens.
Com `GET`, gastavam o token antes de a pessoa lhe tocar — e ela recebia
"ligação inválida" sem nunca a ter aberto. A página faz `POST` a partir de
JavaScript.

### Uma armadilha nos próprios testes

O teste da página de recuperação passava sozinho e falhava em conjunto. **O
limitador é por IP e vive na memória do servidor**: é partilhado por toda a
execução da suite, e um teste que esgota a quota bloqueia os seguintes que usem
a mesma rota.

Os testes que esgotam limites ficam agora no fim do ficheiro, com a razão
escrita. É o tipo de coisa que volta se não ficar registada.

## As dependências, que nunca tínhamos olhado

Toda a F11 olhou para o código que escrevemos. `npm audit --omit=dev` nunca
tinha sido corrido: **9 vulnerabilidades em dependências de produção, 2
críticas e 4 altas.** A pior superfície deste projeto não era código nosso.

| | Antes | Depois | Porque importava |
|---|---|---|---|
| `next-auth` | 4.24.5 | 4.24.15 | **Crítica.** Entrega de email ao destinatário errado; o normalizador validava o endereço antes da normalização Unicode |
| `nodemailer` | 6.10.1 | 10.0.10 | **Alta.** Email para domínio não pretendido, injeção de comandos SMTP por CRLF, e `disableFileAccess` contornável. A rota de contacto usa isto |
| `mongoose` | 8.18.3 | 8.24.1 | **Alta.** Sanitização imprópria de `$nor` no `sanitizeFilter`, e poluição de protótipo no casting de updates |
| `stripe` | 15.12.0 | 22.6.2 | Moderada, via `qs` |
| `next` | 14.2.33 | 14.2.35 | **Crítica.** Negação de serviço com Server Components |

Ficaram **4 → 3**, e nenhuma se fecha sem uma decisão maior:

**`next` continua crítica.** O 14.2.35 fecha as duas falhas com correção na
linha 14.2, mas a linha deixou de receber retroportações: mais de vinte
avisos só se fecham em `15.5.24+`. Isso é uma migração de major com mudanças
de API — `params` passa a assíncrono, entre outras — e é trabalho próprio,
com o seu PR. Não se despacha de passagem.

**`postcss` alta** vem empacotado dentro do `next`. Sai quando o `next` sair.
As falhas são a analisar CSS de origem não confiável; nós não analisamos CSS
de terceiros.

**`ip-address` alta** entra por `@next-auth/mongodb-adapter` → `mongodb@5` →
`socks`. O adapter já está na última versão e o seu *peer* prende o `mongodb`
ao `^5`; sair daqui implica o `@auth/mongodb-adapter` v3, que é para
next-auth v5. As falhas são no *parsing* de endereços SOCKS, que nunca
exercitamos — o Mongo liga diretamente.

### O `overrides` no `package.json`

O `next-auth@4.24.15` declara `nodemailer@^7.0.7` como *peerOptional*, o que
bloqueava o `npm install` com o `nodemailer@10`. O `overrides` não é um
atalho para calar o npm: o `next-auth` deste projeto usa **só** os provedores
Google e Credentials — não há `EmailProvider` — por isso nunca toca no
nodemailer. O *peer* é irrelevante aqui, e o `overrides` diz exatamente isso.

Se algum dia se acrescentar o `EmailProvider`, esta entrada tem de ser
reavaliada.

## Por fazer

- **Manipulação de preço**, quando o checkout existir. O carrinho guarda preços
  em `localStorage`; a regra está no `CLAUDE.md`
- **Rotas de administração** que virão da `redesign-geral` — passam todas por
  `exigirAdmin()`
- **Invalidar sessões ao repor a palavra-passe.** Com sessões em JWT não há
  sessão do lado do servidor para apagar: quem já tivesse entrado continua
  entrado até o token expirar. Resolver isto exige guardar um marcador de
  invalidação por utilizador e verificá-lo em cada pedido. Fica registado como
  dívida conhecida, não como esquecimento
- **Migrar para o Next 15.** A linha 14.2 deixou de receber retroportações de
  segurança e mais de vinte avisos só fecham em `15.5.24+`, um deles crítico.
  É uma migração de major com mudanças de API (`params` assíncrono, entre
  outras) e precisa do seu próprio PR, com a suite a validar cada passo
- **Correr `npm audit --omit=dev` antes de cada versão.** Passou toda a F11
  sem ser corrido, e a pior superfície do projeto estava aí
