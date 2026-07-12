import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product, Category } from '@/lib/models';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'featured';
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '0');

    const query: Record<string, unknown> = { active: true };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) query.categoryId = cat._id;
    }

    if (search) {
      // Escape regex special chars to prevent ReDoS
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: escaped, $options: 'i' };
    }

    if (featured === 'true') {
      query.featured = true;
    }

    let sortOption: Record<string, 1 | -1> = { featured: -1, createdAt: -1 };
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'name-asc':
        sortOption = { name: 1 };
        break;
      case 'name-desc':
        sortOption = { name: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
    }

    let q = Product.find(query).populate('categoryId', 'name slug').sort(sortOption);
    if (limit > 0) q = q.limit(limit);

    const products = await q.lean();

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}
