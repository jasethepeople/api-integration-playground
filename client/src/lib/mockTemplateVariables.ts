export type MockTemplateVariables = {
  amount: string;
  currency: string;
  paymentId: string;
  orderId: string;
  customerId: string;
  userId: string;
  eventId: string;
  timestamp: string;
  email: string;
  name: string;
  repository: string;
  branch: string;
  pullRequestNumber: string;
  teamId: string;
  appId: string;
  slackUserId: string;
  channelId: string;
  messageText: string;
  challenge: string;
};

export type MockTemplateVariableErrors = Partial<Record<keyof MockTemplateVariables, string>>;

export const DEFAULT_MOCK_TEMPLATE_VARIABLES: MockTemplateVariables = {
  amount: "12500",
  currency: "usd",
  paymentId: "pay_mock_001",
  orderId: "ord_mock_001",
  customerId: "cus_mock_001",
  userId: "usr_mock_001",
  eventId: "Ev01234567",
  timestamp: "1721318400",
  email: "developer@example.test",
  name: "Developer Example",
  repository: "octo-org/api-playground",
  branch: "main",
  pullRequestNumber: "42",
  teamId: "T01234567",
  appId: "A01234567",
  slackUserId: "U01234567",
  channelId: "C01234567",
  messageText: "Webhook fixture received",
  challenge: "challenge_mock_001",
};

export function validateMockTemplateVariables(variables: MockTemplateVariables): { valid: boolean; errors: MockTemplateVariableErrors } {
  const errors: MockTemplateVariableErrors = {};
  const amount = Number(variables.amount);
  const timestamp = Number(variables.timestamp);
  const pullRequestNumber = Number(variables.pullRequestNumber);
  if (!variables.amount.trim() || !Number.isFinite(amount) || amount < 0) errors.amount = "Use a non-negative number";
  if (!/^[a-zA-Z]{3,8}$/.test(variables.currency.trim())) errors.currency = "Use a 3–8 letter currency code";
  if (!Number.isInteger(timestamp) || timestamp <= 0) errors.timestamp = "Use a positive Unix timestamp";
  if (!Number.isInteger(pullRequestNumber) || pullRequestNumber <= 0) errors.pullRequestNumber = "Use a positive integer";
  const requiredText: Array<keyof MockTemplateVariables> = ["paymentId", "orderId", "customerId", "userId", "eventId", "email", "name", "repository", "branch", "teamId", "appId", "slackUserId", "channelId", "messageText", "challenge"];
  for (const key of requiredText) if (!variables[key].trim()) errors[key] = "Required";
  if (!/^\S+@\S+\.\S+$/.test(variables.email.trim())) errors.email = "Use a valid email";
  return { valid: Object.keys(errors).length === 0, errors };
}

function hashSeed(seed: number): number {
  let value = Math.abs(Math.floor(seed)) || 1;
  value = (value ^ 0x9e3779b9) >>> 0;
  return value;
}

function nextRandom(state: { value: number }): number {
  state.value = (1664525 * state.value + 1013904223) >>> 0;
  return state.value / 4294967296;
}

function randomToken(state: { value: number }, prefix: string, length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i += 1) token += alphabet[Math.floor(nextRandom(state) * alphabet.length)];
  return `${prefix}${token}`;
}

export function randomizeMockTemplateVariables(base: MockTemplateVariables = DEFAULT_MOCK_TEMPLATE_VARIABLES, seed = Date.now()): MockTemplateVariables {
  const state = { value: hashSeed(seed) };
  const amount = String(1000 + Math.floor(nextRandom(state) * 99000));
  const timestamp = String(1700000000 + Math.floor(nextRandom(state) * 100000000));
  const suffix = randomToken(state, "", 5);
  return {
    ...base,
    amount,
    timestamp,
    paymentId: `pay_${suffix}`,
    orderId: `ord_${suffix}`,
    customerId: `cus_${suffix}`,
    userId: `usr_${suffix}`,
    eventId: `evt_${suffix}`,
    pullRequestNumber: String(1 + Math.floor(nextRandom(state) * 99)),
    teamId: `T${String(Math.floor(nextRandom(state) * 99999999)).padStart(8, "0")}`,
    appId: `A${String(Math.floor(nextRandom(state) * 99999999)).padStart(8, "0")}`,
    slackUserId: `U${String(Math.floor(nextRandom(state) * 99999999)).padStart(8, "0")}`,
    channelId: `C${String(Math.floor(nextRandom(state) * 99999999)).padStart(8, "0")}`,
    messageText: `Webhook fixture ${suffix}`,
    challenge: `challenge_${suffix}`,
  };
}

export function formatMockTemplateValue(value: string, key: keyof MockTemplateVariables): string | number {
  if (["amount", "timestamp", "pullRequestNumber"].includes(key)) return Number(value);
  return value.trim();
}

export function getMockTemplateVariableGroups() {
  return [
    { label: "PAYMENT", fields: ["amount", "currency", "paymentId", "customerId"] as const },
    { label: "IDENTITY", fields: ["userId", "email", "name", "eventId"] as const },
    { label: "GITHUB", fields: ["repository", "branch", "pullRequestNumber"] as const },
    { label: "SLACK", fields: ["teamId", "appId", "slackUserId", "channelId", "messageText", "challenge"] as const },
    { label: "TIME", fields: ["timestamp"] as const },
  ];
}

export const MOCK_TEMPLATE_VARIABLE_LABELS: Record<keyof MockTemplateVariables, string> = {
  amount: "AMOUNT",
  currency: "CURRENCY",
  paymentId: "PAYMENT ID",
  orderId: "ORDER ID",
  customerId: "CUSTOMER ID",
  userId: "USER ID",
  eventId: "EVENT ID",
  timestamp: "UNIX TIMESTAMP",
  email: "EMAIL",
  name: "DISPLAY NAME",
  repository: "REPOSITORY",
  branch: "BRANCH",
  pullRequestNumber: "PR NUMBER",
  teamId: "TEAM ID",
  appId: "APP ID",
  slackUserId: "SLACK USER ID",
  channelId: "CHANNEL ID",
  messageText: "MESSAGE TEXT",
  challenge: "CHALLENGE",
};

export const MOCK_TEMPLATE_STORAGE_KEY = "api-playground:mock-template:v1";

export function readMockTemplateStorage(storage: Pick<Storage, "getItem"> | undefined): { variables: MockTemplateVariables; randomize: boolean; seed: string } {
  try {
    const raw = storage?.getItem(MOCK_TEMPLATE_STORAGE_KEY);
    if (!raw) return { variables: DEFAULT_MOCK_TEMPLATE_VARIABLES, randomize: false, seed: "20260820" };
    const parsed = JSON.parse(raw) as { variables?: Partial<MockTemplateVariables>; randomize?: boolean; seed?: string };
    const variables = { ...DEFAULT_MOCK_TEMPLATE_VARIABLES, ...(parsed?.variables ?? {}) };
    const result = validateMockTemplateVariables(variables);
    return result.valid ? { variables, randomize: Boolean(parsed?.randomize), seed: typeof parsed?.seed === "string" && parsed.seed.trim() ? parsed.seed : "20260820" } : { variables: DEFAULT_MOCK_TEMPLATE_VARIABLES, randomize: false, seed: "20260820" };
  } catch {
    return { variables: DEFAULT_MOCK_TEMPLATE_VARIABLES, randomize: false, seed: "20260820" };
  }
}

export function writeMockTemplateStorage(storage: Pick<Storage, "setItem"> | undefined, variables: MockTemplateVariables, randomize: boolean, seed: string): boolean {
  try {
    if (!storage) return false;
    storage.setItem(MOCK_TEMPLATE_STORAGE_KEY, JSON.stringify({ variables, randomize, seed }));
    return true;
  } catch {
    return false;
  }
}
