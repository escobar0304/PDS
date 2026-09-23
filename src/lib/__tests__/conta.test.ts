import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A promessa que estava por cumprir.
 *
 * `src/app/privacidade/page.tsx` diz, sobre os dados da conta: "Enquanto
 * mantiver a conta. **Apaga-se quando a apagar.**" Ate aqui nao havia forma
 * nenhuma de a apagar. O sitio prometia um direito que nao oferecia.
 *
 * O comportamento real — que apagar limpa mesmo todas as coleccoes — esta em
 * `integracao.test.ts` e so corre no CI, com Mongo. Aqui guarda-se o que se
 * pode guardar sem base de dados: que as rotas existem, que exigem sessao, e
 * que nao aceitam um id vindo do pedido.
 */

const raiz = process.cwd();
const ler = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf-8');

describe('as rotas da conta', () => {
  const exportar = ler('src', 'app', 'api', 'conta', 'dados', 'route.ts');
  const conta = ler('src', 'app', 'api', 'conta', 'route.ts');

  it('exigem sessão, as duas', () => {
    for (const fonte of [exportar, conta]) {
      expect(fonte).toContain('exigirSessao');
    }
  });

  it('consultam pelo id da sessão, nunca por um id vindo do pedido', () => {
    // Aceitar `?id=` aqui trocava um direito do RGPD por um IDOR: qualquer
    // pessoa autenticada descarregava os dados de qualquer outra.
    for (const fonte of [exportar, conta]) {
      expect(fonte).toContain('permissao.sessao.id');
      expect(fonte).not.toMatch(/searchParams\.get\(\s*['"]id['"]\s*\)/);
    }
  });

  it('a exportação não é guardada em cache pelo caminho', () => {
    expect(exportar).toContain('no-store');
  });

  it('o nome do ficheiro não leva nada escrito pelo utilizador', () => {
    // Um nome com aspas ou quebras de linha no Content-Disposition e injeccao
    // de cabecalho. O nome e constante.
    const linha = exportar.split('\n').find((l) => l.includes('Content-Disposition'));
    expect(linha).toBeDefined();
    expect(linha).not.toContain('${');
  });

  it('apagar exige confirmação e é limitado por tentativas', () => {
    expect(conta).toContain('consumir(');
    expect(conta).toMatch(/argon2Verify|bcrypt\.compare/);
  });

  it('apagar trata a conta sem palavra-passe local', () => {
    // As contas da Google nascem com `password: ''` no callback `signIn`.
    // Pedir-lhes a palavra-passe deixava-as sem forma nenhuma de apagar.
    expect(conta).toContain('temPassword');
    expect(conta).toContain('confirmacao');
  });

  it('a resposta de apagar não conta a forma das coleções', () => {
    // O resultado tem as contagens por coleccao; devolve-las dizia a quem
    // sondar o que existe do outro lado, e nao serve a quem apagou.
    const corpoDelete = conta.slice(conta.indexOf('export async function DELETE'));
    expect(corpoDelete).not.toContain('resultado.apagados');
  });
});

describe('a política de privacidade e o que o site faz', () => {
  it('a promessa de apagar a conta tem agora um mecanismo', () => {
    const politica = ler('src', 'app', 'privacidade', 'page.tsx');
    const prometeApagar = /[Aa]paga-se quando a apagar/.test(politica);

    if (!prometeApagar) {
      // Se a frase for reescrita, este teste deixa de fazer sentido como
      // esta — e melhor falhar a dizê-lo do que continuar a guardar uma
      // regra que ja nao corresponde ao texto.
      throw new Error(
        'a política deixou de dizer "apaga-se quando a apagar": rever este teste',
      );
    }

    expect(() => ler('src', 'app', 'api', 'conta', 'route.ts')).not.toThrow();
  });

  it('a exportação não devolve a palavra-passe cifrada', () => {
    const fonte = ler('src', 'lib', 'conta.ts');
    expect(fonte).toContain('NUNCA_EXPORTAR');
    expect(fonte).toMatch(/NUNCA_EXPORTAR\s*=\s*\[[^\]]*'password'/);
  });

  it('as encomendas não são apagadas com a conta', () => {
    // Conservacao fiscal dos documentos de venda (art. 17.º, n.º 3, b).
    const fonte = ler('src', 'lib', 'conta.ts');
    expect(fonte).toContain('$unset');
    expect(fonte).not.toMatch(/Order\.deleteMany/);
  });
});
