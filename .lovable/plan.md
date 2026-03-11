

## Plan: Full-Page Wallet Tracker

### What
Create a dedicated `/wallet-tracker` route that renders the Wallet Tracker as a full-page experience with expanded layout, all tabs functional, and more space for data. Add an "expand" button in the existing footer popup panel that navigates to this full page.

### Changes

**1. New page: `src/pages/WalletTrackerPage.tsx`**
- Full-page layout using the app's standard structure (AppHeader + content area)
- Reuses all the same data-fetching logic and wallet management from `WalletTrackerPanel` but rendered full-width
- Larger table with more columns visible (full address, PnL, copy-trading toggle, notifications toggle)
- Tabs (All, Manager, Trades, Monitor) rendered as proper full-width tab panels
- Add wallet form always visible in a sidebar or top section
- Back button or breadcrumb to return to previous page

**2. Update `WalletTrackerPanel.tsx`**
- Add an "Expand" / fullscreen icon button (using `Maximize2` from lucide) in the header next to the tabs
- On click, navigate to `/wallet-tracker` using `useNavigate()`

**3. Update `src/App.tsx`**
- Add route: `<Route path="/wallet-tracker" element={<WalletTrackerPage />} />`
- Lazy-load the new page component

### Technical Details
- Extract shared wallet data logic (fetch, add, remove, types) into a custom hook `useWalletTracker` so both the popup panel and full page share the same code
- Full page will use `compact={false}` styling but with `width: 100%` instead of fixed 380px
- The full-page table grid expands to show: Added, Label, Full Address, Balance (SOL), Last Active, PnL, Copy Trading, Notifications, Actions

