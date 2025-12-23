import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearCacheAndReload } from "@/lib/pwaRecovery";
import { logger } from "@/lib/logger";

const CHUNK_ERROR_KEY = "chunk_error_banner_shown_at";

function isChunkMismatchMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("loading chunk") ||
    m.includes("chunkloaderror") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("error loading dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("unable to preload css")
  );
}

function shouldShowBanner(): boolean {
  try {
    const raw = sessionStorage.getItem(CHUNK_ERROR_KEY);
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    // Only show once per 5 minutes per session
    return Date.now() - last > 5 * 60 * 1000;
  } catch {
    return true;
  }
}

function markBannerShown(): void {
  try {
    sessionStorage.setItem(CHUNK_ERROR_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function ChunkErrorBanner() {
  const shownRef = useRef(false);

  useEffect(() => {
    const handleChunkError = (message: string) => {
      if (shownRef.current) return;
      if (!shouldShowBanner()) return;
      if (!isChunkMismatchMessage(message)) return;

      shownRef.current = true;
      markBannerShown();

      logger.error("PWA", "Chunk mismatch detected", { message });

      toast.error(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Erro ao carregar recurso</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Arquivos desatualizados no cache podem causar travamentos.
          </p>
        </div>,
        {
          duration: Infinity,
          action: {
            label: (
              <span className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Limpar cache
              </span>
            ),
            onClick: () => {
              void clearCacheAndReload({ reason: "chunk_banner" });
            },
          },
        }
      );
    };

    const onError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || "";
      handleChunkError(message);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "");
      handleChunkError(message);
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection, true);

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection, true);
    };
  }, []);

  return null;
}
