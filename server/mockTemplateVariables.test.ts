import { describe, expect, it } from "vitest";
import { generateMockWebhookPayload } from "../client/src/lib/mockWebhookPayload";
import { DEFAULT_MOCK_TEMPLATE_VARIABLES, MOCK_VARIABLE_PRESETS, getMockVariablePreset, getMockVariablePresetId, randomizeMockTemplateVariables, readMockTemplateStorage, validateMockTemplateVariables, writeMockTemplateStorage } from "../client/src/lib/mockTemplateVariables";
import { buildWebhookCurl, filterHistory } from "../client/src/lib/webhookHistory";
import { buildComparisonCard, getComparisonEvent, getComparisonReference } from "../client/src/lib/mockComparison";

describe("mock template variables and special features", () => {
  it("exposes named common-scenario presets with valid variables", () => {
    expect(MOCK_VARIABLE_PRESETS.map(preset => preset.id)).toEqual(["default", "high_value_payment", "new_customer", "github_release", "slack_alert", "edge_case"]);
    for (const preset of MOCK_VARIABLE_PRESETS) expect(validateMockTemplateVariables(preset.variables).valid).toBe(true);
    expect(getMockVariablePreset("github_release")?.name).toBe("GitHub Release");
    const loaded = getMockVariablePreset("slack_alert");
    expect(loaded?.variables).toMatchObject({ teamId: "T_ALERTS01", channelId: "C_INCIDENT01", messageText: "[SEV-2] Elevated webhook latency detected" });
    expect(getMockVariablePresetId(loaded!.variables)).toBe("slack_alert");
    expect(getMockVariablePresetId(DEFAULT_MOCK_TEMPLATE_VARIABLES)).toBe("default");
    expect(getMockVariablePresetId({ ...DEFAULT_MOCK_TEMPLATE_VARIABLES, amount: "777" })).toBe("custom");
  });

  it("substitutes editable amounts, IDs, timestamps, and provider fields", () => {
    const variables = { ...DEFAULT_MOCK_TEMPLATE_VARIABLES, amount: "9876", paymentId: "pay_custom", customerId: "cus_custom", timestamp: "1800000000", repository: "team/custom-repo", branch: "release", messageText: "Deploy fixture" };
    expect(generateMockWebhookPayload("generic", "payment.succeeded", variables)).toMatchObject({ created: 1800000000, data: { id: "pay_custom", amount: 9876, customer: "cus_custom" } });
    expect(generateMockWebhookPayload("github", "push", variables)).toMatchObject({ ref: "refs/heads/release", repository: { full_name: "team/custom-repo" }, commits: [{ message: "Deploy fixture" }] });
  });

  it("validates numeric and identity fields", () => {
    const invalid = validateMockTemplateVariables({ ...DEFAULT_MOCK_TEMPLATE_VARIABLES, amount: "-1", timestamp: "nope", email: "bad" });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.amount).toBeTruthy();
    expect(invalid.errors.timestamp).toBeTruthy();
    expect(invalid.errors.email).toBeTruthy();
  });

  it("randomizes deterministically for repeatable fixture generation", () => {
    const first = randomizeMockTemplateVariables(DEFAULT_MOCK_TEMPLATE_VARIABLES, 123);
    const second = randomizeMockTemplateVariables(DEFAULT_MOCK_TEMPLATE_VARIABLES, 123);
    expect(first).toEqual(second);
    expect(first.amount).not.toBe(DEFAULT_MOCK_TEMPLATE_VARIABLES.amount);
  });

  it("round-trips variable preferences and safely rejects malformed storage", () => {
    const writes: Record<string, string> = {};
    const storage = { setItem: (key: string, value: string) => { writes[key] = value; }, getItem: (key: string) => writes[key] ?? null } as Pick<Storage, "setItem" | "getItem">;
    const variables = { ...DEFAULT_MOCK_TEMPLATE_VARIABLES, amount: "321" };
    expect(writeMockTemplateStorage(storage, variables, true, "123", "high_value_payment")).toBe(true);
    expect(readMockTemplateStorage(storage)).toEqual({ variables, randomize: true, seed: "123", presetId: "high_value_payment" });
    const malformed = { getItem: () => "not-json" } as Pick<Storage, "getItem">;
    expect(readMockTemplateStorage(malformed)).toEqual({ variables: DEFAULT_MOCK_TEMPLATE_VARIABLES, randomize: false, seed: "20260820", presetId: "default" });
  });

  it("covers provider comparison fallback and provider-specific references", () => {
    expect(getComparisonEvent("github", "payment.succeeded")).toBe("push");
    expect(getComparisonEvent("slack", "payment.succeeded")).toBe("event_callback");
    expect(getComparisonReference("github", "sha512").header).toBe("sha256=${hmac_sha256}");
    expect(getComparisonReference("slack", "sha512").canonical).toBe("v0:${timestamp}:${raw_body}");
    expect(buildComparisonCard("stripe", "push", DEFAULT_MOCK_TEMPLATE_VARIABLES, "sha512").event).toBe("payment.succeeded");
  });

  it("filters history by date range and exports safely quoted cURL", () => {
    const history = [
      { provider: "stripe", type: "payment.succeeded", verification: "PASS" as const, createdAt: Date.parse("2026-08-20T12:00:00Z"), id: "a", algorithm: "sha256", payload: { text: "O'Reilly" }, generated: "t=1,v1=x", effective: "t=1,v1=x", status: 202, timestamp: "08/20/26", snapshot: {} },
      { provider: "github", type: "push", verification: "PASS" as const, createdAt: Date.parse("2026-08-18T12:00:00Z"), id: "b", algorithm: "sha256", payload: {}, generated: "sha256=x", effective: "sha256=x", status: 202, timestamp: "08/18/26", snapshot: {} },
    ];
    expect(filterHistory(history, { provider: "ALL", type: "ALL", verification: "ALL", startDate: "2026-08-19", endDate: "2026-08-20" })).toHaveLength(1);
    expect(buildWebhookCurl(history[0]!)).toContain("REPLACE_WITH_SIGNING_SECRET");
    expect(buildWebhookCurl(history[0]!)).toContain("O'\\''Reilly");
  });
});
