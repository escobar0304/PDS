// src/app/api/products/[slug]/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product } from '@/lib/models';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    
    const { slug } = params;
    
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