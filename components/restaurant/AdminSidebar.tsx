"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  UtensilsCrossed,
  Images,
  Sparkles,
  BarChart3,
  Heart,
  QrCode,
  Send,
  Plug,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/restaurant", icon: ClipboardList, label: "Заказы" },
  { href: "/restaurant/menu", icon: UtensilsCrossed, label: "Меню" },
  { href: "/restaurant/loyalty/scanner", icon: QrCode, label: "Сканер QR" },
  { href: "/restaurant/stories", icon: Images, label: "Истории" },
  { href: "/restaurant/for-you", icon: Heart, label: "Для вас" },
  { href: "/restaurant/mailings", icon: Send, label: "Рассылки" },
  { href: "/restaurant/ai", icon: Sparkles, label: "AI-маркетинг" },
  { href: "/restaurant/stats", icon: BarChart3, label: "Статистика" },
  { href: "/restaurant/integrations", icon: Plug, label: "Интеграции" },
];

/**
 * Сворачиваемая боковая панель навигации для партнёрского кабинета.
 * В развёрнутом виде показывает иконки и текст, в свёрнутом — только иконки.
 */
export function AdminSidebar({ userEmail }: { userEmail?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col bg-[var(--admin-black)] text-white border-r border-neutral-800 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-neutral-800">
        {!collapsed && (
          <Link
            href="/restaurant"
            className="font-bold text-lg truncate hover:text-[var(--admin-yellow)] transition-colors"
          >
            Rest Digital
          </Link>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className={`p-2 rounded-lg hover:bg-white/10 transition-colors text-neutral-400 hover:text-white ${
            collapsed ? "mx-auto" : ""
          }`}
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}
      </nav>

      {userEmail && !collapsed && (
        <div className="px-3 py-3 border-t border-neutral-800">
          <p className="text-xs text-neutral-400 truncate">{userEmail}</p>
        </div>
      )}
    </aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const isActive =
    item.href === "/restaurant"
      ? pathname === "/restaurant"
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-3 text-sm rounded-lg transition-colors ${
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
      } ${
        isActive
          ? "text-[var(--admin-black)] font-medium"
          : "text-neutral-300 hover:text-white hover:bg-white/5"
      }`}
    >
      {isActive && (
        <span className="absolute inset-0 rounded-lg bg-[var(--admin-yellow)]/30" />
      )}
      <Icon size={20} className="relative z-10 shrink-0" />
      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
    </Link>
  );
}
