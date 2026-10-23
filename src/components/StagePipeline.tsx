import type { Stage, StageView } from "../triage/reducer";

const NAMES: Record<Stage, string> = { rules: "Правила", jev: "Jev: решение", route: "Маршрут", draft: "Черновик ответа" };
const ORDER: Stage[] = ["rules", "jev", "route", "draft"];

export function StagePipeline({ stages }: { stages: Record<Stage, StageView> }) {
  return (
    <ol className="it-stages" aria-label="Этапы разбора">
      {ORDER.map((s) => {
        const view = stages[s];
        const cls = ["it-stage", s === "jev" && "it-stage--jev", s === "draft" && "it-stage--draft", view.state !== "pending" && `is-${view.state}`]
          .filter(Boolean)
          .join(" ");
        return (
          <li key={s} className={cls}>
            <span className="it-stage__marker" />
            <span className="it-stage__name">{NAMES[s]}</span>
            <span className="it-stage__meta">{view.meta || "ждёт"}</span>
          </li>
        );
      })}
    </ol>
  );
}
