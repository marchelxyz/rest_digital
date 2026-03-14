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
    <div className="container max-w-5xl py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <ClipboardList size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Заказы</h1>
          <p className="text-sm text-neutral-500">Управление заказами</p>
        </div>
      </div>
      <OrdersKanban tenantId={emp.tenantId} />
    </div>
  );
}
