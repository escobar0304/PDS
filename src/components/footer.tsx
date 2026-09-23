'use client';

import Link from 'next/link';
import Logotipo from '@/components/marca';
import { LIVRO_RECLAMACOES, paginasDisponiveis } from '@/lib/paginas';
import { EMPRESA, moradaFormatada } from '@/lib/empresa';
import { DESCRICAO_SITIO } from '@/lib/afirmacoes';
import { Envelope, FacebookLogo, InstagramLogo, MapPin, Phone } from '@phosphor-icons/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // So o que existe. Ate aqui o rodape ligava para quatro paginas que nao
  // existiam: quatro 404 em todas as paginas do site. Ver `src/lib/paginas.ts`
  // para as que faltam e porque.
  const legalLinks = [
    ...paginasDisponiveis().map((p) => ({ href: p.href, label: p.rotulo })),
    { href: LIVRO_RECLAMACOES.href, label: LIVRO_RECLAMACOES.rotulo },
    // Lei 144/2015, art. 18: a entidade de resolucao alternativa de litigios
    // tem de estar acessivel. Vai para a explicacao em /contacto, e nao
    // diretamente para o sitio da entidade, porque o nome sozinho nao diz a
    // ninguem para que serve.
    ...(EMPRESA.entidadeRal ? [{ href: '/contacto#litigios', label: 'Resolução de litígios' }] : []),
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
              {DESCRICAO_SITIO}
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
            {/*
              Le de `src/lib/empresa.ts`, como a pagina de contactos. Tinha
              aqui `+351 xxx xxx xxx` e `tel:+351000000000` escritos a mao —
              um numero a fingir que chegou a producao. O que falta diz que
              falta; nao se inventa.
            */}
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-rose-200">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
                <span>{moradaFormatada() ?? 'Morada por preencher'}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-rose-200">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
                {EMPRESA.telefone ? (
                  <a
                    href={`tel:${EMPRESA.telefone.replace(/\s/g, '')}`}
                    className="inline-block py-1 transition-smooth hover:text-surface"
                  >
                    {EMPRESA.telefone}
                  </a>
                ) : (
                  <span className="py-1">Telefone por preencher</span>
                )}
              </li>
              <li className="flex items-start gap-2 text-sm text-rose-200">
                <Envelope className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
                {EMPRESA.email ? (
                  <a
                    href={`mailto:${EMPRESA.email}`}
                    className="inline-block break-all py-1 transition-smooth hover:text-surface"
                  >
                    {EMPRESA.email}
                  </a>
                ) : (
                  <span className="py-1">Email por preencher</span>
                )}
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