"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Send } from "lucide-react";

type Category = { id: string; name: string };
type Product = {
  id: string;
  categoryId: string;
  name: string;
  price: unknown;
  imageUrl?: string | null;
  isActive: boolean;
  isAvailable: boolean;
  isPublished?: boolean;
  category: Category;
  modifierGroups?: { id: string }[];
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toString" in v)
    return Number((v as { toString: () => string }).toString());
  return Number(v) || 0;
}

type SortableProductsProps<T extends Product = Product> = {
  products: T[];
  categories: Category[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onEdit: (p: T) => void;
  onReorder: (order: { id: string; sortOrder: number; categoryId?: string }[]) => void;
  onBulkAction: (action: string, categoryId?: string) => void;
};

function SortableProductItem({
  p,
  selected,
  onToggleSelect,
  onEdit,
}: {
  p: Product;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${!p.isActive ? "opacity-60" : ""} ${isDragging ? "opacity-80 shadow-lg" : ""} ${selected ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="py-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="rounded"
        />
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
        <div className="flex gap-3 min-w-0 flex-1">
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <span
              className={
                !p.isAvailable ? "line-through text-muted-foreground" : "font-medium"
              }
            >
              {p.name}
            </span>
            <span className="text-muted-foreground text-sm ml-2">
              {p.category.name} · {num(p.price)} ₽
              {p.modifierGroups?.length ? ` · ${p.modifierGroups.length} допов` : ""}
            </span>
            {p.isPublished === false && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Черновик
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Редактировать
        </Button>
      </CardContent>
    </Card>
  );
}

export function SortableProducts<T extends Product>(props: SortableProductsProps<T>) {
  const {
    products,
    categories,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onDeselectAll,
    onEdit,
    onReorder,
    onBulkAction,
  } = props;

  const [bulkMoveTarget, setBulkMoveTarget] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(products, oldIndex, newIndex);
    onReorder(reordered.map((p, i) => ({ id: p.id, sortOrder: i })));
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm font-medium">
            Выбрано: {selectedCount}
          </span>
          <Button size="sm" variant="outline" onClick={onSelectAll}>
            Все
          </Button>
          <Button size="sm" variant="outline" onClick={onDeselectAll}>
            Снять
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction("show")}
          >
            Показать
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction("hide")}
          >
            Скрыть
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction("publish")}
          >
            Опубликовать
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction("unpublish")}
          >
            В черновик
          </Button>
          <div className="flex items-center gap-2">
            <select
              value={bulkMoveTarget}
              onChange={(e) => setBulkMoveTarget(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Переместить в...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={!bulkMoveTarget}
              onClick={() => {
                if (bulkMoveTarget) {
                  onBulkAction("move", bulkMoveTarget);
                  setBulkMoveTarget("");
                }
              }}
            >
              Переместить
            </Button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (confirm(`Удалить ${selectedCount} блюд(а)?`)) {
                onBulkAction("delete");
              }
            }}
          >
            Удалить
          </Button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={products.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {products.map((p) => (
              <SortableProductItem
                key={p.id}
                p={p}
                selected={selectedIds.has(p.id)}
                onToggleSelect={() => onToggleSelect(p.id)}
                onEdit={() => onEdit(p)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
