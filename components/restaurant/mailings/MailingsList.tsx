"use client";

import { Send } from "lucide-react";
import type { MailingWithSegment } from "@/components/restaurant/mailings/types";
import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/components/restaurant/mailings/types";

/**
 * Таблица/список существующих рассылок.
 */
export function MailingsList({
  mailings,
  onSelect,
}: {
  mailings: MailingWithSegment[];
  onSelect: (m: MailingWithSegment) => void;
}) {
  if (mailings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <Send size={48} className="mb-4 opacity-50" />
        <p className="text-lg">Нет рассылок</p>
        <p className="text-sm">Создайте первую рассылку, чтобы начать</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-neutral-600">Название</th>
            <th className="text-left px-4 py-3 font-medium text-neutral-600">Канал</th>
            <th className="text-left px-4 py-3 font-medium text-neutral-600">Сегмент</th>
            <th className="text-left px-4 py-3 font-medium text-neutral-600">Статус</th>
            <th className="text-right px-4 py-3 font-medium text-neutral-600">Отправлено</th>
            <th className="text-right px-4 py-3 font-medium text-neutral-600">Создана</th>
          </tr>
        </thead>
        <tbody>
          {mailings.map((m) => (
            <tr
              key={m.id}
              onClick={() => onSelect(m)}
              className="border-b last:border-0 cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <td className="px-4 py-3 font-medium">{m.name}</td>
              <td className="px-4 py-3">{CHANNEL_LABELS[m.channel]}</td>
              <td className="px-4 py-3 text-neutral-500">
                {m.segment?.name ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                  {STATUS_LABELS[m.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {m.sentCount}
              </td>
              <td className="px-4 py-3 text-right text-neutral-500">
                {new Date(m.createdAt).toLocaleDateString("ru-RU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
