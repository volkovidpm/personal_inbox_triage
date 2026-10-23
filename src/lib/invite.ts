const INVITE_KEY = "inbox:invite";
const DEVICE_KEY = "inbox:device";
const INVITE_RE = /^[A-Za-z0-9]{16}$/;

// Хранилище браузера может бросать исключение (приватное окно, заблокированные данные
// сайта). Тогда приглашение и устройство живут в памяти до перезагрузки страницы.
function read(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(storage: Storage | null, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    /* остаётся в памяти */
  }
}

/** Код приглашения из `?invite=` (сохраняется и убирается из адреса) или ранее сохранённый. */
export function loadInvite(location: Location, history: History, storage: Storage | null): string | null {
  const params = new URLSearchParams(location.search);
  const fromUrl = params.get("invite");
  if (fromUrl !== null) {
    params.delete("invite");
    const rest = params.toString();
    history.replaceState(null, "", `${location.pathname}${rest ? `?${rest}` : ""}${location.hash}`);
    if (!INVITE_RE.test(fromUrl)) return null;
    write(storage, INVITE_KEY, fromUrl);
    return fromUrl;
  }
  const saved = read(storage, INVITE_KEY);
  return saved && INVITE_RE.test(saved) ? saved : null;
}

let deviceCache: string | null = null;

export function getDeviceId(storage: Storage | null): string {
  if (deviceCache) return deviceCache;
  const saved = read(storage, DEVICE_KEY);
  deviceCache = saved ?? crypto.randomUUID();
  if (!saved) write(storage, DEVICE_KEY, deviceCache);
  return deviceCache;
}

export function resetDeviceCacheForTests() {
  deviceCache = null;
}
