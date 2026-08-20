export type HistoryFilter = {
  provider: string;
  type: string;
  verification: "ALL" | "PASS" | "FAIL";
};

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
