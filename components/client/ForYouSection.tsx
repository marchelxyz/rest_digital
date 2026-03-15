"use client";

import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { useCartStore } from "./cart-store";
import { useMiniApp } from "./MiniAppProvider";
import { ProductDetailModal } from "./ProductDetailModal";
import type { ForYouProduct } from "./ClientApp";

type ForYouSectionProps = {
  forYouProducts: ForYouProduct[];
  lastOrder: {
    items: { productId: string; name: string; price: number; quantity: number; modifiers?: unknown[] }[];
    totalAmount: number;
  } | null | undefined;
  primaryColor: string;
  borderRadius: number;
};

function hasModifiers(p: ForYouProduct): boolean {
  return !!(p.modifierGroups && p.modifierGroups.length > 0);
}

export function ForYouSection({
  forYouProducts,
  lastOrder,
  primaryColor,
  borderRadius,
}: ForYouSectionProps) {
  const { addItem } = useCartStore();
  const { haptic } = useMiniApp();
  const [detailProduct, setDetailProduct] = useState<ForYouProduct | null>(null);

  function handleCardClick(p: ForYouProduct) {
    haptic.selection();
    setDetailProduct(p);
  }

  function handleRepeatOrder() {
    if (!lastOrder?.items.length) return;
    haptic.impact("medium");
    for (const item of lastOrder.items) {
      addItem(item.productId, item.name, item.price, item.quantity, item.modifiers as { optionId: string; optionName: string; priceDelta: number; quantity?: number }[]);
    }
  }

  function handleAddToCart(
    finalPrice: number,
    selectedModifiers: { optionId: string; optionName: string; priceDelta: number; quantity?: number }[]
  ) {
    if (!detailProduct) return;
    haptic.impact("medium");
    addItem(detailProduct.id, detailProduct.name, finalPrice, 1, selectedModifiers);
    setDetailProduct(null);
  }

  const hasContent = forYouProducts.length > 0 || lastOrder;

  if (!hasContent) return null;

  return (
    <div className="px-4 py-3">
      <h2 className="text-lg font-semibold mb-3">Для вас</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {lastOrder && (
          <button
            type="button"
            onClick={handleRepeatOrder}
            className="shrink-0 w-[160px] flex flex-col rounded-xl border overflow-hidden text-left hover:opacity-90 transition-opacity"
            style={{ borderRadius: borderRadius + 4 }}
          >
            <div
              className="w-full aspect-square flex items-center justify-center"
              style={{ backgroundColor: primaryColor + "20" }}
            >
              <RotateCcw size={32} style={{ color: primaryColor }} />
            </div>
            <div className="p-3 border-t bg-background">
              <div className="font-medium text-sm">Повторить заказ</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {lastOrder.totalAmount} ₽
              </div>
            </div>
          </button>
        )}
        {forYouProducts.map((p) => {
          const hasMods = hasModifiers(p);
          const priceLabel = hasMods ? `от ${p.price} ₽` : `${p.price} ₽`;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleCardClick(p)}
              className="flex flex-col shrink-0 w-[160px] text-left bg-muted/30 rounded-2xl overflow-hidden hover:bg-muted/50 transition-colors"
              style={{ borderRadius: borderRadius + 8 }}
            >
              <div className="relative w-full aspect-square overflow-hidden">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="font-medium text-sm">{p.name}</div>
                {p.weight && (
                  <div className="text-xs text-muted-foreground mt-0.5">{p.weight}</div>
                )}
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
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
        })}
      </div>

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct as never}
          primaryColor={primaryColor}
          borderRadius={borderRadius}
          onAddToCart={handleAddToCart}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  );
}
