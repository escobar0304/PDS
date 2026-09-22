// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { verify as argon2Verify } from 'argon2';
import { consumir } from '@/lib/limites';
import { esquemaCredenciais } from '@/lib/validacao';

/** Mensagem unica para credenciais erradas, seja qual for a metade que falhou. */
const CREDENCIAIS_INVALIDAS = 'Email ou password incorretos';

const LIMITE_ENTRADA_IP = { max: 10, janelaMs: 15 * 60 * 1000 };
const LIMITE_ENTRADA_CONTA = { max: 5, janelaMs: 15 * 60 * 1000 };

/**
 * Hash descartavel, usado quando a conta nao existe, para o tempo de resposta
 * nao denunciar a diferenca. Corresponde a uma password aleatoria que nunca
 * foi atribuida a ninguem.
 */
const HASH_INEXISTENTE =
  '$argon2id$v=19$m=65536,t=3,p=4$c2FsdGVkc2FsdGVkc2FsdA$8pTfL9VYfvGZ3LrXKkLvVYQqf1ZPZ0rB3xQwLxX7tKo';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Email/Password Provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, pedido) {
        // Validacao de esquema, nao de presenca. `credentials` vem do corpo
        // do pedido e pode trazer objectos: `{"email": {"$ne": null}}` passa
        // num `if (!credentials.email)` e transforma a consulta seguinte em
        // "devolve-me um utilizador qualquer".
        const v = esquemaCredenciais.safeParse(credentials);
        if (!v.success) {
          throw new Error(CREDENCIAIS_INVALIDAS);
        }
        const { email, password } = v.data;

        const ip = pedido?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ?? 'desconhecido';
        const porIp = consumir(`entrada:ip:${ip}`, LIMITE_ENTRADA_IP);
        const porConta = consumir(`entrada:conta:${email}`, LIMITE_ENTRADA_CONTA);
        if (!porIp.permitido || !porConta.permitido) {
          throw new Error('Demasiadas tentativas. Tente mais tarde.');
        }

        await connectDB();

        const user = await User.findOne({ email });

        // Verificar sempre, mesmo sem utilizador.
        //
        // Sem isto ha dois canais a dizer se a conta existe: a mensagem de
        // erro, e o tempo de resposta — nao existindo, respondia-se de
        // imediato; existindo, esperava-se pelo argon2. Verificar contra um
        // hash de referencia gasta o mesmo tempo nos dois casos.
        const hashParaVerificar = user?.password ?? HASH_INEXISTENTE;

        let passwordCorreta = false;
        try {
          passwordCorreta = hashParaVerificar.startsWith('$2')
            ? await bcrypt.compare(password, hashParaVerificar)
            : await argon2Verify(hashParaVerificar, password);
        } catch {
          passwordCorreta = false;
        }

        // Uma mensagem so para os dois casos: dizer qual deles falhou entrega
        // a lista de emails com conta a quem estiver a sondar.
        if (!user || !passwordCorreta) {
          throw new Error(CREDENCIAIS_INVALIDAS);
        }

        // Retornar user data
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || 'USER';
        token.userId = user.id;
      }

      // Atualizar token se login via Google
      if (account?.provider === 'google' && user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.role = dbUser.role;
          token.userId = dbUser._id.toString();
        }
      }

      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.userId as string;
      }
      return session;
    },
    
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            emailVerified: true,
            role: 'USER',
            password: '', // Google users não têm password local
          });
        }
      }
      return true;
    }
  },
  
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};
