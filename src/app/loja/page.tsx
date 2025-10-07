'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
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
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products?';
      if (selectedCategory) url += `category=${selectedCategory}&`;
      if (sortBy) url += `sort=${sortBy}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
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
      
      <main className="min-h-screen bg-[#000414]">
        {/* Header da Loja */}
        <section className="bg-gradient-to-br from-[#1a0b2e] via-[#000414] to-[#000414] py-12 md:py-16 border-b border-purple-900/30">
          <div className="container-custom px-6 md:px-8">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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

                  {/* Stats decorativo */}
                  <div className="mt-8 pt-6 border-t border-purple-900/30">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-2">Total de Produtos</p>
                      <p className="text-2xl font-bold text-purple-300">{products.length}</p>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Grid de Produtos */}
              <div className="lg:col-span-3">
                {/* Resultados Header */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-sm text-gray-400">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span> A carregar...
                        </span>
                      ) : (
                        <span className="text-purple-300 font-medium">
                          {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  {filteredProducts.length > 0 && !loading && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                      <span>💎</span>
                      <span>Coleção Premium</span>
                    </div>
                  )}
                </div>

                {/* Loading State */}
                {loading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-gradient-to-br from-[#1a0b2e] to-[#000414] rounded-xl overflow-hidden shadow-xl shadow-purple-900/20 border border-purple-900/30">
                        <div className="bg-purple-900/20 h-64 animate-pulse"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-purple-900/30 rounded animate-pulse"></div>
                          <div className="h-4 bg-purple-900/30 rounded w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product._id}
                        style={{
                          animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-[#1a0b2e] to-[#000414] rounded-xl border border-purple-900/30 shadow-xl shadow-purple-900/20">
                    <div className="text-6xl mb-4">🔮</div>
                    <p className="text-xl text-white mb-2">
                      Nenhum produto encontrado
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                      Tente ajustar os filtros ou pesquisa
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSearchQuery('');
                      }}
                      className="bg-purple-600 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-purple-500/20"
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
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#1a0b2e] via-[#000414] to-[#000414] border-t border-purple-900/30">
          <div className="container-custom px-6 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {[
                { icon: '🔒', title: 'Pagamento Seguro', desc: 'Stripe SSL certificado' },
                { icon: '🚚', title: 'Envio Grátis', desc: 'Em compras acima de 50€' },
                { icon: '↩️', title: 'Devoluções', desc: '14 dias para devolução' },
                { icon: '💬', title: 'Suporte', desc: 'Atendimento personalizado' }
              ].map((item, index) => (
                <div 
                  key={item.title}
                  className="text-center group"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${0.2 + index * 0.1}s both`
                  }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-900/50 transition-all duration-300 group-hover:scale-110">
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {item.desc}
                  </p>
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