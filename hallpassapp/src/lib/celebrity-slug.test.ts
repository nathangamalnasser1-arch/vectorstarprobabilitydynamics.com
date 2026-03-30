import { describe, expect, it } from "vitest";
import { slugifyCelebrityName } from "./celebrity-slug";

describe("slugifyCelebrityName", () => {
  it("normalizes accents and punctuation", () => {
    expect(slugifyCelebrityName("Beyoncé")).toBe("beyonce");
    expect(slugifyCelebrityName("Robert Downey Jr.")).toBe("robert-downey-jr");
  });
});
