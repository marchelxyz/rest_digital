"use client";

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
import { Input } from "@/components/ui/input";
import { GripVertical, Pencil, Trash2, Eye, EyeOff, Send } from "lucide-react";

type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isPublished?: boolean;
  _count?: { products: number };
};

type SortableCategoriesProps = {
  categories: Category[];
  editingId: string | null;
  editName: string;
  onEditName: (v: string) => void;
  onStartEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  onDelete: (id: string) => void;
  onReorder: (order: { id: string; sortOrder: number }[]) => void;
};

function SortableCategoryItem({
  c,
  editing,
  editName,
  onEditName,
  onStartEdit,
  onSave,
  onCancel,
  onToggleActive,
  onTogglePublish,
  onDelete,
}: {
  c: Category;
  editing: boolean;
  editName: string;
  onEditName: (v: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggleActive: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: c.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${!c.isActive ? "opacity-60" : ""} ${isDragging ? "opacity-80 shadow-lg" : ""}`}
    >
      <CardContent className="py-3 flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>
        {editing ? (
          <div className="flex gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => onEditName(e.target.value)}
              placeholder="Название"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
            />
            <Button size="sm" onClick={onSave}>
              Сохранить
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground text-sm ml-2">
                {c._count?.products ?? 0} блюд
              </span>
              {c.isPublished === false && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Черновик
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onTogglePublish}
                title={c.isPublished ? "Снять с публикации" : "Опубликовать"}
              >
                <Send size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleActive}
                title={c.isActive ? "Скрыть" : "Показать"}
              >
                {c.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onStartEdit}
              >
                <Pencil size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SortableCategories(props: SortableCategoriesProps) {
  const {
    categories,
    editingId,
    editName,
    onEditName,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onToggleActive,
    onTogglePublish,
    onDelete,
    onReorder,
  } = props;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    onReorder(
      reordered.map((c, i) => ({ id: c.id, sortOrder: i }))
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {categories.map((c) => (
            <SortableCategoryItem
              key={c.id}
              c={c}
              editing={editingId === c.id}
              editName={editName}
              onEditName={onEditName}
              onStartEdit={() => onStartEdit(c.id, c.name)}
              onSave={() => onSaveEdit(c.id)}
              onCancel={onCancelEdit}
              onToggleActive={() => onToggleActive(c.id, c.isActive)}
              onTogglePublish={() => onTogglePublish(c.id, c.isPublished ?? true)}
              onDelete={() => onDelete(c.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
