# Off Book

Nine desks. You lock a stamp, the server calls Nansen, and the stamp is scored against that response. A wrong call is the payload, not a stored answer. The pages do not scan blocks, do not ask for a seed, and do not invent a figure the API left out.

The rule set is [hackathon-edge-cases.md](../docs/hackathon-edge-cases.md). Where that note disagrees with [hackathon-ideas.md](../docs/hackathon-ideas.md), the edge-case note wins.

## Run it

You need Node 22 and npm. From this folder:

```bash
npm install
```

Create `.env.local` here with one line, `NANSEN_API_KEY=`, and your own key. `.env*` is gitignored.

```bash
npm run dev -- --port 43127 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

`npm test` checks the rules and does not call Nansen.

## A round

1. Pick the stamp on the desk.
2. Fill the input the desk asks for. A ticker with no address does not call. An empty book does not call.
3. Press the call button. It stays off while the request is in flight, and it stays off until a stamp is locked.
4. The desk prints RIGHT or WRONG, the API stamp, and the figure that decided it. The score in the top line is this browser session.

Each desk shows its route, the Nansen path, and the credit cost. The response JSON is behind **Response**, collapsed.

A successful body is cached for two minutes. The top line is credits spent in this server process, account remaining when Nansen sends it, and the last charge. If the account cannot cover a call, the desk shows Nansen's error and does not score a number it did not receive.

The desk does not call profiler labels or `agent/fast`, and it does not walk pages.

## Routes

| Desk | Route | Nansen | Credits |
| --- | --- | --- | --- |
| Ledger | `POST /api/not-on-your-list` | `POST /api/v1/smart-money/netflow` | 5 |
| Weather | `POST /api/sector-weather` | `POST /api/v1/smart-money/netflow` | 5 |
| Blotter | `POST /api/both-sides` | `POST /api/v1/tgm/who-bought-sold` | 1 |
| Rails | `POST /api/two-chains` | `POST /api/v1/smart-money/netflow` | 5 |
| Wire | `POST /api/cohort-sign` | `POST /api/v1/tgm/flow-intelligence` | 1–2 |
| Poke | `POST /api/one-poke` | `POST /api/v1/tgm/who-bought-sold` | 1 |
| Gas | `POST /api/gas-lead` | `POST /api/v1/chains/chain-rank` | 1 |
| Vault | `POST /api/jup-dca` | `POST /api/v1/tgm/jup-dca` | 1 |
| Split | `POST /api/hl-split` | `POST /api/v1/tgm/position-intelligence` | 1 |

Opening a ledger card sends `action: "cohort"` to the same route (1 credit). The blotter sell page sends `side: "SELL"`. Wire spends a second credit only when the 1-day cohort has a 5-minute field. None of those fire by themselves.

`GET /api/board` reads the netflow cache and does not call Nansen. `GET /api/session` is the credit counter.

## Research notes

The notes sit next to this repo, in `../docs`:

- [hackathon-edge-cases.md](../docs/hackathon-edge-cases.md)
- [hackathon-ideas.md](../docs/hackathon-ideas.md)
- [built-projects.md](../docs/built-projects.md)
- [meridian-buildathon.md](../docs/meridian-buildathon.md)
- [ethskills-site-research.md](../docs/ethskills-site-research.md)
- [nansen-agent-product-research.md](../docs/nansen-agent-product-research.md)
