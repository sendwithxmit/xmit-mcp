import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuthContext } from "agents/mcp";
import { z } from "zod";
import { TransmitClient } from "../client.js";
import { splitCSV } from "./index.js";

export function registerEmailTools(server: McpServer) {
  server.registerTool(
    "send_email",
    {
      description: "Send a transactional email via xmit.sh. Requires either 'from' or 'senderId', and either 'html' or 'templateId'.",
      inputSchema: {
        to: z.string().describe("Recipient email address(es). Comma-separated for multiple."),
        subject: z.string().describe("Email subject line."),
        from: z.string().optional().describe("Sender email address. Required if 'senderId' is not provided."),
        senderId: z.string().optional().describe("Sender ID from the dashboard. Required if 'from' is not provided."),
        html: z.string().optional().describe("HTML email body. Required if 'templateId' is not provided."),
        templateId: z.string().optional().describe("Template ID. Required if 'html' is not provided."),
        text: z.string().optional().describe("Plain text fallback body."),
        fromName: z.string().optional().describe("Sender display name."),
        replyTo: z.string().optional().describe("Reply-to email address."),
        cc: z.string().optional().describe("CC recipient(s). Comma-separated."),
        bcc: z.string().optional().describe("BCC recipient(s). Comma-separated."),
      },
    },
    async (params) => {
      if (!params.from && !params.senderId) {
        return { content: [{ type: "text", text: "Error: either 'from' or 'senderId' must be provided" }] };
      }
      if (!params.html && !params.templateId) {
        return { content: [{ type: "text", text: "Error: either 'html' or 'templateId' must be provided" }] };
      }

      const auth = getMcpAuthContext();
      const client = new TransmitClient(auth!.props!.apiKey as string, auth!.props!.apiBase as string);

      try {
        const resp = await client.sendEmail({
          to: splitCSV(params.to) ?? [params.to],
          subject: params.subject,
          from: params.from,
          senderId: params.senderId,
          html: params.html,
          templateId: params.templateId,
          text: params.text,
          fromName: params.fromName,
          replyTo: params.replyTo,
          cc: splitCSV(params.cc),
          bcc: splitCSV(params.bcc),
        });
        return { content: [{ type: "text", text: `Email sent successfully. Message ID: ${resp.messageId}` }] };
      } catch (e) {
        return { content: [{ type: "text", text: `Failed to send email: ${(e as Error).message}` }] };
      }
    },
  );
}
