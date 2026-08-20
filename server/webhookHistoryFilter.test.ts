import { describe, expect, it } from "vitest";
import { filterHistory } from "../client/src/lib/webhookHistory";

type Entry = { id: string; provider: string; type: string; verification: "PASS" | "FAIL" };

const entries: Entry[] = [
  { id: "newest", provider: "stripe", type: "payment.succeeded", verification: "PASS" },
  { id: "middle", provider: "generic", type: "user.created", verification: "FAIL" },
  { id: "oldest", provider: "stripe", type: "user.created", verification: "PASS" },
];

describe("webhook history filters", () => {
  it("filters by provider, event type, and outcome together", () => {
    expect(filterHistory(entries, { provider: "stripe", type: "user.created", verification: "PASS" }).map(entry => entry.id)).toEqual(["oldest"]);
  });

  it("keeps newest-first order and returns all entries for ALL filters", () => {
    expect(filterHistory(entries, { provider: "ALL", type: "ALL", verification: "ALL" }).map(entry => entry.id)).toEqual(["newest", "middle", "oldest"]);
  });

  it("returns an empty result when no entries match", () => {
    expect(filterHistory(entries, { provider: "generic", type: "payment.succeeded", verification: "PASS" })).toEqual([]);
  });
});
