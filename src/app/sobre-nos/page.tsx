'use client';

import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/Hero';
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
        {/* Hero Section */}
        <Hero
          title="Sobre Nós"
          subtitle="Conheça a nossa história e o gosto por cristais"
          imageSrc="/images/sobre-nos-hero.png"
          imageAlt="Pedras roxas, cinzentas e brancas dispostas em círculos sobre madeira"
          height="medium"
          showCta={false}
        />

        {/* Nossa História */}
        <section className="py-12 md:py-16 lg:py-20 bg-surface-raised">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-rose-700 mb-4 md:mb-6">
                  Nossa História
                </h2>
                <div className="space-y-4 text-base md:text-lg text-ink leading-relaxed">
                  {/*
                    Texto geral (F9). O anterior afirmava "ha mais de uma decada" e
                    "cristais autenticos" sem ninguem o ter confirmado. A historia a
                    serio vem do negocio, quando a quiser contar.
                  */}
                  <p>
                    Pétalas de Sonho nasceu do gosto por cristais e pedras, e pelas
                    tradições que os acompanham em tantas culturas.
                  </p>
                  <p>
                    Reunimos aqui peças escolhidas pela cor, pela forma e pela beleza,
                    para quem as quer ter por perto — como objeto, como presente ou como
                    parte de um ritual pessoal.
                  </p>
                  <p>
                    Acreditamos que cada pedra tem a sua história. Se quiser saber mais
                    sobre alguma peça, escreva-nos.
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-medium">
                  <Image
                    src="/images/nossa-historia.png"
                    alt="Pedra roxa lapidada sobre uma almofada, à luz do fim de tarde"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nossos Valores */}
        <section className="py-12 md:py-16 lg:py-20 bg-surface">
          <div className="container-custom">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-rose-700 mb-3 md:mb-4">
                Nossos Valores
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-ink-muted max-w-3xl mx-auto">
                Princípios que guiam o nosso trabalho diário
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Autenticidade */}
              <div className="bg-surface-raised p-6 md:p-8 rounded-lg shadow-soft text-center">
                <Diamond className="mx-auto mb-4 h-7 w-7 text-rose-700" aria-hidden />
                <h3 className="text-xl md:text-2xl font-serif text-rose-700 mb-3">
                  Cada peça, a sua
                </h3>
                <p className="text-sm md:text-base text-ink-muted leading-relaxed">
                  Nenhuma pedra é igual a outra. Descrevemos cada uma como é.
                </p>
              </div>

              {/* Transparência */}
              <div className="bg-surface-raised p-6 md:p-8 rounded-lg shadow-soft text-center">
                <MagnifyingGlass className="mx-auto mb-4 h-7 w-7 text-rose-700" aria-hidden />
                <h3 className="text-xl md:text-2xl font-serif text-rose-700 mb-3">
                  Transparência
                </h3>
                <p className="text-sm md:text-base text-ink-muted leading-relaxed">
                  Informação clara sobre cada produto e os cuidados que pede,
                  sem exageros.
                </p>
              </div>

              {/* Sustentabilidade */}
              <div className="bg-surface-raised p-6 md:p-8 rounded-lg shadow-soft text-center sm:col-span-2 lg:col-span-1">
                <Sparkle className="mx-auto mb-4 h-7 w-7 text-rose-700" aria-hidden />
                <h3 className="text-xl md:text-2xl font-serif text-rose-700 mb-3">
                  Tradição, não medicina
                </h3>
                <p className="text-sm md:text-base text-ink-muted leading-relaxed">
                  {AVISO_TRADICAO}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-surface-raised">
          <div className="container-custom">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-rose-700 mb-3 md:mb-4">
                Entre em Contacto
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-ink-muted max-w-3xl mx-auto">
                Tem uma pergunta sobre uma peça? Escreva-nos.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              {/* Formulário de Contacto */}
              <div>
                <ContactForm />
              </div>

              {/* Informações e Mapa */}
              <div className="space-y-6">
                {/* Informações */}
                <div className="bg-surface p-6 md:p-8 rounded-lg">
                  <h3 className="text-xl md:text-2xl font-serif text-rose-700 mb-6">
                    Informações
                  </h3>
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