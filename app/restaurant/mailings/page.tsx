import { getEmployee } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MailingsClient } from "@/components/restaurant/mailings/MailingsClient";

export default async function MailingsPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") redirect("/restaurant/login");
  return <MailingsClient />;
}
