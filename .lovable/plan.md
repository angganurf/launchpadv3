

## Plan: Aster DEX Leverage Trading Page

### API Assessment

Aster DEX provides a **complete perpetual futures API** at `https://fapi.asterdex.com` with full feature parity to Hyperliquid:

| Feature | Aster Endpoint | Status |
|---------|---------------|--------|
| Market list & rules | `GET /fapi/v1/exchangeInfo` | Public |
| Candlestick data | `GET /fapi/v1/klines` | Public |
| Orderbook depth | `GET /fapi/v1/depth` | Public |
| 24h tickers | `GET /fapi/v1/ticker/24hr` | Public |
| Mark price & funding | `GET /fapi/v1/premiumIndex` | Public |
| Funding rate history | `GET /fapi/v1/fundingRate` | Public |
| Recent trades | `GET /fapi/v1/trades` | Public |
| Place order | `POST /fapi/v1/order` | Signed |
| Cancel order | `DELETE /fapi/v1/order` | Signed |
| Batch orders | `POST /fapi/v1/batchOrders` | Signed |
| Account info & positions | `GET /fapi/v4/account` | Signed |
| Position risk | `GET /fapi/v2/positionRisk` | Signed |
| Change leverage | `POST /fapi/v1/leverage` | Signed |
| Change margin type | `POST /fapi/v1/marginType` | Signed |
| Open orders | `GET /fapi/v1/openOrders` | Signed |
| Trade history | `GET /fapi/v1/userTrades` | Signed |
| Income history | `GET /fapi/v1/income` | Signed |
| WebSocket candles | `<symbol>@kline_<interval>` | Real-time |
| WebSocket orderbook | `<symbol>@depth<levels>` | Real-time |
| WebSocket trades | `<symbol>@aggTrade` | Real-time |
| WebSocket tickers | `!ticker@arr` | Real-time |
| User data stream | `POST /fapi/v1/listenKey` + WS | Real-time |

Authenticated endpoints use **HMAC-SHA256** signing with user-provided API key + secret. WebSocket base: `wss://fstream.asterdex.com`.

### Architecture

Since signing requires the user's secret key (HMAC-SHA256), we will:
- **Public data** (market info, charts, orderbook): fetched directly from the browser
- **Authenticated requests** (orders, positions, account): proxied through a backend function that holds the user's API key securely and performs HMAC signing server-side

### What Will Be Built

**Phase 1 (this implementation): Full Trading Terminal**

1. **Sidebar nav entry** -- "Leverage" with `TrendingUp` icon in `Sidebar.tsx`
2. **Route** -- `/leverage` in `App.tsx`
3. **`src/pages/LeveragePage.tsx`** -- Page shell with 3-panel terminal layout
4. **`src/hooks/useAsterMarkets.ts`** -- Fetch exchange info + 24h tickers, expose market list with search/filter
5. **`src/hooks/useAsterKlines.ts`** -- Fetch kline data for chart + WebSocket live updates via `<symbol>@kline_<interval>`
6. **`src/hooks/useAsterOrderbook.ts`** -- Fetch depth snapshot + WebSocket `<symbol>@depth10@100ms` for live orderbook
7. **`src/hooks/useAsterAccount.ts`** -- Authenticated: account balance, positions, open orders (via edge function proxy)
8. **`src/components/leverage/LeverageTerminal.tsx`** -- 3-panel layout container
9. **`src/components/leverage/LeverageChart.tsx`** -- Candlestick chart using `lightweight-charts` fed by kline data
10. **`src/components/leverage/LeverageOrderbook.tsx`** -- Bid/ask depth display with green/red bars
11. **`src/components/leverage/LeverageTradePanel.tsx`** -- Order form: Market/Limit, Long/Short, leverage slider (1-125x), size input, TP/SL
12. **`src/components/leverage/LeveragePositions.tsx`** -- Positions table with PnL, liquidation price, close button
13. **`src/components/leverage/LeverageMarketSelector.tsx`** -- Searchable pair selector
14. **`src/components/leverage/AsterApiKeyModal.tsx`** -- Modal for users to enter their Aster API key + secret (stored encrypted per-user in database)
15. **`supabase/functions/aster-trade/index.ts`** -- Edge function that proxies authenticated requests to Aster, performing HMAC-SHA256 signing server-side

### API Key Flow
- Users generate API keys on asterdex.com
- They enter key + secret in the `AsterApiKeyModal`
- Keys are stored encrypted in a `user_api_keys` database table (per-user, per-exchange)
- The `aster-trade` edge function retrieves keys and signs requests server-side
- No API keys ever leave the backend after initial storage

### Database Migration
- Create `user_api_keys` table: `id`, `user_id`, `exchange` (enum: 'aster'), `api_key` (encrypted), `api_secret` (encrypted), `label`, `permissions`, `created_at`
- RLS: users can only read/write their own keys

### Files to Create
1. `src/pages/LeveragePage.tsx`
2. `src/hooks/useAsterMarkets.ts`
3. `src/hooks/useAsterKlines.ts`
4. `src/hooks/useAsterOrderbook.ts`
5. `src/hooks/useAsterAccount.ts`
6. `src/components/leverage/LeverageTerminal.tsx`
7. `src/components/leverage/LeverageChart.tsx`
8. `src/components/leverage/LeverageOrderbook.tsx`
9. `src/components/leverage/LeverageTradePanel.tsx`
10. `src/components/leverage/LeveragePositions.tsx`
11. `src/components/leverage/LeverageMarketSelector.tsx`
12. `src/components/leverage/AsterApiKeyModal.tsx`
13. `supabase/functions/aster-trade/index.ts`

### Files to Modify
1. `src/components/layout/Sidebar.tsx` -- add Leverage nav link
2. `src/App.tsx` -- add `/leverage` route

### Implementation Note
This is a large feature. It will be built incrementally -- starting with the page shell, public market data hooks, chart, and orderbook (no auth required), then adding the trade panel and authenticated features.

