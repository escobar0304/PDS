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
  // eslint-disable-next-line no-var
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
