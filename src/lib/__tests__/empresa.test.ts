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

describe('nenhum dado de contacto a fingir na interface', () => {
  it('não há telefones, emails nem moradas escritos à mão', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');

    const raiz = join(__dirname, '..', '..');
    const tsx = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const c = join(dir, n);
        return statSync(c).isDirectory() ? tsx(c) : n.endsWith('.tsx') ? [c] : [];
      });

    // Tudo isto chegou a estar escrito a mao em producao. O sitio de onde
    // estes valores saem e `EMPRESA`, e o que falta diz que falta.
    const PROIBIDOS = [
      /tel:\+?\d{6,}/,
      /mailto:[\w.+-]+@[\w.-]+/,
      /\+351[\s\d x]{6,}/,
      /[\w.+-]+@petalasdesonho\.pt/,
    ];

    const culpados: string[] = [];
    for (const caminho of tsx(raiz)) {
      const fonte = readFileSync(caminho, 'utf8');
      // Comentarios e placeholders de formulario nao sao afirmacoes.
      const semComentarios = fonte
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/placeholder="[^"]*"/g, '');

      for (const padrao of PROIBIDOS) {
        // `${EMPRESA.email}` e interpolacao, nao um valor escrito a mao.
        const linhas = semComentarios.split('\n').filter((l) => padrao.test(l) && !l.includes('EMPRESA.'));
        if (linhas.length) {
          culpados.push(`${caminho.slice(raiz.length + 1)}: ${linhas[0].trim().slice(0, 60)}`);
        }
      }
    }

    expect(culpados, 'dado de contacto escrito à mão: use EMPRESA').toEqual([]);
  });
});
