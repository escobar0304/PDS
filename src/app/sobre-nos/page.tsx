'use client';

import Image from 'next/image';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Hero from '@/components/Hero';
import ContactForm from '@/components/contactForm';

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
        <section className="py-16 md:py-20 lg:py-24 bg-[#000414]">
          <div className="container-custom px-6 md:px-8 lg:px-12">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center max-w-7xl mx-auto">
              <div className="order-2 md:order-1 px-4 md:px-0">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-6">
                  Nossa <span className="text-purple-300">História</span>
                </h2>
                <div className="space-y-5 text-base md:text-lg text-gray-300 leading-relaxed">
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
              <div className="order-1 md:order-2 px-4 md:px-0">
                <div className="relative h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 group">
                  <Image
                    src="/images/nossa-historia.png"
                    alt="Nossa história"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nossos Valores */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-[#000414] via-[#1a0b2e] to-[#000414]">
          <div className="container-custom px-6 md:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-4">
                Nossos <span className="text-purple-300">Valores</span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Princípios que guiam o nosso trabalho diário
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                { icon: '✨', title: 'Autenticidade', desc: 'Todas as nossas pedras são autênticas e certificadas, garantindo qualidade e procedência.' },
                { icon: '🔍', title: 'Transparência', desc: 'Informação clara sobre cada produto, suas propriedades e origem, sem mistérios.' },
                { icon: '🌱', title: 'Sustentabilidade', desc: 'Comprometidos com práticas éticas e sustentáveis na extração e comercialização.' }
              ].map((item, index) => (
                <div 
                  key={item.title}
                  className={`bg-[#000414] bg-opacity-60 backdrop-blur-sm p-8 rounded-xl shadow-xl shadow-purple-900/20 border border-purple-900/30 text-center group hover:border-purple-500/50 transition-all duration-500 ${index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-purple-900/30 rounded-full flex items-center justify-center group-hover:bg-purple-900/50 transition-all duration-300 group-hover:scale-110">
                    <span className="text-4xl">{item.icon}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto Section */}
        <section className="py-16 md:py-20 lg:py-24 bg-[#000414]">
          <div className="container-custom px-6 md:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white mb-4">
                Entre em <span className="text-purple-300">Contacto</span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Estamos aqui para ajudar na sua jornada espiritual
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 max-w-7xl mx-auto">
              {/* Formulário de Contacto */}
              <div>
                <ContactForm />
              </div>

              {/* Informações e Mapa */}
              <div className="space-y-8">
                {/* Informações */}
                <div className="bg-gradient-to-br from-[#1a0b2e] to-[#000414] p-8 rounded-xl border border-purple-900/30 shadow-xl shadow-purple-900/20">
                  <h3 className="text-2xl md:text-3xl font-serif text-white mb-6">
                    Informações
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4 group">
                      <span className="text-purple-300 text-2xl mt-1 group-hover:scale-110 transition-transform duration-300">📍</span>
                      <div>
                        <p className="font-semibold text-white mb-1">Morada</p>
                        <p className="text-base text-gray-300">Porto, Portugal</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <span className="text-purple-300 text-2xl mt-1 group-hover:scale-110 transition-transform duration-300">📧</span>
                      <div>
                        <p className="font-semibold text-white mb-1">Email</p>
                        <a 
                          href="mailto:info@petalasdesonho.pt" 
                          className="text-base text-gray-300 hover:text-purple-300 transition-colors duration-300"
                        >
                          info@petalasdesonho.pt
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <span className="text-purple-300 text-2xl mt-1 group-hover:scale-110 transition-transform duration-300">📞</span>
                      <div>
                        <p className="font-semibold text-white mb-1">Telefone</p>
                        <a 
                          href="tel:+351000000000" 
                          className="text-base text-gray-300 hover:text-purple-300 transition-colors duration-300"
                        >
                          +351 xxx xxx xxx
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <span className="text-purple-300 text-2xl mt-1 group-hover:scale-110 transition-transform duration-300">🕐</span>
                      <div>
                        <p className="font-semibold text-white mb-1">Horário</p>
                        <p className="text-base text-gray-300">Seg-Sex: 10h - 19h</p>
                        <p className="text-base text-gray-300">Sáb: 10h - 14h</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Google Maps */}
                <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-2xl shadow-purple-900/20 border border-purple-900/30">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48373.53503964024!2d-8.651142499999999!3d41.1579438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd2465abc4e153c1%3A0xa648d95640b114bc!2sPorto!5e0!3m2!1spt-PT!2spt!4v1234567890123!5m2!1spt-PT!2spt"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização Pétalas de Sonho"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}