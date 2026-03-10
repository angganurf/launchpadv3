const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache for token metadata (persists across warm invocations)
const metadataCache = new Map<string, { name: string; symbol: string; image: string; decimals: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { mints } = await req.json();
    if (!Array.isArray(mints) || mints.length === 0) {
      return new Response(JSON.stringify({ error: "mints array required" }), {
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

    // Check cache first
    const results: Record<string, { name: string; symbol: string; image: string; decimals: number }> = {};
    const uncachedMints: string[] = [];

    for (const mint of mints) {
      const cached = metadataCache.get(mint);
      if (cached) {
        results[mint] = cached;
      } else {
        uncachedMints.push(mint);
      }
    }

    // Fetch uncached mints via Helius DAS API in batches of 100
    if (uncachedMints.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < uncachedMints.length; i += batchSize) {
        const batch = uncachedMints.slice(i, i + batchSize);

        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "metadata-batch",
            method: "getAssetBatch",
            params: { ids: batch },
          }),
        });

        if (!res.ok) {
          console.error("Helius DAS error:", await res.text());
          continue;
        }

        const json = await res.json();
        const assets = json?.result ?? [];

        for (const asset of assets) {
          if (!asset?.id) continue;
          const content = asset.content ?? {};
          const metadata = content.metadata ?? {};
          const links = content.links ?? {};
          const fungible = asset.token_info ?? {};

          const entry = {
            name: metadata.name || asset.id.slice(0, 8),
            symbol: metadata.symbol || "???",
            image: links.image || content.json_uri || "",
            decimals: fungible.decimals ?? metadata.decimals ?? 0,
          };

          results[asset.id] = entry;
          metadataCache.set(asset.id, entry);
        }
      }
    }

    // Fill any still-missing mints with defaults
    for (const mint of mints) {
      if (!results[mint]) {
        results[mint] = {
          name: mint.slice(0, 6) + "…",
          symbol: "???",
          image: "",
          decimals: 0,
        };
      }
    }

    return new Response(JSON.stringify({ metadata: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-token-metadata error:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch metadata" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
