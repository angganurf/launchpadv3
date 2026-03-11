

## Fix: `tracked_wallets` RLS Policy Blocking Inserts

### Root Cause
The `tracked_wallets` table has an RLS policy: `auth.uid() = user_profile_id`. But this app uses **Privy** for authentication — not Supabase Auth. There is no Supabase auth session, so `auth.uid()` is always `null`, and every insert/select/update/delete from the frontend fails with a 401.

This same problem likely affects all tables using `auth.uid()` in RLS policies, but tables like `profiles` work because they're accessed via the `sync-privy-user` edge function which uses the **service role key** (bypasses RLS).

### Fix Approach
Since there is no Supabase Auth session and `auth.uid()` will never return a value, the `tracked_wallets` operations need to go through an **edge function** that uses the service role key — matching the pattern already established by `sync-privy-user`.

**Create edge function: `wallet-tracker-manage`**
- Accepts actions: `add`, `remove`, `list`, `update`, `clear`
- Validates the Privy user identity (via `profileId` passed from the frontend, matching the Privy DID → UUID pattern)
- Uses the service role Supabase client to perform CRUD on `tracked_wallets`
- All operations scoped to the user's `user_profile_id`

**Update frontend files:**
- `WalletTrackerPanel.tsx` — replace direct `supabase.from('tracked_wallets')` calls with `supabase.functions.invoke('wallet-tracker-manage', ...)`
- `CopyTrading.tsx` — same replacement for its tracked wallet operations

### Files to Create
- `supabase/functions/wallet-tracker-manage/index.ts`

### Files to Edit
- `src/components/layout/WalletTrackerPanel.tsx` — use edge function instead of direct table access
- `src/components/launchpad/CopyTrading.tsx` — use edge function instead of direct table access

### Config
- Register `wallet-tracker-manage` in `supabase/config.toml` with `verify_jwt = false`

