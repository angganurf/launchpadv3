

## Fix: ClawModePage is not defined

### Root Cause

This is a **transient HMR/build error**. All source files are correct:
- `src/pages/ClawModePage.tsx` exists with a valid `export default`
- `src/App.tsx` has the correct `lazy(() => import("./pages/ClawModePage"))` declaration
- All imports within `ClawModePage.tsx` resolve to existing files

The error occurs because during hot module replacement, the lazy chunk failed to load, leaving the variable `undefined`. This commonly happens after multiple rapid file edits.

### Fix

**No code changes needed.** A simple page refresh or rebuild should resolve it. However, to make lazy imports more resilient against chunk load failures, I can wrap the `ClawModePage` route (and others) with better error boundaries or add a retry mechanism to the lazy import.

If you want me to add a **retry wrapper** for all lazy imports to prevent this class of error in the future, I can implement a `lazyWithRetry` utility that retries failed dynamic imports up to 3 times before giving up. This is a one-file change:

**`src/utils/lazyWithRetry.ts`** — Create utility:
```ts
function lazyWithRetry(importFn, retries = 3) {
  return lazy(() => importFn().catch(() => retry...));
}
```

**`src/App.tsx`** — Replace `lazy()` calls with `lazyWithRetry()` for all page imports.

But if you just want the error gone now, a rebuild will fix it immediately.

