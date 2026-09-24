// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Category, Product } from '@/lib/models';
import { paraPublico } from '@/lib/catalogo';
import { LIMITES, travar } from '@/lib/limites';
import { resolveLimit, resolveSort } from '@/lib/products';

export async function GET(request: Request) {
  const bloqueio = travar(request, 'catalogo', LIMITES.leitura);
  if (bloqueio) return bloqueio;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');
    const limitParam = searchParams.get('limit');

    const query: Record<string, unknown> = { active: true };

    // A loja filtra por slug de categoria, a pagina de produto por _id.
    // Aceitamos os dois para nao obrigar o cliente a saber a diferenca.
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.categoryId = category;
      } else {
        const found = await Category.findOne({ slug: category }).select('_id');
        if (!found) {
          return NextResponse.json([]);
        }
        query.categoryId = found._id;
      }
    }

    let cursor = Product.find(query)
      .populate('categoryId', 'name slug')
      .sort(resolveSort(sort));

    const limit = resolveLimit(limitParam);
    if (limit !== null) {
      cursor = cursor.limit(limit);
    }

    const products = await cursor.lean();

    return NextResponse.json(products.map(paraPublico));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}
