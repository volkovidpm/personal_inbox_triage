import { useCallback, useReducer, useRef } from "react";
import { ApiError, classify, draft } from "../lib/api";
import { initialTriage, triageReducer } from "./reducer";

const asApiError = (e: unknown) => (e instanceof ApiError ? e : new ApiError("bad_response"));

/** Запускает разбор: /classify, затем /draft для обращений, ушедших в отдел. Ответы старых запусков отбрасывает редьюсер. */
export function useTriage() {
  const [state, dispatch] = useReducer(triageReducer, initialTriage);
  const runRef = useRef(0);

  const run = useCallback(async (text: string, exampleId?: string) => {
    const runId = ++runRef.current;
    dispatch({ type: "start", text });
    try {
      const result = await classify(text, exampleId);
      dispatch({ type: "classified", runId, result });
      if (result.outcome !== "routed") return;
      const d = await draft(result.id);
      dispatch({ type: "drafted", runId, draft: d });
    } catch (e) {
      dispatch({ type: "failed", runId, error: asApiError(e) });
    }
  }, []);

  return { state, run };
}
