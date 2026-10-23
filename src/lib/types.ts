export type RequestType = "review" | "wholesale" | "blogger" | "candidate" | "approval";
export type Category = RequestType | "spam" | "off_topic";
export type Department = "service" | "wholesale" | "marketing" | "hr" | "approvals" | "manual" | "spam";
export type Status = "new" | "work" | "done";
export type Flag = "legal";
export type Channel = "wb" | "ozon" | "ym" | "site" | "telegram" | "whatsapp" | "email" | "hh" | "internal";

export interface JevReading {
  pRequest: number;
  category: Category;
  pCategory: number;
  pInjection: number;
  /** Шкала 1–5 по типу обращения: раздражение, качество лида, соответствие аудитории, совпадение, риск. */
  score?: number;
  pCounterfeit?: number;
  pEnoughData?: number;
  ms: number;
  source: "live" | "recorded";
}

export interface FeedItem {
  id: string;
  type: RequestType | "spam";
  channel: Channel;
  author: string;
  text: string;
  offsetMinutes: number;
  status: Status;
  department: Department;
  flags: Flag[];
  jev: JevReading;
  draft: string | null;
}

export type RejectReason =
  | "too_short"
  | "too_long"
  | "symbols"
  | "off_topic"
  | "spam"
  | "injection"
  | "rate_limited"
  | "daily_limit"
  | "ai_unavailable";

export interface ClassifyResult {
  id: string;
  outcome: "routed" | "manual" | "rejected";
  reason?: RejectReason;
  rulesMs: number;
  jev?: JevReading;
  department?: Department;
  flags: Flag[];
  used: number;
  limit: number;
}

export interface DraftResult {
  id: string;
  text: string;
  ms: number;
  model: string;
  source: "live" | "recorded";
}

export interface InviteInfo {
  label: string;
  expiresAt: string;
  limit: number;
  used: number;
}

export interface MyRequest {
  text: string;
  createdAt: string;
  result: ClassifyResult;
  draft: DraftResult | null;
}

export interface FeedResponse {
  invite: InviteInfo;
  requests: FeedItem[];
  mine: MyRequest[];
}
