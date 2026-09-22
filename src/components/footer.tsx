'use client';

import Link from 'next/link';
import Logotipo from '@/components/marca';
import { Envelope, FacebookLogo, InstagramLogo, MapPin, Phone } from '@phosphor-icons/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { href: '/privacidade', label: 'Política de Privacidade' },
    { href: '/termos', label: 'Termos e Condições' },
    { href: '/cookies', label: 'Cookies' },
    { href: 'https://www.livroreclamacoes.pt', label: 'Livro de Reclamações' },
    { href: '/envios', label: 'Envios e Devoluções' },
    { href: '/faq', label: 'Perguntas Frequentes' },
    { href: '/contacto', label: 'Contactos' },
  ];

  return (
    <footer className="on-plum bg-plum text-surface">
      <div className="container-custom py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Brand Section */}
          <div>
            <Logotipo className="mb-5 text-[26px] text-rose-200" />
            <p className="text-sm text-rose-200 leading-relaxed">
              A sua jornada espiritual começa aqui. Descubra pedras preciosas e cristais autênticos.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-rose-300">
              Informações Legais
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="block py-1 text-sm text-rose-200 transition-smooth hover:text-surface"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-rose-300">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-rose-200">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Porto, Portugal</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-rose-200">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+351000000000"
                  className="inline-block py-1 transition-smooth hover:text-surface"
                >
                  +351 xxx xxx xxx
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-rose-200">
                <Envelope className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:info@petalasdesonho.pt"
                  className="inline-block break-all py-1 transition-smooth hover:text-surface"
                >
                  info@petalasdesonho.pt
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-rose-300">
              Siga-nos
            </h3>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/petalasdesonho/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-200 hover:text-surface transition-smooth"
                aria-label="Instagram"
              >
                <InstagramLogo className="w-6 h-6" />
              </a>
              <a
                href="https://www.facebook.com/PetalasDeSonho"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-200 hover:text-surface transition-smooth"
                aria-label="Facebook"
              >
                <FacebookLogo className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-line-plum pt-6">
          <div className="flex justify-center items-center">
            <p className="text-xs md:text-sm text-rose-200 text-center">
              © {currentYear} Pétalas de Sonho. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}