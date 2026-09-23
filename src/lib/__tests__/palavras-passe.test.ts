import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

/**
 * As palavras-passe antigas continuam a entrar.
 *
 * As contas novas sao cifradas com argon2id; o bcrypt so existe para as que
 * vieram de antes, e e verificado em `auth.ts` e em `DELETE /api/conta`
 * sempre que o hash comeca por `$2`. O Dependabot subiu o `bcryptjs` de 2
 * para 3, um major — e nenhum teste exercitava o `compare` a serio. Se o 3
 * deixasse de aceitar hashes do 2, essas pessoas ficavam de fora sem erro
 * nenhum: so "Email ou password incorretos".
 */

// Gerado com bcryptjs@2.4.3: hashSync('aPasswordAntiga', 10). Fixo de
// proposito — um hash gerado aqui mesmo so provava que o 3 le o 3.
const HASH_DO_BCRYPTJS_2 = '$2a$10$oFtBaQt28MeRoSEX1zN1Vedxi2RGK6lJi2kGql.Fn.7HypEo6PUaS';

describe('bcrypt, para as contas de antes do argon2', () => {
  it('um hash feito pela versão 2 verifica com a palavra-passe certa', async () => {
    expect(await bcrypt.compare('aPasswordAntiga', HASH_DO_BCRYPTJS_2)).toBe(true);
  });

  it('e recusa a errada', async () => {
    expect(await bcrypt.compare('aPasswordErrada', HASH_DO_BCRYPTJS_2)).toBe(false);
  });

  it('o prefixo continua a ser um que o auth.ts encaminha para o bcrypt', async () => {
    // O `auth.ts` decide pelo prefixo `$2`. A versao 3 cifra com `$2b$`.
    const novo = await bcrypt.hash('x', 4);
    expect(novo.startsWith('$2')).toBe(true);
    expect(HASH_DO_BCRYPTJS_2.startsWith('$2')).toBe(true);
  });
});
