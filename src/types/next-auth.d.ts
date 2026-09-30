// src/types/next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      /** Declarou ter 18 anos ou mais. Ver `maioridadeDeclaradaEm`. */
      maior: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: string;
    versaoSessao?: number;
    maior?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: string;
    /** A `versaoSessao` da conta quando a pessoa entrou. */
    versao?: number;
    maior?: boolean;
  }
}