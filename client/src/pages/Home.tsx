import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff, Play, Terminal, Webhook, X } from "lucide-react";
import { highlightJson } from "@/lib/jsonHighlight";

type LogEntry = { id: string; layer: "BROWSER" | "EXPRESS"; method: string; path: string; status: number; latency: number; time: string; verification?: "PASS" | "FAIL" };
type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

function legacyHighlightJson(value: JsonValue) {
  const escaped = pretty(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/("(?:\\.|[^"\\])*")(?=\s*:)/g, '<span class="json-key">$1</span>').replace(/("(?:\\.|[^"\\])*")/g, '<span class="json-string">$1</span>').replace(/\b(true|false)\b/g, '<span class="json-bool">$1</span>').replace(/\b(null)\b/g, '<span class="json-null">$1</span>').replace(/(-?\b\d+(?:\.\d+)?\b)/g, '<span class="json-number">$1</span>');
}

const endpoints = [
  { label: "List users", method: "GET", path: "/users" },
  { label: "Create order", method: "POST", path: "/orders" },
  { label: "Update item", method: "PATCH", path: "/items/:id" },
  { label: "Delete record", method: "DELETE", path: "/records/:id" },
];
const webhookTypes = ["payment.succeeded", "user.created", "order.updated"];
const defaultBodies: Record<string, string> = {
  POST: '{\n  "customer_id": "cus_1024",\n  "amount": 12500,\n  "currency": "usd"\n}',
  PATCH: '{\n  "status": "active",\n  "metadata": { "source": "playground" }\n}',
  DELETE: "{}",
  GET: "{}",
};
const initialResponse = { status: "READY", message: "Construct a request or trigger a webhook to inspect the payload." };

function JsonTree({ value, name = "payload", depth = 0 }: { value: JsonValue; name?: string; depth?: number }) {
  const [open, setOpen] = useState(true);
  const expandable = value !== null && typeof value === "object";
  if (!expandable) return <div className="tree-line" style={{ paddingLeft: depth * 18 }}><span className="tree-key">{name}</span><span className="tree-colon">:</span><span className={`tree-value ${typeof value}`}>{JSON.stringify(value)}</span></div>;
  const entries = Array.isArray(value) ? value.map((item, i) => [String(i), item] as const) : Object.entries(value);
  return <div className="tree-node"><button className="tree-toggle" onClick={() => setOpen(!open)} style={{ paddingLeft: depth * 18 }}><span>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span><span className="tree-key">{name}</span><span className="tree-muted">{Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}</span></button>{open && entries.map(([key, child]) => <JsonTree key={key} value={child as JsonValue} name={key} depth={depth + 1} />)}</div>;
}

function pretty(value: JsonValue) { return JSON.stringify(value, null, 2); }

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [customUrl, setCustomUrl] = useState("");
  const [method, setMethod] = useState(endpoints[0].method);
  const [path, setPath] = useState(endpoints[0].path);
  const [pathParams, setPathParams] = useState<Record<string, string>>({ id: "itm_2048" });
  const [query, setQuery] = useState("limit=25&active=true");
  const [body, setBody] = useState(defaultBodies.GET);
  const [webhook, setWebhook] = useState(webhookTypes[0]);
  const [webhookPayload, setWebhookPayload] = useState('{\n  "id": "evt_8df2",\n  "livemode": false,\n  "created": 1721318400\n}');
  const [webhookSecret, setWebhookSecret] = useState("whsec_demo");
  const [webhookAlgorithm, setWebhookAlgorithm] = useState("sha256");
  const [webhookTolerance, setWebhookTolerance] = useState("300");
  const [signatureOverride, setSignatureOverride] = useState("");
  const [webhookTimestamp, setWebhookTimestamp] = useState(() => Math.floor(Date.now() / 1000));
  const [generatedSignature, setGeneratedSignature] = useState("");
  const [lastVerification, setLastVerification] = useState<"READY" | "PASS" | "FAIL">("READY");
  const [response, setResponse] = useState<JsonValue>(initialResponse);
  const [responseMeta, setResponseMeta] = useState({ status: "READY", latency: 0, source: "SYSTEM" });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseMode, setResponseMode] = useState<"tree" | "raw">("tree");

  const activeEndpoint = endpoints[selectedEndpoint];
  const paramNames = useMemo(() => Array.from(path.matchAll(/:([A-Za-z0-9_]+)/g)).map(match => match[1]), [path]);
  const resolvedPath = useMemo(() => path.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => pathParams[name] || `:${name}`), [path, pathParams]);
  const resolvedUrl = customUrl || `https://api.generic-saas.dev${resolvedPath}`;
  const requestPreview = useMemo(() => `${method} ${resolvedUrl}${query ? `?${query}` : ""}`, [method, resolvedUrl, query]);

  useEffect(() => {
    let cancelled = false;
    async function previewSignature() {
      try {
        const parsed = JSON.parse(webhookPayload);
        const raw = JSON.stringify(parsed);
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(webhookSecret), { name: "HMAC", hash: webhookAlgorithm === "sha512" ? "SHA-512" : "SHA-256" }, false, ["sign"]);
        const buffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${webhookTimestamp}.${raw}`));
        const digest = Array.from(new Uint8Array(buffer)).map(value => value.toString(16).padStart(2, "0")).join("");
        if (!cancelled) setGeneratedSignature(`t=${webhookTimestamp},v1=${digest}`);
      } catch { if (!cancelled) setGeneratedSignature("INVALID PAYLOAD — SIGNATURE UNAVAILABLE"); }
    }
    void previewSignature();
    return () => { cancelled = true; };
  }, [webhookPayload, webhookSecret, webhookAlgorithm, webhookTimestamp]);

  function chooseEndpoint(index: number) {
    const endpoint = endpoints[index]; setSelectedEndpoint(index); setCustomUrl(""); setMethod(endpoint.method); setPath(endpoint.path); setPathParams({ id: "itm_2048" }); setBody(defaultBodies[endpoint.method]);
  }
  async function pushBrowserLog(methodValue: string, pathValue: string, status: number, latency: number) {
    const entry = { id: crypto.randomUUID(), layer: "BROWSER" as const, method: methodValue, path: pathValue, status, latency, time: new Date().toLocaleTimeString([], { hour12: false }) };
    setLogs(prev => [entry, ...prev].slice(0, 12));
  }
  async function sendRequest() {
    const started = performance.now(); setBusy(true);
    let payload: JsonValue = {};
    try { payload = body.trim() ? JSON.parse(body) : {}; } catch { setResponse({ error: "Invalid JSON body", detail: "Fix the request body before sending." }); setResponseMeta({ status: "400", latency: 0, source: "BROWSER" }); setBusy(false); return; }
    try {
      const res = await fetch("/api/proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, url: resolvedUrl, query, body: payload, apiKey }) });
      const data = await res.json(); const latency = Math.round(performance.now() - started); setResponse(data); setResponseMeta({ status: String(res.status), latency, source: "PROXY" }); await pushBrowserLog(method, resolvedPath, res.status, latency);
      if (data.serverLog) setLogs(prev => [data.serverLog, ...prev.filter(log => log.id !== data.serverLog.id)].slice(0, 12));
    } catch (error) { const latency = Math.round(performance.now() - started); setResponse({ error: "Proxy unavailable", detail: String(error) }); setResponseMeta({ status: "502", latency, source: "BROWSER" }); await pushBrowserLog(method, path, 502, latency); }
    setBusy(false);
  }
  async function triggerWebhook() {
    const started = performance.now(); setBusy(true);
    let payload: JsonValue = {}; try { payload = JSON.parse(webhookPayload); } catch { setResponse({ error: "Invalid webhook JSON", detail: "Fix the webhook payload before triggering." }); setResponseMeta({ status: "400", latency: 0, source: "WEBHOOK" }); setBusy(false); return; }
    const res = await fetch("/api/webhooks/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: webhook, payload, secret: webhookSecret, algorithm: webhookAlgorithm, toleranceSeconds: Number(webhookTolerance) || 300, timestamp: webhookTimestamp, signature: signatureOverride.trim() }) });
    const data = await res.json(); const latency = Math.round(performance.now() - started); setResponse(data); setLastVerification(data.verification?.valid ? "PASS" : "FAIL"); setResponseMeta({ status: String(res.status), latency, source: data.verification?.valid ? "WEBHOOK / VERIFIED" : "WEBHOOK / REJECTED" }); await pushBrowserLog("POST", `/webhooks/${webhook}`, res.status, latency); setLogs(prev => [data.serverLog, ...prev].slice(0, 12)); setWebhookTimestamp(Math.floor(Date.now() / 1000)); setBusy(false);
  }
  async function copyResponse() { await navigator.clipboard?.writeText(pretty(response)); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  return <main className="console-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">[ ]</span><span>API / PLAYGROUND</span></div><div className="status-chip"><span className="status-dot" /> PROXY ONLINE <span className="mono">:3000</span></div></header>
    <section className="hero"><div><p className="eyebrow">INTEGRATION SIMULATOR / 01</p><h1>BUILD.<br /><span>BREAK.</span><br />OBSERVE.</h1></div><p className="hero-note">A controlled environment for constructing REST requests and simulating inbound events.<br /><span className="mono">NO GUESSWORK. JUST PAYLOADS.</span></p></section>
    <div className="workspace">
      <section className="left-pane">
        <div className="section-kicker"><span>01</span><span>REQUEST BUILDER</span><span className="rule" /></div>
        <label className="field-label">API KEY <span>INJECTED AS X-API-KEY</span></label><div className="key-row"><input aria-label="API key" type={showKey ? "text" : "password"} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk_test_••••••••••••••••" /><button className="icon-button" onClick={() => setShowKey(!showKey)} aria-label="Toggle API key visibility">{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        <label className="field-label">ENDPOINT LIBRARY</label><div className="endpoint-list">{endpoints.map((item, i) => <button key={item.label} className={`endpoint ${i === selectedEndpoint && !customUrl ? "selected" : ""}`} onClick={() => chooseEndpoint(i)}><span className={`method ${item.method.toLowerCase()}`}>{item.method}</span><span>{item.path}</span><span className="endpoint-name">{item.label}</span></button>)}<div className="custom-row"><span className="method custom">CUSTOM</span><input value={customUrl} onChange={e => { setCustomUrl(e.target.value); setSelectedEndpoint(-1); }} placeholder="https://api.example.com/v1/..." /></div></div>
        <div className="builder-grid"><div><label className="field-label">METHOD</label><select value={method} onChange={e => setMethod(e.target.value)}>{["GET", "POST", "PATCH", "DELETE"].map(item => <option key={item}>{item}</option>)}</select></div><div><label className="field-label">PATH</label><input value={path} onChange={e => setPath(e.target.value)} /></div></div>
        {paramNames.length > 0 && <><label className="field-label">PATH PARAMETERS <span>SUBSTITUTED BEFORE FORWARD</span></label><div className="param-grid">{paramNames.map(name => <div className="param-field" key={name}><span>:{name}</span><input value={pathParams[name] || ""} onChange={e => setPathParams(prev => ({ ...prev, [name]: e.target.value }))} placeholder={`value for ${name}`} /></div>)}</div></>}
        <label className="field-label">QUERY PARAMETERS <span>KEY=VALUE &amp; KEY=VALUE</span></label><input value={query} onChange={e => setQuery(e.target.value)} />
        <label className="field-label">JSON BODY <span>{method === "GET" ? "OPTIONAL" : "REQUIRED"}</span></label><textarea className="json-editor" value={body} onChange={e => setBody(e.target.value)} spellCheck={false} />
        <div className="request-line"><Terminal size={15} /><span>{requestPreview}</span></div><button className="primary-action" onClick={sendRequest} disabled={busy}><Play size={16} fill="currentColor" /> {busy ? "FORWARDING..." : "SEND REQUEST"}<span>↗</span></button>
        <div className="section-kicker webhook-kicker"><span>02</span><span>WEBHOOK SIMULATOR</span><span className="rule" /></div>
        <label className="field-label">EVENT TYPE</label><select value={webhook} onChange={e => setWebhook(e.target.value)}>{webhookTypes.map(item => <option key={item}>{item}</option>)}</select><label className="field-label">INBOUND PAYLOAD <span>POST /webhooks/{webhook}</span></label><textarea className="json-editor webhook-editor" value={webhookPayload} onChange={e => setWebhookPayload(e.target.value)} spellCheck={false} />
        <div className="signature-head"><label className="field-label">HMAC VERIFICATION <span>RAW JSON IS SIGNED</span></label><span className="signature-badge">{signatureOverride ? "MANUAL HEADER" : "AUTO SIGN"}</span></div>
        <div className="signature-grid"><div><label className="field-label">SIGNING SECRET</label><input type="password" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} /></div><div><label className="field-label">ALGORITHM</label><select value={webhookAlgorithm} onChange={e => setWebhookAlgorithm(e.target.value)}><option value="sha256">HMAC-SHA256</option><option value="sha512">HMAC-SHA512</option></select></div></div>
        <div className="signature-grid"><div><label className="field-label">TOLERANCE <span>SECONDS</span></label><input inputMode="numeric" value={webhookTolerance} onChange={e => setWebhookTolerance(e.target.value)} /></div><div><label className="field-label">SIGNATURE OVERRIDE <span>OPTIONAL / TEST TAMPER</span></label><input value={signatureOverride} onChange={e => setSignatureOverride(e.target.value)} placeholder="t=...,v1=..." /></div></div>
        <p className="signature-note"><span>t=TIMESTAMP</span> + <span>v1=HMAC DIGEST</span> · verification uses constant-time comparison</p><label className="field-label">GENERATED SIGNATURE <span>READ-ONLY / HMAC OUTPUT</span></label><input className="signature-preview" readOnly value={generatedSignature} /><label className="field-label">EFFECTIVE HEADER <span>{signatureOverride ? "MANUAL OVERRIDE / SENT" : "GENERATED / SENT"}</span></label><input className={`signature-preview ${signatureOverride ? "override" : ""}`} readOnly value={signatureOverride || generatedSignature} /><div className="verification-summary"><span>LAST CHECK</span><strong className={lastVerification.toLowerCase()}>{lastVerification}</strong><span>{webhookAlgorithm.toUpperCase()} · ±{webhookTolerance || "300"}S</span></div><button className="secondary-action" onClick={triggerWebhook} disabled={busy}><Webhook size={15} /> {busy ? "VERIFYING..." : "TRIGGER SIGNED WEBHOOK"}<span>↗</span></button>
      </section>
      <section className="right-pane">
        <div className="section-kicker"><span>03</span><span>RESPONSE INSPECTOR</span><span className="rule" /><button className="copy-button" onClick={() => setResponseMode(responseMode === "tree" ? "raw" : "tree")}><Eye size={13} /> {responseMode === "tree" ? "RAW JSON" : "TREE VIEW"}</button><button className="copy-button" onClick={copyResponse}><Copy size={13} /> {copied ? "COPIED" : "COPY JSON"}</button></div>
        <div className="response-meta"><span className={`response-status ${responseMeta.status === "200" || responseMeta.status === "202" || responseMeta.status === "READY" ? "ok" : "bad"}`}>{responseMeta.status}</span><span>{responseMeta.source}</span><span>{responseMeta.latency ? `${responseMeta.latency} MS` : "WAITING"}</span><span className="response-spacer" /><span className="mono">JSON / TREE</span></div>
        <div className="response-box">{responseMode === "tree" ? <JsonTree value={response} /> : <pre className="raw-json" dangerouslySetInnerHTML={{ __html: highlightJson(response) }} />}</div>
        <div className="section-kicker logs-kicker"><span>04</span><span>REQUEST LOG</span><span className="rule" /><span className="log-count">{logs.length} ENTRIES</span></div>
        <div className="logs-box">{logs.length === 0 ? <div className="empty-log"><span>—</span>REQUESTS WILL APPEAR HERE AFTER EXECUTION</div> : logs.map(log => <div className="log-row" key={log.id}><span className={`layer ${log.layer.toLowerCase()}`}>{log.layer}</span><span className={`method ${log.method.toLowerCase()}`}>{log.method}</span><span className="log-path">{log.path}</span><span className={log.status < 400 ? "log-status ok" : "log-status bad"}>{log.status}</span><span className={`log-verification ${log.verification === "PASS" ? "pass" : log.verification === "FAIL" ? "fail" : ""}`}>{log.verification || "—"}</span><span className="log-latency">{log.latency}ms</span><span className="log-time">{log.time}</span><button className="clear-log" onClick={() => setLogs(prev => prev.filter(item => item.id !== log.id))} aria-label="Remove log entry"><X size={13} /></button></div>)}</div>
        <div className="legend"><span><i className="legend-browser" /> BROWSER CALL</span><span><i className="legend-express" /> EXPRESS PROXY</span><span className="mono">X-API-KEY / PERSISTENT</span></div>
      </section>
    </div>
    <footer><span>GENERIC SAAS API / LOCAL SIMULATION</span><span className="mono">BUILD 001 — ALL SYSTEMS NOMINAL</span></footer>
  </main>;
}
