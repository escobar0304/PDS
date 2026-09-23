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
