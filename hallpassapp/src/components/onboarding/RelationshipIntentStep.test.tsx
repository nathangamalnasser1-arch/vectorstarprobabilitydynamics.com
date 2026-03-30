import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { RelationshipIntent } from "@/types/database";
import { RelationshipIntentStep } from "./RelationshipIntentStep";

function ControlledIntentStep() {
  const [value, setValue] = useState<RelationshipIntent | null>(null);
  return (
    <RelationshipIntentStep
      value={value}
      error={null}
      isSubmitting={false}
      onChange={setValue}
      onSubmit={vi.fn()}
    />
  );
}

describe("RelationshipIntentStep", () => {
  it("requires selecting an intent before finish is enabled", async () => {
    const user = userEvent.setup();
    render(<ControlledIntentStep />);

    const finish = screen.getByRole("button", { name: /finish onboarding/i });
    expect(finish).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /single/i }));
    expect(finish).not.toBeDisabled();
  });
});
