# Proteção de dados

Feito na F6. A página pública é `/privacidade`.

## O que foi feito

**`src/lib/empresa.ts`** — fonte única da identificação do prestador. A política
de privacidade, o rodapé, os emails e, mais tarde, o livro de reclamações e os
termos leem todos daqui. Preencher uma vez chega.

Um campo por preencher é `null`, **nunca uma cadeia vazia nem um valor
inventado**. A diferença importa: `null` é "ainda não sei", e o site sabe
mostrar isso como tal. Até aqui o rodapé tinha `+351 xxx xxx xxx` e
`tel:+351000000000` — um número a fingir, que chegou a produção porque ninguém
tinha onde dizer que faltava.

**A indexação passa a exigir as duas coisas.** O `robots.ts` já dependia de
`SITE_INDEXAVEL`; agora exige também que a identificação obrigatória esteja
completa. Sem denominação, NIF, morada, contactos e entidade de resolução de
litígios, o sítio continua bloqueado aos motores de busca mesmo com a variável
a `true`. Deixa de ser um interruptor que alguém liga por engano.

**`/privacidade`** — derivada do código, não de um modelo. Quando a
identificação está incompleta, a própria página o diz em vez de fingir.

## O que sai do código

| Onde | Dados | Destino |
|---|---|---|
| Registo | nome, email, palavra-passe (cifrada) | MongoDB |
| Perfil (no `userSchema`) | telefone, morada, cidade, código postal, país | MongoDB — **campos existem mas nada os preenche hoje** |
| Contacto | nome, email, telefone, assunto, mensagem | **apenas email, não fica guardado** |
| Sessão | tokens do NextAuth | MongoDB |
| Carrinho | conteúdo | só no navegador, nunca chega ao servidor |

## Os direitos do titular, na área pessoal

Um separador novo, «Os seus dados», com duas coisas.

### O que motivou isto não foi o roteiro

A política de privacidade já dizia, sobre os dados da conta: **«Enquanto
mantiver a conta. Apaga-se quando a apagar.»** Não havia forma nenhuma de a
apagar. O sítio prometia um direito que não oferecia — a mesma falha do rodapé
que ligava para páginas inexistentes, mas aqui com o **artigo 17.º** por trás
em vez de só a estética.

### Descarregar (art. 15.º e 20.º)

`GET /api/conta/dados` devolve JSON, que é o «formato estruturado, de uso
corrente e de leitura automática» que o artigo 20.º pede.

**A palavra-passe cifrada fica de fora.** Exportar um hash argon2 não serve ao
titular para nada e, num ficheiro que vai parar aos downloads ou a um email, dá
a quem o apanhe material para atacar offline. O artigo 15.º, n.º 4 cobre a
recusa: o direito de acesso não prejudica direitos de terceiros — e aqui
prejudicaria o próprio.

### Apagar (art. 17.º)

`DELETE /api/conta`. Apaga o utilizador, os tokens de verificação e de
reposição, e as coleções `accounts` e `sessions` do adaptador do NextAuth —
que não têm modelo Mongoose e passariam despercebidas. Deixar qualquer uma para
trás é deixar dados pessoais para trás, e uma ligação de reposição viva para
uma conta que já não existe.

**As encomendas não se apagam: desligam-se da conta.** A conservação fiscal dos
documentos de venda sobrepõe-se ao direito ao apagamento — artigo 17.º, n.º 3,
alínea b), tratamento necessário para cumprir uma obrigação legal. Ficam sem
`userId`.

**Desligar não é anonimizar**, e a primeira versão deste texto dizia que era.
A encomenda guarda o nome, o email e o telefone de quem comprou, porque o
documento de venda precisa deles — continua a ser um dado pessoal de uma pessoa
identificada. O que muda é que deixa de estar preso a uma conta. Deu-se por
isto ao escrever os testes com encomendas completas; há agora um que falha se
alguém voltar a afirmar o contrário no código.

Consequência para quando houver loja: o prazo de conservação fiscal tem de
constar da política de privacidade, e ao pedido de apagamento responde-se a
dizer que as encomendas ficam, e porquê. Hoje não há encomendas nenhumas.

### A confirmação muda conforme a conta

Quem entrou por email confirma com a palavra-passe. **Quem entrou pela Google
não tem palavra-passe** — o callback `signIn` cria essas contas com
`password: ''`. Pedir-lhes a palavra-passe seria pedir uma coisa que nunca
tiveram, e deixá-las sem forma nenhuma de apagar a conta, o que transformava o
direito numa porta fechada para metade dos utilizadores.

Para essas, escreve-se o próprio email. Não prova posse de um segredo — prova
intenção, que é o que esta confirmação existe para garantir: que ninguém apaga
a conta por engano.

### O que isto não resolve

A sessão é um JWT e **continua válida até expirar, mesmo sem conta por trás**.
A interface termina a sessão logo a seguir a apagar, o que cobre o caso normal;
quem guarde o token continua a poder apresentá-lo. As rotas respondem 404
quando a conta não existe, por isso não há acesso a dados — mas a dívida é a
mesma que já estava registada em `docs/SEGURANCA.md` para a reposição de
palavra-passe, e agora tem mais uma razão para ser paga.

## Aviso, não caixa de consentimento

O roteiro previa consentimento explícito no formulário de contacto. Está errado,
e é o mesmo erro do banner de cookies: **o fundamento para tratar estes dados
não é o consentimento.**

Responder a quem nos escreve são diligências a pedido do próprio; criar uma
conta é execução de um contrato. Pôr uma caixa a pedir autorização criava um
fundamento falso — e pior: quem depois a retirasse obrigaria a fazer desaparecer
uma mensagem que só existe para lhe podermos responder.

O que a lei pede aqui é **informação** (art. 13.º do RGPD), e é isso que está:
uma linha curta com ligação para a política, junto ao botão de enviar.

Uma caixa de consentimento passa a ser a resposta certa no dia em que houver
newsletter ou marketing — aí é opt-in separado, nunca agregado à criação de
conta.

## A rede

Três testes unitários e quatro de ponta a ponta. O que importa é o primeiro:

`src/lib/__tests__/privacidade.test.ts` lê o `userSchema` em `models.ts` e
**falha quando aparece um campo que a política desconhece.** O risco real não é
escrever mal a política hoje — é alguém acrescentar um campo daqui a três meses
e a página continuar a dizer que só guardamos nome, email e palavra-passe.

Também falha se o formulário de contacto passar a guardar as mensagens em base
de dados (a página afirma que não guarda), e se o registo deixar de cifrar a
palavra-passe.

## O que falta nesta matéria

- **Dados do prestador.** Confirmado que não é sociedade, logo não há
  conservatória, matrícula nem capital social. Faltam nome, NIF, domicílio,
  contactos efetivos e a entidade de resolução alternativa de litígios
- ~~**Direitos operacionais.**~~ Feito. Ver «Os direitos do titular» abaixo
- **Registo de atividades de tratamento** (art. 30.º), documento interno
- **Injeção de HTML no email de contacto.** O nome e a mensagem são
  interpolados direto no corpo do email; quem submeter HTML no nome escreve no
  email que chega ao negócio. É a **F11**, segurança, e tem de ser feita antes
  de o sítio ir para o ar

## Aviso

Não sou jurista. Esta página descreve o comportamento verificado do sítio e
estrutura as obrigações aplicáveis. **O conteúdo deve ser validado por quem
tenha competência legal antes de ir para o ar.**
