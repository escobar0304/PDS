// src/lib/db.ts
//
// Ligacao Mongoose partilhada. A validacao da configuracao acontece no momento
// da ligacao, nao no import, para nao rebentar o build.
import mongoose from 'mongoose';
import { requireEnv } from './env';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = requireEnv('MONGODB_URI');
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;

/**
 * Uma consulta que desiste ao fim de `ms`.
 *
 * O Mongoose espera 30 s por uma ligacao antes de desistir. Numa rota de API
 * isso e so lento; num titulo de pagina ou no mapa do sitio, segura tudo o
 * resto. Para o que e acessorio, mais vale desistir cedo e seguir sem.
 */
export function comPrazo<T>(consulta: () => Promise<T>, ms = 2000): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const prazo = new Promise<never>((_, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new Error('base de dados lenta')), ms);
  });
  return Promise.race([connectDB().then(consulta), prazo]).finally(() =>
    clearTimeout(temporizador),
  );
}
