'use client';

import { useCart } from '@/contexts/CartContext';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function Carrinho() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#faf8f5] py-12">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto text-center py-16">
              <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-6" />
              <h1 className="text-3xl md:text-4xl font-serif text-[#4a1e5c] mb-4">
                Carrinho Vazio
              </h1>
              <p className="text-lg text-[#6b6b6b] mb-8">
                Ainda não adicionou nenhum produto ao carrinho
              </p>
              <Link href="/loja" className="btn-primary inline-block">
                Ir às Compras
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#faf8f5] py-8 md:py-12">
        <div className="container-custom">
          {/* Breadcrumb */}
          <Link
            href="/loja"
            className="inline-flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#4a1e5c] transition-smooth mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar a Comprar
          </Link>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-serif text-[#4a1e5c] mb-8">
            Carrinho de Compras
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items do Carrinho */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="bg-white p-4 md:p-6 rounded-lg shadow-soft"
                >
                  <div className="flex gap-4">
                    {/* Imagem */}
                    <Link
                      href={`/produto/${item.slug}`}
                      className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={item.image || '/images/placeholder.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4 mb-2">
                        <Link
                          href={`/produto/${item.slug}`}
                          className="text-lg font-medium text-[#2c2c2c] hover:text-[#4a1e5c] transition-smooth line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-smooth flex-shrink-0"
                          aria-label="Remover item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <p className="text-xl font-bold text-[#4a1e5c] mb-4">
                        {item.price.toFixed(2)}€
                      </p>

                      {/* Controles de Quantidade */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-smooth"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="text-lg font-medium w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-2 hover:bg-gray-100 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {item.stock <= 5 && (
                          <p className="text-sm text-orange-600">
                            Apenas {item.stock} em stock
                          </p>
                        )}
                      </div>

                      {/* Subtotal por item */}
                      <p className="text-sm text-[#6b6b6b] mt-3">
                        Subtotal: <span className="font-semibold text-[#2c2c2c]">{(item.price * item.quantity).toFixed(2)}€</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botão Limpar Carrinho */}
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-smooth"
              >
                Limpar Carrinho
              </button>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-soft sticky top-24">
                <h2 className="text-2xl font-serif text-[#4a1e5c] mb-6">
                  Resumo do Pedido
                </h2>

                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-base">
                    <span className="text-[#6b6b6b]">Subtotal</span>
                    <span className="font-medium text-[#2c2c2c]">{total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-[#6b6b6b]">Envio</span>
                    <span className="text-sm text-[#6b6b6b]">Calculado no checkout</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-[#2c2c2c]">Total</span>
                  <span className="text-3xl font-bold text-[#4a1e5c]">{total.toFixed(2)}€</span>
                </div>

                <Link
                  href="/checkout"
                  className="btn-primary w-full text-center mb-3"
                >
                  Finalizar Compra
                </Link>

                <Link
                  href="/loja"
                  className="btn-secondary w-full text-center"
                >
                  Continuar a Comprar
                </Link>

                {/* Informações extras */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-start gap-2 text-sm text-[#6b6b6b]">
                    <span>✓</span>
                    <span>Pagamento seguro</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-[#6b6b6b]">
                    <span>✓</span>
                    <span>Envio em 2-3 dias úteis</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-[#6b6b6b]">
                    <span>✓</span>
                    <span>14 dias para devolução</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}