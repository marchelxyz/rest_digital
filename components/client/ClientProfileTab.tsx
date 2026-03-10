"use client";

import type { Settings } from "./ClientApp";

export function ClientProfileTab({ settings }: { settings: Settings }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Гость</div>
          <div className="text-sm opacity-70">+7 (___) ___-__-__</div>
        </div>
        <button type="button" className="p-2 relative" aria-label="Уведомления">
          🔔
        </button>
      </header>

      {settings.showLoyalty && settings.loyaltyType === "points" && (
        <LoyaltyPointsCard
          points={0}
          cashbackPct={settings.loyaltyCashbackPct}
          tier="Начинающий"
          borderRadius={settings.borderRadius}
        />
      )}
      {settings.showLoyalty && settings.loyaltyType === "stamps" && (
        <LoyaltyStampsCard
          stamps={0}
          goal={settings.loyaltyStampGoal}
          borderRadius={settings.borderRadius}
        />
      )}

      <ProfileMenuList />
    </div>
  );
}

function LoyaltyPointsCard({
  points,
  cashbackPct,
  tier,
  borderRadius,
}: {
  points: number;
  cashbackPct: number;
  tier: string;
  borderRadius: number;
}) {
  return (
    <div className="p-4 rounded-xl border" style={{ borderRadius }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{tier}</span>
        <button type="button" className="text-sm opacity-70" aria-label="Подробнее">
          i
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold">{points}</span> баллов
        </div>
        <span className="text-sm">{cashbackPct}% Кэшбэк</span>
        <button type="button" className="text-sm">QR-код</button>
      </div>
    </div>
  );
}

function LoyaltyStampsCard({
  stamps,
  goal,
  borderRadius,
}: {
  stamps: number;
  goal: number;
  borderRadius: number;
}) {
  return (
    <div className="p-4 rounded-xl border" style={{ borderRadius }}>
      <div className="font-medium mb-2">Штампы</div>
      <div className="flex gap-2">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
            style={{ backgroundColor: i < stamps ? "currentColor" : "transparent" }}
          >
            {i < stamps ? "✓" : ""}
          </div>
        ))}
      </div>
      <div className="text-sm mt-2 opacity-70">
        {stamps} / {goal} — следующий в подарок
      </div>
    </div>
  );
}

function ProfileMenuList() {
  const items = [
    { icon: "👥", label: "Приглашайте друзей", sub: "Дарим 300 баллов за каждого" },
    { icon: "🛍️", label: "Мои заказы" },
    { icon: "📍", label: "Мои адреса" },
    { icon: "👤", label: "Мои данные" },
    { icon: "💳", label: "Банковские карты" },
    { icon: "🌐", label: "Город" },
    { icon: "🚪", label: "Выйти" },
  ];

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left"
        >
          <span>{item.icon}</span>
          <div className="flex-1">
            <div className="font-medium">{item.label}</div>
            {item.sub && <div className="text-sm opacity-70">{item.sub}</div>}
          </div>
          <span className="opacity-50">›</span>
        </button>
      ))}
    </div>
  );
}
