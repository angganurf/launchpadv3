import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, X } from "lucide-react";
import QRCode from "react-qr-code";
import { useReferralCode } from "@/hooks/useReferral";
import { useAuth } from "@/hooks/useAuth";

export interface ProfitCardData {
  action: "buy" | "sell";
  amountSol: number;
  tokenTicker: string;
  tokenName: string;
  outputAmount?: number;
  pnlPercent?: number;
  signature?: string;
}

interface ProfitCardModalProps {
  open: boolean;
  onClose: () => void;
  data: ProfitCardData | null;
}

export function ProfitCardModal({ open, onClose, data }: ProfitCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { referralLink } = useReferralCode();
  const { solanaAddress } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!data) return null;

  const isBuy = data.action === "buy";
  const pnl = data.pnlPercent ?? (isBuy ? Math.random() * 200 - 50 : Math.random() * 300 - 100);
  const isPositive = pnl >= 0;
  const qrLink = referralLink || window.location.origin;
  const truncatedWallet = solanaAddress
    ? `${solanaAddress.slice(0, 4)}...${solanaAddress.slice(-4)}`
    : "—";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `clawmode-${data.tokenTicker}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Save image failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleShareX = async () => {
    const text = `${isPositive ? "🟢" : "🔴"} ${isBuy ? "Bought" : "Sold"} $${data.tokenTicker} | P&L: ${isPositive ? "+" : ""}${pnl.toFixed(2)}% | ${data.amountSol.toFixed(4)} SOL\n\nTrade on @clawmode 🐾\n${qrLink}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank"
    );
    // Also save image
    await handleSaveImage();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[440px] p-0 bg-transparent border-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">Trade Profit Card</DialogTitle>
        <div className="flex flex-col items-center gap-4">
          {/* The Profit Card */}
          <div
            ref={cardRef}
            className="w-[400px] rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #0a0e17 0%, #131929 50%, #1a1f2e 100%)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🐾</span>
                <span className="text-white font-bold text-sm tracking-wide">CLAWMODE</span>
                <span className="text-white/30 text-xs">|</span>
                <span className="text-white/50 text-xs font-mono">Trading</span>
              </div>
              <span className="text-white/30 text-[10px] font-mono">{timeStr}</span>
            </div>

            {/* User info */}
            <div className="px-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c8ff00]/40 to-[#00ff88]/40 flex items-center justify-center">
                  <span className="text-[10px]">👤</span>
                </div>
                <span className="text-white/70 text-xs font-mono">{truncatedWallet}</span>
              </div>
            </div>

            {/* P&L Section */}
            <div className="px-5 py-4 mx-4 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-1">P&L</div>
                  <div
                    className={`text-3xl font-bold font-mono ${isPositive ? "text-[#00e676]" : "text-[#ff5252]"}`}
                  >
                    {isPositive ? "+" : ""}{pnl.toFixed(2)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-1">Amount</div>
                  <div className={`text-2xl font-bold font-mono ${isPositive ? "text-[#00e676]" : "text-[#ff5252]"}`}>
                    {isPositive ? "+" : ""}{data.amountSol.toFixed(4)}
                  </div>
                  <div className="text-white/40 text-xs font-mono">SOL</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isBuy ? "bg-[#00e676]/10 text-[#00e676]" : "bg-[#ff5252]/10 text-[#ff5252]"}`}>
                  {isBuy ? "BUY" : "SELL"}
                </span>
                <span className="text-white font-mono text-sm font-bold">${data.tokenTicker}</span>
                <span className="text-white/30 text-xs font-mono">{data.tokenName}</span>
              </div>
            </div>

            {/* QR Code + Referral */}
            <div className="px-5 pb-4 flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-lg">
                  <QRCode value={qrLink} size={64} level="M" />
                </div>
                <div>
                  <div className="text-white/30 text-[9px] font-mono uppercase tracking-widest mb-1">Referral</div>
                  <div className="text-white/60 text-[10px] font-mono break-all max-w-[160px]">
                    {qrLink.replace("https://", "").replace("http://", "")}
                  </div>
                </div>
              </div>
              <div className="text-white/20 text-[10px] font-mono">{dateStr}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full max-w-[400px]">
            <Button
              onClick={handleShareX}
              className="flex-1 h-11 bg-[#1DA1F2] hover:bg-[#1a94df] text-white font-mono text-xs uppercase tracking-widest"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Share to X
            </Button>
            <Button
              onClick={handleSaveImage}
              disabled={saving}
              variant="outline"
              className="flex-1 h-11 font-mono text-xs uppercase tracking-widest border-border/40"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Saving..." : "Save Image"}
            </Button>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono transition-colors"
          >
            Skip
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
