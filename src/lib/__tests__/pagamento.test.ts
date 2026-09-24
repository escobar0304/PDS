import { beforeAll, describe, expect, it } from 'vitest';

/**
 * A assinatura dos avisos da Stripe, sem rede nem base de dados: a biblioteca
 * verifica-a sozinha, com o segredo. E isto que impede alguem de enviar um
 * "pago" inventado para /api/pagamentos/aviso.
 */

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY ??= 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_apenas_para_testes';
});

async function assinado(evento: object, segredo = 'whsec_apenas_para_testes') {
  const { stripe } = await import('@/lib/pagamento');
  const corpo = JSON.stringify(evento);
  return { corpo, assinatura: stripe().webhooks.generateTestHeaderString({ payload: corpo, secret: segredo }) };
}

describe('avisos de pagamento', () => {
  it('um aviso bem assinado de um tipo que não interessa é ignorado, sem tocar na base de dados', async () => {
    const { tratarAviso } = await import('@/lib/pagamento');
    const { corpo, assinatura } = await assinado({ id: 'evt_x', object: 'event', type: 'customer.created', data: { object: {} } });
    expect(await tratarAviso(corpo, assinatura)).toBe('ignorado');
  });

  it('assinado com outro segredo é recusado', async () => {
    const { tratarAviso, AssinaturaInvalida } = await import('@/lib/pagamento');
    const { corpo, assinatura } = await assinado(
      { id: 'evt_x', object: 'event', type: 'checkout.session.completed', data: { object: {} } },
      'whsec_de_outra_pessoa'
    );
    await expect(tratarAviso(corpo, assinatura)).rejects.toBeInstanceOf(AssinaturaInvalida);
  });

  it('sem assinatura, ou com o corpo mexido depois de assinado, é recusado', async () => {
    const { tratarAviso, AssinaturaInvalida } = await import('@/lib/pagamento');
    const { corpo, assinatura } = await assinado({
      id: 'evt_x',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: { amount_total: 100 } },
    });
    await expect(tratarAviso(corpo, null)).rejects.toBeInstanceOf(AssinaturaInvalida);
    await expect(tratarAviso(corpo.replace('100', '1'), assinatura)).rejects.toBeInstanceOf(AssinaturaInvalida);
  });
});
