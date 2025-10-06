'use client';

import { useCart } from '../contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

export default function CartPreview() {
  const { items, total, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  // Bloquear scroll quando carrinho está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-strong flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#4a1e5c]" />
            <h2 className="text-lg font-semibold text-[#2c2c2c]">
              Carrinho ({items.length})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-smooth"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg text-[#6b6b6b] mb-2">
                Carrinho vazio
              </p>
              <p className="text-sm text-[#6b6b6b] mb-6">
                Adicione produtos para começar
              </p>
              <Link
                href="/loja"
                onClick={closeCart}
                className="btn-primary text-sm"
              >
                Ir às Compras
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="flex gap-3 p-3 bg-[#faf8f5] rounded-lg"
                >
                  {/* Imagem */}
                  <Link
                    href={`/produto/${item.slug}`}
                    onClick={closeCart}
                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produto/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-[#2c2c2c] hover:text-[#4a1e5c] line-clamp-2 transition-smooth"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm font-semibold text-[#4a1e5c] mt-1">
                      {item.price.toFixed(2)}€
                    </p>

                    {/* Quantidade */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded transition-smooth"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 hover:bg-white rounded transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="ml-auto p-1 hover:bg-red-50 text-red-600 rounded transition-smooth"
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-[#2c2c2c]">
                Total:
              </span>
              <span className="text-2xl font-bold text-[#4a1e5c]">
                {total.toFixed(2)}€
              </span>
            </div>

            {/* Botões */}
            <div className="space-y-2">
              <Link
                href="/carrinho"
                onClick={closeCart}
                className="btn-primary w-full text-center"
              >
                Ver Carrinho
              </Link>
              <Link
                href="/loja"
                onClick={closeCart}
                className="btn-secondary w-full text-center"
              >
                Continuar a Comprar
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}