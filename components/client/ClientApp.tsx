"use client";

import { useState } from "react";
import { Home, User, Menu } from "lucide-react";
import { CartStore } from "@/components/client/cart-store";
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
              icon={<Home size={24} strokeWidth={activeTab === "home" ? 2.5 : 2} />}
              ariaLabel="Главная"
              onClick={() => setActiveTab("home")}
            />
            <TabButton
              active={activeTab === "profile"}
              icon={<User size={24} strokeWidth={activeTab === "profile" ? 2.5 : 2} />}
              ariaLabel="Профиль"
              onClick={() => setActiveTab("profile")}
            />
            <TabButton
              active={activeTab === "info"}
              icon={<Menu size={24} strokeWidth={activeTab === "info" ? 2.5 : 2} />}
              ariaLabel="Информация"
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
  icon,
  ariaLabel,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 px-2 flex items-center justify-center ${
        active ? "opacity-100" : "opacity-60"
      }`}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}
