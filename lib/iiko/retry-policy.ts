/**
 * Определяет, можно ли повторить отправку в iiko после ошибки (логика близка к mariko iikoRetryWorker).
 */
export function isRetryableIikoErrorMessage(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }
  const text = message.toLowerCase();

  const nonRetryable = [
    "invalid_body_json_format",
    "value cannot be null",
    "parameter 'phone'",
    "не заполнен корректный телефон",
    "позиции без iiko_product_id",
    "не заполнены улица или дом",
    "не заполнены organization/terminal",
    "api_login отсутствует",
    "apilogin has been blocked",
    "locked",
  ];
  if (nonRetryable.some((m) => text.includes(m))) {
    return false;
  }

  const retryable = [
    "timeout",
    "timed out",
    "abort",
    "network",
    "econnreset",
    "econnrefused",
    "etimedout",
    "service unavailable",
    "too many requests",
    "bad gateway",
    "gateway timeout",
    "fetch failed",
    "http 5",
    "http 408",
    "http 429",
  ];
  return retryable.some((m) => text.includes(m));
}
