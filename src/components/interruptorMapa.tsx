'use client';

import { useEffect, useState } from 'react';
import {
  definirMapaPermitido,
  EVENTO_PREFERENCIAS,
  mapaPermitido,
} from '@/lib/preferencias';

/**
 * Liga e desliga o mapa da Google em Sobre Nos.
 *
 * O mesmo controlo da e retira a escolha, no mesmo sitio, com o mesmo peso
 * visual — que e o que a lei pede e o que a maioria dos paineis de cookies
 * falha, ao esconder o "rejeitar" num canto. Comeca desligado.
 */
export default function InterruptorMapa() {
  const [ligado, setLigado] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const ler = () => setLigado(mapaPermitido());
    ler();
    setMontado(true);
    window.addEventListener(EVENTO_PREFERENCIAS, ler);
    return () => window.removeEventListener(EVENTO_PREFERENCIAS, ler);
  }, []);

  const alternar = () => {
    const novo = !ligado;
    setLigado(novo);
    definirMapaPermitido(novo);
  };

  return (
    <div className="flex items-start justify-between gap-6 rounded-lg border border-line bg-surface-raised p-5">
      <div>
        <p id="rotulo-mapa" className="font-medium text-ink">
          Mostrar sempre o mapa
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Com isto ligado, o mapa da loja aparece logo em Sobre Nós, sem ter de
          carregar no botão de cada vez. Pode desligar aqui a qualquer momento.
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby="rotulo-mapa"
        onClick={alternar}
        disabled={!montado}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-smooth focus:outline-none focus:ring-2 focus:ring-rose-600/40 focus:ring-offset-2 focus:ring-offset-surface-raised disabled:opacity-50 ${
          ligado ? 'bg-sage-600' : 'bg-line'
        }`}
      >
        <span
          aria-hidden
          className={`block h-5 w-5 rounded-full bg-surface-raised shadow-soft transition-transform duration-200 ${
            ligado ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">{ligado ? 'Ligado' : 'Desligado'}</span>
      </button>
    </div>
  );
}
