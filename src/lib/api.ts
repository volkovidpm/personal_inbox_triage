import { API_BASE } from "../config";
import type { ClassifyResult, DraftResult, FeedResponse } from "./types";

export type ApiErrorKind =
  | "no_invite"
  | "unknown_invite"
  | "expired"
  | "limit_reached"
  | "inactive"
  | "rate_limited"
  | "network"
  | "timeout"
  | "bad_response";

const SERVER_KINDS: ApiErrorKind[] = ["no_invite", "unknown_invite", "expired", "limit_reached", "inactive", "rate_limited"];

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status?: number
  ) {
    super(kind);
    this.name = "ApiError";
  }
}

let auth: { invite: string | null; device: string } = { invite: null, device: "" };

export function configureApi(next: { invite: string | null; device: string }) {
  auth = next;
}

// Все запросы — простой POST с формой (application/x-www-form-urlencoded) без своих
// заголовков: браузер не делает предварительный CORS-запрос, который n8n может не обработать.
async function call<T>(path: string, fields: Record<string, string>, timeoutMs: number): Promise<T> {
  if (!auth.invite) throw new ApiError("no_invite");
  const body = new URLSearchParams({ invite: auth.invite, device: auth.device, ...fields });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method: "POST", body, signal: controller.signal });
  } catch {
    throw new ApiError(controller.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("bad_response", response.status);
  }
  if (response.status === 429) throw new ApiError("rate_limited", 429);
  const error = (data as { error?: string } | null)?.error as ApiErrorKind | undefined;
  if (!response.ok || error) {
    throw new ApiError(error && SERVER_KINDS.includes(error) ? error : "bad_response", response.status);
  }
  return data as T;
}

export function getFeed(): Promise<FeedResponse> {
  return call("/feed", {}, 15_000);
}

export function classify(text: string, exampleId?: string): Promise<ClassifyResult> {
  return call("/classify", exampleId ? { text, exampleId } : { text }, 15_000);
}

export function draft(id: string): Promise<DraftResult> {
  return call("/draft", { id }, 30_000);
}
