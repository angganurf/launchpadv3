

## Plan: Saturn-Themed PNL Card Redesign

### What needs to happen

**1. Redesign `ProfitCardModal.tsx` with Saturn branding**

Replace the current "CLAWMODE" themed card with a Saturn Trade branded design:

- **Header**: Saturn logo (`src/assets/saturn-logo.png`) + "SATURN TRADE" text, cosmic dark gradient background matching the 2025 terminal aesthetic
- **Background**: Deep cosmic gradient with neon lime/yellow accents (#c8ff00/#facc15) instead of the plain dark blue
- **P&L Section**: Large neon-colored percentage with glassmorphic inner card, green for profit / red for loss, with subtle glow effects
- **Token info**: Buy/Sell badge, token ticker + name, amount in SOL
- **Wallet**: Truncated wallet address with Saturn avatar ring
- **QR Code + Referral**: Keep existing QR functionality but style with Saturn accent borders
- **Footer**: Saturn branding watermark + date
- **File download**: Rename from `clawmode-*` to `saturntrade-*`
- **Tweet text**: Change `@clawmode` to `@saturntrade` branding

**2. Wire up the "Share your P&L" button**

In both `UniversalTradePanel.tsx` (line 420) and `TradePanelWithSwap.tsx` (line 357), the TWEET button currently does nothing. Change it to a "Generate PNL Card" button that opens the `ProfitCardModal` with current token data populated.

**3. Files to modify**

| File | Changes |
|------|---------|
| `src/components/launchpad/ProfitCardModal.tsx` | Full visual redesign — Saturn logo, cosmic gradient bg, glassmorphic P&L card, neon accents, updated branding text |
| `src/components/launchpad/UniversalTradePanel.tsx` | Wire "Share your P&L" row to open ProfitCardModal with token data |
| `src/components/launchpad/TradePanelWithSwap.tsx` | Same wiring for the swap variant panel |

