'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/sobre-nos', label: 'Sobre Nós' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/loja', label: 'Loja' },
  ];

  return (
    <header className="bg-[#000414] shadow-sm sticky top-0 z-50">
      <div className="container-custom px-2 md:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo maior e menos margem lateral */}
          <Link href="/" className="flex items-center transition-smooth hover:opacity-80 pl-1 md:pl-2">
            <div className="relative w-40 h-16 md:w-48 md:h-20">
              <Image
                src="/images/logo-icon.svg"
                alt="Pétalas de Sonho"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Links centrados */}
          <nav className="hidden md:flex flex-1 justify-center items-center">
            <div className="flex gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium transition-smooth px-2 py-1 rounded"
                >
                  <span
                    className={
                      pathname === link.href
                        ? 'text-[#ffffbd] font-bold' // Apenas cor da palavra ativa
                        : 'hover:text-[#ffffbd] transition-smooth'
                    }
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Icons com menos margem lateral */}
          <div className="flex items-center gap-4 pr-1 md:pr-2">
            <Link
              href="/area-pessoal"
              className="p-2 text-[#fffce6] hover:text-[#ffffbd] transition-smooth"
              aria-label="Área Pessoal"
            >
              <User className="w-6 h-6 md:w-7 md:h-7" />
            </Link>
            
            <Link
              href="/carrinho"
              className="p-2 text-[#fffce6] hover:text-[#ffffbd] transition-smooth relative"
              aria-label="Carrinho de Compras"
            >
              <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#ffffbd] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-[#fffce6] hover:text-[#ffffbd] transition-smooth"
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
          <nav className="md:hidden py-4 border-t border-gray-100 fade-in">
            <div className="flex flex-col gap-1 justify-center items-center text-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-full max-w-xs text-base font-medium py-3 px-2 rounded-lg transition-smooth"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span
                    className={
                      pathname === link.href
                        ? 'text-[#ffffbd] font-bold'
                        : 'hover:text-[#ffffbd] transition-smooth'
                    }
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}