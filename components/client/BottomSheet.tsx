\"use client\";

import { useEffect, useRef, useState } from \"react\";

/**
 * Нижний лист в стиле FilterSheet: оверлей, панель снизу с ручкой и заголовком.
 * Используется для модалок профиля (Мои заказы, Мои данные, FAQ лояльности, Уведомления).
 * Закрывается по тапу по фону и по жесту потягивания вниз, как фильтр.
 */
const BOTTOM_SHEET_CLOSE_DURATION_MS = 280;

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
  const touchStartY = useRef(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  if (!open && !isClosing) return null;

  function handleClose() {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setIsClosing(false);
      onClose();
    }, BOTTOM_SHEET_CLOSE_DURATION_MS);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchMove(e: React.TouchEvent) {
    const y = e.touches[0].clientY;
    const delta = y - touchStartY.current;
    if (delta > 60 && sheetRef.current && sheetRef.current.scrollTop === 0) {
      handleClose();
      e.preventDefault();
    }
  }

  return (
    <>
      <div
        className=\"fixed inset-0 z-50 bg-black/40 transition-opacity duration-200\"
        style={{ opacity: isClosing ? 0 : 1, touchAction: \"none\" }}
        onClick={handleClose}
        aria-hidden
      />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className=\"fixed left-0 right-0 bottom-0 z-50 bg-background border-t shadow-xl overflow-y-auto overscroll-contain md:max-w-2xl md:left-1/2 md:-translate-x-1/2 transition-transform ease-out\"
        style={{
          maxHeight: \"80dvh\",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: isClosing ? \"translateY(100%)\" : \"translateY(0)\",
          transitionDuration: `${BOTTOM_SHEET_CLOSE_DURATION_MS}ms`,
        }}
      >
        <div className=\"flex justify-center pt-3 pb-1\">
          <div className=\"w-10 h-1 rounded-full bg-muted-foreground/30\" aria-hidden />
        </div>
        <h2 className=\"text-lg font-bold px-4 pt-2 pb-3\">{title}</h2>
        <div className=\"px-4 pb-6\">{children}</div>
      </div>
    </>
  );
}
