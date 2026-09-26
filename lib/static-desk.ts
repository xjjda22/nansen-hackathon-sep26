/** True only in the static Surge build. Local dev and `next start` keep the API routes. */
export const STATIC_HOST = process.env.NEXT_PUBLIC_STATIC === "1";

const SNAPSHOT: Record<string, string> = {
  "/api/netflow": "/snapshot/netflow.json",
  "/api/leaderboard": "/snapshot/leaderboard.json",
  "/api/dex-trades": "/snapshot/dex-trades.json",
  "/api/holdings": "/snapshot/holdings.json",
  "/api/board": "/snapshot/board.json",
  "/api/session": "/snapshot/session.json",
};

/** On Surge, read the cached page that was saved at build time. */
export function deskFetch(path: string, init?: RequestInit): Promise<Response> {
  if (STATIC_HOST) {
    const file = SNAPSHOT[path];
    if (file) return fetch(file);
  }
  return fetch(path, init);
}
