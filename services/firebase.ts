import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDocFromServer,
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
  increment,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Import the Firebase configuration from the auto-generated file
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with a background synchronization queue using IndexedDB.
// This ensures workout data and progress are saved locally when offline 
// and automatically synced to Firestore once connection is restored.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}),
}, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app);

export { ref, uploadBytes, getDownloadURL };



// Export firestore functions to ensure they are from the same module instance
export {
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
  increment,
  where,
  orderBy,
  limit
};

export const auth = getAuth(app);
export const appId = firebaseConfig.projectId;

// Connection test to Firestore
async function testConnection() {
  try {
    // Attempt to read a non-existent document to test connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firestore connection failed: the client is offline. Please check your Firebase configuration and ensure the database exists.");
    } else if (error instanceof Error && error.message.includes('Database \'(default)\' not found')) {
      console.error("Firestore error: Database '(default)' not found. You must create the Firestore database in the Firebase Console.");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

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
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
