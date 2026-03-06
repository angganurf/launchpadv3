

## Plan: 500ms Refresh + Fallback Green Line for All Tokens

### Changes (2 files)

**1. `src/hooks/useSparklineBatch.ts`** (lines 39-40)
- Change `refetchInterval` from `1500` to `500`
- Change `staleTime` from `1000` to `400`

**2. `src/components/launchpad/SparklineCanvas.tsx`**
- Accept an optional `fallback` prop (default `true`)
- In the parent row components (`AxiomTokenRow` and `CodexPairRow`), always render `<SparklineCanvas>` even when `sparklineData` is undefined — pass an empty array or `[1, 1]` as fallback data
- Actually, simpler approach: handle this at the **row level** — if `sparklineData` is undefined or empty, pass `[1, 1]` (flat line) instead. This draws a straight green line at the vertical center of the card.

**3. `src/components/launchpad/AxiomTokenRow.tsx`** and **`src/components/launchpad/CodexPairRow.tsx`**
- Remove the conditional guard `sparklineData && sparklineData.length >= 2`
- Always render `<SparklineCanvas data={sparklineData ?? [1, 1]} />`
- This ensures every token card shows at minimum a flat green line background

### Result
- All token cards across New Pairs, Final Stretch, and Migrated show a background chart
- Tokens with real price data show the actual sparkline
- Tokens without data show a subtle straight green line through the middle
- Data refreshes every 500ms

