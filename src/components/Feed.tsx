import { useState } from "react";
import { DEPARTMENT_LABEL } from "../lib/format";
import type { Department, FeedItem } from "../lib/types";
import { DaySummary } from "./DaySummary";
import { RequestCard } from "./RequestCard";

const ORDER: Department[] = ["service", "wholesale", "marketing", "hr", "approvals", "manual", "spam"];

export function Feed({ items, now }: { items: FeedItem[]; now: Date }) {
  const [dept, setDept] = useState<Department | "all">("all");
  const present = ORDER.filter((d) => items.some((i) => i.department === d));
  const shown = items.filter((i) => dept === "all" || i.department === dept).sort((a, b) => a.offsetMinutes - b.offsetMinutes);

  return (
    <div className="app-stack">
      <DaySummary items={items} now={now} />
      <div className="it-row" role="group" aria-label="Фильтр по отделу">
        <button className="it-chip" type="button" aria-pressed={dept === "all"} onClick={() => setDept("all")}>
          Все отделы
        </button>
        {present.map((d) => (
          <button key={d} className="it-chip" type="button" aria-pressed={dept === d} onClick={() => setDept(d)}>
            {DEPARTMENT_LABEL[d]}
          </button>
        ))}
      </div>
      <div className="app-feed">
        {shown.map((i) => (
          <RequestCard key={i.id} item={i} now={now} />
        ))}
      </div>
    </div>
  );
}
