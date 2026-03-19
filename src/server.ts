import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { registerAllTools } from "./tools/index.js";
import { registerAllPrompts } from "./prompts/index.js";
import { AuthHandler } from "./auth-handler.js";
import type { Env } from "./types.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "xmit",
    version: "1.0.0",
  });
  registerAllTools(server);
  registerAllPrompts(server);
  return server;
}

const apiHandler = {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const server = createServer();
    return createMcpHandler(server)(request, env, ctx);
  },
};

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler,

  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/oauth/token",
  clientRegistrationEndpoint: "/oauth/register",

  defaultHandler: {
    async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
      return AuthHandler.fetch(request, env as Record<string, unknown>, ctx);
    },
  },
});
