"use client";

import { TechFoot } from "@/components/desk";
import { Shown } from "@/components/simple-mode";
import { TokenName } from "@/components/token-mark";
import { Ladder } from "@/components/ladder";
import { SplitReadout } from "@/components/split-readout";
import { Status } from "@/components/status";
import { Button } from "@/components/ui/button";
import { publishCredits, type Credits } from "@/components/use-desk";
import { type HoldMark, type QuestTable, type TokenMeasure } from "@/lib/rules";
import { Fragment, useEffect, useState } from "react";

type QuestTrait = { id: string; title: string; line: string };
type QuestSection = { id: string; title: string; traits: QuestTrait[] };
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
        const response = await fetch("/api/holdings", {
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

function NameBand({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="token-band">
      <span>{label}</span>
      <ul>
        {names.map((name) => (
          <li key={name}>
            <TokenName name={name} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TraitQuest({ sections, title, hideSections = false, tableLast = false }: { sections: QuestSection[]; title: string; hideSections?: boolean; tableLast?: boolean }) {
  const [done, setDone] = useState(0);
  const total = sections.reduce((sum, section) => sum + sectionSteps(section), 0);
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
      {section?.table && onTable ? (
        <div className="ladder-wrap">
          <table className="ladder">
            <caption><Shown text={section.table.caption} /></caption>
            <thead>
              <tr>
                {section.table.columns.map((column, index) => (
                  <th key={`${column}-${index}`} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <Fragment key={row.name}>
                  <tr>
                    <th scope="row"><Shown text={row.name} /></th>
                    <td><Shown text={row.top} plain={row.topPlain} /></td>
                    <td><Shown text={row.bottom} plain={row.bottomPlain} /></td>
                  </tr>
                  <tr className="token-line">
                    <td colSpan={3}>
                      <NameBand label={section.table?.nameLabels[0] ?? ""} names={row.topNames} />
                      <NameBand label={section.table?.nameLabels[1] ?? ""} names={row.bottomNames} />
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {onTable ? (
        <Button type="button" onClick={() => setDone((count) => count + 1)}>
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
              return (
                <li key={item.id} data-quest="open">
                  <h4><Shown text={item.title} /></h4>
                  <p><Shown text={item.line} plain={item.plain} /></p>
                  <Button type="button" onClick={() => setDone((count) => count + 1)}>
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
