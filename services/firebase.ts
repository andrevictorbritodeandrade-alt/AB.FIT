import { initializeApp } from "firebase/app";
import { 
  getFirestore,
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp, 
  runTransaction, 
  increment,
  writeBatch,
  arrayUnion,
  getDocFromServer,
  setLogLevel
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Silence verbose logs
setLogLevel('silent');

// NOVA CONFIGURAÇÃO DO FIREBASE
export const firebaseConfig = {
  apiKey: "AIzaSyAvWENe5M3ZwgUxV-oDiUoTcWJk1cq_QO4",
  authDomain: "abfit---app.firebaseapp.com",
  projectId: "abfit---app",
  storageBucket: "abfit---app.firebasestorage.app",
  messagingSenderId: "413075544418",
  appId: "1:413075544418:web:e5cffd04a2ed957de2743b",
  measurementId: "G-JL1CS1MXLF"
};

const app = initializeApp(firebaseConfig);

// Inicializa o Firestore com persistência offline (evita perda de dados e problemas de cota)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const appId = firebaseConfig.projectId;
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export storage helpers
export { ref, uploadBytes, getDownloadURL };

// Export auth helpers
export { signInAnonymously, onAuthStateChanged };

// Export firestore functions to ensure they are from the same module instance
export {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  collection,
  query,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
  writeBatch,
  increment,
  arrayUnion,
  where,
  orderBy,
  limit,
  getDocFromServer
};

// Connection test to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore: Operando em modo cache local persistente (offline).");
    } else if (error instanceof Error && error.message.includes('Database \'(default)\' not found')) {
      console.warn("Firestore: Base de dados '(default)' em modo de contingência local.");
    } else {
      console.warn("Firestore connectivity notice:", error instanceof Error ? error.message : String(error));
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  const safeJsonStringify = (obj: any) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return;
        cache.add(value);
      }
      return value;
    }, 2);
  };

  console.warn('Firestore Error: ', safeJsonStringify(errInfo));
  throw new Error(safeJsonStringify(errInfo));
}
