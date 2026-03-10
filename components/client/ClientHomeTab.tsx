"use client";

import { useState } from "react";
import { MapPin, ShoppingCart } from "lucide-react";
import { useCartStore } from "./cart-store";
import { MenuSection } from "./MenuSection";
import type { Settings, Category } from "./ClientApp";

export function ClientHomeTab({
  settings,
  categories,
  onCartClick,
}: {
  settings: Settings;
  categories: Category[];
  onCartClick: () => void;
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

      {settings.showStories && settings.coverUrl && (
        <div className="px-4 py-3">
          <div
            className="h-32 rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.coverUrl})` }}
          />
        </div>
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

      <main className="max-w-lg mx-auto px-4 pb-4">
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
