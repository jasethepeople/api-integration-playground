import { getProviderReference, type ProviderReference } from "./providerReference";
import { generateMockWebhookPayload, type MockWebhookEvent, type MockWebhookProvider } from "./mockWebhookPayload";
import { type MockTemplateVariables } from "./mockTemplateVariables";

export const COMPARISON_EVENTS: Record<MockWebhookProvider, MockWebhookEvent[]> = {
  generic: ["payment.succeeded", "user.created", "order.updated"],
  stripe: ["payment.succeeded", "user.created", "order.updated"],
  github: ["push", "pull_request"],
  slack: ["event_callback", "url_verification"],
};

export function getComparisonEvent(provider: MockWebhookProvider, selectedEvent: MockWebhookEvent): MockWebhookEvent {
  const supported = COMPARISON_EVENTS[provider];
  return supported.includes(selectedEvent) ? selectedEvent : supported[0];
}

export function getComparisonReference(provider: MockWebhookProvider, algorithm: "sha256" | "sha512", generatedSignature = ""): ProviderReference {
  const effectiveAlgorithm = provider === "github" || provider === "slack" ? "sha256" : algorithm;
  return getProviderReference(provider, effectiveAlgorithm, generatedSignature);
}

export function buildComparisonCard(provider: MockWebhookProvider, selectedEvent: MockWebhookEvent, variables: MockTemplateVariables, algorithm: "sha256" | "sha512") {
  const event = getComparisonEvent(provider, selectedEvent);
  return { provider, event, payload: generateMockWebhookPayload(provider, event, variables), reference: getComparisonReference(provider, algorithm) };
}
