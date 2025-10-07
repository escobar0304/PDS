'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  height?: 'small' | 'medium' | 'large' | 'full';
  showCta?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

export default function Hero({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  height = 'large',
  showCta = true,
  ctaText = 'Descobrir Mais',
  ctaLink = '/loja'
}: HeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const heightClasses = {
    small: 'h-[50vh]',
    medium: 'h-[60vh] sm:h-[70vh]',
    large: 'h-[70vh] sm:h-[80vh]',
    full: 'h-[70vh] sm:h-[80vh] md:h-screen'
  };

  return (
    <section className={`relative ${heightClasses[height]}`}>
      <div className="relative w-full h-full">
        {/* Background Image */}
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
          quality={90}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4 z-20">
          <div className={`max-w-4xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
              {title.split(' ').map((word, index) => {
                // Procura por palavras que devem ser roxas (última palavra ou palavras específicas)
                const purpleWords = ['Produtos', 'Catálogo', 'Nós', 'Categorias'];
                const isPurple = purpleWords.some(pw => word.includes(pw));
                
                return (
                  <span key={index}>
                    {isPurple ? (
                      <span className="text-purple-300">{word}</span>
                    ) : (
                      word
                    )}{' '}
                  </span>
                );
              })}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 font-light max-w-2xl mx-auto">
              {subtitle}
            </p>
            {showCta && (
              <Link
                href={ctaLink}
                className="inline-block border-2 border-white/80 text-white px-10 py-3 rounded-lg text-lg font-medium transition-all duration-300 hover:bg-white hover:text-[#000414] hover:border-white hover:shadow-lg hover:shadow-purple-500/30"
              >
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}