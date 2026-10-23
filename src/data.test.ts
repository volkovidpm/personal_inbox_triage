import seedJson from "../data/seed.json";
import examplesJson from "../data/examples.json";
import calibrationJson from "../data/calibration.json";
import type { Category, ClassifyResult, DraftResult, FeedItem, RejectReason } from "./lib/types";

const seed = seedJson as FeedItem[];
const examples = examplesJson as Array<{ id: string; label: string; text: string; recorded: { result: ClassifyResult; draft: DraftResult } }>;
const calibration = calibrationJson as Array<{
  text: string;
  expect: { outcome: ClassifyResult["outcome"]; reason?: RejectReason; category?: Category; legal?: boolean };
}>;

// Два обращения в «Ручном разборе» сверх 43 разобранных: их тип не считается.
const count = (type: FeedItem["type"]) => seed.filter((i) => i.type === type && i.department !== "manual").length;
const DRAFT_BANNED = /уважаем|ценим ваше|!/i;

describe("seed.json", () => {
  it("45 обращений нужного состава", () => {
    expect(seed).toHaveLength(45);
    expect(count("review")).toBe(12);
    expect(count("wholesale")).toBe(8);
    expect(count("blogger")).toBe(7);
    expect(count("candidate")).toBe(8);
    expect(count("approval")).toBe(6);
    expect(count("spam")).toBe(2);
    expect(seed.filter((i) => i.department === "manual")).toHaveLength(2);
    expect(seed.filter((i) => i.type === "review" && i.flags.includes("legal"))).toHaveLength(2);
    expect(new Set(seed.map((i) => i.id)).size).toBe(45);
  });

  it("за последние 14 дней, из них 15–25 — за сутки", () => {
    expect(Math.max(...seed.map((i) => i.offsetMinutes))).toBeLessThanOrEqual(14 * 24 * 60);
    const lastDay = seed.filter((i) => i.offsetMinutes <= 24 * 60).length;
    expect(lastDay).toBeGreaterThanOrEqual(15);
    expect(lastDay).toBeLessThanOrEqual(25);
  });

  it("телефоны только вида +7 900 000-00-NN", () => {
    const phones = seed.flatMap((i) => i.text.match(/\+7[\d\s-]{10,}/g) ?? []);
    expect(phones.every((p) => /^\+7 900 000-00-\d\d$/.test(p.trim()))).toBe(true);
  });

  it("решения Jev записаны заранее и в допустимых границах", () => {
    for (const i of seed) {
      expect(i.jev.source).toBe("recorded");
      for (const p of [i.jev.pRequest, i.jev.pCategory, i.jev.pInjection]) expect(p).toBeGreaterThanOrEqual(0);
      if (i.jev.score !== undefined) expect([1, 2, 3, 4, 5]).toContain(i.jev.score);
    }
  });

  it("черновики без штампов, кандидатам — никогда не отказ", () => {
    for (const i of seed.filter((x) => x.draft)) expect(i.draft).not.toMatch(DRAFT_BANNED);
    const candidates = seed.filter((i) => i.type === "candidate");
    expect(candidates.every((i) => !/отказ|не подходите|к сожалению/i.test(i.draft ?? ""))).toBe(true);
  });

  it("у спама и ручного разбора нет черновика", () => {
    for (const i of seed.filter((x) => x.department === "spam" || x.department === "manual")) expect(i.draft).toBeNull();
  });
});

describe("examples.json", () => {
  it("пять примеров с подписями кнопок и записанными ответами", () => {
    expect(examples.map((e) => e.id)).toEqual(["review", "wholesale", "blogger", "candidate", "approval"]);
    expect(examples.map((e) => e.label)).toEqual(["Отзыв с WB", "Заявка оптовика", "Блогер", "Отклик кандидата", "Согласование"]);
    for (const e of examples) {
      expect(e.recorded.result.outcome).toBe("routed");
      expect(e.recorded.result.jev?.category).toBe(e.id);
      expect(e.recorded.result.jev?.source).toBe("recorded");
      expect(e.recorded.draft.source).toBe("recorded");
      expect(e.recorded.draft.text).not.toMatch(DRAFT_BANNED);
    }
  });
});

describe("calibration.json", () => {
  it("50 фраз: по 6 на тип и 20 краевых", () => {
    expect(calibration).toHaveLength(50);
    for (const t of ["review", "wholesale", "blogger", "candidate", "approval"] as const) {
      expect(calibration.filter((c) => c.expect.category === t && c.expect.outcome === "routed")).toHaveLength(6);
    }
    const reason = (r: RejectReason) => calibration.filter((c) => c.expect.reason === r).length;
    expect(reason("too_short")).toBeGreaterThanOrEqual(3);
    expect(reason("symbols")).toBeGreaterThanOrEqual(1);
    expect(reason("too_long")).toBeGreaterThanOrEqual(1);
    expect(reason("spam")).toBeGreaterThanOrEqual(3);
    expect(reason("off_topic")).toBeGreaterThanOrEqual(4);
    expect(reason("injection")).toBeGreaterThanOrEqual(4);
    expect(calibration.filter((c) => c.expect.outcome === "manual").length).toBeGreaterThanOrEqual(3);
    expect(calibration.some((c) => c.expect.legal)).toBe(true);
  });
});
