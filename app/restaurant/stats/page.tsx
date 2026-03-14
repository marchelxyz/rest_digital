import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { BarChart3 } from "lucide-react";
import { RestaurantStatsClient } from "@/components/restaurant/RestaurantStatsClient";

export default async function RestaurantStatsPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container max-w-4xl py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <BarChart3 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Статистика</h1>
          <p className="text-sm text-neutral-500">Заказы и база контактов</p>
        </div>
      </div>
      <RestaurantStatsClient />
    </div>
  );
}
