'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProductCard, { type ProdutoDoCartao } from '@/components/productCard';
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

type Product = ProdutoDoCartao & { active: boolean };

/** Quatro colunas no ecra largo: a grelha tem a largura toda. */
const GRELHA = 'grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

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
        <section className="container-custom pb-8 pt-10 md:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl text-ink md:text-7xl">Loja</h1>
              <p className="mt-3 text-lg text-ink-muted">A coleção de cristais e pedras</p>
            </div>
            {/*
              `role="status"` porque esta frase muda de "A carregar..."
              para "12 produtos encontrados" sem nada mais mudar na
              pagina para quem nao ve os esqueletos. Sem o papel, o
              leitor de ecra ficava calado nas duas pontas.
            */}
            <p role="status" className="font-mono text-sm text-ink-muted">
              {loading ? (
                'A carregar...'
              ) : erro ? (
                ''
              ) : (
                `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`
              )}
            </p>
          </div>

          {/*
            Os filtros por cima da grelha, e nao numa coluna ao lado: a
            grelha fica com a largura toda, e no telemovel os filtros nao
            empurram as pecas para o fim da pagina.
          */}
          <div className="mt-10 grid gap-4 border-y border-line py-5 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p id="categorias" className="mb-3 text-sm font-semibold text-ink">
                Categorias
              </p>
              <div role="group" aria-labelledby="categorias" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {[{ _id: 'todas', name: 'Todas', slug: '' }, ...categories].map((category) => {
                  const escolhida = selectedCategory === category.slug;
                  return (
                    <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category.slug)}
                      aria-pressed={escolhida}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-smooth ${
                        escolhida
                          ? 'border-rose-700 bg-rose-700 text-surface'
                          : 'border-line text-ink hover:border-rose-700 hover:text-rose-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:col-span-5">
              <Input
                label="Pesquisar"
                type="search"
                name="pesquisa"
                placeholder="Nome do produto…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2 text-sm"
              />
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
        </section>

        <section className="container-custom pb-20">
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

          {loading ? (
            <div className={GRELHA}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCartao key={i} />
              ))}
            </div>
          ) : erro ? null : filteredProducts.length > 0 ? (
            <div className={GRELHA}>
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
        </section>

        <section className="border-t border-line bg-surface-sunken py-12 md:py-16">
          <ul className="container-custom grid gap-8 sm:grid-cols-3">
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
        <section className="container-custom pb-8 pt-10 md:pt-16">
          <h1 className="text-5xl text-ink md:text-7xl">Loja</h1>
          <p className="mt-3 text-lg text-ink-muted">A coleção de cristais e pedras</p>
        </section>
        <section className="container-custom pb-20">
          <div className={GRELHA}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonCartao key={i} />
            ))}
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
