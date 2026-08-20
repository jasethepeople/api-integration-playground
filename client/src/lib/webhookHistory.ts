export type HistoryFilter = {
  provider: string;
  type: string;
  verification: "ALL" | "PASS" | "FAIL";
};

export type PersistedWebhookHistoryEntry = {
  id: string;
  type: string;
  provider: string;
  algorithm: string;
  payload: unknown;
  generated: string;
  effective: string;
  status: number;
  verification: "PASS" | "FAIL";
  timestamp: string;
  snapshot: unknown;
};

export const WEBHOOK_HISTORY_STORAGE_KEY = "api-playground:webhook-history:v1";
export const DEFAULT_HISTORY_FILTER: HistoryFilter = { provider: "ALL", type: "ALL", verification: "ALL" };

export function appendHistory<T>(history: T[], entry: T, limit = 8): T[] {
  return [entry, ...history].slice(0, limit);
}

export function getHistorySignature(entry: { generated: string; effective: string }, kind: "generated" | "effective"): string {
  return kind === "generated" ? entry.generated : entry.effective;
}

export function getHistoryInspection(entry: { snapshot: unknown; status: number; provider: string; verification: "PASS" | "FAIL" }) {
  return { response: entry.snapshot, status: String(entry.status), source: `HISTORY / ${entry.provider.toUpperCase()}`, verification: entry.verification };
}

export function getHistoryCopyLabel(actionId: string, copiedId: string | null, errorId: string | null): string {
  if (copiedId === actionId) return "COPIED";
  if (errorId === actionId) return "RETRY";
  return actionId.endsWith("-generated") ? "COPY GENERATED" : "COPY EFFECTIVE";
}

export function filterHistory<T extends { provider: string; type: string; verification: "PASS" | "FAIL" }>(history: T[], filter: HistoryFilter): T[] {
  return history.filter(entry =>
    (filter.provider === "ALL" || entry.provider === filter.provider) &&
    (filter.type === "ALL" || entry.type === filter.type) &&
    (filter.verification === "ALL" || entry.verification === filter.verification),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredEntry(value: unknown): value is PersistedWebhookHistoryEntry {
  return isRecord(value) && typeof value.id === "string" && typeof value.type === "string" && typeof value.provider === "string" &&
    typeof value.algorithm === "string" && typeof value.generated === "string" && typeof value.effective === "string" &&
    typeof value.status === "number" && (value.verification === "PASS" || value.verification === "FAIL") && typeof value.timestamp === "string";
}

function isHistoryFilter(value: unknown): value is HistoryFilter {
  return isRecord(value) && typeof value.provider === "string" && typeof value.type === "string" &&
    (value.verification === "ALL" || value.verification === "PASS" || value.verification === "FAIL");
}

export function restoreHistoryState(raw: string | null): { history: PersistedWebhookHistoryEntry[]; filter: HistoryFilter } {
  if (!raw) return { history: [], filter: DEFAULT_HISTORY_FILTER };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { history: [], filter: DEFAULT_HISTORY_FILTER };
    const history = Array.isArray(parsed.history) ? parsed.history.filter(isStoredEntry).slice(0, 8) : [];
    const filter = isHistoryFilter(parsed.filter) ? parsed.filter : DEFAULT_HISTORY_FILTER;
    return { history, filter };
  } catch {
    return { history: [], filter: DEFAULT_HISTORY_FILTER };
  }
}

export function serializeHistoryState(history: PersistedWebhookHistoryEntry[], filter: HistoryFilter): string {
  return JSON.stringify({ history: history.slice(0, 8), filter });
}

export function readHistoryStorage(storage: Pick<Storage, "getItem"> | undefined): { history: PersistedWebhookHistoryEntry[]; filter: HistoryFilter } {
  try {
    return restoreHistoryState(storage?.getItem(WEBHOOK_HISTORY_STORAGE_KEY) ?? null);
  } catch {
    return { history: [], filter: DEFAULT_HISTORY_FILTER };
  }
}

export function writeHistoryStorage(storage: Pick<Storage, "setItem"> | undefined, history: PersistedWebhookHistoryEntry[], filter: HistoryFilter): boolean {
  try {
    if (!storage) return false;
    storage.setItem(WEBHOOK_HISTORY_STORAGE_KEY, serializeHistoryState(history, filter));
    return true;
  } catch {
    return false;
  }
}

export function clearHistoryStorage(storage: Pick<Storage, "removeItem"> | undefined): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(WEBHOOK_HISTORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearHistoryState<T>(history: T[], selectedHistoryId: string | null, filter: HistoryFilter) {
  return { history: [] as T[], selectedHistoryId: null as string | null, filter, wasSelected: selectedHistoryId !== null && history.length > 0 };
}

export function resolveClearHistoryDecision<T>(decision: "cancel" | "confirm", history: T[], selectedHistoryId: string | null, filter: HistoryFilter) {
  if (decision === "cancel") return { history, selectedHistoryId, filter, cleared: false };
  return { ...clearHistoryState(history, selectedHistoryId, filter), cleared: true };
}
