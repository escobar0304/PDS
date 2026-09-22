'use client';

import { useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { botaoClasses } from '@/components/ui/Button';

/**
 * Mapa que so contacta a Google depois de a pessoa pedir.
 *
 * Um <iframe> do Google Maps e um pedido a um terceiro: assim que a pagina
 * carrega, o browser contacta a Google, que recebe o IP, o referer e pode
 * colocar cookies — tudo antes de a pessoa dizer o que quer que seja. Nao e
 * um cookie do site, e por isso passa despercebido em auditorias que so olham
 * para `document.cookie`, mas a Diretiva ePrivacy nao distingue: o que conta
 * e o acesso ao equipamento do utilizador.
 *
 * A alternativa habitual e um banner de consentimento. Aqui nao e preciso:
 * este e o unico terceiro do site, e pedir por ele uma vez, no sitio onde
 * esta, custa menos a quem visita do que uma barra em todas as paginas.
 *
 * A escolha nao e guardada de proposito. Guarda-la exigia consentimento
 * informado e um sitio onde o retirar — ou seja, exigia o banner que esta
 * decisao evita.
 */
export default function MapaLocalizacao({
  titulo = 'Localização Pétalas de Sonho',
  src,
}: {
  titulo?: string;
  /** URL de incorporacao do mapa. */
  src: string;
}) {
  const [carregado, setCarregado] = useState(false);

  if (carregado) {
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
        <p className="font-medium text-ink">Mapa da localização</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          O mapa é fornecido pela Google. Ao carregar, o seu endereço IP é enviado
          para a Google, que pode guardar informação no seu equipamento.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setCarregado(true)}
        className={botaoClasses({ variant: 'secondary', size: 'sm' })}
      >
        Carregar o mapa
      </button>
    </div>
  );
}
