import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { TransmitClient } from "../client.js";
import { parseIntParam } from "./index.js";

export function registerCampaignTools(server: McpServer) {
  server.registerTool("list_campaigns", {
    description: "List campaigns with delivery stats, optional search and pagination.",
    inputSchema: {
      limit: z.string().optional().describe("Max campaigns to return (1-1000, default: 50)."),
      offset: z.string().optional().describe("Campaigns to skip (default: 0)."),
      q: z.string().optional().describe("Search campaigns by name."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.listCampaigns(parseIntParam(params.limit, 50), parseIntParam(params.offset, 0), params.q);
      return { content: [{ type: "text", text: JSON.stringify(resp, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to list campaigns: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("get_campaign", {
    description: "Get full campaign details including HTML body and delivery stats.",
    inputSchema: { id: z.string().describe("Campaign ID (cmp_xxx).") },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.getCampaign(params.id);
      return { content: [{ type: "text", text: JSON.stringify(resp, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to get campaign: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("create_campaign", {
    description: "Create a new campaign draft. All campaigns are created as drafts.",
    inputSchema: {
      name: z.string().describe("Campaign name (max 200 characters)."),
      subject: z.string().describe("Email subject line."),
      bodyHtml: z.string().describe("HTML email body."),
      senderId: z.string().optional().describe("Sender ID (sndr_xxx)."),
      listId: z.string().optional().describe("Contact list ID (lst_xxx)."),
      templateId: z.string().optional().describe("Template ID (tpl_xxx)."),
      scheduledAt: z.string().optional().describe("ISO 8601 datetime for scheduled sending."),
      isPublic: z.string().optional().describe("Set to 'true' to publish to archive after sending."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.createCampaign({
        name: params.name, subject: params.subject, bodyHtml: params.bodyHtml,
        senderId: params.senderId, listId: params.listId, templateId: params.templateId,
        scheduledAt: params.scheduledAt, isPublic: params.isPublic?.toLowerCase() === "true",
      });
      return { content: [{ type: "text", text: `Campaign created successfully. ID: ${resp.id}, Status: ${resp.status}` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to create campaign: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("update_campaign", {
    description: "Update a draft campaign. Only draft campaigns can be edited.",
    inputSchema: {
      id: z.string().describe("Campaign ID (cmp_xxx)."),
      name: z.string().optional().describe("New campaign name."),
      subject: z.string().optional().describe("New subject line."),
      bodyHtml: z.string().optional().describe("New HTML body."),
      senderId: z.string().optional().describe("New sender ID."),
      listId: z.string().optional().describe("New list ID."),
      scheduledAt: z.string().optional().describe("New scheduled datetime (ISO 8601)."),
      isPublic: z.string().optional().describe("'true' or 'false'."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const req: Record<string, unknown> = {};
      if (params.name) req.name = params.name;
      if (params.subject) req.subject = params.subject;
      if (params.bodyHtml) req.bodyHtml = params.bodyHtml;
      if (params.senderId) req.senderId = params.senderId;
      if (params.listId) req.listId = params.listId;
      if (params.scheduledAt) req.scheduledAt = params.scheduledAt;
      if (params.isPublic !== undefined) req.isPublic = params.isPublic.toLowerCase() === "true";
      await client.updateCampaign(params.id, req);
      return { content: [{ type: "text", text: `Campaign ${params.id} updated successfully.` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to update campaign: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("delete_campaign", {
    description: "Delete a campaign. Cannot delete campaigns currently sending.",
    inputSchema: { id: z.string().describe("Campaign ID (cmp_xxx).") },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      await client.deleteCampaign(params.id);
      return { content: [{ type: "text", text: `Campaign ${params.id} deleted successfully.` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to delete campaign: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("duplicate_campaign", {
    description: "Clone an existing campaign as a new draft.",
    inputSchema: { id: z.string().describe("Campaign ID (cmp_xxx) to duplicate.") },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.duplicateCampaign(params.id);
      return { content: [{ type: "text", text: `Campaign duplicated. New ID: ${resp.id}, Status: ${resp.status}` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to duplicate campaign: ${(e as Error).message}` }] };
    }
  });
}
