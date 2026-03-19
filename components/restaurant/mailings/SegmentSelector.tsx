"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Users, ChevronDown, ChevronUp } from "lucide-react";
import type { MailingSegment } from "@/components/restaurant/mailings/types";

type Props = {
  segments: MailingSegment[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSegmentsChanged: () => void;
};

/**
 * Выбор или создание сегмента аудитории для рассылки.
 */
export function SegmentSelector({ segments, selectedId, onSelect, onSegmentsChanged }: Props) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <Label>Сегмент аудитории</Label>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onSelect(null)}
          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
            !selectedId
              ? "border-[var(--admin-yellow)] bg-[var(--admin-yellow)]/10 text-[var(--admin-yellow-dark)] font-medium"
              : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
          }`}
        >
          <Users size={14} className="inline mr-1" />
          Вся база
        </button>
        {segments.map((seg) => (
          <button
            key={seg.id}
            onClick={() => onSelect(seg.id)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              selectedId === seg.id
                ? "border-[var(--admin-yellow)] bg-[var(--admin-yellow)]/10 text-[var(--admin-yellow-dark)] font-medium"
                : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
            }`}
          >
            {seg.name}
          </button>
        ))}
        <button
          onClick={() => setCreating(true)}
          className="px-3 py-2 rounded-lg text-sm border border-dashed border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <Plus size={14} className="inline mr-1" />
          Новый сегмент
        </button>
      </div>

      {creating && (
        <SegmentCreator
          onCreated={(id) => {
            onSelect(id);
            onSegmentsChanged();
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  );
}

function SegmentCreator({
  onCreated,
  onCancel,
}: {
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [avgCheckFrom, setAvgCheckFrom] = useState("");
  const [avgCheckTo, setAvgCheckTo] = useState("");
  const [maxMsgsHour, setMaxMsgsHour] = useState("50");
  const [saving, setSaving] = useState(false);

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/restaurant/mailing-segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        ageFrom: ageFrom ? Number(ageFrom) : null,
        ageTo: ageTo ? Number(ageTo) : null,
        platforms: platforms.length > 0 ? platforms : null,
        avgCheckFrom: avgCheckFrom || null,
        avgCheckTo: avgCheckTo || null,
        maxMessagesPerHour: Number(maxMsgsHour) || 50,
      }),
    });
    if (res.ok) {
      const seg = await res.json();
      onCreated(seg.id);
    }
    setSaving(false);
  }

  return (
    <div className="border rounded-lg p-4 bg-neutral-50 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Новый сегмент</h3>
        <div className="flex gap-1">
          <button onClick={() => setExpanded((p) => !p)} className="p-1 rounded hover:bg-neutral-200">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={onCancel} className="p-1 rounded hover:bg-neutral-200 text-neutral-400">
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="space-y-2">
            <Label>Название сегмента</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Молодёжь 18-25, Telegram" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Возраст от</Label>
              <Input type="number" value={ageFrom} onChange={(e) => setAgeFrom(e.target.value)} placeholder="18" />
            </div>
            <div className="space-y-2">
              <Label>Возраст до</Label>
              <Input type="number" value={ageTo} onChange={(e) => setAgeTo(e.target.value)} placeholder="65" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Площадка</Label>
            <div className="flex gap-2">
              {["telegram", "vk", "max"].map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    platforms.includes(p)
                      ? "border-[var(--admin-yellow)] bg-[var(--admin-yellow)]/10 font-medium"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  {p === "telegram" ? "Telegram" : p === "vk" ? "ВКонтакте" : "MAX"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Средний чек от (₽)</Label>
              <Input type="number" value={avgCheckFrom} onChange={(e) => setAvgCheckFrom(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Средний чек до (₽)</Label>
              <Input type="number" value={avgCheckTo} onChange={(e) => setAvgCheckTo(e.target.value)} placeholder="5000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Лимит сообщений в час</Label>
            <Input type="number" value={maxMsgsHour} onChange={(e) => setMaxMsgsHour(e.target.value)} placeholder="50" className="w-32" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !name.trim()} size="sm">
              {saving ? "Создание..." : "Создать сегмент"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
