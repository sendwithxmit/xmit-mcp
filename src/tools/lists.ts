import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { TransmitClient } from "../client.js";
import { parseIntParam } from "./index.js";

export function registerListTools(server: McpServer) {
  server.registerTool("get_lists", {
    description: "List contact lists with contact counts, optional search and pagination.",
    inputSchema: {
      limit: z.string().optional().describe("Max lists to return (1-1000, default: 50)."),
      offset: z.string().optional().describe("Lists to skip (default: 0)."),
      q: z.string().optional().describe("Search lists by name."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.listLists(parseIntParam(params.limit, 50), parseIntParam(params.offset, 0), params.q);
      return { content: [{ type: "text", text: JSON.stringify(resp, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to list lists: ${(e as Error).message}` }] };
    }
  });
}
