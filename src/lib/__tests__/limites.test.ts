import { beforeEach, describe, expect, it } from 'vitest';
import { consumir, identificar, reiniciarLimites } from '../limites';

describe('limite de pedidos', () => {
  beforeEach(reiniciarLimites);

  it('deixa passar até ao máximo e bloqueia a seguir', () => {
    const limite = { max: 3, janelaMs: 60_000 };

    for (let i = 0; i < 3; i += 1) {
      expect(consumir('a', limite).permitido, `pedido ${i + 1}`).toBe(true);
    }
    expect(consumir('a', limite).permitido).toBe(false);
  });

  it('conta cada chave por si', () => {
    const limite = { max: 1, janelaMs: 60_000 };

    expect(consumir('ip:1', limite).permitido).toBe(true);
    expect(consumir('ip:1', limite).permitido).toBe(false);
    // Outro IP não herda o bloqueio do primeiro.
    expect(consumir('ip:2', limite).permitido).toBe(true);
  });

  it('reabre quando a janela passa', () => {
    const limite = { max: 1, janelaMs: 1000 };
    const t0 = 1_000_000;

    expect(consumir('a', limite, t0).permitido).toBe(true);
    expect(consumir('a', limite, t0 + 500).permitido).toBe(false);
    expect(consumir('a', limite, t0 + 1001).permitido).toBe(true);
  });

  it('diz quanto falta para reabrir, para o Retry-After', () => {
    const limite = { max: 1, janelaMs: 60_000 };
    const t0 = 1_000_000;

    consumir('a', limite, t0);
    const r = consumir('a', limite, t0 + 10_000);

    expect(r.permitido).toBe(false);
    expect(r.segundosAteReiniciar).toBe(50);
  });
});

describe('identificação de quem faz o pedido', () => {
  const comCabecalhos = (h: Record<string, string>) =>
    new Request('https://exemplo.pt', { headers: h });

  it('usa o primeiro elemento de x-forwarded-for, que é o cliente', () => {
    expect(
      identificar(comCabecalhos({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' })),
    ).toBe('203.0.113.7');
  });

  it('recorre a x-real-ip quando não há o outro', () => {
    expect(identificar(comCabecalhos({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('não rebenta sem nenhum dos dois', () => {
    expect(identificar(comCabecalhos({}))).toBe('desconhecido');
  });
});
