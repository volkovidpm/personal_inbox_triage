import { useState } from "react";
import { CHANNEL_LABEL, DEPARTMENT_LABEL, STATUS_LABEL, TYPE_LABEL, formatPercent } from "../lib/format";
import { isHot } from "../lib/summary";
import { formatRequestTime, offsetToDate } from "../lib/time";
import type { FeedItem } from "../lib/types";

export function RequestCard({ item, now }: { item: FeedItem; now: Date }) {
  const [open, setOpen] = useState(false);
  const hot = isHot(item, now);
  const legal = item.flags.includes("legal");
  let reading = `${TYPE_LABEL[item.jev.category]} · ${formatPercent(item.jev.pCategory)}`;
  if (legal && item.jev.pCounterfeit !== undefined) reading += ` · подделка ${formatPercent(item.jev.pCounterfeit)}`;

  return (
    <article className={hot ? "it-card it-card--hot" : "it-card"}>
      <header className="it-card__head">
        <span className="it-chip it-chip--channel">{CHANNEL_LABEL[item.channel]}</span>
        <span className="it-card__author">{item.author}</span>
        <time className="it-card__time">{formatRequestTime(offsetToDate(item.offsetMinutes, now), now)}</time>
      </header>
      <p className="it-card__text">{item.text}</p>
      {open && item.draft && (
        <div className="it-draft">
          <div className="it-draft__label">
            <span>Черновик ответа · Claude · запись</span>
          </div>
          <p className="it-draft__text">{item.draft}</p>
        </div>
      )}
      <footer className="it-card__foot">
        <span className="it-chip it-chip--dept">{DEPARTMENT_LABEL[item.department]}</span>
        <span className={`it-chip it-chip--${item.status}`}>
          <span className="it-chip__dot" />
          {STATUS_LABEL[item.status]}
        </span>
        {legal && <span className="it-chip it-chip--legal">Юристы</span>}
        {hot && <span className="it-chip it-chip--hot">Горит</span>}
        {item.draft && (
          <button className="it-btn it-btn--ghost app-card-toggle" type="button" onClick={() => setOpen(!open)}>
            {open ? "Скрыть черновик" : "Показать черновик"}
          </button>
        )}
        <span className="it-card__reading">{reading}</span>
      </footer>
    </article>
  );
}
