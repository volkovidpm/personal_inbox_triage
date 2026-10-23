import { CHANNEL_LABEL, DEPARTMENT_LABEL, formatDuration, formatPercent } from "./format";

describe("formatPercent", () => {
  it("переводит вероятность в целые проценты без пробела", () => {
    expect(formatPercent(0.94)).toBe("94%");
    expect(formatPercent(0.055)).toBe("6%");
    expect(formatPercent(1)).toBe("100%");
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("formatDuration", () => {
  it("до секунды пишет миллисекунды, дальше секунды с запятой", () => {
    expect(formatDuration(312)).toBe("312 мс");
    expect(formatDuration(999)).toBe("999 мс");
    expect(formatDuration(3800)).toBe("3,8 с");
    expect(formatDuration(1000)).toBe("1 с");
  });
});

describe("подписи", () => {
  it("называет отделы по-русски", () => {
    expect(DEPARTMENT_LABEL).toEqual({
      service: "Клиентский сервис",
      wholesale: "Отдел опта",
      marketing: "Маркетинг",
      hr: "HR",
      approvals: "Согласования",
      manual: "Ручной разбор",
      spam: "Спам",
    });
  });

  it("называет каналы коротко", () => {
    expect(CHANNEL_LABEL.wb).toBe("WB");
    expect(CHANNEL_LABEL.email).toBe("Почта");
    expect(CHANNEL_LABEL.internal).toBe("Внутренний чат");
  });
});
