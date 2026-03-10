"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  type: "single" | "multiple" | "quantity";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
};

type ProductModifierDialogProps = {
  productName: string;
  basePrice: number;
  modifierGroups: ModifierGroup[];
  primaryColor: string;
  borderRadius: number;
  onConfirm: (finalPrice: number, selectedModifiers: { optionId: string; optionName: string; priceDelta: number; quantity?: number }[]) => void;
  onClose: () => void;
};

export function ProductModifierDialog({
  productName,
  basePrice,
  modifierGroups,
  primaryColor,
  borderRadius,
  onConfirm,
  onClose,
}: ProductModifierDialogProps) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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
    let price = basePrice;
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
  }, [basePrice, modifierGroups, selections, quantities]);

  function toggleOption(groupId: string, optionId: string, type: string) {
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
  }

  function setQuantity(groupId: string, value: number) {
    const g = modifierGroups.find((x) => x.id === groupId);
    if (!g) return;
    const clamped = Math.max(g.minSelect, Math.min(g.maxSelect, value));
    setQuantities((prev) => ({ ...prev, [groupId]: clamped }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h3 className="font-semibold">{productName}</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
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
                  <span className="w-8 text-center">{quantities[g.id] ?? 0}</span>
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
                <div className="space-y-2 mt-2">
                  {g.options.map((o) => {
                    const isSelected =
                      g.type === "single"
                        ? (selections[g.id] ?? []).includes(o.id)
                        : (selections[g.id] ?? []).includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-muted/50"
                      >
                        <input
                          type={g.type === "single" ? "radio" : "checkbox"}
                          name={g.id}
                          checked={isSelected}
                          onChange={() => toggleOption(g.id, o.id, g.type)}
                          className="rounded"
                        />
                        <span className="flex-1">{o.name}</span>
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
        <div className="p-4 border-t flex justify-between items-center">
          <span className="font-semibold">{totalPrice} ₽</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={() => onConfirm(totalPrice, selectedOptions)}
              disabled={!valid}
              style={{ backgroundColor: primaryColor, borderRadius }}
            >
              В корзину
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
