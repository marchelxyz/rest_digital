"use client";

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

export function LoyaltyScannerClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
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
      stopCamera();
    };
  }, []);

  async function startCamera() {
    setErr(null);
    setCustomer(null);
    setCameraOn(true);
    const video = videoRef.current;
    if (!video) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      if (!("BarcodeDetector" in window)) {
        setErr("Сканер QR не поддерживается в этом браузере. Используйте ручной ввод кода.");
        return;
      }
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const tick = async () => {
        const v = videoRef.current;
        if (!v || !cameraOn) return;
        if (v.videoWidth > 0 && v.videoHeight > 0) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          try {
            const barcodes = await detector.detect(canvas);
            const raw = barcodes?.[0]?.rawValue;
            if (raw) {
              setCode(raw);
              stopCamera();
              void lookup(raw);
              return;
            }
          } catch {
            // ignore frame errors
          }
        }
        scanTimerRef.current = window.setTimeout(tick, 350);
      };
      void tick();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setCameraOn(false);
    }
  }

  function stopCamera() {
    if (scanTimerRef.current != null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
      streamRef.current = null;
    }
    const v = videoRef.current;
    if (v) v.srcObject = null;
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

