import { describe, expect, it } from 'vitest';
import { MissingEnvError, missingEnv, optionalEnv, requireEnv } from '@/lib/env';

describe('missingEnv', () => {
  it('assinala as que faltam e as que estao vazias', () => {
    const source = { A: 'valor', B: '', C: '   ' };
    expect(missingEnv(['A', 'B', 'C', 'D'], source)).toEqual(['B', 'C', 'D']);
  });

  it('devolve vazio quando esta tudo preenchido', () => {
    expect(missingEnv(['A'], { A: 'x' })).toEqual([]);
  });
});

describe('requireEnv', () => {
  it('lanca com o nome da variavel na mensagem', () => {
    delete process.env.VARIAVEL_DE_TESTE;
    expect(() => requireEnv('VARIAVEL_DE_TESTE')).toThrow(MissingEnvError);
    expect(() => requireEnv('VARIAVEL_DE_TESTE')).toThrow(/VARIAVEL_DE_TESTE/);
  });

  it('devolve o valor quando existe', () => {
    process.env.VARIAVEL_DE_TESTE = 'ok';
    expect(requireEnv('VARIAVEL_DE_TESTE')).toBe('ok');
    delete process.env.VARIAVEL_DE_TESTE;
  });
});

describe('optionalEnv', () => {
  it('usa o valor de recurso quando falta', () => {
    delete process.env.OPCIONAL_DE_TESTE;
    expect(optionalEnv('OPCIONAL_DE_TESTE', 'recurso')).toBe('recurso');
  });
});
