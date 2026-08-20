import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";

const serverLogs: Array<{ id: string; layer: "EXPRESS"; method: string; path: string; status: number; latency: number; time: string }> = [];

function addLog(method: string, path: string, status: number, latency: number) {
  const entry = { id: randomUUID(), layer: "EXPRESS" as const, method, path, status, latency, time: new Date().toLocaleTimeString([], { hour12: false }) };
  serverLogs.unshift(entry);
  if (serverLogs.length > 30) serverLogs.pop();
  return entry;
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
    const started = Date.now();
    const { method = "GET", url, query = "", body = {}, apiKey = "" } = req.body ?? {};
    const normalizedMethod = String(method).toUpperCase();
    const target = String(url || "https://api.generic-saas.dev/users");
    const path = (() => { try { return new URL(target).pathname; } catch { return target; } })();
    try {
      let result: { data: unknown; status: number };
      if (target.includes("api.generic-saas.dev")) {
        result = mockUpstream(normalizedMethod, target, body);
      } else {
        const targetUrl = new URL(target);
        if (query) targetUrl.search = query.startsWith("?") ? query : `?${query}`;
        const upstream = await fetch(targetUrl, { method: normalizedMethod, headers: { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) }, body: normalizedMethod === "GET" || normalizedMethod === "DELETE" ? undefined : JSON.stringify(body) });
        const text = await upstream.text(); let data: unknown; try { data = JSON.parse(text); } catch { data = { raw: text }; }
        result = { data, status: upstream.status };
      }
      const log = addLog(normalizedMethod, path, result.status, Date.now() - started);
      return res.status(result.status).json({ ...((result.data && typeof result.data === "object") ? result.data : { data: result.data }), _meta: { forwarded: true, apiKeyAttached: Boolean(apiKey), target: target, query }, serverLog: log });
    } catch (error) {
      const log = addLog(normalizedMethod, path, 502, Date.now() - started);
      return res.status(502).json({ error: "UPSTREAM_UNREACHABLE", detail: String(error), serverLog: log });
    }
  });

  app.post("/api/webhooks/simulate", (req: Request, res: Response) => {
    const started = Date.now(); const { type = "event.received", payload = {} } = req.body ?? {};
    const eventPayload = { id: `evt_${randomUUID().slice(0, 8)}`, type, livemode: false, received_at: new Date().toISOString(), data: payload };
    const log = addLog("POST", `/webhooks/${type}`, 202, Date.now() - started);
    return res.status(202).json({ payload: eventPayload, serverLog: log });
  });
}
