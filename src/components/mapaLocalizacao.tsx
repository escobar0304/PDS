'use client';

import { useEffect, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { botaoClasses } from '@/components/ui/Button';
import {
  definirMapaPermitido,
  EVENTO_PREFERENCIAS,
  mapaPermitido,
} from '@/lib/preferencias';

/**
 * Mapa que so contacta a Google depois de a pessoa pedir.
 *
 * Um <iframe> do Google Maps e um pedido a um terceiro: assim que a pagina
 * carrega, o browser contacta a Google antes de a pessoa dizer o que quer que
 * seja. Nao e um cookie do site, e por isso escapa a auditorias que so olham
 * para `document.cookie`, mas a Diretiva ePrivacy nao distingue pela origem.
 *
 * A escolha vive aqui, e nao so num painel de definicoes, por duas razoes.
 *
 * A primeira e legal: consentimento tem de ser informado, e so e informado
 * quando a pessoa sabe do que se trata. Aqui esta a olhar para o sitio do
 * mapa. Num aviso a entrada do site estaria a decidir sobre uma pagina que
 * ainda nao viu e que talvez nunca veja.
 *
 * A segunda e pratica: retirar tem de ser tao facil como dar. Quando o mapa
 * aparece por preferencia guardada, a linha por baixo desliga-a num clique,
 * no mesmo sitio onde foi ligada. O interruptor em /cookies continua a
 * existir como ponto permanente, ligado do rodape.
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
  const [lembrar, setLembrar] = useState(false);

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

  const mostrar = () => {
    if (lembrar) definirMapaPermitido(true);
    setSessao(true);
  };

  if (permitido || sessao) {
    return (
      <div>
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

        {permitido && (
          <p className="mt-2 text-xs text-ink-muted">
            O mapa está a aparecer sempre.{' '}
            <button
              type="button"
              onClick={() => {
                definirMapaPermitido(false);
                setSessao(false);
              }}
              className="underline transition-smooth hover:text-rose-700"
            >
              Deixar de mostrar
            </button>
          </p>
        )}
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
        onClick={mostrar}
        className={botaoClasses({ variant: 'secondary', size: 'sm' })}
      >
        Ver o mapa
      </button>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
        <input
          type="checkbox"
          checked={lembrar}
          onChange={(e) => setLembrar(e.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer rounded-sm border-line text-rose-700 focus:ring-2 focus:ring-rose-600/40"
        />
        Mostrar sempre, sem perguntar
      </label>
    </div>
  );
}
