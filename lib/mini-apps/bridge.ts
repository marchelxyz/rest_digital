/**
 * Унифицированный Bridge для мини-приложений Telegram, VK, MAX.
 * Предоставляет единый API: share, haptic, back, storage, themeParams, addToHomeScreen.
 */

import type { GuestProfile, MiniAppPlatform, ThemeMode } from "./types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string };
          start_param?: string;
        };
        colorScheme?: "light" | "dark";
        themeParams?: Record<string, string>;
        ready: () => void;
        expand: () => void;
        close: () => void;
        BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
        MainButton?: { show: () => void; hide: () => void; setText: (t: string) => void; onClick: (cb: () => void) => void };
        HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void; selectionChanged: () => void };
        CloudStorage?: { setItem: (k: string, v: string, cb?: (e: unknown, ok?: boolean) => void) => void; getItem: (k: string, cb: (e: unknown, v?: string) => void) => void };
        requestContact?: (cb: (result: { phone_number?: string; first_name?: string }) => void) => void;
        shareToStory?: (url: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
        openLink?: (url: string) => void;
        addToHomeScreen?: () => void;
        isVersionAtLeast?: (v: string) => boolean;
      };
    };
    VK?: {
      Bridge?: {
        send: (method: string, params?: object) => Promise<{ result?: unknown }>;
      };
    };
    WebApp?: {
      initData: string;
      initDataUnsafe?: {
        user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string };
        start_param?: object;
      };
      ready: () => void;
      close: () => void;
      BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
      HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void; selectionChanged: () => void };
      requestContact?: () => Promise<{ phone?: string }>;
      shareContent?: (opts: { text?: string; link?: string }) => Promise<{ status?: string }>;
      shareMaxContent?: (opts: { text?: string; link?: string }) => Promise<{ status?: string }>;
      openLink?: (url: string) => void;
      platform?: string;
    };
  }
}

export type EnabledMessengers = {
  telegram?: boolean;
  vk?: boolean;
  max?: boolean;
};

/**
 * Проверяет, что приложение открыто в MAX по URL (hash/query).
 * MAX передаёт WebAppPlatform, WebAppVersion, WebAppData в URL.
 */
function isMaxFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.location.hash || window.location.search;
  if (!raw) return false;
  try {
    const params = new URLSearchParams(raw.replace(/^#/, ""));
    return params.has("WebAppPlatform") || params.has("WebAppVersion") || params.has("WebAppData");
  } catch {
    return false;
  }
}

/**
 * Определяет платформу по глобальным объектам и URL.
 * MAX проверяется первым (по URL и window.WebApp), т.к. при открытии в MAX
 * может присутствовать и telegram-web-app.js — тогда Telegram не должен иметь приоритет.
 */
export function detectPlatform(enabled?: EnabledMessengers): MiniAppPlatform {
  if (typeof window === "undefined") return "standalone";
  const useTg = enabled?.telegram !== false;
  const useVk = enabled?.vk !== false;
  const useMax = enabled?.max !== false;
  if (useMax && (isMaxFromUrl() || window.WebApp)) return "max";
  if (useTg && window.Telegram?.WebApp) return "telegram";
  if (useVk && window.VK?.Bridge) return "vk";
  return "standalone";
}

/** Возвращает профиль гостя из initData (если доступен). */
export function getProfile(enabled?: EnabledMessengers): GuestProfile | null {
  if (typeof window === "undefined") return null;
  const platform = detectPlatform(enabled);
  if (platform === "telegram") {
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!u) return null;
    return {
      platform: "telegram",
      platformUserId: String(u.id),
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
      languageCode: u.language_code,
      photoUrl: u.photo_url,
    };
  }
  if (platform === "max") {
    const u = (window.WebApp as { initDataUnsafe?: { user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string } } })?.initDataUnsafe?.user;
    if (!u) return null;
    return {
      platform: "max",
      platformUserId: String(u.id),
      firstName: u.first_name,
      lastName: u.last_name,
      username: u.username,
      languageCode: u.language_code,
      photoUrl: u.photo_url,
    };
  }
  if (platform === "vk") {
    // VK передаёт user в другом формате — упрощённо
    return { platform: "vk", platformUserId: "" };
  }
  return null;
}

/** Тема из платформы (Telegram themeParams / colorScheme). */
export function getPlatformTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const tg = window.Telegram?.WebApp;
  if (tg?.colorScheme === "dark") return "dark";
  if (tg?.themeParams?.bg_color) {
    const hex = tg.themeParams.bg_color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5 ? "dark" : "light";
  }
  return "light";
}

/** Сообщает платформе, что приложение готово. */
export function ready(): void {
  if (typeof window === "undefined") return;
  window.Telegram?.WebApp?.ready();
  window.WebApp?.ready();
}

/** Показать кнопку «Назад». */
export function showBackButton(onClick: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const cleanup = () => {
    window.Telegram?.WebApp?.BackButton?.offClick?.(onClick);
    window.Telegram?.WebApp?.BackButton?.hide?.();
    (window.WebApp as { BackButton?: { offClick: (cb: () => void) => void; hide: () => void } })?.BackButton?.offClick?.(onClick);
    (window.WebApp as { BackButton?: { hide: () => void } })?.BackButton?.hide?.();
  };
  window.Telegram?.WebApp?.BackButton?.onClick?.(onClick);
  window.Telegram?.WebApp?.BackButton?.show?.();
  (window.WebApp as { BackButton?: { onClick: (cb: () => void) => void; show: () => void } })?.BackButton?.onClick?.(onClick);
  (window.WebApp as { BackButton?: { show: () => void } })?.BackButton?.show?.();
  return cleanup;
}

/** Скрыть кнопку «Назад». */
export function hideBackButton(): void {
  if (typeof window === "undefined") return;
  window.Telegram?.WebApp?.BackButton?.hide?.();
  (window.WebApp as { BackButton?: { hide: () => void } })?.BackButton?.hide?.();
}

/** Тактильная обратная связь (добавление в корзину, клик). */
export function hapticImpact(style: "light" | "medium" | "heavy" = "light"): void {
  if (typeof window === "undefined") return;
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
    (window.WebApp as { HapticFeedback?: { impactOccurred: (s: string) => void } })?.HapticFeedback?.impactOccurred?.(style);
  } catch {
    // fallback: нативный vibrate если есть
    navigator.vibrate?.(10);
  }
}

/** Haptic при успехе (оформление заказа и т.п.). */
export function hapticSuccess(): void {
  if (typeof window === "undefined") return;
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.("success");
    (window.WebApp as { HapticFeedback?: { notificationOccurred: (s: string) => void } })?.HapticFeedback?.notificationOccurred?.("success");
  } catch {
    navigator.vibrate?.(20);
  }
}

/** Haptic при смене выбора. */
export function hapticSelection(): void {
  if (typeof window === "undefined") return;
  try {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.();
    (window.WebApp as { HapticFeedback?: { selectionChanged: () => void } })?.HapticFeedback?.selectionChanged?.();
  } catch {
    navigator.vibrate?.(5);
  }
}

/** Шеринг: shareToStory (TG) / shareContent (MAX) / Web Share API (fallback). */
export async function shareContent(text: string, link?: string, mediaUrl?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const platform = detectPlatform();
  try {
    if (platform === "telegram" && window.Telegram?.WebApp?.shareToStory && mediaUrl) {
      window.Telegram.WebApp.shareToStory(mediaUrl, { text, widget_link: link ? { url: link, name: text.slice(0, 48) } : undefined });
      return true;
    }
    if (platform === "max" && window.WebApp?.shareContent) {
      await window.WebApp.shareContent({ text, link });
      return true;
    }
    if (platform === "max" && (window.WebApp as { shareMaxContent?: (o: { text?: string; link?: string }) => Promise<unknown> })?.shareMaxContent) {
      await (window.WebApp as { shareMaxContent: (o: { text?: string; link?: string }) => Promise<unknown> }).shareMaxContent({ text, link });
      return true;
    }
    if (platform === "vk" && window.VK?.Bridge?.send) {
      await window.VK.Bridge.send("VKWebAppShare", { link: link ?? window.location.href });
      return true;
    }
    if (navigator.share) {
      await navigator.share({
        title: text.slice(0, 80),
        text,
        url: link ?? window.location.href,
      });
      return true;
    }
  } catch {
    // пользователь отменил или ошибка
  }
  return false;
}

/** Добавить на главный экран (только Telegram). */
export function addToHomeScreen(): void {
  if (typeof window === "undefined") return;
  const tg = window.Telegram?.WebApp;
  if (tg?.addToHomeScreen && typeof tg.addToHomeScreen === "function") {
    tg.addToHomeScreen();
  }
}

/** Есть ли addToHomeScreen. */
export function hasAddToHomeScreen(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.Telegram?.WebApp?.addToHomeScreen === "function";
}

/** CloudStorage / DeviceStorage — сохранить. */
export async function storageSet(tenantId: string, key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;
  const fullKey = `rd_${tenantId}_${key}`;
  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.CloudStorage?.setItem) {
      return new Promise((res, rej) => {
        tg.CloudStorage!.setItem(fullKey, value, (err) => (err ? rej(err) : res()));
      });
    }
    const maxStorage = (window.WebApp as { DeviceStorage?: { setItem: (k: string, v: string) => void } })?.DeviceStorage;
    if (maxStorage?.setItem) {
      maxStorage.setItem(fullKey, value);
      return;
    }
  } catch {
    // fallback на localStorage
  }
  try {
    localStorage.setItem(fullKey, value);
  } catch {
    // ignore
  }
}

/** CloudStorage / DeviceStorage — получить. */
export async function storageGet(tenantId: string, key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const fullKey = `rd_${tenantId}_${key}`;
  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.CloudStorage?.getItem) {
      return new Promise((res) => {
        tg.CloudStorage!.getItem(fullKey, (_, v) => res(v ?? null));
      });
    }
    const maxStorage = (window.WebApp as { DeviceStorage?: { getItem: (k: string, cb: (e: unknown, v?: string) => void) => void } })?.DeviceStorage;
    if (maxStorage?.getItem) {
      return new Promise((res) => {
        maxStorage.getItem!(fullKey, (_, v) => res(v ?? null));
      });
    }
  } catch {
    // fallback
  }
  try {
    return localStorage.getItem(fullKey);
  } catch {
    return null;
  }
}
