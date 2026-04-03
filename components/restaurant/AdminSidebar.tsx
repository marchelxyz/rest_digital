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
 * Сворачиваемая боковая панель (neumorphism / тёмный soft UI).
 */
export function AdminSidebar({ userEmail }: { userEmail?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`neu-dark-shell flex flex-col border-r border-white/[0.06] transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/[0.07]">
        {!collapsed && (
          <Link
            href="/restaurant"
            className="neu-focus font-bold text-lg truncate text-neutral-100 hover:text-[var(--admin-yellow)] transition-colors"
          >
            Rest Digital
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={`neu-focus neu-dark-nav-link p-2 text-neutral-400 hover:text-white ${
            collapsed ? "mx-auto" : ""
          }`}
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav
        className="custom-scrollbar flex-1 flex flex-col gap-1.5 px-2 py-3 overflow-y-auto"
        aria-label="Разделы кабинета"
      >
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
        <div className="px-3 py-3 border-t border-white/[0.07] text-xs text-neutral-500 truncate">
          {userEmail}
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
      className={`neu-focus neu-dark-nav-link relative flex items-center gap-3 text-sm ${
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
      } ${isActive ? "neu-dark-nav-link--active" : "text-neutral-300"}`}
    >
      <Icon size={20} className="relative z-10 shrink-0" aria-hidden />
      {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
    </Link>
  );
}
