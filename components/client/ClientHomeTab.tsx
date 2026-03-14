"use client";

import { MapPin, ShoppingCart, ChevronRight, Coins, Gift } from "lucide-react";
import { useCartStore } from "./cart-store";
import { MenuSection } from "./MenuSection";
import { StoriesStrip } from "./StoriesStrip";
import { ForYouSection } from "./ForYouSection";
import type { Settings, Category, Story, ForYouProduct } from "./ClientApp";

export type OrderType = "PICKUP" | "DINE_IN";

export function ClientHomeTab({
  settings,
  categories,
  stories,
  orderType,
  onOrderTypeChange,
  onCartClick,
  onProfileClick,
  selectedCategoryId,
  onCategoryChange,
  selectedBadges,
  forYouProducts,
  lastOrder,
}: {
  settings: Settings;
  categories: Category[];
  stories: Story[];
  orderType: OrderType;
  onOrderTypeChange: (t: OrderType) => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  selectedCategoryId: string | "all" | "popular";
  onCategoryChange: (id: string | "all" | "popular") => void;
  selectedBadges: string[];
  forYouProducts?: ForYouProduct[];
  lastOrder?: {
    items: { productId: string; name: string; price: number; quantity: number; modifiers?: unknown[] }[];
    totalAmount: number;
  } | null;
}) {
  const { items } = useCartStore();
  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const categoriesWithProducts = categories.filter((c) => c.products.length > 0);
  const baseCategories =
    selectedCategoryId === "all"
      ? categoriesWithProducts
      : selectedCategoryId === "popular"
        ? categoriesWithProducts
        : categoriesWithProducts.filter((c) => c.id === selectedCategoryId);

  const filteredCategories =
    selectedBadges.length > 0
      ? baseCategories
          .map((cat) => ({
            ...cat,
            products: cat.products.filter((p) =>
              selectedBadges.some((b) => p.badges?.includes(b)),
            ),
          }))
          .filter((cat) => cat.products.length > 0)
      : baseCategories;

  return (
    <>
      <header className="bg-inherit border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt=""
                className="w-10 h-10 object-cover shrink-0"
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
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
          appName={settings.appName}
        />
      )}

      {(forYouProducts?.length || lastOrder) && (
        <ForYouSection
          forYouProducts={forYouProducts ?? []}
          lastOrder={lastOrder}
          primaryColor={settings.primaryColor}
          borderRadius={settings.borderRadius}
        />
      )}

      <div className="flex gap-2 px-4 pb-3 overflow-x-auto border-b">
        <CategoryChip
          label="Все"
          active={selectedCategoryId === "all"}
          onClick={() => onCategoryChange("all")}
        />
        {settings.showPopular && (
          <CategoryChip
            label="Популярное"
            active={selectedCategoryId === "popular"}
            onClick={() => onCategoryChange("popular")}
          />
        )}
        {categoriesWithProducts.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.name}
            active={selectedCategoryId === c.id}
            onClick={() => onCategoryChange(c.id)}
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
      className={`shrink-0 px-4 py-2 rounded-full text-sm transition-all duration-200 active:scale-95 ${active ? "font-medium" : "opacity-70 hover:opacity-90"}`}
    >
      {label}
    </button>
  );
}
