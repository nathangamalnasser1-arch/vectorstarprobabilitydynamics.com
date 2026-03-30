import { describe, expect, it } from "vitest";

/** Canonical hosted URL (Firebase Hosting). Keep in sync with site nav links on the main VSPD site. */
const PUBLIC_SITE_URL = "https://hallpass-vspd.web.app";

describe("publicSiteUrl", () => {
  it("matches the Firebase default hosting URL for project hallpass-vspd", () => {
    expect(PUBLIC_SITE_URL).toBe("https://hallpass-vspd.web.app");
  });
});
