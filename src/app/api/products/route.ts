// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Category, Product } from '@/lib/models';

type SortKey =
  | 'featured'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc'
  | 'newest';

const SORTS: Record<SortKey, Record<string, 1 | -1>> = {
  featured: { featured: -1, createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  'name-asc': { name: 1 },
  'name-desc': { name: -1 },
  newest: { createdAt: -1 },
};

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = (searchParams.get('sort') || 'featured') as SortKey;
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
      .sort(SORTS[sort] ?? SORTS.featured);

    const limit = Number(limitParam);
    if (Number.isInteger(limit) && limit > 0) {
      cursor = cursor.limit(Math.min(limit, 100));
    }

    const products = await cursor;

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}
