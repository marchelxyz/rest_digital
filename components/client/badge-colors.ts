/**
 * Цвета ярлыков блюд. Текст подобраны под фон для читаемости.
 * Острое — красный с белым текстом, Веган — зелёный и т.д.
 */
const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  Острое: { bg: "rgb(220, 38, 38)", text: "#ffffff" },
  Новинка: { bg: "rgb(22, 163, 74)", text: "#ffffff" },
  Хит: { bg: "rgb(234, 88, 12)", text: "#ffffff" },
  Популярное: { bg: "rgb(37, 99, 235)", text: "#ffffff" },
  Веган: { bg: "rgb(22, 163, 74)", text: "#ffffff" },
  Вегетарианское: { bg: "rgb(101, 163, 13)", text: "#ffffff" },
  "Без глютена": { bg: "rgb(217, 119, 6)", text: "#ffffff" },
  Рекомендуем: { bg: "rgb(139, 92, 246)", text: "#ffffff" },
  Акция: { bg: "rgb(220, 38, 38)", text: "#ffffff" },
};

const DEFAULT = { bg: "rgb(71, 85, 105)", text: "#ffffff" };

export function getBadgeStyle(label: string): { backgroundColor: string; color: string } {
  const c = BADGE_COLORS[label] ?? DEFAULT;
  return { backgroundColor: c.bg, color: c.text };
}
