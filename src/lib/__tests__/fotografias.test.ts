import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAX_BYTES, guardarImagem, lerImagem } from '../imagens';

/**
 * O que acontece a uma fotografia carregada pelo painel. As imagens sao
 * geradas aqui, com os defeitos que se querem apanhar.
 */

let pasta: string;
beforeEach(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), 'imagens-'));
});
afterEach(async () => {
  await rm(pasta, { recursive: true, force: true });
});

const cor = { r: 120, g: 80, b: 160 };
const jpeg = (largura: number, altura: number) =>
  sharp({ create: { width: largura, height: altura, channels: 3, background: cor } }).jpeg();

describe('guardar uma fotografia', () => {
  it('tira a localização e o resto dos metadados, mas roda-a primeiro como o telemóvel a viu', async () => {
    // 300x200 com orientacao 6: quem a tirou viu-a de pe, 200x300.
    const original = await jpeg(300, 200)
      .keepExif()
      .withExif({ IFD0: { Copyright: 'teste' }, IFD3: { GPSLatitudeRef: 'N', GPSLongitudeRef: 'W' } })
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const antes = await sharp(original).metadata();
    expect(antes.orientation).toBe(6);
    expect(antes.exif?.includes(Buffer.from('teste'))).toBe(true);

    const r = await guardarImagem(original, pasta);
    expect(r).toMatchObject({ ok: true, largura: 200, altura: 300 });

    const nome = (r as { caminho: string }).caminho.replace('/imagens/', '');
    const guardada = (await lerImagem(nome, pasta))!;
    const meta = await sharp(guardada).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
    expect(guardada.includes(Buffer.from('teste'))).toBe(false);
  });

  it('reduz ao máximo de 2000 px de lado, sem aumentar as pequenas', async () => {
    expect(await guardarImagem(await jpeg(4000, 3000).toBuffer(), pasta)).toMatchObject({ largura: 2000, altura: 1500 });
    expect(await guardarImagem(await jpeg(640, 480).toBuffer(), pasta)).toMatchObject({ largura: 640, altura: 480 });
  });

  it('o nome é o resumo do conteúdo: a mesma fotografia duas vezes é um ficheiro só', async () => {
    const bytes = await jpeg(50, 50).toBuffer();
    const a = await guardarImagem(bytes, pasta);
    const b = await guardarImagem(bytes, pasta);
    expect(a).toEqual(b);
    expect((a as { caminho: string }).caminho).toMatch(/^\/imagens\/[a-f0-9]{64}\.webp$/);
    expect(await readdir(pasta)).toHaveLength(1);
  });

  it('recusa o que não é imagem, mesmo com cara de JPEG', async () => {
    const falso = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('<script>alert(1)</script>')]);
    expect(await guardarImagem(falso, pasta)).toEqual({ ok: false, motivo: 'nao-e-imagem' });
    expect(await guardarImagem(Buffer.from('%PDF-1.4'), pasta)).toEqual({ ok: false, motivo: 'nao-e-imagem' });
    expect(await readdir(pasta)).toEqual([]);
  });

  it('recusa uma imagem pequena em bytes que se expande em demasiados pixeis', async () => {
    // 9000x9000 de uma cor so: poucos KB em PNG, 81 megapixeis abertos.
    const bomba = await sharp({ create: { width: 9000, height: 9000, channels: 3, background: cor } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    expect(bomba.length).toBeLessThan(MAX_BYTES);
    expect(await guardarImagem(bomba, pasta)).toEqual({ ok: false, motivo: 'demasiado-grande' });
  });

  it('recusa acima de 10 MB sem a abrir', async () => {
    expect(await guardarImagem(Buffer.alloc(MAX_BYTES + 1), pasta)).toEqual({ ok: false, motivo: 'demasiado-grande' });
  });
});

describe('ler uma fotografia guardada', () => {
  it('só com o nome que guardarImagem dá: nada de caminhos', async () => {
    const r = await guardarImagem(await jpeg(10, 10).toBuffer(), pasta);
    const nome = (r as { caminho: string }).caminho.replace('/imagens/', '');
    expect(await lerImagem(nome, pasta)).not.toBeNull();
    for (const mau of ['../../etc/passwd', `../${nome}`, nome.toUpperCase(), nome.replace('.webp', '.png'), '']) {
      expect(await lerImagem(mau, pasta), mau).toBeNull();
    }
    expect(await lerImagem('f'.repeat(64) + '.webp', pasta)).toBeNull();
  });
});
