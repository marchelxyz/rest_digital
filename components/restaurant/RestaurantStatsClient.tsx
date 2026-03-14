"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, ShoppingCart } from "lucide-react";

type Stats = {
  period: { from: string; to: string };
  orders: {
    total: number;
    totalAmount: number;
    byStatus: Record<string, { count: number; sum: number }>;
    byType: Record<string, { count: number; sum: number }>;
    byPlatform: Record<string, { count: number; sum: number }>;
    byUtmSource: Record<string, { count: number; sum: number }>;
  };
  contacts: {
    total: number;
    byPlatform: Record<string, number>;
    byUtmSource: Record<string, number>;
  };
};

export function RestaurantStatsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function loadStats(f?: string, t?: string) {
    const params = new URLSearchParams();
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    setLoading(true);
    fetch(`/api/restaurant/stats?${params}`)
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
    loadStats(defFrom, defTo);
  }, []);

  function handleApply() {
    loadStats(from || undefined, to || undefined);
  }

  if (loading && !stats) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label>С</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label>По</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <button
          type="button"
          onClick={handleApply}
          className="px-4 py-2 rounded-lg bg-[var(--admin-yellow)] text-[var(--admin-black)] font-medium hover:opacity-90"
        >
          Применить
        </button>
      </div>

      {stats && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <ShoppingCart size={20} />
                <CardTitle className="text-base">Заказы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.orders.total}</div>
                <div className="text-sm text-muted-foreground">{stats.orders.totalAmount.toLocaleString("ru")} ₽</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Users size={20} />
                <CardTitle className="text-base">База контактов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.contacts.total}</div>
                <div className="text-sm text-muted-foreground">новых за период</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <BarChart3 size={20} />
                <CardTitle className="text-base">Период</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{stats.period.from} — {stats.period.to}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Заказы по платформе</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.orders.byPlatform).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="capitalize">{k === "standalone" ? "Сайт" : k}</span>
                    <span>{v.count} заказов · {v.sum.toLocaleString("ru")} ₽</span>
                  </div>
                ))}
                {Object.keys(stats.orders.byPlatform).length === 0 && (
                  <div className="text-sm text-muted-foreground">Нет данных</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Заказы по UTM source</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.orders.byUtmSource).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span>{k}</span>
                    <span>{v.count} заказов · {v.sum.toLocaleString("ru")} ₽</span>
                  </div>
                ))}
                {Object.keys(stats.orders.byUtmSource).length === 0 && (
                  <div className="text-sm text-muted-foreground">Нет данных</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Контакты по платформе</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.contacts.byPlatform).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="capitalize">{k === "standalone" ? "Сайт" : k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                {Object.keys(stats.contacts.byPlatform).length === 0 && (
                  <div className="text-sm text-muted-foreground">Нет данных</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Контакты по UTM source</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.contacts.byUtmSource).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
                {Object.keys(stats.contacts.byUtmSource).length === 0 && (
                  <div className="text-sm text-muted-foreground">Нет данных</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
