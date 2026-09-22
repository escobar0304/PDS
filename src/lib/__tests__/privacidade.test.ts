import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Uma politica de privacidade so vale enquanto descrever o que o codigo faz.
 *
 * O risco real nao e escreve-la mal hoje: e alguem acrescentar um campo ao
 * modelo de utilizador daqui a tres meses e a pagina continuar a dizer que so
 * guardamos nome, email e palavra-passe. Este teste falha nesse dia.
 */

const raiz = join(__dirname, '..', '..', '..');
const ler = (p: string) => readFileSync(join(raiz, p), 'utf8');

/**
 * Campos do `userSchema` que a pagina /privacidade ja cobre.
 *
 * Os de morada existem no modelo desde o inicio mas nada os preenche: o
 * formulario de perfil que os recolhia mostrava dados inventados e foi
 * retirado na F3. Ficam aqui listados para o teste nao falhar por eles, e
 * entram na pagina quando a finalizacao de compra os passar a usar.
 */
const CAMPOS_CONHECIDOS = [
  'name',
  'email',
  'password',
  'phone',
  'address',
  'city',
  'postalCode',
  'country',
  'role',
  'emailVerified',
];

function camposDoUserSchema(): string[] {
  const fonte = ler('src/lib/models.ts');
  const inicio = fonte.indexOf('const userSchema');
  expect(inicio, 'userSchema não encontrado em models.ts').toBeGreaterThan(-1);
  const bloco = fonte.slice(inicio, fonte.indexOf('\n);', inicio));

  // Chaves ao primeiro nivel do objecto de definicao do esquema.
  return [...bloco.matchAll(/^ {4}(\w+): \{$/gm)].map((m) => m[1]);
}

describe('a política de privacidade acompanha o código', () => {
  it('não há campos no modelo de utilizador que a política desconheça', () => {
    const novos = camposDoUserSchema().filter((c) => !CAMPOS_CONHECIDOS.includes(c));

    expect(
      novos,
      'campo novo no userSchema: acrescente-o a /privacidade e a esta lista',
    ).toEqual([]);
  });

  it('o formulário de contacto continua a não guardar nada em base de dados', () => {
    const rota = ler('src/app/api/contact/route.ts');

    // A pagina diz que a mensagem "nao fica guardada em base de dados". Se
    // isso mudar, a frase passa a ser falsa.
    expect(rota).not.toMatch(/\bContact\b|\.create\(|\.save\(|insertOne/);
  });

  it('a palavra-passe nunca é guardada em claro', () => {
    const registo = ler('src/app/api/auth/register/route.ts');
    expect(registo).toMatch(/argon2|bcrypt|hash/i);
  });
});
