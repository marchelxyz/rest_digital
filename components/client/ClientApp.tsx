"use client";

import { useState } from "react";
import { CartStore, useCartStore } from "@/components/client/cart-store";
import { ClientHomeTab } from "./ClientHomeTab";
import { ClientProfileTab } from "./ClientProfileTab";
import { ClientInfoTab } from "./ClientInfoTab";
import { CartDrawer } from "./CartDrawer";

export type Settings = {
  tenantId: string;
  name: string;
  appName: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  primaryColor: string;
  theme: string;
  showStories: boolean;
  showLoyalty: boolean;
  showPopular: boolean;
  menuLayout: string;
  borderRadius: number;
  loyaltyType: string;
  loyaltyStampGoal: number;
  loyaltyCashbackPct: number;
  infoAddress?: string | null;
  infoHours?: string | null;
  infoPhone?: string | null;
  infoTermsUrl?: string | null;
  infoFaqUrl?: string | null;
  infoPartnerUrl?: string | null;
  infoCaloriesUrl?: string | null;
  infoContactText?: string | null;
  infoSocialInstagram?: string | null;
  infoSocialTelegram?: string | null;
  infoSocialVk?: string | null;
  infoAboutText?: string | null;
};

export type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  products: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
  }[];
};

type TabId = "home" | "profile" | "info";

export function ClientApp({
  settings,
  categories,
}: {
  settings: Settings;
  categories: Category[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <CartStore tenantId={settings.tenantId}>
      <div
        className="min-h-screen pb-20"
        style={{
          background: settings.theme === "dark" ? "#1a1a1a" : "#fff",
          color: settings.theme === "dark" ? "#fff" : "#171717",
        }}
      >
        {activeTab === "home" && (
          <ClientHomeTab
            settings={settings}
            categories={categories}
            onCartClick={() => setCartOpen(true)}
          />
        )}
        {activeTab === "profile" && <ClientProfileTab settings={settings} />}
        {activeTab === "info" && <ClientInfoTab settings={settings} />}

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          settings={settings}
          categories={categories}
        />

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-inherit">
          <div className="flex">
            <TabButton
              active={activeTab === "home"}
              label="Главная"
              icon="home"
              onClick={() => setActiveTab("home")}
            />
            <TabButton
              active={activeTab === "profile"}
              label="Профиль"
              icon="user"
              onClick={() => setActiveTab("profile")}
            />
            <TabButton
              active={activeTab === "info"}
              label="Информация"
              icon="info"
              onClick={() => setActiveTab("info")}
            />
          </div>
        </nav>
      </div>
    </CartStore>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: "home" | "user" | "info";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 px-2 flex flex-col items-center gap-1 text-sm ${
        active ? "opacity-100 font-medium" : "opacity-60"
      }`}
    >
      <span className="text-lg">{icon === "home" ? "🏠" : icon === "user" ? "👤" : "☰"}</span>
      {label}
    </button>
  );
}
