"use client";

/**
 * Нижний лист в стиле FilterSheet: оверлей, панель снизу с ручкой и заголовком.
 * Используется для модалок профиля (Мои заказы, Мои данные, FAQ лояльности, Уведомления).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-background border-t shadow-xl overflow-y-auto overscroll-contain md:max-w-2xl md:left-1/2 md:-translate-x-1/2"
        style={{ maxHeight: "80dvh", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
        <h2 className="text-lg font-bold px-4 pt-2 pb-3">{title}</h2>
        <div className="px-4 pb-6">{children}</div>
      </div>
    </>
  );
}
