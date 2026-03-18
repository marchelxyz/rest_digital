import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { IntegrationsSettings } from "@/components/restaurant/IntegrationsSettings";
import { Plug } from "lucide-react";

export default async function RestaurantIntegrationsPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container max-w-3xl py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <Plug size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Интеграции</h1>
          <p className="text-sm text-neutral-500">POS (iiko/r_keeper), источники меню и лояльность</p>
        </div>
      </div>
      <IntegrationsSettings />
    </div>
  );
}

