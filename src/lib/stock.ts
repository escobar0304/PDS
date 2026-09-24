import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { MovimentoStock, Product, type MotivoStock } from '@/lib/models';

/**
 * Movimentos de stock: o unico sitio onde o stock muda.
 *
 * O stock e um so, partilhado com a loja fisica (ROADMAP-V2, "O stock e um
 * so"). Muda-se por movimentos — "-1, vendido na loja", "+5, entrada" — e
 * nunca por valor: um "o stock passa a ser 3" escrito por cima apagava em
 * silencio uma reserva online feita no mesmo segundo. Um `-1` nao apaga nada.
 *
 * Cada movimento e uma atualizacao atomica com a condicao na propria
 * consulta, e fica registado em `MovimentoStock`.
 *
 * **`$elemMatch`, e nao duas condicoes soltas.** Com as medidas numa lista,
 * `{'variantes._id': X, 'variantes.stock': {$gte: 1}}` e satisfeita se *uma*
 * medida for a X e *outra* tiver stock — e o `$` posicional apontava para a
 * primeira, que podia nao ter nenhum. O `$elemMatch` obriga as duas condicoes
 * a valer para a mesma medida. Ha um teste de integracao para isto.
 */

export interface Movimento {
  productId: string;
  varianteId: string;
  /** Negativo tira, positivo acrescenta. Nunca zero. */
  delta: number;
  motivo: MotivoStock;
  por: string;
  encomendaId?: string;
  nota?: string;
  /** So a reserva online exige o produto ativo; ao balcao vende-se na mesma. */
  soAtivo?: boolean;
  /** Teto do stock depois do movimento: 1 para pecas unicas. */
  maximo?: number;
  em?: Date;
}

/**
 * Aplica o movimento se o stock o permitir, e regista-o. Devolve `false` se
 * nao havia stock que chegasse (ou se passava o teto), sem mexer em nada.
 */
export async function moverStock(m: Movimento): Promise<boolean> {
  if (!Number.isSafeInteger(m.delta) || m.delta === 0) {
    throw new Error('Um movimento é um número inteiro, diferente de zero.');
  }
  if (
    !mongoose.Types.ObjectId.isValid(m.productId) ||
    !mongoose.Types.ObjectId.isValid(m.varianteId)
  ) {
    return false;
  }

  await connectDB();

  const condicaoStock: Record<string, number> = {};
  if (m.delta < 0) condicaoStock.$gte = -m.delta;
  if (m.maximo !== undefined) condicaoStock.$lte = m.maximo - m.delta;

  const filtro: Record<string, unknown> = {
    _id: m.productId,
    variantes: {
      $elemMatch: {
        _id: m.varianteId,
        ...(Object.keys(condicaoStock).length > 0 ? { stock: condicaoStock } : {}),
      },
    },
  };
  if (m.soAtivo) filtro.active = true;

  const r = await Product.updateOne(filtro, { $inc: { 'variantes.$.stock': m.delta } });
  if (r.modifiedCount !== 1) return false;

  try {
    await MovimentoStock.create({
      productId: m.productId,
      varianteId: m.varianteId,
      delta: m.delta,
      motivo: m.motivo,
      por: m.por,
      encomendaId: m.encomendaId,
      nota: m.nota,
      em: m.em ?? new Date(),
    });
  } catch (erro) {
    // Sem registo, o movimento nao aconteceu: desfaz-se. Sem transacao (ver
    // `reservarStock` em `lib/encomenda.ts`), e isto ou um stock que mudou
    // sem ninguem saber porque.
    await Product.updateOne(
      { _id: m.productId, 'variantes._id': m.varianteId },
      { $inc: { 'variantes.$.stock': -m.delta } }
    );
    throw erro;
  }
  return true;
}

/** O stock de uma medida agora, ou 0 se ja nao existir. */
export async function stockDe(productId: string, varianteId: string): Promise<number> {
  await connectDB();
  const p = await Product.findById(productId).select('variantes').lean();
  return p?.variantes.find((v) => String(v._id) === varianteId)?.stock ?? 0;
}
