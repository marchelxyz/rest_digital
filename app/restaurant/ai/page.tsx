import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { AiMarketing } from "@/components/restaurant/AiMarketing";

export default async function RestaurantAiPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">AI Маркетинг</h1>
      <AiMarketing />
    </div>
  );
}
