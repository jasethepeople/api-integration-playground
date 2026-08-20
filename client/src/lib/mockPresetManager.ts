import { DEFAULT_MOCK_TEMPLATE_VARIABLES, MOCK_VARIABLE_PRESETS, randomizeMockTemplateVariables, validateMockTemplateVariables, type MockPresetEvent, type MockPresetProvider, type MockTemplateVariables, type MockVariablePreset, type MockVariablePresetId } from "./mockTemplateVariables";

export type AutoGenerationMode = "balanced" | "payment" | "identity" | "github" | "slack" | "edge";
export const CUSTOM_PRESET_STORAGE_KEY = "api-playground:custom-presets:v1";
export const PRESET_PACK_VERSION = 1;

function slugify(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32) || "preset"; }
function uniqueId(base: string, existing: MockVariablePreset[]): string { const root = `custom_${slugify(base)}`; let id = root; let index = 2; while (existing.some(preset => preset.id === id)) id = `${root}_${index++}`; return id; }

export function isPresetCompatible(preset: Pick<MockVariablePreset, "providers" | "events">, provider: MockPresetProvider, event: MockPresetEvent): boolean {
  return preset.providers.includes(provider) && preset.events.includes(event);
}

export function filterMockVariablePresets(presets: MockVariablePreset[], provider: MockPresetProvider | "ALL", event: MockPresetEvent | "ALL"): MockVariablePreset[] {
  return presets.filter(preset => (provider === "ALL" || preset.providers.includes(provider)) && (event === "ALL" || preset.events.includes(event)));
}

export function saveCustomPreset(existing: MockVariablePreset[], name: string, description: string, variables: MockTemplateVariables, providers: MockPresetProvider[], events: MockPresetEvent[], id?: MockVariablePresetId): { presets: MockVariablePreset[]; preset: MockVariablePreset } {
  const validation = validateMockTemplateVariables(variables);
  if (!validation.valid) throw new Error("Cannot save an invalid variable preset");
  const existingId = id && existing.some(preset => preset.id === id) ? id : uniqueId(name, existing);
  const preset: MockVariablePreset = { id: existingId, name: name.trim() || "Untitled Preset", description: description.trim() || "User-created mock-variable preset.", variables: { ...variables }, providers, events, builtIn: false };
  return { presets: [...existing.filter(item => item.id !== existingId), preset], preset };
}

export function deleteCustomPreset(existing: MockVariablePreset[], id: MockVariablePresetId): MockVariablePreset[] {
  return existing.filter(preset => preset.id !== id || preset.builtIn);
}

export function resolvePresetDeleteDecision(decision: "cancel" | "confirm", existing: MockVariablePreset[], id: MockVariablePresetId): { presets: MockVariablePreset[]; deleted: boolean } {
  if (decision === "cancel") return { presets: existing, deleted: false };
  const presets = deleteCustomPreset(existing, id);
  return { presets, deleted: presets.length !== existing.length };
}

export function serializeCustomPresetPack(presets: MockVariablePreset[]): string {
  return JSON.stringify({ version: PRESET_PACK_VERSION, presets: presets.filter(preset => !preset.builtIn) }, null, 2);
}

export function buildPresetPackHandoff(baseUrl: string, presets: MockVariablePreset[]): string {
  return `${baseUrl.split("#")[0]}#preset-pack=${encodeURIComponent(serializeCustomPresetPack(presets))}`;
}

export function readPresetPackHandoff(hash: string): string | null {
  const match = hash.match(/(?:^#|&)preset-pack=([^&]+)/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every(item => typeof item === "string"); }

export function parseCustomPresetPack(raw: string, existing: MockVariablePreset[] = []): { presets: MockVariablePreset[]; imported: number; rejected: number } {
  try {
    const parsed: unknown = JSON.parse(raw);
    const candidate = isRecord(parsed) && Array.isArray(parsed.presets) ? parsed.presets : Array.isArray(parsed) ? parsed : [];
    const accepted: MockVariablePreset[] = [];
    for (const item of candidate) {
      if (!isRecord(item) || typeof item.name !== "string" || !isRecord(item.variables) || !isStringArray(item.providers) || !isStringArray(item.events)) continue;
      const variables = { ...DEFAULT_MOCK_TEMPLATE_VARIABLES, ...item.variables } as MockTemplateVariables;
      if (!validateMockTemplateVariables(variables).valid) continue;
      const providers = item.providers.filter(value => ["generic", "stripe", "github", "slack"].includes(value)) as MockPresetProvider[];
      const events = item.events.filter(value => ["payment.succeeded", "user.created", "order.updated", "push", "pull_request", "event_callback", "url_verification"].includes(value)) as MockPresetEvent[];
      if (!providers.length || !events.length) continue;
      accepted.push({ id: uniqueId(item.name, [...existing, ...accepted]), name: item.name.trim(), description: typeof item.description === "string" ? item.description : "Imported mock-variable preset.", variables, providers, events, builtIn: false });
    }
    return { presets: [...existing, ...accepted], imported: accepted.length, rejected: candidate.length - accepted.length };
  } catch { return { presets: existing, imported: 0, rejected: 0 }; }
}

export function resolvePresetImportDecision(decision: "cancel" | "confirm", raw: string, existing: MockVariablePreset[]): { presets: MockVariablePreset[]; imported: number; rejected: number } {
  return decision === "cancel" ? { presets: existing, imported: 0, rejected: 0 } : parseCustomPresetPack(raw, existing);
}

export function getPresetHandoffNotice(success: boolean): string {
  return success ? "PRESET HANDOFF LINK COPIED" : "HANDOFF COPY UNAVAILABLE";
}

export function readCustomPresets(storage: Pick<Storage, "getItem"> | undefined): MockVariablePreset[] {
  try { const raw = storage?.getItem(CUSTOM_PRESET_STORAGE_KEY); if (!raw) return []; return parseCustomPresetPack(raw).presets; } catch { return []; }
}
export function writeCustomPresets(storage: Pick<Storage, "setItem"> | undefined, presets: MockVariablePreset[]): boolean {
  try { if (!storage) return false; storage.setItem(CUSTOM_PRESET_STORAGE_KEY, serializeCustomPresetPack(presets)); return true; } catch { return false; }
}

export function generateAutomaticMockVariables(mode: AutoGenerationMode, base: MockTemplateVariables = DEFAULT_MOCK_TEMPLATE_VARIABLES, seed = Date.now()): MockTemplateVariables {
  const generated = randomizeMockTemplateVariables(base, seed);
  if (mode === "payment") return { ...generated, amount: String(10000 + (Number(generated.amount) % 490000)), currency: "usd", messageText: "Automated payment fixture" };
  if (mode === "identity") return { ...generated, email: `user_${generated.userId.replace("usr_", "")}@example.test`, name: "Generated Customer", messageText: "Automated identity fixture" };
  if (mode === "github") return { ...generated, repository: "generated-org/integration-api", branch: "feature/generated-fixture", messageText: "Automated GitHub fixture" };
  if (mode === "slack") return { ...generated, channelId: "C_AUTOGEN01", messageText: "[AUTO] Generated Slack fixture" };
  if (mode === "edge") return { ...generated, amount: "0", currency: "jpy", pullRequestNumber: "1", messageText: "Automated edge-case fixture" };
  return generated;
}

export { MOCK_VARIABLE_PRESETS };
