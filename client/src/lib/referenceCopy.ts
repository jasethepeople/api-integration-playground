import type { ProviderReference } from "./providerReference";

export type CopyTarget = "canonical" | "header";
export type CopyState = CopyTarget | "error" | null;
export type CopyTransition = { copied: CopyTarget | null; error: CopyTarget | null };

export function getReferenceCopyValue(reference: ProviderReference, target: CopyTarget): string {
  return target === "canonical" ? reference.canonical : reference.header;
}

export function getReferenceCopyLabel(target: CopyTarget, state: CopyState): string {
  if (state === target) return "COPIED";
  if (state === "error") return "RETRY";
  return "COPY";
}

export function getCopyTransition(target: CopyTarget, success: boolean): CopyTransition {
  return success ? { copied: target, error: null } : { copied: null, error: target };
}

export function getCopyResetTransition(): CopyTransition {
  return { copied: null, error: null };
}
