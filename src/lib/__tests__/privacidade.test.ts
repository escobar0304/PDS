import { readdirSync, readFileSync, statSync } from 'node:fs';
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

/** Todo o codigo de producao sob `dir`, sem os testes. */
function lerTudo(dir: string): string {
  const juntar = (d: string): string[] =>
    readdirSync(d).flatMap((n) => {
      const c = join(d, n);
      if (statSync(c).isDirectory()) return n === '__tests__' ? [] : juntar(c);
      return /\.tsx?$/.test(n) ? [readFileSync(c, 'utf8')] : [];
    });
  return juntar(join(raiz, dir)).join('\n');
}

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
  // Contador que termina as sessoes da conta; declarado na linha da sessao.
  'versaoSessao',
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

  it('se o sítio guarda endereços IP, a política diz que guarda', () => {
    // O limitador de pedidos guarda-os em oito rotas, e a politica nao o
    // dizia. Se `identificar()` for usado, tem de haver a linha.
    const usaIp = ler('src/lib/limites.ts').includes('export function identificar');
    const pagina = ler('src/app/privacidade/page.tsx');
    if (usaIp) expect(pagina).toMatch(/Endereço IP/);
    // E o prazo que la esta tem de ser o maior que o codigo usa.
    expect(pagina).toMatch(/no máximo uma hora depois da última tentativa/);
  });

  it('o prazo declarado para os IP cobre a maior janela que o código usa', () => {
    // `15 * 60 * 1000`, `60_000`: produtos de inteiros, lidos sem avaliar codigo.
    const janelas = [...lerTudo('src').matchAll(/janelaMs: ([\d_ *]+)[,}]/g)].map((m) =>
      m[1]
        .split('*')
        .map((n) => Number(n.trim().replace(/_/g, '')))
        .reduce((a, b) => a * b, 1),
    );
    expect(janelas.length).toBeGreaterThan(5);
    expect(Math.max(...janelas)).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  it('a palavra-passe nunca é guardada em claro', () => {
    const registo = ler('src/app/api/auth/register/route.ts');
    expect(registo).toMatch(/argon2|bcrypt|hash/i);
  });
});
