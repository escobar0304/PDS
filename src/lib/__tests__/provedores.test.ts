import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPTIONAL_ENV, REQUIRED_ENV } from '../env';

/**
 * Um caminho que nao leva a lado nenhum.
 *
 * O `auth.ts` registava o GoogleProvider sempre, com
 * `clientId: process.env.GOOGLE_CLIENT_ID!` — um `!` a afirmar que a variavel
 * existe. Mas o `env.ts` classifica-a como **opcional**, e o `.env.example`
 * traz o campo vazio. Sem ela, o NextAuth ficava com um provedor de
 * `clientId: undefined` e as duas paginas mostravam "Continuar com Google" na
 * mesma: quem carregasse aterrava num fluxo OAuth partido.
 *
 * E a mesma falha do rodape que ligava para paginas que nao existiam, e
 * resolve-se da mesma maneira: so se mostra o que existe.
 */

function ler(...partes: string[]): string {
  return readFileSync(join(process.cwd(), ...partes), 'utf-8');
}

describe('o Google e opcional, e o codigo tem de o tratar como tal', () => {
  it('o env.ts continua a classificá-lo como opcional, não obrigatório', () => {
    // Se alguem o passar a obrigatorio, o resto deste ficheiro deixa de fazer
    // sentido — e e melhor falhar aqui do que ficar a guardar uma regra morta.
    expect(OPTIONAL_ENV).toContain('GOOGLE_CLIENT_ID');
    expect(OPTIONAL_ENV).toContain('GOOGLE_CLIENT_SECRET');
    expect(REQUIRED_ENV).not.toContain('GOOGLE_CLIENT_ID');
  });

  it('o auth.ts não afirma que as credenciais da Google existem', () => {
    const fonte = ler('src', 'lib', 'auth.ts');
    expect(
      fonte,
      'o `!` afirma que a variável existe; ela é opcional',
    ).not.toContain('process.env.GOOGLE_CLIENT_ID!');
    expect(fonte).not.toContain('process.env.GOOGLE_CLIENT_SECRET!');
  });

  it('o provedor só é registado quando está configurado', () => {
    const fonte = ler('src', 'lib', 'auth.ts');
    expect(fonte).toContain('googleConfigurado');
    // O registo tem de estar dentro da condicao, nao ao lado dela.
    const providers = fonte.slice(fonte.indexOf('providers: ['));
    const ateCredentials = providers.slice(0, providers.indexOf('CredentialsProvider'));
    expect(
      ateCredentials.includes('googleConfigurado'),
      'o GoogleProvider tem de ficar dentro da condição',
    ).toBe(true);
  });
});

describe('as páginas de autenticação', () => {
  const paginas = [
    ['entrada', join('src', 'app', 'auth', 'login', 'page.tsx')],
    ['registo', join('src', 'app', 'auth', 'register', 'page.tsx')],
  ] as const;

  it.each(paginas)('a página de %s não mostra o botão da Google sem o verificar', (_nome, caminho) => {
    const fonte = readFileSync(join(process.cwd(), caminho), 'utf-8');
    // O `GoogleButton` cru volta a mostrar o botao sem condicao nenhuma.
    expect(
      fonte.includes('<GoogleButton'),
      'usa o GoogleButton diretamente em vez do EntrarComGoogle',
    ).toBe(false);
    expect(fonte).toContain('<EntrarComGoogle');
  });

  it.each(paginas)('a página de %s mantém a entrada por email e palavra-passe', (_nome, caminho) => {
    const fonte = readFileSync(join(process.cwd(), caminho), 'utf-8');
    // A Google e opcional; isto nao e. Se o formulario desaparecer, uma
    // instalacao sem Google fica sem forma nenhuma de entrar.
    expect(fonte).toMatch(/name="email"/);
    expect(fonte).toMatch(/name="password"/);
  });
});

describe('o bloco EntrarComGoogle', () => {
  const fonte = ler('src', 'components', 'ui', 'AuthShell.tsx');

  it('pergunta ao servidor quais os provedores, em vez de adivinhar', () => {
    expect(fonte).toContain('getProviders');
    // Uma segunda variavel de ambiente podia discordar do auth.ts sem
    // ninguem reparar. A lista do servidor nao pode.
    expect(fonte).not.toContain('NEXT_PUBLIC_GOOGLE');
  });

  it('não mostra nada enquanto não souber', () => {
    // Um botao que aparece e desaparece e pior do que um que nunca apareceu.
    expect(fonte).toContain('if (!disponivel) return null;');
  });
});

describe('entrar pela Google', () => {
  // Chama o callback a serio, nao le a fonte: o que interessa e o que ele
  // decide, e estes casos decidem antes de tocar na base de dados.
  const entrar = async (profile: Record<string, unknown> | undefined, email = 'a@exemplo.pt') => {
    const { authOptions } = await import('../auth');
    return authOptions.callbacks!.signIn!({
      user: { id: 'x', email, name: 'A' },
      account: { provider: 'google', type: 'oauth', providerAccountId: '1' },
      profile: profile as never,
    } as never);
  };

  it('recusa um email que a Google não verificou', async () => {
    // Numa conta Workspace de um domínio qualquer, `email_verified` pode vir
    // falso. Aceitá-lo era entregar a conta de quem se registou com esse email.
    expect(await entrar({ email_verified: false })).toBe(false);
    expect(await entrar({})).toBe(false);
    expect(await entrar(undefined)).toBe(false);
  });

  it('não deixa a entrada por email e palavra-passe depender disto', async () => {
    const { authOptions } = await import('../auth');
    expect(
      await authOptions.callbacks!.signIn!({
        user: { id: 'x' },
        account: { provider: 'credentials', type: 'credentials', providerAccountId: 'x' },
      } as never),
    ).toBe(true);
  });

  it('uma conta sem palavra-passe é válida para o modelo', async () => {
    // Era aqui que rebentava: `password: ''` falhava o `required` e ninguém
    // conseguia entrar pela Google pela primeira vez.
    const { User } = await import('../models');
    const u = new User({ name: 'A', email: 'a@exemplo.pt', emailVerified: true });
    expect(u.validateSync()).toBeUndefined();
  });

  it('já não há adaptador, nem a dependência que o trazia', () => {
    // Duas fontes de verdade para a mesma conta foi o que partiu isto.
    expect(ler('src', 'lib', 'auth.ts')).not.toMatch(/adapter:/);
    expect(ler('package.json')).not.toContain('mongodb-adapter');
  });
});
