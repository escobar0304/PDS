import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A regra, e nao as correccoes, e o que esta fase entrega.
 *
 * Corrigir as tres rotas que existem hoje resolve hoje. O que evita a
 * repeticao daqui a seis meses e isto: uma rota nova que leia o corpo do
 * pedido sem passar por `lerCorpo` falha aqui, e falha no CI, antes de
 * chegar a producao.
 */

const RAIZ = join(__dirname, '..', '..', 'app', 'api');

function rotas(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return rotas(caminho);
    return nome === 'route.ts' ? [caminho] : [];
  });
}

/**
 * Rotas isentas, com a razao. Acrescentar aqui e uma decisao deliberada que
 * fica registada em revisao, nao um esquecimento.
 */
const ISENTAS: Record<string, string> = {
  'auth/[...nextauth]/route.ts':
    'Delega no NextAuth. A validação das credenciais está em src/lib/auth.ts.',
  'pagamentos/aviso/route.ts':
    'A assinatura da Stripe é sobre o texto tal como chegou; é ela que o valida, em src/lib/pagamento.ts.',
};

describe('rotas de API', () => {
  const ficheiros = rotas(RAIZ);

  it('encontra rotas para verificar', () => {
    expect(ficheiros.length).toBeGreaterThan(0);
  });

  it('nenhuma lê o corpo do pedido sem o validar', () => {
    const faltosas: string[] = [];

    for (const caminho of ficheiros) {
      const relativo = caminho.slice(RAIZ.length + 1);
      if (ISENTAS[relativo]) continue;

      const fonte = readFileSync(caminho, 'utf8');
      const leCorpo = /\.json\(\)|\.formData\(\)|\.text\(\)/.test(
        fonte.replace(/NextResponse\.json\([^)]*\)/g, ''),
      );
      if (!leCorpo) continue;

      if (!fonte.includes('lerCorpo')) faltosas.push(relativo);
    }

    expect(
      faltosas,
      'lê o corpo do pedido sem passar por lerCorpo: ver src/lib/validacao.ts',
    ).toEqual([]);
  });

  /** Cada metodo exportado, com o seu corpo, para verificar um a um. */
  function metodos(fonte: string): { nome: string; corpo: string }[] {
    const partes = fonte.split(/(?=export async function (?:GET|POST|PUT|PATCH|DELETE)\b)/);
    return partes
      .map((corpo) => ({ nome: /export async function (\w+)/.exec(corpo)?.[1] ?? '', corpo }))
      .filter((m) => m.nome);
  }

  it('todos os métodos de todas as rotas limitam pedidos', () => {
    // Leitura incluida: uma leitura publica que vai a base de dados e a
    // maneira mais barata de a pôr de joelhos.
    const faltosos: string[] = [];

    for (const caminho of ficheiros) {
      const relativo = caminho.slice(RAIZ.length + 1);
      // So o NextAuth: o limite da entrada esta em src/lib/auth.ts. As outras
      // isencoes sao do `lerCorpo`, nao do limite.
      if (relativo === 'auth/[...nextauth]/route.ts') continue;

      for (const { nome, corpo } of metodos(readFileSync(caminho, 'utf8'))) {
        if (!/\btravar\(|\bconsumir\(/.test(corpo)) faltosos.push(`${nome} ${relativo}`);
      }
    }

    expect(faltosos, 'sem limite de pedidos: ver travar() em src/lib/limites.ts').toEqual([]);
  });

  it('em /api/admin, todos os métodos exigem administrador antes de mais nada', () => {
    const faltosos: string[] = [];

    for (const caminho of ficheiros) {
      const relativo = caminho.slice(RAIZ.length + 1);
      if (!relativo.startsWith('admin/')) continue;

      for (const { nome, corpo } of metodos(readFileSync(caminho, 'utf8'))) {
        const guarda = corpo.indexOf('exigirAdmin(');
        const corpoLido = corpo.search(/lerCorpo\(|connectDB\(|\.find|\.update|\.create/);
        if (guarda === -1 || (corpoLido !== -1 && corpoLido < guarda)) {
          faltosos.push(`${nome} ${relativo}`);
        }
      }
    }

    expect(faltosos, 'rota de administração sem exigirAdmin() à cabeça').toEqual([]);
  });

  it('nenhuma monta HTML a partir de entrada externa', () => {
    const suspeitas: string[] = [];

    for (const caminho of ficheiros) {
      const fonte = readFileSync(caminho, 'utf8');
      // Interpolacao dentro de uma cadeia com marcacao HTML. Foi assim que o
      // formulario de contacto passou a poder enviar HTML a escolha alheia.
      if (/html:\s*`/.test(fonte) || /<[a-z]+[^>]*>[^`]*\$\{/.test(fonte)) {
        suspeitas.push(caminho.slice(RAIZ.length + 1));
      }
    }

    expect(
      suspeitas,
      'monta HTML com interpolação: envie texto simples ou escape a entrada',
    ).toEqual([]);
  });

  it('as que enviam correio não deixam o destino ser escolhido pelo pedido', () => {
    const suspeitas: string[] = [];

    for (const caminho of ficheiros) {
      const fonte = readFileSync(caminho, 'utf8');
      if (!fonte.includes('sendMail')) continue;

      // `to:` tem de sair do ambiente. Sair do corpo do pedido e o que
      // transforma a rota num relay de correio.
      for (const [, destino] of fonte.matchAll(/^\s*to:\s*(.+),$/gm)) {
        if (!destino.includes('process.env') && !destino.includes('destino')) {
          suspeitas.push(`${caminho.slice(RAIZ.length + 1)}: to: ${destino}`);
        }
      }
    }

    expect(suspeitas, 'destino de email escolhido pelo pedido').toEqual([]);
  });
});
