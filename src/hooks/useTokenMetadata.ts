import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TokenMetadata {
  name: string;
  symbol: string;
  image: string;
  decimals: number;
}

export function useTokenMetadata(mints: string[]) {
  return useQuery<Record<string, TokenMetadata>>({
    queryKey: ["token-metadata", mints.sort().join(",")],
    enabled: mints.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min — metadata rarely changes
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-token-metadata", {
        body: { mints },
      });
      if (error) throw error;
      return (data?.metadata ?? {}) as Record<string, TokenMetadata>;
    },
  });
}
