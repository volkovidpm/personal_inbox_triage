import examples from "../../data/examples.json";
import { formatDuration, formatPercent } from "../lib/format";
import type { Category, JevReading } from "../lib/types";
import type { NoticeReason } from "../triage/reducer";

const GUESS: Partial<Record<Category, string>> = {
  review: "Отзывы",
  wholesale: "Опт",
  blogger: "Блогеры",
  candidate: "Кандидаты",
  approval: "Согласования",
};

type Copy = { title: string; text: string; tone: "" | "warn" | "stop"; meta?: string };

function copyFor(reason: NoticeReason, jev?: JevReading): Copy {
  const ms = jev ? ` · ${formatDuration(jev.ms)}` : "";
  switch (reason) {
    case "too_short":
      return { tone: "", title: "Мало текста", text: "Слишком мало текста, чтобы понять запрос. Опишите ситуацию в одном-двух предложениях или выберите пример." };
    case "too_long":
      return { tone: "", title: "Слишком длинный текст", text: "Текст длиннее 3000 символов. Сократите его до сути обращения или выберите пример." };
    case "symbols":
      return { tone: "", title: "Нет слов", text: "В тексте нет ни букв, ни цифр. Опишите ситуацию словами или выберите пример." };
    case "off_topic":
      return {
        tone: "",
        title: "Не по теме",
        text: `Это не похоже на обращение к компании: Jev оценил вероятность в ${formatPercent(jev?.pRequest ?? 0)}. Я разбираю отзывы покупателей, заявки оптовиков, предложения блогеров, отклики кандидатов и внутренние согласования.`,
        meta: jev && `Jev · обращение ${formatPercent(jev.pRequest)}${ms}`,
      };
    case "spam":
      return {
        tone: "",
        title: "Похоже на спам",
        text: "Похоже на рекламную рассылку. В рабочей системе такие письма уходят в «Спам» без ответа.",
        meta: jev && `Jev · спам ${formatPercent(jev.pCategory)}${ms}`,
      };
    case "injection":
      return {
        tone: "stop",
        title: "Запрос остановлен",
        text: "Текст похож на попытку изменить инструкции системы. Запрос остановлен на проверке, генеративная модель не запускалась.",
        meta: jev && `Jev · манипуляция ${formatPercent(jev.pInjection)}${ms}`,
      };
    case "manual":
      return {
        tone: "warn",
        title: "Неясно, куда",
        text: `Не уверен, к какому отделу это относится: лучшая догадка — «${GUESS[jev?.category ?? "review"] ?? "Ручной разбор"}», ${formatPercent(jev?.pCategory ?? 0)}. В рабочей системе обращение ушло бы на ручной разбор.`,
        meta: jev && `Jev · категория ${formatPercent(jev.pCategory)} · обращение ${formatPercent(jev.pRequest)}${ms}`,
      };
    case "rate_limited":
      return { tone: "stop", title: "Слишком часто", text: "Слишком много запросов подряд. Подождите минуту." };
    case "daily_limit":
      return { tone: "warn", title: "Лимит на сегодня", text: "На сегодня живые разборы закончились, посмотрите записанные примеры." };
    case "ai_unavailable":
      return { tone: "warn", title: "Нейросети недоступны", text: "Нейросети временно недоступны, посмотрите записанные примеры." };
  }
}

export function Notice({ reason, jev, onExample }: { reason: NoticeReason; jev?: JevReading; onExample: (id: string) => void }) {
  const c = copyFor(reason, jev);
  return (
    <section className={c.tone ? `it-notice it-notice--${c.tone}` : "it-notice"} aria-live="polite">
      <h3 className="it-notice__title">{c.title}</h3>
      <p className="it-notice__text">{c.text}</p>
      {c.meta && <span className="it-notice__meta">{c.meta}</span>}
      {reason !== "injection" && reason !== "manual" && (
        <div className="it-notice__actions">
          {examples.map((e) => (
            <button key={e.id} className="it-btn it-btn--example" type="button" onClick={() => onExample(e.id)}>
              {e.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
