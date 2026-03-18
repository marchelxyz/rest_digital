"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploadField } from "@/components/superadmin/ImageUploadField";
import { IntegrationsExcelImportAndPhotos } from "@/components/superadmin/IntegrationsExcelImportAndPhotos";
import {
  Home,
  User,
  Menu,
  MapPin,
  Bell,
  ChevronRight,
  Smartphone,
  Monitor,
  Coins,
  Gift,
  ShoppingCart,
  ListFilter,
} from "lucide-react";

type Settings = {
  appName?: string;
  logoUrl?: string;
  coverUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  theme: string;
  fontFamily: string;
  showStories: boolean;
  showLoyalty: boolean;
  showPopular: boolean;
  menuLayout: string;
  borderRadius: number;
  loyaltyType: string;
  loyaltyStampGoal: number;
  loyaltyCashbackPct: number;
  loyaltyInteraction: string;
  menuSource?: string;
  posProvider?: string;
  infoAddress?: string;
  infoHours?: string;
  infoPhone?: string;
  infoTermsUrl?: string;
  infoFaqUrl?: string;
  infoPartnerUrl?: string;
  infoCaloriesUrl?: string;
  infoContactText?: string;
  infoSocialInstagram?: string;
  infoSocialTelegram?: string;
  infoSocialVk?: string;
  infoAboutText?: string;
  messengerTelegram: boolean;
  messengerVk: boolean;
  messengerMax: boolean;
  messengerTelegramBotId?: string;
  messengerTelegramAppId?: string;
  messengerMaxBotId?: string;
  messengerMaxAppId?: string;
  messengerVkGroupToken?: string;
  messengerVkAppId?: string;
  rkeeperApiKey?: string;
  iikoApiLogin?: string;
  iikoOrganizationId?: string;
  iikoTerminalGroupId?: string;
  iikoOrderTypeId?: string;
  iikoOrderTypeIdDelivery?: string;
  iikoOrderTypeIdPickup?: string;
  iikoOrderTypeIdDineIn?: string;
  iikoPaymentTypeId?: string;
  loyaltyCardGradientColors?: string;
  loyaltyCardGradientOpacity: number;
  loyaltyCardGradientType: string;
  loyaltyFaqHtml?: string;
  inviteText?: string;
  inviteLink?: string;
};

const FONTS = [
  { value: "Inter", label: "Inter (Современный)" },
  { value: "Roboto", label: "Roboto (Классический)" },
  { value: "Montserrat", label: "Montserrat (Округлый)" },
  { value: "Playfair Display", label: "Playfair (Элегантный)" },
];

const LAYOUTS = [
  { value: "grid", label: "Сетка 2x2" },
  { value: "list", label: "Список" },
  { value: "carousel", label: "Карусель" },
];

const RADIUS_OPTIONS = [
  { value: 0, label: "Острые" },
  { value: 8, label: "Скруглённые" },
  { value: 9999, label: "Круглые" },
];

const DEFAULT: Settings = {
  primaryColor: "#000000",
  secondaryColor: "#FFFFFF",
  theme: "light",
  fontFamily: "Inter",
  showStories: true,
  showLoyalty: true,
  showPopular: true,
  menuLayout: "grid",
  borderRadius: 8,
  loyaltyType: "points",
  loyaltyStampGoal: 6,
  loyaltyCashbackPct: 5,
  loyaltyInteraction: "app_only",
  posProvider: "none",
  menuSource: "excel",
  messengerTelegram: true,
  messengerVk: true,
  messengerMax: true,
  loyaltyCardGradientColors: "",
  loyaltyCardGradientOpacity: 100,
  loyaltyCardGradientType: "linear",
};

const LOYALTY_INTERACTIONS = [
  { value: "app_only", label: "Только в приложении" },
  { value: "iiko", label: "iiko" },
  { value: "rkeeper", label: "rkeeper" },
] as const;

type PreviewDevice = "phone" | "pc";

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("phone");

  useEffect(() => {
    fetch(`/api/superadmin/tenants/${tenantId}/settings`)
      .then((r) => r.json())
      .then((d) => {
        if (d.primaryColor) {
          const normalized = { ...d };
          if (normalized.loyaltyInteraction === undefined && d.loyaltyPosIntegration !== undefined) {
            normalized.loyaltyInteraction = d.loyaltyPosIntegration;
          }
          setSettings((s) => ({ ...s, ...normalized }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tenantId]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/superadmin/tenants/${tenantId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)]">
      <div className="flex-1 p-6 overflow-auto border-r">
        <div className="max-w-md space-y-6">
          <h2 className="text-xl font-bold">Конструктор приложения</h2>
          <Tabs defaultValue="branding">
            <TabsList>
              <TabsTrigger value="branding">Брендинг</TabsTrigger>
              <TabsTrigger value="colors">Цвета</TabsTrigger>
              <TabsTrigger value="layout">Экран</TabsTrigger>
              <TabsTrigger value="integrations">Интеграции</TabsTrigger>
              <TabsTrigger value="info">Информация</TabsTrigger>
            </TabsList>
            <TabsContent value="branding" className="space-y-4 pt-4">
              <div>
                <Label>Название приложения</Label>
                <Input
                  value={settings.appName ?? ""}
                  onChange={(e) => update("appName", e.target.value)}
                  placeholder="Название заведения"
                />
              </div>
              <ImageUploadField
                label="Логотип (URL или загрузка PNG/JPEG)"
                value={settings.logoUrl ?? ""}
                onChange={(url) => update("logoUrl", url)}
                field="logo"
                tenantId={tenantId}
              />
              <ImageUploadField
                label="Баннер (только на ПК)"
                value={settings.coverUrl ?? ""}
                onChange={(url) => update("coverUrl", url)}
                field="cover"
                tenantId={tenantId}
              />
            </TabsContent>
            <TabsContent value="colors" className="space-y-4 pt-4">
              <div>
                <Label>Основной цвет</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => update("primaryColor", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Тема</Label>
                <Select value={settings.theme} onValueChange={(v) => update("theme", v ?? "light")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Светлая</SelectItem>
                    <SelectItem value="dark">Тёмная</SelectItem>
                    <SelectItem value="auto">Как у пользователя</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Шрифт</Label>
                <Select value={settings.fontFamily} onValueChange={(v) => update("fontFamily", v ?? "Inter")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Скругление кнопок</Label>
                <Select
                  value={String(settings.borderRadius)}
                  onValueChange={(v) => update("borderRadius", Number(v ?? 8))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={String(r.value)}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="layout" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label>Блок «Истории»</Label>
                <Switch
                  checked={settings.showStories}
                  onCheckedChange={(v) => update("showStories", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Карточка лояльности</Label>
                <Switch
                  checked={settings.showLoyalty}
                  onCheckedChange={(v) => update("showLoyalty", v)}
                />
              </div>
              {settings.showLoyalty && (
                <div>
                  <Label>Тип программы лояльности</Label>
                  <Select
                    value={settings.loyaltyType}
                    onValueChange={(v) => update("loyaltyType", v ?? "points")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Баллы и кэшбек</SelectItem>
                      <SelectItem value="stamps">Штампы (кружки)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Популярные блюда</Label>
                <Switch
                  checked={settings.showPopular}
                  onCheckedChange={(v) => update("showPopular", v)}
                />
              </div>
              <div>
                <Label>Вид меню</Label>
                <Select value={settings.menuLayout} onValueChange={(v) => update("menuLayout", v ?? "grid")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Штампов до подарка</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.loyaltyStampGoal}
                  onChange={(e) => update("loyaltyStampGoal", Number(e.target.value) || 6)}
                />
              </div>
              <div>
                <Label>Кэшбек (%)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.loyaltyCashbackPct}
                  onChange={(e) => update("loyaltyCashbackPct", Number(e.target.value) || 0)}
                />
              </div>

              {settings.showLoyalty && (
                <div className="border-t pt-4 mt-4 space-y-3">
                  <Label className="text-base font-medium">Градиент бонусной карты</Label>
                  <div>
                    <Label className="text-xs">Цвета (через запятую, например #000000,#ffffff)</Label>
                    <Input
                      value={settings.loyaltyCardGradientColors ?? ""}
                      onChange={(e) => update("loyaltyCardGradientColors", e.target.value)}
                      placeholder="#000000, #ffffff"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Прозрачность (0–100)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.loyaltyCardGradientOpacity ?? 100}
                      onChange={(e) => update("loyaltyCardGradientOpacity", Number(e.target.value) || 100)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Тип градиента</Label>
                    <Select
                      value={settings.loyaltyCardGradientType ?? "linear"}
                      onValueChange={(v) => update("loyaltyCardGradientType", v ?? "linear")}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Линейный</SelectItem>
                        <SelectItem value="radial">Радиальный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {settings.showLoyalty && (
                <div className="border-t pt-4 mt-4 space-y-2">
                  <Label className="text-base font-medium">Описание программы лояльности (FAQ)</Label>
                  <p className="text-xs text-muted-foreground">
                    Показывается по нажатию на кнопку (i) на бонусной карте. Можно использовать HTML: &lt;b&gt;, &lt;u&gt;, &lt;a href=&quot;...&quot;&gt;ссылка&lt;/a&gt;
                  </p>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.loyaltyFaqHtml ?? ""}
                    onChange={(e) => update("loyaltyFaqHtml", e.target.value)}
                    placeholder="<p>Как копить баллы...</p>"
                  />
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="mb-4">
                  <Label className="text-base font-medium">Мессенджеры</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Включите только те платформы, которые используются для определения пользователя
                  </p>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Telegram</Label>
                        <Switch
                          checked={settings.messengerTelegram ?? true}
                          onCheckedChange={(v) => update("messengerTelegram", v)}
                        />
                      </div>
                      {settings.messengerTelegram !== false && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Токен бота Telegram (для отправки сообщений)"
                            value={settings.messengerTelegramBotId ?? ""}
                            onChange={(e) => update("messengerTelegramBotId", e.target.value)}
                            className="text-sm"
                            type="password"
                          />
                          <Input
                            placeholder="Username бота Telegram (например mybot)"
                            value={settings.messengerTelegramAppId ?? ""}
                            onChange={(e) => update("messengerTelegramAppId", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>VK</Label>
                        <Switch
                          checked={settings.messengerVk ?? true}
                          onCheckedChange={(v) => update("messengerVk", v)}
                        />
                      </div>
                      {settings.messengerVk !== false && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Токен группы VK (для отправки сообщений)"
                            value={settings.messengerVkGroupToken ?? ""}
                            onChange={(e) => update("messengerVkGroupToken", e.target.value)}
                            className="text-sm"
                            type="password"
                          />
                          <Input
                            placeholder="ID мини-приложения VK (числовой, например 51234567)"
                            value={settings.messengerVkAppId ?? ""}
                            onChange={(e) => update("messengerVkAppId", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>MAX (VK Кафе)</Label>
                        <Switch
                          checked={settings.messengerMax ?? true}
                          onCheckedChange={(v) => update("messengerMax", v)}
                        />
                      </div>
                      {settings.messengerMax !== false && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Токен бота MAX (для отправки сообщений)"
                            value={settings.messengerMaxBotId ?? ""}
                            onChange={(e) => update("messengerMaxBotId", e.target.value)}
                            className="text-sm"
                            type="password"
                          />
                          <Input
                            placeholder="ID ссылки на приложение MAX (например id526214415000_bot)"
                            value={settings.messengerMaxAppId ?? ""}
                            onChange={(e) => update("messengerMaxAppId", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="integrations" className="space-y-4 pt-4">
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="text-base font-medium">Интеграции: POS/меню и лояльность</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Настройте, откуда брать меню и где выполнять начисление/списание бонусов.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>POS-провайдер</Label>
                  <Select
                    value={settings.posProvider ?? "none"}
                    onValueChange={(v) => {
                      const nextPos = v ?? "none";
                      if (nextPos === "none") {
                        update("posProvider", "none");
                        update("menuSource", "excel");
                        update("loyaltyInteraction", "app_only");
                      } else {
                        update("posProvider", nextPos);
                        update("menuSource", "pos");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Нет POS (Excel + наш QR)</SelectItem>
                      <SelectItem value="iiko">iiko</SelectItem>
                      <SelectItem value="rkeeper">rkeeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Взаимодействие с бонусной картой</Label>
                  <Select
                    value={settings.loyaltyInteraction}
                    onValueChange={(v) => update("loyaltyInteraction", v ?? "app_only")}
                    disabled={(settings.posProvider ?? "none") === "none"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOYALTY_INTERACTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Как заведение будет начислять и списывать бонусы: в приложении, через iiko или rkeeper
                  </p>
                </div>

                {(settings.posProvider ?? "none") === "none" && (
                  <div className="space-y-3">
                    <IntegrationsExcelImportAndPhotos tenantId={tenantId} enabled={true} />
                  </div>
                )}

                {(settings.posProvider ?? "none") !== "none" && (
                  <div className="space-y-3">
                    {(settings.posProvider ?? "none") === "iiko" && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div>
                          <Label className="text-base font-medium">Технические настройки iiko</Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Синхронизация меню и приём заказов в iiko.
                          </p>
                        </div>
                        <div className="grid gap-2">
                          <Input
                            placeholder="API-ключ (из Настройки Cloud API в iikoWeb)"
                            value={settings.iikoApiLogin ?? ""}
                            onChange={(e) => update("iikoApiLogin", e.target.value)}
                            className="text-sm"
                            type="password"
                          />
                          <Input
                            placeholder="ID организации (UUID)"
                            value={settings.iikoOrganizationId ?? ""}
                            onChange={(e) => update("iikoOrganizationId", e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="ID терминальной группы (UUID)"
                            value={settings.iikoTerminalGroupId ?? ""}
                            onChange={(e) => update("iikoTerminalGroupId", e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="ID типа заказа (UUID) — fallback"
                            value={settings.iikoOrderTypeId ?? ""}
                            onChange={(e) => update("iikoOrderTypeId", e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="ID типа заказа DELIVERY (UUID)"
                            value={settings.iikoOrderTypeIdDelivery ?? ""}
                            onChange={(e) => update("iikoOrderTypeIdDelivery", e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="ID типа заказа PICKUP (UUID)"
                            value={settings.iikoOrderTypeIdPickup ?? ""}
                            onChange={(e) => update("iikoOrderTypeIdPickup", e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="ID типа заказа DINE_IN (UUID)"
                            value={settings.iikoOrderTypeIdDineIn ?? ""}
                            onChange={(e) => update("iikoOrderTypeIdDineIn", e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="ID способа оплаты (UUID)"
                            value={settings.iikoPaymentTypeId ?? ""}
                            onChange={(e) => update("iikoPaymentTypeId", e.target.value)}
                            className="text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-fit"
                            onClick={async () => {
                              try {
                                const r = await fetch(`/api/superadmin/tenants/${tenantId}/iiko/sync-menu`, {
                                  method: "POST",
                                });
                                const d = await r.json();
                                if (r.ok) {
                                  alert(`Синхронизировано: создано ${d.created}, обновлено ${d.updated}`);
                                } else {
                                  alert(d.error ?? "Ошибка");
                                }
                              } catch (e) {
                                alert(String(e));
                              }
                            }}
                          >
                            Синхронизировать меню из iiko
                          </Button>
                        </div>
                      </div>
                    )}

                    {(settings.posProvider ?? "none") === "rkeeper" && (
                      <div className="border rounded-lg p-4 text-sm text-muted-foreground">
                        Настройки rkeeper пока не реализованы в интерфейсе интеграций. Ожидаем спецификацию API.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="info" className="space-y-4 pt-4">
              <div>
                <Label>Адрес</Label>
                <Input
                  value={settings.infoAddress ?? ""}
                  onChange={(e) => update("infoAddress", e.target.value)}
                  placeholder="Большая Покровская 82"
                />
              </div>
              <div>
                <Label>Часы работы</Label>
                <Input
                  value={settings.infoHours ?? ""}
                  onChange={(e) => update("infoHours", e.target.value)}
                  placeholder="Ежедневно: с 10:00 до 21:30"
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={settings.infoPhone ?? ""}
                  onChange={(e) => update("infoPhone", e.target.value)}
                  placeholder="+7 (831) 217-55-15"
                />
              </div>
              <div>
                <Label>Текст блока контактов</Label>
                <Input
                  value={settings.infoContactText ?? ""}
                  onChange={(e) => update("infoContactText", e.target.value)}
                  placeholder="Проблемы с заказом? Напишите нам!"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Условия акций (URL)</Label>
                  <Input
                    value={settings.infoTermsUrl ?? ""}
                    onChange={(e) => update("infoTermsUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>FAQ (URL)</Label>
                  <Input
                    value={settings.infoFaqUrl ?? ""}
                    onChange={(e) => update("infoFaqUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Стать партнёром (URL)</Label>
                  <Input
                    value={settings.infoPartnerUrl ?? ""}
                    onChange={(e) => update("infoPartnerUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Калорийность (URL)</Label>
                  <Input
                    value={settings.infoCaloriesUrl ?? ""}
                    onChange={(e) => update("infoCaloriesUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={settings.infoSocialInstagram ?? ""}
                    onChange={(e) => update("infoSocialInstagram", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Telegram</Label>
                  <Input
                    value={settings.infoSocialTelegram ?? ""}
                    onChange={(e) => update("infoSocialTelegram", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>VK</Label>
                  <Input
                    value={settings.infoSocialVk ?? ""}
                    onChange={(e) => update("infoSocialVk", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <Label>О приложении</Label>
                <Input
                  value={settings.infoAboutText ?? ""}
                  onChange={(e) => update("infoAboutText", e.target.value)}
                  placeholder="Работает на Rest Digital"
                />
              </div>
              <div className="border-t pt-4 mt-4 space-y-2">
                <Label className="text-base font-medium">Приглашение друзей</Label>
                <p className="text-xs text-muted-foreground">
                  Текст и ссылка при нажатии «Приглашайте друзей». Если ссылка пуста — используется текущий URL с utm_source=invite
                </p>
                <div>
                  <Label className="text-xs">Текст приглашения</Label>
                  <Input
                    value={settings.inviteText ?? ""}
                    onChange={(e) => update("inviteText", e.target.value)}
                    placeholder={`${settings.appName ?? "Мы"} — закажи вкусно`}
                  />
                </div>
                <div>
                  <Label className="text-xs">Ссылка приглашения (оставьте пустым для текущего URL + UTM)</Label>
                  <Input
                    value={settings.inviteLink ?? ""}
                    onChange={(e) => update("inviteLink", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Сохранение..." : "Сохранить дизайн"}
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center bg-muted/20 gap-4">
        <div className="flex gap-2">
          <Button
            variant={previewDevice === "phone" ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewDevice("phone")}
          >
            <Smartphone size={18} className="mr-1" />
            Телефон
          </Button>
          <Button
            variant={previewDevice === "pc" ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewDevice("pc")}
          >
            <Monitor size={18} className="mr-1" />
            ПК
          </Button>
        </div>
        {previewDevice === "phone" ? (
          <PhonePreview settings={settings} />
        ) : (
          <PcPreview settings={settings} />
        )}
      </div>
    </div>
  );
}

type PreviewTab = "home" | "profile" | "info";

function PhonePreview({ settings }: { settings: Settings }) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("home");
  const isDark = settings.theme === "dark";
  const bg = isDark ? "#1a1a1a" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#171717";
  const borderStyle = { borderRadius: settings.borderRadius };

  return (
    <div
      className="w-[320px] h-[600px] rounded-3xl border-4 border-gray-800 overflow-hidden shadow-2xl flex flex-col"
      style={{ backgroundColor: bg }}
    >
      <div
        className="flex-1 overflow-auto p-3 pb-2 pt-6"
        style={{ color: fg }}
      >
        {activeTab === "home" && (
          <PreviewHomeContent settings={settings} isDark={isDark} borderStyle={borderStyle} />
        )}
        {activeTab === "profile" && (
          <PreviewProfileContent settings={settings} isDark={isDark} borderStyle={borderStyle} />
        )}
        {activeTab === "info" && (
          <PreviewInfoContent settings={settings} isDark={isDark} borderStyle={borderStyle} />
        )}
      </div>
      {activeTab === "home" && (
        <div
          className="flex items-center gap-2 px-3 py-2 shrink-0 border-t"
          style={{
            backgroundColor: bg,
            borderColor: isDark ? "#333" : "#eee",
          }}
        >
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium"
            style={{
              backgroundColor: settings.primaryColor,
              borderRadius: settings.borderRadius + 4,
            }}
          >
            <ShoppingCart size={20} strokeWidth={2} className="shrink-0" />
            <span className="truncate">Корзина</span>
            <span className="shrink-0">920 ₽</span>
          </div>
          <button
            type="button"
            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            style={{
              borderColor: isDark ? "#444" : "#e5e7eb",
              backgroundColor: isDark ? "#222" : "#f5f5f5",
              borderRadius: settings.borderRadius + 4,
            }}
            aria-label="Фильтр меню"
          >
            <ListFilter size={20} strokeWidth={2} style={{ color: fg }} />
          </button>
        </div>
      )}
      <nav
        className="flex border-t shrink-0"
        style={{ backgroundColor: bg, borderColor: isDark ? "#333" : "#eee" }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`flex-1 py-3 flex items-center justify-center ${activeTab === "home" ? "opacity-100" : "opacity-60"}`}
          style={{ color: fg }}
        >
          <Home size={22} strokeWidth={activeTab === "home" ? 2.5 : 2} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-3 flex items-center justify-center ${activeTab === "profile" ? "opacity-100" : "opacity-60"}`}
          style={{ color: fg }}
        >
          <User size={22} strokeWidth={activeTab === "profile" ? 2.5 : 2} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-3 flex items-center justify-center ${activeTab === "info" ? "opacity-100" : "opacity-60"}`}
          style={{ color: fg }}
        >
          <Menu size={22} strokeWidth={activeTab === "info" ? 2.5 : 2} />
        </button>
      </nav>
    </div>
  );
}

function PcPreview({ settings }: { settings: Settings }) {
  const isDark = settings.theme === "dark";
  const bg = isDark ? "#1a1a1a" : "#f8fafc";
  const fg = isDark ? "#ffffff" : "#171717";
  const borderStyle = { borderRadius: settings.borderRadius };

  return (
    <div
      className="w-[800px] max-w-full h-[560px] rounded-xl border-2 border-gray-300 overflow-hidden shadow-xl flex flex-col"
      style={{ backgroundColor: bg, color: fg }}
    >
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="w-10 h-10 object-cover" />
            ) : (
              <div className="w-10 h-10 bg-white/20" />
            )}
            <MapPin size={20} className="opacity-60" />
          </div>
          <div
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: settings.primaryColor + "30", ...borderStyle }}
          >
            Корзина
          </div>
        </div>
        <div className="flex gap-2">
          <div
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: settings.primaryColor, ...borderStyle }}
          >
            Самовывоз
          </div>
          <div
            className="px-4 py-2 rounded-lg text-sm opacity-70"
            style={{ backgroundColor: isDark ? "#333" : "#e5e7eb", ...borderStyle }}
          >
            В зале
          </div>
        </div>
        <div
          className="w-full py-2 px-3 rounded-lg text-sm opacity-70"
          style={{ backgroundColor: isDark ? "#333" : "#e5e7eb", ...borderStyle }}
        >
          Поиск товаров
        </div>
        {settings.coverUrl && (
          <div
            className="w-full h-32 rounded-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.coverUrl})`, ...borderStyle }}
          />
        )}
        {settings.showLoyalty && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white"
            style={{ backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius + 4 }}
          >
            {settings.loyaltyType === "stamps" ? (
              <Gift size={22} />
            ) : (
              <Coins size={22} />
            )}
            <div>
              <div className="font-semibold">
                {settings.loyaltyType === "stamps"
                  ? "Собирайте штампы"
                  : "Получать бонусы и скидки"}
              </div>
              <div className="text-sm opacity-80">
                {settings.loyaltyType === "stamps"
                  ? `Авторизуйтесь, копите штампы — подарок за ${settings.loyaltyStampGoal} шт`
                  : "Авторизуйтесь, чтобы копить баллы"}
              </div>
            </div>
            <ChevronRight size={20} className="ml-auto opacity-70" />
          </div>
        )}
        {settings.showStories && (
          <div
            className="h-20 rounded-xl flex items-center justify-center text-xs opacity-60"
            style={{ backgroundColor: isDark ? "#333" : "#e5e7eb", ...borderStyle }}
          >
            Истории
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["Все", ...(settings.showPopular ? ["Популярное"] : []), "Напитки", "Закуски"].map((l) => (
            <span
              key={l}
              className="text-xs px-3 py-1.5 rounded-full shrink-0"
              style={{ backgroundColor: isDark ? "#333" : "#e5e7eb" }}
            >
              {l}
            </span>
          ))}
        </div>
        <div className="text-sm font-semibold">Меню</div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-lg p-2 border"
              style={{
                backgroundColor: isDark ? "#222" : "#fff",
                borderColor: isDark ? "#444" : "#e5e7eb",
                ...borderStyle,
              }}
            >
              <div className="aspect-square rounded-lg bg-white/10 mb-2" />
              <div className="text-xs font-medium truncate">Товар {i}</div>
              <div className="text-xs opacity-70">от 300 ₽</div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="flex items-center gap-2 px-4 py-2 border-t shrink-0"
        style={{ borderColor: isDark ? "#333" : "#e5e7eb" }}
      >
        <div
          className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{
            backgroundColor: settings.primaryColor,
            borderRadius: settings.borderRadius + 4,
          }}
        >
          <ShoppingCart size={20} strokeWidth={2} className="shrink-0" />
          <span>Корзина</span>
          <span className="shrink-0">920 ₽</span>
        </div>
        <div
          className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
          style={{
            borderColor: isDark ? "#444" : "#e5e7eb",
            backgroundColor: isDark ? "#222" : "#f5f5f5",
            borderRadius: settings.borderRadius + 4,
          }}
        >
          <ListFilter size={20} strokeWidth={2} />
        </div>
      </div>
      <div
        className="flex justify-center gap-8 py-2 border-t shrink-0"
        style={{ borderColor: isDark ? "#333" : "#e5e7eb" }}
      >
        <span className="text-sm opacity-100">Главная</span>
        <span className="text-sm opacity-60">Профиль</span>
        <span className="text-sm opacity-60">Информация</span>
      </div>
    </div>
  );
}

function PreviewHomeContent({
  settings,
  isDark,
  borderStyle,
}: {
  settings: Settings;
  isDark: boolean;
  borderStyle: React.CSSProperties;
}) {
  const chipStyle = { borderRadius: settings.borderRadius };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="w-8 h-8 object-cover shrink-0" />
          ) : null}
          <MapPin size={18} strokeWidth={2} className="opacity-60" />
        </div>
        <div
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: settings.primaryColor + "20", ...chipStyle }}
        >
          <ShoppingCart size={18} strokeWidth={2} className="shrink-0" />
          Корзина
        </div>
      </div>
      <div className="flex gap-2">
        <div
          className="px-3 py-2 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: settings.primaryColor, ...chipStyle }}
        >
          Самовывоз
        </div>
        <div
          className="px-3 py-2 rounded-lg text-sm opacity-70"
          style={{ backgroundColor: isDark ? "#333" : "#eee", ...chipStyle }}
        >
          В зале
        </div>
      </div>
      <div
        className="w-full py-2 px-3 rounded-lg text-sm opacity-70"
        style={{ backgroundColor: isDark ? "#333" : "#eee", ...borderStyle }}
      >
        Поиск товаров
      </div>
      {settings.showLoyalty && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm"
          style={{ backgroundColor: settings.primaryColor, borderRadius: settings.borderRadius + 4 }}
        >
          {settings.loyaltyType === "stamps" ? (
            <Gift size={18} className="shrink-0" />
          ) : (
            <Coins size={18} className="shrink-0 opacity-90" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold">
              {settings.loyaltyType === "stamps"
                ? "Собирайте штампы"
                : "Получать бонусы и скидки"}
            </div>
            <div className="text-xs opacity-80">
              {settings.loyaltyType === "stamps"
                ? `Авторизуйтесь, копите штампы — подарок за ${settings.loyaltyStampGoal} шт`
                : "Авторизуйтесь, чтобы копить и использовать баллы"}
            </div>
          </div>
          <ChevronRight size={16} className="shrink-0 opacity-70" />
        </div>
      )}
      {settings.showStories && (
        <div
          className="h-16 rounded-lg flex items-center justify-center text-xs opacity-60"
          style={{ backgroundColor: isDark ? "#333" : "#eee", ...borderStyle }}
        >
          Истории
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Все", ...(settings.showPopular ? ["Популярное"] : []), "Напитки"].map((l) => (
          <span
            key={l}
            className="text-sm px-4 py-2 rounded-full shrink-0"
            style={{ backgroundColor: isDark ? "#333" : "#eee", opacity: 0.9 }}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="text-sm font-semibold">Меню</div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg p-2 border"
            style={{ backgroundColor: isDark ? "#222" : "#f5f5f5", borderColor: isDark ? "#444" : "#e5e5e5", ...borderStyle }}
          >
            <div className="aspect-square rounded-lg bg-white/10 mb-2" style={chipStyle} />
            <div className="text-xs font-medium truncate">Товар {i}</div>
            <div className="text-xs opacity-70">от 300 ₽</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewProfileContent({
  settings,
  isDark,
  borderStyle,
}: {
  settings: Settings;
  isDark: boolean;
  borderStyle: React.CSSProperties;
}) {
  const profileItems = [
    { label: "Приглашайте друзей", sub: "Дарим 300 баллов за каждого" },
    { label: "Мои заказы" },
    { label: "Мои адреса" },
    { label: "Мои данные" },
    { label: "Банковские карты" },
    { label: "Город" },
    { label: "Выйти" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">Гость</div>
          <div className="text-sm opacity-70">+7 (___) ___-__-__</div>
        </div>
        <Bell size={22} strokeWidth={2} className="opacity-60" />
      </div>
      {settings.showLoyalty && settings.loyaltyType === "points" && (
        <div
          className="p-4 rounded-xl border text-left"
          style={{ borderColor: isDark ? "#444" : "#e5e5e5", ...borderStyle }}
        >
          <div className="flex justify-between mb-2">
            <span className="font-medium">Начинающий</span>
            <span className="text-sm opacity-70">i</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span><span className="font-semibold">0</span> баллов</span>
            <span>{settings.loyaltyCashbackPct}% Кэшбэк</span>
            <span className="text-sm">QR-код</span>
          </div>
        </div>
      )}
      {settings.showLoyalty && settings.loyaltyType === "stamps" && (
        <div
          className="p-4 rounded-xl border"
          style={{ borderColor: isDark ? "#444" : "#e5e5e5", ...borderStyle }}
        >
          <div className="font-medium mb-2">Штампы</div>
          <div className="flex gap-2">
            {Array.from({ length: settings.loyaltyStampGoal }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
                style={{ borderColor: isDark ? "#555" : "#ccc" }}
              />
            ))}
          </div>
          <div className="text-sm mt-2 opacity-70">0 / {settings.loyaltyStampGoal} — следующий в подарок</div>
        </div>
      )}
      <div className="space-y-1">
        {profileItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border text-left"
            style={{ borderColor: isDark ? "#444" : "#e5e5e5", ...borderStyle }}
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{item.label}</div>
              {item.sub && <div className="text-xs opacity-70">{item.sub}</div>}
            </div>
            <ChevronRight size={18} className="opacity-50 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewInfoContent({
  settings,
  isDark,
  borderStyle,
}: {
  settings: Settings;
  isDark: boolean;
  borderStyle: React.CSSProperties;
}) {
  const links = [
    { label: "Условия проведения акций", url: settings.infoTermsUrl },
    { label: "Частые вопросы", url: settings.infoFaqUrl },
    { label: "Стать партнером", url: settings.infoPartnerUrl },
    { label: "Таблица калорийности", url: settings.infoCaloriesUrl },
  ].filter((l) => l.url);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Меню</h1>
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l.label} className="py-3 border-b text-sm">
              {l.label}
            </div>
          ))}
        </div>
      )}
      {(settings.infoAddress || settings.infoHours) && (
        <div>
          {settings.infoAddress && <div className="font-medium text-sm">{settings.infoAddress}</div>}
          {settings.infoHours && (
            <div className="text-sm opacity-70 mt-1">{settings.infoHours}</div>
          )}
        </div>
      )}
      <div
        className="p-4 rounded-xl border text-sm"
        style={{ borderColor: isDark ? "#444" : "#e5e5e5", ...borderStyle }}
      >
        <div className="font-medium mb-2">
          {settings.infoContactText ?? "Проблемы с заказом или появился вопрос? Напишите нам!"}
        </div>
        {settings.infoPhone && (
          <div className="text-base">{settings.infoPhone}</div>
        )}
        {(settings.infoSocialInstagram || settings.infoSocialTelegram || settings.infoSocialVk) && (
          <div className="flex gap-4 mt-3 text-sm">
            {settings.infoSocialInstagram && <span>Instagram</span>}
            {settings.infoSocialTelegram && <span>Telegram</span>}
            {settings.infoSocialVk && <span>VK</span>}
          </div>
        )}
      </div>
      {settings.infoAboutText && (
        <div>
          <h2 className="font-medium mb-2 text-sm">О приложении</h2>
          <div className="text-sm opacity-80">{settings.infoAboutText}</div>
        </div>
      )}
      <div className="text-sm opacity-60">Работает на Rest Digital</div>
    </div>
  );
}
