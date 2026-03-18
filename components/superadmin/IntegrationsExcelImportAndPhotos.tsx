"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ImportedProduct = {
  id: string;
  name: string;
  categoryName: string;
};

type MenuPhoto = {
  id: string;
  url: string;
  fileName: string | null;
  sortOrder: number;
  createdAt: string;
};

export function IntegrationsExcelImportAndPhotos({
  tenantId,
  enabled,
}: {
  tenantId: string;
  enabled: boolean;
}) {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);

  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<MenuPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      setPhotosLoading(true);
      setPhotosError(null);
      try {
        const res = await fetch(`/api/superadmin/tenants/${tenantId}/menu-photos`);
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Ошибка загрузки фото");
        setPhotos(d.photos ?? []);
      } catch (e) {
        setPhotosError(e instanceof Error ? e.message : String(e));
      } finally {
        setPhotosLoading(false);
      }
    })();
  }, [tenantId, enabled]);

  const selectedPhoto = useMemo(() => photos.find((p) => p.id === selectedPhotoId) ?? null, [photos, selectedPhotoId]);

  function downloadTemplate() {
    window.location.href = `/api/superadmin/tenants/${tenantId}/menu/import-excel-template`;
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/menu/import-excel`, {
        method: "POST",
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Ошибка импорта");
      setImportedProducts(d.products ?? []);
      setAssignments({});
      setSelectedPhotoId(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }

  async function handlePhotosUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length) return;

    setPhotosError(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/menu-photos/upload`, {
        method: "POST",
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Ошибка загрузки фото");
      const newPhotos = (d.photos ?? []) as MenuPhoto[];
      setPhotos((prev) => [...newPhotos, ...prev]);
    } catch (err) {
      setPhotosError(err instanceof Error ? err.message : String(err));
    }
  }

  const assignedPhotoUrlByProductId = useMemo(() => {
    const urlByPhotoId = new Map(photos.map((p) => [p.id, p.url]));
    const map: Record<string, string> = {};
    for (const [productId, menuPhotoId] of Object.entries(assignments)) {
      const url = urlByPhotoId.get(menuPhotoId);
      if (url) map[productId] = url;
    }
    return map;
  }, [photos, assignments]);

  async function saveAssignments() {
    if (!Object.keys(assignments).length) return;
    if (assigning) return;
    setAssigning(true);
    try {
      const payload = {
        assignments: Object.entries(assignments).map(([productId, menuPhotoId]) => ({
          productId,
          menuPhotoId,
        })),
      };
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/menu-photos/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Ошибка сохранения назначений");
      // local preview is already set; just refresh library to keep URLs consistent
      const res2 = await fetch(`/api/superadmin/tenants/${tenantId}/menu-photos`);
      const d2 = await res2.json();
      if (res2.ok) setPhotos(d2.photos ?? []);
      setAssignments({});
      setSelectedPhotoId(null);
    } catch (err) {
      setPhotosError(err instanceof Error ? err.message : String(err));
    } finally {
      setAssigning(false);
    }
  }

  if (!enabled) {
    return (
      <div className="text-sm text-muted-foreground">
        Импорт из Excel и подбор фото доступен только при `posProvider=none` и `menuSource=excel`.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <Label className="text-base font-medium">Импорт меню из Excel</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Фото в Excel не указывается. Сначала импортируете блюда, затем назначаете фото из библиотеки.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            Скачать шаблон
          </Button>
        </div>

        <div className="border rounded-lg p-3 mt-3">
          <div className="text-sm font-medium mb-2">Шаблон таблицы (колонки)</div>
          <div className="overflow-auto">
            <table className="text-xs w-full" aria-label="Шаблон колонок Excel">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1 pr-2">Колонка</th>
                  <th className="py-1">Описание</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="py-1 pr-2 font-medium">category</td><td className="py-1 text-muted-foreground">Категория блюда (создаётся автоматически)</td></tr>
                <tr><td className="py-1 pr-2 font-medium">name</td><td className="py-1 text-muted-foreground">Название блюда</td></tr>
                <tr><td className="py-1 pr-2 font-medium">price</td><td className="py-1 text-muted-foreground">Цена</td></tr>
                <tr><td className="py-1 pr-2 font-medium">description</td><td className="py-1 text-muted-foreground">Описание (опционально)</td></tr>
                <tr><td className="py-1 pr-2 font-medium">dops</td><td className="py-1 text-muted-foreground">JSON-массив допов/модификаторов (опционально)</td></tr>
                <tr><td className="py-1 pr-2 font-medium">calories</td><td className="py-1 text-muted-foreground">Ккал</td></tr>
                <tr><td className="py-1 pr-2 font-medium">protein</td><td className="py-1 text-muted-foreground">Белки (г)</td></tr>
                <tr><td className="py-1 pr-2 font-medium">fat</td><td className="py-1 text-muted-foreground">Жиры (г)</td></tr>
                <tr><td className="py-1 pr-2 font-medium">carbohydrates</td><td className="py-1 text-muted-foreground">Углеводы (г)</td></tr>
                <tr><td className="py-1 pr-2 font-medium">cookingTime</td><td className="py-1 text-muted-foreground">Время приготовления (мин)</td></tr>
                <tr><td className="py-1 pr-2 font-medium">composition</td><td className="py-1 text-muted-foreground">Состав</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Колонки с ссылкой на фото в таблице отсутствуют — фото назначаются из библиотеки после импорта.
          </p>
        </div>

        <div className="space-y-2">
          <Input
            type="file"
            accept=".xlsx"
            onChange={handleExcelUpload}
            disabled={importing}
          />
          {importError && <p className="text-sm text-destructive">{importError}</p>}
          {importing && <p className="text-sm text-muted-foreground">Импортируем...</p>}
        </div>

        {importedProducts.length > 0 && (
          <div className="mt-5 border rounded-lg p-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="font-medium">Импортированные блюда: {importedProducts.length}</div>
              <div className="text-xs text-muted-foreground">
                Выбрано фото: {selectedPhoto ? selectedPhoto.fileName ?? selectedPhoto.id : "—"}
              </div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-auto">
              {importedProducts.map((p) => {
                const url = assignedPhotoUrlByProductId[p.id] ?? null;
                const btnDisabled = !selectedPhotoId;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 border rounded-lg p-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-md bg-muted overflow-hidden shrink-0">
                        {url ? (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.categoryName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={btnDisabled}
                        onClick={() => {
                          if (!selectedPhotoId) return;
                          setAssignments((prev) => ({ ...prev, [p.id]: selectedPhotoId }));
                        }}
                      >
                        Назначить выбранное фото
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Назначения отображаются локально, сохраняйте нажатием кнопки ниже.
              </p>
              <Button
                type="button"
                disabled={assigning || !Object.keys(assignments).length}
                onClick={() => void saveAssignments()}
              >
                {assigning ? "Сохраняем..." : `Сохранить назначения (${Object.keys(assignments).length})`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-base font-medium">Библиотека фото</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Массовая загрузка: выбираете файлы, затем назначаете фото блюдам (к каждому блюду отдельно).
        </p>

        <div className="mt-3 space-y-2">
          <Input
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={handlePhotosUpload}
            disabled={photosLoading}
          />
          {photosError && <p className="text-sm text-destructive">{photosError}</p>}
        </div>

        <div className="mt-4">
          {photosLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка библиотеки...</p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Фото пока нет. Загрузите файлы выше.</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {photos.map((ph) => {
                const isSel = ph.id === selectedPhotoId;
                return (
                  <button
                    key={ph.id}
                    type="button"
                    className={`border rounded-lg overflow-hidden text-left p-0 ${
                      isSel ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedPhotoId(ph.id)}
                    aria-label={`Выбрать фото: ${ph.fileName ?? ph.id}`}
                  >
                    <div className="w-full aspect-square bg-muted">
                      <img src={ph.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

