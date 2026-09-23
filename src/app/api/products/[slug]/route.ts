// src/app/api/products/[slug]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product } from '@/lib/models';

/**
 * No Next 15 o `params` de uma rota dinamica passou a ser uma Promise.
 *
 * Nao e cosmetica: o `tsc` sozinho nao apanha isto, porque a rota declara o
 * seu proprio tipo inline e nada o confronta com o que o Next espera. Quem
 * valida a assinatura e o `next build`, que gera os tipos das rotas — foi la
 * que isto rebentou, com o typecheck limpo.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    
    const product = await Product.findOne({ slug, active: true })
      .populate('categoryId', 'name slug');
    
    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}