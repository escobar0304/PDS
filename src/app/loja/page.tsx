'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';
import { fetchList } from '@/lib/api';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  images: string[];
  stock: number;
  categoryId: string;
  featured: boolean;
  active: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

function LojaContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    const categoryParam = searchParams.get('categoria');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      setCategories(await fetchList<Category>('/api/categories'));
    } catch (error) {
      // Sem categorias a loja continua utilizavel, so perde os filtros.
      console.error('Erro ao carregar categorias:', error);
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (sortBy) params.set('sort', sortBy);

      setProducts(await fetchList<Product>(`/api/products?${params}`));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Um erro de servidor nao pode ser mostrado como catalogo vazio.
      setErro('Não foi possível carregar os produtos.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    return product.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#faf8f5]">
        {/* Header da Loja */}
        <section className="bg-white py-8 md:py-12 border-b">
          <div className="container-custom">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#4a1e5c] mb-3">
              Loja
            </h1>
            <p className="text-base md:text-lg text-[#6b6b6b]">
              Descubra nossa coleção completa de cristais e pedras preciosas
            </p>
          </div>
        </section>

        {/* Filtros e Produtos */}
        <section className="py-8 md:py-12">
          <div className="container-custom">
            <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
              {/* Sidebar - Filtros */}
              <aside className="lg:col-span-1">
                <div className="bg-white rounded-lg p-4 md:p-6 shadow-soft sticky top-24">
                  {/* Pesquisa */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                      Pesquisar
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do produto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] focus:border-transparent"
                    />
                  </div>

                  {/* Categorias */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-[#2c2c2c] mb-3">
                      Categorias
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-smooth ${
                          selectedCategory === ''
                            ? 'bg-[#4a1e5c] text-white'
                            : 'text-[#6b6b6b] hover:bg-gray-100'
                        }`}
                      >
                        Todas
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category._id}
                          onClick={() => setSelectedCategory(category.slug)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-smooth ${
                            selectedCategory === category.slug
                              ? 'bg-[#4a1e5c] text-white'
                              : 'text-[#6b6b6b] hover:bg-gray-100'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ordenar */}
                  <div>
                    <h3 className="text-sm font-semibold text-[#2c2c2c] mb-3">
                      Ordenar por
                    </h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] focus:border-transparent"
                    >
                      <option value="featured">Destaques</option>
                      <option value="price-asc">Preço: Baixo para Alto</option>
                      <option value="price-desc">Preço: Alto para Baixo</option>
                      <option value="name-asc">Nome: A-Z</option>
                      <option value="name-desc">Nome: Z-A</option>
                      <option value="newest">Mais Recentes</option>
                    </select>
                  </div>
                </div>
              </aside>

              {/* Grid de Produtos */}
              <div className="lg:col-span-3">
                {/* Resultados Header */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-[#6b6b6b]">
                    {loading ? (
                      'A carregar...'
                    ) : erro ? (
                      ''
                    ) : (
                      `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`
                    )}
                  </p>
                </div>

                {/* Erro de carregamento */}
                {!loading && erro && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
                  >
                    <p className="mb-4 text-base text-red-800">{erro}</p>
                    <button onClick={fetchProducts} className="btn-secondary">
                      Tentar novamente
                    </button>
                  </div>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white rounded-lg overflow-hidden shadow-soft">
                        <div className="bg-gray-200 h-64 animate-pulse"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : erro ? null : filteredProducts.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-lg text-[#6b6b6b] mb-4">
                      Nenhum produto encontrado
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSearchQuery('');
                      }}
                      className="btn-secondary"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 md:py-16 bg-white border-t">
          <div className="container-custom">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-base font-semibold text-[#4a1e5c] mb-1">
                  Pagamento Seguro
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  Stripe SSL certificado
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-base font-semibold text-[#4a1e5c] mb-1">
                  Envio Grátis
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  Em compras acima de 50€
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">↩️</span>
                </div>
                <h3 className="text-base font-semibold text-[#4a1e5c] mb-1">
                  Devoluções
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  14 dias para devolução
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-base font-semibold text-[#4a1e5c] mb-1">
                  Suporte
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  Atendimento personalizado
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/**
 * useSearchParams() obriga a um limite de Suspense no App Router. Sem ele o
 * `next build` falha a pre-renderizar esta pagina.
 */
function LojaFallback() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#faf8f5]">
        <section className="bg-white py-8 md:py-12 border-b">
          <div className="container-custom">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#4a1e5c] mb-3">
              Loja
            </h1>
            <p className="text-base md:text-lg text-[#6b6b6b]">
              Descubra nossa coleção completa de cristais e pedras preciosas
            </p>
          </div>
        </section>
        <section className="py-8 md:py-12">
          <div className="container-custom">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-soft">
                  <div className="bg-gray-200 h-64 animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default function Loja() {
  return (
    <Suspense fallback={<LojaFallback />}>
      <LojaContent />
    </Suspense>
  );
}
