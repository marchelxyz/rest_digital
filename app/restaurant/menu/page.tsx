import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { MenuManager } from "@/components/restaurant/MenuManager";

export default async function RestaurantMenuPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Управление меню</h1>
      <MenuManager />
    </div>
  );
}
