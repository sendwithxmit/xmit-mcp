import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { TransmitClient } from "../client.js";

export function registerContactTools(server: McpServer) {
  server.registerTool(
    "add_contact",
    {
      description: "Add a contact to an xmit.sh mailing list.",
      inputSchema: {
        email: z.string().describe("Contact email address."),
        listId: z.string().optional().describe("Mailing list ID."),
        firstName: z.string().optional().describe("Contact's first name."),
        lastName: z.string().optional().describe("Contact's last name."),
      },
    },
    async (params) => {
      const auth = getMcpAuthContext();
      const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);

      try {
        const resp = await client.addContact({
          email: params.email,
          listId: params.listId,
          firstName: params.firstName,
          lastName: params.lastName,
        });
        return { content: [{ type: "text", text: `Contact added successfully. ID: ${resp.id}, Email: ${params.email}` }] };
      } catch (e) {
        return { content: [{ type: "text", text: `Failed to add contact: ${(e as Error).message}` }] };
      }
    },
  );
}
