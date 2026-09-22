'use client';

import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/Hero';
import ContactForm from '@/components/contactForm';
import { Clock, Diamond, Envelope, Leaf, MagnifyingGlass, MapPin, Phone } from '@phosphor-icons/react';
import MapaLocalizacao from '@/components/mapaLocalizacao';

/** Incorporacao do mapa. So e pedida a Google depois de a pessoa carregar. */
const MAPA_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48373.53503964024!2d-8.651142499999999!3d41.1579438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd2465abc4e153c1%3A0xa648d95640b114bc!2sPorto!5e0!3m2!1spt-PT!2spt!4v1234567890123!5m2!1spt-PT!2spt';

export default function SobreNos() {
  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <Hero
          title="Sobre Nós"
          subtitle="Conheça nossa história e paixão por cristais"
          imageSrc="/images/sobre-nos-hero.png"
          imageAlt="Nossa história"
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
                  <p>
                    Pétalas de Sonho nasceu da paixão por pedras preciosas e cristais, 
                    combinada com um profundo respeito pela espiritualidade e energia 
                    que cada peça carrega consigo.
                  </p>
                  <p>
                    Há mais de uma década, iniciamos esta jornada com o objetivo de 
                    trazer ao público português uma seleção cuidada de cristais autênticos, 
                    cada um escolhido pela sua qualidade, beleza e propriedades energéticas únicas.
                  </p>
                  <p>
                    Acreditamos que cada pedra tem uma história para contar e uma energia 
                    para partilhar. O nosso compromisso é ajudá-lo a encontrar a peça 
                    perfeita para a sua jornada espiritual.
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-medium">
                  <Image
                    src="/images/nossa-historia.png"
                    alt="Nossa história"
                    fill
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
                  Autenticidade
                </h3>
                <p className="text-sm md:text-base text-ink-muted leading-relaxed">
                  Todas as nossas pedras são autênticas e certificadas, 
                  garantindo qualidade e procedência.
                </p>
              </div>

              {/* Transparência */}
              <div className="bg-surface-raised p-6 md:p-8 rounded-lg shadow-soft text-center">
                <MagnifyingGlass className="mx-auto mb-4 h-7 w-7 text-rose-700" aria-hidden />
                <h3 className="text-xl md:text-2xl font-serif text-rose-700 mb-3">
                  Transparência
                </h3>
                <p className="text-sm md:text-base text-ink-muted leading-relaxed">
                  Informação clara sobre cada produto, suas propriedades 
                  e origem, sem mistérios.
                </p>
              </div>

              {/* Sustentabilidade */}
              <div className="bg-surface-raised p-6 md:p-8 rounded-lg shadow-soft text-center sm:col-span-2 lg:col-span-1">
                <Leaf className="mx-auto mb-4 h-7 w-7 text-rose-700" aria-hidden />
                <h3 className="text-xl md:text-2xl font-serif text-rose-700 mb-3">
                  Sustentabilidade
                </h3>
                <p className="text-sm md:text-base text-ink-muted leading-relaxed">
                  Comprometidos com práticas éticas e sustentáveis 
                  na extração e comercialização.
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
                Estamos aqui para ajudar na sua jornada espiritual
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
                        <p className="text-sm text-ink-muted">Porto, Portugal</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Envelope className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
                      <div>
                        <p className="font-medium text-ink">Email</p>
                        <a href="mailto:info@petalasdesonho.pt" className="text-sm text-ink-muted hover:text-rose-700 transition-smooth">
                          info@petalasdesonho.pt
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
                      <div>
                        <p className="font-medium text-ink">Telefone</p>
                        <a href="tel:+351000000000" className="text-sm text-ink-muted hover:text-rose-700 transition-smooth">
                          +351 xxx xxx xxx
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" aria-hidden />
                      <div>
                        <p className="font-medium text-ink">Horário</p>
                        <p className="text-sm text-ink-muted">Seg-Sex: 10h - 19h</p>
                        <p className="text-sm text-ink-muted">Sáb: 10h - 14h</p>
                      </div>
                    </div>
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