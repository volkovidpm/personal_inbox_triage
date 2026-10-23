import { TELEGRAM_HANDLE, TELEGRAM_URL } from "../config";

const COPY = {
  invite: {
    title: "Демо доступно по приглашению",
    text: "Ссылка с приглашением приходит вместе с откликом. Если её нет или она перестала работать, напишите мне, пришлю новую.",
  },
  expired: {
    title: "Срок доступа закончился — напишите Игорю, продлю",
    text: "Приглашение действовало ограниченное время или до исчерпания лимита разборов. Напишите в Telegram, пришлю новую ссылку.",
  },
};

/** Экран доступа: на всю страницу или блоком внутри разбора, когда доступ закончился посреди сессии. */
export function AccessGate({ variant, inline = false }: { variant: keyof typeof COPY; inline?: boolean }) {
  const copy = COPY[variant];
  const Title = inline ? "h2" : "h1";
  const gate = (
    <div className="it-gate" role={inline ? "alert" : undefined}>
      <span className="it-gate__eyebrow">Разбор входящих</span>
      <Title className="it-gate__title">{copy.title}</Title>
      <p className="it-gate__text">{copy.text}</p>
      <a className="it-btn it-btn--primary" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
        Написать в Telegram
      </a>
      <span className="it-gate__handle">{TELEGRAM_HANDLE}</span>
    </div>
  );
  return inline ? gate : <div className="app-gate-wrap">{gate}</div>;
}
