

## Plan: Add Sparkline Background Charts to Main Page Tokens

### Scope
Add real-time background sparkline charts (identical to the Pulse section) to three areas on the main page (`/fun`):
1. **King of the Hill** cards (top 3 tokens)
2. **Token grid** cards (all tokens below)
3. **Just Launched** horizontal scroll cards

### Changes

**1. `src/components/launchpad/KingOfTheHill.tsx`**
- Import `useSparklineBatch` and `SparklineCanvas`
- In the `KingOfTheHill` export function, collect all `mint_address` values from `tokens` and call `useSparklineBatch`
- Pass `sparklineData` down to each `KingCard`
- Inside `KingCard`, add `<SparklineCanvas data={sparklineData ?? [1, 1]} />` as an absolutely-positioned background element (behind all card content via `z-0`, card content gets `relative z-10`)
- The outer card div already has `relative` and `overflow` styling

**2. `src/components/launchpad/TokenCard.tsx`**
- Accept a new optional prop `sparklineData?: number[]`
- Inside the card's root `<Link>`, add `<SparklineCanvas data={sparklineData ?? [1, 1]} />` positioned absolutely behind content
- Add `relative overflow-hidden` to the root element if not already present

**3. `src/pages/FunLauncherPage.tsx`**
- Import `useSparklineBatch` and `SparklineCanvas`
- Collect all `mint_address` values from both `tokens` (grid) and `justLaunchedTokens`
- Call `useSparklineBatch` once with the combined list
- Pass sparkline data to each `<TokenCard>` via the new `sparklineData` prop
- For the inline Just Launched cards, wrap each card in a `relative overflow-hidden` container and render `<SparklineCanvas>` behind the content

### Data Flow
- All addresses collected → single `useSparklineBatch` call → 500ms polling
- Tokens without Codex data get `[1, 1]` fallback → straight green line

### Files Modified
- `src/components/launchpad/KingOfTheHill.tsx`
- `src/components/launchpad/TokenCard.tsx`
- `src/pages/FunLauncherPage.tsx`

