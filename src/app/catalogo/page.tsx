'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/Hero';
import { fetchList } from '@/lib/api';

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
        <section className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="container-custom">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#4a1e5c] mb-3 md:mb-4">
                Nossas Categorias
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#6b6b6b] max-w-3xl mx-auto">
                Descubra a categoria perfeita para encontrar o seu cristal ideal
              </p>
            </div>

            {!loading && erro && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-6 text-center"
              >
                <p className="mb-4 text-base text-red-800">{erro}</p>
                <button
                  onClick={() => {
                    setLoading(true);
                    fetchCategories();
                  }}
                  className="btn-secondary"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/loja?categoria=${category.slug}`}
                    className="group relative overflow-hidden rounded-lg shadow-medium hover:shadow-strong transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative h-80">
                      <Image
                        src={category.image || '/images/pedras-especiais.png'}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70 group-hover:opacity-80 transition-opacity"></div>
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 className="text-2xl md:text-3xl font-serif text-white mb-2 group-hover:text-[#d4af37] transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-200 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                        <div className="mt-4 flex items-center gap-2 text-white group-hover:text-[#d4af37] transition-colors">
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
              <div className="text-center py-12">
                <p className="text-lg text-[#6b6b6b]">
                  Nenhuma categoria disponível no momento.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-[#faf8f5]">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#4a1e5c] mb-6">
                Encontre o Cristal Perfeito
              </h2>
              <p className="text-base md:text-lg text-[#6b6b6b] leading-relaxed mb-8">
                Cada categoria foi cuidadosamente selecionada para oferecer uma ampla variedade 
                de cristais e pedras preciosas. Explore nossas coleções e descubra peças únicas 
                que ressoam com a sua energia e intenções.
              </p>
              <Link href="/loja" className="btn-primary inline-block">
                Ver Todos os Produtos
              </Link>
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="container-custom">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-lg md:text-xl font-serif text-[#4a1e5c] mb-2">
                  Autênticos
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  Todos os cristais são 100% autênticos
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎁</span>
                </div>
                <h3 className="text-lg md:text-xl font-serif text-[#4a1e5c] mb-2">
                  Embalagem
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  Embalagem cuidada e sustentável
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🚚</span>
                </div>
                <h3 className="text-lg md:text-xl font-serif text-[#4a1e5c] mb-2">
                  Envio Rápido
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  Entrega em 2-3 dias úteis
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#4a1e5c] bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💝</span>
                </div>
                <h3 className="text-lg md:text-xl font-serif text-[#4a1e5c] mb-2">
                  Energia
                </h3>
                <p className="text-sm text-[#6b6b6b]">
                  Limpeza energética antes do envio
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