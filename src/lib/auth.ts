// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
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

/**
 * O Google so e um provedor quando esta mesmo configurado.
 *
 * `src/lib/env.ts` classifica GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET como
 * **opcionais** — activam uma funcionalidade, nao sao obrigatorias. Mas o
 * provedor era registado na mesma, com um `!` a afirmar que existem. Sem
 * elas, o NextAuth ficava com um provedor de `clientId: undefined` e quem
 * carregasse em "Continuar com Google" aterrava num fluxo OAuth partido.
 *
 * E o mesmo erro do rodape que ligava para paginas inexistentes: oferecer um
 * caminho que nao leva a lado nenhum. A interface le esta lista pelo
 * `getProviders()`, por isso o botao desaparece sozinho — sem uma segunda
 * variavel de ambiente a repetir o que esta aqui e a poder discordar.
 */
export const googleConfigurado = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/**
 * Sem adaptador, e de proposito.
 *
 * Havia um `MongoDBAdapter` e, ao mesmo tempo, o callback `signIn` a criar o
 * utilizador pelo Mongoose. Duas fontes de verdade para a mesma conta, e as
 * duas partiam a entrada pela Google a quem chegasse pela primeira vez:
 *
 * 1. o callback criava o utilizador com `password: ''`, e o Mongoose recusava
 *    ("Password e obrigatoria") — o `signIn` rebentava ali;
 * 2. mesmo sem isso, o adaptador procurava a ligacao em `accounts`, nao a
 *    encontrava, via um utilizador com o mesmo email e recusava com
 *    `OAuthAccountNotLinked`.
 *
 * Com sessoes JWT, o adaptador so servia para guardar utilizadores e
 * ligacoes. O modelo `User` ja faz a primeira coisa, e a segunda nao faz falta
 * a ninguem. Sair daqui levou tambem a cadeia `mongodb@5` → `socks` →
 * `ip-address`, que estava em `docs/SEGURANCA.md` como vulnerabilidade alta
 * sem saida.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleConfigurado
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
    
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
        const dbUser = await User.findOne({ email: user.email?.toLowerCase() });
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
    
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true;

      // A Google so garante o email quando diz que o verificou. Numa conta
      // Google Workspace de um dominio qualquer, `email_verified` pode vir
      // falso — e aceitar esse email era deixar quem controla esse dominio
      // entrar na conta de outra pessoa que se tenha registado aqui com ele.
      const verificado = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      if (verificado !== true || !user.email) return false;

      const email = user.email.toLowerCase();
      await connectDB();
      const existente = await User.findOne({ email });

      if (!existente) {
        // Sem `password`, e nao com ela vazia: e a ausencia que diz que a
        // conta nao tem palavra-passe (`GET /api/conta` le isso).
        await User.create({
          name: user.name || email.split('@')[0],
          email,
          emailVerified: true,
          role: 'USER',
        });
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
