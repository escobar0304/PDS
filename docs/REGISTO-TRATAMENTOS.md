# Registo das atividades de tratamento

> Artigo 30.º do RGPD. **Documento interno**: não é publicado, mas tem de
> existir e de ser mostrado à CNPD se o pedir.
>
> **Não sou jurista.** Isto foi estruturado a partir do que o código faz, não
> do que devia fazer. Tem de ser revisto por quem tenha competência antes de
> valer como registo.

## Porque é obrigatório aqui

O art. 30.º, n.º 5 isenta as organizações com menos de 250 trabalhadores —
**exceto** quando o tratamento não é ocasional. Manter contas de clientes é
contínuo, por isso a isenção não se aplica.

## Como se mantém verdadeiro

Cada linha aponta para o código de que depende. Uma política de privacidade ou
um registo que descreva o que o código fazia há três meses é pior do que
nenhum, porque dá a quem o lê uma certeza falsa. `privacidade.test.ts` falha
quando o modelo de utilizador ganha campos que a política não declara, e
quando o sítio guarda endereços IP sem o dizer. Este registo acompanha a
página `/privacidade`; quando uma muda, a outra muda.

---

## Responsável pelo tratamento

| | |
|---|---|
| Nome | **por preencher** (`EMPRESA.denominacao`) |
| Contacto | **por preencher** (`EMPRESA.email`, `EMPRESA.telefone`) |
| Morada | **por preencher** (`EMPRESA.morada`) |
| Encarregado de proteção de dados | Não designado. Não é obrigatório (art. 37.º): o tratamento não é em grande escala nem de categorias especiais |
| Representante na UE | Não se aplica: o responsável está em Portugal |

## Subcontratantes

**Nenhum está decidido**, e cada um é uma linha a acrescentar a este registo
e à política quando for:

| Serviço | Para quê | Estado |
|---|---|---|
| Alojamento | onde o sítio corre, e os registos do servidor | **por decidir** |
| Base de dados | onde vivem as contas (`MONGODB_URI`) | **por decidir** — e a região decide se há transferência para fora da UE |
| Envio de email | confirmação de conta, reposição, formulário de contacto, confirmação de cada encomenda e aviso à loja (`SMTP_*`) | **Gmail, decidido em 25/09/2026.** Numa conta Gmail gratuita, a Google trata os emails pelos termos de consumidor, **sem o contrato de subcontratante do art. 28.º**; o Google Workspace (pago) oferece-o. A validar pelo jurista antes de abrir a loja |
| Pagamentos | Stripe, escolhida em 24/09/2026, com a página de pagamento alojada nela: os dados do cartão nunca passam pelo sítio | entra quando o checkout abrir; a entidade contratante e a região dos dados confirmam-se no contrato |

**A Google não é subcontratante**, quando a entrada pela Google estiver ligada:
é responsável pelo tratamento que faz do seu lado, e nós recebemos dela o nome
e o email. Só existe se `GOOGLE_CLIENT_ID` estiver definido (`src/lib/auth.ts`).

## Transferências para fora do Espaço Económico Europeu

**Por determinar.** Dependem dos três subcontratantes acima. Se algum estiver
fora do EEE, é preciso a base da transferência (decisão de adequação ou
cláusulas contratuais-tipo) antes de começar.

---

## As atividades

### 1. Contas de cliente

| | |
|---|---|
| Finalidade | Criar e manter a conta; permitir entrar |
| Base legal | Execução de contrato (art. 6.º, n.º 1, al. b)) |
| Titulares | Clientes que criam conta |
| Dados | nome, email, palavra-passe cifrada (argon2id), papel (`USER`/`ADMIN`), se o email foi confirmado, contador de sessão, datas de criação e alteração. Pela Google: nome e email, sem palavra-passe |
| Campos que existem e nada preenche | telefone, morada, cidade, código postal, país — ficam da v2 |
| Destinatários | ninguém fora dos subcontratantes acima |
| Prazo | até a pessoa apagar a conta (`DELETE /api/conta`) |
| Onde no código | `src/lib/models.ts` (`userSchema`), `src/app/api/auth/register`, `src/lib/auth.ts` |

### 2. Sessão

| | |
|---|---|
| Finalidade | Manter a pessoa autenticada entre páginas |
| Base legal | Execução de contrato |
| Dados | identificador da conta e papel, num cookie assinado; a versão da sessão, para a poder terminar |
| Prazo | até sair, ou 30 dias; termina antes se a conta for apagada ou a palavra-passe reposta (`src/lib/sessao.ts`) |
| Nota | cookie estritamente necessário, isento de consentimento (`docs/COOKIES.md`) |

### 3. Códigos de uso único

| | |
|---|---|
| Finalidade | Confirmar o email; repor a palavra-passe |
| Base legal | Execução de contrato |
| Dados | resumo SHA-256 do código (nunca o código), conta a que pertence, finalidade, prazo |
| Prazo | apaga-se ao ser usado ou ao expirar: 24 h para confirmar, 1 h para repor. O Mongo apaga os expirados sozinho, e o código verifica o prazo também (`src/lib/tokens.ts`) |

### 4. Proteção contra abuso

| | |
|---|---|
| Finalidade | Limitar tentativas repetidas de entrar, registar, repor a palavra-passe, confirmar o email, escrever pelo formulário e apagar a conta |
| Base legal | Interesse legítimo na segurança do serviço (art. 6.º, n.º 1, al. f)) |
| Dados | endereço IP; nalgumas destas ações, o email da tentativa; número de tentativas |
| Prazo | só em memória, nunca em disco nem em base de dados; no máximo uma hora depois da última tentativa (`src/lib/limites.ts`). **Até 23/09/2026 isto não era verdade**: a limpeza só corria com mais de 5000 entradas, e num sítio pequeno um IP ficava até o servidor reiniciar |
| Ponderação | o IP é o mínimo que permite distinguir quem tenta de quem abusa; não é cruzado com nada, não sai do servidor e desaparece sozinho. Sem ele, o formulário de contacto era um canal aberto de envio de spam pelo nosso servidor de email |

### 5. Formulário de contacto

| | |
|---|---|
| Finalidade | Responder a quem escreve |
| Base legal | Diligências pré-contratuais a pedido da pessoa, ou interesse legítimo em responder |
| Dados | nome, email, telefone (opcional), assunto, mensagem |
| Destinatários | a caixa de correio do negócio, pelo subcontratante de email |
| Prazo | **não fica em base de dados** (há um teste que o garante). Na caixa de correio, o tempo necessário para tratar o assunto — **o prazo concreto é decisão do negócio** |

### 6. Encomendas

**Existe no código, e a loja não abre ainda:** `src/lib/loja.ts` fecha-a
enquanto faltarem os portes, o prazo, a identificação do prestador e a
confirmação por email (P1). Entra na política antes da primeira venda.

| | |
|---|---|
| Finalidade | Vender e entregar a encomenda, e recebê-la paga |
| Base legal | Execução de contrato (art. 6.º, n.º 1, al. b)); guardar o documento de venda é obrigação legal (al. c)) |
| Titulares | Quem compra, com ou sem conta |
| Dados | nome, email, telefone, morada, código postal, localidade; o que comprou, a que preço e com que portes; o estado e o histórico da encomenda; o identificador do pagamento na Stripe; com conta, a ligação a ela. **Nunca dados do cartão** — ficam na Stripe |
| Destinatários | a Stripe recebe o email, as linhas da encomenda e o total; o fornecedor de email leva a confirmação e o aviso à loja, com tudo o que a encomenda tem; os CTT vão receber o nome, a morada e o telefone quando a expedição existir (P3) |
| Prazo | **por decidir com o contabilista** (P2). Não se apaga quando a conta é apagada, porque o documento de venda tem de ser guardado (art. 17.º, n.º 3, al. b)) |
| Onde no código | `src/lib/models.ts` (`orderSchema`), `src/lib/encomenda.ts`, `src/app/api/encomendas/` |

O telefone é pedido por causa dos CTT, que avisam da entrega por ele. Nada
mais é pedido: nem conta, nem palavra-passe, nem data de nascimento. O NIF na
fatura, que o consumidor pode pedir, entra com o programa de faturação (P2):
recolhê-lo antes de haver para onde o mandar era guardar um dado sem uso.

Ver `docs/DADOS-PESSOAIS.md`.

### O que não é tratamento nosso

O carrinho e a preferência do mapa vivem no `localStorage` do browser e nunca
chegam ao servidor. Estão declarados em `/cookies` porque a CNPD trata o
armazenamento local como equivalente a cookies — mas não é dado que o negócio
tenha.

---

## Medidas de segurança (art. 32.º)

O detalhe está em `docs/SEGURANCA.md`. Em resumo, e cada uma com teste:

- palavras-passe em argon2id; os códigos de uso único guardados só em resumo
- sessões que terminam ao apagar a conta ou repor a palavra-passe
- limite de tentativas em todas as rotas que aceitam credenciais ou enviam email
- validação de esquema no servidor em todas as rotas, contra injeção NoSQL
- rotas de conta que só leem o id da sessão, nunca um id do pedido
- cabeçalhos de segurança: CSP sem `'unsafe-eval'`, HSTS, `nosniff`, `frame-ancestors 'none'`
- dependências auditadas a cada PR (`npm audit --omit=dev`: 0 à data)
- exportar e apagar a conta a partir da área pessoal (arts. 15.º, 17.º e 20.º)

## Por preencher, e de quem

| O quê | De quem |
|---|---|
| Responsável pelo tratamento | negócio (F4) |
| Alojamento, base de dados e email, e a região de cada um | negócio, com apoio técnico |
| Prazo de conservação das mensagens de contacto | negócio |
| Revisão jurídica deste registo | quem tenha competência |
