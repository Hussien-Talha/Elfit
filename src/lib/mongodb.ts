import { MongoClient } from 'mongodb';

let clientPromise: Promise<MongoClient> | null = null;

export function ensureMongoClient() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment');
    }
    const client = new MongoClient(uri);
    if (process.env.NODE_ENV === 'development') {
      if (!(global as any)._mongoClientPromise) {
        (global as any)._mongoClientPromise = client.connect();
      }
      clientPromise = (global as any)._mongoClientPromise;
    } else {
      clientPromise = client.connect();
    }
  }
  if (!clientPromise) {
    throw new Error('Mongo client not initialized');
  }
  return clientPromise;
}

export async function getMongoClient() {
  return ensureMongoClient();
}
