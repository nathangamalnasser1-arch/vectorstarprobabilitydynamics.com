import { describe, expect, it } from "vitest";
import {
  formatAccountDisplayName,
  isAccountKind,
  validateAccountRegistration,
} from "./account-kind";

describe("account-kind", () => {
  it("isAccountKind narrows correctly", () => {
    expect(isAccountKind("single")).toBe(true);
    expect(isAccountKind("couple")).toBe(true);
    expect(isAccountKind("family")).toBe(false);
  });

  it("formatAccountDisplayName joins couple names", () => {
    expect(
      formatAccountDisplayName("couple", "Alex", "Jordan")
    ).toBe("Alex & Jordan");
    expect(formatAccountDisplayName("single", "Alex", "Jordan")).toBe("Alex");
  });

  it("validateAccountRegistration requires partner for couple", () => {
    expect(validateAccountRegistration("single", "A", "")).toEqual({ ok: true });
    expect(validateAccountRegistration("couple", "A", "").ok).toBe(false);
    expect(validateAccountRegistration("couple", "", "B").ok).toBe(false);
    expect(validateAccountRegistration("couple", "A", "B")).toEqual({
      ok: true,
    });
  });
});
