"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { formatIikoSyncSourceRu } from "@/lib/iiko/sync-result-labels";

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
  iikoExternalMenuId?: string | null;
  iikoExternalMenuPriceCategoryId?: string | null;
  rkeeperApiKey?: string | null;
};

type IikoOrg = { id: string; name: string };
type IikoTerminal = { id: string; name: string };
type IikoOrderType = { id: string; name: string; orderServiceType: string };
type IikoPaymentType = { id: string; name: string; paymentTypeKind: string };

type IikoExternalMenu = { id: string; name: string; priceCategoryIds?: string[] };

type IikoConfig = {
  organizations: IikoOrg[];
  terminalGroupsByOrg: Record<string, IikoTerminal[]>;
  orderTypesByOrg: Record<string, IikoOrderType[]>;
  paymentTypes: IikoPaymentType[];
  externalMenus?: IikoExternalMenu[];
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
  iikoExternalMenuId: "",
  iikoExternalMenuPriceCategoryId: "",
  rkeeperApiKey: "",
};

/**
 * Компонент настроек интеграций с POS-системами.
 * Поддерживает автоматическую загрузку конфигурации из iiko.
 */
export function IntegrationsSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [iikoConfig, setIikoConfig] = useState<IikoConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [syncingMenu, setSyncingMenu] = useState(false);
  const [syncMenuResult, setSyncMenuResult] = useState<string | null>(null);

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

  async function fetchIikoConfig() {
    setLoadingConfig(true);
    setConfigError(null);
    setSyncMenuResult(null);
    try {
      const res = await fetch("/api/restaurant/iiko-config");
      const data = await res.json();
      if (!res.ok) {
        setConfigError(data.error ?? "Ошибка загрузки");
        return;
      }
      setIikoConfig(data);
    } catch {
      setConfigError("Не удалось подключиться к iiko API");
    } finally {
      setLoadingConfig(false);
    }
  }

  async function syncMenu() {
    setSyncingMenu(true);
    setSyncMenuResult(null);
    setConfigError(null);
    try {
      const res = await fetch("/api/restaurant/iiko/sync-menu", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setConfigError(data.error ?? "Ошибка синхронизации");
        return;
      }
      const src = formatIikoSyncSourceRu(
        typeof data.source === "string" ? data.source : ""
      );
      const hint =
        typeof data.hint === "string" && data.hint.trim() ? `\n${data.hint.trim()}` : "";
      setSyncMenuResult(
        `Меню синхронизировано (${src}): создано ${data.created}, обновлено ${data.updated}${hint}`
      );
    } catch {
      setConfigError("Не удалось синхронизировать меню");
    } finally {
      setSyncingMenu(false);
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

  const terminals = _getTerminals(iikoConfig, settings.iikoOrganizationId);
  const orderTypes = _getOrderTypes(iikoConfig, settings.iikoOrganizationId);

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
        <div className="rounded-xl border border-neutral-200 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-base font-semibold">iiko Cloud API</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchIikoConfig}
                disabled={loadingConfig || !settings.iikoApiLogin?.trim()}
              >
                <RefreshCw size={14} className={`mr-1 ${loadingConfig ? "animate-spin" : ""}`} />
                {loadingConfig ? "Загрузка..." : "Загрузить из iiko"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={syncMenu}
                disabled={
                  syncingMenu ||
                  !settings.iikoApiLogin?.trim() ||
                  !settings.iikoOrganizationId?.trim()
                }
              >
                <RefreshCw size={14} className={`mr-1 ${syncingMenu ? "animate-spin" : ""}`} />
                {syncingMenu ? "Синхронизация..." : "Синхронизировать меню"}
              </Button>
            </div>
          </div>

          {configError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={16} />
              {configError}
            </div>
          )}

          {iikoConfig && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Check size={16} />
              Конфигурация загружена: {iikoConfig.organizations.length} орг., {iikoConfig.paymentTypes.length} способов оплаты
            </div>
          )}

          {syncMenuResult && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Check size={16} className="shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{syncMenuResult}</span>
            </div>
          )}

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label>API-ключ iiko (Cloud API login)</Label>
              <Input
                type="password"
                value={settings.iikoApiLogin ?? ""}
                onChange={(e) => update("iikoApiLogin", e.target.value)}
                placeholder="Скопируйте из iikoWeb → Настройки Cloud API"
              />
              <p className="text-xs text-muted-foreground">
                После ввода ключа нажмите «Сохранить», затем «Загрузить из iiko»
              </p>
            </div>

            <div className="space-y-1">
              <Label>Организация</Label>
              {iikoConfig ? (
                <select
                  className="border rounded-md px-3 py-2 text-sm w-full"
                  value={settings.iikoOrganizationId ?? ""}
                  onChange={(e) => update("iikoOrganizationId", e.target.value)}
                >
                  <option value="">— Выберите —</option>
                  {iikoConfig.organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.id.slice(0, 8)}...)</option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="OrganizationId (UUID)"
                  value={settings.iikoOrganizationId ?? ""}
                  onChange={(e) => update("iikoOrganizationId", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1">
              <Label>Терминальная группа</Label>
              {terminals.length > 0 ? (
                <select
                  className="border rounded-md px-3 py-2 text-sm w-full"
                  value={settings.iikoTerminalGroupId ?? ""}
                  onChange={(e) => update("iikoTerminalGroupId", e.target.value)}
                >
                  <option value="">— Выберите —</option>
                  {terminals.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.id.slice(0, 8)}...)</option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="TerminalGroupId (UUID)"
                  value={settings.iikoTerminalGroupId ?? ""}
                  onChange={(e) => update("iikoTerminalGroupId", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1">
              <Label>Способ оплаты</Label>
              {iikoConfig ? (
                <select
                  className="border rounded-md px-3 py-2 text-sm w-full"
                  value={settings.iikoPaymentTypeId ?? ""}
                  onChange={(e) => update("iikoPaymentTypeId", e.target.value)}
                >
                  <option value="">— Выберите —</option>
                  {iikoConfig.paymentTypes.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.paymentTypeKind})</option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="PaymentTypeId (UUID)"
                  value={settings.iikoPaymentTypeId ?? ""}
                  onChange={(e) => update("iikoPaymentTypeId", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
              <div className="text-sm font-medium text-neutral-700">Внешнее меню iiko</div>
              {(iikoConfig?.externalMenus?.length ?? 0) === 0 && iikoConfig && (
                <div className="text-xs text-amber-900 bg-amber-100/90 rounded px-2 py-1.5 border border-amber-200/80">
                  iiko не отдал список внешних меню (POST /api/2/menu). Это нормально: синхронизация
                  пойдёт по номенклатуре Cloud API (тот же API-ключ и организация). Поле ниже —
                  опционально, только если поддержка iiko дал точный UUID меню (не артикул).
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Внешнее меню</Label>
                {(iikoConfig?.externalMenus?.length ?? 0) > 0 ? (
                  <select
                    className="border rounded-md px-3 py-2 text-sm w-full"
                    value={settings.iikoExternalMenuId ?? ""}
                    onChange={(e) => update("iikoExternalMenuId", e.target.value)}
                  >
                    <option value="">— Авто: первое меню из списка —</option>
                    {(iikoConfig?.externalMenus ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    className="font-mono text-xs"
                    placeholder="Опционально: UUID внешнего меню"
                    value={settings.iikoExternalMenuId ?? ""}
                    onChange={(e) => update("iikoExternalMenuId", e.target.value)}
                  />
                )}
              </div>
              {((settings.iikoExternalMenuId
                ? (iikoConfig?.externalMenus ?? []).find((m) => m.id === settings.iikoExternalMenuId)
                    ?.priceCategoryIds?.length ?? 0
                : 0) > 0 ||
                ((iikoConfig?.externalMenus?.length ?? 0) === 0 &&
                  Boolean(settings.iikoExternalMenuId?.trim()))) && (
                <div className="space-y-1">
                  <Label className="text-xs">Категория цен</Label>
                  {(iikoConfig?.externalMenus ?? []).find((m) => m.id === settings.iikoExternalMenuId)
                    ?.priceCategoryIds?.length ? (
                    <select
                      className="border rounded-md px-3 py-2 text-sm w-full"
                      value={settings.iikoExternalMenuPriceCategoryId ?? ""}
                      onChange={(e) =>
                        update("iikoExternalMenuPriceCategoryId", e.target.value)
                      }
                    >
                      <option value="">— Не указана —</option>
                      {(
                        (iikoConfig?.externalMenus ?? []).find(
                          (m) => m.id === settings.iikoExternalMenuId
                        )?.priceCategoryIds ?? []
                      ).map((pcId) => (
                        <option key={pcId} value={pcId}>
                          {pcId.slice(0, 8)}...
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className="font-mono text-xs"
                      placeholder="UUID категории цен (если нужно для меню)"
                      value={settings.iikoExternalMenuPriceCategoryId ?? ""}
                      onChange={(e) =>
                        update("iikoExternalMenuPriceCategoryId", e.target.value)
                      }
                    />
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Достаточно API-ключа и организации: сначала пробуется внешнее меню из API iiko, если
                список пуст — подтягивается номенклатура. Поле UUID не обязательно. Сохраните настройки
                перед синхронизацией.
              </p>
            </div>

            <div className="border-t pt-3 space-y-3">
              <div className="text-sm font-medium text-neutral-600">Типы заказов</div>

              <OrderTypeSelect
                label="DELIVERY (доставка)"
                value={settings.iikoOrderTypeIdDelivery}
                orderTypes={orderTypes}
                filter="DeliveryByCourier"
                onChange={(v) => update("iikoOrderTypeIdDelivery", v)}
              />
              <OrderTypeSelect
                label="PICKUP (самовывоз)"
                value={settings.iikoOrderTypeIdPickup}
                orderTypes={orderTypes}
                filter="DeliveryPickUp"
                onChange={(v) => update("iikoOrderTypeIdPickup", v)}
              />
              <OrderTypeSelect
                label="DINE_IN (зал)"
                value={settings.iikoOrderTypeIdDineIn}
                orderTypes={orderTypes}
                filter="Common"
                onChange={(v) => update("iikoOrderTypeIdDineIn", v)}
              />
              <OrderTypeSelect
                label="Fallback (общий)"
                value={settings.iikoOrderTypeId}
                orderTypes={orderTypes}
                onChange={(v) => update("iikoOrderTypeId", v)}
              />
            </div>

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

function OrderTypeSelect({
  label,
  value,
  orderTypes,
  filter,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  orderTypes: IikoOrderType[];
  filter?: string;
  onChange: (v: string) => void;
}) {
  const filtered = filter ? orderTypes.filter((t) => t.orderServiceType === filter) : orderTypes;

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {filtered.length > 0 ? (
        <select
          className="border rounded-md px-3 py-2 text-sm w-full"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Выберите —</option>
          {filtered.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.orderServiceType})
            </option>
          ))}
        </select>
      ) : (
        <Input
          placeholder={`OrderTypeId ${label} (UUID)`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function _getTerminals(config: IikoConfig | null, orgId: string | null | undefined): IikoTerminal[] {
  if (!config || !orgId) return [];
  return config.terminalGroupsByOrg[orgId] ?? [];
}

function _getOrderTypes(config: IikoConfig | null, orgId: string | null | undefined): IikoOrderType[] {
  if (!config || !orgId) return [];
  return config.orderTypesByOrg[orgId] ?? [];
}
