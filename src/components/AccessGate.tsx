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

export function AccessGate({ variant }: { variant: keyof typeof COPY }) {
  const copy = COPY[variant];
  return (
    <div className="app-gate-wrap">
      <div className="it-gate">
        <span className="it-gate__eyebrow">Разбор входящих</span>
        <h1 className="it-gate__title">{copy.title}</h1>
        <p className="it-gate__text">{copy.text}</p>
        <a className="it-btn it-btn--primary" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
          Написать в Telegram
        </a>
        <span className="it-gate__handle">{TELEGRAM_HANDLE}</span>
      </div>
    </div>
  );
}
