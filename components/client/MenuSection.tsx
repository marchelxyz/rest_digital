"use client";

import { useState } from "react";
import { useCartStore } from "./cart-store";
import { ProductModifierDialog } from "./ProductModifierDialog";
import type { ModifierGroup } from "./ProductModifierDialog";

type ModifierGroupInput = Omit<ModifierGroup, "type"> & { type: string };

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  oldPrice?: number;
  imageUrl?: string | null;
  weight?: string | null;
  volume?: string | null;
  badges?: string[];
  modifierGroups?: ModifierGroupInput[];
};

type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  products: Product[];
};

export function MenuSection({
  category,
  primaryColor,
  borderRadius,
  layout = "grid",
}: {
  category: Category;
  primaryColor: string;
  borderRadius: number;
  layout?: "grid" | "list" | "carousel";
}) {
  const { addItem } = useCartStore();
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);

  const isGrid = layout === "grid";

  function handleAddClick(p: Product) {
    const hasModifiers = p.modifierGroups && p.modifierGroups.length > 0;
    if (hasModifiers) {
      setModifierProduct(p);
    } else {
      addItem(p.id, p.name, p.price);
    }
  }

  function handleModifierConfirm(
    finalPrice: number,
    selectedModifiers: { optionId: string; optionName: string; priceDelta: number; quantity?: number }[]
  ) {
    if (!modifierProduct) return;
    addItem(
      modifierProduct.id,
      modifierProduct.name,
      finalPrice,
      1,
      selectedModifiers.map((m) => ({
        optionId: m.optionId,
        optionName: m.optionName,
        priceDelta: m.priceDelta,
        quantity: m.quantity,
      }))
    );
    setModifierProduct(null);
  }

  return (
    <>
      <section className="py-4">
        <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
        <div className={isGrid ? "grid grid-cols-2 gap-3" : "space-y-3"}>
          {category.products.map((p) => (
            <div
              key={p.id}
              className={
                isGrid
                  ? "flex flex-col"
                  : "flex gap-3 p-3 rounded-xl border border-white/10 items-start"
              }
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className={
                    isGrid
                      ? "w-full aspect-square rounded-full object-cover"
                      : "w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  }
                />
              ) : (
                <div
                  className={
                    isGrid
                      ? "w-full aspect-square rounded-full bg-white/10"
                      : "w-20 h-20 rounded-lg bg-white/10 flex-shrink-0"
                  }
                />
              )}
              <div className={isGrid ? "mt-2" : "flex-1 min-w-0"}>
                <div className="font-medium text-sm">{p.name}</div>
                {p.badges && p.badges.length > 0 && (
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {p.badges.slice(0, 3).map((b) => (
                      <span
                        key={b}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/20"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                {p.description && (
                  <p
                    className={`text-xs opacity-80 ${
                      isGrid ? "line-clamp-2" : "truncate"
                    }`}
                  >
                    {p.description}
                  </p>
                )}
                <div
                  className={`flex items-center justify-between ${isGrid ? "mt-1" : "mt-1"}`}
                >
                  <span className="text-sm">
                    {p.oldPrice ? (
                      <>
                        <span className="line-through opacity-70">
                          {p.oldPrice} ₽
                        </span>{" "}
                        <span>{p.price} ₽</span>
                      </>
                    ) : (
                      `${p.price} ₽`
                    )}
                    {p.modifierGroups && p.modifierGroups.length > 0 && (
                      <span className="text-xs opacity-70 ml-1">+ допы</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddClick(p)}
                    className="px-3 py-1 rounded-lg text-white text-sm font-medium"
                    style={{
                      backgroundColor: primaryColor,
                      borderRadius,
                    }}
                  >
                    {isGrid ? "+" : "В корзину"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {modifierProduct && modifierProduct.modifierGroups && (
        <ProductModifierDialog
          productName={modifierProduct.name}
          basePrice={modifierProduct.price}
          modifierGroups={modifierProduct.modifierGroups as ModifierGroup[]}
          primaryColor={primaryColor}
          borderRadius={borderRadius}
          onConfirm={handleModifierConfirm}
          onClose={() => setModifierProduct(null)}
        />
      )}
    </>
  );
}
