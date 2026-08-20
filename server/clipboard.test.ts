import { describe, expect, it, vi } from "vitest";
import { copyText } from "../client/src/lib/clipboard";

describe("reference copy helper", () => {
  it("reports success only after the clipboard write resolves", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyText(writeText, "${timestamp}.${raw_body}")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("${timestamp}.${raw_body}");
  });

  it("reports failure when clipboard support is unavailable or rejects", async () => {
    await expect(copyText(undefined, "header")).resolves.toBe(false);
    await expect(copyText(vi.fn().mockRejectedValue(new Error("denied")), "header")).resolves.toBe(false);
  });
});
