import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Token, User } from '@/lib/models';
import { consumir, identificar } from '@/lib/limites';
import { esquemaPedidoReposicao, lerCorpo } from '@/lib/validacao';
import { expiraEm, gerarToken, ligacaoToken, resumir } from '@/lib/tokens';
import { enviarReposicaoPassword } from '@/services/mailer';

/**
 * Pedido de reposicao de palavra-passe.
 *
 * A rota responde sempre o mesmo, exista a conta ou nao. Duas maneiras de a
 * fazer falhar nisso, e as duas estao tratadas:
 *
 * **A resposta.** Dizer "email nao encontrado" entrega a lista de quem tem
 * conta a quem estiver a sondar. A mensagem e uma so.
 *
 * **O tempo.** Se so se enviasse email quando a conta existe, o pedido
 * demorava visivelmente mais nesse caso — e isso diz o mesmo que a mensagem
 * diria. O envio nao e esperado: a resposta sai imediatamente nos dois casos,
 * e o email segue em segundo plano.
 */

const LIMITE_IP = { max: 5, janelaMs: 60 * 60 * 1000 };
const LIMITE_CONTA = { max: 3, janelaMs: 60 * 60 * 1000 };

const RESPOSTA = {
  message:
    'Se existir uma conta com esse endereço, enviámos uma mensagem com as instruções.',
};

export async function POST(request: Request) {
  const corpo = await lerCorpo(request, esquemaPedidoReposicao);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  const { email } = corpo.dados;

  const porIp = consumir(`reposicao:ip:${identificar(request)}`, LIMITE_IP);
  const porConta = consumir(`reposicao:conta:${email}`, LIMITE_CONTA);
  if (!porIp.permitido || !porConta.permitido) {
    const espera = Math.max(porIp.segundosAteReiniciar, porConta.segundosAteReiniciar);
    return NextResponse.json(
      { error: 'Demasiados pedidos. Tente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(espera) } },
    );
  }

  try {
    await connectDB();
    const user = await User.findOne({ email });

    if (user) {
      // Os pedidos anteriores desta conta deixam de valer: senao, pedir duas
      // vezes deixava duas ligacoes vivas, e a mais antiga ja pode ter sido
      // vista por quem nao devia.
      await Token.deleteMany({ userId: user._id, finalidade: 'repor-password' });

      const token = gerarToken();
      await Token.create({
        resumo: resumir(token),
        userId: user._id,
        finalidade: 'repor-password',
        expiraEm: expiraEm('repor-password'),
      });

      // Sem `await`: esperar pelo SMTP faria este caminho demorar mais do que
      // o caminho sem conta, e o tempo passaria a dizer o que a mensagem nao diz.
      void enviarReposicaoPassword(
        user.email,
        user.name,
        ligacaoToken('repor-password', token),
      ).catch((erro) => console.error('Falha ao enviar reposição:', erro));
    }
  } catch (erro) {
    // Nem o erro pode distinguir os casos: regista-se e responde-se igual.
    console.error('Erro no pedido de reposição:', erro);
  }

  return NextResponse.json(RESPOSTA);
}
