"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  detectPlatform,
  getProfile,
  getPlatformTheme,
  ready,
  showBackButton,
  hideBackButton,
  hapticImpact,
  hapticSuccess,
  hapticSelection,
  shareContent,
  addToHomeScreen,
  hasAddToHomeScreen,
  storageSet,
  storageGet,
} from "@/lib/mini-apps/bridge";
import type { MiniAppPlatform, ThemeMode } from "@/lib/mini-apps/types";
import type { EnabledMessengers } from "@/lib/mini-apps/bridge";

const STORAGE_THEME_KEY = "theme_preference";

type MiniAppContextValue = {
  platform: MiniAppPlatform;
  profile: ReturnType<typeof getProfile>;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  isMiniApp: boolean;
  showBack: (onClick: () => void) => () => void;
  hideBack: typeof hideBackButton;
  haptic: { impact: typeof hapticImpact; success: typeof hapticSuccess; selection: typeof hapticSelection };
  share: typeof shareContent;
  addToHome: typeof addToHomeScreen;
  canAddToHome: boolean;
  storage: { set: typeof storageSet; get: typeof storageGet };
};

const MiniAppContext = createContext<MiniAppContextValue | null>(null);

/**
 * Провайдер мини-приложения: тема (приоритет админки, затем themeParams, затем переключатель),
 * bridge-методы, storage.
 */
export function MiniAppProvider({
  children,
  tenantId,
  adminTheme,
  enabledMessengers,
}: {
  children: ReactNode;
  tenantId: string;
  adminTheme: "light" | "dark" | "auto";
  enabledMessengers?: EnabledMessengers;
}) {
  const platform = detectPlatform(enabledMessengers);
  const isMiniApp = platform !== "standalone";
  const [effectiveTheme, setEffectiveTheme] = useState<ThemeMode>("light");
  const [userThemeOverride, setUserThemeOverride] = useState<ThemeMode | null>(null);

  const profile = useMemo(() => getProfile(enabledMessengers), [enabledMessengers]);

  useEffect(() => {
    ready();
  }, []);

  const resolveTheme = useCallback((): ThemeMode => {
    if (adminTheme === "light") return "light";
    if (adminTheme === "dark") return "dark";
    if (userThemeOverride) return userThemeOverride;
    return getPlatformTheme();
  }, [adminTheme, userThemeOverride]);

  useEffect(() => {
    setEffectiveTheme(resolveTheme());
  }, [resolveTheme]);

  const setTheme = useCallback(
    async (t: ThemeMode) => {
      setUserThemeOverride(t);
      await storageSet(tenantId, STORAGE_THEME_KEY, t);
    },
    [tenantId]
  );

  useEffect(() => {
    let cancelled = false;
    storageGet(tenantId, STORAGE_THEME_KEY).then((v) => {
      if (!cancelled && v && (v === "light" || v === "dark")) {
        setUserThemeOverride(v);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const value: MiniAppContextValue = useMemo(
    () => ({
      platform,
      profile,
      theme: effectiveTheme,
      setTheme,
      isMiniApp,
      showBack: showBackButton,
      hideBack: hideBackButton,
      haptic: { impact: hapticImpact, success: hapticSuccess, selection: hapticSelection },
      share: shareContent,
      addToHome: addToHomeScreen,
      canAddToHome: hasAddToHomeScreen(),
      storage: { set: storageSet, get: storageGet },
    }),
    [platform, profile, effectiveTheme, setTheme, isMiniApp]
  );

  return (
    <MiniAppContext.Provider value={value}>
      {children}
    </MiniAppContext.Provider>
  );
}

export function useMiniApp(): MiniAppContextValue {
  const ctx = useContext(MiniAppContext);
  if (!ctx) {
    return {
      platform: "standalone",
      profile: null,
      theme: "light",
      setTheme: () => {},
      isMiniApp: false,
      showBack: () => () => {},
      hideBack: () => {},
      haptic: { impact: () => {}, success: () => {}, selection: () => {} },
      share: async () => false,
      addToHome: () => {},
      canAddToHome: false,
      storage: {
        set: async () => {},
        get: async () => null,
      },
    };
  }
  return ctx;
}
