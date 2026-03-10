"use client";

import { useCartStore } from "./cart-store";

type Settings = {
  appName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  primaryColor: string;
  borderRadius: number;
};

export function ClientHeader({
  settings,
  onCartClick,
}: {
  settings: Settings;
  onCartClick: () => void;
}) {
  const { items } = useCartStore();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="sticky top-0 z-10 bg-inherit border-b border-white/10">
      {settings.coverUrl && (
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${settings.coverUrl})` }}
        />
      )}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : null}
          <span className="font-semibold">{settings.appName}</span>
        </div>
        <button
          type="button"
          onClick={onCartClick}
          className="relative px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius }}
        >
          Корзина {count > 0 && `(${count})`}
        </button>
      </div>
    </header>
  );
}
