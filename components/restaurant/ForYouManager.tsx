"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Loader2 } from "lucide-react";

type Product = { id: string; name: string; price: number; imageUrl?: string | null };

export function ForYouManager() {
  const [forYou, setForYou] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  function loadForYou() {
    fetch("/api/restaurant/for-you")
      .then((r) => r.json())
      .then((list: Product[]) => setForYou(Array.isArray(list) ? list : []))
      .catch(() => setForYou([]));
  }

  function loadProducts() {
    fetch("/api/restaurant/products")
      .then((r) => r.json())
      .then((list: { id: string; name: string; price: number; imageUrl?: string | null }[]) =>
        setProducts(list)
      )
      .catch(() => setProducts([]));
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/restaurant/for-you").then((r) => r.json()),
      fetch("/api/restaurant/products").then((r) => r.json()),
    ])
      .then(([fy, prods]) => {
        setForYou(Array.isArray(fy) ? fy : []);
        setProducts(Array.isArray(prods) ? prods : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(productId: string) {
    const res = await fetch("/api/restaurant/for-you", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) loadForYou();
  }

  async function handleRemove(productId: string) {
    await fetch(`/api/restaurant/for-you?productId=${encodeURIComponent(productId)}`, {
      method: "DELETE",
    });
    loadForYou();
  }

  const inForYou = new Set(forYou.map((p) => p.id));
  const available = products.filter((p) => !inForYou.has(p.id));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Выберите блюда для блока «Для вас» — они будут отображаться после историй в клиентском приложении.
      </p>
      <div>
        <h3 className="font-medium mb-2">Добавить блюдо</h3>
        <div className="flex flex-wrap gap-2">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">Все блюда уже добавлены</p>
          ) : (
            available.map((p) => (
              <Button key={p.id} size="sm" variant="outline" onClick={() => handleAdd(p.id)}>
                + {p.name}
              </Button>
            ))
          )}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">В блоке «Для вас»</h3>
        <div className="space-y-2">
          {forYou.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет блюд. Добавьте первые.</p>
          ) : (
            forYou.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.price} ₽</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleRemove(p.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
