'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[70vh] sm:h-[80vh] md:h-screen">
          <div className="relative w-full h-full">
            <Image
              src="/images/hero-bg.png"
              alt="Pedra roxa"
              fill
              className="object-cover"
              priority
              quality={90}
            />
            {/* Overlay desfocado e escurecido */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-none z-10"></div>
            {/* Texto acima do overlay */}
            <div className="absolute inset-0 flex items-center justify-center text-center px-4 z-20">
              <div className="max-w-4xl fade-in">
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-4 md:mb-6 leading-tight">
                  Explore os Nossos Produtos
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 md:mb-8 font-light max-w-2xl mx-auto">
                  Descubra pedras preciosas e cristais para a sua jornada espiritual !
                </p>
                <Link
                  href="/loja"
                  className="inline-block border border-white text-white px-8 py-3 rounded-md text-lg font-medium transition-colors duration-200 hover:bg-white hover:text-[#000414]"
                >
                  Descobrir Mais
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Avaliação Especializada Section */}
        <section className="py-12 md:py-16 lg:py-20 px-4 bg-[#000414]">
          <div className="container-custom">
            {/* Section Header */}
            <div className="text-center mb-10 md:mb-16 fade-in">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-3 md:mb-4">
                Avaliação Especializada
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#e0e0e0] max-w-3xl mx-auto">
                Conheça a qualidade e energia de cada pedra
              </p>
            </div>

            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
              <div className="order-2 md:order-1">
                <div className="relative h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-medium">
                  <Image
                    src="/images/expertise.png"
                    alt="Pedras preciosas"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <p className="text-base md:text-lg text-white leading-relaxed mb-4 md:mb-6">
                  Os nossos especialistas em gemologia oferecem avaliações detalhadas para garantir a autenticidade e qualidade de cada pedra preciosa.
                </p>
                <p className="text-base md:text-lg text-white leading-relaxed">
                  Combinando conhecimento técnico e sensibilidade espiritual, avaliamos cada peça para que você possa fazer uma escolha consciente e energética.
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-20">
              {/* Expertise */}
              <div className="text-center fade-in">
                <div className="mb-4 md:mb-6">
                  <div className="relative h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden shadow-medium">
                    <Image
                      src="/images/expertise.png"
                      alt="Expertise"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-white mb-3 md:mb-4">
                  Expertise
                </h3>
                <p className="text-sm md:text-base text-white leading-relaxed mb-2 md:mb-3">
                  Nossa equipe de gemologistas certificados garante a precisão das avaliações.
                </p>
                <p className="text-sm md:text-base text-[#e0e0e0]">
                  Cada avaliação é cuidadosamente realizada para garantir a qualidade e autenticidade das pedras.
                </p>
              </div>

              {/* Personalização */}
              <div className="text-center fade-in">
                <div className="mb-4 md:mb-6">
                  <div className="relative h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden shadow-medium">
                    <Image
                      src="/images/personalizacao.png"
                      alt="Personalização"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-white mb-3 md:mb-4">
                  Personalização
                </h3>
                <p className="text-sm md:text-base text-white leading-relaxed mb-2 md:mb-3">
                  2A Real Success
                </p>
                <p className="text-sm md:text-base text-[#e0e0e0]">
                  Avaliações feitas sob medida para garantir que você encontre a pedra perfeita para sua jornada espiritual.
                </p>
              </div>

              {/* Confiança */}
              <div className="text-center fade-in sm:col-span-2 lg:col-span-1">
                <div className="mb-4 md:mb-6">
                  <div className="relative h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden shadow-medium mx-auto max-w-md lg:max-w-none">
                    <Image
                      src="/images/confianca.png"
                      alt="Confiança"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-white mb-3 md:mb-4">
                  Confiança
                </h3>
                <p className="text-sm md:text-base text-white leading-relaxed mb-2 md:mb-3">
                  Com transparência e profissionalismo, garantimos a integridade de cada avaliação realizada em nossa empresa.
                </p>
                <p className="text-sm md:text-base text-[#e0e0e0]">
                  Sinta-se seguro ao adquirir pedras preciosas autênticas e de qualidade em nossa loja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-r from-[#000414] to-[#4a1e5c]">
          <div className="container-custom text-center px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white mb-4 md:mb-6">
              Pronto para Descobrir Sua Pedra Especial?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#e0e0e0] mb-6 md:mb-8 max-w-2xl mx-auto">
              Explore nossa coleção completa e encontre o cristal perfeito para sua jornada
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/loja"
                className="w-full sm:w-auto bg-white text-[#000414] px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-[#e0e0e0] transition-smooth"
              >
                Ver Loja
              </Link>
              <Link
                href="/catalogo"
                className="w-full sm:w-auto border-2 border-white text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-white hover:text-[#0a174e] transition-smooth"
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