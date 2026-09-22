'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Diamond, Gift, Sparkle, SquaresFour, Truck } from '@phosphor-icons/react';
import { Alert, botaoClasses, Button, EmptyState, Skeleton } from '@/components/ui';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/Hero';
import { fetchList } from '@/lib/api';

const CARACTERISTICAS = [
  { Icone: Diamond, titulo: 'Autênticos', detalhe: 'Todos os cristais são 100% autênticos' },
  { Icone: Gift, titulo: 'Embalagem', detalhe: 'Embalagem cuidada e sustentável' },
  { Icone: Truck, titulo: 'Envio Rápido', detalhe: 'Entrega em 2-3 dias úteis' },
  { Icone: Sparkle, titulo: 'Energia', detalhe: 'Limpeza energética antes do envio' },
];

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
}

export default function Catalogo() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setErro(null);
    try {
      setCategories(await fetchList<Category>('/api/categories'));
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setErro('Não foi possível carregar as categorias.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <Hero
          title="Catálogo"
          subtitle="Explore nossas categorias de cristais e pedras preciosas"
          imageSrc="/images/hero-catalogo.png"
          imageAlt="Catálogo de produtos"
          height="medium"
          showCta={false}
        />

        {/* Categorias Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-surface-raised">
          <div className="container-custom">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-rose-700 mb-3 md:mb-4">
                Nossas Categorias
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-ink-muted max-w-3xl mx-auto">
                Descubra a categoria perfeita para encontrar o seu cristal ideal
              </p>
            </div>

            {!loading && erro && (
              <Alert
                tone="erro"
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setLoading(true);
                      fetchCategories();
                    }}
                  >
                    Tentar novamente
                  </Button>
                }
              >
                {erro}
              </Alert>
            )}

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/loja?categoria=${category.slug}`}
                    className="group relative overflow-hidden rounded-lg border border-line transition-smooth hover:border-rose-300"
                  >
                    <div className="relative h-80">
                      <Image
                        src={category.image || '/images/pedras-especiais.png'}
                        alt={category.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/35 to-transparent" aria-hidden />
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 className="text-2xl md:text-3xl font-serif text-surface mb-2 group-hover:text-rose-200 transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-rose-100 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="mt-4 flex items-center gap-2 text-surface group-hover:text-rose-200 transition-colors">
                          <span className="text-sm font-medium">Ver produtos</span>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && !erro && categories.length === 0 && (
              <EmptyState
                icon={<SquaresFour className="h-10 w-10" />}
                title="Ainda não há categorias"
                description="Estamos a preparar o catálogo. Entretanto pode ver a loja."
                action={
                  <Link href="/loja" className={botaoClasses({ variant: 'secondary' })}>
                    Ir à loja
                  </Link>
                }
              />
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-surface">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-rose-700 mb-6">
                Encontre o Cristal Perfeito
              </h2>
              <p className="text-base md:text-lg text-ink-muted leading-relaxed mb-8">
                Cada categoria foi cuidadosamente selecionada para oferecer uma ampla variedade 
                de cristais e pedras preciosas. Explore nossas coleções e descubra peças únicas 
                que ressoam com a sua energia e intenções.
              </p>
              <Link href="/loja" className={botaoClasses()}>
                Ver Todos os Produtos
              </Link>
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="py-12 md:py-16 lg:py-20 bg-surface-raised">
          <div className="container-custom">
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {CARACTERISTICAS.map(({ Icone, titulo, detalhe }) => (
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