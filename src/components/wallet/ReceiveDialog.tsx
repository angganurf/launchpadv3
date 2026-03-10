import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ArrowDownLeft } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "@/hooks/use-toast";

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}

export default function ReceiveDialog({ open, onOpenChange, walletAddress }: ReceiveDialogProps) {
  const copy = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({ title: "Copied", description: "Address copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
            Receive
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 pt-2 pb-4">
          <div className="p-4 bg-white rounded-xl">
            <QRCode value={walletAddress} size={180} />
          </div>

          <p className="text-[11px] text-muted-foreground text-center max-w-[280px]">
            Send SOL or any SPL token to this address
          </p>

          <div className="w-full p-3 rounded-xl bg-muted/30 border border-border/30 font-mono text-[11px] text-foreground text-center break-all">
            {walletAddress}
          </div>

          <Button onClick={copy} variant="outline" className="gap-2 rounded-xl text-xs w-full">
            <Copy className="h-3.5 w-3.5" />
            Copy Address
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
