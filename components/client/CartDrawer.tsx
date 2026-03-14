"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useCartStore } from "./cart-store";
import { useMiniApp } from "./MiniAppProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Settings = {
  tenantId: string;
  primaryColor: string;
  borderRadius: number;
};

type OrderType = "PICKUP" | "DINE_IN";

type Category = {
  id: string;
  name: string;
  products: { id: string; name: string; price: number }[];
};

export function CartDrawer({
  open,
  onClose,
  settings,
  categories,
  orderType = "PICKUP",
}: {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  categories: Category[];
  orderType?: OrderType;
}) {
  const { items, removeItem, updateQty, total, clear } = useCartStore();
  const { haptic } = useMiniApp();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const allProducts = categories.flatMap((c) =>
    c.products.map((p) => ({ ...p, categoryName: c.name }))
  );
  const inCartProductIds = new Set(items.map((i) => i.productId));
  const crossSell = allProducts
    .filter((p) => !inCartProductIds.has(p.id))
    .slice(0, 3);
  const { addItem } = useCartStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || !phone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: settings.tenantId,
          phone: phone.trim(),
          name: name.trim() || undefined,
          type: orderType,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            modifiers: i.modifiers?.length ? JSON.stringify(i.modifiers) : undefined,
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Ошибка");
        return;
      }
      haptic.success();
      setDone(true);
      clear();
      setTimeout(onClose, 1500);
    } catch {
      alert("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background text-foreground shadow-xl overflow-auto transition-transform duration-300 ease-out">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Корзина</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {done ? (
            <p className="text-green-600 font-medium">Заказ оформлен!</p>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="text-muted-foreground">Корзина пуста</p>
              ) : (
                <>
                  {items.map((i) => (
                    <div
                      key={i.lineId}
                      className="flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-medium">{i.name}</div>
                        {i.modifiers && i.modifiers.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {i.modifiers
                              .map((m) =>
                                m.quantity
                                  ? `${m.optionName} x${m.quantity}`
                                  : m.optionName
                              )
                              .join(", ")}
                          </div>
                        )}
                        <div className="flex gap-2 items-center mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(i.lineId, i.quantity - 1)
                            }
                            className="w-6 h-6 rounded border flex items-center justify-center"
                          >
                            <Minus size={14} strokeWidth={2} />
                          </button>
                          <span>{i.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(i.lineId, i.quantity + 1)
                            }
                            className="w-6 h-6 rounded border flex items-center justify-center"
                          >
                            <Plus size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{i.price * i.quantity} ₽</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(i.lineId)}
                          className="p-1"
                        >
                          <X size={16} strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {crossSell.length > 0 && (
                    <div>
                      <Label className="text-sm">Добавить к заказу?</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {crossSell.map((p) => (
                          <Button
                            key={p.id}
                            size="sm"
                            variant="outline"
                            onClick={() => addItem(p.id, p.name, p.price)}
                          >
                            + {p.name} ({p.price} ₽)
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-3 pt-4 border-t"
                  >
                    <div>
                      <Label htmlFor="phone">Телефон *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 ..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Имя</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Как к вам обращаться"
                      />
                    </div>
                    <div className="font-semibold">Итого: {total} ₽</div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                      style={{
                        backgroundColor: settings.primaryColor,
                        borderRadius: settings.borderRadius,
                      }}
                    >
                      {submitting ? "Оформление..." : "Оформить заказ"}
                    </Button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
