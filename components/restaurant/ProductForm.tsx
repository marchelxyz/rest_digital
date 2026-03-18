"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { X, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

type Category = { id: string; name: string };
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
  protein?: number | null;
  fat?: number | null;
  carbohydrates?: number | null;
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
  modifierGroups: ModifierGroup[];
  productBadges: ProductBadge[];
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toString" in v)
    return Number((v as { toString: () => string }).toString());
  return Number(v) || 0;
}

type ProductFormProps = {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
};

const STANDARD_BADGES = [
  { key: "isSpicy", label: "Острое" },
  { key: "isNew", label: "Новинка" },
  { key: "isHit", label: "Хит" },
  { key: "isPopular", label: "Популярное" },
  { key: "isRecommended", label: "Рекомендуем" },
  { key: "isVegetarian", label: "Вегетарианское" },
  { key: "isVegan", label: "Веган" },
  { key: "isGlutenFree", label: "Без глютена" },
  { key: "isDiscounted", label: "Акция" },
] as const;

export function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: ProductFormProps) {
  const isEdit = !!product;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    oldPrice: "",
    imageUrl: "",
    weight: "",
    volume: "",
    composition: "",
    allergens: "",
    calories: "",
    protein: "",
    fat: "",
    carbohydrates: "",
    cookingTime: "",
    isActive: true,
    isAvailable: true,
    isPublished: true,
    isSpicy: false,
    isNew: false,
    isPopular: false,
    isRecommended: false,
    isVegan: false,
    isVegetarian: false,
    isGlutenFree: false,
    isHit: false,
    isDiscounted: false,
    customBadges: [] as { label: string; sortOrder: number }[],
  });
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newOptionName, setNewOptionName] = useState<Record<string, string>>({});
  const [newOptionPrice, setNewOptionPrice] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? "",
        categoryId: product.categoryId,
        price: String(num(product.price)),
        oldPrice: product.oldPrice ? String(num(product.oldPrice)) : "",
        imageUrl: product.imageUrl ?? "",
        weight: product.weight ?? "",
        volume: product.volume ?? "",
        composition: product.composition ?? "",
        allergens: product.allergens ?? "",
        calories: product.calories != null ? String(product.calories) : "",
        protein: product.protein != null ? String(product.protein) : "",
        fat: product.fat != null ? String(product.fat) : "",
        carbohydrates: product.carbohydrates != null ? String(product.carbohydrates) : "",
        cookingTime: product.cookingTime != null ? String(product.cookingTime) : "",
        isActive: product.isActive,
        isAvailable: product.isAvailable,
        isPublished: product.isPublished ?? true,
        isSpicy: product.isSpicy,
        isNew: product.isNew,
        isPopular: product.isPopular,
        isRecommended: product.isRecommended,
        isVegan: product.isVegan,
        isVegetarian: product.isVegetarian,
        isGlutenFree: product.isGlutenFree,
        isHit: product.isHit,
        isDiscounted: product.isDiscounted,
        customBadges:
          product.productBadges?.map((b) => ({ label: b.label, sortOrder: b.sortOrder })) ?? [],
      });
      setModifierGroups(product.modifierGroups ?? []);
    } else {
      setForm((f) => ({ ...f, categoryId: categories[0]?.id ?? "" }));
    }
  }, [product, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const priceNum = Number(form.price);
      if (!form.name.trim()) {
        setError("Название обязательно");
        return;
      }
      if (!form.categoryId) {
        setError("Выберите категорию");
        return;
      }
      if (isNaN(priceNum) || priceNum < 0) {
        setError("Некорректная цена");
        return;
      }
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId,
        price: priceNum,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        imageUrl: form.imageUrl || undefined,
        weight: form.weight.trim() || undefined,
        volume: form.volume.trim() || undefined,
        composition: form.composition.trim() || undefined,
        allergens: form.allergens.trim() || undefined,
        calories: form.calories ? Number(form.calories) : undefined,
        protein: form.protein ? Number(form.protein) : undefined,
        fat: form.fat ? Number(form.fat) : undefined,
        carbohydrates: form.carbohydrates ? Number(form.carbohydrates) : undefined,
        cookingTime: form.cookingTime ? Number(form.cookingTime) : undefined,
        isActive: form.isActive,
        isAvailable: form.isAvailable,
        isPublished: form.isPublished,
        isSpicy: form.isSpicy,
        isNew: form.isNew,
        isPopular: form.isPopular,
        isRecommended: form.isRecommended,
        isVegan: form.isVegan,
        isVegetarian: form.isVegetarian,
        isGlutenFree: form.isGlutenFree,
        isHit: form.isHit,
        isDiscounted: form.isDiscounted,
        customBadges: form.customBadges.filter((b) => b.label.trim()),
      };
      const url = isEdit ? `/api/restaurant/products/${product.id}` : "/api/restaurant/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка сохранения");
        return;
      }
      onSaved();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("field", "product");
      fd.set("file", file);
      const res = await fetch("/api/restaurant/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        const errMsg = data.error ?? "Ошибка загрузки";
        setError(errMsg);
        console.error("[ProductForm] upload failed", { status: res.status, error: errMsg, data });
      }
    } catch (err) {
      const errMsg = "Ошибка загрузки";
      setError(errMsg);
      console.error("[ProductForm] upload error", err);
    } finally {
      setUploading(false);
    }
  }

  function addCustomBadge() {
    setForm((f) => ({
      ...f,
      customBadges: [...f.customBadges, { label: "", sortOrder: f.customBadges.length }],
    }));
  }

  function updateCustomBadge(i: number, label: string) {
    setForm((f) => ({
      ...f,
      customBadges: f.customBadges.map((b, j) =>
        j === i ? { ...b, label } : b
      ),
    }));
  }

  function removeCustomBadge(i: number) {
    setForm((f) => ({
      ...f,
      customBadges: f.customBadges.filter((_, j) => j !== i),
    }));
  }

  async function addModifierGroup() {
    if (!newGroupName.trim() || !product?.id) return;
    const res = await fetch(`/api/restaurant/products/${product.id}/modifier-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newGroupName.trim(),
        type: "single",
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setModifierGroups((prev) => [...prev, data]);
      setNewGroupName("");
      setExpandedGroup(data.id);
    } else {
      setError(data.error ?? "Ошибка");
    }
  }

  async function addOption(groupId: string) {
    const name = newOptionName[groupId]?.trim();
    if (!name) return;
    const res = await fetch(`/api/restaurant/modifier-groups/${groupId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        priceDelta: Number(newOptionPrice[groupId] || 0),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setModifierGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, options: [...g.options, data] } : g
        )
      );
      setNewOptionName((p) => ({ ...p, [groupId]: "" }));
      setNewOptionPrice((p) => ({ ...p, [groupId]: "" }));
    } else {
      setError(data.error ?? "Ошибка");
    }
  }

  async function deleteModifierGroup(id: string) {
    if (!confirm("Удалить группу модификаторов?")) return;
    const res = await fetch(`/api/restaurant/modifier-groups/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setModifierGroups((prev) => prev.filter((g) => g.id !== id));
  }

  async function deleteOption(groupId: string, optionId: string) {
    const res = await fetch(`/api/restaurant/modifier-options/${optionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setModifierGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g
        )
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background border-b px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Редактирование блюда" : "Новое блюдо"}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Пицца Маргарита"
                  required
                />
              </div>
              <div>
                <Label htmlFor="desc">Описание</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Описание блюда"
                  rows={3}
                />
              </div>
              <div>
                <Label>Категория *</Label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">— Выберите —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Фото</Label>
                <div className="flex gap-3 items-center mt-1">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                        <Loader2 size={24} className="animate-spin text-white" />
                        <span className="text-xs text-white">Обработка...</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="text-sm"
                    />
                    {form.imageUrl && !uploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      >
                        Удалить
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Цена и параметры</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Цена *</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="oldPrice">Старая цена (если акция)</Label>
                  <Input
                    id="oldPrice"
                    type="number"
                    min={0}
                    value={form.oldPrice}
                    onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Вес</Label>
                  <Input
                    id="weight"
                    value={form.weight}
                    onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                    placeholder="300 г"
                  />
                </div>
                <div>
                  <Label htmlFor="volume">Объём</Label>
                  <Input
                    id="volume"
                    value={form.volume}
                    onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
                    placeholder="0.5 л"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cookingTime">Время приготовления (мин)</Label>
                <Input
                  id="cookingTime"
                  type="number"
                  min={0}
                  value={form.cookingTime}
                  onChange={(e) => setForm((f) => ({ ...f, cookingTime: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Состав и пищевая информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="composition">Состав</Label>
                <Textarea
                  id="composition"
                  value={form.composition}
                  onChange={(e) => setForm((f) => ({ ...f, composition: e.target.value }))}
                  placeholder="Ингредиенты"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="allergens">Аллергены</Label>
                <Input
                  id="allergens"
                  value={form.allergens}
                  onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))}
                  placeholder="Глютен, лактоза"
                />
              </div>
              <div>
                <Label htmlFor="calories">Калорийность (ккал)</Label>
                <Input
                  id="calories"
                  type="number"
                  min={0}
                  value={form.calories}
                  onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="protein">Белки (г)</Label>
                <Input
                  id="protein"
                  type="number"
                  min={0}
                  value={form.protein}
                  onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="fat">Жиры (г)</Label>
                <Input
                  id="fat"
                  type="number"
                  min={0}
                  value={form.fat}
                  onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="carbohydrates">Углеводы (г)</Label>
                <Input
                  id="carbohydrates"
                  type="number"
                  min={0}
                  value={form.carbohydrates}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, carbohydrates: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ярлыки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {STANDARD_BADGES.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label>{label}</Label>
                    <Switch
                      checked={form[key]}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, [key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>Кастомные ярлыки</Label>
                <div className="space-y-2 mt-1">
                  {form.customBadges.map((b, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={b.label}
                        onChange={(e) => updateCustomBadge(i, e.target.value)}
                        placeholder="От шефа"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeCustomBadge(i)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addCustomBadge}>
                    <Plus size={14} className="mr-1" />
                    Добавить
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Доступность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Активно в меню</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Доступно для заказа</Label>
                <Switch
                  checked={form.isAvailable}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Опубликовано (видно в меню клиентам)</Label>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {isEdit && product && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Модификаторы / допы</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Группы добавок к блюду (размер, соусы, топпинги)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Название группы (Размер, Соусы...)"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addModifierGroup())}
                  />
                  <Button type="button" onClick={addModifierGroup}>
                    Добавить группу
                  </Button>
                </div>
                <div className="space-y-2">
                  {modifierGroups.map((g) => (
                    <div key={g.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between px-3 py-2 bg-muted/50 cursor-pointer"
                        onClick={() =>
                          setExpandedGroup((id) => (id === g.id ? null : g.id))
                        }
                      >
                        <span className="font-medium">{g.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {g.type} · {g.options.length} опций
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModifierGroup(g.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      {expandedGroup === g.id && (
                        <div className="p-3 space-y-3">
                          {g.options.map((o) => (
                            <div
                              key={o.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {o.name}
                                {num(o.priceDelta) !== 0 && (
                                  <span className="text-muted-foreground ml-1">
                                    +{num(o.priceDelta)} ₽
                                  </span>
                                )}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => deleteOption(g.id, o.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              value={newOptionName[g.id] ?? ""}
                              onChange={(e) =>
                                setNewOptionName((p) => ({ ...p, [g.id]: e.target.value }))
                              }
                              placeholder="Название опции"
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={newOptionPrice[g.id] ?? ""}
                              onChange={(e) =>
                                setNewOptionPrice((p) => ({ ...p, [g.id]: e.target.value }))
                              }
                              placeholder="+₽"
                              className="w-20"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => addOption(g.id)}
                            >
                              Добавить
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Сохранение...
                </>
              ) : (
                isEdit ? "Сохранить" : "Создать"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Отмена
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
