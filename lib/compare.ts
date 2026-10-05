import { measureBody, type CellStat, type MeasureKind, type QuestTable } from "./rules";

/** Below this relative gap the two sides read as level. */
const LEVEL = 0.03;

export type Gap = {
  /** 0 is the left group, 1 the right, null when level. */
  leader: 0 | 1 | null;
  figure: string;
  word: string;
  /** Relative gap from 0 to 1, used to rank rows. */
  spread: number;
};

function scaled(stat: CellStat): number {
  return stat.kind === "count" && stat.total ? stat.value / stat.total : stat.value;
}

function word(kind: MeasureKind, counted: boolean): string {
  switch (kind) {
    case "count":
      return counted ? "more names" : "more";
    case "days":
      return "older";
    case "usd":
    case "share":
    case "ratio":
    case "pct":
      return "higher";
    default: {
      const never: never = kind;
      return never;
    }
  }
}

function points(value: number): string {
  const pts = Math.round(value * 1000) / 10;
  return `${Number.isInteger(pts) ? pts : pts.toFixed(1)} pts`;
}

function times(ratio: number): string {
  return `${ratio < 10 ? (Math.round(ratio * 10) / 10).toFixed(1) : Math.round(ratio)}×`;
}

export function rowGap(left: CellStat | undefined, right: CellStat | undefined): Gap | null {
  if (!left || !right || left.kind !== right.kind) return null;
  const counted = left.kind === "count" && left.total != null && right.total != null;
  const a = scaled(left);
  const b = scaled(right);
  const top = Math.max(Math.abs(a), Math.abs(b));
  const spread = top === 0 ? 0 : Math.abs(a - b) / top;
  if (spread < LEVEL) return { leader: null, figure: "Level", word: "", spread };
  const leader = a > b ? 0 : 1;
  if (counted) {
    const figure = left.total === right.total ? String(Math.abs(left.value - right.value)) : points(Math.abs(a - b));
    return { leader, figure, word: left.total === right.total ? word("count", true) : "higher share", spread };
  }
  if (left.kind === "share" || left.kind === "pct") {
    return { leader, figure: points(Math.abs(a - b)), word: word(left.kind, false), spread };
  }
  if (a > 0 && b > 0) {
    return { leader, figure: times(Math.max(a, b) / Math.min(a, b)), word: word(left.kind, false), spread };
  }
  return { leader, figure: measureBody(Math.abs(a - b), left.kind), word: word(left.kind, false), spread };
}

/** Bar lengths from 0 to 1 for the two sides of a row. Counts fill against their total. */
export function barShares(left: CellStat | undefined, right: CellStat | undefined): [number, number] | null {
  if (!left || !right) return null;
  if (left.kind === "count" && left.total && right.total) return [left.value / left.total, right.value / right.total];
  const top = Math.max(Math.abs(left.value), Math.abs(right.value));
  if (top === 0) return [0, 0];
  return [Math.abs(left.value) / top, Math.abs(right.value) / top];
}

export function widestRow(table: QuestTable): { row: QuestTable["rows"][number]; gap: Gap } | null {
  let best: { row: QuestTable["rows"][number]; gap: Gap } | null = null;
  for (const row of table.rows) {
    const gap = rowGap(row.topStat, row.bottomStat);
    if (!gap || gap.leader == null) continue;
    if (!best || gap.spread > best.gap.spread) best = { row, gap };
  }
  return best;
}

/** A column header without the trailing "lacks", so it reads as the name of a group. */
export function groupName(column: string): string {
  return column.replace(/\s+lacks$/, "");
}
