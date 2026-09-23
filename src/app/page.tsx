'use client';

import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { botaoClasses } from '@/components/ui/Button';
import { AVISO_TRADICAO } from '@/lib/afirmacoes';

/**
 * Texto geral, sem promessas (F9). Esta seccao descrevia um servico de
 * avaliacao gemologica — "gemologistas certificados", "avaliacoes
 * detalhadas", "garantimos a integridade de cada avaliacao" — que ninguem
 * confirmou existir. Quando houver informacao do negocio, muda-se aqui.
 */
const PILARES = [
  {
    titulo: 'Cada peça é única',
    imagem: '/images/expertise.png',
    alt: 'Mão com anéis pousada sobre pedras roxas em bruto',
    texto: 'Nenhuma pedra é igual a outra: a cor, a forma e o brilho mudam de peça para peça.',
    detalhe: 'Na página de cada produto encontra a descrição e os cuidados a ter.',
  },
  {
    titulo: 'Escolher com tempo',
    imagem: '/images/personalizacao.png',
    alt: 'Agregados de cristais cor-de-rosa, lilás e brancos sobre bases, numa mesa junto à janela',
    texto: 'Explore o catálogo por família de pedra e compare antes de decidir.',
    detalhe: 'Se tiver uma dúvida sobre alguma peça, pode escrever-nos.',
  },
  {
    titulo: 'Tradição, não medicina',
    imagem: '/images/confianca.png',
    alt: 'Brincos com pendentes de cristal roxo num expositor dourado',
    texto: 'Os cristais acompanham muitas tradições, e é nesse campo que falamos deles.',
    detalhe: AVISO_TRADICAO,
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main id="conteudo">
        {/* Hero */}
        <section className="on-plum relative min-h-[70svh] md:min-h-[100dvh]">
          <Image
            src="/images/hero-bg.png"
            alt="Pedra em bruto iluminada de lado"
            fill
            className="object-cover"
            priority
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
                  Cristais e pedras, para ver com calma e escolher com tempo
                </p>
                <Link href="/loja" className={botaoClasses()}>
                  Descobrir Mais
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* As peças */}
        <section className="py-20 md:py-28">
          <div className="container-custom">
            <div className="mb-14 max-w-2xl">
              <h2 className="mb-4 font-serif text-3xl leading-tight tracking-display text-ink sm:text-4xl md:text-5xl">
                As Nossas Peças
              </h2>
              <p className="text-lg leading-relaxed text-ink-muted">
                Cristais e pedras, cada um com a sua cor e a sua forma
              </p>
            </div>

            <div className="mb-20 grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div className="overflow-hidden rounded-lg">
                <Image
                  src="/images/pedras-especiais.png"
                  alt="Cinco pedras em bruto, roxas, brancas e cinzentas, num prato dourado"
                  width={960}
                  height={720}
                  className="h-72 w-full object-cover md:h-96"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
              <div className="space-y-5">
                <p className="text-lg leading-relaxed text-ink">
                  Reunimos cristais e pedras pela cor, pela forma e pelo que representam
                  para quem os escolhe — como objeto, como presente ou como parte de um
                  ritual pessoal.
                </p>
                <p className="leading-relaxed text-ink-muted">
                  Cada peça tem a sua página, com a descrição e os cuidados a ter. Se
                  quiser saber mais antes de escolher, escreva-nos.
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
                Explore a coleção e encontre o cristal que procura.
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
