import { redirect } from "next/navigation";
import { getSuperadmin } from "@/lib/auth";
import { SuperadminStatsClient } from "@/components/superadmin/SuperadminStatsClient";

export default async function SuperadminStatsPage() {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    redirect("/superadmin/login");
  }
  return <SuperadminStatsClient />;
}
