"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "@/components/icons/duotone";

export default function PasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/showcase-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setPassword("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border rounded-lg p-6 bg-card shadow-sm"
      >
        <div className="flex items-center gap-2 mb-1">
          <Lock className="size-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Locked</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Enter the dashboard password to continue.
        </p>
        <div className="grid gap-1.5 mb-4">
          <Label htmlFor="dash-password">Password</Label>
          <Input
            id="dash-password"
            type="password"
            value={password}
            autoFocus
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>
        {error && (
          <p className="text-xs text-destructive mb-4" role="alert">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !password}
        >
          {submitting ? "Unlocking…" : "Unlock"}
        </Button>
      </form>
    </div>
  );
}
