

## Issues Found & Plan

After thorough investigation, here are all the issues and the fixes:

### 1. Remove Jupiter link & text from trade panels

**3 locations** reference Jupiter that need cleanup:

- **`UniversalTradePanel.tsx` (lines 526-536)**: "Trade on Jupiter" link at bottom of the panel — remove entirely.
- **`UniversalTradePanel.tsx` (line 518)**: Route display shows "Jupiter" or "PumpPortal (fallback)" — remove the Route row entirely (lines 515-520) since we don't want to expose routing internals.
- **`TradePanelWithSwap.tsx` (lines 171-186)**: Graduated state shows "Trade on Jupiter" button and text — replace with the internal swap (or remove the external link, showing a neutral message).
- **`TradePanel.tsx` (lines 103-120)**: Same graduated Jupiter redirect — remove.

### 2. PNL Simulator visibility

The `PnlSimulator` component exists (line 636 in `FunTokenDetailPage.tsx`) but is **only rendered on desktop layout** (line 963, inside `hidden lg:grid`). It's missing from:
- **Phone layout** (mobile tab "comments" section)
- **Tablet layout** (md to lg)

**Fix**: Add `<PnlSimulator />` to mobile and tablet layouts.

### 3. Route label ("Route via Jupiter/PumpPortal") removal

Found at `UniversalTradePanel.tsx` lines 515-520. Will be removed as part of fix #1.

### 4. "ff Launched" typo → "Launched"

Found in **two files**:
- `UniversalTradePanel.tsx` line 245: `"ff Launched"` → `"Launched"`
- `TradePanelWithSwap.tsx` line 193: `"ff Launched"` → `"Launched"`

### 5. Advanced settings safety checks — show all data

Currently showing 4 checks: "ff Launched", "Authority revoked", "Liquidity locked", "Top 10 < 30%".

The rugcheck edge function already returns `freezeAuthorityRevoked` but it's not displayed. Update both panels to show:
- **Launched** (graduation status)
- **Mint Authority Revoked** (from RugCheck — rename "Authority revoked" for clarity)
- **Freeze Authority Revoked** (new — from `rugCheck.freezeAuthorityRevoked`)
- **Liquidity Locked** (from RugCheck, with percentage)
- **Top 10 < 30%** (from RugCheck)

Change grid from `grid-cols-4` to `grid-cols-5` to accommodate 5 checks, or keep `grid-cols-4` and wrap to 2 rows.

### 6. Top 10 < 30% data accuracy

This data is **real and accurate**. It comes from the **RugCheck.xyz API** (`api.rugcheck.xyz/v1/tokens/{mint}/report`), which scans on-chain holder data. The edge function (`rugcheck-report/index.ts`) extracts the top 10 holders' percentage from `raw.topHolders`. This is not from CoinCodex — it's direct on-chain analysis via RugCheck. No changes needed for accuracy, but we could add a tooltip indicating the data source.

### Files to modify

| File | Changes |
|------|---------|
| `src/components/launchpad/UniversalTradePanel.tsx` | Remove Jupiter link (lines 526-536), remove Route row (515-520), fix "ff Launched" → "Launched", add freeze authority check, update grid |
| `src/components/launchpad/TradePanelWithSwap.tsx` | Fix "ff Launched" → "Launched", remove Jupiter graduated view, add freeze authority check, update grid |
| `src/components/launchpad/TradePanel.tsx` | Remove Jupiter graduated view |
| `src/pages/FunTokenDetailPage.tsx` | Add PnlSimulator to mobile and tablet layouts |

