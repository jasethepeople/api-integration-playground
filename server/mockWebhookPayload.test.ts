import { describe, expect, it } from "vitest";
import { generateMockWebhookPayload, generateMockWebhookPayloadJson } from "../client/src/lib/mockWebhookPayload";

describe("mock webhook payload generation", () => {
  it("creates a generic payment payload keyed to the selected event", () => {
    expect(generateMockWebhookPayload("generic", "payment.succeeded")).toMatchObject({ provider: "generic", event: "payment.succeeded", data: { object: "payment", status: "succeeded", amount: 12500 } });
  });

  it("creates a Stripe-style event wrapper for the selected provider", () => {
    expect(generateMockWebhookPayload("stripe", "user.created")).toMatchObject({ object: "event", type: "user.created", api_version: "2024-06-20", data: { object: { object: "user", email: "developer@example.test" } } });
  });

  it("returns formatted valid JSON for every supported event type", () => {
    for (const type of ["payment.succeeded", "user.created", "order.updated"] as const) {
      const json = generateMockWebhookPayloadJson("stripe", type);
      expect(JSON.parse(json)).toMatchObject({ type });
      expect(json).toContain("\n");
    }
  });
});

