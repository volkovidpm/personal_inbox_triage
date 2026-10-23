import { render, screen } from "@testing-library/react";
import { Notice } from "./Notice";
import type { JevReading } from "../lib/types";

const jev: JevReading = { pRequest: 0.06, category: "off_topic", pCategory: 0.9, pInjection: 0.02, ms: 284, source: "live" };

describe("Notice", () => {
  it("не по теме — с вероятностью Jev", () => {
    render(<Notice reason="off_topic" jev={jev} onExample={() => {}} />);
    expect(
      screen.getByText(
        "Это не похоже на обращение к компании: Jev оценил вероятность в 6%. Я разбираю отзывы покупателей, заявки оптовиков, предложения блогеров, отклики кандидатов и внутренние согласования."
      )
    ).toBeTruthy();
    expect(screen.getByText("Jev · обращение 6% · 284 мс")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Отзыв с WB" })).toBeTruthy();
  });

  it("неясно, куда — лучшая догадка с процентом", () => {
    render(<Notice reason="manual" jev={{ ...jev, pRequest: 0.6, category: "blogger", pCategory: 0.48 }} onExample={() => {}} />);
    expect(
      screen.getByText("Не уверен, к какому отделу это относится: лучшая догадка — «Блогеры», 48%. В рабочей системе обращение ушло бы на ручной разбор.")
    ).toBeTruthy();
  });

  it("тексты остальных отбивок — по спеке", () => {
    const cases: Array<[Parameters<typeof Notice>[0]["reason"], string]> = [
      ["too_short", "Слишком мало текста, чтобы понять запрос. Опишите ситуацию в одном-двух предложениях или выберите пример."],
      ["spam", "Похоже на рекламную рассылку. В рабочей системе такие письма уходят в «Спам» без ответа."],
      ["injection", "Текст похож на попытку изменить инструкции системы. Запрос остановлен на проверке, генеративная модель не запускалась."],
      ["rate_limited", "Слишком много запросов подряд. Подождите минуту."],
      ["daily_limit", "На сегодня живые разборы закончились, посмотрите записанные примеры."],
      ["ai_unavailable", "Нейросети временно недоступны, посмотрите записанные примеры."],
    ];
    for (const [reason, text] of cases) {
      const { unmount } = render(<Notice reason={reason} onExample={() => {}} />);
      expect(screen.getByText(text)).toBeTruthy();
      unmount();
    }
  });
});
