import { fireEvent, render, screen } from "@testing-library/react";
import seed from "../../data/seed.json";
import { Feed } from "./Feed";
import type { FeedItem } from "../lib/types";

const items = seed as FeedItem[];
const now = new Date(2026, 9, 23, 14, 40);

describe("Feed", () => {
  it("показывает все 45 карточек и сводку", () => {
    const { container } = render(<Feed items={items} now={now} />);
    expect(container.querySelectorAll(".it-card")).toHaveLength(45);
    expect(screen.getByText("обращений за сутки")).toBeTruthy();
    expect(screen.getByText("похоже на подделку")).toBeTruthy();
  });

  it("фильтрует по отделу", () => {
    const { container } = render(<Feed items={items} now={now} />);
    fireEvent.click(screen.getByRole("button", { name: "HR" }));
    expect(container.querySelectorAll(".it-card")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "HR" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Все отделы" }));
    expect(container.querySelectorAll(".it-card")).toHaveLength(45);
  });

  it("новые обращения сверху", () => {
    const { container } = render(<Feed items={items} now={now} />);
    const authors = [...container.querySelectorAll(".it-card__author")].map((n) => n.textContent);
    expect(authors[0]).toBe("Ольга Секретарёва");
  });
});
