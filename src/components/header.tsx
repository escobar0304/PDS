'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { List, ShoppingCart, User, X } from '@phosphor-icons/react';
import { useCart } from '@/contexts/CartContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/sobre-nos', label: 'Sobre Nós' },
    { href: '/catalogo', label: 'Catálogo' },
    { href: '/loja', label: 'Loja' },
  ];

  return (
    <header className="on-plum sticky top-0 z-50 border-b border-line-plum bg-plum">
      <div className="container-custom px-2 md:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo maior e menos margem lateral */}
          <Link href="/" className="flex items-center transition-smooth hover:opacity-80 pl-1 md:pl-2">
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
                className="text-surface text-lg font-medium transition-smooth hover:text-rose-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4 pr-1 md:pr-2">
            <Link
              href="/area-pessoal"
              className="p-2 text-surface hover:text-rose-300 transition-smooth"
              aria-label="Área Pessoal"
            >
              <User className="w-6 h-6 md:w-7 md:h-7" />
            </Link>
            
            <Link
              href="/carrinho"
              onClick={(e) => {
                // Continua a ser uma ligacao: sem JS, com o botao do meio ou
                // com Ctrl/Cmd abre a pagina do carrinho como sempre abriu.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                openCart();
              }}
              className="relative p-2 text-surface transition-smooth hover:text-rose-300"
              aria-label="Carrinho de Compras"
            >
              <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
              {itemCount > 0 && (
                <span className="tabular absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-700 text-xs font-semibold text-surface">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Botao do menu em telemovel */}
            <button
              className="md:hidden p-2 text-surface hover:text-rose-300 transition-smooth"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <List className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>

        {/* Menu em telemovel */}
        {mobileMenuOpen && (
          <nav className="fade-in border-t border-line-plum py-4 md:hidden">
            <div className="flex flex-col gap-1 justify-center items-center text-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-full max-w-xs rounded px-2 py-3 text-base font-medium text-surface transition-smooth hover:text-rose-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="block">{link.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}