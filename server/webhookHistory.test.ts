import { describe, expect, it } from "vitest";
import { appendHistory, getHistoryCopyLabel, getHistoryInspection, getHistorySignature } from "../client/src/lib/webhookHistory";

describe("webhook history", () => {
  it("keeps the newest eight entries in newest-first order", () => {
    const existing = Array.from({ length: 8 }, (_, index) => `old-${index}`);
    const result = appendHistory(existing, "new-entry");
    expect(result).toHaveLength(8);
    expect(result[0]).toBe("new-entry");
    expect(result).not.toContain("old-7");
  });

  it("returns the requested historical signature", () => {
    const entry = { generated: "generated-header", effective: "effective-header" };
    expect(getHistorySignature(entry, "generated")).toBe("generated-header");
    expect(getHistorySignature(entry, "effective")).toBe("effective-header");
  });

  it("builds inspection metadata for a selected history entry", () => {
    expect(getHistoryInspection({ snapshot: { id: "evt_1" }, status: 202, provider: "stripe", verification: "PASS" })).toEqual({ response: { id: "evt_1" }, status: "202", source: "HISTORY / STRIPE", verification: "PASS" });
  });

  it("labels generated and effective copy actions across success and retry states", () => {
    expect(getHistoryCopyLabel("h1-generated", "h1-generated", null)).toBe("COPIED");
    expect(getHistoryCopyLabel("h1-effective", null, "h1-effective")).toBe("RETRY");
    expect(getHistoryCopyLabel("h1-effective", null, null)).toBe("COPY EFFECTIVE");
  });
});
