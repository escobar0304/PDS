import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowCounterClockwise, Truck } from '@phosphor-icons/react/dist/ssr';
import { ICONE } from '@/components/ui/icone';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Destaques from '@/components/destaques';
import { botaoClasses } from '@/components/ui/Button';
import { LIGACAO_EM_TEXTO } from '@/components/ui';
import { AVISO_TRADICAO, INFORMACAO_COMPRA, MESMO_STOCK } from '@/lib/afirmacoes';

// Era 'use client' sem usar nada do cliente, e por isso nao podia declarar
// metadados. O titulo fica o de omissao, que aqui e o certo: e a pagina da marca.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * A entrada, como a porta de um gabinete de mineralogia (docs/MARCA.md): uma
 * vitrine em arco com uma peca, e por baixo as gavetas.
 *
 * Texto geral, sem promessas (F9). As frases que dizem alguma coisa sobre o
 * negocio vem de `lib/afirmacoes.ts`, e so dizem o que o negocio confirmou.
 */
export default function Home() {
  return (
    <>
      <Header />

      <main id="conteudo">
        {/* A vitrine: a mensagem a esquerda, a peca a direita, num arco. */}
        <section className="container-custom grid items-center gap-10 pb-16 pt-10 md:grid-cols-12 md:gap-8 md:pb-24 md:pt-16">
          <div className="fade-in md:col-span-7 lg:col-span-6">
            <h1 className="pb-1 text-5xl leading-[1.05] text-ink sm:text-6xl sm:leading-none lg:text-7xl">
              Cristais e pedras, <em className="font-medium italic text-rose-700">uma a uma.</em>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
              Cada peça tem a sua página e a sua etiqueta: a família, o peso e o preço. O resto
              vê-se com calma.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/loja" className={botaoClasses()}>
                Ver a loja
              </Link>
              <Link href="/catalogo" className={`${LIGACAO_EM_TEXTO} inline-flex items-center gap-2 py-2 font-medium`}>
                Ou procurar por família <ArrowRight {...ICONE} className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 lg:col-span-5 lg:col-start-8">
            {/* O arco e a forma da vitrine; o anel desviado e o vidro. */}
            <div className="relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden rounded-b-lg rounded-t-full ring-1 ring-line ring-offset-10 ring-offset-surface">
              <Image
                src="/images/hero-bg.png"
                alt="Pedra em bruto iluminada de lado"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover object-[40%_50%]"
              />
            </div>
          </div>
        </section>

        <Destaques />

        {/* A frase que distingue esta loja, sozinha, em largura inteira. */}
        <section className="revelar bg-rose-100 py-20 md:py-28">
          <div className="container-custom grid gap-8 md:grid-cols-12">
            <h2 className="text-4xl leading-tight text-rose-900 sm:text-5xl sm:leading-none md:col-span-8 lg:text-6xl">
              {MESMO_STOCK.titulo}
            </h2>
            <p className="max-w-md self-end text-lg leading-relaxed text-rose-900 md:col-span-4">
              {MESMO_STOCK.detalhe}
            </p>
          </div>
        </section>

        {/* Antes de escolher: uma peca grande e duas pequenas, nao tres iguais. */}
        <section aria-labelledby="antes" className="container-custom py-20 md:py-28">
          <h2 id="antes" className="max-w-2xl text-4xl leading-tight text-ink md:text-5xl md:leading-none">
            Antes de escolher
          </h2>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
            Reunimos cristais e pedras pela cor, pela forma e pelo que representam para quem os
            escolhe: como objeto, como presente ou como parte de um ritual pessoal.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-12 md:grid-rows-2">
            <article className="revelar flex flex-col md:col-span-7 md:row-span-2">
              <div className="relative min-h-72 flex-1 overflow-hidden rounded-lg md:min-h-104">
                <Image
                  src="/images/expertise.png"
                  alt="Mão com anéis pousada sobre pedras roxas em bruto"
                  fill
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-5 font-serif text-3xl text-ink">Cada peça é única</h3>
              <p className="mt-2 max-w-[55ch] leading-relaxed text-ink-muted">
                Nenhuma pedra é igual a outra: a cor, a forma e o brilho mudam de peça para peça. Na
                página de cada produto encontra a descrição e os cuidados a ter.
              </p>
            </article>

            <article className="revelar grid gap-6 sm:grid-cols-2 md:col-span-5 md:grid-cols-5 md:items-center">
              <div className="relative min-h-48 overflow-hidden rounded-lg md:col-span-2 md:h-full">
                <Image
                  src="/images/personalizacao.png"
                  alt="Agregados de cristais cor-de-rosa, lilás e brancos sobre bases, numa mesa junto à janela"
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="md:col-span-3">
                <h3 className="font-serif text-3xl text-ink">Escolher com tempo</h3>
                <p className="mt-2 leading-relaxed text-ink-muted">
                  Explore o catálogo por família de pedra e compare antes de decidir.
                </p>
              </div>
            </article>

            <article className="revelar rounded-lg bg-surface-sunken p-8 md:col-span-5">
              <h3 className="font-serif text-3xl text-ink">Tradição, não medicina</h3>
              <p className="mt-2 leading-relaxed text-ink">
                Os cristais acompanham muitas tradições, e é nesse campo que falamos deles.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{AVISO_TRADICAO}</p>
            </article>
          </div>
        </section>

        {/* O fim: uma pergunta e o que se sabe antes de comprar. */}
        <section className="revelar border-t border-line">
          <div className="container-custom grid gap-12 py-20 md:grid-cols-12 md:py-24">
            <div className="md:col-span-6">
              <h2 className="text-4xl leading-tight text-ink md:text-5xl md:leading-none">Uma dúvida sobre uma peça?</h2>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-muted">
                {INFORMACAO_COMPRA.duvidas.detalhe}.
              </p>
              <Link href="/contacto" className={botaoClasses({ variant: 'secondary', className: 'mt-8' })}>
                Falar connosco
              </Link>
            </div>
            <dl className="grid gap-8 self-end sm:grid-cols-2 md:col-span-6">
              {[
                { Icone: Truck, ...INFORMACAO_COMPRA.envios },
                { Icone: ArrowCounterClockwise, ...INFORMACAO_COMPRA.livreResolucao },
              ].map(({ Icone, titulo, detalhe }) => (
                <div key={titulo} className="border-t border-line pt-5">
                  <dt className="flex items-center gap-2 font-medium text-ink">
                    <Icone {...ICONE} className="h-5 w-5 text-rose-700" />
                    {titulo}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-muted">{detalhe}.</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
