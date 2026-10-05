"use client";

import { CallNote } from "@/components/call-note";
import { DeskMark, type DeskTone } from "@/components/marks";
import { RawJson } from "@/components/play";
import { Shown } from "@/components/simple-mode";
import type { Credits } from "@/components/use-desk";
import { createContext, useContext } from "react";

const DeskTech = createContext<{ route: string; nansen: string; cost: string } | null>(null);

export function TechFoot({ credits, raw }: { credits?: Credits | null; raw?: unknown }) {
  const tech = useContext(DeskTech);
  if (!tech) return null;
  return (
    <div className="tech-foot">
      <p className="dev-strip">
        <span>{tech.route}</span>
        <span aria-hidden="true">→</span>
        <span>{tech.nansen}</span>
        <span className="dev-cost">{tech.cost}</span>
      </p>
      <CallNote credits={credits} />
      <RawJson value={raw} />
    </div>
  );
}

export function Desk({
  title,
  lede = "",
  kicker,
  tone,
  route,
  nansen,
  cost,
  children,
}: {
  title: string;
  lede?: string;
  kicker?: string;
  tone: DeskTone;
  route: string;
  nansen: string;
  cost: string;
  children: React.ReactNode;
}) {
  return (
    <DeskTech.Provider value={{ route, nansen, cost }}>
      <article className={`desk desk-${tone}`} data-desk={tone}>
        <header className="desk-head">
          <DeskMark tone={tone} />
          <div>
            {kicker ? <p className="kicker"><Shown text={kicker} /></p> : null}
            <h1><Shown text={title} /></h1>
          </div>
        </header>
        {lede ? <p className="desk-lede"><Shown text={lede} /></p> : null}
        {children}
      </article>
    </DeskTech.Provider>
  );
}
