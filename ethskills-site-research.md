---
cursor:
  subagentId: "bc-5c2ba82d-5edd-58b2-a128-a869b0a5e775"
---

# ETHSKILLS.COM Research Report

**URL:** https://ethskills.com/  
**Date:** September 23, 2026  
**Pages Explored:** 3 (Homepage, Tools, Indexing)

---

## Site Purpose

ETHSKILLS is a curated knowledge base designed to correct AI agents' misconceptions about building on Ethereum. It provides 25 modular "skills" (markdown documents) that agents can fetch on-demand to learn current best practices, tooling, and architecture patterns. The site explicitly positions itself as "the missing knowledge between AI agents and production Ethereum," targeting use in Claude, ChatGPT, Cursor, and other AI coding assistants. Each skill is a standalone `.md` file agents read via prompt injection or persistent setup, enabling them to ship production-ready dApps without hallucinating outdated information or making common mistakes.

---

## Homepage Structure

**URL:** https://ethskills.com/

**Main Headline:** `ETHSKILLS`

**Tagline:** `"The missing knowledge between AI agents and production Ethereum."`

**Subheading:** `"Your AI agent is wrong about building on Ethereum. ETHSKILLS fixes that, so anyone can ship onchain, expert or not. Works in Claude, ChatGPT, Cursor, or any agent."`

**Usage Pattern:**
- **Per-session prompt:** `"Read https://ethskills.com/SKILL.md and follow it before writing Solidity or shipping anything onchain."`
- **Persistent setup:** Instructions for adding to `AGENTS.md` file in repo root for Codex/Cursor/Claude Code

**Navigation:** Single-page list of 25 skills, each linking to `/[skill-name]/SKILL.md`

---

## Complete Skills List (25 Total)

### 1. **Why Ethereum**
- **URL:** `ethskills.com/why/SKILL.md`
- **Description:** "Why build on Ethereum specifically — Pectra/Fusaka upgrades, honest tradeoffs, the AI agent angle, countering stale FUD, matching use cases to strengths"

### 2. **Ship**
- **URL:** `ethskills.com/ship/SKILL.md`
- **Description:** "End-to-end guide for AI agents — from a dApp idea to deployed production app. Fetch this FIRST, it routes you through all other skills."
- **Key Quote:** "Fetch this FIRST, it routes you through all other skills."

### 3. **CHOPS Review**
- **URL:** `ethskills.com/chops/SKILL.md`
- **Description:** "Deep CHOPS architecture review for Ethereum dApps and contracts: Censorship Resistance, Open Source and Free, Privacy, Security. Run for every dApp architecture plan and during pre-ship QA."

### 4. **Protocol**
- **URL:** `ethskills.com/protocol/SKILL.md`
- **Description:** "How Ethereum evolves — EIP lifecycle, fork process, where decisions happen, and how to verify what's actually planned. Use when asked about EIPs, Trees, roadmap items, or any protocol-level changes. Prevents confidently wrong answers based on stale training data."

### 5. **Gas & Costs**
- **URL:** `ethskills.com/gas/SKILL.md`
- **Description:** "Current gas prices, what things actually cost on Ethereum today, mainnet vs L2 honest comparison. Counters the #1 misconception that Ethereum is expensive."

### 6. **Wallets**
- **URL:** `ethskills.com/wallets/SKILL.md`
- **Description:** "Creating wallets, connecting to dApps, signing transactions, multisig (Gnosis Safe), account abstraction. How an AI agent gets a wallet and uses it safely."

### 7. **Layer 2s**
- **URL:** `ethskills.com/L2s/SKILL.md`
- **Description:** "Current L2 landscape, bridging, deployment differences, when to use which L2. Arbitrum, Optimism, Base, zkSync, and more."

### 8. **Standards**
- **URL:** `ethskills.com/standards/SKILL.md`
- **Description:** "ERC-20, ERC-721, ERC-1155, ERC-4804 (agent identity), EIP-7702 (smart EOAs), and newer ERCs. Token standards, identity standards, payment standards."

### 9. **Tools**
- **URL:** `ethskills.com/tools/SKILL.md`
- **Description:** "Current frameworks, libraries, RPCs, block explorers, web2 (HTTP payments), MCPs, abi.ninja, Foundry, Scaffold-ETH 2. What actually works today."
- **Key Features:** 
  - **Blockscout MCP Server** - Model Context Protocol server for blockchain data
  - **abi.ninja** - Contract interaction tool
  - **x402 SDKs** - HTTP payment integrations
  - Tool discovery pattern for AI agents (6-step workflow)

### 10. **Money Legos**
- **URL:** `ethskills.com/building-blocks/SKILL.md`
- **Description:** "DeFi legos and protocol composability. Uniswap, Aave, Compound, MakerDAO, Yearn, Curve — what they do, how to build on them, how to combine them."

### 11. **Orchestration**
- **URL:** `ethskills.com/orchestration/SKILL.md`
- **Description:** "The three-phase build system and dApp orchestration patterns. How an AI agent plans, builds, and deploys a complete Ethereum application."

### 12. **Contract Addresses**
- **URL:** `ethskills.com/addresses/SKILL.md`
- **Description:** "Verified contract addresses for major protocols across Ethereum mainnet and L2s. Stop hallucinating addresses — use real ones."

### 13. **Concepts**
- **URL:** `ethskills.com/concepts/SKILL.md`
- **Description:** "The essential mental models for building onchain. 'Nothing is automatic' — every function needs a caller and an incentive. Randomness pitfalls, incentive design, the hyperstructure test, and how to teach your human."
- **Key Quote:** "'Nothing is automatic' — every function needs a caller and an incentive."

### 14. **Security**
- **URL:** `ethskills.com/security/SKILL.md`
- **Description:** "Solidity security patterns and common vulnerabilities with defensive code. Token decimals, reentrancy, oracle manipulation, vault inflation attacks, and a pre-deploy checklist. Run through this before every deployment."

### 15. **Noir (ZK Privacy)**
- **URL:** `ethskills.com/noir/SKILL.md`
- **Description:** "Building privacy dApps with Noir zero-knowledge circuits — toolchain, commitment-nullifier pattern, Solidity verifiers, Noir<>frontend integration. Use when building anything with zero-knowledge proofs on Ethereum."

### 16. **Testing**
- **URL:** `ethskills.com/testing/SKILL.md`
- **Description:** "Smart contract testing with Foundry — unit tests, fuzz testing, fork testing, invariant testing. What to test, what not to test, and what LLMs get wrong."

### 17. **Indexing**
- **URL:** `ethskills.com/indexing/SKILL.md`
- **Description:** "How to read and query onchain data — events, The Graph, indexing patterns. Why you cannot just loop through blocks, and what to use instead."
- **Key Tools Mentioned:**
  - **The Graph** - Primary indexing solution
  - **Dune** - Analytics platform
  - **Etherscan/Uniswap patterns** - Real-world indexer usage

### 18. **Frontend UX**
- **URL:** `ethskills.com/frontend-ux/SKILL.md`
- **Description:** "Mandatory frontend rules for Scaffold-ETH 2 projects. Onchain button loaders, three-button approval flow, Address components, USD values, RPC config, and pre-publish checklist. Prevents the UX mistakes AI agents make on every build."

### 19. **Frontend Playbook**
- **URL:** `ethskills.com/frontend-playbook/SKILL.md`
- **Description:** "The complete build-to-production pipeline. Fork mode, IPFS deployment, Vercel monorepo config, ENS subdomain setup, and the full go-to-production checklist with verification steps."

### 20. **QA**
- **URL:** `ethskills.com/qa/SKILL.md`
- **Description:** "Production QA checklist for dApps. Give this to a SEPARATE reviewer agent after the build — it audits the app against every common mistake AI agents make before shipping. Covers approve button double-fire, wallet flow, SE2 branding cleanup, USD values, and more."
- **Key Quote:** "Give this to a SEPARATE reviewer agent after the build"

### 21. **Audit**
- **URL:** `ethskills.com/audit/SKILL.md`
- **Description:** "Deep EVM smart contract audit system. 500+ non-obvious checklist items across 19 domains — AMM, lending, oracles, proxies, signatures, governance, bridges, and more. Runs parallel specialist agents, synthesizes findings, and files Github issues. Use when auditing contracts you didn't write."

### 22-25. *(Documented but not visited)*

---

## Detailed Page Analysis

### Page 1: Tools (`/tools/SKILL.md`)

**URL:** https://ethskills.com/tools/SKILL.md

**name:** `tools`

**description:** "Current Ethereum development tools, frameworks, libraries, RPCs, and block explorers. What actually works today for building on Ethereum. Includes tool discovery for AI agents — MCPs, abi.ninja, Foundry, Scaffold-ETH 2, and more. Use when setting up a dev environment, choosing tools, or when an agent needs to discover what's available."

**Key Sections:**

#### What You Probably Got Wrong
- **"Blockscout MCP server exists"** - Feb 2026 cutting-edge
- **"abi.ninja is essential"** - Zero setup contract interaction
- **"x402 has production SDKs"** - HTTP payment libraries
- **"Foundry and Hardhat 3 are both legitimate choices"** - 2026 ecosystem

#### Tool Discovery Pattern for AI Agents
When an agent needs to interact with Ethereum:
1. **Read operations:** Blockscout MCP or Etherscan API
2. **Write operations:** Foundry `cast send` or ethers.js/viem
3. **Contract exploration:** abi.ninja (browser) or `cast interface` (CLI)
4. **Testing:** Fork mainnet with `anvil`, test locally
5. **Deployment:** `forge create` or `forge script`
6. **Verification:** `forge verify-contract` or Etherscan API

#### Blockscout MCP Server
**URL:** `https://mcp.blockscout.com/mcp`

A Model Context Protocol server giving AI agents structured blockchain data:
- Transaction, address, contract queries
- Token info and balances
- Smart contract interaction helpers
- Gas prices
- **Standardized interface optimized for LLM consumption**

**Key Quote:** "Why this matters: Instead of scraping Etherscan or making raw API calls, agents get structured, type-safe blockchain data via MCP."

#### abi.ninja
**URL:** `https://abi.ninja`

"Paste any verified contract address — interact with all functions. Multi-chain. Zero setup. Supports mainnet + all major L2s. Perfect for agent-driven contract exploration."

#### x402 SDKs (HTTP Payments)
TypeScript and Python SDKs for HTTP-based blockchain payments:
```typescript
import { x402Fetch } from '@x402/fetch';
const response = await x402Fetch('https://api.example.com/data', {
  preferredNetwork: 'eip155:8453' // Base
});
```

**Python:** `pip install x402`

#### Foundry vs Hardhat
- **Foundry:** Faster, Solidity-native, mature plugin ecosystem (2026)
- **Hardhat 3:** TypeScript-first, mature plugin ecosystem

---

### Page 2: Indexing (`/indexing/SKILL.md`)

**URL:** https://ethskills.com/indexing/SKILL.md

**name:** `indexing`

**description:** "How to read and query onchain data — events, The Graph, indexing patterns. Why you cannot just loop through blocks, and what to use instead."

**# Onchain Data & Indexing**

#### What You Probably Got Wrong
- **"Can't cheaply read past state via RPC calls"** - You can't cheaply read past state. `eth_call` reads current state. Reading state at a historical block requires an archive node (expensive, slow). For historical data, you need an indexer.
- **"You loop through blocks looking for events"** - Scanning millions of blocks with `eth_getLogs` is O(n) — it will timeout, get rate-limited, or cost a fortune in RPC credits. Use an indexer that has already processed every block.
- **"You need every result from historical queries"** - These belong in an offchain database. Compute offchain, write a hash.
- **"You don't know about The Graph"** - The Graph turns your contract's events into a queryable GraphQL API. It's how every serious dApp reads historical data. Etherscan uses indexers. Uniswap uses indexers. So should you.
- **"You treat events as optional"** - Events are THE primary way to read historical onchain activity. If your contract doesn't emit events, nobody can build a frontend, dashboard, or analytics on top of it. Design contracts event-first.

#### Design Contracts Event-First
Solidity events are cheap to emit (~375 gas base + 375 per indexed topic + 8 gas per byte of data) and free to read offchain. They're stored in transaction receipts, not in contract storage, so they don't cost storage gas.

**Example Code:**
```solidity
// Good — every action emits a queryable event
contract Marketplace {
    event Listed(uint256 indexed listingId, address indexed seller, 
                 address indexed tokenContract, uint256 tokenId, uint256 price);
    event Sold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event Cancelled(uint256 indexed listingId);
    
    function list(address token, uint256 tokenId, uint256 price) external {
        uint256 id = nextListingId++;
        listings[id] = Listing(msg.sender, token, tokenId, price, true);
        emit Listed(id, msg.sender, token, tokenId, price);
    }
}
```

**Index the fields you'll filter by:** Use 3 indexed topics per event. Use them for addresses and IDs that you'll query — `seller`, `buyer`, `tokenContract`, `listingId`. Don't index large values or values you won't filter on.

#### Reading Events Directly (Small Scale)
For recent events or low-volume contracts, you can read events directly via RPC:
```typescript
// (code example shown)
```

**NOT MENTIONED:** Nansen, smart money, wallet labels, or any commercial on-chain analytics providers.

**Data Sources Mentioned:**
- The Graph (primary indexing solution)
- Dune (analytics platform)
- Etherscan (uses indexers internally)
- Uniswap (uses indexers internally)

---

## Nansen/On-Chain Analytics Search Results

**Search Query:** "Nansen" (CTRL+F on pages)

**Results:**
- **Homepage:** Not found
- **Tools page:** Not found
- **Indexing page:** **NOT FOUND (0/0 matches)**

**Conclusion:** ETHSKILLS does not reference Nansen, smart money analytics, wallet labeling services, or commercial on-chain intelligence platforms. The site focuses on **open-source/permissionless tooling** (The Graph, Blockscout MCP, Dune, public RPCs, block explorers).

---

## MCP & Agent-Specific Features

### Blockscout MCP Server
- **First-class MCP integration** for blockchain data
- Structured queries for AI agents
- Transaction/address/token lookups
- Gas price helpers
- **Designed for LLM consumption** (type-safe, standardized)

### Tool Discovery Pattern
6-step workflow explicitly designed for AI agents to interact with Ethereum:
1. Read operations → Blockscout MCP/Etherscan API
2. Write operations → Foundry/ethers.js
3. Contract exploration → abi.ninja / `cast interface`
4. Testing → Fork with anvil
5. Deployment → `forge create/script`
6. Verification → `forge verify-contract`

### Agent-Friendly Design
- **Markdown skills** agents can fetch on-demand
- **Modular structure** - each skill is standalone
- **"What You Probably Got Wrong"** sections correct LLM misconceptions
- **Explicit code examples** in TypeScript, Python, Solidity
- **Persistent setup** via `AGENTS.md` file for Codex/Cursor

---

## Runnable Tool Ideas (Hackathon-Friendly)

Based on observed skills and patterns:

### 1. **Event-Driven Notification Bot**
**Inspired by:** Indexing skill (event-first design)
- Monitor specific contract events
- Alert on `Listed`, `Sold`, `Transfer` events
- Use Blockscout MCP for queries
- Trigger webhooks/Discord/Telegram

### 2. **Contract Interaction CLI via abi.ninja**
**Inspired by:** Tools skill (abi.ninja section)
- Paste address → get interactive CLI
- Auto-fetch ABI from Etherscan
- Call read/write functions
- Multi-chain support

### 3. **CHOPS Architecture Reviewer**
**Inspired by:** CHOPS Review skill
- Run checklist against dApp plan
- Audit: Censorship Resistance, Open Source, Privacy, Security
- Generate report before deployment
- Separate "reviewer agent" workflow (QA skill pattern)

### 4. **Gas Cost Calculator**
**Inspired by:** Gas & Costs skill
- Real-time L1 vs L2 comparison
- Common operation costs (token transfer, swap, mint)
- Counter "Ethereum is expensive" FUD with data

### 5. **Smart Contract Security Pre-Deploy Checklist Bot**
**Inspired by:** Security + Audit skills
- 500+ checklist items across 19 domains
- Runs before `forge verify`
- Files GitHub issues for findings
- Parallel specialist agents pattern

### 6. **MCP Server Wrapper for The Graph**
**Inspired by:** Indexing + Tools skills
- Expose GraphQL subgraphs via MCP protocol
- Let agents query indexed data type-safely
- Bridge The Graph to LLM context

### 7. **Three-Phase Build Orchestrator**
**Inspired by:** Orchestration skill
- Phase 1: Plan (architecture)
- Phase 2: Build (contracts + frontend)
- Phase 3: Deploy (verification + QA)
- Implements "Ship" skill workflow end-to-end

### 8. **Wallet Label Enrichment Service** *(Nansen-adjacent)*
**Inspired by:** Contract Addresses + Indexing skills
- While ETHSKILLS doesn't mention Nansen, the **verified contract addresses** skill suggests a gap
- Build: On-chain activity pattern analyzer
- Label wallets: "DeFi power user", "NFT collector", "Bot", "Exchange"
- Store labels in subgraph for queries

---

## Prerequisites & Install Steps (from Tools page)

### Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### x402 (HTTP Payments)
**TypeScript:**
```bash
npm install @x402/core @x402/fetch @x402/env @x402/express
```

**Python:**
```bash
pip install x402
```

### Blockscout MCP
**URL:** `https://mcp.blockscout.com/mcp`
(No install — it's a server endpoint agents query)

### abi.ninja
**URL:** `https://abi.ninja`
(Browser-based, no install)

**Cost/Credit Warnings:** None explicitly mentioned. The site emphasizes **free, open-source tools** (Foundry, The Graph, public RPCs). Commercial services (Alchemy, Infura) not prominently featured.

---

## Skills as Small Runnable Tools

Several skills are **checklists or workflows** rather than lectures:

### Checklists
- **CHOPS Review** - Architecture audit checklist (CSRF pattern)
- **Security** - Pre-deploy security checklist
- **QA** - Post-build QA checklist (for separate reviewer agent)
- **Audit** - 500+ item deep audit checklist (19 domains)

### Workflows
- **Ship** - End-to-end orchestration (plan → build → deploy)
- **Frontend Playbook** - Production deployment pipeline (IPFS, Vercel, ENS)
- **Orchestration** - Three-phase build system

### Tools/Scripts
- **Contract Addresses** - Verified address lookup (could be API/database)
- **Gas & Costs** - Real-time gas price comparison (runnable script)
- **Wallets** - Wallet creation + signing workflow (command sequence)

**Pattern:** Many skills are **executable procedures** rather than pure documentation, designed for agents to follow step-by-step.

---

## Notable Quotes

1. **"Your AI agent is wrong about building on Ethereum. ETHSKILLS fixes that, so anyone can ship onchain, expert or not."**

2. **"Read https://ethskills.com/SKILL.md and follow it before writing Solidity or shipping anything onchain."** *(Standard prompt)*

3. **"Fetch this FIRST, it routes you through all other skills."** *(Ship skill)*

4. **"'Nothing is automatic' — every function needs a caller and an incentive."** *(Concepts skill)*

5. **"Why this matters: Instead of scraping Etherscan or making raw API calls, agents get structured, type-safe blockchain data via MCP."** *(Tools skill, Blockscout MCP)*

6. **"The Graph turns your contract's events into a queryable GraphQL API. It's how every serious dApp reads historical data."** *(Indexing skill)*

7. **"Give this to a SEPARATE reviewer agent after the build — it audits the app against every common mistake AI agents make before shipping."** *(QA skill)*

8. **"500+ non-obvious checklist items across 19 domains — AMM, lending, oracles, proxies, signatures, governance, bridges, and more. Runs parallel specialist agents, synthesizes findings, and files Github issues."** *(Audit skill)*

---

## Connections to Nansen/On-Chain Data Use Cases

**Direct Mentions:** NONE

**Adjacent Topics:**
- **Indexing skill** teaches reading historical on-chain data → same problem Nansen solves at enterprise scale
- **Contract Addresses skill** provides verified addresses → same trust problem Nansen's wallet labels solve
- **The Graph** is mentioned as the indexing standard → Nansen likely uses similar indexing infrastructure internally
- **Events as API** pattern → Nansen's smart money tracking relies on event indexing
- **Tool discovery for agents** → A Nansen MCP server would fit this pattern perfectly

**Gap:** ETHSKILLS focuses on **DIY on-chain data** (The Graph, Blockscout MCP, direct event queries) but does not reference **commercial analytics platforms** (Nansen, Dune SQL API, Arkham, etc.). This suggests:
1. The site prioritizes **open-source/permissionless stacks**
2. A **Nansen MCP server** would complement ETHSKILLS' tool ecosystem
3. Builders using ETHSKILLS would need to discover Nansen separately

---

## Screenshots Saved

1. **`media/ethskills-homepage.webp`** - Homepage with headline, tagline, and first 4 skills visible
2. **`media/ethskills-tools-page.webp`** - Tools skill page showing Blockscout MCP, abi.ninja, x402 SDKs, tool discovery pattern
3. **`media/ethskills-indexing-page.webp`** - Indexing skill page showing The Graph, event-first design, Solidity code examples

---

## Summary for Hackathon Builders

**ETHSKILLS is a modular knowledge base for AI agents building on Ethereum.** It corrects common LLM mistakes through 25 standalone markdown "skills" covering everything from gas costs to ZK privacy. The site explicitly supports **MCP (Model Context Protocol)** via the Blockscout MCP server and emphasizes **agent-friendly workflows** (checklists, code examples, tool discovery patterns).

**For Nansen-related hackathon work:**
- ETHSKILLS does **not mention Nansen** but provides the **on-chain data reading patterns** (The Graph, indexing, events) that Nansen implements at scale
- A **Nansen MCP Server** would slot perfectly into the "Tools" skill alongside Blockscout MCP
- The **"Contract Addresses" and "Indexing" skills** reveal gaps where Nansen's wallet labels and smart money data would add value
- The **QA/Audit skills** demonstrate multi-agent review patterns that could incorporate Nansen data (e.g., "Check if deployer address is a known rug puller")

**Runnable tool ideas from ETHSKILLS:**
- Event monitoring bots (Indexing skill)
- CHOPS architecture reviewer (CHOPS Review skill)
- Security pre-deploy checker (Security + Audit skills)
- Gas cost comparator (Gas & Costs skill)
- MCP server for The Graph (bridge to LLM context)

**No secrets, keys, or authentication flows observed.** All documented tools are public APIs or open-source CLIs.

---

**End of Report**
