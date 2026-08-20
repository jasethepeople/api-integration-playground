import { describe, expect, it } from "vitest";
import { formatJsonPayload, validateJsonPayload } from "../client/src/lib/jsonPayload";

describe("webhook payload JSON validation", () => {
  it("returns a parsed value and formatted representation for valid JSON", () => {
    const result = validateJsonPayload('{"id":"evt_1","nested":{"ok":true}}');
    expect(result).toMatchObject({ valid: true, value: { id: "evt_1", nested: { ok: true } } });
    expect(result.formatted).toBe('{\n  "id": "evt_1",\n  "nested": {\n    "ok": true\n  }\n}');
  });

  it("returns a visible parse error and preserves malformed text", () => {
    const malformed = '{"id": }';
    const result = validateJsonPayload(malformed);
    expect(result.valid).toBe(false);
    expect(result.formatted).toBe(malformed);
    expect(result.error).toBeTruthy();
  });

  it("does not overwrite blank or malformed payloads during auto-format", () => {
    expect(formatJsonPayload("")).toMatchObject({ valid: false, formatted: "", error: "Payload is required." });
    expect(formatJsonPayload('{"id": }')).toMatchObject({ valid: false, formatted: '{"id": }' });
  });

  it("reports a one-based line and column for single-line errors", () => {
    const result = validateJsonPayload('{"id": }');
    expect(result.location?.line).toBe(1);
    expect(result.location?.column).toBeGreaterThan(1);
  });

  it("reports the correct line for multi-line errors", () => {
    const result = validateJsonPayload('{\n  "id": "evt_1",\n  "amount": }');
    expect(result.location?.line).toBe(3);
    expect(result.location?.column).toBeGreaterThan(1);
  });
});

