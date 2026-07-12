// src/lib/models.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// INTERFACES TYPESCRIPT
// ============================================

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  images: string[];
  stock: number;
  categoryId: mongoose.Types.ObjectId;
  featured: boolean;
  active: boolean;
  weight?: number;
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
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostal?: string;
  shippingCountry: string;
  deliveryType: 'PICKUP' | 'SHIPPING';
  stripePaymentId?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'READY_PICKUP' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
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
    price: {
      type: Number,
      required: [true, 'Preço é obrigatório'],
      min: [0, 'Preço não pode ser negativo'],
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock não pode ser negativo'],
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
    weight: {
      type: Number,
      min: [0, 'Peso não pode ser negativo'],
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
productSchema.index({ price: 1 });

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
    password: {
      type: String,
      required: [true, 'Password é obrigatória'],
      minlength: [6, 'Password deve ter no mínimo 6 caracteres'],
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
  },
  {
    timestamps: true,
  }
);

// Mantém índice extra do role
userSchema.index({ role: 1 });

const orderSchema = new Schema<IOrder>(
  {
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
    stripePaymentId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal é obrigatório'],
      min: [0, 'Subtotal não pode ser negativo'],
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Custo de envio não pode ser negativo'],
    },
    total: {
      type: Number,
      required: [true, 'Total é obrigatório'],
      min: [0, 'Total não pode ser negativo'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'READY_PICKUP', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notas não podem exceder 500 caracteres'],
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
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

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ stripePaymentId: 1 }, { sparse: true });

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
