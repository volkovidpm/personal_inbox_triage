import { REPO_URL } from "../config";

const STEPS: Array<{ name: string; text: string }> = [
  { name: "Проверка доступа", text: "n8n сверяет код приглашения с таблицей: есть ли, активен ли, не истёк ли срок и лимит. Новое открытие и новое устройство — уведомление автору в Telegram." },
  { name: "Правила и лимиты", text: "Без нейросетей: не больше 5 разборов в минуту и 150 живых в сутки, отбивка для слишком короткого, слишком длинного и текста без букв." },
  { name: "Jev: решение", text: "Один вызов, десять вопросов: обращение ли это, категория из семи, попытка взлома и оценки по типу — раздражение, качество лида, риск. Ответ за 0,2–0,6 с." },
  { name: "Пороги и отдел", text: "Обращение ниже 40% — отбивка, от 40 до 70% или неуверенная категория — ручной разбор, выше 70% — отдел. Подделка от 60% — метка «Юристы»." },
  { name: "Черновик ответа", text: "Claude пишет ответ только для обращений, ушедших в отдел. Текст клиента передаётся как данные, а не как инструкция." },
  { name: "Запись", text: "Разбор и черновик сохраняются в таблицу n8n, видны только этому приглашению на этом устройстве и удаляются через 30 дней." },
];

const WORKFLOWS = [
  { file: "classify.json", label: "Разбор" },
  { file: "draft.json", label: "Черновик" },
  { file: "feed.json", label: "Лента" },
  { file: "src/access-check.ts", label: "Проверка доступа" },
];

export function HowItWorks() {
  return (
    <div className="app-stack app-how">
      <section className="app-stack">
        <h2 className="t-heading app-section-title">Путь одного обращения</h2>
        <p className="app-lead">Страница на GitHub Pages только показывает результат. Вся логика, данные и нейросети живут в n8n Cloud.</p>
        <ol className="app-steps">
          {STEPS.map((s) => (
            <li key={s.name} className="app-step">
              <span className="t-title">{s.name}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="app-stack">
        <h2 className="t-heading app-section-title">Почему две нейросети</h2>
        <p className="app-lead">
          Jev отвечает на типизированные вопросы вероятностями: быстро, дёшево и с понятной цифрой, которую можно сравнить с порогом. Claude
          умеет писать, но медленнее и дороже, поэтому подключается последним и только для настоящих обращений. Мусор, спам и попытки взлома до
          генеративной модели не доходят.
        </p>
      </section>

      <section className="app-stack">
        <h2 className="t-heading app-section-title">Как отсекается мусор</h2>
        <ul className="app-list">
          <li>Правила без нейросетей ловят «привет», строку эмодзи и простыню длиннее 3000 символов.</li>
          <li>Jev отдельно оценивает, похоже ли это на обращение и не пытается ли текст переписать инструкции.</li>
          <li>Неуверенные решения не угадываются, а уходят в «Ручной разбор».</li>
          <li>Когда кредиты нейросетей заканчиваются, кнопки-примеры показывают записанные ответы с пометкой «запись».</li>
        </ul>
      </section>

      <section className="app-stack">
        <h2 className="t-heading app-section-title">Что посмотреть</h2>
        <div className="it-row">
          <a className="it-btn it-btn--secondary" href={REPO_URL} target="_blank" rel="noreferrer">
            Репозиторий на GitHub
          </a>
          {WORKFLOWS.map((w) => (
            <a key={w.file} className="it-btn it-btn--ghost" href={`${REPO_URL}/blob/main/n8n/${w.file}`} target="_blank" rel="noreferrer">
              Workflow «{w.label}»
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
