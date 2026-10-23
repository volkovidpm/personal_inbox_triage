import { daySummary, isHot } from "./summary";
import type { FeedItem } from "./types";

const now = new Date(2026, 9, 23, 14, 40);

function item(over: Partial<FeedItem>): FeedItem {
  return {
    id: "x",
    type: "review",
    channel: "wb",
    author: "Тест",
    text: "Текст",
    offsetMinutes: 30,
    status: "new",
    department: "service",
    flags: [],
    jev: { pRequest: 0.9, category: "review", pCategory: 0.9, pInjection: 0.01, score: 2, ms: 300, source: "recorded" },
    draft: null,
    ...over,
  };
}

describe("isHot", () => {
  it("горит злой новый отзыв", () => {
    expect(isHot(item({ jev: { ...item({}).jev, score: 4 } }), now)).toBe(true);
  });

  it("не горит спокойный свежий отзыв", () => {
    expect(isHot(item({}), now)).toBe(false);
  });

  it("горит любое новое обращение старше суток", () => {
    expect(isHot(item({ type: "wholesale", offsetMinutes: 24 * 60 + 1 }), now)).toBe(true);
  });

  it("не горит отвеченное", () => {
    expect(isHot(item({ status: "done", jev: { ...item({}).jev, score: 5 } }), now)).toBe(false);
  });

  it("раздражение кандидата или оптовика не поджигает", () => {
    expect(isHot(item({ type: "candidate", jev: { ...item({}).jev, score: 5 } }), now)).toBe(false);
  });
});

describe("daySummary", () => {
  it("считает за сутки, подделки, горящие и ручной разбор", () => {
    const items = [
      item({ id: "1" }),
      item({ id: "2", flags: ["legal"], jev: { ...item({}).jev, score: 4 } }),
      item({ id: "3", department: "manual", type: "blogger" }),
      item({ id: "4", offsetMinutes: 3 * 24 * 60, status: "done" }),
    ];
    expect(daySummary(items, now)).toEqual({ total: 3, counterfeit: 1, hot: 1, manual: 1 });
  });
});
