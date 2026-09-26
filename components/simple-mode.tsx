"use client";

import { RichText } from "@/components/token-mark";
import { plainReading } from "@/lib/plain";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "offbook-simple";

const SimpleContext = createContext<{ on: boolean; setOn: (on: boolean) => void } | null>(null);

export function SimpleProvider({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(window.sessionStorage.getItem(KEY) === "on");
  }, []);

  function update(next: boolean) {
    setOn(next);
    window.sessionStorage.setItem(KEY, next ? "on" : "off");
  }

  return <SimpleContext.Provider value={{ on, setOn: update }}>{children}</SimpleContext.Provider>;
}

export function useSimpleOn(): boolean {
  return useContext(SimpleContext)?.on ?? false;
}

export function useSetSimple(): (on: boolean) => void {
  const context = useContext(SimpleContext);
  return context?.setOn ?? (() => undefined);
}

export function Shown({ text, plain }: { text: string; plain?: string }) {
  const on = useSimpleOn();
  const value = on ? (plain ?? plainReading(text)) : text;
  return <RichText text={value} />;
}
