import { isFirebaseConfigured } from "@/lib/firebase/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Which backend powers auth + primary data.
 * Firebase is preferred when `NEXT_PUBLIC_FIREBASE_*` is set (see `isFirebaseConfigured`).
 */
export type PrimaryDataBackend = "firebase" | "supabase" | "none";

export function getPrimaryBackend(): PrimaryDataBackend {
  if (isFirebaseConfigured()) {
    return "firebase";
  }
  if (isSupabaseConfigured()) {
    return "supabase";
  }
  return "none";
}

/** True when either Firebase or Supabase client env is configured. */
export function isAuthBackendConfigured(): boolean {
  return getPrimaryBackend() !== "none";
}
