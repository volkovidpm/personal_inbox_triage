import type { Category, Channel, Department, Status } from "./types";

export function formatPercent(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} мс`;
  const seconds = Math.round(ms / 100) / 10;
  return `${String(seconds).replace(".", ",")} с`;
}

export const DEPARTMENT_LABEL: Record<Department, string> = {
  service: "Клиентский сервис",
  wholesale: "Отдел опта",
  marketing: "Маркетинг",
  hr: "HR",
  approvals: "Согласования",
  manual: "Ручной разбор",
  spam: "Спам",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  wb: "WB",
  ozon: "Ozon",
  ym: "Яндекс Маркет",
  site: "Форма на сайте",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  email: "Почта",
  hh: "hh.ru",
  internal: "Внутренний чат",
};

export const TYPE_LABEL: Record<Category, string> = {
  review: "Отзыв",
  wholesale: "Опт",
  blogger: "Блогер",
  candidate: "Отклик",
  approval: "Согласование",
  spam: "Спам",
  off_topic: "Не по теме",
};

export const STATUS_LABEL: Record<Status, string> = { new: "Новое", work: "В работе", done: "Отвечено" };
