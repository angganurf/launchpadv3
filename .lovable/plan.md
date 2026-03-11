
Goal: fix the mobile layout issues you listed and make X Tracker actually populate data with visible failure logs.

What I found already (current backend logs/state)
- Users/KOL data state:
  - `kol_accounts`: 108 rows
  - `kol_contract_tweets`: 0 rows
  - `last_scanned_at` is updating (oldest recent ~14:50 UTC, newest ~15:05 UTC), so scanner is running.
  - `last_scanned_tweet_id` is null for all 108 accounts.
- Scheduler state:
  - Cron job `scan-kol-tweets-every-5min` is active and succeeds every 5 minutes.
- Function logs:
  - `scan-kol-tweets` shows boot/shutdown but no useful per-run diagnostics.
  - No useful network-level result payload logged for this function.
- Likely root cause:
  - Scanner executes, but tweet parsing likely misses the provider response structure (so it sees “no tweets” and never inserts).
  - Evidence: scans run, but no tweet IDs are ever persisted and inserts stay at 0.

Implementation plan

1) Mobile UI fixes on Home page
A) Trading Agents cards (Conservative / Balanced / Aggressive)
- File: `src/components/home/TradingAgentsShowcase.tsx`
- Increase spacing between agent name and strategy badge/risk row.
- Prevent cramped wrap by:
  - adding slightly larger vertical gap in header text stack
  - allowing better badge wrapping behavior on narrow widths
  - tuning text sizes for mobile only

B) “New Pairs / Final Stretch / Migrated” in one line/box on mobile
- File: `src/pages/HomePage.tsx` (Live Pulse section)
- Replace current mobile stacked columns with a single horizontal row container:
  - one boxed row with three mini-columns/panels
  - horizontal scroll if needed instead of stacking
- Keep desktop/tablet 3-column layout unchanged.

C) Remove duplicate “Just Launched” title on mobile
- Files: `src/pages/HomePage.tsx`, `src/components/launchpad/JustLaunched.tsx`
- Keep the outer section header (“Just Launched” + “View All”).
- Hide/remove inner “Just Launched — Last 24 Hours” header on mobile (or fully remove if only used here).

D) King of the Hill cards in one line on mobile
- File: `src/components/launchpad/KingOfTheHill.tsx`
- Change mobile cards container from vertical stack to single-row horizontal layout (boxed row).
- Keep desktop as current multi-card row behavior.

2) X Tracker fix (data ingestion + observability)
A) Harden scanner parsing
- File: `supabase/functions/scan-kol-tweets/index.ts`
- Add robust extraction helpers for provider response variants:
  - tweets source fallback chain (e.g. `data.data.tweets`, `data.tweets`, `data.data`, etc.)
  - tweet id extraction fallback (`id`, `id_str`, `rest_id`, etc.)
  - text extraction fallback (`text`, `full_text`, nested note/legacy fields)
- Add `count` query param when requesting last tweets.
- Keep dedupe logic but dedupe per (tweet_id, contract_address) before insert attempts.

B) Improve scan result diagnostics
- Same function file:
  - Capture per-account outcome counters:
    - fetched tweets
    - tweets parsed
    - CAs detected
    - inserted
    - parse failures
    - API HTTP failures
  - Return structured debug payload on completion (and for manual trigger).

C) Persist scan logs so failure reason is visible
- New migration:
  - create `kol_scan_runs` (run-level summary)
  - create `kol_scan_errors` (per-account/per-run error lines)
  - add indexes on `created_at`, `run_id`
  - RLS:
    - read allowed for authenticated (or public if you want logs visible without login)
    - insert only via service-role function path
- Function writes one run record + detailed error entries each execution.

D) Show logs in X Tracker UI
- Files: `src/hooks/useKolTweets.ts`, `src/pages/XTrackerPage.tsx` (plus small new hook if cleaner)
- Add scanner status panel above tweet grid:
  - last run time
  - accounts scanned
  - tweets parsed
  - inserts
  - last error summary
- Show explicit error state instead of silent “No tweets found yet” when backend fetch fails.

3) Validation plan (what I’ll test after implementation)
- Mobile (390px width):
  - Trading Agents labels no longer cramped
  - Live Pulse three boxes appear in one row container
  - Just Launched title appears once
  - King of the Hill cards are one horizontal row, not stacked
- X Tracker:
  - trigger scanner manually once
  - confirm `kol_scan_runs` receives a new row with counters
  - confirm either tweets appear or clear parse/API errors are visible in X Tracker status panel
  - confirm no silent failure state

Technical details (for implementation)
- Frontend files to edit:
  - `src/components/home/TradingAgentsShowcase.tsx`
  - `src/pages/HomePage.tsx`
  - `src/components/launchpad/JustLaunched.tsx`
  - `src/components/launchpad/KingOfTheHill.tsx`
  - `src/pages/XTrackerPage.tsx`
  - (optional) new hook `src/hooks/useKolScanStatus.ts`
- Backend files to edit:
  - `supabase/functions/scan-kol-tweets/index.ts`
  - new migration for `kol_scan_runs` + `kol_scan_errors` + RLS policies

Assumptions I’m using
- “one line / one box” means horizontal single-row presentation on mobile (with horizontal scroll if needed), not reducing content density by hiding sections.
- You want actionable X Tracker failure visibility directly in-app (not only backend console logs).
