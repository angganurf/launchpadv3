

## Fix P1/P2/P3 Wallet Preset Persistence + Quick-Buy Performance + Filters UI

### 1. P1/P2/P3 Wallet Presets — Persist per-preset amounts

**Problem**: `activePreset` is local component state, not persisted. Switching P1→P2→P3 loses the amount because there's no per-preset storage.

**Fix in `PulseColumnHeaderBar.tsx`**:
- Store each preset's amount in `localStorage` under keys `pulse-qb-P1`, `pulse-qb-P2`, `pulse-qb-P3`
- On preset switch, save current amount to current preset key, load new preset's amount, call `onQuickBuyChange` with loaded amount
- Persist `activePreset` selection in localStorage too (`pulse-active-preset`)
- On mount, read active preset and its amount from localStorage

### 2. Quick-Buy Amount — Near-instant propagation

**Problem**: Changing the amount triggers a full re-render cascade through TradePage → AxiomTerminalGrid → all AxiomTokenRow components.

**Fix**:
- `quickBuyAmount` is already a simple number prop on `AxiomTokenRow` which is wrapped in `memo` — React should skip re-renders if other props haven't changed. The real bottleneck is that `tokens` array reference changes on every filter cycle.
- Ensure `useMemo` dependencies are correct in `AxiomTerminalGrid` so filtered arrays don't rebuild unnecessarily
- The `PulseQuickBuyButton` already receives `quickBuyAmount` directly — memo should handle this efficiently
- Remove the top toolbar quick-buy input from TradePage since the column headers now serve that purpose (reduces duplicate state management)

### 3. Filters Dialog — Match Axiom dark UI from screenshot

**Current issues** (based on the screenshot reference the user shared):
- Input fields need proper dark styling matching the reference (dark bg, subtle border, placeholder text)
- Layout spacing needs refinement
- "Apply All" button should use the chartreuse/yellow-green accent color like Axiom

**Fix in `PulseFiltersDialog.tsx`**:
- Style `pulse-filter-input` class in CSS with proper dark background (`bg-muted/40`), border, and sizing
- Make RangeRow labels wider and properly aligned
- Style the Apply All button with the accent color
- Ensure the dialog renders correctly on mobile (already has responsive width)

### Files to Modify

- **`src/components/launchpad/PulseColumnHeaderBar.tsx`** — localStorage persistence for P1/P2/P3 amounts and active preset
- **`src/components/launchpad/PulseFiltersDialog.tsx`** — Visual polish to match Axiom screenshot
- **`src/index.css`** — Add/fix `pulse-filter-input` styles
- **`src/pages/TradePage.tsx`** — Minor: remove duplicate quick-buy input from top toolbar (column headers handle it now)

