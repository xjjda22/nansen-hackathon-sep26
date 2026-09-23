export type DeskTone = "ledger" | "weather" | "blotter" | "rails" | "wire";

export function DeskMark({ tone }: { tone: DeskTone }) {
  if (tone === "ledger") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <rect x="8" y="8" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 8 V56" stroke="#8c3a24" strokeWidth="3" />
        <path d="M26 22 H50 M26 32 H50 M26 42 H42" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (tone === "weather") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <circle cx="32" cy="34" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M32 34 L44 24" stroke="#8c3a24" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="32" cy="34" r="2.4" fill="currentColor" />
        <path d="M32 10 V16 M50 18 L46 22 M14 18 L18 22" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (tone === "blotter") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <rect x="6" y="12" width="22" height="40" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="36" y="12" width="22" height="40" fill="none" stroke="#8c3a24" strokeWidth="2" />
        <path d="M32 10 V54" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (tone === "rails") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <path d="M10 24 H54 M10 40 H54" stroke="currentColor" strokeWidth="2.4" />
        <path d="M18 20 V44 M28 20 V44 M38 20 V44 M48 20 V44" stroke="#8c3a24" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
      <path d="M8 44 V18 H18" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M18 18 H52" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 4" />
      <circle cx="28" cy="18" r="2" fill="#e7c56a" />
      <circle cx="38" cy="18" r="2" fill="currentColor" />
      <circle cx="48" cy="18" r="2" fill="#e7c56a" />
    </svg>
  );
}
