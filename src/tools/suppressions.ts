import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { TransmitClient } from "../client.js";
import { parseIntParam } from "./index.js";

export function registerSuppressionTools(server: McpServer) {
  server.registerTool("list_suppressions", {
    description: "List suppressed email addresses (bounces, complaints, unsubscribes).",
    inputSchema: {
      limit: z.string().optional().describe("Max suppressions to return (1-5000, default: 100)."),
      offset: z.string().optional().describe("Suppressions to skip (default: 0)."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.listSuppressions(parseIntParam(params.limit, 100), parseIntParam(params.offset, 0));
      return { content: [{ type: "text", text: JSON.stringify(resp, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to list suppressions: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("check_suppression", {
    description: "Check if a specific email address is on the suppression list.",
    inputSchema: {
      email: z.string().describe("Email address to check."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.checkSuppression(params.email);
      if (resp.suppressed) {
        return { content: [{ type: "text", text: `${params.email} is suppressed (reason: ${resp.reason}, since: ${resp.createdAt})` }] };
      }
      return { content: [{ type: "text", text: `${params.email} is not suppressed.` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to check suppression: ${(e as Error).message}` }] };
    }
  });
}
