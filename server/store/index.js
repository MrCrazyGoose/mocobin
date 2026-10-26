import path from 'node:path';
import { FileStore } from './fileStore.js';
import { PgStore } from './pgStore.js';

export async function createStore(env = process.env) {
  const store = env.DATABASE_URL
    ? new PgStore(env.DATABASE_URL)
    : new FileStore(env.DATA_FILE || path.resolve('data', 'ecosort.json'));
  await store.init();
  return store;
}
