import { describe, expect, it } from 'vitest';
import { CONDICOES } from '@/lib/condicoes';
import { CONDICOES_DE_ENSAIO, estadoDaLoja } from '@/lib/loja';
import { MEIOS_DE_PAGAMENTO } from '@/lib/pagamento';

/**
 * Se a loja vende, e porque nao. E o que decide se o checkout existe: um
 * erro aqui ou vende sem a informacao que a lei pede, ou nao vende nada.
 */

const CHAVES = { STRIPE_SECRET_KEY: 'sk_test_123', STRIPE_WEBHOOK_SECRET: 'whsec_x' };

function faltas(env: Record<string, string>) {
  const e = estadoDaLoja(env);
  return e.aberta ? [] : e.faltas.map((f) => f.campo);
}

describe('o estado da loja', () => {
  it('hoje está fechada, e diz tudo o que falta de uma vez', () => {
    const f = faltas(CHAVES);
    // Os dados do negocio que ainda nao chegaram.
    expect(f).toEqual(
      expect.arrayContaining(['encomendasOnline', 'prazoEntrega', 'tabelaPortes', 'nif', 'confirmação por email'])
    );
    // Com as chaves postas, a configuracao nao e uma das faltas.
    expect(f).not.toContain('STRIPE_SECRET_KEY');
  });

  it('sem as chaves da Stripe, a falta aparece', () => {
    expect(faltas({})).toEqual(expect.arrayContaining(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']));
  });

  it('cada falta diz porquê', () => {
    const e = estadoDaLoja({});
    if (e.aberta) throw new Error('a loja devia estar fechada');
    for (const f of e.faltas) expect(f.porque, f.campo).toBeTruthy();
  });

  describe('o ensaio', () => {
    it('abre com uma chave de testes, e diz que é ensaio', () => {
      expect(estadoDaLoja({ ...CHAVES, LOJA_ENSAIO: '1' })).toEqual({
        aberta: true,
        ensaio: true,
        condicoes: CONDICOES_DE_ENSAIO,
      });
    });

    it('com uma chave real, fecha em vez de abrir', () => {
      const e = estadoDaLoja({ ...CHAVES, STRIPE_SECRET_KEY: 'sk_live_abc', LOJA_ENSAIO: '1' });
      expect(e).toMatchObject({ aberta: false, faltas: [{ campo: 'LOJA_ENSAIO' }] });
    });

    it('sem chaves também não abre', () => {
      expect(estadoDaLoja({ LOJA_ENSAIO: '1' }).aberta).toBe(false);
    });

    it('só com LOJA_ENSAIO=1, e não com outro valor qualquer', () => {
      expect(estadoDaLoja({ ...CHAVES, LOJA_ENSAIO: 'true' }).aberta).toBe(false);
    });

    it('não usa os dados do negócio, para ninguém os confundir', () => {
      // Se um dia os de ensaio forem iguais aos reais, o aviso "inventados"
      // da pagina passava a ser falso.
      expect(CONDICOES_DE_ENSAIO.tabelaPortes).not.toEqual(CONDICOES.tabelaPortes);
      expect(CONDICOES_DE_ENSAIO.prazoEntrega).toMatch(/ensaio/);
    });
  });
});

describe('os meios de pagamento', () => {
  it('os que as condições dizem são os que a sessão da Stripe aceita', () => {
    // /termos e o checkout leem `CONDICOES.meiosPagamento`; a Stripe recebe
    // `MEIOS_DE_PAGAMENTO`. Acrescentar um sem o outro era prometer um meio
    // que nao existe, ou aceitar um que nao se disse.
    expect(CONDICOES.meiosPagamento).toHaveLength(MEIOS_DE_PAGAMENTO.length);
  });
});
