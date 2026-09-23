import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { paginasDisponiveis } from '../paginas';
import { paginasDoMapa, privada, ROTAS_PRIVADAS } from '../site';

describe('o mapa do sítio e o robots.txt não discordam', () => {
  it('nada privado entra no mapa', () => {
    for (const c of paginasDoMapa()) expect(privada(c), c).toBe(false);
  });

  it('só entram páginas institucionais que existem', () => {
    const existem = paginasDisponiveis().map((p) => p.href);
    const institucionais = paginasDoMapa().filter(
      (c) => !['/', '/loja', '/catalogo', '/sobre-nos'].includes(c),
    );
    for (const c of institucionais) expect(existem, c).toContain(c);
    // E todas as que existem la estao.
    for (const e of existem) expect(paginasDoMapa(), e).toContain(e);
  });

  it('o robots.ts bloqueia exatamente a mesma lista', () => {
    const robots = readFileSync(join(process.cwd(), 'src', 'app', 'robots.ts'), 'utf-8');
    expect(robots).toContain('disallow: [...ROTAS_PRIVADAS]');
    expect(ROTAS_PRIVADAS).toContain('/area-pessoal');
  });

  it('privada() reconhece a rota e o que está por baixo dela, e mais nada', () => {
    expect(privada('/auth/login')).toBe(true);
    expect(privada('/area-pessoal')).toBe(true);
    expect(privada('/loja')).toBe(false);
  });
});

describe('uma consulta acessória desiste cedo', () => {
  it('ao fim do prazo, mesmo que a base de dados nunca responda', async () => {
    vi.resetModules();
    vi.doMock('mongoose', async (original) => {
      const m = (await original()) as { default: object };
      // Uma ligacao que fica pendurada para sempre.
      return { ...m, default: { ...m.default, connect: () => new Promise(() => {}) } };
    });
    process.env.MONGODB_URI = 'mongodb://pendurado.invalid:27017/x';
    const { comPrazo } = await import('../db');

    const inicio = Date.now();
    await expect(comPrazo(async () => 'nunca', 100)).rejects.toThrow('base de dados lenta');
    expect(Date.now() - inicio).toBeLessThan(1000);

    delete process.env.MONGODB_URI;
    vi.doUnmock('mongoose');
  });
});
