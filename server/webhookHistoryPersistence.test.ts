import { describe, expect, it } from "vitest";
import { DEFAULT_HISTORY_FILTER, WEBHOOK_HISTORY_STORAGE_KEY, clearHistoryStorage, readHistoryStorage, resolveClearHistoryDecision, restoreHistoryState, serializeHistoryState, writeHistoryStorage } from "../client/src/lib/webhookHistory";

const entry = {
  id: "evt-1",
  type: "payment.succeeded",
  provider: "stripe",
  algorithm: "sha256",
  payload: { id: "evt-1" },
  generated: "t=1,v1=abc",
  effective: "t=1,v1=abc",
  status: 202,
  verification: "PASS" as const,
  timestamp: "12:00:00",
  snapshot: { accepted: true },
};

describe("webhook history browser storage", () => {
  it("round-trips bounded history and filter preferences", () => {
    const history = Array.from({ length: 9 }, (_, index) => ({ ...entry, id: `evt-${index}` }));
    const raw = serializeHistoryState(history, { provider: "stripe", type: "payment.succeeded", verification: "PASS" });
    const restored = restoreHistoryState(raw);
    expect(restored.history).toHaveLength(8);
    expect(restored.history[0]?.id).toBe("evt-0");
    expect(restored.filter).toEqual({ provider: "stripe", type: "payment.succeeded", verification: "PASS" });
  });

  it("ignores malformed storage payloads and invalid entries", () => {
    expect(restoreHistoryState("not-json")).toEqual({ history: [], filter: DEFAULT_HISTORY_FILTER });
    expect(restoreHistoryState(JSON.stringify({ history: [{ id: 4 }], filter: { verification: "MAYBE" } }))).toEqual({ history: [], filter: DEFAULT_HISTORY_FILTER });
  });

  it("handles unavailable browser storage without throwing", () => {
    const blockedRead = { getItem: () => { throw new Error("blocked"); } } as unknown as Pick<Storage, "getItem">;
    const blockedWrite = { setItem: () => { throw new Error("blocked"); } } as unknown as Pick<Storage, "setItem">;
    expect(readHistoryStorage(blockedRead)).toEqual({ history: [], filter: DEFAULT_HISTORY_FILTER });
    expect(writeHistoryStorage(blockedWrite, [entry], DEFAULT_HISTORY_FILTER)).toBe(false);
  });

  it("writes under the stable history storage key", () => {
    const writes: Record<string, string> = {};
    const storage = { setItem: (key: string, value: string) => { writes[key] = value; } } as Pick<Storage, "setItem">;
    expect(writeHistoryStorage(storage, [entry], DEFAULT_HISTORY_FILTER)).toBe(true);
    expect(JSON.parse(writes[WEBHOOK_HISTORY_STORAGE_KEY]!)).toMatchObject({ history: [entry], filter: DEFAULT_HISTORY_FILTER });
  });

  it("clears the saved history key and handles blocked removal", () => {
    const removed: string[] = [];
    const storage = { removeItem: (key: string) => { removed.push(key); } } as Pick<Storage, "removeItem">;
    expect(clearHistoryStorage(storage)).toBe(true);
    expect(removed).toEqual([WEBHOOK_HISTORY_STORAGE_KEY]);
    expect(clearHistoryStorage({ removeItem: () => { throw new Error("blocked"); } } as Pick<Storage, "removeItem">)).toBe(false);
  });

  it("resets history and selection while preserving active filters on confirm", () => {
    const activeFilter = { provider: "stripe", type: "payment.succeeded", verification: "PASS" as const };
    expect(resolveClearHistoryDecision("confirm", [entry], "evt-1", activeFilter)).toMatchObject({ history: [], selectedHistoryId: null, filter: activeFilter, cleared: true });
  });

  it("leaves history, selection, and filters unchanged on cancel", () => {
    const activeFilter = { provider: "generic", type: "ALL", verification: "ALL" as const };
    const history = [entry];
    expect(resolveClearHistoryDecision("cancel", history, "evt-1", activeFilter)).toEqual({ history, selectedHistoryId: "evt-1", filter: activeFilter, cleared: false });
  });
});
