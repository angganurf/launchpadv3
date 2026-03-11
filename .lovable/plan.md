

## Plan: BNB Price Display & Balance When BNB Chain Selected

### Problem
When BNB chain is selected, the header still shows SOL price and SOL embedded wallet balance instead of BNB equivalents.

### Changes

**1. Create BNB price edge function** (`supabase/functions/bnb-price/index.ts`)
- Clone the `base-eth-price` pattern but fetch BNB price from CoinGecko (`ids=binancecoin`) with Binance API fallback (`BNBUSDT`)
- Returns `{ price, change24h }`

**2. Create `BnbPriceDisplay` component** (`src/components/layout/BnbPriceDisplay.tsx`)
- Same structure as `EthPriceDisplay` but calls `bnb-price` edge function
- Uses BNB logo SVG (yellow circle) instead of ETH logo
- Separate localStorage cache key `bnb_price_display_cache`

**3. Update `AppHeader.tsx` price switching** (line ~99)
- Change from `chain === 'base' ? <EthPriceDisplay /> : <SolPriceDisplay />` to a 3-way switch:
  - `solana` → `SolPriceDisplay`
  - `base` → `EthPriceDisplay`  
  - `bnb` → `BnbPriceDisplay`

**4. Update `HeaderWalletBalance.tsx` for BNB balance**
- Import `useChain` to detect active chain
- When chain is `bnb`:
  - Fetch BNB balance using the BSC RPC (`https://bsc-dataseed.binance.org`) via `eth_getBalance` JSON-RPC call on the embedded wallet address
  - Display balance as `X.XXX BNB` instead of `X.XXX SOL`
  - Update copy toast to say "Send BNB to this address" instead of "Send SOL"
- When chain is `solana`: keep existing SOL balance logic

### Technical Notes
- The Privy embedded wallet address is a Solana address. For BNB chain balance, we'd need the user's EVM wallet address. Since Privy can provision both Solana and EVM embedded wallets, we'll need to access the EVM embedded wallet when BNB is selected.
- If no EVM wallet exists yet, the balance section will show the Solana wallet info with a note, or we check if Privy's `useWallets` hook provides an EVM wallet.

