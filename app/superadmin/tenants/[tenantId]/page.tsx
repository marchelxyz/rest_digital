import { redirect, notFound } from "next/navigation";
import { getSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TenantSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") redirect("/superadmin/login");
  const { tenantId } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true },
  });
  if (!tenant) notFound();

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground">/{tenant.slug}</p>
        </div>
        <Badge variant={tenant.isActive ? "default" : "secondary"}>
          {tenant.isActive ? "Активен" : "Неактивен"}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Link href={`/superadmin/tenants/${tenantId}/builder`}>
          <Button>Конструктор приложения</Button>
        </Link>
        <Link href={`/c/${tenant.slug}`} target="_blank">
          <Button variant="outline">Открыть приложение</Button>
        </Link>
      </div>
    </div>
  );
}
