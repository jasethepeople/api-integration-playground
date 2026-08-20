export type MockWebhookProvider = "generic" | "stripe";
export type MockWebhookEvent = "payment.succeeded" | "user.created" | "order.updated";

const created = 1721318400;

function eventObject(type: MockWebhookEvent) {
  if (type === "payment.succeeded") {
    return { id: "pay_mock_001", object: "payment", amount: 12500, currency: "usd", customer: "cus_mock_001", status: "succeeded" };
  }
  if (type === "user.created") {
    return { id: "usr_mock_001", object: "user", email: "developer@example.test", name: "Developer Example", created };
  }
  return { id: "ord_mock_001", object: "order", customer: "cus_mock_001", amount_total: 12500, currency: "usd", status: "updated" };
}

export function generateMockWebhookPayload(provider: MockWebhookProvider, type: MockWebhookEvent) {
  const object = eventObject(type);
  if (provider === "stripe") {
    return { id: "evt_mock_stripe_001", object: "event", api_version: "2024-06-20", created, livemode: false, type, data: { object } };
  }
  return { id: "evt_mock_generic_001", provider: "generic", event: type, created, data: object };
}

export function generateMockWebhookPayloadJson(provider: MockWebhookProvider, type: MockWebhookEvent) {
  return JSON.stringify(generateMockWebhookPayload(provider, type), null, 2);
}
