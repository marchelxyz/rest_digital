"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

function useEscape(handler: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handler();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { ModifierGroup, ModifierOption } from "./ProductModifierDialog";

export type ProductDetailModalProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  oldPrice?: number;
  imageUrl?: string | null;
  weight?: string | null;
  volume?: string | null;
  badges?: string[];
  modifierGroups?: (Omit<ModifierGroup, "type"> & { type: string })[];
};

type ProductDetailModalProps = {
  product: ProductDetailModalProduct;
  primaryColor: string;
  borderRadius: number;
  onAddToCart: (
    finalPrice: number,
    selectedModifiers: { optionId: string; optionName: string; priceDelta: number; quantity?: number }[]
  ) => void;
  onClose: () => void;
};

/**
 * Модальное окно с деталями блюда: крупное фото, описание, модификаторы, кнопка в корзину.
 * Desktop: фото слева, контент справа. Mobile: фото сверху, контент снизу.
 */
export function ProductDetailModal({
  product,
  primaryColor,
  borderRadius,
  onAddToCart,
  onClose,
}: ProductDetailModalProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [descExpanded, setDescExpanded] = useState(false);

  const modifierGroups = (product.modifierGroups ?? []) as ModifierGroup[];

  useEffect(() => {
    const defaults: Record<string, number> = {};
    for (const g of modifierGroups) {
      if (g.type === "quantity" && g.isRequired && g.minSelect > 0) {
        defaults[g.id] = g.minSelect;
      }
    }
    if (Object.keys(defaults).length > 0) {
      setQuantities((prev) => ({ ...prev, ...defaults }));
    }
  }, [modifierGroups]);

  const { totalPrice, selectedOptions, valid } = useMemo(() => {
    let price = product.price;
    const opts: { optionId: string; optionName: string; priceDelta: number; quantity?: number }[] = [];
    let allValid = true;

    for (const g of modifierGroups) {
      const sel = selections[g.id] ?? [];
      const qty = quantities[g.id] ?? 0;

      if (g.type === "single") {
        if (g.isRequired && sel.length === 0) allValid = false;
        const optId = sel[0];
        if (optId) {
          const opt = g.options.find((o) => o.id === optId);
          if (opt) {
            price += opt.priceDelta;
            opts.push({ optionId: opt.id, optionName: opt.name, priceDelta: opt.priceDelta });
          }
        }
      } else if (g.type === "multiple") {
        const count = sel.length;
        if (g.isRequired && count < g.minSelect) allValid = false;
        if (count > g.maxSelect) allValid = false;
        for (const optId of sel) {
          const opt = g.options.find((o) => o.id === optId);
          if (opt) {
            price += opt.priceDelta;
            opts.push({ optionId: opt.id, optionName: opt.name, priceDelta: opt.priceDelta });
          }
        }
      } else if (g.type === "quantity") {
        const count = Math.max(0, qty);
        if (g.isRequired && count < g.minSelect) allValid = false;
        if (count > g.maxSelect) allValid = false;
        const defaultOpt = g.options[0];
        if (defaultOpt && count > 0) {
          const totalDelta = defaultOpt.priceDelta * count;
          price += totalDelta;
          opts.push({
            optionId: defaultOpt.id,
            optionName: defaultOpt.name,
            priceDelta: totalDelta,
            quantity: count,
          });
        }
      }
    }

    return {
      totalPrice: price,
      selectedOptions: opts,
      valid: allValid,
    };
  }, [product.price, modifierGroups, selections, quantities]);

  const toggleOption = useCallback(
    (groupId: string, optionId: string, type: string) => {
      setSelections((prev) => {
        const arr = prev[groupId] ?? [];
        if (type === "single") {
          return { ...prev, [groupId]: arr.includes(optionId) ? [] : [optionId] };
        }
        if (arr.includes(optionId)) {
          return { ...prev, [groupId]: arr.filter((id) => id !== optionId) };
        }
        const g = modifierGroups.find((x) => x.id === groupId);
        if (!g) return prev;
        const next = [...arr, optionId];
        if (next.length > g.maxSelect) return prev;
        return { ...prev, [groupId]: next };
      });
    },
    [modifierGroups]
  );

  const setQuantity = useCallback(
    (groupId: string, value: number) => {
      const g = modifierGroups.find((x) => x.id === groupId);
      if (!g) return;
      const clamped = Math.max(g.minSelect, Math.min(g.maxSelect, value));
      setQuantities((prev) => ({ ...prev, [groupId]: clamped }));
    },
    [modifierGroups]
  );

  const handleAdd = useCallback(() => {
    onAddToCart(totalPrice, selectedOptions);
    onClose();
  }, [totalPrice, selectedOptions, onAddToCart, onClose]);

  useEscape(onClose);

  const hasModifiers = modifierGroups.length > 0;
  const canAdd = !hasModifiers || valid;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>

        <div className="md:w-1/2 flex-shrink-0 flex items-center justify-center p-4 md:p-6 bg-muted/30">
          {product.imageUrl ? (
            <div
              className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden bg-muted flex items-center justify-center"
              style={{ borderRadius: borderRadius + 8 }}
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
              style={{ borderRadius: borderRadius + 8 }}
            >
              Нет фото
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 md:p-6">
          <h2 className="text-xl font-semibold pr-10">{product.name}</h2>
          {(product.weight || product.volume) && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {product.weight ?? product.volume}
            </p>
          )}
          {product.description && (
            <div className="mt-2">
              <p className={`text-sm text-muted-foreground ${descExpanded ? "" : "line-clamp-3"}`}>
                {product.description}
              </p>
              {product.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((e) => !e)}
                  className="text-sm mt-1"
                  style={{ color: primaryColor }}
                >
                  {descExpanded ? "Свернуть" : "больше"}
                </button>
              )}
            </div>
          )}

          {product.badges && product.badges.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {product.badges.slice(0, 4).map((b) => (
                <span
                  key={b}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-4 flex-1">
            {modifierGroups.map((g) => (
              <div key={g.id}>
                <Label className="text-sm font-medium">
                  {g.name}
                  {g.isRequired && <span className="text-destructive ml-1">*</span>}
                  {g.type === "multiple" && (
                    <span className="text-muted-foreground text-xs ml-1">
                      (выберите {g.minSelect}–{g.maxSelect})
                    </span>
                  )}
                </Label>
                {g.type === "quantity" ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(g.id, (quantities[g.id] ?? 0) - 1)}
                    >
                      −
                    </Button>
                    <span className="w-8 text-center text-sm">{quantities[g.id] ?? 0}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(g.id, (quantities[g.id] ?? 0) + 1)}
                    >
                      +
                    </Button>
                    {g.options[0] && (
                      <span className="text-sm text-muted-foreground">
                        +{g.options[0].priceDelta} ₽ за шт.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 mt-2">
                    {g.options.map((o) => {
                      const isSelected = (selections[g.id] ?? []).includes(o.id);
                      return (
                        <label
                          key={o.id}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type={g.type === "single" ? "radio" : "checkbox"}
                            name={g.id}
                            checked={isSelected}
                            onChange={() => toggleOption(g.id, o.id, g.type)}
                            className="rounded"
                          />
                          <span className="flex-1 text-sm">{o.name}</span>
                          {o.priceDelta !== 0 && (
                            <span className="text-sm text-muted-foreground">+{o.priceDelta} ₽</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleAdd}
              disabled={!canAdd}
              className="w-full py-6 text-base font-medium"
              style={{ backgroundColor: primaryColor, borderRadius }}
            >
              {totalPrice} ₽ +
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
