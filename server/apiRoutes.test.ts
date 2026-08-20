import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { mockUpstream, registerApiRoutes, signWebhookPayload, verifyWebhookSignature } from "./apiRoutes";

let server: Server | undefined;

afterEach(async () => {
  if (server) await new Promise<void>(resolve => server?.close(() => resolve()));
  server = undefined;
});

async function startTestServer() {
  const app = express(); app.use(express.json()); registerApiRoutes(app);
  server = createServer(app);
  await new Promise<void>(resolve => server?.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Test server did not bind");
  return `http://127.0.0.1:${address.port}`;
}

describe("mock upstream API", () => {
  it("returns a list response for GET users", () => {
    const result = mockUpstream("GET", "https://api.generic-saas.dev/users", {});
    expect(result.status).toBe(200); expect(result.data).toMatchObject({ object: "list", has_more: false });
  });
});

describe("HMAC webhook verification", () => {
  const payload = JSON.stringify({ id: "evt_1", amount: 12500 });
  const secret = "whsec_test";
  const now = 1_725_000_000;

  it("accepts a correctly signed SHA-256 payload", () => {
    const signed = signWebhookPayload(payload, secret, now, "sha256");
    expect(verifyWebhookSignature(payload, signed.header, secret, "sha256", 300, now)).toMatchObject({ valid: true, reason: "Signature verified" });
  });

  it("rejects a tampered payload and malformed header", () => {
    const signed = signWebhookPayload(payload, secret, now, "sha256");
    expect(verifyWebhookSignature(`${payload} `, signed.header, secret, "sha256", 300, now).valid).toBe(false);
    expect(verifyWebhookSignature(payload, "not-a-signature", secret, "sha256", 300, now).reason).toBe("Malformed signature header");
  });

  it("rejects signatures outside the configured tolerance", () => {
    const signed = signWebhookPayload(payload, secret, now - 301, "sha512");
    const result = verifyWebhookSignature(payload, signed.header, secret, "sha512", 300, now);
    expect(result).toMatchObject({ valid: false, reason: "Timestamp outside 300s tolerance" });
  });

  it("generates and verifies a Stripe-style t/v1/v0 header", () => {
    const signed = signWebhookPayload(payload, secret, now, "sha256", "stripe");
    expect(signed.header).toMatch(/^t=\d+,v1=[a-f0-9]{64},v0=[a-f0-9]{64}$/);
    expect(verifyWebhookSignature(payload, signed.header, secret, "sha256", 300, now, "stripe")).toMatchObject({ valid: true, provider: "stripe", matchedVersion: "v1" });
  });

  it("accepts a valid legacy v0 signature when v1 is rotated", () => {
    const signed = signWebhookPayload(payload, secret, now, "sha256", "stripe");
    const v0Only = `t=${now},v0=${signed.v0}`;
    expect(verifyWebhookSignature(payload, v0Only, secret, "sha256", 300, now, "stripe")).toMatchObject({ valid: true, matchedVersion: "v0" });
  });
});

describe("Express integration routes", () => {
  it("proxies a request and reports API-key attachment", async () => {
    const base = await startTestServer();
    const response = await fetch(`${base}/api/proxy`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "POST", url: "https://api.generic-saas.dev/orders", body: { amount: 12500 }, apiKey: "sk_test_demo" }) });
    const data = await response.json();
    expect(response.status).toBe(201); expect(data._meta).toMatchObject({ forwarded: true, apiKeyAttached: true }); expect(data.serverLog).toMatchObject({ layer: "EXPRESS", status: 201, method: "POST" });
  });

  it("accepts a Stripe-style mock webhook and reports its provider versions", async () => {
    const base = await startTestServer();
    const response = await fetch(`${base}/api/webhooks/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "payment.succeeded", provider: "stripe", payload: { amount: 99 }, secret: "whsec_test" }) });
    const data = await response.json();
    expect(response.status).toBe(202); expect(data.signature).toMatchObject({ provider: "stripe", versions: ["v1", "v0"] }); expect(data.verification).toMatchObject({ valid: true, provider: "stripe", matchedVersion: "v1" });
  });

  it("accepts a signed mock webhook and returns PASS diagnostics", async () => {
    const base = await startTestServer();
    const response = await fetch(`${base}/api/webhooks/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "user.created", payload: { email: "demo@example.com" }, secret: "whsec_test" }) });
    const data = await response.json();
    expect(response.status).toBe(202); expect(data.verification).toMatchObject({ valid: true, reason: "Signature verified" }); expect(data.serverLog).toMatchObject({ layer: "EXPRESS", status: 202, path: "/webhooks/user.created", verification: "PASS" });
  });

  it("rejects a tampered signature with FAIL diagnostics", async () => {
    const base = await startTestServer();
    const response = await fetch(`${base}/api/webhooks/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "payment.succeeded", payload: { amount: 99 }, secret: "whsec_test", signature: "t=1725000000,v1=bad" }) });
    const data = await response.json();
    expect(response.status).toBe(401); expect(data.verification.valid).toBe(false); expect(data.serverLog).toMatchObject({ status: 401, verification: "FAIL" });
  });
});
