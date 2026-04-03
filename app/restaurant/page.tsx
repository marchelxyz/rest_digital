import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { OrdersKanban } from "@/components/restaurant/OrdersKanban";
import { ClipboardList } from "lucide-react";

export default async function RestaurantPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container max-w-5xl py-6 px-4 text-[var(--neu-text)]">
      <div className="flex items-center gap-4 mb-6">
        <div className="neu-icon-bump text-[var(--neu-primary)]" aria-hidden>
          <ClipboardList size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--neu-text)]">Заказы</h1>
          <p className="text-sm text-[var(--neu-text-muted)]">Управление заказами</p>
        </div>
      </div>
      <OrdersKanban tenantId={emp.tenantId} />
    </div>
  );
}
