import { getSuperadmin } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { LayoutDashboard, BarChart3 } from "lucide-react";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSuperadmin();

  return (
    <div
      className="min-h-screen bg-neutral-50"
      style={
        {
          "--admin-yellow": "#facc15",
          "--admin-yellow-dark": "#eab308",
          "--admin-black": "#171717",
        } as React.CSSProperties
      }
    >
      {admin && admin.type === "superadmin" && (
        <header className="bg-[var(--admin-black)] text-white border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-sm">
          <nav className="flex items-center gap-2">
            <Link
              href="/superadmin"
              className="flex items-center gap-2 font-bold text-lg px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard size={20} />
              Rest Digital
              <span className="text-[var(--admin-yellow)] font-medium">· Superadmin</span>
            </Link>
            <Link
              href="/superadmin/stats"
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-neutral-300 hover:text-white"
            >
              <BarChart3 size={18} />
              Статистика
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">{admin.email}</span>
            <div className="[&_button]:text-neutral-400 [&_button]:hover:text-white [&_button]:hover:bg-white/10">
              <LogoutButton type="superadmin" />
            </div>
          </div>
        </header>
      )}
      <main
        className="bg-white min-h-[calc(100vh-56px)]"
        style={
          {
            "--primary": "var(--admin-yellow)",
            "--primary-foreground": "var(--admin-black)",
          } as React.CSSProperties
        }
      >
        {children}
      </main>
    </div>
  );
}
