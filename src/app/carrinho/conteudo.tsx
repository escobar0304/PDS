'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Alert, SemFotografia } from '@/components/ui';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import { botaoClasses } from '@/components/ui/Button';
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Trash } from '@phosphor-icons/react';
import { INFORMACAO_COMPRA } from '@/lib/afirmacoes';
import { formatarPreco } from '@/lib/dinheiro';
import { chaveDe } from '@/lib/cart';

type Desistencia = { id: string; chave: string };

/**
 * Quem volta atras na pagina da Stripe chega aqui com a encomenda e a chave:
 * cancela-se ja, e o stock volta, em vez de ficar preso ate a reserva
 * expirar. A chave sai do endereco logo a seguir, para nao ficar no
 * historico nem ir parar a quem copie a ligacao.
 */
function useDesistencia(desistencia: Desistencia | null) {
  const router = useRouter();
  const [aviso, setAviso] = useState<{ tone: 'sucesso' | 'info' | 'erro'; texto: string } | null>(null);
  const feito = useRef(false);

  useEffect(() => {
    if (!desistencia || feito.current) return;
    feito.current = true;
    router.replace('/carrinho', { scroll: false });
    fetch(`/api/encomendas/${desistencia.id}/desistir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: desistencia.chave }),
    })
      .then(async (r) => {
        const corpo = (await r.json().catch(() => ({}))) as { motivo?: string };
        if (r.ok) {
          setAviso({ tone: 'sucesso', texto: 'Voltou atrás no pagamento: a encomenda foi cancelada, e nada foi cobrado. O carrinho continua como estava.' });
        } else if (corpo.motivo === 'ja-pago') {
          setAviso({ tone: 'info', texto: 'Essa encomenda já está paga. Vai receber a confirmação por email.' });
        } else if (r.status !== 409 && r.status !== 404) {
          // 409: ja nao esta por pagar, nada a fazer. 404: a ligacao nao e de
          // encomenda nenhuma — quem a tem legitima nunca aqui chega.
          setAviso({ tone: 'erro', texto: 'Não foi possível cancelar a encomenda que ficou por pagar. Se não a pagar, cancela-se sozinha em menos de uma hora.' });
        }
      })
      .catch(() =>
        setAviso({ tone: 'erro', texto: 'Sem ligação. A encomenda que ficou por pagar cancela-se sozinha em menos de uma hora.' })
      );
  }, [desistencia, router]);

  return aviso;
}

export default function Carrinho({
  aberta,
  desistencia,
}: {
  /** Se a loja aceita encomendas (`lib/loja.ts`), decidido no servidor. */
  aberta: boolean;
  desistencia: Desistencia | null;
}) {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const aviso = useDesistencia(desistencia);
  const avisoDesistencia = aviso && (
    <Alert tone={aviso.tone} className="mb-6">
      {aviso.texto}
    </Alert>
  );

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main id="conteudo" className="min-h-screen bg-surface py-12">
          <div className="container-custom">
            {avisoDesistencia}
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

          {avisoDesistencia}

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-serif text-rose-700 mb-8">
            Carrinho de Compras
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items do Carrinho */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={chaveDe(item)}
                  className="bg-surface-raised p-4 md:p-6 rounded-lg shadow-soft"
                >
                  <div className="flex gap-4">
                    {/* Imagem */}
                    <Link
                      href={`/produto/${item.slug}`}
                      aria-label={item.name}
                      className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden"
                    >
                      {/* `/images/placeholder.jpg` nunca existiu: uma peca sem fotografia
                          dava um 404 e um erro do otimizador de imagens em cada carrinho. */}
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="(min-width: 768px) 128px, 96px" className="object-cover" />
                      ) : (
                        <SemFotografia />
                      )}
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
                          onClick={() => removeItem(chaveDe(item))}
                          className="p-2 hover:bg-danger-100 text-danger-700 rounded-lg transition-smooth flex-shrink-0"
                          aria-label="Remover item"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>

                      {item.medida && (
                        <p className="-mt-1 mb-2 text-sm text-ink-muted">Medida {item.medida}</p>
                      )}

                      <p className="tabular mb-4 text-xl font-semibold text-rose-700">
                        {formatarPreco(item.priceCents)}
                      </p>

                      {/* Controles de Quantidade */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border border-line rounded-lg">
                          <button
                            onClick={() => updateQuantity(chaveDe(item), item.quantity - 1)}
                            className="p-2 hover:bg-surface-sunken transition-smooth"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="text-lg font-medium w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(chaveDe(item), item.quantity + 1)}
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

                {aberta ? (
                  <>
                    <p className="mb-4 text-sm text-ink-muted">
                      Os portes calculam-se no passo seguinte, antes de encomendar.
                    </p>
                    <Link
                      href="/checkout"
                      className={botaoClasses({ fullWidth: true, className: 'mb-3' })}
                    >
                      Finalizar encomenda
                    </Link>
                  </>
                ) : (
                  <>
                    {/*
                      Com a loja fechada, /checkout nao existe (404): leva-se a
                      um sitio que existe, e diz-se a verdade.
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
                  </>
                )}

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