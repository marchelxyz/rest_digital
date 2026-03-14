"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

type Story = {
  id: string;
  title: string;
  coverUrl?: string | null;
  mediaUrl: string;
  mediaType: string;
  sortOrder: number;
  isActive: boolean;
};

export function StoriesManager() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    coverUrl: "" as string,
    mediaUrl: "",
    mediaType: "image" as "image" | "video",
    linkUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/restaurant/stories")
      .then((r) => r.json())
      .then(setStories)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "story" | "story_cover"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("field", field);
      fd.set("file", file);
      const res = await fetch("/api/restaurant/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        if (field === "story_cover") {
          setForm((f) => ({ ...f, coverUrl: data.url }));
        } else {
          const type = file.type.startsWith("video/") ? "video" : "image";
          setForm((f) => ({ ...f, mediaUrl: data.url, mediaType: type }));
        }
      } else {
        alert(data.error ?? "Ошибка загрузки");
      }
    } catch {
      alert("Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.mediaUrl.trim()) {
      alert("Заполните название и загрузите контент (фото или видео)");
      return;
    }
    if (!form.coverUrl.trim() && !editing) {
      alert("Загрузите обложку 3:4 для карточки");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        coverUrl: form.coverUrl.trim() || null,
        mediaUrl: form.mediaUrl.trim(),
        mediaType: form.mediaType,
        linkUrl: form.linkUrl.trim() || null,
      };
      if (editing) {
        await fetch(`/api/restaurant/stories/${editing}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/restaurant/stories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setEditing(null);
      setAdding(false);
      setForm({ title: "", coverUrl: "", mediaUrl: "", mediaType: "image", linkUrl: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  function cancelForm() {
    setEditing(null);
    setAdding(false);
    setForm({ title: "", coverUrl: "", mediaUrl: "", mediaType: "image", linkUrl: "" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить историю?")) return;
    await fetch(`/api/restaurant/stories/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(s: Story & { linkUrl?: string | null }) {
    setEditing(s.id);
    setForm({
      title: s.title,
      coverUrl: s.coverUrl ?? "",
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType as "image" | "video",
      linkUrl: s.linkUrl ?? "",
    });
  }

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
        Добавьте акции. Обложка 3:4 — на карточке. Контент — при открытии. Ссылка — при клике откроется вместо просмотра.
      </p>
      {(editing || adding) && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <Input
              placeholder="Название (Приведи друга, Кейтеринг...)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <div>
              <p className="text-sm font-medium mb-2">Обложка 3:4 (карточка)</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => handleUpload(e, "story_cover")}
                disabled={uploading}
                className="text-sm"
              />
              {form.coverUrl && (
                <div className="mt-2 relative inline-block">
                  <div className="relative h-24 rounded-lg overflow-hidden aspect-[3/4] w-auto bg-muted">
                    <img src={form.coverUrl} alt="" className="h-full w-auto object-cover" />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                        <Loader2 size={20} className="animate-spin text-white" />
                        <span className="text-xs text-white">Обработка...</span>
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => setForm((f) => ({ ...f, coverUrl: "" }))}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              )}
              {uploading && !form.coverUrl && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  Загрузка и обработка...
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Ссылка при клике (опционально)</p>
              <Input
                placeholder="https://..."
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">Если указана — при клике откроется ссылка вместо просмотра</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Контент (фото или видео)</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => handleUpload(e, "story")}
                  disabled={uploading}
                  className="text-sm"
                />
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(e) => handleUpload(e, "story")}
                  disabled={uploading}
                  className="text-sm"
                />
              </div>
              {(form.mediaUrl || uploading) && (
                <div className="mt-2 relative inline-block">
                  <div className="relative h-24 rounded-lg overflow-hidden bg-muted min-w-[6rem]">
                    {form.mediaUrl ? (
                      form.mediaType === "video" ? (
                        <video
                          src={form.mediaUrl}
                          className="h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img src={form.mediaUrl} alt="" className="h-full object-cover" />
                      )
                    ) : (
                      <div className="w-24 h-full" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                        <Loader2 size={20} className="animate-spin text-white" />
                        <span className="text-xs text-white">Обработка...</span>
                      </div>
                    )}
                  </div>
                  {form.mediaUrl && !uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => setForm((f) => ({ ...f, mediaUrl: "" }))}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={uploading || saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1" />
                    Сохранение...
                  </>
                ) : (
                  editing ? "Сохранить" : "Добавить"
                )}
              </Button>
              <Button variant="outline" onClick={cancelForm} disabled={saving}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {!editing && !adding && (
        <Button onClick={() => setAdding(true)}>
          <Plus size={16} className="mr-1" />
          Добавить историю
        </Button>
      )}
      <div className="space-y-2">
        {stories.map((s) => (
          <Card key={s.id}>
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden shrink-0 bg-muted">
                {(s.coverUrl || s.mediaUrl) &&
                  (s.mediaType === "video" && !s.coverUrl ? (
                    <video src={s.mediaUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img
                      src={s.coverUrl || s.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-muted-foreground">
                  {s.mediaType === "video" ? "Видео" : "Фото"}
                  {s.coverUrl ? " + обложка" : ""}
                  {(s as { linkUrl?: string })?.linkUrl ? " + ссылка" : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => startEdit(s)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {stories.length === 0 && !editing && !adding && (
        <p className="text-muted-foreground text-sm">Нет историй. Добавьте первую.</p>
      )}
    </div>
  );
}
