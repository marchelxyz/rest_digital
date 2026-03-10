"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateLoginDialogProps = {
  tenantId: string;
  tenantName: string;
  trigger?: React.ReactNode;
};

export function CreateLoginDialog({
  tenantId,
  tenantName,
  trigger,
}: CreateLoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/create-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }
      setResult({ email: data.email, password: data.password });
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    void navigator.clipboard.writeText(`Email: ${result.email}\nПароль: ${result.password}`);
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError("");
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {trigger ?? "Создать логин"}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleClose}
        >
          <div
            className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-4">
              Данные для входа в кабинет — {tenantName}
            </h3>
        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Сохраните пароль, он больше не будет показан:
            </p>
            <div className="rounded-lg border p-4 space-y-2 bg-muted/30 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                {result.email}
              </div>
              <div>
                <span className="text-muted-foreground">Пароль: </span>
                {result.password}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                Копировать
              </Button>
              <Button size="sm" onClick={handleClose}>
                Готово
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Логин (email)</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Создание..." : "Сгенерировать пароль"}
            </Button>
          </form>
        )}
          </div>
        </div>
      )}
    </>
  );
}
