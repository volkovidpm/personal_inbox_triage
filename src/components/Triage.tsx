import { useEffect, useState } from "react";
import examples from "../../data/examples.json";
import { TEXT_LIMIT } from "../config";
import { DEPARTMENT_LABEL, TYPE_LABEL } from "../lib/format";
import type { Category, ClassifyResult, MyRequest } from "../lib/types";
import { useTriage } from "../triage/useTriage";
import { AccessGate } from "./AccessGate";
import { DraftReply } from "./DraftReply";
import { Notice } from "./Notice";
import { ProbabilityMeter } from "./ProbabilityMeter";
import { StagePipeline } from "./StagePipeline";

const SCORE_LABEL: Partial<Record<Category, string>> = {
  review: "Раздражение",
  wholesale: "Качество лида",
  blogger: "Подходит аудитория",
  candidate: "Совпадение с вакансией (подсказка, решает человек)",
  approval: "Риск",
};

function Readings({ result }: { result: ClassifyResult }) {
  const jev = result.jev;
  if (!jev) return null;
  return (
    <div className="app-meters">
      <ProbabilityMeter label="Это обращение к компании?" p={jev.pRequest} />
      <ProbabilityMeter label={`Категория: ${TYPE_LABEL[jev.category]}`} p={jev.pCategory} />
      {(result.reason === "injection" || jev.pInjection >= 0.2) && <ProbabilityMeter label="Попытка изменить инструкции?" p={jev.pInjection} />}
      {jev.pCounterfeit !== undefined && <ProbabilityMeter label="Похоже на подделку?" p={jev.pCounterfeit} />}
      {jev.pEnoughData !== undefined && <ProbabilityMeter label="Хватает данных для решения?" p={jev.pEnoughData} />}
      {jev.score !== undefined && SCORE_LABEL[jev.category] && (
        <span className="t-meta app-muted">
          {SCORE_LABEL[jev.category]}: {jev.score} из 5
        </span>
      )}
    </div>
  );
}

function RouteChips({ result }: { result: ClassifyResult }) {
  if (result.outcome !== "routed" || !result.department) return null;
  return (
    <div className="it-row">
      <span className="it-chip it-chip--dept">{DEPARTMENT_LABEL[result.department]}</span>
      {result.flags.includes("legal") && <span className="it-chip it-chip--legal">Юристы</span>}
    </div>
  );
}

function History({ items }: { items: MyRequest[] }) {
  if (items.length === 0) return null;
  return (
    <section className="app-stack">
      <h2 className="t-heading app-section-title">Ваши обращения</h2>
      {items.map((m) => (
        <article key={m.result.id} className="it-card">
          <p className="it-card__text">{m.text}</p>
          <footer className="it-card__foot">
            <span className="it-chip it-chip--dept">
              {m.result.outcome === "rejected" ? "Отбивка" : DEPARTMENT_LABEL[m.result.department ?? "manual"]}
            </span>
            {m.result.jev && <span className="it-card__reading">{TYPE_LABEL[m.result.jev.category]}</span>}
          </footer>
        </article>
      ))}
    </section>
  );
}

function RetryNotice({ what, onRetry }: { what: "classify" | "draft"; onRetry: () => void }) {
  return (
    <section className="it-notice it-notice--warn" role="alert">
      <h3 className="it-notice__title">{what === "draft" ? "Черновик не получился" : "Нет связи с сервером"}</h3>
      <p className="it-notice__text">
        {what === "draft"
          ? "Разбор сохранён, а черновик не пришёл. Попробуйте ещё раз."
          : "Сервер n8n не ответил или ответил с ошибкой. Проверьте соединение и попробуйте ещё раз."}
      </p>
      <div className="it-notice__actions">
        <button className="it-btn it-btn--secondary" type="button" onClick={onRetry}>
          Повторить
        </button>
      </div>
    </section>
  );
}

export function Triage({ mine, onUsage }: { mine: MyRequest[]; onUsage?: (usage: { used: number; limit: number }) => void }) {
  const { state, run, retry } = useTriage();
  const [text, setText] = useState("");
  const [history, setHistory] = useState<MyRequest[]>(mine);
  const chars = [...text].length;

  useEffect(() => {
    if (state.busy || !state.result) return;
    const entry: MyRequest = { text: state.text, createdAt: new Date().toISOString(), result: state.result, draft: state.draft ?? null };
    setHistory((h) => (h.some((x) => x.result.id === entry.result.id) ? h : [entry, ...h]));
  }, [state.busy, state.result, state.draft, state.text]);

  useEffect(() => {
    if (state.result) onUsage?.({ used: state.result.used, limit: state.result.limit });
  }, [state.result, onUsage]);

  const runExample = (id: string) => {
    const ex = examples.find((e) => e.id === id);
    if (!ex || state.busy) return;
    setText(ex.text);
    run(ex.text, ex.id);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.busy && text.trim()) run(text);
  };

  return (
    <div className="app-stack">
      <form className="app-stack" onSubmit={submit}>
        <h2 className="t-heading app-section-title">Отправьте свой запрос</h2>
        <div className="it-field">
          <label className="it-field__label" htmlFor="request">
            Текст обращения
          </label>
          <textarea
            className="it-textarea"
            id="request"
            value={text}
            maxLength={TEXT_LIMIT + 100}
            placeholder="Например: порошок не растворяется, запах другой, чем в прошлый раз"
            onChange={(e) => setText(e.target.value)}
          />
          <div className="it-field__foot">
            <span>Ваши обращения видны только на этом устройстве и автору демо</span>
            <span className="it-num">
              {chars} / {TEXT_LIMIT}
            </span>
          </div>
        </div>
        <div className="it-row">
          {examples.map((e) => (
            <button key={e.id} className="it-btn it-btn--example" type="button" disabled={state.busy} onClick={() => runExample(e.id)}>
              {e.label}
            </button>
          ))}
        </div>
        <div className="it-row">
          <button className="it-btn it-btn--primary" type="submit" aria-busy={state.busy} disabled={state.busy || !text.trim()}>
            {state.busy ? "Разбираю" : "Разобрать"}
          </button>
        </div>
      </form>

      {state.runId > 0 && (
        <section className="app-stack" aria-label="Разбор">
          <StagePipeline stages={state.stages} />
          {state.result && <Readings result={state.result} />}
          {state.result && <RouteChips result={state.result} />}
          {state.reason && <Notice reason={state.reason} jev={state.result?.jev} onExample={runExample} />}
          {state.retry && <RetryNotice what={state.retry} onRetry={retry} />}
          {state.access && <AccessGate variant={state.access} inline />}
          {state.draft && <DraftReply draft={state.draft} />}
        </section>
      )}

      <History items={history} />
    </div>
  );
}
