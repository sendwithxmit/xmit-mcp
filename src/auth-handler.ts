import type { AuthRequest, OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { Hono } from "hono";
import { TransmitClient } from "./client.js";

interface AuthEnv {
  OAUTH_PROVIDER: OAuthHelpers;
  TRANSMIT_API_BASE: string;
}

const app = new Hono<{ Bindings: AuthEnv }>();

/**
 * GET /authorize - Show API key login form
 *
 * The user enters their Transmit API key. We validate it, then complete
 * the OAuth grant so the MCP client gets a token.
 */
app.get("/authorize", async (c) => {
  const oauthReq: AuthRequest = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  const clientInfo = await c.env.OAUTH_PROVIDER.lookupClient(oauthReq.clientId);

  if (!clientInfo) {
    return c.text("Invalid client_id", 400);
  }

  return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect to Transmit</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b; color: #fafafa;
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .card {
      max-width: 440px; width: 100%; background: #18181b;
      border: 1px solid #27272a; border-radius: 16px; padding: 40px;
    }
    .logo { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .logo span { color: #10b981; }
    .subtitle { color: #71717a; font-size: 14px; margin-bottom: 32px; line-height: 1.5; }
    .client-name { color: #a1a1aa; font-weight: 600; }
    label { display: block; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 8px; }
    input[type="text"] {
      width: 100%; padding: 12px 16px; background: #09090b; border: 1px solid #27272a;
      border-radius: 10px; color: #fafafa; font-size: 14px; font-family: monospace;
      outline: none; transition: border-color 0.2s;
    }
    input:focus { border-color: #10b981; }
    .hint { font-size: 12px; color: #52525b; margin-top: 6px; }
    button {
      width: 100%; padding: 12px; margin-top: 24px; background: #10b981; color: white;
      font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #059669; }
    .error { color: #ef4444; font-size: 13px; margin-top: 12px; display: none; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #52525b; }
    .footer a { color: #10b981; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Transmit<span>.</span></div>
    <p class="subtitle">
      <span class="client-name">${clientInfo.clientName || "An MCP client"}</span>
      wants to access your Transmit workspace. Enter your API key to authorize.
    </p>
    <form method="POST" action="/authorize" id="authForm">
      <input type="hidden" name="state" value="${btoa(JSON.stringify(oauthReq))}">
      <label for="apiKey">API Key</label>
      <input type="text" id="apiKey" name="apiKey" placeholder="pm_live_..." autocomplete="off" required>
      <div class="hint">Find this in Dashboard &gt; Settings &gt; API Keys</div>
      <div class="error" id="error">Invalid API key. Please check and try again.</div>
      <button type="submit">Authorize</button>
    </form>
    <div class="footer">
      Don't have an account? <a href="https://xmit.sh/sign-up" target="_blank">Sign up</a>
    </div>
  </div>
</body>
</html>`);
});

/**
 * POST /authorize - Validate API key and complete OAuth grant
 */
app.post("/authorize", async (c) => {
  const formData = await c.req.formData();
  const state = formData.get("state");
  const apiKey = formData.get("apiKey");

  if (!state || typeof state !== "string") {
    return c.text("Missing state parameter", 400);
  }
  if (!apiKey || typeof apiKey !== "string") {
    return c.text("Missing API key", 400);
  }

  let oauthReq: AuthRequest;
  try {
    oauthReq = JSON.parse(atob(state));
  } catch {
    return c.text("Invalid state parameter", 400);
  }

  // Validate the API key prefix
  if (!apiKey.startsWith("pm_live_") && !apiKey.startsWith("pm_test_")) {
    return c.text("Invalid API key format. Must start with pm_live_ or pm_test_.", 400);
  }

  // Validate against Transmit API
  const valid = await TransmitClient.validate(apiKey, c.env.TRANSMIT_API_BASE);
  if (!valid) {
    return c.text("Invalid API key. Please check your key and try again.", 401);
  }

  // Complete the OAuth authorization
  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReq,
    userId: apiKey.slice(0, 20), // Use key prefix as user ID (stable, no PII)
    metadata: {
      label: "Transmit MCP Access",
    },
    scope: oauthReq.scope,
    props: {
      apiKey,
      apiBase: c.env.TRANSMIT_API_BASE,
    },
  });

  return c.redirect(redirectTo, 302);
});

/**
 * GET / - Landing page
 */
app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transmit MCP Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b; color: #fafafa;
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .card { max-width: 560px; width: 100%; text-align: center; }
    h1 { font-size: 32px; font-weight: 700; margin-bottom: 12px; }
    h1 span { color: #10b981; }
    .desc { color: #71717a; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
    .config {
      background: #18181b; border: 1px solid #27272a; border-radius: 12px;
      padding: 20px; text-align: left; font-family: monospace; font-size: 13px;
      color: #a1a1aa; line-height: 1.6; overflow-x: auto;
    }
    .config .key { color: #10b981; }
    .config .str { color: #f59e0b; }
    .footer { margin-top: 24px; font-size: 13px; color: #52525b; }
    .footer a { color: #10b981; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Transmit MCP<span>.</span></h1>
    <p class="desc">
      Connect your AI assistant to Transmit. Manage campaigns, templates, contacts, and senders through natural language.
    </p>
    <div class="config">
{<br>
&nbsp;&nbsp;<span class="key">"mcpServers"</span>: {<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="key">"transmit"</span>: {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="key">"url"</span>: <span class="str">"https://mcp.xmit.sh/mcp"</span><br>
&nbsp;&nbsp;&nbsp;&nbsp;}<br>
&nbsp;&nbsp;}<br>
}
    </div>
    <p class="footer">
      18 tools &middot; 2 guided workflows &middot; <a href="https://xmit.sh/docs/ai/mcp">Documentation</a>
    </p>
  </div>
</body>
</html>`);
});

export { app as AuthHandler };
