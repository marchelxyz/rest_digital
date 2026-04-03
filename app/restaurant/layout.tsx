import { getEmployee } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminSidebar } from "@/components/restaurant/AdminSidebar";
import { neuAdminMono } from "@/lib/fonts/neumorphism-admin-fonts";

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const emp = await getEmployee();

  return (
    <div
      className={`${neuAdminMono.variable} neu-admin-root flex min-h-screen font-[family-name:var(--font-neu-mono)] antialiased`}
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
        <AdminSidebar userEmail={emp.email} />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {emp && emp.type === "employee" && (
          <header className="neu-partner-topbar flex items-center justify-end px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--neu-text-muted)]">{emp.email}</span>
              <LogoutButton type="restaurant" />
            </div>
          </header>
        )}
        <main
          className="flex-1 neu-admin-main"
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
    </div>
  );
}
