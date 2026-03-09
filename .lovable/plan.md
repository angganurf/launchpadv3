

# Make Alpha Tracker Traders Clickable + Enhanced Profile Trading Analytics

## Overview
Two changes: (1) make trader names in Alpha Tracker link to `/profile/:wallet`, and (2) add a comprehensive trading analytics section to the user profile page inspired by the reference screenshot.

## 1. Alpha Tracker — Clickable Traders
**File: `src/pages/AlphaTrackerPage.tsx`**
- Wrap trader name/avatar with `<Link to={/profile/${trade.wallet_address}}>` 
- The profile page already resolves by wallet address via `isWalletAddress()` check in `useUserProfile`

## 2. User Profile — Trading Analytics Dashboard
**File: `src/hooks/useUserProfile.ts`**
- Add a new query to fetch `alpha_trades` for the profile's wallet address
- Compute position summaries (reuse `computePositions` logic from `useAlphaTrades`)
- Calculate aggregate stats: total PnL, realized PnL, total transactions (buys/sells), and PnL distribution buckets

**File: `src/pages/UserProfilePage.tsx`**
Add a trading analytics section above or within the tabs, inspired by the screenshot:

### Stats Cards Row (3 columns):
- **Balance**: Total value in SOL (sum of current holdings × price), tradeable balance, unrealized PnL
- **Performance**: Total PnL, Realized PnL, Total TXNs (with buy/sell counts colored green/red)
- **PnL Distribution**: Breakdown by percentage ranges (>500%, 200-500%, 0-200%, 0 to -50%, < -50%) with counts and colored bar

### New Tabs:
Add **"Active Positions"** and **"Activity"** tabs alongside existing Tokens/Trades:
- **Active Positions**: Grid showing tokens still held — Type (BUY), Token name/logo, Amount (SOL), Market Cap at entry, Age, Explorer link
- **Activity**: Chronological feed of all alpha trades for this wallet (same as current trades but enriched with alpha data)

### Data Sources:
- `alpha_trades` filtered by `wallet_address` = profile's wallet
- Position computation reused from `useAlphaTrades.ts` (extract `computePositions` to shared util)
- Token images from `tokens` table (same pattern as `useAlphaTrades`)

## 3. Extract Shared Utilities
**New file: `src/lib/tradeUtils.ts`**
- Move `computePositions()` and `PositionSummary` interface here so both `useAlphaTrades` and `useUserProfile` can use them
- Move formatting helpers (`formatTokenAmt`, `formatMcap`, `timeAgo`)

## Files to modify:
1. `src/pages/AlphaTrackerPage.tsx` — wrap trader with Link
2. `src/hooks/useUserProfile.ts` — add alpha trades query for wallet
3. `src/pages/UserProfilePage.tsx` — add trading analytics dashboard (stats cards + new tabs)
4. `src/lib/tradeUtils.ts` (new) — shared position computation utilities
5. `src/hooks/useAlphaTrades.ts` — import from shared util instead of local

