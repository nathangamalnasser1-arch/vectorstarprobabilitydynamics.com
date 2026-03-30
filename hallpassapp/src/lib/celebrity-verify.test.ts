import { describe, expect, it } from "vitest";
import { verifyCelebrityPublicFigure } from "./celebrity-verify";

describe("verifyCelebrityPublicFigure (heuristics)", () => {
  it("rejects empty or too-short names when no OpenAI", async () => {
    expect((await verifyCelebrityPublicFigure("")).ok).toBe(false);
    expect((await verifyCelebrityPublicFigure("a")).ok).toBe(false);
  });

  it("accepts reasonable names when no OpenAI", async () => {
    expect((await verifyCelebrityPublicFigure("Jane Doe")).ok).toBe(true);
  });
});
