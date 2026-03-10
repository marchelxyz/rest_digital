import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { StoriesManager } from "@/components/restaurant/StoriesManager";

export default async function RestaurantStoriesPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Истории и акции</h1>
      <StoriesManager />
    </div>
  );
}
