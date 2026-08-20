import { describe, expect, it } from "vitest";
import { getProviderReference } from "../client/src/lib/providerReference";

describe("provider reference panel data", () => {
  it("describes generic HMAC with the selected algorithm", () => {
    const reference = getProviderReference("generic", "sha512", "t=1,v1=abc");
    expect(reference).toMatchObject({ name: "GENERIC HMAC", canonical: "${timestamp}.${raw_body}", header: "t=${timestamp},v1=${hmac_sha512}", exampleLabel: "t=1,v1=abc" });
  });

  it("describes Stripe-style multi-signature headers", () => {
    const reference = getProviderReference("stripe", "sha256", "t=1,v1=abc,v0=legacy");
    expect(reference).toMatchObject({ name: "STRIPE-STYLE", canonical: "${timestamp}.${raw_body}", header: "t=${timestamp},v1=${hmac_sha256},v0=${legacy_hmac_sha256}", exampleLabel: "t=1,v1=abc,v0=legacy" });
  });
});
