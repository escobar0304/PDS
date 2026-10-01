import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type OutputInfo } from 'sharp';

/**
 * As fotografias que o painel carrega: tratadas aqui, guardadas em disco, e
 * servidas por `/imagens/<resumo>.webp`.
 *
 * **Guardadas em disco porque o alojamento esta por decidir.** Num servidor
 * proprio, ou no Docker da demonstracao (com um volume), o disco chega. Num
 * alojamento sem disco permanente (Vercel, por exemplo) isto tem de passar
 * para um armazenamento de ficheiros, e e so este modulo que muda: o resto do
 * sitio conhece apenas o caminho `/imagens/<resumo>.webp`.
 *
 * O que se faz a cada fotografia, e porque:
 * - **so os formatos que o browser declara como imagem** (`TIPOS`); o pedido
 *   leva esse tipo no cabecalho, e um formulario de outro sitio nao o
 *   consegue enviar sem o browser pedir autorizacao primeiro (a mesma razao
 *   do `lerCorpo`, em `validacao.ts`);
 * - **descodificada a serio**: um ficheiro que diz ser JPEG e nao e, recusa-se;
 * - **limite de pixeis**, contra imagens pequenas em bytes que se expandem em
 *   gigabytes de memoria ao abrir;
 * - **rodada segundo o EXIF e depois sem metadados nenhuns**: uma fotografia
 *   de telemovel leva a localizacao GPS de onde foi tirada — muitas vezes a
 *   casa de quem a tirou — e o sitio publicava-a;
 * - **WebP, no maximo 2000 px de lado, qualidade 82**: a mesma qualidade do
 *   `next.config.js`, medida no hero (`docs/PERFORMANCE.md`);
 * - **o nome e o resumo SHA-256 do resultado**: nenhum nome escolhido por
 *   quem carrega chega ao disco (nada de `../`), a mesma fotografia duas
 *   vezes e um ficheiro so, e o conteudo de um nome nunca muda — por isso
 *   pode ficar em cache para sempre.
 */

export const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

/** O que chega do telemovel: 10 MB cobre uma fotografia de 48 megapixeis em JPEG. */
export const MAX_BYTES = 10 * 1024 * 1024;

/** 50 megapixeis: acima de qualquer telemovel atual, longe de uma bomba. */
const MAX_PIXEIS = 50_000_000;

const LADO_MAXIMO = 2000;
const QUALIDADE = 82;

export const NOME_IMAGEM = /^[a-f0-9]{64}\.webp$/;

export function pastaDasImagens(env: Record<string, string | undefined> = process.env): string {
  return path.resolve(env.IMAGENS_DIR || path.join(process.cwd(), 'dados', 'imagens'));
}

export type ResultadoImagem =
  | { ok: true; caminho: string; largura: number; altura: number }
  | { ok: false; motivo: 'nao-e-imagem' | 'demasiado-grande' };

/** Trata a fotografia e guarda-a. Devolve o caminho publico. */
export async function guardarImagem(bytes: Buffer, pasta = pastaDasImagens()): Promise<ResultadoImagem> {
  if (bytes.length > MAX_BYTES) return { ok: false, motivo: 'demasiado-grande' };

  let saida: { data: Buffer; info: OutputInfo };
  try {
    saida = await sharp(bytes, { limitInputPixels: MAX_PIXEIS, failOn: 'error' })
      .rotate()
      .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALIDADE })
      .toBuffer({ resolveWithObject: true });
  } catch (erro) {
    const texto = String((erro as Error)?.message ?? '');
    return { ok: false, motivo: /pixel limit/i.test(texto) ? 'demasiado-grande' : 'nao-e-imagem' };
  }

  const nome = `${createHash('sha256').update(saida.data).digest('hex')}.webp`;
  const destino = path.join(pasta, nome);
  await mkdir(pasta, { recursive: true });
  if (!(await existe(destino))) {
    // Escrever ao lado e mudar o nome: quem pedir a imagem a meio da escrita
    // ve a anterior (nenhuma) ou a inteira, nunca metade.
    const temporario = path.join(pasta, `.${nome}.${randomBytes(6).toString('hex')}`);
    await writeFile(temporario, saida.data);
    await rename(temporario, destino);
  }

  return { ok: true, caminho: `/imagens/${nome}`, largura: saida.info.width, altura: saida.info.height };
}

/** Le uma imagem guardada, ou `null`. So aceita nomes que `guardarImagem` daria. */
export async function lerImagem(nome: string, pasta = pastaDasImagens()): Promise<Buffer | null> {
  if (!NOME_IMAGEM.test(nome)) return null;
  try {
    return await readFile(path.join(pasta, nome));
  } catch {
    return null;
  }
}

async function existe(caminho: string): Promise<boolean> {
  try {
    await stat(caminho);
    return true;
  } catch {
    return false;
  }
}
