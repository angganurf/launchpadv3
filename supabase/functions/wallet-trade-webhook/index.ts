import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WSOL_MINT = "So11111111111111111111111111111111111111112";

interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  mint: string;
  tokenAmount: number;
  tokenStandard?: string;
}

interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number; // in lamports
}

interface HeliusEnrichedTx {
  signature: string;
  slot?: number;
  type?: string;
  description?: string;
  feePayer?: string;
  nativeTransfers?: HeliusNativeTransfer[];
  tokenTransfers?: HeliusTokenTransfer[];
  events?: {
    swap?: {
      nativeInput?: { account: string; amount: string };
      nativeOutput?: { account: string; amount: string };
      tokenInputs?: { mint: string; tokenAmount: number; userAccount: string }[];
      tokenOutputs?: { mint: string; tokenAmount: number; userAccount: string }[];
    };
  };
  accountData?: { account: string; nativeBalanceChange: number }[];
}

/**
 * Parse a Helius enriched transaction into trade data.
 * Returns null if we can't extract meaningful swap info.
 */
function parseTrade(tx: HeliusEnrichedTx, trackedAddresses: Set<string>) {
  const swap = tx.events?.swap;
  if (!swap) return null;

  // Determine the wallet that is tracked
  const allAccounts = new Set<string>();
  if (swap.nativeInput?.account) allAccounts.add(swap.nativeInput.account);
  if (swap.nativeOutput?.account) allAccounts.add(swap.nativeOutput.account);
  swap.tokenInputs?.forEach((t) => allAccounts.add(t.userAccount));
  swap.tokenOutputs?.forEach((t) => allAccounts.add(t.userAccount));

  let walletAddress: string | null = null;
  for (const addr of allAccounts) {
    if (trackedAddresses.has(addr)) {
      walletAddress = addr;
      break;
    }
  }
  // Fallback: check feePayer
  if (!walletAddress && tx.feePayer && trackedAddresses.has(tx.feePayer)) {
    walletAddress = tx.feePayer;
  }
  if (!walletAddress) return null;

  // Determine trade type + amounts
  let solAmount = 0;
  let tokenAmount = 0;
  let tokenMint = "";
  let tradeType: "buy" | "sell" = "buy";

  const nativeIn = swap.nativeInput ? Number(swap.nativeInput.amount) / 1e9 : 0;
  const nativeOut = swap.nativeOutput ? Number(swap.nativeOutput.amount) / 1e9 : 0;

  const tokenInputs = (swap.tokenInputs || []).filter((t) => t.mint !== WSOL_MINT);
  const tokenOutputs = (swap.tokenOutputs || []).filter((t) => t.mint !== WSOL_MINT);

  if (nativeIn > 0 && tokenOutputs.length > 0) {
    // SOL in, token out → BUY
    tradeType = "buy";
    solAmount = nativeIn;
    tokenAmount = tokenOutputs[0].tokenAmount;
    tokenMint = tokenOutputs[0].mint;
  } else if (nativeOut > 0 && tokenInputs.length > 0) {
    // Token in, SOL out → SELL
    tradeType = "sell";
    solAmount = nativeOut;
    tokenAmount = tokenInputs[0].tokenAmount;
    tokenMint = tokenInputs[0].mint;
  } else if (tokenInputs.length > 0 && tokenOutputs.length > 0) {
    // Token-to-token swap — pick the output as the "bought" token
    tradeType = "buy";
    tokenMint = tokenOutputs[0].mint;
    tokenAmount = tokenOutputs[0].tokenAmount;
    solAmount = 0;
  } else {
    return null;
  }

  if (!tokenMint) return null;

  const pricePerToken = tokenAmount > 0 && solAmount > 0 ? solAmount / tokenAmount : 0;

  return {
    signature: tx.signature,
    slot: tx.slot ?? null,
    wallet_address: walletAddress,
    trade_type: tradeType,
    token_mint: tokenMint,
    sol_amount: solAmount,
    token_amount: tokenAmount,
    price_per_token: pricePerToken,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate webhook secret
  const webhookSecret = Deno.env.get("HELIUS_WEBHOOK_SECRET");
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.error("Webhook auth failed");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const body = await req.json();
    const transactions: HeliusEnrichedTx[] = Array.isArray(body) ? body : [body];

    if (transactions.length === 0) {
      return new Response(JSON.stringify({ ok: true, inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all tracked wallet addresses for lookup
    const { data: trackedRows } = await supabase
      .from("tracked_wallets")
      .select("id, wallet_address");

    const addrToId = new Map<string, string>();
    const trackedAddresses = new Set<string>();
    for (const row of trackedRows || []) {
      addrToId.set(row.wallet_address, row.id);
      trackedAddresses.add(row.wallet_address);
    }

    const inserts: any[] = [];

    for (const tx of transactions) {
      const trade = parseTrade(tx, trackedAddresses);
      if (!trade) continue;

      // Deduplicate by signature
      inserts.push({
        ...trade,
        tracked_wallet_id: addrToId.get(trade.wallet_address) || null,
      });
    }

    let insertedCount = 0;
    if (inserts.length > 0) {
      // Use upsert on signature to avoid duplicates
      const { data, error } = await supabase
        .from("wallet_trades")
        .upsert(inserts, { onConflict: "signature", ignoreDuplicates: true });

      if (error) {
        console.error("Insert error:", error.message);
      } else {
        insertedCount = inserts.length;
      }
    }

    console.log(`Processed ${transactions.length} txs, inserted ${insertedCount} trades`);

    return new Response(JSON.stringify({ ok: true, inserted: insertedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("wallet-trade-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200, // Return 200 so Helius doesn't retry
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
