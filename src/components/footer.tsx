'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { href: '/privacidade', label: 'Política de Privacidade' },
    { href: '/termos', label: 'Termos e Condições' },
    { href: 'https://www.livroreclamacoes.pt', label: 'Livro de Reclamações' },
    { href: '/envios', label: 'Envios e Devoluções' },
    { href: '/faq', label: 'Perguntas Frequentes' },
    { href: '/contacto', label: 'Contactos' },
  ];

  return (
    <footer className="bg-[#000414] text-white">
      <div className="container-custom py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-0 mb-0">
              <div className="relative w-36 h-36 md:w-40 md:h-40">
                <Image
                  src="/images/logo-icon.svg"
                  alt="Pétalas de Sonho"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              A sua jornada espiritual começa aqui. Descubra pedras preciosas e cristais autênticos.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 text-[#d4af37]">
              Informações Legais
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-sm text-gray-400 hover:text-white transition-smooth block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 text-[#d4af37]">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Porto, Portugal</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+351000000000"
                  className="hover:text-white transition-smooth"
                >
                  +351 xxx xxx xxx
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:info@petalasdesonho.pt"
                  className="hover:text-white transition-smooth break-all"
                >
                  info@petalasdesonho.pt
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 text-[#d4af37]">
              Siga-nos
            </h3>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/petalasdesonho/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-smooth"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://www.facebook.com/PetalasDeSonho"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-smooth"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-6 border-t border-gray-700">
          <div className="flex justify-center items-center">
            <p className="text-xs md:text-sm text-gray-400 text-center">
              © {currentYear} Pétalas de Sonho. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}