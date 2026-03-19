import type {
  SendEmailRequest, SendEmailResponse,
  AddContactRequest, AddContactResponse,
  ListSendersResponse,
  Template, ListTemplatesResponse, CreateTemplateRequest, CreateTemplateResponse, UpdateTemplateRequest,
  Campaign, ListCampaignsResponse, CreateCampaignRequest, CreateCampaignResponse, UpdateCampaignRequest,
  ListListsResponse,
  ListSuppressionsResponse, CheckSuppressionResponse,
  SuccessResponse, ApiError,
} from "./types.js";

export class TransmitClient {
  constructor(
    private apiKey: string,
    private apiBase: string,
  ) {}

  // --- Send ---

  async sendEmail(req: SendEmailRequest): Promise<SendEmailResponse> {
    return this.do("POST", "/email/send", req);
  }

  // --- Contacts ---

  async addContact(req: AddContactRequest): Promise<AddContactResponse> {
    return this.do("POST", "/api/contacts", req);
  }

  // --- Senders ---

  async listSenders(): Promise<ListSendersResponse> {
    return this.do("GET", "/api/senders");
  }

  // --- Templates ---

  async listTemplates(limit: number, offset: number, q?: string): Promise<ListTemplatesResponse> {
    const query: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (q) query.q = q;
    return this.do("GET", "/api/templates", undefined, query);
  }

  async getTemplate(id: string): Promise<Template> {
    return this.do("GET", `/api/templates/${id}`);
  }

  async createTemplate(req: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    return this.do("POST", "/api/templates", req);
  }

  async updateTemplate(id: string, req: UpdateTemplateRequest): Promise<SuccessResponse> {
    return this.do("PUT", `/api/templates/${id}`, req);
  }

  async deleteTemplate(id: string): Promise<SuccessResponse> {
    return this.do("DELETE", `/api/templates/${id}`);
  }

  // --- Campaigns ---

  async listCampaigns(limit: number, offset: number, q?: string): Promise<ListCampaignsResponse> {
    const query: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (q) query.q = q;
    return this.do("GET", "/api/campaigns", undefined, query);
  }

  async getCampaign(id: string): Promise<Campaign> {
    return this.do("GET", `/api/campaigns/${id}`);
  }

  async createCampaign(req: CreateCampaignRequest): Promise<CreateCampaignResponse> {
    return this.do("POST", "/api/campaigns", req);
  }

  async updateCampaign(id: string, req: UpdateCampaignRequest): Promise<SuccessResponse> {
    return this.do("PUT", `/api/campaigns/${id}`, req);
  }

  async deleteCampaign(id: string): Promise<SuccessResponse> {
    return this.do("DELETE", `/api/campaigns/${id}`);
  }

  async duplicateCampaign(id: string): Promise<CreateCampaignResponse> {
    return this.do("POST", `/api/campaigns/${id}/clone`);
  }

  // --- Lists ---

  async listLists(limit: number, offset: number, q?: string): Promise<ListListsResponse> {
    const query: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (q) query.q = q;
    return this.do("GET", "/api/lists", undefined, query);
  }

  // --- Suppressions ---

  async listSuppressions(limit: number, offset: number): Promise<ListSuppressionsResponse> {
    return this.do("GET", "/api/suppressions", undefined, { limit: String(limit), offset: String(offset) });
  }

  async checkSuppression(email: string): Promise<CheckSuppressionResponse> {
    return this.do("GET", `/api/suppressions/check/${encodeURIComponent(email)}`);
  }

  // --- Validation ---

  static async validate(apiKey: string, apiBase: string): Promise<boolean> {
    try {
      const resp = await fetch(`${apiBase}/api/workspaces`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "User-Agent": "xmit-mcp/1.0",
        },
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  // --- Internal ---

  private async do<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    let url = this.apiBase + path;
    if (query && Object.keys(query).length > 0) {
      url += "?" + new URLSearchParams(query).toString();
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": "xmit-mcp/1.0",
    };

    let reqBody: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      reqBody = JSON.stringify(body);
    }

    const resp = await fetch(url, { method, headers, body: reqBody });

    if (!resp.ok) {
      const text = await resp.text();
      let msg = `API error ${resp.status}`;
      try {
        const err = JSON.parse(text) as ApiError;
        msg = `API error ${resp.status}: ${err.message || err.error || text}`;
      } catch {
        msg = `API error ${resp.status}: ${text}`;
      }
      throw new Error(msg);
    }

    return resp.json() as Promise<T>;
  }
}
