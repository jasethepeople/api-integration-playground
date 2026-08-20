import express from "express";
import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { mockUpstream, registerApiRoutes } from "./apiRoutes";

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

describe("Express integration routes", () => {
  it("proxies a request and reports API-key attachment", async () => {
    const base = await startTestServer();
    const response = await fetch(`${base}/api/proxy`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ method: "POST", url: "https://api.generic-saas.dev/orders", body: { amount: 12500 }, apiKey: "sk_test_demo" }) });
    const data = await response.json();
    expect(response.status).toBe(201); expect(data._meta).toMatchObject({ forwarded: true, apiKeyAttached: true }); expect(data.serverLog).toMatchObject({ layer: "EXPRESS", status: 201, method: "POST" });
  });

  it("accepts a mock webhook and returns a server log", async () => {
    const base = await startTestServer();
    const response = await fetch(`${base}/api/webhooks/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "user.created", payload: { email: "demo@example.com" } }) });
    const data = await response.json();
    expect(response.status).toBe(202); expect(data.payload).toMatchObject({ type: "user.created", data: { email: "demo@example.com" }, livemode: false }); expect(data.serverLog).toMatchObject({ layer: "EXPRESS", status: 202, path: "/webhooks/user.created" });
  });
});
