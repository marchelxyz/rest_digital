"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, ShoppingCart } from "lucide-react";

type Tenant = { id: string; name: string; slug: string };
type Stats = {
  period: { from: string; to: string };
  tenants: Tenant[];
  summary: { orders: number; ordersAmount: number; contacts: number };
  byTenant: Record<
    string,
    {
      name: string;
      slug: string;
      orders: number;
      ordersAmount: number;
      contacts: number;
      byPlatform: Record<string, number>;
      byUtmSource: Record<string, number>;
    }
  >;
};

export function SuperadminStatsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    fetch("/api/superadmin/tenants")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.tenants ?? [];
        setTenants(list);
        if (list.length > 0) setSelectedTenantIds(list.map((t: Tenant) => t.id));
      })
      .catch(() => {});
  }, []);

  function loadStats() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (selectedTenantIds.length > 0 && !selectAll) {
      params.set("tenantIds", selectedTenantIds.join(","));
    }
    setLoading(true);
    fetch(`/api/superadmin/stats?${params}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const now = new Date();
    const defFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const defTo = now.toISOString().slice(0, 10);
    setFrom(defFrom);
    setTo(defTo);
  }, []);

  useEffect(() => {
    if (!from || !to) return;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (selectedTenantIds.length > 0 && !selectAll) params.set("tenantIds", selectedTenantIds.join(","));
    setLoading(true);
    fetch(`/api/superadmin/stats?${params}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [from, to, selectAll, selectedTenantIds.join(",")]);

  function toggleTenant(id: string) {
    setSelectedTenantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const tenantList = stats?.tenants?.length ? stats.tenants : tenants;

  return (
    <div className="container max-w-4xl py-8 px-4 text-[var(--neu-text)]">
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <Label>С</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label>По</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={(e) => {
              setSelectAll(e.target.checked);
              if (e.target.checked) setSelectedTenantIds(tenants.map((t) => t.id));
            }}
          />
          <span className="text-sm">Все заведения</span>
        </label>
        {!selectAll && tenantList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tenantList.map((t) => (
              <label key={t.id} className="flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTenantIds.includes(t.id)}
                  onChange={() => toggleTenant(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={loadStats}
          className="neu-focus px-4 py-2 rounded-xl bg-[var(--admin-yellow)] text-[var(--admin-black)] font-medium shadow-[var(--neu-outset-sm)] hover:opacity-95 border border-white/40"
        >
          Обновить
        </button>
      </div>

      {loading && !stats && <div className="py-8">Загрузка...</div>}

      {stats && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="neu-card border-0 shadow-none bg-[var(--neu-surface-raised)] ring-0">
              <CardHeader className="flex flex-row items-center gap-2">
                <ShoppingCart size={20} />
                <CardTitle className="text-base">Заказы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary.orders}</div>
                <div className="text-sm text-muted-foreground">{stats.summary.ordersAmount.toLocaleString("ru")} ₽</div>
              </CardContent>
            </Card>
            <Card className="neu-card border-0 shadow-none bg-[var(--neu-surface-raised)] ring-0">
              <CardHeader className="flex flex-row items-center gap-2">
                <Users size={20} />
                <CardTitle className="text-base">База контактов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.summary.contacts}</div>
                <div className="text-sm text-muted-foreground">новых за период</div>
              </CardContent>
            </Card>
            <Card className="neu-card border-0 shadow-none bg-[var(--neu-surface-raised)] ring-0">
              <CardHeader className="flex flex-row items-center gap-2">
                <BarChart3 size={20} />
                <CardTitle className="text-base">Период</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{stats.period.from} — {stats.period.to}</div>
              </CardContent>
            </Card>
          </div>

          {Object.entries(stats.byTenant).map(([tenantId, data]) => (
            <Card key={tenantId} className="neu-card border-0 shadow-none bg-[var(--neu-surface-raised)] ring-0">
              <CardHeader>
                <CardTitle>{data.name}</CardTitle>
                <p className="text-sm text-muted-foreground">/{data.slug}</p>
                <div className="flex gap-4 text-sm">
                  <span>Заказов: {data.orders} · {data.ordersAmount.toLocaleString("ru")} ₽</span>
                  <span>Контактов: {data.contacts}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">По платформе</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.byPlatform).map(([k, v]) => (
                      <span key={k} className="text-xs px-2 py-1 rounded bg-muted">
                        {k === "standalone" ? "Сайт" : k}: {v}
                      </span>
                    ))}
                    {Object.keys(data.byPlatform).length === 0 && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">По UTM source</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.byUtmSource).map(([k, v]) => (
                      <span key={k} className="text-xs px-2 py-1 rounded bg-muted">
                        {k}: {v}
                      </span>
                    ))}
                    {Object.keys(data.byUtmSource).length === 0 && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
