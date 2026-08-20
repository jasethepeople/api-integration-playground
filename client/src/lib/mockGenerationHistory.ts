import { type MockTemplateVariables } from "./mockTemplateVariables";
import { type AutoGenerationMode } from "./mockPresetManager";

export const MOCK_GENERATION_HISTORY_KEY = "api-playground:mock-generation-history:v1";
export const MOCK_GENERATION_HISTORY_LIMIT = 8;

export type MockGenerationHistoryEntry = {
  id: string;
  mode: AutoGenerationMode;
  seed: string;
  variables: MockTemplateVariables;
  createdAt: number;
};

export function appendGenerationHistory(history: MockGenerationHistoryEntry[], entry: Omit<MockGenerationHistoryEntry, "id" | "createdAt"> & Partial<Pick<MockGenerationHistoryEntry, "id" | "createdAt">>): MockGenerationHistoryEntry[] {
  const item: MockGenerationHistoryEntry = {
    id: entry.id ?? `generation_${entry.createdAt ?? Date.now()}`,
    mode: entry.mode,
    seed: entry.seed,
    variables: { ...entry.variables },
    createdAt: entry.createdAt ?? Date.now(),
  };
  return [item, ...history.filter(existing => existing.id !== item.id)].slice(0, MOCK_GENERATION_HISTORY_LIMIT);
}

export function restoreGenerationVariables(entry: MockGenerationHistoryEntry): MockTemplateVariables {
  return { ...entry.variables };
}

function isHistoryEntry(value: unknown): value is MockGenerationHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.mode === "string" && typeof candidate.seed === "string" && typeof candidate.createdAt === "number" && typeof candidate.variables === "object" && candidate.variables !== null;
}

export function readGenerationHistory(storage: Pick<Storage, "getItem"> | undefined): MockGenerationHistoryEntry[] {
  try {
    const raw = storage?.getItem(MOCK_GENERATION_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry).slice(0, MOCK_GENERATION_HISTORY_LIMIT) : [];
  } catch { return []; }
}

export function writeGenerationHistory(storage: Pick<Storage, "setItem"> | undefined, history: MockGenerationHistoryEntry[]): boolean {
  try {
    if (!storage) return false;
    storage.setItem(MOCK_GENERATION_HISTORY_KEY, JSON.stringify(history.slice(0, MOCK_GENERATION_HISTORY_LIMIT)));
    return true;
  } catch { return false; }
}
