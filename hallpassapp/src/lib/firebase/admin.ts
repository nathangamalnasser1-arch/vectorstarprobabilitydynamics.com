import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

/** Server-only. Uses `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string). */
export function getFirebaseAdminApp(): App | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  if (adminApp) return adminApp;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    adminApp = initializeApp({
      credential: cert(parsed as Parameters<typeof cert>[0]),
    });
    return adminApp;
  } catch {
    return null;
  }
}

export function getFirebaseAdminDb(): Firestore | null {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}

export function getFirebaseAdminAuth(): Auth | null {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}
