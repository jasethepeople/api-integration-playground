export type MockWebhookProvider = "generic" | "stripe" | "github" | "slack";
export type MockWebhookEvent = "payment.succeeded" | "user.created" | "order.updated" | "push" | "pull_request" | "event_callback" | "url_verification";

const created = 1721318400;

function eventObject(type: MockWebhookEvent) {
  if (type === "push") {
    return { ref: "refs/heads/main", repository: { id: 123456, full_name: "octo-org/api-playground", private: false }, pusher: { name: "octocat", email: "octocat@example.test" }, commits: [{ id: "abc123", message: "Update integration fixture" }] };
  }
  if (type === "pull_request") {
    return { action: "opened", number: 42, pull_request: { id: 987654, title: "Add webhook fixture", state: "open", head: { ref: "feature/webhook-fixture" }, base: { ref: "main" } }, repository: { full_name: "octo-org/api-playground" } };
  }
  if (type === "event_callback") {
    return { token: "verification-token", team_id: "T01234567", api_app_id: "A01234567", event: { type: "message", user: "U01234567", text: "Webhook fixture received", channel: "C01234567", ts: "1721318400.000100" }, type: "event_callback", event_id: "Ev01234567" };
  }
  if (type === "url_verification") {
    return { token: "verification-token", challenge: "challenge_mock_001", type: "url_verification" };
  }
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
  if (provider === "github") {
    return { ...object, sender: { login: "octocat", id: 1 }, installation: { id: 12345 }, _provider: "github" };
  }
  if (provider === "slack") {
    return object;
  }
  if (provider === "stripe") {
    return { id: "evt_mock_stripe_001", object: "event", api_version: "2024-06-20", created, livemode: false, type, data: { object } };
  }
  return { id: "evt_mock_generic_001", provider: "generic", event: type, created, data: object };
}

export function generateMockWebhookPayloadJson(provider: MockWebhookProvider, type: MockWebhookEvent) {
  return JSON.stringify(generateMockWebhookPayload(provider, type), null, 2);
}
