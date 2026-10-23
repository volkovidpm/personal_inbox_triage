import { ApiError, classify, configureApi, draft, getFeed } from "./api";
import { API_BASE } from "../config";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  configureApi({ invite: "k7Qm2xP9vR4tAb1Z", device: "11111111-2222-4333-8444-555555555555" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function kindOf(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return e instanceof ApiError ? e.kind : "not-api-error";
  }
  return "resolved";
}

describe("classify", () => {
  it("шлёт простой POST-формой: код, устройство и текст, без своих заголовков", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "r1", outcome: "routed", rulesMs: 1, flags: [], used: 1, limit: 50 }));
    const result = await classify("текст");
    expect(result.id).toBe("r1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/classify`);
    expect(init.method).toBe("POST");
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect(Object.fromEntries(init.body)).toEqual({
      invite: "k7Qm2xP9vR4tAb1Z",
      device: "11111111-2222-4333-8444-555555555555",
      text: "текст",
    });
  });

  it("передаёт exampleId для кнопок-примеров", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "r1", outcome: "routed", rulesMs: 1, flags: [], used: 1, limit: 50 }));
    await classify("текст", "review");
    expect(Object.fromEntries(fetchMock.mock.calls[0][1].body).exampleId).toBe("review");
  });

  it("переводит ответы сервера об отказе в доступе в виды ошибок", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { error: "unknown_invite" }));
    expect(await kindOf(classify("т"))).toBe("unknown_invite");
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { error: "expired" }));
    expect(await kindOf(classify("т"))).toBe("expired");
    fetchMock.mockResolvedValueOnce(jsonResponse(429, { error: "rate_limited" }));
    expect(await kindOf(classify("т"))).toBe("rate_limited");
  });

  it("знает отказы черновика", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { error: "no_draft" }));
    expect(await kindOf(draft("r1"))).toBe("no_draft");
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: "not_found" }));
    expect(await kindOf(draft("r1"))).toBe("not_found");
    fetchMock.mockResolvedValueOnce(jsonResponse(503, { error: "ai_unavailable" }));
    expect(await kindOf(draft("r1"))).toBe("ai_unavailable");
  });

  it("не-JSON ответ — bad_response, обрыв сети — network", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>Bad gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } }));
    expect(await kindOf(classify("т"))).toBe("bad_response");
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await kindOf(classify("т"))).toBe("network");
  });

  it("без ответа 15 секунд — timeout", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))))
    );
    const pending = kindOf(classify("т"));
    await vi.advanceTimersByTimeAsync(14_999);
    await vi.advanceTimersByTimeAsync(2);
    expect(await pending).toBe("timeout");
  });
});

describe("draft", () => {
  it("ждёт до 30 секунд", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((resolve, reject) => {
          const t = setTimeout(() => resolve(jsonResponse(200, { id: "r1", text: "Ответ", ms: 20000, model: "m", source: "live" })), 20_000);
          init.signal?.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new DOMException("aborted", "AbortError"));
          });
        })
    );
    const pending = draft("r1");
    await vi.advanceTimersByTimeAsync(20_000);
    expect((await pending).text).toBe("Ответ");
    expect(Object.fromEntries(fetchMock.mock.calls[0][1].body).id).toBe("r1");
  });
});

describe("getFeed", () => {
  it("шлёт POST-формой с кодом и устройством", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { invite: { label: "Тест", expiresAt: "", limit: 50, used: 0 }, requests: [], mine: [] }));
    const feed = await getFeed();
    expect(feed.invite.label).toBe("Тест");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/feed`);
    expect(init.method).toBe("POST");
    expect(Object.fromEntries(init.body)).toEqual({ invite: "k7Qm2xP9vR4tAb1Z", device: "11111111-2222-4333-8444-555555555555" });
  });

  it("ответ 200 с полем error — это отказ сервера", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { error: "expired" }));
    expect(await kindOf(getFeed())).toBe("expired");
  });

  it("без приглашения не ходит в сеть", async () => {
    configureApi({ invite: null, device: "d" });
    expect(await kindOf(getFeed())).toBe("no_invite");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
