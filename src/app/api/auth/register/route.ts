import { NextResponse } from 'next/server';
import { hash } from 'argon2';
import connectDB from '@/lib/db';
import { consumir, identificar } from '@/lib/limites';
import { esquemaRegisto, lerCorpo } from '@/lib/validacao';
import { Token, User } from '@/lib/models';
import { expiraEm, gerarToken, ligacaoToken, resumir } from '@/lib/tokens';
import { SITE_URL } from '@/lib/site';
import { enviarAvisoContaExistente, enviarVerificacao } from '@/services/mailer';
import { registarErro } from '@/lib/registo';

/**
 * Criacao de conta.
 *
 * A versao anterior validava presenca (`if (!email)`) e formato do email por
 * expressao regular. O formato salvava-a por acaso da injeccao NoSQL —
 * `regex.test({})` compara contra "[object Object]" e falha — mas `name` e
 * `password` nao tinham essa rede, e ninguem tinha escrito aquela linha a
 * pensar nisso. Agora o esquema garante que cada campo e mesmo texto antes de
 * chegar a uma consulta.
 */

const LIMITE_POR_IP = { max: 5, janelaMs: 60 * 60 * 1000 };

const MENSAGEM = 'Enviámos uma mensagem para o seu email. Siga as instruções que lá estão.';

export async function POST(request: Request) {
  const corpo = await lerCorpo(request, esquemaRegisto);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  const { name, email, password } = corpo.dados;

  const limite = consumir(`registo:ip:${identificar(request)}`, LIMITE_POR_IP);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: 'Demasiadas tentativas. Tente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(limite.segundosAteReiniciar) } },
    );
  }

  try {
    await connectDB();

    // Primeiro o argon2, e so depois a consulta: os dois caminhos gastam o
    // mesmo tempo. Com a ordem inversa, "ja existe" respondia antes do hash e
    // o relogio dizia o que a mensagem deixou de dizer.
    const passwordCifrada = await hash(password, { type: 2 }); // argon2id

    const existente = await User.findOne({ email }).select('name').lean();
    if (existente) {
      // Um aviso por hora e por endereco: sem isto, o registo servia para
      // encher a caixa de correio de alguem com avisos, cinco por IP.
      const aviso = consumir(`registo:aviso:${email}`, { max: 1, janelaMs: 60 * 60 * 1000 });
      if (!aviso.permitido) return NextResponse.json({ message: MENSAGEM }, { status: 201 });

      // A mesma resposta que uma conta nova. Ate 30/09/2026 dizia "Este email
      // ja esta registado": qualquer pessoa sabia, email a email, quem tinha
      // conta na loja — a enumeracao que a entrada e a reposicao ja fechavam.
      // Quem se esqueceu que tinha conta fica a saber pelo proprio correio,
      // que so o dono le.
      void enviarAvisoContaExistente(email, existente.name, `${SITE_URL}/auth/recuperar-password`)
        .catch((erro) => registarErro('Falha ao avisar conta existente:', erro));
      return NextResponse.json({ message: MENSAGEM }, { status: 201 });
    }

    const user = await User.create({
      name,
      email,
      password: passwordCifrada,
      role: 'USER',
      emailVerified: false,
      maioridadeDeclaradaEm: new Date(),
    });

    // O endereco fica por confirmar ate alguem abrir a ligacao que so chega a
    // caixa de correio dele. Sem isto, qualquer pessoa se regista com o email
    // de outra — que hoje nao da acesso a nada, mas dara quando houver
    // encomendas associadas a conta.
    const token = gerarToken();
    await Token.create({
      resumo: resumir(token),
      userId: user._id,
      finalidade: 'verificar-email',
      expiraEm: expiraEm('verificar-email'),
    });

    // Sem `await`: o registo nao fica refem do SMTP. Se o envio falhar, a
    // conta existe na mesma e o email pode ser pedido outra vez.
    void enviarVerificacao(user.email, user.name, ligacaoToken('verificar-email', token))
      .catch((erro) => registarErro('Falha ao enviar verificação:', erro));

    // Sem o `user`: o id nao serve a quem se regista, e a resposta tinha de
    // ser igual a de um email ja registado.
    return NextResponse.json({ message: MENSAGEM }, { status: 201 });
  } catch (error) {
    // Dois registos do mesmo email ao mesmo tempo: o indice unico recusa o
    // segundo. Responde-se como a qualquer email ja registado.
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ message: MENSAGEM }, { status: 201 });
    }
    registarErro('Erro ao registar utilizador:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
