// --- Environment ---

export interface Env {
  TRANSMIT_API_BASE: string;
  OAUTH_KV: KVNamespace;
  OAUTH_PROVIDER: import("@cloudflare/workers-oauth-provider").OAuthHelpers;
}

// --- Send Email ---

export interface SendEmailRequest {
  to: string[];
  subject: string;
  from?: string;
  senderId?: string;
  html?: string;
  templateId?: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SendEmailResponse {
  messageId: string;
  success: boolean;
}

// --- Contacts ---

export interface AddContactRequest {
  email: string;
  listId?: string;
  firstName?: string;
  lastName?: string;
}

export interface AddContactResponse {
  id: string;
}

// --- Senders ---

export interface Sender {
  id: string;
  domainId: string;
  email: string;
  name?: string;
  replyTo?: string;
  verified: boolean;
  isDefault: boolean;
  createdAt?: string;
}

export interface ListSendersResponse {
  senders: Sender[];
}

// --- Templates ---

export interface Template {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ListTemplatesResponse {
  templates: Template[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: string[];
}

export interface CreateTemplateResponse {
  id: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables?: string[];
}

// --- Campaigns ---

export interface CampaignStats {
  totalRecipients: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  complaintCount: number;
}

export interface CampaignListItem {
  id: string;
  name: string;
  subject: string;
  status: string;
  listId?: string;
  listName?: string;
  createdAt: string;
  scheduledAt?: string;
  stats?: CampaignStats;
}

export interface ListCampaignsResponse {
  campaigns: CampaignListItem[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  status: string;
  senderId?: string;
  listId?: string;
  templateId?: string;
  scheduledAt?: string;
  isPublic: boolean;
  createdAt: string;
  stats?: CampaignStats;
}

export interface CreateCampaignRequest {
  name: string;
  subject: string;
  bodyHtml: string;
  senderId?: string;
  listId?: string;
  templateId?: string;
  scheduledAt?: string;
  isPublic?: boolean;
}

export interface CreateCampaignResponse {
  id: string;
  status: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  senderId?: string;
  listId?: string;
  scheduledAt?: string;
  isPublic?: boolean;
}

// --- Lists ---

export interface List {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt?: string;
}

export interface ListListsResponse {
  lists: List[];
  totalCount: number;
  limit: number;
  offset: number;
}

// --- Suppressions ---

export interface Suppression {
  id: string;
  email: string;
  reason: string;
  source?: string;
  createdAt: string;
}

export interface ListSuppressionsResponse {
  suppressions: Suppression[];
  limit: number;
  offset: number;
}

export interface CheckSuppressionResponse {
  suppressed: boolean;
  reason?: string;
  createdAt?: string;
}

// --- Generic ---

export interface SuccessResponse {
  success: boolean;
}

export interface ApiError {
  message?: string;
  error?: string;
}
