export type MailingChannel = "TELEGRAM" | "VK" | "MAX";

export type MailingStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";

export type MailingSegment = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  platforms: string | null;
  avgCheckFrom: string | null;
  avgCheckTo: string | null;
  categoryIds: string | null;
  maxMessagesPerHour: number;
  createdAt: string;
  updatedAt: string;
};

export type MediaAttachment = {
  type: "photo" | "video";
  url: string;
  caption?: string;
};

export type MailingButton = {
  label: string;
  url: string;
  linkType: "banner" | "section";
};

export type Mailing = {
  id: string;
  tenantId: string;
  name: string;
  channel: MailingChannel;
  status: MailingStatus;
  bodyHtml: string;
  bodyPlain: string | null;
  mediaJson: string | null;
  buttonsJson: string | null;
  segmentId: string | null;
  rateLimit: number;
  sentCount: number;
  failedCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MailingWithSegment = Mailing & {
  segment: MailingSegment | null;
};

export const CHANNEL_LABELS: Record<MailingChannel, string> = {
  TELEGRAM: "Telegram",
  VK: "ВКонтакте",
  MAX: "MAX",
};

export const STATUS_LABELS: Record<MailingStatus, string> = {
  DRAFT: "Черновик",
  SCHEDULED: "Запланирована",
  SENDING: "Отправляется",
  PAUSED: "Приостановлена",
  COMPLETED: "Завершена",
  FAILED: "Ошибка",
};

export const STATUS_COLORS: Record<MailingStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENDING: "bg-yellow-100 text-yellow-700",
  PAUSED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};
