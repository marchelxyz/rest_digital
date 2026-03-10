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
  loyaltyStampGoal: number;
  loyaltyCashbackPct: number;
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
  loyaltyStampGoal: 6,
  loyaltyCashbackPct: 5,
};

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/superadmin/tenants/${tenantId}/settings`)
      .then((r) => r.json())
      .then((d) => {
        if (d.primaryColor) setSettings((s) => ({ ...s, ...d }));
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
              <div>
                <Label>Логотип (URL)</Label>
                <Input
                  value={settings.logoUrl ?? ""}
                  onChange={(e) => update("logoUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Обложка (URL)</Label>
                <Input
                  value={settings.coverUrl ?? ""}
                  onChange={(e) => update("coverUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
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
            </TabsContent>
          </Tabs>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Сохранение..." : "Сохранить дизайн"}
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 flex items-center justify-center bg-muted/20">
        <PhonePreview settings={settings} />
      </div>
    </div>
  );
}

function PhonePreview({ settings }: { settings: Settings }) {
  const isDark = settings.theme === "dark";
  const bg = isDark ? "#1a1a1a" : "#ffffff";
  const fg = isDark ? "#ffffff" : "#171717";

  return (
    <div
      className="w-[320px] h-[600px] rounded-3xl border-4 border-gray-800 overflow-hidden shadow-2xl"
      style={{ backgroundColor: bg }}
    >
      <div className="p-4" style={{ color: fg }}>
        {settings.coverUrl ? (
          <div
            className="h-24 rounded-lg mb-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.coverUrl})` }}
          />
        ) : (
          <div
            className="h-24 rounded-lg mb-4 flex items-center justify-center text-sm opacity-60"
            style={{ backgroundColor: isDark ? "#333" : "#eee" }}
          >
            Обложка
          </div>
        )}
        <div className="flex items-center gap-2 mb-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : null}
          <span className="font-semibold">{settings.appName || "Название"}</span>
        </div>
        {settings.showLoyalty && (
          <div
            className="p-3 rounded-lg mb-4"
            style={{
              backgroundColor: settings.primaryColor,
              color: "#fff",
              borderRadius: settings.borderRadius,
            }}
          >
            <div className="text-sm font-medium">Программа лояльности</div>
            <div className="text-xs opacity-90">0 / {settings.loyaltyStampGoal} штампов</div>
          </div>
        )}
        {settings.showPopular && (
          <div className="text-sm font-medium mb-2">Популярное</div>
        )}
        <div
          className="h-20 rounded-lg flex items-center justify-center text-sm"
          style={{
            backgroundColor: settings.primaryColor,
            color: "#fff",
            borderRadius: settings.borderRadius,
          }}
        >
          В корзину
        </div>
      </div>
    </div>
  );
}
