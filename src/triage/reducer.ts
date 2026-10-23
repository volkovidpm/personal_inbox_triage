import { ApiError } from "../lib/api";
import { DEPARTMENT_LABEL, TYPE_LABEL, formatDuration, formatPercent } from "../lib/format";
import type { ClassifyResult, DraftResult, RejectReason } from "../lib/types";

export type Stage = "rules" | "jev" | "route" | "draft";
export type StageState = "pending" | "active" | "done" | "stopped" | "skipped";
export interface StageView {
  state: StageState;
  meta: string;
}
export type NoticeReason = RejectReason | "manual";

export interface TriageState {
  runId: number;
  text: string;
  busy: boolean;
  stages: Record<Stage, StageView>;
  result?: ClassifyResult;
  draft?: DraftResult;
  reason?: NoticeReason;
  error?: ApiError;
}

export type TriageAction =
  | { type: "start"; text: string }
  | { type: "classified"; runId: number; result: ClassifyResult }
  | { type: "drafted"; runId: number; draft: DraftResult }
  | { type: "failed"; runId: number; error: ApiError };

const pending: StageView = { state: "pending", meta: "" };
const skipped: StageView = { state: "skipped", meta: "не запускался" };

export const initialTriage: TriageState = {
  runId: 0,
  text: "",
  busy: false,
  stages: { rules: pending, jev: pending, route: pending, draft: pending },
};

const RULE_STOP: Partial<Record<RejectReason, string>> = {
  too_short: "мало текста",
  too_long: "слишком длинно",
  symbols: "нет букв и цифр",
  rate_limited: "слишком часто",
  daily_limit: "лимит на сутки",
};

function classified(state: TriageState, result: ClassifyResult): TriageState {
  const rulesDone: StageView = { state: "done", meta: `пройдены · ${formatDuration(result.rulesMs)}` };
  const noticeReason: NoticeReason | undefined = result.outcome === "routed" ? undefined : (result.reason ?? "manual");
  const base: TriageState = { ...state, result, reason: noticeReason };
  const reason = result.reason;

  if (reason && RULE_STOP[reason] && !result.jev) {
    return { ...base, busy: false, stages: { rules: { state: "stopped", meta: RULE_STOP[reason]! }, jev: skipped, route: skipped, draft: skipped } };
  }
  const jev = result.jev;
  if (!jev) {
    return { ...base, busy: false, stages: { rules: rulesDone, jev: { state: "stopped", meta: "недоступна" }, route: skipped, draft: skipped } };
  }
  if (result.outcome === "rejected") {
    const meta =
      reason === "injection"
        ? `попытка взлома · ${formatPercent(jev.pInjection)}`
        : reason === "spam"
          ? `спам · ${formatPercent(jev.pCategory)}`
          : `не по теме · ${formatPercent(jev.pRequest)}`;
    return { ...base, busy: false, stages: { rules: rulesDone, jev: { state: "stopped", meta }, route: skipped, draft: skipped } };
  }
  const jevDone: StageView = { state: "done", meta: `${TYPE_LABEL[jev.category]} · ${formatPercent(jev.pCategory)} · ${formatDuration(jev.ms)}` };
  const route: StageView = { state: "done", meta: DEPARTMENT_LABEL[result.department ?? "manual"] };
  if (result.outcome === "manual") {
    return { ...base, busy: false, stages: { rules: rulesDone, jev: jevDone, route, draft: skipped } };
  }
  return { ...base, busy: true, stages: { rules: rulesDone, jev: jevDone, route, draft: { state: "active", meta: "пишет…" } } };
}

export function triageReducer(state: TriageState, action: TriageAction): TriageState {
  if (action.type === "start") {
    return {
      runId: state.runId + 1,
      text: action.text,
      busy: true,
      stages: { rules: { state: "active", meta: "проверяю…" }, jev: pending, route: pending, draft: pending },
    };
  }
  if (action.runId !== state.runId) return state;

  if (action.type === "classified") return classified(state, action.result);
  if (action.type === "drafted") {
    const meta = formatDuration(action.draft.ms) + (action.draft.source === "recorded" ? " · запись" : "");
    return { ...state, busy: false, draft: action.draft, stages: { ...state.stages, draft: { state: "done", meta } } };
  }

  const { error } = action;
  if (state.stages.draft.state === "active") {
    return { ...state, busy: false, error, stages: { ...state.stages, draft: { state: "stopped", meta: "не удалось" } } };
  }
  if (error.kind === "rate_limited") {
    return {
      ...state,
      busy: false,
      error,
      reason: "rate_limited",
      stages: { rules: { state: "stopped", meta: "слишком часто" }, jev: skipped, route: skipped, draft: skipped },
    };
  }
  return { ...state, busy: false, error, stages: { rules: { state: "stopped", meta: "ошибка связи" }, jev: skipped, route: skipped, draft: skipped } };
}
