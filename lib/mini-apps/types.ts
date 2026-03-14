/**
 * Типы для унифицированного слоя мини-приложений (Telegram, VK, MAX).
 */

export type MiniAppPlatform = "telegram" | "vk" | "max" | "standalone";

export type GuestProfile = {
  platform: MiniAppPlatform;
  platformUserId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
};

export type ThemeMode = "light" | "dark";
