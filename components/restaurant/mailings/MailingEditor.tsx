"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Trash2,
  Save,
  Send,
  Plus,
  Image as ImageIcon,
  Video,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { RichTextEditor } from "@/components/restaurant/mailings/RichTextEditor";
import { SegmentSelector } from "@/components/restaurant/mailings/SegmentSelector";
import type {
  MailingWithSegment,
  MailingSegment,
  MailingChannel,
  MediaAttachment,
  MailingButton,
} from "@/components/restaurant/mailings/types";
import { CHANNEL_LABELS } from "@/components/restaurant/mailings/types";

type Props = {
  mailing: MailingWithSegment | null;
  segments: MailingSegment[];
  onBack: () => void;
  onCreated?: (m: MailingWithSegment) => void;
  onUpdated?: (m: MailingWithSegment) => void;
  onDeleted?: (id: string) => void;
  onSegmentsChanged: () => void;
};

/**
 * Редактор одной рассылки: канал, сегмент, текст (rich), медиа, кнопки.
 */
export function MailingEditor({
  mailing,
  segments,
  onBack,
  onCreated,
  onUpdated,
  onDeleted,
  onSegmentsChanged,
}: Props) {
  const isNew = !mailing;

  const [name, setName] = useState(mailing?.name ?? "");
  const [channel, setChannel] = useState<MailingChannel>(mailing?.channel ?? "TELEGRAM");
  const [bodyHtml, setBodyHtml] = useState(mailing?.bodyHtml ?? "");
  const [segmentId, setSegmentId] = useState<string | null>(mailing?.segmentId ?? null);
  const [rateLimit, setRateLimit] = useState(mailing?.rateLimit ?? 50);
  const [media, setMedia] = useState<MediaAttachment[]>(
    _parseJson<MediaAttachment[]>(mailing?.mediaJson) ?? []
  );
  const [buttons, setButtons] = useState<MailingButton[]>(
    _parseJson<MailingButton[]>(mailing?.buttonsJson) ?? []
  );
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const payload = {
      name: name.trim() || "Без названия",
      channel,
      bodyHtml,
      bodyPlain: _stripHtml(bodyHtml),
      segmentId,
      rateLimit,
      mediaJson: media.length > 0 ? media : null,
      buttonsJson: buttons.length > 0 ? buttons : null,
    };

    if (isNew) {
      const res = await fetch("/api/restaurant/mailings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) onCreated?.(await res.json());
    } else {
      const res = await fetch(`/api/restaurant/mailings/${mailing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) onUpdated?.(await res.json());
    }
    setSaving(false);
  }, [name, channel, bodyHtml, segmentId, rateLimit, media, buttons, isNew, mailing, onCreated, onUpdated]);

  async function handleDelete() {
    if (!mailing) return;
    if (!confirm("Удалить рассылку?")) return;
    const res = await fetch(`/api/restaurant/mailings/${mailing.id}`, { method: "DELETE" });
    if (res.ok) onDeleted?.(mailing.id);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">
          {isNew ? "Новая рассылка" : "Редактирование рассылки"}
        </h1>
        {!isNew && (
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 size={16} className="mr-1" /> Удалить
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Акция выходного дня" />
        </div>
        <div className="space-y-2">
          <Label>Канал</Label>
          <div className="flex gap-2">
            {(Object.keys(CHANNEL_LABELS) as MailingChannel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  channel === ch
                    ? "border-[var(--admin-yellow)] bg-[var(--admin-yellow)]/10 text-[var(--admin-yellow-dark)]"
                    : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                }`}
              >
                {CHANNEL_LABELS[ch]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SegmentSelector
        segments={segments}
        selectedId={segmentId}
        onSelect={setSegmentId}
        onSegmentsChanged={onSegmentsChanged}
      />

      <div className="space-y-2">
        <Label>Лимит отправки (сообщений / час)</Label>
        <Input
          type="number"
          min={1}
          max={1000}
          value={rateLimit}
          onChange={(e) => setRateLimit(Number(e.target.value) || 50)}
          className="w-40"
        />
      </div>

      <div className="space-y-2">
        <Label>Текст рассылки</Label>
        <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
      </div>

      <MediaSection media={media} onChange={setMedia} />
      <ButtonsSection buttons={buttons} onChange={setButtons} />

      <div className="flex gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? "Сохранение..." : "Сохранить"}
        </Button>
        {!isNew && mailing.status === "DRAFT" && (
          <Button
            variant="outline"
            onClick={async () => {
              await handleSave();
              const res = await fetch(`/api/restaurant/mailings/${mailing.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "SCHEDULED" }),
              });
              if (res.ok) onUpdated?.(await res.json());
            }}
          >
            <Send size={16} className="mr-2" />
            Запланировать
          </Button>
        )}
      </div>
    </div>
  );
}

function MediaSection({
  media,
  onChange,
}: {
  media: MediaAttachment[];
  onChange: (m: MediaAttachment[]) => void;
}) {
  function addMedia(type: "photo" | "video") {
    const url = prompt(type === "photo" ? "URL фотографии:" : "URL видео:");
    if (!url?.trim()) return;
    onChange([...media, { type, url: url.trim() }]);
  }

  return (
    <div className="space-y-3">
      <Label>Медиа-вложения</Label>
      <div className="flex gap-2 flex-wrap">
        {media.map((m, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg text-sm">
            {m.type === "photo" ? <ImageIcon size={16} /> : <Video size={16} />}
            <span className="max-w-[200px] truncate">{m.url}</span>
            <button onClick={() => onChange(media.filter((_, idx) => idx !== i))} className="text-neutral-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => addMedia("photo")}>
          <ImageIcon size={14} className="mr-1" /> Фото
        </Button>
        <Button variant="outline" size="sm" onClick={() => addMedia("video")}>
          <Video size={14} className="mr-1" /> Видео
        </Button>
      </div>
    </div>
  );
}

function ButtonsSection({
  buttons,
  onChange,
}: {
  buttons: MailingButton[];
  onChange: (b: MailingButton[]) => void;
}) {
  function addButton() {
    onChange([...buttons, { label: "Подробнее", url: "", linkType: "banner" }]);
  }

  function updateButton(index: number, patch: Partial<MailingButton>) {
    onChange(buttons.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  return (
    <div className="space-y-3">
      <Label>Кнопки</Label>
      {buttons.map((btn, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            value={btn.label}
            onChange={(e) => updateButton(i, { label: e.target.value })}
            placeholder="Текст кнопки"
            className="flex-1"
          />
          <Input
            value={btn.url}
            onChange={(e) => updateButton(i, { url: e.target.value })}
            placeholder="URL (акция / раздел)"
            className="flex-1"
          />
          <select
            value={btn.linkType}
            onChange={(e) => updateButton(i, { linkType: e.target.value as "banner" | "section" })}
            className="border rounded-lg px-2 py-2 text-sm"
          >
            <option value="banner">Баннер / Акция</option>
            <option value="section">Раздел</option>
          </select>
          <button onClick={() => onChange(buttons.filter((_, idx) => idx !== i))} className="text-neutral-400 hover:text-red-500">
            <X size={16} />
          </button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addButton}>
        <Plus size={14} className="mr-1" /> Добавить кнопку
      </Button>
    </div>
  );
}

function _parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function _stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
