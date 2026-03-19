import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerEmailTools } from "./email.js";
import { registerContactTools } from "./contacts.js";
import { registerSenderTools } from "./senders.js";
import { registerTemplateTools } from "./templates.js";
import { registerCampaignTools } from "./campaigns.js";
import { registerListTools } from "./lists.js";
import { registerSuppressionTools } from "./suppressions.js";

export function registerAllTools(server: McpServer) {
  registerEmailTools(server);
  registerContactTools(server);
  registerSenderTools(server);
  registerTemplateTools(server);
  registerCampaignTools(server);
  registerListTools(server);
  registerSuppressionTools(server);
}

export function splitCSV(s: string | undefined): string[] | undefined {
  if (!s || !s.trim()) return undefined;
  return s.split(",").map((p) => p.trim()).filter(Boolean);
}

export function parseIntParam(s: string | undefined, defaultVal: number): number {
  if (!s) return defaultVal;
  const v = parseInt(s, 10);
  return isNaN(v) ? defaultVal : v;
}
