import { describe, expect, it } from "vitest";
import { DEFAULT_MOCK_TEMPLATE_VARIABLES } from "../client/src/lib/mockTemplateVariables";
import { appendGenerationHistory, MOCK_GENERATION_HISTORY_LIMIT, readGenerationHistory, restoreGenerationVariables, writeGenerationHistory } from "../client/src/lib/mockGenerationHistory";

describe("automatic mock-variable generation history", () => {
  it("keeps newest-first bounded snapshots and restores an independent copy", () => {
    let history = [];
    for (let index = 0; index < MOCK_GENERATION_HISTORY_LIMIT + 2; index += 1) history = appendGenerationHistory(history, { id: `g_${index}`, mode: "payment", seed: String(index), variables: { ...DEFAULT_MOCK_TEMPLATE_VARIABLES, amount: String(index) }, createdAt: index });
    expect(history).toHaveLength(MOCK_GENERATION_HISTORY_LIMIT);
    expect(history[0]?.id).toBe(`g_${MOCK_GENERATION_HISTORY_LIMIT + 1}`);
    const restored = restoreGenerationVariables(history[0]!);
    restored.amount = "changed";
    expect(history[0]?.variables.amount).toBe(String(MOCK_GENERATION_HISTORY_LIMIT + 1));
  });

  it("round-trips history safely and ignores malformed stored data", () => {
    const writes: Record<string, string> = {};
    const storage = { setItem: (key: string, value: string) => { writes[key] = value; }, getItem: (key: string) => writes[key] ?? null } as Pick<Storage, "setItem" | "getItem">;
    const history = appendGenerationHistory([], { id: "g_1", mode: "slack", seed: "7", variables: DEFAULT_MOCK_TEMPLATE_VARIABLES, createdAt: 7 });
    expect(writeGenerationHistory(storage, history)).toBe(true);
    expect(readGenerationHistory(storage)).toEqual(history);
    expect(readGenerationHistory({ getItem: () => "bad" })).toEqual([]);
  });
});
