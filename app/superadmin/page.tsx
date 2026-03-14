import { redirect } from "next/navigation";
import { getSuperadmin } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateLoginDialog } from "@/components/superadmin/CreateLoginDialog";
import { Building2, Plus } from "lucide-react";

export default async function SuperadminPage() {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    redirect("/superadmin/login");
  }
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { settings: true },
  });

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Заведения</h1>
            <p className="text-sm text-neutral-500">Партнёры и их приложения</p>
          </div>
        </div>
        <Link href="/superadmin/tenants/new">
          <Button>
            <Plus size={18} className="mr-2" />
            Добавить заведение
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {tenants.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет заведений. Создайте первое.
            </CardContent>
          </Card>
        )}
        {tenants.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <p className="text-sm text-muted-foreground">/{t.slug}</p>
              </div>
              <Badge variant={t.isActive ? "default" : "secondary"}>
                {t.isActive ? "Активен" : "Неактивен"}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href={`/restaurant/login?tenantId=${t.id}`}>
                <Button size="sm">В кабинет</Button>
              </Link>
              <CreateLoginDialog tenantId={t.id} tenantName={t.name} />
              <Link href={`/superadmin/tenants/${t.id}/builder`}>
                <Button variant="outline" size="sm">Конструктор</Button>
              </Link>
              <Link href={`/superadmin/tenants/${t.id}`}>
                <Button variant="outline" size="sm">Настройки</Button>
              </Link>
              <Link href={`/c/${t.slug}`} target="_blank">
                <Button variant="outline" size="sm">Приложение</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
