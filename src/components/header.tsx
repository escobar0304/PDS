'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/sobre-nos', label: 'Sobre Nós' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/loja', label: 'Loja' },
  ];

  return (
    <header className="bg-[#000414] shadow-lg shadow-purple-900/20 sticky top-0 z-50 border-b border-purple-900/30">
      <div className="container-custom px-2 md:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center transition-all duration-300 hover:opacity-80 hover:scale-105 pl-1 md:pl-2"
          >
            <div className="relative w-32 h-32 md:w-36 md:h-36">
              <Image
                src="/images/logo-icon.svg"
                alt="Pétalas de Sonho"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white text-lg font-medium transition-all duration-300 hover:text-purple-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4 pr-1 md:pr-2">
            <Link
              href="/area-pessoal"
              className="p-2 text-white hover:text-purple-300 transition-all duration-300 hover:scale-110"
              aria-label="Área Pessoal"
            >
              <User className="w-6 h-6 md:w-7 md:h-7" />
            </Link>
           
            <Link
              href="/carrinho"
              className="p-2 text-white hover:text-purple-300 transition-all duration-300 hover:scale-110 relative"
              aria-label="Carrinho de Compras"
            >
              <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-white hover:text-purple-300 transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-6 border-t border-purple-900/30 bg-[#000414]">
            <div className="flex flex-col gap-2 justify-center items-center text-center">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-full max-w-xs text-base font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:bg-purple-900/20 hover:text-purple-300 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    animation: `fadeInSlide 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  <span className="block">{link.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}