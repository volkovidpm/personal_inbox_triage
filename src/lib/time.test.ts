import { formatRequestTime, offsetToDate } from "./time";

describe("formatRequestTime", () => {
  const now = new Date(2026, 9, 23, 14, 40);

  it("пишет «сегодня» для сегодняшних обращений", () => {
    expect(formatRequestTime(new Date(2026, 9, 23, 14, 32), now)).toBe("сегодня, 14:32");
  });

  it("пишет «вчера» с ведущим нулём в часах", () => {
    expect(formatRequestTime(new Date(2026, 9, 22, 9, 5), now)).toBe("вчера, 09:05");
  });

  it("для более ранних пишет день и короткий месяц без точки", () => {
    expect(formatRequestTime(new Date(2026, 9, 21, 18, 40), now)).toBe("21 окт, 18:40");
    expect(formatRequestTime(new Date(2026, 8, 30, 8, 0), now)).toBe("30 сен, 08:00");
  });

  it("сразу после полуночи обращение десять минут назад — вчерашнее", () => {
    const midnight = new Date(2026, 9, 23, 0, 5);
    expect(formatRequestTime(offsetToDate(10, midnight), midnight)).toBe("вчера, 23:55");
  });
});
