import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
} from "https://esm.sh/viem@2.45.1";
import { bsc } from "https://esm.sh/viem@2.45.1/chains";
import { privateKeyToAccount } from "https://esm.sh/viem@2.45.1/accounts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PORTAL_ABI = [
  {
    name: "buy",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_token", type: "address" }],
    outputs: [],
  },
  {
    name: "sell",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_token", type: "address" },
      { name: "_tokenAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getTokenInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_token", type: "address" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "creatorFeeBps", type: "uint256" },
      { name: "realBnb", type: "uint256" },
      { name: "realTokens", type: "uint256" },
      { name: "bondingProgress", type: "uint256" },
      { name: "graduated", type: "bool" },
      { name: "totalFeesCollected", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
  },
  {
    name: "getPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_token", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

interface SwapRequest {
  tokenAddress: string;
  action: "buy" | "sell";
  amount: string; // BNB amount for buy, token amount for sell
  userWallet: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SwapRequest = await req.json();

    if (!body.tokenAddress || !body.action || !body.amount || !body.userWallet) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const portalAddress = Deno.env.get("BNB_PORTAL_ADDRESS");
    if (!portalAddress) {
      return new Response(
        JSON.stringify({ error: "Portal not deployed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deployerKey = Deno.env.get("BASE_DEPLOYER_PRIVATE_KEY");
    if (!deployerKey) {
      return new Response(
        JSON.stringify({ error: "Deployer key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const account = privateKeyToAccount(
      (deployerKey.startsWith("0x") ? deployerKey : `0x${deployerKey}`) as `0x${string}`
    );

    const BSC_RPC = "https://bsc-dataseed.binance.org";
    const publicClient = createPublicClient({ chain: bsc, transport: http(BSC_RPC) });
    const walletClient = createWalletClient({ account, chain: bsc, transport: http(BSC_RPC) });

    // Get current token info before trade
    const tokenInfo = await publicClient.readContract({
      address: portalAddress as `0x${string}`,
      abi: PORTAL_ABI,
      functionName: "getTokenInfo",
      args: [body.tokenAddress as `0x${string}`],
    });

    const [, , , , , graduated] = tokenInfo;
    if (graduated) {
      return new Response(
        JSON.stringify({
          error: "Token has graduated. Trade on PancakeSwap instead.",
          graduated: true,
          pancakeswapUrl: `https://pancakeswap.finance/swap?outputCurrency=${body.tokenAddress}&chainId=56`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let txHash: string;

    if (body.action === "buy") {
      const bnbAmount = parseEther(body.amount);
      
      // Check deployer balance
      const balance = await publicClient.getBalance({ address: account.address });
      if (balance < bnbAmount + parseEther("0.002")) {
        return new Response(
          JSON.stringify({ error: `Insufficient BNB. Balance: ${formatEther(balance)}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      txHash = await walletClient.writeContract({
        address: portalAddress as `0x${string}`,
        abi: PORTAL_ABI,
        functionName: "buy",
        args: [body.tokenAddress as `0x${string}`],
        value: bnbAmount,
      });
    } else {
      // Sell
      const tokenAmount = parseEther(body.amount);

      txHash = await walletClient.writeContract({
        address: portalAddress as `0x${string}`,
        abi: PORTAL_ABI,
        functionName: "sell",
        args: [body.tokenAddress as `0x${string}`, tokenAmount],
      });
    }

    console.log(`[BNB Swap] ${body.action} tx: ${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
      timeout: 30_000,
    });

    // Get updated token info
    const updatedInfo = await publicClient.readContract({
      address: portalAddress as `0x${string}`,
      abi: PORTAL_ABI,
      functionName: "getTokenInfo",
      args: [body.tokenAddress as `0x${string}`],
    });

    const [, , realBnb, realTokens, bondingProgress, isGraduated, totalFees, price] = updatedInfo;

    return new Response(
      JSON.stringify({
        success: true,
        txHash,
        action: body.action,
        tokenAddress: body.tokenAddress,
        explorerUrl: `https://bscscan.com/tx/${txHash}`,
        tokenState: {
          realBnb: formatEther(realBnb),
          realTokens: formatEther(realTokens),
          bondingProgress: Number(bondingProgress) / 100, // Convert bps to %
          graduated: isGraduated,
          price: formatEther(price),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[BNB Swap] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Swap failed",
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
