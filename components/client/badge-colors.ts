/**
 * Цвета ярлыков блюд (пастельные полупрозрачные).
 * Острое — красный, Веган — зелёный и т.д.
 */
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Острое: { bg: "rgba(239, 68, 68, 0.25)", text: "rgb(185, 28, 28)" },
  Новинка: { bg: "rgba(34, 197, 94, 0.25)", text: "rgb(21, 128, 61)" },
  Хит: { bg: "rgba(249, 115, 22, 0.25)", text: "rgb(194, 65, 12)" },
  Популярное: { bg: "rgba(59, 130, 246, 0.25)", text: "rgb(29, 78, 216)" },
  Веган: { bg: "rgba(34, 197, 94, 0.25)", text: "rgb(21, 128, 61)" },
  Вегетарианское: { bg: "rgba(101, 163, 13, 0.25)", text: "rgb(77, 124, 15)" },
  "Без глютена": { bg: "rgba(245, 158, 11, 0.25)", text: "rgb(180, 83, 9)" },
  Акция: { bg: "rgba(239, 68, 68, 0.25)", text: "rgb(185, 28, 28)" },
};

const DEFAULT = { bg: "rgba(100, 116, 139, 0.2)", text: "rgb(71, 85, 105)" };

export function getBadgeStyle(label: string): { backgroundColor: string; color: string } {
  const c = BADGE_COLORS[label] ?? DEFAULT;
  return { backgroundColor: c.bg, color: c.text };
}
