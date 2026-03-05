

## Multi-Launchpad Support + Launchpad Badges on Token Cards

### 1. Expand Codex Edge Function to fetch all launchpads

**File**: `supabase/functions/codex-filter-tokens/index.ts`

Currently hardcoded to `launchpadName: ["Pump.fun"]`. Change to include all major Solana launchpads:

```
launchpadName: ["Pump.fun", "Bonk", "Moonshot", "Believe", "boop", "Jupiter Studio"]
```

Remove `launchpadName` filter from the "completed" column entirely (or use the same list) so migrated tokens from any launchpad show up.

Also request `launchpadIconUrl` from the GraphQL query so we get the official icon URL from Codex for each launchpad.

### 2. Update `CodexPairToken` interface

**File**: `src/hooks/useCodexNewPairs.ts`

Add `launchpadIconUrl: string | null` to the interface. The edge function already returns `launchpadName` — just need to also map `launchpadIconUrl`.

### 3. Create a `LaunchpadBadge` component

**File**: `src/components/launchpad/LaunchpadBadge.tsx` (new)

A single unified badge component that renders the correct icon based on `launchpadName`:

- **Pump.fun** → uses existing `pumpfun-pill.webp` asset, green tint
- **Bonk** → uses Codex `launchpadIconUrl` or a fallback dog icon, orange tint  
- **Meteora** → uses existing tuna-logo or a fish icon, blue tint
- **bags.fm** → uses existing `BagsBadge` briefcase icon, blue tint
- **Moonshot** → rocket icon, purple tint
- **Believe** / **boop** / **Jupiter Studio** → uses `launchpadIconUrl` from Codex if available, else text fallback

Each badge is a small pill (like the existing `PumpBadge`): icon + short label, color-coded.

For local DB tokens (`AxiomTokenRow`), map `launchpad_type` → badge:
- `pump` / `pumpfun` → Pump.fun badge
- `dbc` / `meteora` → Meteora badge
- `bags` → bags.fm badge
- else → generic badge

### 4. Add badge to `CodexPairRow`

**File**: `src/components/launchpad/CodexPairRow.tsx`

In the bottom bar (Row 2), add `<LaunchpadBadge launchpadName={token.launchpadName} iconUrl={token.launchpadIconUrl} />` next to the progress % and DS badge.

### 5. Add badge to `AxiomTokenRow`

**File**: `src/components/launchpad/AxiomTokenRow.tsx`

In the bottom bar, add `<LaunchpadBadge launchpadType={token.launchpad_type} />` using the local DB field to determine which badge to show.

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/codex-filter-tokens/index.ts` | Remove Pump.fun-only filter, add all launchpads, request `launchpadIconUrl` |
| `src/hooks/useCodexNewPairs.ts` | Add `launchpadIconUrl` to interface |
| `src/components/launchpad/LaunchpadBadge.tsx` | New unified badge component |
| `src/components/launchpad/CodexPairRow.tsx` | Add LaunchpadBadge to bottom bar |
| `src/components/launchpad/AxiomTokenRow.tsx` | Add LaunchpadBadge to bottom bar |

