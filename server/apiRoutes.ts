import type { Express, Request, Response } from "express";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

export type HmacAlgorithm = "sha256" | "sha512";
export type WebhookSignature = { header: string; timestamp: number; digest: string; algorithm: HmacAlgorithm };
export type VerificationResult = { valid: boolean; reason: string; timestamp: number; ageSeconds: number; expectedDigest: string; receivedDigest: string };

const serverLogs: Array<{ id: string; layer: "EXPRESS"; method: string; path: string; status: number; latency: number; time: string; verification?: "PASS" | "FAIL" }> = [];

function addLog(method: string, path: string, status: number, latency: number, verification?: "PASS" | "FAIL") {
  const entry = { id: randomUUID(), layer: "EXPRESS" as const, method, path, status, latency, time: new Date().toLocaleTimeString([], { hour12: false }), ...(verification ? { verification } : {}) };
  serverLogs.unshift(entry);
  if (serverLogs.length > 30) serverLogs.pop();
  return entry;
}

function digestPayload(payload: string, secret: string, algorithm: HmacAlgorithm, timestamp: number) {
  return createHmac(algorithm, secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
}

export function signWebhookPayload(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000), algorithm: HmacAlgorithm = "sha256"): WebhookSignature {
  const digest = digestPayload(payload, secret, algorithm, timestamp);
  return { header: `t=${timestamp},v1=${digest}`, timestamp, digest, algorithm };
}

export function verifyWebhookSignature(payload: string, signatureHeader: string, secret: string, algorithm: HmacAlgorithm = "sha256", toleranceSeconds = 300, now = Math.floor(Date.now() / 1000)): VerificationResult {
  const timestampMatch = signatureHeader.match(/(?:^|,)\s*t=(\d+)/);
  const digestMatch = signatureHeader.match(/(?:^|,)\s*v1=([a-f0-9]{64,128})/i);
  const timestamp = timestampMatch ? Number(timestampMatch[1]) : 0;
  const receivedDigest = digestMatch?.[1]?.toLowerCase() ?? "";
  const ageSeconds = timestamp ? now - timestamp : Number.POSITIVE_INFINITY;
  const expectedDigest = timestamp ? digestPayload(payload, secret, algorithm, timestamp) : "";
  if (!timestampMatch || !digestMatch) return { valid: false, reason: "Malformed signature header", timestamp, ageSeconds, expectedDigest, receivedDigest };
  if (Math.abs(ageSeconds) > toleranceSeconds) return { valid: false, reason: `Timestamp outside ${toleranceSeconds}s tolerance`, timestamp, ageSeconds, expectedDigest, receivedDigest };
  const expectedBuffer = Buffer.from(expectedDigest, "utf8"); const receivedBuffer = Buffer.from(receivedDigest, "utf8");
  const valid = expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
  return { valid, reason: valid ? "Signature verified" : "Signature mismatch", timestamp, ageSeconds, expectedDigest, receivedDigest };
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
    const started = Date.now(); const { method = "GET", url, query = "", body = {}, apiKey = "" } = req.body ?? {};
    const normalizedMethod = String(method).toUpperCase(); const target = String(url || "https://api.generic-saas.dev/users");
    const path = (() => { try { return new URL(target).pathname; } catch { return target; } })();
    try {
      let result: { data: unknown; status: number };
      if (target.includes("api.generic-saas.dev")) result = mockUpstream(normalizedMethod, target, body);
      else { const targetUrl = new URL(target); if (query) targetUrl.search = query.startsWith("?") ? query : `?${query}`; const upstream = await fetch(targetUrl, { method: normalizedMethod, headers: { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) }, body: normalizedMethod === "GET" || normalizedMethod === "DELETE" ? undefined : JSON.stringify(body) }); const text = await upstream.text(); let data: unknown; try { data = JSON.parse(text); } catch { data = { raw: text }; } result = { data, status: upstream.status }; }
      const log = addLog(normalizedMethod, path, result.status, Date.now() - started);
      return res.status(result.status).json({ ...((result.data && typeof result.data === "object") ? result.data : { data: result.data }), _meta: { forwarded: true, apiKeyAttached: Boolean(apiKey), target, query }, serverLog: log });
    } catch (error) { const log = addLog(normalizedMethod, path, 502, Date.now() - started); return res.status(502).json({ error: "UPSTREAM_UNREACHABLE", detail: String(error), serverLog: log }); }
  });

  app.post("/api/webhooks/simulate", (req: Request, res: Response) => {
    const started = Date.now(); const { type = "event.received", payload = {}, secret = "whsec_demo", algorithm = "sha256", signature = "", timestamp = Math.floor(Date.now() / 1000), toleranceSeconds = 300 } = req.body ?? {};
    const rawPayload = JSON.stringify(payload); const generated = signWebhookPayload(rawPayload, secret, timestamp, algorithm as HmacAlgorithm); const suppliedSignature = String(signature || generated.header); const verification = verifyWebhookSignature(rawPayload, suppliedSignature, secret, algorithm as HmacAlgorithm, Number(toleranceSeconds));
    const eventPayload = { id: `evt_${randomUUID().slice(0, 8)}`, type, livemode: false, received_at: new Date().toISOString(), data: payload };
    const status = verification.valid ? 202 : 401; const log = addLog("POST", `/webhooks/${type}`, status, Date.now() - started, verification.valid ? "PASS" : "FAIL");
    return res.status(status).json({ payload: eventPayload, signature: { header: suppliedSignature, generated: generated.header, algorithm, timestamp: generated.timestamp }, verification, serverLog: log });
  });
}
