

## Issues to Fix

### 1. "ALL TRADES" Tab Styling (Reference Image Match)
The current `CodexTokenTrades.tsx` uses a compact 11px table with tiny headers. The reference shows:
- **Tab bar**: "ALL TRADES" (chartreuse underline), "YOUR TRADES", "HOLDERS" — bold uppercase, more spacing
- **Table rows**: Each row has a **round avatar** + display name in the first column, a colored **BUY/SELL badge** (green bg for BUY, red bg for SELL with a small square icon prefix), Size column showing `≡ 0.842/$3.5`, Price column (`$3.5`), Time column (`1 m`, `32 m`, `2 h`), Transaction column (truncated hash as underlined link)
- Row height is generous (~56px), not the current cramped 11px rows
- No separate "Age" column — time is its own column labeled "Time"
- "Maker" column replaced with "Holders (count)" showing avatar + display name

### 2. Tab Bar Renaming
Current tabs: "Trades", "Holders", "Top Traders"
Reference: "ALL TRADES", "YOUR TRADES", "HOLDERS"
- Rename and restyle to match, using the same chartreuse underline pattern from the trade panel

### 3. Holders Tab — Same Row Style
The holders tab should show the same avatar + name row format (not just a count number). Use the holder addresses from Helius, display as avatar + truncated address rows.

### 4. Price Display Bug: "PRICE2.25e-8 SOL"  
In `FunTokenDetailPage.tsx` line 467, `stats` array uses `toExponential(2)` for price which shows `2.25e-8`. The label "PRICE" and value concatenate visually. Fix: format price properly using USD from Codex data instead of raw SOL exponential notation.

### 5. Holders Count Wrong
Line 466: `(token.holder_count || 0)` uses stale DB data. Need to fetch live holder count from Codex (`codex-token-info` returns `holders` field) or from the Helius holder endpoint. For internal tokens, also enrich with Codex data.

---

## Plan

### File: `src/components/launchpad/TokenDataTabs.tsx`
- Rename tabs: "ALL TRADES", "YOUR TRADES", "HOLDERS"
- Style tab bar with chartreuse `#c8ff00` underline for active tab, uppercase `text-[11px] tracking-wider`
- Pass `holderCount` from Codex data (not DB)

### File: `src/components/launchpad/CodexTokenTrades.tsx` — Full Restyle
- Change table layout to match reference exactly:
  - Column 1: "Holders (N)" — avatar (32px round, placeholder gradient) + maker display name or truncated address
  - Column 2: "Type" — BUY/SELL badge with small square dot prefix, green/red background pill
  - Column 3: "Size" — `≡ {tokenAmt}/{$USD}` format
  - Column 4: "Price" — `${USD}` 
  - Column 5: "Time" — relative time (`1 m`, `32 m`, `2 h`, `1 d`)
  - Column 6: "Transaction" — truncated tx hash as underlined link (`B661D6...5D4F`)
- Row height ~56px with proper padding
- Remove the Copy button from maker column
- Header row: muted uppercase labels matching reference

### File: `src/components/launchpad/TokenDataTabs.tsx` — Holders Tab
- Instead of showing just a big count number, render a table of holder addresses using the same row style (avatar + truncated address)
- Use data from `useTokenHolders` which returns `holders: string[]`

### File: `src/pages/FunTokenDetailPage.tsx` — Fix Price & Holders Data
- For internal tokens: also fetch Codex data via `useExternalToken` to get accurate `priceUsd`, `holders`, `marketCapUsd`
- Fix `stats` array line 463-469:
  - PRICE: use Codex `priceUsd` formatted as USD (not exponential SOL)
  - HOLDERS: use Codex `holders` count (not stale DB `holder_count`)
  - MCAP: use Codex `marketCapUsd` formatted as USD
- Pass accurate holder count to `TokenDataTabs`

### File: `src/components/launchpad/TokenDataTabs.tsx` — "YOUR TRADES" Tab
- Filter trades by connected wallet address (pass `userWallet` prop)
- Show same table format but filtered to user's trades only

