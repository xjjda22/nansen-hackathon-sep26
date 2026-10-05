"use client";

import { deskFetch, STATIC_HOST } from "@/lib/static-desk";
import { useEffect, useState } from "react";

/** The disk cache switch. Null on the static host, which has no server to hold it. */
export function useFileCache(): { on: boolean; toggle: () => Promise<void> } | null {
  const [on, setOn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    deskFetch("/api/session")
      .then((response) => response.json())
      .then((data: { fileCache?: boolean }) => {
        if (cancelled) return;
        if (typeof data.fileCache === "boolean") setOn(data.fileCache);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    const next = !on;
    setOn(next);
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileCache: next }),
    });
    window.location.reload();
  }

  return STATIC_HOST ? null : { on, toggle };
}

/** A builder's switch. Absent on the static host, which has no disk to cache to. */
export function CacheSwitch({ className }: { className: string }) {
  const cache = useFileCache();
  if (!cache) return null;
  return (
    <button type="button" className={className} onClick={cache.toggle} aria-pressed={cache.on}>
      Disk cache {cache.on ? "on" : "off"}
    </button>
  );
}
