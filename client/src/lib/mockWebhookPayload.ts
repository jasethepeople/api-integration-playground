import { DEFAULT_MOCK_TEMPLATE_VARIABLES, formatMockTemplateValue, type MockTemplateVariables } from "./mockTemplateVariables";

export type MockWebhookProvider = "generic" | "stripe" | "github" | "slack";
export type MockWebhookEvent = "payment.succeeded" | "user.created" | "order.updated" | "push" | "pull_request" | "event_callback" | "url_verification";

function eventObject(type: MockWebhookEvent, variables: MockTemplateVariables) {
  const amount = formatMockTemplateValue(variables.amount, "amount");
  const timestamp = formatMockTemplateValue(variables.timestamp, "timestamp");
  const prNumber = formatMockTemplateValue(variables.pullRequestNumber, "pullRequestNumber");
  if (type === "push") {
    return { ref: `refs/heads/${variables.branch}`, repository: { id: 123456, full_name: variables.repository, private: false }, pusher: { name: "octocat", email: variables.email }, commits: [{ id: variables.eventId, message: variables.messageText }] };
  }
  if (type === "pull_request") {
    return { action: "opened", number: prNumber, pull_request: { id: 987654, title: variables.messageText, state: "open", head: { ref: `feature/${variables.branch}` }, base: { ref: variables.branch } }, repository: { full_name: variables.repository } };
  }
  if (type === "event_callback") {
    return { token: "verification-token", team_id: variables.teamId, api_app_id: variables.appId, event: { type: "message", user: variables.slackUserId, text: variables.messageText, channel: variables.channelId, ts: `${timestamp}.000100` }, type: "event_callback", event_id: variables.eventId };
  }
  if (type === "url_verification") {
    return { token: "verification-token", challenge: variables.challenge, type: "url_verification" };
  }
  if (type === "payment.succeeded") {
    return { id: variables.paymentId, object: "payment", amount, currency: variables.currency.trim().toLowerCase(), customer: variables.customerId, status: "succeeded" };
  }
  if (type === "user.created") {
    return { id: variables.userId, object: "user", email: variables.email, name: variables.name, created: timestamp };
  }
  return { id: variables.orderId, object: "order", customer: variables.customerId, amount_total: amount, currency: variables.currency.trim().toLowerCase(), status: "updated" };
}

export function generateMockWebhookPayload(provider: MockWebhookProvider, type: MockWebhookEvent, variables: MockTemplateVariables = DEFAULT_MOCK_TEMPLATE_VARIABLES) {
  const object = eventObject(type, variables);
  if (provider === "github") {
    return { ...object, sender: { login: "octocat", id: 1 }, installation: { id: 12345 }, _provider: "github" };
  }
  if (provider === "slack") {
    return object;
  }
  if (provider === "stripe") {
    return { id: variables.eventId, object: "event", api_version: "2024-06-20", created: formatMockTemplateValue(variables.timestamp, "timestamp"), livemode: false, type, data: { object } };
  }
  return { id: variables.eventId, provider: "generic", event: type, created: formatMockTemplateValue(variables.timestamp, "timestamp"), data: object };
}

export function generateMockWebhookPayloadJson(provider: MockWebhookProvider, type: MockWebhookEvent, variables: MockTemplateVariables = DEFAULT_MOCK_TEMPLATE_VARIABLES) {
  return JSON.stringify(generateMockWebhookPayload(provider, type, variables), null, 2);
}
