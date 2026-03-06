import { useCallback, useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { useAuth } from "@/hooks/useAuth";

// Get Solana RPC URL
// Priority: runtime config > VITE_HELIUS_RPC_URL > VITE_HELIUS_API_KEY > localStorage cache > PublicNode fallback
export const getRpcUrl = (): { url: string; source: string } => {
  const isValidHttpsUrl = (value?: string | null) =>
    !!value && value.startsWith("https://") && !value.includes("${");

  // Option 1: Runtime config (freshest, server-driven)
  if (typeof window !== "undefined") {
    const fromWindow = (window as any)?.__PUBLIC_CONFIG__?.heliusRpcUrl as string | undefined;
    if (isValidHttpsUrl(fromWindow)) {
      return { url: fromWindow!.trim(), source: "runtime_public_config" };
    }
  }

  // Option 2: Direct RPC URL from Vite env
  const explicitUrl = import.meta.env.VITE_HELIUS_RPC_URL;
  if (isValidHttpsUrl(explicitUrl)) {
    return { url: explicitUrl!.trim(), source: "VITE_HELIUS_RPC_URL" };
  }

  // Option 3: Build URL from API key
  const apiKey = import.meta.env.VITE_HELIUS_API_KEY;
  if (apiKey && typeof apiKey === "string" && apiKey.length > 10 && !apiKey.includes("$")) {
    const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey.trim()}`;
    return { url, source: "VITE_HELIUS_API_KEY" };
  }

  // Option 4: localStorage cache (lowest priority to avoid stale keys overriding runtime config)
  if (typeof window !== "undefined") {
    const fromStorage = localStorage.getItem("heliusRpcUrl");
    if (isValidHttpsUrl(fromStorage)) {
      return { url: fromStorage!.trim(), source: "localStorage_heliusRpcUrl" };
    }
  }

  // Fallback: PublicNode (CORS-friendly, no auth)
  return { url: "https://solana.publicnode.com", source: "publicnode_fallback" };
};

// Simple wallet hook that gets wallet from AuthContext (works without direct Privy hooks)
// NOTE: Wallet *address* must be a string; AuthContext may store a richer wallet object.
export function useSolanaWallet() {
  const { user } = useAuth();
  const { url: rpcUrl, source: rpcSource } = getRpcUrl();

  const walletAddress =
    (user as any)?.wallet?.address ??
    (typeof (user as any)?.wallet === "string" ? (user as any)?.wallet : null) ??
    null;

  const isWalletReady = !!walletAddress;

  const getConnection = useCallback(() => new Connection(rpcUrl, { commitment: "confirmed", disableRetryOnRateLimit: true }), [rpcUrl]);

  const getBalance = useCallback(async (): Promise<number> => {
    if (!walletAddress) return 0;
    try {
      const connection = getConnection();
      const { PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
      const pubkey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("[useSolanaWallet] Balance error:", error);
      return 0;
    }
  }, [walletAddress, getConnection]);

  const getBalanceStrict = useCallback(async (): Promise<number> => {
    if (!walletAddress) throw new Error("No wallet address");
    const connection = getConnection();
    const { PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  }, [walletAddress, getConnection]);

  const getTokenBalance = useCallback(async (_mintAddress: string): Promise<number> => {
    // Token balances tracked in database for bonding curve tokens
    return 0;
  }, []);

  const debug = useMemo(
    () => ({
      rpcUrl,
      rpcSource,
      privyReady: true,
      authenticated: !!user,
      walletAddress,
      walletSource: walletAddress ? "AuthContext" : "none",
      wallets: [],
      privyUserWallet: walletAddress,
      linkedAccountsCount: 0,
      linkedSolanaWallet: walletAddress,
    }),
    [rpcUrl, rpcSource, user, walletAddress]
  );

  return {
    walletAddress,
    isWalletReady,
    isConnecting: false,
    rpcUrl,
    debug,
    getConnection,
    getBalance,
    getBalanceStrict,
    getTokenBalance,
    signAndSendTransaction: async () => {
      throw new Error("Use Privy wallet for signing");
    },
    getSolanaWallet: () => null,
    getEmbeddedWallet: () => null,
  };
}

export { useSolanaWalletWithPrivy } from "./useSolanaWalletPrivy";
