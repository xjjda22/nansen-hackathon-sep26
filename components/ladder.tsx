import { Shown } from "@/components/simple-mode";
import type { TokenMeasure } from "@/lib/rules";

export function Ladder({
  topTitle,
  rows,
  caption,
}: {
  topTitle: string;
  rows: TokenMeasure[];
  caption: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="ladder-wrap" data-ladder>
      <table className="ladder">
        <caption><Shown text={caption} /></caption>
        <thead>
          <tr>
            <th scope="col">Measure</th>
            <th scope="col">{topTitle}</th>
            <th scope="col">The climb</th>
            <th scope="col">The field under the bar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row"><Shown text={row.name} /></th>
              <td><Shown text={row.bar} plain={row.barPlain} /></td>
              <td><Shown text={row.climb} plain={row.climbPlain} /></td>
              <td><Shown text={row.gap} plain={row.gapPlain} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
