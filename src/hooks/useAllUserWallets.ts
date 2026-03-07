import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrivyAvailable } from "@/providers/PrivyProviderWrapper";

/**
 * Returns all wallet addresses the current user controls
 * (embedded Privy wallets + any externally connected wallets).
 * Used to match "YOUR TRADES" against on-chain trade makers.
 */
export function useAllUserWallets(): string[] {
  const privyAvailable = usePrivyAvailable();
  const { solanaAddress } = useAuth();

  // Try to get wallets from Privy if available
  let allAddresses: string[] = [];

  if (privyAvailable) {
    try {
      // Dynamic import avoided — use useAuth's solanaAddress as baseline
      // and import useWallets inline
      const { useWallets } = require("@privy-io/react-auth");
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { wallets } = useWallets();
      allAddresses = (wallets || [])
        .map((w: any) => w?.address)
        .filter((a: any): a is string => typeof a === "string" && a.length > 20);
    } catch {
      // Privy not loaded — fall back to solanaAddress only
    }
  }

  return useMemo(() => {
    const set = new Set<string>();
    if (solanaAddress) set.add(solanaAddress);
    allAddresses.forEach((a) => set.add(a));
    return Array.from(set);
  }, [solanaAddress, allAddresses.join(",")]);
}
