'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/', label: 'Início' },
    { href: '/sobre-nos', label: 'Sobre Nós' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/loja', label: 'Loja' },
  ];

  const legalLinks = [
    { href: '/termos', label: 'Termos e Condições' },
    { href: '/privacidade', label: 'Política de Privacidade' },
  ];

  return (
    <footer className="bg-[#000414] text-white">
      <div className="container-custom py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-8 h-8">
                <Image
                  src="/images/logo-icon.svg"
                  alt="Pétalas de Sonho"
                  fill
                  className="object-contain brightness-0 invert"
                />
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Sua jornada espiritual começa aqui. Descubra pedras preciosas e cristais autênticos.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4 text-[#d4af37]">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
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
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-smooth"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-smooth"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2 text-gray-300">Newsletter</h4>
              <form className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Seu email"
                  className="flex-1 px-3 py-2 text-sm bg-[#3a3a3a] border border-gray-600 rounded-md focus:outline-none focus:border-[#d4af37] transition-smooth"
                  aria-label="Email para newsletter"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#4a1e5c] hover:bg-[#6b2d7f] rounded-md transition-smooth font-medium"
                >
                  Inscrever
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs md:text-sm text-gray-400 text-center md:text-left">
              © {currentYear} Pétalas de Sonho. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs md:text-sm text-gray-400 hover:text-white transition-smooth"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}