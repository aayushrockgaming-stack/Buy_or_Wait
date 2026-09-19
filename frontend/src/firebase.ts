import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { SavedEvaluation } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForBuyOrWaitApp",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "buy-or-wait-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "buy-or-wait-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "buy-or-wait-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

const isConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

const LOCAL_STORAGE_KEY = 'buy_or_wait_evaluations_history';

export const saveEvaluationToCloud = async (evaluation: SavedEvaluation): Promise<boolean> => {
  try {
    if (isConfigured && auth.currentUser) {
      await addDoc(collection(db, 'evaluations'), {
        ...evaluation,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      return true;
    }
  } catch (err) {
    console.warn('Firebase Firestore save failed, falling back to local cache', err);
  }

  const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  const existing: SavedEvaluation[] = existingStr ? JSON.parse(existingStr) : [];
  existing.unshift(evaluation);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
  return false;
};

export const getEvaluationHistory = async (_userId: string): Promise<SavedEvaluation[]> => {
  try {
    if (isConfigured && auth.currentUser) {
      const q = query(
        collection(db, 'evaluations'),
        where('uid', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedEvaluation));
    }
  } catch (err) {
    console.warn('Firebase Firestore fetch failed, loading local cache', err);
  }

  const existingStr = localStorage.getItem(LOCAL_STORAGE_KEY);
  return existingStr ? JSON.parse(existingStr) : [];
};

export const isFirebaseConfigured = isConfigured;
