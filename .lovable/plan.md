

## Fix: Shrink KingCard Footer Buttons & Move Socials

The buttons in the KingCard footer are oversized (full `min-h-[36px]`, `px-4 py-2`) and the social icons are crammed on the same line. The fix:

### Changes to `src/components/launchpad/KingOfTheHill.tsx`

**1. Shrink footer buttons** (lines 308-326)
- Reduce Trade button: `min-h-[30px] px-3 py-1.5 text-[11px]` and smaller icon (`w-3 h-3`)
- Reduce Quick Buy wrapper: keep `flex-1` but the CSS override will handle sizing

**2. Move social icons to their own row above the buttons** (lines 328-389)
- Move the social icons `<div>` to sit above the footer buttons row, as a separate compact line with `mb-2`
- Social icons stay small (`w-2.5 h-2.5`), padding `p-1`

### Changes to `src/index.css`

**3. Shrink the king-quick-buy-wrapper `.pulse-sol-btn` override** (lines 1370-1396)
- Reduce padding: `5px 12px` (was `7px 16px`)
- Reduce min-height: `30px` (was `36px`)
- Reduce font-size: `11px` (was `12px`)

### Result
- Two compact, equal-width buttons side by side (Trade + Quick Buy), ~30px tall
- Social icons on a separate subtle row above, small and tidy
- No overflow on mobile

