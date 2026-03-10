import { useState, lazy, Suspense, useEffect } from "react";
import { useSolanaWalletWithPrivy } from "@/hooks/useSolanaWalletPrivy";
import { useExportWallet } from "@privy-io/react-auth/solana";
import { ArrowUpRight, ArrowDownLeft, Repeat, Key, Copy, QrCode, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import TokenHoldingsList from "./TokenHoldingsList";
import WalletTransactionHistory from "./WalletTransactionHistory";

const SendTokenModal = lazy(() => import("./SendTokenModal"));
const SwapModal = lazy(() => import("./SwapModal"));
const ReceiveDialog = lazy(() => import("./ReceiveDialog"));

export default function PanelWalletTab() {
  const { walletAddress, isWalletReady, getBalance } = useSolanaWalletWithPrivy();
  const { exportWallet } = useExportWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"tokens" | "activity">("tokens");

  // Modals
  const [sendOpen, setSendOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendPreset, setSendPreset] = useState<{ mint: string; symbol: string; balance: number; decimals: number }>({
    mint: "SOL", symbol: "SOL", balance: 0, decimals: 9,
  });

  // Fetch balance
  useEffect(() => {
    if (!isWalletReady) return;
    let cancelled = false;
    const fetchBal = async () => {
      try {
        const bal = await getBalance();
        if (!cancelled) setSolBalance(bal);
      } catch { /* ignore */ }
    };
    fetchBal();
    const interval = setInterval(fetchBal, 15_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isWalletReady, getBalance]);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    toast({ title: "Copied", description: "Wallet address copied" });
  };

  const handleSendToken = (mint: string, symbol: string, balance: number, decimals: number) => {
    setSendPreset({ mint, symbol, balance, decimals });
    setSendOpen(true);
  };

  const handleExportKey = async () => {
    try {
      await exportWallet({ address: walletAddress || undefined });
    } catch (e: any) {
      toast({ title: "Export failed", description: e?.message, variant: "destructive" });
    }
  };

  if (!isWalletReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Wallet className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading wallet…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Hero Balance Card */}
      <div
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.6) 100%)",
          border: "1px solid hsl(var(--border) / 0.4)",
        }}
      >
        {/* Background accent glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary)), transparent 70%)" }}
        />

        <p className="text-[11px] text-muted-foreground font-medium mb-1 relative z-10">TOTAL BALANCE</p>
        <h2 className="text-4xl font-bold text-foreground font-mono relative z-10 tracking-tight">
          {solBalance !== null ? solBalance.toFixed(4) : "—"}
          <span className="text-lg text-muted-foreground ml-2">SOL</span>
        </h2>

        {/* Address pill */}
        <button
          onClick={copyAddress}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors text-[11px] font-mono text-muted-foreground hover:text-foreground relative z-10"
        >
          {walletAddress?.slice(0, 6)}…{walletAddress?.slice(-4)}
          <Copy className="h-3 w-3" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <ActionButton icon={<ArrowUpRight className="h-4 w-4" />} label="Send" onClick={() => { setSendPreset({ mint: "SOL", symbol: "SOL", balance: solBalance || 0, decimals: 9 }); setSendOpen(true); }} />
        <ActionButton icon={<ArrowDownLeft className="h-4 w-4" />} label="Receive" onClick={() => setReceiveOpen(true)} />
        <ActionButton icon={<Repeat className="h-4 w-4" />} label="Swap" onClick={() => setSwapOpen(true)} />
        <ActionButton icon={<Key className="h-4 w-4" />} label="Export" onClick={handleExportKey} />
      </div>

      {/* Tokens / Activity tabs */}
      <div className="flex gap-1 p-0.5 rounded-xl bg-muted/30 border border-border/30">
        <button
          onClick={() => setActiveTab("tokens")}
          className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${activeTab === "tokens" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Tokens
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${activeTab === "activity" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Activity
        </button>
      </div>

      {activeTab === "tokens" ? (
        <TokenHoldingsList walletAddress={walletAddress} solBalance={solBalance} onSendToken={handleSendToken} />
      ) : (
        <WalletTransactionHistory walletAddress={walletAddress} />
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        {sendOpen && (
          <SendTokenModal
            open={sendOpen}
            onOpenChange={setSendOpen}
            preselectedMint={sendPreset.mint}
            preselectedSymbol={sendPreset.symbol}
            preselectedBalance={sendPreset.balance}
            preselectedDecimals={sendPreset.decimals}
          />
        )}
        {swapOpen && <SwapModal open={swapOpen} onOpenChange={setSwapOpen} />}
        {receiveOpen && <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} walletAddress={walletAddress || ""} />}
      </Suspense>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl border border-border/30 bg-card/50 hover:bg-accent/10 hover:border-primary/30 transition-all group"
    >
      <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[10px] text-muted-foreground group-hover:text-foreground">{label}</span>
    </Button>
  );
}
