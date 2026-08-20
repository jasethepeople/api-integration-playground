export type JsonPayloadLocation = { line: number; column: number; position: number };

export type JsonPayloadResult = {
  valid: boolean;
  value?: unknown;
  formatted: string;
  error?: string;
  location?: JsonPayloadLocation;
};

function getParseLocation(input: string, error: unknown): JsonPayloadLocation {
  const message = error instanceof Error ? error.message : "";
  const match = message.match(/position\s+(\d+)/i);
  const position = match ? Number(match[1]) : input.length;
  const safePosition = Math.max(0, Math.min(position, input.length));
  const before = input.slice(0, safePosition);
  const line = before.split("\n").length;
  const lastBreak = before.lastIndexOf("\n");
  return { line, column: safePosition - lastBreak, position: safePosition };
}

export function validateJsonPayload(input: string): JsonPayloadResult {
  if (!input.trim()) {
    return { valid: false, formatted: input, error: "Payload is required.", location: { line: 1, column: 1, position: 0 } };
  }

  try {
    const value: unknown = JSON.parse(input);
    return { valid: true, value, formatted: JSON.stringify(value, null, 2) };
  } catch (error) {
    return { valid: false, formatted: input, error: error instanceof Error ? error.message : "Invalid JSON syntax.", location: getParseLocation(input, error) };
  }
}

export function formatJsonPayload(input: string): JsonPayloadResult {
  return validateJsonPayload(input);
}
