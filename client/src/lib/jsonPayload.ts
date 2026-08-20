export type JsonPayloadResult = {
  valid: boolean;
  value?: unknown;
  formatted: string;
  error?: string;
};

export function validateJsonPayload(input: string): JsonPayloadResult {
  if (!input.trim()) {
    return { valid: false, formatted: input, error: "Payload is required." };
  }

  try {
    const value: unknown = JSON.parse(input);
    return { valid: true, value, formatted: JSON.stringify(value, null, 2) };
  } catch (error) {
    return { valid: false, formatted: input, error: error instanceof Error ? error.message : "Invalid JSON syntax." };
  }
}

export function formatJsonPayload(input: string): JsonPayloadResult {
  return validateJsonPayload(input);
}
