'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';
import { useCart } from '@/contexts/CartContext';
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check, Dot, Minus, Plus, ShareNetwork, ShoppingCart, Sparkle, Truck } from '@phosphor-icons/react';
import { botaoClasses } from '@/components/ui/Button';
import { AnuncioEstado, Escolha, SemFotografia, Skeleton } from '@/components/ui';
import { temDeEscolher } from '@/lib/catalogo';
import { AVISO_TRADICAO, INFORMACAO_COMPRA } from '@/lib/afirmacoes';
import { formatarPreco } from '@/lib/dinheiro';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  images: string[];
  /** O total das medidas, somado pela API (`paraPublico`). */
  stock: number;
  variantes: { _id: string; medida?: string; stock: number }[];
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
  featured: boolean;
  weightGrams?: number;
  dimensions?: string;
  properties?: {
    chakra?: string;
    elemento?: string;
    signo?: string;
    beneficios?: string[];
    cuidados?: string[];
  };
}

export default function ProdutoPage() {
  const slug = useParams().slug as string;
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [medidaId, setMedidaId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [partilha, setPartilha] = useState('');

  /**
   * O botao estava la sem `onClick`: um controlo que nao fazia nada. A
   * partilha nativa abre o menu do sistema (no telemovel, e o que se espera);
   * onde nao existe, copia-se a ligacao e diz-se que se copiou.
   */
  const partilhar = async () => {
    const url = window.location.href;
    setPartilha('');
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {
        // Fechar o menu sem escolher tambem rejeita. Nao e um erro.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setPartilha('Ligação copiada.');
    } catch {
      setPartilha('Não foi possível copiar a ligação.');
    }
  };

  useEffect(() => {
    // O App Router remonta a pagina quando o slug muda (ha um teste em
    // `e2e/loja.spec.ts` que o confirma), por isso aqui nao ha corrida como na
    // `/loja`. A guarda fica pelo custo que tem: um pedido que responda depois
    // de a pessoa sair nao escreve num componente que ja nao existe.
    let actual = true;

    const relacionados = async (produto: Product & { categoryId?: { _id?: string } }) => {
      const categoria = produto.categoryId?._id;
      if (!categoria) return;
      try {
        const r = await fetch(`/api/products?category=${encodeURIComponent(categoria)}&limit=4`);
        if (!r.ok) return;
        const lista: Product[] = await r.json();
        if (actual) setRelatedProducts(lista.filter((p) => p._id !== produto._id));
      } catch (error) {
        console.error('Erro ao carregar produtos relacionados:', error);
      }
    };

    (async () => {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(slug)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!actual) return;
        setProduct(data);
        // Os relacionados nao atrasam o produto: vem depois, sem esperar.
        void relacionados(data);
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
      } finally {
        if (actual) setLoading(false);
      }
    })();

    return () => {
      actual = false;
    };
  }, [slug]);

  // Numa peca unica nao ha escolha: e a unica medida. Num anel, e a que a
  // pessoa escolheu, e nenhuma ate escolher — o servidor tambem nao escolhe.
  const escolher = product ? temDeEscolher(product.variantes) : false;
  const medida = product
    ? escolher
      ? product.variantes.find((v) => v._id === medidaId)
      : product.variantes[0]
    : undefined;
  const stockDisponivel = medida?.stock ?? 0;

  const handleAddToCart = () => {
    if (!product || !medida) return;
    
    setIsAdding(true);
    
    addItem({
      _id: product._id,
      varianteId: medida._id,
      ...(medida.medida ? { medida: medida.medida } : {}),
      name: product.name,
      slug: product.slug,
      priceCents: product.priceCents,
      image: product.images[0] || '',
      stock: medida.stock,
    }, quantity);

    setTimeout(() => setIsAdding(false), 1000);
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main id="conteudo" className="min-h-screen bg-surface py-12">
          <div className="container-custom">
            {/*
              Estes rectangulos eram `div`s com classes soltas repetidas —
              `animate-pulse`, `bg-surface-sunken rounded` — a duplicar o que
              o `Skeleton` ja faz. E nenhum era `aria-hidden`, por isso o
              leitor de ecra encontrava aqui caixas vazias em vez de silencio.
            */}
            <AnuncioEstado>A carregar o produto</AnuncioEstado>

            <Skeleton className="mb-8 h-8 w-48" />
            <div className="grid gap-8 md:grid-cols-2">
              <Skeleton className="h-96 rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-8" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-16" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main id="conteudo" className="min-h-screen bg-surface py-12">
          <div className="container-custom text-center">
            <h1 className="mb-6 text-5xl text-ink">
              Produto não encontrado
            </h1>
            <Link href="/loja" className={botaoClasses()}>
              Voltar à Loja
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentImage = product.images[currentImageIndex];

  return (
    <>
      <Header />
      
      <main id="conteudo" className="min-h-screen bg-surface pb-20 pt-6 md:pt-10">
        <div className="container-custom">
          <nav aria-label="Caminho" className="mb-8 flex flex-wrap items-center gap-2 font-mono text-xs text-ink-muted">
            <Link href="/" className="py-1 transition-smooth hover:text-rose-700">
              Início
            </Link>
            <span aria-hidden>/</span>
            <Link href="/loja" className="py-1 transition-smooth hover:text-rose-700">
              Loja
            </Link>
            <span aria-hidden>/</span>
            {product.categoryId && (
              <>
                <Link
                  href={`/loja?categoria=${product.categoryId.slug}`}
                  className="py-1 transition-smooth hover:text-rose-700"
                >
                  {product.categoryId.name}
                </Link>
                <span aria-hidden>/</span>
              </>
            )}
            <span aria-current="page" className="text-ink">
              {product.name}
            </span>
          </nav>

          <div className="mb-24 grid gap-10 md:grid-cols-12 md:gap-12">
            {/* A peca, na vitrine em arco da entrada. Nada escrito por cima. */}
            <div className="space-y-4 md:col-span-7">
              <div className="relative aspect-4/5 overflow-hidden rounded-b-lg rounded-t-full bg-surface-sunken">
                {currentImage ? (
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 58vw, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <SemFotografia />
                )}

                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full text-ink shadow-soft transition-smooth hover:bg-surface"
                      aria-label="Imagem anterior"
                    >
                      <CaretLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full text-ink shadow-soft transition-smooth hover:bg-surface"
                      aria-label="Próxima imagem"
                    >
                      <CaretRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Ver a imagem ${index + 1}`}
                      aria-pressed={currentImageIndex === index}
                      className={`relative aspect-square overflow-hidden rounded border-2 transition-smooth ${
                        currentImageIndex === index ? 'border-rose-700' : 'border-transparent hover:border-line'
                      }`}
                    >
                      <Image src={image} alt={`${product.name} - ${index + 1}`} fill sizes="96px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* A etiqueta: fica a vista enquanto a fotografia corre. */}
            <div className="md:col-span-5">
              <div className="md:sticky md:top-28">
                {product.categoryId && (
                  <Link
                    href={`/loja?categoria=${product.categoryId.slug}`}
                    className="inline-block py-1 font-mono text-xs text-ink-muted transition-smooth hover:text-rose-700"
                  >
                    {product.categoryId.name}
                  </Link>
                )}
                <h1 className="mt-2 pb-1 text-5xl leading-[1.05] text-ink lg:text-6xl lg:leading-none">{product.name}</h1>

                <div className="mt-6 flex items-baseline gap-4">
                  <span className="tabular text-3xl font-semibold text-ink">{formatarPreco(product.priceCents)}</span>
                  {product.stock > 0 ? (
                    <span className="text-sm font-medium text-sage-600">Em Stock</span>
                  ) : (
                    <span className="text-sm font-medium text-danger-700">Esgotado</span>
                  )}
                </div>

                {product.description && (
                  <p className="mt-6 max-w-[55ch] text-base leading-relaxed text-ink">{product.description}</p>
                )}

                {/*
                  A ficha da peca: so o que o painel gravou. Um campo que nao
                  existe nao aparece, e nada aqui se inventa.
                */}
                {(product.weightGrams || product.dimensions) && (
                  <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
                    {[
                      product.categoryId ? { t: 'Família', v: product.categoryId.name } : null,
                      product.weightGrams
                        ? {
                            t: 'Peso',
                            v:
                              product.weightGrams >= 1000
                                ? `${(product.weightGrams / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} kg`
                                : `${product.weightGrams} g`,
                          }
                        : null,
                      product.dimensions ? { t: 'Dimensões', v: product.dimensions } : null,
                    ]
                      .filter((x): x is { t: string; v: string } => x !== null)
                      .map(({ t, v }) => (
                        // Um numero impar de dados: o ultimo ocupa a linha toda, e nao fica uma celula vazia.
                        <div key={t} className="bg-surface-raised p-4 last:odd:col-span-2">
                          <dt className="text-xs text-ink-muted">{t}</dt>
                          <dd className="mt-1 font-mono text-sm text-ink">{v}</dd>
                        </div>
                      ))}
                  </dl>
                )}

                {product.properties && (product.properties.chakra || product.properties.elemento || product.properties.signo) && (
                  <dl className="mt-6 space-y-1 text-sm">
                    {[
                      ['Chakra', product.properties.chakra],
                      ['Elemento', product.properties.elemento],
                      ['Signo', product.properties.signo],
                    ]
                      .filter(([, v]) => v)
                      .map(([t, v]) => (
                        <div key={t} className="flex gap-2">
                          <dt className="font-medium text-rose-700">{t}:</dt>
                          <dd className="text-ink">{v}</dd>
                        </div>
                      ))}
                  </dl>
                )}

              {/* Quantidade e Add to Cart */}
              <div className="mb-6 mt-8 space-y-4">
                {escolher && (
                  <Escolha
                    legenda="Medida"
                    nome="medida"
                    valor={medidaId}
                    onChange={(v) => {
                      setMedidaId(v);
                      setQuantity(1);
                    }}
                    opcoes={product.variantes.map((v) => ({
                      valor: v._id,
                      etiqueta: v.medida ?? '',
                      indisponivel: v.stock === 0,
                    }))}
                  />
                )}

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-ink">Quantidade:</span>
                  <div className="flex items-center gap-2 border-2 border-line rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-surface-sunken transition-smooth"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-medium w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(stockDisponivel, quantity + 1))}
                      disabled={!medida || quantity >= stockDisponivel}
                      className="p-3 hover:bg-surface-sunken transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!medida || stockDisponivel === 0 || isAdding}
                    className={botaoClasses({ className: 'flex-1' })}
                  >
                    {isAdding ? (
                      <>
                        <Check className="h-5 w-5" aria-hidden />
                        <span>Adicionado</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>{escolher && !medida ? 'Escolha a medida' : 'Adicionar ao Carrinho'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={partilhar}
                    className="rounded border border-line p-4 text-ink-muted transition-smooth hover:border-rose-700 hover:text-rose-700"
                    aria-label="Partilhar"
                  >
                    <ShareNetwork className="w-5 h-5" aria-hidden />
                  </button>
                </div>
                <p role="status" className="mt-2 min-h-5 text-sm text-ink-muted">
                  {partilha}
                </p>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-3 border-t border-line pt-6">
                {/*
                  Texto em `src/lib/afirmacoes.ts`. Aqui prometia-se entrega em
                  2-3 dias uteis e "certificado de autenticidade incluido", sem
                  nenhum dos dois decidido.
                */}
                {[
                  { Icone: Truck, ...INFORMACAO_COMPRA.envios },
                  { Icone: ArrowCounterClockwise, ...INFORMACAO_COMPRA.livreResolucao },
                ].map(({ Icone, titulo, detalhe }) => (
                  <div key={titulo} className="flex items-start gap-3">
                    <Icone className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" aria-hidden />
                    <div>
                      <p className="font-medium text-ink">{titulo}</p>
                      <p className="text-sm text-ink-muted">{detalhe}</p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>

          {/* Benefícios e Cuidados */}
          {product.properties && (product.properties.beneficios || product.properties.cuidados) && (
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {product.properties.beneficios && product.properties.beneficios.length > 0 && (
                <div className="rounded-lg border border-line bg-surface-raised p-6 md:p-8">
                  <h3 className="mb-4 font-serif text-3xl text-ink">
                    Segundo a tradição
                  </h3>
                  <ul className="space-y-2">
                    {product.properties.beneficios.map((beneficio, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Sparkle className="mt-1 h-3.5 w-3.5 shrink-0 text-rose-700" aria-hidden />
                        <span className="text-ink">{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                  {/*
                    Junto das propriedades, e nao numa pagina a parte: um aviso
                    que ninguem le nao tira uma alegacao de saude do terreno da
                    publicidade enganosa.
                  */}
                  <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">
                    {AVISO_TRADICAO}
                  </p>
                </div>
              )}

              {product.properties.cuidados && product.properties.cuidados.length > 0 && (
                <div className="rounded-lg border border-line bg-surface-raised p-6 md:p-8">
                  <h3 className="mb-4 font-serif text-3xl text-ink">
                    Cuidados
                  </h3>
                  <ul className="space-y-2">
                    {product.properties.cuidados.map((cuidado, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Dot className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden />
                        <span className="text-ink">{cuidado}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Produtos Relacionados */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="mb-10 text-4xl text-ink md:text-5xl">Da mesma família</h2>
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <ProductCard key={relatedProduct._id} product={relatedProduct} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}