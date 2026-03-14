"use client";

import Script from "next/script";

/**
 * Подключает скрипты Bridge для Telegram, VK, MAX.
 * Вызывать только на страницах клиентского приложения (/c/[slug]).
 */
export function MiniAppScripts() {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://web.max.ru/max-web-app.js"
        strategy="beforeInteractive"
      />
    </>
  );
}
