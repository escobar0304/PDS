'use client';

import { useCart } from '../contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { SemFotografia } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';
import { Minus, Plus, ShoppingBag, Trash, X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { formatarPreco } from '@/lib/dinheiro';
import { chaveDe } from '@/lib/cart';

export default function CartPreview() {
  const { items, total, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  const fecharRef = useRef<HTMLButtonElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  // Bloquear o scroll da pagina enquanto o painel esta aberto.
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

  // O painel e um dialogo modal: recebe o foco ao abrir, devolve-o ao fechar
  // e fecha com Escape. Sem isto quem navega por teclado fica preso atras dele.
  useEffect(() => {
    if (!isOpen) return;

    focoAnterior.current = document.activeElement as HTMLElement | null;
    fecharRef.current?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      focoAnterior.current?.focus();
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-plum/60 transition-opacity"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-carrinho"
        className="animate-slide-in fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-surface-raised shadow-strong sm:w-96"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-700" />
            <h2 id="titulo-carrinho" className="text-lg font-semibold text-ink">
              Carrinho ({items.length})
            </h2>
          </div>
          <button
            ref={fecharRef}
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 transition-smooth hover:bg-surface-sunken"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="mb-4 h-16 w-16 text-ink-muted/50" aria-hidden />
              <p className="text-lg text-ink-muted mb-2">
                Carrinho vazio
              </p>
              <p className="text-sm text-ink-muted mb-6">
                Adicione produtos para começar
              </p>
              <Link
                href="/loja"
                onClick={closeCart}
                className={botaoClasses({ size: 'sm' })}
              >
                Ir às Compras
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={chaveDe(item)}
                  className="flex gap-3 p-3 bg-surface rounded-lg"
                >
                  {/* Imagem */}
                  <Link
                    href={`/produto/${item.slug}`}
                    onClick={closeCart}
                    aria-label={item.name}
                    className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden"
                  >
                    {/* `/images/placeholder.jpg` nunca existiu: uma peca sem fotografia
                        dava um 404 e um erro do otimizador de imagens em cada carrinho. */}
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <SemFotografia />
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produto/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-ink hover:text-rose-700 line-clamp-2 transition-smooth"
                    >
                      {item.name}
                    </Link>
                    {item.medida && (
                      <p className="text-xs text-ink-muted">Medida {item.medida}</p>
                    )}
                    <p className="tabular mt-1 text-sm font-semibold text-rose-700">
                      {formatarPreco(item.priceCents)}
                    </p>

                    {/* Quantidade */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(chaveDe(item), item.quantity - 1)}
                        className="p-1 hover:bg-surface-raised rounded transition-smooth"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(chaveDe(item), item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 hover:bg-surface-raised rounded transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(chaveDe(item))}
                        className="ml-auto p-1 hover:bg-danger-100 text-danger-700 rounded transition-smooth"
                        aria-label="Remover item"
                      >
                        <Trash className="w-4 h-4" />
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
              <span className="text-base font-medium text-ink">
                Total:
              </span>
              <span className="tabular text-2xl font-semibold text-rose-700">
                {formatarPreco(total)}
              </span>
            </div>

            {/* Botões */}
            <div className="space-y-2">
              <Link
                href="/carrinho"
                onClick={closeCart}
                className={botaoClasses({ fullWidth: true })}
              >
                Ver Carrinho
              </Link>
              <Link
                href="/loja"
                onClick={closeCart}
                className={botaoClasses({ variant: 'secondary', fullWidth: true })}
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