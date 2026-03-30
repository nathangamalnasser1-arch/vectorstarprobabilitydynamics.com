import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("getPrimaryBackend", () => {
  const env = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = env;
  });

  it("returns firebase when Firebase web config is present", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "k";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "p";
    const { getPrimaryBackend } = await import("./data-backend");
    expect(getPrimaryBackend()).toBe("firebase");
  });

  it("returns supabase when only Supabase is configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    const { getPrimaryBackend } = await import("./data-backend");
    expect(getPrimaryBackend()).toBe("supabase");
  });

  it("prefers firebase over supabase when both are set", async () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "k";
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "p";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    const { getPrimaryBackend } = await import("./data-backend");
    expect(getPrimaryBackend()).toBe("firebase");
  });
});
