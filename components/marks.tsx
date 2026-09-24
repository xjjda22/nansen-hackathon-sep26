export type DeskTone = "ledger" | "weather" | "blotter" | "rails" | "wire" | "poke" | "gas" | "dca" | "split";

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
  if (tone === "wire") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <path d="M8 44 V18 H18" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M18 18 H52" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 4" />
        <circle cx="28" cy="18" r="2" fill="currentColor" />
        <circle cx="38" cy="18" r="2" fill="#8c3a24" />
        <circle cx="48" cy="18" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (tone === "poke") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <circle cx="24" cy="32" r="8" fill="currentColor" />
        <circle cx="42" cy="22" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="48" cy="34" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="42" cy="46" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (tone === "gas") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <path d="M32 10 C26 22 18 26 18 36 C18 46 24 52 32 52 C40 52 46 46 46 36 C46 26 38 22 32 10 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M32 28 C30 34 28 36 28 40 C28 44 30 46 32 46 C34 46 36 44 36 40 C36 36 34 34 32 28 Z" fill="currentColor" />
      </svg>
    );
  }
  if (tone === "dca") {
    return (
      <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
        <rect x="18" y="12" width="28" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="22" y="28" width="20" height="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="26" y="44" width="12" height="10" fill="none" stroke="#8c3a24" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="mark" aria-hidden="true">
      <path d="M10 24 H28" stroke="currentColor" strokeWidth="2" />
      <path d="M22 18 L30 24 L22 30" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M54 40 H36" stroke="#8c3a24" strokeWidth="2" />
      <path d="M42 34 L34 40 L42 46" fill="none" stroke="#8c3a24" strokeWidth="2" />
    </svg>
  );
}
