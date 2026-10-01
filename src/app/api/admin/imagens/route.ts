import { NextResponse } from 'next/server';
import { exigirAdmin } from '@/lib/autorizacao';
import { MAX_BYTES, TIPOS, guardarImagem } from '@/lib/imagens';
import { LIMITES, travar } from '@/lib/limites';
import { registarErro } from '@/lib/registo';

/**
 * Carrega uma fotografia. O corpo e a propria imagem, com o tipo no
 * cabecalho (`image/jpeg`, ...), e nao um formulario `multipart`: um
 * formulario de outro sitio consegue enviar `multipart`, mas nao um tipo de
 * imagem sem o browser pedir autorizacao primeiro, que este sitio nunca da.
 * O tratamento esta em `lib/imagens.ts`.
 */
export async function POST(request: Request) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const tipo = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!(TIPOS as readonly string[]).includes(tipo)) {
    return NextResponse.json({ error: 'Só fotografias em JPEG, PNG, WebP ou AVIF.' }, { status: 415 });
  }

  const declarado = Number(request.headers.get('content-length') ?? '0');
  if (declarado > MAX_BYTES) return demasiadoGrande();

  const bytes = await lerAte(request, MAX_BYTES);
  if (bytes === 'demasiado-grande') return demasiadoGrande();
  if (bytes.length === 0) return NextResponse.json({ error: 'A fotografia está vazia.' }, { status: 400 });

  try {
    const r = await guardarImagem(bytes);
    if (!r.ok) {
      return r.motivo === 'demasiado-grande'
        ? demasiadoGrande()
        : NextResponse.json({ error: 'O ficheiro não é uma fotografia que se consiga abrir.' }, { status: 400 });
    }
    return NextResponse.json({ caminho: r.caminho, largura: r.largura, altura: r.altura }, { status: 201 });
  } catch (erro) {
    registarErro('Admin: erro ao guardar fotografia:', erro);
    return NextResponse.json({ error: 'Erro ao guardar a fotografia.' }, { status: 500 });
  }
}

function demasiadoGrande() {
  return NextResponse.json({ error: 'A fotografia tem mais de 10 MB, ou demasiados pixeis.' }, { status: 413 });
}

/** Le o corpo, mas para assim que passar do limite: nao confia no Content-Length. */
async function lerAte(request: Request, limite: number): Promise<Buffer | 'demasiado-grande'> {
  if (!request.body) return Buffer.alloc(0);
  const partes: Uint8Array[] = [];
  let total = 0;
  const leitor = request.body.getReader();
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      await leitor.cancel();
      return 'demasiado-grande';
    }
    partes.push(value);
  }
  return Buffer.concat(partes);
}
