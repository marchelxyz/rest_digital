"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ProductForm } from "./ProductForm";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
};

type ModifierOption = {
  id: string;
  name: string;
  priceDelta: string | { toString: () => string };
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

type ModifierGroup = {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isActive: boolean;
  options: ModifierOption[];
};

type ProductBadge = { id: string; label: string; sortOrder: number };

type Product = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: string | { toString: () => string };
  oldPrice?: string | { toString: () => string } | null;
  imageUrl?: string | null;
  weight?: string | null;
  volume?: string | null;
  composition?: string | null;
  allergens?: string | null;
  calories?: number | null;
  cookingTime?: number | null;
  isActive: boolean;
  isAvailable: boolean;
  isSpicy: boolean;
  isNew: boolean;
  isPopular: boolean;
  isRecommended: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isHit: boolean;
  isDiscounted: boolean;
  sortOrder: number;
  category: Category;
  modifierGroups: ModifierGroup[];
  productBadges: ProductBadge[];
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toString" in v) return Number((v as { toString: () => string }).toString());
  return Number(v) || 0;
}

export function MenuManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    Promise.all([
      fetch("/api/restaurant/categories").then((r) => r.json()),
      fetch(`/api/restaurant/products${params.toString() ? `?${params}` : ""}`).then((r) => r.json()),
    ]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
    }).finally(() => setLoading(false));
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

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

  async function updateCategory(id: string) {
    if (!editCatName.trim()) return;
    await fetch(`/api/restaurant/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCatName.trim() }),
    });
    setEditingCat(null);
    load();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Удалить категорию? Блюда должны быть пустыми.")) return;
    const res = await fetch(`/api/restaurant/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Ошибка");
      return;
    }
    load();
  }

  async function toggleCategoryActive(id: string, isActive: boolean) {
    await fetch(`/api/restaurant/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  function openProductForm(product?: Product) {
    setEditingProduct(product ?? null);
    setProductFormOpen(true);
  }

  function closeProductForm() {
    setProductFormOpen(false);
    setEditingProduct(null);
    load();
  }

  const productsToShow = products;

  if (loading) return <p className="text-muted-foreground">Загрузка...</p>;

  return (
    <>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Категории</TabsTrigger>
          <TabsTrigger value="products">Блюда</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Название категории"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button onClick={addCategory}>Добавить</Button>
          </div>
          <div className="grid gap-2">
            {categories.map((c) => (
              <Card key={c.id} className={!c.isActive ? "opacity-60" : ""}>
                <CardContent className="py-3 flex items-center justify-between gap-2">
                  {editingCat === c.id ? (
                    <div className="flex gap-2 flex-1">
                      <Input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        placeholder="Название"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateCategory(c.id);
                          if (e.key === "Escape") setEditingCat(null);
                        }}
                      />
                      <Button size="sm" onClick={() => updateCategory(c.id)}>
                        Сохранить
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)}>
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {(c as Category & { _count?: { products: number } })._count?.products ?? 0} блюд
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggleCategoryActive(c.id, c.isActive)}
                          title={c.isActive ? "Скрыть" : "Показать"}
                        >
                          {c.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingCat(c.id);
                            setEditCatName(c.name);
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteCategory(c.id)}
                          className="text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="products" className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Поиск по названию"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="hidden">Скрытые</option>
              <option value="unavailable">Временно недоступные</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button onClick={() => openProductForm()}>
              <Plus size={16} className="mr-1" />
              Добавить блюдо
            </Button>
          </div>
          <div className="space-y-2">
            {productsToShow.map((p) => (
              <Card key={p.id} className={!p.isActive ? "opacity-60" : ""}>
                <CardContent className="py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span
                        className={
                          !p.isAvailable ? "line-through text-muted-foreground" : "font-medium"
                        }
                      >
                        {p.name}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {p.category.name} · {num(p.price)} ₽
                        {p.modifierGroups?.length
                          ? ` · ${p.modifierGroups.length} групп допов`
                          : ""}
                      </span>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {p.isNew && <BadgeTag>Новинка</BadgeTag>}
                        {p.isHit && <BadgeTag>Хит</BadgeTag>}
                        {p.isPopular && <BadgeTag>Популярное</BadgeTag>}
                        {p.isSpicy && <BadgeTag>Острое</BadgeTag>}
                        {p.isVegan && <BadgeTag>Веган</BadgeTag>}
                        {p.isDiscounted && <BadgeTag>Акция</BadgeTag>}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openProductForm(p)}
                  >
                    Редактировать
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {productFormOpen && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={closeProductForm}
          onSaved={closeProductForm}
        />
      )}
    </>
  );
}

function BadgeTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
      {children}
    </span>
  );
}
