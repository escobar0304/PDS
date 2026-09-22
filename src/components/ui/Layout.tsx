export function Container({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`container-custom ${className}`}>{children}</div>;
}

export type SectionTone = 'surface' | 'sunken' | 'plum';

const TONS: Record<SectionTone, string> = {
  surface: 'bg-surface',
  sunken: 'bg-surface-sunken',
  plum: 'on-plum bg-plum text-surface',
};

/**
 * Ritmo vertical unico do site. Antes havia py-12, py-16, py-20 e py-24
 * misturados sem criterio; aqui ha tres degraus e uma razao para cada um.
 */
export function Section({
  tone = 'surface',
  size = 'md',
  children,
  className = '',
  ...resto
}: {
  tone?: SectionTone;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const espaco = { sm: 'py-10', md: 'py-16', lg: 'py-24' }[size];

  return (
    <section className={`${TONS[tone]} ${espaco} ${className}`} {...resto}>
      <Container>{children}</Container>
    </section>
  );
}

/** Titulo de pagina com subtitulo opcional. Mantem o h1 unico e consistente. */
export function PageHeader({
  title,
  lead,
  align = 'center',
  className = '',
}: {
  title: string;
  lead?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
      <h1 className="font-serif text-3xl text-rose-700 md:text-4xl">{title}</h1>
      {lead && (
        <p className={`mt-3 text-ink-muted ${align === 'center' ? 'mx-auto max-w-xl' : 'max-w-xl'}`}>
          {lead}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Acrescenta a resposta de bordo usada nos cartoes que sao ligacoes. */
  interactive?: boolean;
}) {
  return (
    <div
      className={
        `rounded-lg border border-line bg-surface-raised ` +
        (interactive ? 'transition-smooth hover:border-rose-300 ' : '') +
        className
      }
    >
      {children}
    </div>
  );
}

export type BadgeTone = 'rose' | 'neutro' | 'sucesso' | 'perigo';

const BADGE: Record<BadgeTone, string> = {
  rose: 'bg-rose-200 text-rose-900',
  neutro: 'bg-surface-sunken text-ink-muted',
  sucesso: 'bg-sage-100 text-sage-600',
  perigo: 'bg-danger-100 text-danger-700',
};

export function Badge({
  tone = 'rose',
  children,
  className = '',
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium ${BADGE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
