# Biblioteca de componentes

Feita na F3. Vive em `src/components/ui/` e exporta-se por
`@/components/ui`.

O problema que resolve: antes da F3 o mesmo controlo estava escrito de
maneira diferente em cada página. A classe de um campo de texto aparecia
copiada **15 vezes**, o cartão do login e o do registo eram o mesmo
markup duplicado à letra (SVG da Google incluído), e havia dois sistemas
de botão a competir — as classes `.btn-primary` e `.btn-secondary` no CSS
e variações soltas no JSX.

## Regra

Um controlo novo não se escreve com classes soltas. Ou já existe aqui, ou
acrescenta-se aqui.

## O que há

| Componente | Para quê |
|---|---|
| `Button` | Botões. Variantes `primary`, `secondary`, `ghost`, `danger`; tamanhos `sm`, `md`, `lg`; `loading` marca `aria-busy` e desativa |
| `botaoClasses()` | As mesmas classes sem o elemento, para quando o alvo tem de ser um `<Link>`. Um `<button>` dentro de um `<a>` é HTML inválido |
| `Input`, `Textarea`, `Select` | Campos com etiqueta, dica e erro. Ligam `label`/`id`, põem `aria-invalid` e `aria-describedby` sozinhos |
| `Escolha` | Uma opção entre poucas, todas à vista: a medida de um anel. Rádios verdadeiros num `fieldset` com `legend`, por isso as setas e o leitor de ecrã funcionam sem código. Uma opção esgotada fica visível e desativada: escondê-la faria parecer que a medida não existe |
| `Alert` | Mensagens de erro, sucesso e informação, com ação de recuperação opcional |
| `Spinner`, `Skeleton`, `SkeletonCartao` | Estados de espera |
| `EmptyState` | Estados vazios com ícone, explicação e saída |
| `Container`, `Section`, `PageHeader` | Largura e ritmo vertical |
| `Card`, `Badge` | Superfícies e etiquetas |
| `AuthShell`, `Separador`, `GoogleButton` | Chrome partilhado pelo login e pelo registo |

## Decisões

**Os campos geram o `id` a partir do `name`.** Sem isso, metade dos campos
do site não tinha etiqueta associada — o `<label>` estava lá mas não
apontava a lado nenhum. Há um teste de ponta a ponta que percorre as
páginas com formulários e falha se aparecer um campo sem etiqueta.

**`botaoClasses` usa `hover:` e não `enabled:hover:`.** O `:enabled` só
casa com elementos de formulário, por isso num `<a>` o hover morria. O
estado desativado é garantido pelas variantes `disabled:`, que o Tailwind
emite depois das de `hover` e por isso ganham.

**Ícones em Phosphor com traço fino**, definidos uma vez no
`IconContext` do `ClientProviders`. O traço acompanha o peso do texto em
vez de competir com ele. O contexto também põe `aria-hidden` em todos:
são todos decorativos, porque o que lhes fica ao lado já tem texto ou
`aria-label`. Custa cerca de 7 kB por página face ao Lucide — ao lado das
imagens de 450 kB que a F14 tem de tratar, é ruído.

**O véu dos heros é uma vinheta, não uma lavagem.** O texto fica ao
centro, muitas vezes sobre a zona mais clara da fotografia. A opacidade
de 0.82 no centro é o mínimo para `#fbfaf4` passar 4.5:1 sobre uma pedra
de luminância ~0.85; nas margens desvanece e a fotografia volta inteira.
