"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = { id: string; name: string; sortOrder: number };
type Product = {
  id: string;
  name: string;
  price: string;
  description?: string | null;
  isAvailable: boolean;
  category: Category;
};

export function MenuManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCat, setNewCat] = useState("");
  const [newProd, setNewProd] = useState({ name: "", price: "", categoryId: "" });
  const [loading, setLoading] = useState(true);

  function load() {
    Promise.all([
      fetch("/api/restaurant/categories").then((r) => r.json()),
      fetch("/api/restaurant/products").then((r) => r.json()),
    ]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function addCategory() {
    if (!newCat.trim()) return;
    await fetch("/api/restaurant/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat.trim() }),
    });
    setNewCat("");
    load();
  }

  async function addProduct() {
    if (!newProd.name.trim() || !newProd.categoryId || !newProd.price) return;
    await fetch("/api/restaurant/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProd.name.trim(),
        categoryId: newProd.categoryId,
        price: Number(newProd.price),
      }),
    });
    setNewProd({ name: "", price: "", categoryId: newProd.categoryId });
    load();
  }

  async function toggleProduct(id: string, isAvailable: boolean) {
    await fetch(`/api/restaurant/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });
    load();
  }

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <Tabs defaultValue="categories">
      <TabsList>
        <TabsTrigger value="categories">Категории</TabsTrigger>
        <TabsTrigger value="products">Товары</TabsTrigger>
      </TabsList>
      <TabsContent value="categories" className="space-y-4 pt-4">
        <div className="flex gap-2">
          <Input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Название категории"
          />
          <Button onClick={addCategory}>Добавить</Button>
        </div>
        <div className="grid gap-2">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3 flex items-center justify-between">
                {c.name}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="products" className="space-y-4 pt-4">
        <div className="flex flex-wrap gap-2">
          <Input
            value={newProd.name}
            onChange={(e) => setNewProd((p) => ({ ...p, name: e.target.value }))}
            placeholder="Название"
          />
          <Input
            type="number"
            value={newProd.price}
            onChange={(e) => setNewProd((p) => ({ ...p, price: e.target.value }))}
            placeholder="Цена"
          />
          <select
            value={newProd.categoryId}
            onChange={(e) => setNewProd((p) => ({ ...p, categoryId: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="">Категория</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button onClick={addProduct}>Добавить</Button>
        </div>
        <div className="space-y-2">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <span className={!p.isAvailable ? "line-through text-muted-foreground" : ""}>
                    {p.name}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {p.category.name} · {Number(p.price).toFixed(0)} ₽
                  </span>
                </div>
                <Button
                  variant={p.isAvailable ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleProduct(p.id, p.isAvailable)}
                >
                  {p.isAvailable ? "Стоп" : "В меню"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
