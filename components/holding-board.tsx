"use client";

import { CompareTable } from "@/components/compare-table";
import { TechFoot } from "@/components/desk";
import { Shown } from "@/components/simple-mode";
import { Ladder } from "@/components/ladder";
import { SplitReadout } from "@/components/split-readout";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { publishCredits, type Credits } from "@/components/use-desk";
import { type HoldMark, type QuestSection, type QuestTable, type TokenMeasure } from "@/lib/rules";
import { deskFetch } from "@/lib/static-desk";
import { leadFigure } from "@/lib/token-ref";
import { useEffect, useState } from "react";

type Load = {
  frame: string;
  common: string[];
  meaningful: string[];
  unscored: string | null;
  traits?: { quest: QuestSection[] };
  table: QuestTable | null;
  measures: TokenMeasure[];
  marks: HoldMark[];
  credits: Credits;
  raw?: unknown;
};

let holdingLoad: Promise<{ data: Load | null; error: string | null }> | null = null;

export function loadHoldings(): Promise<{ data: Load | null; error: string | null }> {
  if (!holdingLoad) {
    holdingLoad = (async () => {
      try {
        const response = await deskFetch("/api/holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = (await response.json()) as Load & { ok?: boolean; error?: string };
        if (data.credits) publishCredits(data.credits);
        if (!response.ok || data.ok === false || !data.frame) {
          return { data: null, error: data.error ?? "The desk could not complete that." };
        }
        return { data, error: null };
      } catch {
        return { data: null, error: "The request failed before a result came back." };
      }
    })();
  }
  return holdingLoad;
}

export function HoldingBoard() {
  const [load, setLoad] = useState<Load | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadHoldings().then((outcome) => {
      if (cancelled) return;
      setLoad(outcome.data);
      setError(outcome.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const compared = load != null && load.common.length + load.meaningful.length > 0;
  return (
    <div className="space-y-5">
      {error ? <Status kind="error">{error}</Status> : null}
      {!load && !error ? <Status kind="loading">One request is in flight.</Status> : null}
      {load ? (
        <SplitReadout
          frame={load.frame}
          common={load.common}
          meaningful={load.meaningful}
          unscored={load.unscored}
          compared={compared}
        />
      ) : null}
      {load ? (
        <Ladder
          topTitle="Top 50"
          rows={load.measures ?? []}
          caption="The climb is the thinner names on this page. Wallet count only orders the list."
        />
      ) : null}
      <TechFoot credits={load?.credits} raw={load?.raw} />
    </div>
  );
}

export function TraitQuest({
  sections,
  title,
  hideSections = false,
  tableLast = false,
  onProgress,
}: {
  sections: QuestSection[];
  title: string;
  hideSections?: boolean;
  tableLast?: boolean;
  onProgress?: (done: number, total: number) => void;
}) {
  const [done, setDone] = useState(0);
  const total = sections.reduce((sum, section) => sum + sectionSteps(section), 0);
  const markRead = () => {
    setDone(done + 1);
    onProgress?.(done + 1, total);
  };
  const finished = total > 0 && done >= total;
  const place = locateTrait(sections, done);
  const section = sections[place.sectionIndex];
  const doneInSection = place.indexInSection;
  const tableStep = tableLast ? (section?.traits.length ?? 0) : 0;
  const onTable = Boolean(section?.table) && !finished && doneInSection === tableStep;
  const traitCursor = section?.table && !tableLast ? doneInSection - 1 : doneInSection;

  return (
    <section className="trait-read">
      <h3><Shown text={title} /></h3>
      <p className="quest-progress">
        {finished || sections.length < 2
          ? `${finished ? total : done} of ${total} read.`
          : `${done} of ${total} read. Section ${place.sectionIndex + 1} of ${sections.length}.`}
      </p>
      {hideSections ? null : (
        <ol className="quest-sections">
          {sections.map((item, index) => {
            const state = index < place.sectionIndex || finished ? "done" : index === place.sectionIndex ? "open" : "locked";
            return (
              <li key={item.id} data-quest={state}>
                <Shown text={item.title} />
              </li>
            );
          })}
        </ol>
      )}
      {section?.table && onTable ? <CompareTable table={section.table} /> : null}
      {onTable ? (
        <Button type="button" onClick={markRead}>
          Mark read
        </Button>
      ) : null}
      {section && !onTable && section.traits.length > 0 ? (
        <ol className="quest-traits">
          {section.traits.map((item, index) => {
            if (!finished && index > traitCursor) {
              return (
                <li key={item.id} data-quest="locked">
                  <Shown text={item.title} />
                </li>
              );
            }
            if (!finished && index === traitCursor) {
              const figure = leadFigure(item.line);
              return (
                <li key={item.id} data-quest="open">
                  <h4><Shown text={item.title} /></h4>
                  {figure ? <p className="quest-figure">{figure}</p> : null}
                  <p><Shown text={item.line} plain={item.plain} /></p>
                  <Button type="button" onClick={markRead}>
                    Mark read
                  </Button>
                </li>
              );
            }
            return (
              <li key={item.id} data-quest="done">
                <h4><Shown text={item.title} /></h4>
                <p><Shown text={item.line} plain={item.plain} /></p>
              </li>
            );
          })}
        </ol>
      ) : null}
      {finished ? <p><Shown text="The page is read. None of these seats is an order." /></p> : null}
    </section>
  );
}

function sectionSteps(section: QuestSection): number {
  return (section.table ? 1 : 0) + section.traits.length;
}

function locateTrait(sections: QuestSection[], done: number): { sectionIndex: number; indexInSection: number } {
  let left = done;
  for (let index = 0; index < sections.length; index += 1) {
    const count = sectionSteps(sections[index] ?? { id: "", title: "", traits: [] });
    if (left < count) return { sectionIndex: index, indexInSection: left };
    left -= count;
  }
  const last = Math.max(sections.length - 1, 0);
  return { sectionIndex: last, indexInSection: sectionSteps(sections[last] ?? { id: "", title: "", traits: [] }) };
}
