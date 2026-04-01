import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let app;

function config() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return {
    apiKey,
    projectId,
    authDomain:
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  };
}

export function isFirebaseConfigured() {
  return config() !== null;
}

export function getFirebaseApp() {
  const cfg = config();
  if (!cfg) return null;
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
  }
  return app;
}

export function getFirebaseAuth() {
  const a = getFirebaseApp();
  return a ? getAuth(a) : null;
}

export function getFirebaseDb() {
  const a = getFirebaseApp();
  return a ? getFirestore(a) : null;
}

export function getGoogleProvider() {
  return new GoogleAuthProvider();
}
