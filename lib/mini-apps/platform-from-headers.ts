/**
 * Определение платформы мини-приложения по HTTP-заголовкам запроса.
 * Используется для серверного рендеринга (SSR), когда window.WebApp ещё недоступен.
 * При открытии в iframe MAX/Telegram/VK браузер передаёт Referer родительской страницы.
 */

/**
 * Определяет платформу по заголовкам запроса.
 *
 * @param headers - Объект Headers (Next.js headers() или request.headers)
 * @param enabledMessengers - Какие мессенджеры включены у тенанта
 * @returns Платформа или null, если не удалось определить
 */
export function getPlatformFromHeaders(
  headers: Headers,
  enabledMessengers?: { telegram?: boolean; vk?: boolean; max?: boolean }
): "telegram" | "vk" | "max" | null {
  const referer = headers.get("referer") ?? headers.get("Referer") ?? "";
  const useTg = enabledMessengers?.telegram !== false;
  const useVk = enabledMessengers?.vk !== false;
  const useMax = enabledMessengers?.max !== false;

  const ref = referer.toLowerCase();

  if (useTg && (ref.includes("telegram.org") || ref.includes("t.me"))) {
    return "telegram";
  }
  if (useVk && (ref.includes("vk.com") || ref.includes("vk.ru"))) {
    return "vk";
  }
  if (useMax && ref.includes("max.ru")) {
    return "max";
  }

  return null;
}
