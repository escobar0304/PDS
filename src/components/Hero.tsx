'use client';

import Image from 'next/image';
import Link from 'next/link';
import { botaoClasses } from '@/components/ui/Button';

interface HeroProps {
  title: string;
  subtitle?: string;
  imageSrc: string;
  imageAlt: string;
  height?: 'small' | 'medium' | 'large' | 'full';
  ctaText?: string;
  ctaLink?: string;
  showCta?: boolean;
  overlay?: 'light' | 'medium' | 'dark';
}

export default function Hero({
  title,
  subtitle,
  imageSrc,
  imageAlt,
  height = 'full',
  ctaText = 'Saber Mais',
  ctaLink = '#',
  showCta = true,
  overlay = 'medium',
}: HeroProps) {
  const heightClasses = {
    small: 'h-[40vh] sm:h-[50vh]',
    medium: 'h-[60vh] sm:h-[70vh]',
    large: 'h-[70vh] sm:h-[80vh] md:h-[90vh]',
    full: 'h-[70vh] sm:h-[80vh] md:h-screen',
  };

  // Duas camadas em vez de uma lavagem preta uniforme.
  //
  // A primeira e um veu leve em ameixa, que assenta a fotografia no resto do
  // site sem a acinzentar. A segunda e uma vinheta concentrada atras do texto:
  // o titulo e o subtitulo ficam ao centro, muitas vezes sobre a zona mais
  // clara da imagem, e texto claro sobre pedra clara nao se le.
  //
  // O valor de 0.82 nao e arbitrario. Para #fbfaf4 passar 4.5:1 sobre uma
  // pedra de luminancia ~0.85, a opacidade do veu tem de chegar a 0.82. Nas
  // margens desvanece e a fotografia volta a aparecer inteira.
  const veuBase = {
    light: 'bg-plum/15',
    medium: 'bg-plum/25',
    dark: 'bg-plum/40',
  };

  const vinheta =
    'bg-[radial-gradient(ellipse_75%_55%_at_50%_50%,rgb(42_25_29/0.82)_0%,rgb(42_25_29/0.55)_45%,transparent_78%)]';

  return (
    <section className={`relative ${heightClasses[height]}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div aria-hidden className={`absolute inset-0 ${veuBase[overlay]}`} />
        <div aria-hidden className={`absolute inset-0 ${vinheta}`} />
      </div>
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif text-surface mb-4 md:mb-6 leading-tight">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-surface mb-6 md:mb-8 font-light max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          
          {showCta && (
            <Link 
              href={ctaLink} 
              className={botaoClasses({ className: 'text-sm md:text-base' })}
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}