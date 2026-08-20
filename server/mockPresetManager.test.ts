import { describe, expect, it } from "vitest";
import { DEFAULT_MOCK_TEMPLATE_VARIABLES, MOCK_VARIABLE_PRESETS } from "../client/src/lib/mockTemplateVariables";
import { deleteCustomPreset, filterMockVariablePresets, generateAutomaticMockVariables, isPresetCompatible, parseCustomPresetPack, saveCustomPreset, serializeCustomPresetPack } from "../client/src/lib/mockPresetManager";

describe("custom mock preset manager", () => {
  it("saves, overwrites, and deletes custom presets", () => {
    const saved = saveCustomPreset([], "Incident Alert", "For on-call tests", DEFAULT_MOCK_TEMPLATE_VARIABLES, ["slack"], ["event_callback"]);
    expect(saved.preset.id).toBe("custom_incident_alert");
    expect(saved.preset.builtIn).toBe(false);
    const updated = saveCustomPreset(saved.presets, "Incident Alert Updated", "Updated", { ...DEFAULT_MOCK_TEMPLATE_VARIABLES, messageText: "updated" }, ["slack"], ["event_callback"], saved.preset.id);
    expect(updated.presets).toHaveLength(1);
    expect(updated.preset.variables.messageText).toBe("updated");
    expect(deleteCustomPreset([...MOCK_VARIABLE_PRESETS, updated.preset], updated.preset.id)).toHaveLength(MOCK_VARIABLE_PRESETS.length);
    expect(deleteCustomPreset(MOCK_VARIABLE_PRESETS, "default")).toHaveLength(MOCK_VARIABLE_PRESETS.length);
  });

  it("filters presets by provider and event compatibility", () => {
    const presets = [...MOCK_VARIABLE_PRESETS, saveCustomPreset([], "Slack Custom", "", DEFAULT_MOCK_TEMPLATE_VARIABLES, ["slack"], ["event_callback"]).preset];
    expect(filterMockVariablePresets(presets, "slack", "event_callback").map(preset => preset.id)).toEqual(["default", "slack_alert", "edge_case", "custom_slack_custom"]);
    expect(isPresetCompatible(presets.find(preset => preset.id === "github_release")!, "github", "push")).toBe(true);
    expect(isPresetCompatible(presets.find(preset => preset.id === "github_release")!, "slack", "push")).toBe(false);
  });

  it("exports and defensively imports JSON preset packs", () => {
    const custom = saveCustomPreset([], "Payment Smoke", "", DEFAULT_MOCK_TEMPLATE_VARIABLES, ["stripe"], ["payment.succeeded"]).preset;
    const raw = serializeCustomPresetPack([custom]);
    const imported = parseCustomPresetPack(raw);
    expect(imported.imported).toBe(1);
    expect(imported.presets[0]?.name).toBe("Payment Smoke");
    expect(parseCustomPresetPack(JSON.stringify({ presets: [{ name: "bad", variables: {} }] })).imported).toBe(0);
  });

  it("generates deterministic mode-specific variables", () => {
    const paymentA = generateAutomaticMockVariables("payment", DEFAULT_MOCK_TEMPLATE_VARIABLES, 77);
    const paymentB = generateAutomaticMockVariables("payment", DEFAULT_MOCK_TEMPLATE_VARIABLES, 77);
    expect(paymentA).toEqual(paymentB);
    expect(paymentA.currency).toBe("usd");
    expect(generateAutomaticMockVariables("edge", DEFAULT_MOCK_TEMPLATE_VARIABLES, 77).amount).toBe("0");
    expect(generateAutomaticMockVariables("slack", DEFAULT_MOCK_TEMPLATE_VARIABLES, 77).channelId).toBe("C_AUTOGEN01");
  });
});
