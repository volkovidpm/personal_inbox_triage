import { daySummary } from "../lib/summary";
import type { FeedItem } from "../lib/types";

export function DaySummary({ items, now }: { items: FeedItem[]; now: Date }) {
  const s = daySummary(items, now);
  return (
    <div className="it-summary">
      <div className="it-stat">
        <span className="it-stat__value">{s.total}</span>
        <span className="it-stat__label">обращений за сутки</span>
      </div>
      <div className="it-stat it-stat--alert">
        <span className="it-stat__value">{s.counterfeit}</span>
        <span className="it-stat__label">похоже на подделку</span>
      </div>
      <div className="it-stat it-stat--alert">
        <span className="it-stat__value">{s.hot}</span>
        <span className="it-stat__label">горит: ждут ответа</span>
      </div>
      <div className="it-stat it-stat--attention">
        <span className="it-stat__value">{s.manual}</span>
        <span className="it-stat__label">в ручном разборе</span>
      </div>
    </div>
  );
}
