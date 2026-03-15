"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  ChevronRight,
  Users,
  ShoppingBag,
  User,
  Smartphone,
  Moon,
  Sun,
  Coins,
  Info,
  QrCode,
} from "lucide-react";
import QRCode from "qrcode";
import { useMiniApp } from "./MiniAppProvider";
import type { CustomerData, Settings } from "./ClientApp";

function normalizeCardNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 11 && digits.startsWith("7")) return digits.slice(0, 11);
  if (digits.length >= 10) return "7" + digits.slice(-10);
  return digits;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length >= 10) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }
  return phone;
}

type ClientProfileTabProps = {
  settings: Settings;
  adminTheme?: "light" | "dark" | "auto";
  customer: CustomerData | null;
  customerLoading: boolean;
  onCustomerUpdated: (customer: CustomerData | null) => void;
};

export function ClientProfileTab({
  settings,
  adminTheme = "light",
  customer,
  customerLoading,
  onCustomerUpdated,
}: ClientProfileTabProps) {
  const { profile, theme, setTheme, share, addToHome, canAddToHome, storage } = useMiniApp();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);

  const showThemeToggle = adminTheme === "auto";
  const displayName =
    customer?.name?.trim() ||
    (profile?.firstName || profile?.lastName
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : "Гость");
  const displayPhone = customer?.phone
    ? formatPhone(customer.phone)
    : "+7 (___) ___-__-__";
  const cardNumber = customer?.phone ? normalizeCardNumber(customer.phone) : null;

  async function handleShare() {
    const text = (settings.inviteText?.trim() || `${settings.appName} — закажи вкусно`);
    let link = settings.inviteLink?.trim();
    if (!link && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("utm_source", "invite");
      link = url.toString();
    }
    await share(text, link ?? undefined);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="font-semibold">
            {customerLoading ? "Загрузка…" : displayName}
          </div>
          <div className="text-sm opacity-70">{displayPhone}</div>
        </div>
        <button
          type="button"
          className="p-2 relative"
          aria-label="Уведомления"
          onClick={() => setNotificationsOpen(true)}
        >
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
        <>
          <LoyaltyPointsCard
            points={customer?.points ?? 0}
            cashbackPct={settings.loyaltyCashbackPct}
            tier="Бонусная карта"
            borderRadius={settings.borderRadius}
            gradientColors={settings.loyaltyCardGradientColors}
            gradientOpacity={settings.loyaltyCardGradientOpacity ?? 100}
            gradientType={settings.loyaltyCardGradientType ?? "linear"}
            primaryColor={settings.primaryColor}
            onQrClick={() => setQrModalOpen(true)}
            onFaqClick={() => setFaqModalOpen(true)}
          />
          <LoyaltyFaqModal
            open={faqModalOpen}
            onClose={() => setFaqModalOpen(false)}
            html={settings.loyaltyFaqHtml}
            borderRadius={settings.borderRadius}
          />
          <LoyaltyCardModal
            open={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            cardNumber={cardNumber}
            borderRadius={settings.borderRadius}
          />
        </>
      )}
      {settings.showLoyalty && settings.loyaltyType === "stamps" && (
        <LoyaltyStampsCard
          stamps={customer?.stamps ?? 0}
          goal={settings.loyaltyStampGoal}
          borderRadius={settings.borderRadius}
          gradientColors={settings.loyaltyCardGradientColors}
          gradientOpacity={settings.loyaltyCardGradientOpacity ?? 100}
          gradientType={settings.loyaltyCardGradientType ?? "linear"}
          primaryColor={settings.primaryColor}
        />
      )}

      <NotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        borderRadius={settings.borderRadius}
      />
      <ProfileMenuList
        settings={settings}
        onShare={handleShare}
        onAddToHome={canAddToHome ? addToHome : undefined}
        onOrdersClick={() => setOrdersModalOpen(true)}
        onDataClick={() => setDataModalOpen(true)}
      />
      <OrdersModal
        open={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        borderRadius={settings.borderRadius}
      />
      <MyDataModal
        open={dataModalOpen}
        onClose={() => setDataModalOpen(false)}
        customer={customer}
        settings={settings}
        profile={profile}
        borderRadius={settings.borderRadius}
        onSaved={(updated) => {
          onCustomerUpdated(updated);
          if (updated?.phone) {
            storage.set(settings.tenantId, "profile_phone", updated.phone).catch(() => {});
          }
        }}
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
  onQrClick,
  onFaqClick,
}: {
  points: number;
  cashbackPct: number;
  tier: string;
  borderRadius: number;
  gradientColors?: string | null;
  gradientOpacity?: number;
  gradientType?: string;
  primaryColor?: string;
  onQrClick?: () => void;
  onFaqClick?: () => void;
}) {
  const bgStyle = buildGradientStyle(
    gradientColors,
    gradientOpacity ?? 100,
    gradientType ?? "linear",
    primaryColor ?? "#000"
  );
  const hasGradient = !!gradientColors?.trim();
  return (
    <div className="space-y-3">
      <div
        className={`p-6 min-h-[210px] rounded-xl border shadow-sm transition-colors duration-200 flex flex-col justify-between ${hasGradient ? "text-white border-white/20" : ""}`}
        style={{ borderRadius: borderRadius + 4, ...bgStyle }}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="font-medium">{tier}</span>
          <button
            type="button"
            className="w-6 h-6 rounded-full border flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Программа лояльности"
            onClick={(e) => {
              e.stopPropagation();
              onFaqClick?.();
            }}
          >
            <Info size={12} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{points}</span>
            <Coins size={24} strokeWidth={2} className="opacity-90" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-lg border-2 border-current/50 text-sm font-medium inline-block"
              aria-hidden
            >
              {cashbackPct}% Кэшбэк
            </span>
            <button
              type="button"
              onClick={onQrClick}
              className="flex flex-col items-center gap-0.5 py-1 hover:opacity-90 transition-opacity"
              aria-label="QR-код"
            >
              <QrCode size={24} strokeWidth={2} />
              <span className="text-xs">QR-код</span>
            </button>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 active:scale-[0.99]"
        style={{
          borderRadius: borderRadius + 4,
          borderColor: "rgb(234 179 8 / 0.5)",
          backgroundColor: "rgb(254 252 232 / 0.8)",
        }}
      >
        <Coins size={22} strokeWidth={2} className="shrink-0 text-amber-600" />
        <div className="flex-1">
          <div className="font-medium">Активировать баллы</div>
          <div className="text-sm opacity-70">Дополните данные профиля, чтобы использовать баллы</div>
        </div>
        <ChevronRight size={18} className="opacity-50 shrink-0" />
      </button>
    </div>
  );
}

function LoyaltyFaqModal({
  open,
  onClose,
  html,
  borderRadius,
}: {
  open: boolean;
  onClose: () => void;
  html?: string | null;
  borderRadius: number;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 transition-opacity" onClick={onClose} aria-hidden />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-background border-t shadow-xl overflow-y-auto overscroll-contain md:max-w-2xl md:left-1/2 md:-translate-x-1/2"
        style={{ maxHeight: "80dvh", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
        <h2 className="text-lg font-bold px-4 pt-2 pb-3">Программа лояльности</h2>
        <div className="px-4 pb-6">
          {html?.trim() ? (
            <div
              className="prose prose-sm prose-p:my-2 prose-a:text-primary prose-a:underline break-words"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Описание программы пока не добавлено.</p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 py-3 text-left text-sm rounded-lg bg-muted/60 font-medium"
            style={{ borderRadius: borderRadius + 2 }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  );
}

function NotificationsModal({
  open,
  onClose,
  borderRadius,
}: {
  open: boolean;
  onClose: () => void;
  borderRadius: number;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 transition-opacity" onClick={onClose} aria-hidden />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-background border-t shadow-xl overflow-y-auto overscroll-contain md:max-w-2xl md:left-1/2 md:-translate-x-1/2"
        style={{ maxHeight: "80dvh", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
        <h2 className="text-lg font-bold px-4 pt-2 pb-3">Уведомления</h2>
        <div className="px-4 pb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Здесь будут уведомления о заказах и акциях.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-left text-sm rounded-lg bg-muted/60 font-medium"
            style={{ borderRadius: borderRadius + 2 }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  );
}

function OrdersModal({
  open,
  onClose,
  borderRadius,
}: {
  open: boolean;
  onClose: () => void;
  borderRadius: number;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 transition-opacity" onClick={onClose} aria-hidden />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-background border-t shadow-xl overflow-y-auto overscroll-contain md:max-w-2xl md:left-1/2 md:-translate-x-1/2"
        style={{ maxHeight: "80dvh", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
        <h2 className="text-lg font-bold px-4 pt-2 pb-3">Мои заказы</h2>
        <div className="px-4 pb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Здесь будет история ваших заказов.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 text-left text-sm rounded-lg bg-muted/60 font-medium"
            style={{ borderRadius: borderRadius + 2 }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  );
}

function MyDataModal({
  open,
  onClose,
  customer,
  settings,
  profile,
  borderRadius,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  customer: CustomerData | null;
  settings: Settings;
  profile: { platform?: string; platformUserId?: string } | null;
  borderRadius: number;
  onSaved: (customer: CustomerData | null) => void;
}) {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [consentToMailing, setConsentToMailing] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(customer?.name ?? "");
      setLastName(customer?.lastName ?? "");
      setPatronymic(customer?.patronymic ?? "");
      setDateOfBirth(customer?.dateOfBirth ?? "");
      setEmail(customer?.email ?? "");
      setCity(customer?.city ?? "");
      setConsentToMailing(customer?.consentToMailing ?? false);
      setPhone(customer?.phone ?? "");
    }
  }, [
    open,
    customer?.name,
    customer?.lastName,
    customer?.patronymic,
    customer?.dateOfBirth,
    customer?.email,
    customer?.city,
    customer?.consentToMailing,
    customer?.phone,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings.tenantId) return;
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return;
    setSaving(true);
    try {
      const payload = {
        tenantId: settings.tenantId,
        platform: profile?.platform ?? "",
        platformUserId: profile?.platformUserId ?? "",
        name: name.trim() || undefined,
        lastName: lastName.trim() || undefined,
        patronymic: patronymic.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        consentToMailing,
        phone: trimmedPhone,
      };
      if (customer?.id) {
        const res = await fetch("/api/public/customer", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, customerId: customer.id }),
        });
        if (res.ok) {
          const data = (await res.json()) as CustomerData;
          onSaved(data);
          onClose();
        }
      } else {
        const res = await fetch("/api/public/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as CustomerData;
          onSaved(data);
          onClose();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const showTelegram = settings.messengerTelegram !== false;
  const showVk = settings.messengerVk !== false;
  const showMax = settings.messengerMax !== false;

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 transition-opacity" onClick={onClose} aria-hidden />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-background border-t shadow-xl overflow-y-auto overscroll-contain md:max-w-2xl md:left-1/2 md:-translate-x-1/2"
        style={{ maxHeight: "80dvh", borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
        <h2 className="text-lg font-bold px-4 pt-2 pb-3">Мои данные</h2>
        <div className="px-4 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Имя"
              style={{ borderRadius: settings.borderRadius }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">День рождения</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              style={{ borderRadius: settings.borderRadius }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Эл. почта</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="example@mail.ru"
              style={{ borderRadius: settings.borderRadius }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Фамилия</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Фамилия"
              style={{ borderRadius: settings.borderRadius }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Отчество</label>
            <input
              type="text"
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Отчество"
              style={{ borderRadius: settings.borderRadius }}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentToMailing}
              onChange={(e) => setConsentToMailing(e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm text-muted-foreground">Согласие на рассылку</span>
          </label>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Город</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Город"
              style={{ borderRadius: settings.borderRadius }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="+7 (999) 123-45-67"
              style={{ borderRadius: settings.borderRadius }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Используется как номер бонусной карты
            </p>
          </div>
          {(showTelegram || showVk || showMax) && (
            <div className="pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">ID в мессенджерах</div>
              <div className="text-sm space-y-1">
                {showTelegram && (
                  <div>
                    <span className="text-muted-foreground">Telegram ID: </span>
                    {customer?.telegramUserId ?? "—"}
                  </div>
                )}
                {showVk && (
                  <div>
                    <span className="text-muted-foreground">VK ID: </span>
                    {customer?.vkUserId ?? "—"}
                  </div>
                )}
                {showMax && (
                  <div>
                    <span className="text-muted-foreground">MAX ID: </span>
                    {customer?.maxUserId ?? "—"}
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-medium transition-colors text-white disabled:opacity-50"
            style={{
              borderRadius: borderRadius + 4,
              backgroundColor: settings.primaryColor,
            }}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {}}
              className="text-sm text-muted-foreground hover:underline"
            >
              Удалить аккаунт
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

function LoyaltyCardModal({
  open,
  onClose,
  cardNumber,
  borderRadius,
}: {
  open: boolean;
  onClose: () => void;
  cardNumber: string | null;
  borderRadius: number;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !cardNumber) return;
    QRCode.toDataURL(cardNumber, { width: 200, margin: 2 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [open, cardNumber]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-full max-w-sm bg-background rounded-2xl shadow-xl p-6 text-center"
        style={{ borderRadius: borderRadius + 8 }}
      >
        <h2 className="text-xl font-bold mb-2">Карта лояльности</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Покажите QR-код персоналу, чтобы использовать баллы
        </p>
        {qrDataUrl && cardNumber ? (
          <>
            <img src={qrDataUrl} alt="QR-код карты" className="w-48 h-48 mx-auto mb-4" />
            <div className="font-mono font-bold text-lg mb-6">{cardNumber}</div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-8">
            Номер карты появится после первого заказа с указанием телефона
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
          style={{ borderRadius: borderRadius + 4 }}
        >
          Закрыть
        </button>
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
  onOrdersClick,
  onDataClick,
}: {
  settings: Settings;
  onShare: () => void;
  onAddToHome?: () => void;
  onOrdersClick?: () => void;
  onDataClick?: () => void;
}) {
  const baseItems: { icon: typeof Users; label: string; sub?: string; action?: () => void }[] = [
    {
      icon: Users,
      label: "Приглашайте друзей",
      sub: "Дарим 300 баллов за каждого",
      action: onShare,
    },
    { icon: ShoppingBag, label: "Мои заказы", action: onOrdersClick },
    { icon: User, label: "Мои данные", action: onDataClick },
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
