"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Home, User, Menu, ShoppingCart, ListFilter, Check } from "lucide-react";
import { CartStore, useCartStore } from "@/components/client/cart-store";
import { captureUtmFromUrl } from "@/lib/utm";
import { MiniAppProvider, useMiniApp } from "./MiniAppProvider";
import { ClientHomeTab } from "./ClientHomeTab";
import { ClientProfileTab } from "./ClientProfileTab";
import { ClientInfoTab } from "./ClientInfoTab";
import { CartDrawer } from "./CartDrawer";
import type { OrderType } from "./ClientHomeTab";

export type ForYouProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  weight?: string | null;
  description?: string | null;
  modifierGroups?: unknown[];
};

export type Settings = {
  tenantId: string;
  name: string;
  appName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  primaryColor: string;
  theme: string;
  showStories: boolean;
  showLoyalty: boolean;
  showPopular: boolean;
  menuLayout: string;
  borderRadius: number;
  loyaltyType: string;
  loyaltyStampGoal: number;
  loyaltyCashbackPct: number;
  loyaltyInteraction?: string;
  loyaltyCardGradientColors?: string | null;
  loyaltyCardGradientOpacity?: number;
  loyaltyCardGradientType?: string;
  messengerTelegram?: boolean;
  messengerVk?: boolean;
  messengerMax?: boolean;
  infoAddress?: string | null;
  infoHours?: string | null;
  infoPhone?: string | null;
  infoTermsUrl?: string | null;
  infoFaqUrl?: string | null;
  infoPartnerUrl?: string | null;
  infoCaloriesUrl?: string | null;
  infoContactText?: string | null;
  infoSocialInstagram?: string | null;
  infoSocialTelegram?: string | null;
  infoSocialVk?: string | null;
  infoAboutText?: string | null;
};

export type Story = {
  id: string;
  title: string;
  coverUrl?: string | null;
  mediaUrl: string;
  mediaType: string;
  linkUrl?: string | null;
};

export type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  products: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    oldPrice?: number;
    imageUrl?: string | null;
    weight?: string | null;
    volume?: string | null;
    badges?: string[];
    modifierGroups?: {
      id: string;
      name: string;
      type: string;
      isRequired: boolean;
      minSelect: number;
      maxSelect: number;
      options: { id: string; name: string; priceDelta: number }[];
    }[];
  }[];
};

type TabId = "home" | "profile" | "info";

export function ClientApp({
  settings,
  stories,
  categories,
  forYouProducts = [],
  adminTheme = "light",
}: {
  settings: Settings;
  stories: Story[];
  categories: Category[];
  forYouProducts?: ForYouProduct[];
  adminTheme?: "light" | "dark" | "auto";
}) {
  const enabledMessengers = useMemo(
    () => ({
      telegram: settings.messengerTelegram !== false,
      vk: settings.messengerVk !== false,
      max: settings.messengerMax !== false,
    }),
    [settings.messengerTelegram, settings.messengerVk, settings.messengerMax]
  );
  return (
    <MiniAppProvider tenantId={settings.tenantId} adminTheme={adminTheme} enabledMessengers={enabledMessengers}>
      <CartStore tenantId={settings.tenantId}>
        <ClientAppInner
          settings={settings}
          adminTheme={adminTheme}
          stories={stories}
          categories={categories}
          forYouProducts={forYouProducts}
        />
      </CartStore>
    </MiniAppProvider>
  );
}

function ClientAppInner({
  settings,
  stories,
  categories,
  forYouProducts,
  adminTheme,
}: {
  settings: Settings;
  stories: Story[];
  categories: Category[];
  forYouProducts: ForYouProduct[];
  adminTheme: "light" | "dark" | "auto";
}) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    captureUtmFromUrl();
  }, []);
  const [orderType, setOrderType] = useState<OrderType>("PICKUP");
  const [isMobile, setIsMobile] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all" | "popular">("all");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoriesAtTop, setCategoriesAtTop] = useState(true);

  useEffect(() => {
    if (filterOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [filterOpen]);
  const [lastOrder, setLastOrder] = useState<{
    items: { productId: string; name: string; price: number; quantity: number; modifiers?: unknown[] }[];
    totalAmount: number;
  } | null>(null);
  const { theme, showBack, hideBack, platform } = useMiniApp();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (activeTab !== "home") {
      const cleanup = showBack(() => setActiveTab("home"));
      return cleanup;
    }
    hideBack();
  }, [activeTab, showBack, hideBack]);

  const cartBarHeight = activeTab === "home" ? "3.5rem" : "0";
  const topPadding = platform === "max" ? 10 : 72;
  const safeAreaStyles = isMobile
    ? {
        root: {
          paddingTop: topPadding,
          paddingBottom: `calc(5rem + 20px + ${cartBarHeight})`,
        } as const,
        nav: { paddingBottom: 20 } as const,
      }
    : {
        root: {
          paddingTop: 0,
          paddingBottom: activeTab === "home" ? "calc(5rem + 3.5rem)" : "5rem",
        } as const,
        nav: { paddingBottom: 0 } as const,
      };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "dark" : ""}`}
      style={{
        background: isDark ? "#0f0f0f" : "#f8fafc",
        color: isDark ? "#fafafa" : "#171717",
        ...safeAreaStyles.root,
      }}
    >
        {activeTab === "home" && (
          <ClientHomeTab
            settings={settings}
            stories={stories}
            categories={categories}
            forYouProducts={forYouProducts}
            lastOrder={lastOrder}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
            onCartClick={() => setCartOpen(true)}
            onProfileClick={() => setActiveTab("profile")}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            selectedBadges={selectedBadges}
            onCategoriesAtTopChange={setCategoriesAtTop}
          />
        )}
        {activeTab === "profile" && <ClientProfileTab settings={settings} adminTheme={adminTheme} />}
        {activeTab === "info" && <ClientInfoTab settings={settings} />}

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          settings={settings}
          categories={categories}
          orderType={orderType}
          onOrderSuccess={(o) => setLastOrder(o)}
        />

        {activeTab === "home" && (
          <CartBar
            settings={settings}
            categories={categories}
            onCartClick={() => setCartOpen(true)}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={(id) => {
              setSelectedCategoryId(id);
            }}
            selectedBadges={selectedBadges}
            onBadgesChange={setSelectedBadges}
            filterOpen={filterOpen}
            onFilterToggle={() => setFilterOpen((v) => !v)}
            isMobile={isMobile}
            showFilterButton={categoriesAtTop}
          />
        )}

        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t bg-inherit md:max-w-2xl md:left-1/2 md:-translate-x-1/2 md:rounded-t-xl md:shadow-lg"
          style={safeAreaStyles.nav}
        >
          <div className="flex">
            <TabButton
              isMobile={isMobile}
              active={activeTab === "home"}
              icon={<Home size={24} strokeWidth={activeTab === "home" ? 2.5 : 2} />}
              ariaLabel="Главная"
              onClick={() => setActiveTab("home")}
            />
            <TabButton
              isMobile={isMobile}
              active={activeTab === "profile"}
              icon={<User size={24} strokeWidth={activeTab === "profile" ? 2.5 : 2} />}
              ariaLabel="Профиль"
              onClick={() => setActiveTab("profile")}
            />
            <TabButton
              isMobile={isMobile}
              active={activeTab === "info"}
              icon={<Menu size={24} strokeWidth={activeTab === "info" ? 2.5 : 2} />}
              ariaLabel="Информация"
              onClick={() => setActiveTab("info")}
            />
          </div>
        </nav>
      </div>
  );
}

function CartBar({
  settings,
  categories,
  onCartClick,
  selectedCategoryId,
  onCategoryChange,
  selectedBadges,
  onBadgesChange,
  filterOpen,
  onFilterToggle,
  isMobile,
  showFilterButton,
}: {
  settings: Settings;
  categories: Category[];
  onCartClick: () => void;
  selectedCategoryId: string | "all" | "popular";
  onCategoryChange: (id: string | "all" | "popular") => void;
  selectedBadges: string[];
  onBadgesChange: (badges: string[]) => void;
  filterOpen: boolean;
  onFilterToggle: () => void;
  isMobile: boolean;
  showFilterButton: boolean;
}) {
  const { items, total } = useCartStore();
  const hasItems = items.length > 0;
  const allBadges = [
    ...new Set(categories.flatMap((c) => c.products.flatMap((p) => p.badges ?? []))),
  ].sort();

  return (
    <div
      className="fixed left-0 right-0 z-30 px-4 pb-2 md:max-w-2xl md:left-1/2 md:-translate-x-1/2"
      style={{ bottom: "4.5rem" }}
    >
      <div className={`flex items-center gap-2 ${!hasItems ? "justify-end" : ""}`}>
        {hasItems && (
          <button
            type="button"
            onClick={onCartClick}
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium min-w-0 transition-transform duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: settings.primaryColor,
              borderRadius: settings.borderRadius + 4,
            }}
          >
            <ShoppingCart size={22} strokeWidth={2} className="shrink-0" />
            <span className="truncate">Корзина</span>
            <span className="shrink-0">{total} ₽</span>
          </button>
        )}
        {showFilterButton && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onFilterToggle}
            className="w-12 h-12 rounded-xl border bg-background flex items-center justify-center transition-all duration-200 active:scale-95"
            style={{ borderRadius: settings.borderRadius + 4 }}
            aria-label="Фильтр меню"
          >
            <ListFilter size={22} strokeWidth={2} />
          </button>
          {filterOpen && (
            <FilterSheet
              isMobile={isMobile}
              settings={settings}
              categories={categories}
              allBadges={allBadges}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={onCategoryChange}
              selectedBadges={selectedBadges}
              onBadgesChange={onBadgesChange}
              onClose={onFilterToggle}
            />
          )}
        </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bottom sheet (mobile) или popover (desktop) фильтра.
 * Секция «Фильтр» — чекбоксы бейджей.
 * Секция «Категории» — список выбора без чекбоксов.
 */
const FILTER_CLOSE_DURATION_MS = 280;

function FilterSheet({
  isMobile,
  settings,
  categories,
  allBadges,
  selectedCategoryId,
  onCategoryChange,
  selectedBadges,
  onBadgesChange,
  onClose,
}: {
  isMobile: boolean;
  settings: Settings;
  categories: Category[];
  allBadges: string[];
  selectedCategoryId: string | "all" | "popular";
  onCategoryChange: (id: string | "all" | "popular") => void;
  selectedBadges: string[];
  onBadgesChange: (badges: string[]) => void;
  onClose: () => void;
}) {
  const touchStartY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  function handleClose() {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, FILTER_CLOSE_DURATION_MS);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchMove(e: React.TouchEvent) {
    const y = e.touches[0].clientY;
    const delta = y - touchStartY.current;
    if (delta > 60 && sheetRef.current?.scrollTop === 0) {
      handleClose();
      e.preventDefault();
    }
  }

  const toggleBadge = (badge: string) => {
    if (selectedBadges.includes(badge)) {
      onBadgesChange(selectedBadges.filter((b) => b !== badge));
    } else {
      onBadgesChange([...selectedBadges, badge]);
    }
  };

  const content = (
    <>
      {/* Ручка для перетаскивания (только mobile) */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
      )}
      <h2 className="text-lg font-bold px-4 pt-2 pb-3">Фильтр</h2>
      {allBadges.length > 0 && (
        <div className="px-4 space-y-2 pb-4">
          {allBadges.map((badge) => (
            <label
              key={badge}
              className="flex items-center gap-3 py-2 cursor-pointer"
              onClick={() => toggleBadge(badge)}
            >
              <div
                role="checkbox"
                aria-checked={selectedBadges.includes(badge)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleBadge(badge);
                  }
                }}
                className="w-5 h-5 rounded border flex items-center justify-center shrink-0 border-input"
                style={
                  selectedBadges.includes(badge)
                    ? {
                        backgroundColor: settings.primaryColor,
                        borderColor: settings.primaryColor,
                        color: "#fff",
                      }
                    : {}
                }
              >
                {selectedBadges.includes(badge) && <Check size={12} strokeWidth={3} />}
              </div>
              <span className="text-sm">{badge}</span>
            </label>
          ))}
        </div>
      )}
      <h3 className="text-base font-bold px-4 pt-2 pb-3">Категории</h3>
      <div className="px-4 pb-6 space-y-0">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`w-full py-3 text-left text-sm rounded-lg ${
            selectedCategoryId === "all" ? "bg-muted/60 font-medium" : ""
          }`}
        >
          Все
        </button>
        {settings.showPopular && (
          <button
            type="button"
            onClick={() => onCategoryChange("popular")}
            className={`w-full py-3 text-left text-sm rounded-lg ${
              selectedCategoryId === "popular" ? "bg-muted/60 font-medium" : ""
            }`}
          >
            Популярное
          </button>
        )}
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(c.id)}
            className={`w-full py-3 text-left text-sm rounded-lg ${
              selectedCategoryId === c.id ? "bg-muted/60 font-medium" : ""
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </>
  );

  const desktopBaseTransform = "translateX(-50%)";
  const closingTransform = isMobile ? "translateY(100%)" : `translate(-50%, 100%)`;

  return (
    <>
      <div
        className="fixed inset-0 z-[45] bg-black/40 transition-opacity duration-200"
        style={{
          touchAction: "none",
          opacity: isClosing ? 0 : 1,
        }}
        aria-hidden
        onClick={handleClose}
      />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="fixed left-0 right-0 z-50 bg-background border-t shadow-xl overflow-y-auto overscroll-contain md:max-w-2xl md:left-1/2 md:-translate-x-1/2 transition-transform ease-out"
        style={{
          transitionDuration: `${FILTER_CLOSE_DURATION_MS}ms`,
          ...(isMobile
            ? {
                bottom: 0,
                maxHeight: "80dvh",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                transform: isClosing ? "translateY(100%)" : "none",
              }
            : {
                bottom: "calc(4.5rem + 3.5rem + 1rem)",
                maxHeight: "70vh",
                width: 280,
                left: "50%",
                transform: isClosing ? closingTransform : desktopBaseTransform,
                borderRadius: settings.borderRadius + 4,
                border: "1px solid hsl(var(--border))",
              }),
        }}
      >
        {content}
      </div>
    </>
  );
}

function TabButton({
  isMobile,
  active,
  icon,
  ariaLabel,
  onClick,
}: {
  isMobile: boolean;
  active: boolean;
  icon: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-2 flex items-center justify-center transition-all duration-200 ease-out active:scale-95 ${
        isMobile ? "py-3" : "py-2"
      } ${active ? "opacity-100" : "opacity-60 hover:opacity-80"}`}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}
