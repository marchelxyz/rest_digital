import { getEmployee } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const emp = await getEmployee();

  return (
    <div className="min-h-screen bg-background">
      {emp && emp.type === "employee" && (
        <header className="border-b px-4 py-3 flex items-center justify-between">
          <nav className="flex gap-4">
            <Link href="/restaurant" className="font-semibold">
              Rest Digital
            </Link>
            <Link href="/restaurant" className="text-sm text-muted-foreground hover:text-foreground">
              Заказы
            </Link>
            <Link href="/restaurant/menu" className="text-sm text-muted-foreground hover:text-foreground">
              Меню
            </Link>
            <Link href="/restaurant/stories" className="text-sm text-muted-foreground hover:text-foreground">
              Истории
            </Link>
            <Link href="/restaurant/ai" className="text-sm text-muted-foreground hover:text-foreground">
              AI-маркетинг
            </Link>
          </nav>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">{emp.email}</span>
            <LogoutButton type="restaurant" />
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
