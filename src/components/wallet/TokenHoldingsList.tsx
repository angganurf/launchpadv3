import { useState } from "react";
import { useWalletHoldings, TokenHolding } from "@/hooks/useWalletHoldings";
import { useTokenMetadata, TokenMetadata } from "@/hooks/useTokenMetadata";
import { ExternalLink, Copy, ArrowUpRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface TokenHoldingsListProps {
  walletAddress: string | null;
  solBalance: number | null;
  onSendToken?: (mint: string, symbol: string, balance: number, decimals: number) => void;
}

export default function TokenHoldingsList({ walletAddress, solBalance, onSendToken }: TokenHoldingsListProps) {
  const { data: holdings = [], isLoading } = useWalletHoldings(walletAddress);
  const [search, setSearch] = useState("");
  const [expandedMint, setExpandedMint] = useState<string | null>(null);

  const mints = holdings.map((h) => h.mint);
  const { data: metadata = {} } = useTokenMetadata(mints);

  const filtered = holdings.filter((h) => {
    if (!search) return true;
    const m = metadata[h.mint];
    const q = search.toLowerCase();
    return (
      h.mint.toLowerCase().includes(q) ||
      m?.name?.toLowerCase().includes(q) ||
      m?.symbol?.toLowerCase().includes(q)
    );
  });

  const copyMint = (mint: string) => {
    navigator.clipboard.writeText(mint);
    toast({ title: "Copied", description: "Mint address copied" });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search tokens…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs bg-card border-border/50"
        />
      </div>

      {/* SOL row */}
      {solBalance !== null && (
        <button
          onClick={() => onSendToken?.("SOL", "SOL", solBalance, 9)}
          className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-accent/10 border border-border/30 bg-card/50"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            SOL
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground">Solana</p>
            <p className="text-[11px] text-muted-foreground font-mono">SOL</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground font-mono">{solBalance.toFixed(4)}</p>
          </div>
        </button>
      )}

      {/* Token rows */}
      {filtered.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground text-center py-6">No tokens found</p>
      )}

      {filtered.map((h) => {
        const m: TokenMetadata | undefined = metadata[h.mint];
        const isExpanded = expandedMint === h.mint;

        return (
          <div key={h.mint} className="border border-border/30 rounded-xl bg-card/50 overflow-hidden">
            <button
              onClick={() => setExpandedMint(isExpanded ? null : h.mint)}
              className="w-full flex items-center gap-3 p-3 transition-colors hover:bg-accent/10"
            >
              {m?.image ? (
                <img src={m.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 bg-muted" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {(m?.symbol || "?").slice(0, 3)}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">{m?.name || h.mint.slice(0, 8)}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{m?.symbol || "???"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground font-mono">
                  {h.balance < 0.0001 ? h.balance.toExponential(2) : h.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </p>
              </div>
            </button>

            {/* Expanded actions */}
            {isExpanded && (
              <div className="px-3 pb-3 flex items-center gap-2 border-t border-border/20 pt-2">
                <button
                  onClick={() => copyMint(h.mint)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/10"
                >
                  <Copy className="h-3 w-3" /> Copy Mint
                </button>
                <a
                  href={`https://solscan.io/token/${h.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/10"
                >
                  <ExternalLink className="h-3 w-3" /> Solscan
                </a>
                <button
                  onClick={() => onSendToken?.(h.mint, m?.symbol || "???", h.balance, h.decimals)}
                  className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10 ml-auto"
                >
                  <ArrowUpRight className="h-3 w-3" /> Send
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
