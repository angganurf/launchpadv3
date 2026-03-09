

## Problem

1. **Z-index layering**: The sparkline canvas renders at the same stacking level as card content (images, text, buttons). Content needs `relative z-10` to sit above the `z-0` sparkline background.

2. **Token images still failing**: The `OptimizedTokenImage` fallback cascade works, but the image inside the card's image section doesn't have the DexScreener fallback on some usage sites. Also, pump.fun's own CDN (`cf-ipfs.com`, `pump.mypinata.cloud`) images may fail silently.

## Plan

### 1. Fix z-index layering across all sparkline-containing components

**AxiomTokenRow.tsx** and **CodexPairRow.tsx**: The `SparklineCanvas` is a direct child without a positioning wrapper. Wrap it in `<div className="absolute inset-0 z-0 pointer-events-none">` and add `relative z-10` to both content divs (Row 1 and Row 2).

**TokenCard.tsx**: The sparkline wrapper already has `z-0`, but the content sections (image div, card body) need `relative z-10` added.

**KingOfTheHill.tsx** and **FunLauncherPage.tsx**: Same pattern — ensure content divs have `relative z-10`.

### 2. Token image fallback improvements

The `fallbackSrc` is already wired in most places. The remaining issue may be that pump.fun IPFS URLs redirect or fail with CORS. No additional code changes needed beyond what's already implemented — the error cascade handles this.

### Files to modify
- `src/components/launchpad/AxiomTokenRow.tsx` — wrap sparkline, add z-10 to content
- `src/components/launchpad/CodexPairRow.tsx` — wrap sparkline, add z-10 to content
- `src/components/launchpad/TokenCard.tsx` — add z-10 to image and body sections
- `src/components/launchpad/KingOfTheHill.tsx` — add z-10 to content sections
- `src/pages/FunLauncherPage.tsx` — add z-10 to content sections

