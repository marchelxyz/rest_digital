"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { getBadgeStyle } from "./badge-colors";
import { useCartStore } from "./cart-store";
import { ProductDetailModal } from "./ProductDetailModal";
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

function ProductCard({
  product,
  primaryColor,
  borderRadius,
  onClick,
  layout,
}: {
  product: Product;
  primaryColor: string;
  borderRadius: number;
  onClick: () => void;
  layout: "grid" | "list" | "carousel";
}) {
  const hasModifiers = product.modifierGroups && product.modifierGroups.length > 0;
  const priceLabel = hasModifiers ? `от ${product.price} ₽` : `${product.price} ₽`;

  if (layout === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex gap-3 p-3 rounded-xl border border-white/10 items-center text-left hover:bg-white/5 transition-colors"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            style={{ borderRadius: borderRadius + 4 }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-xl bg-white/10 flex-shrink-0"
            style={{ borderRadius: borderRadius + 4 }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium">{product.name}</div>
          {product.weight && (
            <div className="text-xs text-muted-foreground">{product.weight}</div>
          )}
          {product.description && (
            <p className="text-xs opacity-80 truncate mt-0.5">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-medium">{priceLabel}</span>
            <ChevronRight size={18} className="opacity-60" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col w-full text-left bg-muted/30 rounded-2xl overflow-hidden hover:bg-muted/50 transition-colors"
      style={{ borderRadius: borderRadius + 8 }}
    >
      <div className="relative w-full aspect-square overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/10" />
        )}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {product.badges.slice(0, 2).map((b) => (
              <span
                key={b}
                className="text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm"
                style={getBadgeStyle(b)}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="font-medium text-sm">{product.name}</div>
        {product.weight && (
          <div className="text-xs text-muted-foreground mt-0.5">{product.weight}</div>
        )}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
        )}
        <div
          className="mt-2 flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-muted/50"
          style={{ borderRadius }}
        >
          <span className="text-sm font-medium">{priceLabel}</span>
          <ChevronRight size={18} className="opacity-60 shrink-0" />
        </div>
      </div>
    </button>
  );
}

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
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  function handleCardClick(p: Product) {
    setDetailProduct(p);
  }

  function handleAddToCart(
    finalPrice: number,
    selectedModifiers: { optionId: string; optionName: string; priceDelta: number; quantity?: number }[]
  ) {
    if (!detailProduct) return;
    addItem(
      detailProduct.id,
      detailProduct.name,
      finalPrice,
      1,
      selectedModifiers.map((m) => ({
        optionId: m.optionId,
        optionName: m.optionName,
        priceDelta: m.priceDelta,
        quantity: m.quantity,
      }))
    );
    setDetailProduct(null);
  }

  const isGrid = layout === "grid";
  const isCarousel = layout === "carousel";

  return (
    <>
      <section className="py-4">
        <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
        <div
          className={
            isCarousel
              ? "flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory"
              : isGrid
                ? "grid grid-cols-2 md:grid-cols-3 gap-3"
                : "space-y-2"
          }
        >
          {category.products.map((p) => (
            <div
              key={p.id}
              className={
                isCarousel
                  ? "shrink-0 w-[280px] snap-center"
                  : isGrid
                    ? ""
                    : ""
              }
            >
              <ProductCard
                product={p}
                primaryColor={primaryColor}
                borderRadius={borderRadius}
                onClick={() => handleCardClick(p)}
                layout={layout}
              />
            </div>
          ))}
        </div>
      </section>

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          primaryColor={primaryColor}
          borderRadius={borderRadius}
          onAddToCart={handleAddToCart}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </>
  );
}
