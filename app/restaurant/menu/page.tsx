import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { MenuManager } from "@/components/restaurant/MenuManager";
import { UtensilsCrossed } from "lucide-react";

export default async function RestaurantMenuPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container max-w-4xl py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <UtensilsCrossed size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Управление меню</h1>
          <p className="text-sm text-neutral-500">Категории и блюда</p>
        </div>
      </div>
      <MenuManager />
    </div>
  );
}
