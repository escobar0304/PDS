// src/lib/models.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { eCentimos } from '@/lib/dinheiro';
import { ESTADOS, type Estado } from '@/lib/transicoes';

// ============================================
// INTERFACES TYPESCRIPT
// ============================================

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  /**
   * Se as pecas desta categoria sao unicas (cada uma e *aquela* pedra, com a
   * sua fotografia, stock 0 ou 1) ou modelos com medidas (um anel, em varios
   * tamanhos). Decidido pelo negocio: e a categoria que diz. As regras estao
   * em `lib/catalogo.ts`.
   */
  pecasUnicas: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Uma medida de um produto, com o seu stock.
 *
 * **Todo o produto tem pelo menos uma.** Uma peca unica tem uma so, sem nome
 * (`medida` vazia) e stock 0 ou 1. Uniforme de proposito: a reserva, os
 * movimentos e o carrinho seguem sempre pelo mesmo caminho, em vez de dois
 * com um `if` em cada sitio.
 */
export interface IVariante {
  _id: mongoose.Types.ObjectId;
  medida?: string;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  /** Em centimos, inteiro. Ver `lib/dinheiro.ts`. */
  priceCents: number;
  images: string[];
  /** O stock vive aqui, por medida. Nao ha stock no produto. */
  variantes: IVariante[];
  categoryId: mongoose.Types.ObjectId;
  featured: boolean;
  active: boolean;
  /** Em gramas, inteiro. Os portes dependem dele (ver `lib/encomenda.ts`). */
  weightGrams?: number;
  dimensions?: string;
  properties?: {
    chakra?: string;
    elemento?: string;
    signo?: string;
    beneficios?: string[];
    cuidados?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  /** Muda quando todas as sessoes da conta devem acabar. Ver `lib/sessao.ts`. */
  versaoSessao: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  /** O numero que a pessoa ve (`2026-000123`). Ver `lib/transicoes.ts`. */
  numero: string;
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostal?: string;
  shippingCountry: string;
  deliveryType: 'PICKUP' | 'SHIPPING';
  /** O identificador do pagamento no fornecedor, seja ele qual for (E4). */
  pagamentoId?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  /** Em centimos, como todos os valores da encomenda. */
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  status: Estado;
  /** Ate quando o stock fica reservado a espera do pagamento. */
  reservaAte?: Date;
  /** Cada mudanca de estado, com data e autor. Nunca se reescreve. */
  historico: Array<{ de?: Estado; para: Estado; em: Date; por: string; nota?: string }>;
  notes?: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    varianteId: mongoose.Types.ObjectId;
    /** Copiada no momento da compra, como o nome e o preco. */
    medida?: string;
    name: string;
    priceCents: number;
    quantity: number;
    image?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEMAS MONGOOSE
// ============================================

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Nome da categoria é obrigatório'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug é obrigatório'],
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
    pecasUnicas: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ order: 1 }); // mantém índice extra

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Nome do produto é obrigatório'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug é obrigatório'],
      trim: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priceCents: {
      type: Number,
      required: [true, 'Preço é obrigatório'],
      validate: { validator: eCentimos, message: 'O preço é um número inteiro de cêntimos' },
    },
    images: {
      type: [String],
      default: [],
    },
    variantes: {
      type: [
        {
          medida: { type: String, trim: true },
          stock: {
            type: Number,
            default: 0,
            validate: {
              validator: (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0,
              message: 'O stock é um número inteiro, nunca negativo',
            },
          },
        },
      ],
      validate: {
        validator: (v: unknown[]) => Array.isArray(v) && v.length > 0,
        message: 'Um produto tem pelo menos uma medida',
      },
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Categoria é obrigatória'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Com a unidade no nome, pela mesma razao dos centimos: `weight: 250`
    // podia ser gramas ou quilos, e os portes dependem da resposta.
    weightGrams: {
      type: Number,
      validate: {
        validator: (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v > 0,
        message: 'O peso é um número inteiro de gramas, maior do que zero',
      },
    },
    dimensions: {
      type: String,
    },
    properties: {
      chakra: String,
      elemento: String,
      signo: String,
      beneficios: [String],
      cuidados: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Mantém índices extras, remove índice duplicado do slug
productSchema.index({ categoryId: 1 });
productSchema.index({ featured: -1 });
productSchema.index({ active: 1 });
productSchema.index({ priceCents: 1 });

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Nao e obrigatoria: quem entra pela Google nao tem palavra-passe, e
    // exigi-la aqui fazia rebentar a criacao dessas contas. O registo por
    // email exige-a no servidor, em `esquemaRegisto`. O `minlength` que estava
    // aqui aplicava-se ao hash, onde nao quer dizer nada.
    password: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: 'Portugal',
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    versaoSessao: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Mantém índice extra do role
userSchema.index({ role: 1 });

const orderSchema = new Schema<IOrder>(
  {
    numero: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customerName: {
      type: String,
      required: [true, 'Nome do cliente é obrigatório'],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Email do cliente é obrigatório'],
      lowercase: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Telefone do cliente é obrigatório'],
      trim: true,
    },
    shippingAddress: {
      type: String,
      trim: true,
    },
    shippingCity: {
      type: String,
      trim: true,
    },
    shippingPostal: {
      type: String,
      trim: true,
    },
    shippingCountry: {
      type: String,
      default: 'Portugal',
    },
    deliveryType: {
      type: String,
      enum: ['PICKUP', 'SHIPPING'],
      required: [true, 'Tipo de entrega é obrigatório'],
    },
    pagamentoId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    subtotalCents: {
      type: Number,
      required: [true, 'Subtotal é obrigatório'],
      validate: { validator: eCentimos, message: 'O subtotal é um número inteiro de cêntimos' },
    },
    shippingCents: {
      type: Number,
      default: 0,
      validate: { validator: eCentimos, message: 'Os portes são um número inteiro de cêntimos' },
    },
    totalCents: {
      type: Number,
      required: [true, 'Total é obrigatório'],
      validate: { validator: eCentimos, message: 'O total é um número inteiro de cêntimos' },
    },
    status: {
      type: String,
      enum: ESTADOS,
      default: 'PENDING',
    },
    reservaAte: {
      type: Date,
    },
    historico: [
      {
        _id: false,
        de: { type: String, enum: ESTADOS },
        para: { type: String, enum: ESTADOS, required: true },
        em: { type: Date, required: true },
        por: { type: String, required: true },
        nota: { type: String, trim: true },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        varianteId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        medida: {
          type: String,
        },
        name: {
          type: String,
          required: true,
        },
        priceCents: {
          type: Number,
          required: true,
          validate: { validator: eCentimos, message: 'O preço é um número inteiro de cêntimos' },
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Mantém índices extras
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
// Para encontrar as reservas expiradas sem percorrer a colecao.
orderSchema.index({ status: 1, reservaAte: 1 });

// ============================================
// EXPORTAR MODELOS
// ============================================

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

/**
 * Cada mudanca de stock, com a razao.
 *
 * O stock e um so, partilhado com a loja fisica, e muda-se por movimentos,
 * nunca por valor (ver `lib/stock.ts`). Isto e o registo: quem vendeu ao
 * balcao, que encomenda reservou, que entrada chegou. Nunca se apaga nem se
 * edita.
 */
export const MOTIVOS_STOCK = [
  'venda-loja',
  'entrada',
  'acerto',
  'quebra',
  'reserva-online',
  'reserva-libertada',
] as const;

export type MotivoStock = (typeof MOTIVOS_STOCK)[number];

export interface IMovimentoStock {
  productId: mongoose.Types.ObjectId;
  varianteId: mongoose.Types.ObjectId;
  delta: number;
  motivo: MotivoStock;
  encomendaId?: mongoose.Types.ObjectId;
  por: string;
  nota?: string;
  em: Date;
}

const movimentoSchema = new Schema<IMovimentoStock>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  varianteId: { type: Schema.Types.ObjectId, required: true },
  delta: {
    type: Number,
    required: true,
    validate: {
      validator: (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v !== 0,
      message: 'Um movimento é um número inteiro, diferente de zero',
    },
  },
  motivo: { type: String, enum: MOTIVOS_STOCK, required: true },
  encomendaId: { type: Schema.Types.ObjectId, ref: 'Order' },
  por: { type: String, required: true },
  nota: { type: String, trim: true, maxlength: 500 },
  em: { type: Date, required: true },
});

movimentoSchema.index({ productId: 1, em: -1 });

export const MovimentoStock: Model<IMovimentoStock> =
  mongoose.models.MovimentoStock ||
  mongoose.model<IMovimentoStock>('MovimentoStock', movimentoSchema);

/**
 * Contadores com incremento atomico. Hoje so o das encomendas, um por ano:
 * `findOneAndUpdate` com `$inc` e `upsert` nunca da o mesmo numero duas vezes,
 * ao contrario de contar documentos e somar um.
 */
interface IContador {
  _id: string;
  valor: number;
}

const contadorSchema = new Schema<IContador>({
  _id: { type: String, required: true },
  valor: { type: Number, required: true, default: 0 },
});

export const Contador: Model<IContador> =
  mongoose.models.Contador || mongoose.model<IContador>('Contador', contadorSchema);

// ============================================
// TOKENS DE USO UNICO
// ============================================

/**
 * Verificacao de email e reposicao de password.
 *
 * Guarda-se o resumo do token, nunca o token. Ver `src/lib/tokens.ts` para o
 * raciocinio.
 *
 * Coleccao propria e nao campos no utilizador: permite mais do que um token
 * em voo, permite indice de expiracao automatica, e nao suja o documento
 * principal com estado temporario.
 */
export interface IToken extends Document {
  resumo: string;
  userId: mongoose.Types.ObjectId;
  finalidade: 'verificar-email' | 'repor-password';
  expiraEm: Date;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    resumo: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    finalidade: {
      type: String,
      enum: ['verificar-email', 'repor-password'],
      required: true,
    },
    expiraEm: { type: Date, required: true },
  },
  { timestamps: true }
);

// O Mongo apaga sozinho os expirados. Sem isto a coleccao so cresce, e cada
// token que fica e um que ainda pode ser usado se a verificacao de prazo
// falhar em algum caminho.
tokenSchema.index({ expiraEm: 1 }, { expireAfterSeconds: 0 });

export const Token: Model<IToken> =
  mongoose.models.Token || mongoose.model<IToken>('Token', tokenSchema);
