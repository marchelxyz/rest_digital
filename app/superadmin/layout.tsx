import { getSuperadmin } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { LayoutDashboard, BarChart3 } from "lucide-react";
import { neuAdminMono } from "@/lib/fonts/neumorphism-admin-fonts";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSuperadmin();

  return (
    <div
      className={`${neuAdminMono.variable} neu-admin-root min-h-screen font-[family-name:var(--font-neu-mono)] antialiased`}
      style={
        {
          "--admin-yellow": "#facc15",
          "--admin-yellow-dark": "#eab308",
          "--admin-black": "#171717",
        } as React.CSSProperties
      }
    >
      {admin && admin.type === "superadmin" && (
        <header className="neu-dark-header text-white px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-2" aria-label="Superadmin">
            <Link
              href="/superadmin"
              className="neu-focus flex items-center gap-2 font-bold text-lg px-3 py-2 rounded-xl text-neutral-100 hover:text-[var(--admin-yellow)] transition-colors"
            >
              <LayoutDashboard size={20} className="shrink-0" aria-hidden />
              Rest Digital
              <span className="text-[var(--admin-yellow)] font-semibold">· Superadmin</span>
            </Link>
            <Link
              href="/superadmin/stats"
              className="neu-focus flex items-center gap-2 text-sm px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <BarChart3 size={18} className="shrink-0" aria-hidden />
              Статистика
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">{admin.email}</span>
            <div className="[&_button]:text-neutral-400 [&_button]:hover:text-white [&_button]:hover:bg-white/10 [&_button]:rounded-lg">
              <LogoutButton type="superadmin" />
            </div>
          </div>
        </header>
      )}
      <main
        className="neu-admin-main"
        style={
          {
            "--primary": "var(--neu-primary)",
            "--primary-foreground": "#fff",
          } as React.CSSProperties
        }
      >
        {children}
      </main>
    </div>
  );
}
