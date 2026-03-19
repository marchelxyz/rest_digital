"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MailingsList } from "@/components/restaurant/mailings/MailingsList";
import { MailingEditor } from "@/components/restaurant/mailings/MailingEditor";
import type { MailingWithSegment, MailingSegment } from "@/components/restaurant/mailings/types";

/**
 * Корневой клиентский компонент раздела «Рассылки».
 */
export function MailingsClient() {
  const [mailings, setMailings] = useState<MailingWithSegment[]>([]);
  const [segments, setSegments] = useState<MailingSegment[]>([]);
  const [editing, setEditing] = useState<MailingWithSegment | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    const [mailRes, segRes] = await Promise.all([
      fetch("/api/restaurant/mailings"),
      fetch("/api/restaurant/mailing-segments"),
    ]);
    if (mailRes.ok) setMailings(await mailRes.json());
    if (segRes.ok) setSegments(await segRes.json());
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function handleCreated(m: MailingWithSegment) {
    setMailings((prev) => [m, ...prev]);
    setCreating(false);
    setEditing(m);
  }

  function handleUpdated(m: MailingWithSegment) {
    setMailings((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    setEditing(m);
  }

  function handleDeleted(id: string) {
    setMailings((prev) => prev.filter((x) => x.id !== id));
    setEditing(null);
  }

  if (editing) {
    return (
      <MailingEditor
        mailing={editing}
        segments={segments}
        onBack={() => setEditing(null)}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        onSegmentsChanged={fetchAll}
      />
    );
  }

  if (creating) {
    return (
      <MailingEditor
        mailing={null}
        segments={segments}
        onBack={() => setCreating(false)}
        onCreated={handleCreated}
        onSegmentsChanged={fetchAll}
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Рассылки</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus size={18} className="mr-2" />
          Создать рассылку
        </Button>
      </div>
      <MailingsList mailings={mailings} onSelect={setEditing} />
    </div>
  );
}
