"use client";

import { createContext, useContext, useCallback, useState, ReactNode } from "react";

export type CartItemModifier = {
  optionId: string;
  optionName: string;
  priceDelta: number;
  quantity?: number;
};

export type CartItem = {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: CartItemModifier[];
};

function makeLineId(productId: string, modifiers?: CartItemModifier[]): string {
  if (!modifiers || modifiers.length === 0) return productId;
  const key = modifiers
    .map((m) => `${m.optionId}:${m.quantity ?? 1}`)
    .sort()
    .join(",");
  return `${productId}::${key}`;
}

type CartState = {
  items: CartItem[];
  addItem: (
    productId: string,
    name: string,
    price: number,
    quantity?: number,
    modifiers?: CartItemModifier[]
  ) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartState | null>(null);

export function CartStore({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (
      productId: string,
      name: string,
      price: number,
      quantity = 1,
      modifiers?: CartItemModifier[]
    ) => {
      const lineId = makeLineId(productId, modifiers);
      setItems((prev) => {
        const i = prev.findIndex((x) => x.lineId === lineId);
        if (i >= 0) {
          const next = [...prev];
          next[i].quantity += quantity;
          return next;
        }
        return [
          ...prev,
          {
            lineId,
            productId,
            name,
            price,
            quantity,
            modifiers: modifiers?.length ? modifiers : undefined,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((x) => x.lineId !== lineId));
  }, []);

  const updateQty = useCallback((lineId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((x) => x.lineId !== lineId));
      return;
    }
    setItems((prev) => {
      const i = prev.findIndex((x) => x.lineId === lineId);
      if (i < 0) return prev;
      const next = [...prev];
      next[i].quantity = qty;
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartStore() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartStore outside CartStore");
  return ctx;
}
