"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  status: string;
  type: string;
  totalAmount: string;
  address?: string | null;
  createdAt: string;
  customer: { name?: string | null; phone: string };
  items: { quantity: number; product: { name: string }; price: string }[];
};

const COLS: { status: string; label: string }[] = [
  { status: "NEW", label: "Новые" },
  { status: "PREPARING", label: "Готовится" },
  { status: "IN_DELIVERY", label: "В пути" },
  { status: "COMPLETED", label: "Выполнено" },
];

export function OrdersKanban({ tenantId }: { tenantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/restaurant/orders")
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  async function setStatus(orderId: string, status: string) {
    await fetch(`/api/restaurant/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLS.map((col) => {
        const list = orders.filter((o) => o.status === col.status);
        return (
          <div key={col.status} className="rounded-lg border bg-muted/30 p-3">
            <h3 className="font-medium mb-3">
              {col.label} ({list.length})
            </h3>
            <div className="space-y-2">
              {list.map((o) => (
                <Card key={o.id}>
                  <CardHeader className="py-2 px-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">
                        {o.customer.name || o.customer.phone}
                      </span>
                      <Badge variant="secondary">{o.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Number(o.totalAmount).toFixed(0)} ₽
                    </p>
                  </CardHeader>
                  <CardContent className="py-2 px-3 text-sm">
                    {o.items.map((it, i) => (
                      <div key={i}>
                        {it.quantity}× {it.product.name}
                      </div>
                    ))}
                    {o.address && (
                      <p className="text-xs text-muted-foreground mt-1">{o.address}</p>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {COLS.filter((c) => c.status !== o.status).map((c) => (
                        <Button
                          key={c.status}
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus(o.id, c.status)}
                        >
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
