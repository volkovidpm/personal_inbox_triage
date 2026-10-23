import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const classify = vi.fn();
const draft = vi.fn();
vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, classify: (...a: unknown[]) => classify(...a), draft: (...a: unknown[]) => draft(...a) };
});

import { Triage } from "./Triage";

const jev = { pRequest: 0.94, category: "review", pCategory: 0.91, pInjection: 0.03, score: 4, pCounterfeit: 0.85, ms: 312, source: "live" };

beforeEach(() => {
  classify.mockReset();
  draft.mockReset();
});

describe("Triage", () => {
  it("кнопка-пример подставляет текст и запускает разбор с exampleId", async () => {
    classify.mockResolvedValueOnce({ id: "r1", outcome: "routed", rulesMs: 1, jev, department: "service", flags: ["legal"], used: 1, limit: 50 });
    draft.mockResolvedValueOnce({ id: "r1", text: "Пришлите фото банки.", ms: 1800, model: "claude-haiku-5-5", source: "live" });
    render(<Triage mine={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Отзыв с WB" }));
    expect((screen.getByLabelText("Текст обращения") as HTMLTextAreaElement).value).toMatch(/^Порошок не растворяется/);
    expect(classify.mock.calls[0][1]).toBe("review");
    expect(await screen.findByText("Пришлите фото банки.")).toBeTruthy();
    expect(draft).toHaveBeenCalledWith("r1");
    expect(screen.getByText("Клиентский сервис", { selector: ".it-stage__meta" })).toBeTruthy();
    expect(screen.getByText("Юристы")).toBeTruthy();
  });

  it("пока идёт разбор, кнопка занята и повторный клик ничего не шлёт", async () => {
    let resolve: (v: unknown) => void = () => {};
    classify.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    render(<Triage mine={[]} />);
    fireEvent.change(screen.getByLabelText("Текст обращения"), { target: { value: "Подскажите, чем отстирать вино со скатерти" } });
    const button = screen.getByRole("button", { name: "Разобрать" });
    fireEvent.click(button);
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);
    expect(classify).toHaveBeenCalledTimes(1);
    resolve({ id: "r2", outcome: "rejected", reason: "off_topic", rulesMs: 1, jev: { ...jev, pRequest: 0.06 }, flags: [], used: 1, limit: 50 });
    expect(await screen.findByText(/Jev оценил вероятность в 6%/)).toBeTruthy();
    expect(draft).not.toHaveBeenCalled();
  });

  it("показывает счётчик символов и приписку о приватности", () => {
    render(<Triage mine={[]} />);
    fireEvent.change(screen.getByLabelText("Текст обращения"), { target: { value: "абв" } });
    expect(screen.getByText("3 / 3000")).toBeTruthy();
    expect(screen.getByText("Ваши обращения видны только на этом устройстве и автору демо")).toBeTruthy();
  });

  it("показывает прошлые обращения этого устройства", () => {
    render(
      <Triage
        mine={[
          {
            text: "Старое обращение про опт",
            createdAt: "2026-10-23T10:00:00.000Z",
            result: { id: "r0", outcome: "routed", rulesMs: 1, jev: { ...jev, category: "wholesale" }, department: "wholesale", flags: [], used: 1, limit: 50 } as never,
            draft: null,
          },
        ]}
      />
    );
    expect(screen.getByText("Старое обращение про опт")).toBeTruthy();
    expect(screen.getByText("Отдел опта")).toBeTruthy();
  });

  it("ждёт выбора, пока поле пустое", async () => {
    render(<Triage mine={[]} />);
    const button = screen.getByRole("button", { name: "Разобрать" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await waitFor(() => expect(classify).not.toHaveBeenCalled());
  });
});
