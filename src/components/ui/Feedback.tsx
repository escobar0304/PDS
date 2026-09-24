'use client';

import { CameraSlash, CheckCircle, Info, WarningCircle } from '@phosphor-icons/react';

export type AlertTone = 'erro' | 'sucesso' | 'info';

const TONS: Record<AlertTone, { caixa: string; Icone: typeof Info }> = {
  erro: {
    caixa: 'border-danger-700/25 bg-danger-100 text-danger-700',
    Icone: WarningCircle,
  },
  sucesso: {
    caixa: 'border-sage-600/25 bg-sage-100 text-sage-600',
    Icone: CheckCircle,
  },
  info: {
    caixa: 'border-line bg-surface-sunken text-ink-muted',
    Icone: Info,
  },
};

export function Alert({
  tone = 'erro',
  children,
  action,
  className = '',
}: {
  tone?: AlertTone;
  children: React.ReactNode;
  /** Accao de recuperacao, por exemplo tentar outra vez. */
  action?: React.ReactNode;
  className?: string;
}) {
  const { caixa, Icone } = TONS[tone];

  return (
    <div
      role={tone === 'erro' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-lg border p-4 ${caixa} ${className}`}
    >
      <Icone className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="flex-1 text-sm">
        {children}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export function Spinner({
  label = 'A carregar',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div role="status" className={`flex justify-center py-8 ${className}`}>
      <div className="loading" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Anuncia uma mudanca de estado a quem usa leitor de ecra, sem ocupar ecra.
 *
 * Os esqueletos sao `aria-hidden` de proposito: uma grelha de rectangulos
 * cinzentos nao tem nada para dizer. Mas isso deixava a pagina muda — quem
 * nao ve o esqueleto nao sabia que estava a carregar, nem que tinha acabado.
 *
 * E o criterio 4.1.3 da WCAG 2.1, nivel AA, e o `axe` nao o apanha: nao ha
 * como uma ferramenta adivinhar que um texto e uma mensagem de estado. Por
 * isso o guarda esta em `src/lib/__tests__/estados.test.ts`, nao no `axe`.
 *
 * `role="status"` traz `aria-live="polite"` implicito: espera que a pessoa
 * acabe o que esta a fazer em vez de a interromper a meio.
 *
 * Quando o texto do estado ja e visivel na pagina — como o contador de
 * resultados da loja — nao se usa isto; poe-se `role="status"` nesse
 * proprio elemento, senao a frase e anunciada duas vezes.
 */
export function AnuncioEstado({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-surface-sunken ${className}`} />;
}

/** Esqueleto com a forma de um cartao de produto, para a grelha da loja. */
export function SkeletonCartao() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-raised">
      <Skeleton className="h-64 rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-7 w-1/3" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised px-6 py-16 text-center">
      {icon && (
        <div className="mb-5 flex justify-center text-ink-muted/60" aria-hidden>
          {icon}
        </div>
      )}
      <p className="font-serif text-xl text-ink">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * No lugar da fotografia que falta. Ate 24/09/2026 era uma fotografia do
 * Unsplash de um cristal qualquer: numa loja de pecas unicas, e mostrar como
 * "a peca" uma pedra que nao e ela (DL 57/2008). Sem fotografia, diz-se que
 * nao ha.
 */
export function SemFotografia() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-sunken text-ink-muted">
      <CameraSlash className="h-8 w-8" aria-hidden />
      <span className="text-sm">Sem fotografia</span>
    </div>
  );
}
