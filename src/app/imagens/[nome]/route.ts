import { lerImagem } from '@/lib/imagens';

/**
 * As fotografias carregadas pelo painel (`lib/imagens.ts`). O nome e o resumo
 * do conteudo, por isso o que esta num endereco nunca muda: pode ficar em
 * cache um ano. Qualquer outro nome e 404, sem ler o disco.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params;
  const imagem = await lerImagem(nome);
  if (!imagem) return new Response('Não encontrada.', { status: 404 });

  return new Response(new Uint8Array(imagem), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
