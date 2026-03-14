import { getEmployee } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminNavLinks } from "@/components/restaurant/AdminNavLinks";

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const emp = await getEmployee();

  return (
    <div
      className="min-h-screen bg-neutral-50"
      style={
        {
          "--admin-yellow": "#facc15",
          "--admin-yellow-dark": "#eab308",
          "--admin-black": "#171717",
          "--admin-muted": "#737373",
        } as React.CSSProperties
      }
    >
      {emp && emp.type === "employee" && (
        <header className="bg-[var(--admin-black)] text-white border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-sm">
          <nav className="flex items-center gap-1">
            <Link
              href="/restaurant"
              className="font-bold text-lg px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Rest Digital
            </Link>
            <span className="w-px h-5 bg-neutral-600 mx-1" />
            <AdminNavLinks />
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">{emp.email}</span>
            <div className="[&_button]:text-neutral-400 [&_button]:hover:text-white [&_button]:hover:bg-white/10">
              <LogoutButton type="restaurant" />
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
