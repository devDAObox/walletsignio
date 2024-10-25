import { openDB, IDBPDatabase } from 'idb';

export interface StoredDocument {
  signedHash: string;
  originalHash: string;
  signature: string;
  walletAddress: string;
  timestamp: string;
  transactionHash?: string;
  blockNumber?: string;
  networkId?: string;
}

const DB_NAME = 'pdf-signer-db';
const STORE_NAME = 'signed-documents';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 3) {
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'signedHash' });
          store.createIndex('originalHash', 'originalHash');
          store.createIndex('walletAddress', 'walletAddress');
          store.createIndex('transactionHash', 'transactionHash');
        }
      },
    });
  }
  return dbPromise;
}

export async function storeDocument(document: StoredDocument): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      ...document,
      networkId: document.transactionHash ? '0x89' : undefined, // Polygon Mainnet
    });
  } catch (error) {
    console.error('Failed to store document:', error);
    throw new Error('Failed to store document in database');
  }
}

export async function getDocument(signedHash: string): Promise<StoredDocument | undefined> {
  try {
    const db = await getDB();
    return await db.get(STORE_NAME, signedHash);
  } catch (error) {
    console.error('Failed to retrieve document:', error);
    throw new Error('Failed to retrieve document from database');
  }
}

export async function getAllDocuments(): Promise<StoredDocument[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORE_NAME);
  } catch (error) {
    console.error('Failed to retrieve all documents:', error);
    throw new Error('Failed to retrieve documents from database');
  }
}

export async function getDocumentByTransaction(transactionHash: string): Promise<StoredDocument | undefined> {
  try {
    const db = await getDB();
    const index = db.transaction(STORE_NAME).store.index('transactionHash');
    return await index.get(transactionHash);
  } catch (error) {
    console.error('Failed to retrieve document by transaction:', error);
    throw new Error('Failed to retrieve document from database');
  }
}

export async function clearAllDocuments(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Failed to clear documents:', error);
    throw new Error('Failed to clear documents from database');
  }
}