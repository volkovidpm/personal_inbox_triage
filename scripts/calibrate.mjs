// Прогоняет data/calibration.json через живой /classify и печатает таблицу «ожидалось / получили».
// Запуск: node scripts/calibrate.mjs <код приглашения> [пауза, мс]
// Пауза по умолчанию 13 с — под лимит 5 разборов в минуту на приглашение.
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const API = "https://volkovid.app.n8n.cloud/webhook/inbox/classify";
// n8n отсекает запросы без браузерного User-Agent как ботов (ignoreBots).
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const [invite, pauseArg] = process.argv.slice(2);
if (!invite) {
  console.error("usage: node scripts/calibrate.mjs <invite> [pauseMs]");
  process.exit(2);
}
const pause = Number(pauseArg ?? 13_000);
const device = randomUUID();
const cases = JSON.parse(readFileSync(new URL("../data/calibration.json", import.meta.url), "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (p) => (p === undefined ? "—" : `${Math.round(p * 100)}%`);
const short = (t) => (t.length > 60 ? `${t.slice(0, 57)}…` : t).replaceAll("|", "/").replaceAll("\n", " ");

function matches(expect, got) {
  if (expect.outcome !== got.outcome) return false;
  if (expect.reason && expect.reason !== got.reason) return false;
  if (expect.category && got.jev?.category !== expect.category) return false;
  if (expect.legal && !got.flags?.includes("legal")) return false;
  return true;
}

const rows = [];
let ok = 0;
let injectionLeaks = 0;
for (const [i, c] of cases.entries()) {
  const body = new URLSearchParams({ invite, device, text: c.text });
  const res = await fetch(API, { method: "POST", body, headers: { "User-Agent": UA } });
  const got = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  const pass = !got.error && matches(c.expect, got);
  if (pass) ok += 1;
  if (c.expect.reason === "injection" && got.outcome && got.outcome !== "rejected") injectionLeaks += 1;
  const exp = [c.expect.outcome, c.expect.reason ?? c.expect.category ?? ""].filter(Boolean).join(" ");
  const gotS = got.error ? got.error : [got.outcome, got.reason ?? got.jev?.category ?? ""].filter(Boolean).join(" ");
  rows.push(
    `| ${i + 1} | ${pass ? "✓" : "✗"} | ${short(c.text)} | ${exp} | ${gotS} | ${pct(got.jev?.pRequest)} | ${got.jev?.category ?? "—"} ${pct(got.jev?.pCategory)} | ${pct(got.jev?.pInjection)} |`
  );
  console.error(`${i + 1}/${cases.length} ${pass ? "ok" : "MISS"} ${exp} → ${gotS}`);
  if (i < cases.length - 1) await sleep(pause);
}

console.log(`Верно: ${ok} из ${cases.length}. Инъекций дошло дальше проверки: ${injectionLeaks}.\n`);
console.log("| # | | Текст | Ожидалось | Получили | Обращение | Категория | Взлом |");
console.log("|---|---|---|---|---|---|---|---|");
console.log(rows.join("\n"));
