import { useState } from "react";
import { useCodexTokenEvents } from "@/hooks/useCodexTokenEvents";
import { useTokenHolders } from "@/hooks/useTokenHolders";
import { CodexTokenTrades } from "./CodexTokenTrades";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  tokenAddress: string;
  holderCount?: number;
  userWallet?: string;
}

type TabKey = "all_trades" | "your_trades" | "holders";

/** Generate a deterministic gradient for an address */
function addrGradient(addr: string): string {
  if (!addr) return 'linear-gradient(135deg, #333, #555)';
  const h1 = (addr.charCodeAt(0) * 37 + addr.charCodeAt(1) * 13) % 360;
  const h2 = (h1 + 40 + (addr.charCodeAt(2) * 7) % 80) % 360;
  return `linear-gradient(135deg, hsl(${h1},60%,45%), hsl(${h2},50%,35%))`;
}

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function TokenDataTabs({ tokenAddress, holderCount = 0, userWallet }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("all_trades");
  const { data, isLoading } = useCodexTokenEvents(tokenAddress);
  const { data: holdersData, isLoading: holdersLoading } = useTokenHolders(
    tokenAddress,
    activeTab === "holders"
  );

  const liveHolderCount = holdersData?.count ?? holderCount;

  // Filter trades for YOUR TRADES tab
  const userTrades = userWallet
    ? (data?.events || []).filter(e => e.maker.toLowerCase() === userWallet.toLowerCase())
    : [];

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "all_trades", label: "ALL TRADES", count: data?.events?.length },
    { key: "your_trades", label: "YOUR TRADES", count: userTrades.length },
    { key: "holders", label: "HOLDERS", count: liveHolderCount },
  ];

  return (
    <div className="terminal-panel-flush rounded-lg overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-white/[0.06] px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === tab.key
                ? "text-foreground"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 text-[9px] text-muted-foreground/40">({tab.count})</span>
            )}
            {activeTab === tab.key && (
              <span
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{ backgroundColor: '#c8ff00' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "all_trades" && (
          <CodexTokenTrades events={data?.events || []} isLoading={isLoading} />
        )}
        {activeTab === "your_trades" && (
          <CodexTokenTrades events={userTrades} isLoading={isLoading} />
        )}
        {activeTab === "holders" && (
          <div>
            {holdersLoading && !holdersData ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : holdersData?.holders && holdersData.holders.length > 0 ? (
              <ScrollArea className="h-[420px]">
                <table className="w-full text-xs font-mono">
                  <thead className="sticky top-0 z-10" style={{ backgroundColor: '#0d0d0d' }}>
                    <tr className="text-muted-foreground/50 uppercase tracking-wider text-[10px]">
                      <th className="text-left py-2.5 px-3 font-medium">#</th>
                      <th className="text-left py-2.5 px-2 font-medium">Holder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdersData.holders.map((addr, i) => (
                      <tr
                        key={addr}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                        style={{ height: '48px' }}
                      >
                        <td className="py-2 px-3 text-muted-foreground/40 text-[11px]">{i + 1}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-7 w-7 rounded-full shrink-0"
                              style={{ background: addrGradient(addr) }}
                            />
                            <a
                              href={`https://solscan.io/account/${addr}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground/70 text-[11px] hover:text-foreground underline underline-offset-2 transition-colors"
                            >
                              {truncateAddr(addr)}
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <p className="text-2xl font-mono font-bold text-foreground">{liveHolderCount.toLocaleString()}</p>
                <p className="text-xs font-mono text-muted-foreground/60">Total Holders</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
