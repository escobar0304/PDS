'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';
import { useCart } from '@/contexts/CartContext';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Heart, Share2, Truck, RotateCcw, Shield } from 'lucide-react';

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
        <main className="min-h-screen bg-[#faf8f5] py-12">
          <div className="container-custom">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-200 h-96 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
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
        <main className="min-h-screen bg-[#faf8f5] py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-serif text-[#4a1e5c] mb-4">
              Produto não encontrado
            </h1>
            <Link href="/loja" className="btn-primary inline-block">
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
      
      <main className="min-h-screen bg-[#faf8f5] py-8 md:py-12">
        <div className="container-custom">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-[#6b6b6b] mb-8">
            <Link href="/" className="hover:text-[#4a1e5c] transition-smooth">
              Início
            </Link>
            <span>/</span>
            <Link href="/loja" className="hover:text-[#4a1e5c] transition-smooth">
              Loja
            </Link>
            <span>/</span>
            {product.categoryId && (
              <>
                <Link 
                  href={`/loja?categoria=${product.categoryId.slug}`}
                  className="hover:text-[#4a1e5c] transition-smooth"
                >
                  {product.categoryId.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-[#2c2c2c]">{product.name}</span>
          </nav>

          {/* Produto */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-16">
            {/* Galeria de Imagens */}
            <div className="space-y-4">
              {/* Imagem Principal */}
              <div className="relative bg-white rounded-lg overflow-hidden shadow-soft aspect-square">
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                
                {product.featured && (
                  <div className="absolute top-4 left-4 bg-[#d4af37] text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Destaque
                  </div>
                )}

                {/* Navegação de Imagens */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-soft transition-smooth"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-soft transition-smooth"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="w-6 h-6" />
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
                          ? 'border-[#4a1e5c]'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informações do Produto */}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-[#4a1e5c] mb-4">
                {product.name}
              </h1>

              {product.categoryId && (
                <Link
                  href={`/loja?categoria=${product.categoryId.slug}`}
                  className="inline-block text-sm text-[#6b6b6b] hover:text-[#4a1e5c] transition-smooth mb-4"
                >
                  {product.categoryId.name}
                </Link>
              )}

              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-4xl font-bold text-[#4a1e5c]">
                  {product.price.toFixed(2)}€
                </span>
                {product.stock > 0 ? (
                  <span className="text-sm text-green-600 font-medium">
                    Em Stock
                  </span>
                ) : (
                  <span className="text-sm text-red-600 font-medium">
                    Esgotado
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-base text-[#2c2c2c] leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              {/* Propriedades Especiais */}
              {product.properties && (
                <div className="bg-[#f5f1e8] p-4 rounded-lg mb-6 space-y-2">
                  {product.properties.chakra && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#4a1e5c] font-medium">Chakra:</span>
                      <span className="text-[#2c2c2c]">{product.properties.chakra}</span>
                    </div>
                  )}
                  {product.properties.elemento && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#4a1e5c] font-medium">Elemento:</span>
                      <span className="text-[#2c2c2c]">{product.properties.elemento}</span>
                    </div>
                  )}
                  {product.properties.signo && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#4a1e5c] font-medium">Signo:</span>
                      <span className="text-[#2c2c2c]">{product.properties.signo}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantidade e Add to Cart */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#2c2c2c]">Quantidade:</span>
                  <div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 transition-smooth"
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
                      className="p-3 hover:bg-gray-100 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? (
                      <>
                        <span>✓</span>
                        <span>Adicionado!</span>
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
                    className={`p-4 rounded-full border-2 transition-smooth ${
                      isFavorite
                        ? 'bg-red-50 border-red-500 text-red-500'
                        : 'border-gray-300 text-gray-600 hover:border-[#4a1e5c] hover:text-[#4a1e5c]'
                    }`}
                    aria-label="Adicionar aos favoritos"
                  >
                    <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    className="p-4 rounded-full border-2 border-gray-300 text-gray-600 hover:border-[#4a1e5c] hover:text-[#4a1e5c] transition-smooth"
                    aria-label="Partilhar"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#4a1e5c] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2c2c2c]">Envio Rápido</p>
                    <p className="text-sm text-[#6b6b6b]">Entrega em 2-3 dias úteis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-[#4a1e5c] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2c2c2c]">Devoluções</p>
                    <p className="text-sm text-[#6b6b6b]">14 dias para devolução</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#4a1e5c] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2c2c2c]">Garantia de Autenticidade</p>
                    <p className="text-sm text-[#6b6b6b]">Certificado de autenticidade incluído</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefícios e Cuidados */}
          {product.properties && (product.properties.beneficios || product.properties.cuidados) && (
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {product.properties.beneficios && product.properties.beneficios.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-soft">
                  <h3 className="text-2xl font-serif text-[#4a1e5c] mb-4">
                    Benefícios Energéticos
                  </h3>
                  <ul className="space-y-2">
                    {product.properties.beneficios.map((beneficio, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-[#4a1e5c] mt-1">✦</span>
                        <span className="text-[#2c2c2c]">{beneficio}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.properties.cuidados && product.properties.cuidados.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-soft">
                  <h3 className="text-2xl font-serif text-[#4a1e5c] mb-4">
                    Cuidados
                  </h3>
                  <ul className="space-y-2">
                    {product.properties.cuidados.map((cuidado, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-[#4a1e5c] mt-1">•</span>
                        <span className="text-[#2c2c2c]">{cuidado}</span>
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
              <h2 className="text-3xl font-serif text-[#4a1e5c] mb-8">
                Produtos Relacionados
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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