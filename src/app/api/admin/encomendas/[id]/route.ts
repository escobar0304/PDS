import { NextResponse } from 'next/server';
import { exigirAdmin } from '@/lib/autorizacao';
import { concluir, expedir, reembolsar, reenviarAviso, type Acao } from '@/lib/gestao-encomendas';
import { LIMITES, travar } from '@/lib/limites';
import { esquemaAcaoEncomenda, lerCorpo } from '@/lib/validacao';

const RECUSAS = {
  'nao-existe': { estado: 404, mensagem: 'Não existe.' },
  'estado-errado': { estado: 409, mensagem: 'A encomenda já não está num estado em que isto se possa fazer.' },
  conflito: { estado: 409, mensagem: 'Outra pessoa mudou esta encomenda ao mesmo tempo. Recarregue a página.' },
} as const;

/** O painel muda uma encomenda: expedir, dar por entregue, reembolsar. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(request, esquemaAcaoEncomenda);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  const id = (await params).id;
  const por = `admin:${permissao.sessao.id}` as const;
  const d = corpo.dados;

  let r: Acao;
  try {
    r =
      d.acao === 'expedir'
        ? await expedir(id, d.seguimento, por)
        : d.acao === 'concluir'
          ? await concluir(id, por)
          : d.acao === 'reembolsar'
            ? await reembolsar(id, por, d.nota)
            : await reenviarAviso(id);
  } catch (erro) {
    console.error('Painel: erro na encomenda:', erro);
    return NextResponse.json(
      {
        error:
          d.acao === 'reembolsar'
            ? 'O reembolso não se fez. Se a encomenda ficou cancelada, pode tentar outra vez: nunca se devolve duas vezes.'
            : 'Erro ao mudar a encomenda.',
      },
      { status: 502 }
    );
  }

  if (!r.ok) {
    const { estado, mensagem } = RECUSAS[r.motivo];
    return NextResponse.json({ error: mensagem, codigo: r.motivo }, { status: estado });
  }
  return NextResponse.json(r);
}
