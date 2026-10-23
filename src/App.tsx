import { useCallback, useEffect, useState } from "react";
import { AccessGate } from "./components/AccessGate";
import { DemoBanner } from "./components/DemoBanner";
import { ErrorState } from "./components/ErrorState";
import { Feed } from "./components/Feed";
import { Tabs } from "./components/Tabs";
import { ApiError, configureApi, getFeed, type ApiErrorKind } from "./lib/api";
import { getDeviceId, loadInvite } from "./lib/invite";
import type { FeedResponse } from "./lib/types";

type Tab = "feed" | "mine" | "how";
const TABS: { id: Tab; label: string }[] = [
  { id: "feed", label: "Лента" },
  { id: "mine", label: "Мой разбор" },
  { id: "how", label: "Как устроено" },
];

type Load = { state: "loading" } | { state: "error"; kind: ApiErrorKind } | { state: "ready"; feed: FeedResponse };

const INVITE_GATE: ApiErrorKind[] = ["no_invite", "unknown_invite", "inactive"];
const EXPIRED_GATE: ApiErrorKind[] = ["expired", "limit_reached"];

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let configured = false;
function configureOnce() {
  if (configured) return;
  configured = true;
  const storage = safeStorage();
  configureApi({ invite: loadInvite(window.location, window.history, storage), device: getDeviceId(storage) });
}

export function App() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [tab, setTab] = useState<Tab>("feed");
  const [now, setNow] = useState(() => new Date());

  const fetchFeed = useCallback(() => {
    setLoad({ state: "loading" });
    getFeed()
      .then((feed) => {
        setNow(new Date());
        setLoad({ state: "ready", feed });
      })
      .catch((e: unknown) => setLoad({ state: "error", kind: e instanceof ApiError ? e.kind : "bad_response" }));
  }, []);

  useEffect(() => {
    configureOnce();
    fetchFeed();
  }, [fetchFeed]);

  let body;
  if (load.state === "error" && INVITE_GATE.includes(load.kind)) body = <AccessGate variant="invite" />;
  else if (load.state === "error" && EXPIRED_GATE.includes(load.kind)) body = <AccessGate variant="expired" />;
  else if (load.state === "error") body = <ErrorState onRetry={fetchFeed} />;
  else if (load.state === "loading") body = <p className="t-small app-muted">Загружаю ленту…</p>;
  else {
    const { feed } = load;
    body = (
      <>
        <header className="app-header">
          <h1 className="t-display app-title">Разбор входящих</h1>
          <p className="app-lead">
            Входящие выдуманной компании «Кислородик»: отзывы с маркетплейсов, опт, блогеры, кандидаты и согласования. Jev решает, куда
            отправить обращение, Claude пишет черновик ответа.
          </p>
          <p className="t-meta app-muted">
            Приглашение: {feed.invite.label} · разборов {feed.invite.used} из {feed.invite.limit}
          </p>
        </header>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        <div role="tabpanel">
          {tab === "feed" && <Feed items={feed.requests} now={now} />}
          {tab === "mine" && <p className="t-small app-muted">Скоро здесь появится разбор своего запроса.</p>}
          {tab === "how" && <p className="t-small app-muted">Скоро здесь появится схема работы.</p>}
        </div>
      </>
    );
  }

  return (
    <div className="it-root app-page">
      <DemoBanner />
      <main className="app">{body}</main>
    </div>
  );
}
