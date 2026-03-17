"use client";

import { createContext, useContext, useCallback, useState, useEffect, useRef, ReactNode } from "react";
import { storageGet, storageSet } from "@/lib/mini-apps/bridge";

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

const CART_STORAGE_KEY = "cart_items";
const DB_SYNC_DEBOUNCE_MS = 800;

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
  replaceAll: (next: CartItem[]) => void;
  total: number;
};

const CartContext = createContext<CartState | null>(null);

export function CartStore({
  tenantId,
  customerId,
  children,
}: {
  tenantId: string;
  customerId?: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const dbSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDbSync = useRef(false);

  // 1) Гидрация из localStorage/CloudStorage
  useEffect(() => {
    let cancelled = false;
    storageGet(tenantId, CART_STORAGE_KEY).then((raw) => {
      if (cancelled || !raw) {
        setHydrated(true);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      } catch {
        // ignore
      }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, [tenantId]);

  // 2) При появлении customerId — загружаем корзину из БД (серверный источник правды)
  useEffect(() => {
    if (!customerId || !hydrated) return;
    let cancelled = false;
    fetch(`/api/public/customer/cart?customerId=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.cartJson) return;
        try {
          const serverItems = JSON.parse(data.cartJson) as CartItem[];
          if (Array.isArray(serverItems) && serverItems.length > 0) {
            skipNextDbSync.current = true;
            setItems(serverItems);
            storageSet(tenantId, CART_STORAGE_KEY, data.cartJson).catch(() => {});
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [customerId, hydrated, tenantId]);

  // 3) Сохранение в localStorage + debounced-сохранение в БД
  useEffect(() => {
    if (!hydrated) return;
    const json = JSON.stringify(items);
    storageSet(tenantId, CART_STORAGE_KEY, json).catch(() => {});

    if (skipNextDbSync.current) {
      skipNextDbSync.current = false;
      return;
    }
    if (!customerId) return;
    if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
    dbSyncTimer.current = setTimeout(() => {
      fetch("/api/public/customer/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, cartJson: json }),
      }).catch(() => {});
    }, DB_SYNC_DEBOUNCE_MS);
  }, [tenantId, hydrated, items, customerId]);

  useEffect(() => {
    return () => {
      if (dbSyncTimer.current) clearTimeout(dbSyncTimer.current);
    };
  }, []);

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

  const replaceAll = useCallback((next: CartItem[]) => setItems(next), []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, replaceAll, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartStore() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartStore outside CartStore");
  return ctx;
}
