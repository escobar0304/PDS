/**
 * O que o servidor escreve nos registos quando alguma coisa falha.
 *
 * Ate 30/09/2026, cada rota fazia `console.error('...', erro)` com o objecto
 * inteiro. Os erros trazem o que os provocou: um indice unico do Mongo repete
 * o email na mensagem (`dup key: { email: "..." }`), o nodemailer traz os
 * destinatarios, um erro de validacao traz os valores. Os registos do
 * alojamento guardam-se semanas, e quem os le nao e quem devia ver emails de
 * clientes. Tambem era a unica copia desses dados que o apagamento da conta
 * (RGPD, art. 17.º) nao alcancava.
 *
 * Fica o que serve para perceber a falha: o tipo, o codigo, a mensagem sem
 * emails nem segredos, e onde aconteceu.
 */

const LIMPEZAS: [RegExp, string][] = [
  // Credenciais num URL de ligacao: mongodb://utilizador:palavra@anfitriao
  [/([a-z][a-z0-9+.-]*:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[credenciais]@'],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]'],
  [/\b(?:sk|rk|pk)_(?:test|live)_[A-Za-z0-9]+/g, '[chave]'],
  [/\bwhsec_[A-Za-z0-9]+/g, '[chave]'],
  // Tokens de email e chaves de encomenda: 43 caracteres de base64url; e
  // qualquer outra sequencia comprida que so pode ser um segredo ou um resumo.
  [/[A-Za-z0-9_-]{32,}/g, '[token]'],
];

export function limpar(texto: string): string {
  return LIMPEZAS.reduce((t, [padrao, troca]) => t.replace(padrao, troca), texto);
}

export function resumirErro(erro: unknown): string {
  if (!(erro instanceof Error)) return limpar(String(erro)).slice(0, 300);
  const codigo = (erro as { code?: unknown }).code;
  const cabeca = `${erro.name}${codigo !== undefined ? ` [${String(codigo)}]` : ''}: ${limpar(erro.message).slice(0, 300)}`;
  // As linhas "at ..." dizem onde; nao trazem dados de ninguem.
  const onde = (erro.stack ?? '')
    .split('\n')
    .filter((l) => l.trimStart().startsWith('at '))
    .slice(0, 5)
    .join('\n');
  return onde ? `${cabeca}\n${onde}` : cabeca;
}

/** `console.error`, sem os dados que o erro traz. */
export function registarErro(contexto: string, erro?: unknown): void {
  console.error(erro === undefined ? contexto : `${contexto} ${resumirErro(erro)}`);
}
