import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerAllPrompts(server: McpServer) {
  server.prompt(
    "create-campaign",
    "Step-by-step guide to create and configure an email campaign.",
    { goal: z.string().describe("What is this campaign about? e.g. 'product launch announcement'") },
    (params) => {
      const goal = params.goal || "email campaign";
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `You are helping the user create an email campaign about: ${goal}

Follow these steps in order:

1. First, call the "list_senders" tool to see available senders. Present them to the user and ask which one to use.

2. Next, call the "get_lists" tool to see available contact lists. Present them to the user and ask which list to send to.

3. Ask the user for:
   - A subject line for the campaign
   - The email body content (offer to write HTML for them if they describe what they want)

4. Once you have all the information, call "create_campaign" with:
   - name: a descriptive campaign name based on their goal
   - subject: the subject line they chose
   - bodyHtml: the HTML email body
   - senderId: the sender they selected
   - listId: the list they selected

5. Confirm the draft was created and share the campaign ID. Ask if they want to make any changes before sending.

Important: All campaigns are created as drafts. They must be sent from the Transmit dashboard.`,
          },
        }],
      };
    },
  );

  server.prompt(
    "create-template",
    "Step-by-step guide to create a reusable email template.",
    { purpose: z.string().describe("What kind of template? e.g. 'welcome email', 'password reset'") },
    (params) => {
      const purpose = params.purpose || "email template";
      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `You are helping the user create a reusable email template for: ${purpose}

Follow these steps in order:

1. Ask the user for a template name (e.g. "Welcome Email", "Password Reset").

2. Ask for the email subject line. Mention they can use {{variableName}} syntax for dynamic content (e.g. "Welcome, {{firstName}}!").

3. Ask what dynamic variables they need. Common ones include:
   - firstName, lastName (recipient name)
   - companyName (their company)
   - actionUrl (CTA link)
   - Custom variables specific to their use case

4. Generate a clean, responsive HTML email body for their stated purpose. The HTML should:
   - Be mobile-responsive with inline CSS
   - Use a clean, professional design
   - Include {{variableName}} placeholders for all dynamic content
   - Have a clear call-to-action if appropriate

5. Present the HTML to the user and ask if they want any changes.

6. Once approved, call "create_template" with:
   - name: the template name
   - subject: the subject line
   - bodyHtml: the generated HTML
   - variables: comma-separated list of variable names used
   - bodyText: a plain text version of the email

7. Confirm the template was created and share the template ID. Suggest they can test it by using the "send_email" tool with the templateId parameter.`,
          },
        }],
      };
    },
  );
}
