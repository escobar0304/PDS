// src/lib/env.ts
//
// Ate aqui lib/db.ts e lib/mongodb.ts faziam `throw` no topo do modulo quando
// faltava MONGODB_URI. Isso rebentava o `next build` a meio da recolha de dados
// das paginas, com um stack trace que nao dizia o que fazer.
//
// Aqui a validacao e preguicosa: o erro so acontece quando a variavel e mesmo
// precisa, e diz o que fazer.

/** Variaveis sem as quais a aplicacao nao funciona em producao. */
export const REQUIRED_ENV = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const;

/** Variaveis que activam funcionalidades opcionais. */
export const OPTIONAL_ENV = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'ADMIN_EMAIL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'SITE_INDEXAVEL',
] as const;

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(
      `Variável de ambiente em falta: ${name}. ` +
        `Copia .env.example para .env.local e preenche-a.`
    );
    this.name = 'MissingEnvError';
  }
}

/** Le uma variavel obrigatoria. Lanca no momento do uso, nao no import. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new MissingEnvError(name);
  }
  return value;
}

/** Le uma variavel opcional. */
export function optionalEnv(name: string, fallback = ''): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : fallback;
}

/** Devolve os nomes das variaveis obrigatorias que faltam. */
export function missingEnv(
  names: readonly string[] = REQUIRED_ENV,
  source: Record<string, string | undefined> = process.env
): string[] {
  return names.filter((name) => {
    const value = source[name];
    return !value || value.trim() === '';
  });
}
