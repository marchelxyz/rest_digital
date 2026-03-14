import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { AiMarketing } from "@/components/restaurant/AiMarketing";
import { Sparkles } from "lucide-react";

export default async function RestaurantAiPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container max-w-2xl py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <Sparkles size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">AI Маркетинг</h1>
          <p className="text-sm text-neutral-500">Генерация текстов и анализ отзывов</p>
        </div>
      </div>
      <AiMarketing />
    </div>
  );
}
