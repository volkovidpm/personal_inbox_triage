import { ApiError } from "../lib/api";
import type { ClassifyResult, DraftResult } from "../lib/types";
import { initialTriage, triageReducer, type TriageState } from "./reducer";

const jev = { pRequest: 0.94, category: "review" as const, pCategory: 0.91, pInjection: 0.03, ms: 312, source: "live" as const };

function result(over: Partial<ClassifyResult>): ClassifyResult {
  return { id: "r1", outcome: "routed", rulesMs: 2, flags: [], used: 1, limit: 50, ...over };
}

function started(): TriageState {
  return triageReducer(initialTriage, { type: "start", text: "Порошок не растворяется" });
}

describe("triageReducer", () => {
  it("start включает правила, остальные ждут, растит runId", () => {
    const s = started();
    expect(s.runId).toBe(1);
    expect(s.busy).toBe(true);
    expect(s.stages.rules.state).toBe("active");
    expect([s.stages.jev.state, s.stages.route.state, s.stages.draft.state]).toEqual(["pending", "pending", "pending"]);
  });

  it("отбивка по правилам останавливает первый этап", () => {
    const s = triageReducer(started(), { type: "classified", runId: 1, result: result({ outcome: "rejected", reason: "too_short", jev: undefined }) });
    expect(s.stages.rules).toEqual({ state: "stopped", meta: "мало текста" });
    expect([s.stages.jev.state, s.stages.route.state, s.stages.draft.state]).toEqual(["skipped", "skipped", "skipped"]);
    expect(s.stages.draft.meta).toBe("не запускался");
    expect(s.busy).toBe(false);
  });

  it("попытка взлома останавливает Jev", () => {
    const s = triageReducer(started(), {
      type: "classified",
      runId: 1,
      result: result({ outcome: "rejected", reason: "injection", jev: { ...jev, pInjection: 0.97 } }),
    });
    expect(s.stages.rules).toEqual({ state: "done", meta: "пройдены · 2 мс" });
    expect(s.stages.jev).toEqual({ state: "stopped", meta: "попытка взлома · 97%" });
    expect([s.stages.route.state, s.stages.draft.state]).toEqual(["skipped", "skipped"]);
  });

  it("маршрут в отдел запускает черновик", () => {
    const s = triageReducer(started(), { type: "classified", runId: 1, result: result({ jev, department: "service" }) });
    expect(s.stages.jev).toEqual({ state: "done", meta: "Отзыв · 91% · 312 мс" });
    expect(s.stages.route).toEqual({ state: "done", meta: "Клиентский сервис" });
    expect(s.stages.draft).toEqual({ state: "active", meta: "пишет…" });
    expect(s.busy).toBe(true);
  });

  it("ручной разбор не пишет черновик", () => {
    const s = triageReducer(started(), { type: "classified", runId: 1, result: result({ outcome: "manual", jev, department: "manual" }) });
    expect(s.stages.route).toEqual({ state: "done", meta: "Ручной разбор" });
    expect(s.stages.draft.state).toBe("skipped");
    expect(s.busy).toBe(false);
  });

  it("черновик готов", () => {
    const routed = triageReducer(started(), { type: "classified", runId: 1, result: result({ jev, department: "service" }) });
    const draft: DraftResult = { id: "r1", text: "Ответ", ms: 3800, model: "m", source: "live" };
    const s = triageReducer(routed, { type: "drafted", runId: 1, draft });
    expect(s.stages.draft).toEqual({ state: "done", meta: "3,8 с" });
    expect(s.draft).toEqual(draft);
    expect(s.busy).toBe(false);
    const recorded = triageReducer(routed, { type: "drafted", runId: 1, draft: { ...draft, source: "recorded" } });
    expect(recorded.stages.draft.meta).toBe("3,8 с · запись");
  });

  it("ответ старого запуска не меняет состояние", () => {
    const first = started();
    const second = triageReducer(first, { type: "start", text: "Другой текст" });
    const s = triageReducer(second, { type: "classified", runId: 1, result: result({ jev, department: "service" }) });
    expect(s).toBe(second);
  });

  it("слишком частые запросы останавливают правила", () => {
    const s = triageReducer(started(), { type: "failed", runId: 1, error: new ApiError("rate_limited", 429) });
    expect(s.stages.rules).toEqual({ state: "stopped", meta: "слишком часто" });
    expect(s.reason).toBe("rate_limited");
    expect(s.busy).toBe(false);
  });

  it("сбой черновика останавливает только черновик", () => {
    const routed = triageReducer(started(), { type: "classified", runId: 1, result: result({ jev, department: "service" }) });
    const s = triageReducer(routed, { type: "failed", runId: 1, error: new ApiError("network") });
    expect(s.stages.route.state).toBe("done");
    expect(s.stages.draft).toEqual({ state: "stopped", meta: "не удалось" });
    expect(s.busy).toBe(false);
  });
});
