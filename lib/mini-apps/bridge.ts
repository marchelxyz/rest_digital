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
    vkBridge?: {
      send: (method: string, params?: object) => Promise<Record<string, unknown>>;
    };
    WebApp?: {
      initData: string;
      initDataUnsafe?: {
        user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string; photo_url?: string };
        start_param?: unknown;
        startapp?: unknown;
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

/** VK передаёт vk_user_id и vk_app_id в URL query. */
function _isVkFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("vk_user_id") || params.has("vk_app_id");
}

/**
 * Определяет платформу по document.referrer (кто загрузил iframe).
 * Надёжнее SDK-объектов: не зависит от загрузки скриптов.
 */
function _detectFromReferrer(): MiniAppPlatform | null {
  if (typeof document === "undefined") return null;
  const ref = (document.referrer ?? "").toLowerCase();
  if (ref.includes("max.ru")) return "max";
  if (ref.includes("vk.com") || ref.includes("vk.ru")) return "vk";
  if (ref.includes("telegram.org") || ref.includes("t.me")) return "telegram";
  return null;
}

/**
 * Определяет платформу. Приоритет:
 * 1. serverHint (HTTP Referer на сервере)
 * 2. document.referrer (iframe referrer на клиенте)
 * 3. URL-параметры (WebAppPlatform, vk_user_id)
 * 4. SDK-объекты (window.WebApp, window.Telegram.WebApp, window.vkBridge)
 */
export function detectPlatform(enabled?: EnabledMessengers, serverHint?: MiniAppPlatform): MiniAppPlatform {
  if (typeof window === "undefined") return "standalone";
  const useTg = enabled?.telegram !== false;
  const useVk = enabled?.vk !== false;
  const useMax = enabled?.max !== false;

  const fromRef = _detectFromReferrer();

  console.log("[miniapps] detectPlatform signals", {
    serverHint: serverHint ?? null,
    documentReferrer: fromRef,
    isMaxFromUrl: isMaxFromUrl(),
    isVkFromUrl: _isVkFromUrl(),
    hasWindowWebApp: !!window.WebApp,
    hasTgWebApp: !!window.Telegram?.WebApp,
    hasVkBridge: !!(window.vkBridge || window.VK?.Bridge),
    rawReferrer: (typeof document !== "undefined" ? document.referrer : "").slice(0, 60),
  });

  if (serverHint === "max" && useMax) return "max";
  if (serverHint === "telegram" && useTg) return "telegram";
  if (serverHint === "vk" && useVk) return "vk";

  if (fromRef === "max" && useMax) return "max";
  if (fromRef === "vk" && useVk) return "vk";
  if (fromRef === "telegram" && useTg) return "telegram";

  if (useMax && isMaxFromUrl()) return "max";
  if (useVk && _isVkFromUrl()) return "vk";

  if (useMax && window.WebApp) return "max";
  if (useTg && window.Telegram?.WebApp) return "telegram";
  if (useVk && (window.vkBridge || window.VK?.Bridge)) return "vk";
  return "standalone";
}

type InitDataUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

type InitDataLike = {
  user?: InitDataUser;
  start_param?: unknown;
  startapp?: unknown;
};

/**
 * Извлекает initData для MAX из всех доступных источников.
 * max-web-app.js может не загрузиться → window.WebApp отсутствует.
 * telegram-web-app.js в MAX-среде может получить данные через Telegram-совместимый
 * протокол postMessage. Также пробуем парсинг tgWebAppData / WebAppData из URL hash.
 */
function _getMaxInitData(): InitDataLike | null {
  if (typeof window === "undefined") return null;

  const maxInit = window.WebApp?.initDataUnsafe;
  if (maxInit?.user) {
    console.log("[miniapps] _getMaxInitData: window.WebApp", { userId: maxInit.user.id });
    return maxInit as InitDataLike;
  }

  const tgInit = window.Telegram?.WebApp?.initDataUnsafe;
  if (tgInit?.user) {
    console.log("[miniapps] _getMaxInitData: window.Telegram.WebApp fallback", { userId: tgInit.user.id });
    return tgInit as InitDataLike;
  }

  const fromUrl = _parseInitDataFromUrl();
  if (fromUrl) {
    console.log("[miniapps] _getMaxInitData: URL hash fallback", { userId: (fromUrl.user as InitDataUser | undefined)?.id });
    return fromUrl;
  }

  console.log("[miniapps] _getMaxInitData: NO initData", {
    hasWindowWebApp: !!window.WebApp,
    hasTgWebApp: !!window.Telegram?.WebApp,
    tgInitDataKeys: tgInit ? Object.keys(tgInit) : null,
    hash: window.location.hash?.slice(0, 100),
    search: window.location.search?.slice(0, 100),
  });
  return null;
}

/**
 * Парсит initData из URL hash (tgWebAppData или WebAppData).
 * MAX и Telegram передают данные в hash при открытии iframe.
 */
function _parseInitDataFromUrl(): InitDataLike | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  try {
    const outer = new URLSearchParams(hash);
    const raw = outer.get("tgWebAppData") ?? outer.get("WebAppData");
    if (!raw) return null;
    const inner = new URLSearchParams(raw);
    const userJson = inner.get("user");
    const user = userJson ? (JSON.parse(userJson) as InitDataUser) : undefined;
    const startParam = inner.get("start_param") ?? inner.get("startapp") ?? undefined;
    return { user, start_param: startParam };
  } catch {
    return null;
  }
}

/** Возвращает профиль гостя из initData (если доступен). */
export function getProfile(enabled?: EnabledMessengers, serverHint?: MiniAppPlatform): GuestProfile | null {
  if (typeof window === "undefined") return null;
  const platform = detectPlatform(enabled, serverHint);
  console.log("[miniapps] getProfile", { platform, serverHint });
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
    const initData = _getMaxInitData();
    const u = initData?.user;
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
    const params = new URLSearchParams(window.location.search);
    const vkUserId = params.get("vk_user_id");
    if (!vkUserId) return null;
    return {
      platform: "vk",
      platformUserId: vkUserId,
    };
  }
  return null;
}

function _normalizeStartParam(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    const asRec = v as Record<string, unknown>;
    const token = asRec.token;
    if (typeof token === "string") return token.trim() || null;
    const startParam = asRec.start_param;
    if (typeof startParam === "string") return startParam.trim() || null;
  }
  return null;
}

/**
 * Для MAX: читает startapp из URL (query или hash), т.к. платформа может
 * передавать payload только в URL при открытии мини‑аппы, а не в initDataUnsafe.
 */
function _getStartParamFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const search = new URLSearchParams(window.location.search);
  const fromQuery = search.get("startapp") ?? search.get("start_param");
  if (fromQuery?.trim()) return fromQuery.trim();
  try {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    const hashParams = new URLSearchParams(hash);
    const fromHash = hashParams.get("startapp") ?? hashParams.get("start_param");
    if (fromHash?.trim()) return fromHash.trim();
  } catch {
    // hash может быть не в формате key=value
  }
  return null;
}

/**
 * Возвращает start_param, переданный при открытии мини‑приложения.
 * Для MAX используется _getMaxInitData (с fallback на Telegram SDK и URL).
 */
export function getStartParam(enabled?: EnabledMessengers, serverHint?: MiniAppPlatform): string | null {
  if (typeof window === "undefined") return null;
  const platform = detectPlatform(enabled, serverHint);
  try {
    if (platform === "telegram") {
      const raw = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
      const normalized = _normalizeStartParam(raw);
      console.log("[miniapps] getStartParam telegram", {
        rawType: typeof raw,
        hasValue: !!raw,
        normalizedPrefix: normalized ? normalized.slice(0, 16) : null,
      });
      return normalized;
    }
    if (platform === "max") {
      const initData = _getMaxInitData();
      const fromInit =
        _normalizeStartParam(initData?.start_param) ?? _normalizeStartParam(initData?.startapp);
      const fromUrl = _getStartParamFromUrl();
      const normalized = fromInit ?? fromUrl;
      console.log("[miniapps] getStartParam max", {
        fromInit: !!fromInit,
        fromUrl: !!fromUrl,
        normalizedPrefix: normalized ? normalized.slice(0, 16) : null,
      });
      return normalized;
    }
    if (platform === "vk") {
      const hash = window.location.hash.replace(/^#/, "").trim();
      console.log("[miniapps] getStartParam vk", {
        hash: hash ? hash.slice(0, 20) : null,
      });
      return hash || null;
    }
  } catch (e) {
    console.log("[miniapps] getStartParam error", { platform, error: String(e) });
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
  window.vkBridge?.send("VKWebAppInit").catch(() => {});
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

function _canUseTgCloudStorage(): boolean {
  const tg = window.Telegram?.WebApp;
  return !!(tg?.CloudStorage?.setItem && tg.isVersionAtLeast?.("6.9"));
}

/** CloudStorage / DeviceStorage — сохранить. */
export async function storageSet(tenantId: string, key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;
  const fullKey = `rd_${tenantId}_${key}`;
  try {
    if (_canUseTgCloudStorage()) {
      const tg = window.Telegram!.WebApp!;
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
    if (_canUseTgCloudStorage()) {
      const tg = window.Telegram!.WebApp!;
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
