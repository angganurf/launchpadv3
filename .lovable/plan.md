

## Problem

When BNB Chain is selected, the header wallet button still shows the Solana embedded address. This happens because:

1. **Privy creates embedded EVM wallets** (`createOnLogin: "all-users"` for ethereum) — but the header doesn't read them.
2. **`useEvmWallet`** uses wagmi/RainbowKit, which only tracks *externally connected* wallets (MetaMask, etc.), not Privy's embedded EVM wallet.
3. So `evmWallet.address` is `undefined` for existing users who haven't manually connected MetaMask, and it falls back to the Solana address.

## Solution

Create a hook that reads the **Privy embedded EVM wallet** address using `useWallets()` from `@privy-io/react-auth` (which returns both Solana and EVM wallets), and use it in the header when BNB chain is selected.

### Changes

1. **New hook: `src/hooks/usePrivyEvmWallet.ts`**
   - Import `useWallets` from `@privy-io/react-auth` (not the solana-specific one)
   - Find the embedded Ethereum wallet (walletClientType === "privy" and chainType includes "ethereum" or address starts with "0x")
   - Expose `address`, `isReady`
   - If no embedded EVM wallet exists for an existing user, call `useCreateWallet` from `@privy-io/react-auth` to force creation

2. **Update `src/components/layout/HeaderWalletBalance.tsx`**
   - Import the new `usePrivyEvmWallet` hook
   - When `chain === 'bnb'`, prefer the Privy embedded EVM address over `evmWallet.address`
   - For BNB balance fetching, use the Privy EVM address
   - Keep wagmi/RainbowKit `useEvmWallet` as fallback for externally connected wallets

3. **Update `src/hooks/useAuth.ts`**
   - Add `evmAddress` field to `UseAuthReturn` by finding the EVM wallet from the `useWallets()` results (which already imports from `@privy-io/react-auth`)

### Key technical detail

`useWallets` from `@privy-io/react-auth` returns all wallet types. EVM embedded wallets have:
- `walletClientType === "privy"` 
- `chainType === "ethereum"`
- Address starts with `0x`

This distinguishes them from the Solana embedded wallet which has `chainType === "solana"`.

