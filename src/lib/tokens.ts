import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Tokens de uso unico para verificar email e repor password.
 *
 * Tres decisoes, e a primeira e a que importa.
 *
 * **O que vai no email nao e o que fica guardado.** Gera-se um token
 * aleatorio, envia-se esse, e na base de dados guarda-se apenas o seu resumo
 * SHA-256. Quem leia a base de dados fica com resumos, que nao servem para
 * nada: nao da para voltar atras. Guardar o token em claro transformava uma
 * leitura da base de dados numa tomada de todas as contas.
 *
 * **Prazos diferentes por finalidade.** Verificar o email e uma
 * inconveniencia se expirar; repor a password e uma tomada de conta se for
 * intercetado. Dai 24 horas contra 1 hora.
 *
 * **Uso unico.** O token e apagado ao ser usado, nao marcado como usado: o
 * que nao existe nao pode ser reutilizado por engano.
 */

export type FinalidadeToken = 'verificar-email' | 'repor-password';

export const VALIDADE_MS: Record<FinalidadeToken, number> = {
  'verificar-email': 24 * 60 * 60 * 1000,
  'repor-password': 60 * 60 * 1000,
};

/** 32 bytes de aleatoriedade criptografica, em base64url para caber num URL. */
export function gerarToken(): string {
  return randomBytes(32).toString('base64url');
}

/** O que se guarda. Nunca o token em si. */
export function resumir(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Compara dois resumos em tempo constante.
 *
 * Uma comparacao normal desiste no primeiro byte diferente, e o tempo que
 * demora diz quantos bytes acertaram. Com pedidos suficientes, isso chega
 * para descobrir o token byte a byte.
 */
export function resumosIguais(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export function expiraEm(finalidade: FinalidadeToken, agora = Date.now()): Date {
  return new Date(agora + VALIDADE_MS[finalidade]);
}

/** URL absoluto que vai no email. */
export function ligacaoToken(
  finalidade: FinalidadeToken,
  token: string,
  base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
): string {
  const caminho =
    finalidade === 'verificar-email' ? '/auth/verificar' : '/auth/nova-password';
  return `${base.replace(/\/$/, '')}${caminho}?token=${encodeURIComponent(token)}`;
}
