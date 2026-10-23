import { fireEvent, render, screen } from "@testing-library/react";
import { RequestCard } from "./RequestCard";
import type { FeedItem } from "../lib/types";

const now = new Date(2026, 9, 23, 14, 40);

function item(over: Partial<FeedItem> = {}): FeedItem {
  return {
    id: "s01",
    type: "review",
    channel: "wb",
    author: "Ольга Секретарёва",
    text: "Порошок не растворяется",
    offsetMinutes: 8,
    status: "new",
    department: "service",
    flags: [],
    jev: { pRequest: 0.97, category: "review", pCategory: 0.93, pInjection: 0.05, score: 2, ms: 282, source: "recorded" },
    draft: "Ольга, пришлите фото банки.",
    ...over,
  };
}

describe("RequestCard", () => {
  it("показывает канал, автора, время, отдел, статус и решение Jev", () => {
    render(<RequestCard item={item()} now={now} />);
    expect(screen.getByText("WB")).toBeTruthy();
    expect(screen.getByText("Ольга Секретарёва")).toBeTruthy();
    expect(screen.getByText("сегодня, 14:32")).toBeTruthy();
    expect(screen.getByText("Клиентский сервис")).toBeTruthy();
    expect(screen.getByText("Новое")).toBeTruthy();
    expect(screen.getByText("Отзыв · 93%")).toBeTruthy();
  });

  it("выводит HTML из текста обращения как текст", () => {
    const { container } = render(<RequestCard item={item({ text: '<img src=x onerror="alert(1)">' })} now={now} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeTruthy();
  });

  it("ставит метки «Юристы» и «Горит», подсвечивает горящую карточку", () => {
    const { container } = render(
      <RequestCard item={item({ flags: ["legal"], jev: { ...item().jev, score: 4, pCounterfeit: 0.86 } })} now={now} />
    );
    expect(screen.getByText("Юристы")).toBeTruthy();
    expect(screen.getByText("Горит")).toBeTruthy();
    expect(container.querySelector(".it-card--hot")).not.toBeNull();
    expect(screen.getByText("Отзыв · 93% · подделка 86%")).toBeTruthy();
  });

  it("прячет черновик до клика", () => {
    render(<RequestCard item={item()} now={now} />);
    expect(screen.queryByText("Ольга, пришлите фото банки.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Показать черновик" }));
    expect(screen.getByText("Ольга, пришлите фото банки.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Скрыть черновик" })).toBeTruthy();
  });

  it("без черновика кнопки нет", () => {
    render(<RequestCard item={item({ draft: null, department: "spam", type: "spam" })} now={now} />);
    expect(screen.queryByRole("button", { name: "Показать черновик" })).toBeNull();
    expect(screen.getByText("Спам")).toBeTruthy();
  });
});
