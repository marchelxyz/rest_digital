"use client";

import { useState } from "react";
import { MapPin, ShoppingCart, ChevronRight, Coins, Gift } from "lucide-react";
import { useCartStore } from "./cart-store";
import { MenuSection } from "./MenuSection";
import { StoriesStrip } from "./StoriesStrip";
import type { Settings, Category, Story } from "./ClientApp";

export type OrderType = "PICKUP" | "DINE_IN";

export function ClientHomeTab({
  settings,
  categories,
  stories,
  orderType,
  onOrderTypeChange,
  onCartClick,
  onProfileClick,
}: {
  settings: Settings;
  categories: Category[];
  stories: Story[];
  orderType: OrderType;
  onOrderTypeChange: (t: OrderType) => void;
  onCartClick: () => void;
  onProfileClick: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all" | "popular">("all");
  const { items } = useCartStore();
  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const filteredCategories =
    selectedCategoryId === "all"
      ? categories
      : selectedCategoryId === "popular"
        ? categories
        : categories.filter((c) => c.id === selectedCategoryId);

  return (
    <>
      <header className="sticky top-0 z-10 bg-inherit border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            ) : null}
            <button type="button" className="p-2 -ml-1" aria-label="Меню/локация">
              <MapPin size={22} strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={onCartClick}
            className="flex items-center gap-1 px-3 py-2 rounded-lg"
            style={{ backgroundColor: settings.primaryColor + "20", borderRadius: settings.borderRadius }}
          >
            <ShoppingCart size={20} strokeWidth={2} className="shrink-0" />
            {cartTotal > 0 ? `${cartTotal} ₽` : "Корзина"}
          </button>
        </div>

        {/* Order type: Самовывоз / В зале */}
        <div className="flex px-4 pb-3 gap-2 items-center">
          <button
            type="button"
            onClick={() => onOrderTypeChange("PICKUP")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              orderType === "PICKUP"
                ? "text-white"
                : "bg-muted/50 hover:bg-muted"
            }`}
            style={
              orderType === "PICKUP"
                ? { backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius }
                : { borderRadius: settings.borderRadius }
            }
          >
            Самовывоз
          </button>
          <button
            type="button"
            onClick={() => onOrderTypeChange("DINE_IN")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              orderType === "DINE_IN"
                ? "text-white"
                : "bg-muted/50 hover:bg-muted"
            }`}
            style={
              orderType === "DINE_IN"
                ? { backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius }
                : { borderRadius: settings.borderRadius }
            }
          >
            В зале
          </button>
        </div>

        <div className="px-4 pb-3">
          <input
            type="search"
            placeholder="Поиск товаров"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border bg-inherit"
          />
        </div>
      </header>

      {/* Hero banner: только на PC */}
      {settings.coverUrl && (
        <div className="hidden md:block px-4 py-3">
          <div
            className="w-full h-40 md:h-48 rounded-xl bg-cover bg-center"
            style={{
              backgroundImage: `url(${settings.coverUrl})`,
              borderRadius: settings.borderRadius + 4,
            }}
          />
        </div>
      )}

      {/* Loyalty teaser: основной цвет приложения (дублирует карту в профиле) */}
      {settings.showLoyalty && (
        <div className="px-4 mb-3 overflow-hidden">
          <button
            type="button"
            onClick={onProfileClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white transition-opacity hover:opacity-90 text-left"
            style={{
              backgroundColor: settings.primaryColor,
              borderRadius: settings.borderRadius + 4,
            }}
          >
          {settings.loyaltyType === "stamps" ? (
            <Gift size={24} className="shrink-0 opacity-90" />
          ) : (
            <Coins size={24} className="shrink-0 opacity-90" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold">
              {settings.loyaltyType === "stamps"
                ? "Собирайте штампы"
                : "Получать бонусы и скидки"}
            </div>
            <div className="text-sm opacity-80">
              {settings.loyaltyType === "stamps"
                ? `Авторизуйтесь, копите штампы — подарок за ${settings.loyaltyStampGoal} шт`
                : "Авторизуйтесь, чтобы копить и использовать баллы"}
            </div>
          </div>
          <ChevronRight size={20} className="shrink-0 opacity-70" />
          </button>
        </div>
      )}

      {settings.showStories && stories.length > 0 && (
        <StoriesStrip
          stories={stories}
          primaryColor={settings.primaryColor}
          borderRadius={settings.borderRadius}
        />
      )}

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto border-b">
        <CategoryChip
          label="Все"
          active={selectedCategoryId === "all"}
          onClick={() => setSelectedCategoryId("all")}
        />
        {settings.showPopular && (
          <CategoryChip
            label="Популярное"
            active={selectedCategoryId === "popular"}
            onClick={() => setSelectedCategoryId("popular")}
          />
        )}
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.name}
            active={selectedCategoryId === c.id}
            onClick={() => setSelectedCategoryId(c.id)}
          />
        ))}
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-4 md:pb-8">
        {filteredCategories.map((cat) => (
          <MenuSection
            key={cat.id}
            category={cat}
            primaryColor={settings.primaryColor}
            borderRadius={settings.borderRadius}
            layout={
              settings.menuLayout === "list" || settings.menuLayout === "carousel"
                ? settings.menuLayout
                : "grid"
            }
          />
        ))}
      </main>
    </>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm ${active ? "font-medium" : "opacity-70"}`}
    >
      {label}
    </button>
  );
}
