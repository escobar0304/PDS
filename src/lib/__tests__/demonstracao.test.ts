import { describe, expect, it } from 'vitest';
import { problemasDasMedidas } from '../catalogo';
import { PECAS_DE_EXEMPLO, PREFIXO_EXEMPLO, criarPecasDeExemplo, variantes } from '../demonstracao';
import { esquemaNovoProduto } from '../validacao';

/**
 * As pecas de exemplo nao sao dados do negocio, e o teste garante que nao se
 * fazem passar por eles: so numa loja em ensaio, e todas se anunciam como
 * exemplo. O resto (que entram como o painel as poria) prova-se contra a
 * base de dados, em `integracao.test.ts`.
 */
describe('as peças de exemplo', () => {
  it('não entram numa loja que não esteja em ensaio, e nem chegam à base de dados', async () => {
    // Sem MONGODB_URI: se tentasse ligar-se, rebentava em vez de recusar.
    for (const env of [{}, { LOJA_ENSAIO: '0' }, { LOJA_ENSAIO: 'true' }]) {
      const r = await criarPecasDeExemplo(env);
      expect(r).toMatchObject({ ok: false });
    }
  });

  it('são aceites pelas regras das medidas, numa categoria de peças únicas ou não', () => {
    for (const p of PECAS_DE_EXEMPLO) {
      for (const unicas of [true, false]) {
        expect(problemasDasMedidas(variantes(p, unicas), unicas), `${p.slug}, únicas: ${unicas}`).toEqual([]);
      }
    }
  });

  it('são aceites pela validação do painel', () => {
    for (const p of PECAS_DE_EXEMPLO) {
      const r = esquemaNovoProduto.safeParse({
        name: PREFIXO_EXEMPLO + p.nome,
        slug: p.slug,
        priceCents: p.precoCents,
        weightGrams: p.pesoGramas,
        categoryId: 'a'.repeat(24),
        images: [p.imagem],
        featured: p.destaque,
        active: true,
        variantes: variantes(p, false),
      });
      expect(r.success, p.slug).toBe(true);
    }
  });

  it('anunciam-se como exemplo, no nome e no endereço', () => {
    expect(PREFIXO_EXEMPLO).toMatch(/^Exemplo/);
    for (const p of PECAS_DE_EXEMPLO) expect(p.slug).toMatch(/^exemplo-/);
    expect(new Set(PECAS_DE_EXEMPLO.map((p) => p.slug)).size).toBe(PECAS_DE_EXEMPLO.length);
  });
});
