

## Add "% Holdings" Column to Holders Table and All Trades Table

The reference image shows the "Remaining" column displaying a **USD value** (e.g. `$2.55K`) alongside a **percentage badge** (e.g. `99.43%`) with a progress bar underneath. Currently the Holders table shows token amount instead of USD value, and the All Trades table has no holdings column at all.

### Changes

#### 1. Update `HoldersTable.tsx` — Remaining column
- Replace the token amount display with the **USD value** of remaining holdings: `holder.tokenAmount * currentPriceUsd`, formatted with `formatUsdCompact`
- Show the percentage in a pill/badge style (dark background, rounded) matching the reference image
- Keep the progress bar underneath

#### 2. Update `CodexTokenTrades.tsx` — Add "% Holdings" column
- The trades table currently has no holdings data. We need to accept `totalSupply` and `currentPriceUsd` as new props, plus a way to know each maker's current token balance
- Pass `holdersData` from `TokenDataTabs` into `CodexTokenTrades` so we can look up each trader's current holding percentage
- Add a new column after "Size" showing the trader's current `$value` and `%` of supply (looked up from holders data)
- If the trader isn't in the top holders list, show `—`

#### 3. Update `TokenDataTabs.tsx`
- Always fetch holders data (not just on holders tab) so it's available for trades view
- Pass holders array and `currentPriceUsd` to `CodexTokenTrades`

### Visual Style (matching reference)
- USD value in white/foreground, e.g. `$2.55K`
- Percentage in a subtle dark pill badge: `99.43%`
- Thin progress bar underneath (blue/green for normal, red for >10%)

