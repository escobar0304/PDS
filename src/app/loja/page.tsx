'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';
import Spinner from '@/components/ui/Spinner';
import { apiFetch } from '@/lib/api';

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

export default function Loja() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    fetchCategories();
    const categoryParam = searchParams.get('categoria');
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      let url = '/api/products?';
      if (selectedCategory) url += `category=${selectedCategory}&`;
      if (sortBy) url += `sort=${sortBy}`;

      const data = await apiFetch<Product[]>(url);
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setFetchError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<Category[]>('/api/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      // categorias não são críticas — falha silenciosamente
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    return product.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#000414]">
        {/* Header da Loja */}
        <section className="bg-gradient-to-br from-[#1a0b2e] via-[#000414] to-[#000414] py-12 md:py-16 border-b border-purple-900/30">
          <div className="container-custom px-6 md:px-8">
            <div
              className={`transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-4">
                Nossa <span className="text-purple-300">Loja</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl">
                Descubra nossa coleção completa de cristais e pedras preciosas
              </p>
            </div>
          </div>
        </section>

        {/* Filtros e Produtos */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="container-custom px-6 md:px-8">
            <div className="grid lg:grid-cols-4 gap-8 md:gap-10 max-w-[1400px] mx-auto">
              {/* Sidebar - Filtros */}
              <aside className="lg:col-span-1">
                <div className="bg-gradient-to-br from-[#1a0b2e] to-[#000414] rounded-xl p-6 shadow-2xl shadow-purple-900/20 border border-purple-900/30 sticky top-24">
                  {/* Pesquisa */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-purple-300 mb-3">
                      Pesquisar
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nome do produto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 bg-[#000414] border border-purple-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400">
                        🔍
                      </span>
                    </div>
                  </div>

                  {/* Categorias */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-purple-300 mb-4">
                      Categorias
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`w-full text-left px-4 py-3 text-sm rounded-lg transition-all duration-300 ${
                          selectedCategory === ''
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'text-gray-300 hover:bg-purple-900/30 hover:text-white'
                        }`}
                      >
                        ✨ Todas
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category._id}
                          onClick={() => setSelectedCategory(category.slug)}
                          className={`w-full text-left px-4 py-3 text-sm rounded-lg transition-all duration-300 ${
                            selectedCategory === category.slug
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                              : 'text-gray-300 hover:bg-purple-900/30 hover:text-white'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ordenar */}
                  <div>
                    <h3 className="text-sm font-semibold text-purple-300 mb-4">
                      Ordenar por
                    </h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-3 bg-[#000414] border border-purple-900/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="featured">⭐ Destaques</option>
                      <option value="price-asc">💰 Preço: Baixo para Alto</option>
                      <option value="price-desc">💎 Preço: Alto para Baixo</option>
                      <option value="name-asc">🔤 Nome: A-Z</option>
                      <option value="name-desc">🔤 Nome: Z-A</option>
                      <option value="newest">🆕 Mais Recentes</option>
                    </select>
                  </div>

                  {/* Total de Produtos */}
                  <div className="mt-8 pt-6 border-t border-purple-900/30">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-2">Total de Produtos</p>
                      {loading ? (
                        <div className="flex justify-center">
                          <Spinner size={20} className="text-purple-400" />
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-purple-300">{products.length}</p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Grid de Produtos */}
              <div className="lg:col-span-3">
                {/* Resultados Header */}
                <div className="flex justify-between items-center mb-8">
                  <p className="text-sm text-gray-400">
                    {loading ? (
                      <span className="flex items-center gap-2 text-purple-300">
                        <Spinner size={14} className="text-purple-400" />
                        A carregar produtos...
                      </span>
                    ) : fetchError ? (
                      <span className="text-red-400">Falha ao carregar</span>
                    ) : (
                      <span className="text-purple-300 font-medium">
                        {filteredProducts.length} produto
                        {filteredProducts.length !== 1 ? 's' : ''} encontrado
                        {filteredProducts.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                  {filteredProducts.length > 0 && !loading && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                      <span>💎</span>
                      <span>Coleção Premium</span>
                    </div>
                  )}
                </div>

                {/* Loading State — skeleton cards */}
                {loading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-[#1a0b2e] to-[#000414] rounded-xl overflow-hidden shadow-xl shadow-purple-900/20 border border-purple-900/30"
                      >
                        <div className="bg-purple-900/20 h-64 animate-pulse" />
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-purple-900/30 rounded animate-pulse" />
                          <div className="h-4 bg-purple-900/30 rounded w-2/3 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : fetchError ? (
                  /* Error State */
                  <div className="text-center py-16 bg-gradient-to-br from-[#1a0b2e] to-[#000414] rounded-xl border border-red-900/40 shadow-xl shadow-purple-900/20">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-xl text-white mb-2">
                      Não foi possível carregar os produtos
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                      Verifique a sua ligação à internet e tente novamente
                    </p>
                    <button
                      onClick={fetchProducts}
                      className="bg-purple-600 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-purple-500/20"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  /* Products Grid */
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product._id}
                        style={{
                          animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                        }}
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-16 bg-gradient-to-br from-[#1a0b2e] to-[#000414] rounded-xl border border-purple-900/30 shadow-xl shadow-purple-900/20">
                    <div className="text-6xl mb-4">🔮</div>
                    <p className="text-xl text-white mb-2">
                      {searchQuery || selectedCategory
                        ? 'Nenhum produto encontrado'
                        : 'A coleção está a ser preparada'}
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                      {searchQuery || selectedCategory
                        ? 'Tente ajustar os filtros ou a pesquisa'
                        : 'Volte em breve para descobrir os nossos cristais'}
                    </p>
                    {(searchQuery || selectedCategory) && (
                      <button
                        onClick={clearFilters}
                        className="bg-purple-600 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-purple-500/20"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#1a0b2e] via-[#000414] to-[#000414] border-t border-purple-900/30">
          <div className="container-custom px-6 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {[
                { icon: '🔒', title: 'Pagamento Seguro', desc: 'Stripe SSL certificado' },
                { icon: '🚚', title: 'Envio Grátis', desc: 'Em compras acima de 50€' },
                { icon: '↩️', title: 'Devoluções', desc: '14 dias para devolução' },
                { icon: '💬', title: 'Suporte', desc: 'Atendimento personalizado' },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="text-center group"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${0.2 + index * 0.1}s both`,
                  }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-900/50 transition-all duration-300 group-hover:scale-110">
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
