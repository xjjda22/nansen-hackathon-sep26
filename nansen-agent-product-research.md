---
cursor:
  subagentId: "bc-5c2ba82d-5edd-58b2-a128-a869b0a5e775"
---

# Nansen AI Agent Product Research

**URL Tested:** https://app.nansen.ai/?agent=true  
**Date:** September 23, 2026  
**Access Level:** Public (no login)

## Executive Summary

Nansen AI is a **chat-based AI agent integrated into the Nansen crypto intelligence platform**. It provides natural language access to on-chain data about Smart Money wallets, token analytics, whale activity, and trading intelligence. The agent is accessible via a sidebar panel and can be triggered with keyboard shortcuts (CTRL+E).

---

## Agent UI Overview

### Interface Type
- **Hybrid dashboard + chat interface**
- Main dashboard shows Token Screener with live crypto data
- Right sidebar panel for AI chat (collapsible)
- Agent accessible via:
  - Top navigation "Nansen AI" button
  - Search modal → "Ask AI" button (CTRL+E)
  - Direct URL parameter `?agent=true`

### Page Structure
- **Main headline:** "What Are We Trading Today?"
- **Input box:** "Ask Nansen AI" with mode selector (Fast/Auto)
- **Example prompt carousel** below input (horizontally scrolling)
- **Token Screener table** showing live market data (BTC, ETH, SHIB, HYPE, etc.)
- **Right sidebar:** Sign-up promotion and Smart Money feature highlights

### Agent Modes
- **Fast mode** - Quick responses
- **Auto mode** - Default setting, more comprehensive analysis

---

## Example Prompts / Suggested Queries

The following exact prompts were observed rotating in the carousel:

1. **"All Smart Money holding..."** (text cut off in UI)
2. **"Identify tokens with increasing whale accumulation"**
3. **"Why is $PENGU up in the last 24h?"**
4. **"Suggest 3 tokens that Smart Money holds but I don't"** *(personal portfolio context)*
5. **"Who are the top wallets buying $PENGU?"**
6. **"Reset my portfolio"** *(action command)*
7. **"What's trending with Smart Money today?"**
8. **"What sectors dominate Smart Money Holding..."** (text cut off)

### Query Patterns Observed
- **Token-specific:** "Why is $TOKEN up?" "Who's buying $TOKEN?"
- **Smart Money tracking:** Wallets, holdings, trends
- **Portfolio management:** Reset, suggestions, comparisons
- **Cohort analysis:** Whales, fresh wallets, sectors
- **Temporal:** "last 24h", "today"

---

## Navigation & Features Explored

### Left Sidebar Menu
**Main sections visible:**
- 🏠 **Home** - Main dashboard with agent
- 📊 **Trade** - Token trading interface with order book, charts
- 💰 **Smart Money** - Tracking top wallets (requires signup)
- 🪙 **Tokens** - Full token screener (public access)
- 👤 **Profiler** - Wallet profiling
- ⛓️ **Chains** - Multi-chain data
- 📱 **Get Mobile App**
- 💼 **Portfolio** - Personal holdings
- 🎯 **Points** - Gamification/rewards
- 📊 **Stake**
- 🔔 **Smart Alerts** - Notification system
- ⭐ **Watchlists**

**Developer/Info sections:**
- 🔧 **Nansen API** - API keys, credits, documentation
- 📰 **What's New**
- 🎓 **Academy**
- ❓ **Help**

### Pages Visited

#### 1. Home/Agent Page (`?agent=true`)
- **Content:** Agent chat interface, example prompts, Token Screener
- **Public access:** Yes
- **Screenshot:** `media/nansen-agent-main-page.webp`

#### 2. BTC Trading Page
- **URL pattern:** `/token-god-mode?chain=hyperliquid&tokenAddress=BTC`
- **Features visible:**
  - Price chart (candlestick)
  - Order Book (Long/Short tabs)
  - Tabs: Traders, PnL Leaderboard, Smart Money, Market Data, Perps, Token
  - **Position Intelligence** section mentions: "See how Smart Money is positioned"
  - Data sources: "Smart Money, Top PnL Traders, Public Figures, and Whales"
- **Limitation:** Perps trading blocked in region
- **Screenshot:** `media/nansen-btc-trade-page.webp`

#### 3. Smart Money Section
- **URL:** `/smart-money/?chains=solana`
- **Content:** Gated behind signup wall
- **Message:** "Sign Up for Smart Money - See which wallets have the best track record — and whose moves are worth following."
- **Tabs visible:** Tokens, Trades
- **Filters:** Realized/Unrealized, timeframes (7D, 30D, 90D, 180D)
- **Screenshot:** `media/nansen-smart-money-signup-wall.webp`

#### 4. Tokens Page
- **URL:** `/tokens?chains=hyperliquid`
- **Public access:** Yes ✅
- **Data shown:**
  - Token name, Price, 24h Change %, Volume, Traders count
  - Open Interest, Funding rates, Buy/Sell Pressure (visual bars)
  - Trade status indicators (green = "Trade")
- **Timeframes:** 5m, 10m, 1h, 6h, 24h, 7D, 30D
- **Tabs:** Tokens, Perps, Outcomes, Sectors
- **Screenshot:** `media/nansen-tokens-page.webp`

#### 5. Nansen API Page
- **URL:** `/api`
- **Buildathon Banner:** "Nansen Meridian Buildathon - Every purchase delivers double the credits"
- **Two signup options:**
  - **API Keys:** "On-chain intelligence — smart money, wallet labels, token analytics — straight from your code"
  - **API Credits:** "One balance powers every call. Start with 100 free credits"
- **Resources:**
  - 5-minute API quickstart guide
  - Use case templates (copy-paste)
  - Full documentation
  - Technical support team
- **Screenshot:** `media/nansen-api-page.webp`

#### 6. Search Modal
- **Trigger:** Click search bar (CTRL+K)
- **Tabs:** All, Tokens, Perps, Outcome, Wallets
- **Trending Assets section** showing real-time data
- **"Ask AI" button** (CTRL+E) - launches agent sidebar
- **Screenshot:** `media/nansen-search-modal.webp`

---

## Features & Data Types

### Cohorts Mentioned
- **Smart Money** - High-performing wallets
- **Whales** - Large holders
- **Fresh Wallets** - New entrants
- **Exchanges** - CEX addresses
- **Public Figures** - Known personalities
- **Top PnL Traders** - Best performing traders

### Data Dimensions
- **Price & Market Cap**
- **Volume & Liquidity**
- **24h Change %**
- **Whale accumulation patterns**
- **Wallet labels & tags**
- **Buy/Sell Pressure**
- **Open Interest & Funding rates**
- **Position Intelligence** (long/short positioning)
- **Trader counts**
- **Token flows**
- **Sector analysis**

### Timeframes Available
- Intraday: 5m, 10m, 1h, 6h
- Daily: 24h
- Weekly/Monthly: 7D, 30D, 90D, 180D

---

## Signup Walls & Limitations

### Features Requiring Account
From the "Sign Up for more functionality" modal:

1. **Smart Money**
   - "Follow the wallets that win"
   - Track top-performing wallet holdings and moves

2. **AI Agent** *(limited free use)*
   - "Research anytime, anywhere"
   - Full conversational queries require signup

3. **PnL Performance**
   - "Find the most profitable wallets"
   - Leaderboards and performance tracking

4. **Smart Alerts**
   - "Get notified the moment it matters"
   - Custom notifications for wallet/token events

**Screenshot:** `media/nansen-signup-features.webp`

### What Works Without Login
✅ Token Screener (prices, volume, traders count)  
✅ Basic trade page views  
✅ Search & trending assets  
✅ Example prompt browsing  
✅ Navigation & UI exploration  

❌ Agent query responses (login wall)  
❌ Smart Money wallet details  
❌ PnL Leaderboards  
❌ Portfolio tracking  
❌ Alert configuration  

---

## API & Developer Resources

### Nansen API
- **Access model:** API Keys + Credits system
- **Free tier:** 100 free credits to start
- **Buildathon promotion:** Double credits on purchases (time-limited)

### API Capabilities (from page text)
- On-chain intelligence queries
- Smart money wallet data
- Wallet labels & classifications
- Token analytics
- Programmatic access to all Nansen data

### Developer Support
- **5-minute quickstart guide**
- **Use case templates** - Pre-built query patterns
- **Full API documentation**
- **Technical support team** available

### Integration Opportunities
The API section explicitly mentions:
- "Accelerate development with copy-paste templates for the most popular Nansen API use cases"
- Suggests standardized patterns for common queries

---

## Hackathon Builder Opportunities

### Small Tool Ideas Based on Observed Features

1. **Whale Alert Bot**
   - Monitor specific tokens for whale accumulation
   - Use agent queries: "Who are the top wallets buying $TOKEN?"
   - Alert on threshold changes

2. **Smart Money Portfolio Tracker**
   - Query: "What's trending with Smart Money today?"
   - Build dashboard showing daily Smart Money moves
   - Compare personal holdings vs. Smart Money

3. **Token Momentum Scanner**
   - Use: "Identify tokens with increasing whale accumulation"
   - Automated screening tool
   - Score tokens by smart money interest

4. **Sector Rotation Analyzer**
   - Query: "What sectors dominate Smart Money Holding"
   - Track capital flows between sectors
   - Predict trend shifts

5. **$PENGU Case Study Tool**
   - Template query: "Why is $TOKEN up in the last 24h?"
   - Auto-generate reports for trending tokens
   - Combine price action + wallet analysis

6. **Wallet Label Enrichment**
   - Leverage Nansen's wallet labels via API
   - Add Smart Money / Whale tags to any address
   - Enhance block explorers or portfolio trackers

7. **MCP Server for Nansen**
   - Expose Nansen API as Model Context Protocol server
   - Let any LLM query Nansen data
   - Example skills: `get_smart_money_holders`, `check_whale_activity`

8. **Portfolio Comparison Tool**
   - Query template: "Suggest 3 tokens that Smart Money holds but I don't"
   - Highlight gaps between user portfolio and Smart Money
   - Actionable suggestions

---

## Technical Observations

### UI/UX Patterns
- **Horizontal prompt carousel** - Discoverable without requiring input
- **Keyboard shortcuts** (CTRL+K search, CTRL+E agent) - Power user optimized
- **Modal overlays** for signup - Non-blocking, can dismiss and explore
- **Sidebar chat panel** - Keeps main dashboard visible
- **Mode selector** (Fast/Auto) - Query optimization controls

### Agent Behavior
- Clicking example prompts populates query but **requires login to see response**
- Agent shows "Creating a new session..." when opening fresh chat
- Query sent indicator in top bar: "Nansen AI: [query text]"
- No response observed without authentication

### Data Freshness
- Token prices update in real-time (observed values changing during session)
- Trending assets section shows current market conditions
- 24h change % indicates daily rollover window

### CAPTCHA
- Cloudflare human verification appeared multiple times during exploration
- Indicates bot protection on public endpoints

---

## API Mentions & Integration Hints

### Explicit API Features
From `/api` page:
- **"Smart money, wallet labels, token analytics — straight from your code"**
- Credits-based pricing model
- 100 free credits starter amount
- Use case templates available

### Inferred API Capabilities
Based on UI features and prompts:
- Token data endpoints (price, volume, traders)
- Wallet classification (Smart Money, Whale, etc.)
- Holder queries by token
- Portfolio comparison
- Sector aggregation
- Time-series data (historical changes)
- Position intelligence (long/short ratios)

### MCP/Skills Potential
Prompts suggest these could map to discrete API calls:
- `get_token_holders(token, cohort="smart_money")`
- `get_wallet_positions(address)`
- `get_trending_tokens(cohort, timeframe)`
- `compare_portfolio(user_holdings, reference_cohort)`
- `get_sector_allocation(cohort)`
- `get_token_price_change(token, timeframe)`

---

## Screenshots Captured

All screenshots saved to `media/`:

1. **`nansen-agent-main-page.webp`** - Homepage with agent interface and example prompts
2. **`nansen-example-prompts.webp`** - Close-up of prompt carousel
3. **`nansen-btc-trade-page.webp`** - Token trading page showing order book and charts
4. **`nansen-smart-money-signup-wall.webp`** - Smart Money feature behind paywall
5. **`nansen-tokens-page.webp`** - Public token screener with live data
6. **`nansen-api-page.webp`** - API keys, credits, and developer resources
7. **`nansen-signup-features.webp`** - Modal showing 4 key features (Smart Money, AI Agent, PnL, Alerts)
8. **`nansen-search-modal.webp`** - Search interface with "Ask AI" button
9. **`nansen-agent-panel-opened.webp`** - Right sidebar agent chat interface

---

## Blockers & Limitations Encountered

### Authentication Wall
- Agent queries require signup to see responses
- Smart Money data fully gated
- PnL leaderboards inaccessible
- Could not test actual agent conversation flow

### Regional Restrictions
- Perps trading blocked in current region
- May affect available features for international users

### CAPTCHA Friction
- Multiple Cloudflare challenges during navigation
- Could impact API automation without proper authentication

### Incomplete Prompt Text
- Several example prompts truncated in UI ("...ry holds but...")
- Full prompt text only revealed when clicked or on hover

---

## Conclusions

### What the Agent Product Is
Nansen AI is a **conversational interface to institutional-grade on-chain intelligence**, embedded directly into a crypto analytics dashboard. It translates natural language questions about wallets, tokens, and market behavior into structured data queries.

### Key Value Propositions
1. **Smart Money Intelligence** - Track what top wallets are doing
2. **Whale Activity** - Monitor large holder movements
3. **Natural Language Queries** - No SQL or API knowledge needed
4. **Real-Time Data** - Live market and on-chain feeds
5. **Actionable Insights** - Portfolio suggestions, alerts, trend detection

### For Hackathon Builders
The agent demonstrates clear query patterns that can be:
- Replicated via Nansen API
- Extended with custom logic
- Integrated into wallets, bots, dashboards
- Exposed as MCP tools for LLMs

The **API page explicitly invites developers** with:
- Free credits
- Use case templates
- Quick start guides
- Buildathon incentives (double credits)

This is a **production-ready platform** designed for both end-users (via chat UI) and builders (via API).

---

## Recommendations for Product Integration

### If Building on Nansen API
1. Start with **use case templates** (mentioned on API page)
2. Focus on **cohort-based queries** (Smart Money, Whales) - this is their differentiation
3. Implement **time-series analysis** (24h, 7D windows) - matches user prompts
4. Use **wallet labels** as enrichment layer for any crypto tool

### If Building MCP Server
Expose these as discrete tools:
- `nansen_get_smart_money_holders(token)`
- `nansen_check_whale_activity(token, timeframe)`
- `nansen_compare_portfolios(user, reference_cohort)`
- `nansen_get_trending_sectors(timeframe)`
- `nansen_lookup_wallet_label(address)`

### If Building Agent
Copy Nansen's UX patterns:
- Example prompt carousel for discoverability
- Fast/Auto mode for performance vs. depth tradeoff
- Side panel to preserve context
- Keyboard shortcuts for power users

---

**End of Report**
