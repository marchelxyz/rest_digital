import { redirect, notFound } from "next/navigation";
import { getSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateLoginDialog } from "@/components/superadmin/CreateLoginDialog";

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
    <div className="container max-w-2xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <p className="text-muted-foreground">/{tenant.slug}</p>
        </div>
        <Badge variant={tenant.isActive ? "default" : "secondary"}>
          {tenant.isActive ? "Активен" : "Неактивен"}
        </Badge>
      </div>
      <div className="rounded-lg border p-4 mb-6 bg-muted/30">
        <h3 className="font-medium mb-2">Ссылка на мини-приложение</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Приложение привязано к этому кабинету партнёра через slug. URL: <code className="px-1 py-0.5 bg-background rounded">/c/{tenant.slug}</code> — откройте или встройте в виджет.
        </p>
      </div>
      <div className="rounded-lg border p-4 mb-6 bg-muted/30">
        <h3 className="font-medium mb-2">Вход в кабинет партнёра</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Создайте данные для входа (логин — email, пароль генерируется автоматически). Затем используйте «В кабинет».
        </p>
        <div className="flex flex-wrap gap-2">
          <CreateLoginDialog tenantId={tenantId} tenantName={tenant.name} />
          <Link href={`/restaurant/login?tenantId=${tenantId}`}>
            <Button variant="outline">В кабинет</Button>
          </Link>
        </div>
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
