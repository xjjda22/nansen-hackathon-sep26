"use client";

import { loadHoldings } from "@/components/holding-board";
import { loadTape } from "@/components/print-board";
import { loadTokens } from "@/components/token-board";
import { loadTraders } from "@/components/trader-board";
import { topHeld, type WantedFace } from "@/components/wanted-board";
import { QUEST_MAX, QUEST_MIN } from "@/lib/constants";
import { bandQuests, buyComparisons, combinedQuest, crossTraits, crossWalk, deeperInsights, holdWalkTraits, insightTables, moveExample, offBookExample, parseHoldings, parseLeaderboard, printExample, splitQuests, tokenHalves, type QuestSection, type QuestTrait, type SectionQuests, type TraderRow } from "@/lib/rules";
import { useEffect, useState } from "react";

export type Walk = { pairs: SectionQuests[] | null; wanted: WantedFace[]; error: string | null };

/** Posts the four routes once and builds the walk every skin of the room reads. */
export function useWalk(): Walk {
  const [pairs, setPairs] = useState<SectionQuests[] | null>(null);
  const [wanted, setWanted] = useState<WantedFace[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadTokens(), loadTraders(), loadTape(), loadHoldings()]).then(([tokens, traders, tape, holds]) => {
      if (cancelled) return;
      const missing = [
        tokens.error ? "netflow" : null,
        traders.error ? "leaderboard" : null,
        tape.error ? "dex trades" : null,
        holds.error ? "holdings" : null,
      ].filter((name): name is string => name != null);
      if (missing.length === 4) {
        setError(tokens.error ?? traders.error ?? tape.error ?? holds.error);
        return;
      }
      if (missing.length > 0) setError(`${missing.join(", ")} did not load. The other desks are in the walk.`);
      const rows = tokens.data?.rows ?? [];
      const flow = rows.map((row) => ({ ...row, tokenSectors: row.sectors, netFlow1hUsd: row.netFlow1hUsd }));
      const move = rows.length > 0 ? tokenHalves(flow).meaningful.slice(0, QUEST_MAX) : [];
      const wallets = pickBand(traders.data?.meaningful ?? [], ["Still holding.", "Already banked.", "Repeat buys.", "Same names."], ["Names traded."]);
      const traderRows = readTraders(traders.data?.raw);
      const prints = tape.data ? buyComparisons(traders.data?.topAddresses ?? [], tape.data.buys, tape.data.isLastPage).meaningful.slice(0, QUEST_MAX) : [];
      const holdTraits = holdWalkTraits(holds.data?.traits?.quest ?? []);
      const built = placeHolds(combinedQuest({
        moveLines: move,
        walletLines: wallets,
        printLines: prints,
        holdSections: holdTraits.map((item) => ({ id: item.id, title: item.title, traits: [item] })),
        moveTable: rows.length > 0 ? moveExample(flow) : null,
        walletTable: traders.data?.table ?? null,
        printTable: tape.data ? printExample(traders.data?.topAddresses ?? [], tape.data.buys) : null,
        holdTable: holds.data?.table ?? null,
      }), holdTraits, holds.data?.table ?? null);
      const across = holds.error || tokens.error ? null : crossWalk(crossTraits({
        flow,
        holds: holds.data?.marks ?? [],
        buys: tape.data?.buys ?? [],
        traded: traders.data?.tradedKeys ?? [],
        keyKind: traders.data?.keyKind ?? null,
      }), offBookExample(flow, holds.data?.marks ?? []));
      const walked = [...(across ? [across] : []), ...built];
      const heldRows = readHoldings(holds.data?.raw);
      setWanted(topHeld(heldRows, flow));
      setPairs(bandQuests(splitQuests(walked, deeperInsights(heldRows, flow, {
        traders: traderRows.rows,
        keyKind: traderRows.keyKind,
        buys: tape.data?.buys ?? [],
        topAddresses: traders.data?.topAddresses ?? [],
      }), insightTables(heldRows, flow))));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { pairs, wanted, error };
}

function readHoldings(raw: unknown): ReturnType<typeof parseHoldings>["rows"] {
  try {
    return parseHoldings(raw).rows;
  } catch {
    return [];
  }
}

function readTraders(raw: unknown): { rows: TraderRow[]; keyKind: ReturnType<typeof parseLeaderboard>["keyKind"] } {
  try {
    const parsed = parseLeaderboard(raw);
    return { rows: parsed.rows, keyKind: parsed.keyKind };
  } catch {
    return { rows: [], keyKind: null };
  }
}

function pickLines(lines: string[], prefixes: string[]): string[] {
  return prefixes.flatMap((prefix) => {
    const line = lines.find((item) => item.startsWith(prefix));
    return line ? [line] : [];
  });
}

function pickBand(lines: string[], first: string[], fill: string[]): string[] {
  const picked = pickLines(lines, first);
  if (picked.length >= QUEST_MIN) return picked.slice(0, QUEST_MAX);
  return [...picked, ...pickLines(lines, fill)].slice(0, QUEST_MAX);
}

function placeHolds(sections: QuestSection[], traits: QuestTrait[], table: QuestSection["table"] | null): QuestSection[] {
  const without = sections.filter((section) => section.id !== "holds");
  if (traits.length === 0) return without;
  const holds: QuestSection = { id: "holds", title: "Holds · holdings", traits, ...(table ? { table } : {}) };
  const prints = without.findIndex((section) => section.id === "prints");
  if (prints === -1) return [...without, holds];
  const next = [...without];
  next.splice(prints + 1, 0, holds);
  return next;
}
