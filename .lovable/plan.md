

## Wallet Tracker -- Footer Popup (Market Lighthouse Style)

### What Changes

1. **Replace PAYOUTS stat** in `StickyStatsFooter.tsx` with a "Wallet Tracker" button (wallet icon) that opens a popup panel, same pattern as the Market Lighthouse launchpad button.

2. **Create `WalletTrackerPanel.tsx`** -- a new component styled identically to `MarketLighthouse.tsx` (dark `#0F0F0F` bg, `#1A1A1A` cards, same border/radius/font conventions, compact mode for mobile). Features based on the screenshot:

   - **Header**: "Wallet Tracker" title with green dot, tabs: All | Manager | Trades | Monitor
   - **Toolbar**: Search input ("Search by name or addr..."), Import/Export/Add Wallet buttons
   - **Table**: Columns -- Created, Name, Balance, Last Active, Remove All action
   - **Data source**: Reads from existing `tracked_wallets` table (already has `wallet_address`, `wallet_label`, `created_at`). Balance fetched on-chain via `@solana/web3.js`. Last active derived from latest `wallet_trades` entry.
   - **Add Wallet**: Inline dialog to add address + label, inserts into `tracked_wallets`
   - **Remove All**: Bulk delete all tracked wallets for the user
   - **Auth-gated**: Shows "Connect to track wallets" if not authenticated

3. **Footer integration** in `StickyStatsFooter.tsx`:
   - Add wallet icon button between the stats area and connection badge
   - Toggle `walletTrackerOpen` state, close other dropdowns when opened
   - Render `WalletTrackerPanel` in same popup pattern (absolute/fixed positioning, portal-aware)
   - Remove the `PAYOUTS` stat item and its divider

### Files to Create
- `src/components/layout/WalletTrackerPanel.tsx`

### Files to Edit
- `src/components/layout/StickyStatsFooter.tsx` -- remove PAYOUTS, add wallet tracker button + popup

### No DB changes needed
The `tracked_wallets` table already exists with all required fields.

