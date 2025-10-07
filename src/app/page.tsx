//src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative h-[70vh] sm:h-[80vh] md:h-screen">
          <div className="relative w-full h-full">
            {/* Background Image */}
            <Image
              src="/images/hero-bg.png"
              alt="Pedra roxa"
              fill
              className="object-cover"
              priority
              quality={90}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 z-10"></div>
            
            {/* Hero Content */}
            <div className="absolute inset-0 flex items-center justify-center text-center px-4 z-20">
              <div className={`max-w-4xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
                  Explore os Nossos <span className="text-purple-300">Produtos</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 font-light max-w-2xl mx-auto">
                  Descubra pedras preciosas e cristais para a sua jornada espiritual
                </p>
                <Link
                  href="/loja"
                  className="inline-block border-2 border-white/80 text-white px-10 py-3 rounded-lg text-lg font-medium transition-all duration-300 hover:bg-white hover:text-[#000414] hover:border-white hover:shadow-lg hover:shadow-purple-500/30"
                >
                  Descobrir Mais
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Avaliação Especializada Section */}
        <section className="py-16 md:py-20 lg:py-24 px-4 bg-[#000414]">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-4">
                Avaliação <span className="text-purple-300">Especializada</span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                Conheça a qualidade e energia de cada pedra
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 md:order-1">
                <div className="relative h-80 md:h-96 rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20">
                  <Image
                    src="/images/expertise.png"
                    alt="Pedras preciosas - Expertise"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2 space-y-5">
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                  Combinando conhecimento técnico e sensibilidade espiritual, avaliamos cada peça para que possa fazer uma escolha consciente e energética.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
              {/* Expertise */}
              <div className="text-center group">
                <div className="mb-6">
                  <div className="relative h-64 rounded-xl overflow-hidden shadow-xl shadow-purple-900/20 transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src="/images/expertise.png"
                      alt="Expertise"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                  Expertise
                </h3>
                <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-3">
                  A nossa equipa de gemologistas certificados garante a precisão das avaliações.
                </p>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                  Cada avaliação é cuidadosamente realizada para garantir a qualidade e autenticidade das pedras.
                </p>
              </div>

              {/* Personalização */}
              <div className="text-center group">
                <div className="mb-6">
                  <div className="relative h-64 rounded-xl overflow-hidden shadow-xl shadow-purple-900/20 transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src="/images/personalizacao.png"
                      alt="Personalização"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                  Personalização
                </h3>
                <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-3">
                  Avaliações personalizadas
                </p>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                  Avaliações feitas à medida para garantir que encontra a pedra perfeita para a sua jornada espiritual.
                </p>
              </div>

              {/* Confiança */}
              <div className="text-center group sm:col-span-2 lg:col-span-1">
                <div className="mb-6">
                  <div className="relative h-64 rounded-xl overflow-hidden shadow-xl shadow-purple-900/20 mx-auto max-w-md lg:max-w-none transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src="/images/confianca.png"
                      alt="Confiança"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                  Confiança
                </h3>
                <p className="text-base md:text-lg text-gray-200 leading-relaxed mb-3">
                  Com transparência e profissionalismo, garantimos a integridade de cada avaliação realizada.
                </p>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                  Sinta-se seguro ao adquirir pedras preciosas autênticas e de qualidade na nossa loja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-24 bg-gradient-to-br from-[#000414] via-[#3a1650] to-[#1a0b2e] relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 via-transparent to-purple-900/10" />
          
          <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-6">
              Pronto para Descobrir a Sua <span className="text-purple-300">Pedra Especial</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Explore a nossa coleção completa e encontre o cristal perfeito para sua jornada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/loja"
                className="w-full sm:w-auto bg-white text-[#000414] px-10 py-4 rounded-full text-lg font-semibold hover:bg-purple-50 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-white/20"
              >
                Ver Loja
              </Link>
              <Link
                href="/catalogo"
                className="w-full sm:w-auto border-2 border-white/80 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-[#000414] hover:border-white transition-all duration-300 hover:scale-105"
              >
                Catálogo
              </Link>
            </div>
          </div>
        </section>
      </main>

      
      <Footer />
    </>
  );
}