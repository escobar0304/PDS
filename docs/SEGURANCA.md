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

**O contrário também era verdade.** Até 24/09/2026, as páginas de `/admin`
abriam para qualquer pessoa. Não expunham nada, porque não faziam nada, mas a
guarda tem de estar lá antes da primeira linha que leia dados. Cada página
chama `paginaDeAdmin()`, que responde 404 a quem não for administrador.

Em cada página, e não num `layout.tsx`: o guia de autenticação do Next 16
avisa que o layout não volta a correr quando se navega entre páginas do mesmo
segmento, e que não impede as páginas-filhas de renderizar. `admin.test.ts`
falha se uma página de `/admin` não chamar a guarda, ou se for componente de
cliente (onde a guarda não correria no servidor). Foi verificado a falhar
tirando a guarda de uma página.

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
| `stripe` | 15.12.0 | 22.6.2 | Moderada, via `qs`. **Saiu em 24/09/2026:** estava em produção sem um único `import` |
| `next` | 14.2.33 | 14.2.35 | **Crítica.** Negação de serviço com Server Components |

Ficaram **4 → 3**, e nenhuma se fecha sem uma decisão maior:

**`next` era crítica, e deixou de ser.** A migração para o `15.5.26` foi
feita a seguir, e está descrita abaixo.

**`postcss` alta** vem empacotado dentro do `next`. Sai quando o `next` sair.
As falhas são a analisar CSS de origem não confiável; nós não analisamos CSS
de terceiros.

~~**`ip-address` alta** entra por `@next-auth/mongodb-adapter` → `mongodb@5` →
`socks`.~~ **Fechada em 23/09/2026, e a explicação acima estava errada em
metade.** O adaptador saiu (ver «A entrada pela Google» abaixo), e o
`ip-address` ficou na auditoria na mesma: também entrava pelo `mongodb@6` do
Mongoose, que declara o `socks` como *peer* opcional. O lockfile tinha o
`socks@2.8.7`, preso a um `ip-address` vulnerável; o `socks@2.8.10` já pede
`^10.1.1`. Fechou com `npm update socks ip-address`, dentro das gamas
declaradas. Eu tinha escrito que não havia saída sem next-auth v5 — não tinha
ido ver a árvore inteira.

### O `overrides` no `package.json`

O `next-auth@4.24.15` declara `nodemailer@^7.0.7` como *peerOptional*, o que
bloqueava o `npm install` com o `nodemailer@10`. O `overrides` não é um
atalho para calar o npm: o `next-auth` deste projeto usa **só** os provedores
Google e Credentials — não há `EmailProvider` — por isso nunca toca no
nodemailer. O *peer* é irrelevante aqui, e o `overrides` diz exatamente isso.

Se algum dia se acrescentar o `EmailProvider`, esta entrada tem de ser
reavaliada.

## A migração para o Next 15

Feita logo a seguir ao upgrade acima, e mais pequena do que eu a tinha
pintado.

**A previsão estava errada.** Eu disse que o risco real era o React 19 que o
Next 15 arrasta. O `next@15.5.26` declara `react: "^18.2.0 || ^19.0.0"` —
aceita o React 18 que já temos. Fica no 18.3.1; o salto para o 19 é outra
decisão, e não entrou aqui.

**A superfície medida antes de começar:** `cookies()`, `headers()` e
`draftMode()` não são usados em lado nenhum, e o `params` do servidor aparece
num **único** sítio. Todo o resto é `useParams`/`useSearchParams` — hooks de
cliente, inalterados — ou `new URL(request.url)`.

O ficheiro foi `src/app/api/products/[slug]/route.ts`: `params` passa a
`Promise` e o `slug` passa a ser esperado.

### O que isto ensinou sobre o `typecheck`

**O `npm run typecheck` passou limpo com o código errado.** A rota declara o
seu próprio tipo inline e nada o confronta com a assinatura que o Next
espera. Quem valida isso é o `next build`, que gera os tipos das rotas — e foi
lá que rebentou, com o `tsc` verde.

Um `tsc` limpo não chega para dizer que uma rota está certa. É mais uma
instância da mesma lição do 4.1.3: saber o que cada ferramenta *não* vê vale
tanto como o que ela vê.

### O que fecha

O `next` desce de **crítica para moderada**. O que sobra — essa moderada e a
alta do `postcss` que o next empacota (8.4.31) — ~~só fecha no Next 16~~.
Fechou, ver «A migração para o Next 16». ~~O `ip-address` continua pela cadeia do `@next-auth/mongodb-adapter`.~~
Fechado, ver acima.

## A entrada pela Google

**Nunca funcionou para quem entrava pela primeira vez.** Deu-se por isso a ler
o `signIn` para a F12, não por um teste — e nenhum a teria apanhado, porque
sem credenciais da Google o provedor nem é registado.

Havia dois defeitos, qualquer um suficiente:

1. o callback criava o utilizador com `password: ''`, e o `userSchema`
   declarava a palavra-passe `required`. O Mongoose trata a string vazia como
   ausente e recusava: «Password é obrigatória». Verificado com
   `validateSync`, sem base de dados;
2. mesmo sem isso, havia um `MongoDBAdapter` **e** o callback a criar a conta
   pelo Mongoose. O adaptador procurava a ligação em `accounts`, não a
   encontrava, via um utilizador com o mesmo email e recusava com
   `OAuthAccountNotLinked`.

**O adaptador saiu.** Com sessões JWT só servia para guardar utilizadores e
ligações; o modelo `User` já faz a primeira, e a segunda não serve ninguém.
Duas fontes de verdade para a mesma conta era a causa, não um pormenor.

**E passa a exigir-se `email_verified`.** Uma conta Google Workspace de um
domínio qualquer pode vir com o email por verificar. Aceitá-lo era deixar
quem controla esse domínio entrar na conta de quem se registou aqui com esse
email — e a entrada pela Google liga-se à conta que já exista com o mesmo
email, de propósito, para quem se registou por email poder depois usar a
Google.

Guardas em `provedores.test.ts` (chamam o callback a sério, e o modelo aceita
uma conta sem palavra-passe) e três testes de integração: a primeira entrada
cria a conta, a segunda não a duplica, e quem já tinha palavra-passe entra na
mesma conta sem a perder. As duas primeiras guardas foram verificadas contra
o defeito reposto.

## A migração para o Next 16 e o ESLint 9

Feita num PR próprio, depois de o `master` ter fundido tudo o resto — a razão
por que não se fez logo a seguir ao Next 15 era não mexer no portão de
qualidade no mesmo PR que em dois majors.

**`npm audit`: 0 vulnerabilidades, em produção e em desenvolvimento.** A
moderada do `next` e a alta do `postcss` que ele empacotava fecharam com o
upgrade; as seis da árvore de desenvolvimento (`glob`, `minimatch`,
`brace-expansion`, `picomatch`, `browserslist`, `postcss-selector-parser`)
fecharam com `npm audit fix`, sem `--force` e sem nenhum major.

O React **fica no 18**: o `next@16` ainda declara `^18.2.0 || ^19.0.0`.

### O que o ESLint 9 encontrou

O `next lint` saiu no Next 16 e o `eslint-config-next@16` só existe em *flat
config*. O `eslint.config.mjs` é o equivalente exato do `.eslintrc.json` que
havia — `core-web-vitals` e nada mais.

Mas o `eslint-plugin-react-hooks` v7 vem com as regras do React Compiler, e
deu **8 erros em código que já existia**. Não se desligou nenhuma. Um deles
era um defeito real:

- **Na `/loja`, respostas fora de ordem.** Escolher uma categoria e logo outra
  lançava dois pedidos; se o primeiro respondesse em último, era ele que
  ficava na grelha — com o botão da segunda marcado. Há um teste em
  `e2e/loja.spec.ts` que atrasa uma das respostas; **falhou contra o código
  antigo** e passa agora. O resultado leva a chave do pedido que o produziu, e
  só é aceite se ainda for o actual.

Afirmei um terceiro, e estava errado: que no `/produto` a quantidade escolhida
passava para o produto relacionado seguinte. Escrevi o teste, corri-o contra o
código antigo — **e passou**. O App Router já remonta a página quando o `slug`
muda. A correção que eu tinha feito saiu; o teste ficou, com isto escrito.

Os outros: o interruptor do mapa passou a `useSyncExternalStore`, que é o que
o React tem para ler de um sistema externo — e passou a reagir também a
mudanças noutro separador. A página de verificação deixou de pôr estado num
efeito para um caso que o render resolve sozinho. **Fica uma exceção,
escrita:** o carrinho lê o `localStorage` num efeito, porque lê-lo no primeiro
render dava HTML diferente no servidor e no browser.

### `'unsafe-eval'` estava na CSP de produção

Sem razão escrita — o comentário explicava o `'unsafe-inline'` e não este. O
Next só precisa de `eval` para o recarregamento a quente, por isso passa a
existir só em desenvolvimento. É a diretiva que transforma uma injeção de
texto em execução de código.

**Medido antes de tirar:** servidor de produção, seis páginas, a escutar
`securitypolicyviolation` — zero violações. Para não confiar num «zero» de
uma sonda que podia não estar a ver nada, provocou-se uma violação de
propósito: um `setTimeout` com texto foi recusado e o browser disse-o.

(Um primeiro teste com o `addScriptTag` do Playwright deu `eval` a passar. Não
era a CSP a falhar: o Chrome isenta scripts injetados pelo DevTools. Ficou
aqui porque é o tipo de resultado que leva a concluir o contrário do que é.)

Guardas em `e2e/seguranca.spec.ts`: o cabeçalho de produção não tem
`'unsafe-eval'`, e nenhuma página viola a própria CSP. A segunda foi
verificada retirando o `'unsafe-inline'`, que o Next precisa — falhou em `/`.

## Sessões que acabam quando devem

As sessões são JWT, com 30 dias. Não há sessão do lado do servidor para
apagar, e por isso **apagar a conta ou repor a palavra-passe não terminava
sessão nenhuma**: quem tivesse o cookie continuava a apresentá-lo durante um
mês. Estava registado como dívida desde a F11, e a F12 deu-lhe mais uma razão.

Cada conta tem agora uma `versaoSessao`, e o token leva a versão com que a
pessoa entrou. Em cada verificação de sessão, o callback `jwt` pergunta à
base de dados (`src/lib/sessao.ts`):

- **conta apagada, ou versão diferente** → o callback lança, e o NextAuth
  limpa o cookie e devolve uma sessão vazia, no browser e no servidor. Foi
  lido no código do `next-auth` que é assim que ele trata uma exceção ali, não
  suposto;
- **repor a palavra-passe incrementa a versão**: termina as sessões em todos
  os dispositivos. Quem repõe a palavra-passe pode estar a fazê-lo
  precisamente porque alguém entrou por ela;
- **o papel passa a vir da base de dados.** Antes ficava no token desde a
  entrada: quem perdesse o papel de administrador continuava administrador
  até o token expirar.

**Com a base de dados em baixo, a sessão continua.** Não se sabe, e isso não
é o mesmo que revogada: tudo o que tem dados falha na mesma, por isso manter
a sessão não abre nada, e revogá-la expulsava toda a gente por uma falha que
não é de segurança. Há um teste para isto, e foi verificado que falha se a
regra for invertida.

Os tokens emitidos antes desta alteração não têm versão, e valem 0 — não se
expulsa ninguém no dia da publicação.

**O custo:** uma consulta por `_id` à base de dados em cada verificação de
sessão. É uma procura pela chave primária, e o sítio não tem o tráfego em que
isso se note. Se algum dia tiver, a resposta é guardar o resultado uns
segundos, sabendo que esse é o tempo que uma sessão revogada ainda dura.

Testes de integração contra o Mongo do CI, chamando a rota de reposição a
sério e não uma simulação dela: sessão válida continua, token antigo sem
versão continua, apagar a conta termina, repor a palavra-passe termina e a
entrada seguinte fica, e o papel vem da base de dados.

## Por fazer

- **Manipulação de preço**, quando o checkout existir. O carrinho guarda preços
  em `localStorage`. O cálculo que os ignora já existe (`src/lib/encomenda.ts`,
  com testes, e `esquemaPedido` recusa um preço enviado junto); falta a rota
  do checkout usá-lo, e só a ele
- **Rotas de administração** da v2 — as de API passam por `exigirAdmin()`, as
  páginas por `paginaDeAdmin()`
- ~~**Invalidar sessões ao repor a palavra-passe.**~~ Feito, ver abaixo
- ~~**Migrar para o Next 16**~~ — feito em 23/09/2026, ver abaixo
- **Correr `npm audit --omit=dev` antes de cada versão.** Passou toda a F11
  sem ser corrido, e a pior superfície do projeto estava aí
