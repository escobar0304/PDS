'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { botaoClasses } from '@/components/ui/Button';

// O texto e o mesmo de antes. A revisao das afirmacoes comerciais e a F9 do
// roteiro e precisa de decisoes de negocio, nao de design.
const PILARES = [
  {
    titulo: 'Expertise',
    imagem: '/images/expertise.png',
    alt: 'Pedras preciosas a serem avaliadas',
    texto:
      'A nossa equipa de gemologistas certificados garante a precisão das avaliações.',
    detalhe:
      'Cada avaliação é cuidadosamente realizada para garantir a qualidade e autenticidade das pedras.',
  },
  {
    titulo: 'Personalização',
    imagem: '/images/personalizacao.png',
    alt: 'Pedras dispostas para escolha personalizada',
    texto: 'Avaliações personalizadas',
    detalhe:
      'Avaliações feitas à medida para garantir que encontra a pedra perfeita para a sua jornada espiritual.',
  },
  {
    titulo: 'Confiança',
    imagem: '/images/confianca.png',
    alt: 'Pedra em bruto sobre uma superfície de madeira',
    texto:
      'Com transparência e profissionalismo, garantimos a integridade de cada avaliação realizada.',
    detalhe:
      'Sinta-se seguro ao adquirir pedras preciosas autênticas e de qualidade na nossa loja.',
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main>
        {/* Hero */}
        <section className="on-plum relative min-h-[70svh] md:min-h-[100dvh]">
          <Image
            src="/images/hero-bg.png"
            alt="Pedra em bruto iluminada de lado"
            fill
            className="object-cover"
            priority
            quality={90}
            sizes="100vw"
          />
          {/* Escurecimento vertical: a base fica mais densa para o texto assentar */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-plum/25 via-plum/40 to-plum/75"
            aria-hidden
          />

          <div className="relative flex min-h-[70svh] items-end md:min-h-[100dvh]">
            <div className="container-custom pb-16 md:pb-24">
              <div className="fade-in max-w-2xl">
                <h1 className="mb-5 font-serif text-4xl leading-[1.05] tracking-display text-surface sm:text-5xl md:text-6xl">
                  Explore os Nossos Produtos
                </h1>
                <p className="mb-8 max-w-xl text-lg leading-relaxed text-rose-100 md:text-xl">
                  Descubra pedras preciosas e cristais para a sua jornada espiritual
                </p>
                <Link href="/loja" className={botaoClasses()}>
                  Descobrir Mais
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Avaliação Especializada */}
        <section className="py-20 md:py-28">
          <div className="container-custom">
            <div className="mb-14 max-w-2xl">
              <h2 className="mb-4 font-serif text-3xl leading-tight tracking-display text-ink sm:text-4xl md:text-5xl">
                Avaliação Especializada
              </h2>
              <p className="text-lg leading-relaxed text-ink-muted">
                Conheça a qualidade e energia de cada pedra
              </p>
            </div>

            <div className="mb-20 grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div className="overflow-hidden rounded-lg">
                <Image
                  src="/images/pedras-especiais.png"
                  alt="Conjunto de pedras preciosas"
                  width={960}
                  height={720}
                  className="h-72 w-full object-cover md:h-96"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
              <div className="space-y-5">
                <p className="text-lg leading-relaxed text-ink">
                  Os nossos especialistas em gemologia oferecem avaliações detalhadas
                  para garantir a autenticidade e qualidade de cada pedra preciosa.
                </p>
                <p className="leading-relaxed text-ink-muted">
                  Combinando conhecimento técnico e sensibilidade espiritual, avaliamos
                  cada peça para que possa fazer uma escolha consciente e energética.
                </p>
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {PILARES.map((pilar) => (
                <article key={pilar.titulo}>
                  <div className="mb-5 overflow-hidden rounded-lg">
                    <Image
                      src={pilar.imagem}
                      alt={pilar.alt}
                      width={640}
                      height={480}
                      className="h-60 w-full object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  <h3 className="mb-3 font-serif text-2xl text-ink">{pilar.titulo}</h3>
                  <p className="mb-2 leading-relaxed text-ink">{pilar.texto}</p>
                  <p className="text-sm leading-relaxed text-ink-muted">{pilar.detalhe}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Faixa de marca */}
        <section className="on-plum bg-plum py-20 md:py-24">
          <div className="container-custom">
            <div className="max-w-2xl">
              <h2 className="mb-5 font-serif text-3xl leading-tight tracking-display text-surface sm:text-4xl md:text-5xl">
                Pronto para Descobrir a Sua Pedra Especial?
              </h2>
              <p className="mb-9 text-lg leading-relaxed text-rose-200">
                Explore a nossa coleção completa e encontre o cristal perfeito para sua
                jornada.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/loja" className={botaoClasses()}>
                  Ver Loja
                </Link>
                <Link href="/catalogo" className={botaoClasses({ variant: 'secondary' })}>
                  Catálogo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
