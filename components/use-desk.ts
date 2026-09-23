"use client";

import { useRef, useState } from "react";

export type Credits = {
  spentThisSession: number;
  remaining: number | null;
  used: number;
  cached: boolean;
};

export function publishCredits(credits: Credits) {
  window.dispatchEvent(new CustomEvent("offbook-credits", { detail: credits }));
}

export function useDesk() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  async function run<T>(url: string, body: unknown): Promise<T | null> {
    if (lock.current) return null;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as T & { ok?: boolean; error?: string; credits?: Credits };
      if (data.credits) publishCredits(data.credits);
      if (!response.ok || data.ok === false) {
        setError(data.error ?? "The desk could not complete that.");
        return null;
      }
      return data;
    } catch {
      setError("The request failed before a result came back.");
      return null;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return { pending, error, setError, run };
}
