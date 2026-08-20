export type ProviderReferenceProfile = "generic" | "stripe" | "github" | "slack";

export type ProviderReference = {
  name: string;
  description: string;
  canonical: string;
  header: string;
  exampleLabel: string;
};

export function getProviderReference(provider: ProviderReferenceProfile, algorithm: string, generatedHeader: string): ProviderReference {
  if (provider === "github") {
    return { name: "GITHUB", description: "Raw-body HMAC digest sent as X-Hub-Signature-256.", canonical: "${raw_body}", header: "sha256=${hmac_sha256}", exampleLabel: generatedHeader || "sha256=..." };
  }
  if (provider === "slack") {
    return { name: "SLACK", description: "Versioned timestamped signing string represented as a combined simulator header.", canonical: "v0:${timestamp}:${raw_body}", header: "t=${timestamp},v0=${hmac_sha256}", exampleLabel: generatedHeader || "t=...,v0=..." };
  }
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
