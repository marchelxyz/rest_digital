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
        {forYouProducts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleCardClick(p)}
            className="shrink-0 w-[160px] flex flex-col rounded-xl overflow-hidden text-left hover:opacity-90 transition-opacity"
            style={{ borderRadius: borderRadius + 4 }}
          >
            <div className="w-full aspect-square bg-muted overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" />
              )}
            </div>
            <div className="p-3 border bg-background">
              <div className="font-medium text-sm truncate">{p.name}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium">от {p.price} ₽</span>
                <ChevronRight size={16} className="opacity-50" />
              </div>
            </div>
          </button>
        ))}
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
