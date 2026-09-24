import mongoose from 'mongoose';
import { ADMIN_ID, CLIENTE_ID } from './contas';

/**
 * Parte de uma base de dados vazia, com duas contas a serio: uma de
 * administrador e uma de cliente. Sao contas reais e nao so cookies, porque
 * com base de dados o papel vem dela (`lib/sessao.ts`), e e isso que se quer
 * provar.
 */
export default async function preparar() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  await mongoose.connection.dropDatabase();

  const agora = new Date();
  await mongoose.connection.collection('users').insertMany([
    {
      _id: new mongoose.Types.ObjectId(ADMIN_ID),
      name: 'Administração',
      email: 'admin@exemplo.pt',
      role: 'ADMIN',
      emailVerified: true,
      country: 'Portugal',
      versaoSessao: 0,
      createdAt: agora,
      updatedAt: agora,
    },
    {
      _id: new mongoose.Types.ObjectId(CLIENTE_ID),
      name: 'Cliente',
      email: 'cliente@exemplo.pt',
      role: 'USER',
      emailVerified: true,
      country: 'Portugal',
      versaoSessao: 0,
      createdAt: agora,
      updatedAt: agora,
    },
  ]);

  await mongoose.disconnect();
}
