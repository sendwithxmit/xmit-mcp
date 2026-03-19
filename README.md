# xmit-mcp

Remote MCP server for the [Transmit](https://xmit.sh) email platform, deployed on Cloudflare Workers with OAuth 2.1 authentication.

Paste a URL into your MCP client. No install, no build, no binary.

## Connect

Add to your MCP client config:

```json
{
  "mcpServers": {
    "transmit": {
      "url": "https://mcp.xmit.sh/mcp"
    }
  }
}
```

The first time you connect, a browser window opens. Enter your Transmit API key (`pm_live_*`) to authorize. Tokens refresh automatically.

## Tools (18)

| Category | Tools |
|----------|-------|
| **Email** | `send_email` |
| **Contacts** | `add_contact` |
| **Senders** | `list_senders`, `get_sender` |
| **Templates** | `list_templates`, `get_template`, `create_template`, `update_template`, `delete_template` |
| **Campaigns** | `list_campaigns`, `get_campaign`, `create_campaign`, `update_campaign`, `delete_campaign`, `duplicate_campaign` |
| **Lists** | `get_lists` |
| **Suppressions** | `list_suppressions`, `check_suppression` |

## Prompts (2)

- **create-campaign** - Step-by-step campaign creation workflow
- **create-template** - Step-by-step template creation workflow

## Development

```bash
pnpm install
pnpm dev
```

Starts a local dev server at `http://localhost:8787`. Visit `/` for the landing page, `/mcp` for the MCP endpoint.

## Deploy

```bash
# Create KV namespace for OAuth tokens
wrangler kv namespace create OAUTH_KV

# Update wrangler.toml with the namespace ID, then:
pnpm deploy
```

## Architecture

```
MCP Client -> mcp.xmit.sh (CF Worker, OAuth) -> api.xmit.sh (Transmit API)
```

- `OAuthProvider` from `@cloudflare/workers-oauth-provider` handles OAuth 2.1 (PKCE, client registration, token lifecycle)
- `createMcpHandler` from `agents` SDK handles MCP Streamable HTTP transport
- All tool calls proxy to `api.xmit.sh` using the user's API key stored in the OAuth grant

## License

MIT
