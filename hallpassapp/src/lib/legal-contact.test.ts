import { describe, expect, it } from "vitest";
import { LEGAL_CONTACT_EMAIL } from "./legal-contact";

describe("LEGAL_CONTACT_EMAIL", () => {
  it("is a valid mailto target for IP inquiries", () => {
    expect(LEGAL_CONTACT_EMAIL).toBe("natenate@vectorstarprobabilitydynamics.com");
    expect(LEGAL_CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
