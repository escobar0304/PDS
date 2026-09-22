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
- **Direitos operacionais.** Exportar os meus dados e apagar a conta, na área
  pessoal. Hoje o exercício é por email, o que é legal mas pior do que podia
  ser quando a funcionalidade é trivial. Fica para uma fase própria
- **Registo de atividades de tratamento** (art. 30.º), documento interno
- **Injeção de HTML no email de contacto.** O nome e a mensagem são
  interpolados direto no corpo do email; quem submeter HTML no nome escreve no
  email que chega ao negócio. É a **F11**, segurança, e tem de ser feita antes
  de o sítio ir para o ar

## Aviso

Não sou jurista. Esta página descreve o comportamento verificado do sítio e
estrutura as obrigações aplicáveis. **O conteúdo deve ser validado por quem
tenha competência legal antes de ir para o ar.**
