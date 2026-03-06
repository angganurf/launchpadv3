

## Add Pulse Features (P1/P2/P3, Filters, Quick Buy) to Launchpad Main Page + Login Popup

### What We're Doing

The main LaunchpadPage currently shows token cards in a basic list without any Pulse terminal features. We'll bring over the same P1/P2/P3 wallet presets, filter system, and quick buy buttons from the Pulse trade terminal — and add a styled "not logged in" popup when unauthenticated users try to trade.

### Changes

**1. `src/pages/LaunchpadPage.tsx`** — Major refactor:
- Import and mount `PulseColumnHeaderBar` at the top of the token list (with P1/P2/P3 presets, quick buy amount, filter button)
- Import and mount `PulseFiltersDialog` for advanced filtering
- Add `usePulseFilters` hook for filter state
- Add `useSolPrice` hook so token cards get SOL price for USD formatting
- Add `quickBuyAmount` state synced with localStorage (same as TradePage pattern)
- Pass `quickBuyAmount` to each `TokenCard`

**2. `src/components/launchpad/TokenCard.tsx`** — Add quick buy button:
- Accept new `quickBuyAmount` prop
- Add `PulseQuickBuyButton` at the bottom of each card (next to the Trade button area)
- The existing `PulseQuickBuyButton` already handles auth check and calls `login()` if not authenticated

**3. `src/components/launchpad/NotLoggedInModal.tsx`** — New file:
- Dark card modal matching the reference screenshot style (similar to the "ADD CELEBRITY LINKS" popup)
- Header with link icon: "CONNECT TO TRADE"
- Description: "Log in to start trading tokens instantly with one-click quick buy"
- Olive/yellow CTA button: "CONNECT WALLET" that calls `useAuth().login()`
- Terms text at bottom
- Exported as a reusable dialog component

**4. `src/components/launchpad/PulseQuickBuyButton.tsx`** — Update auth flow:
- Instead of just calling `login()` directly when not authenticated, show the new `NotLoggedInModal` first
- This gives a branded, informative experience before the Privy login flow kicks in

### Implementation Details

The `PulseColumnHeaderBar` will be placed above the token grid on the launchpad page, providing the same ⚡ quick buy amount editor, P1/P2/P3 presets, and filter icon. The filter state from `usePulseFilters` will be applied to the launchpad tokens using `applyFilterToFunTokens`.

The `NotLoggedInModal` will use the same dark glassmorphic styling as `VerifyAccountModal` — dark card, uppercase mono headers, olive/yellow `#8B8000` CTA button, border accents, and terms footer text.

### Files Summary

| File | Action |
|------|--------|
| `src/pages/LaunchpadPage.tsx` | Edit — add PulseColumnHeaderBar, filters, quickBuyAmount state |
| `src/components/launchpad/TokenCard.tsx` | Edit — add PulseQuickBuyButton with quickBuyAmount |
| `src/components/launchpad/NotLoggedInModal.tsx` | Create — branded login popup |
| `src/components/launchpad/PulseQuickBuyButton.tsx` | Edit — show NotLoggedInModal instead of bare login() |

