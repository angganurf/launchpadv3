const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedTx {
  signature: string;
  type: "send" | "receive" | "swap" | "unknown";
  timestamp: number;
  fee: number;
  status: "success" | "failed";
  description: string;
  amount?: number;
  token?: string;
  counterparty?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { walletAddress, limit = 20 } = await req.json();
    if (!walletAddress || typeof walletAddress !== "string") {
      return new Response(JSON.stringify({ error: "walletAddress required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rpcUrl = (Deno.env.get("HELIUS_RPC_URL") ?? "").trim();
    if (!rpcUrl) {
      return new Response(JSON.stringify({ error: "RPC not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract Helius API key from RPC URL for REST API
    const urlObj = new URL(rpcUrl);
    const apiKey = urlObj.searchParams.get("api-key") || urlObj.pathname.split("/").pop() || "";

    // Use Helius enhanced transactions API
    const heliusApiUrl = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=${Math.min(limit, 50)}`;

    const res = await fetch(heliusApiUrl);

    if (!res.ok) {
      // Fallback: use RPC getSignaturesForAddress
      const sigRes = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getSignaturesForAddress",
          params: [walletAddress, { limit: Math.min(limit, 50) }],
        }),
      });

      const sigJson = await sigRes.json();
      const signatures = sigJson?.result ?? [];

      const transactions: ParsedTx[] = signatures.map((sig: any) => ({
        signature: sig.signature,
        type: "unknown" as const,
        timestamp: (sig.blockTime || 0) * 1000,
        fee: 0,
        status: sig.err ? "failed" : "success",
        description: sig.memo || "Transaction",
      }));

      return new Response(JSON.stringify({ transactions }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enhancedTxs = await res.json();

    const transactions: ParsedTx[] = (enhancedTxs || []).map((tx: any) => {
      const type = inferTxType(tx, walletAddress);
      const nativeTransfers = tx.nativeTransfers || [];
      const tokenTransfers = tx.tokenTransfers || [];

      let amount: number | undefined;
      let token: string | undefined;
      let counterparty: string | undefined;

      // Parse native SOL transfers
      const solSent = nativeTransfers.find((t: any) => t.fromUserAccount === walletAddress);
      const solReceived = nativeTransfers.find((t: any) => t.toUserAccount === walletAddress);

      if (type === "send" && solSent) {
        amount = solSent.amount / 1e9;
        token = "SOL";
        counterparty = solSent.toUserAccount;
      } else if (type === "receive" && solReceived) {
        amount = solReceived.amount / 1e9;
        token = "SOL";
        counterparty = solReceived.fromUserAccount;
      } else if (tokenTransfers.length > 0) {
        const tt = tokenTransfers[0];
        amount = tt.tokenAmount;
        token = tt.mint;
        counterparty = tt.fromUserAccount === walletAddress ? tt.toUserAccount : tt.fromUserAccount;
      }

      return {
        signature: tx.signature,
        type,
        timestamp: (tx.timestamp || 0) * 1000,
        fee: (tx.fee || 0) / 1e9,
        status: tx.transactionError ? "failed" : "success",
        description: tx.description || tx.type || "Transaction",
        amount,
        token,
        counterparty,
      };
    });

    return new Response(JSON.stringify({ transactions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-wallet-transactions error:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch transactions" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function inferTxType(tx: any, wallet: string): "send" | "receive" | "swap" | "unknown" {
  const type = (tx.type || "").toUpperCase();
  if (type === "SWAP") return "swap";
  if (type === "TRANSFER") {
    const nativeTransfers = tx.nativeTransfers || [];
    const tokenTransfers = tx.tokenTransfers || [];
    const isSender =
      nativeTransfers.some((t: any) => t.fromUserAccount === wallet) ||
      tokenTransfers.some((t: any) => t.fromUserAccount === wallet);
    return isSender ? "send" : "receive";
  }
  // Check native transfers as fallback
  const nt = tx.nativeTransfers || [];
  if (nt.some((t: any) => t.fromUserAccount === wallet && t.toUserAccount !== wallet)) return "send";
  if (nt.some((t: any) => t.toUserAccount === wallet && t.fromUserAccount !== wallet)) return "receive";
  return "unknown";
}
