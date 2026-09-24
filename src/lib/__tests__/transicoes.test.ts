import { describe, expect, it } from 'vitest';
import { ESTADOS, TRANSICOES, formatarNumero, podePassar, type Estado } from '@/lib/transicoes';

describe('estados de uma encomenda', () => {
  it('não se expede nem se entrega uma encomenda por pagar', () => {
    expect(podePassar('PENDING', 'SHIPPED')).toBe(false);
    expect(podePassar('PENDING', 'READY_PICKUP')).toBe(false);
    expect(podePassar('PENDING', 'COMPLETED')).toBe(false);
  });

  it('cancelada e concluída não saem do sítio', () => {
    expect(TRANSICOES.CANCELLED).toEqual([]);
    expect(TRANSICOES.COMPLETED).toEqual([]);
  });

  it('todos os estados se alcançam a partir de uma encomenda nova', () => {
    // Um estado que ninguem alcanca e codigo morto a espera de ser usado mal.
    const vistos = new Set<Estado>(['PENDING']);
    const fila: Estado[] = ['PENDING'];
    while (fila.length) {
      for (const seguinte of TRANSICOES[fila.shift()!]) {
        if (!vistos.has(seguinte)) {
          vistos.add(seguinte);
          fila.push(seguinte);
        }
      }
    }
    expect([...vistos].sort()).toEqual([...ESTADOS].sort());
  });

  it('o número lê-se, e ordena-se como texto', () => {
    expect(formatarNumero(2026, 1)).toBe('2026-000001');
    expect(formatarNumero(2026, 123456)).toBe('2026-123456');
    expect(formatarNumero(2026, 9) < formatarNumero(2026, 10)).toBe(true);
  });
});
