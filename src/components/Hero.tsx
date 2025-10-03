'use client';

import Image from 'next/image';
import Link from 'next/link';

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

  const overlayClasses = {
    light: 'bg-black bg-opacity-20',
    medium: 'bg-black bg-opacity-40',
    dark: 'bg-black bg-opacity-60',
  };

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
        <div className={`absolute inset-0 ${overlayClasses[overlay]}`}></div>
      </div>
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <div className="max-w-4xl fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-4 md:mb-6 leading-tight">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 md:mb-8 font-light max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
          
          {showCta && (
            <Link 
              href={ctaLink} 
              className="btn-primary inline-block text-sm md:text-base"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}