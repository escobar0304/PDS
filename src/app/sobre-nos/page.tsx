'use client';

import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ContactForm from '@/components/contactForm';
import { Clock, Diamond, Envelope, MagnifyingGlass, MapPin, Phone, Sparkle } from '@phosphor-icons/react';
import MapaLocalizacao from '@/components/mapaLocalizacao';
import { EMPRESA, moradaFormatada } from '@/lib/empresa';
import { AVISO_TRADICAO } from '@/lib/afirmacoes';

/** Incorporacao do mapa. So e pedida a Google depois de a pessoa carregar. */
const MAPA_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48373.53503964024!2d-8.651142499999999!3d41.1579438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd2465abc4e153c1%3A0xa648d95640b114bc!2sPorto!5e0!3m2!1spt-PT!2spt!4v1234567890123!5m2!1spt-PT!2spt';

export default function SobreNos() {
  return (
    <>
      <Header />
      
      <main id="conteudo">
        {/* A historia, ao lado da peca na vitrine em arco. */}
        <section className="container-custom grid items-center gap-12 pb-16 pt-10 md:grid-cols-12 md:pb-24 md:pt-16">
          <div className="md:col-span-7 lg:col-span-6">
            <h1 className="text-5xl text-ink md:text-7xl">Sobre Nós</h1>
            <div className="mt-8 max-w-[58ch] space-y-5 text-lg leading-relaxed text-ink">
              {/*
                Texto geral (F9). O anterior afirmava "ha mais de uma decada" e
                "cristais autenticos" sem ninguem o ter confirmado. A historia a
                serio vem do negocio, quando a quiser contar.
              */}
              <p>
                Pétalas de Sonho nasceu do gosto por cristais e pedras, e pelas tradições que os
                acompanham em tantas culturas.
              </p>
              <p className="text-ink-muted">
                Reunimos aqui peças escolhidas pela cor, pela forma e pela beleza, para quem as quer
                ter por perto: como objeto, como presente ou como parte de um ritual pessoal.
              </p>
              <p className="text-ink-muted">
                Acreditamos que cada pedra tem a sua história. Se quiser saber mais sobre alguma
                peça, escreva-nos.
              </p>
            </div>
          </div>
          <div className="md:col-span-5 lg:col-start-8">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-b-lg rounded-t-full ring-1 ring-line ring-offset-[10px] ring-offset-surface">
              <Image
                src="/images/nossa-historia.png"
                alt="Pedra roxa lapidada sobre uma almofada, à luz do fim de tarde"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <div className="container-custom">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg md:aspect-[21/8]">
            <Image
              src="/images/sobre-nos-hero.png"
              alt="Pedras roxas, cinzentas e brancas dispostas em círculos sobre madeira"
              fill
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* O que nos guia: tres frases, em lista, e nao tres cartoes iguais. */}
        <section aria-labelledby="valores" className="container-custom py-20 md:py-28">
          <h2 id="valores" className="text-4xl text-ink md:text-5xl">
            O que nos guia
          </h2>
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {[
              { Icone: Diamond, t: 'Cada peça, a sua', d: 'Nenhuma pedra é igual a outra. Descrevemos cada uma como é.' },
              {
                Icone: MagnifyingGlass,
                t: 'Transparência',
                d: 'Informação clara sobre cada produto e os cuidados que pede, sem exageros.',
              },
              { Icone: Sparkle, t: 'Tradição, não medicina', d: AVISO_TRADICAO },
            ].map(({ Icone, t, d }) => (
              <div key={t} className="revelar grid gap-3 py-8 md:grid-cols-12 md:items-baseline md:gap-8">
                <dt className="flex items-center gap-3 font-serif text-3xl text-ink md:col-span-5 md:text-4xl">
                  <Icone className="h-6 w-6 shrink-0 text-rose-700" aria-hidden />
                  {t}
                </dt>
                <dd className="max-w-[55ch] text-lg leading-relaxed text-ink-muted md:col-span-7">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Contacto Section */}
        <section className="border-t border-line bg-surface-sunken py-20 md:py-28">
          <div className="container-custom">
            <div className="mb-12 max-w-2xl">
              <h2 className="text-4xl text-ink md:text-5xl">Entre em contacto</h2>
              <p className="mt-4 text-lg text-ink-muted">Tem uma pergunta sobre uma peça? Escreva-nos.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              {/* Formulário de Contacto */}
              <div>
                <ContactForm />
              </div>

              {/* Informações e Mapa */}
              <div className="space-y-6">
                {/* Informações */}
                <div className="rounded-lg border border-line bg-surface-raised p-6 md:p-8">
                  <h3 className="mb-6 font-serif text-3xl text-ink">Informações</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
                      <div>
                        <p className="font-medium text-ink">Morada</p>
                        <p className={moradaFormatada() ? 'text-sm text-ink-muted' : 'text-sm text-danger-700'}>
                          {moradaFormatada() ?? 'por preencher'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Envelope className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
                      <div>
                        <p className="font-medium text-ink">Email</p>
                        {EMPRESA.email ? (
                          <a
                            href={`mailto:${EMPRESA.email}`}
                            className="inline-block py-1 text-sm text-ink-muted transition-smooth hover:text-rose-700"
                          >
                            {EMPRESA.email}
                          </a>
                        ) : (
                          <p className="py-1 text-sm text-danger-700">por preencher</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
                      <div>
                        <p className="font-medium text-ink">Telefone</p>
                        {EMPRESA.telefone ? (
                          <a
                            href={`tel:${EMPRESA.telefone.replace(/\s/g, '')}`}
                            className="inline-block py-1 text-sm text-ink-muted transition-smooth hover:text-rose-700"
                          >
                            {EMPRESA.telefone}
                          </a>
                        ) : (
                          <p className="py-1 text-sm text-danger-700">por preencher</p>
                        )}
                      </div>
                    </div>
                    {EMPRESA.horario && (
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
                        <div>
                          <p className="font-medium text-ink">Horário</p>
                          <p className="text-sm text-ink-muted">{EMPRESA.horario}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <MapaLocalizacao src={MAPA_EMBED} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}