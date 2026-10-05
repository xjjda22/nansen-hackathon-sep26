"use client";

import { Shown, useSimpleOn } from "@/components/simple-mode";
import { TokenName } from "@/components/token-mark";
import { barShares, groupName, rowGap, widestRow, type Gap } from "@/lib/compare";
import { measureBody, type CellStat, type QuestTable } from "@/lib/rules";

type Row = QuestTable["rows"][number];

export function CompareTable({ table }: { table: QuestTable }) {
  const left = groupName(table.columns[1] ?? "");
  const right = groupName(table.columns[2] ?? "");
  const widest = widestRow(table);
  return (
    <div className="compare">
      <p className="compare-caption"><Shown text={table.caption} /></p>
      {widest && widest.gap.leader != null ? (
        <p className="compare-verdict">
          <span className="compare-verdict-kicker">Widest split</span>
          <span>
            <strong>{widest.row.name}</strong>. {widest.gap.leader === 0 ? left : right} is{" "}
            <strong className="compare-verdict-figure">{widest.gap.figure}</strong> {widest.gap.word}.
          </span>
        </p>
      ) : null}
      <div className="ladder-wrap">
        <table className="ladder compare-table">
          <thead>
            <tr>
              {table.columns.map((column, index) => (
                <th key={`${column}-${index}`} scope="col">
                  {column}
                </th>
              ))}
              <th scope="col">Gap</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <CompareRow key={row.name} row={row} labels={[left, right]} nameLabels={table.nameLabels} widest={widest?.row === row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({ row, labels, nameLabels, widest }: { row: Row; labels: [string, string]; nameLabels: [string, string]; widest: boolean }) {
  const gap = rowGap(row.topStat, row.bottomStat);
  const bars = barShares(row.topStat, row.bottomStat);
  const names = row.topNames.length + row.bottomNames.length;
  return (
    <>
      <tr data-widest={widest}>
        <th scope="row"><Shown text={row.name} /></th>
        <SideCell label={labels[0]} stat={row.topStat} bar={bars?.[0]} side="left" lead={gap?.leader === 0} text={row.top} plain={row.topPlain} />
        <SideCell label={labels[1]} stat={row.bottomStat} bar={bars?.[1]} side="right" lead={gap?.leader === 1} text={row.bottom} plain={row.bottomPlain} />
        <td className="compare-gap" data-label="Gap"><GapCell gap={gap} labels={labels} /></td>
      </tr>
      {names > 0 ? (
        <tr className="token-line">
          <td colSpan={4}>
            <details className="compare-names">
              <summary>
                {row.namesNearMiddle ? "Names nearest the middle" : "Names"} · {shownOf(row.topNames.length, row.topStat)} and {shownOf(row.bottomNames.length, row.bottomStat)}
              </summary>
              <NameBand label={nameLabels[0]} names={row.topNames} />
              <NameBand label={nameLabels[1]} names={row.bottomNames} />
            </details>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** "10 of 42" when a count row lists fewer names than it counts. */
function shownOf(shown: number, stat: CellStat | undefined): string {
  return stat?.kind === "count" && stat.total != null && stat.value > shown ? `${shown} of ${stat.value}` : String(shown);
}

function SideCell({
  label,
  stat,
  bar,
  side,
  lead,
  text,
  plain,
}: {
  label: string;
  stat: CellStat | undefined;
  bar: number | undefined;
  side: "left" | "right";
  lead: boolean;
  text: string;
  plain: string;
}) {
  const simple = useSimpleOn();
  if (!stat) {
    return (
      <td className="compare-side" data-side={side} data-label={label}>
        <Shown text={text} plain={plain} />
      </td>
    );
  }
  const range = stat.low != null && stat.high != null && stat.present != null && stat.present > 1 ? `${measureBody(stat.low, stat.kind)} to ${measureBody(stat.high, stat.kind)}` : null;
  const coverage = stat.present != null && stat.of != null && stat.present < stat.of ? `${stat.present} of ${stat.of} had a number` : null;
  return (
    <td className="compare-side" data-side={side} data-lead={lead} data-label={label}>
      <span className="compare-figure">
        {measureBody(stat.value, stat.kind)}
        {stat.total != null ? <small> of {stat.total}</small> : null}
      </span>
      {stat.total == null && stat.low != null ? <span className="compare-sub">middle</span> : null}
      {bar != null ? (
        <span className="compare-bar" aria-hidden="true">
          <span style={{ width: `${Math.max(2, Math.round(bar * 100))}%` }} data-neg={stat.value < 0} />
        </span>
      ) : null}
      {range ? <span className="compare-sub">Range {range}</span> : null}
      {coverage ? <span className="compare-sub">{coverage}</span> : null}
      {simple ? <span className="compare-plain"><Shown text={text} plain={plain} /></span> : null}
    </td>
  );
}

function GapCell({ gap, labels }: { gap: Gap | null; labels: [string, string] }) {
  if (!gap) return <span className="compare-sub">No number on one side</span>;
  if (gap.leader == null) return <span className="compare-level">Level</span>;
  return (
    <>
      <strong>{gap.figure}</strong> <span>{gap.word}</span>
      <span className="compare-sub">{labels[gap.leader]}</span>
    </>
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
