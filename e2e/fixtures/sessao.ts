import type { BrowserContext } from '@playwright/test';
import { encode } from 'next-auth/jwt';

/**
 * Uma sessao assinada com o segredo do servidor dos testes, para chegar as
 * paginas privadas sem base de dados. Mesmo formato que o callback `jwt` de
 * `src/lib/auth.ts` escreve.
 *
 * Sem base de dados, `verificarSessao` responde "desconhecido" e a sessao
 * mantem o papel que traz (`lib/sessao.ts`) — e isso que deixa estes testes
 * existir. Com base de dados, o papel viria dela.
 */
export async function iniciarSessao(
  contexto: BrowserContext,
  papel: 'USER' | 'ADMIN',
  {
    base = 'http://127.0.0.1:3100',
    userId = 'a'.repeat(24),
  }: { base?: string; userId?: string } = {}
) {
  const valor = await encode({
    token: { userId, role: papel, versao: 0, name: 'Teste', email: 'teste@exemplo.pt' },
    secret: 'segredo-apenas-para-testes-e2e',
  });
  await contexto.addCookies([
    { name: 'next-auth.session-token', value: valor, url: base, httpOnly: true, sameSite: 'Lax' },
  ]);
}
