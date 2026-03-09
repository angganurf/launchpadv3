

## Fix: Edge Function Deploy Failures Blocking Build

### Root Cause Found

The edge function logs show the **exact error**:

```
worker boot error: Uncaught SyntaxError: Identifier 'corsHeaders' has already been declared
    at file:///var/tmp/sb-compile-edge-runtime/x-bot-reply/index.ts:22:7
```

Two disabled edge functions have dead code after their stub that redeclares `corsHeaders`, causing a SyntaxError at deploy time. Deno treats the entire file as one scope (no block boundary from `/* */` comments), so both declarations collide. Edge function deploy failure blocks the entire project build.

**Affected files:**
- `supabase/functions/x-bot-reply/index.ts` — 707 lines, only lines 1-9 needed
- `supabase/functions/twitter-auto-reply/index.ts` — 819 lines, only lines 1-9 needed

(`x-bot-scan` was already fixed in a previous edit.)

### Plan

**Step 1: Truncate `x-bot-reply/index.ts`** to lines 1-9 only (the disabled stub). Delete lines 10-707.

**Step 2: Truncate `twitter-auto-reply/index.ts`** to lines 1-9 only (the disabled stub). Delete lines 10-819.

No other changes needed. These two fixes remove the deploy blockers causing the "failed to build" error.

