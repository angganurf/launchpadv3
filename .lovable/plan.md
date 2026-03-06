

## Plan: Real-time Sparkline Charts Behind Token Cards (Migrated Column)

### Approach

Use Codex's native **`tokenSparklines`** API — a batch endpoint designed exactly for this. It accepts an array of token IDs and returns lightweight `{timestamp, value}` price data. No need to call `getBars` per token.

**Key insight from your feedback:** Only fetch for tokens currently visible on screen, and refetch every 1-2 seconds for live movement.

### Architecture

```text
┌─────────────────────────────────────────────┐
│  Edge Function: codex-sparklines            │
│  - Accepts { ids: ["addr:1399811149", ...] } │
│  - Calls tokenSparklines with resolution "1"│
│  - Returns { [address]: number[] }          │
│  - Single GraphQL call, batches up to 20    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Hook: useSparklineBatch(addresses)         │
│  - React Query, refetchInterval: 1500ms     │
│  - Only active when addresses.length > 0    │
│  - Returns Map<address, number[]>           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Component: SparklineCanvas (memo)          │
│  - HTML Canvas, ~40px tall, full card width │
│  - Area fill, 10% opacity gradient          │
│  - Green if price up, red if down           │
│  - Absolute positioned behind card content  │
│  - Sub-1ms render per card                  │
└─────────────────────────────────────────────┘
```

### Why `tokenSparklines` instead of `getBars`

- Native batch: one API call for 20 tokens vs 20 separate calls
- Returns simple `{timestamp, value}` — lighter payload than OHLCV
- Supports resolution `"1"` (1-minute candles) for frequent updates
- Designed for exactly this use case (sparkline visualizations)

### Visibility-aware fetching

Only tokens currently rendered in the **Migrated** column will have their addresses passed to the hook. Tokens in collapsed mobile tabs or off-screen columns won't trigger any fetches.

### Changes

| File | Action |
|------|--------|
| `supabase/functions/codex-sparklines/index.ts` | Create — batch sparkline proxy using `tokenSparklines` GraphQL query |
| `supabase/config.toml` | Edit — add `[functions.codex-sparklines]` with `verify_jwt = false`. Also add missing `[functions.codex-chart-data]` entry |
| `src/hooks/useSparklineBatch.ts` | Create — React Query hook, 1.5s refetch interval, calls edge function |
| `src/components/launchpad/SparklineCanvas.tsx` | Create — pure Canvas component, memo-wrapped, area chart with gradient |
| `src/components/launchpad/AxiomTerminalGrid.tsx` | Edit — call `useSparklineBatch` with migrated token addresses, pass data down |
| `src/components/launchpad/AxiomTokenRow.tsx` | Edit — accept `sparklineData?: number[]`, render `SparklineCanvas` as absolute background |
| `src/components/launchpad/CodexPairRow.tsx` | Edit — same treatment for Codex graduated tokens |

### Edge function: `codex-sparklines`

```graphql
{
  tokenSparklines(input: {
    ids: ["addr1:1399811149", "addr2:1399811149", ...]
    resolution: "1"
  }) {
    id
    sparkline { timestamp value }
  }
}
```

Returns flattened `{ [address]: [value1, value2, ...] }` for the frontend.

### SparklineCanvas rendering

- Canvas element, absolute positioned at z-0 behind card content (card gets `relative overflow-hidden`)
- Draws polyline + gradient fill from price array
- Color: green (`#22c55e`) if last > first, red (`#ef4444`) if down
- Opacity: 0.08-0.12 so card text remains fully readable
- Only re-renders when data array reference changes (memo + shallow compare)

### Refetch strategy

- `refetchInterval: 1500` (1.5 seconds) — fast enough for visual movement
- `staleTime: 1000` — always re-validate
- `refetchIntervalInBackground: false` — stops when tab is hidden
- Resolution `"1"` gives 1-minute candles; with 1.5s polling the line shifts smoothly as new candles arrive

