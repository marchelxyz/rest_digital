"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Customer = {
  id: string;
  phone: string;
  name?: string | null;
  points: number;
  stamps: number;
  referralCode?: string | null;
};

export function LoyaltyScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [code, setCode] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deltaPoints, setDeltaPoints] = useState<number>(0);
  const [deltaStamps, setDeltaStamps] = useState<number>(0);
  const [cameraOn, setCameraOn] = useState(false);

  const canAdjust = useMemo(() => !!customer, [customer]);

  useEffect(() => {
    return () => {
      try {
        readerRef.current?.reset();
      } catch {
        // ignore
      }
    };
  }, []);

  async function startCamera() {
    setErr(null);
    setCustomer(null);
    setCameraOn(true);
    if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
    const reader = readerRef.current;
    const video = videoRef.current;
    if (!video) return;
    try {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const deviceId = devices[0]?.deviceId;
      await reader.decodeFromVideoDevice(deviceId, video, (result, error) => {
        if (result) {
          const text = result.getText();
          setCode(text);
          stopCamera();
          void lookup(text);
        } else if (error) {
          // ignore scan errors
        }
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setCameraOn(false);
    }
  }

  function stopCamera() {
    try {
      readerRef.current?.reset();
    } catch {
      // ignore
    }
    setCameraOn(false);
  }

  async function lookup(v?: string) {
    const value = (v ?? code).trim();
    if (!value) return;
    setLoading(true);
    setErr(null);
    setCustomer(null);
    try {
      const res = await fetch("/api/restaurant/loyalty/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Ошибка поиска");
        return;
      }
      setCustomer(data);
      setDeltaPoints(0);
      setDeltaStamps(0);
    } finally {
      setLoading(false);
    }
  }

  async function adjust() {
    if (!customer) return;
    if (!deltaPoints && !deltaStamps) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/restaurant/loyalty/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          deltaPoints: deltaPoints || 0,
          deltaStamps: deltaStamps || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Ошибка операции");
        return;
      }
      setCustomer((c) => (c ? { ...c, points: data.points, stamps: data.stamps } : c));
      setDeltaPoints(0);
      setDeltaStamps(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
        <div className="text-base font-semibold">Сканирование</div>
        <div className="grid gap-2">
          <Label>Код (referralCode или телефон)</Label>
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Например: +79991234567 или ABC123" />
            <Button onClick={() => lookup()} disabled={loading}>Найти</Button>
          </div>
          <div className="flex gap-2">
            {!cameraOn ? (
              <Button variant="outline" onClick={startCamera} disabled={loading}>Включить камеру</Button>
            ) : (
              <Button variant="outline" onClick={stopCamera}>Выключить камеру</Button>
            )}
          </div>
          {cameraOn && (
            <div className="rounded-lg overflow-hidden border">
              <video ref={videoRef} className="w-full" />
            </div>
          )}
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </div>

      {customer && (
        <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
          <div className="text-base font-semibold">Гость</div>
          <div className="text-sm">
            <div><b>Телефон:</b> {customer.phone}</div>
            <div><b>Имя:</b> {customer.name ?? "—"}</div>
            <div><b>Баллы:</b> {customer.points}</div>
            <div><b>Штампы:</b> {customer.stamps}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Δ баллы (можно отриц.)</Label>
              <Input
                type="number"
                value={deltaPoints}
                onChange={(e) => setDeltaPoints(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Δ штампы (можно отриц.)</Label>
              <Input
                type="number"
                value={deltaStamps}
                onChange={(e) => setDeltaStamps(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <Button onClick={adjust} disabled={!canAdjust || loading || (!deltaPoints && !deltaStamps)}>
            Применить
          </Button>
          <div className="text-xs text-muted-foreground">
            Примечание: этот сканер работает только для лояльности в приложении (без POS). В POS-режиме скидки/бонусы должны применяться в кассе/сканером POS.
          </div>
        </div>
      )}
    </div>
  );
}

