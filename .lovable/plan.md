

## Two Features: Trade Latency Indicator + Verification Popup

### 1. Trade Latency Indicator

Add a small latency badge to both trade panels that shows milliseconds from click to transaction submission after each trade.

**Changes:**

**`src/hooks/useFastSwap.ts`** — Return the last latency value from state:
- Add `lastLatencyMs` state (number | null)
- Set it in `executeFastSwap` after `performance.now() - t0`
- Return it from the hook

**`src/components/launchpad/PulseQuickBuyButton.tsx`** — Show latency after trade:
- Read `lastLatencyMs` from `useFastSwap()`
- After a successful trade, show the latency in the success toast description: `"TX: abc123... · 642ms"`

**`src/components/launchpad/UniversalTradePanel.tsx`** — Show latency indicator:
- Add a small `lastLatencyMs` state, set it after `handleTrade` completes
- Display a subtle monospace badge below the trade button: `"⚡ 642ms"` that fades after 5 seconds
- Style: `text-[10px] font-mono text-primary/60`

### 2. Verification Popup (Link Email + X Account)

Create a modal that lets users link their email and X (Twitter) account via Privy, earning a verified badge on their profile. Styled like the reference screenshot — dark card, uppercase headers, olive/yellow CTA.

**New file: `src/components/launchpad/VerifyAccountModal.tsx`**
- Dialog with header "ADD CELEBRITY LINKS" (or "VERIFY YOUR ACCOUNT")
- Description text explaining the benefit (trust badge, verified status)
- **Link X Account** button — calls `usePrivy().linkTwitter()`
- **Link Email** button — calls `usePrivy().linkEmail()`
- Shows current linked status (checkmark if already linked)
- "I'M A CELEBRITY AND I WANT TO CONNECT MY TWITTER" bold text section
- "ADD LINKS" CTA button (olive/yellow bg matching reference)
- Terms text at bottom
- On successful link, update `profiles.verified_type` to `'blue'` via a backend call

**Database migration:**
- Ensure `profiles.verified_type` column exists (it already does based on existing code)
- No new tables needed

**Integration points:**
- Add a "Verify Account" button in `UserProfilePage.tsx` (when viewing own profile)
- Add the modal trigger in the header dropdown / settings area
- When X is linked, show the X verified badge (VerifiedBadge component) on the user's profile page using the existing `verified_type` field

**`src/pages/UserProfilePage.tsx`** — Show VerifiedBadge properly:
- Replace the generic `CheckCircle` icon with the existing `VerifiedBadge` component
- Add "Verify Account" button when the logged-in user views their own profile

### Files Summary

| File | Action |
|------|--------|
| `src/hooks/useFastSwap.ts` | Edit — add `lastLatencyMs` state + return |
| `src/components/launchpad/PulseQuickBuyButton.tsx` | Edit — show latency in success toast |
| `src/components/launchpad/UniversalTradePanel.tsx` | Edit — show latency badge after trade |
| `src/components/launchpad/VerifyAccountModal.tsx` | Create — email + X verification popup |
| `src/pages/UserProfilePage.tsx` | Edit — add verify button + proper VerifiedBadge |

