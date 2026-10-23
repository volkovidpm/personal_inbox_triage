# Архитектура

## Вебхуки

Базовый адрес: `https://volkovid.app.n8n.cloud/webhook/inbox`. Все запросы — `POST`, тело `application/x-www-form-urlencoded`. В каждом запросе есть поля:

| Поле | Что это |
|---|---|
| `invite` | код приглашения, 16 символов `[A-Za-z0-9]` |
| `device` | UUID устройства из `localStorage` |

Ошибки доступа: статус `401` или `403` и тело `{ "error": "<вид>" }`, где вид — `no_invite`, `unknown_invite`, `inactive`, `expired`, `limit_reached`.

### `POST /feed`

Дополнительных полей нет. Отмечает открытие (первое открытие и новое устройство — уведомление в Telegram).

Ответ `200`:

```ts
{
  invite: { label: string; expiresAt: string; limit: number; used: number };
  requests: FeedItem[];        // 45 выдуманных обращений, время — offsetMinutes от «сейчас»
  mine: Array<{ text: string; createdAt: string; result: ClassifyResult; draft: DraftResult | null }>;
}
```

### `POST /classify`

Поля: `text`, необязательный `exampleId` (`review` | `wholesale` | `blogger` | `candidate` | `approval`).

Ответ `200` — `ClassifyResult`:

```ts
{
  id: string;
  outcome: "routed" | "manual" | "rejected";
  reason?: "too_short" | "too_long" | "symbols" | "off_topic" | "spam" | "injection" | "daily_limit" | "ai_unavailable";
  rulesMs: number;
  jev?: {
    pRequest: number; category: Category; pCategory: number; pInjection: number;
    score?: number;            // 1–5: раздражение, качество лида, аудитория, совпадение, риск
    pCounterfeit?: number;     // только отзывы
    pEnoughData?: number;      // только согласования
    ms: number; source: "live" | "recorded";
  };
  department?: "service" | "wholesale" | "marketing" | "hr" | "approvals" | "manual" | "spam";
  flags: Array<"legal">;
  used: number; limit: number;
}
```

`429 { "error": "rate_limited" }` — больше 5 разборов в минуту по одному приглашению.

Порядок внутри: доступ → бронь строки → лимит в минуту → правила → дневной лимит (150 живых) → Jev → пороги → учёт разбора → запись → ответ.

Бронь — строка `outcome = pending` в `inbox_visitor_requests`, которая пишется до подсчёта лимитов. Параллельные запросы видят брони друг друга, поэтому лимиты в минуту и в сутки не обходятся пачкой одновременных запросов; в конце бронь дописывается результатом. Счётчик `used` перечитывается из таблицы прямо перед увеличением.

### `POST /draft`

Поле: `id` — идентификатор разбора. Текст и категорию n8n берёт из таблицы, а не из запроса. Лимит разборов здесь не проверяется: разбор уже посчитан на `/classify`, и последний разрешённый разбор тоже получает черновик.

Ответ `200` — `DraftResult`: `{ id, text, ms, model, source: "live" | "recorded" }`. Повторный запрос отдаёт сохранённый черновик.

Ошибки: `404 not_found` (чужой или несуществующий разбор), `409 no_draft` (разбор не ушёл в отдел), `503 ai_unavailable` (модель недоступна и записи нет).

## Таблицы n8n

| Таблица | Колонки |
|---|---|
| `inbox_invites` | `code`, `label`, `expires_at`, `limit_count`, `used`, `first_open_at`, `last_open_at`, `active`, `limit_notified` |
| `inbox_devices` | `device_id`, `invite_code`, `first_open_at`, `last_open_at`, `user_agent` |
| `inbox_seed_requests` | `seed_id`, `offset_minutes`, `item_json` |
| `inbox_visitor_requests` | `request_id`, `invite_code`, `device_id`, `text`, `live`, `outcome`, `category`, `department`, `result_json`, `draft_json`, `created_at` |
| `inbox_examples` | `example_id`, `text`, `result_json`, `draft_json` |

## Workflow

| Workflow | Что делает |
|---|---|
| Inbox · Проверка доступа | подпроцесс: код приглашения, устройства, отметки открытий, уведомления |
| Inbox · Уведомление | подпроцесс: сообщение автору в Telegram; ошибка Telegram не роняет вызывающий процесс |
| Inbox · Лента | `POST /feed` |
| Inbox · Разбор | `POST /classify` |
| Inbox · Черновик | `POST /draft` |
| Inbox · Выдать доступ | форма с Basic Auth: кому, срок, лимит → ссылка с кодом |
| Inbox · Очистка | каждую ночь удаляет обращения посетителей старше 30 дней |
