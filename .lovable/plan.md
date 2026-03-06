

## Plan: Unified Admin Panel + Fix Reclaim 401 + Announcement Manager

### Problem 1: Reclaim 401 Error

The `trading-agent-reclaim-all` edge function is **missing from `supabase/config.toml`**. Without a `[functions.trading-agent-reclaim-all]` entry with `verify_jwt = false`, the function requires a valid JWT, and the anon key bearer token fails JWT validation before the function code even runs. This is why both the hardcoded secret AND the treasury secret fail — the request is rejected at the gateway level.

**Fix:** Add `[functions.trading-agent-reclaim-all]` with `verify_jwt = false` to `supabase/config.toml`. The function already has its own admin secret auth internally.

Additionally, the reclaim function hits RPC 429 rate limits. We'll add per-agent delays and fallback to public RPC when Helius is rate-limited.

### Problem 2: Scattered Admin Pages

Currently there are **11+ separate admin pages**, each with their own password gates:

| Page | Route | Password |
|------|-------|----------|
| Treasury Admin | `/admin/treasury` | `claw2024treasury` |
| Twitter Bot | `/admin/twitter` | localStorage secret |
| X Bot | `/admin/x-bots` | `claw` |
| Agent Logs | `/admin/agent-logs` | None (open) |
| ClawBook Admin | `/admin/clawbook` | Wallet-based admin check |
| Influencer Replies | `/admin/influencer-replies` | None (open) |
| Promo Mentions | `/admin/promo-mentions` | None (open) |
| Deployer Dust | `/admin/deployer-dust` | `claw2024treasury` |
| Colosseum | `/admin/colosseum` | None (open) |
| Follower Scan | `/admin/follower-scan` | `claw` |
| Claw Admin Launch | `/claw/adminlaunch` | `claw` |
| Partner Fees | `/partnerfees` | `partner777` |

### Problem 3: Announcement Management

The `announcements` table exists and `useAnnouncements` hook shows active announcements as toasts via `LaunchpadLayout`. But there's no UI to create/edit/toggle announcements — it's all manual DB work.

---

### Changes

**1. `supabase/config.toml`** — Add missing entry:
```toml
[functions.trading-agent-reclaim-all]
verify_jwt = false
```

**2. `supabase/functions/trading-agent-reclaim-all/index.ts`** — Add 3-second delay between agents to avoid RPC 429s. Add try-catch around `getBalance` with retry logic.

**3. Create `src/pages/AdminPanelPage.tsx`** — Unified admin panel with single password gate (`claw2024treasury`) and tabs:
- **Treasury** — Fee Recovery (existing `TreasuryAdminPage` fee scanning/claiming content)
- **Agent Reclaim** — Reclaim All button + results (existing reclaim content)
- **Deployer Dust** — Deployer wallet recovery (from `DeployerDustAdminPage`)
- **Announcements** — CRUD for announcements table (new):
  - List all announcements with is_active toggle
  - Create new announcement form (title, description, emoji, action_label, action_url, expires_at)
  - Delete announcements
  - "Clear seen cache" button (clears localStorage `seen-announcements` for testing)
  - Toggle which pages show announcements (global config stored in localStorage for now)
- **X Bots** — Embedded X Bot admin (from `XBotAdminPage`)
- **Agent Logs** — Embedded agent logs (from `AgentLogsAdminPage`)  
- **Colosseum** — Embedded colosseum admin (from `ColosseumAdminPage`)
- **Base Deploy** — Existing Base deploy panel
- **ALT Setup** — Existing ALT setup panel
- **Follower Scan** — Embedded follower scan
- **Promo/Influencer** — Twitter promo + influencer reply panels

Each tab will lazy-load its content. The existing individual admin routes will redirect to `/admin?tab=<name>`.

**4. `src/hooks/useAnnouncements.ts`** — Add a check for a `announcement-disabled-pages` localStorage key. If the current pathname is in the disabled list, skip showing announcements. This gives admin control over which pages show popups.

**5. `src/App.tsx`** — Add route for `/admin` pointing to `AdminPanelPage`. Update existing admin routes to redirect to the unified panel with appropriate tab parameter.

### File Summary

| File | Action |
|------|--------|
| `supabase/config.toml` | Edit — add `trading-agent-reclaim-all` entry |
| `supabase/functions/trading-agent-reclaim-all/index.ts` | Edit — add retry/delay for RPC 429 |
| `src/pages/AdminPanelPage.tsx` | Create — unified admin panel |
| `src/components/admin/AnnouncementManager.tsx` | Create — CRUD for announcements |
| `src/hooks/useAnnouncements.ts` | Edit — add page-level toggle support |
| `src/App.tsx` | Edit — add `/admin` route, redirect old routes |

