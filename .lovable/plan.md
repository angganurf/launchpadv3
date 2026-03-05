

## Discover Page - Top DexScreener Trending Coins

### Overview
Create a new `/discover` page showing the top 50 trending Solana tokens from DexScreener's token boosts/trending API, auto-refreshing every 2 minutes with rank repositioning.

### 1. Edge Function: `dexscreener-trending`

**File**: `supabase/functions/dexscreener-trending/index.ts` (new)

Fetches from DexScreener's trending endpoints:
- `https://api.dexscreener.com/token-boosts/top/v1` for top boosted tokens
- Filter to Solana chain only (`chainId === "solana"`)
- For each token, batch-fetch pair data via `https://api.dexscreener.com/tokens/v1/solana/{addresses}` (30 per chunk) to get market cap, volume, liquidity, price change, image, name, symbol, social links
- Return top 50 ranked by boost amount / volume
- Include: address, name, symbol, imageUrl, marketCap, volume24h, priceChange6h, priceUsd, liquidity, holders, socialLinks, rank

### 2. Hook: `useDiscoverTokens`

**File**: `src/hooks/useDiscoverTokens.ts` (new)

- Calls the `dexscreener-trending` edge function
- `refetchInterval: 120_000` (2 minutes)
- `staleTime: 60_000` (1 minute)
- Returns typed array of trending tokens with rank

### 3. Discover Page

**File**: `src/pages/DiscoverPage.tsx` (new)

Layout inspired by the Axiom screenshot (reference image):
- Header: "Top Last 6 Hour Trending Coins" title with auto-refresh indicator
- Table/list view with columns: Rank #, Token image + name + symbol, Market Cap, Liquidity, Volume, Price Change (6h), and a link to trade
- Each row is clickable → navigates to `/trade/{address}`
- Reuses existing design patterns (`gate-card`, dark theme, mono fonts)
- Shows skeleton loading state
- Rank numbers update on each refresh with smooth repositioning

### 4. Route & Navigation

**File**: `src/App.tsx` — Add lazy import + `<Route path="/discover" element={<DiscoverPage />} />`

**File**: `src/components/layout/Sidebar.tsx` — Add `{ to: "/discover", label: "Discover", icon: TrendingUp }` to NAV_LINKS (TrendingUp is already imported)

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/dexscreener-trending/index.ts` | New — fetch top 50 trending Solana tokens from DexScreener |
| `src/hooks/useDiscoverTokens.ts` | New — React Query hook with 2-min refresh |
| `src/pages/DiscoverPage.tsx` | New — trending coins table page |
| `src/App.tsx` | Add route `/discover` |
| `src/components/layout/Sidebar.tsx` | Add Discover nav link with TrendingUp icon |

