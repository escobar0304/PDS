'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';
import { useCart } from '@/contexts/CartContext';
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check, Dot, Heart, Minus, Plus, ShareNetwork, Shield, ShoppingCart, Sparkle, Truck } from '@phosphor-icons/react';
import { botaoClasses } from '@/components/ui/Button';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  images: string[];
  stock: number;
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
  featured: boolean;
  weight?: number;
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
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        
        // Buscar produtos relacionados da mesma categoria
        if (data.categoryId?._id) {
          fetchRelatedProducts(data.categoryId._id, data._id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId: string, currentProductId: string) => {
    try {
      const response = await fetch(`/api/products?category=${categoryId}&limit=4`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar o produto atual
        setRelatedProducts(data.filter((p: Product) => p._id !== currentProductId));
      }
    } catch (error) {
      console.error('Erro ao carregar produtos relacionados:', error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    setIsAdding(true);
    
    addItem({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0] || '',
      stock: product.stock,
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
        <main className="min-h-screen bg-surface py-12">
          <div className="container-custom">
            <div className="animate-pulse">
              <div className="h-8 bg-surface-sunken rounded w-48 mb-8"></div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-surface-sunken h-96 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-surface-sunken rounded"></div>
                  <div className="h-4 bg-surface-sunken rounded w-3/4"></div>
                  <div className="h-16 bg-surface-sunken rounded"></div>
                </div>
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
        <main className="min-h-screen bg-surface py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-serif text-rose-700 mb-4">
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

  const currentImage = product.images[currentImageIndex] || 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=800&fit=crop';

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-surface py-8 md:py-12">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-ink-muted mb-8">
            <Link href="/" className="hover:text-rose-700 transition-smooth">
              Início
            </Link>
            <span>/</span>
            <Link href="/loja" className="hover:text-rose-700 transition-smooth">
              Loja
            </Link>
            <span>/</span>
            {product.categoryId && (
              <>
                <Link 
                  href={`/loja?categoria=${product.categoryId.slug}`}
                  className="hover:text-rose-700 transition-smooth"
                >
                  {product.categoryId.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-ink">{product.name}</span>
          </nav>

          {/* Produto */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-16">
            {/* Galeria de Imagens */}
            <div className="space-y-4">
              {/* Imagem Principal */}
              <div className="relative bg-surface-raised rounded-lg overflow-hidden shadow-soft aspect-square">
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
                
                {product.featured && (
                  <div className="absolute left-4 top-4 rounded-sm bg-rose-200 px-3 py-1.5 text-sm font-medium text-rose-900">
                    Destaque
                  </div>
                )}

                {/* Navegação de Imagens */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-2 text-ink shadow-soft transition-smooth hover:bg-surface"
                      aria-label="Imagem anterior"
                    >
                      <CaretLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-2 text-ink shadow-soft transition-smooth hover:bg-surface"
                      aria-label="Próxima imagem"
                    >
                      <CaretRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-smooth ${
                        currentImageIndex === index
                          ? 'border-rose-700'
                          : 'border-transparent hover:border-line'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-rose-700 mb-4">
                {product.name}
              </h1>

              {product.categoryId && (
                <Link
                  href={`/loja?categoria=${product.categoryId.slug}`}
                  className="inline-block text-sm text-ink-muted hover:text-rose-700 transition-smooth mb-4"
                >
                  {product.categoryId.name}
                </Link>
              )}

              <div className="flex items-baseline gap-4 mb-6">
                <span className="tabular text-4xl font-semibold text-rose-700">
                  {product.price.toFixed(2)}€
                </span>
                {product.stock > 0 ? (
                  <span className="text-sm font-medium text-sage-600">
                    Em Stock
                  </span>
                ) : (
                  <span className="text-sm font-medium text-danger-700">
                    Esgotado
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-base text-ink leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              {/* Propriedades Especiais */}
              {product.properties && (
                <div className="bg-surface-sunken p-4 rounded-lg mb-6 space-y-2">
                  {product.properties.chakra && (
                    <div className="flex items-start gap-2">
                      <span className="text-rose-700 font-medium">Chakra:</span>
                      <span className="text-ink">{product.properties.chakra}</span>
                    </div>
                  )}
                  {product.properties.elemento && (
                    <div className="flex items-start gap-2">
                      <span className="text-rose-700 font-medium">Elemento:</span>
                      <span className="text-ink">{product.properties.elemento}</span>
                    </div>
                  )}
                  {product.properties.signo && (
                    <div className="flex items-start gap-2">
                      <span className="text-rose-700 font-medium">Signo:</span>
                      <span className="text-ink">{product.properties.signo}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantidade e Add to Cart */}
              <div className="space-y-4 mb-6">
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
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
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
                    disabled={product.stock === 0 || isAdding}
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
                        <span>Adicionar ao Carrinho</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`rounded border p-4 transition-smooth ${
                      isFavorite
                        ? 'border-rose-700 bg-rose-100 text-rose-700'
                        : 'border-line text-ink-muted hover:border-rose-700 hover:text-rose-700'
                    }`}
                    aria-label="Adicionar aos favoritos"
                  >
                    <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    className="rounded border border-line p-4 text-ink-muted transition-smooth hover:border-rose-700 hover:text-rose-700"
                    aria-label="Partilhar"
                  >
                    <ShareNetwork className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Envio Rápido</p>
                    <p className="text-sm text-ink-muted">Entrega em 2-3 dias úteis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowCounterClockwise className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Devoluções</p>
                    <p className="text-sm text-ink-muted">14 dias para devolução</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">Garantia de Autenticidade</p>
                    <p className="text-sm text-ink-muted">Certificado de autenticidade incluído</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefícios e Cuidados */}
          {product.properties && (product.properties.beneficios || product.properties.cuidados) && (
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {product.properties.beneficios && product.properties.beneficios.length > 0 && (
                <div className="bg-surface-raised p-6 md:p-8 rounded-lg shadow-soft">
                  <h3 className="text-2xl font-serif text-rose-700 mb-4">
                    Benefícios Energéticos
                  </h3>
                  <ul className="space-y-2">
                    {product.properties.beneficios.map((beneficio, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Sparkle className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-rose-700" aria-hidden />
                        <span className="text-ink">{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.properties.cuidados && product.properties.cuidados.length > 0 && (
                <div className="bg-surface-raised p-6 md:p-8 rounded-lg shadow-soft">
                  <h3 className="text-2xl font-serif text-rose-700 mb-4">
                    Cuidados
                  </h3>
                  <ul className="space-y-2">
                    {product.properties.cuidados.map((cuidado, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Dot className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
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
              <h2 className="text-3xl font-serif text-rose-700 mb-8">
                Produtos Relacionados
              </h2>
              <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
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