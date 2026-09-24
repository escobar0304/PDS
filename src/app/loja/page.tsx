'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard from '@/components/productCard';
import { ArrowCounterClockwise, ChatCircle, MagnifyingGlass, Truck } from '@phosphor-icons/react';
import { fetchList } from '@/lib/api';
import { INFORMACAO_COMPRA } from '@/lib/afirmacoes';
import { Alert, Button, EmptyState, Input, Select, SkeletonCartao } from '@/components/ui';

// Texto em `src/lib/afirmacoes.ts`. Aqui prometia-se envio gratis acima de
// 50 €, pagamento "Stripe SSL certificado" sem checkout, e atendimento
// personalizado — nada disso decidido por ninguem.
const GARANTIAS = [
  { Icone: Truck, ...INFORMACAO_COMPRA.envios },
  { Icone: ArrowCounterClockwise, ...INFORMACAO_COMPRA.livreResolucao },
  { Icone: ChatCircle, ...INFORMACAO_COMPRA.duvidas },
];

interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
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
  const categoriaDoEndereco = searchParams.get('categoria') ?? '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoriaDoEndereco);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Se o endereco mudar com a pagina aberta (um link do cabecalho para outra
  // categoria), a escolha acompanha-o. Ajusta-se durante a renderizacao, e nao
  // num efeito, para nao haver um render intermedio com a categoria antiga.
  const [enderecoVisto, setEnderecoVisto] = useState(categoriaDoEndereco);
  if (categoriaDoEndereco !== enderecoVisto) {
    setEnderecoVisto(categoriaDoEndereco);
    setSelectedCategory(categoriaDoEndereco);
  }

  /**
   * O resultado leva a chave do pedido que o produziu.
   *
   * Havia uma corrida: escolher uma categoria e logo outra lancava dois
   * pedidos, e se o primeiro respondesse em ultimo era ele que ficava na
   * grelha — com o botao da segunda marcado. `e2e/loja.spec.ts` reproduzia-o.
   * Agora uma resposta so e aceite se o pedido ainda for o actual, e "a
   * carregar" e simplesmente "o resultado que temos nao e desta chave".
   */
  const [tentativa, setTentativa] = useState(0);
  const chave = `${selectedCategory}|${sortBy}|${tentativa}`;
  const [resultado, setResultado] = useState<{
    chave: string;
    products: Product[];
    erro: string | null;
  } | null>(null);
  const loading = resultado?.chave !== chave;
  const products = loading ? [] : resultado.products;
  const erro = loading ? null : resultado.erro;

  useEffect(() => {
    let actual = true;
    fetchList<Category>('/api/categories')
      .then((lista) => actual && setCategories(lista))
      .catch((error) => {
        // Sem categorias a loja continua utilizavel, so perde os filtros.
        console.error('Erro ao carregar categorias:', error);
      });
    return () => {
      actual = false;
    };
  }, []);

  useEffect(() => {
    let actual = true;
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy) params.set('sort', sortBy);

    fetchList<Product>(`/api/products?${params}`)
      .then((lista) => {
        if (actual) setResultado({ chave, products: lista, erro: null });
      })
      .catch((error) => {
        if (!actual) return;
        console.error('Erro ao carregar produtos:', error);
        // Um erro de servidor nao pode ser mostrado como catalogo vazio.
        setResultado({ chave, products: [], erro: 'Não foi possível carregar os produtos.' });
      });
    return () => {
      actual = false;
    };
  }, [chave, selectedCategory, sortBy]);

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
              A coleção de cristais e pedras
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
                  {/*
                    `role="status"` porque esta frase muda de "A carregar..."
                    para "12 produtos encontrados" sem nada mais mudar na
                    pagina para quem nao ve os esqueletos. Sem o papel, o
                    leitor de ecra ficava calado nas duas pontas.
                  */}
                  <p role="status" className="text-sm text-ink-muted">
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
                      <Button variant="secondary" size="sm" onClick={() => setTentativa((t) => t + 1)}>
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
            <ul className="grid gap-8 sm:grid-cols-3">
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
              A coleção de cristais e pedras
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
