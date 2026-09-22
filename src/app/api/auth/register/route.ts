import { NextResponse } from 'next/server';
import { hash } from 'argon2';
import connectDB from '@/lib/db';
import { consumir, identificar } from '@/lib/limites';
import { esquemaRegisto, lerCorpo } from '@/lib/validacao';
import { Token, User } from '@/lib/models';
import { expiraEm, gerarToken, ligacaoToken, resumir } from '@/lib/tokens';
import { enviarVerificacao } from '@/services/mailer';

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

    const existente = await User.findOne({ email });
    if (existente) {
      return NextResponse.json({ error: 'Este email já está registado' }, { status: 400 });
    }

    const passwordCifrada = await hash(password, { type: 2 }); // argon2id

    const user = await User.create({
      name,
      email,
      password: passwordCifrada,
      role: 'USER',
      emailVerified: false,
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
      .catch((erro) => console.error('Falha ao enviar verificação:', erro));

    return NextResponse.json(
      {
        user: { id: user._id, name: user.name, email: user.email },
        message: 'Conta criada. Enviámos uma mensagem para confirmar o seu email.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro ao registar utilizador:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
