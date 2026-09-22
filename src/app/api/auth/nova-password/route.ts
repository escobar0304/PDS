import { NextResponse } from 'next/server';
import { hash } from 'argon2';
import connectDB from '@/lib/db';
import { Token, User } from '@/lib/models';
import { consumir, identificar } from '@/lib/limites';
import { esquemaNovaPassword, lerCorpo } from '@/lib/validacao';
import { resumir } from '@/lib/tokens';

/**
 * Definir uma palavra-passe nova a partir de um token.
 *
 * O token e procurado pelo resumo, porque e so o resumo que existe na base de
 * dados. A procura por igualdade num indice unico ja e de tempo constante o
 * suficiente para o que esta em causa aqui; o que interessava proteger — o
 * segredo em repouso — fica protegido por nunca ter sido guardado.
 *
 * O prazo e verificado em codigo e nao so pelo indice de expiracao do Mongo:
 * esse indice corre periodicamente e pode deixar um token expirado vivo
 * durante minutos.
 */

const LIMITE_IP = { max: 10, janelaMs: 15 * 60 * 1000 };

export async function POST(request: Request) {
  const corpo = await lerCorpo(request, esquemaNovaPassword);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  const limite = consumir(`nova-password:ip:${identificar(request)}`, LIMITE_IP);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: 'Demasiadas tentativas. Tente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(limite.segundosAteReiniciar) } },
    );
  }

  const { token, password } = corpo.dados;

  try {
    await connectDB();

    const registo = await Token.findOne({
      resumo: resumir(token),
      finalidade: 'repor-password',
    });

    if (!registo || registo.expiraEm.getTime() <= Date.now()) {
      // Uma mensagem para os dois casos. Distinguir "não existe" de "expirou"
      // diria a quem sonda que acertou num token que ja existiu.
      if (registo) await Token.deleteOne({ _id: registo._id });
      return NextResponse.json(
        { error: 'Ligação inválida ou expirada. Peça uma nova.' },
        { status: 400 },
      );
    }

    const utilizador = await User.findById(registo.userId);
    if (!utilizador) {
      await Token.deleteOne({ _id: registo._id });
      return NextResponse.json(
        { error: 'Ligação inválida ou expirada. Peça uma nova.' },
        { status: 400 },
      );
    }

    utilizador.password = await hash(password, { type: 2 }); // argon2id

    // Quem repos a password provou que controla a caixa de correio, o que
    // tambem confirma o endereco. Marcar aqui evita obrigar a duas
    // verificacoes seguidas por email.
    utilizador.emailVerified = true;
    await utilizador.save();

    // Uso unico: apaga-se, nao se marca como usado. O que nao existe nao pode
    // ser reutilizado por engano. Os outros tokens da conta caem tambem.
    await Token.deleteMany({ userId: utilizador._id, finalidade: 'repor-password' });

    return NextResponse.json({ message: 'Palavra-passe alterada. Já pode entrar.' });
  } catch (erro) {
    console.error('Erro ao repor palavra-passe:', erro);
    return NextResponse.json({ error: 'Erro ao repor a palavra-passe' }, { status: 500 });
  }
}
