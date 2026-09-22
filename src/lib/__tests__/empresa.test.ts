import { describe, expect, it } from 'vitest';
import { camposEmFalta, EMPRESA, identificacaoCompleta, moradaFormatada } from '../empresa';

describe('identificação do prestador', () => {
  it('diz o que falta, e porquê, em vez de só dizer que falta', () => {
    const faltam = camposEmFalta();
    for (const campo of faltam) {
      expect(campo.porque, `${campo.caminho} sem base legal indicada`).toMatch(
        /DL 7\/2004|Lei 144\/2015/,
      );
    }
  });

  it('não dá a morada por boa enquanto faltar uma parte', () => {
    if (!EMPRESA.morada.linha || !EMPRESA.morada.codigoPostal || !EMPRESA.morada.localidade) {
      expect(moradaFormatada()).toBeNull();
    } else {
      expect(moradaFormatada()).toContain(EMPRESA.morada.localidade);
    }
  });

  it('só se considera completa quando não falta nada', () => {
    expect(identificacaoCompleta()).toBe(camposEmFalta().length === 0);
  });

  it('não tem valores a fingir', () => {
    // O rodape chegou a producao com `+351 xxx xxx xxx` e `tel:+351000000000`.
    // Um campo por preencher e null; nunca um valor inventado.
    const texto = JSON.stringify(EMPRESA);
    expect(texto).not.toMatch(/xxx|000000000|exemplo\.(com|pt)|lorem/i);
  });
});
