import { beforeEach, describe, expect, it } from 'vitest';
import { consumir, identificar, reiniciarLimites, travar } from '../limites';

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

describe('o que o limitador guarda não fica para sempre', () => {
  it('uma entrada expirada sai na limpeza seguinte, mesmo com poucas guardadas', async () => {
    // Guarda enderecos IP e emails. A limpeza so corria com mais de 5000
    // chaves, e num sitio pequeno isso e nunca: a politica de privacidade
    // diria "uma hora" e seria mentira.
    const { chavesGuardadas, consumir, reiniciarLimites } = await import('../limites');
    reiniciarLimites();
    const agora = 1_000_000;

    consumir('teste:ip:203.0.113.7', { max: 5, janelaMs: 60 * 60 * 1000 }, agora);
    expect(chavesGuardadas()).toBe(1);

    // Hora e um minuto depois, outro pedido qualquer faz a limpeza.
    consumir('teste:ip:198.51.100.1', { max: 5, janelaMs: 1000 }, agora + 61 * 60 * 1000);
    expect(chavesGuardadas()).toBe(1);
  });
});

describe('travar', () => {
  const pedido = (ip: string) => new Request('http://x/api', { headers: { 'x-forwarded-for': ip } });
  const LIMITE = { max: 2, janelaMs: 60_000 };

  it('deixa passar até ao limite, e depois responde 429 com Retry-After', async () => {
    reiniciarLimites();
    expect(travar(pedido('1.1.1.1'), 't', LIMITE)).toBeNull();
    expect(travar(pedido('1.1.1.1'), 't', LIMITE)).toBeNull();

    const r = travar(pedido('1.1.1.1'), 't', LIMITE);
    expect(r?.status).toBe(429);
    expect(Number(r?.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await r?.json()).toEqual({ error: 'Demasiados pedidos. Tente mais tarde.' });
  });

  it('conta por quem, não por todos', () => {
    reiniciarLimites();
    travar(pedido('1.1.1.1'), 't', LIMITE);
    travar(pedido('1.1.1.1'), 't', LIMITE);
    expect(travar(pedido('2.2.2.2'), 't', LIMITE)).toBeNull();
    // Nas rotas autenticadas conta a sessao: o mesmo IP, outra pessoa, passa.
    expect(travar(pedido('1.1.1.1'), 't', LIMITE, 'utilizador-b')).toBeNull();
  });
});
