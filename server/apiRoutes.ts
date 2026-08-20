import type { Express, Request, Response } from "express";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

export type HmacAlgorithm = "sha256" | "sha512";
export type ProviderProfile = "generic" | "stripe" | "github" | "slack";
export type WebhookSignature = { header: string; timestamp: number; digest: string; algorithm: HmacAlgorithm; provider: ProviderProfile; v0?: string };
export type VerificationResult = { valid: boolean; reason: string; provider: ProviderProfile; timestamp: number; ageSeconds: number; expectedDigest: string; receivedDigest: string; matchedVersion?: "v1" | "v0" };

const serverLogs: Array<{ id: string; layer: "EXPRESS"; method: string; path: string; status: number; latency: number; time: string; verification?: "PASS" | "FAIL" }> = [];

function addLog(method: string, path: string, status: number, latency: number, verification?: "PASS" | "FAIL") {
  const entry = { id: randomUUID(), layer: "EXPRESS" as const, method, path, status, latency, time: new Date().toLocaleTimeString([], { hour12: false }), ...(verification ? { verification } : {}) };
  serverLogs.unshift(entry); if (serverLogs.length > 30) serverLogs.pop(); return entry;
}

function digestPayload(payload: string, secret: string, algorithm: HmacAlgorithm, timestamp: number) {
  return createHmac(algorithm, secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
}

export function signWebhookPayload(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000), algorithm: HmacAlgorithm = "sha256", provider: ProviderProfile = "generic"): WebhookSignature {
  if (provider === "github") {
    const digest = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    return { header: `sha256=${digest}`, timestamp, digest, algorithm: "sha256", provider };
  }
  if (provider === "slack") {
    const digest = createHmac("sha256", secret).update(`v0:${timestamp}:${payload}`, "utf8").digest("hex");
    return { header: `t=${timestamp},v0=${digest}`, timestamp, digest, algorithm: "sha256", provider };
  }
  const digest = digestPayload(payload, secret, algorithm, timestamp);
  if (provider === "stripe") {
    const v0 = digestPayload(payload, secret, "sha256", timestamp - 1);
    return { header: `t=${timestamp},v1=${digest},v0=${v0}`, timestamp, digest, algorithm, provider, v0 };
  }
  return { header: `t=${timestamp},v1=${digest}`, timestamp, digest, algorithm, provider };
}

export function verifyWebhookSignature(payload: string, signatureHeader: string, secret: string, algorithm: HmacAlgorithm = "sha256", toleranceSeconds = 300, now = Math.floor(Date.now() / 1000), provider: ProviderProfile = "generic"): VerificationResult {
  if (provider === "github") {
    const match = signatureHeader.match(/^sha256=([a-f0-9]{64})$/i);
    const receivedDigest = match ? match[1].toLowerCase() : "";
    const expectedDigest = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    if (!match) return { valid: false, reason: "Malformed GitHub signature header", provider, timestamp: now, ageSeconds: 0, expectedDigest, receivedDigest };
    const candidateBuffer = Buffer.from(expectedDigest, "utf8");
    const receivedBuffer = Buffer.from(receivedDigest, "utf8");
    if (candidateBuffer.length === receivedBuffer.length && timingSafeEqual(candidateBuffer, receivedBuffer)) return { valid: true, reason: "GitHub signature verified", provider, timestamp: now, ageSeconds: 0, expectedDigest, receivedDigest };
    return { valid: false, reason: "GitHub signature mismatch", provider, timestamp: now, ageSeconds: 0, expectedDigest, receivedDigest };
  }
  if (provider === "slack") {
    const match = signatureHeader.match(/(?:^|,)\s*v0=([a-f0-9]{64})/i);
    const receivedDigest = match ? match[1].toLowerCase() : "";
    const timestampMatch = signatureHeader.match(/(?:^|,)\s*t=(\d+)/);
    const timestamp = timestampMatch ? Number(timestampMatch[1]) : now;
    const ageSeconds = now - timestamp;
    const expectedDigest = createHmac("sha256", secret).update(`v0:${timestamp}:${payload}`, "utf8").digest("hex");
    if (!match) return { valid: false, reason: "Malformed Slack signature header", provider, timestamp, ageSeconds, expectedDigest, receivedDigest };
    if (Math.abs(ageSeconds) > toleranceSeconds) return { valid: false, reason: `Slack timestamp outside ${toleranceSeconds}s tolerance`, provider, timestamp, ageSeconds, expectedDigest, receivedDigest };
    const candidateBuffer = Buffer.from(expectedDigest, "utf8");
    const receivedBuffer = Buffer.from(receivedDigest, "utf8");
    if (candidateBuffer.length === receivedBuffer.length && timingSafeEqual(candidateBuffer, receivedBuffer)) return { valid: true, reason: "Slack signature verified", provider, timestamp, ageSeconds, expectedDigest, receivedDigest };
    return { valid: false, reason: "Slack signature mismatch", provider, timestamp, ageSeconds, expectedDigest, receivedDigest };
  }
  const timestampMatch = signatureHeader.match(/(?:^|,)\s*t=(\d+)/);
  const timestamp = timestampMatch ? Number(timestampMatch[1]) : 0;
  const ageSeconds = timestamp ? now - timestamp : Number.POSITIVE_INFINITY;
  const expectedDigest = timestamp ? digestPayload(payload, secret, algorithm, timestamp) : "";
  const versions = Array.from(signatureHeader.matchAll(/(?:^|,)\s*(v1|v0)=([a-f0-9]{64,128})/gi)).map(match => ({ version: match[1].toLowerCase() as "v1" | "v0", digest: match[2].toLowerCase() }));
  const receivedDigest = versions.find(item => item.version === "v1")?.digest || versions[0]?.digest || "";
  if (!timestampMatch || versions.length === 0) return { valid: false, reason: "Malformed signature header", provider, timestamp, ageSeconds, expectedDigest, receivedDigest };
  if (Math.abs(ageSeconds) > toleranceSeconds) return { valid: false, reason: `Timestamp outside ${toleranceSeconds}s tolerance`, provider, timestamp, ageSeconds, expectedDigest, receivedDigest };
  const expectedBuffer = Buffer.from(expectedDigest, "utf8");
  for (const item of versions) {
    const candidate = item.version === "v0" ? digestPayload(payload, secret, "sha256", timestamp - 1) : expectedDigest;
    const receivedBuffer = Buffer.from(item.digest, "utf8");
    if (candidate.length === receivedBuffer.length && timingSafeEqual(Buffer.from(candidate, "utf8"), receivedBuffer)) return { valid: true, reason: "Signature verified", provider, timestamp, ageSeconds, expectedDigest, receivedDigest: item.digest, matchedVersion: item.version };
  }
  return { valid: false, reason: "Signature mismatch", provider, timestamp, ageSeconds, expectedDigest, receivedDigest };
}

export function mockUpstream(method: string, url: string, body: unknown) {
  const path = new URL(url).pathname;
  if (method === "GET") return { data: { object: "list", items: [{ id: "usr_001", email: "ada@example.com", status: "active" }, { id: "usr_002", email: "linus@example.com", status: "active" }], has_more: false }, status: 200 };
  if (method === "POST") return { data: { id: "ord_2048", object: "order", status: "created", received: body, created_at: new Date().toISOString() }, status: 201 };
  if (method === "PATCH") return { data: { id: path.split("/").pop(), object: "item", status: "updated", changes: body }, status: 200 };
  return { data: { id: path.split("/").pop(), object: "record", deleted: true }, status: 200 };
}

export function registerApiRoutes(app: Express) {
  app.get("/api/logs", (_req, res) => res.json({ logs: serverLogs }));
  app.post("/api/proxy", async (req: Request, res: Response) => {
    const started = Date.now(); const { method = "GET", url, query = "", body = {}, apiKey = "" } = req.body ?? {}; const normalizedMethod = String(method).toUpperCase(); const target = String(url || "https://api.generic-saas.dev/users"); const path = (() => { try { return new URL(target).pathname; } catch { return target; } })();
    try { let result: { data: unknown; status: number }; if (target.includes("api.generic-saas.dev")) result = mockUpstream(normalizedMethod, target, body); else { const targetUrl = new URL(target); if (query) targetUrl.search = query.startsWith("?") ? query : `?${query}`; const upstream = await fetch(targetUrl, { method: normalizedMethod, headers: { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) }, body: normalizedMethod === "GET" || normalizedMethod === "DELETE" ? undefined : JSON.stringify(body) }); const text = await upstream.text(); let data: unknown; try { data = JSON.parse(text); } catch { data = { raw: text }; } result = { data, status: upstream.status }; } const log = addLog(normalizedMethod, path, result.status, Date.now() - started); return res.status(result.status).json({ ...((result.data && typeof result.data === "object") ? result.data : { data: result.data }), _meta: { forwarded: true, apiKeyAttached: Boolean(apiKey), target, query }, serverLog: log }); }
    catch (error) { const log = addLog(normalizedMethod, path, 502, Date.now() - started); return res.status(502).json({ error: "UPSTREAM_UNREACHABLE", detail: String(error), serverLog: log }); }
  });
  app.post("/api/webhooks/simulate", (req: Request, res: Response) => {
    const started = Date.now(); const { type = "event.received", payload = {}, secret = "whsec_demo", algorithm = "sha256", provider = "generic", signature = "", timestamp = Math.floor(Date.now() / 1000), toleranceSeconds = 300 } = req.body ?? {}; const selectedProvider = (["stripe", "github", "slack"].includes(provider) ? provider : "generic") as ProviderProfile; const rawPayload = JSON.stringify(payload); const generated = signWebhookPayload(rawPayload, secret, timestamp, algorithm as HmacAlgorithm, selectedProvider); const suppliedSignature = String(signature || generated.header); const verification = verifyWebhookSignature(rawPayload, suppliedSignature, secret, algorithm as HmacAlgorithm, Number(toleranceSeconds), Math.floor(Date.now() / 1000), selectedProvider); const eventPayload = { id: `evt_${randomUUID().slice(0, 8)}`, type, livemode: false, received_at: new Date().toISOString(), data: payload }; const status = verification.valid ? 202 : 401; const log = addLog("POST", `/webhooks/${type}`, status, Date.now() - started, verification.valid ? "PASS" : "FAIL"); return res.status(status).json({ payload: eventPayload, signature: { header: suppliedSignature, generated: generated.header, provider: selectedProvider, algorithm: generated.algorithm, timestamp: generated.timestamp, versions: selectedProvider === "stripe" ? ["v1", "v0"] : selectedProvider === "github" ? ["sha256"] : selectedProvider === "slack" ? ["v0"] : ["v1"] }, verification, serverLog: log });
  });
}
