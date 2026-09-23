# Acessibilidade

F13, feita em 22/09/2026.

## Primeiro, a obrigação legal provavelmente não existe

O DL 82/2022, que transpõe a Diretiva (UE) 2019/882, aplica-se ao comércio
eletrónico desde 28 de junho de 2025. Mas **isenta microempresas de serviços**
— menos de 10 trabalhadores e menos de dois milhões de euros de volume de
negócios. Sendo empresário em nome individual, o negócio está quase de certeza
isento.

Fica dito porque dizer o contrário seria o mesmo erro do banner de cookies:
fabricar uma obrigação para justificar trabalho. **A justificação é outra:**

- É barata agora e cara depois. Corrigir estrutura e ordem de foco em doze
  páginas é trabalho de uma tarde; fazê-lo com checkout e encomendas em cima é
  outra coisa
- A isenção depende de continuar abaixo do limiar. Se o negócio crescer, a
  obrigação aparece com o site já feito
- Metade já estava feita sem ter sido chamada F13 — etiquetas nos campos,
  `role="dialog"` no painel do carrinho, contrastes medidos, ícones com
  `aria-hidden`

## A auditoria

`axe-core`, dez páginas, dois tamanhos de ecrã, regras WCAG 2.0 e 2.1 níveis A
e AA. **Três regras violadas**, o que confirma que o trabalho avulso das fases
anteriores tinha valido.

### Botão secundário invisível

`rose-700` sobre ameixa dá **2,01:1**. O botão secundário está desenhado para
fundo claro e, na faixa de marca da página inicial, desaparecia.

A correção não foi mudar a chamada. Foi uma regra `.on-plum .botao-secundario`
no `globals.css`, que muda para `rose-300` (9,99:1). **O contraste deixa de
depender de alguém se lembrar do fundo em que está** — qualquer botão
secundário que venha a ser posto numa secção ameixa fica correto sozinho.

A classe `botao-secundario` não estiliza nada: é só o gancho.

### Ligações que só se distinguiam pela cor

Doze ligações em texto corrido usavam `hover:underline` — sem sublinhado em
repouso. WCAG 1.4.1: quem não separa bem os tons não vê ali uma ligação.

Passam a sublinhado ténue em repouso, que firma no hover. Não pesa no
parágrafo e cumpre.

### Tabela com deslocamento sem acesso por teclado

A tabela de `/cookies` ganha deslocamento horizontal em ecrãs estreitos, e não
era focável. `tabIndex={0}` mais `role="region"` com nome.

## O que o axe não apanha, que era onde faltava trabalho

### Saltar para o conteúdo

Não existia. Eram **quatro tabulações** até ao conteúdo, em todas as páginas.

Os landmarks resolvem isto para quem usa leitor de ecrã, mas não para quem
navega por teclado a ver: essa pessoa passava pelo cabeçalho inteiro a cada
navegação. A ligação está fora do ecrã até receber foco — com `transform`, não
com `display: none`, que a tiraria também da ordem de tabulação.

O `<main>` de todas as páginas ganhou `id="conteudo"`.

### Área de toque

**O critério aplicado é 24×24, não 44×44.** Os 44 são AAA na WCAG 2.1; o que é
AA é o 2.5.8 da WCAG 2.2, que exige 24 e **isenta explicitamente ligações
dentro de uma frase**. Aplicar 44 a tudo deixava o rodapé absurdo.

Pelo critério certo falhavam as ligações do rodapé e dos contactos, a 17–20 px
de altura, e dois links nas páginas de entrada. Os ícones do cabeçalho estavam
a 40×40 — passavam os 24, mas são controlos primários e passaram a 44 por dois
pixéis de padding.

O interruptor do mapa passou de 28 para 44 de altura.

## A rede

`e2e/acessibilidade.spec.ts`, 13 testes:

| Falha quando |
|---|
| qualquer das nove páginas ganha uma violação WCAG 2.1 AA |
| a ligação de salto deixa de ser o primeiro foco, ou não leva ao conteúdo |
| um controlo desce abaixo de 24×24, com a isenção de texto corrido replicada |
| o painel do carrinho deixa de devolver o foco a quem o abriu |
| uma ligação em texto corrido perde o sublinhado em repouso |

## O que fica de fora

**Leitores de ecrã reais.** O axe verifica a árvore de acessibilidade, não a
experiência. Um teste com NVDA ou VoiceOver encontraria coisas que isto não
encontra — nomeadamente se os textos alternativos descrevem o que interessa,
que é juízo humano e não regra.

**Modo de contraste elevado** e `prefers-contrast`. O `prefers-reduced-motion`
já está tratado desde a F2.

## O critério que dizíamos cumprir e não cumpríamos

**4.1.3 Status Messages, nível AA.** Encontrado a medir outra coisa.

A `/loja`, o `/catálogo` e a página de produto trocavam esqueletos pelo
conteúdo sem dizer nada a quem não os vê. O `Skeleton` é `aria-hidden` de
propósito — uma grelha de retângulos cinzentos não tem nada para dizer — mas
isso deixava a página muda nas duas pontas: nem que estava a carregar, nem
que tinha acabado. Quem usa leitor de ecrã ficava sem saber que a página
mudou.

O `axe` estava verde. E não é falha dele: decidir que um texto é uma
*mensagem de estado* exige perceber a intenção da página, e nenhuma
ferramenta automática sabe isso. O axe não tem regra para o 4.1.3. Durante
todo este tempo declarámos «sem violações WCAG 2.1 AA» apoiados numa
ferramenta que nunca verificou este critério.

É a lição que interessa guardar: **uma ferramenta verde não é a mesma coisa
que um critério cumprido**, e vale a pena saber o que cada ferramenta *não*
vê.

A correção é `AnuncioEstado` em `src/components/ui/Feedback.tsx` — um
`role="status"` só para leitor de ecrã — e, onde o texto de estado já é
visível (o contador de resultados da loja), o papel nesse próprio elemento,
para a frase não ser anunciada duas vezes.

O guarda está em `src/lib/__tests__/estados.test.ts`, não no axe: qualquer
página que use `Skeleton` sem região de estado falha a suite. Foi verificado
a partir do defeito — removida a região, o teste fica vermelho.

Corrigiu-se também o `Spinner`, que tinha `aria-label` **e** um `sr-only` com
o mesmo texto: alguns leitores liam «A carregar, A carregar».

## 2.4.2, o título que não dizia nada

**Oito páginas tinham o mesmo `<title>`:** «Pétalas de Sonho» no início, na
loja, no catálogo, em sobre nós, em cada produto, no carrinho, na área pessoal
e na entrada. Num separador, no histórico ou num leitor de ecrã — que anuncia o
título ao abrir a página — não se distinguiam. O 2.4.2 Page Titled, nível A,
pede um título que diga de que página se trata.

Deu-se por isto a preparar os endereços canónicos (F15), não pela auditoria:
**o `axe` não o apanha.** A regra `document-title` verifica que o título existe
e não está vazio, e existia. É o terceiro caso deste projeto em que uma
ferramenta verde convivia com um critério falhado, depois do 4.1.3 e do
`tsc` que não via as assinaturas das rotas.

A causa era estrutural: essas páginas são componentes de cliente e não podem
declarar metadados. Cada uma ganhou um `layout.tsx` que só serve para isso; a
página inicial deixou de ser `'use client'`, porque não usava nada do cliente.
O produto tem o nome da peça, lido no servidor — e, sem base de dados, fica
«Produto» ao fim de dois segundos em vez de segurar a página.

A guarda está em `e2e/acessibilidade.spec.ts`: falha se duas páginas tiverem o
mesmo título. Verificada retirando dois dos `layout.tsx`: falhou a apontar
exatamente essas duas.
