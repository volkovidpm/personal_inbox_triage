import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const getFeed = vi.fn();
vi.mock("./lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/api")>();
  return { ...actual, getFeed: () => getFeed() };
});

import { App } from "./App";
import { ApiError } from "./lib/api";

beforeEach(() => getFeed.mockReset());

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
});
