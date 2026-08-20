import { describe, expect, it } from "vitest";
import { getCopyResetTransition, getCopyTransition, getReferenceCopyLabel, getReferenceCopyValue } from "../client/src/lib/referenceCopy";
import { getProviderReference } from "../client/src/lib/providerReference";

describe("provider reference copy controls", () => {
  it("routes canonical and header actions to the matching values", () => {
    const reference = getProviderReference("generic", "sha256", "t=1,v1=abc");
    expect(getReferenceCopyValue(reference, "canonical")).toBe(reference.canonical);
    expect(getReferenceCopyValue(reference, "header")).toBe(reference.header);
  });

  it("shows copied, retry, and default states", () => {
    expect(getReferenceCopyLabel("canonical", "canonical")).toBe("COPIED");
    expect(getReferenceCopyLabel("header", "error")).toBe("RETRY");
    expect(getReferenceCopyLabel("header", null)).toBe("COPY");
  });

  it("transitions success to reset and failure to retry", () => {
    expect(getCopyTransition("canonical", true)).toEqual({ copied: "canonical", error: null });
    expect(getCopyResetTransition()).toEqual({ copied: null, error: null });
    expect(getCopyTransition("header", false)).toEqual({ copied: null, error: "header" });
  });

  it("switches copy targets with the active provider profile", () => {
    const generic = getProviderReference("generic", "sha256", "t=1,v1=abc");
    const stripe = getProviderReference("stripe", "sha256", "t=1,v1=abc,v0=legacy");
    expect(getReferenceCopyValue(generic, "header")).toContain("hmac_sha256");
    expect(getReferenceCopyValue(stripe, "header")).toContain("legacy_hmac_sha256");
  });
});
