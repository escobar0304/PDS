// src/lib/mongodb.ts
//
// Cliente MongoDB nativo, usado pelo adaptador do NextAuth.
// A ligacao e criada na primeira utilizacao, nao no import, para o `next build`
// nao precisar de uma base de dados viva.
import { MongoClient } from 'mongodb';
import { requireEnv } from './env';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let cached: Promise<MongoClient> | undefined;

function createClientPromise(): Promise<MongoClient> {
  const uri = requireEnv('MONGODB_URI');
  return new MongoClient(uri).connect();
}

export function getMongoClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    // Preservar a ligacao entre hot reloads
    global._mongoClientPromise ??= createClientPromise();
    return global._mongoClientPromise;
  }

  cached ??= createClientPromise();
  return cached;
}

/**
 * O adaptador do NextAuth recebe uma Promise<MongoClient> no momento em que e
 * construido. Esta promessa nao liga a nada enquanto ninguem a aguardar, e se
 * a configuracao estiver em falta rejeita em vez de rebentar o import.
 */
const clientPromise: Promise<MongoClient> = new Promise((resolve, reject) => {
  queueMicrotask(() => {
    try {
      getMongoClient().then(resolve, reject);
    } catch (error) {
      reject(error);
    }
  });
});

// Sem isto, uma rejeicao antes de alguem aguardar a promessa derruba o processo.
clientPromise.catch(() => {});

export default clientPromise;
