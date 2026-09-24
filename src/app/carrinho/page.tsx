'use client';

import { useCart } from '@/contexts/CartContext';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import { botaoClasses } from '@/components/ui/Button';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash } from '@phosphor-icons/react';
import { INFORMACAO_COMPRA } from '@/lib/afirmacoes';
import { formatarPreco } from '@/lib/dinheiro';

export default function Carrinho() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main id="conteudo" className="min-h-screen bg-surface py-12">
          <div className="container-custom">
            <div className="mx-auto max-w-2xl py-16 text-center">
              <ShoppingBag className="mx-auto mb-6 h-16 w-16 text-ink-muted/50" aria-hidden />
              <h1 className="mb-4 font-serif text-3xl text-rose-700 md:text-4xl">
                Carrinho vazio
              </h1>
              <p className="mb-8 text-lg text-ink-muted">
                Ainda não adicionou nenhum produto ao carrinho
              </p>
              <Link href="/loja" className={botaoClasses()}>
                Ir às compras
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
      
      <main id="conteudo" className="min-h-screen bg-surface py-8 md:py-12">
        <div className="container-custom">
          {/* Breadcrumb */}
          <Link
            href="/loja"
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-rose-700 transition-smooth mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Continuar a Comprar
          </Link>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-serif text-rose-700 mb-8">
            Carrinho de Compras
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items do Carrinho */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="bg-surface-raised p-4 md:p-6 rounded-lg shadow-soft"
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
                        sizes="(min-width: 768px) 128px, 96px"
                        className="object-cover"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4 mb-2">
                        <Link
                          href={`/produto/${item.slug}`}
                          className="text-lg font-medium text-ink hover:text-rose-700 transition-smooth line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="p-2 hover:bg-danger-100 text-danger-700 rounded-lg transition-smooth flex-shrink-0"
                          aria-label="Remover item"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>

                      <p className="tabular mb-4 text-xl font-semibold text-rose-700">
                        {formatarPreco(item.priceCents)}
                      </p>

                      {/* Controles de Quantidade */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border border-line rounded-lg">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="p-2 hover:bg-surface-sunken transition-smooth"
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
                            className="p-2 hover:bg-surface-sunken transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {item.stock <= 5 && (
                          <p className="text-sm text-danger-700">
                            Apenas {item.stock} em stock
                          </p>
                        )}
                      </div>

                      {/* Subtotal por item */}
                      <p className="text-sm text-ink-muted mt-3">
                        Subtotal: <span className="font-semibold text-ink">{formatarPreco(item.priceCents * item.quantity)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botão Limpar Carrinho */}
              <button
                onClick={clearCart}
                className="text-sm text-danger-700 hover:text-danger-700 font-medium transition-smooth"
              >
                Limpar Carrinho
              </button>
            </div>

            {/* Resumo */}
            <div className="lg:col-span-1">
              <div className="bg-surface-raised p-6 rounded-lg shadow-soft sticky top-24">
                <h2 className="text-2xl font-serif text-rose-700 mb-6">
                  Resumo do Pedido
                </h2>

                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-base">
                    <span className="text-ink-muted">Subtotal</span>
                    <span className="font-medium text-ink">{formatarPreco(total)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-ink-muted">Envio</span>
                    <span className="text-sm text-ink-muted">Pelo peso, à parte</span>
                  </div>
                </div>

                {/* "Total" sem os portes era um total que nao o era. */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-ink">Total das peças</span>
                  <span className="tabular text-3xl font-semibold text-rose-700">{formatarPreco(total)}</span>
                </div>

                {/*
                  "Finalizar Compra" levava a /checkout, que nao existe: um 404
                  no botao principal do carrinho, no momento de mais intencao
                  de toda a loja. O checkout e da v2; ate la, diz-se a verdade
                  e leva-se a um sitio que existe.
                */}
                <p className="mb-4 text-sm text-ink-muted">
                  A loja online ainda não aceita encomendas. Se quiser alguma destas peças,
                  fale connosco.
                </p>
                <Link
                  href="/contacto"
                  className={botaoClasses({ fullWidth: true, className: 'mb-3' })}
                >
                  Falar connosco
                </Link>

                <Link
                  href="/loja"
                  className={botaoClasses({ variant: 'secondary', fullWidth: true })}
                >
                  Continuar a Comprar
                </Link>

                {/* Informações extras */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  {/* Texto em `src/lib/afirmacoes.ts`, sem promessas de prazo nem de pagamento. */}
                  {[INFORMACAO_COMPRA.envios, INFORMACAO_COMPRA.livreResolucao].map((i) => (
                    <div key={i.titulo} className="flex items-start gap-2 text-sm text-ink-muted">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-600" aria-hidden />
                      <span>
                        <span className="font-medium text-ink">{i.titulo}:</span> {i.detalhe}
                      </span>
                    </div>
                  ))}
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