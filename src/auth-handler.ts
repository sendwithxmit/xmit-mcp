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
      transition: border-color 0.3s;
    }
    .logo { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .logo span { color: #10b981; }
    .subtitle { color: #71717a; font-size: 14px; margin-bottom: 32px; line-height: 1.5; }
    .client-name { color: #a1a1aa; font-weight: 600; }
    label { display: block; font-size: 13px; font-weight: 500; color: #a1a1aa; margin-bottom: 8px; }
    input[type="password"] {
      width: 100%; padding: 12px 16px; background: #09090b; border: 1px solid #27272a;
      border-radius: 10px; color: #fafafa; font-size: 14px; font-family: monospace;
      outline: none; transition: border-color 0.2s;
    }
    input:focus { border-color: #10b981; }
    .hint { font-size: 12px; color: #52525b; margin-top: 6px; }
    .hint a { color: #10b981; text-decoration: none; }
    button {
      width: 100%; padding: 12px; margin-top: 24px; background: #10b981; color: #fff;
      font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }
    button:hover { background: #059669; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error {
      color: #fca5a5; font-size: 13px; margin-top: 12px; padding: 10px 14px;
      background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px; display: none;
    }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #52525b; }
    .footer a { color: #10b981; text-decoration: none; }

    /* Success state */
    .success-state { display: none; text-align: center; }
    .success-icon {
      width: 56px; height: 56px; border-radius: 50%; background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .success-icon svg { width: 28px; height: 28px; color: #10b981; }
    .checkmark { stroke-dasharray: 36; stroke-dashoffset: 36; animation: draw 0.4s ease forwards 0.15s; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    .success-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    .success-desc { color: #71717a; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
    .success-detail {
      background: #09090b; border: 1px solid #27272a; border-radius: 10px;
      padding: 14px 18px; font-size: 13px; color: #a1a1aa;
    }
    .success-detail .label { color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }

    /* Permissions */
    .permissions {
      margin-bottom: 24px; padding: 16px; background: #09090b;
      border: 1px solid #27272a; border-radius: 10px;
    }
    .permissions-title { font-size: 12px; color: #52525b; margin-bottom: 10px; font-weight: 500; }
    .perm-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #a1a1aa; padding: 4px 0; }
    .perm-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0; }
  </style>
</head>
<body>
  <div class="card" id="card">
    <!-- Auth form -->
    <div id="authView">
      <div class="logo">Transmit<span>.</span></div>
      <p class="subtitle">
        <span class="client-name">${clientInfo.clientName || "An MCP client"}</span>
        wants to connect to your Transmit workspace.
      </p>
      <div class="permissions">
        <div class="permissions-title">This will allow access to</div>
        <div class="perm-item"><div class="perm-dot"></div>Senders and domains</div>
        <div class="perm-item"><div class="perm-dot"></div>Templates and campaigns</div>
        <div class="perm-item"><div class="perm-dot"></div>Contacts and lists</div>
        <div class="perm-item"><div class="perm-dot"></div>Send emails on your behalf</div>
      </div>
      <form id="authForm">
        <input type="hidden" name="state" value="${btoa(JSON.stringify(oauthReq))}">
        <label for="apiKey">API Key</label>
        <input type="password" id="apiKey" name="apiKey" placeholder="pm_live_..." autocomplete="off" required>
        <div class="hint">Find this in <a href="https://xmit.sh/dashboard/settings" target="_blank">Dashboard &gt; Settings &gt; API Keys</a></div>
        <div class="error" id="error"></div>
        <button type="submit" id="submitBtn">Authorize</button>
      </form>
      <div class="footer">
        Don't have an account? <a href="https://xmit.sh/sign-up" target="_blank">Sign up for free</a>
      </div>
    </div>

    <!-- Success state -->
    <div class="success-state" id="successView">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline class="checkmark" points="6 12 10 16 18 8"></polyline>
        </svg>
      </div>
      <div class="success-title">Connected</div>
      <p class="success-desc">
        Your Transmit workspace is now linked. You can close this window and return to your editor.
      </p>
      <div class="success-detail">
        <div class="label">Client</div>
        ${clientInfo.clientName || "MCP Client"}
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('authForm');
    const btn = document.getElementById('submitBtn');
    const errorEl = document.getElementById('error');
    const authView = document.getElementById('authView');
    const successView = document.getElementById('successView');
    const card = document.getElementById('card');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Validating...';

      const formData = new FormData(form);

      try {
        const resp = await fetch('/authorize', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' },
        });

        if (resp.ok) {
          const data = await resp.json();

          // Show success state briefly, then redirect
          authView.style.display = 'none';
          successView.style.display = 'block';
          card.style.borderColor = 'rgba(16, 185, 129, 0.3)';

          setTimeout(() => {
            window.location.href = data.redirectTo;
          }, 1200);
          return;
        }

        // Error response
        const text = await resp.text();
        errorEl.textContent = text || 'Authorization failed. Please check your API key.';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Authorize';
      } catch (err) {
        errorEl.textContent = 'Connection error. Please try again.';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Authorize';
      }
    });
  </script>
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

  // If JS fetch request, return JSON with redirect URL (avoids double-POST)
  const accept = c.req.header("Accept") || "";
  if (accept.includes("application/json")) {
    return c.json({ redirectTo });
  }

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
      color: #a1a1aa; line-height: 1.6; overflow-x: auto; position: relative;
    }
    .config .key { color: #10b981; }
    .config .str { color: #f59e0b; }
    .copy-btn {
      position: absolute; top: 12px; right: 12px; background: #27272a; border: none;
      color: #a1a1aa; padding: 6px 10px; border-radius: 6px; font-size: 11px;
      cursor: pointer; transition: background 0.2s, color 0.2s;
    }
    .copy-btn:hover { background: #3f3f46; color: #fafafa; }
    .footer { margin-top: 24px; font-size: 13px; color: #52525b; }
    .footer a { color: #10b981; text-decoration: none; }
    .badges { display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
    .badge {
      font-size: 12px; padding: 4px 10px; border-radius: 6px;
      background: #27272a; color: #a1a1aa;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Transmit MCP<span>.</span></h1>
    <p class="desc">
      Connect your AI assistant to Transmit. Manage campaigns, templates, contacts, and senders through natural language.
    </p>
    <div class="config" id="config">
      <button class="copy-btn" id="copyBtn" onclick="copyConfig()">Copy</button>
{<br>
&nbsp;&nbsp;<span class="key">"mcpServers"</span>: {<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="key">"transmit"</span>: {<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="key">"type"</span>: <span class="str">"http"</span>,<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="key">"url"</span>: <span class="str">"https://mcp.xmit.sh/mcp"</span><br>
&nbsp;&nbsp;&nbsp;&nbsp;}<br>
&nbsp;&nbsp;}<br>
}
    </div>
    <div class="badges">
      <span class="badge">18 tools</span>
      <span class="badge">2 guided workflows</span>
      <span class="badge">OAuth 2.1</span>
    </div>
    <p class="footer">
      <a href="https://xmit.sh/docs/ai/mcp">Documentation</a> &middot;
      <a href="https://github.com/sendwithxmit/xmit-mcp">GitHub</a>
    </p>
  </div>
  <script>
    function copyConfig() {
      const config = JSON.stringify({ mcpServers: { transmit: { type: "http", url: "https://mcp.xmit.sh/mcp" } } }, null, 2);
      navigator.clipboard.writeText(config).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    }
  </script>
</body>
</html>`);
});

export { app as AuthHandler };
