'use client';

import { forwardRef, useId } from 'react';

const CONTROLO =
  'w-full rounded border border-line bg-surface-raised px-4 py-3 text-ink ' +
  'placeholder:text-ink-muted/70 transition-smooth ' +
  'focus:border-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-600/40 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted ' +
  'aria-[invalid=true]:border-danger-700 aria-[invalid=true]:ring-danger-700/30';

interface BaseProps {
  label: string;
  /** Texto de apoio permanente por baixo do campo. */
  hint?: string;
  /** Mensagem de erro. Marca o campo como invalido e substitui a dica. */
  error?: string;
  /** Esconde a etiqueta visualmente mas mantem-na para leitores de ecra. */
  labelOculta?: boolean;
}

function Envolucro({
  id,
  label,
  hint,
  error,
  labelOculta,
  children,
}: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={id}
        className={
          labelOculta
            ? 'sr-only'
            : 'mb-2 block text-sm font-medium text-ink'
        }
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-dica`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function descrito(id: string, hint?: string, error?: string) {
  if (error) return `${id}-erro`;
  if (hint) return `${id}-dica`;
  return undefined;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'>,
    BaseProps {
  /** Icone decorativo a abrir o campo. */
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, labelOculta, icon, className = '', ...resto },
  ref,
) {
  const reagido = useId();
  const id = resto.name ? `campo-${resto.name}` : reagido;

  return (
    <Envolucro id={id} label={label} hint={hint} error={error} labelOculta={labelOculta}>
      <div className="relative">
        {icon && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-muted"
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={descrito(id, hint, error)}
          className={`${CONTROLO} ${icon ? 'pl-10' : ''} ${className}`}
          {...resto}
        />
      </div>
    </Envolucro>
  );
});

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>,
    BaseProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, labelOculta, className = '', ...resto },
  ref,
) {
  const reagido = useId();
  const id = resto.name ? `campo-${resto.name}` : reagido;

  return (
    <Envolucro id={id} label={label} hint={hint} error={error} labelOculta={labelOculta}>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descrito(id, hint, error)}
        className={`${CONTROLO} resize-y ${className}`}
        {...resto}
      />
    </Envolucro>
  );
});

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'>,
    BaseProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, labelOculta, className = '', children, ...resto },
  ref,
) {
  const reagido = useId();
  const id = resto.name ? `campo-${resto.name}` : reagido;

  return (
    <Envolucro id={id} label={label} hint={hint} error={error} labelOculta={labelOculta}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={descrito(id, hint, error)}
        className={`${CONTROLO} cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.875rem_center] bg-no-repeat pr-10 ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23705c61' stroke-width='1.5'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        }}
        {...resto}
      >
        {children}
      </select>
    </Envolucro>
  );
});
