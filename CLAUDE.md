# Pétalas de Sonho

Loja de cristais e pedras. Next.js 14 (App Router), TypeScript, Tailwind,
MongoDB, NextAuth. Português de Portugal em tudo o que é visível.

## Como trabalhar comigo

**Discorda.** Se achares que estou errado, diz e argumenta. Concordares comigo
sem fundamentar não me serve para nada — o valor está em seres forçado a
justificar e em eu ser forçado a pensar de outra maneira. Dares-me razão só
porque sou eu que peço é a pior resposta possível.

Isto vale para tudo: código, design, arquitetura, conversa, decisões de
negócio. Se depois de argumentares eu insistir, fazes como eu disse — mas
quero ter ouvido o contra-argumento primeiro.

Quando concordares, concorda por uma razão e di-la. "Tens razão" sozinho não
é uma resposta.

**Mede antes de decidir.** Já aconteceu duas vezes neste projeto uma medição
mudar a solução: os cookies (não era preciso banner nenhum) e o lettering do
logótipo (não era nenhuma fonte conhecida). Assume menos, verifica mais.

**Não inventes dados do negócio.** Nomes, NIF, moradas, contactos, afirmações
comerciais, prazos de entrega — nada disso se adivinha. Campo por preencher é
`null` e o site mostra que falta. Ver `src/lib/empresa.ts`.

## Fluxo de trabalho

Cada tarefa numa branch própria. O PR é criado automaticamente; a branch apaga
quando o PR fecha. Nunca empurrar para `master` diretamente.

Antes de qualquer PR: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run build` e `npx playwright test`. Todos verdes, sem exceção.

## Onde está o raciocínio

Os documentos em `docs/` explicam o **porquê**, não o quê — o quê lê-se no
código.

| | |
|---|---|
| `ROADMAP-V1.md` | as fases até à v1.0.0 e o que bloqueia cada uma |
| `DESIGN-AUDIT.md` | a auditoria inicial |
| `PALETA.md` | as cores, derivadas do logótipo |
| `MARCA.md` | o logótipo em vetor, e a decisão de tipografia em aberto |
| `COMPONENTES.md` | a biblioteca de UI |
| `COOKIES.md` | o que o site guarda, medido |
| `DADOS-PESSOAIS.md` | proteção de dados |
| `SEGURANCA.md` | o que foi corrigido, e os testes que o mantêm corrigido |
| `PERFORMANCE.md` | o que foi medido, e o que a medição desmentiu |
| `ACESSIBILIDADE.md` | a auditoria, e porque o critério é 24×24 e não 44×44 |

## Regras do domínio

**Legal antes de loja.** O sítio não vai para o ar indexado sem identificação
do prestador, livro de reclamações, política de privacidade e termos. O
`robots.ts` bloqueia os motores de busca enquanto `src/lib/empresa.ts` estiver
incompleto — a tratar como rede de segurança, não como obstáculo a contornar.

**A plataforma europeia de RAL em linha foi descontinuada em julho de 2025.**
Não acrescentar ligação para ela. É o tipo de link morto que um modelo copia de
um exemplo antigo.

**Não sou jurista.** O conteúdo legal é estruturado a partir do que o código
faz, e tem de ser validado por quem tenha competência antes de publicar.

## Design

As cores, raios, sombras e espaçamentos são tokens em `globals.css`. Um
controlo novo não se escreve com classes soltas: ou já existe em
`src/components/ui/`, ou acrescenta-se lá.

Sem emoji na interface. Ícones são Phosphor, traço fino, definido uma vez no
`IconContext`.

**Acessibilidade é critério de aceitação, não fase.** `axe` sem violações WCAG
2.1 AA, controlos com pelo menos 24×24 (2.5.8 da WCAG 2.2 — os 44×44 são AAA e
não se aplicam a tudo), e ligações em texto corrido sublinhadas em repouso: só
a cor não distingue. `e2e/acessibilidade.spec.ts` falha se alguma destas se
perder.
