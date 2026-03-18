"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PosProvider = "none" | "iiko" | "rkeeper";
type MenuSource = "pos" | "excel";
type LoyaltyInteraction = "app_only" | "iiko" | "rkeeper";

type Settings = {
  menuSource: MenuSource;
  posProvider: PosProvider;
  loyaltyInteraction: LoyaltyInteraction;
  iikoApiLogin?: string | null;
  iikoOrganizationId?: string | null;
  iikoTerminalGroupId?: string | null;
  iikoOrderTypeId?: string | null;
  iikoOrderTypeIdDelivery?: string | null;
  iikoOrderTypeIdPickup?: string | null;
  iikoOrderTypeIdDineIn?: string | null;
  iikoPaymentTypeId?: string | null;
  rkeeperApiKey?: string | null;
};

const DEFAULT: Settings = {
  menuSource: "pos",
  posProvider: "none",
  loyaltyInteraction: "app_only",
  iikoApiLogin: "",
  iikoOrganizationId: "",
  iikoTerminalGroupId: "",
  iikoOrderTypeId: "",
  iikoOrderTypeIdDelivery: "",
  iikoOrderTypeIdPickup: "",
  iikoOrderTypeIdDineIn: "",
  iikoPaymentTypeId: "",
  rkeeperApiKey: "",
};

export function IntegrationsSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/restaurant/settings")
      .then((r) => r.json())
      .then((d) => setSettings((s) => ({ ...s, ...d })))
      .finally(() => setLoading(false));
  }, []);

  const isPosEnabled = settings.posProvider !== "none";
  const canExcel = settings.posProvider === "none" && settings.menuSource === "excel";

  const modeHint = useMemo(() => {
    if (isPosEnabled) return "Режим POS-интеграции: меню/заказы/лояльность синхронизируются с системой учёта.";
    if (canExcel) return "Режим без POS: меню загружается из Excel, лояльность в заведении — через наш QR-сканер.";
    return "Выберите режим работы: POS-интеграция или Excel + наш QR-сканер.";
  }, [isPosEnabled, canExcel]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/restaurant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      alert("Сохранено");
    } finally {
      setSaving(false);
    }
  }

  async function importExcel(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/restaurant/menu/import-excel", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Ошибка импорта");
      return;
    }
    alert(`Импорт: категорий +${data.createdCategories}, блюд +${data.createdProducts}, обновлено ${data.updatedProducts}`);
  }

  if (loading) return <div className="text-sm text-neutral-500">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
        <div>
          <div className="text-base font-semibold">Режим работы</div>
          <div className="text-xs text-muted-foreground mt-1">{modeHint}</div>
        </div>

        <div className="grid gap-2">
          <Label>POS-провайдер</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={settings.posProvider}
            onChange={(e) => {
              const v = e.target.value as PosProvider;
              update("posProvider", v);
              if (v === "none") {
                update("menuSource", "excel");
                update("loyaltyInteraction", "app_only");
              } else {
                update("menuSource", "pos");
                update("loyaltyInteraction", v === "iiko" ? "iiko" : "rkeeper");
              }
            }}
          >
            <option value="none">Нет POS (Excel + наш QR)</option>
            <option value="iiko">iiko</option>
            <option value="rkeeper">r_keeper</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label>Источник меню</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={settings.menuSource}
            onChange={(e) => update("menuSource", e.target.value as MenuSource)}
            disabled={isPosEnabled}
          >
            <option value="pos">POS (синхронизация)</option>
            <option value="excel">Excel</option>
          </select>
          {isPosEnabled && (
            <div className="text-xs text-muted-foreground">
              В режиме POS-интеграции источник меню фиксирован: синхронизация.
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Лояльность</Label>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={settings.loyaltyInteraction}
            onChange={(e) => update("loyaltyInteraction", e.target.value as LoyaltyInteraction)}
            disabled={isPosEnabled}
          >
            <option value="app_only">В приложении (наш QR-сканер)</option>
            <option value="iiko">iikoCard/iikoCard5 (через iiko)</option>
            <option value="rkeeper">r_keeper (через r_keeper)</option>
          </select>
          {isPosEnabled && (
            <div className="text-xs text-muted-foreground">
              В режиме POS-интеграции лояльность управляется POS и сканируется POS-сканером.
            </div>
          )}
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      {settings.posProvider === "iiko" && (
        <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
          <div className="text-base font-semibold">iiko (технические настройки)</div>
          <div className="grid gap-2">
            <Input
              placeholder="API-ключ iiko (Cloud API login)"
              type="password"
              value={settings.iikoApiLogin ?? ""}
              onChange={(e) => update("iikoApiLogin", e.target.value)}
            />
            <Input
              placeholder="OrganizationId (UUID)"
              value={settings.iikoOrganizationId ?? ""}
              onChange={(e) => update("iikoOrganizationId", e.target.value)}
            />
            <Input
              placeholder="TerminalGroupId (UUID)"
              value={settings.iikoTerminalGroupId ?? ""}
              onChange={(e) => update("iikoTerminalGroupId", e.target.value)}
            />
            <Input
              placeholder="PaymentTypeId (UUID)"
              value={settings.iikoPaymentTypeId ?? ""}
              onChange={(e) => update("iikoPaymentTypeId", e.target.value)}
            />
            <Input
              placeholder="OrderTypeId fallback (UUID)"
              value={settings.iikoOrderTypeId ?? ""}
              onChange={(e) => update("iikoOrderTypeId", e.target.value)}
            />
            <Input
              placeholder="OrderTypeId DELIVERY (UUID)"
              value={settings.iikoOrderTypeIdDelivery ?? ""}
              onChange={(e) => update("iikoOrderTypeIdDelivery", e.target.value)}
            />
            <Input
              placeholder="OrderTypeId PICKUP (UUID)"
              value={settings.iikoOrderTypeIdPickup ?? ""}
              onChange={(e) => update("iikoOrderTypeIdPickup", e.target.value)}
            />
            <Input
              placeholder="OrderTypeId DINE_IN (UUID)"
              value={settings.iikoOrderTypeIdDineIn ?? ""}
              onChange={(e) => update("iikoOrderTypeIdDineIn", e.target.value)}
            />
            <Button variant="outline" onClick={save} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить iiko настройки"}
            </Button>
          </div>
        </div>
      )}

      {settings.posProvider === "rkeeper" && (
        <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
          <div className="text-base font-semibold">r_keeper (технические настройки)</div>
          <Input
            placeholder="r_keeper API key"
            type="password"
            value={settings.rkeeperApiKey ?? ""}
            onChange={(e) => update("rkeeperApiKey", e.target.value)}
          />
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить r_keeper настройки"}
          </Button>
        </div>
      )}

      {canExcel && (
        <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
          <div className="text-base font-semibold">Импорт меню из Excel</div>
          <div className="text-xs text-muted-foreground">
            Формат .xlsx. Колонки: <code>category</code>, <code>name</code>, <code>price</code>, опционально{" "}
            <code>description</code>, <code>imageUrl</code>.
          </div>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importExcel(f);
            }}
          />
        </div>
      )}
    </div>
  );
}

