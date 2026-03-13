"use client";

import { useState, useEffect } from "react";
import { Home, User, Menu, ShoppingCart, ListFilter } from "lucide-react";
import { CartStore, useCartStore } from "@/components/client/cart-store";
import { ClientHomeTab } from "./ClientHomeTab";
import { ClientProfileTab } from "./ClientProfileTab";
import { ClientInfoTab } from "./ClientInfoTab";
import { CartDrawer } from "./CartDrawer";
import type { OrderType } from "./ClientHomeTab";

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
}: {
  settings: Settings;
  stories: Story[];
  categories: Category[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [cartOpen, setCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("PICKUP");
  const [isMobile, setIsMobile] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all" | "popular">("all");
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cartBarHeight = activeTab === "home" ? "3.5rem" : "0";
  const safeAreaStyles = isMobile
    ? {
        root: {
          paddingTop: 72,
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

  return (
    <CartStore tenantId={settings.tenantId}>
      <div
        className="min-h-screen"
        style={{
          background: settings.theme === "dark" ? "#1a1a1a" : "#f8fafc",
          color: settings.theme === "dark" ? "#fff" : "#171717",
          ...safeAreaStyles.root,
        }}
      >
        {activeTab === "home" && (
          <ClientHomeTab
            settings={settings}
            stories={stories}
            categories={categories}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
            onCartClick={() => setCartOpen(true)}
            onProfileClick={() => setActiveTab("profile")}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            selectedBadge={selectedBadge}
          />
        )}
        {activeTab === "profile" && <ClientProfileTab settings={settings} />}
        {activeTab === "info" && <ClientInfoTab settings={settings} />}

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          settings={settings}
          categories={categories}
          orderType={orderType}
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
            selectedBadge={selectedBadge}
            onBadgeChange={setSelectedBadge}
            filterOpen={filterOpen}
            onFilterToggle={() => setFilterOpen((v) => !v)}
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
    </CartStore>
  );
}

function CartBar({
  settings,
  categories,
  onCartClick,
  selectedCategoryId,
  onCategoryChange,
  selectedBadge,
  onBadgeChange,
  filterOpen,
  onFilterToggle,
}: {
  settings: Settings;
  categories: Category[];
  onCartClick: () => void;
  selectedCategoryId: string | "all" | "popular";
  onCategoryChange: (id: string | "all" | "popular") => void;
  selectedBadge: string | null;
  onBadgeChange: (badge: string | null) => void;
  filterOpen: boolean;
  onFilterToggle: () => void;
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
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium min-w-0"
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
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onFilterToggle}
            className="w-12 h-12 rounded-xl border bg-background flex items-center justify-center"
            style={{ borderRadius: settings.borderRadius + 4 }}
            aria-label="Фильтр меню"
          >
            <ListFilter size={22} strokeWidth={2} />
          </button>
          {filterOpen && (
            <>
              <div
                className="fixed inset-0 z-[45]"
                aria-hidden
                onClick={onFilterToggle}
              />
              <div
                className="absolute bottom-full right-0 mb-2 w-52 max-h-80 overflow-y-auto rounded-xl border bg-background shadow-lg z-50 py-2"
                style={{ borderRadius: settings.borderRadius + 4 }}
              >
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Категории
                </div>
                <button
                  type="button"
                  onClick={() => onCategoryChange("all")}
                  className={`w-full px-4 py-2 text-left text-sm ${
                    selectedCategoryId === "all" ? "font-medium bg-muted/50" : ""
                  }`}
                >
                  Все
                </button>
                {settings.showPopular && (
                  <button
                    type="button"
                    onClick={() => onCategoryChange("popular")}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      selectedCategoryId === "popular" ? "font-medium bg-muted/50" : ""
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
                    className={`w-full px-4 py-2 text-left text-sm ${
                      selectedCategoryId === c.id ? "font-medium bg-muted/50" : ""
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                {allBadges.length > 0 && (
                  <>
                    <div className="my-2 border-t" />
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Подкатегории
                    </div>
                    <button
                      type="button"
                      onClick={() => onBadgeChange(null)}
                      className={`w-full px-4 py-2 text-left text-sm ${
                        selectedBadge === null ? "font-medium bg-muted/50" : ""
                      }`}
                    >
                      Все
                    </button>
                    {allBadges.map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => onBadgeChange(badge)}
                        className={`w-full px-4 py-2 text-left text-sm ${
                          selectedBadge === badge ? "font-medium bg-muted/50" : ""
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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
      className={`flex-1 px-2 flex items-center justify-center ${
        isMobile ? "py-3" : "py-2"
      } ${active ? "opacity-100" : "opacity-60"}`}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}
