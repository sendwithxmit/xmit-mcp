import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { TransmitClient } from "../client.js";

export function registerSenderTools(server: McpServer) {
  server.registerTool(
    "list_senders",
    {
      description: "List all email senders configured in your xmit.sh workspace.",
    },
    async () => {
      const auth = getMcpAuthContext();
      const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);

      try {
        const resp = await client.listSenders();
        return { content: [{ type: "text", text: JSON.stringify(resp.senders, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: `Failed to list senders: ${(e as Error).message}` }] };
      }
    },
  );

  server.registerTool(
    "get_sender",
    {
      description: "Get details of a specific sender by ID or email address.",
      inputSchema: {
        identifier: z.string().describe("Sender ID (sndr_xxx) or email address."),
      },
    },
    async (params) => {
      const auth = getMcpAuthContext();
      const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);

      try {
        const resp = await client.listSenders();
        const match = resp.senders.find(
          (s) => s.id.toLowerCase() === params.identifier.toLowerCase() ||
                 s.email.toLowerCase() === params.identifier.toLowerCase(),
        );
        if (!match) {
          return { content: [{ type: "text", text: `Sender not found: ${params.identifier}` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(match, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: `Failed to get sender: ${(e as Error).message}` }] };
      }
    },
  );
}
