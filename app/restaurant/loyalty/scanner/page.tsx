import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth";
import { LoyaltyScanner } from "@/components/restaurant/LoyaltyScanner";
import { QrCode } from "lucide-react";

export default async function LoyaltyScannerPage() {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    redirect("/restaurant/login");
  }
  return (
    <div className="container max-w-3xl py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <QrCode size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Сканер QR</h1>
          <p className="text-sm text-neutral-500">Лояльность в заведении через Rest Digital</p>
        </div>
      </div>
      <LoyaltyScanner />
    </div>
  );
}

