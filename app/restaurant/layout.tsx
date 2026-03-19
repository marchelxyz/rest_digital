import { getEmployee } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminSidebar } from "@/components/restaurant/AdminSidebar";

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const emp = await getEmployee();

  return (
    <div
      className="flex min-h-screen bg-neutral-50"
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
          <header className="flex items-center justify-end bg-white border-b border-neutral-200 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">{emp.email}</span>
              <LogoutButton type="restaurant" />
            </div>
          </header>
        )}
        <main
          className="flex-1 bg-white"
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
    </div>
  );
}
