import { NextResponse } from 'next/server';
import { verify as argon2Verify } from 'argon2';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { exigirSessao } from '@/lib/autorizacao';
import { apagarConta } from '@/lib/conta';
import { LIMITES, consumir, identificar, travar } from '@/lib/limites';
import { esquemaPerfil, lerCorpo } from '@/lib/validacao';

/**
 * Direito ao apagamento (RGPD, art. 17.º).
 *
 * A pagina de privacidade ja dizia "apaga-se quando a apagar". Passa a ser
 * verdade.
 */

const LIMITE = { max: 5, janelaMs: 15 * 60 * 1000 };

/**
 * O que a interface precisa de saber para pedir a confirmacao certa.
 *
 * Devolve apenas `temPassword`. A alternativa era pô-lo na sessao, mas isso
 * obrigava a uma consulta a base de dados a cada renovacao do JWT para um
 * dado que so interessa a um separador que a maioria nunca abre.
 */
export async function GET(request: Request) {
  const permissao = await exigirSessao();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'conta', LIMITES.conta, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  try {
    await connectDB();
    const utilizador = await User.findById(permissao.sessao.id).select('password');
    if (!utilizador) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }
    return NextResponse.json(
      { temPassword: Boolean(utilizador.password) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (erro) {
    console.error('Erro ao ler a conta:', erro);
    return NextResponse.json({ error: 'Não foi possível ler a conta.' }, { status: 500 });
  }
}

/**
 * Confirmacao, que muda conforme a conta.
 *
 * Quem entrou por email confirma com a palavra-passe. Mas **quem entrou pela
 * Google nao tem palavra-passe**: o callback `signIn` cria essas contas com
 * `password: ''`. Pedir-lhes a palavra-passe seria pedir uma coisa que nunca
 * tiveram, e deixa-las sem forma de apagar a conta.
 *
 * Para essas, a confirmacao e escrever o proprio email. Nao prova posse de um
 * segredo — prova intencao, que e o que esta confirmacao existe para garantir:
 * que ninguem apaga a conta por engano nem com dois cliques distraidos.
 */
const esquemaApagar = z.object({
  password: z.string().min(1).max(200).optional(),
  confirmacao: z.string().trim().max(254).optional(),
});

export async function DELETE(pedido: Request) {
  const permissao = await exigirSessao();
  if (!permissao.ok) return permissao.resposta;

  // Limita por IP: apagar contas as cegas nao deve ser barato, e a resposta
  // distingue conta com e sem palavra-passe.
  const quota = consumir(`apagar:${identificar(pedido)}`, LIMITE);
  if (!quota.permitido) {
    return NextResponse.json(
      { error: 'Demasiadas tentativas. Tente mais tarde.' },
      { status: 429 },
    );
  }

  const corpo = await lerCorpo(pedido, esquemaApagar);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  try {
    await connectDB();

    const utilizador = await User.findById(permissao.sessao.id);
    if (!utilizador) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const guardada = utilizador.password;

    if (guardada) {
      const { password } = corpo.dados;
      if (!password) {
        return NextResponse.json({ error: 'Confirme a palavra-passe.' }, { status: 400 });
      }

      const valida = guardada.startsWith('$argon2')
        ? await argon2Verify(guardada, password)
        : await bcrypt.compare(password, guardada);

      if (!valida) {
        return NextResponse.json({ error: 'Palavra-passe incorreta.' }, { status: 403 });
      }
    } else {
      // Conta sem palavra-passe local: confirma-se escrevendo o email.
      const escrito = corpo.dados.confirmacao?.trim().toLowerCase();
      if (!escrito || escrito !== utilizador.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Escreva o seu email para confirmar.' },
          { status: 400 },
        );
      }
    }

    const resultado = await apagarConta(permissao.sessao.id);
    if (!resultado) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // O que foi apagado nao vai na resposta: nao serve a quem apagou e conta a
    // forma das coleccoes a quem sondar.
    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error('Erro ao apagar conta:', erro);
    return NextResponse.json({ error: 'Não foi possível apagar a conta.' }, { status: 500 });
  }
}

const LIMITE_PERFIL = { max: 20, janelaMs: 15 * 60 * 1000 };

/**
 * Direito de retificacao (RGPD, art. 16.º).
 *
 * A area pessoal dizia "para alterar o nome, contacte-nos" — e os contactos
 * estao a `null` ate a F4 estar preenchida. O direito existia no papel e nao
 * tinha caminho.
 *
 * So o nome. O email identifica a conta e muda-lo exige provar a posse do
 * novo endereco, que e outro fluxo. O que se escreve e sempre `name`, na conta
 * da sessao: nunca o corpo do pedido, e nunca um id vindo dele.
 */
export async function PATCH(pedido: Request) {
  const permissao = await exigirSessao();
  if (!permissao.ok) return permissao.resposta;

  const quota = consumir(`perfil:${permissao.sessao.id}`, LIMITE_PERFIL);
  if (!quota.permitido) {
    return NextResponse.json(
      { error: 'Demasiadas alterações. Tente mais tarde.' },
      { status: 429 },
    );
  }

  const corpo = await lerCorpo(pedido, esquemaPerfil);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  try {
    await connectDB();
    const r = await User.updateOne(
      { _id: permissao.sessao.id },
      { $set: { name: corpo.dados.name } },
    );
    if (r.matchedCount === 0) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ name: corpo.dados.name });
  } catch (erro) {
    console.error('Erro ao atualizar o perfil:', erro);
    return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 });
  }
}
