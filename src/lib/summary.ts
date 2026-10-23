import type { FeedItem } from "./types";

const DAY_MINUTES = 24 * 60;

/** Горит: новое обращение, которое ждёт ответа больше суток, или злой отзыв (раздражение 4–5). */
export function isHot(item: FeedItem, _now: Date): boolean {
  if (item.status !== "new") return false;
  if (item.offsetMinutes > DAY_MINUTES) return true;
  return item.type === "review" && (item.jev.score ?? 0) >= 4;
}

/** Сводка над лентой: обращения за сутки и открытые очереди, которые требуют внимания. */
export function daySummary(items: FeedItem[], now: Date) {
  const open = items.filter((i) => i.status !== "done");
  return {
    total: items.filter((i) => i.offsetMinutes <= DAY_MINUTES).length,
    counterfeit: open.filter((i) => i.flags.includes("legal")).length,
    hot: items.filter((i) => isHot(i, now)).length,
    manual: open.filter((i) => i.department === "manual").length,
  };
}
