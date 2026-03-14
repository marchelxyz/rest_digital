"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { SortableCategories } from "./SortableCategories";
import { SortableProducts } from "./SortableProducts";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  isPublished?: boolean;
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
  isPublished?: boolean;
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
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "products">("products");

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

  function startEditCategory(id: string, name: string) {
    setEditingCat(id);
    setEditCatName(name);
  }

  async function saveEditCategory(id: string) {
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

  async function toggleCategoryPublish(id: string, isPublished: boolean) {
    await fetch(`/api/restaurant/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    load();
  }

  async function reorderCategories(order: { id: string; sortOrder: number }[]) {
    const res = await fetch("/api/restaurant/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (res.ok) {
      setCategories((prev) => {
        const m = new Map(prev.map((c) => [c.id, c]));
        return order.map(({ id }) => m.get(id)).filter(Boolean) as Category[];
      });
    }
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

  function toggleProductSelect(id: string) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllProducts() {
    setSelectedProductIds(new Set(products.map((p) => p.id)));
  }

  function deselectAllProducts() {
    setSelectedProductIds(new Set());
  }

  async function bulkProductAction(action: string, categoryId?: string) {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    const res = await fetch("/api/restaurant/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action, categoryId }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Ошибка");
      return;
    }
    setSelectedProductIds(new Set());
    load();
  }

  async function reorderProducts(order: { id: string; sortOrder: number }[]) {
    const res = await fetch("/api/restaurant/products/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    if (res.ok) {
      setProducts((prev) => {
        const m = new Map(prev.map((p) => [p.id, p]));
        return order.map(({ id }) => m.get(id)).filter(Boolean) as Product[];
      });
    }
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "categories" | "products")}>
        <TabsList className="bg-neutral-100 border border-neutral-200">
          <TabsTrigger
            value="categories"
            className="data-[active]:bg-amber-400 data-[active]:text-black data-[active]:border-amber-400"
          >
            Категории
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="data-[active]:bg-amber-400 data-[active]:text-black data-[active]:border-amber-400"
          >
            Блюда
          </TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="space-y-4 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" />
              Загрузка категорий...
            </div>
          ) : (
          <>
          <div className="flex gap-2">
            <Input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Название категории"
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button onClick={addCategory}>Добавить</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Перетащите за ручку для изменения порядка
          </p>
          <SortableCategories
            categories={categories}
            editingId={editingCat}
            editName={editCatName}
            onEditName={setEditCatName}
            onStartEdit={startEditCategory}
            onCancelEdit={() => setEditingCat(null)}
            onSaveEdit={saveEditCategory}
            onToggleActive={toggleCategoryActive}
            onTogglePublish={toggleCategoryPublish}
            onDelete={deleteCategory}
            onReorder={reorderCategories}
          />
          </>
          )}
        </TabsContent>
        <TabsContent value="products" className="space-y-4 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" />
              Загрузка блюд...
            </div>
          ) : (
          <>
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
              <option value="draft">Черновики</option>
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
          <p className="text-xs text-muted-foreground">
            Перетащите за ручку для изменения порядка · Выберите блюда для массовых действий
          </p>
          <SortableProducts
            products={products}
            categories={categories}
            selectedIds={selectedProductIds}
            onToggleSelect={toggleProductSelect}
            onSelectAll={selectAllProducts}
            onDeselectAll={deselectAllProducts}
            onEdit={(p) => openProductForm(p)}
            onReorder={reorderProducts}
            onBulkAction={bulkProductAction}
          />
          </>
          )}
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
