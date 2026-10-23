const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function offsetToDate(offsetMinutes: number, now: Date): Date {
  return new Date(now.getTime() - offsetMinutes * 60_000);
}

function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const pad = (n: number) => String(n).padStart(2, "0");

/** «сегодня, 14:32», «вчера, 09:05», «21 окт, 18:40» — в часовом поясе посетителя. */
export function formatRequestTime(at: Date, now: Date): string {
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
  const days = Math.round((dayStart(now) - dayStart(at)) / 86_400_000);
  if (days === 0) return `сегодня, ${time}`;
  if (days === 1) return `вчера, ${time}`;
  return `${at.getDate()} ${MONTHS[at.getMonth()]}, ${time}`;
}
