"use client";

import { useState } from "react";
import { CartStore, useCartStore } from "@/components/client/cart-store";
import { ClientHeader } from "./ClientHeader";
import { MenuSection } from "./MenuSection";
import { CartDrawer } from "./CartDrawer";

type Settings = {
  tenantId: string;
  name: string;
  appName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  primaryColor: string;
  theme: string;
  showLoyalty: boolean;
  showPopular: boolean;
  menuLayout: string;
  borderRadius: number;
  loyaltyStampGoal: number;
  loyaltyCashbackPct: number;
};

type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  products: { id: string; name: string; description?: string | null; price: number; imageUrl?: string | null }[];
};

export function ClientApp({
  settings,
  categories,
}: {
  settings: Settings;
  categories: Category[];
}) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CartStore tenantId={settings.tenantId}>
      <div
        className="min-h-screen pb-24"
        style={{
          background: settings.theme === "dark" ? "#1a1a1a" : "#fff",
          color: settings.theme === "dark" ? "#fff" : "#171717",
        }}
      >
        <ClientHeader
          settings={settings}
          onCartClick={() => setCartOpen(true)}
        />
        <main className="max-w-lg mx-auto px-4">
          {settings.showLoyalty && (
            <LoyaltyCard
              stamps={0}
              goal={settings.loyaltyStampGoal}
              points={0}
              cashbackPct={settings.loyaltyCashbackPct}
              primaryColor={settings.primaryColor}
              borderRadius={settings.borderRadius}
            />
          )}
          {categories.map((cat) => (
            <MenuSection
              key={cat.id}
              category={cat}
              primaryColor={settings.primaryColor}
              borderRadius={settings.borderRadius}
            />
          ))}
        </main>
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          settings={settings}
          categories={categories}
        />
      </div>
    </CartStore>
  );
}

function LoyaltyCard({
  stamps,
  goal,
  points,
  cashbackPct,
  primaryColor,
  borderRadius,
}: {
  stamps: number;
  goal: number;
  points: number;
  cashbackPct: number;
  primaryColor: string;
  borderRadius: number;
}) {
  return (
    <div
      className="p-4 rounded-xl my-4 text-white"
      style={{ backgroundColor: primaryColor, borderRadius }}
    >
      <div className="font-medium mb-1">Программа лояльности</div>
      <div className="text-sm opacity-90">
        {stamps} / {goal} штампов до подарка
      </div>
      <div className="text-sm opacity-90 mt-1">
        Бонусы: {points} баллов · кэшбек {cashbackPct}%
      </div>
    </div>
  );
}
