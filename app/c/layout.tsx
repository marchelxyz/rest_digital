import { MiniAppScripts } from "@/components/client/MiniAppScripts";

/**
 * Layout для клиентского мини-приложения (/c/[slug]).
 * Подключает Bridge-скрипты для Telegram и MAX.
 */
export default function ClientAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MiniAppScripts />
      {children}
    </>
  );
}
