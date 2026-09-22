import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded font-medium leading-tight text-center ' +
  'transition-smooth active:translate-y-px ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0';

const VARIANTES: Record<ButtonVariant, string> = {
  primary:
    'border border-rose-700 bg-rose-700 text-surface hover:border-rose-600 hover:bg-rose-600 ' +
    'disabled:border-rose-700 disabled:bg-rose-700',
  secondary:
    // `botao-secundario` nao estiliza nada: e o gancho que permite a regra
    // `.on-plum .botao-secundario` do globals.css corrigir o contraste em
    // fundo escuro sem quem chama ter de saber em que fundo esta.
    'botao-secundario border border-rose-700 bg-transparent text-rose-700 ' +
    'hover:bg-rose-100 disabled:bg-transparent',
  ghost:
    'border border-transparent bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink ' +
    'disabled:bg-transparent disabled:text-ink-muted',
  danger:
    'border border-danger-700 bg-danger-700 text-surface hover:opacity-90 disabled:opacity-50',
};

const TAMANHOS: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-7 py-3.5',
  lg: 'px-8 py-4 text-lg',
};

/**
 * Classes do botao sem o elemento, para quando o alvo tem de ser um <Link>.
 * Um <button> dentro de um <a> e HTML invalido, por isso os CTA que navegam
 * usam isto em vez de embrulhar o componente.
 */
export function botaoClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return [BASE, VARIANTES[variant], TAMANHOS[size], fullWidth ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ');
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Desativa o botao e anuncia o estado a leitores de ecra. */
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading = false, disabled, className, children, type, ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={botaoClasses({ variant, size, fullWidth, className })}
      {...resto}
    >
      {children}
    </button>
  );
});

export default Button;
