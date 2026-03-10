import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import Link from "next/link";
import { OrdersKanban } from "@/components/restaurant/OrdersKanban";

export default async function RestaurantPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Заказы</h1>
      <OrdersKanban tenantId={emp.tenantId} />
    </div>
  );
}
