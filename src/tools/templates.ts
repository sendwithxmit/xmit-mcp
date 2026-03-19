import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { TransmitClient } from "../client.js";
import { splitCSV, parseIntParam } from "./index.js";

export function registerTemplateTools(server: McpServer) {
  server.registerTool("list_templates", {
    description: "List email templates with optional search and pagination.",
    inputSchema: {
      limit: z.string().optional().describe("Max templates to return (1-1000, default: 50)."),
      offset: z.string().optional().describe("Templates to skip (default: 0)."),
      q: z.string().optional().describe("Search by name or subject."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.listTemplates(parseIntParam(params.limit, 50), parseIntParam(params.offset, 0), params.q);
      return { content: [{ type: "text", text: JSON.stringify(resp, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to list templates: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("get_template", {
    description: "Get a template by ID, including its full HTML body and variables.",
    inputSchema: { id: z.string().describe("Template ID (tpl_xxx).") },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.getTemplate(params.id);
      return { content: [{ type: "text", text: JSON.stringify(resp, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to get template: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("create_template", {
    description: "Create a new email template.",
    inputSchema: {
      name: z.string().describe("Template name."),
      subject: z.string().describe("Email subject line. Supports {{variableName}} syntax."),
      bodyHtml: z.string().describe("HTML email body. Supports {{variableName}} syntax."),
      bodyText: z.string().optional().describe("Plain text fallback body."),
      variables: z.string().optional().describe("Comma-separated variable names (e.g. 'firstName,lastName')."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      const resp = await client.createTemplate({
        name: params.name, subject: params.subject, bodyHtml: params.bodyHtml,
        bodyText: params.bodyText, variables: splitCSV(params.variables),
      });
      return { content: [{ type: "text", text: `Template created successfully. ID: ${resp.id}` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to create template: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("update_template", {
    description: "Update an existing template. Only provide fields you want to change.",
    inputSchema: {
      id: z.string().describe("Template ID (tpl_xxx)."),
      name: z.string().optional().describe("New template name."),
      subject: z.string().optional().describe("New subject line."),
      bodyHtml: z.string().optional().describe("New HTML body."),
      bodyText: z.string().optional().describe("New plain text body."),
      variables: z.string().optional().describe("Comma-separated variable names."),
    },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      await client.updateTemplate(params.id, {
        name: params.name, subject: params.subject, bodyHtml: params.bodyHtml,
        bodyText: params.bodyText, variables: splitCSV(params.variables),
      });
      return { content: [{ type: "text", text: `Template ${params.id} updated successfully.` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to update template: ${(e as Error).message}` }] };
    }
  });

  server.registerTool("delete_template", {
    description: "Permanently delete a template by ID.",
    inputSchema: { id: z.string().describe("Template ID (tpl_xxx).") },
  }, async (params) => {
    const auth = getMcpAuthContext();
    const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);
    try {
      await client.deleteTemplate(params.id);
      return { content: [{ type: "text", text: `Template ${params.id} deleted successfully.` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to delete template: ${(e as Error).message}` }] };
    }
  });
}
