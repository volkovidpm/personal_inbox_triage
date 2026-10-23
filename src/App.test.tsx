import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const getFeed = vi.fn();
const classify = vi.fn();
const draft = vi.fn();
vi.mock("./lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/api")>();
  return {
    ...actual,
    getFeed: () => getFeed(),
    classify: (...a: unknown[]) => classify(...a),
    draft: (...a: unknown[]) => draft(...a),
  };
});

import { App } from "./App";
import { ApiError } from "./lib/api";

beforeEach(() => {
  getFeed.mockReset();
  classify.mockReset();
  draft.mockReset();
});

const jev = { pRequest: 0.94, category: "review", pCategory: 0.91, pInjection: 0.03, score: 4, ms: 312, source: "live" };

describe("App", () => {
  it("без приглашения показывает экран доступа с Telegram и плашку демо", async () => {
    getFeed.mockRejectedValueOnce(new ApiError("no_invite"));
    render(<App />);
    expect(await screen.findByText("Демо доступно по приглашению")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Написать в Telegram" });
    expect(link.getAttribute("href")).toBe("https://t.me/volkovid");
    expect(screen.getByText("@volkovid")).toBeTruthy();
    expect(screen.getByText("Демо подготовлено для BRANDFREE. Компания, обращения и люди выдуманы.")).toBeTruthy();
  });

  it("истёкший срок и исчерпанный лимит — один экран", async () => {
    for (const kind of ["expired", "limit_reached"] as const) {
      getFeed.mockRejectedValueOnce(new ApiError(kind));
      const { unmount } = render(<App />);
      expect(await screen.findByText("Срок доступа закончился — напишите Игорю, продлю")).toBeTruthy();
      unmount();
    }
  });

  it("при сбое сети предлагает повторить", async () => {
    getFeed.mockRejectedValueOnce(new ApiError("network")).mockResolvedValueOnce({
      invite: { label: "Тест", expiresAt: "2026-11-06T00:00:00.000Z", limit: 50, used: 0 },
      requests: [],
      mine: [],
    });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Повторить" }));
    await waitFor(() => expect(getFeed).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("tab", { name: "Лента" })).toBeTruthy();
  });

  it("после загрузки показывает вкладки", async () => {
    getFeed.mockResolvedValue({ invite: { label: "Тест", expiresAt: "", limit: 50, used: 3 }, requests: [], mine: [] });
    render(<App />);
    expect(await screen.findByRole("tab", { name: "Лента" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Мой разбор" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Как устроено" })).toBeTruthy();
  });

  it("разбор, черновик и счётчик переживают смену вкладки", async () => {
    getFeed.mockResolvedValue({ invite: { label: "Тест", expiresAt: "", limit: 50, used: 3 }, requests: [], mine: [] });
    classify.mockResolvedValueOnce({ id: "r1", outcome: "routed", rulesMs: 1, jev, department: "service", flags: [], used: 4, limit: 50 });
    draft.mockResolvedValueOnce({ id: "r1", text: "Пришлите фото банки.", ms: 1800, model: "claude-haiku-5-5", source: "live" });
    render(<App />);
    fireEvent.click(await screen.findByRole("tab", { name: "Мой разбор" }));
    fireEvent.click(screen.getByRole("button", { name: "Отзыв с WB" }));
    expect(await screen.findByText("Пришлите фото банки.")).toBeTruthy();
    expect(screen.getByText(/разборов 4 из 50/)).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Лента" }));
    fireEvent.click(screen.getByRole("tab", { name: "Мой разбор" }));
    expect(screen.getByText("Пришлите фото банки.")).toBeTruthy();
    expect(screen.getByText(/разборов 4 из 50/)).toBeTruthy();
  });
});
