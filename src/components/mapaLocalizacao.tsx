'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from '@phosphor-icons/react';
import { botaoClasses } from '@/components/ui/Button';
import { EVENTO_PREFERENCIAS, mapaPermitido } from '@/lib/preferencias';

/**
 * Mapa que so contacta a Google depois de a pessoa pedir.
 *
 * Um <iframe> do Google Maps e um pedido a um terceiro: assim que a pagina
 * carrega, o browser contacta a Google antes de a pessoa dizer o que quer que
 * seja. Nao e um cookie do site, e por isso escapa a auditorias que so olham
 * para `document.cookie`, mas a Diretiva ePrivacy nao distingue pela origem.
 *
 * O aviso aqui e curto de proposito. Quem esta nesta pagina quer ver onde
 * fica a loja, nao ler sobre tratamento de dados; a explicacao inteira, e o
 * interruptor para ligar isto de vez, estao em /cookies.
 */
export default function MapaLocalizacao({
  titulo = 'Localização Pétalas de Sonho',
  src,
}: {
  titulo?: string;
  /** URL de incorporacao do mapa. */
  src: string;
}) {
  // Comeca sempre em false: o servidor nao sabe o que esta guardado no
  // browser, e assumir que sim daria uma diferenca de hidratacao — alem de
  // carregar o mapa durante um instante a quem nao o quer.
  const [permitido, setPermitido] = useState(false);
  const [sessao, setSessao] = useState(false);

  useEffect(() => {
    const ler = () => setPermitido(mapaPermitido());
    ler();
    window.addEventListener(EVENTO_PREFERENCIAS, ler);
    window.addEventListener('storage', ler);
    return () => {
      window.removeEventListener(EVENTO_PREFERENCIAS, ler);
      window.removeEventListener('storage', ler);
    };
  }, []);

  if (permitido || sessao) {
    return (
      <div className="relative h-64 overflow-hidden rounded-lg shadow-medium md:h-80">
        <iframe
          src={src}
          title={titulo}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border border-line bg-surface-sunken px-6 text-center md:h-80">
      <MapPin className="h-8 w-8 text-ink-muted" aria-hidden />
      <div>
        <p className="font-medium text-ink">Onde estamos</p>
        <p className="mt-1 text-sm text-ink-muted">Mapa fornecido pela Google.</p>
      </div>
      <button
        type="button"
        onClick={() => setSessao(true)}
        className={botaoClasses({ variant: 'secondary', size: 'sm' })}
      >
        Ver o mapa
      </button>
      <Link href="/cookies" className="text-xs text-ink-muted underline hover:text-rose-700">
        Mostrar sempre
      </Link>
    </div>
  );
}
