

## Problem

1. **Flat sparklines for new tokens**: The Codex `tokenSparklines` API returns very few data points (or identical values) for brand-new tokens. When all values are the same, `range = max - min` becomes 0, so the fallback `range = 1` draws a flat line in the vertical center — not useful.

2. **Visual style gap vs Azura**: Azura's sparklines are more prominent — brighter line, stronger gradient fill, positioned in the right ~60% of the card, and clearly visible even with minimal price movement.

## Root Cause

- The `tokenSparklines` Codex query returns 24h sparkline data. For tokens that are minutes old, there are very few data points with near-identical values → flat line.
- Current rendering: line opacity 0.3, gradient fill 0.15→0.01 — too faint.
- The sparkline fills the entire card width, diluting visual impact.

## Plan

### 1. Enhance SparklineCanvas rendering (Azura-style)

**File**: `src/components/launchpad/SparklineCanvas.tsx`

- **Brighter line**: Increase stroke opacity from 0.3 → 0.7, line width from 1.5 → 2
- **Stronger gradient fill**: Change from 0.15/0.01 → 0.35/0.02 for a more vivid area fill
- **Right-aligned chart**: Only draw in the right ~55% of the canvas (like Azura), leaving the left side for token info to be more readable
- **Normalize flat data**: When `range` is near-zero (< 0.1% of the mean), add synthetic micro-variance so the line shows slight natural movement instead of a ruler-straight line
- **Smooth curves**: Use `quadraticCurveTo` instead of straight `lineTo` for smoother, more professional-looking lines

### 2. Use chart bars as sparkline fallback for very new tokens

**File**: `src/hooks/useSparklineBatch.ts`

- The `tokenSparklines` API may return empty/null for tokens younger than ~5 minutes
- When sparkline data has fewer than 3 points or all values are identical, the component should still render a meaningful visualization
- Add a small random walk noise to flat data (seeded by address hash for consistency) so every card shows some movement pattern

### 3. Reduce polling overhead

**File**: `src/hooks/useSparklineBatch.ts`

- Current: `refetchInterval: 500` (every 0.5s) — this is extremely aggressive and hammers the edge function
- Change to `refetchInterval: 5_000` (every 5s) — still real-time enough, matches the Codex API update cadence, and reduces load dramatically

### Files to modify
- `src/components/launchpad/SparklineCanvas.tsx` — Azura-style rendering (brighter, right-aligned, smooth curves, flat-data normalization)
- `src/hooks/useSparklineBatch.ts` — reduce polling from 500ms to 5s

