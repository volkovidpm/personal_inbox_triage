import { useCallback, useReducer, useRef } from "react";
import { ApiError, classify, draft } from "../lib/api";
import { initialTriage, triageReducer } from "./reducer";

const asApiError = (e: unknown) => (e instanceof ApiError ? e : new ApiError("bad_response"));

/** Запускает разбор: /classify, затем /draft для обращений, ушедших в отдел. Ответы старых запусков отбрасывает редьюсер. */
export function useTriage() {
  const [state, dispatch] = useReducer(triageReducer, initialTriage);
  const runRef = useRef(0);
  const lastRef = useRef<{ text: string; exampleId?: string } | null>(null);

  const writeDraft = useCallback(async (runId: number, id: string) => {
    try {
      dispatch({ type: "drafted", runId, draft: await draft(id) });
    } catch (e) {
      dispatch({ type: "failed", runId, error: asApiError(e) });
    }
  }, []);

  const run = useCallback(
    async (text: string, exampleId?: string) => {
      const runId = ++runRef.current;
      lastRef.current = { text, exampleId };
      dispatch({ type: "start", text });
      try {
        const result = await classify(text, exampleId);
        dispatch({ type: "classified", runId, result });
        if (result.outcome === "routed") await writeDraft(runId, result.id);
      } catch (e) {
        dispatch({ type: "failed", runId, error: asApiError(e) });
      }
    },
    [writeDraft]
  );

  /** Повтор после сбоя: черновик — без нового разбора (разбор уже посчитан в лимите), иначе весь разбор. */
  const retry = useCallback(() => {
    if (state.retry === "draft" && state.result) {
      dispatch({ type: "redraft" });
      return writeDraft(runRef.current, state.result.id);
    }
    if (lastRef.current) return run(lastRef.current.text, lastRef.current.exampleId);
  }, [state.retry, state.result, run, writeDraft]);

  return { state, run, retry };
}
