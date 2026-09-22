// src/app/api/auth/[...nextauth]/route.ts
//
// No App Router do Next 14 um ficheiro de rota so pode exportar handlers HTTP.
// As opcoes vivem em src/lib/auth.ts para poderem ser reutilizadas por
// getServerSession sem partir o build.
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
