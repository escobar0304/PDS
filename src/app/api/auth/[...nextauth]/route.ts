// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { verify as argon2Verify } from 'argon2';

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e password são obrigatórios');
        }

        await connectDB();

        // Buscar user na base de dados
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('Utilizador não encontrado');
        }

        // Verificar password (bcrypt antigo ou Argon2id)
        let isPasswordValid = false;

        if (user.password.startsWith('$2')) {
          // bcrypt
          isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        } else {
          // Argon2id
          isPasswordValid = await argon2Verify(user.password, credentials.password);
        }

        if (!isPasswordValid) {
          throw new Error('Password incorreta');
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
