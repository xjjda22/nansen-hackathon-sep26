import { Shown } from "@/components/simple-mode";

export function SplitReadout({
  frame,
  common,
  meaningful,
  unscored,
  compared,
}: {
  frame: string;
  common: string[];
  meaningful: string[];
  unscored?: string | null;
  compared: boolean;
}) {
  return (
    <div className="split-read" data-split-read>
      <p className="split-frame"><Shown text={frame} /></p>
      {compared ? (
        <div className="readout-grid">
          <ReadList title="The gap" lines={meaningful} empty="None." />
          <ReadList title="Same either way" lines={common} empty="None." />
        </div>
      ) : null}
      {unscored ? <p className="unscored">{unscored}</p> : null}
    </div>
  );
}

function ReadList({ title, lines, empty }: { title: string; lines: string[]; empty: string }) {
  return (
    <section className={title === "Same either way" ? "read-common" : "read-meaningful"}>
      <h3><Shown text={title} /></h3>
      {lines.length === 0 ? (
        <p><Shown text={empty} /></p>
      ) : (
        <ul>
          {lines.map((line) => (
            <li key={line}><Shown text={line} /></li>
          ))}
        </ul>
      )}
    </section>
  );
}
