'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
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
    <div className="bg-white rounded-lg overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 group">
      <Link href={`/produto/${product.slug}`}>
        <div className="relative h-64 overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
          {product.featured && (
            <div className="absolute top-3 left-3 bg-[#d4af37] text-white text-xs font-semibold px-3 py-1 rounded-full">
              Destaque
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-[#2c2c2c] px-4 py-2 rounded-full font-semibold">
                Esgotado
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/produto/${product.slug}`}>
          <h3 className="text-lg font-serif text-[#4a1e5c] mb-2 line-clamp-2 group-hover:text-[#6b2d7f] transition-colors min-h-[3.5rem]">
            {product.name}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-[#6b6b6b] mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-2xl font-bold text-[#4a1e5c]">
              {product.price.toFixed(2)}€
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-xs text-orange-600 mt-1">
                Apenas {product.stock} em stock
              </p>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAdding}
            className={`p-3 rounded-full transition-all duration-300 ${
              product.stock === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : isAdding
                ? 'bg-green-500 text-white'
                : 'bg-[#4a1e5c] hover:bg-[#6b2d7f] text-white hover:scale-110'
            }`}
            aria-label="Adicionar ao carrinho"
          >
            {isAdding ? (
              <span className="text-xl">✓</span>
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}