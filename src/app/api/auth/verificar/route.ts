import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Token, User } from '@/lib/models';
import { consumir, identificar } from '@/lib/limites';
import { esquemaVerificacao, lerCorpo } from '@/lib/validacao';
import { resumir } from '@/lib/tokens';

/** Confirmacao do endereco de email a partir do token enviado no registo. */

const LIMITE_IP = { max: 15, janelaMs: 15 * 60 * 1000 };

export async function POST(request: Request) {
  const corpo = await lerCorpo(request, esquemaVerificacao);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  const limite = consumir(`verificar:ip:${identificar(request)}`, LIMITE_IP);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: 'Demasiadas tentativas. Tente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(limite.segundosAteReiniciar) } },
    );
  }

  try {
    await connectDB();

    const registo = await Token.findOne({
      resumo: resumir(corpo.dados.token),
      finalidade: 'verificar-email',
    });

    if (!registo || registo.expiraEm.getTime() <= Date.now()) {
      if (registo) await Token.deleteOne({ _id: registo._id });
      return NextResponse.json(
        { error: 'Ligação inválida ou expirada. Peça uma nova no seu perfil.' },
        { status: 400 },
      );
    }

    await User.updateOne({ _id: registo.userId }, { $set: { emailVerified: true } });
    await Token.deleteMany({ userId: registo.userId, finalidade: 'verificar-email' });

    return NextResponse.json({ message: 'Email confirmado.' });
  } catch (erro) {
    console.error('Erro ao verificar email:', erro);
    return NextResponse.json({ error: 'Erro ao confirmar o email' }, { status: 500 });
  }
}
