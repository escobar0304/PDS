'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/Hero';

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
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
        <section className="py-16 md:py-20 lg:py-24 bg-[#000414]">
          <div className="container-custom px-6 md:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-4">
                As Nossas <span className="text-purple-300">Categorias</span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Descubra a categoria perfeita para encontrar o seu cristal ideal.
              </p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-purple-900/20 rounded-xl h-80 animate-pulse border border-purple-900/30"></div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/loja?categoria=${category.slug}`}
                    className="group relative overflow-hidden rounded-xl shadow-2xl shadow-purple-900/20 hover:shadow-purple-500/30 transition-all duration-500 transform hover:-translate-y-2 border border-purple-900/30 hover:border-purple-500/50"
                  >
                    <div className="relative h-80">
                      <Image
                        src={category.image || '/images/pedras-especiais.png'}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h3 className="text-2xl md:text-3xl font-serif text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                            {category.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-white group-hover:text-purple-300 transition-colors duration-300">
                          <span className="text-sm font-medium">Ver produtos</span>
                          <svg className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-400">
                  Nenhuma categoria disponível no momento.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-[#000414] via-[#1a0b2e] to-[#000414]">
          <div className="container-custom px-6 md:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-6">
                Encontre o Cristal <span className="text-purple-300">Perfeito</span>
              </h2>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed mb-10">
                Cada categoria foi cuidadosamente selecionada para oferecer uma ampla variedade 
                de cristais e bens preciosos. Explore as nossas coleções e descubra peças únicas 
                que ressoam com a sua energia e intenções.
              </p>
              <Link 
                href="/loja" 
                className="inline-block bg-purple-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-purple-500/20"
              >
                Ver Todos os Produtos
              </Link>
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="py-16 md:py-20 lg:py-24 bg-[#000414]">
          <div className="container-custom px-6 md:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {[
                { icon: '✨', title: 'Autênticos', desc: 'Todos os cristais são 100% autênticos' },
                { icon: '🎁', title: 'Embalagem', desc: 'Embalagem cuidada e sustentável' },
                { icon: '🚚', title: 'Envio Rápido', desc: 'Entrega em 2-3 dias úteis' },
                { icon: '💝', title: 'Energia', desc: 'Limpeza energética antes do envio' }
              ].map((item) => (
                <div 
                  key={item.title}
                  className="text-center group"
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-900/50 transition-all duration-300 group-hover:scale-110">
                    <span className="text-4xl">{item.icon}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-300">
                    {item.desc}
                  </p>
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