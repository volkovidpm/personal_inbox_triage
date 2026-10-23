import { useCallback, useEffect, useState } from "react";
import { AccessGate } from "./components/AccessGate";
import { DemoBanner } from "./components/DemoBanner";
import { ErrorState } from "./components/ErrorState";
import { HowItWorks } from "./components/HowItWorks";
import { Feed } from "./components/Feed";
import { Tabs } from "./components/Tabs";
import { Triage } from "./components/Triage";
import { ApiError, configureApi, gateFor, getFeed, type ApiErrorKind } from "./lib/api";
import { getDeviceId, loadInvite } from "./lib/invite";
import type { FeedResponse } from "./lib/types";

type Tab = "feed" | "mine" | "how";
const TABS: { id: Tab; label: string }[] = [
  { id: "feed", label: "Лента" },
  { id: "mine", label: "Мой разбор" },
  { id: "how", label: "Как устроено" },
];

type Load = { state: "loading" } | { state: "error"; kind: ApiErrorKind } | { state: "ready"; feed: FeedResponse };

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
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  const fetchFeed = useCallback(() => {
    setLoad({ state: "loading" });
    getFeed()
      .then((feed) => {
        setNow(new Date());
        setUsage(null);
        setLoad({ state: "ready", feed });
      })
      .catch((e: unknown) => setLoad({ state: "error", kind: e instanceof ApiError ? e.kind : "bad_response" }));
  }, []);

  useEffect(() => {
    configureOnce();
    fetchFeed();
  }, [fetchFeed]);

  let body;
  const gate = load.state === "error" ? gateFor(load.kind) : null;
  if (gate) body = <AccessGate variant={gate} />;
  else if (load.state === "error") body = <ErrorState onRetry={fetchFeed} />;
  else if (load.state === "loading") body = <p className="t-small app-muted">Загружаю ленту…</p>;
  else {
    const { feed } = load;
    const counter = usage ?? feed.invite;
    body = (
      <>
        <header className="app-header">
          <h1 className="t-display app-title">Разбор входящих</h1>
          <p className="app-lead">
            Входящие выдуманной компании «Кислородик»: отзывы с маркетплейсов, опт, блогеры, кандидаты и согласования. Jev решает, куда
            отправить обращение, Claude пишет черновик ответа.
          </p>
          <p className="t-meta app-muted">
            Приглашение: {feed.invite.label} · разборов {counter.used} из {counter.limit}
          </p>
        </header>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        {/* Панели не размонтируются: разбор, черновик и фильтры ленты переживают смену вкладки. */}
        <div role="tabpanel" hidden={tab !== "feed"}>
          <Feed items={feed.requests} now={now} />
        </div>
        <div role="tabpanel" hidden={tab !== "mine"}>
          <Triage mine={feed.mine} onUsage={setUsage} />
        </div>
        <div role="tabpanel" hidden={tab !== "how"}>
          <HowItWorks />
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
