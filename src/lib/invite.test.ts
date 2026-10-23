import { getDeviceId, loadInvite, resetDeviceCacheForTests } from "./invite";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

const throwingStorage = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem() {
    throw new Error("SecurityError");
  },
} as unknown as Storage;

function fakeLocation(search: string): Location {
  return { search, pathname: "/personal_inbox_triage/", hash: "" } as Location;
}

function fakeHistory() {
  const calls: string[] = [];
  return { calls, history: { replaceState: (_s: unknown, _t: string, url: string) => calls.push(url) } as unknown as History };
}

describe("loadInvite", () => {
  it("берёт код из адреса, сохраняет и убирает его из адресной строки", () => {
    const storage = memoryStorage();
    const { calls, history } = fakeHistory();
    expect(loadInvite(fakeLocation("?invite=k7Qm2xP9vR4tAb1Z&x=1"), history, storage)).toBe("k7Qm2xP9vR4tAb1Z");
    expect(storage.getItem("inbox:invite")).toBe("k7Qm2xP9vR4tAb1Z");
    expect(calls).toEqual(["/personal_inbox_triage/?x=1"]);
  });

  it("без кода в адресе возвращает сохранённый", () => {
    const { history } = fakeHistory();
    expect(loadInvite(fakeLocation(""), history, memoryStorage({ "inbox:invite": "k7Qm2xP9vR4tAb1Z" }))).toBe("k7Qm2xP9vR4tAb1Z");
  });

  it("отбрасывает код не той формы", () => {
    const { history } = fakeHistory();
    expect(loadInvite(fakeLocation("?invite=bad!"), history, memoryStorage())).toBeNull();
  });

  it("работает, когда хранилище браузера бросает исключение", () => {
    const { history } = fakeHistory();
    expect(loadInvite(fakeLocation("?invite=k7Qm2xP9vR4tAb1Z"), history, throwingStorage)).toBe("k7Qm2xP9vR4tAb1Z");
    expect(loadInvite(fakeLocation(""), history, null)).toBeNull();
  });
});

describe("getDeviceId", () => {
  beforeEach(() => resetDeviceCacheForTests());

  it("создаёт UUID и сохраняет его", () => {
    const storage = memoryStorage();
    const id = getDeviceId(storage);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(storage.getItem("inbox:device")).toBe(id);
  });

  it("берёт сохранённый", () => {
    expect(getDeviceId(memoryStorage({ "inbox:device": "11111111-2222-4333-8444-555555555555" }))).toBe(
      "11111111-2222-4333-8444-555555555555"
    );
  });

  it("при недоступном хранилище держит один идентификатор на сессию", () => {
    const a = getDeviceId(throwingStorage);
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(getDeviceId(throwingStorage)).toBe(a);
  });

  it("без crypto.randomUUID (старый Safari) всё равно создаёт UUID v4", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (b: Uint8Array) => real.getRandomValues(b) });
    try {
      expect(getDeviceId(memoryStorage())).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
