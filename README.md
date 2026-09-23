# Off Book

Five questions from the Nansen smart-money board, for the Meridian buildathon. The pages are thin. The answers come from server routes that call Nansen. The desk does not scan blocks, does not ask for a seed or a signature, and does not invent a number the API did not return.

The rule set is [hackathon-edge-cases.md](hackathon-edge-cases.md). Where that note disagrees with [hackathon-ideas.md](hackathon-ideas.md), the edge-case note wins. The fourth product is the two-chain symbol check. The agent-key gate is not built.

## Run locally

You need Node 22 and npm. From this folder:

```bash
npm install
```

Create `.env.local` in this folder and set `NANSEN_API_KEY` to your Nansen API key. The server reads that name. The key is not written in this file.

```bash
npm run dev -- --port 43127 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

`npm test` runs the rule checks without calling Nansen.

## The five routes

| Desk | Route |
| --- | --- |
| Not on your list | `POST /api/not-on-your-list` |
| Sector weather | `POST /api/sector-weather` |
| Same names, both sides | `POST /api/both-sides` |
| Same ticker, two chains | `POST /api/two-chains` |
| Cohort and sign | `POST /api/cohort-sign` |

Opening a card on the first desk sends `action: "cohort"` to the same route. The sell page on the third desk sends `side: "SELL"` to the same route. Neither fires by itself.

Netflow is 5 credits. Flow intelligence and who-bought-sold are 1 credit each. A response is cached for two minutes. One in-flight request is shared per cache key, and the button stays disabled while it runs. The header shows credits spent in this server process. Account remaining appears only when Nansen sends it.

`GET /api/board` reads that cache and does not call Nansen. `GET /api/session` is the credit counter.

The desk does not call profiler labels or `agent/fast`, and it does not walk pages.

## Research notes in this folder

- [hackathon-edge-cases.md](hackathon-edge-cases.md)
- [hackathon-ideas.md](hackathon-ideas.md)
- [built-projects.md](built-projects.md)
- [meridian-buildathon.md](meridian-buildathon.md)
- [ethskills-site-research.md](ethskills-site-research.md)
- [nansen-agent-product-research.md](nansen-agent-product-research.md)
