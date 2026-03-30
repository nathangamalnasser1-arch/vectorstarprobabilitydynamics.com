import { describe, expect, it } from "vitest";
import { shouldIncludeCandidateForViewer } from "./gender-discovery";

describe("shouldIncludeCandidateForViewer", () => {
  it("male viewer sees women only", () => {
    expect(shouldIncludeCandidateForViewer("male", "female")).toBe(true);
    expect(shouldIncludeCandidateForViewer("male", "male")).toBe(false);
  });

  it("female viewer sees men only", () => {
    expect(shouldIncludeCandidateForViewer("female", "male")).toBe(true);
    expect(shouldIncludeCandidateForViewer("female", "female")).toBe(false);
  });

  it("non_binary viewer sees everyone", () => {
    expect(shouldIncludeCandidateForViewer("non_binary", "male")).toBe(true);
    expect(shouldIncludeCandidateForViewer("non_binary", "female")).toBe(true);
  });
});
