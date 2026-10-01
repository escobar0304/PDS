'use client';

import Link from 'next/link';
import Logotipo from '@/components/marca';
import { LIVRO_RECLAMACOES, paginasDisponiveis } from '@/lib/paginas';
import { EMPRESA, moradaFormatada } from '@/lib/empresa';
import { DESCRICAO_SITIO } from '@/lib/afirmacoes';
import { Envelope, FacebookLogo, InstagramLogo, MapPin, Phone } from '@phosphor-icons/react';

const ligacao = 'inline-block py-1 text-sm text-ink-muted transition-smooth hover:text-rose-700';

/**
 * O rodape. Na mesma superficie da pagina, um tom abaixo: uma pagina tem um
 * so tema, e uma faixa escura no fim era a pagina a mudar de casa.
 */
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
    <footer className="border-t border-line bg-surface-sunken">
      <div className="container-custom py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logotipo lettering="tinta" className="text-[28px]" />
            <p className="mt-6 max-w-sm font-serif text-2xl leading-snug text-ink">{DESCRICAO_SITIO}</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-7">
            <div className="sm:col-span-2">
              <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-ink">Informações legais</h2>
              <ul className="grid gap-x-8 sm:grid-cols-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className={ligacao}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-ink">Contacto</h2>
                {/*
                  Le de `src/lib/empresa.ts`, como a pagina de contactos. Tinha
                  aqui `+351 xxx xxx xxx` e `tel:+351000000000` escritos a mao —
                  um numero a fingir que chegou a producao. O que falta diz que
                  falta; nao se inventa.
                */}
                <ul className="space-y-1 text-sm text-ink-muted">
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-1.5 h-4 w-4 shrink-0" aria-hidden />
                    <span className="py-1">{moradaFormatada() ?? 'Morada por preencher'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="mt-1.5 h-4 w-4 shrink-0" aria-hidden />
                    {EMPRESA.telefone ? (
                      <a href={`tel:${EMPRESA.telefone.replace(/\s/g, '')}`} className={ligacao}>
                        {EMPRESA.telefone}
                      </a>
                    ) : (
                      <span className="py-1">Telefone por preencher</span>
                    )}
                  </li>
                  <li className="flex items-start gap-2">
                    <Envelope className="mt-1.5 h-4 w-4 shrink-0" aria-hidden />
                    {EMPRESA.email ? (
                      <a href={`mailto:${EMPRESA.email}`} className={`${ligacao} break-all`}>
                        {EMPRESA.email}
                      </a>
                    ) : (
                      <span className="py-1">Email por preencher</span>
                    )}
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal text-ink">Siga-nos</h2>
                <div className="flex gap-2">
                  <a
                    href="https://www.instagram.com/petalasdesonho/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded border border-line text-ink transition-smooth hover:border-rose-700 hover:text-rose-700"
                    aria-label="Instagram"
                  >
                    <InstagramLogo className="h-5 w-5" />
                  </a>
                  <a
                    href="https://www.facebook.com/PetalasDeSonho"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded border border-line text-ink transition-smooth hover:border-rose-700 hover:text-rose-700"
                    aria-label="Facebook"
                  >
                    <FacebookLogo className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-14 border-t border-line pt-6 text-xs text-ink-muted">
          © {currentYear} Pétalas de Sonho. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
