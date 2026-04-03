import { redirect } from "next/navigation";
import { getSuperadmin } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
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
    <div className="container max-w-4xl py-8 px-4 text-[var(--neu-text)]">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="neu-icon-bump" aria-hidden>
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--neu-text)]">
              Заведения
            </h1>
            <p className="text-sm text-[var(--neu-text-muted)] mt-0.5">
              Партнёры и их приложения
            </p>
          </div>
        </div>
        <Link href="/superadmin/tenants/new">
          <Button className="neu-focus shadow-[var(--neu-outset-sm)] border border-white/50 bg-[var(--neu-primary)] hover:bg-[#005252] text-white">
            <Plus size={18} className="mr-2" />
            Добавить заведение
          </Button>
        </Link>
      </div>
      <div className="space-y-5">
        {tenants.length === 0 && (
          <div className="neu-card">
            <div className="neu-card-body py-10 text-center text-[var(--neu-text-muted)]">
              Нет заведений. Создайте первое.
            </div>
          </div>
        )}
        {tenants.map((t) => (
          <CardNeu key={t.id}>
            <div className="neu-card-header flex flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--neu-text)]">{t.name}</h2>
                <p className="text-sm text-[var(--neu-text-muted)]">/{t.slug}</p>
              </div>
              <Badge
                variant={t.isActive ? "default" : "secondary"}
                className={
                  t.isActive
                    ? "bg-[var(--neu-primary)] text-white hover:bg-[var(--neu-primary)]"
                    : ""
                }
              >
                {t.isActive ? "Активен" : "Неактивен"}
              </Badge>
            </div>
            <div className="neu-card-body flex flex-wrap gap-2">
              <Link href={`/restaurant/login?tenantId=${t.id}`}>
                <Button size="sm" className="neu-focus">
                  В кабинет
                </Button>
              </Link>
              <CreateLoginDialog tenantId={t.id} tenantName={t.name} />
              <Link href={`/superadmin/tenants/${t.id}/builder`}>
                <Button variant="outline" size="sm" className="neu-focus bg-[var(--neu-surface-raised)] shadow-[var(--neu-inset-sm)] border-neutral-200">
                  Конструктор
                </Button>
              </Link>
              <Link href={`/superadmin/tenants/${t.id}`}>
                <Button variant="outline" size="sm" className="neu-focus bg-[var(--neu-surface-raised)] shadow-[var(--neu-inset-sm)] border-neutral-200">
                  Настройки
                </Button>
              </Link>
              <Link href={`/c/${t.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="neu-focus bg-[var(--neu-surface-raised)] shadow-[var(--neu-inset-sm)] border-neutral-200">
                  Приложение
                </Button>
              </Link>
            </div>
          </CardNeu>
        ))}
      </div>
    </div>
  );
}

function CardNeu({ children }: { children: React.ReactNode }) {
  return <div className="neu-card overflow-hidden">{children}</div>;
}
