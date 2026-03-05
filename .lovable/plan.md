

## Buy/Sell Sounds + Settings Page + Alpha Tracker

Three major features requested. Here is the implementation plan:

---

### 1. Buy/Sell Trade Sounds

**What**: Play an audio cue when a buy or sell trade fires on the terminal (from the Codex trade events feed).

**How**:
- Create a `useTradeSounds` hook that uses the Web Audio API to generate short synth tones (no external files needed):
  - **Buy** = ascending chirp (e.g. 600→900Hz, 80ms)
  - **Sell** = descending tone (e.g. 500→300Hz, 80ms)
- The hook reads a `pulse-sounds-enabled` localStorage flag (toggled via the existing Volume2 icon button in the TradePage toolbar)
- When trade events arrive in the token detail chart page, the hook compares previous vs current events and plays sounds for new ones
- The Volume2 button in the Pulse toolbar toggles sound on/off with visual feedback (highlighted when active)

**Files**: New `src/hooks/useTradeSounds.ts`, update `TradePage.tsx` (wire Volume2 toggle)

---

### 2. Settings Page (Axiom-style dropdown menu)

**What**: A settings dropdown in the header (right side), like Axiom's screenshot — with Account & Security, Settings, and profile management.

**How**:
- Expand `HeaderWalletBalance.tsx` dropdown menu to include:
  - **Profile picture** (avatar from `profiles.avatar_url`) + display name at top
  - **Account and Security** → links to `/panel?tab=portfolio` (existing Panel)
  - **Settings** → opens a new Settings modal/page with:
    - Display name edit
    - Avatar upload (using Lovable Cloud storage bucket)
    - Sound preferences toggle
    - Quick-buy default amount
    - Slippage default
  - **Alpha Tracker** → links to new `/alpha-tracker` route
  - **Log Out** (already exists)
- Create `SettingsModal.tsx` component with profile editing form
- Create a storage bucket `avatars` for profile picture uploads

**Database**: The `profiles` table already has `avatar_url`, `display_name`, `bio`, `username` — no new tables needed for settings. Profile picture uploads go to a storage bucket.

**Files**: Update `HeaderWalletBalance.tsx`, new `src/components/settings/SettingsModal.tsx`, new storage bucket migration

---

### 3. Alpha Tracker (Global Trade Feed)

**What**: A new page where all registered users' trades (buys/sells) are broadcast in real-time globally — any trade by any tracked user appears instantly on all screens.

**How**:

**Database**:
- New `alpha_trades` table:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → profiles.id)
  - `wallet_address` (text)
  - `token_mint` (text)
  - `token_name` (text, nullable)
  - `token_ticker` (text, nullable)
  - `trade_type` (text: 'buy' | 'sell')
  - `amount_sol` (numeric)
  - `amount_tokens` (numeric)
  - `price_usd` (numeric, nullable)
  - `tx_hash` (text)
  - `created_at` (timestamptz, default now())
- Enable Supabase Realtime on `alpha_trades`
- RLS: All authenticated users can SELECT; users can INSERT only their own trades

**Frontend**:
- New sidebar nav item: "Alpha Tracker" with a radar/crosshair icon
- New `AlphaTrackerPage.tsx` — a real-time scrolling trade feed showing:
  - User avatar + display name
  - Token name/ticker
  - Buy/Sell badge
  - Amount in SOL
  - TX hash link to Solscan
  - Timestamp (relative, e.g. "2s ago")
- Uses Supabase Realtime subscription to `alpha_trades` — new rows appear instantly at top
- Clicking a token row navigates to the chart page for that token
- Edge function `log-alpha-trade` that users' swap transactions call after execution to insert the trade record

**Files**: New `src/pages/AlphaTrackerPage.tsx`, new `src/hooks/useAlphaTrades.ts`, update `Sidebar.tsx` (add nav link), DB migration for `alpha_trades` table + realtime + RLS, new edge function

---

### Implementation Order

1. Trade sounds hook + Volume2 toggle wiring
2. Settings dropdown expansion + SettingsModal with profile editing + avatar upload
3. `alpha_trades` table + RLS + realtime
4. Alpha Tracker page + realtime hook
5. Sidebar nav link for Alpha Tracker

