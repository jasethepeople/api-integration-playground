export type ProviderReferenceProfile = "generic" | "stripe";

export type ProviderReference = {
  name: string;
  description: string;
  canonical: string;
  header: string;
  exampleLabel: string;
};

export function getProviderReference(provider: ProviderReferenceProfile, algorithm: string, generatedHeader: string): ProviderReference {
  if (provider === "stripe") {
    return {
      name: "STRIPE-STYLE",
      description: "Timestamped multi-signature envelope with active and legacy versions.",
      canonical: "${timestamp}.${raw_body}",
      header: "t=${timestamp},v1=${hmac_sha256},v0=${legacy_hmac_sha256}",
      exampleLabel: generatedHeader || "t=...,v1=...,v0=...",
    };
  }
  return {
    name: "GENERIC HMAC",
    description: "Timestamped payload signature using the selected HMAC digest.",
    canonical: "${timestamp}.${raw_body}",
    header: `t=\${timestamp},v1=\${hmac_${algorithm}}`,
    exampleLabel: generatedHeader || "t=...,v1=...",
  };
}
