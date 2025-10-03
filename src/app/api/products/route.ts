// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Product, Category } from '../../../lib/models';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const sort = searchParams.get('sort') || 'featured';
    
    // Query base - apenas produtos ativos
    const query: Record<string, unknown> = { active: true };
    
    // Filtrar por categoria se fornecido
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (category) {
        query.categoryId = category._id;
      }
    }
    
    // Construir query
    let productsQuery = Product.find(query).populate('categoryId', 'name slug');
    
    // Ordenação
    switch (sort) {
      case 'price-asc':
        productsQuery = productsQuery.sort({ price: 1 });
        break;
      case 'price-desc':
        productsQuery = productsQuery.sort({ price: -1 });
        break;
      case 'name-asc':
        productsQuery = productsQuery.sort({ name: 1 });
        break;
      case 'name-desc':
        productsQuery = productsQuery.sort({ name: -1 });
        break;
      case 'newest':
        productsQuery = productsQuery.sort({ createdAt: -1 });
        break;
      case 'featured':
      default:
        productsQuery = productsQuery.sort({ featured: -1, createdAt: -1 });
        break;
    }
    
    const products = await productsQuery;
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      images,
      stock,
      categoryId,
      featured,
      weight,
      dimensions,
      properties
    } = body;

    // Validação básica
    if (!name || !slug || !price || !categoryId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, slug, price, categoryId' },
        { status: 400 }
      );
    }

    // Verificar se categoria existe
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se slug já existe
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Produto com este slug já existe' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      images: images || [],
      stock: stock || 0,
      categoryId,
      featured: featured || false,
      weight,
      dimensions,
      properties
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}