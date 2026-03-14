"use client";

import {
  Bell,
  ChevronRight,
  Users,
  ShoppingBag,
  MapPin,
  User,
  CreditCard,
  Globe,
  LogOut,
  Share2,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react";
import { useMiniApp } from "./MiniAppProvider";
import type { Settings } from "./ClientApp";

type ClientProfileTabProps = {
  settings: Settings;
  adminTheme?: "light" | "dark" | "auto";
};

export function ClientProfileTab({ settings, adminTheme = "light" }: ClientProfileTabProps) {
  const { profile, theme, setTheme, share, addToHome, canAddToHome } = useMiniApp();
  const showThemeToggle = adminTheme === "auto";
  const displayName =
    profile?.firstName || profile?.lastName
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : "Гость";
  const displayPhone = "+7 (___) ___-__-__";

  async function handleShare() {
    const text = `${settings.appName} — закажи вкусно`;
    const link = typeof window !== "undefined" ? window.location.href : "";
    await share(text, link);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{displayName}</div>
          <div className="text-sm opacity-70">{displayPhone}</div>
        </div>
        <button type="button" className="p-2 relative" aria-label="Уведомления">
          <Bell size={22} strokeWidth={2} />
        </button>
      </header>

      {showThemeToggle && (
        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          borderRadius={settings.borderRadius}
          primaryColor={settings.primaryColor}
        />
      )}

      {settings.showLoyalty && settings.loyaltyType === "points" && (
        <LoyaltyPointsCard
          points={0}
          cashbackPct={settings.loyaltyCashbackPct}
          tier="Начинающий"
          borderRadius={settings.borderRadius}
          gradientColors={settings.loyaltyCardGradientColors}
          gradientOpacity={settings.loyaltyCardGradientOpacity ?? 100}
          gradientType={settings.loyaltyCardGradientType ?? "linear"}
          primaryColor={settings.primaryColor}
        />
      )}
      {settings.showLoyalty && settings.loyaltyType === "stamps" && (
        <LoyaltyStampsCard
          stamps={0}
          goal={settings.loyaltyStampGoal}
          borderRadius={settings.borderRadius}
          gradientColors={settings.loyaltyCardGradientColors}
          gradientOpacity={settings.loyaltyCardGradientOpacity ?? 100}
          gradientType={settings.loyaltyCardGradientType ?? "linear"}
          primaryColor={settings.primaryColor}
        />
      )}

      <ProfileMenuList
        settings={settings}
        onShare={handleShare}
        onAddToHome={canAddToHome ? addToHome : undefined}
      />
    </div>
  );
}

function ThemeToggle({
  theme,
  onToggle,
  borderRadius,
  primaryColor,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
  borderRadius: number;
  primaryColor: string;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl border transition-colors duration-200"
      style={{ borderRadius: borderRadius + 4 }}
    >
      <span className="font-medium">Тема</span>
      <button
        type="button"
        onClick={onToggle}
        className="relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
          borderRadius: 9999,
        }}
        aria-label={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
      >
        <span
          className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-sm"
          style={{
            backgroundColor: isDark ? primaryColor : "#fff",
            transform: isDark ? "translateX(24px)" : "translateX(0)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {isDark ? (
            <Moon size={14} className="text-white" strokeWidth={2} />
          ) : (
            <Sun size={14} className="text-amber-500" strokeWidth={2} />
          )}
        </span>
      </button>
    </div>
  );
}

function buildGradientStyle(
  colors: string | undefined | null,
  opacity: number,
  type: string,
  fallbackColor: string
): React.CSSProperties {
  if (!colors?.trim()) {
    return { backgroundColor: fallbackColor };
  }
  const arr = colors.split(",").map((c) => c.trim()).filter(Boolean);
  if (arr.length === 0) return { backgroundColor: fallbackColor };
  const alpha = Math.max(0, Math.min(100, opacity)) / 100;
  const withAlpha = arr.map((c) => {
    const hex = c.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return c;
  });
  const gradient =
    type === "radial"
      ? `radial-gradient(circle at 50% 50%, ${withAlpha.join(", ")})`
      : `linear-gradient(180deg, ${withAlpha.join(", ")})`;
  return { background: gradient };
}

function LoyaltyPointsCard({
  points,
  cashbackPct,
  tier,
  borderRadius,
  gradientColors,
  gradientOpacity,
  gradientType,
  primaryColor,
}: {
  points: number;
  cashbackPct: number;
  tier: string;
  borderRadius: number;
  gradientColors?: string | null;
  gradientOpacity?: number;
  gradientType?: string;
  primaryColor?: string;
}) {
  const bgStyle = buildGradientStyle(
    gradientColors,
    gradientOpacity ?? 100,
    gradientType ?? "linear",
    primaryColor ?? "#000"
  );
  const hasGradient = !!gradientColors?.trim();
  return (
    <div
      className={`p-4 rounded-xl border transition-colors duration-200 ${hasGradient ? "text-white border-white/20" : ""}`}
      style={{ borderRadius, ...bgStyle }}
    >
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
  gradientColors,
  gradientOpacity,
  gradientType,
  primaryColor,
}: {
  stamps: number;
  goal: number;
  borderRadius: number;
  gradientColors?: string | null;
  gradientOpacity?: number;
  gradientType?: string;
  primaryColor?: string;
}) {
  const bgStyle = buildGradientStyle(
    gradientColors,
    gradientOpacity ?? 100,
    gradientType ?? "linear",
    primaryColor ?? "#000"
  );
  const hasGradient = !!gradientColors?.trim();
  return (
    <div
      className={`p-4 rounded-xl border transition-colors duration-200 ${hasGradient ? "text-white border-white/20" : ""}`}
      style={{ borderRadius, ...bgStyle }}
    >
      <div className="font-medium mb-2">Штампы</div>
      <div className="flex gap-2">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-colors duration-200"
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

const ICON_SIZE = 20;

function ProfileMenuList({
  settings,
  onShare,
  onAddToHome,
}: {
  settings: Settings;
  onShare: () => void;
  onAddToHome?: () => void;
}) {
  const baseItems: { icon: typeof Users; label: string; sub?: string; action?: () => void }[] = [
    {
      icon: Users,
      label: "Приглашайте друзей",
      sub: "Дарим 300 баллов за каждого",
      action: onShare,
    },
    { icon: ShoppingBag, label: "Мои заказы" },
    { icon: MapPin, label: "Мои адреса" },
    { icon: User, label: "Мои данные" },
    { icon: CreditCard, label: "Банковские карты" },
    { icon: Globe, label: "Город" },
    { icon: LogOut, label: "Выйти" },
  ];

  const items = [
    ...(onAddToHome
      ? [
          {
            icon: Smartphone,
            label: "Добавить на главный экран",
            sub: "Быстрый доступ к меню",
            action: onAddToHome,
          },
        ]
      : []),
    ...baseItems,
  ];

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-200 hover:bg-muted/50 active:scale-[0.99]"
            style={{ borderRadius: settings.borderRadius + 2 }}
          >
            <Icon size={ICON_SIZE} strokeWidth={2} className="shrink-0 opacity-70" />
            <div className="flex-1">
              <div className="font-medium">{item.label}</div>
              {item.sub && <div className="text-sm opacity-70">{item.sub}</div>}
            </div>
            <ChevronRight size={18} className="opacity-50 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
