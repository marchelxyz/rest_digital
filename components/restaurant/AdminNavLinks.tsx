"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, UtensilsCrossed, Images, Sparkles, BarChart3 } from "lucide-react";

const LINKS = [
  { href: "/restaurant", icon: ClipboardList, label: "Заказы" },
  { href: "/restaurant/menu", icon: UtensilsCrossed, label: "Меню" },
  { href: "/restaurant/stories", icon: Images, label: "Истории" },
  { href: "/restaurant/ai", icon: Sparkles, label: "AI-маркетинг" },
  { href: "/restaurant/stats", icon: BarChart3, label: "Статистика" },
] as const;

export function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map(({ href, icon: Icon, label }) => {
        const isActive =
          href === "/restaurant"
            ? pathname === "/restaurant"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "text-[var(--admin-yellow)] bg-white/10 font-medium"
                : "text-neutral-300 hover:text-[var(--admin-yellow)] hover:bg-white/5"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </>
  );
}
