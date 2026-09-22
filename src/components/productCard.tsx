'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ShoppingCart } from '@phosphor-icons/react';
import { useCart } from '../contexts/CartContext';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  images: string[];
  stock: number;
  featured: boolean;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const cartItem = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0] || '',
      stock: product.stock,
    };

    addItem(cartItem, 1);

    setTimeout(() => setIsAdding(false), 1000);
  };

  const imageUrl = !imageError && product.images && product.images.length > 0
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&h=600&fit=crop';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface-raised transition-smooth hover:border-rose-300">
      <Link href={`/produto/${product.slug}`} className="block shrink-0">
        <div className="relative h-64 overflow-hidden bg-surface-sunken">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            onError={() => setImageError(true)}
          />
          {product.featured && (
            <div className="absolute left-3 top-3 rounded-sm bg-rose-200 px-2.5 py-1 text-xs font-medium text-rose-900">
              Destaque
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-plum/60">
              <span className="rounded-sm bg-surface px-3 py-1.5 text-sm font-medium text-ink">
                Esgotado
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/produto/${product.slug}`}>
          <h3 className="mb-2 line-clamp-2 font-serif text-lg leading-snug text-ink transition-smooth group-hover:text-rose-700">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="mb-3 line-clamp-2 text-sm text-ink-muted">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <span className="tabular text-2xl font-semibold text-rose-700">
              {product.price.toFixed(2)}€
            </span>
            <p className="mt-1 min-h-[1rem] text-xs text-danger-700">
              {product.stock > 0 && product.stock <= 5
                ? `Apenas ${product.stock} em stock`
                : ''}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdding}
            className={`rounded p-3 transition-smooth ${
              product.stock === 0
                ? 'cursor-not-allowed bg-line text-ink-muted'
                : isAdding
                ? 'bg-sage-600 text-surface'
                : 'bg-rose-700 text-surface hover:bg-rose-600'
            }`}
            aria-label="Adicionar ao carrinho"
          >
            {isAdding ? (
              <Check className="h-5 w-5" aria-hidden />
            ) : (
              <ShoppingCart className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}