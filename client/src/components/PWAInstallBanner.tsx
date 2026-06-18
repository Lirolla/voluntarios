import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { useState } from "react";

export function PWAInstallBanner() {
  const { canInstall, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Instalar o app</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Adicione Cathedral à sua tela inicial para acesso rápido, mesmo offline.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
              onClick={install}
            >
              <Download className="w-3 h-3 mr-1.5" />
              Instalar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-slate-400 hover:text-white"
              onClick={() => setDismissed(true)}
            >
              Agora não
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
