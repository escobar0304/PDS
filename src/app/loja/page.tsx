'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';
import { ArrowCounterClockwise, Headphones, MagnifyingGlass, ShieldCheck, Truck } from '@phosphor-icons/react';
import { fetchList } from '@/lib/api';
import { Alert, Button, EmptyState, Input, Select, SkeletonCartao } from '@/components/ui';

const GARANTIAS = [
  { Icone: ShieldCheck, titulo: 'Pagamento Seguro', detalhe: 'Stripe SSL certificado' },
  { Icone: Truck, titulo: 'Envio Grátis', detalhe: 'Em compras acima de 50€' },
  { Icone: ArrowCounterClockwise, titulo: 'Devoluções', detalhe: '14 dias para devolução' },
  { Icone: Headphones, titulo: 'Suporte', detalhe: 'Atendimento personalizado' },
];

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
      
      <main id="conteudo" className="min-h-screen bg-surface">
        {/* Header da Loja */}
        <section className="bg-surface-raised py-8 md:py-12 border-b">
          <div className="container-custom">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-rose-700 mb-3">
              Loja
            </h1>
            <p className="text-base md:text-lg text-ink-muted">
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
                <div className="bg-surface-raised rounded-lg p-4 md:p-6 shadow-soft sticky top-24">
                  <div className="mb-6">
                    <Input
                      label="Pesquisar"
                      type="search"
                      name="pesquisa"
                      placeholder="Nome do produto…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="py-2 text-sm"
                    />
                  </div>

                  {/* Categorias */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-ink mb-3">
                      Categorias
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`flex min-h-11 w-full items-center rounded px-3 py-2 text-left text-sm transition-smooth ${
                          selectedCategory === ''
                            ? 'bg-rose-700 text-surface'
                            : 'text-ink-muted hover:bg-surface-sunken'
                        }`}
                      >
                        Todas
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category._id}
                          onClick={() => setSelectedCategory(category.slug)}
                          className={`flex min-h-11 w-full items-center rounded px-3 py-2 text-left text-sm transition-smooth ${
                            selectedCategory === category.slug
                              ? 'bg-rose-700 text-surface'
                              : 'text-ink-muted hover:bg-surface-sunken'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Select
                      label="Ordenar por"
                      name="ordenar"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="py-2 text-sm"
                    >
                      <option value="featured">Destaques</option>
                      <option value="price-asc">Preço: Baixo para Alto</option>
                      <option value="price-desc">Preço: Alto para Baixo</option>
                      <option value="name-asc">Nome: A-Z</option>
                      <option value="name-desc">Nome: Z-A</option>
                      <option value="newest">Mais Recentes</option>
                    </Select>
                  </div>
                </div>
              </aside>

              {/* Grid de Produtos */}
              <div className="lg:col-span-3">
                {/* Resultados Header */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-ink-muted">
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
                  <Alert
                    tone="erro"
                    action={
                      <Button variant="secondary" size="sm" onClick={fetchProducts}>
                        Tentar novamente
                      </Button>
                    }
                  >
                    {erro}
                  </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                  <div className="grid items-stretch gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <SkeletonCartao key={i} />
                    ))}
                  </div>
                ) : erro ? null : filteredProducts.length > 0 ? (
                  <div className="grid items-stretch gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<MagnifyingGlass className="h-10 w-10" />}
                    title="Nenhum produto encontrado"
                    description="Experimente outra categoria ou limpe a pesquisa."
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedCategory('');
                          setSearchQuery('');
                        }}
                      >
                        Limpar filtros
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 md:py-16 bg-surface-raised border-t">
          <div className="container-custom">
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {GARANTIAS.map(({ Icone, titulo, detalhe }) => (
                <li key={titulo} className="flex gap-3">
                  <Icone className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" aria-hidden />
                  <div>
                    <h3 className="mb-1 text-base font-medium text-ink">{titulo}</h3>
                    <p className="text-sm text-ink-muted">{detalhe}</p>
                  </div>
                </li>
              ))}
            </ul>
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
      <main id="conteudo" className="min-h-screen bg-surface">
        <section className="bg-surface-raised py-8 md:py-12 border-b">
          <div className="container-custom">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-rose-700 mb-3">
              Loja
            </h1>
            <p className="text-base md:text-lg text-ink-muted">
              Descubra nossa coleção completa de cristais e pedras preciosas
            </p>
          </div>
        </section>
        <section className="py-8 md:py-12">
          <div className="container-custom">
            <div className="grid items-stretch gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCartao key={i} />
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
