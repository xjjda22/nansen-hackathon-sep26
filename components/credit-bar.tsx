"use client";

import { useSetSimple, useSimpleOn } from "@/components/simple-mode";
import { deskFetch, STATIC_HOST } from "@/lib/static-desk";
import { useEffect, useState } from "react";

export function CreditBar() {
  const [fileCache, setFileCache] = useState(true);
  const simple = useSimpleOn();
  const setSimple = useSetSimple();

  useEffect(() => {
    let cancelled = false;
    deskFetch("/api/session")
      .then((response) => response.json())
      .then((data: { fileCache?: boolean }) => {
        if (cancelled) return;
        if (typeof data.fileCache === "boolean") setFileCache(data.fileCache);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function onToggle() {
    const next = !fileCache;
    setFileCache(next);
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileCache: next }),
    });
    window.location.reload();
  }

  return (
    <p className="plaque">
      <span className="plaque-toggles">
        <button type="button" className={simple ? "cache-toggle is-on" : "cache-toggle"} onClick={() => setSimple(!simple)} aria-pressed={simple}>
          Simple {simple ? "on" : "off"}
        </button>
        {STATIC_HOST ? null : (
          <button type="button" className={fileCache ? "cache-toggle is-on" : "cache-toggle"} onClick={onToggle} aria-pressed={fileCache}>
            Cache {fileCache ? "on" : "off"}
          </button>
        )}
      </span>
    </p>
  );
}
