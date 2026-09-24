# Off Book

Two screens. Each button is one Nansen call. The lines on that screen are read from that body. A figure the payload does not contain is not shown. The pages do not scan blocks, do not ask for a seed, and do not invent a number.

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

## Board

`POST /api/netflow` calls `POST /api/v1/smart-money/netflow` once (5 credits, page 1, 100 rows, 24h descending). The route, path, and cost are on the page once.

From that body:

- Ledger: up to three positive 24h names not on the typed book. An empty book skips this line and says so. Weather and rails still run.
- Weather: which sector 24h flow is entering, and which it is leaving, from `token_sectors`. A token in two sectors is counted in both. All positive: nothing leaving.
- Rails: for the typed symbol, which chain has the larger absolute 24h figure. A tie stays a tie. One chain says so. No symbol skips this line.
- A picked row, with no extra call: 1h sign against 24h sign (match, differ, or missing), that row’s sector, and `trader_count`.

Page 2 is not fetched. If `is_last_page` is false, the page says so.

## Blotter

`POST /api/both-sides` calls `POST /api/v1/tgm/who-bought-sold` once, BUY, ordered by bought USD, 25 rows. It prints how many of that page also sold, or sold volume absent, or no trades, and a page cut when `is_last_page` is false. There is no sell call.

A ticker with no address does not call. A known quote symbol is refused before the call. An address typed alone is not checked against that list.

## Credits

A successful body is cached for two minutes. The top line is credits spent in this server process, account remaining when Nansen sends it, and this click: last charge, cache, or no call. A refusal does not repeat the previous charge. If the account cannot cover a call, the page shows Nansen's error.

The response JSON is behind **Response**, collapsed.

The pages do not call profiler labels, `agent/fast`, flow intelligence, dex trades, holdings, or a second netflow.

`GET /api/board` reads the netflow cache and does not call Nansen. `GET /api/session` is the credit counter.

The audit of an earlier build is [devils-advocate.md](../docs/devils-advocate.md).

## Research notes

The notes sit next to this repo, in `../docs`:

- [hackathon-edge-cases.md](../docs/hackathon-edge-cases.md)
- [hackathon-ideas.md](../docs/hackathon-ideas.md)
- [built-projects.md](../docs/built-projects.md)
- [meridian-buildathon.md](../docs/meridian-buildathon.md)
- [ethskills-site-research.md](../docs/ethskills-site-research.md)
- [nansen-agent-product-research.md](../docs/nansen-agent-product-research.md)
