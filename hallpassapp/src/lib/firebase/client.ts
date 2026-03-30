import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;

function webConfig(): Record<string, string> | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey?.trim() || !projectId?.trim()) {
    return null;
  }
  const authDomain =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
    `${projectId}.firebaseapp.com`;
  const cfg: Record<string, string> = {
    apiKey: apiKey.trim(),
    authDomain,
    projectId: projectId.trim(),
  };
  const storage = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const sender = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
  if (storage) cfg.storageBucket = storage;
  if (sender) cfg.messagingSenderId = sender;
  if (appId) cfg.appId = appId;
  return cfg;
}

export function isFirebaseConfigured(): boolean {
  return webConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
  const cfg = webConfig();
  if (!cfg) return null;
  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(cfg);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  return a ? getAuth(a) : null;
}

export function getFirebaseDb(): Firestore | null {
  const a = getFirebaseApp();
  return a ? getFirestore(a) : null;
}
