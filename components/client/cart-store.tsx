"use client";

import { createContext, useContext, useCallback, useState, ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (productId: string, name: string, price: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
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

  const addItem = useCallback((productId: string, name: string, price: number) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === productId);
      if (i >= 0) {
        const next = [...prev];
        next[i].quantity += 1;
        return next;
      }
      return [...prev, { productId, name, price, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((x) => x.productId !== productId));
      return;
    }
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === productId);
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
